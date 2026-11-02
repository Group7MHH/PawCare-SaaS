-- Non-destructive index for the shared Staff pickup queue.
-- Historical assigned bookings and existing status values are preserved.
CREATE INDEX IF NOT EXISTS idx_appointments_staff_pool
 ON appointments(organization_id,starts_at)
 WHERE staff_id IS NULL AND status='pending';
