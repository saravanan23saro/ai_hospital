package com.careflow.hospital.queue;

import jakarta.persistence.*;
import java.time.*;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "opd_token")
public class OpdToken {
    @Id
    @Column(name = "token_id")
    private UUID id;

    @Column(name = "token_number", nullable = false)
    private String tokenNumber;

    @Column(name = "doctor_id", nullable = false)
    private UUID doctorId;

    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "appointment_id")
    private UUID appointmentId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "sequence_number", nullable = false)
    private int sequenceNumber;

    @Column(nullable = false)
    private String status;

    @Column(name = "is_walk_in", nullable = false)
    private boolean isWalkIn;

    @Column(name = "estimated_start_time")
    private Instant estimatedStartTime;

    @Column(name = "called_at")
    private Instant calledAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected OpdToken() {}

    public OpdToken(UUID doctorId, UUID departmentId, UUID patientId, UUID appointmentId, LocalDate serviceDate, int sequenceNumber, boolean isWalkIn) {
        this.id = UUID.randomUUID();
        this.doctorId = doctorId;
        this.departmentId = departmentId;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.serviceDate = serviceDate;
        this.sequenceNumber = sequenceNumber;
        this.tokenNumber = String.format("CARD-%03d", sequenceNumber);
        this.isWalkIn = isWalkIn;
        this.status = "WAITING";
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void call() {
        if (!Set.of("WAITING", "SKIPPED").contains(this.status)) {
            throw new IllegalStateException("Only WAITING or SKIPPED tokens can be called.");
        }
        this.status = "CALLED";
        this.calledAt = Instant.now();
        this.updatedAt = this.calledAt;
    }

    public void recall() {
        if (!"CALLED".equals(this.status)) {
            throw new IllegalStateException("Only CALLED tokens can be recalled.");
        }
        this.calledAt = Instant.now();
        this.updatedAt = this.calledAt;
    }

    public void skip() {
        if (!"CALLED".equals(this.status)) {
            throw new IllegalStateException("Only CALLED tokens can be skipped.");
        }
        this.status = "SKIPPED";
        this.updatedAt = Instant.now();
    }

    public void complete() {
        if (!Set.of("CALLED", "IN_SERVICE").contains(this.status)) {
            throw new IllegalStateException("Only CALLED or IN_SERVICE tokens can be completed.");
        }
        this.status = "COMPLETED";
        this.completedAt = Instant.now();
        this.updatedAt = this.completedAt;
    }

    public void cancel() {
        this.status = "CANCELLED";
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getTokenNumber() { return tokenNumber; }
    public UUID getDoctorId() { return doctorId; }
    public UUID getDepartmentId() { return departmentId; }
    public UUID getPatientId() { return patientId; }
    public UUID getAppointmentId() { return appointmentId; }
    public LocalDate getServiceDate() { return serviceDate; }
    public int getSequenceNumber() { return sequenceNumber; }
    public String getStatus() { return status; }
    public boolean isWalkIn() { return isWalkIn; }
    public Instant getEstimatedStartTime() { return estimatedStartTime; }
    public Instant getCalledAt() { return calledAt; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
