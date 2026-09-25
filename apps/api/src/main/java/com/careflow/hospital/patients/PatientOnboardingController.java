package com.careflow.hospital.patients;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/patients/me") @PreAuthorize("hasRole('PATIENT')")
public class PatientOnboardingController {
  private final PatientOnboardingService onboarding;
  public PatientOnboardingController(PatientOnboardingService onboarding){this.onboarding=onboarding;}
  @GetMapping PatientDtos.Profile get(Authentication authentication){return onboarding.get(userId(authentication));}
  @PutMapping PatientDtos.Profile save(Authentication authentication,@Valid @RequestBody PatientDtos.UpdateProfile request){return onboarding.save(userId(authentication),request);}
  private UUID userId(Authentication authentication){return UUID.fromString(authentication.getName());}
}
