# LaunchOps Command Center

> Cập nhật: 14/06/2026 — bản production đang chạy: image `v19`, runtime version 23 trên VNG AgentBase.

LaunchOps Command Center là một **Super Agent kiểm soát rủi ro launch**: đọc launch brief (sự kiện game, campaign marketing, release tính năng, hotfix...), chấm điểm readiness Green/Yellow/Red, phản biện bằng Red Team 5 persona, sinh checklist có owner/deadline/priority và chuẩn bị post-mortem để team học lại sau mỗi lần launch.

**Demo live:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

## Kiến trúc

Toàn bộ chạy trong **1 Docker image duy nhất** (`python:3.11-slim`, không framework; core dùng stdlib, cloud Postgres dùng `psycopg` tùy chọn), deploy lên VNG AgentBase Agent Runtime:

```
┌─────────────────────────────────────────────────────────────┐
│  AgentBase Runtime (port 8080, public endpoint HTTPS)        │
│  server/app.py — ThreadingHTTPServer                         │
│                                                              │
│  GET  /                  → Web UI (Pro / Friendly, VI/EN)    │
│  GET  /health            → healthcheck (Service Contract)    │
│  POST /api/analyze       → pipeline 5 agent LLM (~90-120s)   │
│  POST /api/assistant     → chatbot 1 call LLM (~3s)          │
│  POST /api/launches/...  → CRUD launch + analyze per launch  │
│  POST /mcp               → MCP streamable-http (JSON-RPC)    │
│  GET/DELETE /mcp         → 405 (đúng spec, KHÔNG đổi)        │
│  POST /webhooks/telegram, /webhooks/zalo                     │
└─────────────────────────────────────────────────────────────┘
        ▲                              ▲
        │ HTTPS                        │ MCP qua Gateway (IAM)
   Người dùng web              MCP Gateway `launchops-server`
                                       ▲
                               OpenClaw (chỉ hỗ trợ stdio)
                               → bridge: npx mcp-remote <url>/mcp
```

## Pipeline 5 agent (multi-model)

Mỗi agent gọi một model riêng qua **API OpenAI-compatible** (`/v1/chat/completions`) trên VNG MaaS — đổi model chỉ cần đổi env, không sửa code:

| Agent | Env | Model hiện tại |
|---|---|---|
| Readiness | `LAUNCHOPS_MODEL_READINESS` | `deepseek/deepseek-v4-pro` |
| Red Team | `LAUNCHOPS_MODEL_REDTEAM` | `minimax/minimax-m2.5` |
| Checklist | `LAUNCHOPS_MODEL_CHECKLIST` | `qwen/qwen3.7-plus` |
| Post-mortem | `LAUNCHOPS_MODEL_POSTMORTEM` | `google/gemma-4-31b-it` |
| Assistant (chatbot) | `LAUNCHOPS_MODEL_ASSISTANT` | `deepseek/deepseek-v4-flash` |

- Response API có `trace` + `agentsTrace` chứng minh từng agent đã chạy với model nào.
- Điểm readiness cuối cùng luôn được tính lại bằng **rule cố định** (deterministic) — LLM chỉ giải thích rủi ro, không tự chấm điểm tùy hứng.
- Nếu LLM lỗi/timeout, từng agent tự fallback về rule local — pipeline không bao giờ chết giữa chừng.
- `POST /mcp tools/call` dùng **fast path deterministic (<1s)** để không vượt timeout 15s của MCP Gateway; `/api/analyze` mới chạy full LLM.
- MCP giữ 2 tool phân tích cũ: `analyze_launch_brief` (backward-compatible) và alias ngắn `lcc`.
- MCP cũng expose tool thao tác LaunchOps từ OpenClaw/Zalo: `lcc_list_launches`, `lcc_get_launch`, `lcc_create_launch`, `lcc_update_launch`, `lcc_analyze_launch`, `lcc_delete_launch` (cần confirm), `lcc_list_types`, `lcc_get_type`, `lcc_create_type`, `lcc_set_launch_template`.

## Chuẩn bị tách runtime AgentBase

Production hiện vẫn chạy **1 runtime orchestrator** để giữ demo ổn định. Code đã có contract nhỏ cho Phase 4 để cùng một image có thể chạy nhiều runtime độc lập bằng env:

```text
LAUNCHOPS_AGENT_ROLE=orchestrator|readiness|redteam|checklist|postmortem|memory
```

- `GET /health` trả thêm `role`.
- `POST /invocations` dispatch theo `LAUNCHOPS_AGENT_ROLE`.
- Runtime con nhận payload chung: `requestId`, `brief`, `launch`, `productContext`, `previousResults`.
- Response chung: `ok`, `agent`, `role`, `requestId`, `result`, `trace`, `fallback`, `error`.
- `/api/analyze`, Web UI và MCP mặc định vẫn đi qua pipeline cũ trong orchestrator.
- Chỉ bật điều phối runtime con sau khi endpoint đã verify:

```text
LAUNCHOPS_USE_REMOTE_AGENTS=true
LAUNCHOPS_READINESS_URL=https://...
LAUNCHOPS_REDTEAM_URL=https://...
LAUNCHOPS_CHECKLIST_URL=https://...
LAUNCHOPS_POSTMORTEM_URL=https://...
LAUNCHOPS_MEMORY_URL=https://...
LAUNCHOPS_AGENT_TIMEOUT_SECONDS=75
LAUNCHOPS_AGENT_INVOCATION_TOKEN=<optional shared bearer token>
```

Nếu thiếu URL hoặc runtime con lỗi, orchestrator fallback riêng agent đó về logic local và ghi lý do vào `agentsTrace`.

## Memory

App có đường tích hợp **AgentBase Memory** sau feature flag:

- `LAUNCHOPS_MEMORY_ENABLED=true`
- `LAUNCHOPS_MEMORY_ID=<memory-id>`
- `LAUNCHOPS_MEMORY_STRATEGY_ID=<strategy-id>`
- `LAUNCHOPS_MEMORY_NAMESPACE_MODE=actor|session|product|global`

Khi bật, backend recall long-term memory records trước khi phân tích và trả `memoryTrace` trong response. Nếu Memory lỗi, thiếu cấu hình hoặc thiếu header `X-GreenNode-AgentBase-User-Id` / `X-GreenNode-AgentBase-Session-Id`, app tự fallback về SQLite lessons local, không làm chết `/api/analyze`. Muốn demo không có header có thể bật `LAUNCHOPS_MEMORY_DEMO_FALLBACK_ENABLED=true`, nhưng production nên để `false` để tránh trộn memory nhiều user.

Rollback nhanh: đặt `LAUNCHOPS_MEMORY_ENABLED=false` để quay về local lessons.

## Cloud DB

Launch data mặc định vẫn dùng local JSON/SQLite để demo offline. Nếu có VNG vDB/Postgres, bật:

```text
LAUNCHOPS_STORAGE_BACKEND=cloud
LAUNCHOPS_DB_URL=postgresql://USER:PASSWORD@RW_ENDPOINT:5432/DBNAME?sslmode=require
```

Dùng RW endpoint trong VNG vDB `Connectivity & Security` → `Endpoint & Port`. Không commit DB URL thật; nếu cloud DB lỗi, đặt `LAUNCHOPS_STORAGE_BACKEND=local` để rollback.

## Web UI

- **2 mode:** Pro (dashboard đầy đủ) và Friendly (NPC hướng dẫn + visualize từng bước, đọc DOM thật của Pro). Mặc định mở Friendly.
- **Tab Log (chỉ Admin):** mở URL với `?role=admin` để hiện tab Log — nhật ký client (save → gọi API → kết quả/timeout) + server trace (agent nào chạy model nào, fallback ở đâu) cho từng launch. Tắt bằng `?role=human`. Người xem demo bằng URL thường không thấy tab này.
- Phân tích từ web mất **~90–120 giây** (4 lần gọi LLM tuần tự) — timeout client đặt 240s.
- VI/EN switch, responsive, cache-bust bằng query `?v=` trong `index.html`.

## OpenClaw qua MCP

OpenClaw 2026.3.23 chỉ hỗ trợ MCP **stdio**, nên kết nối qua bridge `mcp-remote`:

```
openclaw mcp set launchops_gateway '{"command":"npx","args":["-y","mcp-remote","https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/mcp"]}'
# rồi gõ /restart trong OpenClaw
```

Lưu ý server-side: phải giữ đầy đủ MCP handshake (`initialize` → `notifications/initialized` → `tools/list` → `tools/call`) và trả **405** cho `GET`/`DELETE /mcp` theo spec streamable-http (chi tiết trong `server/app.py`).

Tool Zalo/OpenClaw có thể đọc/ghi dữ liệu giống Web UI:

- `lcc_list_launches`: xem danh sách launch đã lưu.
- `lcc_get_launch`: lấy launch theo id hoặc tên gần đúng.
- `lcc_create_launch`: tạo launch mới từ chat.
- `lcc_update_launch`: sửa metadata/brief/status/owner.
- `lcc_analyze_launch`: phân tích launch đã lưu và append kết quả vào history.
- `lcc_list_types` / `lcc_get_type` / `lcc_create_type`: xem hoặc thêm phân loại launch.
- `lcc_set_launch_template`: gắn template/risk groups/persona/checklist riêng cho launch.
- `lcc_delete_launch`: chỉ xóa khi có `confirm="DELETE <launchId>"`.

## Chatbot commands

Lệnh chính dùng namespace `lcc`:

```text
lcc help
lcc status
lcc list
lcc config
lcc analyze <brief>
lcc report <brief>
lcc guardrail <brief>
lcc infra <brief>
```

Các lệnh cũ như `status`, `analyze <brief>`, `report <brief>` vẫn hoạt động tạm trong 1 version và sẽ gợi ý chuyển sang `lcc ...`. Nếu người dùng dán một brief dài không có lệnh, bot tự chạy phân tích. Bot cũng hiểu vài câu tự nhiên như "kiểm tra brief này", "đánh giá launch này", "red team giúp tôi", "tạo checklist", "viết report", "brief này có rủi ro gì".

## Chạy local

```bash
# Cách 1: rule mode (nhanh, không cần LLM) — khuyên dùng khi dev UI
LAUNCHOPS_LLM_ENABLED=false PORT=8788 python server/app.py

# Cách 2: full LLM — cần .env có LAUNCHOPS_AGENTBASE_API_KEY + BASE_URL
PORT=8788 python server/app.py
```

Mở `http://127.0.0.1:8788/` — UI và API cùng origin. Mẫu env: `.env.example`.

## Deploy lên AgentBase

1. Build + push image: `docker build -t vcr.vngcloud.vn/111480-abp111734/launchops-command-center:vNN .` → `docker push ...`
2. PATCH runtime qua API (mint IAM token từ client credentials → `PATCH /runtime/agent-runtimes/{id}` mirror config version mới nhất, chỉ đổi `imageUrl`). **Đổi model/env cũng PATCH như vậy, không cần rebuild.**
3. DEFAULT endpoint tự rollout sang version mới (~15–40s). Verify bằng nội dung (grep `?v=` trong index) chứ đừng tin field `status` ngay sau PATCH.

## Cấu trúc repo

```
index.html          # Web UI markup (tabs, views, cache version ?v=)
app.js              # Logic Pro UI: launch CRUD, analyze, run log, permissions
friendly-ui.js      # Layer Friendly (2 IIFE riêng biệt: mode switcher + hệ Friendly)
i18n-clean.js       # Chuyển ngữ VI/EN
styles.css          # Toàn bộ style (token VNG Orange)
friendly.css        # Style riêng phần Friendly
config.js           # window.LAUNCHOPS_API_BASE = "/api" (same-origin)
server/app.py       # Backend duy nhất: UI serving + API + MCP + webhooks
server/test_app.py  # Unit test các hàm thuần (python -m unittest server.test_app)
server/migrate_to_cloud_db.py # Migrate local launch JSON sang Postgres khi có DB URL
data/               # Brief mẫu + rubric + vai trò agent
prompts/            # Prompt nền cho OpenClaw backup
Dockerfile          # python:3.11-slim, EXPOSE 8080
README_EN.md        # English version of this README
```

## Bảo mật

- Không commit `.env`, token, key, log, file DB. `.gitignore` đã chặn sẵn.
- Endpoint public không auth (chủ đích cho demo hackathon); MCP Gateway có inbound IAM cho đường gọi chính thức.
