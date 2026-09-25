package com.careflow.hospital.queue;

import com.careflow.hospital.audit.AuditService;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class OpdQueueServiceTest {
    private OpdQueueRepository repository;
    private AuditService audit;
    private OpdQueueService service;

    @BeforeEach
    void setUp() {
        repository = mock(OpdQueueRepository.class);
        audit = mock(AuditService.class);
        service = new OpdQueueService(repository, audit);
    }

    @Test
    void testGenerateWalkInToken() {
        UUID actorId = UUID.randomUUID();
        UUID doctorId = UUID.randomUUID();
        UUID deptId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();

        when(repository.findMaxSequenceNumber(eq(doctorId), any(LocalDate.class))).thenReturn(5);
        when(repository.save(any(OpdToken.class))).thenAnswer(inv -> inv.getArgument(0));

        OpdQueueDtos.WalkInRegister req = new OpdQueueDtos.WalkInRegister(doctorId, deptId, patientId, null);
        OpdQueueDtos.TokenView view = service.generateWalkInToken(actorId, req);

        assertNotNull(view);
        assertEquals(6, view.sequenceNumber());
        assertTrue(view.isWalkIn());
        verify(audit).record(eq(actorId), eq("OPD_TOKEN_GENERATED"), eq("OPD_TOKEN"), any(), eq("SUCCESS"));
    }

    @Test
    void testGetDoctorQueue() {
        UUID doctorId = UUID.randomUUID();
        OpdToken t1 = new OpdToken(doctorId, UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), 1, true);
        OpdToken t2 = new OpdToken(doctorId, UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), 2, false);

        when(repository.findAllByDoctorIdAndServiceDateOrderBySequenceNumberAsc(eq(doctorId), any(LocalDate.class)))
            .thenReturn(List.of(t1, t2));

        List<OpdQueueDtos.TokenView> queue = service.getDoctorQueue(doctorId);
        assertEquals(2, queue.size());
        assertEquals(1, queue.get(0).sequenceNumber());
        assertEquals(2, queue.get(1).sequenceNumber());
    }

    @Test
    void testGetPosition() {
        UUID doctorId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        OpdToken t1 = new OpdToken(doctorId, UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), 1, true);
        OpdToken t2 = new OpdToken(doctorId, UUID.randomUUID(), patientId, null, LocalDate.now(), 2, false);

        when(repository.findAllByDoctorIdAndServiceDateOrderBySequenceNumberAsc(eq(doctorId), any(LocalDate.class)))
            .thenReturn(List.of(t1, t2));

        OpdQueueDtos.QueuePosition pos = service.getPosition(doctorId, patientId);
        assertNotNull(pos);
        assertEquals(2, pos.position());
        assertEquals(2, pos.totalWaiting());
        assertEquals(15, pos.estimatedWaitMinutes());
    }

    @Test
    void testCallToken() {
        UUID actorId = UUID.randomUUID();
        UUID tokenId = UUID.randomUUID();
        OpdToken token = new OpdToken(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), 1, true);

        when(repository.findByIdForUpdate(tokenId)).thenReturn(Optional.of(token));

        OpdQueueDtos.TokenView view = service.callToken(actorId, tokenId);
        assertEquals("CALLED", view.status());
        verify(audit).record(eq(actorId), eq("OPD_TOKEN_CALLED"), eq("OPD_TOKEN"), eq(tokenId), eq("SUCCESS"));
    }

    @Test
    void testCompleteToken() {
        UUID actorId = UUID.randomUUID();
        UUID tokenId = UUID.randomUUID();
        OpdToken token = new OpdToken(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), 1, true);
        token.call();

        when(repository.findByIdForUpdate(tokenId)).thenReturn(Optional.of(token));

        OpdQueueDtos.TokenView view = service.completeToken(actorId, tokenId);
        assertEquals("COMPLETED", view.status());
        verify(audit).record(eq(actorId), eq("OPD_TOKEN_COMPLETED"), eq("OPD_TOKEN"), eq(tokenId), eq("SUCCESS"));
    }
}
