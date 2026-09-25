package com.careflow.hospital.waitlist;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.patients.*;
import com.careflow.hospital.shared.DomainException;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WaitlistService {
    private final WaitlistRepository repository;
    private final PatientRepository patients;
    private final AuditService audit;

    public WaitlistService(WaitlistRepository repository, PatientRepository patients, AuditService audit) {
        this.repository = repository;
        this.patients = patients;
        this.audit = audit;
    }

    @Transactional
    public WaitlistDtos.View join(UUID userId, WaitlistDtos.Join request) {
        Patient patient = patient(userId);
        WaitlistEntry entry = new WaitlistEntry(
            patient.getId(),
            request.doctorId(),
            request.departmentId(),
            request.requestedDate(),
            request.preferredStartTime(),
            request.preferredEndTime(),
            request.urgencyLevel() > 0 ? request.urgencyLevel() : 3,
            request.notes()
        );
        entry = repository.save(entry);
        audit.record(userId, "WAITLIST_JOINED", "WAITLIST_ENTRY", entry.getId(), "SUCCESS");
        return view(entry);
    }

    @Transactional(readOnly = true)
    public List<WaitlistDtos.View> myWaitlist(UUID userId) {
        Patient patient = patient(userId);
        return repository.findAllByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
            .map(this::view)
            .toList();
    }

    @Transactional(readOnly = true)
    public WaitlistDtos.View get(UUID userId, UUID id) {
        WaitlistEntry entry = repository.findById(id).orElseThrow(() -> notFound("WAITLIST_NOT_FOUND"));
        return view(entry);
    }

    @Transactional
    public WaitlistDtos.View update(UUID userId, UUID id, WaitlistDtos.UpdatePreferences request) {
        WaitlistEntry entry = repository.findByIdForUpdate(id).orElseThrow(() -> notFound("WAITLIST_NOT_FOUND"));
        entry.updatePreferences(request.preferredStartTime(), request.preferredEndTime(), request.urgencyLevel(), request.notes());
        audit.record(userId, "WAITLIST_PREFERENCES_UPDATED", "WAITLIST_ENTRY", id, "SUCCESS");
        return view(entry);
    }

    @Transactional
    public WaitlistDtos.View acceptOffer(UUID userId, UUID id) {
        WaitlistEntry entry = repository.findByIdForUpdate(id).orElseThrow(() -> notFound("WAITLIST_NOT_FOUND"));
        entry.acceptOffer();
        audit.record(userId, "WAITLIST_OFFER_ACCEPTED", "WAITLIST_ENTRY", id, "SUCCESS");
        return view(entry);
    }

    @Transactional
    public WaitlistDtos.View declineOffer(UUID userId, UUID id) {
        WaitlistEntry entry = repository.findByIdForUpdate(id).orElseThrow(() -> notFound("WAITLIST_NOT_FOUND"));
        entry.declineOffer();
        audit.record(userId, "WAITLIST_OFFER_DECLINED", "WAITLIST_ENTRY", id, "SUCCESS");
        return view(entry);
    }

    @Transactional
    public void cancel(UUID userId, UUID id) {
        WaitlistEntry entry = repository.findByIdForUpdate(id).orElseThrow(() -> notFound("WAITLIST_NOT_FOUND"));
        entry.cancel();
        audit.record(userId, "WAITLIST_CANCELLED", "WAITLIST_ENTRY", id, "SUCCESS");
    }

    @Transactional
    public void autoMatchOnCancellation(UUID departmentId, LocalDate requestedDate, UUID cancelledAppointmentId) {
        List<WaitlistEntry> candidates = repository.findCandidatesForUpdate(departmentId, requestedDate);
        if (!candidates.isEmpty()) {
            WaitlistEntry match = candidates.get(0);
            match.makeOffer(cancelledAppointmentId, Instant.now().plusSeconds(900)); // 15-minute offer expiry
            repository.save(match);
        }
    }

    private Patient patient(UUID userId) {
        return patients.findByUserId(userId).orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND", "Patient profile was not found."));
    }

    private DomainException notFound(String code) {
        return new DomainException(HttpStatus.NOT_FOUND, code, "Waitlist entry was not found.");
    }

    private WaitlistDtos.View view(WaitlistEntry w) {
        w.expireIfPassed();
        return new WaitlistDtos.View(
            w.getId(),
            w.getPatientId(),
            w.getDoctorId(),
            w.getDepartmentId(),
            w.getRequestedDate(),
            w.getPreferredStartTime(),
            w.getPreferredEndTime(),
            w.getUrgencyLevel(),
            w.getNotes(),
            w.getStatus(),
            w.getOfferedAppointmentId(),
            w.getOfferExpiresAt(),
            w.getCreatedAt()
        );
    }
}
