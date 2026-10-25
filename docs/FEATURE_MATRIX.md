> **Lưu ý:** Sơ đồ/phần chức năng dưới đây là bản nguyên gốc từ ứng dụng một cửa hàng. Với phiên bản SaaS Owner, xem `infra/003_owner_multitenant.sql`, `README.md` và `docs/DEPLOY_RENDER_NEON_FREE.md` để có cấu trúc chính xác hiện hành.

# Đối chiếu Figma – Chức năng – API – PostgreSQL

| Màn hình thiết kế | Route React | Luồng chức năng | API | Bảng dữ liệu | Phụ trách |
|---|---|---|---|---|---|
| Người dùng / Tổng quan | `/overview` | Thống kê, thú cưng, lịch gần đây | `GET /dashboard`, `/pets` | pets, appointments | TV1 |
| Người dùng / Hồ sơ thú cưng | `/pets`, `/pets/:id` | CRUD thú cưng, nhật ký chăm sóc | `/pets`, `/pets/:id/records` | pets, care_records | TV1 |
| Người dùng / Đặt lịch | `/book` | Chọn bé/dịch vụ/giờ/nhân viên, đặt lịch | `POST /appointments`, `GET /services`, `GET /staff` | appointments, services, users | TV2 |
| Người dùng / Lịch hẹn của tôi | `/my-appointments` | Danh sách, trạng thái, hủy | `GET/DELETE /appointments` | appointments | TV2 |
| Admin / Dashboard | `/admin/dashboard` | Khách, pet, lịch, doanh thu, đồ thị | `GET /dashboard` | users, pets, appointments | TV3 + TV4 |
| Admin / Quản lý lịch hẹn | `/admin/appointments` | Lọc, phân công, chuyển trạng thái | `GET/PATCH /appointments` | appointments | TV4 |
| Admin / Khách hàng và thú cưng | `/admin/customers` | Tìm kiếm, danh sách, xem hồ sơ | `GET /customers`, `/customers/:id` | users, pets | TV3 + TV4 |
| Admin / Dịch vụ và nhân viên | `/admin/catalog` | CRUD dịch vụ/nhân viên, khóa thay vì xóa cứng | `/services`, `/staff` | services, users, staff_profiles | TV4 |
| Đăng nhập & đăng ký | `/login`, `/register` | Auth, phân quyền, SSO nội bộ bằng cookie | `/auth/*` | users, sessions | TV3 |
| Thông tin cá nhân | `/profile` | Sửa thông tin, đổi mật khẩu | `/auth/profile`, `/auth/password` | users, sessions | TV3 |

Do chỉ có **ảnh tổng hợp Figma** (733x361) chứ không có file `.fig`, số đo typography, màu, spacing là xấp xỉ theo thiết kế gốc; chưa thể bảo đảm pixel-perfect.
