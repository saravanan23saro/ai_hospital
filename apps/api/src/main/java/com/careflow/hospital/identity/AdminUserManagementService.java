package com.careflow.hospital.identity;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.departments.Department;
import com.careflow.hospital.departments.DepartmentRepository;
import com.careflow.hospital.doctors.Doctor;
import com.careflow.hospital.doctors.DoctorRepository;
import com.careflow.hospital.shared.DomainException;
import com.careflow.hospital.staff.StaffMember;
import com.careflow.hospital.staff.StaffMemberRepository;
import com.careflow.hospital.scheduling.DoctorSchedule;
import com.careflow.hospital.scheduling.DoctorScheduleRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminUserManagementService {

  private final AppUserRepository users;
  private final DoctorRepository doctors;
  private final StaffMemberRepository staffMembers;
  private final DepartmentRepository departments;
  private final PasswordEncoder passwordEncoder;
  private final AuditService audit;
  private final DoctorScheduleRepository schedules;
  private final JdbcTemplate jdbc;

  public AdminUserManagementService(
      AppUserRepository users,
      DoctorRepository doctors,
      StaffMemberRepository staffMembers,
      DepartmentRepository departments,
      PasswordEncoder passwordEncoder,
      AuditService audit,
      DoctorScheduleRepository schedules,
      JdbcTemplate jdbc) {
    this.users = users;
    this.doctors = doctors;
    this.staffMembers = staffMembers;
    this.departments = departments;
    this.passwordEncoder = passwordEncoder;
    this.audit = audit;
    this.schedules = schedules;
    this.jdbc = jdbc;
  }

  // --- DOCTOR MANAGEMENT ---

  @Transactional
  public AdminDtos.DoctorView createDoctor(UUID adminId, AdminDtos.AdminDoctorCreate req) {
    String cleanEmail = req.email().strip().toLowerCase(Locale.ROOT);
    if (users.existsByEmailIgnoreCase(cleanEmail)) {
      throw new DomainException(
          HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
    }
    String cleanLicense = req.licenseNumber().strip().toUpperCase(Locale.ROOT);
    if (doctors.existsByLicenseNumberIgnoreCase(cleanLicense)) {
      throw new DomainException(
          HttpStatus.CONFLICT, "LICENSE_ALREADY_EXISTS", "A doctor with this license number already exists.");
    }
    String cleanName = req.fullName().strip();
    if (doctors.existsByDepartmentIdAndFullNameIgnoreCaseAndActiveTrue(req.departmentId(), cleanName)) {
      throw new DomainException(
          HttpStatus.CONFLICT, "DOCTOR_ALREADY_EXISTS", "A doctor with this name already exists in the selected department.");
    }
    Department department = departments.findById(req.departmentId())
        .filter(Department::isActive)
        .orElseThrow(() -> new DomainException(
            HttpStatus.BAD_REQUEST, "DEPARTMENT_UNAVAILABLE", "The selected department is invalid or inactive."));

    AppUser user = new AppUser(UUID.randomUUID(), cleanEmail, passwordEncoder.encode(req.password()), "DOCTOR");
    users.save(user);

    Doctor doctor = new Doctor(
        user.getId(),
        req.fullName().strip(),
        req.specialization().strip(),
        department.getId(),
        cleanLicense,
        req.experienceYears(),
        req.phone() != null ? req.phone().strip() : null,
        req.gender(),
        req.dateOfBirth(),
        req.consultationFee()
    );
    doctors.save(doctor);
    provisionDefaultDoctorSchedules(doctor.getId());

    audit.record(adminId, "DOCTOR_CREATED", "DOCTOR", doctor.getId(), "SUCCESS");
    return mapDoctorView(doctor, user.getEmail(), department.getName());
  }

  private void provisionDefaultDoctorSchedules(UUID doctorId) {
    for (int day = 1; day <= 6; day++) {
      schedules.save(new DoctorSchedule(doctorId, day, LocalTime.of(9, 0), LocalTime.of(13, 0), 30));
      schedules.save(new DoctorSchedule(doctorId, day, LocalTime.of(14, 0), LocalTime.of(17, 0), 30));
    }
  }

  @Transactional(readOnly = true)
  public List<AdminDtos.DoctorView> listDoctors(String search, UUID departmentId, Boolean active) {
    List<Doctor> all = doctors.findAllByOrderByFullNameAsc();
    Map<UUID, String> deptNames = getDepartmentNames();

    return all.stream()
        .filter(d -> departmentId == null || d.getDepartmentId().equals(departmentId))
        .filter(d -> active == null || d.isActive() == active)
        .filter(d -> {
          if (search == null || search.isBlank()) return true;
          String q = search.strip().toLowerCase(Locale.ROOT);
          return d.getFullName().toLowerCase(Locale.ROOT).contains(q)
              || d.getDoctorNumber().toLowerCase(Locale.ROOT).contains(q)
              || d.getSpecialization().toLowerCase(Locale.ROOT).contains(q)
              || (d.getLicenseNumber() != null && d.getLicenseNumber().toLowerCase(Locale.ROOT).contains(q));
        })
        .map(d -> {
          String email = users.findById(d.getUserId()).map(AppUser::getEmail).orElse("");
          String deptName = deptNames.getOrDefault(d.getDepartmentId(), "Unknown");
          return mapDoctorView(d, email, deptName);
        })
        .toList();
  }

  @Transactional(readOnly = true)
  public AdminDtos.DoctorView getDoctor(UUID doctorId) {
    Doctor d = doctors.findById(doctorId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "DOCTOR_NOT_FOUND", "Doctor profile not found."));
    String email = users.findById(d.getUserId()).map(AppUser::getEmail).orElse("");
    String deptName = departments.findById(d.getDepartmentId()).map(Department::getName).orElse("Unknown");
    return mapDoctorView(d, email, deptName);
  }

  @Transactional
  public AdminDtos.DoctorView updateDoctor(UUID adminId, UUID doctorId, AdminDtos.AdminDoctorUpdate req) {
    Doctor d = doctors.findById(doctorId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "DOCTOR_NOT_FOUND", "Doctor profile not found."));
    
    if (req.licenseNumber() != null) {
      String cleanLicense = req.licenseNumber().strip().toUpperCase(Locale.ROOT);
      if (!cleanLicense.equalsIgnoreCase(d.getLicenseNumber()) && doctors.existsByLicenseNumberIgnoreCase(cleanLicense)) {
        throw new DomainException(HttpStatus.CONFLICT, "LICENSE_ALREADY_EXISTS", "License number is used by another doctor.");
      }
    }

    Department dept = departments.findById(req.departmentId())
        .orElseThrow(() -> new DomainException(HttpStatus.BAD_REQUEST, "DEPARTMENT_UNAVAILABLE", "Department not found."));

    d.updateDetails(
        req.fullName(),
        req.specialization(),
        dept.getId(),
        req.licenseNumber() != null ? req.licenseNumber().strip().toUpperCase(Locale.ROOT) : null,
        req.experienceYears(),
        req.phone(),
        req.gender(),
        req.dateOfBirth(),
        req.consultationFee()
    );
    if (req.active() != null) {
      d.setActive(req.active());
    }
    doctors.save(d);

    audit.record(adminId, "DOCTOR_UPDATED", "DOCTOR", doctorId, "SUCCESS");
    String email = users.findById(d.getUserId()).map(AppUser::getEmail).orElse("");
    return mapDoctorView(d, email, dept.getName());
  }

  @Transactional
  public AdminDtos.DoctorView setDoctorActive(UUID adminId, UUID doctorId, boolean active) {
    Doctor d = doctors.findById(doctorId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "DOCTOR_NOT_FOUND", "Doctor profile not found."));
    d.setActive(active);
    doctors.save(d);

    // Sync status with user account
    users.findById(d.getUserId()).ifPresent(user -> {
      if (active) user.activate(); else user.deactivate();
      users.save(user);
    });

    audit.record(adminId, active ? "DOCTOR_ACTIVATED" : "DOCTOR_DEACTIVATED", "DOCTOR", doctorId, "SUCCESS");
    String email = users.findById(d.getUserId()).map(AppUser::getEmail).orElse("");
    String deptName = departments.findById(d.getDepartmentId()).map(Department::getName).orElse("Unknown");
    return mapDoctorView(d, email, deptName);
  }

  @Transactional
  public void deleteDoctor(UUID adminId, UUID doctorId) {
    Doctor d = doctors.findById(doctorId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "DOCTOR_NOT_FOUND", "Doctor profile not found."));
    UUID userId = d.getUserId();

    if (adminId != null && adminId.equals(userId)) {
      throw new DomainException(HttpStatus.BAD_REQUEST, "CANNOT_DELETE_SELF", "You cannot delete your own administrative account.");
    }

    // 1. Unlink self-referencing and external appointment foreign keys
    jdbc.update("UPDATE appointment SET rescheduled_from_appointment_id = NULL WHERE doctor_id = ? OR rescheduled_from_appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)", doctorId, doctorId);
    jdbc.update("UPDATE appointment SET rescheduled_to_appointment_id = NULL WHERE doctor_id = ? OR rescheduled_to_appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)", doctorId, doctorId);
    jdbc.update("UPDATE waitlist_entry SET offered_appointment_id = NULL WHERE offered_appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)", doctorId);
    jdbc.update("UPDATE appointment SET reservation_id = NULL WHERE doctor_id = ? OR reservation_id IN (SELECT reservation_id FROM slot_reservation WHERE doctor_id = ?)", doctorId, doctorId);

    // 2. Delete tokens, prescriptions, consultations, clinical records, invoices, payments
    jdbc.update("DELETE FROM opd_token WHERE doctor_id = ? OR appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)", doctorId, doctorId);
    jdbc.update("DELETE FROM prescription_item WHERE prescription_id IN (SELECT prescription_id FROM prescription WHERE doctor_id = ? OR appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?))", doctorId, doctorId);
    jdbc.update("DELETE FROM prescription WHERE doctor_id = ? OR appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)", doctorId, doctorId);
    jdbc.update("DELETE FROM consultation WHERE doctor_id = ? OR appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)", doctorId, doctorId);
    jdbc.update("DELETE FROM clinical_record WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)", doctorId);
    jdbc.update("DELETE FROM invoice_item WHERE invoice_id IN (SELECT invoice_id FROM invoice WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?))", doctorId);
    jdbc.update("DELETE FROM payment_transaction WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?) OR invoice_id IN (SELECT invoice_id FROM invoice WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?))", doctorId, doctorId);
    jdbc.update("DELETE FROM invoice WHERE appointment_id IN (SELECT appointment_id FROM appointment WHERE doctor_id = ?)", doctorId);

    // 3. Delete appointments
    jdbc.update("DELETE FROM appointment WHERE doctor_id = ?", doctorId);

    // 4. Delete schedule exceptions, schedules, reservations, applications, waitlists
    jdbc.update("DELETE FROM waitlist_entry WHERE doctor_id = ?", doctorId);
    jdbc.update("UPDATE emergency_case SET assigned_doctor_id = NULL WHERE assigned_doctor_id = ?", doctorId);
    jdbc.update("DELETE FROM doctor_schedule_exception WHERE doctor_id = ?", doctorId);
    jdbc.update("DELETE FROM doctor_schedule WHERE doctor_id = ?", doctorId);
    jdbc.update("DELETE FROM slot_reservation WHERE doctor_id = ?", doctorId);

    // 5. Delete doctor entity
    jdbc.update("DELETE FROM doctor WHERE doctor_id = ?", doctorId);

    // 6. Delete user account and cascade user_role, refresh_session, notifications, etc.
    if (userId != null) {
      cleanupUserAssociations(adminId, userId);
    }

    audit.record(adminId, "DOCTOR_DELETED", "DOCTOR", doctorId, "SUCCESS");
  }

  // --- STAFF MANAGEMENT ---

  @Transactional
  public AdminDtos.StaffView createStaff(UUID adminId, AdminDtos.AdminStaffCreate req) {
    String cleanEmail = req.email().strip().toLowerCase(Locale.ROOT);
    if (users.existsByEmailIgnoreCase(cleanEmail)) {
      throw new DomainException(
          HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
    }
    if (req.employeeId() != null && !req.employeeId().isBlank()) {
      String cleanEmp = req.employeeId().strip().toUpperCase(Locale.ROOT);
      if (staffMembers.existsByEmployeeIdIgnoreCase(cleanEmp)) {
        throw new DomainException(
            HttpStatus.CONFLICT, "EMPLOYEE_ID_EXISTS", "A staff member with this Employee ID already exists.");
      }
    }

    String deptName = "General";
    if (req.departmentId() != null) {
      Department dept = departments.findById(req.departmentId())
          .orElseThrow(() -> new DomainException(HttpStatus.BAD_REQUEST, "DEPARTMENT_UNAVAILABLE", "Selected department not found."));
      deptName = dept.getName();
    }

    AppUser user = new AppUser(UUID.randomUUID(), cleanEmail, passwordEncoder.encode(req.password()), "STAFF");
    users.save(user);

    StaffMember staff = new StaffMember(
        user.getId(),
        req.employeeId(),
        req.fullName(),
        req.phone(),
        req.gender(),
        req.dateOfBirth(),
        req.departmentId(),
        req.staffType(),
        req.designation(),
        LocalDate.now()
    );
    staffMembers.save(staff);

    audit.record(adminId, "STAFF_CREATED", "STAFF", staff.getId(), "SUCCESS");
    return mapStaffView(staff, user.getEmail(), deptName);
  }

  @Transactional(readOnly = true)
  public List<AdminDtos.StaffView> listStaff(String search, UUID departmentId, String staffType, Boolean active) {
    List<StaffMember> all = staffMembers.findAllByOrderByCreatedAtDesc();
    Map<UUID, String> deptNames = getDepartmentNames();

    return all.stream()
        .filter(s -> departmentId == null || (s.getDepartmentId() != null && s.getDepartmentId().equals(departmentId)))
        .filter(s -> staffType == null || staffType.isBlank() || s.getStaffType().equalsIgnoreCase(staffType.strip()))
        .filter(s -> active == null || s.isActive() == active)
        .filter(s -> {
          if (search == null || search.isBlank()) return true;
          String q = search.strip().toLowerCase(Locale.ROOT);
          return s.getFullName().toLowerCase(Locale.ROOT).contains(q)
              || s.getEmployeeId().toLowerCase(Locale.ROOT).contains(q)
              || (s.getDesignation() != null && s.getDesignation().toLowerCase(Locale.ROOT).contains(q));
        })
        .map(s -> {
          String email = users.findById(s.getUserId()).map(AppUser::getEmail).orElse("");
          String deptName = s.getDepartmentId() != null ? deptNames.getOrDefault(s.getDepartmentId(), "General") : "General";
          return mapStaffView(s, email, deptName);
        })
        .toList();
  }

  @Transactional(readOnly = true)
  public AdminDtos.StaffView getStaff(UUID staffId) {
    StaffMember s = staffMembers.findById(staffId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "STAFF_NOT_FOUND", "Staff member profile not found."));
    String email = users.findById(s.getUserId()).map(AppUser::getEmail).orElse("");
    String deptName = s.getDepartmentId() != null
        ? departments.findById(s.getDepartmentId()).map(Department::getName).orElse("General")
        : "General";
    return mapStaffView(s, email, deptName);
  }

  @Transactional
  public AdminDtos.StaffView updateStaff(UUID adminId, UUID staffId, AdminDtos.AdminStaffUpdate req) {
    StaffMember s = staffMembers.findById(staffId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "STAFF_NOT_FOUND", "Staff member profile not found."));

    s.updateDetails(
        req.fullName(),
        req.phone(),
        req.gender(),
        req.dateOfBirth(),
        req.departmentId(),
        req.staffType(),
        req.designation()
    );
    if (req.active() != null) {
      s.setActive(req.active());
    }
    staffMembers.save(s);

    audit.record(adminId, "STAFF_UPDATED", "STAFF", staffId, "SUCCESS");
    String email = users.findById(s.getUserId()).map(AppUser::getEmail).orElse("");
    String deptName = s.getDepartmentId() != null
        ? departments.findById(s.getDepartmentId()).map(Department::getName).orElse("General")
        : "General";
    return mapStaffView(s, email, deptName);
  }

  @Transactional
  public AdminDtos.StaffView setStaffActive(UUID adminId, UUID staffId, boolean active) {
    StaffMember s = staffMembers.findById(staffId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "STAFF_NOT_FOUND", "Staff member profile not found."));
    s.setActive(active);
    staffMembers.save(s);

    // Sync status with user account
    users.findById(s.getUserId()).ifPresent(user -> {
      if (active) user.activate(); else user.deactivate();
      users.save(user);
    });

    audit.record(adminId, active ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED", "STAFF", staffId, "SUCCESS");
    String email = users.findById(s.getUserId()).map(AppUser::getEmail).orElse("");
    String deptName = s.getDepartmentId() != null
        ? departments.findById(s.getDepartmentId()).map(Department::getName).orElse("General")
        : "General";
    return mapStaffView(s, email, deptName);
  }

  @Transactional
  public void deleteStaff(UUID adminId, UUID staffId) {
    StaffMember s = staffMembers.findById(staffId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "STAFF_NOT_FOUND", "Staff member not found."));
    UUID userId = s.getUserId();

    if (adminId != null && adminId.equals(userId)) {
      throw new DomainException(HttpStatus.BAD_REQUEST, "CANNOT_DELETE_SELF", "You cannot delete your own administrative account.");
    }

    // 1. Delete staff entity
    jdbc.update("DELETE FROM staff_member WHERE staff_id = ?", staffId);

    // 2. Delete user account and cascade user_role, refresh_session, notifications, etc.
    if (userId != null) {
      cleanupUserAssociations(adminId, userId);
    }

    audit.record(adminId, "STAFF_DELETED", "STAFF", staffId, "SUCCESS");
  }

  // --- USER MANAGEMENT ---

  @Transactional(readOnly = true)
  public List<AdminDtos.UserView> listUsers(String search, String roleFilter, String statusFilter) {
    List<AppUser> all = users.findAll();
    return all.stream()
        .filter(u -> roleFilter == null || roleFilter.isBlank() || u.getRoles().contains(roleFilter.strip().toUpperCase(Locale.ROOT)))
        .filter(u -> statusFilter == null || statusFilter.isBlank() || u.getStatus().equalsIgnoreCase(statusFilter.strip()))
        .filter(u -> {
          if (search == null || search.isBlank()) return true;
          String q = search.strip().toLowerCase(Locale.ROOT);
          return u.getEmail().toLowerCase(Locale.ROOT).contains(q) || u.getId().toString().toLowerCase(Locale.ROOT).contains(q);
        })
        .map(u -> new AdminDtos.UserView(
            u.getId(),
            u.getEmail(),
            u.getStatus(),
            u.getCreatedAt(),
            u.getRoles(),
            resolveUserFullName(u)
        ))
        .toList();
  }

  @Transactional
  public AdminDtos.UserView setUserActive(UUID adminId, UUID userId, boolean active) {
    AppUser u = users.findById(userId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User account not found."));

    if (active) u.activate(); else u.deactivate();
    users.save(u);

    // Also update associated doctor or staff record if exists
    doctors.findByUserId(userId).ifPresent(d -> {
      d.setActive(active);
      doctors.save(d);
    });
    staffMembers.findByUserId(userId).ifPresent(s -> {
      s.setActive(active);
      staffMembers.save(s);
    });

    audit.record(adminId, active ? "USER_ACTIVATED" : "USER_DEACTIVATED", "USER", userId, "SUCCESS");
    return new AdminDtos.UserView(u.getId(), u.getEmail(), u.getStatus(), u.getCreatedAt(), u.getRoles(), resolveUserFullName(u));
  }

  @Transactional
  public void resetPassword(UUID adminId, UUID userId, String newPassword) {
    AppUser u = users.findById(userId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User account not found."));

    u.updatePasswordHash(passwordEncoder.encode(newPassword));
    users.save(u);

    audit.record(adminId, "USER_PASSWORD_RESET", "USER", userId, "SUCCESS");
  }

  // --- HELPERS ---

  private void cleanupUserAssociations(UUID adminId, UUID userId) {
    if (userId == null) return;

    UUID effectiveAdmin = adminId;
    if (effectiveAdmin == null || effectiveAdmin.equals(userId)) {
      effectiveAdmin = users.findAll().stream()
          .filter(u -> u.getRoles().contains("ADMIN") && !u.getId().equals(userId))
          .map(AppUser::getId)
          .findFirst()
          .orElse(null);
    }

    if (effectiveAdmin != null) {
      jdbc.update("UPDATE clinical_record SET author_id = ? WHERE author_id = ?", effectiveAdmin, userId);
      jdbc.update("UPDATE lab_order SET ordered_by = ? WHERE ordered_by = ?", effectiveAdmin, userId);
      jdbc.update("UPDATE emergency_case SET opened_by = ? WHERE opened_by = ?", effectiveAdmin, userId);
    } else {
      jdbc.update("DELETE FROM clinical_record WHERE author_id = ?", userId);
      jdbc.update("DELETE FROM lab_order WHERE ordered_by = ?", userId);
      jdbc.update("DELETE FROM emergency_case WHERE opened_by = ?", userId);
    }

    jdbc.update("UPDATE doctor_application SET reviewed_by = NULL WHERE reviewed_by = ?", userId);
    jdbc.update("UPDATE capacity_snapshot SET captured_by = NULL WHERE captured_by = ?", userId);
    jdbc.update("DELETE FROM doctor_application WHERE user_id = ?", userId);
    jdbc.update("DELETE FROM recommendation_feedback WHERE user_id = ?", userId);
    jdbc.update("DELETE FROM notification WHERE user_id = ?", userId);

    // Clean up patient records associated with this user account (if any)
    jdbc.update("UPDATE appointment SET rescheduled_from_appointment_id = NULL WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("UPDATE appointment SET rescheduled_to_appointment_id = NULL WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("UPDATE waitlist_entry SET offered_appointment_id = NULL WHERE offered_appointment_id IN (SELECT appointment_id FROM appointment WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?))", userId);
    jdbc.update("UPDATE appointment SET reservation_id = NULL WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?) OR reservation_id IN (SELECT reservation_id FROM slot_reservation WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?))", userId, userId);

    jdbc.update("DELETE FROM opd_token WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("DELETE FROM prescription_item WHERE prescription_id IN (SELECT prescription_id FROM prescription WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?))", userId);
    jdbc.update("DELETE FROM prescription WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("DELETE FROM consultation WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("DELETE FROM clinical_record WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("DELETE FROM lab_order WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);

    jdbc.update("DELETE FROM payment_transaction WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?) OR invoice_id IN (SELECT invoice_id FROM invoice WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?))", userId, userId);
    jdbc.update("DELETE FROM invoice_item WHERE invoice_id IN (SELECT invoice_id FROM invoice WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?))", userId);
    jdbc.update("DELETE FROM invoice WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);

    jdbc.update("UPDATE emergency_case SET patient_id = NULL WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("DELETE FROM appointment WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("DELETE FROM slot_reservation WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("DELETE FROM waitlist_entry WHERE patient_id IN (SELECT patient_id FROM patient WHERE user_id = ?)", userId);
    jdbc.update("DELETE FROM patient WHERE user_id = ?", userId);

    // Clean up staff entity if present
    jdbc.update("DELETE FROM staff_member WHERE user_id = ?", userId);

    jdbc.update("DELETE FROM refresh_session WHERE user_id = ?", userId);
    jdbc.update("DELETE FROM user_role WHERE user_id = ?", userId);
    jdbc.update("DELETE FROM app_user WHERE user_id = ?", userId);
  }

  private Map<UUID, String> getDepartmentNames() {
    Map<UUID, String> map = new HashMap<>();
    departments.findAll().forEach(d -> map.put(d.getId(), d.getName()));
    return map;
  }

  private String resolveUserFullName(AppUser u) {
    Optional<Doctor> doc = doctors.findByUserId(u.getId());
    if (doc.isPresent()) return doc.get().getFullName();
    Optional<StaffMember> stf = staffMembers.findByUserId(u.getId());
    if (stf.isPresent()) return stf.get().getFullName();
    return u.getEmail().split("@")[0];
  }

  private AdminDtos.DoctorView mapDoctorView(Doctor d, String email, String departmentName) {
    return new AdminDtos.DoctorView(
        d.getId(),
        d.getUserId(),
        d.getDoctorNumber(),
        d.getFullName(),
        email,
        d.getPhone(),
        d.getGender(),
        d.getDateOfBirth(),
        d.getDepartmentId(),
        departmentName,
        d.getSpecialization(),
        d.getLicenseNumber(),
        d.getExperienceYears(),
        d.getConsultationFee(),
        d.getVerificationStatus(),
        d.isActive()
    );
  }

  private AdminDtos.StaffView mapStaffView(StaffMember s, String email, String departmentName) {
    return new AdminDtos.StaffView(
        s.getId(),
        s.getUserId(),
        s.getEmployeeId(),
        s.getFullName(),
        email,
        s.getPhone(),
        s.getGender(),
        s.getDateOfBirth(),
        s.getDepartmentId(),
        departmentName,
        s.getStaffType(),
        s.getDesignation(),
        s.getJoiningDate(),
        s.isActive(),
        s.getCreatedAt()
    );
  }
}
