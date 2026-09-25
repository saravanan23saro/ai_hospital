package com.careflow.hospital.queue;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/queue")
public class OpdQueueController {
    private final OpdQueueService service;

    public OpdQueueController(OpdQueueService service) {
        this.service = service;
    }

    @PostMapping("/walk-in")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<OpdQueueDtos.TokenView> generateWalkIn(Authentication auth, @Valid @RequestBody OpdQueueDtos.WalkInRegister request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.generateWalkInToken(user(auth), request));
    }

    @GetMapping("/{doctorId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public List<OpdQueueDtos.TokenView> getDoctorQueue(@PathVariable UUID doctorId) {
        return service.getDoctorQueue(doctorId);
    }

    @GetMapping("/{doctorId}/position/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public OpdQueueDtos.QueuePosition getPosition(@PathVariable UUID doctorId, @PathVariable UUID patientId) {
        return service.getPosition(doctorId, patientId);
    }

    @GetMapping("/{doctorId}/current")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public OpdQueueDtos.TokenView getCurrentToken(@PathVariable UUID doctorId) {
        return service.getCurrentToken(doctorId);
    }

    @PostMapping("/tokens/{tokenId}/call")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public OpdQueueDtos.TokenView callToken(Authentication auth, @PathVariable UUID tokenId) {
        return service.callToken(user(auth), tokenId);
    }

    @PostMapping("/tokens/{tokenId}/recall")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public OpdQueueDtos.TokenView recallToken(Authentication auth, @PathVariable UUID tokenId) {
        return service.recallToken(user(auth), tokenId);
    }

    @PostMapping("/tokens/{tokenId}/skip")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public OpdQueueDtos.TokenView skipToken(Authentication auth, @PathVariable UUID tokenId) {
        return service.skipToken(user(auth), tokenId);
    }

    @PostMapping("/tokens/{tokenId}/complete")
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public OpdQueueDtos.TokenView completeToken(Authentication auth, @PathVariable UUID tokenId) {
        return service.completeToken(user(auth), tokenId);
    }

    @PostMapping("/tokens/{tokenId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public void cancelToken(Authentication auth, @PathVariable UUID tokenId) {
        service.cancelToken(user(auth), tokenId);
    }

    private UUID user(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
