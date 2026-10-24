> **Lưu ý:** Sơ đồ/phần chức năng dưới đây là bản nguyên gốc từ ứng dụng một cửa hàng. Với phiên bản SaaS Owner, xem `infra/003_owner_multitenant.sql`, `README.md` và `docs/DEPLOY_RAILWAY.md` để có cấu trúc chính xác hiện hành.

> **Bản PostgreSQL:** DDL thực tế nằm ở `infra/001_postgres_schema.sql`.

# ERD — PawCare

```mermaid
erDiagram
  USERS ||--o{ SESSIONS : has
  USERS ||--o{ PETS : owns
  USERS ||--o| STAFF_PROFILES : specialization
  USERS ||--o{ APPOINTMENTS : customer
  USERS ||--o{ APPOINTMENTS : assigned_staff
  PETS ||--o{ CARE_RECORDS : records
  PETS ||--o{ APPOINTMENTS : booked_for
  SERVICES ||--o{ APPOINTMENTS : booked_service
  USERS { bigint id PK string full_name string email UK string password_hash enum role }
  SESSIONS { bigint id PK bigint user_id FK string token_hash datetime expires_at }
  PETS { bigint id PK bigint owner_id FK string name enum species decimal weight_kg }
  CARE_RECORDS { bigint id PK bigint pet_id FK string title date care_date }
  SERVICES { bigint id PK string name int duration_minutes decimal price boolean is_active }
  STAFF_PROFILES { bigint user_id PK string specialty }
  APPOINTMENTS { bigint id PK bigint customer_id FK bigint pet_id FK bigint service_id FK bigint staff_id FK datetime starts_at datetime ends_at enum status decimal price_snapshot }
```

Mô hình chuẩn hóa; `price_snapshot` bảo toàn doanh thu lịch sử khi giá dịch vụ thay đổi. Bảng sessions lưu **SHA-256 token hash** thay vì token gốc; hết hạn sau 7 ngày. Múi giờ nghiệp vụ Asia/Ho_Chi_Minh (08:00–18:00, thứ Hai–Bảy), `TIMESTAMPTZ` trong PostgreSQL lưu thời điểm chuẩn UTC.
