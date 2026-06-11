from __future__ import annotations

import json
import os
import re
import sys
import time
import traceback
import unicodedata
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from db import find_lessons, get_product_snapshot, get_type_profile, list_launch_types


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("LAUNCHOPS_BACKEND_PORT", "8080")))
MAX_BODY_BYTES = 256 * 1024
APP_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = APP_ROOT.parent
LAUNCHES_DIR = APP_ROOT / "memory" / "launches"
LAUNCH_STATUSES = {"upcoming", "running", "completed"}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_dotenv() -> None:
    """Load local env files without printing secrets."""
    for env_path in (WORKSPACE_ROOT / ".env", APP_ROOT / ".env"):
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.lower()).strip("-")
    return slug[:72] or f"launch-{int(time.time())}"


def launch_file(launch_id: str) -> Path:
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,90}", launch_id):
        raise ValueError("Invalid launch id")
    return LAUNCHES_DIR / f"{launch_id}.json"


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    LAUNCHES_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(".tmp")
    tmp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_path.replace(path)


def normalize_status(value: Any) -> str:
    status = str(value or "upcoming").strip().lower()
    return status if status in LAUNCH_STATUSES else "upcoming"


def read_sample_brief() -> str:
    brief_path = APP_ROOT / "data" / "bad_launch_brief.md"
    if brief_path.exists():
        return brief_path.read_text(encoding="utf-8").strip()
    return "Bad launch brief máº«u: thiáº¿u rollback plan, thiáº¿u CS FAQ, thiáº¿u owner trá»±c, thiáº¿u guardrail reward."


def sample_decision(color: str, score: int, reason: str) -> dict[str, Any]:
    result = fallback_result("Dá»¯ liá»‡u máº«u Ä‘Ã£ lÆ°u trong Launch Workspace.")
    result["source"] = "memory_sample"
    result["decision"].update(
        {
            "color": color,
            "score": score,
            "title": "Saved launch analysis",
            "reason": reason,
        }
    )
    return result


def seed_launches_if_empty() -> None:
    LAUNCHES_DIR.mkdir(parents=True, exist_ok=True)
    if any(LAUNCHES_DIR.glob("*.json")):
        return

    created = now_iso()
    sample_brief = read_sample_brief()
    marketing_brief = """TÃªn launch: Midweek Top-up Campaign - chiáº¿n dá»‹ch náº¡p giá»¯a tuáº§n cho nhÃ³m ngÆ°á»i chÆ¡i tráº£ phÃ­ tháº¥p vÃ  trung bÃ¬nh.

Má»¥c tiÃªu: TÄƒng doanh thu gÃ³i náº¡p nhá» trong 4 ngÃ y, kÃ­ch hoáº¡t láº¡i ngÆ°á»i chÆ¡i cÃ³ lá»‹ch sá»­ náº¡p nhÆ°ng 14 ngÃ y gáº§n nháº¥t chÆ°a náº¡p.

Thá»i gian: Dá»± kiáº¿n cháº¡y tá»« 15/06/2026 Ä‘áº¿n 18/06/2026.

Äá»‘i tÆ°á»£ng: NgÆ°á»i chÆ¡i level 20 trá»Ÿ lÃªn, tá»«ng náº¡p trong 90 ngÃ y gáº§n nháº¥t, khÃ´ng thuá»™c nhÃ³m refund/abuse.

Offer: Náº¡p gÃ³i 99k hoáº·c 199k nháº­n thÃªm coupon vÃ  váº­t pháº©m tiÃªu hao. CÃ³ giá»›i háº¡n 1 láº§n/ngÃ y/ngÆ°á»i chÆ¡i.

KÃªnh truyá»n thÃ´ng: In-game popup, inbox, fanpage post vÃ  push notification.

Viá»‡c Ä‘Ã£ cÃ³:
- Growth phá»¥ trÃ¡ch target segment vÃ  tracking.
- Business phá»¥ trÃ¡ch ngÃ¢n sÃ¡ch Æ°u Ä‘Ã£i.
- LiveOps phá»¥ trÃ¡ch lá»‹ch cháº¡y trong game.

Váº¥n Ä‘á» cÃ²n má»Ÿ:
- ChÆ°a chá»‘t ngÃ¢n sÃ¡ch coupon tá»‘i Ä‘a.
- ChÆ°a cÃ³ guardrail náº¿u doanh thu tÄƒng nhÆ°ng refund cÅ©ng tÄƒng.
- ChÆ°a cÃ³ CS FAQ vá» Ä‘iá»u kiá»‡n nháº­n coupon.
- ChÆ°a chá»‘t dashboard theo dÃµi conversion, refund, coupon claim.
- ChÆ°a cÃ³ ngÆ°á»¡ng dá»«ng náº¿u coupon bá»‹ nháº­n sai hoáº·c claim trÃ¹ng.
- ChÆ°a chá»‘t post-campaign report sau 48 giá»."""
    may_brief = """TÃªn launch: May Login Streak - sá»± kiá»‡n Ä‘Äƒng nháº­p 7 ngÃ y liÃªn tiáº¿p trong thÃ¡ng 5.

Tráº¡ng thÃ¡i: ÄÃ£ cháº¡y xong tá»« 28/05/2026 Ä‘áº¿n 31/05/2026.

Má»¥c tiÃªu ban Ä‘áº§u:
- TÄƒng tá»· lá»‡ quay láº¡i game trong nhÃ³m ngÆ°á»i chÆ¡i casual.
- Khuyáº¿n khÃ­ch ngÆ°á»i chÆ¡i Ä‘Äƒng nháº­p Ä‘á»§ 7 ngÃ y Ä‘á»ƒ nháº­n reward cuá»‘i.
- Giá»¯ chi phÃ­ reward tháº¥p, khÃ´ng áº£nh hÆ°á»Ÿng economy.

Äá»‘i tÆ°á»£ng: NgÆ°á»i chÆ¡i level 10 trá»Ÿ lÃªn, khÃ´ng yÃªu cáº§u náº¡p.

CÆ¡ cháº¿: Má»—i ngÃ y Ä‘Äƒng nháº­p nháº­n má»™t pháº§n quÃ  nhá». Náº¿u Ä‘á»§ chuá»—i 7 ngÃ y, ngÆ°á»i chÆ¡i nháº­n thÃªm rÆ°Æ¡ng tá»•ng káº¿t.

Káº¿t quáº£ thá»±c táº¿:
- Login rate tÄƒng nháº¹ trong 2 ngÃ y Ä‘áº§u.
- Ticket CS tÄƒng trong 6 giá» Ä‘áº§u vÃ¬ má»™t sá»‘ ngÆ°á»i chÆ¡i hiá»ƒu nháº§m Ä‘iá»u kiá»‡n reset ngÃ y.
- Reward khÃ´ng vÆ°á»£t ngÃ¢n sÃ¡ch.
- KhÃ´ng cÃ³ lá»—i nghiÃªm trá»ng vá» há»‡ thá»‘ng.

Äiá»ƒm thiáº¿u khi chuáº©n bá»‹:
- FAQ cho CS cÃ³ nhÆ°ng chÆ°a giáº£i thÃ­ch rÃµ má»‘c reset ngÃ y.
- In-game message chÆ°a nÃ³i rÃµ Ä‘Äƒng nháº­p pháº£i liÃªn tá»¥c, khÃ´ng Ä‘Æ°á»£c bá» ngÃ y.
- ChÆ°a cÃ³ ngÆ°á»¡ng pause náº¿u há»‡ thá»‘ng ghi nháº­n login sai.
- Post-mortem ban Ä‘áº§u chÆ°a cÃ³ cÃ¢u há»i vá» hiá»ƒu nháº§m Ä‘iá»u kiá»‡n event."""
    samples = [
        {
            "id": "lucky-wheel-weekend",
            "name": "Lucky Wheel Weekend",
            "type": "Game event",
            "status": "running",
            "owner": "PM LiveOps",
            "targetDate": "2026-06-12",
            "endDate": "2026-06-14",
            "brief": sample_brief,
            "analyses": [],
            "postLaunchResult": "",
            "lessonsLearned": [],
            "createdAt": created,
            "updatedAt": created,
        },
        {
            "id": "midweek-topup-campaign",
            "name": "Midweek Top-up Campaign",
            "type": "Campaign marketing",
            "status": "upcoming",
            "owner": "Growth + Business",
            "targetDate": "2026-06-15",
            "endDate": "2026-06-18",
            "brief": marketing_brief,
            "analyses": [],
            "postLaunchResult": "",
            "lessonsLearned": [],
            "createdAt": created,
            "updatedAt": created,
        },
        {
            "id": "may-login-streak",
            "name": "May Login Streak",
            "type": "Game event",
            "status": "completed",
            "owner": "LiveOps Lead",
            "targetDate": "2026-05-28",
            "endDate": "2026-05-31",
            "brief": may_brief,
            "analyses": [
                {
                    "id": "analysis-sample-1",
                    "createdAt": created,
                    "briefSnapshot": may_brief[:2000],
                    "result": sample_decision(
                        "Yellow",
                        8,
                        "Sá»± kiá»‡n Ä‘áº¡t má»¥c tiÃªu giá»¯ chÃ¢n nháº¹ vÃ  khÃ´ng vÆ°á»£t ngÃ¢n sÃ¡ch, nhÆ°ng thÃ´ng Ä‘iá»‡p reset ngÃ y, FAQ CS vÃ  ngÆ°á»¡ng pause chÆ°a Ä‘á»§ rÃµ.",
                    ),
                }
            ],
            "postLaunchResult": "HoÃ n thÃ nh launch. Login rate tÄƒng nháº¹ trong 2 ngÃ y Ä‘áº§u, reward khÃ´ng vÆ°á»£t ngÃ¢n sÃ¡ch, nhÆ°ng ticket CS tÄƒng trong 6 giá» Ä‘áº§u vÃ¬ ngÆ°á»i chÆ¡i há»i má»‘c reset ngÃ y vÃ  Ä‘iá»u kiá»‡n giá»¯ chuá»—i.",
            "lessonsLearned": [
                {
                    "id": "lesson-sample-1",
                    "createdAt": created,
                    "text": "LuÃ´n viáº¿t rÃµ má»‘c reset ngÃ y, Ä‘iá»u kiá»‡n giá»¯ chuá»—i liÃªn tá»¥c vÃ  vÃ­ dá»¥ minh há»a trong in-game message.",
                },
                {
                    "id": "lesson-sample-2",
                    "createdAt": created,
                    "text": "CS FAQ pháº£i cÃ³ macro riÃªng cho case máº¥t chuá»—i, claim rÆ°Æ¡ng tá»•ng káº¿t vÃ  khiáº¿u náº¡i thiáº¿u reward.",
                }
            ],
            "createdAt": created,
            "updatedAt": created,
        },
    ]

    for launch in samples:
        write_json(launch_file(launch["id"]), launch)


def list_launches() -> list[dict[str, Any]]:
    seed_launches_if_empty()
    launches = []
    for path in sorted(LAUNCHES_DIR.glob("*.json")):
        try:
            launches.append(read_json(path))
        except (json.JSONDecodeError, OSError):
            write_backend_log(f"Skipped unreadable launch memory file: {path.name}")
    return launches


def summarize_launch(launch: dict[str, Any]) -> dict[str, Any]:
    analyses = launch.get("analyses") or []
    lessons = launch.get("lessonsLearned") or []
    latest_analysis = analyses[-1]["result"] if analyses else None
    decision = (latest_analysis or {}).get("decision") if isinstance(latest_analysis, dict) else None
    history_stamps = [
        item.get("createdAt")
        for item in [*analyses, *lessons]
        if isinstance(item, dict) and item.get("createdAt")
    ]
    return {
        "id": launch.get("id"),
        "name": launch.get("name"),
        "type": launch.get("type"),
        "status": normalize_status(launch.get("status")),
        "owner": launch.get("owner"),
        "targetDate": launch.get("targetDate"),
        "endDate": launch.get("endDate"),
        "updatedAt": launch.get("updatedAt"),
        "latestHistoryAt": max(history_stamps) if history_stamps else "",
        "analysisCount": len(analyses),
        "lessonCount": len(lessons),
        "templateName": (launch.get("template") or {}).get("name") if isinstance(launch.get("template"), dict) else "",
        "decision": decision,
    }


def get_launch(launch_id: str) -> dict[str, Any] | None:
    try:
        path = launch_file(launch_id)
    except ValueError:
        return None
    if not path.exists():
        return None
    return read_json(path)


def save_launch_payload(payload: dict[str, Any], existing_id: str | None = None) -> dict[str, Any]:
    incoming = payload.get("launch") if isinstance(payload.get("launch"), dict) else payload
    name = str(incoming.get("name") or "Launch má»›i").strip()
    launch_id = existing_id or str(incoming.get("id") or slugify(name)).strip()
    if existing_id is None:
        launch_id = slugify(launch_id)

    existing = get_launch(launch_id) or {}
    created = existing.get("createdAt") or now_iso()
    launch = {
        "id": launch_id,
        "name": name,
        "type": str(incoming.get("type") or existing.get("type") or "Game event").strip(),
        "status": normalize_status(incoming.get("status") or existing.get("status")),
        "owner": str(incoming.get("owner") or existing.get("owner") or "").strip(),
        "targetDate": str(incoming.get("targetDate") or existing.get("targetDate") or "").strip(),
        "endDate": str(incoming.get("endDate") or existing.get("endDate") or "").strip(),
        "brief": str(incoming.get("brief") or existing.get("brief") or "").strip(),
        "template": incoming.get("template") if isinstance(incoming.get("template"), dict) else existing.get("template"),
        "templateVersions": incoming.get("templateVersions") if isinstance(incoming.get("templateVersions"), list) else existing.get("templateVersions") or [],
        "lessonSuggestions": incoming.get("lessonSuggestions") if isinstance(incoming.get("lessonSuggestions"), list) else existing.get("lessonSuggestions") or [],
        "analyses": existing.get("analyses") or [],
        "postLaunchResult": str(incoming.get("postLaunchResult") or existing.get("postLaunchResult") or "").strip(),
        "lessonsLearned": existing.get("lessonsLearned") or [],
        "createdAt": created,
        "updatedAt": now_iso(),
    }
    write_json(launch_file(launch_id), launch)
    return launch


def append_analysis(launch: dict[str, Any], result: dict[str, Any], brief: str) -> dict[str, Any]:
    analyses = launch.get("analyses") or []
    stamp = now_iso()
    analyses.append(
        {
            "id": f"analysis-{int(time.time() * 1000)}",
            "createdAt": stamp,
            "briefSnapshot": brief[:2000],
            "result": result,
        }
    )
    launch["analyses"] = analyses
    launch["brief"] = brief
    launch["updatedAt"] = stamp
    write_json(launch_file(str(launch["id"])), launch)
    return launch


def save_post_result(launch: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    launch["status"] = normalize_status(payload.get("status") or launch.get("status") or "completed")
    launch["postLaunchResult"] = str(payload.get("postLaunchResult") or launch.get("postLaunchResult") or "").strip()
    lesson = str(payload.get("lesson") or "").strip()
    if lesson:
        lessons = launch.get("lessonsLearned") or []
        lessons.append({"id": f"lesson-{int(time.time() * 1000)}", "createdAt": now_iso(), "text": lesson})
        launch["lessonsLearned"] = lessons
    launch["updatedAt"] = now_iso()
    write_json(launch_file(str(launch["id"])), launch)
    return launch


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    handler.end_headers()
    handler.wfile.write(body)


def fallback_result(reason: str) -> dict[str, Any]:
    return {
        "source": "fallback",
        "warning": reason,
        "trace": [],
        "decision": {
            "color": "Yellow",
            "score": 8,
            "maxScore": 12,
            "title": "Ch?a n?n launch ngay",
            "reason": "?ang d?ng fallback local v? API ch?a s?n s?ng ho?c tr? l?i.",
        },
        "riskBreakdown": [
            {"label": "M?c ti?u v? scope", "score": 1, "maxScore": 2, "missing": "M?c ti?u, ??i t??ng ho?c scope c?n m? h?."},
            {"label": "Owner v? deadline", "score": 1, "maxScore": 2, "missing": "Ch?a th?y owner/deadline r? cho c?c nh?m."},
            {"label": "Tech readiness", "score": 2, "maxScore": 2, "missing": "?n cho demo brief."},
            {"label": "User impact", "score": 2, "maxScore": 2, "missing": "?n cho demo brief."},
            {"label": "Business v? reward", "score": 1, "maxScore": 2, "missing": "Reward, t? l? ho?c ng?n s?ch ch?a ?? guardrail."},
            {"label": "Learning v? post-mortem", "score": 1, "maxScore": 2, "missing": "Ch?a c? k? ho?ch h?c l?i sau launch."},
        ],
        "topRisks": [
            "M?c ti?u, ??i t??ng ho?c scope c?n m? h?.",
            "Ch?a th?y owner/deadline r? cho c?c nh?m.",
            "Reward, t? l? ho?c ng?n s?ch ch?a ?? guardrail.",
        ],
        "redTeam": [
            {
                "persona": "Angry user",
                "worry": "Ng??i ch?i b? l?i quay th??ng ho?c kh?ng nh?n qu? s? ph?n n?n nhanh.",
                "evidence": "Brief ch?a c? FAQ v? c?ch x? l? n?u kh?ng nh?n ph?n th??ng.",
                "fix": "T?o CS FAQ, th?ng ?i?p in-game, v? rule b?i th??ng n?u h? th?ng l?i.",
            },
            {
                "persona": "Exploit hunter",
                "worry": "Ng??i ch?i c? th? t?m c?ch farm l??t quay ho?c l?i d?ng ?i?u ki?n n?p.",
                "evidence": "Brief ghi t?t c? ng??i ch?i nh?ng ch?a r? ?i?u ki?n ng??i m?i/c? v? gi?i h?n.",
                "fix": "Ch?t ?i?u ki?n tham gia, gi?i h?n l??t m?i ng?y, v? log b?t th??ng.",
            },
            {
                "persona": "CS lead",
                "worry": "CS thi?u macro v? t?nh hu?ng escalation s? x? l? ch?m.",
                "evidence": "Ch?a c? b? c?u tr? l?i chu?n cho ticket ph?t sinh.",
                "fix": "Vi?t CS macro, ph?n c?p ticket v? timeline ph?n h?i.",
            },
            {
                "persona": "Tech on-call",
                "worry": "Kh?ng c? rollback/feature flag th? l?i production kh? c?u.",
                "evidence": "Kh?ng th?y rollback plan hay alerting r?.",
                "fix": "Th?m feature flag, rollback trigger v? monitor t?i thi?u.",
            },
            {
                "persona": "Business owner",
                "worry": "Campaign t?t nh?ng kh?ng ?o ???c ROI th? kh? duy?t.",
                "evidence": "Brief ch?a g?n KPI sau launch ho?c guardrail ng?n s?ch.",
                "fix": "Ch?t KPI, ng?n s?ch, v? ti?u ch? success tr??c launch.",
            },
        ],
        "checklist": [
            {"task": "Ch?t scope, ??i t??ng, KPI th?nh c?ng", "owner": "PM LiveOps", "deadline": "T-2 ng?y", "status": "Todo", "priority": "High"},
            {"task": "Vi?t CS FAQ v? macro tr? l?i", "owner": "CS Lead", "deadline": "T-1 ng?y", "status": "Todo", "priority": "High"},
            {"task": "Chu?n b? rollback plan v? feature flag", "owner": "Tech Lead", "deadline": "T-1 ng?y", "status": "Todo", "priority": "High"},
            {"task": "Ch?t ng?n s?ch, reward guardrail", "owner": "Business Owner", "deadline": "Launch day", "status": "Todo", "priority": "Medium"},
            {"task": "T?o monitoring dashboard sau launch", "owner": "Data/BI", "deadline": "T+48h", "status": "Todo", "priority": "Medium"},
            {"task": "Review legal/compliance copy", "owner": "Legal/Compliance", "deadline": "T-1 ng?y", "status": "Todo", "priority": "Low"},
            {"task": "Brief n?i b? cho team v?n h?nh", "owner": "Ops", "deadline": "T-1 ng?y", "status": "Todo", "priority": "Low"},
            {"task": "Post-launch recap v? lesson learned", "owner": "PM LiveOps", "deadline": "T+48h", "status": "Todo", "priority": "Medium"},
        ],
        "postmortem": [
            {"title": "C?u h?i sau launch", "items": ["M?c ti?u ban ??u c? ??t kh?ng?", "R?i ro n?o ?? ???c b?t ??ng tr??c launch?", "?i?m n?o c?n th?m guardrail?"]},
            {"title": "Metrics c?n ?i?n", "items": ["DAU / login rate", "S? ticket CS v? lo?i ticket", "ROI / conversion"]},
            {"title": "Action items", "items": ["Ch?t lesson t?t nh?t", "??a lesson v?o template l?n sau", "C?p nh?t checklist g?c"]},
        ],
    }


def _base_trace(mode: str, reason: str) -> list[dict[str, Any]]:
    return [{"agent": mode, "status": "ok", "reason": reason, "source": "rule"}]


def build_default_template() -> dict[str, Any]:
    return {
        "name": "Default LaunchOps Template",
        "type": "generic",
        "riskGroups": [
            {"label": "M?c ti?u v? scope", "maxScore": 2},
            {"label": "Owner v? deadline", "maxScore": 2},
            {"label": "Tech readiness", "maxScore": 2},
            {"label": "User impact", "maxScore": 2},
            {"label": "Business v? reward", "maxScore": 2},
            {"label": "Learning v? post-mortem", "maxScore": 2},
        ],
        "redTeamPersonas": ["Angry user", "Exploit hunter", "CS lead", "Tech on-call", "Business owner"],
        "checklistExamples": ["Ch?t scope", "Vi?t FAQ", "Chu?n b? rollback", "Theo d?i KPI"],
        "postmortemBlocks": ["C?u h?i sau launch", "Metrics c?n ?i?n", "Action items"],
        "maxScore": 12,
    }


def normalize_template(launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    launch_context = launch_context or {}
    template = launch_context.get("template") if isinstance(launch_context.get("template"), dict) else {}
    profile = launch_context.get("typeProfile") if isinstance(launch_context.get("typeProfile"), dict) else {}
    if template:
        return template
    if profile:
        return profile
    return build_default_template()



def infer_launch_type(brief: str, launch_context: dict[str, Any] | None = None) -> str:
    launch_context = launch_context or {}
    explicit_type = str(launch_context.get("type") or "").strip().lower()
    known_types = {"game_event_h5", "marketing", "webshop_promotion"}
    if explicit_type in known_types:
        return explicit_type
    brief_text = f"{launch_context.get('brief', '')}\n{brief}".lower()
    if any(keyword in brief_text for keyword in ['webshop', 'nap goi', 'nạp', 'promotion web', 'shop', 'top-up']):
        return 'webshop_promotion'
    if any(keyword in brief_text for keyword in ['marketing', 'campaign', 'ads', 'utm', 'acquisition']):
        return 'marketing'
    return 'game_event_h5'


def build_product_context(brief: str, launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    launch_context = launch_context or {}
    launch_type = infer_launch_type(brief, launch_context)
    game_id = str(launch_context.get('gameId') or launch_context.get('game_id') or 'demo_game')
    snapshot = get_product_snapshot(game_id, launch_type)
    lessons = find_lessons(brief, launch_type, game_id=game_id, limit=3)
    return {
        'gameId': game_id,
        'launchType': launch_type,
        'typeProfile': get_type_profile(launch_type) or build_default_template(),
        'availableTypes': list_launch_types(),
        'snapshot': snapshot,
        'lessons': lessons,
        'productHealth': {
            'status': 'watch' if launch_type == 'game_event_h5' else 'info',
            'findings': (snapshot or {}).get('hotFindings', [])[:3] if snapshot else [],
        },
    }

def readiness_agent(brief: str, launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    template = normalize_template(launch_context)
    if truthy_env("LAUNCHOPS_LLM_ENABLED"):
        result = call_llm(brief, {**(launch_context or {}), "template": template}, "readiness")
    else:
        result = fallback_result("Readiness agent rule-based.")
        result["trace"] = _base_trace("readiness", "rule-based readiness")
    result = apply_deterministic_readiness(result, brief, {**(launch_context or {}), "template": template})
    result["trace"].append({"agent": "readiness", "status": "ok", "score": result["decision"]["score"], "color": result["decision"]["color"], "llm": public_llm_config("readiness")})
    return result

def red_team_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    template = normalize_template(launch_context)
    brief = str((launch_context or {}).get("brief") or "")
    if truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
        llm_result = call_llm(brief, launch_context, "redteam")
        if isinstance(llm_result.get("redTeam"), list) and len(llm_result["redTeam"]) >= 5:
            result["redTeam"] = llm_result["redTeam"][:5]
            result.setdefault("trace", []).append({"agent": "red_team", "status": "ok", "source": "llm", "llm": public_llm_config("redteam")})
            return result
    personas = template.get("redTeamPersonas") if isinstance(template.get("redTeamPersonas"), list) else []
    if len(personas) < 5:
        personas = build_default_template()["redTeamPersonas"]
    red_team = []
    for persona in personas[:5]:
        red_team.append({
            "persona": persona,
            "worry": f"{persona} lo brief c?n h?ng guardrail.",
            "evidence": "D?a tr?n riskBreakdown v? n?i dung brief.",
            "fix": "B? sung guardrail, owner v? rollback plan.",
        })
    result["redTeam"] = red_team
    result.setdefault("trace", []).append({"agent": "red_team", "status": "ok", "cards": len(red_team), "llm": public_llm_config("redteam")})
    return result

def checklist_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    brief = str((launch_context or {}).get("brief") or "")
    if truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
        llm_result = call_llm(brief, launch_context, "checklist")
        if isinstance(llm_result.get("checklist"), list) and len(llm_result["checklist"]) >= 5:
            result["checklist"] = llm_result["checklist"]
            result.setdefault("trace", []).append({"agent": "checklist", "status": "ok", "source": "llm", "llm": public_llm_config("checklist")})
            return result
    result["checklist"] = [
        {"task": "Ch?t scope, ??i t??ng, KPI th?nh c?ng", "owner": "PM LiveOps", "deadline": "T-2 ng?y", "status": "Todo", "priority": "High"},
        {"task": "Vi?t CS FAQ v? macro tr? l?i", "owner": "CS Lead", "deadline": "T-1 ng?y", "status": "Todo", "priority": "High"},
        {"task": "Chu?n b? rollback plan v? feature flag", "owner": "Tech Lead", "deadline": "T-1 ng?y", "status": "Todo", "priority": "High"},
        {"task": "Ki?m tra ng?n s?ch, reward guardrail", "owner": "Business Owner", "deadline": "Launch day", "status": "Todo", "priority": "Medium"},
        {"task": "Theo d?i KPI sau launch", "owner": "Data/BI", "deadline": "T+48h", "status": "Todo", "priority": "Medium"},
        {"task": "Review copy n?i b?", "owner": "Ops", "deadline": "T-1 ng?y", "status": "Todo", "priority": "Low"},
        {"task": "Chu?n b? escalation path", "owner": "CS Lead", "deadline": "T-1 ng?y", "status": "Todo", "priority": "Low"},
        {"task": "Post-launch recap", "owner": "PM LiveOps", "deadline": "T+48h", "status": "Todo", "priority": "Medium"},
    ]
    result.setdefault("trace", []).append({"agent": "checklist", "status": "ok", "tasks": len(result["checklist"]), "llm": public_llm_config("checklist")})
    return result

def postmortem_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    brief = str((launch_context or {}).get("brief") or "")
    if truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
        llm_result = call_llm(brief, launch_context, "postmortem")
        if isinstance(llm_result.get("postmortem"), list) and len(llm_result["postmortem"]) >= 3:
            result["postmortem"] = llm_result["postmortem"]
            result.setdefault("trace", []).append({"agent": "postmortem", "status": "ok", "source": "llm", "llm": public_llm_config("postmortem")})
            return result
    result["postmortem"] = [
        {"title": "C?u h?i sau launch", "items": ["M?c ti?u ban ??u c? ??t kh?ng?", "R?i ro n?o ?? ???c b?t ??ng tr??c launch?", "?i?m n?o c?n th?m guardrail?"]},
        {"title": "Metrics c?n ?i?n", "items": ["DAU / login rate", "S? ticket CS v? lo?i ticket", "ROI / conversion"]},
        {"title": "Action items", "items": ["Ch?t lesson t?t nh?t", "??a lesson v?o template l?n sau", "C?p nh?t checklist g?c"]},
    ]
    result.setdefault("trace", []).append({"agent": "postmortem", "status": "ok", "blocks": len(result["postmortem"]), "llm": public_llm_config("postmortem")})
    return result

def orchestrate_launchops_analysis(brief: str, launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    launch_context = launch_context or {}
    product_context = build_product_context(brief, launch_context)
    launch_context = {**launch_context, "brief": brief, "template": product_context.get("typeProfile") or build_default_template(), "productContext": product_context}
    result = readiness_agent(brief, launch_context)
    result["productContext"] = product_context
    result = red_team_agent(result, launch_context)
    result = checklist_agent(result, launch_context)
    result = postmortem_agent(result, launch_context)
    result["agentsTrace"] = result.get("trace", [])
    result["source"] = result.get("source", "rule")
    result["llmRouting"] = {
        "readiness": public_llm_config("readiness"),
        "redteam": public_llm_config("redteam"),
        "checklist": public_llm_config("checklist"),
        "postmortem": public_llm_config("postmortem"),
    }
    return result

def write_backend_log(message: str) -> None:
    log_path = Path(__file__).resolve().parent / "backend.log"
    with log_path.open("a", encoding="utf-8") as log_file:
        log_file.write(message.rstrip() + "\n")


def template_prompt_context(template: dict[str, Any]) -> dict[str, Any]:
    risk_groups = template.get("riskGroups") if isinstance(template.get("riskGroups"), list) else []
    red_team = template.get("redTeam") if isinstance(template.get("redTeam"), list) else []
    checklist = template.get("checklist") if isinstance(template.get("checklist"), list) else []
    postmortem = template.get("postmortem") if isinstance(template.get("postmortem"), list) else []
    max_score = sum(int(group.get("maxScore") or 2) for group in risk_groups if isinstance(group, dict)) or 12
    return {
        "name": str(template.get("name") or "Template máº·c Ä‘á»‹nh"),
        "description": str(template.get("description") or ""),
        "maxScore": max_score,
        "riskGroups": [
            {
                "key": str(group.get("key") or ""),
                "label": str(group.get("label") or "NhÃ³m rá»§i ro"),
                "maxScore": int(group.get("maxScore") or 2),
                "checks": group.get("checks") if isinstance(group.get("checks"), list) else [],
                "requirements": group.get("requirements") if isinstance(group.get("requirements"), list) else [],
                "missingHint": str(group.get("missing") or ""),
            }
            for group in risk_groups
            if isinstance(group, dict)
        ],
        "redTeamPersonas": [
            str(item.get("persona") or "Reviewer")
            for item in red_team
            if isinstance(item, dict)
        ],
        "checklistExamples": [
            {
                "task": str(item.get("task") or ""),
                "owner": str(item.get("owner") or ""),
                "deadline": str(item.get("deadline") or ""),
                "priority": str(item.get("priority") or "Medium"),
            }
            for item in checklist
            if isinstance(item, dict)
        ],
        "postmortemBlocks": [
            {
                "title": str(block.get("title") or "BÃ i há»c"),
                "items": block.get("items") if isinstance(block.get("items"), list) else [],
            }
            for block in postmortem
            if isinstance(block, dict)
        ],
    }


def build_prompt(brief: str, launch_context: dict[str, Any] | None = None) -> str:
    launch_context = launch_context or {}
    launch_name = str(launch_context.get("name") or "ChÆ°a Ä‘áº·t tÃªn")
    launch_type = str(launch_context.get("type") or "ChÆ°a phÃ¢n loáº¡i")
    launch_status = str(launch_context.get("status") or "upcoming")
    owner = str(launch_context.get("owner") or "ChÆ°a rÃµ owner")
    target_date = str(launch_context.get("targetDate") or "ChÆ°a rÃµ ngÃ y launch")
    end_date = str(launch_context.get("endDate") or "ChÆ°a rÃµ ngÃ y káº¿t thÃºc")
    template = launch_context.get("template") if isinstance(launch_context.get("template"), dict) else {}
    template_context = template_prompt_context(template)
    risk_schema = [
        {"label": group["label"], "score": 0, "maxScore": group["maxScore"], "missing": "string"}
        for group in template_context["riskGroups"]
    ]
    red_team_schema = [
        {"persona": persona, "worry": "string", "evidence": "string", "fix": "string"}
        for persona in template_context["redTeamPersonas"]
    ]

    return f"""
Báº¡n lÃ  LaunchOps Command Center, má»™t Super Agent giÃºp team kiá»ƒm tra rá»§i ro trÆ°á»›c launch.

HÃ£y Ä‘á»c metadata + launch brief + template cáº¥u hÃ¬nh vÃ  chá»‰ tráº£ vá» JSON há»£p lá»‡, khÃ´ng markdown, khÃ´ng giáº£i thÃ­ch ngoÃ i JSON.

Metadata cá»§a launch:
- TÃªn launch: {launch_name}
- Loáº¡i launch: {launch_type}
- Tráº¡ng thÃ¡i hiá»‡n táº¡i: {launch_status}
- Owner: {owner}
- Start Launch: {target_date}
- End Launch: {end_date}

Template Ä‘ang dÃ¹ng:
{json.dumps(template_context, ensure_ascii=False, indent=2)}

Luáº­t ráº¥t quan trá»ng:
- Chá»‰ cháº¥m theo riskGroups trong template, khÃ´ng tá»± thÃªm nhÃ³m ngoÃ i template.
- Äiá»ƒm readiness cuá»‘i cÃ¹ng sáº½ Ä‘Æ°á»£c backend tÃ­nh láº¡i báº±ng scoring rule cá»‘ Ä‘á»‹nh. AI chá»‰ cáº§n giáº£i thÃ­ch rá»§i ro theo cÃ¹ng riskGroups.
- Náº¿u váº«n tráº£ score, chá»‰ dÃ¹ng sá»‘ nguyÃªn tá»« 0 Ä‘áº¿n maxScore cá»§a tá»«ng nhÃ³m; khÃ´ng dÃ¹ng Ä‘iá»ƒm láº».
- decision.maxScore pháº£i báº±ng tá»•ng maxScore cá»§a riskGroups: {template_context["maxScore"]}.
- riskBreakdown pháº£i cÃ³ Ä‘Ãºng cÃ¡c label trong riskGroups.
- redTeam pháº£i dÃ¹ng Ä‘Ãºng cÃ¡c persona trong redTeamPersonas. KhÃ´ng Ä‘Æ°á»£c tá»± thÃªm persona ngoÃ i template.
- checklist nÃªn bÃ¡m checklistExamples nhÆ°ng cÃ³ thá»ƒ bá»• sung chi tiáº¿t tá»« brief.
- postmortem nÃªn bÃ¡m postmortemBlocks.
- Green/Yellow/Red tÃ­nh theo tá»· lá»‡ Ä‘iá»ƒm: Green >= 80%, Yellow >= 50%, Red < 50%.

Schema báº¯t buá»™c:
{{
  "decision": {{
    "color": "Green|Yellow|Red",
    "score": 0,
    "maxScore": {template_context["maxScore"]},
    "title": "string",
    "reason": "string"
  }},
  "riskBreakdown": {json.dumps(risk_schema, ensure_ascii=False)},
  "topRisks": ["string", "string", "string"],
  "redTeam": {json.dumps(red_team_schema, ensure_ascii=False)},
  "checklist": [
    {{"task": "string", "owner": "string", "deadline": "T-2|T-1|Launch day|T+48h", "status": "Todo", "priority": "High|Medium|Low"}}
  ],
  "postmortem": [
    {{"title": "string", "items": ["string"]}}
  ]
}}

Launch brief:
{brief}
""".strip()


def chat_completions_url(base_url: str) -> str:
    clean = base_url.rstrip("/")
    if clean.endswith("/chat/completions"):
        return clean
    if clean.endswith("/v1"):
        return f"{clean}/chat/completions"
    return f"{clean}/v1/chat/completions"


def extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    if not cleaned.startswith("{"):
        match = re.search(r"\{.*\}", cleaned, flags=re.S)
        if match:
            cleaned = match.group(0)
    return json.loads(cleaned)


def decode_request_body(raw: bytes) -> str:
    """Accept common PowerShell/body encodings without exposing request content."""
    for encoding in ("utf-8", "utf-8-sig", "utf-16", "utf-16-le"):
        try:
            decoded = raw.decode(encoding)
        except UnicodeDecodeError:
            continue
        if decoded.strip():
            return decoded
    return raw.decode("utf-8", errors="replace")


NEGATIVE_MARKERS = (
    "chua co",
    "chua chot",
    "chua ro",
    "chua thay",
    "thieu",
    "khong co",
    "con mo",
    "chua du",
    "not yet",
    "missing",
    "unclear",
)

GROUP_KEYWORD_ALIASES = {
    "scope": ["muc tieu", "doi tuong", "pham vi", "kpi"],
    "owner": ["owner", "phu trach", "lead", "nguoi duyet", "deadline"],
    "execution": ["ke hoach", "timeline", "rollout", "trien khai", "thoi gian"],
    "support": ["faq", "support", "cs", "truyen thong", "thong diep", "kenh ho tro"],
    "risk": ["risk", "rui ro", "rollback", "fallback", "pause", "guardrail", "nguong dung", "dashboard", "monitoring", "refund"],
    "learning": ["lesson", "postmortem", "post-mortem", "post campaign", "post-campaign", "metric", "bao cao", "report"],
    "tech": ["tech", "technical", "qa", "test", "rollback", "feature flag", "monitoring", "crash", "api"],
    "user": ["user", "nguoi choi", "impact", "cs", "ticket", "faq", "thong bao", "message"],
    "business": ["business", "reward", "budget", "ngan sach", "roi", "revenue", "kpi", "conversion"],
    "product_health": ["dau", "crash", "ticket", "payment", "latency", "product", "health"],
    "abuse": ["exploit", "abuse", "fraud", "farm", "limit", "guardrail"],
    "payment": ["payment", "nap", "order", "fulfillment", "refund", "reconcile"],
    "inventory": ["inventory", "pricing", "stock", "package", "bundle"],
    "channel": ["channel", "ads", "utm", "creative", "landing"],
    "audience": ["audience", "message", "persona", "segment", "target"],
}

CRITICAL_NEGATIVE_KEYS = {"support", "risk", "learning", "rollback", "monitoring", "security", "user"}


def normalize_for_match(value: Any) -> str:
    normalized = unicodedata.normalize("NFD", str(value or "").lower().replace("Ä‘", "d"))
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_value).strip()


def group_key(group: dict[str, Any]) -> str:
    explicit_key = normalize_for_match(group.get("key"))
    if explicit_key:
        return explicit_key
    label = normalize_for_match(group.get("label"))
    if "muc tieu" in label or "scope" in label or "pham vi" in label:
        return "scope"
    if "owner" in label or "phu trach" in label or "deadline" in label:
        return "owner"
    if "trien khai" in label or "ke hoach" in label or "execution" in label:
        return "execution"
    if "tech" in label or "technical" in label or "san sang" in label:
        return "tech"
    if "user" in label or "impact" in label or "nguoi choi" in label:
        return "user"
    if "business" in label or "reward" in label or "budget" in label or "roi" in label:
        return "business"
    if "product" in label or "health" in label:
        return "product_health"
    if "exploit" in label or "abuse" in label or "fraud" in label:
        return "abuse"
    if "cs" in label or "van hanh" in label or "support" in label or "truyen thong" in label:
        return "support"
    if "payment" in label or "fulfillment" in label:
        return "payment"
    if "inventory" in label or "pricing" in label:
        return "inventory"
    if "channel" in label:
        return "channel"
    if "audience" in label or "message" in label:
        return "audience"
    if "rui ro" in label or "risk" in label or "rollback" in label or "quay lai" in label:
        return "risk"
    if "hoc" in label or "learning" in label or "post" in label:
        return "learning"
    return label


def deterministic_keywords(group: dict[str, Any]) -> list[str]:
    key = group_key(group)
    raw_keywords: list[Any] = []
    raw_keywords.extend(group.get("checks") if isinstance(group.get("checks"), list) else [])
    raw_keywords.extend(group.get("requirements") if isinstance(group.get("requirements"), list) else [])
    raw_keywords.append(group.get("label") or "")
    raw_keywords.extend(GROUP_KEYWORD_ALIASES.get(key, []))

    keywords: list[str] = []
    for keyword in raw_keywords:
        clean = normalize_for_match(keyword)
        if clean and clean not in keywords:
            keywords.append(clean)
    return keywords


def line_has_negative_marker(line: str) -> bool:
    return any(marker in line for marker in NEGATIVE_MARKERS)


def deterministic_risk_breakdown(brief: str, template: dict[str, Any]) -> list[dict[str, Any]]:
    risk_groups = template.get("riskGroups") if isinstance(template.get("riskGroups"), list) else []
    normalized_lines = [
        normalize_for_match(line)
        for line in str(brief or "").splitlines()
        if normalize_for_match(line)
    ]
    normalized_text = "\n".join(normalized_lines)
    breakdown: list[dict[str, Any]] = []

    for group in risk_groups:
        if not isinstance(group, dict):
            continue
        key = group_key(group)
        label = str(group.get("label") or "NhÃ³m rá»§i ro")
        max_score = max(1, int(group.get("maxScore") or 2))
        keywords = deterministic_keywords(group)
        positive_hits = 0
        negative_lines: list[str] = []

        for keyword in keywords:
            if not keyword:
                continue
            matching_lines = [line for line in normalized_lines if keyword in line]
            if any(line_has_negative_marker(line) for line in matching_lines):
                negative_lines.extend([line for line in matching_lines if line_has_negative_marker(line)])
            if any(not line_has_negative_marker(line) for line in matching_lines):
                positive_hits += 1

        full_threshold = min(2, max(1, len(keywords)))
        if positive_hits >= full_threshold:
            score = max_score
        elif positive_hits > 0:
            score = max(1, max_score // 2)
        else:
            score = 0

        if negative_lines:
            if key in CRITICAL_NEGATIVE_KEYS:
                score = 0
            else:
                score = min(score, max(0, max_score - 1))

        if score >= max_score:
            missing = "Äá»§ báº±ng chá»©ng trong brief cho nhÃ³m nÃ y."
        elif negative_lines:
            missing = str(group.get("missing") or "Brief cÃ³ nháº¯c tá»›i nhÆ°ng váº«n cÃ²n Ä‘iá»ƒm chÆ°a chá»‘t.")
        elif positive_hits:
            missing = str(group.get("missing") or "CÃ³ nháº¯c tá»›i, nhÆ°ng chÆ°a Ä‘á»§ chi tiáº¿t Ä‘á»ƒ cháº¥m trá»n Ä‘iá»ƒm.")
        else:
            missing = str(group.get("missing") or "ChÆ°a tháº¥y Ä‘á»§ báº±ng chá»©ng trong brief.")

        breakdown.append({
            "label": label,
            "score": score,
            "maxScore": max_score,
            "missing": missing,
        })

    if breakdown:
        return breakdown

    # Fallback if a malformed launch omits template.riskGroups.
    return [
        {"label": item["label"], "score": item["score"], "maxScore": item["maxScore"], "missing": item["missing"]}
        for item in fallback_result("Template thiáº¿u riskGroups.")["riskBreakdown"]
    ]


def color_from_score(score: int, max_score: int) -> str:
    ratio = score / max_score if max_score else 0
    if ratio >= 0.8:
        return "Green"
    if ratio >= 0.5:
        return "Yellow"
    return "Red"


def apply_deterministic_readiness(result: dict[str, Any], brief: str, launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    launch_context = launch_context or {}
    template = launch_context.get("template") if isinstance(launch_context.get("template"), dict) else {}
    breakdown = deterministic_risk_breakdown(brief, template)
    total = sum(int(item.get("score") or 0) for item in breakdown)
    max_score = sum(int(item.get("maxScore") or 0) for item in breakdown) or 12
    color = color_from_score(total, max_score)

    current_decision = result.get("decision") if isinstance(result.get("decision"), dict) else {}
    result["decision"] = {
        "color": color,
        "score": total,
        "maxScore": max_score,
        "title": current_decision.get("title") or ("CÃ³ thá»ƒ tiáº¿p tá»¥c chuáº©n bá»‹" if color != "Red" else "ChÆ°a Ä‘á»§ an toÃ n Ä‘á»ƒ launch"),
        "reason": (
            "Äiá»ƒm readiness Ä‘Æ°á»£c tÃ­nh báº±ng rule cá»‘ Ä‘á»‹nh theo template, nÃªn cÃ¹ng brief + template sáº½ luÃ´n ra cÃ¹ng Ä‘iá»ƒm. "
            + str(current_decision.get("reason") or "")
        ).strip(),
    }
    result["riskBreakdown"] = breakdown

    deterministic_risks = [
        f"{item['label']}: {item['missing']}"
        for item in breakdown
        if int(item.get("score") or 0) < int(item.get("maxScore") or 0)
    ][:3]
    if deterministic_risks:
        result["topRisks"] = deterministic_risks
    result["scoreSource"] = "deterministic_rule"
    return result


def truthy_env(name: str, default: str = "") -> bool:
    value = os.getenv(name, default).strip().lower()
    return value in {"1", "true", "yes", "on"}

def first_env(*names: str) -> str:
    for name in names:
        value = os.getenv(name, "").strip()
        if value:
            return value
    return ""

def llm_timeout_seconds() -> int:
    raw = first_env("LAUNCHOPS_LLM_TIMEOUT_SECONDS", "LAUNCHOPS_TIMEOUT_SECONDS", "LLM_TIMEOUT_SECONDS") or "60"
    try:
        return int(raw)
    except ValueError:
        return 60

def normalize_agent_step(agent_step: str | None) -> str:
    normalized = re.sub(r"[^A-Z0-9]+", "_", str(agent_step or "default").upper()).strip("_")
    return normalized or "DEFAULT"

def llm_config_for_step(agent_step: str | None = None) -> dict[str, str]:
    step = normalize_agent_step(agent_step)
    provider = first_env(f"LAUNCHOPS_PROVIDER_{step}", "LAUNCHOPS_PROVIDER_DEFAULT") or "agentbase"
    provider_key = normalize_agent_step(provider)
    api_key = first_env(
        f"LAUNCHOPS_{provider_key}_API_KEY",
        "LAUNCHOPS_AGENTBASE_API_KEY",
        "LAUNCHOPS_AIP_API_KEY",
        "LAUNCHOPS_LLM_API_KEY",
        "LLM_API_KEY",
    )
    base_url = first_env(
        f"LAUNCHOPS_{provider_key}_BASE_URL",
        "LAUNCHOPS_AGENTBASE_BASE_URL",
        "LAUNCHOPS_AIP_BASE_URL",
        "LAUNCHOPS_LLM_BASE_URL",
        "LLM_BASE_URL",
    )
    model = first_env(
        f"LAUNCHOPS_MODEL_{step}",
        f"LAUNCHOPS_{provider_key}_MODEL_{step}",
        f"LAUNCHOPS_{provider_key}_MODEL",
        "LAUNCHOPS_MODEL_DEFAULT",
        "LAUNCHOPS_LLM_MODEL",
        "LLM_MODEL",
    )
    return {
        "provider": provider,
        "providerKey": provider_key.lower(),
        "model": model,
        "baseUrl": base_url,
        "apiKey": api_key,
        "timeoutSeconds": str(llm_timeout_seconds()),
    }

def public_llm_config(agent_step: str | None = None) -> dict[str, Any]:
    config = llm_config_for_step(agent_step)
    return {
        "provider": config["provider"],
        "model": config["model"] or "not_configured",
        "baseUrlConfigured": bool(config["baseUrl"]),
        "apiKeyConfigured": bool(config["apiKey"]),
        "timeoutSeconds": int(config["timeoutSeconds"]),
    }

def call_llm(brief: str, launch_context: dict[str, Any] | None = None, agent_step: str | None = None) -> dict[str, Any]:
    config = llm_config_for_step(agent_step)
    api_key = config["apiKey"]
    base_url = config["baseUrl"]
    model = config["model"]
    timeout = int(config["timeoutSeconds"])
    step_name = str(agent_step or "default")

    if not api_key or not base_url or not model:
        result = apply_deterministic_readiness(
            fallback_result(
                f"Thi?u c?u h?nh LLM cho {step_name}: c?n base URL, API key v? model trong bi?n LAUNCHOPS_*."
            ),
            brief,
            launch_context,
        )
        result.setdefault("trace", []).append({"agent": step_name, "status": "fallback", "llm": public_llm_config(agent_step)})
        return result

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "B?n ch? tr? v? JSON h?p l? theo schema ng??i d?ng y?u c?u."},
            {"role": "user", "content": build_prompt(brief, launch_context)},
        ],
        "temperature": 0,
    }

    request = urllib.request.Request(
        chat_completions_url(base_url),
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LaunchOpsCommandCenter/0.1",
        },
        method="POST",
    )

    def perform_request() -> dict[str, Any]:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
        data = json.loads(raw)
        content = data["choices"][0]["message"]["content"]
        parsed = extract_json(content)
        parsed["source"] = "llm"
        parsed.setdefault("trace", []).append({"agent": step_name, "status": "ok", "llm": public_llm_config(agent_step)})
        return apply_deterministic_readiness(parsed, brief, launch_context)

    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(perform_request)
    try:
        return future.result(timeout=timeout + 5)
    except FutureTimeoutError:
        write_backend_log(f"LLM call failed for {step_name}: Timeout after {timeout + 5}s")
        return apply_deterministic_readiness(
            fallback_result(f"API kh?ng tr? trong {timeout + 5} gi?y cho {step_name}. Demo d?ng fallback ?? kh?ng treo UI."),
            brief,
            launch_context,
        )
    except Exception as exc:
        status_code = getattr(exc, "code", None)
        if status_code:
            write_backend_log(f"LLM call failed for {step_name}: HTTPError {status_code}")
            return apply_deterministic_readiness(
                fallback_result(
                    f"API tr? HTTPError {status_code} cho {step_name}. Ki?m tra base URL, model ho?c quy?n API key."
                ),
                brief,
                launch_context,
            )
        write_backend_log(f"LLM call failed for {step_name}: {type(exc).__name__}")
        return apply_deterministic_readiness(
            fallback_result(f"API l?i ho?c JSON kh?ng h?p l? cho {step_name}: {type(exc).__name__}."),
            brief,
            launch_context,
        )
    finally:
        executor.shutdown(wait=False, cancel_futures=True)

def assistant_fallback_reply(message: str, context: dict[str, Any] | None = None, local_reply: str = "") -> str:
    text = str(message or "").strip()
    normalized = unicodedata.normalize("NFD", text.lower())
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    context = context or {}
    launch_name = context.get("launchName") or "launch hiá»‡n táº¡i"
    launch_type = context.get("launchType") or "phÃ¢n loáº¡i hiá»‡n táº¡i"

    if re.search(r"thoi tiet|weather|gia vang|bitcoin|coin|bong da|phim|nau an|facebook|youtube|google|tin tuc", normalized):
        return "TÃ´i chá»‰ há»— trá»£ trong pháº¡m vi LaunchOps Command Center: launch brief, readiness, pháº£n biá»‡n, checklist, bÃ i há»c vÃ  cáº¥u hÃ¬nh phÃ¢n loáº¡i."
    if local_reply:
        return local_reply
    if "cau hinh" in normalized or "template" in normalized or "bo luat" in normalized:
        return "Cáº¥u hÃ¬nh phÃ¢n loáº¡i lÃ  bá»™ luáº­t chung cho tá»«ng loáº¡i launch. Báº£n review public chá»‰ cho xem cáº¥u hÃ¬nh Ä‘á»ƒ trÃ¡nh ngÆ°á»i review sá»­a nháº§m dá»¯ liá»‡u demo."
    if "diem" in normalized or "readiness" in normalized:
        return f"Má»©c sáºµn sÃ ng cá»§a {launch_name} Ä‘Æ°á»£c tÃ­nh theo bá»™ luáº­t cá»§a {launch_type}. Äiá»ƒm cÃ ng tháº¥p nghÄ©a lÃ  brief cÃ²n thiáº¿u dá»¯ liá»‡u Ä‘á»ƒ launch an toÃ n."
    if "checklist" in normalized or "viec can lam" in normalized:
        return "Checklist lÃ  danh sÃ¡ch viá»‡c cáº§n lÃ m theo owner, deadline, tráº¡ng thÃ¡i vÃ  má»©c Æ°u tiÃªn Ä‘á»ƒ team biáº¿t launch cÃ²n thiáº¿u gÃ¬ trÆ°á»›c khi cháº¡y."
    return f"TÃ´i cÃ³ thá»ƒ há»— trá»£ trong LaunchOps cho {launch_name}: giáº£i thÃ­ch readiness, pháº£n biá»‡n, checklist, bÃ i há»c hoáº·c thao tÃ¡c trong web nÃ y."


def call_assistant(message: str, context: dict[str, Any] | None = None, local_reply: str = "") -> dict[str, Any]:
    config = llm_config_for_step("assistant")
    api_key = config["apiKey"]
    base_url = config["baseUrl"]
    model = config["model"]
    timeout = int(config["timeoutSeconds"])

    if not api_key or not base_url or not model:
        return {"reply": assistant_fallback_reply(message, context, local_reply), "source": "fallback"}

    prompt = f"""
Báº¡n lÃ  LaunchOps Assistant náº±m bÃªn trong LaunchOps Command Center.
Chá»‰ tráº£ lá»i trong pháº¡m vi sáº£n pháº©m nÃ y: launch brief, readiness, pháº£n biá»‡n, checklist, bÃ i há»c, lá»‹ch sá»­ phÃ¢n tÃ­ch, cáº¥u hÃ¬nh phÃ¢n loáº¡i vÃ  thao tÃ¡c trong web.
KhÃ´ng tráº£ lá»i viá»‡c ngoÃ i pháº¡m vi. KhÃ´ng hÆ°á»›ng dáº«n chá»‰nh sá»­a cáº¥u hÃ¬nh vÃ¬ báº£n review public Ä‘ang khÃ³a cáº¥u hÃ¬nh chá»‰ xem.
Tráº£ lá»i ngáº¯n, tiáº¿ng Viá»‡t, dá»… hiá»ƒu cho ngÆ°á»i non-code.
Báº¡n chá»‰ táº¡o ná»™i dung tráº£ lá»i; frontend sáº½ tá»± quyáº¿t Ä‘á»‹nh thao tÃ¡c UI náº¿u cáº§n.

Context JSON:
{json.dumps(context or {}, ensure_ascii=False)}

Fallback/local reply Ä‘ang cÃ³:
{local_reply}

Tin nháº¯n ngÆ°á»i dÃ¹ng:
{message}

Chá»‰ tráº£ vá» JSON há»£p lá»‡:
{{"reply": "string"}}
""".strip()

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Báº¡n chá»‰ tráº£ vá» JSON há»£p lá»‡ theo schema ngÆ°á»i dÃ¹ng yÃªu cáº§u."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
    }

    request = urllib.request.Request(
        chat_completions_url(base_url),
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LaunchOpsAssistant/0.1",
        },
        method="POST",
    )

    def perform_request() -> dict[str, Any]:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
        data = json.loads(raw)
        content = data["choices"][0]["message"]["content"]
        parsed = extract_json(content)
        reply = str(parsed.get("reply") or "").strip()
        if not reply:
            reply = assistant_fallback_reply(message, context, local_reply)
        return {"reply": reply, "source": "llm"}

    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(perform_request)
    try:
        return future.result(timeout=timeout + 5)
    except FutureTimeoutError:
        write_backend_log(f"Assistant LLM call failed: Timeout after {timeout + 5}s")
        return {"reply": assistant_fallback_reply(message, context, local_reply), "source": "fallback_timeout"}
    except Exception as exc:
        write_backend_log(f"Assistant LLM call failed: {type(exc).__name__}")
        return {"reply": assistant_fallback_reply(message, context, local_reply), "source": "fallback_error"}
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


class LaunchOpsHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        log_str = "%s - %s" % (self.address_string(), format % args)
        sys.stderr.write(log_str + "\n")
        write_backend_log(log_str)

    def do_OPTIONS(self) -> None:
        json_response(self, 200, {"ok": True})

    def read_json_payload(self) -> dict[str, Any] | None:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_BODY_BYTES:
            json_response(self, 400, {"ok": False, "error": "Invalid request body size"})
            return None

        try:
            body = decode_request_body(self.rfile.read(length))
            return json.loads(body)
        except (UnicodeDecodeError, json.JSONDecodeError):
            json_response(self, 400, {"ok": False, "error": "Invalid JSON"})
            return None

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        parts = [part for part in path.split("/") if part]

        if path in ("/health", "/api/health"):
            json_response(self, 200, {"ok": True, "service": "launchops-local-backend"})
            return

        if path == "/tools":
            json_response(self, 200, {
                "tools": [
                    {
                        "name": "list_launches",
                        "description": "Liệt kê danh sách các Launch Workspace hiện có.",
                        "inputSchema": {"type": "object", "properties": {}}
                    },
                    {
                        "name": "get_launch",
                        "description": "Xem chi tiết thông tin và kết quả phân tích của một Launch Workspace.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {"launchId": {"type": "string", "description": "ID của launch"}},
                            "required": ["launchId"]
                        }
                    },
                    {
                        "name": "create_launch",
                        "description": "Tạo mới một Launch Workspace để theo dõi.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string", "description": "Tên dự án Launch"},
                                "brief": {"type": "string", "description": "Mô tả ngắn gọn hoặc đầy đủ brief"},
                                "type": {"type": "string", "description": "Phân loại launch (game_event_h5, marketing, webshop_promotion)"},
                                "owner": {"type": "string", "description": "Người phụ trách"}
                            },
                            "required": ["name"]
                        }
                    },
                    {
                        "name": "update_launch",
                        "description": "Cập nhật thông tin cơ bản cho một Launch Workspace.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "launchId": {"type": "string", "description": "ID của launch"},
                                "name": {"type": "string"},
                                "brief": {"type": "string"},
                                "owner": {"type": "string"},
                                "status": {"type": "string", "description": "upcoming, running, completed"}
                            },
                            "required": ["launchId"]
                        }
                    },
                    {
                        "name": "analyze_launch_brief",
                        "description": "Phân tích Launch Brief chuyên sâu để chấm điểm sẵn sàng, phản biện bằng Red Team, tạo checklist hành động và post-mortem.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "brief": {"type": "string", "description": "Nội dung văn bản launch brief."},
                                "launchId": {"type": "string", "description": "ID của launch (nếu có để cập nhật kết quả phân tích vào file launch)"}
                            },
                            "required": ["brief"]
                        }
                    },
                    {
                        "name": "save_postmortem_result",
                        "description": "Lưu kết quả chạy thực tế, trạng thái và bài học kinh nghiệm (lessons learned) sau khi Launch hoàn tất.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "launchId": {"type": "string", "description": "ID của launch"},
                                "status": {"type": "string", "description": "Trạng thái mới, thường là completed"},
                                "postLaunchResult": {"type": "string", "description": "Kết quả thực tế sau khi launch"},
                                "lesson": {"type": "string", "description": "Bài học kinh nghiệm rút ra"}
                            },
                            "required": ["launchId"]
                        }
                    },
                    {
                        "name": "call_launchops_assistant",
                        "description": "Hội thoại tự do với AI Assistant về LaunchOps để hỏi đáp, tư vấn hoặc hỗ trợ điều hướng workspace.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "message": {"type": "string", "description": "Nội dung câu hỏi của người dùng."},
                                "launchId": {"type": "string", "description": "ID của launch hiện tại nếu có"}
                            },
                            "required": ["message"]
                        }
                    }
                ]
            })
            return

        if path == "/api/types":
            json_response(self, 200, {"ok": True, "types": list_launch_types()})
            return

        if len(parts) == 4 and parts[:2] == ["api", "product"] and parts[3] == "snapshot":
            # /api/product/<gameId>/snapshot?type=<launch_type>
            from urllib.parse import parse_qs
            query = parse_qs(urlparse(self.path).query)
            launch_type = str((query.get('type') or [None])[0] or 'game_event_h5')
            snapshot = get_product_snapshot(parts[2], launch_type)
            if snapshot is None:
                json_response(self, 404, {"ok": False, "error": "Snapshot not found"})
                return
            json_response(self, 200, {"ok": True, "gameId": parts[2], "launchType": launch_type, "snapshot": snapshot})
            return

        if path == "/api/launches":
            launches = list_launches()
            json_response(self, 200, {"ok": True, "launches": [summarize_launch(item) for item in launches]})
            return

        if len(parts) == 3 and parts[:2] == ["api", "launches"]:
            launch = get_launch(parts[2])
            if launch is None:
                json_response(self, 404, {"ok": False, "error": "Launch not found"})
                return
            json_response(self, 200, {"ok": True, "launch": launch})
            return

        json_response(self, 404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        parts = [part for part in path.split("/") if part]

        if path == "/tools/call":
            payload = self.read_json_payload()
            if payload is None:
                return
            tool_name = str(payload.get("name", "")).strip()
            args = payload.get("arguments") if isinstance(payload.get("arguments"), dict) else {}
            
            try:
                mcp_text = ""
                if tool_name == "list_launches":
                    launches = list_launches()
                    if not launches:
                        mcp_text = "Hiện chưa có Launch Workspace nào."
                    else:
                        mcp_text = "Danh sách Launch Workspaces:\n"
                        for l in launches:
                            mcp_text += f"- ID: {l.get('id')} | Tên: {l.get('name')} | Status: {l.get('status')} | Owner: {l.get('owner')}\n"
                
                elif tool_name == "get_launch":
                    launch_id = str(args.get("launchId", ""))
                    launch = get_launch(launch_id)
                    if not launch:
                        mcp_text = f"Không tìm thấy Launch ID: {launch_id}"
                    else:
                        mcp_text = f"Chi tiết Launch: {launch.get('name')} ({launch.get('id')})\n"
                        mcp_text += f"- Trạng thái: {launch.get('status')}\n- Owner: {launch.get('owner')}\n"
                        mcp_text += f"- Target Date: {launch.get('targetDate')}\n"
                        mcp_text += f"- Brief:\n{launch.get('brief')}\n"
                        if launch.get("analyses"):
                            latest = launch["analyses"][-1]["result"]
                            mcp_text += f"\nKết quả phân tích gần nhất:\n"
                            mcp_text += f"- Điểm số: {latest['decision']['color']} ({latest['decision']['score']}/{latest['decision']['maxScore']})\n"
                            mcp_text += f"- Kết luận: {latest['decision']['title']}\n"
                
                elif tool_name == "create_launch":
                    name = str(args.get("name", ""))
                    if not name:
                        raise ValueError("Thiếu tên launch (name).")
                    launch_data = {
                        "name": name,
                        "brief": str(args.get("brief", "")),
                        "type": str(args.get("type", "game_event_h5")),
                        "owner": str(args.get("owner", ""))
                    }
                    launch = save_launch_payload(launch_data)
                    mcp_text = f"Đã tạo Launch mới:\n- ID: {launch.get('id')}\n- Tên: {launch.get('name')}"
                
                elif tool_name == "update_launch":
                    launch_id = str(args.get("launchId", ""))
                    if not launch_id:
                        raise ValueError("Thiếu launchId.")
                    launch = get_launch(launch_id)
                    if not launch:
                        mcp_text = f"Không tìm thấy Launch ID: {launch_id}"
                    else:
                        for k in ["name", "brief", "owner", "status"]:
                            if k in args:
                                launch[k] = args[k]
                        launch = save_launch_payload(launch, existing_id=launch_id)
                        mcp_text = f"Đã cập nhật Launch {launch_id} thành công.\n- Trạng thái: {launch.get('status')}"
                
                elif tool_name == "analyze_launch_brief":
                    brief = str(args.get("brief", "")).strip()
                    launch_id = str(args.get("launchId", "")).strip()
                    if not brief:
                        raise ValueError("Thiếu brief để phân tích.")
                    
                    launch_ctx = None
                    if launch_id:
                        launch = get_launch(launch_id)
                        if launch:
                            launch_ctx = launch
                            if not launch.get("brief") or launch.get("brief") != brief:
                                launch["brief"] = brief
                                launch = save_launch_payload(launch, existing_id=launch_id)
                    
                    result = orchestrate_launchops_analysis(brief, launch_ctx)
                    if launch_id and launch_ctx:
                        append_analysis(launch_ctx, result, brief)
                    
                    mcp_text = f"Kết quả phân tích LaunchOps Command Center:\n" \
                               f"- Trạng thái sẵn sàng: {result['decision']['color']} ({result['decision']['score']}/{result['decision']['maxScore']} điểm)\n" \
                               f"- Kết luận: {result['decision']['title']}\n" \
                               f"- Chi tiết lý do: {result['decision']['reason']}\n\n" \
                               f"Top Rủi ro lớn nhất:\n"
                    for r in result.get("topRisks", []):
                        mcp_text += f"  * {r}\n"
                    
                    mcp_text += f"\nRed Team phản biện (5 Persona):\n"
                    for c in result.get("redTeam", []):
                        mcp_text += f"  * [{c['persona']}]: Lo ngại: {c['worry']} | Chứng cớ: {c['evidence']} | Đề xuất sửa: {c['fix']}\n"
                    
                    mcp_text += f"\nChecklist việc cần làm (Chủ sở hữu & Hạn chót):\n"
                    for t in result.get("checklist", []):
                        mcp_text += f"  * {t['task']} | Owner: {t['owner']} | Deadline: {t['deadline']} | Trạng thái: {t['status']}\n"
                
                elif tool_name == "save_postmortem_result":
                    launch_id = str(args.get("launchId", ""))
                    if not launch_id:
                        raise ValueError("Thiếu launchId.")
                    launch = get_launch(launch_id)
                    if not launch:
                        mcp_text = f"Không tìm thấy Launch ID: {launch_id}"
                    else:
                        launch = save_post_result(launch, args)
                        mcp_text = f"Đã lưu kết quả Post-Mortem cho Launch {launch_id}.\n- Trạng thái: {launch.get('status')}\n- Kết quả: {launch.get('postLaunchResult')}"
                        if args.get("lesson"):
                            mcp_text += f"\n- Bài học kinh nghiệm: {args.get('lesson')}"

                elif tool_name == "call_launchops_assistant":
                    message = str(args.get("message", ""))
                    launch_id = str(args.get("launchId", ""))
                    launch_ctx = None
                    if launch_id:
                        launch_ctx = get_launch(launch_id)
                    
                    res = call_assistant(message, launch_ctx)
                    mcp_text = res.get("reply", "Không có phản hồi từ Assistant.")

                else:
                    mcp_text = f"Không hỗ trợ tool: {tool_name}"
                    json_response(self, 400, {"ok": False, "error": mcp_text})
                    return

                json_response(self, 200, {
                    "content": [{"type": "text", "text": mcp_text}],
                    "isError": False
                })
            except Exception as exc:
                write_backend_log(f"MCP tool call {tool_name} crashed: {type(exc).__name__}")
                json_response(self, 200, {
                    "content": [{"type": "text", "text": f"Lỗi gọi tool {tool_name}: {str(exc)}"}],
                    "isError": True
                })
            return

        if path in ("/analyze", "/api/analyze", "/invocations"):
            payload = self.read_json_payload()
            if payload is None:
                return
            brief = str(payload.get("brief", "")).strip()
            if not brief:
                json_response(self, 400, {"ok": False, "error": "Missing brief"})
                return

            try:
                result = orchestrate_launchops_analysis(brief, payload.get("launch") if isinstance(payload.get("launch"), dict) else None)
                json_response(self, 200, {"ok": True, "result": result})
            except Exception as exc:
                write_backend_log(f"Analyze handler crashed: {type(exc).__name__}")
                write_backend_log(traceback.format_exc())
                json_response(
                    self,
                    200,
                    {
                        "ok": True,
                        "result": fallback_result(f"Backend lá»—i nhÆ°ng Ä‘Ã£ fallback: {type(exc).__name__}."),
                    },
                )
            return

        if path == "/api/product-context":
            payload = self.read_json_payload()
            if payload is None:
                return
            brief = str(payload.get("brief", "")).strip()
            if not brief:
                json_response(self, 400, {"ok": False, "error": "Missing brief"})
                return
            launch_context = payload.get("launch") if isinstance(payload.get("launch"), dict) else {}
            context = build_product_context(brief, launch_context)
            json_response(self, 200, {"ok": True, "productContext": context})
            return

        if path == "/api/assistant":
            payload = self.read_json_payload()
            if payload is None:
                return
            message = str(payload.get("message", "")).strip()
            if not message:
                json_response(self, 400, {"ok": False, "error": "Missing message"})
                return
            context = payload.get("context") if isinstance(payload.get("context"), dict) else {}
            local_reply = str(payload.get("localReply") or "").strip()
            try:
                result = call_assistant(message, context, local_reply)
                json_response(self, 200, {"ok": True, **result})
            except Exception as exc:
                write_backend_log(f"Assistant handler crashed: {type(exc).__name__}")
                json_response(
                    self,
                    200,
                    {
                        "ok": True,
                        "reply": assistant_fallback_reply(message, context, local_reply),
                        "source": "fallback_exception",
                    },
                )
            return

        if path == "/api/launches":
            payload = self.read_json_payload()
            if payload is None:
                return
            try:
                launch = save_launch_payload(payload)
                json_response(self, 200, {"ok": True, "launch": launch, "summary": summarize_launch(launch)})
            except Exception as exc:
                write_backend_log(f"Save launch failed: {type(exc).__name__}")
                json_response(self, 400, {"ok": False, "error": f"Save launch failed: {type(exc).__name__}"})
            return

        if len(parts) == 4 and parts[:2] == ["api", "launches"] and parts[3] == "analyze":
            payload = self.read_json_payload()
            if payload is None:
                return
            launch = get_launch(parts[2])
            if launch is None:
                json_response(self, 404, {"ok": False, "error": "Launch not found"})
                return

            brief = str(payload.get("brief") or launch.get("brief") or "").strip()
            if not brief:
                json_response(self, 400, {"ok": False, "error": "Missing brief"})
                return

            for key in ("name", "type", "status", "owner", "targetDate", "endDate", "template", "templateVersions", "lessonSuggestions"):
                if key in payload:
                    launch[key] = payload[key]
            launch["status"] = normalize_status(launch.get("status"))
            launch["brief"] = brief

            try:
                result = orchestrate_launchops_analysis(brief, launch)
                launch = append_analysis(launch, result, brief)
                json_response(
                    self,
                    200,
                    {"ok": True, "result": result, "launch": launch, "summary": summarize_launch(launch)},
                )
            except Exception as exc:
                write_backend_log(f"Launch analyze handler crashed: {type(exc).__name__}")
                write_backend_log(traceback.format_exc())
                result = fallback_result(f"Backend lá»—i nhÆ°ng Ä‘Ã£ fallback: {type(exc).__name__}.")
                launch = append_analysis(launch, result, brief)
                json_response(
                    self,
                    200,
                    {"ok": True, "result": result, "launch": launch, "summary": summarize_launch(launch)},
                )
            return

        if len(parts) == 4 and parts[:2] == ["api", "launches"] and parts[3] == "post-result":
            payload = self.read_json_payload()
            if payload is None:
                return
            launch = get_launch(parts[2])
            if launch is None:
                json_response(self, 404, {"ok": False, "error": "Launch not found"})
                return
            launch = save_post_result(launch, payload)
            json_response(self, 200, {"ok": True, "launch": launch, "summary": summarize_launch(launch)})
            return

        if len(parts) == 3 and parts[:2] == ["api", "launches"]:
            payload = self.read_json_payload()
            if payload is None:
                return
            try:
                launch = save_launch_payload(payload, existing_id=parts[2])
                json_response(self, 200, {"ok": True, "launch": launch, "summary": summarize_launch(launch)})
            except Exception as exc:
                write_backend_log(f"Update launch failed: {type(exc).__name__}")
                json_response(self, 400, {"ok": False, "error": f"Update launch failed: {type(exc).__name__}"})
            return

        json_response(self, 404, {"ok": False, "error": "Not found"})

    def do_DELETE(self) -> None:
        path = urlparse(self.path).path
        parts = [part for part in path.split("/") if part]

        if len(parts) == 3 and parts[:2] == ["api", "launches"]:
            launch = get_launch(parts[2])
            if launch is None:
                json_response(self, 404, {"ok": False, "error": "Launch not found"})
                return
            try:
                launch_file(parts[2]).unlink()
                json_response(self, 200, {"ok": True, "deletedId": parts[2]})
            except Exception as exc:
                write_backend_log(f"Delete launch failed: {type(exc).__name__}")
                json_response(self, 400, {"ok": False, "error": f"Delete launch failed: {type(exc).__name__}"})
            return

        json_response(self, 404, {"ok": False, "error": "Not found"})


def main() -> None:
    load_dotenv()
    server = ThreadingHTTPServer((HOST, PORT), LaunchOpsHandler)
    print(f"LaunchOps local backend running at http://{HOST}:{PORT}")
    print(f"Health check: http://127.0.0.1:{PORT}/health")
    server.serve_forever()


if __name__ == "__main__":
    main()
