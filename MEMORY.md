# Project Memory - Claw(a)thon / LaunchOps Command Center

Last updated: 2026-06-11 (chieu muon - Antigravity session end)

> Quy tắc file này (Human chốt 11/06): chỉ giữ quyết định/tiến độ từ **18:00 10/06/2026** trở đi. Lịch sử cũ hơn nằm trong `Backup/` (snapshot) và `Archive/`, không đọc lại trừ khi cần restore.

## 0. Cách dùng

Đây là file duy nhất cần đọc đầu phiên. Sau khi đọc, tóm tắt: trạng thái hiện tại, việc nên làm tiếp, rủi ro chính, file có thể sửa/tạo. Quy tắc làm việc + encoding rules nằm trong `AGENTS.md`.

## 1. Hướng sản phẩm (cố định)

- **Plan S - LaunchOps Command Center / Super Agent**. Không quay lại chatbot chung chung.
- Flow demo cốt lõi: `bad launch brief -> readiness Green/Yellow/Red -> Red Team 5 persona -> checklist owner/deadline/status -> post-mortem draft`.
- Multi-agent pipeline tối giản có `agentsTrace` để chứng minh — mô tả trung thực, không claim quá đà.
- UI 2 mode (Pro/Friendly) **đóng băng** — chỉ bugfix, không polish thêm nếu Human không yêu cầu rõ.

## 2. Thông tin chính thức BTC (Rulebook v1.2 + User Guide)

- Deadline nộp: **17/06/2026 12:00 VN**. BTC review 17/06 13:00-17:00. Fail thì appeal đúng 1 lần trong 18-19/06. Voting 22/06 09:00 → 03/07.
- 3 điều kiện PASS đồng thời:
  1. Agent deploy và đang chạy trên **AgentBase**; BTC gọi thành công ít nhất 1 request.
  2. Video demo 2-3 phút, truy cập được bằng tài khoản VNG (YouTube/OneDrive).
  3. README + mô tả form nội dung thật (form ≤300 ký tự; README có bản 100-200 chữ).
- Thành viên: `VinhVNN - GS9 - email @vng.com.vn`.
- Data: chỉ public/synthetic/anonymized. Không PII, không data nội bộ.
- Tài nguyên: shared AgentBase account, 3 OpenClaw instances (2vCPU/4GB), MaaS tokens, POC wallet 10M VND.

## 3. Trạng thái hiện tại (cuối ngày 11/06)

**Đã chạy thật trên AgentBase:**

- Custom Agent runtime **ACTIVE**, public endpoint:
  `https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn`
- Docker image đã push: `vcr.vngcloud.vn/111480-abp111734/launchops-command-center:v1`.
- MCP Gateway `launchops-server`: `https://gw-launchops-server-111734.agentbase-gateway.aiplatform.vngcloud.vn` (target `launchops_server_mcp`, policy group `launchops_policy_group` ALLOW). Lưu ý: test gateway bằng curl bị 403/404 chưa chắc là hỏng — cần test bằng MCP client thật.
- OpenClaw 1-Click instance (`vinhvnn-viax`) ACTIVE, đã cấu hình kênh Zalo/Telegram + prompt bridge đóng vai LaunchOps — đây là backup chatbot. OpenClaw UI **không** có chỗ gắn external MCP Gateway.
- Multi-model routing 5 model GreenNode MaaS đã live OK (0.13s-3.25s):
  readiness=`deepseek/deepseek-v4-pro`, redteam=`minimax/minimax-m2.5`, checklist=`qwen/qwen3.7-plus`, postmortem=`google/gemma-4-31b-it`, assistant=`deepseek/deepseek-v4-flash`. LLM fail → fallback rule-based, score luôn deterministic.

**Backend (bản public = bản chuẩn):**

- Multi-agent: `readiness_agent` / `red_team_agent` / `checklist_agent` / `postmortem_agent` + `orchestrate_launchops_analysis` + `agentsTrace`.
- DB SQLite (`schema.sql`, `db.py`, `seed_db.py`): 3 launch type profiles (`game_event_h5`, `webshop_promotion`, `marketing`), product snapshots + lessons synthetic, RAG insights (đối chiếu từ khóa brief với lessons/snapshots) hiển thị trên UI.
- Routes: `GET /health`, `POST /analyze`, `POST /api/analyze`, `POST /invocations`, `GET /api/types`, `POST /api/product-context`, `GET /api/product/<gameId>/snapshot`, MCP `/tools` + tool `analyze_launch_brief`.
- Test chuẩn: bad brief → `Red`, trace 5, 5 Red Team cards, 8 checklist tasks, 3 postmortem blocks; good brief → `Green 16/18` (game_event_h5).

**Frontend public:** i18n VI/EN (`i18n-clean.js` + dict trong `app.js`), intro modal, RAG insights panel. Đã verify browser 11/06: tiếng Việt chuẩn, đổi ngôn ngữ OK, 0 console error.

**Hạ tầng phụ:**

- Repo GitHub: `https://github.com/vinhviax/LaunchOps-Command-Center` (branch `main`). Local có thay đổi **chưa commit/push** (sửa encoding + bugfix 11/06 — xem mục 4).
- Bản deploy local nằm ở `D:\Clawathon` trên **máy PC kia** (không phải máy hiện tại).
- Cloudflare Pages `https://launchops-command-center.pages.dev/` chỉ là visual demo/backup, không phải bằng chứng PASS.
- Backup snapshots trong `Backup/` (mới nhất: `Clawathon_backup_launchops_rag_memory_final_20260611_0812`).

## 4. Tiến độ từ 18:00 ngày 10/06 (mới → cũ)
### 11/06 chieu muon - AgentBase docs + GitHub clean sync (Antigravity)

- Da doc tai lieu AgentBase chinh thuc qua MCP `vng-cloud-docs` + ban local: Service Contract yeu cau container listen port `8080`, `GET /health` tra HTTP 200; headers `X-GreenNode-AgentBase-User-Id` va `X-GreenNode-AgentBase-Session-Id` duoc tu dong tiem.
- Xac nhan BTC/clients goi runtime qua endpoint HTTPS cua AgentBase, path do app dinh nghia; AgentBase khong bat buoc route `/invocations`. App hien co du `GET /health`, `POST /analyze`, `POST /api/analyze`, `POST /invocations`, `/tools`, `/tools/call`.
- Phat hien GitHub `origin/main` con loi encoding that trong repo public (`?`, U+FFFD, BOM, `server/launchops.db` tracked). Khoi phuc file sach tu commit local `f44b40b`: `server/app.py`, `server/seed_db.py`, `server/db.py`, `app.js`, `index.html`, `README.md`, `i18n-clean.js`.
- Bo tracking `server/launchops.db`; DB se tu seed khi container start. Bo BOM khoi `server/schema.sql`, `MEMORY.md`, `OPENCLAW_BUILD_CHECKLIST.md`.
- Secret scan chi thay placeholder/env lookup, khong thay secret that. Commit `b605e37` da push thanh cong len GitHub `main`; local public repo hien clean va dong bo `origin/main`.

### 11/06 chiều - Yêu cầu tích hợp MCP VNG Cloud Docs (Antigravity)

- Human yêu cầu dùng MCP server VNG Cloud Docs để đọc tài liệu AgentBase chính thức.
- Lệnh `codex mcp add ...` không chạy được trên Windows Store app do `codex.exe` bị `Access is denied`.
- Codex đã thêm thủ công vào `C:\\Users\\CPU13114\\.codex\\config.toml`:
  ```toml
  [mcp_servers.vng-cloud-docs]
  url = "https://docs.vngcloud.vn/vng-cloud-document/~gitbook/mcp"
  startup_timeout_sec = 120
  ```
- Cần restart Codex session để load MCP server `vng-cloud-docs`; session hiện tại chưa thấy resource MCP vì server chưa được nạp lúc khởi động.

### 11/06 chiều - Codex kiểm tra mã hóa & đồng bộ hóa (Antigravity)

- Chạy scan encoding kiểm tra toàn bộ file source code: sạch lỗi BOM/mojibake.
- Compile thử python backend (`app.py`, `db.py`, `seed_db.py`): Biên dịch thành công 100%.
- Chạy seed database `server/launchops.db` thành công, sẵn sàng cho việc đóng gói.
- Xác nhận các thay đổi local so với GitHub hoàn tất sửa lỗi nút chuyển ngôn ngữ.


### 11/06 trưa - Phiên sửa encoding toàn dự án + bugfix frontend (Claude Code)

- Phát hiện và sửa **5 loại lỗi encoding** trên toàn dự án (chi tiết + rule phòng ngừa: `AGENTS.md` mục File Encoding Rules):
  1. UTF-8 BOM — đã bỏ khỏi mọi file (MEMORY, checklists, app.py, db.py, seed_db.py, config.js, schema.sql, 23 file Backup).
  2. Mojibake CP1252 double-encode — fix lossless ~1100 dòng (MEMORY 737, checklists 216, app.py 95, Backup 3866 dòng/19 file).
  3. PowerShell backtick nuốt chữ trong MEMORY — khôi phục từ ngữ cảnh.
  4. Lossy `?` thay dấu tiếng Việt — khôi phục từ ngữ cảnh: MEMORY (70 dòng), DEMO_SCRIPT (38), checklists (28), **repo public** (README 32, app.py 74 chuỗi, app.js + i18n-clean.js ~75 chuỗi UI, index.html aria-label).
  5. U+FFFD `�` phá ký tự 2-byte trong bản public — khôi phục **1056 dòng** (app.js 593, friendly-ui.js 302, index.html 161) bằng cách khớp dòng với working copy sạch; 0 dòng thất bại.
- **Bugfix frontend public:** nút VI/EN mang class `mode-btn` nhưng không có `data-mode` → bấm đổi ngôn ngữ bị đá khỏi Friendly về Pro. Đã guard trong `friendly-ui.js` (skip nút không có `data-mode`). Verify browser: đổi ngôn ngữ giữ nguyên mode, toggle Friendly/Pro vẫn OK.
- Git hygiene: thêm `server/launchops.db` + `*.db` vào `.gitignore` public (DB tự seed khi trống, không nên commit). Bump cache version script tags → `?v=i18n-fix-20260611a`.
- Viết lại sạch: `README.md` public, `DEMO_SCRIPT.md`. Tinh gọn toàn bộ file hệ thống (file này, WEBUI, 2 checklist, RISK) — chỉ giữ từ 18:00 10/06.
- Verify cuối: 0 lỗi encoding toàn repo public; `node --check` + `py_compile` pass toàn bộ.
- **Việc nối tiếp quan trọng:** Docker image `v1` đang chạy trên runtime vẫn chứa chuỗi tiếng Việt lỗi (build trước khi sửa). Cần: commit/push repo public → rebuild image từ source đã sửa (trên máy có Docker, ví dụ `D:\Clawathon` PC kia, pull từ GitHub) → push tag mới → update runtime.

### 11/06 08:10 - OpenClaw Active + RAG/Memory hoàn tất

- OpenClaw instance `vinhvnn-viax` ACTIVE; kênh Zalo/Telegram cấu hình trên UI OpenClaw; prompt bridge để bot đóng vai LaunchOps làm backup chatbot.
- Custom Agent LCC có RAG Insights trên UI, tự lôi bài học quá khứ từ SQLite theo từ khóa brief. Test local trả RAG insights 200 OK.
- Khảo sát OpenClaw Settings/Config/Nodes/Skills: không có chỗ gắn external MCP Gateway qua giao diện.

### 11/06 06:15 - MCP Gateway + runtime ACTIVE

- Runtime LaunchOps ACTIVE; public endpoint chạy code mới, trả 7 MCP tools.
- Image push lên `vcr.vngcloud.vn/111480-abp111734/launchops-command-center:v1`.
- Tạo MCP Gateway `launchops-server` + policy group ALLOW; upstream là runtime endpoint.

### 11/06 ~05:00 - Live call 5 model MaaS

- Kết nối `https://maas-llm-aiplatform-hcm.api.vngcloud.vn/v1` OK; định tuyến 5 model cho 5 agent, test pipeline 0.13-3.25s không lỗi. Backend tại `D:\Clawathon` tích hợp đầy đủ multi-model.

### 11/06 ~03:00 - Docker build pass tại D:\Clawathon

- Copy repo public sang `D:\Clawathon` (path ngắn, tránh lỗi CreateProcess của Google Drive path).
- Build image `launchops-command-center:local` OK; container test: `GET /health` OK, `POST /analyze` trả `Red 1/18, trace 5, cards 5, tasks 8, pm 3`.

### 11/06 sáng sớm - Local verification + Docker baseline

- Re-verify toàn bộ repo public; core pipeline chạy đủ 5 phần.
- Fix bug `infer_launch_type()`: nếu caller truyền `launch.type` hợp lệ thì dùng, không để keyword trong brief override nhầm profile (trước đó brief có chữ `campaign` bị kéo sang `marketing` dù truyền `game_event_h5`).
- Thêm `Dockerfile` + `.dockerignore` cho repo public.

### 10/06 19:40 - Multi-agent core + DB/context pass subset test

- Backend public có 4 agent functions + orchestrator + `agentsTrace` + fallback đủ 5 cards / 8 tasks / 3 blocks.
- DB/context lên khung: `schema.sql`, `db.py`, `seed_db.py`; seed 3 profiles + snapshots + lessons synthetic; routes `/api/types`, `/api/product-context`, `/api/product/<gameId>/snapshot`; `/analyze` trả thêm `productContext` + lessons injection.
- Test pass: bad → Red; good > bad; webshop brief → đúng profile; các route 200.
- Backup mốc này: `Clawathon_backup_pre_multiagent_20260610_185720`.
- Dọn tài liệu: gộp plan vào file cố định, xóa file tạm (ADVISOR_REVIEW, PLAN_20260610, PRODUCTION_DESIGN), archive `claw-a-thon-plan.html`.

## 5. Việc còn lại (theo thứ tự)

1. **[Da xong] Doc docs AgentBase + route audit** -> Service Contract khop: port `8080`, `GET /health`, app tu dinh nghia path; `/invocations` da co lam alias du phong.
2. **[Uu tien] Dong bo ban sua len production:**
   - Tren may co Docker: pull GitHub ban sach moi nhat -> rebuild image tag `v2` -> push registry -> update runtime AgentBase.
   - Verify endpoint public: `GET /health` 200 + `POST /analyze` hoac `POST /invocations` du 5 phan, tieng Viet sach.
3. **Submission assets (P3):** form description 292 ký tự đã soạn (xem SUBMISSION_CHECKLIST.md); 3 screenshots; điền link video khi có.
4. **Video 2-3 phút (P4):** theo `DEMO_SCRIPT.md` (bản 2:30). Upload YouTube/OneDrive, test mở bằng account VNG ẩn danh.
5. **Freeze + nộp (P5):** re-verify endpoint sống; điền form trước 11:00 ngày 17/06; không sửa gì sau khi nộp.

## 6. Rủi ro cần nhớ

- **Image v1 đang chạy chứa text tiếng Việt lỗi** — BTC gọi MCP tool/fallback sẽ thấy "T?o launch..." → ưu tiên rebuild sớm.
- Lộ secret khi push: không commit `.env`, `.greennode.json`, `.agentbase/`, token, logs, `launchops.db`. Scan: `git grep -n "API_KEY\|SECRET\|BEGIN PRIVATE KEY"`.
- Encoding tái nhiễm: tuân thủ File Encoding Rules trong `AGENTS.md` (UTF-8 no BOM; không pipe tiếng Việt qua PowerShell double-quote).
- Không polish UI/refactor lớn sát deadline; sau khi nộp không đụng repo/runtime.
- Video >3 phút hoặc không mở được bằng account VNG → fail điều kiện 2.
- Quota MaaS: LLM là enhancement; deterministic là đường chính, không spam call.

## 7. File map (nguồn sống)

- `MEMORY.md` — file này; cập nhật cuối mỗi phiên.
- `AGENTS.md` — luật làm việc + encoding rules.
- `DEMO_SCRIPT.md` — kịch bản video 2:30.
- `RISK_ANALYSIS.md` — rủi ro cuộc thi (đã tinh gọn).
- `WEBUI_UPDATE_PROGRESS.md` — trạng thái UI (đóng băng).
- `launchops-command-center/SUBMISSION_CHECKLIST.md` — checklist nộp bài + link thật.
- `launchops-command-center/OPENCLAW_BUILD_CHECKLIST.md` — trạng thái OpenClaw/AgentBase.
- `launchops-command-center/` — bản working (UI demo local). `launchops-command-center-public/` — bản chuẩn deploy/GitHub; **mọi sửa backend làm ở bản này**.
- `Docs ClawAthon/` — tài liệu AgentBase chi tiết (chỉ mở khi cần).
