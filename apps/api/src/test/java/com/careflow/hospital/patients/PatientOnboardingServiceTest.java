package com.careflow.hospital.patients;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.identity.AppUserRepository;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PatientOnboardingServiceTest {
  PatientRepository patients=mock(PatientRepository.class); AppUserRepository users=mock(AppUserRepository.class); AuditService audit=mock(AuditService.class); PatientOnboardingService service; UUID userId=UUID.randomUUID();
  @BeforeEach void setup(){service=new PatientOnboardingService(patients,users,audit);when(users.existsById(userId)).thenReturn(true);when(patients.save(any())).thenAnswer(i->i.getArgument(0));}
  @Test void createsCompleteProfile(){var request=request(" Jane Patient ");var view=service.save(userId,request);assertEquals("Jane Patient",view.fullName());assertTrue(view.profileComplete());assertTrue(view.patientNumber().startsWith("PAT-"));verify(audit).record(eq(userId),eq("PATIENT_PROFILE_CREATED"),eq("PATIENT"),any(),eq("SUCCESS"));}
  @Test void updatesExistingProfileWithoutChangingIdentity(){Patient patient=new Patient(UUID.randomUUID(),userId,"PAT-EXISTING");when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));var view=service.save(userId,request("Updated Name"));assertEquals(patient.getId(),view.patientId());assertEquals("PAT-EXISTING",view.patientNumber());verify(audit).record(userId,"PATIENT_PROFILE_UPDATED","PATIENT",patient.getId(),"SUCCESS");}
  private PatientDtos.UpdateProfile request(String name){return new PatientDtos.UpdateProfile(name,LocalDate.of(1990,1,1),"1234567890","FEMALE","Address","9876543210","English","O_POSITIVE","None","None");}
}
