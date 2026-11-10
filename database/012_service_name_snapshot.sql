-- Preserve the service name used when each appointment was booked.
ALTER TABLE appointment_services ADD COLUMN IF NOT EXISTS name_snapshot VARCHAR(120);
UPDATE appointment_services aps SET name_snapshot=s.name
 FROM services s WHERE aps.service_id=s.id AND aps.name_snapshot IS NULL;
-- Historical data receives its current name once; future bookings capture the original name.
