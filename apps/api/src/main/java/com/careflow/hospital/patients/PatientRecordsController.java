package com.careflow.hospital.patients;

import com.careflow.hospital.shared.DomainException;
import com.careflow.hospital.staff.StaffAccessService;
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
  private final StaffAccessService staffAccessService;

  public PatientRecordsController(
      JdbcTemplate jdbc,
      PatientRepository patients,
      StaffAccessService staffAccessService) {
    this.jdbc = jdbc;
    this.patients = patients;
    this.staffAccessService = staffAccessService;
  }

  @GetMapping("/{patientId}/medical-records")
  public List<Map<String, Object>> getMedicalRecords(Authentication auth, @PathVariable UUID patientId) {
    UUID userId = UUID.fromString(auth.getName());
    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
    boolean isDoctor = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));

    if (isAdmin) {
      // Full administrative access
    } else if (isStaff) {
      // Staff-specific patient access check: must be assigned to this patient
      staffAccessService.checkPatientAccess(auth, patientId);
    } else if (isDoctor) {
      Boolean allowed = jdbc.queryForObject(
          "SELECT EXISTS (" +
          "  SELECT 1 FROM doctor d " +
          "  JOIN appointment a ON a.doctor_id = d.doctor_id " +
          "  WHERE d.user_id = ? AND d.active = true AND a.patient_id = ?" +
          ")",
          Boolean.class, userId, patientId);
      if (!Boolean.TRUE.equals(allowed)) {
        throw new DomainException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access Denied: Unassigned patient.");
      }
    } else {
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
