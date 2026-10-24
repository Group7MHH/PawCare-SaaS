> Phiên bản triển khai sử dụng PostgreSQL dùng chung.

# Chia việc 4 thành viên & cách phối hợp Git

| Thành viên | Files/chức năng chính | Kiểm tra |
|---|---|---|
| 1 — Giao diện và thú cưng | `apps/web/src/components/{Layout,UI}.tsx`, `pages/{Overview,Pets}.tsx`, `styles.css`, `apps/api/src/routes/pets.ts` | CRUD thú cưng, bảo vệ chủ sở hữu, responsive |
| 2 — Backend và lịch hẹn | `infra/001_schema.sql`, `apps/api/src/{lib/db,lib/scheduling}.ts`, `routes/appointments.ts`, `apps/web/src/pages/{Booking,MyAppointments}.tsx` | Trùng lịch nhân viên, giờ làm việc, UTC |
| 3 — Tài khoản và khách hàng | `apps/api/src/{lib/auth,routes/auth,routes/management}.ts`, `apps/web/src/{lib/auth,pages/AuthPage,pages/Profile,pages/Customers}.tsx` | Email trùng, password hash, session, RBAC |
| 4 — Dịch vụ, nhân viên, thống kê | `apps/api/src/routes/catalog.ts`, `apps/web/src/pages/{Catalog,AdminAppointments,AdminDashboard}.tsx`, `docs/*` | CRUD, dashboard có dữ liệu thật, báo cáo |

Workflow: tạo các branch `feature/member-1-ui-pets`, `feature/member-2-booking-db`, `feature/member-3-auth-customers`, `feature/member-4-admin-services`; pull request → review → test → merge vào `main`. Không hardcode password thật. Mỗi người chỉ cập nhật DB schema qua PR, thống nhất API contract trước khi code.

## Kịch bản kiểm thử thủ công

1. Đăng ký email hợp lệ thành công, đăng ký lại email cũ trả HTTP 409.
2. Đăng nhập sai mật khẩu báo lỗi; đăng xuất cookie hết hiệu lực và vào route cũ tự chuyển `/login` khi tải lại.
3. Khách A không thể xem/sửa pet của khách B (403); có thể thêm/sửa/xóa pet của chính mình chưa có lịch.
4. Thêm hồ sơ chăm sóc rồi xóa; trường thông tin hiện lại khi tải trang.
5. Đặt lịch ngày Chủ nhật / ngoài 8:00–18:00 / trước 30 phút bị 422.
6. Hai yêu cầu đồng thời cùng nhân viên với thời gian giao nhau: một yêu cầu trả 409.
7. Khách được hủy lịch pending/confirmed, không thể tự đánh dấu completed.
8. Admin gán nhân viên và cập nhật trạng thái; staff chỉ nhìn thấy lịch được giao.
9. Tắt dịch vụ thì không hiển thị ở form đặt lịch nhưng lịch cũ vẫn còn.
10. Dashboard doanh thu chỉ tính `completed`, không tính pending/confirmed/cancelled.
11. Resize desktop/tablet/mobile: sidebar collapse, bảng cuộn ngang, modal có thể cuộn.
