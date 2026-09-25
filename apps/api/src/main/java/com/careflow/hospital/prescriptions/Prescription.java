package com.careflow.hospital.prescriptions;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "prescription")
public class Prescription {
    @Id
    @Column(name = "prescription_id")
    private UUID id;

    @Column(name = "consultation_id", nullable = false, unique = true)
    private UUID consultationId;

    @Column(name = "appointment_id", nullable = false, unique = true)
    private UUID appointmentId;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "doctor_id", nullable = false)
    private UUID doctorId;

    @Column(name = "prescription_number", nullable = false, unique = true)
    private String prescriptionNumber;

    @Column(columnDefinition = "text")
    private String diagnosis;

    @Column(name = "doctor_advice", columnDefinition = "text")
    private String doctorAdvice;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PrescriptionItem> items = new ArrayList<>();

    protected Prescription() {}

    public Prescription(UUID consultationId, UUID appointmentId, UUID patientId, UUID doctorId, String diagnosis, String doctorAdvice, LocalDate followUpDate) {
        this.id = UUID.randomUUID();
        this.consultationId = consultationId;
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.doctorId = doctorId;
        this.prescriptionNumber = "RX-" + id.toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT);
        this.diagnosis = diagnosis;
        this.doctorAdvice = doctorAdvice;
        this.followUpDate = followUpDate;
        this.status = "FINALIZED";
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void addItem(PrescriptionItem item) {
        item.setPrescription(this);
        this.items.add(item);
    }

    public void updateDetails(String diagnosis, String doctorAdvice, LocalDate followUpDate) {
        this.diagnosis = diagnosis;
        this.doctorAdvice = doctorAdvice;
        this.followUpDate = followUpDate;
        this.updatedAt = Instant.now();
    }

    public void clearItems() {
        this.items.clear();
    }

    public UUID getId() { return id; }
    public UUID getConsultationId() { return consultationId; }
    public UUID getAppointmentId() { return appointmentId; }
    public UUID getPatientId() { return patientId; }
    public UUID getDoctorId() { return doctorId; }
    public String getPrescriptionNumber() { return prescriptionNumber; }
    public String getDiagnosis() { return diagnosis; }
    public String getDoctorAdvice() { return doctorAdvice; }
    public LocalDate getFollowUpDate() { return followUpDate; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<PrescriptionItem> getItems() { return Collections.unmodifiableList(items); }
}
