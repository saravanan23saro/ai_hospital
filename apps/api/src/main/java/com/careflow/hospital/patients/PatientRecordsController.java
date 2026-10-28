package com.careflow.hospital.patients;

import com.careflow.hospital.shared.DomainException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patients")
@PreAuthorize("isAuthenticated()")
public class PatientRecordsController {

  private final JdbcTemplate jdbc;
  private final PatientRepository patients;

  public PatientRecordsController(JdbcTemplate jdbc, PatientRepository patients) {
    this.jdbc = jdbc;
    this.patients = patients;
  }

  @GetMapping("/{patientId}/medical-records")
  public List<Map<String, Object>> getMedicalRecords(Authentication auth, @PathVariable UUID patientId) {
    UUID userId = UUID.fromString(auth.getName());
    boolean isPrivileged = auth.getAuthorities().stream()
        .anyMatch(a -> Set.of("ROLE_ADMIN", "ROLE_STAFF", "ROLE_DOCTOR").contains(a.getAuthority()));

    if (!isPrivileged) {
      Optional<Patient> patientOpt = patients.findByUserId(userId);
      if (patientOpt.isEmpty() || !patientOpt.get().getId().equals(patientId)) {
        throw new DomainException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access Denied");
      }
    }

    List<Map<String, Object>> records = jdbc.queryForList(
        "select record_id, appointment_id, author_id, record_type, summary, created_at from clinical_record where patient_id=? order by created_at desc",
        patientId
    );
    return records != null ? records : Collections.emptyList();
  }

  @GetMapping("/me/medical-records")
  @PreAuthorize("hasRole('PATIENT')")
  public List<Map<String, Object>> getMyMedicalRecords(Authentication auth) {
    UUID userId = UUID.fromString(auth.getName());
    Patient patient = patients.findByUserId(userId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND", "Patient record not found."));
    return getMedicalRecords(auth, patient.getId());
  }
}
