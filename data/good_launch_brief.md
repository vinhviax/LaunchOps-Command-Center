# Good launch brief mẫu

## Ten launch

Lucky Wheel Weekend - sự kiện quay thưởng cuối tuần.

## Mục tiêu

- Tăng daily active users trong 3 ngày cuối tuần.
- Tăng doanh thu gói nạp nhỏ.
- Giữ trải nghiệm công bằng, không tạo cảm giác pay-to-win quá mức.

## Thời gian

- Start: 12/06/2026 20:00
- End: 15/06/2026 23:59
- Freeze content: 11/06/2026 18:00

## Owner

- Product owner: PM LiveOps
- Tech owner: Backend on-call
- CS owner: CS lead ca tối
- Marketing owner: Fanpage operator
- Decision owner: LiveOps lead

## Scope

- Người chơi level 10 trở lên.
- Mỗi ngày nhận 1 lượt quay miễn phí.
- Nạp gói bất kỳ nhận thêm 3 lượt quay, tối đa 9 lượt/ngày.

## Guardrail

- Tỷ lệ item hiếm đã được review.
- Tổng giá trị phần thưởng có ngân sách tối đa.
- Thông điệp truyền thông không cam kết người chơi chắc chắn nhận item hiếm.

## Test va rollback

- Test tải với mức peak dự kiến x2.
- Nếu lỗi quay thưởng ảnh hưởng hơn 2% request trong 10 phút, tạm tắt nút quay.
- Nếu phần thưởng sai, dừng sự kiện và chạy script đối soát.

## CS FAQ

- Cách nhận lượt quay.
- Giờ reset lượt quay.
- Điều kiện nạp để nhận thêm lượt.
- Cách xử lý nếu không nhận phần thưởng.

## Sau launch

- Báo cáo DAU, revenue, ticket CS, lỗi kỹ thuật, sentiment fanpage.
- Post-mortem trong vòng 48 giờ sau khi kết thúc.
