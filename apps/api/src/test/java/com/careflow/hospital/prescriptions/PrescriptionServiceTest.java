package com.careflow.hospital.prescriptions;

import com.careflow.hospital.appointments.AppointmentRepository;
import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.departments.DepartmentRepository;
import com.careflow.hospital.doctors.DoctorRepository;
import com.careflow.hospital.patients.Patient;
import com.careflow.hospital.patients.PatientRepository;
import com.careflow.hospital.shared.DomainException;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PrescriptionServiceTest {
    private PrescriptionRepository repository;
    private PatientRepository patients;
    private DoctorRepository doctors;
    private DepartmentRepository departments;
    private AppointmentRepository appointments;
    private AuditService audit;
    private PrescriptionService service;

    @BeforeEach
    void setUp() {
        repository = mock(PrescriptionRepository.class);
        patients = mock(PatientRepository.class);
        doctors = mock(DoctorRepository.class);
        departments = mock(DepartmentRepository.class);
        appointments = mock(AppointmentRepository.class);
        audit = mock(AuditService.class);

        service = new PrescriptionService(
            repository,
            patients,
            doctors,
            departments,
            appointments,
            audit
        );
    }

    @Test
    void testGetPatientPrescriptionsSuccess() {
        UUID userId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        Patient patient = new Patient(patientId, userId, "PAT-100", "Jane Doe");

        Prescription p1 = new Prescription(UUID.randomUUID(), UUID.randomUUID(), patientId, UUID.randomUUID(), "Flu", "Rest & hydration", LocalDate.now().plusDays(7));
        p1.addItem(new PrescriptionItem("Paracetamol 500mg", "Paracetamol", "500mg", "Oral", "1-0-1", "5 days", "10 tabs", "After food", "Morning/Evening", "With water"));

        when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));
        when(repository.findAllByPatientIdOrderByCreatedAtDesc(patientId)).thenReturn(List.of(p1));

        List<PrescriptionDtos.View> result = service.getPatientPrescriptions(userId, false, false, patientId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Flu", result.get(0).diagnosis());
        assertEquals(1, result.get(0).items().size());
        assertEquals("Paracetamol 500mg", result.get(0).items().get(0).medicineName());
    }

    @Test
    void testGetPatientPrescriptionsForbiddenForOtherPatient() {
        UUID userId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID otherPatientId = UUID.randomUUID();
        Patient patient = new Patient(patientId, userId, "PAT-100", "Jane Doe");

        when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));

        DomainException ex = assertThrows(DomainException.class, () -> service.getPatientPrescriptions(userId, false, false, otherPatientId));
        assertEquals("FORBIDDEN", ex.code());
    }

    @Test
    void testGenerateDownloadDocumentHTML() {
        UUID userId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID prescriptionId = UUID.randomUUID();
        Patient patient = new Patient(patientId, userId, "PAT-100", "Jane Doe");

        Prescription p = new Prescription(UUID.randomUUID(), UUID.randomUUID(), patientId, UUID.randomUUID(), "Fever", "Take fluids", LocalDate.now().plusDays(3));
        p.addItem(new PrescriptionItem("Paracetamol 500mg", "Paracetamol", "500mg", "Oral", "1-0-1", "3 days", "6 tabs", "After food", "Morning", ""));

        when(repository.findById(prescriptionId)).thenReturn(Optional.of(p));
        when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));

        String html = service.generateDownloadDocument(userId, false, false, prescriptionId);

        assertNotNull(html);
        assertTrue(html.contains("CAREFLOW SMART HOSPITAL"));
        assertTrue(html.contains("Paracetamol 500mg"));
        assertTrue(html.contains("Fever"));
        verify(audit).record(eq(userId), eq("PRESCRIPTION_DOWNLOADED"), eq("PRESCRIPTION"), eq(p.getId()), eq("SUCCESS"));
    }
}
