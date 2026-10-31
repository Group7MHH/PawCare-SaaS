# PawCare SaaS — triển khai bằng GitHub + Render Native Node + Neon PostgreSQL

Bản Render **Native Node**: không có Dockerfile hay `railway.json`, không yêu cầu cài phần mềm container. Một service Render chạy Express và phục vụ React đã build, kết nối một PostgreSQL trên Neon. Phù hợp demo/MVP nhỏ trong hạn mức Free, **chưa xác nhận production-ready**.

## 1. Đưa mã nguồn mới lên GitHub

Repository hiện có: `https://github.com/Group7MHH/PawCare-SaaS`. Sao chép nội dung bản ZIP **vào thư mục git đang dùng**. Xóa các file cũ không còn nằm trong ZIP (các file cấu hình cloud cũ) rồi chạy từ đúng thư mục có `package.json`:

```powershell
git status
git add -A
git commit -m "Switch PawCare to Render Native Node and Neon"
git push origin main
```

Không commit `.env`, token hoặc `DATABASE_URL`. Tài khoản GitHub có quyền repo private phải cấp quyền cho Render.

## 2. Tạo PostgreSQL ở Neon

- Đăng nhập https://console.neon.tech và tạo project PawCare (gói Free nếu có).
- Dùng PostgreSQL 15+ và region phù hợp; sao chép **connection string** của database, dạng `postgresql://...?...sslmode=require`.
- **Không** chia sẻ connection string lên GitHub hoặc trong ảnh chụp màn hình.
- Dùng connection string trực tiếp để chạy migration khi khởi động lần đầu; sau đó có thể cân nhắc pooled connection theo hướng dẫn Neon.
- Đừng dùng nhánh/database production để thử `db:seed` hoặc reset dữ liệu.

## 3. Tạo Web Service trên Render (KHÔNG chọn Docker)

Truy cập https://dashboard.render.com → **New → Web Service** → kết nối repository GitHub PawCare.

| Thuộc tính | Giá trị |
|---|---|
| Name | `pawcare-saas` (nếu còn khả dụng) |
| Source | `Group7MHH/PawCare-SaaS` |
| Branch | `main` |
| Language / Runtime | **Node** |
| Root Directory | **để trống** (repo có `package.json` tại gốc) |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Instance Type | **Free** nếu có và đủ điều kiện |

Root repo có `.node-version` đặt Node.js `22.16.0` để tránh dùng bản Node mặc định thay đổi bất ngờ. Nếu cần đặt thủ công, dùng Environment `NODE_VERSION=22.16.0`.

Đừng tạo Static Site (PawCare có backend). Đừng chọn riêng `frontend` làm root: API và website chạy chung domain.

## 4. Environment Variables trong Render Web Service

| Key | Value |
|---|---|
| `DATABASE_URL` | Chuỗi PostgreSQL **bí mật** lấy từ Neon |
| `NODE_ENV` | `production` |
| `PG_POOL_MAX` | `3` |
| `SESSION_COOKIE_SECURE` | `true` |
| `BOOTSTRAP_OWNER` | `true` (chỉ lần đầu) |
| `ADMIN_EMAIL` | Email đăng nhập Admin do bạn chọn |
| `ADMIN_PASSWORD` | Mật khẩu riêng, 12–100 ký tự, mạnh |
| `ADMIN_FULL_NAME` | Tên chủ nền tảng (tùy chọn) |

Render Web Service có `RENDER_EXTERNAL_URL` nên backend tự xác định domain HTTPS để kiểm tra Origin và tạo link mời. Nếu triển khai domain tùy chỉnh, đặt `APP_ORIGIN` **chính xác** thành `https://domain-cua-ban` (không dấu `/` ở cuối). Không đặt `APP_ORIGIN=http://localhost:5173` trong production.

Không cần nhập `PORT` khi dùng Render; Express lấy `process.env.PORT` và lắng nghe `0.0.0.0`.

## 5. Deploy, kiểm tra và khóa bootstrap Admin

- Chọn **Create Web Service / Deploy**, theo dõi Events/Logs. Build phải thực hiện install + TypeScript API + React/Vite frontend rồi start Express API.
- Khi chạy, backend áp dụng migration 001, 002, 003, 004 bằng PostgreSQL transaction, tạo Admin đầu tiên nếu chưa có.
- Sau khi service ở trạng thái Live, mở URL `https://...onrender.com` và `https://...onrender.com/api/health` (mong đợi `{"status":"ok"}`). Đường dẫn chỉ là ví dụ, lấy tên miền thực trong Render.
- Đăng nhập bằng tài khoản Admin → mở trang quản trị dịch vụ và mời Staff.
- Sau khi xác minh Admin đăng nhập thành công, vào Render → Environment **xóa** `BOOTSTRAP_OWNER`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`, lưu và redeploy.

Tài khoản Admin tiếp theo chỉ có thể được cấp theo luồng bảo vệ trong trang Admin. Không để bootstrap password tồn tại dài hạn.

## 6. Tài khoản và phân quyền

- Admin tạo cửa hàng và gửi link mời Admin bằng tay (hiện chưa tự động gửi email).
- Admin quản lý dịch vụ và Staff của cửa hàng được cấp; không thể tự cấp Admin.
- Customer đăng ký và đặt lịch tại cửa hàng đã chọn.
- Staff dùng tên mẫu **Trần Mạnh Hùng** chỉ trong demo/dev, không tự sinh tài khoản demo ở production.

## 7. Chi phí & kiểm tra bảo mật

Render Free có giới hạn và có thể ngủ khi không hoạt động; Neon Free giới hạn compute/dung lượng. Kiểm tra giới hạn và điều kiện tính phí mới nhất tại https://render.com/pricing và https://neon.com/pricing; không giả định uptime 24/7. Giới hạn tài nguyên, dung lượng và thời gian chờ có thể thay đổi.

- PostgreSQL là dịch vụ **ngoài** Render, không lưu DB trong filesystem tạm của web service.
- Nếu Render đang không có gói Free hoặc hiện cảnh báo phí, dừng trước khi xác nhận tạo service.
- Không lưu dữ liệu khách hàng thật trước khi chạy kiểm thử login/role, quyền truy cập chéo cửa hàng, backup/restore và kiểm soát hành vi người dùng chưa đăng nhập.
- `DATABASE_URL` có đầy đủ thông tin đăng nhập, chỉ đặt trong Render Environment và máy dev cần thiết, không để trong repo.
- Để kiểm thử dữ liệu A/B, tạo ít nhất hai cửa hàng và xác nhận Admin A không đọc/sửa lịch của B bằng REST API trực tiếp.

## 8. Nếu gặp lỗi

- Build Failed: xem Render Build Logs, kiểm tra Node version, lệnh `npm install && npm run build` và repo root.
- Start Failed: xem Runtime Logs; kiểm tra `DATABASE_URL`, SSL, migration, `RENDER_EXTERNAL_URL` / `APP_ORIGIN`.
- `/api/health` trả 503: kiểm tra Neon DB và credentials.
- Trang chính không có React UI: xác minh build đã tạo `frontend/dist` và Start Command là `npm start` từ gốc repo.

**Trạng thái mã nguồn:** Có schema, nghiệp vụ và cấu hình native runtime. Các kiểm thử tích hợp với PostgreSQL thật vẫn cần chạy sau deploy.

Tài liệu chính thức:
- https://render.com/docs/web-services
- https://render.com/docs/native-runtimes
- https://render.com/docs/environment-variables
- https://neon.com/docs/connect/connect-from-any-app
