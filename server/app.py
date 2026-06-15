from __future__ import annotations

import base64
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
from urllib.parse import parse_qs, urlencode, urlparse

from db import (
    cloud_append_analysis,
    cloud_delete_launch,
    cloud_get_launch,
    cloud_list_launches,
    cloud_save_launch,
    cloud_save_postmortem,
    cloud_storage_requested,
    find_lessons,
    get_product_snapshot,
    get_type_profile,
    list_launch_types,
    save_launch_type,
    storage_backend_status,
)


HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", os.getenv("LAUNCHOPS_BACKEND_PORT", "8080")))
MAX_BODY_BYTES = 256 * 1024
APP_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = APP_ROOT.parent
LAUNCHES_DIR = APP_ROOT / "memory" / "launches"
LAUNCH_STATUSES = {"upcoming", "running", "completed"}
CAVEMAN_ENABLED = os.getenv("LAUNCHOPS_CAVEMAN_STYLE", "").strip().lower() in {"1", "true", "yes", "on"}
UI_CACHE_VERSION = "fix-20260615a"
ANALYZE_TOOL_NAME = "analyze_launch_brief"
LCC_TOOL_ALIAS = "lcc"
ANALYZE_TOOL_NAMES = {ANALYZE_TOOL_NAME, LCC_TOOL_ALIAS}
LCC_LIST_LAUNCHES_TOOL = "lcc_list_launches"
LCC_GET_LAUNCH_TOOL = "lcc_get_launch"
LCC_CREATE_LAUNCH_TOOL = "lcc_create_launch"
LCC_UPDATE_LAUNCH_TOOL = "lcc_update_launch"
LCC_ANALYZE_LAUNCH_TOOL = "lcc_analyze_launch"
LCC_DELETE_LAUNCH_TOOL = "lcc_delete_launch"
LCC_LIST_TYPES_TOOL = "lcc_list_types"
LCC_GET_TYPE_TOOL = "lcc_get_type"
LCC_CREATE_TYPE_TOOL = "lcc_create_type"
LCC_SET_LAUNCH_TEMPLATE_TOOL = "lcc_set_launch_template"
LCC_DOCS_TOOL = "lcc_docs"
LAUNCHOPS_MCP_TOOLS = {
    ANALYZE_TOOL_NAME,
    LCC_TOOL_ALIAS,
    LCC_LIST_LAUNCHES_TOOL,
    LCC_GET_LAUNCH_TOOL,
    LCC_CREATE_LAUNCH_TOOL,
    LCC_UPDATE_LAUNCH_TOOL,
    LCC_ANALYZE_LAUNCH_TOOL,
    LCC_DELETE_LAUNCH_TOOL,
    LCC_LIST_TYPES_TOOL,
    LCC_GET_TYPE_TOOL,
    LCC_CREATE_TYPE_TOOL,
    LCC_SET_LAUNCH_TEMPLATE_TOOL,
    LCC_DOCS_TOOL,
}
LCC_NAMESPACED_COMMANDS = {"help", "status", "list", "config", "analyze", "guardrail", "infra", "report"}
LEGACY_CHATBOT_COMMANDS = LCC_NAMESPACED_COMMANDS | {"start", "caveman"}
DEFAULT_AGENT_ROLE = "orchestrator"
AGENT_ROLES = {"orchestrator", "readiness", "redteam", "checklist", "postmortem", "memory"}
REMOTE_AGENT_ROLES = ("readiness", "redteam", "checklist", "postmortem")
REMOTE_AGENT_URL_ENV = {
    "readiness": "LAUNCHOPS_READINESS_URL",
    "redteam": "LAUNCHOPS_REDTEAM_URL",
    "checklist": "LAUNCHOPS_CHECKLIST_URL",
    "postmortem": "LAUNCHOPS_POSTMORTEM_URL",
    "memory": "LAUNCHOPS_MEMORY_URL",
}
AGENT_ROLE_ALIASES = {
    "lcc_orchestrator": "orchestrator",
    "lcc_orchestrator_agent": "orchestrator",
    "readiness_agent": "readiness",
    "lcc_readiness_agent": "readiness",
    "red_team": "redteam",
    "redteam_agent": "redteam",
    "red_team_agent": "redteam",
    "lcc_redteam_agent": "redteam",
    "lcc_red_team_agent": "redteam",
    "checklist_agent": "checklist",
    "lcc_checklist_agent": "checklist",
    "post_mortem": "postmortem",
    "postmortem_agent": "postmortem",
    "post_mortem_agent": "postmortem",
    "lcc_postmortem_agent": "postmortem",
    "lcc_post_mortem_agent": "postmortem",
    "memory_agent": "memory",
    "lcc_memory_agent": "memory",
}
AGENTBASE_MEMORY_BASE_URL = "https://agentbase.api.vngcloud.vn/memory"
IAM_TOKEN_URL = "https://iam.api.vngcloud.vn/accounts-api/v2/auth/token"
_MEMORY_TOKEN_CACHE: dict[str, Any] = {"token": "", "expiresAt": 0.0}
_CLOUD_STORAGE_ERROR = object()

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


def try_cloud_storage(label: str, func: Any, *args: Any) -> Any:
    if not cloud_storage_requested():
        return _CLOUD_STORAGE_ERROR
    try:
        return func(*args)
    except Exception as exc:
        write_backend_log(f"Cloud storage fallback for {label}: {type(exc).__name__}")
        return _CLOUD_STORAGE_ERROR


def normalize_status(value: Any) -> str:
    status = str(value or "upcoming").strip().lower()
    return status if status in LAUNCH_STATUSES else "upcoming"

def normalize_tool_name(value: Any) -> str:
    name = str(value or "").strip()
    if name in ANALYZE_TOOL_NAMES:
        return ANALYZE_TOOL_NAME
    return name

def normalize_agent_role(value: Any) -> str:
    role = re.sub(r"[^a-z0-9]+", "_", str(value or DEFAULT_AGENT_ROLE).strip().lower()).strip("_")
    role = AGENT_ROLE_ALIASES.get(role, role)
    return role if role in AGENT_ROLES else role

def current_agent_role() -> str:
    role = normalize_agent_role(os.getenv("LAUNCHOPS_AGENT_ROLE", DEFAULT_AGENT_ROLE))
    return role if role in AGENT_ROLES else DEFAULT_AGENT_ROLE

def agent_role_name(role: str) -> str:
    if role == "orchestrator":
        return "lcc-orchestrator"
    return f"lcc-{role}-agent"

def remote_agents_enabled() -> bool:
    return truthy_env("LAUNCHOPS_USE_REMOTE_AGENTS") or truthy_env("LAUNCHOPS_REMOTE_AGENTS_ENABLED")

def remote_agent_url(role: str) -> str:
    env_name = REMOTE_AGENT_URL_ENV.get(normalize_agent_role(role), "")
    return os.getenv(env_name, "").strip().rstrip("/") if env_name else ""

def remote_agent_timeout_seconds() -> float:
    raw = os.getenv("LAUNCHOPS_AGENT_TIMEOUT_SECONDS", os.getenv("LAUNCHOPS_REMOTE_AGENT_TIMEOUT_SECONDS", "75")).strip()
    try:
        return max(1.0, min(float(raw), 180.0))
    except ValueError:
        return 75.0

def analyze_tool_definition(name: str) -> dict[str, Any]:
    description = "Phân tích Launch Brief chuyên sâu để chấm điểm readiness (Green/Yellow/Red), phản biện bằng Red Team, tạo checklist hành động và post-mortem."
    if name == LCC_TOOL_ALIAS:
        description = f"Alias ngắn của `{ANALYZE_TOOL_NAME}` cho LaunchOps Command Center."
    return {
        "name": name,
        "description": description,
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

def mcp_tool_definition(name: str, description: str, properties: dict[str, Any], required: list[str] | None = None) -> dict[str, Any]:
    return {
        "name": name,
        "description": description,
        "inputSchema": {
            "type": "object",
            "properties": properties,
            "required": required or [],
        },
    }

def mcp_tool_definitions() -> list[dict[str, Any]]:
    return [
        mcp_tool_definition(
            LCC_DOCS_TOOL,
            "Read the LaunchOps Command Center (LCC) usage guide: what LCC does, the full tool catalog, and which tool to use for a given user request. Call this FIRST when unsure how to help, then pick the right LCC tool.",
            {
                "topic": {"type": "string", "description": "Optional focus: overview, tools, workflow, or a tool name. Empty returns the full guide."},
            },
        ),
        analyze_tool_definition(ANALYZE_TOOL_NAME),
        analyze_tool_definition(LCC_TOOL_ALIAS),
        mcp_tool_definition(
            LCC_LIST_LAUNCHES_TOOL,
            "List saved LaunchOps launches. Use this before asking the user to paste a brief if they ask what launches exist.",
            {
                "status": {"type": "string", "description": "Optional status filter: upcoming, running, completed."},
                "type": {"type": "string", "description": "Optional launch type/name filter."},
                "limit": {"type": "number", "description": "Maximum rows to return, default 10."},
            },
        ),
        mcp_tool_definition(
            LCC_GET_LAUNCH_TOOL,
            "Get a saved launch by id or display name, including brief, template, latest analysis and metadata.",
            {
                "launchId": {"type": "string", "description": "Launch id, for example lucky-wheel-weekend."},
                "name": {"type": "string", "description": "Launch display name when id is unknown."},
            },
        ),
        mcp_tool_definition(
            LCC_CREATE_LAUNCH_TOOL,
            "Create a saved LaunchOps launch from chat. Provide at least name or brief.",
            {
                "name": {"type": "string", "description": "Launch name."},
                "type": {"type": "string", "description": "Launch type or category."},
                "status": {"type": "string", "description": "upcoming, running, or completed."},
                "owner": {"type": "string", "description": "Owner or team."},
                "targetDate": {"type": "string", "description": "Start/target date."},
                "endDate": {"type": "string", "description": "End date."},
                "brief": {"type": "string", "description": "Launch brief text."},
            },
        ),
        mcp_tool_definition(
            LCC_UPDATE_LAUNCH_TOOL,
            "Update fields on an existing launch by id or name. Only supplied fields are changed.",
            {
                "launchId": {"type": "string", "description": "Launch id."},
                "name": {"type": "string", "description": "Existing launch name if id is unknown."},
                "newName": {"type": "string", "description": "New display name."},
                "type": {"type": "string", "description": "New type/category."},
                "status": {"type": "string", "description": "upcoming, running, or completed."},
                "owner": {"type": "string", "description": "Owner or team."},
                "targetDate": {"type": "string", "description": "Start/target date."},
                "endDate": {"type": "string", "description": "End date."},
                "brief": {"type": "string", "description": "Replacement launch brief."},
            },
        ),
        mcp_tool_definition(
            LCC_ANALYZE_LAUNCH_TOOL,
            "Analyze an existing saved launch by id or name and append the analysis to that launch. Fast deterministic path for chat/MCP.",
            {
                "launchId": {"type": "string", "description": "Launch id."},
                "name": {"type": "string", "description": "Launch name if id is unknown."},
                "brief": {"type": "string", "description": "Optional brief override before analysis."},
            },
        ),
        mcp_tool_definition(
            LCC_DELETE_LAUNCH_TOOL,
            "Delete a launch. Requires confirm value DELETE <launchId> to avoid accidental deletion.",
            {
                "launchId": {"type": "string", "description": "Launch id."},
                "name": {"type": "string", "description": "Launch name if id is unknown."},
                "confirm": {"type": "string", "description": "Must equal DELETE <launchId>."},
            },
            ["confirm"],
        ),
        mcp_tool_definition(
            LCC_LIST_TYPES_TOOL,
            "List launch classifications/type profiles available to LaunchOps.",
            {},
        ),
        mcp_tool_definition(
            LCC_GET_TYPE_TOOL,
            "Get one launch classification/type profile by id.",
            {"typeId": {"type": "string", "description": "Type id, for example game_event_h5."}},
            ["typeId"],
        ),
        mcp_tool_definition(
            LCC_CREATE_TYPE_TOOL,
            "Create or replace a launch classification/type profile.",
            {
                "typeId": {"type": "string", "description": "Stable type id."},
                "name": {"type": "string", "description": "Display name."},
                "domain": {"type": "string", "description": "Domain, for example game or marketing."},
                "description": {"type": "string", "description": "Short description."},
                "riskGroups": {"type": "array", "description": "List of risk group names or objects with label/maxScore."},
                "redTeamPersonas": {"type": "array", "description": "Optional list of persona names."},
                "checklistExamples": {"type": "array", "description": "Optional checklist examples."},
                "postmortemBlocks": {"type": "array", "description": "Optional postmortem block names."},
            },
            ["name"],
        ),
        mcp_tool_definition(
            LCC_SET_LAUNCH_TEMPLATE_TOOL,
            "Set or replace the active template on a saved launch. This affects future scoring for that launch.",
            {
                "launchId": {"type": "string", "description": "Launch id."},
                "name": {"type": "string", "description": "Launch name if id is unknown."},
                "templateName": {"type": "string", "description": "Template display name."},
                "description": {"type": "string", "description": "Template description."},
                "riskGroups": {"type": "array", "description": "List of risk group names or objects with label/maxScore."},
                "redTeamPersonas": {"type": "array", "description": "Optional list of persona names."},
                "checklistExamples": {"type": "array", "description": "Optional checklist examples."},
                "postmortemBlocks": {"type": "array", "description": "Optional postmortem block names."},
                "template": {"type": "object", "description": "Full template object. Used when supplied."},
            },
        ),
    ]

def truthy_env(name: str, default: str = "") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on", "enabled"}

def memory_enabled() -> bool:
    return truthy_env("LAUNCHOPS_MEMORY_ENABLED")

def memory_timeout_seconds() -> float:
    raw = os.getenv("LAUNCHOPS_MEMORY_TIMEOUT_SECONDS", "8").strip()
    try:
        return max(1.0, min(float(raw), 30.0))
    except ValueError:
        return 8.0

def mask_sensitive_text(text: str) -> str:
    masked = re.sub(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", "[REDACTED_PRIVATE_KEY]", text, flags=re.DOTALL)
    masked = re.sub(r"(?i)(api[_ -]?key|token|secret|password|passwd|pwd)\s*[:=]\s*[^\\s,;]+", r"\1=[REDACTED_SECRET]", masked)
    masked = re.sub(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", "[REDACTED_EMAIL]", masked)
    masked = re.sub(r"(?:\+?84|0)[0-9 .-]{8,12}", "[REDACTED_PHONE]", masked)
    return masked

# WS3 guardrail: hard signals -> reject analyze; soft PII -> mask + proceed.
GUARDRAIL_HARD_PATTERNS = [
    ("private_key", r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    ("credential", r"(?i)(api[_ -]?key|token|secret|password|passwd|pwd)\s*[:=]\s*\S+"),
    ("payment_sensitive", r"(?i)\b(card number|credit card|cvv|otp|bank account|so the|so tai khoan)\b"),
]
GUARDRAIL_SOFT_PATTERNS = [
    ("email", r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"),
    ("phone", r"(?:\+?84|0)[0-9 .-]{8,12}"),
]


def guardrail_enabled() -> bool:
    return truthy_env("LAUNCHOPS_GUARDRAIL_ENABLED", "true")


def guardrail_check(brief: str) -> dict[str, Any]:
    """Return {enabled, action: pass|mask|reject, findings, hard, soft, brief}. brief is masked when action==mask."""
    text = str(brief or "")
    if not guardrail_enabled():
        return {"enabled": False, "action": "pass", "findings": [], "hard": [], "soft": [], "brief": text}
    hard = [label for label, pat in GUARDRAIL_HARD_PATTERNS if re.search(pat, text)]
    soft = [label for label, pat in GUARDRAIL_SOFT_PATTERNS if re.search(pat, text)]
    if hard:
        return {"enabled": True, "action": "reject", "findings": hard + soft, "hard": hard, "soft": soft, "brief": text}
    if soft:
        return {"enabled": True, "action": "mask", "findings": soft, "hard": [], "soft": soft, "brief": mask_sensitive_text(text)}
    return {"enabled": True, "action": "pass", "findings": [], "hard": [], "soft": [], "brief": text}


def guardrail_trace(check: dict[str, Any]) -> dict[str, Any]:
    return {
        "enabled": bool(check.get("enabled")),
        "action": check.get("action", "pass"),
        "findings": check.get("findings", []),
    }


def guardrail_reject_message(check: dict[str, Any]) -> str:
    labels = ", ".join(check.get("hard", []) or check.get("findings", []))
    return (
        f"Brief chứa dữ liệu nhạy cảm ({labels}). Vì an toàn, LaunchOps không phân tích brief có secret/PII nặng. "
        "Hãy xoá key/token/mật khẩu/số thẻ/CVV/OTP và thay dữ liệu thật bằng ví dụ giả, rồi phân tích lại."
    )


# WS4 app-level rate limit (sliding window, in-memory). Default OFF; protects the expensive LLM analyze path.
# Caveat: in-memory => resets on container restart and is NOT shared across replicas (production min/max=1 so OK).
_RATE_LIMIT_HITS: dict[str, list[float]] = {}


def ratelimit_enabled() -> bool:
    return truthy_env("LAUNCHOPS_RATELIMIT_ENABLED", "false")


def _ratelimit_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    try:
        return int(raw) if raw else default
    except ValueError:
        return default


def rate_limit_client_key(handler: Any) -> str:
    headers = getattr(handler, "headers", None)
    xff = headers.get("X-Forwarded-For", "") if headers else ""
    if xff:
        return xff.split(",")[0].strip() or "unknown"
    addr = getattr(handler, "client_address", None)
    return addr[0] if addr else "unknown"


def rate_limit_check(key: str) -> dict[str, Any]:
    """Sliding window per key. Returns {allowed, retryAfter, scope, limit, remainingMin, remainingDay}."""
    per_min = _ratelimit_int("LAUNCHOPS_RATELIMIT_ANALYZE_PER_MIN", 10)
    per_day = _ratelimit_int("LAUNCHOPS_RATELIMIT_ANALYZE_PER_DAY", 200)
    now = time.time()
    hits = [t for t in _RATE_LIMIT_HITS.get(key, []) if now - t < 86400]
    last_min = [t for t in hits if now - t < 60]
    if len(last_min) >= per_min:
        retry = int(60 - (now - min(last_min))) + 1
        _RATE_LIMIT_HITS[key] = hits
        return {"allowed": False, "retryAfter": max(retry, 1), "scope": "minute", "limit": per_min}
    if len(hits) >= per_day:
        retry = int(86400 - (now - min(hits))) + 1
        _RATE_LIMIT_HITS[key] = hits
        return {"allowed": False, "retryAfter": max(retry, 1), "scope": "day", "limit": per_day}
    hits.append(now)
    _RATE_LIMIT_HITS[key] = hits
    return {"allowed": True, "retryAfter": 0, "scope": "", "limit": per_min, "remainingMin": per_min - len(last_min) - 1, "remainingDay": per_day - len(hits)}


def enforce_analyze_rate_limit(handler: Any) -> bool:
    """Returns True if allowed; otherwise writes a 429 response and returns False. No-op when disabled."""
    if not ratelimit_enabled():
        return True
    verdict = rate_limit_check(f"analyze:{rate_limit_client_key(handler)}")
    if not verdict["allowed"]:
        json_response(handler, 429, {
            "ok": False,
            "error": f"Rate limit exceeded ({verdict['scope']}, limit={verdict['limit']}). Thử lại sau {verdict['retryAfter']}s.",
            "retryAfter": verdict["retryAfter"],
        })
        return False
    return True

def memory_namespace(strategy_id: str, actor_id: str, session_id: str, launch_type: str, game_id: str) -> str:
    mode = os.getenv("LAUNCHOPS_MEMORY_NAMESPACE_MODE", "actor").strip().lower()
    if mode == "product":
        return f"/launchops/products/{slugify(game_id)}/{slugify(launch_type)}"
    if mode == "global":
        return f"/launchops/global/{slugify(launch_type)}"
    if mode == "session":
        return f"/strategies/{strategy_id}/actors/{slugify(actor_id)}/sessions/{slugify(session_id)}"
    return f"/strategies/{strategy_id}/actors/{slugify(actor_id)}"

def memory_context_from_headers(headers: Any, launch_context: dict[str, Any] | None = None) -> dict[str, Any]:
    launch_context = launch_context or {}
    actor_id = str(headers.get("X-GreenNode-AgentBase-User-Id") or "").strip()
    session_id = str(headers.get("X-GreenNode-AgentBase-Session-Id") or "").strip()
    if actor_id and session_id:
        return {"actorId": actor_id, "sessionId": session_id, "source": "headers", "warning": ""}
    if truthy_env("LAUNCHOPS_MEMORY_DEMO_FALLBACK_ENABLED"):
        launch_id = str(launch_context.get("id") or launch_context.get("launchId") or "demo-session").strip()
        return {
            "actorId": "demo-user",
            "sessionId": slugify(launch_id),
            "source": "demo_fallback",
            "warning": "Missing AgentBase user/session headers; using explicit demo actor/session.",
        }
    return {"actorId": "", "sessionId": "", "source": "missing_headers", "warning": "Missing AgentBase user/session headers; memory skipped."}

def agentbase_iam_token() -> str:
    injected_token = os.getenv("LAUNCHOPS_MEMORY_ACCESS_TOKEN", "").strip() or os.getenv("GREENNODE_ACCESS_TOKEN", "").strip()
    if injected_token:
        return injected_token

    now = time.time()
    cached_token = str(_MEMORY_TOKEN_CACHE.get("token") or "")
    cached_expiry = float(_MEMORY_TOKEN_CACHE.get("expiresAt") or 0)
    if cached_token and cached_expiry > now + 60:
        return cached_token

    client_id = os.getenv("GREENNODE_CLIENT_ID", "").strip()
    client_secret = os.getenv("GREENNODE_CLIENT_SECRET", "").strip()
    if not client_id or not client_secret:
        raise RuntimeError("GREENNODE_CLIENT_ID/GREENNODE_CLIENT_SECRET missing")

    auth = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("ascii")
    request = urllib.request.Request(
        IAM_TOKEN_URL,
        data=b"grant_type=client_credentials",
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=memory_timeout_seconds()) as response:
        payload = json.loads(response.read().decode("utf-8"))
    token = str(payload.get("access_token") or "").strip()
    if not token:
        raise RuntimeError("IAM token response missing access_token")
    expires_in = payload.get("expires_in") or payload.get("expiresIn") or 3000
    try:
        ttl = max(300, int(expires_in))
    except (TypeError, ValueError):
        ttl = 3000
    _MEMORY_TOKEN_CACHE.update({"token": token, "expiresAt": now + ttl})
    return token

def agentbase_memory_request(method: str, path: str, payload: dict[str, Any] | None = None, query: dict[str, Any] | None = None) -> Any:
    base_url = os.getenv("LAUNCHOPS_MEMORY_BASE_URL", AGENTBASE_MEMORY_BASE_URL).rstrip("/")
    if not base_url.startswith("https://agentbase.api.vngcloud.vn/memory"):
        raise RuntimeError("Invalid LAUNCHOPS_MEMORY_BASE_URL")
    query_string = f"?{urlencode(query)}" if query else ""
    data = json.dumps(payload or {}, ensure_ascii=False).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        f"{base_url}{path}{query_string}",
        data=data,
        headers={
            "Authorization": f"Bearer {agentbase_iam_token()}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    with urllib.request.urlopen(request, timeout=memory_timeout_seconds()) as response:
        raw = response.read()
    if not raw:
        return {}
    return json.loads(raw.decode("utf-8"))

# WS1 RAG: semantic recall from a dedicated curated knowledge store (separate from the conversation memory store).
def rag_enabled() -> bool:
    return truthy_env("LAUNCHOPS_RAG_ENABLED", "false")


def knowledge_namespace(launch_type: str) -> str:
    return f"/launchops/knowledge/{slugify(launch_type or 'generic')}"


def knowledge_product_namespace(game_id: str, launch_type: str) -> str:
    return f"/launchops/products/{slugify(game_id or 'demo_game')}/{slugify(launch_type or 'generic')}"


def _search_knowledge_namespace(memory_id: str, brief: str, namespace: str, limit: int) -> list[dict[str, Any]]:
    payload = agentbase_memory_request(
        "POST",
        f"/memories/{memory_id}/memory-records:search",
        {"query": mask_sensitive_text(brief), "limit": max(int(limit), 5)},
        {"namespace": namespace},
    )
    return extract_memory_records(payload, limit=max(int(limit), 5))


def recall_knowledge(brief: str, launch_type: str, game_id: str = "", limit: int = 5) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """WS1+WS2: semantic recall grounding the agents. Searches the product-specific namespace first (if a
    product is known) then the shared launch-type namespace, merged + deduped. Flag-gated; safe no-op when off."""
    trace: dict[str, Any] = {"enabled": rag_enabled(), "source": "disabled", "namespaces": [], "recordsRecalled": 0, "store": "knowledge"}
    if not rag_enabled():
        return [], trace
    memory_id = os.getenv("LAUNCHOPS_KNOWLEDGE_MEMORY_ID", "").strip()
    if not memory_id:
        trace["source"] = "missing_knowledge_id"
        return [], trace
    namespaces: list[str] = []
    if game_id:
        namespaces.append(knowledge_product_namespace(game_id, launch_type))
    namespaces.append(knowledge_namespace(launch_type))
    trace.update({"source": "agentbase", "namespaces": namespaces})
    merged: list[dict[str, Any]] = []
    seen: set[str] = set()
    errors: list[str] = []
    for namespace in namespaces:
        try:
            for rec in _search_knowledge_namespace(memory_id, brief, namespace, limit):
                key = str(rec.get("memory") or rec.get("content") or rec.get("text") or rec.get("id") or "")[:120]
                if key and key not in seen:
                    seen.add(key)
                    merged.append(rec)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{namespace}:{type(exc).__name__}")
            write_backend_log(f"RAG knowledge recall failed ({namespace}): {type(exc).__name__}")
    if errors and not merged:
        trace.update({"source": "agentbase_error", "errors": errors})
        return [], trace
    if errors:
        trace["partialErrors"] = errors
    trace["recordsRecalled"] = len(merged)
    trace["recordIds"] = [str(r.get("id") or r.get("title") or "")[:48] for r in merged]
    return merged, trace

def memory_config_error() -> str:
    if not memory_enabled():
        return "disabled"
    if not os.getenv("LAUNCHOPS_MEMORY_ID", "").strip():
        return "missing_memory_id"
    if not os.getenv("LAUNCHOPS_MEMORY_STRATEGY_ID", "").strip():
        return "missing_strategy_id"
    return ""

def extract_memory_records(payload: Any, limit: int = 5) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        items = payload
    elif isinstance(payload, dict):
        for key in ("memoryRecords", "records", "listData", "data", "items", "content"):
            value = payload.get(key)
            if isinstance(value, list):
                items = value
                break
        else:
            items = []
    else:
        items = []

    records: list[dict[str, Any]] = []
    for index, item in enumerate(items):
        if isinstance(item, str):
            text = item
            record_id = f"memory-{index + 1}"
            metadata = {}
        elif isinstance(item, dict):
            record_id = str(item.get("id") or item.get("recordId") or f"memory-{index + 1}")
            text = str(item.get("memory") or item.get("content") or item.get("text") or item.get("value") or item.get("summary") or "").strip()
            metadata = item.get("metadata") if isinstance(item.get("metadata"), dict) else {}
            if not text and isinstance(item.get("payload"), dict):
                payload_obj = item["payload"]
                text = str(payload_obj.get("memory") or payload_obj.get("content") or payload_obj.get("text") or "").strip()
        else:
            continue
        if not text:
            continue
        title = str(metadata.get("title") or metadata.get("type") or "AgentBase Memory").strip()
        severity = str(metadata.get("severity") or "Medium").strip()
        records.append({"id": record_id, "title": title, "lesson": text, "severity": severity, "source": "agentbase_memory"})
        if len(records) >= limit:
            break
    return records

def recall_agentbase_memory(brief: str, launch_context: dict[str, Any], launch_type: str, game_id: str, limit: int = 5) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    trace = {
        "enabled": memory_enabled(),
        "source": "disabled",
        "namespace": "",
        "recordsRecalled": 0,
        "writeStatus": "not_attempted",
    }
    config_error = memory_config_error()
    if config_error:
        trace["source"] = config_error
        return [], trace

    memory_context = launch_context.get("memoryContext") if isinstance(launch_context.get("memoryContext"), dict) else {}
    actor_id = str(memory_context.get("actorId") or "").strip()
    session_id = str(memory_context.get("sessionId") or "").strip()
    if not actor_id or not session_id:
        trace["source"] = "missing_headers"
        trace["warning"] = str(memory_context.get("warning") or "Missing AgentBase user/session headers; memory skipped.")
        return [], trace

    memory_id = os.getenv("LAUNCHOPS_MEMORY_ID", "").strip()
    strategy_id = os.getenv("LAUNCHOPS_MEMORY_STRATEGY_ID", "").strip()
    namespace = memory_namespace(strategy_id, actor_id, session_id, launch_type, game_id)
    trace.update({"source": "agentbase", "namespace": namespace})
    if memory_context.get("warning"):
        trace["warning"] = str(memory_context["warning"])
    try:
        payload = agentbase_memory_request(
            "POST",
            f"/memories/{memory_id}/memory-records:search",
            {"query": mask_sensitive_text(brief), "limit": limit},
            {"namespace": namespace},
        )
        records = extract_memory_records(payload, limit=limit)
        trace["recordsRecalled"] = len(records)
        return records, trace
    except Exception as exc:
        trace.update({"source": "agentbase_error", "error": type(exc).__name__})
        write_backend_log(f"AgentBase Memory recall failed: {type(exc).__name__}")
        return [], trace

def write_agentbase_memory_event(memory_context: dict[str, Any], role: str, message: str) -> str:
    config_error = memory_config_error()
    if config_error:
        return config_error
    actor_id = str(memory_context.get("actorId") or "").strip()
    session_id = str(memory_context.get("sessionId") or "").strip()
    if not actor_id or not session_id:
        return "missing_headers"
    memory_id = os.getenv("LAUNCHOPS_MEMORY_ID", "").strip()
    payload = {"payload": {"type": "conversational", "role": role, "message": mask_sensitive_text(message)[:100000]}}
    try:
        agentbase_memory_request("POST", f"/memories/{memory_id}/actors/{actor_id}/sessions/{session_id}/events", payload)
        return "ok"
    except Exception as exc:
        write_backend_log(f"AgentBase Memory event write failed: {type(exc).__name__}")
        return f"error:{type(exc).__name__}"

def insert_agentbase_memory_record(memory_context: dict[str, Any], launch_context: dict[str, Any], lesson: str) -> str:
    config_error = memory_config_error()
    if config_error:
        return config_error
    actor_id = str(memory_context.get("actorId") or "").strip()
    session_id = str(memory_context.get("sessionId") or "").strip()
    if not actor_id or not session_id:
        return "missing_headers"
    memory_id = os.getenv("LAUNCHOPS_MEMORY_ID", "").strip()
    strategy_id = os.getenv("LAUNCHOPS_MEMORY_STRATEGY_ID", "").strip()
    launch_type = infer_launch_type(str(launch_context.get("brief") or ""), launch_context)
    game_id = str(launch_context.get("gameId") or launch_context.get("game_id") or "demo_game")
    namespace = memory_namespace(strategy_id, actor_id, session_id, launch_type, game_id)
    title = str(launch_context.get("name") or "Launch lesson").strip()
    record = mask_sensitive_text(f"{title}: {lesson} [launchType={launch_type}; gameId={game_id}]")
    try:
        agentbase_memory_request("POST", f"/memories/{memory_id}/memory-records:insert-directly", {"memoryRecords": [record]}, {"namespace": namespace})
        return "ok"
    except Exception as exc:
        write_backend_log(f"AgentBase Memory record insert failed: {type(exc).__name__}")
        return f"error:{type(exc).__name__}"


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


def may_login_sample_result() -> dict[str, Any]:
    result = sample_decision(
        "Yellow",
        8,
        "Sự kiện đạt mục tiêu giữ chân nhẹ và không vượt ngân sách, nhưng thông điệp reset ngày, FAQ CS và ngưỡng pause chưa đủ rõ.",
    )
    result["riskBreakdown"] = [
        {"label": "Mục tiêu và scope", "score": 2, "maxScore": 2, "missing": "Mục tiêu và đối tượng đã đủ rõ."},
        {"label": "Người phụ trách và hạn xử lý", "score": 1, "maxScore": 2, "missing": "Chưa ghi rõ owner trực trong 6 giờ đầu launch."},
        {"label": "Sẵn sàng kỹ thuật", "score": 1, "maxScore": 2, "missing": "Chưa có ngưỡng pause nếu hệ thống ghi nhận login sai."},
        {"label": "User impact", "score": 1, "maxScore": 2, "missing": "Thông điệp reset ngày và điều kiện chuỗi liên tục chưa đủ rõ."},
        {"label": "Business và reward", "score": 2, "maxScore": 2, "missing": "Reward không vượt ngân sách."},
        {"label": "Bài học sau launch", "score": 1, "maxScore": 2, "missing": "Post-mortem chưa có câu hỏi về hiểu nhầm điều kiện event."},
    ]
    result["topRisks"] = [
        "Người chơi hiểu nhầm mốc reset ngày và điều kiện đăng nhập liên tục.",
        "CS FAQ chưa đủ rõ cho các trường hợp mất chuỗi.",
        "Chưa có ngưỡng pause nếu hệ thống ghi nhận login sai.",
    ]
    result["redTeam"] = [
        {
            "persona": "Người chơi bức xúc",
            "worry": "Người chơi bỏ một ngày nhưng vẫn nghĩ mình đủ điều kiện nhận rương tổng kết.",
            "evidence": "Ticket CS tăng trong 6 giờ đầu vì hiểu nhầm điều kiện reset ngày.",
            "fix": "Ghi rõ mốc reset ngày, điều kiện liên tục và ví dụ minh họa trong in-game message.",
        },
        {
            "persona": "Trưởng nhóm CS",
            "worry": "CS mất thời gian giải thích lặp lại cùng một lỗi hiểu nhầm.",
            "evidence": "FAQ có nhưng chưa đủ case về mất chuỗi và reset ngày.",
            "fix": "Bổ sung macro trả lời theo từng trường hợp: bỏ ngày, reset ngày, claim rương tổng kết.",
        },
        {
            "persona": "Kỹ thuật trực sự cố",
            "worry": "Nếu hệ thống ghi nhận login sai thì team chưa có ngưỡng pause rõ.",
            "evidence": "Brief ghi không có lỗi nghiêm trọng nhưng chưa nêu alert/pause rule.",
            "fix": "Thêm alert và ngưỡng pause nếu login streak hoặc claim reward bất thường.",
        },
    ]
    result["checklist"] = [
        {"task": "Viết lại in-game message về mốc reset ngày và điều kiện đăng nhập liên tục", "owner": "PM LiveOps", "deadline": "Trước event tiếp theo", "status": "Todo", "priority": "High"},
        {"task": "Bổ sung CS FAQ cho case mất chuỗi, reset ngày và claim rương tổng kết", "owner": "CS Lead", "deadline": "Trước event tiếp theo", "status": "Todo", "priority": "High"},
        {"task": "Thêm alert nếu tỷ lệ claim reward thấp bất thường", "owner": "Tech Owner", "deadline": "Trước event tiếp theo", "status": "Todo", "priority": "Medium"},
    ]
    result["postmortem"] = [
        {"title": "Bài học chính", "items": ["Thông điệp điều kiện event phải có ví dụ cụ thể.", "CS FAQ cần cover các hiểu nhầm phổ biến trước launch."]},
        {"title": "Cần sửa template", "items": ["Thêm câu hỏi kiểm tra mốc reset ngày.", "Thêm checklist CS macro cho điều kiện nhận reward."]},
    ]
    return result


MOJIBAKE_MARKERS = (
    "Ã¡", "Ã ", "Ã¢", "Ã£", "Ã©", "Ã¨", "Ãª", "Ã­", "Ã¬", "Ã³", "Ã²", "Ã´", "Ãµ", "Ãº", "Ã¹", "Ã½",
    "Ä‘", "Ä", "áº", "á»", "Æ°", "Æ¡", "â€", "Â ",
)
LOSSY_TEXT_RE = re.compile(r"(?:[A-Za-zÀ-ỹ]\?[A-Za-zÀ-ỹ]|\?\?[A-Za-zÀ-ỹ]|[A-Za-zÀ-ỹ]\?\?|\?\?)")


def encoding_damage_score(value: Any) -> int:
    text = str(value or "")
    score = sum(text.count(marker) * 3 for marker in MOJIBAKE_MARKERS)
    if LOSSY_TEXT_RE.search(text):
        score += 5
    score += text.count("�") * 5
    return score


def repair_legacy_text(value: Any) -> str:
    text = str(value or "")
    if not encoding_damage_score(text) or LOSSY_TEXT_RE.search(text):
        return text
    candidates = [text]
    for encoding in ("latin-1", "cp1252"):
        try:
            candidates.append(text.encode(encoding).decode("utf-8"))
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    return min(candidates, key=encoding_damage_score)


def sanitize_legacy_encoding(value: Any) -> Any:
    if isinstance(value, str):
        return repair_legacy_text(value)
    if isinstance(value, list):
        return [sanitize_legacy_encoding(item) for item in value]
    if isinstance(value, dict):
        return {key: sanitize_legacy_encoding(item) for key, item in value.items()}
    return value


def contains_encoding_damage(value: Any) -> bool:
    if isinstance(value, str):
        return encoding_damage_score(value) > 0
    if isinstance(value, list):
        return any(contains_encoding_damage(item) for item in value)
    if isinstance(value, dict):
        return any(contains_encoding_damage(item) for item in value.values())
    return False


def clean_may_login_sample(existing: dict[str, Any]) -> dict[str, Any]:
    clean = next((item for item in default_sample_launches() if item.get("id") == "may-login-streak"), dict(existing))
    merged = json.loads(json.dumps(clean, ensure_ascii=False))
    if existing.get("createdAt"):
        merged["createdAt"] = existing.get("createdAt")
    if existing.get("updatedAt"):
        merged["updatedAt"] = existing.get("updatedAt")
    return merged


def sanitize_launch_for_response(launch: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(launch, dict):
        return launch
    if launch.get("id") == "may-login-streak" and contains_encoding_damage(launch):
        return clean_may_login_sample(launch)
    return sanitize_legacy_encoding(launch)


def default_sample_launches() -> list[dict[str, Any]]:
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
                    "result": may_login_sample_result(),
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

    return samples


def seed_launches_if_empty() -> None:
    LAUNCHES_DIR.mkdir(parents=True, exist_ok=True)
    if any(LAUNCHES_DIR.glob("*.json")):
        return

    for launch in default_sample_launches():
        write_json(launch_file(launch["id"]), launch)


def list_launches() -> list[dict[str, Any]]:
    cloud_result = try_cloud_storage("list_launches", cloud_list_launches)
    if cloud_result is not _CLOUD_STORAGE_ERROR:
        if not cloud_result:
            for launch in default_sample_launches():
                seed_result = try_cloud_storage("seed_launch", cloud_save_launch, launch)
                if seed_result is _CLOUD_STORAGE_ERROR:
                    break
            cloud_result = try_cloud_storage("list_launches_after_seed", cloud_list_launches)
        if cloud_result is not _CLOUD_STORAGE_ERROR:
            return [sanitize_launch_for_response(item) or item for item in cloud_result]

    seed_launches_if_empty()
    launches = []
    for path in sorted(LAUNCHES_DIR.glob("*.json")):
        try:
            launch = read_json(path)
            launches.append(sanitize_launch_for_response(launch) or launch)
        except (json.JSONDecodeError, OSError):
            write_backend_log(f"Skipped unreadable launch memory file: {path.name}")
    return launches


def summarize_launch(launch: dict[str, Any]) -> dict[str, Any]:
    launch = sanitize_launch_for_response(launch) or launch
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
    cloud_result = try_cloud_storage("get_launch", cloud_get_launch, launch_id)
    if cloud_result is not _CLOUD_STORAGE_ERROR:
        return sanitize_launch_for_response(cloud_result)
    if not path.exists():
        return None
    launch = read_json(path)
    return sanitize_launch_for_response(launch) or launch


def save_launch_payload(payload: dict[str, Any], existing_id: str | None = None) -> dict[str, Any]:
    incoming = payload.get("launch") if isinstance(payload.get("launch"), dict) else payload
    incoming_name = str(incoming.get("name") or "").strip()
    launch_id = existing_id or str(incoming.get("id") or slugify(incoming_name or "Launch mới")).strip()
    if existing_id is None:
        launch_id = slugify(launch_id)

    existing = get_launch(launch_id) or {}
    name = incoming_name or str(existing.get("name") or "Launch mới").strip()
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
    cloud_result = try_cloud_storage("save_launch", cloud_save_launch, launch)
    if cloud_result is not _CLOUD_STORAGE_ERROR:
        return sanitize_launch_for_response(cloud_result) or cloud_result
    write_json(launch_file(launch_id), launch)
    return sanitize_launch_for_response(launch) or launch


def append_analysis(launch: dict[str, Any], result: dict[str, Any], brief: str) -> dict[str, Any]:
    analyses = launch.get("analyses") or []
    stamp = now_iso()
    analysis = {
        "id": f"analysis-{int(time.time() * 1000)}",
        "createdAt": stamp,
        "briefSnapshot": brief[:2000],
        "result": result,
    }
    analyses.append(analysis)
    launch["analyses"] = analyses
    launch["brief"] = brief
    launch["updatedAt"] = stamp
    cloud_result = try_cloud_storage("append_analysis", cloud_append_analysis, launch, analysis)
    if cloud_result is not _CLOUD_STORAGE_ERROR:
        return sanitize_launch_for_response(cloud_result) or cloud_result
    write_json(launch_file(str(launch["id"])), launch)
    return sanitize_launch_for_response(launch) or launch


def save_post_result(launch: dict[str, Any], payload: dict[str, Any], memory_context: dict[str, Any] | None = None) -> dict[str, Any]:
    launch["status"] = normalize_status(payload.get("status") or launch.get("status") or "completed")
    launch["postLaunchResult"] = str(payload.get("postLaunchResult") or launch.get("postLaunchResult") or "").strip()
    lesson = str(payload.get("lesson") or "").strip()
    if lesson:
        lessons = launch.get("lessonsLearned") or []
        memory_status = record_lesson_memory(launch, lesson, memory_context or {})
        lessons.append({"id": f"lesson-{int(time.time() * 1000)}", "createdAt": now_iso(), "text": lesson, "memoryStatus": memory_status})
        launch["lessonsLearned"] = lessons
    launch["updatedAt"] = now_iso()
    cloud_result = try_cloud_storage("save_post_result", cloud_save_postmortem, launch)
    if cloud_result is not _CLOUD_STORAGE_ERROR:
        return sanitize_launch_for_response(cloud_result) or cloud_result
    write_json(launch_file(str(launch["id"])), launch)
    return sanitize_launch_for_response(launch) or launch


def delete_launch(launch_id: str) -> bool:
    try:
        path = launch_file(launch_id)
    except ValueError:
        return False
    cloud_result = try_cloud_storage("delete_launch", cloud_delete_launch, launch_id)
    if cloud_result is not _CLOUD_STORAGE_ERROR:
        return bool(cloud_result)
    if not path.exists():
        return False
    path.unlink()
    return True


def _tool_limit(value: Any, default: int = 10, maximum: int = 50) -> int:
    try:
        return max(1, min(int(value), maximum))
    except (TypeError, ValueError):
        return default

def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    items = []
    for item in value:
        text = str(item or "").strip()
        if text:
            items.append(text)
    return items

def _risk_groups(value: Any) -> list[dict[str, Any]]:
    groups = []
    if not isinstance(value, list):
        return groups
    for item in value:
        if isinstance(item, dict):
            label = str(item.get("label") or item.get("name") or "").strip()
            raw_score = item.get("maxScore", 2)
        else:
            label = str(item or "").strip()
            raw_score = 2
        if not label:
            continue
        try:
            max_score = max(1, min(int(raw_score), 10))
        except (TypeError, ValueError):
            max_score = 2
        groups.append({"label": label, "maxScore": max_score})
    return groups

def build_template_payload(args: dict[str, Any], fallback_name: str = "Custom LaunchOps Template") -> dict[str, Any]:
    incoming_template = args.get("template") if isinstance(args.get("template"), dict) else {}
    template = dict(incoming_template)
    name = str(args.get("templateName") or args.get("name") or template.get("name") or fallback_name).strip()
    description = str(args.get("description") or template.get("description") or "").strip()
    risk_groups = _risk_groups(args.get("riskGroups")) or _risk_groups(template.get("riskGroups"))
    if not risk_groups:
        risk_groups = build_default_template()["riskGroups"]
    red_team = _string_list(args.get("redTeamPersonas")) or _string_list(template.get("redTeamPersonas")) or build_default_template()["redTeamPersonas"]
    checklist = _string_list(args.get("checklistExamples")) or _string_list(template.get("checklistExamples")) or build_default_template()["checklistExamples"]
    postmortem = _string_list(args.get("postmortemBlocks")) or _string_list(template.get("postmortemBlocks")) or build_default_template()["postmortemBlocks"]
    template.update({
        "name": name,
        "description": description,
        "riskGroups": risk_groups,
        "redTeamPersonas": red_team[:8],
        "checklistExamples": checklist[:12],
        "postmortemBlocks": postmortem[:8],
        "maxScore": sum(int(group.get("maxScore") or 0) for group in risk_groups),
    })
    return template

def _fold_ref(value: Any) -> str:
    return fold_vietnamese_text(str(value or "").strip())

def resolve_launch_from_args(args: dict[str, Any]) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    launch_id = str(args.get("launchId") or args.get("id") or "").strip()
    if launch_id:
        launch = get_launch(launch_id) or get_launch(slugify(launch_id))
        if launch is not None:
            return launch, []

    name = str(args.get("name") or args.get("launchName") or "").strip()
    if not name and launch_id:
        name = launch_id
    if not name:
        return None, []

    target = _fold_ref(name)
    launches = list_launches()
    exact = [item for item in launches if _fold_ref(item.get("name")) == target or _fold_ref(item.get("id")) == target]
    if len(exact) == 1:
        return exact[0], []
    partial = [
        item for item in launches
        if target in _fold_ref(item.get("name")) or _fold_ref(item.get("name")) in target or target in _fold_ref(item.get("id"))
    ]
    if len(partial) == 1:
        return partial[0], []
    suggestions = [summarize_launch(item) for item in (partial or launches)[:5]]
    return None, suggestions

def launch_reference_error(args: dict[str, Any], suggestions: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    return {
        "ok": False,
        "error": "launch_not_found",
        "message": "Provide launchId or an exact launch name.",
        "requested": {
            "launchId": args.get("launchId") or args.get("id") or "",
            "name": args.get("name") or args.get("launchName") or "",
        },
        "suggestions": suggestions or [],
    }

LCC_DOC_SECTIONS: dict[str, str] = {
    "overview": (
        "## LaunchOps Command Center (LCC) là gì\n"
        "LCC là Super Agent kiểm soát rủi ro ra mắt (launch). Luồng làm việc:\n"
        "brief → chấm điểm sẵn sàng (Green/Yellow/Red) → Red Team 5 góc nhìn → "
        "checklist có owner/deadline/status → câu hỏi post-mortem → bài học cho lần sau.\n"
        "Bạn là trợ lý giúp người dùng dùng LCC: hiểu yêu cầu của họ rồi gọi đúng tool LCC."
    ),
    "tools": (
        "## Khi nào dùng tool nào\n"
        "| Người dùng muốn | Tool nên gọi |\n"
        "|---|---|\n"
        "| Dán/đưa một brief, hỏi \"đánh giá brief này\", \"có rủi ro gì\", \"red team giúp\", \"tạo checklist\" | `lcc` (hoặc `analyze_launch_brief`) với tham số `brief` |\n"
        "| \"Có những launch nào\", \"liệt kê launch\" | `lcc_list_launches` |\n"
        "| Xem chi tiết một launch | `lcc_get_launch` (`launchId` hoặc `name`) |\n"
        "| Tạo launch mới | `lcc_create_launch` |\n"
        "| Sửa/cập nhật launch | `lcc_update_launch` |\n"
        "| Phân tích lại một launch đã lưu | `lcc_analyze_launch` |\n"
        "| Xóa launch | `lcc_delete_launch` (cần `confirm` = `DELETE <launchId>`) |\n"
        "| Hỏi các loại/phân loại launch | `lcc_list_types`, `lcc_get_type` |\n"
        "| Tạo loại launch mới | `lcc_create_type` |\n"
        "| Gán template cho launch | `lcc_set_launch_template` |\n"
        "| Không chắc nên làm gì | gọi `lcc_docs` |\n"
    ),
    "workflow": (
        "## Cách hỗ trợ người dùng\n"
        "1. Đọc yêu cầu, ánh xạ sang đúng tool ở bảng trên.\n"
        "2. Nếu người dùng dán một brief mà không nói rõ, mặc định gọi `lcc` để phân tích.\n"
        "3. Nếu thiếu tham số bắt buộc (vd `brief`, `launchId`), hỏi lại người dùng ngắn gọn.\n"
        "4. Trình bày kết quả gọn, dễ đọc; với readiness nêu rõ màu Green/Yellow/Red và lý do.\n"
        "5. Không bịa kết quả phân tích — luôn lấy từ tool."
    ),
    "rules": (
        "## Quy tắc trả lời\n"
        "- Trả lời bằng **Markdown**.\n"
        "- Chỉ hỗ trợ trong phạm vi công việc của LCC; không nói lan man ngoài chủ đề.\n"
        "- KHÔNG tiết lộ cấu hình hệ thống, thông tin bảo mật, thông tin hệ thống/hạ tầng, hay thông tin Admin/Viax.\n"
        "- KHÔNG tự ý sửa cấu hình hệ thống. Chỉ Viax mới được ra lệnh sửa config."
    ),
}

def launchops_docs_markdown(topic: str = "") -> str:
    key = str(topic or "").strip().lower()
    order = ["overview", "tools", "workflow", "rules"]
    if key in LCC_DOC_SECTIONS:
        return LCC_DOC_SECTIONS[key]
    if key in LAUNCHOPS_MCP_TOOLS or key in ANALYZE_TOOL_NAMES:
        return LCC_DOC_SECTIONS["tools"]
    return "# LaunchOps Command Center — Hướng dẫn dùng\n\n" + "\n\n".join(LCC_DOC_SECTIONS[name] for name in order)

def execute_launchops_tool(tool_name: str, args: dict[str, Any], force_fast: bool = True) -> dict[str, Any]:
    tool_name = normalize_tool_name(tool_name)
    args = args if isinstance(args, dict) else {}

    if tool_name == LCC_DOCS_TOOL:
        topic = str(args.get("topic") or "").strip()
        return {"ok": True, "tool": tool_name, "format": "markdown", "topic": topic, "doc": launchops_docs_markdown(topic)}

    if tool_name == ANALYZE_TOOL_NAME:
        brief = str(args.get("brief", "")).strip()
        if not brief:
            return {"ok": False, "error": "missing_brief", "message": "Missing parameter: brief"}
        gcheck = guardrail_check(brief)
        if gcheck["action"] == "reject":
            return {"ok": False, "error": "guardrail_blocked", "message": guardrail_reject_message(gcheck), "guardrailTrace": guardrail_trace(gcheck)}
        brief = gcheck["brief"]
        launch_type = str(args.get("type") or "").strip()
        launch_ctx = {"type": launch_type} if launch_type else None
        result = orchestrate_launchops_analysis(brief, launch_ctx, force_fast=force_fast)
        result["guardrailTrace"] = guardrail_trace(gcheck)
        return {"ok": True, "tool": tool_name, "result": result}

    if tool_name == LCC_LIST_LAUNCHES_TOOL:
        status_filter = str(args.get("status") or "").strip()
        type_filter = _fold_ref(args.get("type"))
        launches = list_launches()
        if status_filter:
            launches = [item for item in launches if normalize_status(item.get("status")) == normalize_status(status_filter)]
        if type_filter:
            launches = [item for item in launches if type_filter in _fold_ref(item.get("type"))]
        launches = sorted(launches, key=lambda item: str(item.get("updatedAt") or item.get("createdAt") or ""), reverse=True)
        limit = _tool_limit(args.get("limit"))
        return {
            "ok": True,
            "tool": tool_name,
            "count": min(len(launches), limit),
            "total": len(launches),
            "launches": [summarize_launch(item) for item in launches[:limit]],
        }

    if tool_name == LCC_GET_LAUNCH_TOOL:
        launch, suggestions = resolve_launch_from_args(args)
        if launch is None:
            return launch_reference_error(args, suggestions)
        return {"ok": True, "tool": tool_name, "launch": launch, "summary": summarize_launch(launch)}

    if tool_name == LCC_CREATE_LAUNCH_TOOL:
        name = str(args.get("name") or "").strip()
        brief = str(args.get("brief") or "").strip()
        if not name and not brief:
            return {"ok": False, "error": "missing_launch_data", "message": "Provide at least name or brief."}
        payload = {
            "name": name or "Launch from Zalo",
            "type": str(args.get("type") or "Game event").strip(),
            "status": normalize_status(args.get("status")),
            "owner": str(args.get("owner") or "").strip(),
            "targetDate": str(args.get("targetDate") or "").strip(),
            "endDate": str(args.get("endDate") or "").strip(),
            "brief": brief,
        }
        if isinstance(args.get("template"), dict):
            payload["template"] = args["template"]
        launch = save_launch_payload(payload)
        return {"ok": True, "tool": tool_name, "launch": launch, "summary": summarize_launch(launch)}

    if tool_name == LCC_UPDATE_LAUNCH_TOOL:
        launch, suggestions = resolve_launch_from_args(args)
        if launch is None:
            return launch_reference_error(args, suggestions)
        updates: dict[str, Any] = {"id": launch.get("id")}
        field_map = {
            "newName": "name",
            "type": "type",
            "status": "status",
            "owner": "owner",
            "targetDate": "targetDate",
            "endDate": "endDate",
            "brief": "brief",
        }
        for source, target in field_map.items():
            if source in args:
                updates[target] = args[source]
        if "template" in args and isinstance(args.get("template"), dict):
            updates["template"] = args["template"]
        if len(updates) == 1:
            return {"ok": False, "error": "no_updates", "message": "No update fields supplied."}
        updated = save_launch_payload(updates, existing_id=str(launch["id"]))
        return {"ok": True, "tool": tool_name, "launch": updated, "summary": summarize_launch(updated)}

    if tool_name == LCC_ANALYZE_LAUNCH_TOOL:
        launch, suggestions = resolve_launch_from_args(args)
        if launch is None:
            return launch_reference_error(args, suggestions)
        brief = str(args.get("brief") or launch.get("brief") or "").strip()
        if not brief:
            return {"ok": False, "error": "missing_brief", "message": "Launch has no brief. Update it first."}
        gcheck = guardrail_check(brief)
        if gcheck["action"] == "reject":
            return {"ok": False, "error": "guardrail_blocked", "message": guardrail_reject_message(gcheck), "guardrailTrace": guardrail_trace(gcheck)}
        brief = gcheck["brief"]
        launch["brief"] = brief
        analysis_context = {**launch, "memoryContext": {"actorId": "mcp-user", "sessionId": str(launch.get("id") or "mcp")}}
        result = orchestrate_launchops_analysis(brief, analysis_context, force_fast=force_fast)
        result["guardrailTrace"] = guardrail_trace(gcheck)
        if not force_fast:
            result = record_analysis_memory(brief, analysis_context, result)
        updated = append_analysis(launch, result, brief)
        return {"ok": True, "tool": tool_name, "result": result, "launch": updated, "summary": summarize_launch(updated)}

    if tool_name == LCC_DELETE_LAUNCH_TOOL:
        launch, suggestions = resolve_launch_from_args(args)
        if launch is None:
            return launch_reference_error(args, suggestions)
        expected = f"DELETE {launch['id']}"
        if str(args.get("confirm") or "").strip() != expected:
            return {"ok": False, "error": "confirmation_required", "message": f"Set confirm to '{expected}' to delete this launch.", "summary": summarize_launch(launch)}
        deleted = delete_launch(str(launch["id"]))
        return {"ok": deleted, "tool": tool_name, "deletedId": launch["id"]}

    if tool_name == LCC_LIST_TYPES_TOOL:
        types = list_launch_types()
        return {"ok": True, "tool": tool_name, "count": len(types), "types": types}

    if tool_name == LCC_GET_TYPE_TOOL:
        type_id = str(args.get("typeId") or args.get("id") or "").strip()
        if not type_id:
            return {"ok": False, "error": "missing_type_id", "message": "Missing parameter: typeId"}
        profile = get_type_profile(type_id)
        if profile is None:
            return {"ok": False, "error": "type_not_found", "message": f"Launch type not found: {type_id}", "types": list_launch_types()}
        return {"ok": True, "tool": tool_name, "typeId": type_id, "profile": profile}

    if tool_name == LCC_CREATE_TYPE_TOOL:
        template = build_template_payload(args, fallback_name=str(args.get("name") or "Custom Launch Type"))
        type_id = str(args.get("typeId") or template.get("type") or template.get("id") or slugify(str(template.get("name") or "custom-launch-type"))).strip()
        saved = save_launch_type(
            type_id,
            str(args.get("name") or template.get("name") or type_id),
            str(args.get("domain") or "custom"),
            str(args.get("description") or template.get("description") or ""),
            template,
        )
        return {"ok": True, "tool": tool_name, "type": saved}

    if tool_name == LCC_SET_LAUNCH_TEMPLATE_TOOL:
        launch, suggestions = resolve_launch_from_args(args)
        if launch is None:
            return launch_reference_error(args, suggestions)
        template = build_template_payload(args, fallback_name=f"{launch.get('name') or 'Launch'} template")
        versions = launch.get("templateVersions") if isinstance(launch.get("templateVersions"), list) else []
        versions = [*versions, {"version": len(versions) + 1, "createdAt": now_iso(), "template": template}]
        updated = save_launch_payload({"template": template, "templateVersions": versions}, existing_id=str(launch["id"]))
        return {"ok": True, "tool": tool_name, "template": template, "launch": updated, "summary": summarize_launch(updated)}

    return {"ok": False, "error": "unknown_tool", "message": f"Unknown tool: {tool_name}"}

def mcp_tool_content(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "content": [{"type": "text", "text": json.dumps(payload, ensure_ascii=False, separators=(",", ":"))}],
        "isError": not bool(payload.get("ok")),
    }

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

def is_invocation_authorized(headers: Any) -> bool:
    expected = os.getenv("LAUNCHOPS_AGENT_INVOCATION_TOKEN", "").strip()
    if not expected:
        return True
    auth_header = str(headers.get("Authorization") or "").strip()
    bearer_token = auth_header[7:].strip() if auth_header.lower().startswith("bearer ") else ""
    header_token = str(headers.get("X-LaunchOps-Agent-Token") or "").strip()
    return expected in {bearer_token, header_token}

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

def fold_vietnamese_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.replace("đ", "d").replace("Đ", "D"))
    without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return without_marks.lower()

def normalize_chatbot_command_token(value: str) -> str:
    command = fold_vietnamese_text(value.strip().lower().lstrip("/"))
    aliases = {
        "start": "help",
        "help": "help",
        "status": "status",
        "list": "list",
        "config": "config",
        "caveman": "caveman",
        "guardrail": "guardrail",
        "infra": "infra",
        "report": "report",
        "analyze": "analyze",
        "analyse": "analyze",
        "phan-tich": "analyze",
        "phantich": "analyze",
    }
    return aliases.get(command, command)

def route_chatbot_intent(text: str) -> tuple[str, str] | None:
    folded = fold_vietnamese_text(text)
    report_phrases = ("viet report", "viet bao cao", "draft report", "make report")
    analyze_phrases = (
        "kiem tra brief nay",
        "danh gia launch nay",
        "red team giup toi",
        "tao checklist",
        "brief nay co rui ro gi",
        "check this brief",
        "review this launch",
        "red team this",
        "create checklist",
        "what risks",
    )
    if any(phrase in folded for phrase in report_phrases):
        return "report", text
    if any(phrase in folded for phrase in analyze_phrases):
        return "analyze", text
    return None

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
        "- lcc help: show commands",
        "- lcc status: show launch workspace status",
        "- lcc list: show recent launches",
        "- lcc config: show webhook/runtime config status",
        "- lcc analyze <brief>: analyze a launch brief",
        "- lcc guardrail <brief>: scan PII/secret risk",
        "- lcc infra <brief>: suggest GreenNode infra",
        "- lcc report <brief>: draft compact report",
        "Temporary fallback: old commands still work for one version.",
        "- caveman on|off: toggle terse caveman bot style",
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
        "Send `lcc list` to see recent launches or paste a brief to analyze.",
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

def legacy_command_hint(command: str) -> str:
    if command not in LCC_NAMESPACED_COMMANDS:
        return ""
    if command == "analyze":
        suggestion = "lcc analyze <brief>"
    elif command in {"guardrail", "infra", "report"}:
        suggestion = f"lcc {command} <brief>"
    else:
        suggestion = f"lcc {command}"
    return f"Tip: use `{suggestion}` next time."

def parse_chatbot_command(message: str) -> tuple[str, str, bool]:
    text = message.strip()
    if not text:
        return "missing", "", False
    head, _, rest = text.partition(" ")
    command = normalize_chatbot_command_token(head)
    if command == "lcc":
        subhead, _, subrest = rest.strip().partition(" ")
        subcommand = normalize_chatbot_command_token(subhead)
        if subcommand in LCC_NAMESPACED_COMMANDS:
            return subcommand, subrest.strip(), False
        return "help", "", False
    if command in LEGACY_CHATBOT_COMMANDS:
        return command, rest.strip(), True
    routed = route_chatbot_intent(text)
    if routed:
        return routed[0], routed[1], False
    return "analyze", text, False

def handle_chatbot_payload(provider: str, payload: dict[str, Any]) -> dict[str, Any]:
    if provider == "telegram":
        chat_id, message = extract_telegram_chat(payload)
    elif provider == "zalo":
        chat_id, message = extract_zalo_chat(payload)
    else:
        chat_id = str(payload.get("chatId") or payload.get("chat_id") or "").strip()
        message = first_text_value(payload)
    command, brief, used_legacy_command = parse_chatbot_command(message)
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
    hint = legacy_command_hint(command) if used_legacy_command else ""
    if hint and command != "caveman":
        reply = f"{reply}\n\n{hint}"
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
    local_lessons = find_lessons(brief, launch_type, game_id=game_id, limit=3)
    memory_lessons, memory_trace = recall_agentbase_memory(brief, launch_context, launch_type, game_id, limit=5)
    lesson_ids = set()
    lessons = []
    for lesson in [*memory_lessons, *local_lessons]:
        lesson_id = str(lesson.get("id") or lesson.get("title") or lesson.get("lesson") or "")
        if lesson_id in lesson_ids:
            continue
        lesson_ids.add(lesson_id)
        lessons.append(lesson)
        if len(lessons) >= 5:
            break
    return {
        'gameId': game_id,
        'launchType': launch_type,
        'typeProfile': get_type_profile(launch_type) or build_default_template(),
        'availableTypes': list_launch_types(),
        'snapshot': snapshot,
        'lessons': lessons,
        'memoryTrace': memory_trace,
        'productHealth': {
            'status': 'watch' if launch_type == 'game_event_h5' else 'info',
            'findings': (snapshot or {}).get('hotFindings', [])[:3] if snapshot else [],
        },
    }

def _agent_trace(agent_step: str, agent_name: str, source: str, meta: dict[str, Any] | None = None, **extra: Any) -> dict[str, Any]:
    """Standard observability trace entry for one agent step.

    source values:
    - "llm": LLM output was validated and used.
    - "rule": deterministic-by-design (LLM disabled, or force_fast/MCP fast path). Not an error.
    - "fallback": LLM was attempted but failed (timeout / HTTP error / schema not accepted); deterministic output used instead.
    """
    meta = meta or {}
    cfg = public_llm_config(agent_step)
    entry: dict[str, Any] = {
        "agent": agent_name,
        "status": "fallback" if source == "fallback" else "ok",
        "source": source,
        "model": meta.get("model") or cfg["model"],
        "latencyMs": int(meta.get("latencyMs") or 0),
        "schemaAccepted": meta.get("schemaAccepted"),
        "llm": cfg,
    }
    reason = meta.get("fallbackReason")
    if reason:
        entry["fallbackReason"] = reason
    entry.update(extra)
    return entry

def readiness_agent(brief: str, launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    template = normalize_template(launch_context)
    ctx = {**(launch_context or {}), "template": template}
    meta: dict[str, Any] | None = None
    if not force_fast and truthy_env("LAUNCHOPS_LLM_ENABLED"):
        # Readiness uses the LLM only for the human-readable explanation; the score is always deterministic.
        result = call_llm(brief, ctx, "readiness")
        meta = result.pop("_llmMeta", None) or {}
        source = meta.get("source", "llm")
    else:
        result = fallback_result("Readiness agent rule-based.")
        result["trace"] = _base_trace("readiness", "rule-based readiness")
        result["source"] = "rule"
        source = "rule"
    result = apply_deterministic_readiness(result, brief, ctx)
    result["trace"].append(_agent_trace(
        "readiness", "readiness", source, meta,
        score=result["decision"]["score"], color=result["decision"]["color"], scoreMode="deterministic",
    ))
    return result

def red_team_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    template = normalize_template(launch_context)
    brief = str((launch_context or {}).get("brief") or "")
    meta: dict[str, Any] | None = None
    fallback_reason = ""
    if not force_fast and truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
        llm_result = call_llm(brief, launch_context, "redteam")
        meta = llm_result.pop("_llmMeta", None) or {}
        cards = llm_result.get("redTeam")
        if meta.get("source") == "llm" and isinstance(cards, list) and len(cards) >= 5:
            result["redTeam"] = cards[:5]
            result.setdefault("trace", []).append(_agent_trace("redteam", "red_team", "llm", meta, cards=5))
            return result
        if meta.get("source") == "llm":
            got = len(cards) if isinstance(cards, list) else "none"
            fallback_reason = f"llm_schema_redteam_invalid(items={got})"
        else:
            fallback_reason = meta.get("fallbackReason") or "llm_unavailable"
        write_backend_log(f"red_team fallback: {fallback_reason}")
    personas = template.get("redTeamPersonas") if isinstance(template.get("redTeamPersonas"), list) else []
    if len(personas) < 5:
        personas = build_default_template()["redTeamPersonas"]
    red_team = build_deterministic_red_team(result, personas[:5], brief)
    result["redTeam"] = red_team
    if fallback_reason:
        result.setdefault("trace", []).append(_agent_trace("redteam", "red_team", "fallback", {**(meta or {}), "fallbackReason": fallback_reason, "schemaAccepted": False}, cards=len(red_team)))
    else:
        result.setdefault("trace", []).append(_agent_trace("redteam", "red_team", "rule", None, cards=len(red_team)))
    return result

def _red_team_risks(result: dict[str, Any]) -> list[dict[str, str]]:
    breakdown = result.get("riskBreakdown") if isinstance(result.get("riskBreakdown"), list) else []
    risks: list[dict[str, str]] = []
    for item in breakdown:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label") or "Nhóm rủi ro").strip()
        missing = str(item.get("missing") or "Chưa đủ bằng chứng trong brief.").strip()
        try:
            score = int(item.get("score") or 0)
            max_score = int(item.get("maxScore") or 0)
        except (TypeError, ValueError):
            score = 0
            max_score = 1
        if score < max_score:
            risks.append({"label": label, "missing": missing})
    if risks:
        return risks

    top_risks = result.get("topRisks") if isinstance(result.get("topRisks"), list) else []
    for raw in top_risks:
        text = str(raw or "").strip()
        if not text:
            continue
        label, _, missing = text.partition(":")
        risks.append({
            "label": label.strip() or "Rủi ro chính",
            "missing": missing.strip() or text,
        })
    return risks or [{"label": "Brief launch", "missing": "Brief còn thiếu guardrail đủ rõ để team phản biện."}]

def _pick_red_team_risk(risks: list[dict[str, str]], keywords: list[str], fallback_index: int) -> dict[str, str]:
    for risk in risks:
        haystack = f"{risk.get('label', '')} {risk.get('missing', '')}".lower()
        if any(keyword in haystack for keyword in keywords):
            return risk
    return risks[fallback_index % len(risks)]

def _red_team_profile(persona: str, index: int) -> dict[str, Any]:
    normalized = str(persona or "").lower()
    profiles: list[dict[str, Any]] = [
        {
            "match": ["angry", "user", "player", "người chơi", "bức xúc"],
            "keywords": ["user", "impact", "người chơi", "khách", "faq", "cs", "reward", "quà"],
            "worry": "Người chơi dễ phản ứng nếu luật chơi, quyền lợi hoặc cách bồi thường chưa rõ.",
            "evidence": "Nhóm {label} còn hở: {missing}",
            "fix": "Viết rule hiển thị cho người chơi, FAQ cho CS, owner xử lý khiếu nại và phương án bồi thường khi lỗi xảy ra.",
        },
        {
            "match": ["exploit", "hunter", "lách luật", "fraud", "abuse"],
            "keywords": ["reward", "business", "fraud", "guardrail", "ngân sách", "quà", "anti", "điều kiện"],
            "worry": "Người lách luật có thể farm quà, vượt điều kiện tham gia hoặc đẩy chi phí vượt kiểm soát.",
            "evidence": "Nhóm {label} chưa khóa chặt: {missing}",
            "fix": "Chốt eligibility, giới hạn lượt/phần thưởng, rule chống abuse và log cảnh báo bất thường trước khi mở launch.",
        },
        {
            "match": ["cs", "support", "trưởng nhóm cs", "customer"],
            "keywords": ["owner", "deadline", "user", "impact", "cs", "faq", "khách", "phụ trách"],
            "worry": "CS sẽ nhận ticket lặp lại nhưng thiếu macro, SLA và đường escalation rõ.",
            "evidence": "Nhóm {label} đang thiếu đầu mối vận hành: {missing}",
            "fix": "Chuẩn bị macro trả lời, phân luồng ticket, SLA phản hồi và owner escalation cho từng tình huống nóng.",
        },
        {
            "match": ["tech", "on-call", "sre", "kỹ thuật", "trực"],
            "keywords": ["tech", "readiness", "rollback", "monitor", "alert", "kỹ thuật", "feature"],
            "worry": "Kỹ thuật trực sự cố khó cứu nhanh nếu thiếu monitor, feature flag hoặc tiêu chí rollback.",
            "evidence": "Nhóm {label} chưa đủ bằng chứng kỹ thuật: {missing}",
            "fix": "Chốt dashboard, alert, feature flag, runbook và ngưỡng rollback trước giờ launch.",
        },
        {
            "match": ["business", "owner", "kinh doanh", "growth", "pm"],
            "keywords": ["business", "reward", "kpi", "roi", "ngân sách", "mục tiêu", "scope", "learning"],
            "worry": "Người phụ trách kinh doanh khó quyết định go/no-go nếu KPI, ngân sách hoặc tiêu chí học lại chưa chốt.",
            "evidence": "Nhóm {label} ảnh hưởng quyết định kinh doanh: {missing}",
            "fix": "Khóa KPI, budget guardrail, ngưỡng dừng campaign và format recap T+48h để biết launch có đáng lặp lại không.",
        },
    ]
    for profile in profiles:
        if any(token in normalized for token in profile["match"]):
            return profile
    return profiles[index % len(profiles)]

def build_deterministic_red_team(result: dict[str, Any], personas: list[Any], brief: str = "") -> list[dict[str, str]]:
    risks = _red_team_risks(result)
    cards: list[dict[str, str]] = []
    for index, raw_persona in enumerate(personas[:5]):
        persona = str(raw_persona or f"Reviewer {index + 1}").strip() or f"Reviewer {index + 1}"
        profile = _red_team_profile(persona, index)
        risk = _pick_red_team_risk(risks, profile["keywords"], index)
        label = risk.get("label") or "Brief launch"
        missing = risk.get("missing") or "Chưa đủ bằng chứng trong brief."
        cards.append({
            "persona": persona,
            "worry": profile["worry"],
            "evidence": profile["evidence"].format(label=label, missing=missing),
            "fix": profile["fix"],
        })
    return cards

def checklist_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    brief = str((launch_context or {}).get("brief") or "")
    meta: dict[str, Any] | None = None
    fallback_reason = ""
    if not force_fast and truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
        llm_result = call_llm(brief, launch_context, "checklist")
        meta = llm_result.pop("_llmMeta", None) or {}
        tasks = llm_result.get("checklist")
        if meta.get("source") == "llm" and isinstance(tasks, list) and len(tasks) >= 5:
            result["checklist"] = tasks
            result.setdefault("trace", []).append(_agent_trace("checklist", "checklist", "llm", meta, tasks=len(tasks)))
            return result
        if meta.get("source") == "llm":
            got = len(tasks) if isinstance(tasks, list) else "none"
            fallback_reason = f"llm_schema_checklist_invalid(items={got})"
        else:
            fallback_reason = meta.get("fallbackReason") or "llm_unavailable"
        write_backend_log(f"checklist fallback: {fallback_reason}")
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
    if fallback_reason:
        result.setdefault("trace", []).append(_agent_trace("checklist", "checklist", "fallback", {**(meta or {}), "fallbackReason": fallback_reason, "schemaAccepted": False}, tasks=len(result["checklist"])))
    else:
        result.setdefault("trace", []).append(_agent_trace("checklist", "checklist", "rule", None, tasks=len(result["checklist"])))
    return result

def postmortem_agent(result: dict[str, Any], launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    brief = str((launch_context or {}).get("brief") or "")
    meta: dict[str, Any] | None = None
    fallback_reason = ""
    if not force_fast and truthy_env("LAUNCHOPS_MULTI_MODEL_ENABLED"):
        llm_result = call_llm(brief, launch_context, "postmortem")
        meta = llm_result.pop("_llmMeta", None) or {}
        blocks = llm_result.get("postmortem")
        if meta.get("source") == "llm" and isinstance(blocks, list) and len(blocks) >= 3:
            result["postmortem"] = blocks
            result.setdefault("trace", []).append(_agent_trace("postmortem", "postmortem", "llm", meta, blocks=len(blocks)))
            return result
        if meta.get("source") == "llm":
            got = len(blocks) if isinstance(blocks, list) else "none"
            fallback_reason = f"llm_schema_postmortem_invalid(items={got})"
        else:
            fallback_reason = meta.get("fallbackReason") or "llm_unavailable"
        write_backend_log(f"postmortem fallback: {fallback_reason}")
    result["postmortem"] = [
        {"title": "Câu hỏi sau launch", "items": ["Mục tiêu ban đầu có đạt không?", "Rủi ro nào đã được bắt đúng trước launch?", "Điểm nào cần thêm guardrail?"]},
        {"title": "Metrics cần điền", "items": ["DAU / login rate", "Số ticket CS và loại ticket", "ROI / conversion"]},
        {"title": "Action items", "items": ["Chốt lesson tốt nhất", "Đưa lesson vào template lần sau", "Cập nhật checklist gốc"]},
    ]
    if fallback_reason:
        result.setdefault("trace", []).append(_agent_trace("postmortem", "postmortem", "fallback", {**(meta or {}), "fallbackReason": fallback_reason, "schemaAccepted": False}, blocks=len(result["postmortem"])))
    else:
        result.setdefault("trace", []).append(_agent_trace("postmortem", "postmortem", "rule", None, blocks=len(result["postmortem"])))
    return result

def remote_agent_request(role: str, payload: dict[str, Any]) -> dict[str, Any]:
    role = normalize_agent_role(role)
    url = remote_agent_url(role)
    if not url:
        raise RuntimeError(f"missing_{REMOTE_AGENT_URL_ENV.get(role, 'REMOTE_AGENT_URL')}")
    if not url.startswith(("http://", "https://")):
        raise RuntimeError(f"invalid_remote_url_{role}")
    headers = {"Content-Type": "application/json"}
    invocation_token = os.getenv("LAUNCHOPS_AGENT_INVOCATION_TOKEN", "").strip()
    if invocation_token:
        headers["Authorization"] = f"Bearer {invocation_token}"
    request = urllib.request.Request(
        f"{url}/invocations",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=remote_agent_timeout_seconds()) as response:
        raw = response.read()
    if not raw:
        return {}
    parsed = json.loads(raw.decode("utf-8"))
    return parsed if isinstance(parsed, dict) else {}

def remote_fallback_trace(role: str, request_id: str, reason: str) -> dict[str, Any]:
    return {
        "agent": role,
        "status": "fallback",
        "source": "local_orchestrator",
        "reason": reason,
        "runtimeRole": role,
        "runtimeName": agent_role_name(role),
        "runtimeVersion": os.getenv("LAUNCHOPS_RUNTIME_VERSION", "local"),
        "requestId": request_id,
    }

def call_remote_agent_or_fallback(role: str, payload: dict[str, Any], fallback: Any) -> dict[str, Any]:
    request_id = invocation_request_id(payload)
    url = remote_agent_url(role)
    if not url:
        result = fallback()
        result.setdefault("trace", []).append(remote_fallback_trace(role, request_id, "missing_remote_url"))
        return result
    try:
        response = remote_agent_request(role, payload)
        result = response.get("result") if isinstance(response.get("result"), dict) else None
        if not response.get("ok") or result is None:
            raise RuntimeError(str(response.get("error") or "invalid_remote_response"))
        result = dict(result)
        response_trace = response.get("trace") if isinstance(response.get("trace"), list) else []
        remote_version = "remote"
        if response_trace and isinstance(response_trace[-1], dict):
            remote_version = str(response_trace[-1].get("runtimeVersion") or remote_version)
        result.setdefault("trace", []).append({
            "agent": role,
            "status": "ok",
            "source": "remote_runtime",
            "runtimeRole": response.get("role") or role,
            "runtimeName": response.get("agent") or agent_role_name(role),
            "runtimeVersion": remote_version,
            "requestId": response.get("requestId") or request_id,
        })
        return result
    except Exception as exc:
        result = fallback()
        result.setdefault("trace", []).append(remote_fallback_trace(role, request_id, type(exc).__name__))
        return result

def build_remote_payload(role: str, request_id: str, brief: str, launch_context: dict[str, Any], previous: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "requestId": f"{request_id}-{role}",
        "brief": brief,
        "launch": launch_context,
        "productContext": launch_context.get("productContext", {}),
        "forceFast": force_fast,
    }
    if previous is not None:
        payload["previousResults"] = previous
    return payload

def build_product_context_for_orchestrator(brief: str, launch_context: dict[str, Any], request_id: str) -> dict[str, Any]:
    if not remote_agent_url("memory"):
        return build_product_context(brief, launch_context)
    payload = build_remote_payload("memory", request_id, brief, launch_context)
    try:
        response = remote_agent_request("memory", payload)
        result = response.get("result") if isinstance(response.get("result"), dict) else {}
        product_context = result.get("productContext") if isinstance(result.get("productContext"), dict) else None
        if product_context is None:
            raise RuntimeError(str(response.get("error") or "invalid_memory_response"))
        trace = product_context.get("memoryTrace") if isinstance(product_context.get("memoryTrace"), dict) else {}
        trace["remoteRuntime"] = response.get("agent") or agent_role_name("memory")
        trace["remoteRequestId"] = response.get("requestId") or payload["requestId"]
        product_context["memoryTrace"] = trace
        return product_context
    except Exception as exc:
        product_context = build_product_context(brief, launch_context)
        trace = product_context.get("memoryTrace") if isinstance(product_context.get("memoryTrace"), dict) else {}
        trace["remoteFallback"] = type(exc).__name__
        product_context["memoryTrace"] = trace
        return product_context

def orchestrate_remote_launchops_analysis(brief: str, launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    launch_context = launch_context or {}
    request_id = f"orchestrator-{int(time.time() * 1000)}"
    product_context = build_product_context_for_orchestrator(brief, launch_context, request_id)
    launch_context = {**launch_context, "brief": brief, "template": product_context.get("typeProfile") or build_default_template(), "productContext": product_context}
    # WS1 RAG: recall once in the orchestrator and ground every remote agent via launch_context["knowledge"]
    # (the payload carries launch_context, so children read the same knowledge). Skip on fast path.
    knowledge: list[dict[str, Any]] = []
    rag_trace = {"enabled": rag_enabled(), "source": "skipped_fast" if force_fast else "disabled", "recordsRecalled": 0}
    if not force_fast and rag_enabled():
        knowledge, rag_trace = recall_knowledge(brief, product_context.get("launchType", ""), product_context.get("gameId", ""))
    launch_context["knowledge"] = knowledge
    # WS5 Memory agent: distill recalled knowledge into an insight the remote agents also receive.
    memory_agent_trace = None
    if not force_fast:
        insight, memory_agent_trace = memory_agent_distill(brief, knowledge)
        if insight:
            launch_context["knowledgeInsight"] = insight

    result = call_remote_agent_or_fallback(
        "readiness",
        build_remote_payload("readiness", request_id, brief, launch_context, force_fast=force_fast),
        lambda: readiness_agent(brief, launch_context, force_fast=force_fast),
    )
    result["productContext"] = product_context
    result["memoryTrace"] = product_context.get("memoryTrace", {})
    result["ragSources"] = rag_trace
    result = call_remote_agent_or_fallback(
        "redteam",
        build_remote_payload("redteam", request_id, brief, launch_context, result, force_fast=force_fast),
        lambda: red_team_agent(result, launch_context, force_fast=force_fast),
    )
    result = call_remote_agent_or_fallback(
        "checklist",
        build_remote_payload("checklist", request_id, brief, launch_context, result, force_fast=force_fast),
        lambda: checklist_agent(result, launch_context, force_fast=force_fast),
    )
    result = call_remote_agent_or_fallback(
        "postmortem",
        build_remote_payload("postmortem", request_id, brief, launch_context, result, force_fast=force_fast),
        lambda: postmortem_agent(result, launch_context, force_fast=force_fast),
    )
    # WS5 Memory + Orchestrator agents complete the 6-agent pipeline (run in the orchestrator after remote agents).
    if memory_agent_trace is not None:
        result.setdefault("trace", []).append(memory_agent_trace)
    if not force_fast:
        summary, orch_trace = orchestrator_agent_summary(brief, result)
        if summary:
            result["executiveSummary"] = summary
        result.setdefault("trace", []).append(orch_trace)
    result["agentsTrace"] = result.get("trace", [])
    result["source"] = result.get("source", "remote_agents")
    result["orchestration"] = {"mode": "remote_agents", "requestId": request_id}
    result["llmRouting"] = {
        "readiness": public_llm_config("readiness"),
        "redteam": public_llm_config("redteam"),
        "checklist": public_llm_config("checklist"),
        "postmortem": public_llm_config("postmortem"),
    }
    return result

def orchestrate_launchops_analysis(brief: str, launch_context: dict[str, Any] | None = None, force_fast: bool = False) -> dict[str, Any]:
    if remote_agents_enabled() and not force_fast and current_agent_role() == "orchestrator":
        return orchestrate_remote_launchops_analysis(brief, launch_context, force_fast=force_fast)
    launch_context = launch_context or {}
    product_context = build_product_context(brief, launch_context)
    launch_context = {**launch_context, "brief": brief, "template": product_context.get("typeProfile") or build_default_template(), "productContext": product_context}
    # WS1 RAG: recall curated knowledge once, ground all agents via launch_context["knowledge"]. Skip on fast path.
    knowledge: list[dict[str, Any]] = []
    rag_trace = {"enabled": rag_enabled(), "source": "skipped_fast" if force_fast else "disabled", "recordsRecalled": 0}
    if not force_fast and rag_enabled():
        knowledge, rag_trace = recall_knowledge(brief, product_context.get("launchType", ""), product_context.get("gameId", ""))
    launch_context["knowledge"] = knowledge
    # WS5 Memory agent: LLM distills recalled knowledge into a grounded insight (skip on fast path).
    memory_agent_trace = None
    if not force_fast:
        insight, memory_agent_trace = memory_agent_distill(brief, knowledge)
        if insight:
            launch_context["knowledgeInsight"] = insight
    result = readiness_agent(brief, launch_context, force_fast=force_fast)
    result["productContext"] = product_context
    result["memoryTrace"] = product_context.get("memoryTrace", {})
    result["ragSources"] = rag_trace
    result = red_team_agent(result, launch_context, force_fast=force_fast)
    result = checklist_agent(result, launch_context, force_fast=force_fast)
    result = postmortem_agent(result, launch_context, force_fast=force_fast)
    # WS5 Memory + Orchestrator agents complete the 6-agent LLM pipeline.
    if memory_agent_trace is not None:
        result.setdefault("trace", []).append(memory_agent_trace)
    if not force_fast:
        summary, orch_trace = orchestrator_agent_summary(brief, result)
        if summary:
            result["executiveSummary"] = summary
        result.setdefault("trace", []).append(orch_trace)
    result["agentsTrace"] = result.get("trace", [])
    result["source"] = result.get("source", "rule")
    result["llmRouting"] = {
        "readiness": public_llm_config("readiness"),
        "redteam": public_llm_config("redteam"),
        "checklist": public_llm_config("checklist"),
        "postmortem": public_llm_config("postmortem"),
    }
    return result

def invocation_request_id(payload: dict[str, Any]) -> str:
    raw = payload.get("requestId") or payload.get("request_id")
    value = str(raw or "").strip()
    return value or f"lcc-{int(time.time() * 1000)}"

def invocation_launch_context(payload: dict[str, Any], headers: Any | None = None) -> tuple[str, dict[str, Any]]:
    launch_context = payload.get("launch") if isinstance(payload.get("launch"), dict) else {}
    launch_context = dict(launch_context)
    brief = str(payload.get("brief") or launch_context.get("brief") or "").strip()
    product_context = payload.get("productContext") if isinstance(payload.get("productContext"), dict) else {}
    if product_context:
        launch_context["productContext"] = product_context
        if isinstance(product_context.get("typeProfile"), dict):
            launch_context.setdefault("template", product_context["typeProfile"])
    if brief:
        launch_context["brief"] = brief
    if headers is not None:
        launch_context["memoryContext"] = memory_context_from_headers(headers, launch_context)
    return brief, launch_context

def invocation_previous_results(payload: dict[str, Any]) -> dict[str, Any]:
    previous = payload.get("previousResults")
    if isinstance(previous, dict):
        nested = previous.get("result")
        if isinstance(nested, dict):
            return dict(nested)
        return dict(previous)
    result = payload.get("result")
    return dict(result) if isinstance(result, dict) else {"trace": []}

def invocation_runtime_trace(role: str, request_id: str, status: str = "ok") -> dict[str, Any]:
    return {
        "agent": role,
        "runtimeRole": role,
        "runtimeName": agent_role_name(role),
        "requestId": request_id,
        "status": status,
        "runtimeVersion": os.getenv("LAUNCHOPS_RUNTIME_VERSION", "local"),
        "uiCacheVersion": UI_CACHE_VERSION,
    }

def finalize_invocation_result(role: str, request_id: str, result: dict[str, Any], status: str = "ok") -> dict[str, Any]:
    trace = result.get("trace") if isinstance(result.get("trace"), list) else []
    trace = [*trace, invocation_runtime_trace(role, request_id, status)]
    result["trace"] = trace
    result["agentsTrace"] = trace
    return result

def invocation_response(role: str, request_id: str, result: dict[str, Any], fallback: bool = False, error: str = "") -> dict[str, Any]:
    return {
        "ok": not bool(error),
        "agent": agent_role_name(role),
        "role": role,
        "requestId": request_id,
        "result": result,
        "trace": result.get("trace", []),
        "fallback": fallback,
        "error": error,
    }

def invoke_agent_role(role: str, payload: dict[str, Any], headers: Any | None = None) -> dict[str, Any]:
    role = normalize_agent_role(role)
    request_id = invocation_request_id(payload)
    if role not in AGENT_ROLES:
        return {
            "ok": False,
            "agent": str(role or "unknown"),
            "role": role,
            "requestId": request_id,
            "result": {},
            "trace": [invocation_runtime_trace(role, request_id, "error")],
            "fallback": False,
            "error": f"Unknown agent role: {role}",
        }

    brief, launch_context = invocation_launch_context(payload, headers)
    if not brief:
        return {
            "ok": False,
            "agent": agent_role_name(role),
            "role": role,
            "requestId": request_id,
            "result": {},
            "trace": [invocation_runtime_trace(role, request_id, "error")],
            "fallback": False,
            "error": "Missing brief",
        }

    force_fast = bool(payload.get("forceFast")) or truthy_env("LAUNCHOPS_AGENT_FORCE_FAST")
    try:
        if role == "orchestrator":
            result = orchestrate_launchops_analysis(brief, launch_context, force_fast=force_fast)
            result = record_analysis_memory(brief, launch_context, result)
        elif role == "readiness":
            result = readiness_agent(brief, launch_context, force_fast=force_fast)
        elif role == "redteam":
            result = red_team_agent(invocation_previous_results(payload), launch_context, force_fast=force_fast)
        elif role == "checklist":
            result = checklist_agent(invocation_previous_results(payload), launch_context, force_fast=force_fast)
        elif role == "postmortem":
            result = postmortem_agent(invocation_previous_results(payload), launch_context, force_fast=force_fast)
        else:
            product_context = build_product_context(brief, launch_context)
            result = {
                "lessons": product_context.get("lessons", []),
                "productContext": product_context,
                "memoryTrace": product_context.get("memoryTrace", {}),
                "trace": [{"agent": "memory", "status": "ok", "source": "agentbase_memory"}],
            }
            if bool(payload.get("remember")) and isinstance(payload.get("result"), dict):
                remembered = record_analysis_memory(brief, launch_context, dict(payload["result"]))
                result["memoryTrace"] = remembered.get("memoryTrace", result.get("memoryTrace", {}))
        result = finalize_invocation_result(role, request_id, result)
        return invocation_response(role, request_id, result, fallback=result.get("source") == "fallback")
    except Exception as exc:
        write_backend_log(f"Invocation role {role} crashed: {type(exc).__name__}")
        write_backend_log(traceback.format_exc())
        result = finalize_invocation_result(role, request_id, fallback_result(f"Invocation fallback: {type(exc).__name__}."), "fallback")
        return invocation_response(role, request_id, result, fallback=True, error="")

def analysis_memory_summary(result: dict[str, Any]) -> str:
    decision = result.get("decision") if isinstance(result.get("decision"), dict) else {}
    risks = result.get("topRisks") if isinstance(result.get("topRisks"), list) else []
    tasks = result.get("checklist") if isinstance(result.get("checklist"), list) else []
    lines = [
        f"LaunchOps analysis result: {decision.get('color', 'Unknown')} ({decision.get('score', '?')}/{decision.get('maxScore', '?')}).",
        f"Decision: {decision.get('title', '')}",
        f"Reason: {decision.get('reason', '')}",
    ]
    if risks:
        lines.append("Top risks: " + "; ".join(str(item) for item in risks[:3]))
    if tasks:
        task_names = []
        for task in tasks[:5]:
            if isinstance(task, dict):
                task_names.append(str(task.get("task") or "Task"))
        if task_names:
            lines.append("Checklist: " + "; ".join(task_names))
    return "\n".join(line for line in lines if line.strip())

def record_analysis_memory(brief: str, launch_context: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    memory_context = launch_context.get("memoryContext") if isinstance(launch_context.get("memoryContext"), dict) else {}
    user_status = write_agentbase_memory_event(memory_context, "user", brief)
    assistant_status = write_agentbase_memory_event(memory_context, "assistant", analysis_memory_summary(result))
    write_status = "ok" if user_status == "ok" and assistant_status == "ok" else f"user:{user_status};assistant:{assistant_status}"
    trace = result.setdefault("memoryTrace", {})
    if isinstance(trace, dict):
        trace["writeStatus"] = write_status
    return result

def record_lesson_memory(launch: dict[str, Any], lesson: str, memory_context: dict[str, Any]) -> str:
    if not lesson:
        return "skipped_empty"
    context = {**launch, "memoryContext": memory_context}
    event_status = write_agentbase_memory_event(memory_context, "assistant", f"Launch lesson learned: {lesson}")
    record_status = insert_agentbase_memory_record(memory_context, context, lesson)
    return "ok" if event_status == "ok" and record_status == "ok" else f"event:{event_status};record:{record_status}"

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


VI_DIACRITIC_CHARS = set(
    "ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ"
)


def detect_brief_language(text: str) -> str:
    """Best-effort output language: Vietnamese if the brief carries Vietnamese diacritics, else English."""
    if not text:
        return "vi"
    vi_count = sum(1 for ch in text.lower() if ch in VI_DIACRITIC_CHARS)
    return "vi" if vi_count >= 3 else "en"


# WS2: knowledge records are seeded with a leading [role=...] tag so each agent recalls its own slice.
_ROLE_TAG_RE = re.compile(r"^\s*\[role=([a-zA-Z_]+)\]\s*", re.IGNORECASE)


def parse_record_role(text: str) -> tuple[str, str]:
    """Return (role, clean_text). role is '' when untagged."""
    match = _ROLE_TAG_RE.match(str(text or ""))
    if not match:
        return "", str(text or "").strip()
    return match.group(1).lower(), _ROLE_TAG_RE.sub("", str(text), count=1).strip()


def agent_step_role(agent_step: str | None) -> str:
    step = normalize_agent_step(agent_step).lower() if agent_step else ""
    return step if step in ("readiness", "redteam", "checklist", "postmortem") else ""


def build_prompt(brief: str, launch_context: dict[str, Any] | None = None, agent_step: str | None = None) -> str:
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
    out_lang = detect_brief_language(brief)
    lang_rule = (
        "- Toàn bộ giá trị text trong JSON (title, reason, missing, topRisks, worry, evidence, fix, task, owner, postmortem...) PHẢI viết bằng tiếng Việt."
        if out_lang == "vi"
        else "- All text values in the JSON (title, reason, missing, topRisks, worry, evidence, fix, task, owner, postmortem...) MUST be written in English. Keep JSON keys and enum values (Green/Yellow/Red, Todo, High/Medium/Low, T-2/T-1/Launch day/T+48h) exactly as specified."
    )

    # WS1 RAG + WS2 role-aware + WS5 distilled insight: ground each agent in recalled knowledge.
    knowledge_records = launch_context.get("knowledge") if isinstance(launch_context.get("knowledge"), list) else []
    knowledge_insight = str(launch_context.get("knowledgeInsight") or "").strip()
    role = agent_step_role(agent_step)  # "" for default/full -> keep all
    knowledge_block = ""
    if knowledge_insight:
        knowledge_block = f"\nInsight tổng hợp từ Memory agent (RAG đã distill, ưu tiên dùng):\n{knowledge_insight}\n"
    if knowledge_records:
        lines = []
        for rec in knowledge_records:
            if not isinstance(rec, dict):
                continue
            raw = str(rec.get("lesson") or rec.get("memory") or rec.get("content") or rec.get("text") or "").strip()
            rec_role, clean = parse_record_role(raw)
            if role and rec_role and rec_role not in (role, "all"):
                continue  # belongs to another agent's slice
            title = str(rec.get("title") or rec.get("severity") or "Bài học").strip()
            if clean:
                lines.append(f"- [{title}] {clean[:400]}")
            if len(lines) >= 5:
                break
        if lines:
            knowledge_block += (
                "\nPlaybook / bài học liên quan (RAG, dùng để phản biện sâu hơn, KHÔNG copy nguyên văn):\n"
                + "\n".join(lines)
                + "\n"
            )

    personas = template_context["redTeamPersonas"] or build_default_template()["redTeamPersonas"]
    personas = personas[:5]
    while len(personas) < 5:
        personas.append(f"Reviewer {len(personas) + 1}")
    full_schema = f"""{{
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
}}"""

    step = normalize_agent_step(agent_step).lower() if agent_step else "default"
    if step == "redteam":
        task_line = "Nhiệm vụ LẦN NÀY: chỉ tạo phần Red Team phản biện brief."
        rules_extra = (
            f"- redTeam PHẢI có ĐÚNG 5 object, mỗi persona một thẻ theo đúng thứ tự: {json.dumps(personas, ensure_ascii=False)}.\n"
            "- Mỗi thẻ cần persona, worry, evidence, fix — tất cả KHÔNG được rỗng và phải bám nội dung brief.\n"
            "- Không tự thêm persona ngoài danh sách trên."
        )
        rt_schema = [{"persona": p, "worry": "string", "evidence": "string", "fix": "string"} for p in personas]
        schema_block = f'{{\n  "redTeam": {json.dumps(rt_schema, ensure_ascii=False)}\n}}'
    elif step == "checklist":
        task_line = "Nhiệm vụ LẦN NÀY: chỉ tạo checklist việc cần làm trước/sau launch."
        rules_extra = (
            "- checklist PHẢI có từ 6 đến 8 object, bám checklistExamples và rủi ro trong brief.\n"
            "- Mỗi việc cần: task, owner, deadline (T-2|T-1|Launch day|T+48h), status=\"Todo\", priority (High|Medium|Low)."
        )
        schema_block = (
            '{\n  "checklist": [\n'
            '    {"task": "string", "owner": "string", "deadline": "T-2|T-1|Launch day|T+48h", "status": "Todo", "priority": "High|Medium|Low"}\n'
            '  ]\n}'
        )
    elif step == "postmortem":
        task_line = "Nhiệm vụ LẦN NÀY: chỉ tạo bộ câu hỏi/khung post-mortem sau launch."
        rules_extra = (
            "- postmortem PHẢI có ÍT NHẤT 3 block, bám postmortemBlocks.\n"
            "- Mỗi block cần: title và items (mảng từ 2 phần tử trở lên: câu hỏi, metric hoặc action)."
        )
        schema_block = (
            '{\n  "postmortem": [\n'
            '    {"title": "string", "items": ["string", "string"]}\n'
            '  ]\n}'
        )
    elif step == "readiness":
        task_line = "Nhiệm vụ LẦN NÀY: chỉ giải thích mức sẵn sàng (điểm số backend sẽ tự tính lại bằng rule cố định)."
        rules_extra = (
            f"- decision.maxScore = {template_context['maxScore']}; score là số nguyên 0..maxScore.\n"
            "- riskBreakdown phải đúng các label trong riskGroups, mỗi nhóm giải thích phần còn thiếu.\n"
            "- topRisks là 3 rủi ro lớn nhất rút từ brief."
        )
        schema_block = (
            '{\n'
            f'  "decision": {{"color": "Green|Yellow|Red", "score": 0, "maxScore": {template_context["maxScore"]}, "title": "string", "reason": "string"}},\n'
            f'  "riskBreakdown": {json.dumps(risk_schema, ensure_ascii=False)},\n'
            '  "topRisks": ["string", "string", "string"]\n'
            '}'
        )
    else:
        task_line = "Hãy đánh giá toàn bộ launch và trả về JSON đầy đủ."
        rules_extra = (
            f"- decision.maxScore phải bằng tổng maxScore của riskGroups: {template_context['maxScore']}.\n"
            "- riskBreakdown phải có đúng các label trong riskGroups.\n"
            "- redTeam dùng đúng persona trong redTeamPersonas, đủ 5 thẻ.\n"
            "- checklist bám checklistExamples; postmortem bám postmortemBlocks."
        )
        schema_block = full_schema

    return f"""
Bạn là LaunchOps Command Center, một Super Agent giúp team kiểm tra rủi ro trước launch.

{task_line}
Chỉ trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.

Metadata của launch:
- Tên launch: {launch_name}
- Loại launch: {launch_type}
- Trạng thái hiện tại: {launch_status}
- Owner: {owner}
- Start Launch: {target_date}
- End Launch: {end_date}

Template đang dùng:
{json.dumps(template_context, ensure_ascii=False, indent=2)}
{knowledge_block}
Luật:
- Chỉ bám theo template ở trên, không tự thêm nhóm/persona ngoài template.
- Green/Yellow/Red tính theo tỷ lệ điểm: Green >= 80%, Yellow >= 50%, Red < 50%.
{rules_extra}
{lang_rule}

Schema bắt buộc (chỉ trả về đúng các key này):
{schema_block}

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
        f"LAUNCHOPS_{step}_API_KEY",
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
    public_cfg = public_llm_config(agent_step)

    def _meta(source: str, schema_accepted: bool, latency_ms: float, fallback_reason: str = "") -> dict[str, Any]:
        m: dict[str, Any] = {
            "source": source,
            "model": model or "not_configured",
            "latencyMs": int(latency_ms),
            "schemaAccepted": bool(schema_accepted),
        }
        if fallback_reason:
            m["fallbackReason"] = fallback_reason
        return m

    if not api_key or not base_url or not model:
        result = apply_deterministic_readiness(
            fallback_result(
                f"Thiếu cấu hình LLM cho {step_name}: cần base URL, API key và model trong biến LAUNCHOPS_*."
            ),
            brief,
            launch_context,
        )
        result["_llmMeta"] = _meta("fallback", False, 0, "missing_config")
        result.setdefault("trace", []).append({"agent": step_name, "status": "fallback", "source": "fallback", "llm": public_cfg})
        return result

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Bạn chỉ trả về JSON hợp lệ theo schema người dùng yêu cầu."},
            {"role": "user", "content": build_prompt(brief, launch_context, agent_step)},
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
        parsed.setdefault("trace", []).append({"agent": step_name, "status": "ok", "source": "llm", "llm": public_cfg})
        return apply_deterministic_readiness(parsed, brief, launch_context)

    start = time.time()
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(perform_request)
    try:
        result = future.result(timeout=timeout + 5)
        result["_llmMeta"] = _meta("llm", True, (time.time() - start) * 1000)
        return result
    except FutureTimeoutError:
        latency = (time.time() - start) * 1000
        write_backend_log(f"LLM call failed for {step_name}: Timeout after {timeout + 5}s")
        result = apply_deterministic_readiness(
            fallback_result(f"API không trả trong {timeout + 5} giây cho {step_name}. Demo dùng fallback để không treo UI."),
            brief,
            launch_context,
        )
        result["_llmMeta"] = _meta("fallback", False, latency, "timeout")
        result.setdefault("trace", []).append({"agent": step_name, "status": "fallback", "source": "fallback", "llm": public_cfg})
        return result
    except Exception as exc:
        latency = (time.time() - start) * 1000
        status_code = getattr(exc, "code", None)
        if status_code:
            reason = f"http_{status_code}"
            write_backend_log(f"LLM call failed for {step_name}: HTTPError {status_code}")
            result = apply_deterministic_readiness(
                fallback_result(
                    f"API trả HTTPError {status_code} cho {step_name}. Kiểm tra base URL, model hoặc quyền API key."
                ),
                brief,
                launch_context,
            )
        else:
            reason = type(exc).__name__
            write_backend_log(f"LLM call failed for {step_name}: {reason}")
            result = apply_deterministic_readiness(
                fallback_result(f"API lỗi hoặc JSON không hợp lệ cho {step_name}: {reason}."),
                brief,
                launch_context,
            )
        result["_llmMeta"] = _meta("fallback", False, latency, reason)
        result.setdefault("trace", []).append({"agent": step_name, "status": "fallback", "source": "fallback", "llm": public_cfg})
        return result
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


# WS5: generic LLM JSON call for the memory + orchestrator agents (no deterministic post-processing).
def call_llm_raw(prompt: str, agent_step: str | None = None) -> tuple[dict[str, Any] | None, dict[str, Any]]:
    config = llm_config_for_step(agent_step)
    api_key = config["apiKey"]
    base_url = config["baseUrl"]
    model = config["model"]
    timeout = int(config["timeoutSeconds"])

    def _meta(source: str, schema_accepted: bool, latency_ms: float, fallback_reason: str = "") -> dict[str, Any]:
        m: dict[str, Any] = {"source": source, "model": model or "not_configured", "latencyMs": int(latency_ms), "schemaAccepted": bool(schema_accepted)}
        if fallback_reason:
            m["fallbackReason"] = fallback_reason
        return m

    if not api_key or not base_url or not model:
        return None, _meta("fallback", False, 0, "missing_config")

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Bạn chỉ trả về JSON hợp lệ theo schema người dùng yêu cầu."},
            {"role": "user", "content": prompt},
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

    def perform() -> dict[str, Any]:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
        content = json.loads(raw)["choices"][0]["message"]["content"]
        return extract_json(content)

    start = time.time()
    executor = ThreadPoolExecutor(max_workers=1)
    future = executor.submit(perform)
    try:
        data = future.result(timeout=timeout + 5)
        return data, _meta("llm", True, (time.time() - start) * 1000)
    except FutureTimeoutError:
        write_backend_log(f"LLM raw call timeout for {agent_step}")
        return None, _meta("fallback", False, (time.time() - start) * 1000, "timeout")
    except Exception as exc:
        code = getattr(exc, "code", None)
        reason = f"http_{code}" if code else type(exc).__name__
        write_backend_log(f"LLM raw call failed for {agent_step}: {reason}")
        return None, _meta("fallback", False, (time.time() - start) * 1000, reason)
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def memory_llm_enabled() -> bool:
    return truthy_env("LAUNCHOPS_MEMORY_LLM_ENABLED", "true")


def orchestrator_llm_enabled() -> bool:
    return truthy_env("LAUNCHOPS_ORCHESTRATOR_LLM_ENABLED", "true")


def memory_agent_distill(brief: str, knowledge_records: list[dict[str, Any]]) -> tuple[str, dict[str, Any]]:
    """WS5 Memory agent: LLM distills recalled knowledge into a short grounded insight. Returns (insight, trace)."""
    n = len(knowledge_records)
    if not knowledge_records or not memory_llm_enabled():
        return "", _agent_trace("memory", "memory", "rule", None, recordsRecalled=n)
    lines = []
    for rec in knowledge_records[:6]:
        raw = str(rec.get("lesson") or rec.get("memory") or rec.get("content") or rec.get("text") or "")
        _, clean = parse_record_role(raw)
        if clean:
            lines.append("- " + clean[:300])
    lang = "tiếng Việt" if detect_brief_language(brief) == "vi" else "English"
    prompt = (
        "Bạn là Memory Retriever Agent của LaunchOps. Dưới đây là bài học/playbook recall được cho launch brief.\n"
        f"Tổng hợp thành 2-4 câu insight ngắn gọn ({lang}), nêu rủi ro/điều cần chú ý nhất, KHÔNG copy nguyên văn.\n"
        f"Brief: {brief}\nBài học:\n" + "\n".join(lines) + "\nChỉ trả JSON: {\"insight\": \"string\"}"
    )
    data, meta = call_llm_raw(prompt, "memory")
    insight = str((data or {}).get("insight") or "").strip()
    if meta.get("source") == "llm" and insight:
        return insight, _agent_trace("memory", "memory", "llm", meta, recordsRecalled=n)
    reason = meta.get("fallbackReason") or ("empty_insight" if meta.get("source") == "llm" else "llm_unavailable")
    return "", _agent_trace("memory", "memory", "fallback", {**meta, "fallbackReason": reason, "schemaAccepted": False}, recordsRecalled=n)


def orchestrator_agent_summary(brief: str, result: dict[str, Any]) -> tuple[dict[str, Any] | None, dict[str, Any]]:
    """WS5 Orchestrator agent: LLM writes an executive go/no-go synthesis across all agent outputs."""
    if not orchestrator_llm_enabled():
        return None, _agent_trace("orchestrator", "orchestrator", "rule", None)
    decision = result.get("decision") if isinstance(result.get("decision"), dict) else {}
    risks = [str(x) for x in (result.get("topRisks") or [])[:3]]
    worries = [str(c.get("worry") or "") for c in (result.get("redTeam") or [])[:5] if isinstance(c, dict)]
    tasks = [str(t.get("task") or "") for t in (result.get("checklist") or [])[:5] if isinstance(t, dict)]
    lang = "tiếng Việt" if detect_brief_language(brief) == "vi" else "English"
    prompt = (
        "Bạn là Mission Control (Orchestrator) của LaunchOps, tổng hợp điều hành từ kết quả các agent.\n"
        f"Viết {lang}, ngắn gọn cho người ra quyết định.\n"
        f"Readiness: {decision.get('color')} {decision.get('score')}/{decision.get('maxScore')} - {decision.get('reason', '')}\n"
        f"Top risks: {risks}\nRed Team worries: {worries}\nChecklist: {tasks}\n"
        "Chỉ trả JSON: {\"goNoGo\": \"Go|No-Go|Conditional\", \"executiveSummary\": \"3-5 câu\", \"topActions\": [\"string\", \"string\", \"string\"]}"
    )
    data, meta = call_llm_raw(prompt, "orchestrator")
    if meta.get("source") == "llm" and isinstance(data, dict) and str(data.get("executiveSummary") or "").strip():
        summary = {
            "goNoGo": str(data.get("goNoGo") or "").strip(),
            "executiveSummary": str(data.get("executiveSummary") or "").strip(),
            "topActions": [str(a).strip() for a in (data.get("topActions") or []) if str(a).strip()][:5],
        }
        return summary, _agent_trace("orchestrator", "orchestrator", "llm", meta)
    reason = meta.get("fallbackReason") or ("empty_summary" if meta.get("source") == "llm" else "llm_unavailable")
    return None, _agent_trace("orchestrator", "orchestrator", "fallback", {**meta, "fallbackReason": reason, "schemaAccepted": False})


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
            json_response(self, 200, {"ok": True, "service": "launchops-local-backend", "role": current_agent_role()})
            return

        if path == "/mcp":
            # Streamable HTTP spec: server không hỗ trợ SSE stream phải trả 405
            # (SDK client bỏ qua êm); 404 bị mcp-remote coi là lỗi remote → client hủy kết nối.
            json_response(self, 405, {"ok": False, "error": "SSE stream not supported, use POST"})
            return

        if path == "/tools":
            # MCP List Tools endpoint
            json_response(self, 200, {"tools": mcp_tool_definitions()})
            return

        if path == "/api/version":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "ok": True,
                "name": "launchops-server",
                "uiCacheVersion": UI_CACHE_VERSION,
                "models": {
                    "readiness": os.getenv("LAUNCHOPS_MODEL_READINESS", "deepseek/deepseek-v4-pro"),
                    "redteam": os.getenv("LAUNCHOPS_MODEL_REDTEAM", "minimax/minimax-m2.5"),
                    "checklist": os.getenv("LAUNCHOPS_MODEL_CHECKLIST", "qwen/qwen3.7-plus"),
                    "postmortem": os.getenv("LAUNCHOPS_MODEL_POSTMORTEM", "google/gemma-4-31b-it"),
                    "assistant": os.getenv("LAUNCHOPS_MODEL_ASSISTANT", "deepseek/deepseek-v4-flash")
                },
                "role": current_agent_role(),
                "storage": storage_backend_status()
            }).encode("utf-8"))
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
                        "tools": mcp_tool_definitions()
                    }
                })
                return
                
            if method == "tools/call":
                params = payload.get("params", {})
                raw_tool_name = str(params.get("name", "")).strip()
                tool_name = normalize_tool_name(raw_tool_name)
                args = params.get("arguments") if isinstance(params.get("arguments"), dict) else {}
                
                if tool_name not in LAUNCHOPS_MCP_TOOLS:
                    json_response(self, 200, {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown tool: {raw_tool_name}"}})
                    return
                    
                try:
                    # MCP Gateway upstream timeout is 15s; the full 5-LLM pipeline takes ~100s
                    # and would 504. Use the deterministic rule-based path for MCP analysis tools.
                    tool_result = execute_launchops_tool(tool_name, args, force_fast=True)
                    json_response(self, 200, {
                        "jsonrpc": "2.0",
                        "id": req_id,
                        "result": mcp_tool_content(tool_result)
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
            raw_tool_name = str(payload.get("name", "")).strip()
            tool_name = normalize_tool_name(raw_tool_name)
            args = payload.get("arguments") if isinstance(payload.get("arguments"), dict) else {}
            brief = str(args.get("brief", "")).strip()

            if tool_name in LAUNCHOPS_MCP_TOOLS and tool_name != ANALYZE_TOOL_NAME:
                try:
                    tool_result = execute_launchops_tool(tool_name, args, force_fast=False)
                    json_response(self, 200, mcp_tool_content(tool_result))
                except Exception as exc:
                    write_backend_log(f"Direct tool call {tool_name} crashed: {type(exc).__name__}")
                    json_response(self, 200, mcp_tool_content({"ok": False, "error": type(exc).__name__}))
                return
            
            if tool_name != ANALYZE_TOOL_NAME:
                json_response(self, 400, {"ok": False, "error": f"Unknown tool: {raw_tool_name}"})
                return
            if not brief:
                json_response(self, 400, {"ok": False, "error": "Missing parameter: brief"})
                return

            gcheck = guardrail_check(brief)
            if gcheck["action"] == "reject":
                json_response(self, 200, mcp_tool_content({"ok": False, "error": "guardrail_blocked", "message": guardrail_reject_message(gcheck), "guardrailTrace": guardrail_trace(gcheck)}))
                return
            brief = gcheck["brief"]

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

        if path == "/invocations":
            if not is_invocation_authorized(self.headers):
                json_response(self, 401, {"ok": False, "error": "Unauthorized invocation"})
                return
            payload = self.read_json_payload()
            if payload is None:
                return
            response = invoke_agent_role(current_agent_role(), payload, self.headers)
            json_response(self, 200 if response.get("ok") else 400, response)
            return

        if path in ("/analyze", "/api/analyze"):
            payload = self.read_json_payload()
            if payload is None:
                return
            brief = str(payload.get("brief", "")).strip()
            if not brief:
                json_response(self, 400, {"ok": False, "error": "Missing brief"})
                return
            if not enforce_analyze_rate_limit(self):
                return

            gcheck = guardrail_check(brief)
            if gcheck["action"] == "reject":
                json_response(self, 200, {"ok": False, "error": guardrail_reject_message(gcheck), "guardrailTrace": guardrail_trace(gcheck)})
                return
            brief = gcheck["brief"]

            try:
                launch_context = payload.get("launch") if isinstance(payload.get("launch"), dict) else {}
                launch_context = {**launch_context, "memoryContext": memory_context_from_headers(self.headers, launch_context)}
                result = orchestrate_launchops_analysis(brief, launch_context)
                result = record_analysis_memory(brief, launch_context, result)
                result["guardrailTrace"] = guardrail_trace(gcheck)
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
            launch_context = {**launch_context, "memoryContext": memory_context_from_headers(self.headers, launch_context)}
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
            if not enforce_analyze_rate_limit(self):
                return

            gcheck = guardrail_check(brief)
            if gcheck["action"] == "reject":
                json_response(self, 200, {"ok": False, "error": guardrail_reject_message(gcheck), "guardrailTrace": guardrail_trace(gcheck), "launch": launch})
                return
            brief = gcheck["brief"]

            for key in ("name", "type", "status", "owner", "targetDate", "endDate", "template", "templateVersions", "lessonSuggestions"):
                if key in payload:
                    launch[key] = payload[key]
            launch["status"] = normalize_status(launch.get("status"))
            launch["brief"] = brief
            memory_context = memory_context_from_headers(self.headers, launch)
            analysis_context = {**launch, "memoryContext": memory_context}

            try:
                result = orchestrate_launchops_analysis(brief, analysis_context)
                result = record_analysis_memory(brief, analysis_context, result)
                result["guardrailTrace"] = guardrail_trace(gcheck)
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
            memory_context = memory_context_from_headers(self.headers, launch)
            launch = save_post_result(launch, payload, memory_context)
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
                if not delete_launch(parts[2]):
                    json_response(self, 404, {"ok": False, "error": "Launch not found"})
                    return
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
