package com.careflow.hospital.identity;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public final class AdminDtos {
  private AdminDtos() {}

  public record AdminDoctorCreate(
      @NotBlank @Size(max = 160) String fullName,
      @NotBlank @Email String email,
      @NotBlank @Size(min = 6, max = 100) String password,
      @Pattern(regexp = "^$|^\\+?[0-9]{10,15}$", message = "Invalid phone number format") String phone,
      String gender,
      LocalDate dateOfBirth,
      @NotNull UUID departmentId,
      @NotBlank @Size(max = 120) String specialization,
      @NotBlank @Size(max = 100) String licenseNumber,
      @Min(0) @Max(80) int experienceYears,
      @Min(0) Long consultationFee
  ) {}

  public record AdminDoctorUpdate(
      @NotBlank @Size(max = 160) String fullName,
      @Pattern(regexp = "^$|^\\+?[0-9]{10,15}$", message = "Invalid phone number format") String phone,
      String gender,
      LocalDate dateOfBirth,
      @NotNull UUID departmentId,
      @NotBlank @Size(max = 120) String specialization,
      @NotBlank @Size(max = 100) String licenseNumber,
      @Min(0) @Max(80) int experienceYears,
      @Min(0) Long consultationFee,
      Boolean active
  ) {}

  public record AdminStaffCreate(
      @NotBlank @Size(max = 160) String fullName,
      @NotBlank @Email String email,
      @NotBlank @Size(min = 6, max = 100) String password,
      @Pattern(regexp = "^$|^\\+?[0-9]{10,15}$", message = "Invalid phone number format") String phone,
      String gender,
      LocalDate dateOfBirth,
      UUID departmentId,
      @NotBlank @Size(max = 60) String staffType,
      @NotBlank @Size(max = 100) String designation,
      String employeeId
  ) {}

  public record AdminStaffUpdate(
      @NotBlank @Size(max = 160) String fullName,
      @Pattern(regexp = "^$|^\\+?[0-9]{10,15}$", message = "Invalid phone number format") String phone,
      String gender,
      LocalDate dateOfBirth,
      UUID departmentId,
      @NotBlank @Size(max = 60) String staffType,
      @NotBlank @Size(max = 100) String designation,
      Boolean active
  ) {}

  public record ResetPasswordRequest(
      @NotBlank @Size(min = 6, max = 100) String newPassword
  ) {}

  public record UserView(
      UUID userId,
      String email,
      String status,
      Instant createdAt,
      Set<String> roles,
      String fullName
  ) {}

  public record DoctorView(
      UUID doctorId,
      UUID userId,
      String doctorNumber,
      String fullName,
      String email,
      String phone,
      String gender,
      LocalDate dateOfBirth,
      UUID departmentId,
      String departmentName,
      String specialization,
      String licenseNumber,
      int experienceYears,
      Long consultationFee,
      String verificationStatus,
      boolean active
  ) {}

  public record StaffView(
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
      boolean active,
      Instant createdAt
  ) {}
}
