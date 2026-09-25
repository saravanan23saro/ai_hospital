package com.careflow.hospital.operations;

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
}
