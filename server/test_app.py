import importlib
import json
import os
import sys
import tempfile
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

    def test_tool_definitions_include_launchops_crud_tools(self):
        names = [tool["name"] for tool in app.mcp_tool_definitions()]
        self.assertIn("lcc_list_launches", names)
        self.assertIn("lcc_get_launch", names)
        self.assertIn("lcc_create_launch", names)
        self.assertIn("lcc_update_launch", names)
        self.assertIn("lcc_analyze_launch", names)
        self.assertIn("lcc_set_launch_template", names)

class LaunchOpsMcpToolTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.launch_dir = Path(self.tempdir.name)
        self.dir_patch = patch.object(app, "LAUNCHES_DIR", self.launch_dir)
        self.dir_patch.start()
        self.env_patch = patch.dict(os.environ, {
            "LAUNCHOPS_STORAGE_BACKEND": "local",
            "LAUNCHOPS_LLM_ENABLED": "false",
            "LAUNCHOPS_MULTI_MODEL_ENABLED": "false",
        }, clear=False)
        self.env_patch.start()

    def tearDown(self):
        self.env_patch.stop()
        self.dir_patch.stop()
        self.tempdir.cleanup()

    def test_create_get_update_and_analyze_launch_via_tool(self):
        created = app.execute_launchops_tool("lcc_create_launch", {
            "name": "Lucky Wheel Weekend",
            "type": "Game event",
            "brief": "Lucky Wheel. No owner, no rollback plan, no CS FAQ.",
        })
        self.assertTrue(created["ok"])
        launch_id = created["launch"]["id"]

        found = app.execute_launchops_tool("lcc_get_launch", {"name": "Lucky Wheel Weekend v2"})
        self.assertTrue(found["ok"])
        self.assertEqual(found["launch"]["id"], launch_id)

        updated = app.execute_launchops_tool("lcc_update_launch", {
            "name": "Lucky Wheel Weekend v2",
            "owner": "LiveOps Lead",
            "status": "running",
        })
        self.assertTrue(updated["ok"])
        self.assertEqual(updated["launch"]["name"], "Lucky Wheel Weekend")
        self.assertEqual(updated["launch"]["owner"], "LiveOps Lead")
        self.assertEqual(updated["launch"]["status"], "running")

        analyzed = app.execute_launchops_tool("lcc_analyze_launch", {"launchId": launch_id}, force_fast=True)
        self.assertTrue(analyzed["ok"])
        self.assertIn("decision", analyzed["result"])
        red_team = analyzed["result"]["redTeam"]
        self.assertEqual(len(red_team), 5)
        self.assertGreater(len({card["worry"] for card in red_team}), 1)
        self.assertGreater(len({card["fix"] for card in red_team}), 1)
        self.assertEqual(analyzed["summary"]["analysisCount"], 1)

    def test_set_launch_template_updates_launch_template_versions(self):
        created = app.execute_launchops_tool("lcc_create_launch", {
            "name": "Template Test Launch",
            "brief": "No owner, no rollback.",
        })
        result = app.execute_launchops_tool("lcc_set_launch_template", {
            "launchId": created["launch"]["id"],
            "templateName": "Strict Webshop Template",
            "riskGroups": [
                {"label": "Payment readiness", "maxScore": 3},
                "CS readiness",
            ],
            "redTeamPersonas": ["CS lead", "Tech on-call", "Business owner"],
        })
        self.assertTrue(result["ok"])
        self.assertEqual(result["template"]["maxScore"], 5)
        self.assertEqual(result["launch"]["name"], "Template Test Launch")
        self.assertEqual(result["launch"]["template"]["name"], "Strict Webshop Template")
        self.assertEqual(len(result["launch"]["templateVersions"]), 1)

    def test_delete_launch_requires_explicit_confirmation(self):
        created = app.execute_launchops_tool("lcc_create_launch", {"name": "Delete Me"})
        launch_id = created["launch"]["id"]
        blocked = app.execute_launchops_tool("lcc_delete_launch", {"launchId": launch_id})
        self.assertFalse(blocked["ok"])
        self.assertEqual(blocked["error"], "confirmation_required")
        deleted = app.execute_launchops_tool("lcc_delete_launch", {"launchId": launch_id, "confirm": f"DELETE {launch_id}"})
        self.assertTrue(deleted["ok"])
        self.assertIsNone(app.get_launch(launch_id))

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

    def test_redteam_fast_path_cards_are_persona_specific(self):
        brief = "Lucky Wheel. No owner, no rollback plan, no CS FAQ, reward cap missing."
        with patch.dict(os.environ, {"LAUNCHOPS_LLM_ENABLED": "false", "LAUNCHOPS_MULTI_MODEL_ENABLED": "false"}):
            result = app.readiness_agent(brief, {"brief": brief}, force_fast=True)
            result = app.red_team_agent(result, {"brief": brief}, force_fast=True)

        red_team = result["redTeam"]
        self.assertEqual(len(red_team), 5)
        self.assertEqual(len({card["worry"] for card in red_team}), 5)
        self.assertEqual(len({card["fix"] for card in red_team}), 5)
        self.assertGreater(len({card["evidence"] for card in red_team}), 1)
        self.assertFalse(any("Dựa trên riskBreakdown" in card["evidence"] for card in red_team))

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


class AgentLlmObservabilityTests(unittest.TestCase):
    """Phase 4.3: each agent must report source (llm|rule|fallback), model, latencyMs, schemaAccepted, fallbackReason."""

    def _meta(self, **over):
        meta = {"source": "llm", "model": "test-model", "latencyMs": 123, "schemaAccepted": True}
        meta.update(over)
        return meta

    def test_redteam_uses_mocked_llm_output_when_accepted(self):
        cards = [{"persona": f"P{i}", "worry": f"w{i}", "evidence": f"e{i}", "fix": f"f{i}"} for i in range(5)]

        def fake(brief, launch_context=None, agent_step=None):
            return {"redTeam": cards, "trace": [], "_llmMeta": self._meta()}

        with patch.dict(os.environ, {"LAUNCHOPS_MULTI_MODEL_ENABLED": "true"}, clear=False), \
                patch.object(app, "call_llm", side_effect=fake):
            result = app.red_team_agent(app.fallback_result("base"), {"brief": "Lucky Wheel"}, force_fast=False)
        self.assertEqual(len(result["redTeam"]), 5)
        self.assertEqual(result["redTeam"][0]["persona"], "P0")
        last = result["trace"][-1]
        self.assertEqual(last["agent"], "red_team")
        self.assertEqual(last["source"], "llm")
        self.assertTrue(last["schemaAccepted"])
        self.assertEqual(last["model"], "test-model")
        self.assertEqual(last["latencyMs"], 123)
        self.assertNotIn("fallbackReason", last)
        self.assertNotIn("_llmMeta", result)

    def test_postmortem_uses_mocked_llm_output_when_accepted(self):
        blocks = [{"title": f"T{i}", "items": ["a", "b"]} for i in range(3)]

        def fake(brief, launch_context=None, agent_step=None):
            return {"postmortem": blocks, "trace": [], "_llmMeta": self._meta(model="pm-model", latencyMs=77)}

        with patch.dict(os.environ, {"LAUNCHOPS_MULTI_MODEL_ENABLED": "true"}, clear=False), \
                patch.object(app, "call_llm", side_effect=fake):
            result = app.postmortem_agent(app.fallback_result("base"), {"brief": "Lucky Wheel"}, force_fast=False)
        self.assertEqual(len(result["postmortem"]), 3)
        self.assertEqual(result["postmortem"][0]["title"], "T0")
        last = result["trace"][-1]
        self.assertEqual(last["agent"], "postmortem")
        self.assertEqual(last["source"], "llm")
        self.assertTrue(last["schemaAccepted"])
        self.assertEqual(last["model"], "pm-model")

    def test_readiness_llm_explanation_but_deterministic_score(self):
        def fake(brief, launch_context=None, agent_step=None):
            r = app.fallback_result("llm explanation")
            r["decision"]["title"] = "LLM verdict title"
            r["_llmMeta"] = self._meta(model="rd-model", latencyMs=200)
            return r

        with patch.dict(os.environ, {"LAUNCHOPS_LLM_ENABLED": "true"}, clear=False), \
                patch.object(app, "call_llm", side_effect=fake):
            result = app.readiness_agent("Lucky Wheel no owner no rollback no CS FAQ", {"brief": "Lucky Wheel"}, force_fast=False)
        last = result["trace"][-1]
        self.assertEqual(last["agent"], "readiness")
        self.assertEqual(last["source"], "llm")
        self.assertEqual(last["scoreMode"], "deterministic")
        self.assertEqual(result["scoreSource"], "deterministic_rule")
        self.assertNotIn("_llmMeta", result)

    def test_redteam_schema_fail_falls_back_with_clear_trace(self):
        def fake(brief, launch_context=None, agent_step=None):
            # LLM returned valid JSON but only 1 card -> schema fail at agent level.
            return {"redTeam": [{"persona": "x"}], "trace": [], "_llmMeta": self._meta(latencyMs=50)}

        with patch.dict(os.environ, {"LAUNCHOPS_MULTI_MODEL_ENABLED": "true"}, clear=False), \
                patch.object(app, "call_llm", side_effect=fake):
            result = app.red_team_agent(app.fallback_result("base"), {"brief": "Lucky Wheel no owner no rollback"}, force_fast=False)
        self.assertEqual(len(result["redTeam"]), 5)  # deterministic fallback still produces 5 cards
        last = result["trace"][-1]
        self.assertEqual(last["agent"], "red_team")
        self.assertEqual(last["source"], "fallback")
        self.assertIn("llm_schema_redteam_invalid", last["fallbackReason"])
        self.assertFalse(last["schemaAccepted"])

    def test_postmortem_llm_error_falls_back_with_reason(self):
        def fake(brief, launch_context=None, agent_step=None):
            # call_llm itself fell back (e.g. timeout/HTTP error).
            r = app.fallback_result("api error")
            r["_llmMeta"] = {"source": "fallback", "model": "pm-model", "latencyMs": 60050, "schemaAccepted": False, "fallbackReason": "timeout"}
            return r

        with patch.dict(os.environ, {"LAUNCHOPS_MULTI_MODEL_ENABLED": "true"}, clear=False), \
                patch.object(app, "call_llm", side_effect=fake):
            result = app.postmortem_agent(app.fallback_result("base"), {"brief": "Lucky Wheel"}, force_fast=False)
        last = result["trace"][-1]
        self.assertEqual(last["source"], "fallback")
        self.assertEqual(last["fallbackReason"], "timeout")

    def test_mcp_fast_path_never_calls_llm(self):
        with patch.dict(os.environ, {"LAUNCHOPS_LLM_ENABLED": "true", "LAUNCHOPS_MULTI_MODEL_ENABLED": "true"}, clear=False), \
                patch.object(app, "call_llm") as mock_llm:
            brief = "Lucky Wheel no owner no rollback no CS FAQ"
            result = app.readiness_agent(brief, {"brief": brief}, force_fast=True)
            result = app.red_team_agent(result, {"brief": brief}, force_fast=True)
            result = app.checklist_agent(result, {"brief": brief}, force_fast=True)
            result = app.postmortem_agent(result, {"brief": brief}, force_fast=True)
        mock_llm.assert_not_called()
        sources = [t["source"] for t in result["trace"] if t.get("agent") in ("readiness", "red_team", "checklist", "postmortem")]
        self.assertTrue(sources)
        self.assertTrue(all(src == "rule" for src in sources))

    def test_call_llm_missing_config_returns_fallback_meta(self):
        with patch.dict(os.environ, {}, clear=True):
            result = app.call_llm("Lucky Wheel brief", {"brief": "Lucky Wheel brief"}, "redteam")
        meta = result.get("_llmMeta")
        self.assertIsInstance(meta, dict)
        self.assertEqual(meta["source"], "fallback")
        self.assertEqual(meta["fallbackReason"], "missing_config")
        self.assertFalse(meta["schemaAccepted"])


class BuildPromptTests(unittest.TestCase):
    """Phase 4.3 follow-up: per-agent focused prompts so each model produces only its own section."""

    CTX = {"name": "Lucky Wheel", "type": "Game event", "brief": "Lucky Wheel. No owner, no rollback."}
    BRIEF = "Lucky Wheel weekend. No owner, no rollback plan, no CS FAQ."

    def test_redteam_prompt_demands_exactly_5_cards_and_only_redteam(self):
        p = app.build_prompt(self.BRIEF, self.CTX, "redteam")
        self.assertIn("ĐÚNG 5", p)
        self.assertIn('"redTeam"', p)
        # Focused: should not ask for the other big sections' schema keys.
        self.assertNotIn('"checklist"', p)
        self.assertNotIn('"postmortem"', p)

    def test_checklist_prompt_demands_6_to_8_and_only_checklist(self):
        p = app.build_prompt(self.BRIEF, self.CTX, "checklist")
        self.assertIn("6 đến 8", p)
        self.assertIn('"checklist"', p)
        self.assertNotIn('"redTeam"', p)
        self.assertNotIn('"postmortem"', p)

    def test_postmortem_prompt_demands_at_least_3_and_only_postmortem(self):
        p = app.build_prompt(self.BRIEF, self.CTX, "postmortem")
        self.assertIn("ÍT NHẤT 3", p)
        self.assertIn('"postmortem"', p)
        self.assertNotIn('"redTeam"', p)
        self.assertNotIn('"checklist"', p)

    def test_readiness_prompt_has_decision_not_other_sections(self):
        p = app.build_prompt(self.BRIEF, self.CTX, "readiness")
        self.assertIn('"decision"', p)
        self.assertIn('"topRisks"', p)
        self.assertNotIn('"redTeam"', p)
        self.assertNotIn('"checklist"', p)

    def test_default_prompt_keeps_full_schema(self):
        p = app.build_prompt(self.BRIEF, self.CTX)
        for key in ('"decision"', '"redTeam"', '"checklist"', '"postmortem"'):
            self.assertIn(key, p)

    def test_language_rule_follows_brief(self):
        vi = app.build_prompt("Sự kiện quay thưởng chưa có người phụ trách rõ ràng.", self.CTX, "redteam")
        self.assertIn("tiếng Việt", vi)
        en = app.build_prompt("Lucky Wheel weekend. No owner, no rollback, payment untested.", self.CTX, "redteam")
        self.assertIn("English", en)


class RagTests(unittest.TestCase):
    """WS1: RAG knowledge recall + prompt grounding."""

    def test_rag_disabled_by_default(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(app.rag_enabled())
            recs, trace = app.recall_knowledge("Lucky Wheel", "game_event_h5")
            self.assertEqual(recs, [])
            self.assertEqual(trace["source"], "disabled")

    def test_rag_enabled_missing_id(self):
        with patch.dict(os.environ, {"LAUNCHOPS_RAG_ENABLED": "true", "LAUNCHOPS_KNOWLEDGE_MEMORY_ID": ""}, clear=True):
            recs, trace = app.recall_knowledge("Lucky Wheel", "game_event_h5")
            self.assertEqual(recs, [])
            self.assertEqual(trace["source"], "missing_knowledge_id")

    def test_knowledge_namespace_format(self):
        self.assertEqual(app.knowledge_namespace("Game Event H5"), "/launchops/knowledge/game-event-h5")
        self.assertEqual(app.knowledge_namespace(""), "/launchops/knowledge/generic")

    def test_build_prompt_injects_knowledge(self):
        ctx = {"name": "Lucky Wheel", "type": "Game event", "knowledge": [
            {"title": "Reward cap", "lesson": "Luôn chốt reward cap trước khi mở event."},
        ]}
        p = app.build_prompt("Lucky Wheel no owner", ctx, "redteam")
        self.assertIn("Playbook", p)
        self.assertIn("reward cap", p.lower())

    def test_build_prompt_without_knowledge_has_no_playbook(self):
        p = app.build_prompt("Lucky Wheel no owner", {"name": "x", "type": "y"}, "redteam")
        self.assertNotIn("Playbook", p)

    def test_seed_knowledge_curated_nonempty(self):
        import importlib
        seed = importlib.import_module("seed_knowledge")
        self.assertIn("game_event_h5", seed.CURATED)
        self.assertTrue(all(len(v) >= 3 for v in seed.CURATED.values()))


class RoleAwareMemoryTests(unittest.TestCase):
    """WS2: per-agent (role-tagged) + per-product memory."""

    def test_parse_record_role(self):
        self.assertEqual(app.parse_record_role("[role=redteam] farm vong quay"), ("redteam", "farm vong quay"))
        self.assertEqual(app.parse_record_role("no tag here"), ("", "no tag here"))

    def test_agent_step_role_mapping(self):
        self.assertEqual(app.agent_step_role("redteam"), "redteam")
        self.assertEqual(app.agent_step_role("readiness"), "readiness")
        self.assertEqual(app.agent_step_role(None), "")
        self.assertEqual(app.agent_step_role("default"), "")

    def test_knowledge_product_namespace(self):
        self.assertEqual(app.knowledge_product_namespace("Demo Game", "Game Event H5"), "/launchops/products/demo-game/game-event-h5")

    def test_build_prompt_filters_knowledge_by_role(self):
        knowledge = [
            {"title": "RT", "lesson": "[role=redteam] farm vòng quay bằng tài khoản phụ"},
            {"title": "RD", "lesson": "[role=readiness] cần reward cap trước khi mở"},
            {"title": "ALL", "lesson": "[role=all] luôn cần owner và rollback"},
        ]
        rt = app.build_prompt("brief", {"name": "x", "type": "y", "knowledge": knowledge}, "redteam")
        self.assertIn("farm vòng quay", rt)
        self.assertIn("owner và rollback", rt)  # [role=all] visible to everyone
        self.assertNotIn("reward cap trước khi mở", rt)  # readiness-only, hidden from redteam
        rd = app.build_prompt("brief", {"name": "x", "type": "y", "knowledge": knowledge}, "readiness")
        self.assertIn("reward cap trước khi mở", rd)
        self.assertNotIn("farm vòng quay", rd)

    def test_recall_knowledge_includes_product_namespace(self):
        captured = []

        def fake_search(memory_id, brief, namespace, limit):
            captured.append(namespace)
            return []

        with patch.dict(os.environ, {"LAUNCHOPS_RAG_ENABLED": "true", "LAUNCHOPS_KNOWLEDGE_MEMORY_ID": "mem_k"}, clear=True):
            with patch.object(app, "_search_knowledge_namespace", side_effect=fake_search):
                app.recall_knowledge("Lucky Wheel", "game_event_h5", "demo_game")
        self.assertIn("/launchops/products/demo-game/game-event-h5", captured)
        self.assertIn("/launchops/knowledge/game-event-h5", captured)


class GuardrailTests(unittest.TestCase):
    """WS3: enforce guardrail — reject hard secrets, mask soft PII."""

    def test_private_key_is_rejected(self):
        with patch.dict(os.environ, {"LAUNCHOPS_GUARDRAIL_ENABLED": "true"}):
            c = app.guardrail_check("Launch plan\n-----BEGIN RSA PRIVATE KEY-----\nabc\n-----END RSA PRIVATE KEY-----")
        self.assertEqual(c["action"], "reject")
        self.assertIn("private_key", c["hard"])

    def test_payment_secret_is_rejected(self):
        with patch.dict(os.environ, {"LAUNCHOPS_GUARDRAIL_ENABLED": "true"}):
            c = app.guardrail_check("Lucky Wheel. User CVV 123 and card number leaked.")
        self.assertEqual(c["action"], "reject")
        self.assertIn("payment_sensitive", c["hard"])

    def test_email_is_masked_not_rejected(self):
        with patch.dict(os.environ, {"LAUNCHOPS_GUARDRAIL_ENABLED": "true"}):
            c = app.guardrail_check("Lucky Wheel, owner alice@vng.com.vn, no rollback.")
        self.assertEqual(c["action"], "mask")
        self.assertNotIn("alice@vng.com.vn", c["brief"])
        self.assertIn("[REDACTED_EMAIL]", c["brief"])

    def test_clean_brief_passes(self):
        with patch.dict(os.environ, {"LAUNCHOPS_GUARDRAIL_ENABLED": "true"}):
            c = app.guardrail_check("Lucky Wheel weekend. No owner, no rollback plan, no CS FAQ.")
        self.assertEqual(c["action"], "pass")
        self.assertEqual(c["findings"], [])

    def test_disabled_guardrail_passes_even_with_secret(self):
        with patch.dict(os.environ, {"LAUNCHOPS_GUARDRAIL_ENABLED": "false"}):
            c = app.guardrail_check("password=hunter2 card number 4111111111111111")
        self.assertEqual(c["action"], "pass")
        self.assertFalse(c["enabled"])


class RateLimitTests(unittest.TestCase):
    """WS4: app-level sliding-window rate limit."""

    def setUp(self):
        app._RATE_LIMIT_HITS.clear()

    def tearDown(self):
        app._RATE_LIMIT_HITS.clear()

    def test_disabled_by_default(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(app.ratelimit_enabled())

    def test_within_limit_allowed_then_429(self):
        with patch.dict(os.environ, {"LAUNCHOPS_RATELIMIT_ANALYZE_PER_MIN": "2", "LAUNCHOPS_RATELIMIT_ANALYZE_PER_DAY": "100"}):
            self.assertTrue(app.rate_limit_check("k1")["allowed"])
            self.assertTrue(app.rate_limit_check("k1")["allowed"])
            blocked = app.rate_limit_check("k1")
        self.assertFalse(blocked["allowed"])
        self.assertEqual(blocked["scope"], "minute")
        self.assertGreaterEqual(blocked["retryAfter"], 1)

    def test_separate_keys_independent(self):
        with patch.dict(os.environ, {"LAUNCHOPS_RATELIMIT_ANALYZE_PER_MIN": "1"}):
            self.assertTrue(app.rate_limit_check("a")["allowed"])
            self.assertTrue(app.rate_limit_check("b")["allowed"])
            self.assertFalse(app.rate_limit_check("a")["allowed"])


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
