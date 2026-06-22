# LaunchOps Command Center

> Cập nhật 22/06/2026 - dữ liệu mẫu đã được làm lại thành 9 launch đầy đủ hơn, chia 3 đã chạy / 3 đang chạy / 3 sắp chạy; output phân tích, checklist và bài học bám theo ngôn ngữ của brief.

LaunchOps Command Center là một **multi-agent command center kiểm soát rủi ro launch**. Bạn dán một launch brief; hệ thống chấm mức sẵn sàng Green/Yellow/Red theo rubric rủi ro, chạy Red Team 5 góc nhìn, sinh checklist có owner/deadline/priority, soạn câu hỏi post-mortem, và lưu bài học cho lần launch sau.

Nó không phải chatbot. Mục tiêu là biến việc gác cổng launch — vốn dựa vào kinh nghiệm truyền miệng và trí nhớ vài người — thành một hệ thống có điểm số, có người phản biện, có checklist, và có trí nhớ thể chế dùng lại được.

**Demo live:** https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/

> ⚠️ Đây là instance riêng của tác giả cho **ClawAThon VNG**. Endpoint, MaaS key, Cloud DB/PostgreSQL, Memory/knowledge store và child runtime ở trên là tài nguyên + credential **riêng của tác giả, không chia sẻ, không multi-tenant**. Muốn chạy bản đầy đủ, bạn tự provision tài nguyên của mình (xem [Cách chạy](#cách-chạy)). Để thử ngay không cần cloud, dùng **Local demo mode** — chỉ cần Python.

## Ví dụ thực chiến hơn

Giả sử team sắp chạy **event đăng nhập nhận quà 7 ngày** để kéo người chơi cũ quay lại game.

Nếu để Human tự làm tay, tình huống rất quen thuộc sẽ là: PM viết brief trong chat, LiveOps nhớ một nửa, CS nhớ một nửa, tech nhớ một nửa. Mọi người đều có kinh nghiệm, nhưng launch vẫn hay hỏng ở đúng các lỗi cũ:

- chưa chốt KPI nên chạy xong không biết thành công hay thất bại
- chưa có reward cap nên sợ vỡ economy hoặc vượt ngân sách
- chưa có FAQ cho CS nên người chơi hỏi dồn thì trả lời không thống nhất
- chưa rõ ai được quyền pause event hoặc rollback nếu phát quà lỗi
- chưa có rule anti-abuse nên tới lúc bị farm quà mới cuống lên xử lý

Điểm mạnh của LaunchOps Command Center là nó **hơn cách làm tay ở chỗ không phụ thuộc trí nhớ và cảm giác của từng người**.

Nó đọc brief đó và làm ngay mấy việc mà team thường bỏ sót:

1. Nhận ra đây là launch kiểu **đăng nhập giữ chân**, nên dùng đúng bộ tiêu chí của loại launch này, không đánh giá chung chung.
2. Chấm launch theo rubric cố định để trả lời rõ: hiện tại đang **Xanh, Vàng hay Đỏ**, thiếu bao nhiêu điểm, thiếu ở đâu.
3. Red Team từ nhiều góc nhìn để soi ra các lỗi launch thường gặp trước khi lên production: user complain gì, CS vỡ chỗ nào, tech vấp ở đâu, business hở chỗ nào.
4. Ép mọi lỗ hổng thành checklist có owner thật: ai chốt KPI, ai viết FAQ, ai theo dõi log, ai trực sự cố, ai quyết định dừng event.

Quan trọng hơn, sau khi launch chạy xong nó không để bài học trôi mất trong chat.

Nếu lần này event bị người chơi than phiền vì phát quà chậm, hoặc bị farm quà vì thiếu anti-abuse, lesson đó sẽ được lưu lại. Lần launch sau, khi team lại tạo một event đăng nhập tương tự, agent sẽ kéo chính bài học đó vào lúc phân tích để nhắc lại: "lần trước đã từng vỡ ở đây". Nếu lesson lặp đủ nhiều, agent còn có thể **đề xuất** cập nhật luôn rubric/template để những lần sau bị soi chặt hơn ở đúng điểm yếu cũ, nhưng vẫn phải có Human duyệt mới được áp dụng.

Nói ngắn gọn: Human vẫn là người quyết định launch, nhưng agent mạnh hơn ở chỗ nó **không quên, không chấm theo cảm tính, không bỏ sót lỗi cũ, và biến kinh nghiệm rời rạc của team thành một hệ thống dùng lại được cho mọi lần launch sau**.

## Dùng cho việc gì (không bó vào một ngành)

LCC không gắn cứng với game hay một loại sự kiện nào. Nó hợp với bất kỳ launch nào có rủi ro và cần một quyết định Go/No-Go:

- Tính năng/SaaS release, rollout kỹ thuật, hạ tầng nội bộ.
- Campaign marketing, sự kiện, chương trình khuyến mãi.
- Phần cứng, fintech, hoặc bất kỳ vòng đời "chuẩn bị → chạy → tổng kết" nào.

Đổi ngành = đổi **template** (bộ phân loại, nhóm rủi ro, persona Red Team, checklist), **không đổi code**. Bộ dữ liệu demo "Golden Spin" chỉ là một case study để xem trọn vòng đời, không phải giới hạn phạm vi.

## Cách hoạt động — pipeline 5 bước

1. **Đọc brief** → nhận diện loại launch, kéo template + bài học liên quan vào ngữ cảnh.
2. **Chấm readiness** → Green / Yellow / Red kèm điểm, theo rubric rủi ro của template.
3. **Red Team** → 5 persona (user, kỹ thuật, CS, business, LiveOps) phản biện, mỗi persona một rủi ro + bằng chứng + cách sửa.
4. **Checklist** → việc cần làm theo mốc (trước/ngày/đang chạy/sau launch), có owner/deadline/status.
5. **Post-mortem & lessons** → câu hỏi tổng kết, lưu kết quả thật + bài học để ground lần launch sau.

Full `/api/analyze` chạy 6 LLM agent thật, mỗi agent một vai trò, một model, một trace riêng:

| Agent | Vai trò | Model |
|---|---|---|
| Readiness | Giải thích Green/Yellow/Red | `google/gemma-4-31b-it` |
| Red Team | Phản biện 5 persona | `minimax/minimax-m2.5` |
| Checklist | Việc cần làm + owner/deadline | `google/gemma-4-31b-it` |
| Post-mortem | Câu hỏi/report sau launch | `google/gemma-4-31b-it` |
| Memory | Tóm tắt bài học recall thành insight | `google/gemma-4-31b-it` |
| Orchestrator | Tổng hợp go/no-go executive summary | `google/gemma-4-31b-it` |

Assistant chatbot dùng `google/gemma-4-31b-it`. Toàn bộ LLM path hiện chỉ dùng 2 model được phép: Gemma `google/gemma-4-31b-it` và Minimax `minimax/minimax-m2.5`; nếu env nhập tên ngắn `gemma-4-31b-it` hoặc `minimax-m2.5`, backend tự map về MaaS ID chuẩn. MCP/Bot dùng đường fast path deterministic (`lcc`) trả < 1s để không timeout gateway.

## Nó tự học (controlled self-learning — đang chạy)

Bài học sau launch không nằm chết trong log. LCC học theo hai tầng:

- **Học mềm:** lesson đã lưu được recall và ghép vào prompt của mọi agent ở lần phân tích cùng loại launch tiếp theo, nên brief sau được soi bằng những gì đã sai ở brief trước.
- **Học cứng (có người duyệt):** từ một lesson, AI **đề xuất** delta cho rubric/persona (thêm nhóm rủi ro, đổi maxScore, thêm persona). Đề xuất ở trạng thái `proposed`, **không tự đổi template**. Một người duyệt Approve/Reject; Approve mới tạo **template version mới** và áp cho lần chấm sau.

Toàn bộ có human-in-the-loop, versioned và auditable. Đề xuất bị mask secret/PII trước khi lưu, và các tool sửa cấu hình chỉ mở cho Human Admin. Đây là tính năng đã live, không phải mô tả tương lai.

## Vì sao tin được điểm số

Điểm readiness **không** do LLM chấm. Nó được tính lại bằng **rubric deterministic** theo evidence trong brief đối chiếu nhóm rủi ro của template — cùng brief + cùng template luôn ra cùng điểm. LLM chỉ giải thích, phản biện và tổng hợp.

Đây là một đánh đổi có chủ đích: một cổng Go/No-Go phải **lặp lại được và kiểm toán được**, không phụ thuộc tâm trạng model. Nếu để LLM tự chấm số, cùng một brief có thể ra điểm khác nhau giữa các lần — không chấp nhận được cho quyết định launch. Nên model làm phần nó giỏi (ngôn ngữ, phản biện), còn con số do rule cố định quyết định. Khi model lỗi/timeout/trả sai schema, agent fallback về rule local và ghi rõ lý do trong `agentsTrace`.

Đi kèm hai cơ chế bảo vệ, mỗi cơ chế ở hai tầng — app-level (enforce trong code) và platform-level (resource trên VNG Protect & Govern):

- **Guardrail** — app-level: reject brief chứa private key/credential/secret thanh toán, mask email/phone trước khi gọi LLM hoặc ghi memory. Platform-level: resource Guardrail `launchops-guardrail` bảo vệ thêm phía MaaS/model access.
- **Rate limit** — app-level: chặn lạm dụng đường analyze tốn kém (production 50 req/phút, 1000 req/ngày; MCP fast path exempt). Platform-level: resource Rate Limit `launchops-rate-limit` trên Protect & Govern (1000 request + 3 triệu token mỗi tháng).

## Kiến trúc

Core app là **một codebase Python + HTML/CSS/vanilla JS không build step**. Cùng codebase này có thể chạy theo hai kiểu: **monolith một runtime** hoặc **distributed remote-agents** (1 orchestrator + 4 child runtime analysis).

```text
User / Reviewer  ──▶  AgentBase Runtime (orchestrator)
                         ├── GET  /                 → Web UI Pro/Friendly
                         ├── POST /api/analyze      → full multi-agent analysis
                         ├── POST /api/assistant    → chatbot
                         ├── POST /api/launches/... → launch CRUD + saved analysis
                         ├── POST /mcp              → MCP JSON-RPC
                         └── GET/DELETE /mcp        → 405 (đúng spec streamable-http)
                         │
                         ├── VNG MaaS LLM models
                         ├── Cloud DB / PostgreSQL (launch, template, history, archive)
                         ├── 4 child runtimes: readiness · redteam · checklist · postmortem
                         ├── Memory stores / knowledge stores cho recall và lesson grounding
                         └── Optional MCP path: AgentBase MCP Gateway hoặc self-host channel/bot
```

Production hiện chạy **remote multi-agent**: orchestrator nhận request, gọi 4 child runtime độc lập qua `POST /invocations`. Mỗi child có runtime riêng, model riêng, và có thể recall từ memory/knowledge store riêng trước khi trả về. Memory insight + executive summary tổng hợp ở orchestrator. Child lỗi thì orchestrator fallback theo từng agent, không làm hỏng cả flow. Trace production thể hiện `orchestration.mode=remote_agents` + `ragSources.storeId` trên từng child để chứng minh điều này.

MCP còn có **channel skill self-host** để bot đi thẳng vào LaunchOps backend mà không bắt buộc qua AgentBase Gateway. Hiện package này expose manifest chung ở `/api/channel-skill`, alias riêng cho OpenClaw/Discord ở `/openclaw/skill` và `/discord/skill`, kèm system-prompt và `mcp-remote.json`. Zalo/Telegram hiện dùng cùng package skill + webhook backend, không có route alias `/zalo/skill` hay `/telegram/skill` riêng. Riêng OpenClaw vẫn cần bridge `npx mcp-remote` vì client này chỉ hỗ trợ stdio MCP.

## Nơi nó mở rộng

Mỗi hướng mở rộng neo vào một thứ đã có sẵn, không phải lời hứa suông. Tách rõ cái đã chạy với cái còn là định hướng:

| Trục | Đã có ✅ / Định hướng 🔜 | Neo vào primitive nào |
|---|---|---|
| **Ngành** | ✅ đổi ngành = đổi template, không đổi code | Hệ template + catalog phân loại/risk group/persona |
| **Tổ chức** | ✅ một phần — product selector, template riêng từng sản phẩm (Demo live, Product XYZ khóa) | `lcc_select_product` + per-product template |
| **Dữ liệu vận hành** | 🔜 ground điểm bằng số liệu thật (DAU, doanh thu, sự cố) | Kiến trúc MCP đã có; chưa wire data source vào scoring |
| **Kiến trúc MCP** | ✅ MCP server + channel skill/webhook cho nhiều kênh chat/agent | `/mcp`, `/api/channel-skill`, OpenClaw/Discord skill alias, Zalo/Telegram webhook |
| **Hiệu ứng cộng dồn** | ✅ self-learning + memory: càng dùng, rubric/lesson càng dày | Controlled self-learning + per-agent memory store |

Hạt giống ở đây là một nền tảng quản trị launch tự cải thiện theo thời gian — và kiến trúc để làm việc đó (template versioned, memory riêng từng agent, người duyệt giữa vòng học) đã nằm sẵn trong bản đang chạy.

## Cách chạy

### 1. Local demo — chạy ngay, không cần cloud, không cần key

Dùng SQLite/JSON local + dữ liệu mẫu Golden Spin; readiness/Red Team/checklist/post-mortem sinh bằng rubric deterministic local (không gọi LLM). Đủ để xem trọn luồng.

```bash
# rule-mode tức thì, không gọi LLM dù máy có sẵn credential
LAUNCHOPS_LLM_ENABLED=false LAUNCHOPS_MULTI_MODEL_ENABLED=false \
LAUNCHOPS_ORCHESTRATOR_LLM_ENABLED=false LAUNCHOPS_MEMORY_LLM_ENABLED=false \
PORT=8788 python server/app.py
# mở http://127.0.0.1:8788/
```

> Bốn cờ trên tắt cả 6 agent. Nếu máy không có credential LLM nào, app tự fallback rule ngay — chỉ cần `PORT=8788 python server/app.py`.

### 2. Có LLM thật — **một API key dùng cho tất cả agent**

Nhiều người chỉ có một key. LCC chỉ cần **một** key + một base URL + một model là đủ; cả 6 agent dùng chung:

```bash
LLM_API_KEY=your_key_here
LLM_BASE_URL=https://your-openai-compatible-endpoint/v1
LLM_MODEL=google/gemma-4-31b-it
PORT=8788 python server/app.py
```

Mọi agent gọi OpenAI-compatible `/v1/chat/completions`. Muốn **tách model/key riêng từng agent** (nâng cao) thì set thêm `LAUNCHOPS_MODEL_<AGENT>` và `LAUNCHOPS_<AGENT>_API_KEY`; nếu không set, agent tự fallback về key/model chung ở trên — nên cấu hình một key luôn hoạt động.

### 3. Full AgentBase — multi-agent phân tán + RAG + Cloud DB

Để có remote multi-agent, RAG và Cloud DB như production, bạn tự provision tài nguyên của mình rồi điền `.env` riêng (xem [Env](#env)): VNG MaaS key, Cloud DB/PostgreSQL, AgentBase Memory/knowledge store(s), và 4 child runtime. MCP Gateway là đường tích hợp tùy chọn; self-host channel skill có thể đi thẳng vào backend. Thiếu phần nào app tự fallback an toàn: thiếu DB → local; thiếu Memory → tắt memory; thiếu child → chạy monolith 1 runtime; thiếu key → rule local.

## Demo flow (sample launches)

1. **Đã chạy, có bài học** — nhóm completed có 1 Red (`Shop Đá Quý Bão Tố Đã Chạy`) và 2 Yellow, mỗi launch đều có post-result + lesson để LCC recall cho lần sau.
2. **Đang chạy** — nhóm running có `Xem Trước Kho Skin Đang Chạy` Green và 2 launch Yellow cần theo dõi (`Vòng Quay Golden Spin Đang Chạy`, `Đua Boss Bang Hội Đang Chạy`).
3. **Sắp chạy** — nhóm upcoming có 2 Green (`Vòng Quay Golden Spin Sắp Chạy`, `Festival Skin Phoenix Sắp Chạy`) và 1 Yellow (`Chuỗi Đăng Nhập Comeback Sắp Chạy`).
4. **Bằng chứng multi-agent** — mở tab trace để thấy readiness theo rubric, Red Team/checklist/post-mortem do agent phân tích, và lesson từ launch đã chạy được dùng làm ngữ cảnh.

Bấm **Nạp Brief Mẫu** hoặc **Demo mode** để nạp nhanh.

## Web UI

- **Friendly mode:** trải nghiệm hướng dẫn từng bước cho người mới.
- **Pro mode:** dashboard đầy đủ — readiness, Red Team, checklist, post-mortem, RAG insight, trace, và panel controlled self-learning.
- **Danh sách launch:** lọc chung cho Pro/Friendly theo tên, phân loại, template, trạng thái và khoảng ngày chạy để tìm nhanh launch trong một giai đoạn.
- **Lưu trữ:** launch người dùng khi xóa được đưa vào tab Archive/Lưu trữ trong Cấu Hình để Admin xem, khôi phục hoặc xóa vĩnh viễn; bản public review chỉ cho xem khi đang khóa.
- **Mẫu gốc:** launch mẫu, phân loại mẫu và template mẫu là dữ liệu demo bất biến với người dùng thường; người dùng có thể tạo/sửa/xóa dữ liệu custom riêng mà không làm hỏng mẫu.
- **Log:** xem client event + server trace từng launch ở Pro mode (read-only trong bản review công khai).
- **VI/EN:** UI song ngữ; output phân tích, việc cần làm và bài học theo ngôn ngữ của brief (brief tiếng Việt trả tiếng Việt, brief tiếng Anh trả tiếng Anh).

## MCP và tool

`/mcp` hỗ trợ streamable HTTP JSON-RPC (`initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`). `GET /mcp` và `DELETE /mcp` trả `405` đúng spec.

- `lcc` — phân tích nhanh deterministic cho MCP/OpenClaw.
- `lcc_docs` — hướng dẫn dùng LaunchOps + chọn tool đúng cho bot.
- `lcc_catalog` — đọc catalog bất biến (product/phân loại/template); bot chỉ đọc, không sửa.
- `lcc_list_launches` · `lcc_get_launch` · `lcc_create_launch` · `lcc_update_launch` · `lcc_analyze_launch` · `lcc_delete_launch`.
- `lcc_propose_template_update` · `lcc_approve_template_version` — controlled self-learning (Admin-only).
- `analyze_launch_brief` — tool cũ, giữ backward-compatible.

OpenClaw kết nối qua `npx mcp-remote <endpoint>/mcp`. Với bot/webhook tự host, có thể đi qua `/mcp` (nếu client nói được MCP streamable-http hoặc có bridge tương đương) hoặc gọi `POST /tools/call` theo wrapper riêng.

## Env

```text
# Tối thiểu (một key cho tất cả agent):
LLM_API_KEY=...
LLM_BASE_URL=https://.../v1
LLM_MODEL=google/gemma-4-31b-it

# Nâng cao — tách model/key từng agent (tùy chọn, chỉ 2 model được phép):
LAUNCHOPS_MODEL_READINESS=google/gemma-4-31b-it
LAUNCHOPS_MODEL_REDTEAM=minimax/minimax-m2.5
LAUNCHOPS_MODEL_CHECKLIST=google/gemma-4-31b-it
LAUNCHOPS_MODEL_POSTMORTEM=google/gemma-4-31b-it
LAUNCHOPS_MODEL_MEMORY=google/gemma-4-31b-it
LAUNCHOPS_MODEL_ORCHESTRATOR=google/gemma-4-31b-it
LAUNCHOPS_MODEL_ASSISTANT=google/gemma-4-31b-it

# Cloud (tùy chọn):
LAUNCHOPS_STORAGE_BACKEND=cloud
LAUNCHOPS_DB_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=disable
LAUNCHOPS_MEMORY_ENABLED=true
LAUNCHOPS_MEMORY_ID=...
LAUNCHOPS_KNOWLEDGE_MEMORY_ID=...
LAUNCHOPS_RAG_ENABLED=true

# Remote multi-agent (tùy chọn):
LAUNCHOPS_USE_REMOTE_AGENTS=true
LAUNCHOPS_READINESS_URL=https://...
LAUNCHOPS_REDTEAM_URL=https://...
LAUNCHOPS_CHECKLIST_URL=https://...
LAUNCHOPS_POSTMORTEM_URL=https://...
LAUNCHOPS_AGENT_INVOCATION_TOKEN=...

# Governance:
LAUNCHOPS_GUARDRAIL_ENABLED=true
LAUNCHOPS_RATELIMIT_ENABLED=false
LAUNCHOPS_RATELIMIT_ANALYZE_PER_MIN=50
LAUNCHOPS_RATELIMIT_ANALYZE_PER_DAY=1000
```


Không commit `.env` hoặc credential thật.

## Cấu trúc repo

```text
index.html              # Web UI markup
app.js                  # Pro UI: launch CRUD, analyze, run log, self-learning UI
friendly-ui.js          # Friendly mode
i18n-clean.js           # chuyển ngữ VI/EN
styles.css · friendly.css
config.js               # same-origin API config
server/app.py           # Web server + API + MCP + pipeline 6 agent
server/db.py            # tầng storage local/cloud
server/test_app.py      # unit test stdlib (182 test)
server/requirements.txt · server/schema.sql
server/seed_knowledge.py · server/seed_demo_data.py · server/migrate_to_cloud_db.py
data/ · prompts/ · Dockerfile · .env.example · README_EN.md
```

## Test

```bash
python -m unittest server.test_app    # 182 test, stdlib, không cần .env
node --check app.js friendly-ui.js i18n-clean.js
```

## Bảo mật

- Không commit `.env`, `.greennode.json`, API key, DB URL thật, log hay file database.
- Tài nguyên + credential production là của riêng tác giả, không chia sẻ; người clone tự provision.
- Guardrail xử lý secret/PII trước khi gọi LLM hoặc ghi memory; assistant context được redact trước khi vào prompt.
- Endpoint public mở có chủ đích cho demo ClawAThon VNG.
