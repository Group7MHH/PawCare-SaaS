# PawCare SaaS — React + Express + PostgreSQL (Render Node + Neon)

**Bản triển khai Render Native Node.js**, kết nối Neon PostgreSQL, một đường link HTTPS phục vụ React và REST API. Độc lập với Railway; không có cấu hình container trong repository này.

## Phân quyền

- `owner`: quản lý toàn bộ nền tảng, tổ chức/cửa hàng và phân quyền Admin.
- `admin`: quản lý dịch vụ, lịch hẹn, nhân viên của cửa hàng được cấp quyền; chỉ được mời Staff.
- `staff`: xử lý lịch hẹn theo quyền tại cửa hàng.
- `customer`: tự đăng ký, quản lý thú cưng và đặt lịch.

Một PostgreSQL trung tâm lưu nhiều cửa hàng, backend phải kiểm tra `organization_id` trong server-side session. Đây là bản MVP **chưa kiểm thử end-to-end và chưa sẵn sàng cho khách hàng trả phí**.

## Triển khai công khai — GitHub + Render + Neon

Đọc **[docs/DEPLOY_RENDER_NEON_FREE.md](docs/DEPLOY_RENDER_NEON_FREE.md)**.

Tạo Render **Web Service**, Language **Node**, nhánh `main`, Root Directory để trống, Instance **Free** (nếu đủ điều kiện):

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **NODE_VERSION:** đặt từ file `.node-version` (22.16.0)

Render và API dùng chung domain HTTPS; Neon lưu database từ `DATABASE_URL` trong secret environment của Render. Code tự chạy SQL migrations khi khởi động. Tạo Owner một lần bằng các biến `BOOTSTRAP_OWNER`, `OWNER_EMAIL`, `OWNER_PASSWORD`, rồi xóa biến nhạy cảm sau khi đăng nhập lần đầu.

## Chạy phát triển trong VS Code (Node.js, không cần container)

Cần Node.js >=22, npm và một PostgreSQL **development** đang chạy (có thể dùng một Neon project/branch riêng, không dùng database production để chạy test).

```powershell
Copy-Item apps/api/.env.example apps/api/.env
notepad apps/api/.env
npm.cmd install
npm.cmd run db:migrate
npm.cmd run dev
```

Điền `DATABASE_URL` và các cấu hình cần thiết vào `apps/api/.env` trước khi chạy migration. Giao diện ở `http://localhost:5173`, API ở port 4000 (Vite proxy `/api`).

Để tạo Owner đầu tiên trong development, đặt `OWNER_EMAIL` và `OWNER_PASSWORD` vào `apps/api/.env`, rồi:

```powershell
npm.cmd run db:bootstrap-owner
```

**Demo chỉ ở development:** `npm.cmd run db:seed` có thể tạo nhân viên tên **Trần Mạnh Hùng**. Không chạy seed lên database công khai.

## Database / modules

- `infra/001_postgres_schema.sql` — schema PostgreSQL nền.
- `infra/002_default_services.sql` — điều chỉnh dịch vụ mặc định.
- `infra/003_owner_multitenant.sql` — organizations, memberships, invites, audit logs và ràng buộc theo tenant.
- `apps/api` — Express API, authentication, middleware, migrations.
- `apps/web` — React + Vite frontend; build ra `apps/web/dist`, được Express phục vụ từ một URL.

Migration chạy lúc backend start; **backup database trước khi chạy phiên bản mới trên dữ liệu cũ**.

## Kiểm tra

```powershell
npm.cmd run build
npm.cmd run test
node --test tests/*.test.mjs
```

Bài test tích hợp PostgreSQL cần `TEST_DATABASE_URL` riêng có tên database chứa `test`. Không đặt bằng database production.

## Chưa có trong bản MVP

Email tự động, xác minh/khôi phục email-mật khẩu, tính tiền SaaS, PostgreSQL RLS, audit bảo mật chuyên sâu, hệ thống backup/monitoring chuẩn production. Tính năng mời thành viên hiện tạo **link để gửi thủ công**, chưa gửi SMTP.
