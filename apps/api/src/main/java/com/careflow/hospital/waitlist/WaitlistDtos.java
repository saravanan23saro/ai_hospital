package com.careflow.hospital.waitlist;

import jakarta.validation.constraints.*;
import java.time.*;
import java.util.UUID;

public final class WaitlistDtos {
    private WaitlistDtos() {}

    public record Join(
        @NotNull UUID departmentId,
        UUID doctorId,
        @NotNull LocalDate requestedDate,
        LocalTime preferredStartTime,
        LocalTime preferredEndTime,
        @Min(1) @Max(5) int urgencyLevel,
        @Size(max = 500) String notes
    ) {}

    public record UpdatePreferences(
        LocalTime preferredStartTime,
        LocalTime preferredEndTime,
        @Min(1) @Max(5) int urgencyLevel,
        @Size(max = 500) String notes
    ) {}

    public record View(
        UUID waitlistId,
        UUID patientId,
        UUID doctorId,
        UUID departmentId,
        LocalDate requestedDate,
        LocalTime preferredStartTime,
        LocalTime preferredEndTime,
        int urgencyLevel,
        String notes,
        String status,
        UUID offeredAppointmentId,
        Instant offerExpiresAt,
        Instant createdAt
    ) {}
}
