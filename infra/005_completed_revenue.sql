-- Revenue is recognized when a service is completed, not on its scheduled date.
-- Existing completed appointments use the last modified timestamp as a best-effort
-- historical completion date. New completions receive their exact time from the API.
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
UPDATE appointments
   SET completed_at = updated_at
 WHERE status = 'completed'
   AND completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_completed_revenue
  ON appointments(organization_id,completed_at)
  WHERE status='completed';
