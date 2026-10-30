# PawCare — Single-store cloud SaaS

PawCare is a cloud-hosted pet-care management application for **one store**, with three roles: **Admin, Staff, Customer**. Frontend React/Vite, backend Express/TypeScript, PostgreSQL on Neon, deployed as one Node Web Service on Render. No Docker required.

## Workflow
1. Customer registers, manages pets, checks service/time availability and books.
2. The server reserves an available staff member; appointment begins in `pending`.
3. Admin confirms appointments and may reassign staff.
4. Assigned Staff starts work (`in_progress`), records the result, then completes it.
5. Customer sees appointment history and Admin sees store-wide metrics.

## Roles
- Admin: services, staff invitations/activation, assignments, customers, revenue.
- Staff: only assigned appointments and their customer/pet details; record care results.
- Customer: own pets, own bookings, cancellation before work begins.

## Development
Requires Node.js >=22 and a **development** PostgreSQL database.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
# Set DATABASE_URL and APP_ORIGIN in apps/api/.env
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
Migrations 001–004 run during startup. Migration 004 is **non-destructive** and refuses conversion if **more than one organization** exists. In that case, back up and explicitly consolidate historical data before enabling single-store mode. Legacy organization columns remain as foreign keys internally, but there is **no multi-store UI or owner role**. Do not deploy into production without verifying backup, build, tests, and migration in a separate database first.

## Verification
```powershell
npm.cmd run build
npm.cmd run test
node --test tests/*.test.mjs
```

The original project was MVP; production billing, payment, messaging, password recovery and full end-to-end validation are still out of scope.
