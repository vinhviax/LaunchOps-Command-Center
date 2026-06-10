# LaunchOps Command Center

LaunchOps Command Center là Super Agent giúp nhìn rủi ro trước khi launch: đọc brief, chấm readiness, phản biện Red Team, tạo checklist, rồi chốt bài học sau launch.

## Flow demo

1. Dán một launch brief xấu.
2. Xem điểm Green / Yellow / Red.
3. Xem Red Team cards.
4. Xem checklist có owner, deadline, status.
5. Xem post-mortem draft và bài học.

## Chạy local

```powershell
python -m http.server 8787 --bind 127.0.0.1
```

Mở:

```text
http://127.0.0.1:8787/index.html
```

Nếu cần backend local:

```powershell
python server\app.py
```

## Dữ liệu mẫu

- `data/bad_launch_brief.md`
- `data/good_launch_brief.md`
- `data/risk_rubric.md`
- `data/agent_roles.md`
- `data/launch_checklist.md`
- `data/postmortem_questions.md`
- `prompts/openclaw_backup_prompt.md`

## Link nộp bài

- AgentBase link: `[điền sau khi deploy]`
- GitHub repo public: `[điền sau khi tạo]`
- Video demo 2-3 phút: `[điền sau khi quay]`
- Thành viên + BU: `VinhVNN - GS9` (kiểm tra lại format theo BTC)

## Ghi chú

- Repo này là bản public sạch.
- Không chứa `.env`, `.wrangler`, memory runtime, log, hay secret.
- `config.js` để rỗng để frontend tự fallback khi backend chưa bật.
