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

    def test_ascii_vietnamese_without_diacritics_defaults_vi(self):
        self.assertEqual(app.detect_brief_language("Su kien quay thuong cuoi tuan chua co nguoi phu trach"), "vi")

    def test_unknown_ascii_defaults_vi(self):
        self.assertEqual(app.detect_brief_language("abc xyz qwerty"), "vi")


class LegacyEncodingRepairTests(unittest.TestCase):
    def test_repair_mojibake_text(self):
        clean = "Sự kiện đạt mục tiêu giữ chân nhẹ."
        damaged = clean.encode("utf-8").decode("latin-1")
        self.assertEqual(app.repair_legacy_text(damaged), clean)

    def test_golden_spin_sample_resets_lossy_text(self):
        damaged_brief = "M" + "?c ti" + "?u, " + "??i t??ng ho?c ph?m vi c?n m? h?."
        launch = {"id": "golden-spin-retro-lessons", "brief": damaged_brief, "analyses": []}
        clean = app.sanitize_launch_for_response(launch)
        self.assertEqual(clean["id"], "golden-spin-retro-lessons")
        self.assertIn("Golden Spin Retro", clean["brief"])
        self.assertNotIn("??", clean["brief"])

    def test_default_demo_samples_include_all_game_template_triplets(self):
        samples = app.default_sample_launches()
        ids = {item["id"] for item in samples}
        self.assertEqual(ids, {
            "golden-spin-retro-lessons",
            "golden-spin-live-risk",
            "golden-spin-weekend-ready",
            "storm-shop-retro",
            "dragon-login-live",
            "guild-boss-live",
            "phoenix-shop-upcoming-red",
            "login-comeback-upcoming-yellow",
            "skin-vault-upcoming-green",
        })
        self.assertTrue({"lucky_spin_event", "game_event_h5"}.issuperset({item["type"] for item in samples}))
        self.assertFalse(any(item["id"].startswith("golden-spin-demo-") for item in samples))
        names = " ".join(item["name"] for item in samples)
        self.assertNotIn("Lucky Wheel", names)
        self.assertNotIn("Midweek", names)
        self.assertIn("Shop", names)
        self.assertIn("Login", names)

    def test_default_demo_samples_keep_three_statuses_for_new_game_triplets(self):
        samples = {item["id"]: item for item in app.default_sample_launches()}
        self.assertEqual(samples["golden-spin-retro-lessons"]["status"], "completed")
        self.assertEqual(samples["golden-spin-live-risk"]["status"], "running")
        self.assertEqual(samples["golden-spin-weekend-ready"]["status"], "upcoming")
        self.assertEqual(samples["phoenix-shop-upcoming-red"]["status"], "upcoming")
        self.assertEqual(samples["login-comeback-upcoming-yellow"]["status"], "upcoming")
        self.assertEqual(samples["dragon-login-live"]["status"], "running")


    def test_default_demo_samples_have_expected_scores_and_lessons(self):
        samples = {item["id"]: item for item in app.default_sample_launches()}
        golden_done = samples["golden-spin-retro-lessons"]
        golden_live = samples["golden-spin-live-risk"]
        golden_next = samples["golden-spin-weekend-ready"]
        red_next = samples["phoenix-shop-upcoming-red"]
        yellow_next = samples["login-comeback-upcoming-yellow"]
        self.assertGreater(len(golden_done.get("lessonsLearned") or []), 0)
        self.assertEqual(golden_live["analyses"][-1]["result"]["decision"]["color"], "Yellow")
        self.assertEqual(golden_next["analyses"][-1]["result"]["decision"]["color"], "Green")
        self.assertEqual(red_next["analyses"][-1]["result"]["decision"]["color"], "Red")
        self.assertEqual(yellow_next["analyses"][-1]["result"]["decision"]["color"], "Yellow")

    def test_auto_status_from_schedule(self):
        now = app.datetime(2026, 6, 21, 12, 0)
        upcoming, changed = app.apply_launch_time_status({"status": "running", "targetDate": "2026-06-22 09:00", "endDate": "2026-06-23 09:00"}, now)
        self.assertTrue(changed)
        self.assertEqual(upcoming["status"], "upcoming")
        running, changed = app.apply_launch_time_status({"status": "upcoming", "targetDate": "2026-06-21 09:00", "endDate": "2026-06-22 09:00"}, now)
        self.assertTrue(changed)
        self.assertEqual(running["status"], "running")
        completed, changed = app.apply_launch_time_status({"status": "running", "targetDate": "2026-06-19 09:00", "endDate": "2026-06-21 11:59"}, now)
        self.assertTrue(changed)
        self.assertEqual(completed["status"], "completed")

    def test_default_demo_samples_have_required_launch_times(self):
        for launch in app.default_sample_launches():
            with self.subTest(launch=launch["id"], field="targetDate"):
                self.assertTrue(app.has_required_launch_datetime(launch.get("targetDate")))
            with self.subTest(launch=launch["id"], field="endDate"):
                self.assertTrue(app.has_required_launch_datetime(launch.get("endDate")))

    def test_green_demo_sample_has_no_open_risks(self):
        result = app.lucky_spin_sample_result("Green", 12)
        self.assertEqual(result["decision"]["score"], 12)
        self.assertEqual(result["decision"]["maxScore"], 12)
        self.assertEqual(result["topRisks"], [])
        self.assertEqual(result["redTeam"], [])

    def test_lucky_spin_launch_type_inference(self):
        self.assertEqual(
            app.infer_launch_type("Golden Spin có lượt quay, reward cap và CS FAQ."),
            "lucky_spin_event",
        )


class CloudSampleSeedTests(unittest.TestCase):
    def test_cloud_list_syncs_missing_default_samples_when_not_empty(self):
        samples = app.default_sample_launches()
        existing = [samples[0]]
        saved_ids = []

        def fake_save(launch):
            saved_ids.append(launch["id"])
            return launch

        with patch.object(app, "cloud_storage_requested", return_value=True), \
             patch.object(app, "cloud_list_launches", side_effect=[existing, samples]), \
             patch.object(app, "cloud_save_launch", side_effect=fake_save):
            launches = app.list_launches()

        expected_missing = {sample["id"] for sample in samples[1:]}
        self.assertEqual(set(saved_ids), expected_missing)
        self.assertEqual({launch["id"] for launch in launches}, {sample["id"] for sample in samples})


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


class PerAgentApiKeyTests(unittest.TestCase):
    def test_per_agent_key_overrides_shared(self):
        env = {
            "LAUNCHOPS_LLM_API_KEY": "shared-key",
            "LAUNCHOPS_REDTEAM_API_KEY": "redteam-key",
        }
        with patch.dict(os.environ, env, clear=True):
            self.assertEqual(app.llm_config_for_step("redteam")["apiKey"], "redteam-key")
            # Agent without a dedicated key falls back to the shared key.
            self.assertEqual(app.llm_config_for_step("checklist")["apiKey"], "shared-key")

    def test_falls_back_to_shared_when_no_per_agent_key(self):
        env = {"LAUNCHOPS_LLM_API_KEY": "shared-key"}
        with patch.dict(os.environ, env, clear=True):
            self.assertEqual(app.llm_config_for_step("readiness")["apiKey"], "shared-key")

    def test_llm_models_are_limited_to_gemma_and_minimax(self):
        env = {
            "LAUNCHOPS_MODEL_READINESS": "not-allowed-readiness",
            "LAUNCHOPS_MODEL_REDTEAM": "minimax-m2.5",
            "LAUNCHOPS_MODEL_CHECKLIST": "not-allowed-checklist",
            "LAUNCHOPS_MODEL_ASSISTANT": "not-allowed-assistant",
        }
        with patch.dict(os.environ, env, clear=True):
            self.assertEqual(app.llm_config_for_step("readiness")["model"], "google/gemma-4-31b-it")
            self.assertEqual(app.llm_config_for_step("redteam")["model"], "minimax/minimax-m2.5")
            self.assertEqual(app.llm_config_for_step("checklist")["model"], "google/gemma-4-31b-it")
            self.assertEqual(app.llm_config_for_step("assistant")["model"], "google/gemma-4-31b-it")


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

    def test_schedule_rejects_end_before_start(self):
        result = app.validate_launch_schedule_rules({
            "status": "upcoming",
            "targetDate": "20/06/2026 08:30",
            "endDate": "19/06/2026 23:59",
        }, now=app.datetime(2026, 6, 17, 12, 0))
        self.assertEqual(result["error"], "end_before_start")

    def test_schedule_auto_status_allows_end_in_past(self):
        launch = {
            "status": "running",
            "targetDate": "15/06/2026 08:30",
            "endDate": "16/06/2026 23:59",
        }
        now = app.datetime(2026, 6, 17, 12, 0)
        self.assertIsNone(app.validate_launch_schedule_rules(launch, now=now))
        self.assertEqual(app.launch_status_from_schedule(launch, now), "completed")

    def test_schedule_auto_status_allows_start_in_past(self):
        launch = {
            "status": "upcoming",
            "targetDate": "16/06/2026 08:30",
            "endDate": "18/06/2026 23:59",
        }
        now = app.datetime(2026, 6, 17, 12, 0)
        self.assertIsNone(app.validate_launch_schedule_rules(launch, now=now))
        self.assertEqual(app.launch_status_from_schedule(launch, now), "running")

    def test_schedule_auto_status_allows_start_in_future(self):
        for status in ("running", "completed"):
            with self.subTest(status=status):
                launch = {
                    "status": status,
                    "targetDate": "20/06/2026 08:30",
                    "endDate": "22/06/2026 23:59",
                }
                now = app.datetime(2026, 6, 17, 12, 0)
                self.assertIsNone(app.validate_launch_schedule_rules(launch, now=now))
                self.assertEqual(app.launch_status_from_schedule(launch, now), "upcoming")

    def test_schedule_allows_completed_past_launch(self):
        result = app.validate_launch_schedule_rules({
            "status": "completed",
            "targetDate": "15/06/2026 08:30",
            "endDate": "16/06/2026 23:59",
        }, now=app.datetime(2026, 6, 17, 12, 0))
        self.assertIsNone(result)


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
        self.assertIn("lcc_select_product", names)
        self.assertIn("lcc_catalog", names)

class LccDocsToolTests(unittest.TestCase):
    def test_docs_tool_in_definitions_and_registry(self):
        names = [tool["name"] for tool in app.mcp_tool_definitions()]
        self.assertIn("lcc_docs", names)
        self.assertIn("lcc_docs", app.LAUNCHOPS_MCP_TOOLS)

    def test_docs_tool_returns_markdown_guide(self):
        out = app.execute_launchops_tool("lcc_docs", {})
        self.assertTrue(out["ok"])
        self.assertEqual(out["format"], "markdown")
        doc = out["doc"]
        self.assertIn("LaunchOps Command Center", doc)
        self.assertIn("lcc_list_launches", doc)
        self.assertIn("lcc docs", doc)
        self.assertIn("lcc_select_product", doc)
        self.assertIn("lcc_catalog", doc)
        self.assertIn("Human Admin", doc)
        self.assertIn("Markdown", doc)

    def test_docs_topic_filter(self):
        out = app.execute_launchops_tool("lcc_docs", {"topic": "tools"})
        self.assertIn("Khi nào dùng tool nào", out["doc"])

    def test_chatbot_docs_command_routes(self):
        command, argument, legacy = app.parse_chatbot_command("lcc docs tools")
        self.assertEqual(command, "docs")
        self.assertEqual(argument, "tools")
        self.assertFalse(legacy)

    def test_chatbot_docs_reply_contains_tool_guide(self):
        result = app.handle_chatbot_payload("generic", {"chatId": "test", "text": "lcc docs tools"})
        self.assertTrue(result["ok"])
        self.assertIn("Khi nào dùng tool nào", result["reply"])
        self.assertIn("lcc_create_launch", result["reply"])

    def test_docs_tool_leaks_no_secret_values(self):
        doc = app.execute_launchops_tool("lcc_docs", {})["doc"].lower()
        # No real config/secret values, env var names, base URLs, or key patterns.
        for marker in ("launchops_", "maas-llm", "vngcloud", "sk-", "bearer ", "gw-58", ".env", "api_key="):
            self.assertNotIn(marker, doc)


class LccProductToolTests(unittest.TestCase):
    def test_select_demo_product_is_allowed(self):
        out = app.execute_launchops_tool("lcc_select_product", {"product": "Demo", "language": "en"})
        self.assertTrue(out["ok"])
        self.assertEqual(out["selected"], "demo")
        self.assertIn("available", out["message"].lower())

    def test_product_xyz_is_locked(self):
        out = app.execute_launchops_tool("lcc_select_product", {"product": "Sản Phẩm XYZ", "language": "vi"})
        self.assertFalse(out["ok"])
        self.assertTrue(out["locked"])
        self.assertIn("liên hệ Admin", out["message"])

    def test_unknown_product_returns_catalog_instead_of_selecting_demo(self):
        out = app.execute_launchops_tool("lcc_select_product", {"product": "Unknown Product", "language": "en"})
        self.assertFalse(out["ok"])
        self.assertEqual(out["field"], "product")
        self.assertIn("products", out["catalog"])
        self.assertEqual(out["catalog"]["products"][0]["id"], "demo")

    def test_chatbot_product_command_routes(self):
        command, argument, legacy = app.parse_chatbot_command("lcc product Product XYZ")
        self.assertEqual(command, "product")
        self.assertEqual(argument, "Product XYZ")
        self.assertFalse(legacy)

    def test_assistant_product_fallback_english(self):
        reply = app.assistant_fallback_reply("select Product XYZ", language="en")
        self.assertIn("Product XYZ is locked", reply)
        self.assertIn("Admin", reply)


class LccCatalogToolTests(unittest.TestCase):
    def test_catalog_tool_returns_immutable_admin_only_values(self):
        out = app.execute_launchops_tool("lcc_catalog", {"language": "en"})
        self.assertTrue(out["ok"])
        self.assertTrue(out["immutable"])
        self.assertTrue(out["adminOnlyConfiguration"])
        self.assertIn({"id": "demo", "name": "Demo", "status": "available"}, out["products"])
        self.assertTrue(any(item["id"] == "game_event_h5" for item in out["classifications"]))
        self.assertTrue(any(item["classificationId"] == "game_event_h5" for item in out["templates"]))
        self.assertFalse(any(item["id"] == "lucky_spin_event" for item in out["classifications"]))
        self.assertFalse(any(item["classificationId"] == "lucky_spin_event" for item in out["templates"]))
        self.assertIn("Human Admin", out["message"])

    def test_catalog_section_filter(self):
        out = app.execute_launchops_tool("lcc_catalog", {"section": "classifications"})
        self.assertTrue(out["ok"])
        self.assertIn("classifications", out)
        self.assertNotIn("products", out)

    def test_chatbot_catalog_command_routes(self):
        command, argument, legacy = app.parse_chatbot_command("lcc catalog classifications")
        self.assertEqual(command, "catalog")
        self.assertEqual(argument, "classifications")
        self.assertFalse(legacy)

    def test_chatbot_catalog_reply_contains_valid_classifications(self):
        result = app.handle_chatbot_payload("generic", {"chatId": "test", "text": "lcc catalog classifications"})
        self.assertTrue(result["ok"])
        self.assertIn("classifications", result["reply"])
        self.assertIn("game_event_h5", result["reply"])
        self.assertNotIn("lucky_spin_event", result["reply"])


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
            "LAUNCHOPS_MCP_ADMIN_TOOLS_ENABLED": "true",
        }, clear=False)
        self.env_patch.start()

    def tearDown(self):
        self.env_patch.stop()
        self.dir_patch.stop()
        self.tempdir.cleanup()

    def required_launch_args(self, **overrides):
        payload = {
            "name": "Golden Spin Tool Test",
            "type": "game_event_h5",
            "owner": "LiveOps Lead",
            "targetDate": "15/07/2099 08:30",
            "endDate": "17/07/2099 23:59",
            "brief": "Golden Spin. Owner ready, rollback planned, CS FAQ drafted.",
        }
        payload.update(overrides)
        return payload

    def test_create_get_update_and_analyze_launch_via_tool(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Golden Spin Tool Test",
            type="game_event_h5",
            brief="Golden Spin. No owner, no rollback plan, no CS FAQ.",
        ))
        self.assertTrue(created["ok"])
        launch_id = created["launch"]["id"]

        found = app.execute_launchops_tool("lcc_get_launch", {"name": "Golden Spin Tool Test"})
        self.assertTrue(found["ok"])
        self.assertEqual(found["launch"]["id"], launch_id)

        updated = app.execute_launchops_tool("lcc_update_launch", {
            "name": "Golden Spin Tool Test",
            "newName": "Golden Spin Tool Test v2",
            "owner": "LiveOps Lead",
            "targetDate": "01/01/2020 08:30",
            "status": "running",
        })
        self.assertTrue(updated["ok"])
        self.assertEqual(updated["launch"]["name"], "Golden Spin Tool Test v2")
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

    def test_create_launch_rejects_invalid_classification_and_returns_catalog(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Bad Classification Launch",
            type="Lucky Wheel",
            brief="Golden Spin. No owner.",
            language="en",
        ))
        self.assertFalse(created["ok"])
        self.assertEqual(created["error"], "invalid_classification")
        self.assertIn("classifications", created["catalog"])
        self.assertTrue(any(item["id"] == "game_event_h5" for item in created["catalog"]["classifications"]))
        self.assertFalse(any(item["id"] == "lucky_spin_event" for item in created["catalog"]["classifications"]))

    def test_create_launch_rejects_missing_required_fields_for_channel_bots(self):
        created = app.execute_launchops_tool("lcc_create_launch", {
            "name": "Missing Fields Launch",
            "brief": "Golden Spin. Owner ready.",
            "language": "vi",
        })

        self.assertFalse(created["ok"])
        self.assertEqual(created["error"], "missing_required_launch_fields")
        self.assertEqual(created["fields"], ["type", "owner", "targetDate", "endDate"])
        self.assertIn("Ngày Bắt Đầu", created["message"])
        self.assertIn("dd/mm/yyyy hh:mm", created["message"])

    def test_create_launch_accepts_game_event_alias_and_saves_canonical_type(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Good Classification Launch",
            type="Game event",
            brief="Golden Spin. Owner ready.",
        ))
        self.assertTrue(created["ok"])
        self.assertEqual(created["launch"]["type"], "game_event_h5")

    def test_create_launch_rejects_removed_lucky_spin_classification(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Removed Classification Launch",
            type="Lucky Spin",
            brief="Golden Spin. Owner ready.",
            language="en",
        ))
        self.assertFalse(created["ok"])
        self.assertEqual(created["error"], "invalid_classification")
        self.assertFalse(any(item["id"] == "lucky_spin_event" for item in created["catalog"]["classifications"]))

    def test_create_launch_rejects_date_without_time_for_bots(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Date Only Launch",
            targetDate="15/06/2026",
            endDate="17/06/2026 23:59",
            brief="Golden Spin. Owner ready.",
            language="en",
        ))
        self.assertFalse(created["ok"])
        self.assertEqual(created["error"], "missing_launch_time")
        self.assertEqual(created["field"], "targetDate")
        self.assertIn("dd/mm/yyyy hh:mm", created["message"])

    def test_create_launch_accepts_required_date_time_for_bots(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Date Time Launch",
            targetDate="15/06/2099 08:30",
            endDate="17/06/2099 23:59",
            brief="Golden Spin. Owner ready.",
        ))
        self.assertTrue(created["ok"])
        self.assertEqual(created["launch"]["targetDate"], "15/06/2099 08:30")
        self.assertEqual(created["launch"]["endDate"], "17/06/2099 23:59")

    def test_create_launch_user_message_uses_launch_name_not_id(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Summer Launch",
            type="game_event_h5",
            targetDate="15/07/2099 08:30",
            endDate="17/07/2099 23:59",
            owner="LiveOps",
            brief="Gift all users with clear rollback and CS FAQ.",
            language="vi",
        ))

        self.assertTrue(created["ok"])
        self.assertIn("Tên Launch: Summer Launch", created["userMessage"])
        self.assertIn("Ngày Bắt Đầu: 15/07/2099 08:30", created["userMessage"])
        self.assertNotIn("ID:", created["userMessage"])

        content = app.mcp_tool_content(created)["content"]
        self.assertEqual(content[0]["text"], created["userMessage"])

    def test_update_launch_rejects_invalid_classification_and_returns_catalog(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Update Classification Launch",
            brief="Golden Spin. Owner ready.",
        ))
        updated = app.execute_launchops_tool("lcc_update_launch", {
            "launchId": created["launch"]["id"],
            "type": "Wrong Type",
        })
        self.assertFalse(updated["ok"])
        self.assertEqual(updated["error"], "invalid_classification")
        self.assertIn("classifications", updated["catalog"])

    def test_update_launch_rejects_date_without_time_for_bots(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Update Date Time Launch",
            brief="Golden Spin. Owner ready.",
        ))
        updated = app.execute_launchops_tool("lcc_update_launch", {
            "launchId": created["launch"]["id"],
            "endDate": "17/06/2026",
        })
        self.assertFalse(updated["ok"])
        self.assertEqual(updated["error"], "missing_launch_time")
        self.assertEqual(updated["field"], "endDate")

    def test_update_launch_user_message_uses_launch_name_not_id(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Editable Launch",
            brief="Golden Spin. Owner ready.",
        ))
        updated = app.execute_launchops_tool("lcc_update_launch", {
            "launchId": created["launch"]["id"],
            "newName": "Editable Launch v2",
            "targetDate": "20/07/2099 08:30",
            "endDate": "21/07/2099 23:59",
            "owner": "PM LiveOps",
            "language": "en",
        })

        self.assertTrue(updated["ok"])
        self.assertIn("Launch Name: Editable Launch v2", updated["userMessage"])
        self.assertIn("Start Launch: 20/07/2099 08:30", updated["userMessage"])
        self.assertNotIn("ID:", updated["userMessage"])

    def test_set_launch_template_updates_launch_template_versions(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Template Test Launch",
            brief="No owner, no rollback.",
        ))
        result = app.execute_launchops_tool("lcc_set_launch_template", {
            "launchId": created["launch"]["id"],
            "templateName": "Strict Webshop Template",
            "riskGroups": [
                {"label": "Payment readiness", "maxScore": 3},
                "CS readiness",
            ],
            "redTeamPersonas": ["CS lead", "Tech on-call", "Business owner"],
            "adminConfirmation": "HUMAN_ADMIN",
        })
        self.assertTrue(result["ok"])
        self.assertEqual(result["template"]["maxScore"], 5)
        self.assertEqual(result["launch"]["name"], "Template Test Launch")
        self.assertEqual(result["launch"]["template"]["name"], "Strict Webshop Template")
        self.assertEqual(len(result["launch"]["templateVersions"]), 1)

    def test_mcp_admin_configuration_tools_are_blocked_for_channel_bot_by_default(self):
        with patch.dict(os.environ, {"LAUNCHOPS_MCP_ADMIN_TOOLS_ENABLED": "false"}, clear=False):
            result = app.execute_launchops_tool("lcc_create_type", {
                "name": "Bot Created Type",
                "riskGroups": ["Owner readiness"],
                "adminConfirmation": "HUMAN_ADMIN",
            })
        self.assertFalse(result["ok"])
        self.assertEqual(result["error"], "admin_only_configuration")
        self.assertIn("lcc_catalog", result["message"])
        self.assertTrue(result["catalog"]["adminOnlyConfiguration"])

    def test_controlled_learning_proposal_does_not_change_active_template(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Learning Draft Launch",
            brief="Golden Spin had traffic spikes and missing scale owner.",
            template={
                "name": "Base Template",
                "riskGroups": [{"label": "Owner readiness", "maxScore": 2}],
                "redTeamPersonas": ["CS lead", "Tech lead", "Biz owner", "QA lead", "Marketing lead"],
            },
        ))
        launch_id = created["launch"]["id"]
        with patch.object(app, "call_llm_raw", return_value=({
            "addRiskGroups": [{"label": "Scalability", "maxScore": 2}],
            "addPersonas": ["Scalability Engineer"],
            "rationale": "Traffic spike lesson requires scale review.",
        }, {"source": "llm", "model": "m", "latencyMs": 10, "schemaAccepted": True})) as mocked:
            result = app.execute_launchops_tool("lcc_propose_template_update", {
                "launchId": launch_id,
                "lesson": "Post-mortem: traffic spike overloaded reward API. apikey=shhh 0901234567",
                "adminConfirmation": "HUMAN_ADMIN",
            }, force_fast=False)

        self.assertTrue(result["ok"])
        mocked.assert_called_once()
        reloaded = app.get_launch(launch_id)
        self.assertEqual(reloaded["template"]["riskGroups"], [{"label": "Owner readiness", "maxScore": 2}])
        self.assertEqual(len(reloaded["templateVersions"]), 0)
        self.assertEqual(len(reloaded["lessonSuggestions"]), 1)
        proposal = result["proposal"]
        self.assertEqual(proposal["status"], "proposed")
        self.assertEqual(proposal["delta"]["addRiskGroups"], [{"label": "Scalability", "maxScore": 2}])
        self.assertEqual(proposal["delta"]["addPersonas"], ["Scalability Engineer"])
        self.assertNotIn("shhh", json.dumps(proposal, ensure_ascii=False))
        self.assertNotIn("0901234567", json.dumps(proposal, ensure_ascii=False))

    def test_controlled_learning_validation_rejects_bad_delta(self):
        template = {"riskGroups": [{"label": "Scalability", "maxScore": 2}], "redTeamPersonas": ["CS lead"]}
        result = app.validate_template_delta({
            "addRiskGroups": [
                {"label": "", "maxScore": 2},
                {"label": "Scalability", "maxScore": 3},
                {"label": "Cost", "maxScore": 99},
            ],
            "addPersonas": ["CS lead", ""],
            "rationale": "bad",
        }, template)
        self.assertFalse(result["ok"])
        self.assertIn("risk_label_required", result["errors"])
        self.assertIn("risk_group_duplicate:Scalability", result["errors"])
        self.assertIn("risk_max_score_invalid:Cost", result["errors"])
        self.assertIn("persona_duplicate:CS lead", result["errors"])
        self.assertIn("persona_label_required", result["errors"])

    def test_controlled_learning_approve_creates_new_template_version(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Learning Approve Launch",
            brief="Owner named. Rollback ready. Need scale review.",
            template={
                "name": "Base Template",
                "riskGroups": [{"label": "Owner readiness", "maxScore": 2}],
                "redTeamPersonas": ["CS lead", "Tech lead", "Biz owner", "QA lead", "Marketing lead"],
            },
        ))
        launch_id = created["launch"]["id"]
        with patch.object(app, "call_llm_raw", return_value=({
            "addRiskGroups": [{"label": "Scalability", "maxScore": 2}],
            "addPersonas": ["Scalability Engineer"],
            "rationale": "Scale risk should be reviewed before launch.",
        }, {"source": "llm", "model": "m", "latencyMs": 10, "schemaAccepted": True})):
            proposed = app.execute_launchops_tool("lcc_propose_template_update", {
                "launchId": launch_id,
                "lesson": "Need scale owner and load test.",
                "adminConfirmation": "HUMAN_ADMIN",
            }, force_fast=False)

        approved = app.execute_launchops_tool("lcc_approve_template_version", {
            "launchId": launch_id,
            "proposalId": proposed["proposal"]["id"],
            "adminConfirmation": "HUMAN_ADMIN",
        })
        self.assertTrue(approved["ok"])
        self.assertEqual(approved["proposal"]["status"], "approved")
        self.assertEqual(approved["template"]["maxScore"], 4)
        self.assertEqual([g["label"] for g in approved["template"]["riskGroups"]], ["Owner readiness", "Scalability"])
        self.assertIn("Scalability Engineer", approved["template"]["redTeamPersonas"])
        self.assertEqual(len(approved["launch"]["templateVersions"]), 1)

        analyzed = app.execute_launchops_tool("lcc_analyze_launch", {"launchId": launch_id}, force_fast=True)
        self.assertEqual(analyzed["result"]["decision"]["maxScore"], 4)

    def test_controlled_learning_force_fast_does_not_call_llm(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Learning Fast Launch",
            brief="Traffic spike hit reward API.",
        ))
        with patch.object(app, "call_llm_raw") as mocked:
            result = app.execute_launchops_tool("lcc_propose_template_update", {
                "launchId": created["launch"]["id"],
                "lesson": "Traffic spike overloaded the reward API.",
                "adminConfirmation": "HUMAN_ADMIN",
            }, force_fast=True)
        self.assertTrue(result["ok"])
        mocked.assert_not_called()
        self.assertEqual(result["proposal"]["source"], "deterministic")

    def test_controlled_learning_reject_keeps_template_unchanged(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(
            name="Learning Reject Launch",
            brief="Traffic spike hit reward API.",
            template={
                "name": "Base Template",
                "riskGroups": [{"label": "Owner readiness", "maxScore": 2}],
                "redTeamPersonas": ["CS lead", "Tech lead", "Biz owner", "QA lead", "Marketing lead"],
            },
        ))
        launch_id = created["launch"]["id"]
        with patch.object(app, "call_llm_raw", return_value=({
            "addRiskGroups": [{"label": "Scalability", "maxScore": 2}],
            "addPersonas": ["Scalability Engineer"],
            "rationale": "Scale risk should be reviewed.",
        }, {"source": "llm", "model": "m", "latencyMs": 10, "schemaAccepted": True})):
            proposed = app.execute_launchops_tool("lcc_propose_template_update", {
                "launchId": launch_id,
                "lesson": "Need scale owner.",
                "adminConfirmation": "HUMAN_ADMIN",
            }, force_fast=False)

        rejected = app.execute_launchops_tool("lcc_approve_template_version", {
            "launchId": launch_id,
            "proposalId": proposed["proposal"]["id"],
            "approve": False,
            "adminConfirmation": "HUMAN_ADMIN",
        })
        self.assertTrue(rejected["ok"])
        self.assertEqual(rejected["proposal"]["status"], "rejected")
        reloaded = app.get_launch(launch_id)
        self.assertEqual(reloaded["template"]["riskGroups"], [{"label": "Owner readiness", "maxScore": 2}])
        self.assertEqual(len(reloaded["templateVersions"]), 0)

    def test_save_launch_payload_preserves_ui_progress_metadata(self):
        saved = app.save_launch_payload({
            "name": "Progress Test Launch",
            "brief": "Checklist progress and red team draft should persist.",
            "redTeamBriefSupplements": {"0:angry-user": "Add CS FAQ before launch."},
            "checklistProgress": {"write-faq|cs|t-1": True},
        })
        reloaded = app.get_launch(saved["id"])
        self.assertEqual(reloaded["redTeamBriefSupplements"], {"0:angry-user": "Add CS FAQ before launch."})
        self.assertEqual(reloaded["checklistProgress"], {"write-faq|cs|t-1": True})

        updated = app.save_launch_payload({"name": "Progress Test Launch", "brief": "Updated brief."}, existing_id=saved["id"])
        self.assertEqual(updated["redTeamBriefSupplements"], {"0:angry-user": "Add CS FAQ before launch."})
        self.assertEqual(updated["checklistProgress"], {"write-faq|cs|t-1": True})

    def test_update_latest_checklist_persists_to_latest_analysis(self):
        saved = app.save_launch_payload({
            "name": "Editable Checklist Launch",
            "brief": "Need editable action list after analysis.",
        })
        result = app.fallback_result("Initial analysis")
        result["checklist"] = [
            {"task": "Old task", "owner": "PM", "deadline": "17/06/2026", "status": "Todo", "priority": "High"},
        ]
        launch = app.append_analysis(saved, result, saved["brief"])

        updated_items = [
            {"task": "New task", "owner": "Ops", "deadline": "18/06/2026", "status": "Doing", "priority": "Medium"},
        ]
        updated = app.update_launch_checklist(launch["id"], updated_items)

        self.assertEqual(updated["analyses"][-1]["result"]["checklist"], updated_items)
        reloaded = app.get_launch(launch["id"])
        self.assertEqual(reloaded["analyses"][-1]["result"]["checklist"], updated_items)

    def test_update_latest_checklist_rejects_locked_sample(self):
        sample = app.save_launch_payload({
            "id": "golden-spin-live-risk",
            "name": "Golden Spin Weekend Live",
            "brief": "Sample launch.",
            "isSample": True,
        })
        with self.assertRaises(app.SampleLaunchLockError):
            app.update_launch_checklist(sample["id"], [{"task": "Change sample"}])

    def test_delete_launch_requires_explicit_confirmation(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(name="Delete Me"))
        launch_id = created["launch"]["id"]
        blocked = app.execute_launchops_tool("lcc_delete_launch", {"launchId": launch_id})
        self.assertFalse(blocked["ok"])
        self.assertEqual(blocked["error"], "confirmation_required")
        deleted = app.execute_launchops_tool("lcc_delete_launch", {"launchId": launch_id, "confirm": f"DELETE {launch_id}"})
        self.assertTrue(deleted["ok"])
        self.assertIsNone(app.get_launch(launch_id))

    def test_deleted_launch_moves_to_archive_and_can_restore_or_purge(self):
        created = app.execute_launchops_tool("lcc_create_launch", self.required_launch_args(name="Archive Me"))
        launch_id = created["launch"]["id"]

        deleted = app.execute_launchops_tool("lcc_delete_launch", {
            "launchId": launch_id,
            "confirm": f"DELETE {launch_id}",
        })
        self.assertTrue(deleted["ok"])
        self.assertEqual(deleted["archivedId"], launch_id)
        self.assertIsNone(app.get_launch(launch_id))

        archived = app.list_archived_launches()
        self.assertEqual([item["id"] for item in archived], [launch_id])
        self.assertTrue(archived[0]["archived"])
        self.assertIn("archivedAt", archived[0])

        restored = app.restore_archived_launch(launch_id)
        self.assertEqual(restored["id"], launch_id)
        self.assertFalse(restored.get("archived", False))
        self.assertIsNotNone(app.get_launch(launch_id))
        self.assertEqual(app.list_archived_launches(), [])

        app.delete_launch(launch_id)
        self.assertEqual([item["id"] for item in app.list_archived_launches()], [launch_id])
        self.assertTrue(app.purge_archived_launch(launch_id))
        self.assertEqual(app.list_archived_launches(), [])

class SampleLaunchLockTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.launch_dir = Path(self.tempdir.name)
        self.dir_patch = patch.object(app, "LAUNCHES_DIR", self.launch_dir)
        self.dir_patch.start()
        self.env_patch = patch.dict(os.environ, {
            "LAUNCHOPS_STORAGE_BACKEND": "local",
            "LAUNCHOPS_LLM_ENABLED": "false",
            "LAUNCHOPS_MULTI_MODEL_ENABLED": "false",
            "LAUNCHOPS_ORCHESTRATOR_LLM_ENABLED": "false",
            "LAUNCHOPS_MEMORY_LLM_ENABLED": "false",
            "LAUNCHOPS_MCP_ADMIN_TOOLS_ENABLED": "true",
        }, clear=False)
        self.env_patch.start()
        self.sample_launch = {
            **app.default_sample_launches()[0],
            "id": "golden-spin-review-lock",
            "name": "Golden Spin Review Lock",
            "isSample": True,
            "targetDate": "15/07/2099 08:30",
            "endDate": "17/07/2099 23:59",
            "analyses": [{
                "id": "analysis-existing",
                "createdAt": "2099-07-01T00:00:00Z",
                "briefSnapshot": "existing",
                "result": app.fallback_result("existing"),
            }],
        }
        app.write_json(app.launch_file(self.sample_launch["id"]), self.sample_launch)

    def tearDown(self):
        self.env_patch.stop()
        self.dir_patch.stop()
        self.tempdir.cleanup()

    def test_admin_configuration_tools_are_not_blocked_by_extra_review_state(self):
        created = app.execute_launchops_tool("lcc_create_launch", {
            "name": "Admin Config Launch",
            "type": "game_event_h5",
            "owner": "Admin",
            "targetDate": "20/07/2099 08:30",
            "endDate": "21/07/2099 23:59",
            "brief": "Owner, rollback and CS FAQ are ready.",
        })
        self.assertTrue(created["ok"])

        type_result = app.execute_launchops_tool("lcc_create_type", {
            "name": "Admin Created Type",
            "riskGroups": ["Owner readiness"],
            "adminConfirmation": "HUMAN_ADMIN",
        }, force_fast=True)
        self.assertTrue(type_result["ok"])

        template_result = app.execute_launchops_tool("lcc_set_launch_template", {
            "launchId": created["launch"]["id"],
            "templateName": "Admin Template",
            "riskGroups": [{"label": "Owner readiness", "maxScore": 2}],
            "redTeamPersonas": ["CS lead", "Tech lead", "Business owner"],
            "adminConfirmation": "HUMAN_ADMIN",
        }, force_fast=True)
        self.assertTrue(template_result["ok"])

    def test_sample_launches_stay_immutable_for_non_admin(self):
        update = app.execute_launchops_tool("lcc_update_launch", {
            "launchId": self.sample_launch["id"],
            "owner": "Reviewer",
        })
        self.assertFalse(update["ok"])
        self.assertEqual(update["error"], "sample_launch_locked")

        delete = app.execute_launchops_tool("lcc_delete_launch", {
            "launchId": self.sample_launch["id"],
            "confirm": f"DELETE {self.sample_launch['id']}",
        })
        self.assertFalse(delete["ok"])
        self.assertEqual(delete["error"], "sample_launch_locked")
        self.assertIsNotNone(app.get_launch(self.sample_launch["id"]))

        with self.assertRaises(app.SampleLaunchLockError):
            app.save_post_result(dict(self.sample_launch), {"status": "completed", "lesson": "Do not mutate sample."})

    def test_new_launch_and_sample_analyze_work_with_sample_lock(self):
        created = app.execute_launchops_tool("lcc_create_launch", {
            "name": "Reviewer Test Launch",
            "type": "game_event_h5",
            "owner": "Reviewer",
            "targetDate": "20/07/2099 08:30",
            "endDate": "21/07/2099 23:59",
            "brief": "Reviewer launch with owner, rollback and CS FAQ.",
        }, force_fast=True)
        self.assertTrue(created["ok"])
        self.assertFalse(app.is_sample_launch_id(created["launch"]["id"]))

        before = len(app.get_launch(self.sample_launch["id"]).get("analyses") or [])
        analyzed = app.execute_launchops_tool("lcc_analyze_launch", {
            "launchId": self.sample_launch["id"],
        }, force_fast=True)
        self.assertTrue(analyzed["ok"])
        self.assertIn("decision", analyzed["result"])
        self.assertEqual(analyzed["summary"]["analysisCount"], before)
        after = len(app.get_launch(self.sample_launch["id"]).get("analyses") or [])
        self.assertEqual(after, before)

    def test_archive_restore_and_purge_follow_admin_permission_only(self):
        archived = {
            **self.sample_launch,
            "id": "reviewer-owned-archived",
            "name": "Reviewer Owned Archived",
            "isSample": False,
            "archived": True,
            "archivedAt": "2099-07-01T00:00:00Z",
        }
        app.write_json(app.archive_file(archived["id"]), archived)
        self.assertEqual([item["id"] for item in app.list_archived_launches()], [archived["id"]])

        restored = app.restore_archived_launch(archived["id"])
        self.assertEqual(restored["id"], archived["id"])
        app.delete_launch(archived["id"])
        self.assertTrue(app.purge_archived_launch(archived["id"]))

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
        remote_result["ragSources"] = {"source": "agentbase", "storeId": "memory-readiness", "recordsRecalled": 2}
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
        self.assertEqual(remote_traces[0]["ragSources"]["storeId"], "memory-readiness")
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

    def test_redteam_skips_full_green_readiness(self):
        result = {
            "decision": {"color": "Green", "score": 12, "maxScore": 12},
            "riskBreakdown": [
                {"label": "Mục tiêu", "score": 2, "maxScore": 2, "missing": "Đủ rõ."}
            ],
            "topRisks": ["old risk"],
            "trace": [],
        }
        with patch.dict(os.environ, {"LAUNCHOPS_MULTI_MODEL_ENABLED": "true"}, clear=False), \
                patch.object(app, "call_llm") as call_llm:
            analyzed = app.red_team_agent(result, {"brief": "Ready brief"}, force_fast=False)
        call_llm.assert_not_called()
        self.assertEqual(analyzed["topRisks"], [])
        self.assertEqual(analyzed["redTeam"], [])
        self.assertEqual(analyzed["trace"][-1]["cards"], 0)

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

    def test_llm_usage_meta_maps_provider_usage(self):
        usage = app.llm_usage_meta({
            "usage": {
                "prompt_tokens": 12,
                "completion_tokens": 8,
                "total_tokens": 20,
            }
        })
        self.assertEqual(usage, {"inputTokens": 12, "outputTokens": 8, "totalTokens": 20})

    def test_agent_trace_carries_token_usage_when_available(self):
        trace = app._agent_trace("readiness", "readiness", "llm", {
            "source": "llm",
            "model": "m",
            "latencyMs": 10,
            "schemaAccepted": True,
            "inputTokens": 12,
            "outputTokens": 8,
            "totalTokens": 20,
        })
        self.assertEqual(trace["inputTokens"], 12)
        self.assertEqual(trace["outputTokens"], 8)
        self.assertEqual(trace["totalTokens"], 20)


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

    def test_language_rule_covers_all_agent_prompts(self):
        english_brief = "Lucky Wheel weekend event. No owner, no rollback plan, payment untested."
        for step in ("readiness", "redteam", "checklist", "postmortem", None):
            with self.subTest(step=step or "default"):
                prompt = app.build_prompt(english_brief, self.CTX, step)
                self.assertIn("MUST be written in English", prompt)

    def test_language_rule_treats_ascii_vietnamese_as_vi(self):
        prompt = app.build_prompt("Su kien quay thuong cuoi tuan chua co nguoi phu trach", self.CTX, "checklist")
        self.assertIn("tiếng Việt", prompt)

    def test_rule_readiness_follows_english_brief_language(self):
        brief = "Lucky Wheel weekend event. No owner, no rollback plan, payment untested."
        result = app.readiness_agent(brief, {"brief": brief, "template": app.build_default_template()}, force_fast=True)
        self.assertIn("Not safe enough", result["decision"]["title"])
        self.assertIn("deterministic template rules", result["decision"]["reason"])
        self.assertNotIn("Đang dùng fallback", result["decision"]["reason"])

    def test_rule_readiness_keeps_ascii_vietnamese_in_vi(self):
        brief = "Su kien quay thuong cuoi tuan chua co nguoi phu trach"
        result = app.readiness_agent(brief, {"brief": brief, "template": app.build_default_template()}, force_fast=True)
        self.assertIn("Chưa đủ", result["decision"]["title"])


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
                _, trace = app.recall_knowledge("Lucky Wheel", "game_event_h5", "demo_game")
        self.assertEqual(trace["storeId"], "mem_k")
        self.assertIn("/launchops/products/demo-game/game-event-h5", captured)
        self.assertIn("/launchops/knowledge/game-event-h5", captured)


class SixLlmAgentTests(unittest.TestCase):
    """WS5: memory + orchestrator become real LLM agents -> 6 agents in the analyze pipeline."""

    def test_memory_agent_distill_llm_accepted(self):
        recs = [{"lesson": "[role=all] luôn cần reward cap"}, {"lesson": "[role=redteam] coi chừng farm"}]
        with patch.dict(os.environ, {"LAUNCHOPS_MEMORY_LLM_ENABLED": "true"}), \
                patch.object(app, "call_llm_raw", return_value=({"insight": "Cần reward cap + chống farm."}, {"source": "llm", "model": "m", "latencyMs": 50, "schemaAccepted": True})):
            insight, trace = app.memory_agent_distill("Lucky Wheel", recs)
        self.assertEqual(insight, "Cần reward cap + chống farm.")
        self.assertEqual(trace["agent"], "memory")
        self.assertEqual(trace["source"], "llm")

    def test_memory_agent_distill_fallback(self):
        recs = [{"lesson": "x"}]
        with patch.dict(os.environ, {"LAUNCHOPS_MEMORY_LLM_ENABLED": "true"}), \
                patch.object(app, "call_llm_raw", return_value=(None, {"source": "fallback", "model": "m", "latencyMs": 0, "schemaAccepted": False, "fallbackReason": "timeout"})):
            insight, trace = app.memory_agent_distill("Lucky Wheel", recs)
        self.assertEqual(insight, "")
        self.assertEqual(trace["source"], "fallback")
        self.assertEqual(trace["fallbackReason"], "timeout")

    def test_memory_agent_no_knowledge_is_rule(self):
        insight, trace = app.memory_agent_distill("Lucky Wheel", [])
        self.assertEqual(trace["source"], "rule")

    def test_orchestrator_agent_summary_llm_accepted(self):
        base = app.fallback_result("base")
        with patch.dict(os.environ, {"LAUNCHOPS_ORCHESTRATOR_LLM_ENABLED": "true"}), \
                patch.object(app, "call_llm_raw", return_value=({"goNoGo": "No-Go", "executiveSummary": "Chưa nên launch.", "topActions": ["a", "b"]}, {"source": "llm", "model": "m", "latencyMs": 60, "schemaAccepted": True})):
            summary, trace = app.orchestrator_agent_summary("Lucky Wheel", base)
        self.assertEqual(summary["goNoGo"], "No-Go")
        self.assertEqual(trace["agent"], "orchestrator")
        self.assertEqual(trace["source"], "llm")

    def test_orchestrate_pipeline_has_six_agent_traces(self):
        # Rule mode (no LLM): memory + orchestrator still appear in the trace (rule/fallback), proving 6 agents.
        with patch.dict(os.environ, {"LAUNCHOPS_LLM_ENABLED": "false", "LAUNCHOPS_MULTI_MODEL_ENABLED": "false", "LAUNCHOPS_RAG_ENABLED": "false"}, clear=True):
            result = app.orchestrate_launchops_analysis("Lucky Wheel. No owner, no rollback, no CS FAQ.")
        agents = [t.get("agent") for t in result.get("agentsTrace", []) if t.get("agent") in ("readiness", "red_team", "checklist", "postmortem", "memory", "orchestrator")]
        for a in ("readiness", "red_team", "checklist", "postmortem", "memory", "orchestrator"):
            self.assertIn(a, agents)

    def test_fast_path_skips_memory_and_orchestrator(self):
        with patch.dict(os.environ, {"LAUNCHOPS_LLM_ENABLED": "false", "LAUNCHOPS_MULTI_MODEL_ENABLED": "false"}, clear=True):
            result = app.orchestrate_launchops_analysis("Lucky Wheel no owner", force_fast=True)
        agents = [t.get("agent") for t in result.get("agentsTrace", [])]
        self.assertNotIn("memory", agents)
        self.assertNotIn("orchestrator", agents)


class RemoteOrchestrationFeatureParityTests(unittest.TestCase):
    def test_remote_path_runs_rag_memory_orchestrator(self):
        env = {
            "LAUNCHOPS_LLM_ENABLED": "false",
            "LAUNCHOPS_MULTI_MODEL_ENABLED": "false",
            "LAUNCHOPS_STORAGE_BACKEND": "local",
            "LAUNCHOPS_RAG_ENABLED": "false",
        }
        # No remote child URLs configured -> every agent falls back to the local implementation,
        # but the orchestrator must still run RAG recall + memory + orchestrator (executiveSummary) steps.
        with patch.dict(os.environ, env, clear=False):
            result = app.orchestrate_remote_launchops_analysis("Ra mat su kien, chua co rollback va load test.", {}, force_fast=False)
        self.assertEqual(result.get("orchestration", {}).get("mode"), "remote_agents")
        self.assertIn("ragSources", result)
        agents = [t.get("agent") for t in result.get("trace", [])]
        self.assertIn("memory", agents)
        self.assertIn("orchestrator", agents)


class IndependentAgentMemoryTests(unittest.TestCase):
    def test_analysis_child_self_recalls_from_own_store(self):
        env = {
            "LAUNCHOPS_LLM_ENABLED": "false",
            "LAUNCHOPS_MULTI_MODEL_ENABLED": "false",
            "LAUNCHOPS_STORAGE_BACKEND": "local",
            "LAUNCHOPS_RAG_ENABLED": "true",
            "LAUNCHOPS_KNOWLEDGE_MEMORY_ID": "",
        }
        # RAG on but no store id -> the child still performs its OWN recall (not the orchestrator's),
        # surfaced as result.ragSources. Proves recall happens inside the agent runtime.
        with patch.dict(os.environ, env, clear=False):
            resp = app.invoke_agent_role("readiness", {"requestId": "t", "brief": "Ra mat su kien, chua co rollback.", "launch": {}})
        self.assertTrue(resp["ok"])
        rag = resp.get("result", {}).get("ragSources")
        self.assertIsNotNone(rag)
        self.assertEqual(rag.get("source"), "missing_knowledge_id")


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


class AssistantLanguageTests(unittest.TestCase):
    def test_english_fallback_uses_ui_language_not_vietnamese_local_reply(self):
        reply = app.assistant_fallback_reply(
            "Explain readiness",
            {"launchName": "Golden Spin", "launchType": "Lucky Spin Event"},
            local_reply="Toi co the ho tro bang tieng Viet.",
            language="en",
        )

        self.assertIn("readiness", reply.lower())
        self.assertIn("Golden Spin", reply)
        self.assertNotIn("Toi co the", reply)

    def test_english_out_of_scope_fallback_stays_in_launchops_scope(self):
        reply = app.assistant_fallback_reply("What is the weather today?", language="en")

        self.assertIn("LaunchOps Command Center", reply)
        self.assertIn("launch brief", reply)
        self.assertNotIn("Tôi", reply)

    def test_missing_assistant_config_returns_english_fallback_when_requested(self):
        with patch.dict(os.environ, {
            "LAUNCHOPS_ASSISTANT_API_KEY": "",
            "LAUNCHOPS_AGENTBASE_API_KEY": "",
            "LAUNCHOPS_LLM_API_KEY": "",
        }, clear=False):
            result = app.call_assistant(
                "What can you help with?",
                {"launchName": "Golden Spin"},
                local_reply="Toi co the ho tro bang tieng Viet.",
                language="en",
            )

        self.assertEqual(result["source"], "fallback")
        self.assertIn("Golden Spin", result["reply"])
        self.assertIn("LaunchOps", result["reply"])
        self.assertNotIn("Toi co the", result["reply"])

    def test_assistant_prompt_uses_requested_language_and_redacts_sensitive_context(self):
        prompt = app.build_assistant_prompt(
            "Help me",
            {"launchName": "Golden Spin", "apiKey": "secret-value", "nested": {"token": "hidden-token"}},
            language="en",
        )

        self.assertIn("Answer in English", prompt)
        self.assertIn("Golden Spin", prompt)
        self.assertIn("[REDACTED]", prompt)
        self.assertNotIn("secret-value", prompt)
        self.assertNotIn("hidden-token", prompt)


class ChannelSkillTests(unittest.TestCase):
    def test_channel_skill_manifest_supports_self_host_mcp_and_direct_tools(self):
        manifest = app.channel_skill_manifest("http://127.0.0.1:8788", "vi")

        self.assertTrue(manifest["ok"])
        self.assertEqual(manifest["kind"], "launchops-channel-skill")
        self.assertEqual(manifest["endpoints"]["mcp"], "http://127.0.0.1:8788/mcp")
        self.assertEqual(manifest["endpoints"]["directToolCall"], "http://127.0.0.1:8788/tools/call")
        self.assertEqual(manifest["endpoints"]["discordSkill"], "http://127.0.0.1:8788/discord/skill")
        self.assertEqual(manifest["openClawMcpRemote"]["args"], ["-y", "mcp-remote", "http://127.0.0.1:8788/mcp"])
        self.assertIn("OpenClaw", manifest["supportedChannels"])
        self.assertIn(app.LCC_DOCS_TOOL, manifest["preferredToolOrder"])
        self.assertTrue(any(tool["name"] == app.LCC_CATALOG_TOOL for tool in manifest["tools"]))

    def test_channel_skill_manifest_lists_brief_extensions_and_admin_rules(self):
        manifest = app.channel_skill_manifest("https://example.test", "vi")
        prompt = manifest["systemPrompt"]

        for ext in (".txt", ".md", ".json", ".csv", ".yaml", ".log", ".js", ".py", ".html", ".css", ".jpg", ".png", ".gif", ".webp"):
            self.assertIn(ext, manifest["briefFileExtensions"])
            self.assertIn(ext, prompt)
        for ext in (".pdf", ".xls", ".xlsx", ".ppt", ".pptx"):
            self.assertIn(ext, manifest["betaBriefFileExtensions"])
            self.assertIn(ext, prompt)
        self.assertIn("Human Admin", prompt)
        self.assertIn("dd/mm/yyyy hh:mm", prompt)
        self.assertIn("Không tiết lộ secret", prompt)

    def test_channel_skill_prompt_can_be_english(self):
        prompt = app.channel_skill_system_prompt("en")

        self.assertIn("LaunchOps Command Center Channel Agent", prompt)
        self.assertIn("Human Admin", prompt)
        self.assertIn("date and time", prompt)
        self.assertIn(".pptx", prompt)
        self.assertIn("Start Launch and End Launch", prompt)
        self.assertIn("do not accept it", prompt)
        self.assertNotIn("Target Date:", prompt)

    def test_channel_skill_routes_include_discord_aliases(self):
        source = Path(app.__file__).read_text(encoding="utf-8")

        self.assertIn("/discord/skill", source)
        self.assertIn("/discord/system-prompt.txt", source)
        self.assertIn("/discord/mcp-remote.json", source)

    def test_do_get_does_not_shadow_parse_qs_before_channel_skill_routes(self):
        source = Path(app.__file__).read_text(encoding="utf-8")

        self.assertNotIn("from urllib.parse import parse_qs\n            query = parse_qs", source)


class WebAssistantFlowContractTests(unittest.TestCase):
    def test_friendly_launch_flow_uses_shared_field_order(self):
        source = (SERVER_DIR.parent / "friendly-ui.js").read_text(encoding="utf-8")

        self.assertIn(
            "var LAUNCH_CONFIG_FLOW = ['name', 'owner', 'type', 'template', 'status', 'ownerConfirm', 'targetDate', 'endDate', 'brief'];",
            source,
        )

    def test_config_catalog_tab_is_first_and_active(self):
        source = (SERVER_DIR.parent / "index.html").read_text(encoding="utf-8")
        nav_start = source.index('<nav class="config-tabs"')
        first_catalog = source.index('data-config-tab="catalog"', nav_start)
        first_risk = source.index('data-config-tab="risk"', nav_start)

        self.assertLess(first_catalog, first_risk)
        self.assertIn('class="config-tab active" data-config-tab="catalog"', source)
        i18n_source = (SERVER_DIR.parent / "i18n-clean.js").read_text(encoding="utf-8")
        self.assertIn('catalog: "Phân loại"', i18n_source)
        self.assertIn("const key = tab.dataset.configTab;", i18n_source)

    def test_search_placeholder_and_filter_include_template(self):
        index_source = (SERVER_DIR.parent / "index.html").read_text(encoding="utf-8")
        app_source = (SERVER_DIR.parent / "app.js").read_text(encoding="utf-8")
        i18n_source = (SERVER_DIR.parent / "i18n-clean.js").read_text(encoding="utf-8")

        self.assertIn('placeholder="Tên/Phân Loại/Template"', index_source)
        self.assertIn('searchPlaceholder: "Tên/Phân Loại/Template"', app_source)
        self.assertIn('searchPlaceholder: "Tên/Phân Loại/Template"', i18n_source)
        self.assertIn("launch.templateName", app_source)

    def test_classification_plus_uses_existing_template_pool(self):
        source = (SERVER_DIR.parent / "app.js").read_text(encoding="utf-8")

        self.assertIn("function addExistingTemplateForLaunchType(type)", source)
        self.assertNotIn("function addTemplateForLaunchType(type)", source)
        self.assertNotIn("BASE_TEMPLATE_OPTIONS.push({ id, template });\n  TEMPLATE_NAME_LABELS[template.name] = \"Template mới\";\n  TEMPLATE_NAME_LABELS_EN[template.name] = \"New template\";\n  bindTemplateToType(type, id);", source)

    def test_public_copy_does_not_reveal_admin_query_param(self):
        readme_vi = (SERVER_DIR.parent / "README.md").read_text(encoding="utf-8")
        readme_en = (SERVER_DIR.parent / "README_EN.md").read_text(encoding="utf-8")
        app_source = (SERVER_DIR.parent / "app.js").read_text(encoding="utf-8")

        self.assertNotIn("?role=admin", readme_vi)
        self.assertNotIn("?role=admin", readme_en)
        self.assertNotIn("Quyền Admin mở bằng tham số", app_source)
        self.assertNotIn("Internal admin access uses", app_source)

    def test_analyze_status_copy_mentions_expected_duration(self):
        source = (SERVER_DIR.parent / "app.js").read_text(encoding="utf-8")

        self.assertIn("Đang phân tích... tốn từ 1-2' tùy Brief", source)
        self.assertIn("Analyzing... takes 1-2 min depending on the brief", source)

    def test_replay_to_step_one_restores_home_actions(self):
        source = (SERVER_DIR.parent / "friendly-ui.js").read_text(encoding="utf-8")

        self.assertIn("function resetFriendlyStepOneActions()", source)
        self.assertIn("resetFriendlyStepOneActions();", source)
        for label in ("Tạo launch mới", "Sửa launch này", "Lưu launch", "Xóa launch", "Tổng hợp launch", "Hỗ trợ / giải thích", "Nạp Brief Mẫu", "Chạy phân tích", "Demo mode", "Export report", "Bài học"):
            self.assertIn(label, source)

    def test_channel_docs_create_launch_order_matches_bot_flow(self):
        doc = app.execute_launchops_tool("lcc_docs", {"topic": "workflow"})["doc"]

        self.assertIn("Tên Launch, owner, phân loại hợp lệ, template, trạng thái, xác nhận owner", doc)
        self.assertIn("Sửa trạng thái", doc)

    def test_pro_create_wizard_starts_from_name_and_removes_objective_step(self):
        source = (SERVER_DIR.parent / "app.js").read_text(encoding="utf-8")

        self.assertIn('step: "name"', source)
        self.assertNotIn('assistantWizard.step = "objective"', source)
        self.assertNotIn('wizard:create:field:objective', source)

    def test_pro_create_wizard_has_live_preview_sync_hook(self):
        source = (SERVER_DIR.parent / "app.js").read_text(encoding="utf-8")

        self.assertIn("function syncAssistantDraftPreview(draft)", source)
        self.assertIn("syncAssistantDraftPreview(draft);", source)

    def test_friendly_help_actions_route_create_edit_to_real_edit_flow(self):
        source = (SERVER_DIR.parent / "friendly-ui.js").read_text(encoding="utf-8")

        self.assertIn("{ label: 'Tạo/sửa launch', action: 'launch-flow-menu' }", source)
        self.assertIn("{ label: 'Giải thích flow', action: 'support-topic', value: 'flow' }", source)

    def test_assistant_lessons_branch_keeps_navigation_options(self):
        source = (SERVER_DIR.parent / "app.js").read_text(encoding="utf-8")

        self.assertIn('function assistantLaunchNavigationOptions(topic)', source)
        self.assertIn('if (value === "assistant:back") {', source)
        self.assertIn('if (value === "assistant:lessons") {', source)
        self.assertIn('options: assistantLaunchNavigationOptions("lessons")', source)
        self.assertIn('const currentActiveView = document.querySelector(".view.active")?.id || "briefView";', source)
        self.assertIn("previousLaunchView = currentActiveView;", source)

    def test_friendly_chat_inputs_default_to_multiline_rows(self):
        source = (SERVER_DIR.parent / "index.html").read_text(encoding="utf-8")

        self.assertIn('<textarea id="friendlyChatInput" rows="3"', source)
        self.assertIn('<textarea id="friendlyLessonChatInput" rows="3"', source)

    def test_friendly_quick_actions_echo_human_choice_for_type_template_and_status(self):
        source = (SERVER_DIR.parent / "friendly-ui.js").read_text(encoding="utf-8")

        self.assertIn("addChatMessage('human', quickActionLabelForSelectValue('launchType', value));", source)
        self.assertIn("addChatMessage('human', quickActionLabelForSelectValue('launchTemplate', value));", source)
        self.assertIn("addChatMessage('human', statusLabel(value));", source)

    def test_game_event_type_exposes_shop_and_login_templates(self):
        source = (SERVER_DIR.parent / "app.js").read_text(encoding="utf-8")

        self.assertIn('"In-Game Shop Commercial Playbook"', source)
        self.assertIn('"Login Streak Retention Playbook"', source)
        self.assertIn('"shopCommercial"', source)
        self.assertIn('"loginRetention"', source)
        self.assertIn('"Game event": ["gameEvent", "shopCommercial", "loginRetention"]', source)


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

class LessonReuseTests(unittest.TestCase):
    """Audit fix A: lessons saved after launch must actually feed the next analysis prompt,
    not just sit in the UI. build_prompt renders them and orchestrate wires them in."""

    LESSON_HEADER = "Bài học từ launch trước"

    def test_build_prompt_injects_saved_lessons(self):
        ctx = {"name": "Golden Spin", "type": "lucky_spin_event", "lessons": [
            {"id": "lesson-golden-spin-reset", "title": "Reset ngày", "lesson": "Golden Spin tháng 5 tạo ticket vì reset 05:00 không rõ.", "severity": "High"},
        ]}
        p = app.build_prompt("Golden Spin weekend", ctx, "checklist")
        self.assertIn(self.LESSON_HEADER, p)
        self.assertIn("reset 05:00", p.lower())

    def test_build_prompt_without_lessons_has_no_lesson_block(self):
        p = app.build_prompt("Golden Spin weekend", {"name": "x", "type": "y"}, "checklist")
        self.assertNotIn(self.LESSON_HEADER, p)

    def test_lessons_visible_to_every_agent_step(self):
        ctx = {"name": "Golden Spin", "type": "lucky_spin_event", "lessons": [
            {"title": "Chống farm", "lesson": "Tài khoản phụ farm lượt quay nếu thiếu eligibility."},
        ]}
        for step in ("readiness", "redteam", "checklist", "postmortem"):
            self.assertIn("farm lượt quay", app.build_prompt("brief", ctx, step), f"missing in {step}")

    def test_orchestrate_wires_recalled_lessons_into_launch_context(self):
        product_context = {
            "typeProfile": app.build_default_template(),
            "lessons": [{"id": "l1", "title": "Reset", "lesson": "reset 05:00 gây ticket CS"}],
            "launchType": "lucky_spin_event",
            "gameId": "demo_game",
            "memoryTrace": {},
        }
        captured = {}
        real_readiness = app.readiness_agent

        def spy(brief, launch_context=None, force_fast=False):
            captured["lessons"] = (launch_context or {}).get("lessons")
            return real_readiness(brief, launch_context, force_fast=force_fast)

        with patch.dict(os.environ, {"LAUNCHOPS_MEMORY_LLM_ENABLED": "false", "LAUNCHOPS_ORCHESTRATOR_LLM_ENABLED": "false"}, clear=False), \
                patch.object(app, "build_product_context", return_value=product_context), \
                patch.object(app, "readiness_agent", side_effect=spy):
            app.orchestrate_launchops_analysis("Golden Spin weekend brief", {}, force_fast=False)
        self.assertIsNotNone(captured["lessons"])
        self.assertEqual(captured["lessons"][0]["lesson"], "reset 05:00 gây ticket CS")


if __name__ == "__main__":
    unittest.main()
