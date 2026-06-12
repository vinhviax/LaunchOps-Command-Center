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
from urllib.parse import parse_qs, urlparse

from db import find_lessons, get_product_snapshot, get_type_profile, list_launch_types


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("LAUNCHOPS_BACKEND_PORT", "8080")))
MAX_BODY_BYTES = 256 * 1024
APP_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = APP_ROOT.parent
LAUNCHES_DIR = APP_ROOT / "memory" / "launches"
LAUNCH_STATUSES = {"upcoming", "running", "completed"}
CAVEMAN_ENABLED = os.getenv("LAUNCHOPS_CAVEMAN_STYLE", "").strip().lower() in {"1", "true", "yes", "on"}

# Static Web UI served from APP_ROOT so AgentBase Runtime hosts the dashboard at the
# same origin as the API (no external static host needed).
STATIC_CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
}


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
    return "Bad launch brief mẫu: thiếu rollback plan, thiếu CS FAQ, thiếu owner trực, thiếu guardrail reward."


def sample_decision(color: str, score: int, reason: str) -> dict[str, Any]:
    result = fallback_result("Dữ liệu mẫu đã lưu trong Launch Workspace.")
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
    marketing_brief = """Tên launch: Midweek Top-up Campaign - chiến dịch nạp giữa tuần cho nhóm người chơi trả phí thấp và trung bình.

Mục tiêu: Tăng doanh thu gói nạp nhỏ trong 4 ngày, kích hoạt lại người chơi có lịch sử nạp nhưng 14 ngày gần nhất chưa nạp.

Thời gian: Dự kiến chạy từ 15/06/2026 đến 18/06/2026.

Đối tượng: Người chơi level 20 trở lên, từng nạp trong 90 ngày gần nhất, không thuộc nhóm refund/abuse.

Offer: Nạp gói 99k hoặc 199k nhận thêm coupon và vật phẩm tiêu hao. Có giới hạn 1 lần/ngày/người chơi.

Kênh truyền thông: In-game popup, inbox, fanpage post và push notification.

Việc đã có:
- Growth phụ trách target segment và tracking.
- Business phụ trách ngân sách ưu đãi.
- LiveOps phụ trách lịch chạy trong game.

Vấn đề còn mở:
- Chưa chốt ngân sách coupon tối đa.
- Chưa có guardrail nếu doanh thu tăng nhưng refund cũng tăng.
- Chưa có CS FAQ về điều kiện nhận coupon.
- Chưa chốt dashboard theo dõi conversion, refund, coupon claim.
- Chưa có ngưỡng dừng nếu coupon bị nhận sai hoặc claim trùng.
- Chưa chốt post-campaign report sau 48 giờ."""
    may_brief = """Tên launch: May Login Streak - sự kiện đăng nhập 7 ngày liên tiếp trong tháng 5.

Trạng thái: Đã chạy xong từ 28/05/2026 đến 31/05/2026.

Mục tiêu ban đầu:
- Tăng tỷ lệ quay lại game trong nhóm người chơi casual.
- Khuyến khích người chơi đăng nhập đủ 7 ngày để nhận reward cuối.
- Giữ chi phí reward thấp, không ảnh hưởng economy.

Đối tượng: Người chơi level 10 trở lên, không yêu cầu nạp.

Cơ chế: Mỗi ngày đăng nhập nhận một phần quà nhỏ. Nếu đủ chuỗi 7 ngày, người chơi nhận thêm rương tổng kết.

Kết quả thực tế:
- Login rate tăng nhẹ trong 2 ngày đầu.
- Ticket CS tăng trong 6 giờ đầu vì một số người chơi hiểu nhầm điều kiện reset ngày.
- Reward không vượt ngân sách.
- Không có lỗi nghiêm trọng về hệ thống.

Điểm thiếu khi chuẩn bị:
- FAQ cho CS có nhưng chưa giải thích rõ mốc reset ngày.
- In-game message chưa nói rõ đăng nhập phải liên tục, không được bỏ ngày.
- Chưa có ngưỡng pause nếu hệ thống ghi nhận login sai.
- Post-mortem ban đầu chưa có câu hỏi về hiểu nhầm điều kiện event."""
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
                        "Sự kiện đạt mục tiêu giữ chân nhẹ và không vượt ngân sách, nhưng thông điệp reset ngày, FAQ CS và ngưỡng pause chưa đủ rõ.",
                    ),
                }
            ],
            "postLaunchResult": "Hoàn thành launch. Login rate tăng nhẹ trong 2 ngày đầu, reward không vượt ngân sách, nhưng ticket CS tăng trong 6 giờ đầu vì người chơi hỏi mốc reset ngày và điều kiện giữ chuỗi.",
            "lessonsLearned": [
                {
                    "id": "lesson-sample-1",
                    "createdAt": created,
                    "text": "Luôn viết rõ mốc reset ngày, điều kiện giữ chuỗi liên tục và ví dụ minh họa trong in-game message.",
                },
                {
                    "id": "lesson-sample-2",
                    "createdAt": created,
                    "text": "CS FAQ phải có macro riêng cho case mất chuỗi, claim rương tổng kết và khiếu nại thiếu reward.",
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
    name = str(incoming.get("name") or "Launch mới").strip()
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


def is_webhook_authorized(handler: BaseHTTPRequestHandler) -> bool:
    expected = os.getenv("LAUNCHOPS_WEBHOOK_TOKEN", "").strip()
    if not expected:
        return True
    parsed = urlparse(handler.path)
    query_token = parse_qs(parsed.query).get("token", [""])[0].strip()
    header_token = handler.headers.get("X-LaunchOps-Webhook-Token", "").strip()
    auth_header = handler.headers.get("Authorization", "").strip()
    bearer_token = auth_header[7:].strip() if auth_header.lower().startswith("bearer ") else ""
    return expected in {query_token, header_token, bearer_token}

def first_text_value(value: Any) -> str:
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        for key in ("text", "message", "content", "body", "brief"):
            found = first_text_value(value.get(key))
            if found:
                return found
        for nested in value.values():
            found = first_text_value(nested)
            if found:
                return found
    if isinstance(value, list):
        for item in value:
            found = first_text_value(item)
            if found:
                return found
    return ""

def extract_telegram_chat(payload: dict[str, Any]) -> tuple[str, str]:
    message = payload.get("message") if isinstance(payload.get("message"), dict) else {}
    if not message:
        message = payload.get("edited_message") if isinstance(payload.get("edited_message"), dict) else {}
    chat = message.get("chat") if isinstance(message.get("chat"), dict) else {}
    chat_id = str(chat.get("id") or "").strip()
    text = first_text_value(message)
    return chat_id, text

def extract_zalo_chat(payload: dict[str, Any]) -> tuple[str, str]:
    sender = payload.get("sender") if isinstance(payload.get("sender"), dict) else {}
    user_id = str(sender.get("id") or sender.get("uid") or payload.get("user_id") or payload.get("uid") or "").strip()
    return user_id, first_text_value(payload)

def format_chatbot_reply(result: dict[str, Any]) -> str:
    decision = result.get("decision") if isinstance(result.get("decision"), dict) else {}
    color = decision.get("color", "Unknown")
    score = decision.get("score", "?")
    max_score = decision.get("maxScore", "?")
    title = decision.get("title", "LaunchOps analysis")
    risks = result.get("topRisks") if isinstance(result.get("topRisks"), list) else []
    tasks = result.get("checklist") if isinstance(result.get("checklist"), list) else []
    lines = [
        f"LaunchOps: {color} ({score}/{max_score})",
        f"Decision: {title}",
    ]
    if risks:
        lines.append("Top risks:")
        for risk in risks[:3]:
            lines.append(f"- {risk}")
    if tasks:
        lines.append("Next tasks:")
        for task in tasks[:5]:
            if isinstance(task, dict):
                lines.append(f"- {task.get('task', 'Task')} | Owner: {task.get('owner', 'TBD')} | Due: {task.get('deadline', 'TBD')}")
    return "\n".join(lines)

def is_caveman_enabled() -> bool:
    return CAVEMAN_ENABLED

def set_caveman_enabled(enabled: bool) -> None:
    global CAVEMAN_ENABLED
    CAVEMAN_ENABLED = enabled

def chatbot_caveman_reply(argument: str) -> str:
    value = argument.strip().lower()
    if value in {"on", "1", "true", "yes", "enable", "enabled", "bat"}:
        set_caveman_enabled(True)
        return "Caveman mode: on. Bot speak short. No fluff. Ungh."
    if value in {"off", "0", "false", "no", "disable", "disabled", "tat"}:
        set_caveman_enabled(False)
        return "Caveman mode: off. Bot back to normal."
    status = "on" if is_caveman_enabled() else "off"
    return f"Caveman mode: {status}. Use: caveman on | caveman off"

def guardrail_scan_reply(brief: str) -> str:
    if not brief:
        return "Missing brief. Use: guardrail <launch brief>"
    checks = [
        ("email", r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
        ("phone", r"(?:\+?84|0)[0-9 .-]{8,12}"),
        ("api_key", r"(?i)(api[_ -]?key|token|secret|password|passwd|pwd)\s*[:=]"),
        ("private_key", r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
        ("internal_data", r"(?i)\b(confidential|internal only|khong chia se|khong cong khai|mat khau|bi mat)\b"),
        ("payment_sensitive", r"(?i)\b(card number|credit card|cvv|otp|bank account|so tai khoan)\b"),
    ]
    findings = []
    for label, pattern in checks:
        matches = re.findall(pattern, brief)
        if matches:
            findings.append((label, len(matches)))
    if not findings:
        return "Guardrail: PASS\n- No obvious PII/secret pattern found.\n- Safe enough for demo analysis.\nNext: run analyze <brief>."
    lines = ["Guardrail: REVIEW", "Found risky signals:"]
    for label, count in findings:
        lines.append(f"- {label}: {count}")
    lines.extend([
        "Action:",
        "- Remove names, emails, phone numbers, tokens, passwords.",
        "- Replace real customer/internal data with synthetic examples.",
        "- Then run analyze again.",
    ])
    return "\n".join(lines)

def infra_hint_reply(brief: str) -> str:
    if not brief:
        return "Missing brief. Use: infra <launch brief>"
    lower = brief.lower()
    services = [
        ("Agent Runtime", "Run LaunchOps Custom Agent API/webhook."),
        ("Container Registry", "Store runtime Docker image."),
        ("vMonitor", "Watch uptime, errors, resource usage."),
    ]
    if any(word in lower for word in ["image", "asset", "file", "brief", "pdf", "upload", "screenshot"]):
        services.append(("vStorage", "Store launch briefs, exports, screenshots."))
    if any(word in lower for word in ["database", "db", "order", "payment", "user", "profile", "history"]):
        services.append(("vDB RDS", "Store structured launch state and audit records."))
    if any(word in lower for word in ["redis", "cache", "session", "rate", "fast"]):
        services.append(("vDB MDS/Redis", "Cache sessions, throttles, quick bot state."))
    if any(word in lower for word in ["h5", "web", "cdn", "static", "landing"]):
        services.append(("vCDN", "Serve static launch assets faster."))
    if any(word in lower for word in ["public", "traffic", "ddos", "attack", "bot", "spam"]):
        services.append(("vWAF", "Protect public endpoint from bad traffic."))
    if any(word in lower for word in ["high traffic", "scale", "million", "global", "load"]):
        services.append(("vLB/GLB", "Balance traffic across endpoints/regions."))
    lines = ["GreenNode infra hint:"]
    seen = set()
    for name, reason in services:
        if name in seen:
            continue
        seen.add(name)
        lines.append(f"- {name}: {reason}")
    lines.append("Note: This is architecture hint, not cost quote.")
    return "\n".join(lines)

def report_draft_reply(brief: str) -> str:
    if not brief:
        return "Missing brief. Use: report <launch brief>"
    result = fallback_result("Report command uses deterministic LaunchOps summary for quick chat export.")
    decision = result.get("decision", {})
    risks = result.get("topRisks", [])[:3]
    tasks = result.get("checklist", [])[:5]
    lines = [
        "LaunchOps mini report",
        f"Readiness: {decision.get('color', 'Unknown')} ({decision.get('score', '?')}/{decision.get('maxScore', '?')})",
        f"Decision: {decision.get('title', 'LaunchOps analysis')}",
        "Risks:",
    ]
    lines.extend(f"- {risk}" for risk in risks)
    lines.append("Checklist:")
    for task in tasks:
        if isinstance(task, dict):
            lines.append(f"- {task.get('task', 'Task')} | Owner: {task.get('owner', 'TBD')} | Due: {task.get('deadline', 'TBD')}")
    lines.append("Next: paste this into README/video notes or send to PM/CS/Tech channel.")
    return "\n".join(lines)

def to_caveman_style(text: str) -> str:
    if not is_caveman_enabled():
        return text
    replacements = [
        ("LaunchOps bot commands:", "Cave bot commands:"),
        ("LaunchOps status:", "Tribe status:"),
        ("Recent launches:", "Old hunts:"),
        ("LaunchOps config status:", "Fire-rock config:"),
        ("GreenNode infra hint:", "Cloud bones needed:"),
        ("LaunchOps mini report", "Cave report"),
        ("Guardrail: PASS", "Guardrail: PASS. No poison."),
        ("Guardrail: REVIEW", "Guardrail: REVIEW. Smell danger."),
        ("- help: show commands", "- help: show commands"),
        ("- status: show launch workspace status", "- status: tribe status"),
        ("- list: show recent launches", "- list: old hunts"),
        ("- config: show webhook/runtime config status", "- config: fire-rock status"),
        ("- analyze <brief>: analyze a launch brief", "- analyze <brief>: bite brief, find danger"),
        ("- caveman on|off: toggle terse caveman bot style", "- caveman on|off: cave voice on/off"),
        ("- guardrail <brief>: scan PII/secret risk", "- guardrail <brief>: sniff poison"),
        ("- infra <brief>: suggest GreenNode infra", "- infra <brief>: pick cloud bones"),
        ("- report <brief>: draft compact report", "- report <brief>: make cave report"),
        ("Tip: paste any launch brief directly to analyze it.", "Tip: throw brief. Bot bite."),
        ("Top risks:", "Bad dangers:"),
        ("Next tasks:", "Work do:"),
        ("Risks:", "Dangers:"),
        ("Checklist:", "Work list:"),
        ("Decision:", "Choose:"),
        ("Readiness:", "Ready:"),
        ("Owner:", "Chief:"),
        ("Due:", "When:"),
        ("owner:", "chief:"),
    ]
    caveman = text
    for source, target in replacements:
        caveman = caveman.replace(source, target)
    caveman = re.sub(r"LaunchOps:\s*(Red|Yellow|Green)\s*\((\d+)/(\d+)\)", r"Ready: \1 (\2/\3)", caveman)
    if not caveman.endswith("Ungh."):
        caveman = f"{caveman}\n\nUngh."
    return caveman

def send_telegram_message(chat_id: str, text: str) -> bool:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token or not chat_id:
        return False
    payload = json.dumps({"chat_id": chat_id, "text": text[:3900]}).encode("utf-8")
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            return 200 <= response.status < 300
    except Exception as exc:
        write_backend_log(f"Telegram send failed: {type(exc).__name__}")
        return False

def send_zalo_message(user_id: str, text: str) -> bool:
    token = os.getenv("ZALO_BOT_TOKEN", "").strip()
    if not token or not user_id:
        return False
    # Zalo OpenAPI format for sending text message
    payload = json.dumps({
        "recipient": {"user_id": user_id},
        "message": {"text": text[:1900]}
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://openapi.zalo.me/v3.0/oa/message/cs",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "access_token": token
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            return 200 <= response.status < 300
    except Exception as exc:
        write_backend_log(f"Zalo send failed: {type(exc).__name__}")
        return False

def send_chatbot_reply(provider: str, chat_id: str, reply: str) -> bool:
    if provider == "telegram":
        return send_telegram_message(chat_id, reply)
    if provider == "zalo":
        return send_zalo_message(chat_id, reply)
    return False

def chatbot_help_reply() -> str:
    return "\n".join([
        "LaunchOps bot commands:",
        "- help: show commands",
        "- status: show launch workspace status",
        "- list: show recent launches",
        "- config: show webhook/runtime config status",
        "- analyze <brief>: analyze a launch brief",
        "- caveman on|off: toggle terse caveman bot style",
        "- guardrail <brief>: scan PII/secret risk",
        "- infra <brief>: suggest GreenNode infra",
        "- report <brief>: draft compact report",
        "Tip: paste any launch brief directly to analyze it.",
    ])

def chatbot_status_reply() -> str:
    launches = list_launches()
    counts = {"upcoming": 0, "running": 0, "completed": 0}
    for launch in launches:
        status = normalize_status(launch.get("status"))
        counts[status] = counts.get(status, 0) + 1
    return "\n".join([
        "LaunchOps status:",
        f"- Total launches: {len(launches)}",
        f"- Running: {counts.get('running', 0)}",
        f"- Upcoming: {counts.get('upcoming', 0)}",
        f"- Completed: {counts.get('completed', 0)}",
        "Send `list` to see recent launches or paste a brief to analyze.",
    ])

def chatbot_list_reply() -> str:
    launches = list_launches()[:5]
    if not launches:
        return "No launches saved yet. Paste a launch brief to analyze."
    lines = ["Recent launches:"]
    for launch in launches:
        summary = summarize_launch(launch)
        lines.append(f"- {summary.get('name', summary.get('id', 'Launch'))} | {summary.get('status', 'upcoming')} | owner: {summary.get('owner', 'TBD')}")
    return "\n".join(lines)

def chatbot_config_reply() -> str:
    webhook_auth = "on" if os.getenv("LAUNCHOPS_WEBHOOK_TOKEN", "").strip() else "off"
    telegram_send = "on" if os.getenv("TELEGRAM_BOT_TOKEN", "").strip() else "off"
    zalo_send = "on" if os.getenv("ZALO_BOT_TOKEN", "").strip() else "off"
    fast_mode = os.getenv("CHATBOT_FAST_MODE", "1").strip() or "1"
    caveman_mode = "on" if is_caveman_enabled() else "off"
    return "\n".join([
        "LaunchOps config status:",
        f"- Webhook auth: {webhook_auth}",
        f"- Telegram sendMessage: {telegram_send}",
        f"- Zalo sendMessage: {zalo_send}",
        f"- Chatbot fast mode: {fast_mode}",
        f"- Caveman style: {caveman_mode}",
        "- Routes: /webhooks/telegram, /webhooks/zalo, /api/chatbot",
    ])

def parse_chatbot_command(message: str) -> tuple[str, str]:
    text = message.strip()
    if not text:
        return "missing", ""
    head, _, rest = text.partition(" ")
    command = head.lower().lstrip("/")
    if command in {"start", "help", "status", "list", "config", "caveman", "guardrail", "infra", "report"}:
        return command, rest.strip()
    if command in {"analyze", "analyse", "phan-tich", "phantich"}:
        return "analyze", rest.strip()
    return "analyze", text

def handle_chatbot_payload(provider: str, payload: dict[str, Any]) -> dict[str, Any]:
    if provider == "telegram":
        chat_id, message = extract_telegram_chat(payload)
    elif provider == "zalo":
        chat_id, message = extract_zalo_chat(payload)
    else:
        chat_id = str(payload.get("chatId") or payload.get("chat_id") or "").strip()
        message = first_text_value(payload)
    command, brief = parse_chatbot_command(message)
    if command == "missing":
        return {"ok": False, "error": "Missing message"}
    result = None
    if command in {"start", "help"}:
        reply = chatbot_help_reply()
    elif command == "status":
        reply = chatbot_status_reply()
    elif command == "list":
        reply = chatbot_list_reply()
    elif command == "config":
        reply = chatbot_config_reply()
    elif command == "caveman":
        reply = chatbot_caveman_reply(brief)
    elif command == "guardrail":
        reply = guardrail_scan_reply(brief)
    elif command == "infra":
        reply = infra_hint_reply(brief)
    elif command == "report":
        reply = report_draft_reply(brief)
    else:
        if not brief:
            reply = "Missing brief. Use: analyze <launch brief>"
        else:
            if os.getenv("CHATBOT_FAST_MODE", "1").strip().lower() in {"1", "true", "yes", "on"}:
                result = fallback_result("Chatbot fast mode uses deterministic LaunchOps analysis for quick replies.")
            else:
                result = orchestrate_launchops_analysis(brief, None)
            reply = format_chatbot_reply(result)
    if command != "caveman":
        reply = to_caveman_style(reply)
    delivered = send_chatbot_reply(provider, chat_id, reply)
    response = {"ok": True, "provider": provider, "chatId": chat_id, "command": command, "reply": reply, "delivered": delivered}
    if result is not None:
        response["result"] = result
    return response

def fallback_result(reason: str) -> dict[str, Any]:
    return {
        "source": "fallback",
        "warning": reason,
        "trace": [],
        "decision": {
            "color": "Yellow",
            "score": 8,
            "maxScore": 12,
            "title": "Chưa nên launch ngay",
            "reason": "Đang dùng fallback local vì API chưa sẵn sàng hoặc trả lỗi.",
        },
        "riskBreakdown": [
            {"label": "Mục tiêu và scope", "score": 1, "maxScore": 2, "missing": "Mục tiêu, đối tượng hoặc scope còn mơ hồ."},
            {"label": "Owner và deadline", "score": 1, "maxScore": 2, "missing": "Chưa thấy owner/deadline rõ cho các nhóm."},
            {"label": "Tech readiness", "score": 2, "maxScore": 2, "missing": "Ổn cho demo brief."},
            {"label": "User impact", "score": 2, "maxScore": 2, "missing": "Ổn cho demo brief."},
            {"label": "Business và reward", "score": 1, "maxScore": 2, "missing": "Reward, tỷ lệ hoặc ngân sách chưa đủ guardrail."},
            {"label": "Learning và post-mortem", "score": 1, "maxScore": 2, "missing": "Chưa có kế hoạch học lại sau launch."},
        ],
        "topRisks": [
            "Mục tiêu, đối tượng hoặc scope còn mơ hồ.",
            "Chưa thấy owner/deadline rõ cho các nhóm.",
            "Reward, tỷ lệ hoặc ngân sách chưa đủ guardrail.",
        ],
        "redTeam": [
            {
                "persona": "Angry user",
                "worry": "Người chơi bị lỗi quay thưởng hoặc không nhận quà sẽ phàn nàn nhanh.",
                "evidence": "Brief chưa có FAQ và cách xử lý nếu không nhận phần thưởng.",
                "fix": "Tạo CS FAQ, thông điệp in-game, và rule bồi thường nếu hệ thống lỗi.",
            },
            {
                "persona": "Exploit hunter",
                "worry": "Người chơi có thể tìm cách farm lượt quay hoặc lợi dụng điều kiện nạp.",
                "evidence": "Brief ghi tất cả người chơi nhưng chưa rõ điều kiện người mới/cũ và giới hạn.",
                "fix": "Chốt điều kiện tham gia, giới hạn lượt mỗi ngày, và log bất thường.",
            },
            {
                "persona": "CS lead",
                "worry": "CS thiếu macro và tình huống escalation sẽ xử lý chậm.",
                "evidence": "Chưa có bộ câu trả lời chuẩn cho ticket phát sinh.",
                "fix": "Viết CS macro, phân cấp ticket và timeline phản hồi.",
            },
            {
                "persona": "Tech on-call",
                "worry": "Không có rollback/feature flag thì lỗi production khó cứu.",
                "evidence": "Không thấy rollback plan hay alerting rõ.",
                "fix": "Thêm feature flag, rollback trigger và monitor tối thiểu.",
            },
            {
                "persona": "Business owner",
                "worry": "Campaign tốt nhưng không đo được ROI thì khó duyệt.",
                "evidence": "Brief chưa gắn KPI sau launch hoặc guardrail ngân sách.",
                "fix": "Chốt KPI, ngân sách, và tiêu chí success trước launch.",
            },
        ],
        "checklist": [
            {"task": "Chốt scope, đối tượng, KPI thành công", "owner": "PM LiveOps", "deadline": "T-2 ngày", "status": "Todo", "priority": "High"},
            {"task": "Viết CS FAQ và macro trả lời", "owner": "CS Lead", "deadline": "T-1 ngày", "status": "Todo", "priority": "High"},
            {"task": "Chuẩn bị rollback plan và feature flag", "owner": "Tech Lead", "deadline": "T-1 ngày", "status": "Todo", "priority": "High"},
            {"task": "Chốt ngân sách, reward guardrail", "owner": "Business Owner", "deadline": "Launch day", "status": "Todo", "priority": "Medium"},
            {"task": "Tạo monitoring dashboard sau launch", "owner": "Data/BI", "deadline": "T+48h", "status": "Todo", "priority": "Medium"},
            {"task": "Review legal/compliance copy", "owner": "Legal/Compliance", "deadline": "T-1 ngày", "status": "Todo", "priority": "Low"},
            {"task": "Brief nội bộ cho team vận hành", "owner": "Ops", "deadline": "T-1 ngày", "status": "Todo", "priority": "Low"},
            {"task": "Post-launch recap và lesson learned", "owner": "PM LiveOps", "deadline": "T+48h", "status": "Todo", "priority": "Medium"},
        ],
        "postmortem": [
            {"title": "Câu hỏi sau launch", "items": ["Mục tiêu ban đầu có đạt không?", "Rủi ro nào đã được bắt đúng trước launch?", "Điểm nào cần thêm guardrail?"]},
            {"title": "Metrics cần điền", "items": ["DAU / login rate", "Số ticket CS và loại ticket", "ROI / conversion"]},
            {"title": "Action items", "items": ["Chốt lesson tốt nhất", "Đưa lesson vào template lần sau", "Cập nhật checklist gốc"]},
        ],
    }


def _base_trace(mode: str, reason: str) -> list[dict[str, Any]]:
    return [{"agent": mode, "status": "ok", "reason": reason, "source": "rule"}]


def build_default_template() -> dict[str, Any]:
    return {
        "name": "Default LaunchOps Template",
        "type": "generic",
        "riskGroups": [
            {"label": "Mục tiêu và scope", "maxScore": 2},
            {"label": "Owner và deadline", "maxScore": 2},
            {"label": "Tech readiness", "maxScore": 2},
            {"label": "User impact", "maxScore": 2},
            {"label": "Business và reward", "maxScore": 2},
            {"label": "Learning và post-mortem", "maxScore": 2},
        ],
        "redTeamPersonas": ["Angry user", "Exploit hunter", "CS lead", "Tech on-call", "Business owner"],
        "checklistExamples": ["Chốt scope", "Viết FAQ", "Chuẩn bị rollback", "Theo dõi KPI"],
        "postmortemBlocks": ["Câu hỏi sau launch", "Metrics cần điền", "Action items"],
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

def readiness_agent(brief: str, launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    template = normalize_template(launch_context)
    if not force_fast and truthy_env("LAUNCHOPS_LLM_ENABLED"):
        result = call_llm(brief, {**(launch_context or {}), "template": template}, "readiness")
    else:
        result = fallback_result("Readiness agent rule-based.")
        result["trace"] = _base_trace("readiness", "rule-based readiness")
    result = apply_deterministic_readiness(result, brief, {**(launch_context or {}), "template": template})
    result["trace"].append({"agent": "readiness", "status": "ok", "score": result["decision"]["score"], "color": result["decision"]["color"], "llm": public_llm_config("readiness")})
    return result

def red_team_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    template = normalize_template(launch_context)
    brief = str((launch_context or {}).get("brief") or "")
    if not force_fast and truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
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
            "worry": f"{persona} lo brief còn hổng guardrail.",
            "evidence": "Dựa trên riskBreakdown và nội dung brief.",
            "fix": "Bổ sung guardrail, owner và rollback plan.",
        })
    result["redTeam"] = red_team
    result.setdefault("trace", []).append({"agent": "red_team", "status": "ok", "cards": len(red_team), "llm": public_llm_config("redteam")})
    return result

def checklist_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    brief = str((launch_context or {}).get("brief") or "")
    if not force_fast and truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
        llm_result = call_llm(brief, launch_context, "checklist")
        if isinstance(llm_result.get("checklist"), list) and len(llm_result["checklist"]) >= 5:
            result["checklist"] = llm_result["checklist"]
            result.setdefault("trace", []).append({"agent": "checklist", "status": "ok", "source": "llm", "llm": public_llm_config("checklist")})
            return result
    result["checklist"] = [
        {"task": "Chốt scope, đối tượng, KPI thành công", "owner": "PM LiveOps", "deadline": "T-2 ngày", "status": "Todo", "priority": "High"},
        {"task": "Viết CS FAQ và macro trả lời", "owner": "CS Lead", "deadline": "T-1 ngày", "status": "Todo", "priority": "High"},
        {"task": "Chuẩn bị rollback plan và feature flag", "owner": "Tech Lead", "deadline": "T-1 ngày", "status": "Todo", "priority": "High"},
        {"task": "Kiểm tra ngân sách, reward guardrail", "owner": "Business Owner", "deadline": "Launch day", "status": "Todo", "priority": "Medium"},
        {"task": "Theo dõi KPI sau launch", "owner": "Data/BI", "deadline": "T+48h", "status": "Todo", "priority": "Medium"},
        {"task": "Review copy nội bộ", "owner": "Ops", "deadline": "T-1 ngày", "status": "Todo", "priority": "Low"},
        {"task": "Chuẩn bị escalation path", "owner": "CS Lead", "deadline": "T-1 ngày", "status": "Todo", "priority": "Low"},
        {"task": "Post-launch recap", "owner": "PM LiveOps", "deadline": "T+48h", "status": "Todo", "priority": "Medium"},
    ]
    result.setdefault("trace", []).append({"agent": "checklist", "status": "ok", "tasks": len(result["checklist"]), "llm": public_llm_config("checklist")})
    return result

def postmortem_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    brief = str((launch_context or {}).get("brief") or "")
    if not force_fast and truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
        llm_result = call_llm(brief, launch_context, "postmortem")
        if isinstance(llm_result.get("postmortem"), list) and len(llm_result["postmortem"]) >= 3:
            result["postmortem"] = llm_result["postmortem"]
            result.setdefault("trace", []).append({"agent": "postmortem", "status": "ok", "source": "llm", "llm": public_llm_config("postmortem")})
            return result
    result["postmortem"] = [
        {"title": "Câu hỏi sau launch", "items": ["Mục tiêu ban đầu có đạt không?", "Rủi ro nào đã được bắt đúng trước launch?", "Điểm nào cần thêm guardrail?"]},
        {"title": "Metrics cần điền", "items": ["DAU / login rate", "Số ticket CS và loại ticket", "ROI / conversion"]},
        {"title": "Action items", "items": ["Chốt lesson tốt nhất", "Đưa lesson vào template lần sau", "Cập nhật checklist gốc"]},
    ]
    result.setdefault("trace", []).append({"agent": "postmortem", "status": "ok", "blocks": len(result["postmortem"]), "llm": public_llm_config("postmortem")})
    return result

def orchestrate_launchops_analysis(brief: str, launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    launch_context = launch_context or {}
    product_context = build_product_context(brief, launch_context)
    launch_context = {**launch_context, "brief": brief, "template": product_context.get("typeProfile") or build_default_template(), "productContext": product_context}
    result = readiness_agent(brief, launch_context, force_fast=force_fast)
    result["productContext"] = product_context
    result = red_team_agent(result, launch_context, force_fast=force_fast)
    result = checklist_agent(result, launch_context, force_fast=force_fast)
    result = postmortem_agent(result, launch_context, force_fast=force_fast)
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
        "name": str(template.get("name") or "Template mặc định"),
        "description": str(template.get("description") or ""),
        "maxScore": max_score,
        "riskGroups": [
            {
                "key": str(group.get("key") or ""),
                "label": str(group.get("label") or "Nhóm rủi ro"),
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
                "title": str(block.get("title") or "Bài học"),
                "items": block.get("items") if isinstance(block.get("items"), list) else [],
            }
            for block in postmortem
            if isinstance(block, dict)
        ],
    }


def build_prompt(brief: str, launch_context: dict[str, Any] | None = None) -> str:
    launch_context = launch_context or {}
    launch_name = str(launch_context.get("name") or "Chưa đặt tên")
    launch_type = str(launch_context.get("type") or "Chưa phân loại")
    launch_status = str(launch_context.get("status") or "upcoming")
    owner = str(launch_context.get("owner") or "Chưa rõ owner")
    target_date = str(launch_context.get("targetDate") or "Chưa rõ ngày launch")
    end_date = str(launch_context.get("endDate") or "Chưa rõ ngày kết thúc")
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
Bạn là LaunchOps Command Center, một Super Agent giúp team kiểm tra rủi ro trước launch.

Hãy đọc metadata + launch brief + template cấu hình và chỉ trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.

Metadata của launch:
- Tên launch: {launch_name}
- Loại launch: {launch_type}
- Trạng thái hiện tại: {launch_status}
- Owner: {owner}
- Start Launch: {target_date}
- End Launch: {end_date}

Template đang dùng:
{json.dumps(template_context, ensure_ascii=False, indent=2)}

Luật rất quan trọng:
- Chỉ chấm theo riskGroups trong template, không tự thêm nhóm ngoài template.
- Điểm readiness cuối cùng sẽ được backend tính lại bằng scoring rule cố định. AI chỉ cần giải thích rủi ro theo cùng riskGroups.
- Nếu vẫn trả score, chỉ dùng số nguyên từ 0 đến maxScore của từng nhóm; không dùng điểm lẻ.
- decision.maxScore phải bằng tổng maxScore của riskGroups: {template_context["maxScore"]}.
- riskBreakdown phải có đúng các label trong riskGroups.
- redTeam phải dùng đúng các persona trong redTeamPersonas. Không được tự thêm persona ngoài template.
- checklist nên bám checklistExamples nhưng có thể bổ sung chi tiết từ brief.
- postmortem nên bám postmortemBlocks.
- Green/Yellow/Red tính theo tỷ lệ điểm: Green >= 80%, Yellow >= 50%, Red < 50%.

Schema bắt buộc:
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
    # Reasoning models (minimax, deepseek) có thể chèn block suy nghĩ trước JSON.
    cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.S).strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    # strict=False: cho phép control char (xuống dòng thật) trong string value — LLM hay trả vậy.
    decoder = json.JSONDecoder(strict=False)
    # Thử decode từ từng vị trí '{' — chịu được text dẫn nhập chứa '{' lẫn text thừa sau JSON.
    start = cleaned.find("{")
    attempts = 0
    while start != -1 and attempts < 20:
        try:
            obj, _ = decoder.raw_decode(cleaned, start)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            pass
        start = cleaned.find("{", start + 1)
        attempts += 1
    return json.loads(cleaned, strict=False)


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
    normalized = unicodedata.normalize("NFD", str(value or "").lower().replace("đ", "d"))
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
        label = str(group.get("label") or "Nhóm rủi ro")
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
            missing = "Đủ bằng chứng trong brief cho nhóm này."
        elif negative_lines:
            missing = str(group.get("missing") or "Brief có nhắc tới nhưng vẫn còn điểm chưa chốt.")
        elif positive_hits:
            missing = str(group.get("missing") or "Có nhắc tới, nhưng chưa đủ chi tiết để chấm trọn điểm.")
        else:
            missing = str(group.get("missing") or "Chưa thấy đủ bằng chứng trong brief.")

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
        for item in fallback_result("Template thiếu riskGroups.")["riskBreakdown"]
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
        "title": current_decision.get("title") or ("Có thể tiếp tục chuẩn bị" if color != "Red" else "Chưa đủ an toàn để launch"),
        "reason": (
            "Điểm readiness được tính bằng rule cố định theo template, nên cùng brief + template sẽ luôn ra cùng điểm. "
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
                f"Thiếu cấu hình LLM cho {step_name}: cần base URL, API key và model trong biến LAUNCHOPS_*."
            ),
            brief,
            launch_context,
        )
        result.setdefault("trace", []).append({"agent": step_name, "status": "fallback", "llm": public_llm_config(agent_step)})
        return result

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Bạn chỉ trả về JSON hợp lệ theo schema người dùng yêu cầu."},
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
            fallback_result(f"API không trả trong {timeout + 5} giây cho {step_name}. Demo dùng fallback để không treo UI."),
            brief,
            launch_context,
        )
    except Exception as exc:
        status_code = getattr(exc, "code", None)
        if status_code:
            write_backend_log(f"LLM call failed for {step_name}: HTTPError {status_code}")
            return apply_deterministic_readiness(
                fallback_result(
                    f"API trả HTTPError {status_code} cho {step_name}. Kiểm tra base URL, model hoặc quyền API key."
                ),
                brief,
                launch_context,
            )
        write_backend_log(f"LLM call failed for {step_name}: {type(exc).__name__}")
        return apply_deterministic_readiness(
            fallback_result(f"API lỗi hoặc JSON không hợp lệ cho {step_name}: {type(exc).__name__}."),
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
    launch_name = context.get("launchName") or "launch hiện tại"
    launch_type = context.get("launchType") or "phân loại hiện tại"

    if re.search(r"thoi tiet|weather|gia vang|bitcoin|coin|bong da|phim|nau an|facebook|youtube|google|tin tuc", normalized):
        return "Tôi chỉ hỗ trợ trong phạm vi LaunchOps Command Center: launch brief, readiness, phản biện, checklist, bài học và cấu hình phân loại."
    if local_reply:
        return local_reply
    if "cau hinh" in normalized or "template" in normalized or "bo luat" in normalized:
        return "Cấu hình phân loại là bộ luật chung cho từng loại launch. Bản review public chỉ cho xem cấu hình để tránh người review sửa nhầm dữ liệu demo."
    if "diem" in normalized or "readiness" in normalized:
        return f"Mức sẵn sàng của {launch_name} được tính theo bộ luật của {launch_type}. Điểm càng thấp nghĩa là brief còn thiếu dữ liệu để launch an toàn."
    if "checklist" in normalized or "viec can lam" in normalized:
        return "Checklist là danh sách việc cần làm theo owner, deadline, trạng thái và mức ưu tiên để team biết launch còn thiếu gì trước khi chạy."
    return f"Tôi có thể hỗ trợ trong LaunchOps cho {launch_name}: giải thích readiness, phản biện, checklist, bài học hoặc thao tác trong web này."


def call_assistant(message: str, context: dict[str, Any] | None = None, local_reply: str = "") -> dict[str, Any]:
    config = llm_config_for_step("assistant")
    api_key = config["apiKey"]
    base_url = config["baseUrl"]
    model = config["model"]
    timeout = int(config["timeoutSeconds"])

    if not api_key or not base_url or not model:
        return {"reply": assistant_fallback_reply(message, context, local_reply), "source": "fallback"}

    prompt = f"""
Bạn là LaunchOps Assistant nằm bên trong LaunchOps Command Center.
Chỉ trả lời trong phạm vi sản phẩm này: launch brief, readiness, phản biện, checklist, bài học, lịch sử phân tích, cấu hình phân loại và thao tác trong web.
Không trả lời việc ngoài phạm vi. Không hướng dẫn chỉnh sửa cấu hình vì bản review public đang khóa cấu hình chỉ xem.
Trả lời ngắn, tiếng Việt, dễ hiểu cho người non-code.
Bạn chỉ tạo nội dung trả lời; frontend sẽ tự quyết định thao tác UI nếu cần.

Context JSON:
{json.dumps(context or {}, ensure_ascii=False)}

Fallback/local reply đang có:
{local_reply}

Tin nhắn người dùng:
{message}

Chỉ trả về JSON hợp lệ:
{{"reply": "string"}}
""".strip()

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Bạn chỉ trả về JSON hợp lệ theo schema người dùng yêu cầu."},
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
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))

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

        if path == "/mcp":
            # Streamable HTTP spec: server không hỗ trợ SSE stream phải trả 405
            # (SDK client bỏ qua êm); 404 bị mcp-remote coi là lỗi remote → client hủy kết nối.
            json_response(self, 405, {"ok": False, "error": "SSE stream not supported, use POST"})
            return

        if path == "/tools":
            # MCP List Tools endpoint
            json_response(self, 200, {
                "tools": [
                    {
                        "name": "analyze_launch_brief",
                        "description": "Phân tích Launch Brief chuyên sâu để chấm điểm readiness (Green/Yellow/Red), phản biện bằng Red Team, tạo checklist hành động và post-mortem.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "brief": {
                                    "type": "string",
                                    "description": "Nội dung văn bản launch brief đầy đủ cần phân tích."
                                },
                                "type": {
                                    "type": "string",
                                    "description": "Phân loại launch nếu có (game_event_h5, marketing, webshop_promotion)."
                                }
                            },
                            "required": ["brief"]
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

        # Serve bundled Web UI (static frontend) from APP_ROOT — top-level files only,
        # whitelisted extensions, no path traversal. API routes above take precedence.
        rel = "index.html" if path in ("", "/") else path.lstrip("/")
        if "/" not in rel and ".." not in rel:
            ctype = STATIC_CONTENT_TYPES.get(Path(rel).suffix.lower())
            if ctype:
                file_path = (APP_ROOT / rel).resolve()
                if file_path.is_file() and file_path.parent == APP_ROOT.resolve():
                    data = file_path.read_bytes()
                    self.send_response(200)
                    self.send_header("Content-Type", ctype)
                    self.send_header("Content-Length", str(len(data)))
                    self.send_header("Cache-Control", "no-cache")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(data)
                    return

        json_response(self, 404, {"ok": False, "error": "Not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        parts = [part for part in path.split("/") if part]


        if path == "/mcp" or path == "/":
            payload = self.read_json_payload()
            if payload is None:
                return
            if payload.get("jsonrpc") != "2.0":
                json_response(self, 400, {"error": "Invalid jsonrpc"})
                return
                
            req_id = payload.get("id")
            method = payload.get("method")

            # MCP lifecycle handshake — a real MCP client (OpenClaw, Claude Desktop)
            # calls initialize -> notifications/initialized before tools/list.
            if method == "initialize":
                params = payload.get("params") if isinstance(payload.get("params"), dict) else {}
                json_response(self, 200, {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": params.get("protocolVersion") or "2024-11-05",
                        "capabilities": {"tools": {"listChanged": False}},
                        "serverInfo": {"name": "launchops-server", "version": "1.0.0"},
                    },
                })
                return

            if method in ("notifications/initialized", "initialized", "notifications/cancelled"):
                # JSON-RPC notification: no result expected. Acknowledge with 202, no body.
                self.send_response(202)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                return

            if method == "ping":
                json_response(self, 200, {"jsonrpc": "2.0", "id": req_id, "result": {}})
                return

            if method == "tools/list":
                json_response(self, 200, {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "tools": [
                            {
                                "name": "analyze_launch_brief",
                                "description": "Phân tích Launch Brief chuyên sâu để chấm điểm readiness (Green/Yellow/Red), phản biện bằng Red Team, tạo checklist hành động và post-mortem.",
                                "inputSchema": {
                                    "type": "object",
                                    "properties": {
                                        "brief": {
                                            "type": "string",
                                            "description": "Nội dung văn bản launch brief đầy đủ cần phân tích."
                                        },
                                        "type": {
                                            "type": "string",
                                            "description": "Phân loại launch nếu có (game_event_h5, marketing, webshop_promotion)."
                                        }
                                    },
                                    "required": ["brief"]
                                }
                            }
                        ]
                    }
                })
                return
                
            if method == "tools/call":
                params = payload.get("params", {})
                tool_name = params.get("name", "").strip()
                args = params.get("arguments") if isinstance(params.get("arguments"), dict) else {}
                brief = str(args.get("brief", "")).strip()
                
                if tool_name != "analyze_launch_brief":
                    json_response(self, 200, {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"}})
                    return
                if not brief:
                    json_response(self, 200, {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32602, "message": "Missing parameter: brief"}})
                    return
                    
                try:
                    launch_type = str(args.get("type") or "").strip()
                    launch_ctx = {"type": launch_type} if launch_type else None
                    # MCP Gateway upstream timeout is 15s; the full 5-LLM pipeline takes ~100s
                    # and would 504. Use the deterministic rule-based path (<1s) for MCP tool
                    # calls — still returns real score + 5 personas + 8 tasks + 3 postmortem.
                    result = orchestrate_launchops_analysis(brief, launch_ctx, force_fast=True)
                    json_response(self, 200, {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": {
                            "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False, separators=(",", ":"))}]
                        }
                    })
                except Exception as exc:
                    write_backend_log(f"MCP JSON-RPC crash: {type(exc).__name__}")
                    json_response(self, 200, {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32603, "message": str(exc)}})
                return
                
            json_response(self, 200, {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Method not found: {method}"}})
            return

        if path == "/tools/call":
            payload = self.read_json_payload()
            if payload is None:
                return
            tool_name = str(payload.get("name", "")).strip()
            args = payload.get("arguments") if isinstance(payload.get("arguments"), dict) else {}
            brief = str(args.get("brief", "")).strip()
            
            if tool_name != "analyze_launch_brief":
                json_response(self, 400, {"ok": False, "error": f"Unknown tool: {tool_name}"})
                return
            if not brief:
                json_response(self, 400, {"ok": False, "error": "Missing parameter: brief"})
                return

            try:
                launch_type = str(args.get("type") or "").strip()
                launch_ctx = {"type": launch_type} if launch_type else None
                result = orchestrate_launchops_analysis(brief, launch_ctx)
                
                # Format response back to MCP specs
                mcp_text = f"Kết quả phân tích LaunchOps Command Center:\n" \
                           f"- Trạng thái sẵn sàng: {result['decision']['color']} ({result['decision']['score']}/{result['decision']['maxScore']} điểm)\n" \
                           f"- Kết luận: {result['decision']['title']}\n" \
                           f"- Chi tiết lý do: {result['decision']['reason']}\n\n" \
                           f"Top Rủi ro lớn nhất:\n"
                for r in result.get("topRisks", []):
                    mcp_text += f"  * {r}\n"
                
                mcp_text += f"\nRed Team phản biện (5 Persona):\n"
                for c in result.get("redTeam", []):
                    mcp_text += f"  * [{c['persona']}]: Lo ngại: {c['worry']} | Chứng cứ: {c['evidence']} | Đề xuất sửa: {c['fix']}\n"
                
                mcp_text += f"\nChecklist việc cần làm (Chủ sở hữu & Hạn chót):\n"
                for t in result.get("checklist", []):
                    mcp_text += f"  * {t['task']} | Owner: {t['owner']} | Deadline: {t['deadline']} | Trạng thái: {t['status']}\n"
                
                json_response(self, 200, {
                    "content": [
                        {
                            "type": "text",
                            "text": mcp_text
                        }
                    ],
                    "isError": False
                })
            except Exception as exc:
                write_backend_log(f"MCP tool call analyze_launch_brief crashed: {type(exc).__name__}")
                json_response(self, 200, {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Lỗi gọi tool phân tích: {type(exc).__name__}. Vui lòng thử lại."
                        }
                    ],
                    "isError": True
                })
            return

        if path in ("/webhooks/telegram", "/api/webhooks/telegram", "/webhooks/zalo", "/api/webhooks/zalo", "/api/chatbot"):
            if not is_webhook_authorized(self):
                json_response(self, 401, {"ok": False, "error": "Unauthorized"})
                return
            payload = self.read_json_payload()
            if payload is None:
                return
            provider = "telegram" if "telegram" in path else "zalo" if "zalo" in path else str(payload.get("provider") or "generic").strip().lower()
            try:
                result = handle_chatbot_payload(provider, payload)
                json_response(self, 200 if result.get("ok") else 400, result)
            except Exception as exc:
                write_backend_log(f"Chatbot webhook crashed: {type(exc).__name__}")
                write_backend_log(traceback.format_exc())
                json_response(self, 200, {"ok": True, "provider": provider, "reply": format_chatbot_reply(fallback_result(f"Webhook fallback: {type(exc).__name__}.")), "delivered": False})
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
                        "result": fallback_result(f"Backend lỗi nhưng đã fallback: {type(exc).__name__}."),
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
                result = fallback_result(f"Backend lỗi nhưng đã fallback: {type(exc).__name__}.")
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

        if path == "/mcp":
            # Session termination không hỗ trợ (server stateless) — 405 để SDK client bỏ qua êm.
            json_response(self, 405, {"ok": False, "error": "Session termination not supported"})
            return

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
