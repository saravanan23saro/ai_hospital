package com.careflow.hospital.staff;

import com.careflow.hospital.doctors.Doctor;
import com.careflow.hospital.doctors.DoctorRepository;
import com.careflow.hospital.patients.Patient;
import com.careflow.hospital.patients.PatientRepository;
import com.careflow.hospital.shared.DomainException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class StaffAccessService {

  private final StaffMemberRepository staffMembers;
  private final DoctorRepository doctors;
  private final PatientRepository patients;
  private final JdbcTemplate jdbc;

  public StaffAccessService(
      StaffMemberRepository staffMembers,
      DoctorRepository doctors,
      PatientRepository patients,
      JdbcTemplate jdbc) {
    this.staffMembers = staffMembers;
    this.doctors = doctors;
    this.patients = patients;
    this.jdbc = jdbc;
  }

  public StaffMember getStaffMember(UUID userId) {
    return staffMembers.findByUserId(userId)
        .filter(StaffMember::isActive)
        .orElseThrow(() -> new DomainException(
            HttpStatus.FORBIDDEN, "STAFF_NOT_FOUND", "Active staff member profile was not found."));
  }

  public Optional<StaffMember> findStaffMember(UUID userId) {
    return staffMembers.findByUserId(userId).filter(StaffMember::isActive);
  }

  public boolean isDoctorAssignedToStaff(StaffMember staff, UUID doctorId) {
    if (staff == null || doctorId == null) {
      return false;
    }
    // If staff has an assigned department, active doctors in that department are assigned
    if (staff.getDepartmentId() != null) {
      Optional<Doctor> doc = doctors.findById(doctorId);
      if (doc.isPresent() && doc.get().isActive() && staff.getDepartmentId().equals(doc.get().getDepartmentId())) {
        return true;
      }
    }
    return false;
  }

  public boolean isPatientAssignedToStaff(StaffMember staff, UUID patientId) {
    if (staff == null || patientId == null) {
      return false;
    }

    if (staff.getDepartmentId() != null) {
      // 1. Patient has an appointment with an assigned doctor in the staff's department
      Boolean hasAppt = jdbc.queryForObject(
          "SELECT EXISTS (" +
          "  SELECT 1 FROM appointment a " +
          "  JOIN doctor d ON a.doctor_id = d.doctor_id " +
          "  WHERE a.patient_id = ? AND d.department_id = ?" +
          ")",
          Boolean.class, patientId, staff.getDepartmentId());
      if (Boolean.TRUE.equals(hasAppt)) {
        return true;
      }

      // 2. Patient has an active emergency case in the staff's department
      Boolean hasEmergency = jdbc.queryForObject(
          "SELECT EXISTS (" +
          "  SELECT 1 FROM emergency_case e " +
          "  WHERE e.patient_id = ? AND e.department_id = ?" +
          ")",
          Boolean.class, patientId, staff.getDepartmentId());
      if (Boolean.TRUE.equals(hasEmergency)) {
        return true;
      }
    }

    // 3. Patient was directly registered or opened by this staff user
    Boolean wasOpened = jdbc.queryForObject(
        "SELECT EXISTS (" +
        "  SELECT 1 FROM emergency_case e " +
        "  WHERE e.patient_id = ? AND e.opened_by = ?" +
        ")",
        Boolean.class, patientId, staff.getUserId());
    return Boolean.TRUE.equals(wasOpened);
  }

  public void checkDoctorAccess(Authentication auth, UUID doctorId) {
    if (auth == null) {
      throw new DomainException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required.");
    }

    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    if (isAdmin) {
      return;
    }

    boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
    if (isStaff) {
      UUID userId = UUID.fromString(auth.getName());
      StaffMember staff = getStaffMember(userId);
      if (!isDoctorAssignedToStaff(staff, doctorId)) {
        throw new DomainException(
            HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You are not authorized to view or access this doctor's details.");
      }
      return;
    }

    boolean isDoctor = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));
    if (isDoctor) {
      UUID userId = UUID.fromString(auth.getName());
      Optional<Doctor> selfDoc = doctors.findByUserId(userId);
      if (selfDoc.isEmpty() || !selfDoc.get().getId().equals(doctorId)) {
        throw new DomainException(
            HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You are not authorized to view other doctors' details.");
      }
      return;
    }

    throw new DomainException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied.");
  }

  public void checkPatientAccess(Authentication auth, UUID patientId) {
    if (auth == null) {
      throw new DomainException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required.");
    }

    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    if (isAdmin) {
      return;
    }

    boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
    if (isStaff) {
      UUID userId = UUID.fromString(auth.getName());
      StaffMember staff = getStaffMember(userId);
      if (!isPatientAssignedToStaff(staff, patientId)) {
        throw new DomainException(
            HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You are not authorized to view or access this patient's details.");
      }
      return;
    }

    boolean isDoctor = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));
    if (isDoctor) {
      UUID userId = UUID.fromString(auth.getName());
      Boolean allowed = jdbc.queryForObject(
          "SELECT EXISTS (" +
          "  SELECT 1 FROM doctor d " +
          "  JOIN appointment a ON a.doctor_id = d.doctor_id " +
          "  WHERE d.user_id = ? AND d.active = true AND a.patient_id = ?" +
          ")",
          Boolean.class, userId, patientId);
      if (!Boolean.TRUE.equals(allowed)) {
        throw new DomainException(
            HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You are not authorized to access details for this unassigned patient.");
      }
      return;
    }

    boolean isPatient = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"));
    if (isPatient) {
      UUID userId = UUID.fromString(auth.getName());
      Optional<Patient> selfPatient = patients.findByUserId(userId);
      if (selfPatient.isEmpty() || !selfPatient.get().getId().equals(patientId)) {
        throw new DomainException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access Denied");
      }
      return;
    }

    throw new DomainException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied.");
  }

  public List<Doctor> getAssignedDoctors(StaffMember staff) {
    if (staff == null || staff.getDepartmentId() == null) {
      return Collections.emptyList();
    }
    return doctors.findAllByDepartmentIdAndActiveTrueOrderByFullNameAsc(staff.getDepartmentId());
  }

  public List<Map<String, Object>> searchAssignedPatients(StaffMember staff, String query) {
    if (staff == null || staff.getDepartmentId() == null) {
      return Collections.emptyList();
    }
    String term = "%" + (query != null ? query.trim().toLowerCase() : "") + "%";
    String sql =
        "SELECT DISTINCT p.patient_id, p.patient_number, p.full_name, p.date_of_birth, p.gender, p.phone " +
        "FROM patient p " +
        "WHERE (" +
        "  EXISTS (" +
        "    SELECT 1 FROM appointment a JOIN doctor d ON a.doctor_id = d.doctor_id " +
        "    WHERE a.patient_id = p.patient_id AND d.department_id = ?" +
        "  ) " +
        "  OR EXISTS (" +
        "    SELECT 1 FROM emergency_case e " +
        "    WHERE e.patient_id = p.patient_id AND e.department_id = ?" +
        "  ) " +
        "  OR EXISTS (" +
        "    SELECT 1 FROM emergency_case e " +
        "    WHERE e.patient_id = p.patient_id AND e.opened_by = ?" +
        "  )" +
        ") AND (" +
        "  LOWER(p.full_name) LIKE ? OR LOWER(p.patient_number) LIKE ? OR p.phone LIKE ?" +
        ") " +
        "ORDER BY p.full_name LIMIT 20";

    return jdbc.queryForList(sql, staff.getDepartmentId(), staff.getDepartmentId(), staff.getUserId(), term, term, term);
  }

  public List<Map<String, Object>> getAssignedPatientsList(StaffMember staff) {
    if (staff == null || staff.getDepartmentId() == null) {
      return Collections.emptyList();
    }
    String sql =
        "SELECT DISTINCT p.patient_id, p.patient_number, p.full_name, p.date_of_birth, p.gender, p.phone, " +
        "p.blood_group, p.emergency_contact, p.allergies, p.medical_conditions " +
        "FROM patient p " +
        "WHERE (" +
        "  EXISTS (" +
        "    SELECT 1 FROM appointment a JOIN doctor d ON a.doctor_id = d.doctor_id " +
        "    WHERE a.patient_id = p.patient_id AND d.department_id = ?" +
        "  ) " +
        "  OR EXISTS (" +
        "    SELECT 1 FROM emergency_case e " +
        "    WHERE e.patient_id = p.patient_id AND e.department_id = ?" +
        "  ) " +
        "  OR EXISTS (" +
        "    SELECT 1 FROM emergency_case e " +
        "    WHERE e.patient_id = p.patient_id AND e.opened_by = ?" +
        "  )" +
        ") " +
        "ORDER BY p.full_name LIMIT 50";

    return jdbc.queryForList(sql, staff.getDepartmentId(), staff.getDepartmentId(), staff.getUserId());
  }
}
