package com.careflow.hospital.identity;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminManagementController {

  private final AdminUserManagementService adminService;

  public AdminManagementController(AdminUserManagementService adminService) {
    this.adminService = adminService;
  }

  // --- DOCTORS ---

  @PostMapping("/doctors")
  public ResponseEntity<AdminDtos.DoctorView> createDoctor(
      Authentication auth, @Valid @RequestBody AdminDtos.AdminDoctorCreate req) {
    UUID adminId = UUID.fromString(auth.getName());
    return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createDoctor(adminId, req));
  }

  @GetMapping("/doctors")
  public List<AdminDtos.DoctorView> listDoctors(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) UUID departmentId,
      @RequestParam(required = false) Boolean active) {
    return adminService.listDoctors(search, departmentId, active);
  }

  @GetMapping("/doctors/{id}")
  public AdminDtos.DoctorView getDoctor(@PathVariable UUID id) {
    return adminService.getDoctor(id);
  }

  @PutMapping("/doctors/{id}")
  public AdminDtos.DoctorView updateDoctor(
      Authentication auth, @PathVariable UUID id, @Valid @RequestBody AdminDtos.AdminDoctorUpdate req) {
    UUID adminId = UUID.fromString(auth.getName());
    return adminService.updateDoctor(adminId, id, req);
  }

  @PostMapping("/doctors/{id}/activate")
  public AdminDtos.DoctorView activateDoctor(Authentication auth, @PathVariable UUID id) {
    UUID adminId = UUID.fromString(auth.getName());
    return adminService.setDoctorActive(adminId, id, true);
  }

  @PostMapping("/doctors/{id}/deactivate")
  public AdminDtos.DoctorView deactivateDoctor(Authentication auth, @PathVariable UUID id) {
    UUID adminId = UUID.fromString(auth.getName());
    return adminService.setDoctorActive(adminId, id, false);
  }

  @DeleteMapping("/doctors/{id}")
  public ResponseEntity<Map<String, String>> deleteDoctor(Authentication auth, @PathVariable UUID id) {
    UUID adminId = UUID.fromString(auth.getName());
    adminService.deleteDoctor(adminId, id);
    return ResponseEntity.ok(Map.of("message", "Doctor deleted successfully"));
  }

  // --- STAFF ---

  @PostMapping("/staff")
  public ResponseEntity<AdminDtos.StaffView> createStaff(
      Authentication auth, @Valid @RequestBody AdminDtos.AdminStaffCreate req) {
    UUID adminId = UUID.fromString(auth.getName());
    return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createStaff(adminId, req));
  }

  @GetMapping("/staff")
  public List<AdminDtos.StaffView> listStaff(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) UUID departmentId,
      @RequestParam(required = false) String staffType,
      @RequestParam(required = false) Boolean active) {
    return adminService.listStaff(search, departmentId, staffType, active);
  }

  @GetMapping("/staff/{id}")
  public AdminDtos.StaffView getStaff(@PathVariable UUID id) {
    return adminService.getStaff(id);
  }

  @PutMapping("/staff/{id}")
  public AdminDtos.StaffView updateStaff(
      Authentication auth, @PathVariable UUID id, @Valid @RequestBody AdminDtos.AdminStaffUpdate req) {
    UUID adminId = UUID.fromString(auth.getName());
    return adminService.updateStaff(adminId, id, req);
  }

  @PostMapping("/staff/{id}/activate")
  public AdminDtos.StaffView activateStaff(Authentication auth, @PathVariable UUID id) {
    UUID adminId = UUID.fromString(auth.getName());
    return adminService.setStaffActive(adminId, id, true);
  }

  @PostMapping("/staff/{id}/deactivate")
  public AdminDtos.StaffView deactivateStaff(Authentication auth, @PathVariable UUID id) {
    UUID adminId = UUID.fromString(auth.getName());
    return adminService.setStaffActive(adminId, id, false);
  }

  @DeleteMapping("/staff/{id}")
  public ResponseEntity<Map<String, String>> deleteStaff(Authentication auth, @PathVariable UUID id) {
    UUID adminId = UUID.fromString(auth.getName());
    adminService.deleteStaff(adminId, id);
    return ResponseEntity.ok(Map.of("message", "Staff member deleted successfully"));
  }

  // --- USERS ---

  @GetMapping("/users")
  public List<AdminDtos.UserView> listUsers(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String role,
      @RequestParam(required = false) String status) {
    return adminService.listUsers(search, role, status);
  }

  @PostMapping("/users/{userId}/activate")
  public AdminDtos.UserView activateUser(Authentication auth, @PathVariable UUID userId) {
    UUID adminId = UUID.fromString(auth.getName());
    return adminService.setUserActive(adminId, userId, true);
  }

  @PostMapping("/users/{userId}/deactivate")
  public AdminDtos.UserView deactivateUser(Authentication auth, @PathVariable UUID userId) {
    UUID adminId = UUID.fromString(auth.getName());
    return adminService.setUserActive(adminId, userId, false);
  }

  @PostMapping("/users/{userId}/reset-password")
  public ResponseEntity<Map<String, String>> resetPassword(
      Authentication auth, @PathVariable UUID userId, @Valid @RequestBody AdminDtos.ResetPasswordRequest req) {
    UUID adminId = UUID.fromString(auth.getName());
    adminService.resetPassword(adminId, userId, req.newPassword());
    return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
  }
}
