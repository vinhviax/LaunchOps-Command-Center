# Risk rubric - cách chấm readiness

Agent chấm điểm theo 6 nhóm rủi ro. Mỗi nhóm có 0-2 điểm.

## 1. Mục tiêu và scope

- 0 điểm: mục tiêu mơ hồ, đối tượng không rõ.
- 1 điểm: có mục tiêu nhưng thiếu chỉ số hoặc điều kiện thành công.
- 2 điểm: mục tiêu, đối tượng, KPI và scope rõ.

## 2. Owner va deadline

- 0 điểm: không có owner.
- 1 điểm: có owner chung chung, deadline chưa rõ.
- 2 điểm: có owner cho product, tech, CS, marketing, decision.

## 3. Tech readiness

- 0 điểm: chưa có test, chưa có rollback.
- 1 điểm: có test cơ bản nhưng thiếu ngưỡng dừng.
- 2 điểm: có test tải, monitoring, rollback, ngưỡng pause/stop.

## 4. User impact

- 0 điểm: chưa đánh giá ảnh hưởng người dùng.
- 1 điểm: có nhắc đến user nhưng thiếu FAQ/communication.
- 2 điểm: có FAQ, thông điệp rõ, xử lý khiếu nại.

## 5. Business va reward

- 0 điểm: reward/chi phí/tỷ lệ chưa chốt.
- 1 điểm: có reward nhưng thiếu guardrail ngân sách.
- 2 điểm: reward, ngân sách, tỷ lệ, guardrail đã review.

## 6. Learning va post-mortem

- 0 điểm: không có kế hoạch học lại.
- 1 điểm: có báo cáo sau launch nhưng thiếu câu hỏi.
- 2 điểm: có post-mortem, metrics, lesson owner.

## Kết quả

- Green: 10-12 điểm. Có thể launch nếu không có blocker nghiêm trọng.
- Yellow: 6-9 điểm. Chưa nên launch ngay, cần sửa các mục thiếu trước.
- Red: 0-5 điểm. Dừng launch, cần làm lại brief hoặc giảm scope.

## Output tối thiểu

Mỗi lần chấm, agent phải trả:

- Màu: Green / Yellow / Red.
- Điểm tổng.
- 3 rủi ro lớn nhất.
- 5 việc cần làm tiếp theo.
- Điều kiện để được launch.
