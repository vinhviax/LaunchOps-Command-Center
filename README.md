# LaunchOps Command Center

> Cập nhật: 16/06/2026 — production đang chạy trên VNG AgentBase, image `v33`, runtime version 46, UI cache `fix-20260616f`, storage backend `cloud`, mode `remote_agents`.

LaunchOps Command Center là một **Super Agent kiểm soát rủi ro launch**. Người dùng dán launch brief, hệ thống chấm readiness Green/Yellow/Red, chạy Red Team 5 góc nhìn, sinh checklist có owner/deadline/priority, viết post-mortem questions và lưu bài học cho các lần launch sau.

**Demo live:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

> ⚠️ **Đây là instance riêng của tác giả cho ClawAThon VNG.** Endpoint, MaaS key, Memory store, vDB và child runtime ở trên là tài nguyên + credential **riêng của tác giả, không chia sẻ và không multi-tenant**. Người dùng ngoài muốn chạy bản đầy đủ phải **tự provision tài nguyên của mình** (xem [Hai cách chạy](#hai-cách-chạy-local-demo-vs-full-agentbase)). Để thử nhanh không cần cloud, dùng **Local demo mode**.

## Trạng thái hiện tại

| Thành phần | Trạng thái |
|---|---|
| Agent runtime | `runtime-8fe6be1b-efff-4be6-8f1c-1779daabdbbf`, version 46, ACTIVE |
| Docker image | `vcr.vngcloud.vn/111480-abp111734/launchops-command-center:v33` |
| UI cache | `fix-20260616f` |
| Web/API/MCP endpoint | Public HTTPS endpoint ở trên |
| Storage | VNG vDB/PostgreSQL qua `LAUNCHOPS_STORAGE_BACKEND=cloud` |
| Runtime mode | `remote_agents`: orchestrator gọi 4 analysis child runtimes riêng |
| Memory | AgentBase Memory `launchops-memory` + knowledge stores riêng cho từng analysis agent |
| RAG | Production dùng Memory semantic search; Platform RAG Engine `launchops-rag` đã tạo sẵn |
| Governance | App guardrail ON, app rate limit ON, platform Guardrail/Rate Limit đã tạo |
| MCP | Gateway `launchops-server`, target `launchops_server_mcp`, tools `lcc`, `lcc_docs` + workspace CRUD |

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
        +-- 4 child AgentBase runtimes
        +-- AgentBase Memory stores
        +-- AgentBase MCP Gateway
```

Production hiện chạy dạng **remote multi-agent**: runtime orchestrator nhận request Web/API, gọi 4 child runtime độc lập qua `POST /invocations` (`readiness`, `redteam`, `checklist`, `postmortem`), rồi tổng hợp Memory insight và executive summary. Mỗi analysis child có runtime riêng, model riêng, knowledge memory store riêng và tự semantic-recall trước khi trả kết quả. Nếu remote child lỗi, orchestrator fallback theo từng agent thay vì làm hỏng cả flow.

## Pipeline multi-agent

Luồng full `/api/analyze` dùng các agent LLM thật, mỗi agent có vai trò rõ và trace riêng:

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

Trace production hiện thể hiện `orchestration.mode=remote_agents`, 4 `remote_runtime` entries và `ragSources.storeId` trên từng child trace để chứng minh mỗi analysis agent tự recall từ store riêng.

## RAG, Memory và Cloud DB

- Per-agent knowledge stores: mỗi analysis agent có store riêng cho RAG/self-recall, tránh trộn ngữ cảnh giữa readiness, red team, checklist và post-mortem.
- `launchops-memory`: memory store cho bài học, post-result và context theo actor/session.
- `launchops-rag`: Platform RAG Engine đã tạo sẵn, hiện dùng như tài nguyên platform dự phòng vì module Knowledge base/Tool của RAG chưa attach dữ liệu được trong flow này.
- VNG vDB/PostgreSQL lưu launch, product, template, analysis history và postmortem; local JSON/SQLite vẫn là fallback/dev mode.

Rollback nhanh nếu DB lỗi: đổi `LAUNCHOPS_STORAGE_BACKEND=local`. Rollback nhanh nếu Memory lỗi: đổi `LAUNCHOPS_MEMORY_ENABLED=false`.

## Guardrail và Rate Limit

LaunchOps có hai lớp bảo vệ:

- **App-level guardrail:** reject private key/credential/payment secret, mask email/phone trước khi gọi LLM hoặc ghi memory.
- **App-level rate limit:** giới hạn expensive analyze path, đang bật production ở mức 50 requests/phút và 1000 requests/ngày; MCP fast path được exempt.
- **Platform Guardrail/Rate Limit:** đã tạo trên Protect & Govern để bảo vệ phía MaaS/model access.

**Platform Policy Gateway là lớp gia cố tùy chọn (optional hardening), KHÔNG phải hạng mục bắt buộc còn thiếu.** Hai lớp guardrail + rate limit ở trên đã enforce thật trong app và đủ cho bảo mật demo. Policy Gateway chỉ thêm một tầng allow/deny ở MCP Gateway; chưa bật vì rule sai có thể chặn nhầm MCP/OpenClaw, nên nếu bật thì cấu hình allow rộng trước rồi mới siết.

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
- `lcc_docs`: hướng dẫn dùng LaunchOps và chọn tool đúng cho bot/chat client.
- `analyze_launch_brief`: tool cũ, giữ backward-compatible.
- `lcc_list_launches`, `lcc_get_launch`, `lcc_create_launch`, `lcc_update_launch`, `lcc_analyze_launch`, `lcc_delete_launch`.
- `lcc_list_types`, `lcc_get_type`, `lcc_create_type`, `lcc_set_launch_template`.

OpenClaw có thể kết nối qua `npx mcp-remote <endpoint>/mcp`.

### Channel skill cho OpenClaw/Zalo/Telegram self-host

Nếu bạn tự chạy LaunchOps trên server riêng, không cần AgentBase Gateway để thử tool. Backend tự expose một "channel skill" cho OpenClaw/Zalo/Telegram/Discord:

- `GET /api/channel-skill` hoặc `GET /openclaw/skill`: manifest JSON gồm system prompt, endpoint MCP, endpoint direct tool call, danh sách tool và rule vận hành.
- `GET /openclaw/system-prompt.txt`: system prompt có thể dán vào OpenClaw hoặc bot channel.
- `GET /openclaw/mcp-remote.json`: cấu hình `npx mcp-remote <base>/mcp` cho OpenClaw.
- `GET /discord/skill`, `GET /discord/system-prompt.txt`, `GET /discord/mcp-remote.json`: alias riêng cho Discord bot/self-host, cùng nội dung với channel skill chung.
- `POST /tools/call`: adapter HTTP đơn giản cho bot không nói được MCP, body `{ "name": "lcc_docs", "arguments": {} }`.

Ví dụ local:

```bash
curl http://127.0.0.1:8788/openclaw/skill
curl http://127.0.0.1:8788/openclaw/system-prompt.txt
```

AgentBase/OpenClaw production vẫn có thể dùng MCP Gateway/IAM. Self-host mode chỉ cần trỏ bot của bạn về `/mcp` hoặc `/tools/call`.

## Web UI

- **Friendly mode:** trải nghiệm mặc định cho reviewer, có hướng dẫn và visualize theo từng bước.
- **Pro mode:** dashboard đầy đủ cho người vận hành, có readiness, red team, checklist, postmortem, RAG insight và trace.
- **Admin log:** mở bằng `?role=admin`, dùng để xem client events và server trace theo từng launch.
- **VI/EN:** UI có chuyển ngữ, output LLM theo ngôn ngữ của brief.
- **Responsive:** mobile overflow đã xử lý; desktop UI/UX giữ nguyên.

## Hai cách chạy: Local demo vs Full AgentBase

LaunchOps chạy được ở hai chế độ. **Không cần** tài khoản/khoá của tác giả cho cả hai.

### 1. Local demo mode (chạy ngay, không cần cloud)

Không cần MaaS key, không cần cloud, không cần `.env`. Dùng SQLite/JSON local + bộ dữ liệu mẫu Golden Spin sẵn có, scoring chạy bằng rubric deterministic local. Phù hợp để giám khảo/người ngoài thử ngay toàn bộ luồng.

```bash
LAUNCHOPS_LLM_ENABLED=false PORT=8788 python server/app.py
# mở http://127.0.0.1:8788/
```

Ở mode này: readiness/Red Team/checklist/post-mortem sinh bằng rule local (không gọi LLM), MCP `lcc` vẫn deterministic. Đủ để xem luồng demo Golden Spin bên dưới.

### 2. Full AgentBase mode (multi-agent + LLM thật)

Để có 6 LLM agent thật, RAG, Cloud DB và remote multi-agent, người dùng ngoài **phải tự provision tài nguyên của chính mình** rồi điền vào `.env` riêng (không dùng được tài nguyên của tác giả):

- **VNG MaaS API key** của bạn (`LAUNCHOPS_AGENTBASE_BASE_URL` + key) — bắt buộc để gọi model.
- **AgentBase Memory store(s)** của bạn cho lessons + knowledge/RAG (`LAUNCHOPS_MEMORY_ID`, `LAUNCHOPS_KNOWLEDGE_MEMORY_ID`); seed bằng `server/seed_knowledge.py`.
- **VNG vDB/PostgreSQL** của bạn cho launch/template/history (`LAUNCHOPS_DB_URL`, `LAUNCHOPS_STORAGE_BACKEND=cloud`); migrate bằng `server/migrate_to_cloud_db.py`.
- **4 child AgentBase runtimes** của bạn (readiness/redteam/checklist/postmortem) nếu muốn remote multi-agent (`LAUNCHOPS_USE_REMOTE_AGENTS=true` + 4 URL + `LAUNCHOPS_AGENT_INVOCATION_TOKEN`). Bỏ qua phần này thì app chạy monolith trong 1 runtime, vẫn đủ 6 agent.
- **AgentBase MCP Gateway/IAM** của bạn nếu muốn expose MCP qua gateway có xác thực.
- **`.env` riêng** chứa toàn bộ giá trị trên (xem [Env quan trọng](#env-quan-trọng)). Không có file `.env` của tác giả trong repo.

```bash
# Full mode: cần .env riêng đã provision như trên
PORT=8788 python server/app.py
```

Nếu chưa provision đủ, app **tự fallback an toàn**: thiếu DB → `LAUNCHOPS_STORAGE_BACKEND=local`; thiếu Memory → `LAUNCHOPS_MEMORY_ENABLED=false`; thiếu child runtime → orchestrator chạy monolith; thiếu MaaS key → mỗi agent dùng rule local. Nhờ vậy bản clone vẫn chạy được dù chưa có hạ tầng cloud.

## Demo flow cho giám khảo (Golden Spin)

Bộ dữ liệu mẫu kể câu chuyện sự kiện quay thưởng **Golden Spin** để xem trọn vòng đời launch:

1. **Brief rủi ro** — chọn `Golden Spin Weekend Risk` (hoặc brief nháp Risk) → readiness **Yellow/Red**, điểm thấp, hiện Red Team 5 persona + checklist việc cần sửa.
2. **Học từ retro** — `Golden Spin ... Retro` chứa bài học đã lưu sau launch trước; lesson này được recall để ground phân tích lần sau.
3. **Brief đã sẵn sàng** — `Golden Spin Weekend v2 Ready` đã áp lessons → readiness **Green 12/12**; khi full điểm thì không còn rủi ro mở/Red Team, rủi ro mới chỉ ghi ở phần Kết quả sau launch để thành lesson tiếp theo.
4. **Bằng chứng multi-agent** — mở tab trace / console runtime để thấy `orchestration.mode=remote_agents`, 4 child `remote_runtime` và readiness/redteam/checklist/postmortem chạy độc lập.

Bấm **Nạp Brief Mẫu** hoặc **Demo mode** để nạp nhanh kịch bản này.

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

LAUNCHOPS_USE_REMOTE_AGENTS=true
LAUNCHOPS_READINESS_URL=https://...
LAUNCHOPS_REDTEAM_URL=https://...
LAUNCHOPS_CHECKLIST_URL=https://...
LAUNCHOPS_POSTMORTEM_URL=https://...
LAUNCHOPS_AGENT_INVOCATION_TOKEN=...

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
- Tài nguyên + credential production (endpoint, MaaS key, Memory, vDB, child runtime) là của riêng tác giả, **không chia sẻ**; người clone tự provision tài nguyên của mình.
- Endpoint public intentionally mở cho demo ClawAThon VNG.
- Đường MCP chính thức đi qua AgentBase MCP Gateway/IAM.
- Guardrail xử lý secret/PII trước khi gọi LLM hoặc ghi memory.
