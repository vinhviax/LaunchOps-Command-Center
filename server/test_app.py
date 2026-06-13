import importlib
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

SERVER_DIR = Path(__file__).resolve().parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

app = importlib.import_module("app")
db = importlib.import_module("db")


class DetectBriefLanguageTests(unittest.TestCase):
    def test_vietnamese_brief(self):
        self.assertEqual(
            app.detect_brief_language("Sự kiện quay thưởng cuối tuần, chưa có người phụ trách."),
            "vi",
        )

    def test_english_brief(self):
        self.assertEqual(
            app.detect_brief_language("Lucky Wheel Weekend event. No owner, no rollback plan, payment untested."),
            "en",
        )

    def test_empty_defaults_vi(self):
        self.assertEqual(app.detect_brief_language(""), "vi")

    def test_ascii_vietnamese_without_diacritics_falls_back_en(self):
        # Known limitation: Vietnamese typed without diacritics is treated as English.
        self.assertEqual(app.detect_brief_language("Su kien quay thuong cuoi tuan"), "en")


class ExtractJsonTests(unittest.TestCase):
    def test_clean_json(self):
        self.assertEqual(app.extract_json('{"ok": true, "score": 9}'), {"ok": True, "score": 9})

    def test_json_fence(self):
        text = '```json\n{"decision": {"color": "Green"}}\n```'
        self.assertEqual(app.extract_json(text), {"decision": {"color": "Green"}})

    def test_think_block_with_brace(self):
        text = '<think>try {bad json first}</think>\n{"ok": true}'
        self.assertEqual(app.extract_json(text), {"ok": True})

    def test_control_char_inside_string(self):
        text = '{"message": "line one\nline two"}'
        self.assertEqual(app.extract_json(text), {"message": "line one\nline two"})

    def test_leading_and_trailing_text(self):
        text = 'prefix text with {not json}\n{"ok": true, "items": [1, 2]} trailing text'
        self.assertEqual(app.extract_json(text), {"ok": True, "items": [1, 2]})

    def test_deeply_nested_json(self):
        payload = {"a": {"b": {"c": {"d": {"e": [1, {"f": "g"}]}}}}}
        self.assertEqual(app.extract_json(json.dumps(payload)), payload)


class ChatCompletionsUrlTests(unittest.TestCase):
    def test_base_without_v1(self):
        self.assertEqual(
            app.chat_completions_url("https://maas.example.com"),
            "https://maas.example.com/v1/chat/completions",
        )

    def test_base_with_v1(self):
        self.assertEqual(
            app.chat_completions_url("https://maas.example.com/v1"),
            "https://maas.example.com/v1/chat/completions",
        )

    def test_already_chat_completions(self):
        self.assertEqual(
            app.chat_completions_url("https://maas.example.com/v1/chat/completions/"),
            "https://maas.example.com/v1/chat/completions",
        )


class DecodeRequestBodyTests(unittest.TestCase):
    def test_utf8(self):
        self.assertEqual(app.decode_request_body("Launch brief".encode("utf-8")), "Launch brief")

    def test_utf8_sig_behavior(self):
        # utf-8 succeeds first in decode_request_body loop, keeping BOM character \ufeff
        raw = "Brief có dấu".encode("utf-8-sig")
        self.assertEqual(app.decode_request_body(raw), "\ufeffBrief có dấu")

    def test_utf16_le_behavior(self):
        # utf-8 succeeds first in loop (no exception, but decoding is wrong since it contains nulls)
        raw = "Brief UTF16".encode("utf-16-le")
        expected = "Brief UTF16".encode("utf-16-le").decode("utf-8")
        self.assertEqual(app.decode_request_body(raw), expected)


class NormalizeAndSlugTests(unittest.TestCase):
    def test_normalize_status_known_values(self):
        self.assertEqual(app.normalize_status("running"), "running")
        self.assertEqual(app.normalize_status(" completed "), "completed")

    def test_normalize_status_fallback(self):
        self.assertEqual(app.normalize_status("blocked"), "upcoming")
        self.assertEqual(app.normalize_status(None), "upcoming")

    def test_slugify_ascii_and_vietnamese(self):
        self.assertEqual(app.slugify("Launch H5 - Đợt 1!"), "launch-h5-ot-1")

    def test_slugify_length_limit(self):
        self.assertEqual(len(app.slugify("a" * 100)), 72)


class ToolAliasTests(unittest.TestCase):
    def test_normalize_tool_name_accepts_main_tool_and_alias(self):
        self.assertEqual(app.normalize_tool_name("analyze_launch_brief"), "analyze_launch_brief")
        self.assertEqual(app.normalize_tool_name("lcc"), "analyze_launch_brief")

    def test_normalize_tool_name_keeps_unknown(self):
        self.assertEqual(app.normalize_tool_name("unknown_tool"), "unknown_tool")

    def test_tool_definitions_include_backward_compatible_tool_and_alias(self):
        names = [tool["name"] for tool in app.mcp_tool_definitions()]
        self.assertIn("analyze_launch_brief", names)
        self.assertIn("lcc", names)

class AgentRoleInvocationTests(unittest.TestCase):
    def test_normalize_agent_role_accepts_runtime_names(self):
        self.assertEqual(app.normalize_agent_role("lcc-orchestrator"), "orchestrator")
        self.assertEqual(app.normalize_agent_role("lcc-readiness-agent"), "readiness")
        self.assertEqual(app.normalize_agent_role("red-team-agent"), "redteam")
        self.assertEqual(app.normalize_agent_role("post_mortem_agent"), "postmortem")

    def test_readiness_invocation_returns_common_contract(self):
        with patch.dict(os.environ, {"LAUNCHOPS_LLM_ENABLED": "false", "LAUNCHOPS_MULTI_MODEL_ENABLED": "false"}):
            response = app.invoke_agent_role(
                "lcc-readiness-agent",
                {"requestId": "req-1", "brief": "Lucky Wheel. No owner, no rollback plan, no CS FAQ.", "forceFast": True},
            )
        self.assertTrue(response["ok"])
        self.assertEqual(response["agent"], "lcc-readiness-agent")
        self.assertEqual(response["role"], "readiness")
        self.assertEqual(response["requestId"], "req-1")
        self.assertIn("decision", response["result"])
        self.assertEqual(response["trace"][-1]["runtimeRole"], "readiness")

    def test_redteam_invocation_uses_previous_results(self):
        previous = app.fallback_result("test previous")
        with patch.dict(os.environ, {"LAUNCHOPS_LLM_ENABLED": "false", "LAUNCHOPS_MULTI_MODEL_ENABLED": "false"}):
            response = app.invoke_agent_role(
                "redteam",
                {"requestId": "req-2", "brief": "Lucky Wheel brief", "previousResults": previous, "forceFast": True},
            )
        self.assertTrue(response["ok"])
        self.assertEqual(response["role"], "redteam")
        self.assertEqual(len(response["result"]["redTeam"]), 5)
        self.assertEqual(response["trace"][-1]["runtimeName"], "lcc-redteam-agent")

    def test_unknown_agent_role_returns_contract_error(self):
        response = app.invoke_agent_role("unknown", {"requestId": "req-3", "brief": "Brief"})
        self.assertFalse(response["ok"])
        self.assertEqual(response["role"], "unknown")
        self.assertIn("Unknown agent role", response["error"])

    def test_invocation_token_auth_optional_and_bearer(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertTrue(app.is_invocation_authorized({}))
        with patch.dict(os.environ, {"LAUNCHOPS_AGENT_INVOCATION_TOKEN": "token-1"}, clear=True):
            self.assertFalse(app.is_invocation_authorized({}))
            self.assertTrue(app.is_invocation_authorized({"Authorization": "Bearer token-1"}))
            self.assertTrue(app.is_invocation_authorized({"X-LaunchOps-Agent-Token": "token-1"}))

    def test_remote_agents_missing_urls_fallback_locally(self):
        with patch.dict(os.environ, {
            "LAUNCHOPS_USE_REMOTE_AGENTS": "true",
            "LAUNCHOPS_LLM_ENABLED": "false",
            "LAUNCHOPS_MULTI_MODEL_ENABLED": "false",
        }, clear=True):
            result = app.orchestrate_launchops_analysis("Lucky Wheel. No owner, no rollback plan, no CS FAQ.")
        reasons = [item.get("reason") for item in result.get("trace", []) if item.get("source") == "local_orchestrator"]
        self.assertIn("missing_remote_url", reasons)
        self.assertEqual(result["orchestration"]["mode"], "remote_agents")
        self.assertIn("decision", result)

    def test_remote_readiness_success_keeps_role_trace(self):
        remote_result = app.fallback_result("remote readiness")
        remote_result["decision"]["score"] = 3
        remote_result["decision"]["color"] = "Red"
        with patch.dict(os.environ, {
            "LAUNCHOPS_USE_REMOTE_AGENTS": "true",
            "LAUNCHOPS_READINESS_URL": "https://readiness.example",
            "LAUNCHOPS_LLM_ENABLED": "false",
            "LAUNCHOPS_MULTI_MODEL_ENABLED": "false",
        }, clear=True):
            with patch.object(app, "remote_agent_request", return_value={
                "ok": True,
                "agent": "lcc-readiness-agent",
                "role": "readiness",
                "requestId": "remote-req",
                "result": remote_result,
            }):
                result = app.orchestrate_launchops_analysis("Lucky Wheel. No owner, no rollback plan, no CS FAQ.")
        remote_traces = [item for item in result.get("trace", []) if item.get("source") == "remote_runtime"]
        self.assertEqual(remote_traces[0]["runtimeName"], "lcc-readiness-agent")
        self.assertEqual(result["orchestration"]["mode"], "remote_agents")

class ChatbotParserTests(unittest.TestCase):
    def test_lcc_namespaced_status(self):
        self.assertEqual(app.parse_chatbot_command("lcc status"), ("status", "", False))

    def test_lcc_namespaced_analyze(self):
        self.assertEqual(
            app.parse_chatbot_command("lcc analyze Lucky Wheel lacks rollback"),
            ("analyze", "Lucky Wheel lacks rollback", False),
        )

    def test_legacy_command_still_works_and_is_marked(self):
        self.assertEqual(app.parse_chatbot_command("status"), ("status", "", True))

    def test_natural_vietnamese_intent_routes_to_analyze(self):
        message = "kiem tra brief nay: Lucky Wheel chưa có rollback"
        self.assertEqual(app.parse_chatbot_command(message), ("analyze", message, False))

    def test_natural_report_intent_routes_to_report(self):
        message = "viet report cho launch Lucky Wheel"
        self.assertEqual(app.parse_chatbot_command(message), ("report", message, False))

    def test_plain_brief_defaults_to_analyze(self):
        message = "Lucky Wheel Weekend. No owner, no rollback plan, payment untested."
        self.assertEqual(app.parse_chatbot_command(message), ("analyze", message, False))

class AgentBaseMemoryTests(unittest.TestCase):
    def test_mask_sensitive_text_redacts_common_secrets(self):
        text = "email a@vng.com.vn token=abc123 phone 0901234567"
        masked = app.mask_sensitive_text(text)
        self.assertNotIn("a@vng.com.vn", masked)
        self.assertNotIn("abc123", masked)
        self.assertNotIn("0901234567", masked)

    def test_memory_namespace_actor_default(self):
        with patch.dict(os.environ, {"LAUNCHOPS_MEMORY_NAMESPACE_MODE": "actor"}):
            self.assertEqual(
                app.memory_namespace("strategy-1", "user 1", "session 1", "game_event_h5", "demo_game"),
                "/strategies/strategy-1/actors/user-1",
            )

    def test_memory_namespace_product(self):
        with patch.dict(os.environ, {"LAUNCHOPS_MEMORY_NAMESPACE_MODE": "product"}):
            self.assertEqual(
                app.memory_namespace("strategy-1", "user", "session", "game_event_h5", "Demo Game"),
                "/launchops/products/demo-game/game-event-h5",
            )

    def test_extract_memory_records_from_list_data(self):
        payload = {
            "listData": [
                {"id": "rec-1", "memory": "Always write reset time in FAQ.", "metadata": {"title": "FAQ", "severity": "High"}},
                {"id": "rec-2", "content": "Keep rollback plan ready."},
            ]
        }
        records = app.extract_memory_records(payload)
        self.assertEqual(len(records), 2)
        self.assertEqual(records[0]["source"], "agentbase_memory")
        self.assertEqual(records[0]["severity"], "High")

    def test_memory_context_missing_headers_skips_by_default(self):
        context = app.memory_context_from_headers({}, {"id": "launch-1"})
        self.assertEqual(context["source"], "missing_headers")
        self.assertEqual(context["actorId"], "")


class StorageBackendTests(unittest.TestCase):
    def test_storage_backend_defaults_local(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(db.storage_backend(), "local")
            self.assertFalse(db.cloud_storage_requested())

    def test_storage_backend_cloud_requires_db_url(self):
        with patch.dict(os.environ, {"LAUNCHOPS_STORAGE_BACKEND": "cloud", "LAUNCHOPS_DB_URL": ""}, clear=True):
            self.assertEqual(db.storage_backend(), "cloud")
            self.assertTrue(db.cloud_storage_requested())
            self.assertFalse(db.cloud_storage_configured())

    def test_api_storage_status_hides_db_url(self):
        with patch.dict(os.environ, {"LAUNCHOPS_STORAGE_BACKEND": "cloud", "LAUNCHOPS_DB_URL": "postgresql://USER:PASSWORD@example/db"}, clear=True):
            status = db.storage_backend_status()
            self.assertEqual(status, {"backend": "cloud", "dbUrlConfigured": True})

if __name__ == "__main__":
    unittest.main()
