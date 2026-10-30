-- Non-destructive single-store cutover.
-- Keep legacy tenant FK columns for backwards-compatible historical records.
-- This migration refuses to select/delete stores when >1 exists.
DO $$
DECLARE store_count integer; selected_store integer;
BEGIN
 SELECT COUNT(*) INTO store_count FROM organizations;
 IF store_count > 1 THEN
   RAISE EXCEPTION 'PawCare single-store migration requires exactly one organization. Back up DB and consolidate stores explicitly before upgrading. Found %.',store_count;
 END IF;
 IF store_count=0 THEN
   INSERT INTO organizations(name,slug,is_active) VALUES('PawCare','pawcare',TRUE) RETURNING id INTO selected_store;
 ELSE
   SELECT id INTO selected_store FROM organizations LIMIT 1;
 END IF;
 IF EXISTS(SELECT 1 FROM organizations WHERE id=selected_store AND is_active=FALSE) THEN
   UPDATE organizations SET is_active=TRUE WHERE id=selected_store;
 END IF;
 -- Users with active roles in the single store retain those roles.
 UPDATE users u SET role=m.role FROM organization_members m
 WHERE m.user_id=u.id AND m.organization_id=selected_store AND m.is_active=TRUE;
 -- Legacy platform Owner becomes a store Admin; existing account remains active.
 UPDATE users SET role='admin' WHERE role='owner';
 -- Old accounts not assigned to this store keep their credentials but become customers.
 -- Do not silently demote the converted original Owner: only reset legacy staff/admin
 -- where a historical (inactive) membership explicitly exists.
 UPDATE users u SET role='customer'
 WHERE u.role IN ('admin','staff') AND EXISTS(
  SELECT 1 FROM organization_members m WHERE m.user_id=u.id
  AND m.organization_id=selected_store AND m.is_active=FALSE
 );
 -- Backfill shop-specific staff profiles into the single-store profile table.
 INSERT INTO staff_profiles(user_id,specialty,bio)
 SELECT p.user_id,p.specialty,p.bio FROM organization_staff_profiles p
 WHERE p.organization_id=selected_store
 ON CONFLICT(user_id) DO UPDATE SET specialty=EXCLUDED.specialty,bio=EXCLUDED.bio;
 -- Store ID remains a legacy FK but clients are no longer allowed to select/switch stores.
 UPDATE sessions SET organization_id=selected_store;
END $$;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer','staff','admin'));
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_minutes_snapshot INTEGER;
UPDATE appointments SET duration_minutes_snapshot=
 GREATEST(1, ROUND(EXTRACT(EPOCH FROM (ends_at-starts_at))/60)::INTEGER)
 WHERE duration_minutes_snapshot IS NULL;
ALTER TABLE appointments ALTER COLUMN duration_minutes_snapshot SET NOT NULL;
ALTER TABLE appointments ADD CONSTRAINT appointment_duration_snapshot_positive CHECK(duration_minutes_snapshot>0);
ALTER TABLE care_records ADD COLUMN IF NOT EXISTS appointment_id INTEGER REFERENCES appointments(id);
CREATE INDEX IF NOT EXISTS idx_care_records_appointment_id ON care_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appt_staff_status_time ON appointments(staff_id,status,starts_at);
