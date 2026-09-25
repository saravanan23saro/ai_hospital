CREATE TABLE user_role (
  user_id uuid NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  role varchar(20) NOT NULL CHECK (role IN ('PATIENT','DOCTOR','ADMIN','STAFF')),
  PRIMARY KEY (user_id, role)
);
CREATE TABLE refresh_session (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(user_id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_session_user_idx ON refresh_session(user_id, expires_at);
ALTER TABLE patient ADD COLUMN phone varchar(40);
ALTER TABLE patient ADD COLUMN gender varchar(40);
ALTER TABLE patient ADD COLUMN address text;
ALTER TABLE patient ADD COLUMN emergency_contact varchar(200);
ALTER TABLE patient ADD COLUMN preferred_language varchar(60);
ALTER TABLE patient ADD COLUMN profile_complete boolean NOT NULL DEFAULT false;
CREATE TABLE doctor_application (
  application_id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES app_user(user_id),
  full_name varchar(160) NOT NULL,
  specialization varchar(120) NOT NULL,
  department_id uuid NOT NULL REFERENCES department(department_id),
  qualifications text NOT NULL,
  experience_years integer NOT NULL CHECK(experience_years >= 0 AND experience_years <= 80),
  license_number varchar(100) NOT NULL UNIQUE,
  status varchar(20) NOT NULL CHECK(status IN ('PENDING','APPROVED','REJECTED')),
  reviewed_by uuid REFERENCES app_user(user_id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX doctor_application_status_idx ON doctor_application(status, created_at);
