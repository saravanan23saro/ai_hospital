CREATE TABLE doctor_schedule (
  schedule_id uuid PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
  starts_at time NOT NULL,
  ends_at time NOT NULL,
  slot_duration_minutes integer NOT NULL CHECK(slot_duration_minutes BETWEEN 5 AND 240),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK(ends_at > starts_at),
  UNIQUE(doctor_id, day_of_week, starts_at)
);
CREATE INDEX doctor_schedule_lookup_idx ON doctor_schedule(doctor_id, day_of_week) WHERE active;

CREATE TABLE doctor_schedule_exception (
  exception_id uuid PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES doctor(doctor_id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  exception_type varchar(20) NOT NULL CHECK(exception_type IN ('UNAVAILABLE','AVAILABLE')),
  starts_at time,
  ends_at time,
  slot_duration_minutes integer CHECK(slot_duration_minutes BETWEEN 5 AND 240),
  reason varchar(300),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK((starts_at IS NULL AND ends_at IS NULL) OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)),
  CHECK(exception_type <> 'AVAILABLE' OR (starts_at IS NOT NULL AND slot_duration_minutes IS NOT NULL)),
  UNIQUE(doctor_id, exception_date, exception_type, starts_at)
);
CREATE INDEX doctor_exception_lookup_idx ON doctor_schedule_exception(doctor_id, exception_date);
