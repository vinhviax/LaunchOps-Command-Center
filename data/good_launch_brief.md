# Good launch brief mẫu

## Tên launch

Golden Spin Weekend v2 Ready - sự kiện Lucky Spin cuối tuần đã áp dụng bài học tháng 5.

## Mục tiêu

- Tăng login cuối tuần 7%.
- Tăng doanh thu gói nhỏ 8-10%.
- Giữ reward cost dưới 150 triệu và không làm lệch economy.

## Thời gian

- Start: 19/06/2026 20:00
- End: 21/06/2026 23:59
- War room mở từ 19/06/2026 19:30

## Owner

- Product owner: PM LiveOps
- Tech owner: Tech on-call
- CS owner: CS Lead ca tối
- Business owner: Game Economy Owner
- Decision owner: LiveOps Lead

## Scope

- Người chơi level 10 trở lên.
- Tài khoản tạo trước 01/06/2026, không thuộc nhóm abuse/refund.
- Mỗi ngày đăng nhập nhận 1 lượt quay miễn phí, reset lúc 05:00.
- Nạp gói 49k/99k nhận thêm tối đa 3 lượt/ngày.
- Mỗi account tối đa 9 lượt quay cuối tuần.

## Guardrail

- Reward cap cuối tuần 150 triệu.
- Item hiếm giới hạn 600 phần.
- Tắt item hiếm khi đạt 95% cap.
- Thiết bị/IP bất thường vào hàng chờ review.

## Test và rollback

- Dashboard realtime theo dõi spin success, reward delivery, ticket CS, abuse flag.
- Nếu reward delivery lỗi trên 1% trong 10 phút hoặc ticket CS gấp 2 baseline, Tech on-call được quyền pause event.
- Kill switch và rollback script đã test staging.

## CS FAQ

- Case mất lượt quay.
- Case hết quà.
- Case phát quà chậm.
- Giờ reset lượt quay.
- Điều kiện nhận lượt nạp thêm.

## Sau launch

- Báo cáo login, revenue, reward cost, ticket CS, abuse flag.
- Post-mortem T+48h và cập nhật lesson cho Golden Spin tháng 7.
