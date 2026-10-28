CREATE TABLE slot_reservation (
  reservation_id uuid PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status varchar(20) NOT NULL CHECK(status IN ('ACTIVE','CONSUMED','EXPIRED','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(ends_at > starts_at)
);
ALTER TABLE slot_reservation ADD CONSTRAINT no_overlapping_active_reservation
  EXCLUDE USING gist (doctor_id WITH =, tstzrange(starts_at,ends_at,'[)') WITH &&)
  WHERE (status='ACTIVE');
CREATE INDEX reservation_patient_idx ON slot_reservation(patient_id, created_at DESC);
CREATE INDEX reservation_expiry_idx ON slot_reservation(expires_at) WHERE status='ACTIVE';
