package com.careflow.hospital.staff;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "staff_member")
public class StaffMember {

  @Id
  @Column(name = "staff_id")
  private UUID id;

  @Column(name = "user_id", nullable = false, unique = true)
  private UUID userId;

  @Column(name = "employee_id", nullable = false, unique = true)
  private String employeeId;

  @Column(name = "full_name", nullable = false)
  private String fullName;

  @Column
  private String phone;

  @Column
  private String gender;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Column(name = "department_id")
  private UUID departmentId;

  @Column(name = "staff_type", nullable = false)
  private String staffType;

  @Column
  private String designation;

  @Column(name = "joining_date")
  private LocalDate joiningDate;

  @Column(nullable = false)
  private boolean active;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected StaffMember() {}

  public StaffMember(
      UUID userId,
      String employeeId,
      String fullName,
      String phone,
      String gender,
      LocalDate dateOfBirth,
      UUID departmentId,
      String staffType,
      String designation,
      LocalDate joiningDate) {
    this.id = UUID.randomUUID();
    this.userId = userId;
    this.employeeId = (employeeId != null && !employeeId.isBlank())
        ? employeeId.strip().toUpperCase(Locale.ROOT)
        : "STF-" + id.toString().substring(0, 8).toUpperCase(Locale.ROOT);
    this.fullName = fullName != null ? fullName.strip() : "";
    this.phone = phone != null ? phone.strip() : null;
    this.gender = gender;
    this.dateOfBirth = dateOfBirth;
    this.departmentId = departmentId;
    this.staffType = staffType != null ? staffType.strip().toUpperCase(Locale.ROOT) : "GENERAL";
    this.designation = designation != null ? designation.strip() : "Staff Member";
    this.joiningDate = joiningDate != null ? joiningDate : LocalDate.now();
    this.active = true;
    this.createdAt = Instant.now();
  }

  public UUID getId() { return id; }
  public UUID getUserId() { return userId; }
  public String getEmployeeId() { return employeeId; }
  public String getFullName() { return fullName; }
  public String getPhone() { return phone; }
  public String getGender() { return gender; }
  public LocalDate getDateOfBirth() { return dateOfBirth; }
  public UUID getDepartmentId() { return departmentId; }
  public String getStaffType() { return staffType; }
  public String getDesignation() { return designation; }
  public LocalDate getJoiningDate() { return joiningDate; }
  public boolean isActive() { return active; }
  public Instant getCreatedAt() { return createdAt; }

  public void setActive(boolean active) { this.active = active; }

  public void updateDetails(
      String fullName,
      String phone,
      String gender,
      LocalDate dateOfBirth,
      UUID departmentId,
      String staffType,
      String designation) {
    if (fullName != null && !fullName.isBlank()) this.fullName = fullName.strip();
    if (phone != null) this.phone = phone.strip();
    if (gender != null) this.gender = gender;
    if (dateOfBirth != null) this.dateOfBirth = dateOfBirth;
    if (departmentId != null) this.departmentId = departmentId;
    if (staffType != null && !staffType.isBlank()) this.staffType = staffType.strip().toUpperCase(Locale.ROOT);
    if (designation != null && !designation.isBlank()) this.designation = designation.strip();
  }
}
