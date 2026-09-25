package com.careflow.hospital.consultations;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/consultations")
public class ConsultationController {
    private final ConsultationService service;

    public ConsultationController(ConsultationService service) {
        this.service = service;
    }

    @PostMapping("/start/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','STAFF')")
    public ResponseEntity<ConsultationDtos.View> start(Authentication auth, @PathVariable UUID appointmentId) {
        ConsultationDtos.View view = service.startConsultation(user(auth), isStaffOrAdmin(auth), appointmentId);
        return ResponseEntity.status(HttpStatus.CREATED).body(view);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT','ADMIN','STAFF')")
    public ConsultationDtos.View get(Authentication auth, @PathVariable UUID id) {
        return service.get(user(auth), isDoctor(auth), isStaffOrAdmin(auth), id);
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT','ADMIN','STAFF')")
    public ConsultationDtos.View getByAppointment(Authentication auth, @PathVariable UUID appointmentId) {
        return service.getByAppointment(user(auth), isDoctor(auth), isStaffOrAdmin(auth), appointmentId);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','STAFF')")
    public ConsultationDtos.View updateNotes(Authentication auth, @PathVariable UUID id, @Valid @RequestBody ConsultationDtos.SaveNotesRequest request) {
        return service.updateNotes(user(auth), isStaffOrAdmin(auth), id, request);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','STAFF')")
    public ConsultationDtos.View complete(Authentication auth, @PathVariable UUID id, @Valid @RequestBody ConsultationDtos.CompleteRequest request) {
        return service.completeConsultation(user(auth), isStaffOrAdmin(auth), id, request);
    }

    private UUID user(Authentication auth) {
        return UUID.fromString(auth.getName());
    }

    private boolean isDoctor(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));
    }

    private boolean isStaffOrAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> Set.of("ROLE_ADMIN", "ROLE_STAFF").contains(a.getAuthority()));
    }
}
