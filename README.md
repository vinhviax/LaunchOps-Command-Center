# LaunchOps Command Center

> Cập nhật: 12/06/2026 — bản production đang chạy: image `v14`, runtime version 16 trên VNG AgentBase.

LaunchOps Command Center là một **Super Agent kiểm soát rủi ro launch**: đọc launch brief (sự kiện game, campaign marketing, release tính năng, hotfix...), chấm điểm readiness Green/Yellow/Red, phản biện bằng Red Team 5 persona, sinh checklist có owner/deadline/priority và chuẩn bị post-mortem để team học lại sau mỗi lần launch.

**Demo live:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

## Kiến trúc

Toàn bộ chạy trong **1 Docker image duy nhất** (`python:3.11-slim`, chỉ dùng Python stdlib — không framework, không dependency nặng), deploy lên VNG AgentBase Agent Runtime:

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

Chi tiết + các bẫy đã gặp: xem `OPENCLAW_BUILD_CHECKLIST.md`.

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
friendly-ui.js      # Layer Friendly (2 IIFE riêng — xem CODEX_BRIEF.md)
i18n-clean.js       # Chuyển ngữ VI/EN
styles.css          # Toàn bộ style (token VNG Orange)
friendly.css        # Style riêng phần Friendly
config.js           # window.LAUNCHOPS_API_BASE = "/api" (same-origin)
server/app.py       # Backend duy nhất: UI serving + API + MCP + webhooks
Dockerfile          # python:3.11-slim, EXPOSE 8080
CODEX_BRIEF.md      # Brief cho AI agent / contributor làm tiếp
MEMORY.md           # Trạng thái dự án hiện tại (bản tóm tắt sạch)
```

## Bảo mật

- Không commit `.env`, token, key, log, file DB. `.gitignore` đã chặn sẵn.
- Endpoint public không auth (chủ đích cho demo hackathon); MCP Gateway có inbound IAM cho đường gọi chính thức.
