# OpenClaw / AgentBase Build Checklist - LaunchOps Command Center

Cập nhật: 2026-06-11. Mục tiêu đã đạt: Custom Agent chạy thật trên AgentBase; OpenClaw là backup chatbot.

## 1. Trạng thái AgentBase (chính)

- [x] Custom Agent runtime **ACTIVE**, public endpoint:
  `https://endpoint-b5a0d6b4-3849-4f0b-b4de-56768b9f1f01.agentbase-runtime.aiplatform.vngcloud.vn`
- [x] Docker image push: `vcr.vngcloud.vn/111480-abp111734/launchops-command-center:v1`
- [x] MCP Gateway `launchops-server` + policy group ALLOW:
  `https://gw-launchops-server-111734.agentbase-gateway.aiplatform.vngcloud.vn`
  - Lưu ý: curl trực tiếp gateway bị 403/404 chưa kết luận hỏng — cần MCP client thật.
- [x] Multi-model routing 5 model MaaS live OK (readiness/redteam/checklist/postmortem/assistant).
- [ ] **Rebuild image bản đã sửa encoding 11/06** (image `v1` còn text tiếng Việt lỗi trong fallback/MCP tool):
  1. Commit/push repo public sau secret scan.
  2. Trên máy có Docker (vd `D:\Clawathon` PC kia): pull GitHub → `docker build` → tag `v2` → push registry.
  3. Update runtime sang image mới → verify `GET /health` 200 + `POST /analyze` đủ 5 phần + MCP tool text sạch.

## 2. Trạng thái OpenClaw (backup)

- [x] OpenClaw 1-Click instance `vinhvnn-viax` ACTIVE.
- [x] Kênh Zalo/Telegram cấu hình trên UI OpenClaw (token Human tự nhập trên portal, không paste vào chat/repo).
- [x] Prompt bridge: bot đóng vai LaunchOps Command Center khi được hỏi.
- [x] Đã xác nhận OpenClaw UI không có chỗ gắn external MCP Gateway.
- [ ] Test bot: paste `data/bad_launch_brief.md` → output đủ 5 phần (Mission Control Summary / Readiness / Red Team 5 persona / Checklist / Post-mortem), bad → Yellow/Red.
- [ ] Lưu output tốt nhất làm dự phòng video/README.

Prompt/rubric khi cần tinh chỉnh bot: `prompts/openclaw_backup_prompt.md`, `data/risk_rubric.md`, `data/agent_roles.md`. Test case: `data/bad_launch_brief.md` (chính), `data/good_launch_brief.md` (đối chiếu — score phải tốt hơn bad).

## 3. Quy tắc an toàn

- Không ghi API key / IAM secret / bot token vào repo, README, prompt, screenshot, video.
- Không chạy hết 9 bước AgentBase skills khi use case chưa sẵn — tránh deploy agent rỗng.
- Verify lệnh/flag trong `.agents/skills/agentbase-*/SKILL.md` trước khi chạy; dùng dry-run nếu có.
- Helper scripts trong skills là shell script — trên Windows chạy qua Git Bash/WSL.

## 4. 2026-06-11 update - OpenClaw MCP route A / webhook route B

- [x] Route A tried to completion: enabled Gateway exec security `Full`, ask fallback `Full`, auto-allow skill CLIs, retried `Install mcporter (npm)`.
- [x] Route A blocked: OpenClaw still reports `Missing: bin:mcporter`; agent exec also returns `allowlist miss` even after full mode.
- [x] Route B implemented in Custom Agent backend: `POST /webhooks/telegram`, `POST /api/webhooks/telegram`, `POST /webhooks/zalo`, `POST /api/webhooks/zalo`, `POST /api/chatbot`.
- [x] Telegram webhook can optionally send back through `TELEGRAM_BOT_TOKEN`; without token it returns `reply` JSON for relay/testing.
- [x] Webhook auth optional via `LAUNCHOPS_WEBHOOK_TOKEN` query param, `X-LaunchOps-Webhook-Token`, or `Authorization: Bearer`.
- [x] Local test passed: `POST /webhooks/telegram` returns LaunchOps summary, top risks, and next tasks.

## 2026-06-11 - AgentBase feature correction

- Do not claim AgentBase has separate `Knowledge Base` or separate `Tool` feature for this project.
- Confirmed usable AgentBase features for scoring: Agent Runtime, OpenClaw, MCP Gateway/Governance, Memory, RAG Engine or vDB/RAG path if enabled in portal, Guardrail, Rate Limit, Notebook Instance, Container Registry, Usage/Budget/Monitoring.
- `tools` in LaunchOps means app/MCP protocol route (`/tools`, `/tools/call`), not a standalone AgentBase Tool product.
- Strategy update: maximize real AgentBase features only. Keep local SQLite RAG as fallback; if portal exposes RAG Engine/vDB, map LaunchOps lessons/snapshots into that instead of calling it Knowledge Base.

## 2026-06-11 - Webhook route B enhanced

- [x] Telegram webhook supports commands: `help`, `status`, `list`, `config`, `analyze <brief>`.
- [x] `status` shows launch counts from local LaunchOps workspace.
- [x] `list` shows recent saved launches.
- [x] `config` shows webhook auth / Telegram send / fast mode status.
- [x] Local test passed for all commands on `POST /webhooks/telegram`.

## 2026-06-11 - Route B deploy attempt

- [x] GitHub main updated with webhook fallback: commit `3459590`.
- [x] Docker image `launchops-command-center:v2` built locally.
- [x] Local container test passed for `GET /health` and `POST /webhooks/telegram`.
- [x] Push `v2` to VCR completed successfully using existing CR credentials (unauthorized was transient or resolved).
- [x] Runtime update to `v2` completed, default endpoint point to version 2.
- [x] Verified VCR registry now has tags `v1` and `v2`.

## 2026-06-11 - Session handoff for next run

- [x] Route B chatbot code exists, built, deployed, and verified.
- [x] GitHub main updated with latest webhook fallback state & Caveman customizer.
- [x] Local image `launchops-command-center:v3` built, pushed, and deployed.
- [x] AgentBase registry repository contains `v1`, `v2` v? `v3` tags.
- [x] Runtime updated to `v3` and fully active with dynamic Caveman style assistant toggling.
