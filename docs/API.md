# PawCare API — single-store demo

Base path: `/api`. Authentication uses the HTTP-only `pawcare_session` cookie. There are exactly three roles: **Customer**, **Staff**, **Admin**. Requests that change data require the correct origin in production.

## Authentication & profile

| Method | Endpoint | Who |
|---|---|---|
| GET | `/health` | Public |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Public/session |
| GET | `/auth/me` | Signed in |
| PATCH | `/auth/profile`, `/auth/password` | Signed in |

Register creates a Customer. Admin promotes or demotes Staff through account management, not invitation links. Passwords are hashed, never returned by the API.

## Booking and care

| Method | Endpoint | Who / purpose |
|---|---|---|
| GET, POST | `/pets` | Customer owns their pets; Admin can create for a customer |
| GET, PATCH, DELETE | `/pets/:id` | Owner; authorized Staff may view assigned pets |
| POST, DELETE | `/pets/:id/records[/:recordId]` | Authorized care records; completed appointment records cannot be deleted |
| GET | `/services`, `/staff` | Signed in; Customer sees active service/staff options |
| POST | `/services` | Admin creates a service |
| PATCH, DELETE | `/services/:id` | Admin updates / stops providing |
| GET | `/services/:id/delete-preview` | Admin previews permanent deletion impact |
| POST | `/services/:id/permanent-delete` | Admin permanently deletes if financial retention checks permit |
| GET | `/appointments/availability` | Check combined service/staff capacity |
| GET, POST | `/appointments` | List scoped to role; Customer books |
| GET, PATCH, DELETE | `/appointments/:id` | View, update or cancel subject to permissions |
| POST | `/appointments/:id/accept`, `/appointments/:id/decline` | Staff accepts or returns a pending/confirmed assignment |
| GET | `/customers`, `/customers/:id` | Admin or Staff scoped to assigned customers |
| GET | `/dashboard` | Stats for own role |

A booking can select 1–8 distinct services. The backend verifies duration, prices, active Staff capacity and overlapping schedules in a transaction. New bookings begin in `pending`; Staff accepts (→ `confirmed`), begins work (→ `in_progress`), records care result and completes (→ `completed`). Customer may cancel only before work starts. Admin handles reassignment/cancellation exceptions.

Example booking:

```json
{
  "pet_id": 1,
  "service_ids": [2, 3],
  "staff_id": null,
  "starts_at": "2026-11-12T02:00:00.000Z",
  "payment_method": "cash",
  "notes": "Chăm sóc nhẹ nhàng"
}
```

## Payments (manual demo)

| Method | Endpoint | Role / action |
|---|---|---|
| GET | `/payments/config` | Signed in; available methods and bank recipient |
| GET | `/payments` | Customer's own history or Admin's store ledger; Staff has no list access |
| GET | `/payments/:id` | Customer's own, accepted assigned Staff read-only, or Admin details |
| PATCH | `/payments/:id/method` | Customer changes an unprocessed method |
| POST | `/payments/:id/transfer-notice` | Customer announces sending a bank transfer |
| POST | `/payments/:id/reconcile` | Admin only: confirm cash/bank demo, reject bank, record refund |
| GET, PUT | `/payments/admin-bank` | Admin configures recipient, requires password when changing |

Cash: `unpaid` → Admin confirms actual cash received → `paid`. Bank: `awaiting_payment` → Customer notice → `pending_review` → Admin demo confirmation → `paid`. There is **no actual bank verification**. Paid cancelled bookings become `refund_required` and only Admin records `refunded`; other unpaid cancellations become `void`, while pending review remains for resolution. Duplicate confirmations are rejected. Staff only sees the payment status for assigned accepted bookings and never performs payment actions. The actor and status change are logged.

## Administration

| Method | Endpoint | Purpose |
|---|---|---|
| GET, PATCH | `/organizations/:id/members[/:userId]` | View / toggle Staff activity (Admin) |
| GET | `/accounts` | List accounts (Admin) |
| PATCH | `/accounts/:id`, `/accounts/:id/role` | Update / grant or revoke Staff (Admin) |
| GET | `/accounts/:id/delete-preview` | Preview account deletion impact |
| DELETE | `/accounts/:id` | Admin deletion with financial retention checks |
| POST | `/accounts/:id/reset-password` | Admin password reset for eligible accounts |
| PATCH, DELETE | `/staff/:id` | Admin updates/deactivates staff |

The historical multi-store Owner API and invitation links are not part of this demo. The database retains historical migration files but the UI operates as a single store.

## Verification

```bash
npm install
npm run build
npm run test
node --test tests/*.test.mjs
```

Production: Render Node service serves the React build and Express API, using Neon PostgreSQL. See `README.md`.
