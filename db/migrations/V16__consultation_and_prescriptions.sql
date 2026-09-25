-- V16__consultation_and_prescriptions.sql: Doctor Consultations, Prescriptions and Prescription Items
CREATE TABLE consultation (
    consultation_id UUID PRIMARY KEY,
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointment(appointment_id),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    doctor_id UUID NOT NULL REFERENCES doctor(doctor_id),
    chief_complaint TEXT,
    symptoms TEXT,
    clinical_notes TEXT,
    diagnosis TEXT,
    assessment TEXT,
    treatment_advice TEXT,
    follow_up_instructions TEXT,
    follow_up_date DATE,
    additional_notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE prescription (
    prescription_id UUID PRIMARY KEY,
    consultation_id UUID NOT NULL UNIQUE REFERENCES consultation(consultation_id),
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointment(appointment_id),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    doctor_id UUID NOT NULL REFERENCES doctor(doctor_id),
    prescription_number VARCHAR(32) NOT NULL UNIQUE,
    diagnosis TEXT,
    doctor_advice TEXT,
    follow_up_date DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'FINALIZED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE prescription_item (
    prescription_item_id UUID PRIMARY KEY,
    prescription_id UUID NOT NULL REFERENCES prescription(prescription_id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50),
    frequency VARCHAR(50) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    quantity VARCHAR(50),
    food_instruction VARCHAR(100),
    timing VARCHAR(100),
    special_instructions TEXT
);

CREATE INDEX idx_consultation_appointment ON consultation(appointment_id);
CREATE INDEX idx_consultation_patient ON consultation(patient_id);
CREATE INDEX idx_consultation_doctor ON consultation(doctor_id);
CREATE INDEX idx_prescription_patient ON prescription(patient_id);
CREATE INDEX idx_prescription_doctor ON prescription(doctor_id);
CREATE INDEX idx_prescription_appointment ON prescription(appointment_id);
