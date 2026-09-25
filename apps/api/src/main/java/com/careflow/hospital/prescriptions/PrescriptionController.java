package com.careflow.hospital.prescriptions;

import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/prescriptions")
public class PrescriptionController {
    private final PrescriptionService service;

    public PrescriptionController(PrescriptionService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT','ADMIN','STAFF')")
    public PrescriptionDtos.View get(Authentication auth, @PathVariable UUID id) {
        return service.get(user(auth), isDoctor(auth), isStaffOrAdmin(auth), id);
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT','ADMIN','STAFF')")
    public PrescriptionDtos.View getByAppointment(Authentication auth, @PathVariable UUID appointmentId) {
        return service.getByAppointment(user(auth), isDoctor(auth), isStaffOrAdmin(auth), appointmentId);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT','ADMIN','STAFF')")
    public List<PrescriptionDtos.View> getByPatient(Authentication auth, @PathVariable UUID patientId) {
        return service.getPatientPrescriptions(user(auth), isDoctor(auth), isStaffOrAdmin(auth), patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public List<PrescriptionDtos.View> getByDoctor(Authentication auth, @PathVariable UUID doctorId) {
        return service.getDoctorPrescriptions(user(auth), doctorId);
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('DOCTOR','PATIENT','ADMIN','STAFF')")
    public ResponseEntity<String> download(Authentication auth, @PathVariable UUID id) {
        String documentHtml = service.generateDownloadDocument(user(auth), isDoctor(auth), isStaffOrAdmin(auth), id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=careflow-prescription-" + id.toString().substring(0, 8) + ".html")
            .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .body(documentHtml);
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
