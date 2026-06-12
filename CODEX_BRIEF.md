# CODEX BRIEF — LaunchOps Command Center

> Brief cho AI coding agent (Codex) hoặc contributor mới. Viết 12/06/2026. Đọc file này + `README.md` + `MEMORY.md` trước khi sửa bất kỳ dòng nào. Phạm vi giao cho Codex: **các task trong Backlog bên dưới** — KHÔNG tự mở rộng phạm vi, KHÔNG refactor lớn, KHÔNG deploy.

## 1. Dự án trong 5 dòng

- Super Agent kiểm soát rủi ro launch: brief → readiness Green/Yellow/Red → Red Team 5 persona → checklist → post-mortem.
- 1 Docker image duy nhất: `server/app.py` (Python stdlib, không framework) serve Web UI + REST API + MCP server.
- UI vanilla JS (không build step, không npm): `app.js` (Pro) + `friendly-ui.js` (Friendly layer) + `i18n-clean.js` (VI/EN).
- LLM gọi OpenAI-compatible `/v1/chat/completions`, model per agent qua env `LAUNCHOPS_MODEL_*`.
- Đang chạy production trên VNG AgentBase (image v14 / runtime version 16) — chủ repo tự deploy, Codex không cần và không được deploy.

## 2. LUẬT CỨNG (vi phạm = reject toàn bộ PR)

1. **DOM contract Pro↔Friendly:** `friendly-ui.js` đọc DOM do `app.js` render. KHÔNG đổi tên/cấu trúc các ID + class sau: `data-view`, `data-mode`, `data-lang`, `data-friendly-*`, body class `ui-mode-pro/friendly`, `#launchGroups`, `.launch-card`, `.risk-tile`, `.red-card` (h3+p), `.timeline-card` (h4/chips), `#topRisks li`, `.draft-block`, `#analysisRunStatus`, `#ragInsightsCard/Body`, `#traceConsoleCard/Body`, các field form `#launchName #launchType #launchStatus #launchOwner #launchTargetDate #launchEndDate #briefInput`. localStorage keys: `launchops_ui_mode`, `launchops_lang`.
2. **Đổi bất kỳ JS/CSS nào → bump query `?v=` trong `index.html`** (cả 6 chỗ: 2 css + 4 js, dùng chung 1 version mới, format `fix-YYYYMMDDx`). Quên bump = browser chạy bản cũ.
3. **`friendly-ui.js` có 2 IIFE RIÊNG BIỆT:** IIFE 1 (đầu file, ~90 dòng) là mode switcher; IIFE 2 là toàn bộ hệ Friendly. KHÔNG gọi hàm chéo giữa 2 IIFE — sẽ ReferenceError lúc boot, chết nút Pro/Friendly mà không có lỗi console rõ ràng. Cần phản ứng theo mode-change thì dùng MutationObserver trên class của `document.body` (đã có mẫu `modeClassObserver`).
4. **Không đụng server MCP:** handshake trong `do_POST` nhánh `/mcp` (`initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call` fast-path) và 2 route `GET /mcp`, `DELETE /mcp` **phải giữ trả 405**.
5. **Không thay `extract_json()` bằng `json.loads` trần** — hàm đã gia cố chống output reasoning model (think block, control char, text thừa).
6. **Encoding:** mọi file có tiếng Việt ghi **UTF-8 KHÔNG BOM**, line ending LF. Không để mojibake (dấu `?` hay ký tự lạ thay chữ có dấu).
7. **Không thêm dependency:** server chỉ Python stdlib; UI chỉ vanilla JS. Không npm, không pip package mới, không build step.
8. **Không commit secret:** `.env`, token, key, log. Không hardcode API key vào code.
9. **Timeout đã căn chỉnh, không đổi:** client analyze 240s (`ANALYZE_CLIENT_TIMEOUT_MS`), LLM per-call 60s (`LAUNCHOPS_LLM_TIMEOUT_SECONDS`), MCP fast path <1s.

## 3. Chạy + verify local (bắt buộc trước khi nộp)

```bash
# backend rule mode (không cần LLM/key)
LAUNCHOPS_LLM_ENABLED=false PORT=8788 python server/app.py
# mở http://127.0.0.1:8788/
```

Checklist verify tối thiểu cho MỌI thay đổi:
1. `python -m py_compile server/app.py` (nếu sửa server) — pass.
2. `node --check app.js friendly-ui.js i18n-clean.js` (nếu sửa JS) — pass.
3. Mở UI: không lỗi console; chuyển Pro↔Friendly hoạt động; chọn launch → Chạy phân tích (rule mode ~1s) → kết quả render, highlight sidebar đứng yên.
4. Nếu sửa UI: test cả `?role=admin` (tab Log hiện, render đủ 2 section) và URL thường (tab Log ẩn).
5. Nếu sửa server: `curl -X POST localhost:8788/mcp` với initialize → vẫn 200; `curl localhost:8788/mcp` (GET) → vẫn 405.

## 4. Bản đồ code (điểm neo theo tên hàm, đừng tin số dòng)

**`server/app.py`** (~2100 dòng, 1 file duy nhất):
- `LaunchOpsHandler.do_GET/do_POST/do_DELETE` — router thủ công theo path.
- `orchestrate_launchops_analysis()` — pipeline 5 agent; `force_fast=True` cho MCP.
- `call_*_agent` qua `chat_completions_url()` + `extract_json()` + fallback rule từng agent.
- `save_launch_payload() / get_launch() / append_analysis()` — lưu launch ra file JSON (per-launch), trace phân tích nằm trong `launch["analyses"][].result.trace`.
- `json_response()` — helper response chuẩn (CORS sẵn).

**`app.js`** (Pro UI):
- `analyze()` — flow chạy phân tích + ghi `logRunEvent()`.
- `saveCurrentLaunch() / selectLaunch() / startNewLaunch() / loadLaunches()` — vòng đời launch.
- `renderRunLog() / runLogPlainText() / logRunEvent()` — tab Log (Admin).
- `activeLaunchRole() / isLaunchAdmin() / adminSessionEnabled()` — quyền; admin bật qua URL `?role=admin` (sessionStorage `launchops_admin`), tắt `?role=human`.
- `applyLaunchPermissions()` — bật/tắt control + ẩn/hiện tab Log theo role.
- `activateTab()` — chuyển view theo `data-view`.

**`friendly-ui.js`**: IIFE 1 = `applyMode()/init()`; IIFE 2 = draft system (`createFriendlyNewDraft`, `renderFriendlyDraftCards`, `syncFriendlyActiveDraftCard` — đều guard `ui-mode-friendly`), chat NPC, visualize đọc DOM Pro.

**`i18n-clean.js`**: chuyển ngữ VI/EN — đọc cơ chế trong file trước khi thêm chuỗi mới, làm đúng pattern sẵn có.

## 5. BACKLOG — task giao cho Codex (làm theo thứ tự, mỗi task 1 commit)

### T1. Unit test cho các hàm thuần của server (KHÔNG sửa code chính)
- Tạo `server/test_app.py` chạy bằng `python -m unittest` (stdlib, không pytest).
- Cover: `extract_json` (≥6 case: JSON sạch, ```json fence, think block chứa `{`, control char trong string, text dẫn + text thừa, JSON lồng sâu); `chat_completions_url` (3 dạng base url); `decode_request_body` (utf-8, utf-8-sig, utf-16-le); `normalize_status`; `slugify`-tương-đương nếu có ở server.
- Chấp nhận: `python -m unittest server.test_app -v` pass toàn bộ; không import lỗi khi thiếu `.env`.

### T2. i18n cho các chuỗi UI mới (tab Log + thông báo analyze)
- Các chuỗi mới chưa có EN: nhãn tab `Log`, tiêu đề "Log chạy phân tích (Admin)", 2 heading "Sự kiện phiên này (client)" / "Các lần phân tích đã lưu (server trace)", nút "Copy log"/"Đã copy"/"Copy lỗi", empty states của tab Log, message "Phân tích quá thời gian chờ...", "Chưa có brief để phân tích...".
- Làm đúng cơ chế sẵn có trong `i18n-clean.js` (đọc pattern trước). Không phá chuỗi VI.
- Chấp nhận: chuyển EN → các chuỗi trên đổi tiếng Anh; chuyển lại VI → nguyên vẹn; không lỗi console. Nhớ bump `?v=`.

### T3. Tab Log: filter mức độ + nút xóa log phiên
- Thêm vào section `#runLog` (trong `index.html`): select filter `Tất cả / Lỗi / Cảnh báo` + nút "Xóa log phiên" (chỉ xóa `runLogEvents` của launch đang chọn, không đụng server trace).
- Sửa `renderRunLog()` lọc theo filter. Style theo token sẵn trong `styles.css` (mục 29. RUN LOG).
- Chấp nhận: filter hoạt động với cả 3 mức; xóa log chỉ mất phần client, server trace còn nguyên; non-admin vẫn không thấy tab. Bump `?v=`.

### T4. `GET /api/version` + footer tab Log
- Server: thêm route `GET /api/version` trả `{ok, name: "launchops-server", uiCacheVersion, models: {readiness, redteam, checklist, postmortem, assistant}}` — đọc model từ env, uiCacheVersion đọc từ hằng số mới `UI_CACHE_VERSION` đặt cạnh đầu file (nhớ cập nhật khi bump `?v=`). KHÔNG trả api key/base url.
- UI: cuối `renderRunLog()` (chỉ admin) fetch và hiện 1 dòng nhỏ: version + model đang chạy.
- Chấp nhận: `curl localhost:8788/api/version` trả đúng; tab Log hiện dòng version; các route cũ không đổi hành vi.

### T5. Accessibility nhỏ
- `#analysisRunStatus` thêm `aria-live="polite"` (markup `index.html`).
- Nav tabs: thêm `role="tablist"` / `role="tab"` / `aria-selected` đồng bộ trong `activateTab()`.
- Chấp nhận: không đổi hành vi hiển thị; không lỗi console; DOM contract mục 2.1 nguyên vẹn. Bump `?v=`.

### T6. "Tải báo cáo" kèm run log khi là Admin
- Tìm hàm build report markdown trong `app.js` (template bắt đầu `# LaunchOps Report -`); nếu `isLaunchAdmin()` thì append section `## Run log` = `runLogPlainText()`.
- Chấp nhận: admin tải báo cáo có run log; URL thường tải báo cáo y như cũ. Bump `?v=`.

## 6. Định nghĩa hoàn thành (mỗi task)

- Chạy đủ checklist verify mục 3.
- Diff gọn, đúng phạm vi task, không kéo theo format lại file.
- Commit message: `feat(scope): ...` / `fix(scope): ...` / `test(scope): ...` — tiếng Anh, 1 dòng tóm tắt + bullet chi tiết.
- KHÔNG build/push Docker, KHÔNG gọi API AgentBase/VNG, KHÔNG sửa các file: `Dockerfile`, `.env.example` (trừ khi task yêu cầu), `config.js`.
