package com.careflow.hospital.staff;

import com.careflow.hospital.appointments.AppointmentDtos;
import com.careflow.hospital.appointments.AppointmentService;
import com.careflow.hospital.departments.Department;
import com.careflow.hospital.departments.DepartmentRepository;
import com.careflow.hospital.doctors.Doctor;
import com.careflow.hospital.doctors.DoctorRepository;
import com.careflow.hospital.identity.AppUser;
import com.careflow.hospital.identity.AppUserRepository;
import com.careflow.hospital.patients.Patient;
import com.careflow.hospital.patients.PatientRepository;
import com.careflow.hospital.shared.DomainException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff")
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffController {

  private final StaffMemberRepository staffMembers;
  private final AppUserRepository users;
  private final DepartmentRepository departments;
  private final PatientRepository patients;
  private final DoctorRepository doctors;
  private final AppointmentService appointmentService;
  private final PasswordEncoder passwordEncoder;

  public record StaffProfileView(
      UUID staffId,
      UUID userId,
      String employeeId,
      String fullName,
      String email,
      String phone,
      String gender,
      LocalDate dateOfBirth,
      UUID departmentId,
      String departmentName,
      String staffType,
      String designation,
      LocalDate joiningDate,
      boolean active
  ) {}

  public record PatientWalkInRegister(
      @NotBlank @Size(max = 160) String fullName,
      @NotBlank @Email String email,
      @NotBlank @Size(min = 6) String password,
      String phone,
      String gender,
      LocalDate dateOfBirth,
      String address,
      String emergencyContact,
      String bloodGroup,
      String allergies,
      String medicalConditions
  ) {}

  public record StaffBookAppointment(
      @NotNull UUID patientId,
      @NotNull UUID doctorId,
      @NotNull Instant startsAt,
      Instant endsAt
  ) {}

  public record StaffDoctorView(
      UUID doctorId,
      String fullName,
      String specialization,
      UUID departmentId,
      String departmentName,
      Long consultationFee,
      boolean active
  ) {}

  public StaffController(
      StaffMemberRepository staffMembers,
      AppUserRepository users,
      DepartmentRepository departments,
      PatientRepository patients,
      DoctorRepository doctors,
      AppointmentService appointmentService,
      PasswordEncoder passwordEncoder) {
    this.staffMembers = staffMembers;
    this.users = users;
    this.departments = departments;
    this.patients = patients;
    this.doctors = doctors;
    this.appointmentService = appointmentService;
    this.passwordEncoder = passwordEncoder;
  }

  @GetMapping("/me")
  public StaffProfileView getMyProfile(Authentication auth) {
    UUID userId = UUID.fromString(auth.getName());
    AppUser user = users.findById(userId)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User account not found."));

    StaffMember staff = staffMembers.findByUserId(userId).orElseGet(() -> {
      String name = user.getEmail().split("@")[0];
      if (!name.isEmpty()) {
        name = Character.toUpperCase(name.charAt(0)) + name.substring(1);
      } else {
        name = "Staff Member";
      }
      StaffMember newStaff = new StaffMember(
          userId,
          null,
          name,
          null,
          null,
          null,
          null,
          "OPERATIONS",
          "Hospital Staff",
          LocalDate.now()
      );
      return staffMembers.save(newStaff);
    });

    String deptName = staff.getDepartmentId() != null
        ? departments.findById(staff.getDepartmentId()).map(Department::getName).orElse("General")
        : "General";

    return new StaffProfileView(
        staff.getId(),
        staff.getUserId(),
        staff.getEmployeeId(),
        staff.getFullName(),
        user.getEmail(),
        staff.getPhone(),
        staff.getGender(),
        staff.getDateOfBirth(),
        staff.getDepartmentId(),
        deptName,
        staff.getStaffType(),
        staff.getDesignation(),
        staff.getJoiningDate(),
        staff.isActive()
    );
  }

  @PostMapping("/patients")
  public ResponseEntity<Map<String, Object>> registerWalkInPatient(
      Authentication auth, @Valid @RequestBody PatientWalkInRegister req) {
    String cleanEmail = req.email().strip().toLowerCase(Locale.ROOT);
    if (users.existsByEmailIgnoreCase(cleanEmail)) {
      throw new DomainException(HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED", "An account with this email already exists.");
    }
    AppUser user = new AppUser(UUID.randomUUID(), cleanEmail, passwordEncoder.encode(req.password()), "PATIENT");
    users.save(user);

    String patNumber = "PAT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
    Patient patient = new Patient(UUID.randomUUID(), user.getId(), patNumber, req.fullName().strip());
    patient.updateProfile(
        req.fullName().strip(),
        req.dateOfBirth(),
        req.phone() != null ? req.phone().strip() : null,
        req.gender(),
        req.address(),
        req.emergencyContact(),
        "English",
        req.bloodGroup() != null ? req.bloodGroup() : "UNKNOWN",
        req.allergies(),
        req.medicalConditions()
    );
    patients.save(patient);

    Map<String, Object> resp = new LinkedHashMap<>();
    resp.put("patientId", patient.getId());
    resp.put("patientNumber", patient.getPatientNumber());
    resp.put("fullName", patient.getFullName());
    resp.put("email", cleanEmail);
    resp.put("phone", patient.getPhone());
    resp.put("message", "Patient registered successfully.");
    return ResponseEntity.status(HttpStatus.CREATED).body(resp);
  }

  @GetMapping("/doctors")
  public List<StaffDoctorView> getDoctors() {
    Map<UUID, String> deptNames = departments.findAll().stream()
        .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));
    return doctors.findAllByActiveTrueOrderByFullNameAsc().stream()
        .map(d -> new StaffDoctorView(
            d.getId(),
            d.getFullName(),
            d.getSpecialization(),
            d.getDepartmentId(),
            deptNames.getOrDefault(d.getDepartmentId(), "General"),
            d.getConsultationFee(),
            d.isActive()
        ))
        .toList();
  }

  @PostMapping("/appointments/book")
  public ResponseEntity<AppointmentDtos.View> bookAppointment(
      Authentication auth, @Valid @RequestBody StaffBookAppointment req) {
    UUID actorUserId = UUID.fromString(auth.getName());
    AppointmentDtos.View view = appointmentService.bookForPatient(
        actorUserId, req.patientId(), req.doctorId(), req.startsAt(), req.endsAt());
    return ResponseEntity.status(HttpStatus.CREATED).body(view);
  }
}

