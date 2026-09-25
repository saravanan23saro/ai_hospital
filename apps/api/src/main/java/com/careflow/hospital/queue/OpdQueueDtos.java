package com.careflow.hospital.queue;

import jakarta.validation.constraints.NotNull;
import java.time.*;
import java.util.UUID;

public final class OpdQueueDtos {
    private OpdQueueDtos() {}

    public record WalkInRegister(
        @NotNull UUID doctorId,
        @NotNull UUID departmentId,
        @NotNull UUID patientId,
        UUID appointmentId
    ) {}

    public record TokenView(
        UUID tokenId,
        String tokenNumber,
        UUID doctorId,
        UUID departmentId,
        UUID patientId,
        LocalDate serviceDate,
        int sequenceNumber,
        String status,
        boolean isWalkIn,
        Instant calledAt,
        Instant completedAt,
        Instant createdAt
    ) {}

    public record QueuePosition(
        UUID tokenId,
        String tokenNumber,
        int position,
        int totalWaiting,
        int estimatedWaitMinutes,
        String status
    ) {}
}
