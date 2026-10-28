package com.careflow.hospital.staff;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

class StaffControllerTest {

  private StaffMemberRepository staffMembers;
  private AppUserRepository users;
  private DepartmentRepository departments;
  private PatientRepository patients;
  private DoctorRepository doctors;
  private AppointmentService appointmentService;
  private PasswordEncoder passwordEncoder;
  private StaffAccessService staffAccessService;
  private StaffController controller;

  @BeforeEach
  void setUp() {
    staffMembers = mock(StaffMemberRepository.class);
    users = mock(AppUserRepository.class);
    departments = mock(DepartmentRepository.class);
    patients = mock(PatientRepository.class);
    doctors = mock(DoctorRepository.class);
    appointmentService = mock(AppointmentService.class);
    passwordEncoder = mock(PasswordEncoder.class);
    staffAccessService = mock(StaffAccessService.class);
    when(passwordEncoder.encode(anyString())).thenReturn("hashed-pwd");

    controller = new StaffController(
        staffMembers, users, departments, patients, doctors, appointmentService, passwordEncoder, staffAccessService);
  }

  @Test
  void getMyProfileReturnsExistingStaffProfileWithJobType() {
    UUID userId = UUID.randomUUID();
    UUID deptId = UUID.randomUUID();
    Authentication auth = new UsernamePasswordAuthenticationToken(
        userId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    AppUser user = new AppUser(userId, "receptionist@hospital.test", "hashed", "STAFF");
    when(users.findById(userId)).thenReturn(Optional.of(user));

    StaffMember member = new StaffMember(
        userId, "STF-REC01", "Jane Receptionist", "9876543210", "FEMALE",
        LocalDate.of(1995, 3, 10), deptId, "RECEPTIONIST", "Front Desk Officer", LocalDate.now());
    when(staffMembers.findByUserId(userId)).thenReturn(Optional.of(member));

    Department dept = mock(Department.class);
    when(dept.getId()).thenReturn(deptId);
    when(dept.getName()).thenReturn("Reception");
    when(departments.findById(deptId)).thenReturn(Optional.of(dept));

    StaffController.StaffProfileView profile = controller.getMyProfile(auth);

    assertNotNull(profile);
    assertEquals("Jane Receptionist", profile.fullName());
    assertEquals("RECEPTIONIST", profile.staffType());
    assertEquals("Front Desk Officer", profile.designation());
    assertEquals("STF-REC01", profile.employeeId());
    assertEquals("Reception", profile.departmentName());
    assertTrue(profile.active());
  }

  @Test
  void getMyProfileAutoCreatesGeneralStaffIfUserHasRoleButNoProfile() {
    UUID userId = UUID.randomUUID();
    Authentication auth = new UsernamePasswordAuthenticationToken(
        userId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    AppUser user = new AppUser(userId, "saravanan@hospital.test", "hashed", "STAFF");
    when(users.findById(userId)).thenReturn(Optional.of(user));
    when(staffMembers.findByUserId(userId)).thenReturn(Optional.empty());

    when(staffMembers.save(any(StaffMember.class))).thenAnswer(invocation -> invocation.getArgument(0));

    StaffController.StaffProfileView profile = controller.getMyProfile(auth);

    assertNotNull(profile);
    assertEquals("Saravanan", profile.fullName());
    assertEquals("OPERATIONS", profile.staffType());
    assertEquals("Hospital Staff", profile.designation());
    verify(staffMembers).save(any(StaffMember.class));
  }

  @Test
  void registerWalkInPatientCreatesPatientAndUser() {
    UUID staffUserId = UUID.randomUUID();
    Authentication auth = new UsernamePasswordAuthenticationToken(
        staffUserId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    when(users.existsByEmailIgnoreCase("walkin@patient.test")).thenReturn(false);

    StaffController.PatientWalkInRegister req = new StaffController.PatientWalkInRegister(
        "Walkin Patient", "walkin@patient.test", "Secret123!", "9876543299", "MALE",
        LocalDate.of(1990, 1, 1), "123 Main St", "9876543200", "B_POSITIVE", "None", "None");

    ResponseEntity<Map<String, Object>> response = controller.registerWalkInPatient(auth, req);

    assertEquals(HttpStatus.CREATED, response.getStatusCode());
    assertNotNull(response.getBody());
    assertEquals("Walkin Patient", response.getBody().get("fullName"));
    assertEquals("walkin@patient.test", response.getBody().get("email"));
    assertTrue(String.valueOf(response.getBody().get("patientNumber")).startsWith("PAT-"));

    verify(users).save(argThat(u -> u.getRoles().contains("PATIENT")));
    verify(patients).save(any(Patient.class));
  }

  @Test
  void registerWalkInPatientThrowsConflictOnDuplicateEmail() {
    UUID staffUserId = UUID.randomUUID();
    Authentication auth = new UsernamePasswordAuthenticationToken(
        staffUserId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    when(users.existsByEmailIgnoreCase("duplicate@patient.test")).thenReturn(true);

    StaffController.PatientWalkInRegister req = new StaffController.PatientWalkInRegister(
        "Duplicate Patient", "duplicate@patient.test", "Secret123!", null, null, null, null, null, null, null, null);

    DomainException ex = assertThrows(DomainException.class, () -> controller.registerWalkInPatient(auth, req));
    assertEquals(HttpStatus.CONFLICT, ex.status());
    assertEquals("EMAIL_ALREADY_REGISTERED", ex.code());
  }

  @Test
  void getDoctorsReturnsAssignedDoctorsForStaffMember() {
    UUID staffUserId = UUID.randomUUID();
    UUID deptId = UUID.randomUUID();
    Authentication auth = new UsernamePasswordAuthenticationToken(
        staffUserId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    StaffMember staff = new StaffMember(
        staffUserId, "STF-CARD01", "Nurse Kelly", "9876543210", "FEMALE",
        LocalDate.of(1992, 1, 1), deptId, "NURSE", "Cardiac Care Nurse", LocalDate.now());
    when(staffAccessService.getStaffMember(staffUserId)).thenReturn(staff);

    Department dept = mock(Department.class);
    when(dept.getId()).thenReturn(deptId);
    when(dept.getName()).thenReturn("Cardiology");
    when(departments.findAll()).thenReturn(List.of(dept));

    Doctor doc = new Doctor(
        UUID.randomUUID(), "Dr. Rao", "Cardiology", deptId, "LIC-12345", 10,
        "9876543210", "MALE", LocalDate.of(1980, 5, 10), 60000L);
    when(staffAccessService.getAssignedDoctors(staff)).thenReturn(List.of(doc));

    List<StaffController.StaffDoctorView> list = controller.getDoctors(auth);

    assertEquals(1, list.size());
    assertEquals("Dr. Rao", list.getFirst().fullName());
    assertEquals("Cardiology", list.getFirst().departmentName());
    assertEquals("Cardiology", list.getFirst().specialization());
    assertTrue(list.getFirst().active());
  }

  @Test
  void getDoctorDetailsEnforcesStaffAccess() {
    UUID staffUserId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    Authentication auth = new UsernamePasswordAuthenticationToken(
        staffUserId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    // When authorized
    Doctor doc = new Doctor(
        doctorId, "Dr. Assigned", "Pediatrics", UUID.randomUUID(), "LIC-999", 5,
        "9876543211", "FEMALE", LocalDate.of(1985, 4, 12), 50000L);
    when(doctors.findById(doctorId)).thenReturn(Optional.of(doc));

    StaffController.StaffDoctorView view = controller.getDoctor(auth, doctorId);
    assertEquals("Dr. Assigned", view.fullName());
    verify(staffAccessService).checkDoctorAccess(auth, doctorId);

    // When unauthorized
    UUID unassignedDoctorId = UUID.randomUUID();
    doThrow(new DomainException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Forbidden"))
        .when(staffAccessService).checkDoctorAccess(auth, unassignedDoctorId);

    DomainException ex = assertThrows(DomainException.class, () -> controller.getDoctor(auth, unassignedDoctorId));
    assertEquals(HttpStatus.FORBIDDEN, ex.status());
  }

  @Test
  void getPatientDetailsEnforcesStaffAccess() {
    UUID staffUserId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    Authentication auth = new UsernamePasswordAuthenticationToken(
        staffUserId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    Patient patient = new Patient(patientId, UUID.randomUUID(), "PAT-123456", "John Doe");
    when(patients.findById(patientId)).thenReturn(Optional.of(patient));

    StaffController.StaffPatientView view = controller.getPatient(auth, patientId);
    assertEquals("John Doe", view.fullName());
    verify(staffAccessService).checkPatientAccess(auth, patientId);

    // When unauthorized
    UUID unassignedPatientId = UUID.randomUUID();
    doThrow(new DomainException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Forbidden"))
        .when(staffAccessService).checkPatientAccess(auth, unassignedPatientId);

    DomainException ex = assertThrows(DomainException.class, () -> controller.getPatient(auth, unassignedPatientId));
    assertEquals(HttpStatus.FORBIDDEN, ex.status());
  }

  @Test
  void bookAppointmentCallsAppointmentServiceAfterVerifyingAccess() {
    UUID staffUserId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    UUID doctorId = UUID.randomUUID();
    Instant startsAt = Instant.now().plusSeconds(3600);
    Instant endsAt = startsAt.plusSeconds(1800);

    Authentication auth = new UsernamePasswordAuthenticationToken(
        staffUserId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    AppointmentDtos.View expectedView = new AppointmentDtos.View(
        UUID.randomUUID(), "APT-123456", patientId, doctorId, "Dr. Rao", "Cardiology",
        startsAt, endsAt, "CONFIRMED", null, null, null);

    when(patients.existsById(patientId)).thenReturn(true);
    when(appointmentService.bookForPatient(staffUserId, patientId, doctorId, startsAt, endsAt))
        .thenReturn(expectedView);

    StaffController.StaffBookAppointment req = new StaffController.StaffBookAppointment(
        patientId, doctorId, startsAt, endsAt);

    ResponseEntity<AppointmentDtos.View> resp = controller.bookAppointment(auth, req);

    assertEquals(HttpStatus.CREATED, resp.getStatusCode());
    assertEquals(expectedView, resp.getBody());
    verify(staffAccessService).checkDoctorAccess(auth, doctorId);
    verify(patients).existsById(patientId);
    verify(appointmentService).bookForPatient(staffUserId, patientId, doctorId, startsAt, endsAt);
  }
}
