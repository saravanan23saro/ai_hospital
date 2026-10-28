-- V18: Add Staff Member profile table and doctor profile field enhancements
CREATE TABLE IF NOT EXISTS staff_member (
  staff_id uuid PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES app_user(user_id) ON DELETE CASCADE,
  employee_id varchar(40) NOT NULL UNIQUE,
  full_name varchar(160) NOT NULL,
  phone varchar(40),
  gender varchar(40),
  date_of_birth date,
  department_id uuid REFERENCES department(department_id),
  staff_type varchar(60) NOT NULL,
  designation varchar(100),
  joining_date date DEFAULT CURRENT_DATE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_member_department_idx ON staff_member(department_id);
CREATE INDEX IF NOT EXISTS staff_member_active_idx ON staff_member(active);

ALTER TABLE doctor ADD COLUMN IF NOT EXISTS phone varchar(40);
ALTER TABLE doctor ADD COLUMN IF NOT EXISTS gender varchar(40);
ALTER TABLE doctor ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE doctor ADD COLUMN IF NOT EXISTS consultation_fee bigint DEFAULT 50000;
