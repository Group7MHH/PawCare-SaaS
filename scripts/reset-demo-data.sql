-- ONE-TIME MANUAL DEMO RESET. DO NOT add to startup migrations or GitHub Actions.
-- Run in the PawCare Neon database SQL editor after taking a backup.
-- Scope: delete booking/pet/care/payment demo data and old invitations/audit events.
-- KEEP: users (accounts, password hashes, roles), staff profiles/memberships,
--       services and organization, bank receiving configuration, sessions,
--       and schema_migrations. This does NOT delete any account or service.
BEGIN;
SELECT pg_advisory_xact_lock(42371,0);

DO $guard$
BEGIN
 IF (SELECT COUNT(*) FROM organizations) <> 1 THEN
  RAISE EXCEPTION 'Reset cancelled: expected exactly one PawCare organization';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM users WHERE role='admin') THEN
  RAISE EXCEPTION 'Reset cancelled: no Admin account found';
 END IF;
END $guard$;

-- Clear dependent demo rows first, without CASCADE on whole schemas.
DELETE FROM role_audit_logs;
DELETE FROM invitations;
DELETE FROM care_records;
DELETE FROM payments;
DELETE FROM appointment_staff_declines;
DELETE FROM appointment_services;
DELETE FROM appointments;
DELETE FROM pets;

-- New demo bookings and pets start at ID 1; existing accounts/services keep IDs.
ALTER TABLE care_records ALTER COLUMN id RESTART WITH 1;
ALTER TABLE payments ALTER COLUMN id RESTART WITH 1;
ALTER TABLE appointments ALTER COLUMN id RESTART WITH 1;
ALTER TABLE pets ALTER COLUMN id RESTART WITH 1;
ALTER TABLE invitations ALTER COLUMN id RESTART WITH 1;
ALTER TABLE role_audit_logs ALTER COLUMN id RESTART WITH 1;

DO $verify$
BEGIN
 IF EXISTS(SELECT 1 FROM appointments) OR EXISTS(SELECT 1 FROM pets) OR
    EXISTS(SELECT 1 FROM care_records) OR EXISTS(SELECT 1 FROM payments) OR
    EXISTS(SELECT 1 FROM appointment_services) OR EXISTS(SELECT 1 FROM appointment_staff_declines) THEN
  RAISE EXCEPTION 'Reset verification failed; transaction will roll back';
 END IF;
END $verify$;
COMMIT;

-- Verification (read only): these counts should be 0 for demo data.
SELECT
 (SELECT COUNT(*) FROM users) AS accounts_kept,
 (SELECT COUNT(*) FROM services) AS services_kept,
 (SELECT COUNT(*) FROM appointments) AS appointments_left,
 (SELECT COUNT(*) FROM pets) AS pets_left,
 (SELECT COUNT(*) FROM payments) AS payments_left,
 (SELECT COUNT(*) FROM care_records) AS care_records_left;
