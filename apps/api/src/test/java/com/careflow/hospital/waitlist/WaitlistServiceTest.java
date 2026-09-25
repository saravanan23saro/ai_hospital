package com.careflow.hospital.waitlist;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.patients.Patient;
import com.careflow.hospital.patients.PatientRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class WaitlistServiceTest {
    private WaitlistRepository repository;
    private PatientRepository patients;
    private AuditService audit;
    private WaitlistService service;

    @BeforeEach
    void setUp() {
        repository = mock(WaitlistRepository.class);
        patients = mock(PatientRepository.class);
        audit = mock(AuditService.class);
        service = new WaitlistService(repository, patients, audit);
    }

    @Test
    void testJoinWaitlist() {
        UUID userId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        Patient patient = new Patient(patientId, userId, "PAT-1001", "John Doe");

        when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));
        when(repository.save(any(WaitlistEntry.class))).thenAnswer(inv -> inv.getArgument(0));

        WaitlistDtos.Join req = new WaitlistDtos.Join(
            UUID.randomUUID(),
            UUID.randomUUID(),
            LocalDate.now().plusDays(1),
            LocalTime.of(9, 0),
            LocalTime.of(12, 0),
            4,
            "Urgent consultation"
        );

        WaitlistDtos.View result = service.join(userId, req);
        assertNotNull(result);
        assertEquals("WAITING", result.status());
        assertEquals(4, result.urgencyLevel());
        verify(audit).record(eq(userId), eq("WAITLIST_JOINED"), eq("WAITLIST_ENTRY"), any(), eq("SUCCESS"));
    }

    @Test
    void testAcceptOffer() {
        UUID userId = UUID.randomUUID();
        UUID entryId = UUID.randomUUID();
        WaitlistEntry entry = new WaitlistEntry(
            UUID.randomUUID(), null, UUID.randomUUID(), LocalDate.now().plusDays(1), null, null, 3, null
        );
        entry.makeOffer(UUID.randomUUID(), java.time.Instant.now().plusSeconds(900));

        when(repository.findByIdForUpdate(entryId)).thenReturn(Optional.of(entry));

        WaitlistDtos.View result = service.acceptOffer(userId, entryId);
        assertEquals("ACCEPTED", result.status());
        verify(audit).record(eq(userId), eq("WAITLIST_OFFER_ACCEPTED"), eq("WAITLIST_ENTRY"), eq(entryId), eq("SUCCESS"));
    }

    @Test
    void testAutoMatchOnCancellation() {
        UUID deptId = UUID.randomUUID();
        LocalDate targetDate = LocalDate.now().plusDays(1);
        UUID cancelledApptId = UUID.randomUUID();

        WaitlistEntry entry1 = new WaitlistEntry(
            UUID.randomUUID(), null, deptId, targetDate, null, null, 5, "High priority"
        );

        when(repository.findCandidatesForUpdate(deptId, targetDate)).thenReturn(List.of(entry1));

        service.autoMatchOnCancellation(deptId, targetDate, cancelledApptId);

        assertEquals("MATCHED", entry1.getStatus());
        assertEquals(cancelledApptId, entry1.getOfferedAppointmentId());
        verify(repository).save(entry1);
    }
}
