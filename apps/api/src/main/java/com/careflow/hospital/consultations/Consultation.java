package com.careflow.hospital.consultations;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "consultation")
public class Consultation {
    @Id
    @Column(name = "consultation_id")
    private UUID id;

    @Column(name = "appointment_id", nullable = false, unique = true)
    private UUID appointmentId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "doctor_id", nullable = false)
    private UUID doctorId;

    @Column(name = "chief_complaint", columnDefinition = "text")
    private String chiefComplaint;

    @Column(columnDefinition = "text")
    private String symptoms;

    @Column(name = "clinical_notes", columnDefinition = "text")
    private String clinicalNotes;

    @Column(columnDefinition = "text")
    private String diagnosis;

    @Column(columnDefinition = "text")
    private String assessment;

    @Column(name = "treatment_advice", columnDefinition = "text")
    private String treatmentAdvice;

    @Column(name = "follow_up_instructions", columnDefinition = "text")
    private String followUpInstructions;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "additional_notes", columnDefinition = "text")
    private String additionalNotes;

    @Column(nullable = false)
    private String status;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Consultation() {}

    public Consultation(UUID appointmentId, UUID patientId, UUID doctorId) {
        this.id = UUID.randomUUID();
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.status = "IN_PROGRESS";
        this.startedAt = Instant.now();
        this.createdAt = this.startedAt;
        this.updatedAt = this.startedAt;
    }

    public void updateNotes(String chiefComplaint, String symptoms, String clinicalNotes, String diagnosis, String assessment, String treatmentAdvice, String followUpInstructions, LocalDate followUpDate, String additionalNotes) {
        if ("COMPLETED".equals(this.status)) {
            throw new IllegalStateException("Cannot update a completed consultation.");
        }
        if (chiefComplaint != null) this.chiefComplaint = chiefComplaint;
        if (symptoms != null) this.symptoms = symptoms;
        if (clinicalNotes != null) this.clinicalNotes = clinicalNotes;
        if (diagnosis != null) this.diagnosis = diagnosis;
        if (assessment != null) this.assessment = assessment;
        if (treatmentAdvice != null) this.treatmentAdvice = treatmentAdvice;
        if (followUpInstructions != null) this.followUpInstructions = followUpInstructions;
        if (followUpDate != null) this.followUpDate = followUpDate;
        if (additionalNotes != null) this.additionalNotes = additionalNotes;
        this.updatedAt = Instant.now();
    }

    public void complete() {
        if ("COMPLETED".equals(this.status)) {
            throw new IllegalStateException("Consultation has already been completed.");
        }
        this.status = "COMPLETED";
        this.completedAt = Instant.now();
        this.updatedAt = this.completedAt;
    }

    public UUID getId() { return id; }
    public UUID getAppointmentId() { return appointmentId; }
    public UUID getPatientId() { return patientId; }
    public UUID getDoctorId() { return doctorId; }
    public String getChiefComplaint() { return chiefComplaint; }
    public String getSymptoms() { return symptoms; }
    public String getClinicalNotes() { return clinicalNotes; }
    public String getDiagnosis() { return diagnosis; }
    public String getAssessment() { return assessment; }
    public String getTreatmentAdvice() { return treatmentAdvice; }
    public String getFollowUpInstructions() { return followUpInstructions; }
    public LocalDate getFollowUpDate() { return followUpDate; }
    public String getAdditionalNotes() { return additionalNotes; }
    public String getStatus() { return status; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
