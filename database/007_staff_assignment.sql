-- PawCare: Staff accepts assigned bookings; Admin handles only assignment exceptions.
-- Existing appointments and appointment_services remain intact.
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS needs_admin_attention BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assignment_note VARCHAR(240);

CREATE TABLE IF NOT EXISTS appointment_staff_declines (
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  declined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (appointment_id,staff_id)
);
CREATE INDEX IF NOT EXISTS idx_appointments_assignment_attention
  ON appointments(organization_id,starts_at) WHERE needs_admin_attention=TRUE AND status='pending';

-- Backfill any historical unassigned pending requests for Admin follow-up.
UPDATE appointments
SET needs_admin_attention=TRUE,
    assignment_note='Cần phân công nhân viên'
WHERE status='pending' AND staff_id IS NULL AND needs_admin_attention=FALSE;
