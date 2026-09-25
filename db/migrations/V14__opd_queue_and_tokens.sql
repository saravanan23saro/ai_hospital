-- V14__opd_queue_and_tokens.sql: OPD Virtual Queue and Walk-in Tokens
CREATE TABLE opd_token (
    token_id UUID PRIMARY KEY,
    token_number VARCHAR(30) NOT NULL,
    doctor_id UUID NOT NULL REFERENCES doctor(doctor_id),
    department_id UUID NOT NULL REFERENCES department(department_id),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    appointment_id UUID REFERENCES appointment(appointment_id),
    service_date DATE NOT NULL,
    sequence_number INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    is_walk_in BOOLEAN NOT NULL DEFAULT true,
    estimated_start_time TIMESTAMP WITH TIME ZONE,
    called_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_opd_doctor_date_seq UNIQUE(doctor_id, service_date, sequence_number)
);

CREATE INDEX idx_opd_doctor_date_status ON opd_token(doctor_id, service_date, status);
CREATE INDEX idx_opd_patient ON opd_token(patient_id);
