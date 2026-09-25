package com.careflow.hospital.prescriptions;

import jakarta.validation.constraints.NotBlank;
import java.time.*;
import java.util.List;
import java.util.UUID;

public final class PrescriptionDtos {
    private PrescriptionDtos() {}

    public record MedicineItem(
        @NotBlank String medicineName,
        String genericName,
        @NotBlank String dosage,
        String route,
        @NotBlank String frequency,
        @NotBlank String duration,
        String quantity,
        String foodInstruction,
        String timing,
        String specialInstructions
    ) {}

    public record CreateRequest(
        UUID consultationId,
        UUID appointmentId,
        UUID patientId,
        String diagnosis,
        String doctorAdvice,
        LocalDate followUpDate,
        List<MedicineItem> medicines
    ) {}

    public record ItemView(
        UUID itemId,
        String medicineName,
        String genericName,
        String dosage,
        String route,
        String frequency,
        String duration,
        String quantity,
        String foodInstruction,
        String timing,
        String specialInstructions
    ) {}

    public record View(
        UUID prescriptionId,
        UUID consultationId,
        UUID appointmentId,
        UUID patientId,
        UUID doctorId,
        String prescriptionNumber,
        String diagnosis,
        String doctorAdvice,
        LocalDate followUpDate,
        String status,
        Instant createdAt,
        Instant updatedAt,
        List<ItemView> items,
        String doctorName,
        String departmentName,
        String patientName,
        String patientNumber
    ) {}
}
