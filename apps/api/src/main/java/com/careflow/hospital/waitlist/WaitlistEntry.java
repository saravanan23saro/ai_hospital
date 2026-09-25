package com.careflow.hospital.waitlist;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "waitlist_entry")
public class WaitlistEntry {
    @Id
    @Column(name = "waitlist_id")
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "doctor_id")
    private UUID doctorId;

    @Column(name = "department_id", nullable = false)
    private UUID departmentId;

    @Column(name = "requested_date", nullable = false)
    private LocalDate requestedDate;

    @Column(name = "preferred_start_time")
    private LocalTime preferredStartTime;

    @Column(name = "preferred_end_time")
    private LocalTime preferredEndTime;

    @Column(name = "urgency_level", nullable = false)
    private int urgencyLevel;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(nullable = false)
    private String status;

    @Column(name = "offered_appointment_id")
    private UUID offeredAppointmentId;

    @Column(name = "offer_expires_at")
    private Instant offerExpiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected WaitlistEntry() {}

    public WaitlistEntry(UUID patientId, UUID doctorId, UUID departmentId, LocalDate requestedDate, LocalTime preferredStartTime, LocalTime preferredEndTime, int urgencyLevel, String notes) {
        this.id = UUID.randomUUID();
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.departmentId = departmentId;
        this.requestedDate = requestedDate;
        this.preferredStartTime = preferredStartTime;
        this.preferredEndTime = preferredEndTime;
        this.urgencyLevel = urgencyLevel;
        this.notes = notes;
        this.status = "WAITING";
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void updatePreferences(LocalTime preferredStartTime, LocalTime preferredEndTime, int urgencyLevel, String notes) {
        if (preferredStartTime != null) this.preferredStartTime = preferredStartTime;
        if (preferredEndTime != null) this.preferredEndTime = preferredEndTime;
        if (urgencyLevel > 0) this.urgencyLevel = urgencyLevel;
        if (notes != null) this.notes = notes;
        this.updatedAt = Instant.now();
    }

    public void makeOffer(UUID appointmentId, Instant expiresAt) {
        if (!"WAITING".equals(this.status)) {
            throw new IllegalStateException("Only WAITING entries can receive a match offer.");
        }
        this.offeredAppointmentId = appointmentId;
        this.offerExpiresAt = expiresAt;
        this.status = "MATCHED";
        this.updatedAt = Instant.now();
    }

    public void acceptOffer() {
        if (!"MATCHED".equals(this.status) || (offerExpiresAt != null && !offerExpiresAt.isAfter(Instant.now()))) {
            throw new IllegalStateException("Offer is no longer active or valid.");
        }
        this.status = "ACCEPTED";
        this.updatedAt = Instant.now();
    }

    public void declineOffer() {
        if (!"MATCHED".equals(this.status)) {
            throw new IllegalStateException("Only MATCHED entries can be declined.");
        }
        this.status = "DECLINED";
        this.updatedAt = Instant.now();
    }

    public void cancel() {
        this.status = "CANCELLED";
        this.updatedAt = Instant.now();
    }

    public void expireIfPassed() {
        if ("MATCHED".equals(this.status) && offerExpiresAt != null && !offerExpiresAt.isAfter(Instant.now())) {
            this.status = "EXPIRED";
            this.updatedAt = Instant.now();
        }
    }

    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public UUID getDoctorId() { return doctorId; }
    public UUID getDepartmentId() { return departmentId; }
    public LocalDate getRequestedDate() { return requestedDate; }
    public LocalTime getPreferredStartTime() { return preferredStartTime; }
    public LocalTime getPreferredEndTime() { return preferredEndTime; }
    public int getUrgencyLevel() { return urgencyLevel; }
    public String getNotes() { return notes; }
    public String getStatus() { return status; }
    public UUID getOfferedAppointmentId() { return offeredAppointmentId; }
    public Instant getOfferExpiresAt() { return offerExpiresAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
