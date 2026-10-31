# PawCare Single-Store Cloud SaaS — Workflow and Roles

PawCare runs as one cloud-hosted application for **one pet-care store**, with shared PostgreSQL and the roles **Admin, Staff, Customer**. Multi-store and platform Owner screens have been removed from the operational UI. Internal legacy organization foreign keys remain to preserve history.

## Customer
1. Register/login, create a pet profile.
2. Choose service, available staff (or automatic assignment), date and time.
3. Backend validates schedule and reserves a real staff member in a transaction; appointment becomes `pending`.
4. View/cancel eligible appointments; see completed care results in history and pet profile.

## Admin
1. Log in as the initial Admin or existing migrated Admin.
2. Create/edit/disable services and invite Staff using a single-use link.
3. Review pending bookings; reassign staff if necessary and confirm.
4. View all customers and appointments. Can cancel eligible bookings and deactivate Staff only after active assignments are cleared.
5. View store-wide completed-service totals and booking reports.

## Staff
1. Accept an invitation and sign in.
2. Open Staff dashboard and assigned appointment queue (no store-wide customer list or revenue dashboard).
3. Start a confirmed appointment (`in_progress`).
4. Record actual care outcome; complete the appointment (`completed`). This also creates a linked care record for the pet.
5. Staff cannot confirm, cancel, or reassign appointments.

## State machine
- Customer: `pending → cancelled`, `confirmed → cancelled`.
- Admin: `pending → confirmed/cancelled`, `confirmed → cancelled`, `in_progress → cancelled`.
- Assigned Staff: `confirmed → in_progress → completed`.
- `completed` and `cancelled` are terminal.

## Safety / deployment
Run `npm run build`, `npm test` and `node --test tests/*.test.mjs` in CI. Back up Neon before migration. `database/004_single_store.sql` refuses upgrades when more than one organization exists; consolidate legacy data explicitly rather than deleting it. Do not merge/deploy to production until the migration and role mapping are validated against a separate restored database.
