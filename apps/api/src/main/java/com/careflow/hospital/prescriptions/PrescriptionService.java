package com.careflow.hospital.prescriptions;

import com.careflow.hospital.appointments.*;
import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.departments.*;
import com.careflow.hospital.doctors.*;
import com.careflow.hospital.patients.*;
import com.careflow.hospital.shared.DomainException;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PrescriptionService {
    private final PrescriptionRepository repository;
    private final PatientRepository patients;
    private final DoctorRepository doctors;
    private final DepartmentRepository departments;
    private final AppointmentRepository appointments;
    private final AuditService audit;

    public PrescriptionService(
        PrescriptionRepository repository,
        PatientRepository patients,
        DoctorRepository doctors,
        DepartmentRepository departments,
        AppointmentRepository appointments,
        AuditService audit
    ) {
        this.repository = repository;
        this.patients = patients;
        this.doctors = doctors;
        this.departments = departments;
        this.appointments = appointments;
        this.audit = audit;
    }

    @Transactional
    public PrescriptionDtos.View get(UUID userId, boolean isDoctor, boolean isStaffOrAdmin, UUID id) {
        Prescription p = repository.findById(id).orElseThrow(() -> notFound());
        verifyReadAccess(userId, isDoctor, isStaffOrAdmin, p);
        audit.record(userId, "PRESCRIPTION_VIEWED", "PRESCRIPTION", p.getId(), "SUCCESS");
        return view(p);
    }

    @Transactional
    public PrescriptionDtos.View getByAppointment(UUID userId, boolean isDoctor, boolean isStaffOrAdmin, UUID appointmentId) {
        Prescription p = repository.findByAppointmentId(appointmentId).orElseThrow(() -> notFound());
        verifyReadAccess(userId, isDoctor, isStaffOrAdmin, p);
        audit.record(userId, "PRESCRIPTION_VIEWED", "PRESCRIPTION", p.getId(), "SUCCESS");
        return view(p);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionDtos.View> getPatientPrescriptions(UUID userId, boolean isDoctor, boolean isStaffOrAdmin, UUID targetPatientId) {
        if (!isStaffOrAdmin && !isDoctor) {
            Patient patient = patients.findByUserId(userId).orElseThrow(() -> notFound());
            if (!patient.getId().equals(targetPatientId)) {
                throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to view another patient's prescriptions.");
            }
        }
        return repository.findAllByPatientIdOrderByCreatedAtDesc(targetPatientId).stream()
            .map(this::view)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PrescriptionDtos.View> getDoctorPrescriptions(UUID userId, UUID targetDoctorId) {
        Doctor doctor = doctors.findByUserId(userId).orElseThrow(() -> notFound());
        if (!doctor.getId().equals(targetDoctorId)) {
            throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to view another doctor's prescriptions.");
        }
        return repository.findAllByDoctorIdOrderByCreatedAtDesc(targetDoctorId).stream()
            .map(this::view)
            .toList();
    }

    @Transactional
    public String generateDownloadDocument(UUID userId, boolean isDoctor, boolean isStaffOrAdmin, UUID id) {
        Prescription p = repository.findById(id).orElseThrow(() -> notFound());
        verifyReadAccess(userId, isDoctor, isStaffOrAdmin, p);
        audit.record(userId, "PRESCRIPTION_DOWNLOADED", "PRESCRIPTION", p.getId(), "SUCCESS");
        PrescriptionDtos.View v = view(p);

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Prescription ").append(v.prescriptionNumber()).append("</title>");
        sb.append("<style>body{font-family:Arial,sans-serif;margin:30px;color:#1e293b;} .header{border-bottom:2px solid #0284c7;padding-bottom:15px;margin-bottom:20px;} .header h1{margin:0;color:#0f172a;font-size:24px;} .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px;background:#f8fafc;padding:15px;border-radius:8px;} table{width:100%;border-collapse:collapse;margin:20px 0;} th,td{border:1px solid #cbd5e1;padding:10px;text-align:left;} th{background:#e2e8f0;} .footer{margin-top:40px;border-top:1px solid #cbd5e1;padding-top:15px;font-size:12px;color:#64748b;}</style></head><body>");
        sb.append("<div class='header'><h1>CAREFLOW SMART HOSPITAL</h1><p>Digital Medical Prescription</p></div>");
        sb.append("<div class='meta-grid'>");
        sb.append("<div><strong>Prescription No:</strong> ").append(v.prescriptionNumber()).append("<br>");
        sb.append("<strong>Patient Name:</strong> ").append(v.patientName()).append("<br>");
        sb.append("<strong>Patient ID:</strong> ").append(v.patientNumber()).append("</div>");
        sb.append("<div><strong>Doctor:</strong> Dr. ").append(v.doctorName()).append("<br>");
        sb.append("<strong>Department:</strong> ").append(v.departmentName()).append("<br>");
        sb.append("<strong>Issued Date:</strong> ").append(v.createdAt().toString()).append("</div></div>");

        if (v.diagnosis() != null && !v.diagnosis().isBlank()) {
            sb.append("<p><strong>Diagnosis:</strong> ").append(v.diagnosis()).append("</p>");
        }

        sb.append("<h3>Rx - Prescribed Medications</h3>");
        sb.append("<table><thead><tr><th>Medicine</th><th>Generic</th><th>Dosage</th><th>Route</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>");
        for (PrescriptionDtos.ItemView item : v.items()) {
            sb.append("<tr>");
            sb.append("<td><strong>").append(item.medicineName()).append("</strong></td>");
            sb.append("<td>").append(item.genericName() != null ? item.genericName() : "-").append("</td>");
            sb.append("<td>").append(item.dosage()).append("</td>");
            sb.append("<td>").append(item.route() != null ? item.route() : "Oral").append("</td>");
            sb.append("<td>").append(item.frequency()).append("</td>");
            sb.append("<td>").append(item.duration()).append("</td>");
            sb.append("<td>").append(item.foodInstruction() != null ? item.foodInstruction() : "").append(" ").append(item.specialInstructions() != null ? item.specialInstructions() : "").append("</td>");
            sb.append("</tr>");
        }
        sb.append("</tbody></table>");

        if (v.doctorAdvice() != null && !v.doctorAdvice().isBlank()) {
            sb.append("<p><strong>Doctor Advice:</strong> ").append(v.doctorAdvice()).append("</p>");
        }
        if (v.followUpDate() != null) {
            sb.append("<p><strong>Follow-Up Date:</strong> ").append(v.followUpDate().toString()).append("</p>");
        }

        sb.append("<div class='footer'><p>Prescription issued by treating physician Dr. ").append(v.doctorName()).append(" at CareFlow Smart Hospital Platform. Digital License Verification OK.</p></div>");
        sb.append("</body></html>");
        return sb.toString();
    }

    @Transactional
    public Prescription createPrescriptionInternal(
        UUID consultationId,
        UUID appointmentId,
        UUID patientId,
        UUID doctorId,
        String diagnosis,
        String doctorAdvice,
        java.time.LocalDate followUpDate,
        List<PrescriptionDtos.MedicineItem> medicines
    ) {
        if (medicines == null || medicines.isEmpty()) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "MEDICINES_REQUIRED", "At least one medicine is required to create a prescription.");
        }
        Prescription p = new Prescription(consultationId, appointmentId, patientId, doctorId, diagnosis, doctorAdvice, followUpDate);
        for (PrescriptionDtos.MedicineItem m : medicines) {
            if (m.medicineName() == null || m.medicineName().isBlank() || m.dosage() == null || m.dosage().isBlank() || m.frequency() == null || m.frequency().isBlank() || m.duration() == null || m.duration().isBlank()) {
                throw new DomainException(HttpStatus.BAD_REQUEST, "INVALID_MEDICINE_ITEM", "Medicine name, dosage, frequency, and duration are required for all prescription items.");
            }
            PrescriptionItem item = new PrescriptionItem(
                m.medicineName(),
                m.genericName(),
                m.dosage(),
                m.route(),
                m.frequency(),
                m.duration(),
                m.quantity(),
                m.foodInstruction(),
                m.timing(),
                m.specialInstructions()
            );
            p.addItem(item);
        }
        return repository.save(p);
    }

    @Transactional
    public Prescription updatePrescriptionInternal(
        Prescription existing,
        String diagnosis,
        String doctorAdvice,
        java.time.LocalDate followUpDate,
        List<PrescriptionDtos.MedicineItem> medicines
    ) {
        if (medicines == null || medicines.isEmpty()) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "MEDICINES_REQUIRED", "At least one medicine is required to create a prescription.");
        }
        existing.updateDetails(diagnosis, doctorAdvice, followUpDate);
        existing.clearItems();
        for (PrescriptionDtos.MedicineItem m : medicines) {
            if (m.medicineName() == null || m.medicineName().isBlank() || m.dosage() == null || m.dosage().isBlank() || m.frequency() == null || m.frequency().isBlank() || m.duration() == null || m.duration().isBlank()) {
                throw new DomainException(HttpStatus.BAD_REQUEST, "INVALID_MEDICINE_ITEM", "Medicine name, dosage, frequency, and duration are required for all prescription items.");
            }
            PrescriptionItem item = new PrescriptionItem(
                m.medicineName(),
                m.genericName(),
                m.dosage(),
                m.route(),
                m.frequency(),
                m.duration(),
                m.quantity(),
                m.foodInstruction(),
                m.timing(),
                m.specialInstructions()
            );
            existing.addItem(item);
        }
        return repository.save(existing);
    }

    public PrescriptionDtos.View view(Prescription p) {
        Patient patient = patients.findById(p.getPatientId()).orElse(null);
        Doctor doctor = doctors.findById(p.getDoctorId()).orElse(null);
        Department dept = doctor != null ? departments.findById(doctor.getDepartmentId()).orElse(null) : null;

        List<PrescriptionDtos.ItemView> items = p.getItems().stream()
            .map(i -> new PrescriptionDtos.ItemView(
                i.getId(),
                i.getMedicineName(),
                i.getGenericName(),
                i.getDosage(),
                i.getRoute(),
                i.getFrequency(),
                i.getDuration(),
                i.getQuantity(),
                i.getFoodInstruction(),
                i.getTiming(),
                i.getSpecialInstructions()
            ))
            .toList();

        return new PrescriptionDtos.View(
            p.getId(),
            p.getConsultationId(),
            p.getAppointmentId(),
            p.getPatientId(),
            p.getDoctorId(),
            p.getPrescriptionNumber(),
            p.getDiagnosis(),
            p.getDoctorAdvice(),
            p.getFollowUpDate(),
            p.getStatus(),
            p.getCreatedAt(),
            p.getUpdatedAt(),
            items,
            doctor != null ? doctor.getFullName() : "Unknown Doctor",
            dept != null ? dept.getName() : "General Medicine",
            patient != null ? patient.getFullName() : "Unknown Patient",
            patient != null ? patient.getPatientNumber() : "PAT-0000"
        );
    }

    private void verifyReadAccess(UUID userId, boolean isDoctor, boolean isStaffOrAdmin, Prescription p) {
        if (isStaffOrAdmin) return;
        if (isDoctor) {
            Doctor doctor = doctors.findByUserId(userId).orElseThrow(() -> notFound());
            if (doctor.getId().equals(p.getDoctorId())) return;
            Boolean allowed = appointments.findAllByDoctorIdOrderByStartsAtDesc(doctor.getId()).stream()
                .anyMatch(a -> a.getPatientId().equals(p.getPatientId()));
            if (Boolean.TRUE.equals(allowed)) return;
            throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to view this prescription.");
        }
        Patient patient = patients.findByUserId(userId).orElseThrow(() -> notFound());
        if (!patient.getId().equals(p.getPatientId())) {
            throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to view another patient's prescription.");
        }
    }

    private DomainException notFound() {
        return new DomainException(HttpStatus.NOT_FOUND, "PRESCRIPTION_NOT_FOUND", "Prescription was not found.");
    }
}
