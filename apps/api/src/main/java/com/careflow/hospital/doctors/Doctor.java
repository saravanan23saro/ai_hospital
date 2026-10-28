package com.careflow.hospital.doctors;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.*;

@Entity
@Table(name="doctor")
public class Doctor {
  @Id @Column(name="doctor_id") private UUID id;
  @Column(name="user_id",nullable=false,unique=true) private UUID userId;
  @Column(name="doctor_number",nullable=false,unique=true) private String doctorNumber;
  @Column(name="department_id",nullable=false) private UUID departmentId;
  @Column(name="verification_status",nullable=false) private String verificationStatus;
  @Column(nullable=false) private boolean active;
  @Column(name="full_name",nullable=false) private String fullName;
  @Column(nullable=false) private String specialization;
  @Column(name="license_number",unique=true) private String licenseNumber;
  @Column(name="experience_years",nullable=false) private int experienceYears;
  @Column private String phone;
  @Column private String gender;
  @Column(name="date_of_birth") private LocalDate dateOfBirth;
  @Column(name="consultation_fee") private Long consultationFee;

  protected Doctor() {}

  public Doctor(DoctorApplication a) {
    this.id = UUID.randomUUID();
    this.userId = a.getUserId();
    this.doctorNumber = "DOC-" + id.toString().substring(0,8).toUpperCase(Locale.ROOT);
    this.departmentId = a.getDepartmentId();
    this.verificationStatus = "APPROVED";
    this.active = true;
    this.fullName = a.getFullName();
    this.specialization = a.getSpecialization();
    this.licenseNumber = a.getLicenseNumber();
    this.experienceYears = a.getExperienceYears();
    this.consultationFee = 50000L;
  }

  public Doctor(UUID userId, String fullName, String specialization, UUID departmentId, String licenseNumber, int experienceYears, String phone, String gender, LocalDate dateOfBirth, Long consultationFee) {
    this.id = UUID.randomUUID();
    this.userId = userId;
    this.doctorNumber = "DOC-" + id.toString().substring(0,8).toUpperCase(Locale.ROOT);
    this.departmentId = departmentId;
    this.verificationStatus = "APPROVED";
    this.active = true;
    this.fullName = fullName;
    this.specialization = specialization;
    this.licenseNumber = licenseNumber;
    this.experienceYears = experienceYears;
    this.phone = phone;
    this.gender = gender;
    this.dateOfBirth = dateOfBirth;
    this.consultationFee = consultationFee != null ? consultationFee : 50000L;
  }

  public UUID getId() { return id; }
  public UUID getUserId() { return userId; }
  public String getDoctorNumber() { return doctorNumber; }
  public UUID getDepartmentId() { return departmentId; }
  public String getVerificationStatus() { return verificationStatus; }
  public String getFullName() { return fullName; }
  public String getSpecialization() { return specialization; }
  public String getLicenseNumber() { return licenseNumber; }
  public int getExperienceYears() { return experienceYears; }
  public boolean isActive() { return active; }
  public String getPhone() { return phone; }
  public String getGender() { return gender; }
  public LocalDate getDateOfBirth() { return dateOfBirth; }
  public Long getConsultationFee() { return consultationFee; }

  public void setActive(boolean active) { this.active = active; }
  public void updateDetails(String fullName, String specialization, UUID departmentId, String licenseNumber, int experienceYears, String phone, String gender, LocalDate dateOfBirth, Long consultationFee) {
    if (fullName != null && !fullName.isBlank()) this.fullName = fullName;
    if (specialization != null && !specialization.isBlank()) this.specialization = specialization;
    if (departmentId != null) this.departmentId = departmentId;
    if (licenseNumber != null && !licenseNumber.isBlank()) this.licenseNumber = licenseNumber;
    if (experienceYears >= 0) this.experienceYears = experienceYears;
    if (phone != null) this.phone = phone;
    if (gender != null) this.gender = gender;
    if (dateOfBirth != null) this.dateOfBirth = dateOfBirth;
    if (consultationFee != null && consultationFee >= 0) this.consultationFee = consultationFee;
  }
}
