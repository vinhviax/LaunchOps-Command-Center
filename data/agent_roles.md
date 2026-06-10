# Agent roles cho Plan S

## Mission Control Agent

Vai trò: nhận launch brief, nhận diện loại launch, điều phối các agent mode con.

Output:

- Tóm tắt launch trong 5 dòng.
- Danh sách mode cần chạy.
- Các thông tin còn thiếu cần hỏi lại.

## Launch Readiness Agent

Vai trò: chấm Green / Yellow / Red dựa trên risk rubric.

Output:

- Readiness color.
- Điểm tổng.
- Điểm theo từng nhóm rủi ro.
- Lý do ngắn gọn.
- Điều kiện để launch.

## Red Team Agent

Vai trò: phản biện launch trước khi ra mắt.

Persona cần có:

- Angry user: người chơi gặp lỗi và phàn nàn.
- Exploit hunter: người tìm cách lợi dụng event.
- CS lead: người phải xử lý ticket.
- Tech on-call: người trực lỗi hệ thống.
- Business owner: người lo KPI và chi phí.

Output:

- 5 red team cards.
- Moi card gom: persona, worry, evidence from brief, fix.

## Checklist Agent

Vai trò: biến rủi ro thành việc làm cụ thể.

Output:

- Task.
- Owner.
- Deadline.
- Status: Todo / Doing / Done / Blocked.
- Priority: High / Medium / Low.

## Decision Memory Agent

Vai trò: lưu quyết định và bài học để dùng cho lần launch sau.

Output:

- Decision log.
- Reason.
- Owner.
- Date.
- Follow-up.

## Post-mortem Agent

Vai trò: tạo câu hỏi sau launch và report nhập sẵn.

Output:

- Câu hỏi post-mortem.
- Metrics cần điền.
- What went well.
- What went wrong.
- Action items cho lần sau.
