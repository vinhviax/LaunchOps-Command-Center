# OpenClaw / MCP Integration — Trạng thái cuối (Route A HOÀN THÀNH)

> Cập nhật: 12/06/2026. Toàn chuỗi OpenClaw → MCP → LaunchOps đã chạy production, verify bằng tool call thật.

## Luồng đang chạy

```
OpenClaw 2026.3.23 (container AgentBase, chỉ hỗ trợ stdio MCP)
   │  stdio
   ▼
npx -y mcp-remote  ←— bridge stdio ↔ streamable-http
   │  HTTPS
   ▼
https://endpoint-b5a0d6b4-...vngcloud.vn/mcp   (server: launchops-server 1.0.0)
   │
   ▼
tool: analyze_launch_brief  (fast path deterministic <1s)
```

Đường thay thế qua MCP Gateway (IAM): `https://gw-launchops-server-111734.agentbase-gateway.aiplatform.vngcloud.vn` — gateway name thật là `launchops-server`, target `launchops_server_mcp`. Gateway timeout 15s nên tools/call PHẢI giữ fast path.

## Config OpenClaw (đang dùng)

```bash
openclaw mcp set launchops_gateway '{"command":"npx","args":["-y","mcp-remote","https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn/mcp"]}'
# xong gõ /restart trong OpenClaw
```

- KHÔNG khai `url`/`transport` trực tiếp — OpenClaw bản này skip mọi server không phải stdio (log: `skipped server ... because only stdio MCP servers are supported`).
- Container OpenClaw có node v24 + npx, npm registry thông.

## 3 bug đã sửa để thông được (đừng làm vỡ lại)

1. **Server thiếu MCP handshake** — `/mcp` phải xử lý `initialize` → `notifications/initialized` (ack 202) → `tools/list` → `tools/call`, thêm `ping`. MCP client thật bắt buộc bắt tay trước; raw curl không lộ lỗi này.
2. **OpenClaw chỉ-stdio** — mọi external HTTP MCP phải qua bridge `mcp-remote` (đã thử `mcporter` — fail).
3. **GET /mcp trả 404 → phải 405.** SDK client (trong mcp-remote) mở GET SSE stream sau `initialized`; theo spec streamable-http, server không hỗ trợ SSE phải trả **405** (client bỏ qua êm), còn 404 bị coi là lỗi remote → client hủy kết nối → 0 tool. `DELETE /mcp` cũng trả 405. **KHÔNG đổi 2 route này.**

## Lệnh debug OpenClaw (bản 2026.3.23)

- Lệnh có thật: `openclaw --help`, `openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw mcp list/set/show/unset` (KHÔNG có `mcp status/doctor/probe`).
- Log runtime: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (KHÔNG phải `/root/.openclaw/logs/`).
- Config: `/root/.openclaw/openclaw.json`.
- Bot có exec (security full) → nhờ bot chạy lệnh shell và dán output để debug.
- Test bridge độc lập: `npx -y mcp-remote <url>` rồi xem stderr — sạch là server OK.

## Verify đã chạy (12/06/2026)

- [x] Python SDK + MCP Inspector connect / list / call OK.
- [x] mcp-remote local: initialize → tools/list → tools/call, stderr sạch không error.
- [x] OpenClaw bot thấy tool `analyze_launch_brief`, gọi thật với brief xấu → trả RED 0/18 + Red Team 5 persona.
- [x] Gateway path với IAM token: tools/call 200 trong 0.23s.
