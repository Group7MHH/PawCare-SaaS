# PawCare — Single-store cloud SaaS (target architecture)

## Scope
One pet-care store, one centrally hosted PostgreSQL database, three application roles: Admin, Staff and Customer. Retain React/Vite, Node/Express, Render and Neon. SaaS delivery does **not** require multi-tenancy.

## Business workflow
Customer signs up, manages pets, chooses service and available time; server reserves a real staff member and creates a pending appointment. Admin reviews/confirms/assigns, Staff starts the confirmed job, records its result, and completes it. Customer reads the result; Admin tracks operations. Cancellation before work begins must release the slot.

## Migration plan — NOT YET EXECUTED
1. Back up Neon/PostgreSQL and record counts/ownership by organization.
2. Require explicit selection of the one store to keep if legacy data has multiple organizations. Never silently delete other organizations' data.
3. Reconcile global `users.role` with `organization_members` for that store; resolve conflicting cross-store roles and historical Owner accounts deliberately.
4. Migrate staff specialties from `organization_staff_profiles` into `staff_profiles`, and ensure all appointments/services/care records belong to the selected store.
5. Introduce a versioned, transactional migration; remove tenant keys only **after** all API and UI queries are rewritten and tested.
6. Keep one administrator bootstrap pathway and invitation-based staff enrollment; remove platform Owner and organization-switching UI/routes.
7. Test signup, authorization, double-booking, state transitions, reassignments, deactivation, historic record visibility, backups and Render deployment against a separate test database.

## Incremental work in this branch
- Separate allowed Staff transitions from Admin transitions.
- Improve automatic assignment and available-slot responses when customer chooses any staff member.
- Restrict staff customer/pet information to assigned appointments.
- Narrow Staff navigation and add transition unit tests.

**Important:** This branch is an intermediate workflow hardening change, not the completed single-store conversion. Do not deploy until reviewed and tests pass. Current tenant/Owner structures remain and require subsequent migration.
