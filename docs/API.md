# API HTTP — `/api`

Các route (trừ `/health`, đăng nhập, đăng ký) yêu cầu cookie `pawcare_session`. Phản hồi lỗi chung `{ "message": "..." }`, HTTP 401 không đăng nhập, 403 không đủ quyền, 409 xung đột, 422 dữ liệu không hợp lệ. Request thay đổi dữ liệu phải gửi `Origin` chính xác theo `APP_ORIGIN` khi production.

| Method | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| GET | /health | Công khai | Kiểm tra API + database |
| POST | /auth/register | Công khai | Tạo khách hàng |
| POST | /auth/login | Công khai | Đăng nhập; set cookie httpOnly |
| POST | /auth/logout | Công khai | Hủy phiên |
| GET | /auth/me | Đăng nhập | Người dùng hiện tại |
| PATCH | /auth/profile | Đăng nhập | Chỉnh sửa tên, điện thoại, địa chỉ |
| PATCH | /auth/password | Đăng nhập | Đổi mật khẩu, xóa toàn bộ phiên |
| GET/POST | /pets | Đăng nhập | Danh sách và thêm thú cưng |
| GET/PATCH/DELETE | /pets/:id | Chủ sở hữu / nhân sự | Chi tiết, sửa, xóa |
| POST/DELETE | /pets/:id/records[/:recordId] | Chủ sở hữu / nhân sự | Quản lý hồ sơ chăm sóc |
| GET/POST | /appointments | Đăng nhập | Lấy danh sách / đặt lịch |
| GET/PATCH/DELETE | /appointments/:id | Theo quyền | Chi tiết / cập nhật / hủy lịch |
| GET/POST | /services | Đọc: tất cả; ghi: admin | Danh mục dịch vụ |
| PATCH/DELETE | /services/:id | Admin | Sửa / vô hiệu hóa dịch vụ |
| GET/POST | /staff | Đọc: tất cả; ghi: admin | Danh sách / thêm nhân viên |
| PATCH/DELETE | /staff/:id | Admin | Sửa / vô hiệu hóa nhân viên |
| GET | /customers | Nhân viên, admin | Danh sách khách hàng, tìm kiếm |
| GET | /customers/:id | Nhân viên, admin | Khách hàng và thú cưng |
| GET | /dashboard | Đăng nhập | Thống kê theo vai trò |

### Mẫu đặt lịch

```json
{
 "pet_id": 1,
 "service_id": 2,
 "staff_id": 2,
 "starts_at": "2026-11-02T02:00:00.000Z",
 "notes": "Vui lòng chăm sóc nhẹ nhàng"
}
```

Khách hàng chỉ gửi pet thuộc chính tài khoản. Nhân viên có thể nhận lịch được chỉ định. Slot cách nhau 30 phút trong giờ làm việc; nhân viên không được có hai lịch chồng nhau (PostgreSQL advisory transaction lock + kiểm tra overlap). Lịch hẹn có `pending -> confirmed -> in_progress -> completed`, có thể hủy ở các giai đoạn cho phép.

### Danh sách với tìm kiếm và phân trang

`GET /appointments?page=1&limit=15&status=confirmed&search=Milo`

`GET /customers?page=1&limit=15&search=Nguyễn`

`GET /pets?search=Milo` hoặc nhân sự `GET /pets?owner_id=3`

### Kiểm tra giờ trống theo nhân viên

`GET /appointments/availability?date=2026-11-02&service_id=1&staff_id=2` trả `{ "date": "2026-11-02", "slots": [{"time":"08:00","available":true},...] }`. Không chọn nhân viên thì giao diện liệt kê khung giờ làm việc, server vẫn kiểm tra tại thời điểm đặt thực tế.

## Bổ sung bản SaaS Owner (03 — hiện hành)

> Các endpoint `/services`, `/staff`, `/appointments`, `/customers` và dashboard nay được giới hạn bởi `organization_id` lấy từ session server; Owner xem dữ liệu vận hành của cửa hàng đang chọn. Danh sách cửa hàng truy cập thông qua `GET /organizations`.

| Method | Path | Quyền | Ý nghĩa |
|---|---|---|---|
| GET | `/organizations` | Đã đăng nhập | Danh sách cửa hàng được phép chọn (Customer có thể chọn cửa hàng hoạt động) |
| POST | `/auth/select-organization` | Đã đăng nhập | `{ "organization_id": 1 }`; phiên chuyển sang một cửa hàng hợp lệ |
| POST | `/auth/accept-invitation` | Đúng email được mời | `{ "token": "..." }`, dùng một lần trong 7 ngày |
| POST | `/owner/organizations` | Owner | Tạo cửa hàng và dịch vụ mặc định riêng |
| PATCH | `/owner/organizations/:id` | Owner | Đổi tên / tạm khóa / kích hoạt cửa hàng |
| POST | `/owner/owners` | Owner, xác minh lại password | Nâng tài khoản đã tồn tại thành Owner nền tảng |
| GET | `/organizations/:id/members` | Owner hoặc Admin thuộc cửa hàng | Liệt kê nhân sự thuộc cửa hàng |
| PATCH | `/organizations/:id/members/:userId` | Owner hoặc Admin thuộc cửa hàng | Đổi role/trạng thái; Admin chỉ được chỉnh Staff |
| POST | `/organizations/:id/invitations` | Owner, Admin cửa hàng | Owner mời Admin/Staff; Admin chỉ mời Staff; trả về link thủ công |
| GET | `/organizations/:id/invitations` | Owner hoặc Admin cửa hàng | Danh sách thư mời, không trả lại token |

Owner không có mật khẩu demo trong production. `BOOTSTRAP_OWNER=true` + biến môi trường chỉ dùng một lần rồi xóa.
