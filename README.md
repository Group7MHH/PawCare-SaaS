# PawCare — Single-store cloud SaaS

PawCare is a cloud-hosted pet-care management application for **one store**, with three roles: **Admin, Staff, Customer**. Frontend React/Vite, backend Express/TypeScript, PostgreSQL on Neon, deployed as one Node Web Service on Render. No Docker required.

## Workflow
1. Customer registers, manages pets, selects **one or multiple services** (up to 8), checks the full combined time availability and books in a single appointment.
2. The server reserves a **capacity slot** for the full combined duration; appointments begin in `pending` and Staff can proactively accept requests (or targeted Staff may accept/decline). Selected services and price/duration snapshots are stored in `appointment_services`, while the parent appointment stores the combined price and duration.
3. Staff accepts appointments from the pool; Admin only handles assignment exceptions and can reassign when needed.
4. Assigned Staff starts work (`in_progress`), records the result, then completes it.
5. Customer sees appointment history and Admin sees store-wide metrics.

## Roles
- Admin: services, staff invitations/activation, assignments, customers, revenue.
- Staff: only assigned appointments and their customer/pet details; record care results.
- Customer: own pets, own bookings, cancellation before work begins.

## Development
Requires Node.js >=22 and a **development** PostgreSQL database.

```powershell
Copy-Item backend/.env.example backend/.env
# Set DATABASE_URL and APP_ORIGIN in backend/.env
npm.cmd install
npm.cmd run db:migrate
npm.cmd run db:bootstrap-admin
npm.cmd run dev
```

Initialize the first Admin with `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters) and optionally `ADMIN_FULL_NAME`. Alternatively set `BOOTSTRAP_ADMIN=true` only for the first deployment; remove it and the credential variables immediately afterward. Do not commit secrets.

Optional local fixtures: configure `DEV_SEED_PASSWORD` (12+ characters) then run `npm.cmd run db:seed`. Never seed production.

## Deployment
On Render, build `npm install && npm run build`, start `npm start`; use `DATABASE_URL` (Neon), `NODE_ENV=production`, `SESSION_COOKIE_SECURE=true` and correct HTTPS `APP_ORIGIN` (or Render's `RENDER_EXTERNAL_URL`).

### Existing data / migrations
Migrations 001–009 run during startup. Migration 004 is **non-destructive** and refuses conversion if **more than one organization** exists. In that case, back up and explicitly consolidate historical data before enabling single-store mode. Legacy organization columns remain as foreign keys internally, but there is **no multi-store UI or owner role**. Do not deploy into production without verifying backup, build, tests, and migration in a separate database first.

## Verification
```powershell
npm.cmd run build
npm.cmd run test
node --test tests/*.test.mjs
```

The original project was MVP; a hosted card/payment gateway, messaging, password recovery and full end-to-end validation are still out of scope. PawCare now includes manual cash/transfer payment status tracking with Admin reconciliation; this does not automatically process money.

## UI and booking improvements
The interface uses locally stored care-themed SVG artwork (`frontend/public/illustrations/care-*.svg`) with no dog/cat portrait artwork; services select relevant medical, bath, grooming, vaccination or dental icons from the service name/category. One appointment supports multiple services, totals are calculated from authoritative service prices/durations, and the server checks a contiguous slot for the full duration under a PostgreSQL transaction. Existing single-service appointments are backfilled by migration 006. Permanently deleting a service removes all bookings that include it, including multi-service bookings, following the store's existing deletion policy.

## Manual payment workflow (v1)

PawCare supports two methods: **cash at store** (default) and **bank transfer with human reconciliation**. The bank method appears only when all of `PAYMENT_BANK_NAME`, `PAYMENT_BANK_ACCOUNT`, and `PAYMENT_BANK_OWNER` are set on the backend (Render Environment). These are public recipient details, not login credentials.

1. Customer books up to 8 services; the server computes `price_snapshot` and creates one `payments` record in the **same database transaction**. The frontend cannot set the payment amount.
2. Cash: initial state `unpaid`, Admin confirms `paid` only after physically receiving the money.
3. Bank transfer: Customer sees the payee details and their unique reference (`PC0000...`), transfers using their own banking app, then chooses **Tôi đã chuyển khoản**. This changes status to `pending_review`, **not** `paid`. Admin manually verifies the actual funds before confirming.
4. Admin may reject a claimed transfer with a required explanation. Customer can retry.
5. Cancelled, unpaid bookings become `void`; paid bookings become `refund_required`, not automatically refunded. Admin marks `refunded` only after making and documenting a real refund. Claimed bank transfers on a subsequently cancelled booking remain pending reconciliation.
6. The current payment method/status appears on **Lịch hẹn của tôi** and in the Admin appointment detail dialog. Financial state changes are auditable in `role_audit_logs`.

Migration `009_manual_payments.sql` creates the payment ledger and safely backfills existing bookings as **unpaid/void**, without claiming any historical cash was collected. The app applies migrations at startup; **back up Neon first**. The first deployment should be verified using a development database before production. This is *manual payment tracking* only: no real-time bank verification, payment gateway, QR integration, webhook, automatic refunds, or payment receipts from a licensed provider.

## Artwork direction

PawCare's large illustrations now use local SVGs depicting **care journals, stethoscopes, checklists, bath/spa tools, vaccination, dental care and operations reporting**, rather than dog/cat portraits or emoji. Navigation icons remain purposeful and accessible. Existing animal names/species are still shown as customer-owned data.

**Accounting safety:** permanent deletion of an account or service containing paid, pending-review or refund-related transactions is blocked so that accepted money and refund obligations are not silently erased. Admin must resolve such records using an appropriate retention/archival policy before any final deletion.

## Admin bank settings in Profile and Staff transfer reconciliation (v2)

- **Admin → Thông tin cá nhân** contains the bank recipient editor. The former `/admin/payment-settings` URL redirects to `/profile`; no separate bank menu item is shown. Only Admin can update recipient details. The saved bank details in Neon override Render environment defaults.
- **Customer → Thanh toán** reports a bank transfer as `pending_review`, never as an automatic success.
- **Staff → Lịch được giao → Chi tiết lịch** allows the Staff actually assigned to an accepted booking to confirm **only** a pending bank transfer after viewing the real bank statement. Staff must enter a bank transaction reference (at least six characters) and a verification note (at least ten characters). The backend checks Staff's assigned booking, payment method/status and appointment status, locks both booking and payment, stores the reviewer and audit entry, and prevents reuse of the same bank transaction reference within the store.
- Staff **cannot** reject a transfer, confirm a refund, edit the bank recipient, confirm cash or settle someone else's booking. Admin retains those rights. Paid/refunded/cancelled transfers cannot be re-confirmed.
- The server does **not** access bank accounts or verify funds automatically. Do not grant the Staff reconciliation capability unless Staff have an authorized way to view trustworthy bank records. An image or screenshot from a customer is not proof that funds have arrived.
- `011_staff_payment_reconciliation.sql` adds a nullable bank transaction reference and an organization-scoped unique index. Existing payments remain unchanged. Back up Neon and validate the migration on a test database before production deployment.

## Demo-only payment confirmation

For this school/demo deployment, assigned Staff and Admin can press **Xác nhận đã chuyển khoản** on a bank-transfer payment in `pending_review`, without entering a bank reference or proof. A confirmation dialog explicitly states that the system **does not verify funds with a bank**. The API logs the actor, method, previous/new status, and `demo_confirmation=true, bank_verified=false` in `role_audit_logs`; the payment retains reviewer/time. The payment status becomes `paid` in PawCare **for demonstration only**, not proof of real funds.

Customer still only reports having transferred funds; they cannot mark themselves paid. Staff may confirm only their assigned, accepted bookings. Admin still handles rejection/refunds, which require notes. Do **not** use demo confirmation for production payments; real operations need bank-statement verification or a verified gateway/webhook before recording `paid`.
