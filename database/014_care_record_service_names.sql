-- Retain the booked service names on each care-history entry.
-- This is independent of later service renames or removal of appointments.
ALTER TABLE care_records ADD COLUMN IF NOT EXISTS service_names_snapshot TEXT;

-- Backfill only linked historical entries; never guess names for manual notes.
UPDATE care_records AS cr
SET service_names_snapshot = booked.names
FROM (
  SELECT aps.appointment_id,
         string_agg(COALESCE(aps.name_snapshot,s.name),' + ' ORDER BY aps.position) AS names
  FROM appointment_services aps
  JOIN services s ON s.id=aps.service_id
  GROUP BY aps.appointment_id
) AS booked
WHERE cr.appointment_id=booked.appointment_id
  AND cr.service_names_snapshot IS NULL;
