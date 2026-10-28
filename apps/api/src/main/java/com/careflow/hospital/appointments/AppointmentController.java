package com.careflow.hospital.appointments;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class AppointmentController {
  private final AppointmentService service;

  public AppointmentController(AppointmentService s) {
    service = s;
  }

  @PostMapping("/appointments")
  @PreAuthorize("hasRole('PATIENT')")
  public ResponseEntity<AppointmentDtos.View> book(Authentication a, @Valid @RequestBody AppointmentDtos.Book r) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.book(user(a), r));
  }

  @GetMapping("/appointments")
  @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMIN','STAFF')")
  public List<AppointmentDtos.View> listAppointments(Authentication a) {
    return service.listAppointmentsForUser(user(a), a.getAuthorities());
  }

  @GetMapping("/patients/me/appointments")
  @PreAuthorize("hasRole('PATIENT')")
  public List<AppointmentDtos.View> patient(Authentication a) {
    return service.patientAppointments(user(a));
  }

  @RequestMapping(value = "/appointments/{id}/cancel", method = {RequestMethod.POST, RequestMethod.PATCH})
  @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMIN','STAFF')")
  public AppointmentDtos.View cancel(
      Authentication a,
      @PathVariable UUID id,
      @Valid @RequestBody(required = false) AppointmentDtos.Cancel r) {
    String reason = (r != null && r.reason() != null && !r.reason().isBlank()) ? r.reason() : "Cancelled by user";
    return service.cancel(user(a), id, reason);
  }

  @RequestMapping(value = "/appointments/{id}/reschedule", method = {RequestMethod.POST, RequestMethod.PATCH})
  @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMIN','STAFF')")
  public AppointmentDtos.View reschedule(
      Authentication a,
      @PathVariable UUID id,
      @Valid @RequestBody AppointmentDtos.Reschedule r) {
    return service.reschedule(user(a), id, r);
  }

  @GetMapping("/doctors/me/appointments")
  @PreAuthorize("hasRole('DOCTOR')")
  public List<AppointmentDtos.DoctorView> doctor(Authentication a) {
    return service.doctorAppointments(user(a));
  }

  @PostMapping("/appointments/{id}/transition")
  @PreAuthorize("hasRole('DOCTOR')")
  public AppointmentDtos.View transition(
      Authentication a,
      @PathVariable UUID id,
      @Valid @RequestBody AppointmentDtos.Transition r) {
    return service.transition(user(a), id, r.status());
  }

  private UUID user(Authentication a) {
    return UUID.fromString(a.getName());
  }
}
