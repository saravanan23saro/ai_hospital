package com.careflow.hospital.consultations;

import com.careflow.hospital.appointments.*;
import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.doctors.*;
import com.careflow.hospital.notifications.NotificationController;
import com.careflow.hospital.outbox.OutboxService;
import com.careflow.hospital.patients.*;
import com.careflow.hospital.prescriptions.*;
import com.careflow.hospital.shared.DomainException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsultationService {
    private final ConsultationRepository repository;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionService prescriptionService;
    private final AppointmentRepository appointments;
    private final DoctorRepository doctors;
    private final PatientRepository patients;
    private final AuditService audit;
    private final OutboxService outbox;
    private final JdbcTemplate jdbc;

    public ConsultationService(
        ConsultationRepository repository,
        PrescriptionRepository prescriptionRepository,
        PrescriptionService prescriptionService,
        AppointmentRepository appointments,
        DoctorRepository doctors,
        PatientRepository patients,
        AuditService audit,
        OutboxService outbox,
        JdbcTemplate jdbc
    ) {
        this.repository = repository;
        this.prescriptionRepository = prescriptionRepository;
        this.prescriptionService = prescriptionService;
        this.appointments = appointments;
        this.doctors = doctors;
        this.patients = patients;
        this.audit = audit;
        this.outbox = outbox;
        this.jdbc = jdbc;
    }

    @Transactional
    public ConsultationDtos.View startConsultation(UUID actorUserId, boolean isStaffOrAdmin, UUID appointmentId) {
        Appointment appointment = appointments.findByIdForUpdate(appointmentId)
            .orElseThrow(() -> notFound("APPOINTMENT_NOT_FOUND", "Appointment was not found."));

        Doctor doctor;
        if (isStaffOrAdmin) {
            doctor = doctors.findById(appointment.getDoctorId())
                .orElseGet(() -> doctors.findByUserId(actorUserId).orElseGet(() -> doctors.findAll().stream().findFirst().orElseThrow(() -> notFound("DOCTOR_NOT_FOUND", "Doctor profile not found."))));
        } else {
            doctor = doctor(actorUserId);
            if (!appointment.getDoctorId().equals(doctor.getId())) {
                throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to start a consultation for another doctor's appointment.");
            }
        }

        if (Set.of("CANCELLED", "NO_SHOW", "RESCHEDULED").contains(appointment.getStatus())) {
            throw new DomainException(HttpStatus.CONFLICT, "INVALID_APPOINTMENT_STATE", "Cannot start consultation for a cancelled, rescheduled, or no-show appointment.");
        }

        if ("COMPLETED".equals(appointment.getStatus())) {
            Optional<Consultation> existing = repository.findByAppointmentId(appointmentId);
            if (existing.isPresent()) {
                return view(existing.get());
            }
            throw new DomainException(HttpStatus.CONFLICT, "ALREADY_COMPLETED", "This appointment is already completed.");
        }

        if (!"IN_PROGRESS".equals(appointment.getStatus())) {
            appointment.transition("IN_PROGRESS");
        }

        Consultation consultation = repository.findByAppointmentIdForUpdate(appointmentId)
            .orElseGet(() -> repository.save(new Consultation(appointment.getId(), appointment.getPatientId(), doctor.getId())));

        audit.record(actorUserId, "CONSULTATION_STARTED", "CONSULTATION", consultation.getId(), "SUCCESS");
        outbox.record("CONSULTATION_STARTED", "CONSULTATION", consultation.getId(), view(consultation), "CONSULTATION:START:" + consultation.getId());
        return view(consultation);
    }

    @Transactional(readOnly = true)
    public ConsultationDtos.View get(UUID actorUserId, boolean isDoctor, boolean isStaffOrAdmin, UUID consultationId) {
        Consultation c = repository.findById(consultationId).orElseThrow(() -> notFound("CONSULTATION_NOT_FOUND", "Consultation was not found."));
        verifyReadAccess(actorUserId, isDoctor, isStaffOrAdmin, c);
        return view(c);
    }

    @Transactional(readOnly = true)
    public ConsultationDtos.View getByAppointment(UUID actorUserId, boolean isDoctor, boolean isStaffOrAdmin, UUID appointmentId) {
        Consultation c = repository.findByAppointmentId(appointmentId).orElseThrow(() -> notFound("CONSULTATION_NOT_FOUND", "Consultation for this appointment was not found."));
        verifyReadAccess(actorUserId, isDoctor, isStaffOrAdmin, c);
        return view(c);
    }

    @Transactional
    public ConsultationDtos.View updateNotes(UUID actorUserId, boolean isStaffOrAdmin, UUID consultationId, ConsultationDtos.SaveNotesRequest request) {
        Consultation c = repository.findByIdForUpdate(consultationId)
            .orElseThrow(() -> notFound("CONSULTATION_NOT_FOUND", "Consultation was not found."));

        if (!isStaffOrAdmin) {
            Doctor doctor = doctor(actorUserId);
            if (!c.getDoctorId().equals(doctor.getId())) {
                throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to update another doctor's consultation.");
            }
        }

        if ("COMPLETED".equals(c.getStatus())) {
            throw new DomainException(HttpStatus.CONFLICT, "ALREADY_COMPLETED", "Cannot modify a completed consultation.");
        }

        c.updateNotes(
            request.chiefComplaint(),
            request.symptoms(),
            request.clinicalNotes(),
            request.diagnosis(),
            request.assessment(),
            request.treatmentAdvice(),
            request.followUpInstructions(),
            request.followUpDate(),
            request.additionalNotes()
        );

        audit.record(actorUserId, "CONSULTATION_UPDATED", "CONSULTATION", c.getId(), "SUCCESS");
        return view(c);
    }

    @Transactional
    public ConsultationDtos.View completeConsultation(UUID actorUserId, boolean isStaffOrAdmin, UUID consultationId, ConsultationDtos.CompleteRequest request) {
        Consultation c = repository.findByIdForUpdate(consultationId)
            .orElseThrow(() -> notFound("CONSULTATION_NOT_FOUND", "Consultation was not found."));

        Doctor doctor;
        if (isStaffOrAdmin) {
            doctor = doctors.findById(c.getDoctorId())
                .orElseGet(() -> doctors.findByUserId(actorUserId).orElseGet(() -> doctors.findAll().stream().findFirst().orElseThrow(() -> notFound("DOCTOR_NOT_FOUND", "Doctor profile not found."))));
        } else {
            doctor = doctor(actorUserId);
            if (!c.getDoctorId().equals(doctor.getId())) {
                throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to complete another doctor's consultation.");
            }
        }

        if ("COMPLETED".equals(c.getStatus())) {
            return view(c);
        }

        if (request.notes() != null) {
            c.updateNotes(
                request.notes().chiefComplaint(),
                request.notes().symptoms(),
                request.notes().clinicalNotes(),
                request.notes().diagnosis(),
                request.notes().assessment(),
                request.notes().treatmentAdvice(),
                request.notes().followUpInstructions(),
                request.notes().followUpDate(),
                request.notes().additionalNotes()
            );
        }

        String effectiveDiagnosis = (request.notes() != null && request.notes().diagnosis() != null && !request.notes().diagnosis().isBlank())
            ? request.notes().diagnosis() : "General Consultation & Assessment";

        if (request.patientName() != null && !request.patientName().isBlank()) {
            Patient patient = patients.findById(c.getPatientId())
                .orElseGet(() -> patients.findByUserId(c.getPatientId()).orElse(null));
            if (patient != null) {
                patient.updateProfile(
                    request.patientName().trim(),
                    request.patientDateOfBirth() != null ? request.patientDateOfBirth() : patient.getDateOfBirth(),
                    patient.getPhone() != null ? patient.getPhone() : "0000000000",
                    patient.getGender() != null ? patient.getGender() : "PREFER_NOT_TO_SAY",
                    patient.getAddress() != null ? patient.getAddress() : "N/A",
                    patient.getEmergencyContact() != null ? patient.getEmergencyContact() : "0000000000",
                    patient.getPreferredLanguage() != null ? patient.getPreferredLanguage() : "English",
                    patient.getBloodGroup() != null ? patient.getBloodGroup() : "UNKNOWN",
                    patient.getAllergies(),
                    patient.getMedicalConditions()
                );
                patients.save(patient);
            }
        }

        Prescription prescription = prescriptionRepository.findByConsultationId(c.getId())
            .map(existing -> prescriptionService.updatePrescriptionInternal(
                existing,
                effectiveDiagnosis,
                request.doctorAdvice(),
                request.followUpDate(),
                request.medicines()
            ))
            .orElseGet(() -> prescriptionService.createPrescriptionInternal(
                c.getId(),
                c.getAppointmentId(),
                c.getPatientId(),
                doctor != null ? doctor.getId() : c.getDoctorId(),
                effectiveDiagnosis,
                request.doctorAdvice(),
                request.followUpDate(),
                request.medicines()
            ));

        c.complete();

        Appointment appointment = appointments.findByIdForUpdate(c.getAppointmentId())
            .orElseThrow(() -> notFound("APPOINTMENT_NOT_FOUND", "Appointment was not found."));

        if (!"COMPLETED".equals(appointment.getStatus())) {
            appointment.transition("COMPLETED");
        }

        audit.record(actorUserId, "CONSULTATION_COMPLETED", "CONSULTATION", c.getId(), "SUCCESS");
        audit.record(actorUserId, "PRESCRIPTION_CREATED", "PRESCRIPTION", prescription.getId(), "SUCCESS");
        audit.record(actorUserId, "PRESCRIPTION_FINALIZED", "PRESCRIPTION", prescription.getId(), "SUCCESS");

        Patient patient = patients.findById(c.getPatientId())
            .orElseGet(() -> patients.findByUserId(c.getPatientId()).orElse(null));
        if (patient != null) {
            UUID notificationId = UUID.randomUUID();
            String docName = doctor != null && doctor.getFullName() != null && !doctor.getFullName().isBlank() ? doctor.getFullName() : "your physician";
            String body = "Your consultation with Dr. " + docName + " has been completed. Your prescription (Rx: " + prescription.getPrescriptionNumber() + ") is now available in your patient portal.";
            jdbc.update("insert into notification(notification_id, user_id, channel, subject, body, status) values (?, ?, 'IN_APP', 'Prescription Available', ?, 'SENT')", notificationId, patient.getUserId(), body);
        }

        outbox.record("CONSULTATION_COMPLETED", "CONSULTATION", c.getId(), view(c), "CONSULTATION:" + c.getId() + ":COMPLETED");
        return view(c);
    }

    private Doctor doctor(UUID userId) {
        return doctors.findByUserId(userId)
            .filter(Doctor::isActive)
            .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "DOCTOR_NOT_FOUND", "Active doctor profile was not found."));
    }

    private void verifyReadAccess(UUID actorUserId, boolean isDoctor, boolean isStaffOrAdmin, Consultation c) {
        if (isStaffOrAdmin) return;
        if (isDoctor) {
            Doctor doctor = doctors.findByUserId(actorUserId).orElseThrow(() -> notFound("DOCTOR_NOT_FOUND", "Doctor profile was not found."));
            if (doctor.getId().equals(c.getDoctorId())) return;
            throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to view this consultation.");
        }
        Patient patient = patients.findByUserId(actorUserId).orElseThrow(() -> notFound("PATIENT_NOT_FOUND", "Patient profile was not found."));
        if (!patient.getId().equals(c.getPatientId())) {
            throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to view another patient's consultation.");
        }
    }

    private DomainException notFound(String code, String message) {
        return new DomainException(HttpStatus.NOT_FOUND, code, message);
    }

    public ConsultationDtos.View view(Consultation c) {
        PrescriptionDtos.View prescriptionView = prescriptionRepository.findByConsultationId(c.getId())
            .map(prescriptionService::view)
            .orElse(null);

        Appointment appt = appointments.findById(c.getAppointmentId()).orElse(null);
        Patient patient = patients.findById(c.getPatientId())
            .orElseGet(() -> patients.findByUserId(c.getPatientId()).orElse(null));

        return new ConsultationDtos.View(
            c.getId(),
            c.getAppointmentId(),
            c.getPatientId(),
            c.getDoctorId(),
            appt != null && appt.getAppointmentNumber() != null ? appt.getAppointmentNumber() : "APT-CONSULTATION",
            patient != null && patient.getPatientNumber() != null ? patient.getPatientNumber() : "PAT-UNKNOWN",
            patient != null && patient.getFullName() != null && !patient.getFullName().isBlank() ? patient.getFullName() : "Patient",
            patient != null ? patient.getPhone() : "",
            patient != null ? patient.getDateOfBirth() : null,
            patient != null ? patient.getGender() : "",
            patient != null ? patient.getBloodGroup() : "",
            patient != null ? patient.getAllergies() : "",
            patient != null ? patient.getMedicalConditions() : "",
            c.getChiefComplaint(),
            c.getSymptoms(),
            c.getClinicalNotes(),
            c.getDiagnosis(),
            c.getAssessment(),
            c.getTreatmentAdvice(),
            c.getFollowUpInstructions(),
            c.getFollowUpDate(),
            c.getAdditionalNotes(),
            c.getStatus(),
            c.getStartedAt(),
            c.getCompletedAt(),
            c.getCreatedAt(),
            c.getUpdatedAt(),
            prescriptionView
        );
    }
}
