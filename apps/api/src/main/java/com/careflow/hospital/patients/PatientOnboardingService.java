package com.careflow.hospital.patients;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.identity.AppUserRepository;
import com.careflow.hospital.shared.DomainException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientOnboardingService {
  private final PatientRepository patients; private final AppUserRepository users; private final AuditService audit;
  public PatientOnboardingService(PatientRepository patients,AppUserRepository users,AuditService audit){this.patients=patients;this.users=users;this.audit=audit;}
  @Transactional public PatientDtos.Profile save(UUID userId,PatientDtos.UpdateProfile request){
    if(!users.existsById(userId))throw new DomainException(HttpStatus.NOT_FOUND,"USER_NOT_FOUND","User account was not found.");
    if(request.phone()!=null&&!request.phone().isBlank()){
      String newDigits=request.phone().replaceAll("[^0-9]","");
      if(!newDigits.isEmpty()){
        boolean duplicatePhone=patients.findAll().stream().anyMatch(p->!p.getUserId().equals(userId)&&p.getPhone()!=null&&p.getPhone().replaceAll("[^0-9]","").equals(newDigits));
        if(duplicatePhone)throw new DomainException(HttpStatus.CONFLICT,"PHONE_ALREADY_REGISTERED","This phone number is already registered to another patient account.");
      }
    }
    var existing=patients.findByUserId(userId); var patient=existing.orElseGet(()->new Patient(UUID.randomUUID(),userId,patientNumber()));
    patient.updateProfile(clean(request.fullName()),request.dateOfBirth(),clean(request.phone()),clean(request.gender()),clean(request.address()),clean(request.emergencyContact()),clean(request.preferredLanguage()),clean(request.bloodGroup()),cleanOptional(request.allergies()),cleanOptional(request.medicalConditions()));
    patient=patients.save(patient); audit.record(userId,existing.isPresent()?"PATIENT_PROFILE_UPDATED":"PATIENT_PROFILE_CREATED","PATIENT",patient.getId(),"SUCCESS"); return view(patient);
  }
  @Transactional(readOnly=true) public PatientDtos.Profile get(UUID userId){return patients.findByUserId(userId).map(this::view).orElseThrow(()->new DomainException(HttpStatus.NOT_FOUND,"PATIENT_PROFILE_NOT_FOUND","Patient profile has not been created."));}
  private String patientNumber(){return "PAT-"+UUID.randomUUID().toString().replace("-","").substring(0,12).toUpperCase();}
  private String clean(String value){return value.strip();}
  private String cleanOptional(String value){return value==null?null:value.strip();}
  private PatientDtos.Profile view(Patient p){return new PatientDtos.Profile(p.getId(),p.getPatientNumber(),p.getFullName(),p.getDateOfBirth(),p.getPhone(),p.getGender(),p.getAddress(),p.getEmergencyContact(),p.getPreferredLanguage(),p.getBloodGroup(),p.getAllergies(),p.getMedicalConditions(),p.isProfileComplete());}
}
