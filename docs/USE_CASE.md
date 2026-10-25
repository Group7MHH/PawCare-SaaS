> **Lưu ý:** Sơ đồ/phần chức năng dưới đây là bản nguyên gốc từ ứng dụng một cửa hàng. Với phiên bản SaaS Owner, xem `infra/003_owner_multitenant.sql`, `README.md` và `docs/DEPLOY_RENDER_NEON_FREE.md` để có cấu trúc chính xác hiện hành.

# Use Case — PawCare

```mermaid
flowchart LR
  C[Khách hàng] --> A((Đăng ký / đăng nhập))
  C --> P((CRUD hồ sơ thú cưng))
  C --> H((Quản lý hồ sơ chăm sóc))
  C --> B((Đặt lịch chăm sóc))
  C --> X((Xem / hủy lịch))
  C --> PR((Chỉnh sửa hồ sơ cá nhân))
  S[Nhân viên] --> L((Xem lịch được phân công))
  S --> U((Xác nhận / cập nhật trạng thái))
  S --> KH((Xem khách hàng & thú cưng))
  AD[Quản trị viên] --> ALL((Quản lý toàn bộ lịch hẹn))
  AD --> SV((CRUD / ngừng dịch vụ))
  AD --> ST((Quản lý tài khoản nhân viên))
  AD --> DS((Xem báo cáo & doanh thu))
  AD --> KH
  ALL --> U
```

## Quy tắc phân quyền

| Chức năng | Khách hàng | Nhân viên | Admin |
|---|---|---|---|
| Xem/sửa thú cưng của chính mình | Có | Xem hồ sơ | Xem hồ sơ |
| Đặt/hủy lịch | Lịch của mình | Lịch do mình phụ trách | Toàn hệ thống |
| Cập nhật trạng thái | Chỉ hủy khi cho phép | Lịch được phân công | Tất cả |
| Danh sách khách hàng | Không | Có | Có |
| Thêm/sửa dịch vụ, nhân viên | Không | Không | Có |
| Dashboard doanh thu | Không | Lịch nhân viên | Toàn hệ thống |
