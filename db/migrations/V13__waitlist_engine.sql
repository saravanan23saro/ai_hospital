-- V13__waitlist_engine.sql: Standby waitlist table and indexes
CREATE TABLE waitlist_entry (
    waitlist_id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    doctor_id UUID REFERENCES doctor(doctor_id),
    department_id UUID NOT NULL REFERENCES department(department_id),
    requested_date DATE NOT NULL,
    preferred_start_time TIME,
    preferred_end_time TIME,
    urgency_level INT NOT NULL DEFAULT 3,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    offered_appointment_id UUID REFERENCES appointment(appointment_id),
    offer_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waitlist_dept_date_status ON waitlist_entry(department_id, requested_date, status);
CREATE INDEX idx_waitlist_doctor_date_status ON waitlist_entry(doctor_id, requested_date, status);
CREATE INDEX idx_waitlist_patient ON waitlist_entry(patient_id);
