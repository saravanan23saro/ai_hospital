package com.careflow.hospital.consultations;

import com.careflow.hospital.prescriptions.PrescriptionDtos;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.*;
import java.util.List;
import java.util.UUID;

public final class ConsultationDtos {
    private ConsultationDtos() {}

    public record SaveNotesRequest(
        String chiefComplaint,
        String symptoms,
        String clinicalNotes,
        String diagnosis,
        String assessment,
        String treatmentAdvice,
        String followUpInstructions,
        LocalDate followUpDate,
        String additionalNotes
    ) {}

    public record CompleteRequest(
        SaveNotesRequest notes,
        @Valid List<PrescriptionDtos.MedicineItem> medicines,
        String doctorAdvice,
        LocalDate followUpDate,
        String patientName,
        LocalDate patientDateOfBirth
    ) {}

    public record View(
        UUID consultationId,
        UUID appointmentId,
        UUID patientId,
        UUID doctorId,
        String appointmentNumber,
        String patientNumber,
        String patientName,
        String patientPhone,
        LocalDate patientDateOfBirth,
        String patientGender,
        String bloodGroup,
        String allergies,
        String medicalConditions,
        String chiefComplaint,
        String symptoms,
        String clinicalNotes,
        String diagnosis,
        String assessment,
        String treatmentAdvice,
        String followUpInstructions,
        LocalDate followUpDate,
        String additionalNotes,
        String status,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt,
        PrescriptionDtos.View prescription
    ) {}
}
