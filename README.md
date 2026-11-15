# PawCare — Single-store cloud SaaS

PawCare is a cloud-hosted pet-care management application for **one store**, with three roles: **Admin, Staff, Customer**. Frontend React/Vite, backend Express/TypeScript, PostgreSQL on Neon, deployed as one Node Web Service on Render. No Docker required.

## Workflow
1. Customer registers, manages pets, selects **one or multiple services** (no fixed eight-service cap; combined duration must fit within 600 minutes and opening hours), checks the full combined time availability and books in a single appointment.
2. The server reserves a **capacity slot** for the full combined duration. Customer bookings begin in `pending` with no Staff assigned and appear in Admin's assignment queue. Selected services and price/duration snapshots are stored in `appointment_services`.
3. Admin selects an available Staff member for each booking. Assigned Staff accepts it (or declines, returning it to Admin for reassignment); Staff cannot claim unassigned bookings.
4. Assigned Staff starts work (`in_progress`), records the result, then completes it.
5. Customer sees appointment history and Admin sees store-wide metrics.

## Roles
- Admin: services, direct Staff role management, exceptional assignments, customers, payments and revenue.
- Staff: accept/decline Admin-assigned appointments, perform care, record results, and view payment status only. No receipt confirmation or refunds.
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
Migrations 001–013 run during startup. Migration 004 is **non-destructive** and refuses conversion if **more than one organization** exists. In that case, back up and explicitly consolidate historical data before enabling single-store mode. Legacy organization columns remain as foreign keys internally, but there is **no multi-store UI or owner role**. Do not deploy into production without verifying backup, build, tests, and migration in a separate database first.

## Verification
```powershell
npm.cmd run build
npm.cmd run test
node --test tests/*.test.mjs
```

The original project was MVP; a hosted card/payment gateway, messaging, password recovery and production-grade end-to-end validation are still out of scope. PawCare now includes manual cash/transfer payment status tracking with Admin-only confirmation; this does not automatically process money.

## UI and booking improvements
The interface uses locally stored care-themed SVG artwork (`frontend/public/illustrations/care-*.svg`) with no dog/cat portrait artwork; services select relevant medical, bath, grooming, vaccination or dental icons from the service name/category. One appointment supports multiple services, totals are calculated from authoritative service prices/durations, and the server checks a contiguous slot for the full duration under a PostgreSQL transaction. Existing single-service appointments are backfilled by migration 006. Permanently deleting a service removes all bookings that include it, including multi-service bookings, following the store's existing deletion policy.

## Payment workflow (school demo)

PawCare supports **cash at store** and **manual bank transfer** (only if Admin configured a recipient in **Profile**). Booking creates one payment record using the backend-calculated amount; payment state is independent of booking completion.

1. **Cash:** Starts `unpaid`. Once money is physically received at the counter, **Admin** chooses **Xác nhận đã nhận tiền mặt**. Status becomes `paid`. No customer self-confirmation.
2. **Bank transfer:** Starts `awaiting_payment`. Customer sees a **VietQR Quick Link** containing the booking's saved recipient, amount and unique payment reference (where the configured bank is recognized), alongside manual transfer instructions. The QR image is loaded from `img.vietqr.io` and includes that bank/transaction information in the request; it is not hosted by PawCare. If an unsupported bank or image error occurs, manual instructions remain available. Customer chooses **Tôi đã chuyển khoản**, changing status to `pending_review`. Admin can choose **Xác nhận chuyển khoản (Demo)** to mark `paid`. This is a simulation only: PawCare **does not check actual bank balances**. Scanning the QR never marks a booking as paid.
3. Staff only views the payment status on accepted appointments assigned to them, and focuses on care work. Admin alone confirms cash/bank demo transfers and rejects bank transfer notices; PawCare does not provide a refund action. Customer cannot self-confirm.
4. API locks the appointment and payment within the same transaction, rejects duplicate confirmation, and records reviewer, time, method, old/new status and action in `role_audit_logs`.
5. Customers/Admin can cancel only unpaid bookings (`unpaid`, `awaiting_payment`, or already `void`). A booking already paid or awaiting reconciliation cannot be cancelled through PawCare because the application no longer supports refund workflows. Previously created `refund_required`/`refunded` entries remain in the database for accurate history, but there is no refund action. Any outstanding historical obligation must be handled outside the application.
6. Payment history lists are limited to Customer's own transactions or Admin's store-wide ledger. Staff sees only payment status/details on assigned accepted appointments, not the ledger or reconciliation actions. This is a **demo ledger**, not a payment gateway or bank verification. Do not present demo bank confirmations as proof that money arrived.

Migrations 009–013 contain the historical manual payment schema/state. They remain required for existing and fresh database migrations.

## Artwork direction

PawCare's large illustrations now use local SVGs depicting **care journals, stethoscopes, checklists, bath/spa tools, vaccination, dental care and operations reporting**, rather than dog/cat portraits or emoji. Navigation icons remain purposeful and accessible. Existing animal names/species are still shown as customer-owned data.

**Accounting safety:** permanent deletion of an account or service containing paid, pending-review or refund-related transactions is blocked so that accepted money and refund obligations are not silently erased. Admin must resolve such records using an appropriate retention/archival policy before any final deletion.

## Bank settings

Admin configures the receiving bank in **Profile**. Current configured bank details are stored in Neon, and each transfer booking preserves a snapshot of the account details at booking time.

**Demo constraint:** Admin clicking bank confirmation does not connect to or verify the bank. Do not use this demo flow for real payments without verification.
