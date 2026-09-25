-- Enforce database-level exclusion constraint preventing overlapping active appointments for the same doctor
ALTER TABLE appointment ADD CONSTRAINT no_overlapping_active_appointment
  EXCLUDE USING gist (doctor_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
  WHERE (status IN ('REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'));
