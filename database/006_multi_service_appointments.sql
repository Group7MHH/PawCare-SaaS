-- A booking can contain several services while remaining one appointment.
-- Retain appointments.service_id (first service) for legacy API compatibility.
CREATE TABLE IF NOT EXISTS appointment_services (
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  position SMALLINT NOT NULL CHECK(position BETWEEN 0 AND 7),
  price_snapshot NUMERIC(12,2) NOT NULL CHECK(price_snapshot >= 0),
  duration_minutes_snapshot INTEGER NOT NULL CHECK(duration_minutes_snapshot > 0),
  PRIMARY KEY(appointment_id,service_id),
  UNIQUE(appointment_id,position)
);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service ON appointment_services(service_id,appointment_id);
-- Existing appointments continue to display and contribute revenue unchanged.
INSERT INTO appointment_services(appointment_id,service_id,position,price_snapshot,duration_minutes_snapshot)
  SELECT id,service_id,0,price_snapshot,duration_minutes_snapshot
  FROM appointments
  ON CONFLICT (appointment_id,service_id) DO NOTHING;
