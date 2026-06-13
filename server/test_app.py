import importlib
import json
import sys
import unittest
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

app = importlib.import_module("app")


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


if __name__ == "__main__":
    unittest.main()