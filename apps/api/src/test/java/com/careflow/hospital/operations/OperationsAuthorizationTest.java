package com.careflow.hospital.operations;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.shared.DomainException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class OperationsAuthorizationTest {
  @Test
  void doctorCannotCreateRecordForUnassignedPatient() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    AuditService audit = mock(AuditService.class);
    UUID doctorUserId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    var auth = new UsernamePasswordAuthenticationToken(doctorUserId.toString(), "", java.util.List.of(new SimpleGrantedAuthority("ROLE_DOCTOR")));
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), eq(doctorUserId), eq(patientId))).thenReturn(false);

    var controller = new OperationsController(jdbc, audit);
    assertThrows(DomainException.class, () -> controller.record(auth, new OperationsController.RecordRequest(patientId, null, "NOTE", "Private note")));
    verify(jdbc, never()).update(startsWith("insert into clinical_record"), any(Object[].class));
    verifyNoInteractions(audit);
  }

  @Test
  void staffCannotViewRecordsForUnassignedPatient() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    AuditService audit = mock(AuditService.class);
    UUID staffUserId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    var auth = new UsernamePasswordAuthenticationToken(staffUserId.toString(), "", java.util.List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), eq(staffUserId), eq(patientId), eq(patientId), eq(patientId), eq(staffUserId)))
        .thenReturn(false);

    var controller = new OperationsController(jdbc, audit);
    assertThrows(DomainException.class, () -> controller.records(auth, patientId));
    verify(audit, never()).record(any(), any(), any(), any(), any());
  }

  @Test
  void staffCanViewRecordsForAssignedPatient() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    AuditService audit = mock(AuditService.class);
    UUID staffUserId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    var auth = new UsernamePasswordAuthenticationToken(staffUserId.toString(), "", java.util.List.of(new SimpleGrantedAuthority("ROLE_STAFF")));
    when(jdbc.queryForObject(anyString(), eq(Boolean.class), eq(staffUserId), eq(patientId), eq(patientId), eq(patientId), eq(staffUserId)))
        .thenReturn(true);
    when(jdbc.queryForList(anyString(), eq(patientId))).thenReturn(java.util.List.of());

    var controller = new OperationsController(jdbc, audit);
    assertDoesNotThrow(() -> controller.records(auth, patientId));
    verify(audit).record(eq(staffUserId), eq("CLINICAL_RECORDS_VIEWED"), eq("PATIENT"), eq(patientId), eq("SUCCESS"));
  }
}
