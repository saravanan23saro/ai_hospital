package com.careflow.hospital.waitlist;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/waitlist")
public class WaitlistController {
    private final WaitlistService service;

    public WaitlistController(WaitlistService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<WaitlistDtos.View> join(Authentication auth, @Valid @RequestBody WaitlistDtos.Join request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.join(user(auth), request));
    }

    @GetMapping
    @PreAuthorize("hasRole('PATIENT')")
    public List<WaitlistDtos.View> myWaitlist(Authentication auth) {
        return service.myWaitlist(user(auth));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public WaitlistDtos.View get(Authentication auth, @PathVariable UUID id) {
        return service.get(user(auth), id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public WaitlistDtos.View update(Authentication auth, @PathVariable UUID id, @Valid @RequestBody WaitlistDtos.UpdatePreferences request) {
        return service.update(user(auth), id, request);
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('PATIENT')")
    public WaitlistDtos.View acceptOffer(Authentication auth, @PathVariable UUID id) {
        return service.acceptOffer(user(auth), id);
    }

    @PostMapping("/{id}/decline")
    @PreAuthorize("hasRole('PATIENT')")
    public WaitlistDtos.View declineOffer(Authentication auth, @PathVariable UUID id) {
        return service.declineOffer(user(auth), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('PATIENT')")
    public void cancel(Authentication auth, @PathVariable UUID id) {
        service.cancel(user(auth), id);
    }

    private UUID user(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
