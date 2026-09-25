package com.careflow.hospital.appointments;
import jakarta.validation.Valid;import java.util.*;import org.springframework.http.*;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.security.core.Authentication;import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/v1") public class AppointmentController {private final AppointmentService service;public AppointmentController(AppointmentService s){service=s;}
 @PostMapping("/appointments")@PreAuthorize("hasRole('PATIENT')")ResponseEntity<AppointmentDtos.View> book(Authentication a,@Valid@RequestBody AppointmentDtos.Book r){return ResponseEntity.status(HttpStatus.CREATED).body(service.book(user(a),r));}
 @GetMapping("/patients/me/appointments")@PreAuthorize("hasRole('PATIENT')")List<AppointmentDtos.View> patient(Authentication a){return service.patientAppointments(user(a));}
 @PostMapping("/appointments/{id}/cancel")@PreAuthorize("hasRole('PATIENT')")AppointmentDtos.View cancel(Authentication a,@PathVariable UUID id,@Valid@RequestBody AppointmentDtos.Cancel r){return service.cancel(user(a),id,r.reason());}
 @PostMapping("/appointments/{id}/reschedule")@PreAuthorize("hasRole('PATIENT')")AppointmentDtos.View reschedule(Authentication a,@PathVariable UUID id,@Valid@RequestBody AppointmentDtos.Reschedule r){return service.reschedule(user(a),id,r.reservationId());}
 @GetMapping("/doctors/me/appointments")@PreAuthorize("hasRole('DOCTOR')")List<AppointmentDtos.DoctorView> doctor(Authentication a){return service.doctorAppointments(user(a));}
 @PostMapping("/appointments/{id}/transition")@PreAuthorize("hasRole('DOCTOR')")AppointmentDtos.View transition(Authentication a,@PathVariable UUID id,@Valid@RequestBody AppointmentDtos.Transition r){return service.transition(user(a),id,r.status());}
 private UUID user(Authentication a){return UUID.fromString(a.getName());}}
