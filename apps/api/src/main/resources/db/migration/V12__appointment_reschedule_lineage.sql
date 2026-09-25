ALTER TABLE appointment
  ADD COLUMN rescheduled_from_appointment_id uuid REFERENCES appointment(appointment_id),
  ADD COLUMN rescheduled_to_appointment_id uuid REFERENCES appointment(appointment_id);

CREATE UNIQUE INDEX appointment_rescheduled_from_idx
  ON appointment(rescheduled_from_appointment_id)
  WHERE rescheduled_from_appointment_id IS NOT NULL;

CREATE UNIQUE INDEX appointment_rescheduled_to_idx
  ON appointment(rescheduled_to_appointment_id)
  WHERE rescheduled_to_appointment_id IS NOT NULL;
