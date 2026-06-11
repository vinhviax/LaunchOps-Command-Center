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
