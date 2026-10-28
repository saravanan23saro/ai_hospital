package com.careflow.hospital.staff;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.careflow.hospital.doctors.Doctor;
import com.careflow.hospital.doctors.DoctorRepository;
import com.careflow.hospital.patients.Patient;
import com.careflow.hospital.patients.PatientRepository;
import com.careflow.hospital.shared.DomainException;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class StaffAccessTest {

  private StaffMemberRepository staffMembers;
  private DoctorRepository doctors;
  private PatientRepository patients;
  private JdbcTemplate jdbc;
  private StaffAccessService staffAccessService;

  private UUID deptA;
  private UUID deptB;

  private UUID staffUserA;
  private UUID staffUserB;
  private StaffMember staffA;
  private StaffMember staffB;

  private UUID docAId;
  private UUID docBId;
  private Doctor docA;
  private Doctor docB;

  private UUID patAId;
  private UUID patBId;
  private Patient patA;
  private Patient patB;

  @BeforeEach
  void setUp() {
    staffMembers = mock(StaffMemberRepository.class);
    doctors = mock(DoctorRepository.class);
    patients = mock(PatientRepository.class);
    jdbc = mock(JdbcTemplate.class);

    staffAccessService = new StaffAccessService(staffMembers, doctors, patients, jdbc);

    deptA = UUID.randomUUID(); // Pediatrics
    deptB = UUID.randomUUID(); // Cardiology

    staffUserA = UUID.randomUUID();
    staffUserB = UUID.randomUUID();

    staffA = new StaffMember(
        staffUserA, "STF-PED01", "Staff A", "9876543201", "FEMALE",
        LocalDate.of(1990, 1, 1), deptA, "NURSE", "Pediatric Nurse", LocalDate.now());
    staffB = new StaffMember(
        staffUserB, "STF-CARD01", "Staff B", "9876543202", "MALE",
        LocalDate.of(1988, 5, 5), deptB, "NURSE", "Cardiac Nurse", LocalDate.now());

    when(staffMembers.findByUserId(staffUserA)).thenReturn(Optional.of(staffA));
    when(staffMembers.findByUserId(staffUserB)).thenReturn(Optional.of(staffB));

    docAId = UUID.randomUUID();
    docBId = UUID.randomUUID();

    docA = new Doctor(
        docAId, "Dr. Pediatrics", "Pediatrics", deptA, "LIC-PED01", 10,
        "9876543211", "FEMALE", LocalDate.of(1980, 2, 2), 50000L);
    docB = new Doctor(
        docBId, "Dr. Cardiology", "Cardiology", deptB, "LIC-CARD01", 15,
        "9876543222", "MALE", LocalDate.of(1975, 6, 6), 75000L);

    when(doctors.findById(docAId)).thenReturn(Optional.of(docA));
    when(doctors.findById(docBId)).thenReturn(Optional.of(docB));

    patAId = UUID.randomUUID();
    patBId = UUID.randomUUID();
    patA = new Patient(patAId, UUID.randomUUID(), "PAT-00001", "Child Patient");
    patB = new Patient(patBId, UUID.randomUUID(), "PAT-00002", "Cardiac Patient");

    when(patients.findById(patAId)).thenReturn(Optional.of(patA));
    when(patients.findById(patBId)).thenReturn(Optional.of(patB));
  }

  @Test
  void staffACanViewTheirAssignedDoctor() {
    Authentication authA = new UsernamePasswordAuthenticationToken(
        staffUserA.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    assertDoesNotThrow(() -> staffAccessService.checkDoctorAccess(authA, docAId));
    assertTrue(staffAccessService.isDoctorAssignedToStaff(staffA, docAId));
  }

  @Test
  void staffACannotViewStaffBAssignedDoctor() {
    Authentication authA = new UsernamePasswordAuthenticationToken(
        staffUserA.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    DomainException ex = assertThrows(
        DomainException.class, () -> staffAccessService.checkDoctorAccess(authA, docBId));
    assertEquals(HttpStatus.FORBIDDEN, ex.status());
    assertEquals("ACCESS_DENIED", ex.code());
    assertFalse(staffAccessService.isDoctorAssignedToStaff(staffA, docBId));
  }

  @Test
  void staffBCanViewTheirAssignedDoctor() {
    Authentication authB = new UsernamePasswordAuthenticationToken(
        staffUserB.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    assertDoesNotThrow(() -> staffAccessService.checkDoctorAccess(authB, docBId));
    assertTrue(staffAccessService.isDoctorAssignedToStaff(staffB, docBId));
  }

  @Test
  void staffBCannotViewStaffAAssignedDoctor() {
    Authentication authB = new UsernamePasswordAuthenticationToken(
        staffUserB.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    DomainException ex = assertThrows(
        DomainException.class, () -> staffAccessService.checkDoctorAccess(authB, docAId));
    assertEquals(HttpStatus.FORBIDDEN, ex.status());
    assertEquals("ACCESS_DENIED", ex.code());
    assertFalse(staffAccessService.isDoctorAssignedToStaff(staffB, docAId));
  }

  @Test
  void staffACanViewAssignedPatient() {
    Authentication authA = new UsernamePasswordAuthenticationToken(
        staffUserA.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    // Patient A is linked to Dept A (Pediatrics)
    when(jdbc.queryForObject(contains("appointment"), eq(Boolean.class), eq(patAId), eq(deptA)))
        .thenReturn(true);

    assertDoesNotThrow(() -> staffAccessService.checkPatientAccess(authA, patAId));
    assertTrue(staffAccessService.isPatientAssignedToStaff(staffA, patAId));
  }

  @Test
  void staffACannotViewStaffBAssignedPatient() {
    Authentication authA = new UsernamePasswordAuthenticationToken(
        staffUserA.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_STAFF")));

    // Patient B has no relationship to Dept A
    when(jdbc.queryForObject(contains("appointment"), eq(Boolean.class), eq(patBId), eq(deptA)))
        .thenReturn(false);
    when(jdbc.queryForObject(contains("emergency_case"), eq(Boolean.class), eq(patBId), eq(deptA)))
        .thenReturn(false);
    when(jdbc.queryForObject(contains("opened_by"), eq(Boolean.class), eq(patBId), eq(staffUserA)))
        .thenReturn(false);

    DomainException ex = assertThrows(
        DomainException.class, () -> staffAccessService.checkPatientAccess(authA, patBId));
    assertEquals(HttpStatus.FORBIDDEN, ex.status());
    assertEquals("ACCESS_DENIED", ex.code());
    assertFalse(staffAccessService.isPatientAssignedToStaff(staffA, patBId));
  }

  @Test
  void adminCanAccessAnyDoctorAndPatient() {
    UUID adminUserId = UUID.randomUUID();
    Authentication authAdmin = new UsernamePasswordAuthenticationToken(
        adminUserId.toString(), "", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

    assertDoesNotThrow(() -> staffAccessService.checkDoctorAccess(authAdmin, docAId));
    assertDoesNotThrow(() -> staffAccessService.checkDoctorAccess(authAdmin, docBId));
    assertDoesNotThrow(() -> staffAccessService.checkPatientAccess(authAdmin, patAId));
    assertDoesNotThrow(() -> staffAccessService.checkPatientAccess(authAdmin, patBId));
  }
}
