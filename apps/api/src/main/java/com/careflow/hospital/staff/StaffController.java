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
  private final StaffAccessService staffAccessService;

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

  public record StaffDoctorView(
      UUID doctorId,
      String fullName,
      String specialization,
      UUID departmentId,
      String departmentName,
      Long consultationFee,
      boolean active
  ) {}

  public record StaffPatientView(
      UUID patientId,
      String patientNumber,
      String fullName,
      LocalDate dateOfBirth,
      String gender,
      String phone,
      String bloodGroup,
      String emergencyContact,
      String allergies,
      String medicalConditions
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

  public StaffController(
      StaffMemberRepository staffMembers,
      AppUserRepository users,
      DepartmentRepository departments,
      PatientRepository patients,
      DoctorRepository doctors,
      AppointmentService appointmentService,
      PasswordEncoder passwordEncoder,
      StaffAccessService staffAccessService) {
    this.staffMembers = staffMembers;
    this.users = users;
    this.departments = departments;
    this.patients = patients;
    this.doctors = doctors;
    this.appointmentService = appointmentService;
    this.passwordEncoder = passwordEncoder;
    this.staffAccessService = staffAccessService;
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

  @GetMapping("/doctors")
  public List<StaffDoctorView> getDoctors(Authentication auth) {
    Map<UUID, String> deptNames = departments.findAll().stream()
        .collect(Collectors.toMap(Department::getId, Department::getName, (a, b) -> a));

    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    List<Doctor> docList;
    if (isAdmin) {
      docList = doctors.findAllByActiveTrueOrderByFullNameAsc();
    } else {
      UUID userId = UUID.fromString(auth.getName());
      StaffMember staff = staffAccessService.getStaffMember(userId);
      docList = staffAccessService.getAssignedDoctors(staff);
    }

    return docList.stream()
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

  @GetMapping("/doctors/{id}")
  public StaffDoctorView getDoctor(Authentication auth, @PathVariable UUID id) {
    staffAccessService.checkDoctorAccess(auth, id);
    Doctor d = doctors.findById(id)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "DOCTOR_NOT_FOUND", "Doctor profile not found."));
    String deptName = d.getDepartmentId() != null
        ? departments.findById(d.getDepartmentId()).map(Department::getName).orElse("General")
        : "General";
    return new StaffDoctorView(
        d.getId(),
        d.getFullName(),
        d.getSpecialization(),
        d.getDepartmentId(),
        deptName,
        d.getConsultationFee(),
        d.isActive()
    );
  }

  @GetMapping("/patients")
  public List<StaffPatientView> getAssignedPatients(
      Authentication auth,
      @RequestParam(value = "query", required = false) String query) {
    boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    if (isAdmin) {
      return patients.findAll().stream()
          .filter(p -> query == null || query.isBlank()
              || (p.getFullName() != null && p.getFullName().toLowerCase().contains(query.trim().toLowerCase()))
              || (p.getPatientNumber() != null && p.getPatientNumber().toLowerCase().contains(query.trim().toLowerCase())))
          .map(this::mapPatientView)
          .toList();
    }

    UUID userId = UUID.fromString(auth.getName());
    StaffMember staff = staffAccessService.getStaffMember(userId);
    List<Map<String, Object>> patientRows = (query != null && !query.isBlank())
        ? staffAccessService.searchAssignedPatients(staff, query)
        : staffAccessService.getAssignedPatientsList(staff);

    return patientRows.stream().map(r -> new StaffPatientView(
        (UUID) r.get("patient_id"),
        (String) r.get("patient_number"),
        (String) r.get("full_name"),
        r.get("date_of_birth") != null ? ((java.sql.Date) r.get("date_of_birth")).toLocalDate() : null,
        (String) r.get("gender"),
        (String) r.get("phone"),
        (String) r.get("blood_group"),
        (String) r.get("emergency_contact"),
        (String) r.get("allergies"),
        (String) r.get("medical_conditions")
    )).toList();
  }

  @GetMapping("/patients/{id}")
  public StaffPatientView getPatient(Authentication auth, @PathVariable UUID id) {
    staffAccessService.checkPatientAccess(auth, id);
    Patient p = patients.findById(id)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND", "Patient profile not found."));
    return mapPatientView(p);
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

  @PostMapping("/appointments/book")
  public ResponseEntity<AppointmentDtos.View> bookAppointment(
      Authentication auth, @Valid @RequestBody StaffBookAppointment req) {
    UUID actorUserId = UUID.fromString(auth.getName());
    staffAccessService.checkDoctorAccess(auth, req.doctorId());
    if (!patients.existsById(req.patientId())) {
      throw new DomainException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND", "Patient profile not found.");
    }
    AppointmentDtos.View view = appointmentService.bookForPatient(
        actorUserId, req.patientId(), req.doctorId(), req.startsAt(), req.endsAt());
    return ResponseEntity.status(HttpStatus.CREATED).body(view);
  }

  private StaffPatientView mapPatientView(Patient p) {
    return new StaffPatientView(
        p.getId(),
        p.getPatientNumber(),
        p.getFullName(),
        p.getDateOfBirth(),
        p.getGender(),
        p.getPhone(),
        p.getBloodGroup(),
        p.getEmergencyContact(),
        p.getAllergies(),
        p.getMedicalConditions()
    );
  }
}
