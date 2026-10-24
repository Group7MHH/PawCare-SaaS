# PawCare SaaS · React, Express, PostgreSQL · 4 vai trò

Phiên bản nâng cấp PawCare từ SQLite/ứng dụng đơn cửa hàng sang **một website, một PostgreSQL trung tâm, nhiều cửa hàng độc lập về dữ liệu**.

**Vai trò**
- `owner`: chủ **toàn nền tảng**; tạo, khóa cửa hàng, cấp/thu hồi Admin hoặc Staff và ủy quyền Owner khác bằng cách xác thực lại mật khẩu.
- `admin`: quản lý **một cửa hàng được cấp quyền**, các dịch vụ, lịch hẹn và nhân viên; chỉ mời/quản lý Staff, không được cấp Admin hay Owner.
- `staff`: xử lý lịch hẹn được giao trong đúng cửa hàng đã chọn.
- `customer`: tự đăng ký, quản lý thú cưng và đặt lịch tại cửa hàng đang chọn.

Một tài khoản có thể mang vai trò khác nhau tại các cửa hàng khác nhau; Owner có quyền ở cấp nền tảng. Dữ liệu cửa hàng được lọc tại API dựa vào `organization_id` **lưu trong server-side session** chứ không tin `organization_id` client gửi. Database có FK giới hạn lịch hẹn theo đúng dịch vụ và nhân viên của cửa hàng. Hồ sơ thú cưng thuộc khách hàng chung; hồ sơ chăm sóc do cửa hàng ghi được giới hạn cho nhân viên cửa hàng đó.

## Chạy nhanh (Docker Desktop)

```powershell
docker compose up --build -d
```

Website: **http://localhost:4000**. Health: **http://localhost:4000/api/health**.

Tạo **Owner duy nhất đầu tiên** bằng mật khẩu mạnh riêng (thay email/mật khẩu ví dụ):

```powershell
docker compose exec -e OWNER_EMAIL=owner@example.com -e OWNER_PASSWORD="MatKhauRatManh1234!" -e OWNER_FULL_NAME="Chủ PawCare" app npm run db:bootstrap-owner
```

Sau đó đăng nhập Owner → **Quản trị nền tảng** (`/owner`) → **Tạo cửa hàng** → **Mời Admin bằng email**. Người nhận đăng ký tài khoản Customer (nếu chưa có), mở lại link mời và nhấn **Chấp nhận lời mời**. Admin sẽ vào cửa hàng đó quản lý dịch vụ, lịch hẹn và mời Staff bằng link. Hệ thống hiện cho phép **sao chép link mời thủ công**, chưa gửi email SMTP tự động.

## Chạy trong VS Code (Windows PowerShell)

Cần Node >=22, PostgreSQL 15+, npm. Có thể khởi động riêng PostgreSQL với `docker compose up -d db`.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
npm.cmd install
npm.cmd run db:migrate
npm.cmd run dev
```

Frontend tại **http://localhost:5173**; Express API tại port 4000. Trên máy gặp PowerShell Execution Policy, dùng `npm.cmd` thay vì `npm`.

Sửa `OWNER_EMAIL` / `OWNER_PASSWORD` trong `apps/api/.env`, chạy:

```powershell
npm.cmd run db:bootstrap-owner
```

> **Dữ liệu ví dụ** (chỉ local/dev): `npm.cmd run db:seed` tạo Owner, Admin, Staff **Trần Mạnh Hùng**, Customer và dịch vụ mẫu; KHÔNG chạy trong production. Tài khoản mẫu này **không tự động xuất hiện trên server public**.

## Triển khai một URL công khai

Đọc [`docs/DEPLOY_RAILWAY.md`](docs/DEPLOY_RAILWAY.md) để đưa một service Node + React và một PostgreSQL lên Railway. Tất cả máy truy cập bằng cùng URL HTTPS và cùng DB.

## Migrations / cấu trúc dữ liệu

- `001_postgres_schema.sql`: database từ bản PostgreSQL trước.
- `002_default_services.sql`: bỏ dịch vụ global trên các cài đặt mới; cửa hàng mới có dịch vụ mẫu riêng.
- `003_owner_multitenant.sql`: bảng `organizations`, `organization_members`, `invitations`, `role_audit_logs`, session chọn cửa hàng, khóa ngoại tenant, staff profile theo cửa hàng.
- Data từ bản PostgreSQL trước (nếu có) được chuyển vào cửa hàng `pawcare-legacy`; các Admin/Staff cũ được gán vào cửa hàng này, không tự biến thành Owner.
- Migration tự động chạy khi backend khởi động; trước khi nâng cấp DB đang chạy thực tế **PHẢI backup**.

## API và UI mới

- Owner UI `/owner`: tạo/quản lý cửa hàng; cấp Admin/Staff qua lời mời; nâng/hạ quyền thành viên; tạo thêm Owner có xác nhận mật khẩu.
- Admin UI `/admin/team`: danh sách thành viên cửa hàng, mời/khóa Staff.
- `GET /api/organizations`; `POST /api/auth/select-organization`; `POST /api/auth/accept-invitation`.
- `POST /api/owner/organizations`, `PATCH /api/owner/organizations/:id`, `POST /api/owner/owners`.
- `GET/PATCH /api/organizations/:id/members`; `POST /api/organizations/:id/invitations`.

## Kiểm tra

```powershell
node --test tests/*.test.mjs
npm.cmd run build
npm.cmd run test
```

Để chạy các bài thử PostgreSQL thật, khai báo `TEST_DATABASE_URL` chỉ tới một **database test riêng có tên chứa `test`**. Không đặt bằng production `DATABASE_URL`.

**Trạng thái bàn giao:** Đã chỉnh source, kiểm tra cú pháp và bài thử tĩnh. Chưa xác nhận npm build đầy đủ và test tích hợp PostgreSQL trong môi trường biên soạn do thiếu dependencies và PostgreSQL test. Cần chạy thử trước khi dùng dữ liệu thật. **Chưa có** tính tiền/gói thuê bao, gửi mail tự động, xác minh email, khôi phục mật khẩu, PostgreSQL RLS, kiểm thử bảo mật độc lập, giám sát và chính sách backup đầy đủ. Đây là nền tảng triển khai thử nghiệm SaaS, không phải cam kết production-ready.
