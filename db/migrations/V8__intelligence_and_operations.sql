CREATE TABLE recommendation_feedback (
  feedback_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(user_id),
  candidate_id varchar(120) NOT NULL,
  model_version varchar(80) NOT NULL,
  accepted boolean NOT NULL,
  comment varchar(500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX recommendation_feedback_model_idx ON recommendation_feedback(model_version, created_at DESC);

CREATE TABLE notification (
  notification_id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES app_user(user_id),
  channel varchar(20) NOT NULL CHECK(channel IN ('IN_APP','EMAIL','SMS')),
  subject varchar(160) NOT NULL,
  body varchar(1000) NOT NULL,
  status varchar(20) NOT NULL CHECK(status IN ('PENDING','SENT','READ','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX notification_user_idx ON notification(user_id, created_at DESC);

CREATE TABLE invoice (
  invoice_id uuid PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patient(patient_id),
  appointment_id uuid REFERENCES appointment(appointment_id),
  amount_minor bigint NOT NULL CHECK(amount_minor >= 0),
  currency char(3) NOT NULL,
  status varchar(20) NOT NULL CHECK(status IN ('DRAFT','ISSUED','PAID','VOID')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE clinical_record (
  record_id uuid PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patient(patient_id),
  appointment_id uuid REFERENCES appointment(appointment_id),
  author_id uuid NOT NULL REFERENCES app_user(user_id),
  record_type varchar(40) NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clinical_record_patient_idx ON clinical_record(patient_id, created_at DESC);

CREATE TABLE lab_order (
  lab_order_id uuid PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patient(patient_id),
  ordered_by uuid NOT NULL REFERENCES app_user(user_id),
  test_code varchar(80) NOT NULL,
  status varchar(20) NOT NULL CHECK(status IN ('ORDERED','COLLECTED','PROCESSING','COMPLETED','CANCELLED')),
  result_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lab_order_patient_idx ON lab_order(patient_id, created_at DESC);

CREATE TABLE emergency_case (
  emergency_case_id uuid PRIMARY KEY,
  patient_id uuid REFERENCES patient(patient_id),
  opened_by uuid NOT NULL REFERENCES app_user(user_id),
  acuity smallint NOT NULL CHECK(acuity BETWEEN 1 AND 5),
  status varchar(20) NOT NULL CHECK(status IN ('OPEN','ASSESSED','ADMITTED','DISCHARGED','CLOSED')),
  presenting_complaint varchar(500) NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX emergency_active_idx ON emergency_case(status, acuity, opened_at) WHERE status NOT IN ('DISCHARGED','CLOSED');

CREATE TABLE capacity_snapshot (
  snapshot_id uuid PRIMARY KEY,
  department_id uuid NOT NULL REFERENCES department(department_id),
  captured_by uuid NOT NULL REFERENCES app_user(user_id),
  staffed_beds integer NOT NULL CHECK(staffed_beds >= 0),
  occupied_beds integer NOT NULL CHECK(occupied_beds >= 0 AND occupied_beds <= staffed_beds),
  waiting_patients integer NOT NULL CHECK(waiting_patients >= 0),
  captured_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX capacity_department_idx ON capacity_snapshot(department_id, captured_at DESC);
