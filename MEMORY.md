# Trạng thái dự án — LaunchOps Command Center

> File này là **bản tóm tắt sạch, viết mới ngày 12/06/2026**. Lịch sử làm việc chi tiết trước đó KHÔNG nằm trong repo (lưu ở workspace ngoài, thư mục `Backup/`). Ai (người hoặc AI agent) vào repo này chỉ cần đọc file này + `README.md` + `CODEX_BRIEF.md` là đủ ngữ cảnh.

## Bản đang chạy production

| Thành phần | Giá trị |
|---|---|
| Docker image | `vcr.vngcloud.vn/111480-abp111734/launchops-command-center:v14` |
| Runtime | `runtime-8fe6be1b-efff-4be6-8f1c-1779daabdbbf`, version **16**, ACTIVE |
| Endpoint (web + API + MCP) | `https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/` |
| MCP Gateway (IAM) | gateway name `launchops-server`, target `launchops_server_mcp` |
| Cache version UI | `?v=fix-20260612a` |

## Model per agent (env trên runtime, đổi bằng PATCH — không rebuild)

- Readiness: `deepseek/deepseek-v4-pro`
- Red Team: `minimax/minimax-m2.5`
- Checklist + default: `qwen/qwen3.7-plus`
- Post-mortem: `google/gemma-4-31b-it`
- Assistant: `deepseek/deepseek-v4-flash`

Tất cả gọi OpenAI-compatible `/v1/chat/completions` trên VNG MaaS (`LAUNCHOPS_AGENTBASE_BASE_URL`).

## Những gì ĐÃ XONG (verify thật, đừng làm lại)

1. **Web UI serve từ chính runtime** (bỏ host ngoài/Cloudflare), API same-origin `/api`.
2. **MCP server chuẩn** tại `/mcp`: handshake đầy đủ, GET/DELETE trả 405 đúng spec. Python SDK, MCP Inspector, mcp-remote, OpenClaw đều connect OK.
3. **OpenClaw gọi tool thật** qua bridge `npx mcp-remote` (Route A xong — chi tiết `OPENCLAW_BUILD_CHECKLIST.md`).
4. **`/mcp tools/call` fast path** deterministic <1s (tránh gateway timeout 15s); `/api/analyze` full LLM ~90–120s.
5. **`extract_json` đã gia cố** chống output reasoning model (think block, control char, text thừa) — đừng thay bằng `json.loads` trần.
6. **UI fixes 12/06:** timeout client analyze 240s; draft Friendly không còn cướp selection ở Pro; tab **Log** per-launch chỉ Admin (`?role=admin`).

## Việc còn mở

- Video demo 2–3 phút + nộp form BTC (deadline **17/06/2026**) — việc thủ công của Human.
- Các task nhỏ giao cho AI agent/contributor: xem backlog trong `CODEX_BRIEF.md`.

## Quy tắc bất di bất dịch khi sửa code

Đọc phần "Luật cứng" trong `CODEX_BRIEF.md` trước khi sửa bất kỳ file nào. Tóm tắt: giữ DOM contract Pro↔Friendly, bump `?v=` khi đổi JS/CSS, không đụng handshake `/mcp` + 2 route 405, file tiếng Việt luôn UTF-8 không BOM, không commit secret.
