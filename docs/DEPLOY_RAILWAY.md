# Deploy PawCare Multi-Tenant + PostgreSQL lên Railway

## A. Chuẩn bị

1. Sao lưu database PostgreSQL đang sử dụng trước mọi migration mới. Không import SQLite trực tiếp; phiên bản này nâng cấp từ bản PostgreSQL hoặc dùng schema mới.
2. Đưa thư mục này lên repo GitHub **private** (không commit `.env`, token, mật khẩu).
3. Railway → **New Project** → thêm service PostgreSQL. Dữ liệu lưu tại DB cloud, không phải laptop.
4. Thêm app service từ repo GitHub; Railway dùng `Dockerfile` ở thư mục gốc để build API + React trong cùng app.

## B. Biến môi trường app service

| Tên | Giá trị |
|---|---|
| `DATABASE_URL` | Reference tới `${{Postgres.DATABASE_URL}}` theo tên PostgreSQL service thực tế |
| `NODE_ENV` | `production` |
| `SESSION_COOKIE_SECURE` | `true` |
| `APP_ORIGIN` | Chính xác `https://domain-cua-ban` (không có dấu `/` cuối) |
| `PG_POOL_MAX` | `10` (tùy kích cỡ PostgreSQL) |

Railway → app service → Networking → **Generate Domain**. Cập nhật `APP_ORIGIN` rồi redeploy, vì website dùng Origin validation cho API thay đổi dữ liệu.

App và API dùng chung một domain: `https://domain-cua-ban/` và `https://domain-cua-ban/api/health`. API health phải trả `{"status":"ok"}` sau khi kết nối database.

## C. Tạo Owner đầu tiên (một lần)

Trong Railway app service Variables, **tạm thời** thêm:

```env
BOOTSTRAP_OWNER=true
OWNER_EMAIL=chu-so-huu@example.com
OWNER_PASSWORD=<mật khẩu riêng từ 12 đến 100 ký tự>
OWNER_FULL_NAME=Chủ nền tảng PawCare
```

Deploy lại, sau khi xác minh tài khoản đã được tạo thì **xóa `BOOTSTRAP_OWNER`, `OWNER_PASSWORD` và redeploy**. Tài khoản Owner tiếp theo chỉ được Owner đã đăng nhập cấp trên `/owner` bằng thao tác xác thực lại mật khẩu.

Nếu DB đã có tài khoản role=`owner`, cơ chế bootstrap từ biến môi trường từ chối tạo người thứ hai. Nếu email đã tồn tại, bootstrap không tự nâng quyền; không cấp ngầm quyền Owner cho Admin cũ.

## D. Cấp Admin cho cửa hàng

1. Owner đăng nhập → **Quản trị nền tảng**.
2. **Tạo cửa hàng**: mỗi shop có dữ liệu dịch vụ riêng.
3. Chọn cửa hàng → **Mời Admin**, nhập email cửa hàng. Copy link mời hiện trên màn hình và **gửi riêng** cho người nhận.
4. Người nhận tự đăng ký/đăng nhập bằng đúng email → mở lại link mời → **Chấp nhận** (link dùng một lần, hết hạn sau 7 ngày).
5. Admin chọn cửa hàng trong sidebar, quản lý danh mục dịch vụ/lịch hẹn và vào **Thành viên cửa hàng** để mời Staff.
6. Ví dụ tên nhân viên trong bản dev: **Trần Mạnh Hùng** (không có tài khoản demo trong production).

Lưu ý: Hệ thống hiện **không tích hợp SMTP để tự gửi email**, Owner/Admin tự sao chép/gửi link. Nếu thư mời rò rỉ, chỉ tài khoản đăng nhập bằng đúng email được mời mới chấp nhận được.

## E. Kiểm thử cần làm trước public khách hàng thật

- Owner xem nhiều cửa hàng, Admin chỉ quản lý cửa hàng được cấp, Staff chỉ xem lịch được phân công.
- Thử hai cửa hàng A/B, tạo dịch vụ/lịch hẹn rồi xác nhận API không trả dữ liệu trái cửa hàng (kể cả truy cập trực tiếp bằng ID).
- Đổi cửa hàng trong sidebar không hiển thị dữ liệu cache của cửa hàng trước.
- Khi khóa Staff, các API Staff bị từ chối ngay cả khi chưa đăng xuất.
- Hai yêu cầu đặt cùng staff và khung giờ: một yêu cầu bị từ chối.
- Kiểm tra invite hết hạn, token dùng một lần, email khác không thể nhận invite.
- Kiểm tra cookie HTTPS, reset/đổi mật khẩu, backup & restore PostgreSQL, giám sát lỗi.

**Giới hạn:** Billing/subscriptions, email giao dịch, xác minh email, RLS, hardening và kiểm thử end-to-end chưa hoàn tất. Chưa nên lưu dữ liệu thực nhạy cảm hoặc bán gói SaaS đến khi các kiểm tra production được thực hiện.
