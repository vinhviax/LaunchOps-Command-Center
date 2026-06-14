# LaunchOps Command Center

> Cập nhật: 14/06/2026 — production đang chạy trên VNG AgentBase, image `v26`, runtime version 32, storage backend `cloud`.

LaunchOps Command Center là một **Super Agent kiểm soát rủi ro launch**. Người dùng dán launch brief, hệ thống chấm readiness Green/Yellow/Red, chạy Red Team 5 góc nhìn, sinh checklist có owner/deadline/priority, viết post-mortem questions và lưu bài học cho các lần launch sau.

**Demo live:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

## Trạng thái hiện tại

| Thành phần | Trạng thái |
|---|---|
| Agent runtime | `runtime-8fe6be1b-efff-4be6-8f1c-1779daabdbbf`, version 32, ACTIVE |
| Docker image | `vcr.vngcloud.vn/111480-abp111734/launchops-command-center:v26` |
| Web/API/MCP endpoint | Public HTTPS endpoint ở trên |
| Storage | VNG vDB/PostgreSQL qua `LAUNCHOPS_STORAGE_BACKEND=cloud` |
| Memory | AgentBase Memory `launchops-memory` + knowledge store `launchops-knowledge` |
| RAG | Production dùng Memory semantic search; Platform RAG Engine `launchops-rag` đã tạo sẵn |
| Governance | App guardrail ON, app rate limit ON, platform Guardrail/Rate Limit đã tạo |
| MCP | Gateway `launchops-server`, target `launchops_server_mcp`, tools `lcc` + workspace CRUD |

## Kiến trúc

Toàn bộ app chạy trong **một Docker image Python duy nhất**. Backend dùng `ThreadingHTTPServer`, không framework web; UI là HTML/CSS/vanilla JS, không build step.

```text
User Browser / Reviewer
        |
        v
AgentBase Runtime HTTPS endpoint
        |
        +-- GET  /                  -> Web UI Pro/Friendly
        +-- POST /api/analyze       -> full LaunchOps analysis
        +-- POST /api/assistant     -> chatbot
        +-- POST /api/launches/...  -> launch CRUD + saved analysis
        +-- POST /mcp               -> MCP JSON-RPC
        +-- GET/DELETE /mcp         -> 405 by spec
        |
        +-- VNG MaaS LLM models
        +-- VNG vDB/PostgreSQL
        +-- AgentBase Memory
        +-- AgentBase MCP Gateway
```

Production hiện chạy dạng **monolith orchestrator** để demo ổn định. Code đã có contract `POST /invocations` và `LAUNCHOPS_AGENT_ROLE=orchestrator|readiness|redteam|checklist|postmortem|memory` để tách thành nhiều AgentBase runtimes khi cần. Năm child runtimes và một canary orchestrator đã được tạo/verify, nhưng production chính vẫn dùng một runtime duy nhất để giảm rủi ro vận hành.

## Pipeline 6 LLM agents

Luồng full `/api/analyze` dùng 6 agent LLM thật, mỗi agent có vai trò rõ và trace riêng:

| Agent | Vai trò | Model hiện tại |
|---|---|---|
| Readiness | Chấm Green/Yellow/Red, giải thích rủi ro | `deepseek/deepseek-v4-pro` |
| Red Team | Phản biện 5 persona | `minimax/minimax-m2.5` |
| Checklist | Sinh việc cần làm có owner/deadline | `qwen/qwen3.7-plus` |
| Post-mortem | Gợi ý câu hỏi/report sau launch | `google/gemma-4-31b-it` |
| Memory | Tóm tắt bài học/RAG thành insight | `qwen/qwen3.7-plus` |
| Orchestrator | Tổng hợp go/no-go executive summary | `qwen/qwen3.7-plus` |

Assistant chatbot là luồng LLM riêng, dùng `deepseek/deepseek-v4-flash`.

Điểm readiness cuối cùng vẫn được tính bằng rubric deterministic để không bị model chấm tùy hứng. LLM dùng để giải thích, phản biện và tổng hợp. Nếu model lỗi, timeout hoặc trả schema sai, agent fallback về rule local và ghi rõ trong `agentsTrace`.

## RAG, Memory và Cloud DB

- `launchops-knowledge`: knowledge store cho RAG, chứa playbook/risk pattern theo launch type và product namespace.
- `launchops-memory`: memory store cho bài học, post-result và context theo actor/session.
- `launchops-rag`: Platform RAG Engine đã tạo sẵn, hiện dùng như tài nguyên platform dự phòng vì module Knowledge base/Tool của RAG chưa attach dữ liệu được trong flow này.
- VNG vDB/PostgreSQL lưu launch, product, template, analysis history và postmortem; local JSON/SQLite vẫn là fallback/dev mode.

Rollback nhanh nếu DB lỗi: đổi `LAUNCHOPS_STORAGE_BACKEND=local`. Rollback nhanh nếu Memory lỗi: đổi `LAUNCHOPS_MEMORY_ENABLED=false`.

## Guardrail và Rate Limit

LaunchOps có hai lớp bảo vệ:

- **App-level guardrail:** reject private key/credential/payment secret, mask email/phone trước khi gọi LLM hoặc ghi memory.
- **App-level rate limit:** giới hạn expensive analyze path, đang bật production ở mức 50 requests/phút và 1000 requests/ngày; MCP fast path được exempt.
- **Platform Guardrail/Rate Limit:** đã tạo trên Protect & Govern để bảo vệ phía MaaS/model access.

Platform Policy Gateway chưa bật vì rule sai có thể chặn nhầm MCP/OpenClaw. Phần này sẽ làm cuối với policy allow rộng trước rồi mới siết.

## MCP và OpenClaw

Endpoint `/mcp` hỗ trợ streamable HTTP JSON-RPC:

- `initialize`
- `notifications/initialized`
- `ping`
- `tools/list`
- `tools/call`

`GET /mcp` và `DELETE /mcp` trả `405` đúng spec, không được đổi.

Các tool chính:

- `lcc`: phân tích nhanh deterministic cho MCP/OpenClaw, tránh timeout gateway.
- `analyze_launch_brief`: tool cũ, giữ backward-compatible.
- `lcc_list_launches`, `lcc_get_launch`, `lcc_create_launch`, `lcc_update_launch`, `lcc_analyze_launch`, `lcc_delete_launch`.
- `lcc_list_types`, `lcc_get_type`, `lcc_create_type`, `lcc_set_launch_template`.

OpenClaw có thể kết nối qua `npx mcp-remote <endpoint>/mcp`.

## Web UI

- **Friendly mode:** trải nghiệm mặc định cho reviewer, có hướng dẫn và visualize theo từng bước.
- **Pro mode:** dashboard đầy đủ cho người vận hành, có readiness, red team, checklist, postmortem, RAG insight và trace.
- **Admin log:** mở bằng `?role=admin`, dùng để xem client events và server trace theo từng launch.
- **VI/EN:** UI có chuyển ngữ, output LLM theo ngôn ngữ của brief.
- **Responsive:** mobile overflow đã xử lý; desktop UI/UX giữ nguyên.

## Chạy local

```bash
# Rule mode nhanh, không cần API key
LAUNCHOPS_LLM_ENABLED=false PORT=8788 python server/app.py

# Full mode, cần .env có MaaS/AgentBase config
PORT=8788 python server/app.py
```

Mở `http://127.0.0.1:8788/`.

## Env quan trọng

```text
LAUNCHOPS_AGENTBASE_BASE_URL=https://...
LAUNCHOPS_AGENTBASE_API_KEY=...
LAUNCHOPS_MODEL_READINESS=deepseek/deepseek-v4-pro
LAUNCHOPS_MODEL_REDTEAM=minimax/minimax-m2.5
LAUNCHOPS_MODEL_CHECKLIST=qwen/qwen3.7-plus
LAUNCHOPS_MODEL_POSTMORTEM=google/gemma-4-31b-it
LAUNCHOPS_MODEL_ASSISTANT=deepseek/deepseek-v4-flash

LAUNCHOPS_STORAGE_BACKEND=cloud
LAUNCHOPS_DB_URL=postgresql://USER:PASSWORD@RW_ENDPOINT:5432/DBNAME?sslmode=disable

LAUNCHOPS_MEMORY_ENABLED=true
LAUNCHOPS_MEMORY_ID=...
LAUNCHOPS_MEMORY_STRATEGY_ID=...
LAUNCHOPS_KNOWLEDGE_MEMORY_ID=...
LAUNCHOPS_RAG_ENABLED=true

LAUNCHOPS_GUARDRAIL_ENABLED=true
LAUNCHOPS_RATELIMIT_ENABLED=true
LAUNCHOPS_RATELIMIT_ANALYZE_PER_MIN=50
LAUNCHOPS_RATELIMIT_ANALYZE_PER_DAY=1000
```

Không commit `.env` hoặc credential thật.

## Cấu trúc repo

```text
index.html                 # Web UI markup
app.js                     # Pro UI, launch CRUD, analyze, run log
friendly-ui.js             # Friendly mode
i18n-clean.js              # VI/EN translations
styles.css                 # Main UI styles
friendly.css               # Friendly-specific styles
config.js                  # Same-origin API config
server/app.py              # Web server + API + MCP + agent pipeline
server/db.py               # Local/cloud storage layer
server/test_app.py         # stdlib unit tests
server/migrate_to_cloud_db.py
server/seed_knowledge.py
data/                      # sample/rubric data
prompts/                   # prompt assets
Dockerfile
README_EN.md
```

## Bảo mật

- Không commit `.env`, `.greennode.json`, API key, DB URL thật, log hoặc file database.
- Endpoint public intentionally mở cho demo hackathon.
- Đường MCP chính thức đi qua AgentBase MCP Gateway/IAM.
- Guardrail xử lý secret/PII trước khi gọi LLM hoặc ghi memory.
