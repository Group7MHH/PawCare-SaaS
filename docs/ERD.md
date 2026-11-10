# PawCare ERD — single-store demo

This is the current logical model after migrations `001`–`013`. The physical database still stores `organization_id` foreign keys from the historical schema, but the live application operates **one store** with **Customer, Staff, Admin** only. Historical migration `003_owner_multitenant.sql` must not be deleted: later migrations depend on it.

```mermaid
erDiagram
 USERS ||--o{ SESSIONS : logs_in
 USERS ||--o{ PETS : owns
 USERS ||--o| STAFF_PROFILES : staff_profile
 USERS ||--o{ APPOINTMENTS : books
 USERS ||--o{ APPOINTMENTS : handles
 PETS ||--o{ APPOINTMENTS : receives
 PETS ||--o{ CARE_RECORDS : has
 ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : includes
 USERS ||--o{ ORGANIZATION_MEMBERS : membership
 ORGANIZATIONS ||--o{ SERVICES : offers
 ORGANIZATIONS ||--o{ APPOINTMENTS : schedules
 SERVICES ||--o{ APPOINTMENT_SERVICES : selected
 APPOINTMENTS ||--|{ APPOINTMENT_SERVICES : contains
 APPOINTMENTS ||--o| PAYMENTS : billed_by
 APPOINTMENTS ||--o{ CARE_RECORDS : generates
 APPOINTMENTS ||--o{ APPOINTMENT_STAFF_DECLINES : rejected_by
 USERS ||--o{ APPOINTMENT_STAFF_DECLINES : declines
 ORGANIZATIONS ||--o| PAYMENT_BANK_SETTINGS : receives
 USERS ||--o{ ROLE_AUDIT_LOGS : acts

 USERS {
   int id PK
   string email UK
   string password_hash
   string role
   boolean is_active
 }
 PETS {
   int id PK
   int owner_id FK
   string name
   string species
 }
 SERVICES {
   int id PK
   int organization_id FK
   string name
   decimal price
   int duration_minutes
   boolean is_active
 }
 APPOINTMENTS {
   int id PK
   int organization_id FK
   int customer_id FK
   int pet_id FK
   int staff_id FK
   string status
   timestamp starts_at
   timestamp ends_at
   decimal price_snapshot
   string care_result
 }
 APPOINTMENT_SERVICES {
   int appointment_id FK
   int service_id FK
   int position
   decimal price_snapshot
   string name_snapshot
 }
 PAYMENTS {
   int id PK
   int appointment_id FK
   int customer_id FK
   decimal amount
   string method
   string status
   timestamp paid_at
   int reviewed_by FK
 }
 CARE_RECORDS {
   int id PK
   int pet_id FK
   int appointment_id FK
   string record_type
 }
 ORGANIZATIONS {
   int id PK
   string name
 }
 ORGANIZATION_MEMBERS {
   int organization_id FK
   int user_id FK
   string role
 }
 STAFF_PROFILES {
   int user_id PK
 }
 SESSIONS {
   int id PK
   int user_id FK
   string token_hash
 }
 APPOINTMENT_STAFF_DECLINES {
   int appointment_id FK
   int staff_id FK
 }
 PAYMENT_BANK_SETTINGS {
   int organization_id PK
   string bank_name
   string bank_account
 }
 ROLE_AUDIT_LOGS {
   int id PK
   int actor_id FK
   string action
 }
```

**Booking lifecycle:** `pending → confirmed → in_progress → completed`, with allowed cancellations. The backend stores the combined service price/duration snapshot so subsequent catalog edits do not change old orders. A completed appointment creates a linked care record.

**Payment lifecycle:** Cash begins `unpaid`; bank transfer begins `awaiting_payment`, then `pending_review` after Customer notification. Authorized Staff or Admin can confirm `paid` (bank confirmation is **demo-only**). Cancellation may create `void` or `refund_required`; Admin records `refunded` when settled. The payment does not become paid merely because a service completes.

**Database history:** Physical tables such as `invitations` may exist from earlier migrations even though their feature/API routes have been retired. Do not drop migration history or historical tables simply to make the code tree shorter.
