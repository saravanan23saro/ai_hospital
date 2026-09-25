package com.careflow.hospital.consultations;

import com.careflow.hospital.appointments.*;
import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.doctors.*;
import com.careflow.hospital.outbox.OutboxService;
import com.careflow.hospital.patients.*;
import com.careflow.hospital.prescriptions.*;
import com.careflow.hospital.shared.DomainException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ConsultationServiceTest {
    private ConsultationRepository repository;
    private PrescriptionRepository prescriptionRepository;
    private PrescriptionService prescriptionService;
    private AppointmentRepository appointments;
    private DoctorRepository doctors;
    private PatientRepository patients;
    private AuditService audit;
    private OutboxService outbox;
    private JdbcTemplate jdbc;
    private ConsultationService service;

    @BeforeEach
    void setUp() {
        repository = mock(ConsultationRepository.class);
        prescriptionRepository = mock(PrescriptionRepository.class);
        prescriptionService = mock(PrescriptionService.class);
        appointments = mock(AppointmentRepository.class);
        doctors = mock(DoctorRepository.class);
        patients = mock(PatientRepository.class);
        audit = mock(AuditService.class);
        outbox = mock(OutboxService.class);
        jdbc = mock(JdbcTemplate.class);

        service = new ConsultationService(
            repository,
            prescriptionRepository,
            prescriptionService,
            appointments,
            doctors,
            patients,
            audit,
            outbox,
            jdbc
        );
    }

    @Test
    void testStartConsultationSuccess() {
        UUID doctorUserId = UUID.randomUUID();
        UUID doctorId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID appointmentId = UUID.randomUUID();

        Doctor doctor = mock(Doctor.class);
        when(doctor.getId()).thenReturn(doctorId);
        when(doctor.getUserId()).thenReturn(doctorUserId);
        when(doctor.isActive()).thenReturn(true);

        Appointment appt = new Appointment(patientId, doctorId, UUID.randomUUID(), Instant.now(), Instant.now().plusSeconds(1800));

        when(doctors.findByUserId(doctorUserId)).thenReturn(Optional.of(doctor));
        when(appointments.findByIdForUpdate(appointmentId)).thenReturn(Optional.of(appt));
        when(repository.findByAppointmentIdForUpdate(appointmentId)).thenReturn(Optional.empty());
        when(repository.save(any(Consultation.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultationDtos.View view = service.startConsultation(doctorUserId, false, appointmentId);

        assertNotNull(view);
        assertEquals("IN_PROGRESS", view.status());
        assertEquals("IN_PROGRESS", appt.getStatus());
        verify(audit).record(eq(doctorUserId), eq("CONSULTATION_STARTED"), eq("CONSULTATION"), any(), eq("SUCCESS"));
    }

    @Test
    void testStartConsultationForbiddenForUnassignedDoctor() {
        UUID doctorUserId = UUID.randomUUID();
        UUID doctorId = UUID.randomUUID();
        UUID otherDoctorId = UUID.randomUUID();
        UUID appointmentId = UUID.randomUUID();

        Doctor doctor = mock(Doctor.class);
        when(doctor.getId()).thenReturn(doctorId);
        when(doctor.getUserId()).thenReturn(doctorUserId);
        when(doctor.isActive()).thenReturn(true);

        Appointment appt = new Appointment(UUID.randomUUID(), otherDoctorId, UUID.randomUUID(), Instant.now(), Instant.now().plusSeconds(1800));

        when(doctors.findByUserId(doctorUserId)).thenReturn(Optional.of(doctor));
        when(appointments.findByIdForUpdate(appointmentId)).thenReturn(Optional.of(appt));

        DomainException ex = assertThrows(DomainException.class, () -> service.startConsultation(doctorUserId, false, appointmentId));
        assertEquals("FORBIDDEN", ex.code());
    }

    @Test
    void testCompleteConsultationSuccess() {
        UUID doctorUserId = UUID.randomUUID();
        UUID doctorId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID patientUserId = UUID.randomUUID();
        UUID appointmentId = UUID.randomUUID();
        UUID consultationId = UUID.randomUUID();

        Doctor doctor = mock(Doctor.class);
        when(doctor.getId()).thenReturn(doctorId);
        when(doctor.getUserId()).thenReturn(doctorUserId);
        when(doctor.getFullName()).thenReturn("Dr. Smith");
        when(doctor.isActive()).thenReturn(true);

        Patient patient = new Patient(patientId, patientUserId, "PAT-100", "John Patient");
        Appointment appt = new Appointment(patientId, doctorId, UUID.randomUUID(), Instant.now(), Instant.now().plusSeconds(1800));
        Consultation consultation = new Consultation(appointmentId, patientId, doctorId);

        Prescription prescription = new Prescription(consultationId, appointmentId, patientId, doctorId, "Hypertension", "Low sodium diet", LocalDate.now().plusDays(30));

        when(doctors.findByUserId(doctorUserId)).thenReturn(Optional.of(doctor));
        when(repository.findByIdForUpdate(consultation.getId())).thenReturn(Optional.of(consultation));
        when(appointments.findByIdForUpdate(appointmentId)).thenReturn(Optional.of(appt));
        when(patients.findById(patientId)).thenReturn(Optional.of(patient));

        when(prescriptionService.createPrescriptionInternal(any(), any(), any(), any(), any(), any(), any(), any()))
            .thenReturn(prescription);

        PrescriptionDtos.MedicineItem med = new PrescriptionDtos.MedicineItem(
            "Amlodipine 5 mg", "Amlodipine", "5 mg", "Oral", "1-0-0", "30 days", "30 tabs", "After food", "Morning", "Take daily"
        );

        ConsultationDtos.CompleteRequest request = new ConsultationDtos.CompleteRequest(
            new ConsultationDtos.SaveNotesRequest("High BP", "Headache", "BP 140/90", "Hypertension", "Mild", "Dietary control", "Return in 1 month", LocalDate.now().plusDays(30), "No salt"),
            List.of(med),
            "Reduce salt intake",
            LocalDate.now().plusDays(30),
            null,
            null
        );

        ConsultationDtos.View view = service.completeConsultation(doctorUserId, false, consultation.getId(), request);

        assertNotNull(view);
        assertEquals("COMPLETED", view.status());
        assertEquals("COMPLETED", appt.getStatus());
        verify(audit).record(eq(doctorUserId), eq("CONSULTATION_COMPLETED"), eq("CONSULTATION"), eq(consultation.getId()), eq("SUCCESS"));
        verify(jdbc).update(contains("insert into notification"), any(), eq(patientUserId), any());
    }

    @Test
    void testCompleteConsultationReturnsExistingWhenAlreadyCompleted() {
        UUID doctorUserId = UUID.randomUUID();
        UUID doctorId = UUID.randomUUID();
        UUID consultationId = UUID.randomUUID();

        Doctor doctor = mock(Doctor.class);
        when(doctor.getId()).thenReturn(doctorId);
        when(doctor.getUserId()).thenReturn(doctorUserId);
        when(doctor.isActive()).thenReturn(true);

        Consultation consultation = new Consultation(UUID.randomUUID(), UUID.randomUUID(), doctorId);
        consultation.complete();

        when(doctors.findByUserId(doctorUserId)).thenReturn(Optional.of(doctor));
        when(repository.findByIdForUpdate(consultationId)).thenReturn(Optional.of(consultation));

        ConsultationDtos.CompleteRequest request = new ConsultationDtos.CompleteRequest(null, List.of(), null, null, null, null);

        ConsultationDtos.View view = service.completeConsultation(doctorUserId, false, consultationId, request);
        assertNotNull(view);
        assertEquals("COMPLETED", view.status());
    }
}
