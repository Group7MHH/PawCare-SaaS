# PawCare SaaS Owner · thay đổi so với bản PostgreSQL trước

- Thêm `owner` cấp nền tảng; Admin/Staff là vai trò gán **từng cửa hàng**, không phải quyền toàn ứng dụng.
- Migration 003 thêm `organizations`, `organization_members`, `organization_staff_profiles`, `invitations`, `role_audit_logs`, khóa ngoại hạn chế dữ liệu sai tenant và lựa chọn cửa hàng trong session.
- Backfill dữ liệu PostgreSQL trước vào `pawcare-legacy` (không tự nâng Admin cũ thành Owner).
- API dịch vụ, nhân viên, lịch hẹn, báo cáo và hồ sơ khách của Admin được lọc theo cửa hàng; đặt lịch kiểm tra cùng shop cho dịch vụ/nhân viên.
- Route `/owner`: tạo cửa hàng, cấp Staff/Admin, thay quyền và mời bằng link; `/admin/team`: Admin mời/quản lý Staff.
- Thêm luồng nhận lời mời với token hash + thời hạn 7 ngày + email ràng buộc.
- Thêm ví dụ **Trần Mạnh Hùng** trong development seed, form và mô tả giao diện.
- Không tự tạo tài khoản demo trên production; tạo Owner đầu tiên bằng CLI/bootstrap tạm thời.
- Có 7 static checks (2 PostgreSQL integration checks chỉ khi có `TEST_DATABASE_URL`).

## Các hạn chế chưa hoàn thành

1. Chưa xác minh `npm run build`, chưa chạy test API/e2e và migrations trên một PostgreSQL thực trong môi trường biên soạn.
2. Chưa gửi email tự động: Admin/Owner phải copy link mời.
3. Chưa có billing/subscription, onboarding tự động qua thanh toán, xác thực email, password recovery, MFA/RLS, đánh giá bảo mật độc lập hay backup/monitoring production.
4. Admin vẫn có luồng tạo **Staff mới với mật khẩu tạm** trong trang Catalog để tương thích; nên dùng **Thành viên cửa hàng → link mời** để Staff tự đặt mật khẩu.

Không sử dụng dữ liệu thật quan trọng trước khi kiểm thử và hardening.
