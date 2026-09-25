package com.careflow.hospital.patients;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public final class PatientDtos {
  private PatientDtos() {}
  public record UpdateProfile(@NotBlank @Size(max=160) String fullName,@NotNull @Past LocalDate dateOfBirth,@NotBlank @Pattern(regexp="\\d{10}",message="must contain exactly 10 digits") String phone,@NotBlank @Pattern(regexp="MALE|FEMALE|NON_BINARY|PREFER_NOT_TO_SAY",message="must be a supported value") String gender,@NotBlank @Size(max=2000) String address,@NotBlank @Pattern(regexp="\\d{10}",message="must contain exactly 10 digits") String emergencyContact,@NotBlank @Size(max=60) String preferredLanguage,@NotBlank @Pattern(regexp="A_POSITIVE|A_NEGATIVE|B_POSITIVE|B_NEGATIVE|AB_POSITIVE|AB_NEGATIVE|O_POSITIVE|O_NEGATIVE|UNKNOWN",message="must be a supported value") String bloodGroup,@Size(max=1000) String allergies,@Size(max=1000) String medicalConditions) {}
  public record Profile(UUID patientId,String patientNumber,String fullName,LocalDate dateOfBirth,String phone,String gender,String address,String emergencyContact,String preferredLanguage,String bloodGroup,String allergies,String medicalConditions,boolean profileComplete) {}
}
