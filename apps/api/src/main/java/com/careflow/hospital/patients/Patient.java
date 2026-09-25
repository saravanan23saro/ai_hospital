package com.careflow.hospital.patients;

import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity @Table(name="patient")
public class Patient {
  @Id @Column(name="patient_id") private UUID id;
  @Column(name="user_id",nullable=false,unique=true) private UUID userId;
  @Column(name="patient_number",nullable=false,unique=true) private String patientNumber;
  @Column(name="full_name",nullable=false) private String fullName;
  @Column(name="date_of_birth") private LocalDate dateOfBirth;
  private String phone;
  private String gender;
  @Column(columnDefinition="text") private String address;
  @Column(name="emergency_contact") private String emergencyContact;
  @Column(name="preferred_language") private String preferredLanguage;
  @Column(name="blood_group") private String bloodGroup;
  @Column(columnDefinition="text") private String allergies;
  @Column(name="medical_conditions",columnDefinition="text") private String medicalConditions;
  @Column(name="profile_complete",nullable=false) private boolean profileComplete;
  @Column(name="created_at",nullable=false) private Instant createdAt;

  protected Patient() {}
  public Patient(UUID id,UUID userId,String number){this.id=id;this.userId=userId;this.patientNumber=number;this.createdAt=Instant.now();}
  public Patient(UUID id,UUID userId,String number,String fullName){this(id,userId,number);this.fullName=fullName;}
  public void updateProfile(String fullName,LocalDate dateOfBirth,String phone,String gender,String address,String emergencyContact,String preferredLanguage,String bloodGroup,String allergies,String medicalConditions){this.fullName=fullName;this.dateOfBirth=dateOfBirth;this.phone=phone;this.gender=gender;this.address=address;this.emergencyContact=emergencyContact;this.preferredLanguage=preferredLanguage;this.bloodGroup=bloodGroup;this.allergies=allergies;this.medicalConditions=medicalConditions;this.profileComplete=true;}
  public UUID getId(){return id;} public UUID getUserId(){return userId;} public String getPatientNumber(){return patientNumber;} public String getFullName(){return fullName;} public LocalDate getDateOfBirth(){return dateOfBirth;} public String getPhone(){return phone;} public String getGender(){return gender;} public String getAddress(){return address;} public String getEmergencyContact(){return emergencyContact;} public String getPreferredLanguage(){return preferredLanguage;} public String getBloodGroup(){return bloodGroup;} public String getAllergies(){return allergies;} public String getMedicalConditions(){return medicalConditions;} public boolean isProfileComplete(){return profileComplete;}
}
