package com.careflow.hospital.queue;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.shared.DomainException;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OpdQueueService {
    private final OpdQueueRepository repository;
    private final AuditService audit;

    public OpdQueueService(OpdQueueRepository repository, AuditService audit) {
        this.repository = repository;
        this.audit = audit;
    }

    @Transactional
    public OpdQueueDtos.TokenView generateWalkInToken(UUID actorUserId, OpdQueueDtos.WalkInRegister request) {
        LocalDate today = LocalDate.now();
        Integer maxSeq = repository.findMaxSequenceNumber(request.doctorId(), today);
        int nextSeq = (maxSeq == null ? 0 : maxSeq) + 1;

        OpdToken token = new OpdToken(
            request.doctorId(),
            request.departmentId(),
            request.patientId(),
            request.appointmentId(),
            today,
            nextSeq,
            true
        );
        token = repository.save(token);
        audit.record(actorUserId, "OPD_TOKEN_GENERATED", "OPD_TOKEN", token.getId(), "SUCCESS");
        return view(token);
    }

    @Transactional(readOnly = true)
    public List<OpdQueueDtos.TokenView> getDoctorQueue(UUID doctorId) {
        LocalDate today = LocalDate.now();
        return repository.findAllByDoctorIdAndServiceDateOrderBySequenceNumberAsc(doctorId, today).stream()
            .map(this::view)
            .toList();
    }

    @Transactional(readOnly = true)
    public OpdQueueDtos.QueuePosition getPosition(UUID doctorId, UUID patientId) {
        LocalDate today = LocalDate.now();
        List<OpdToken> queue = repository.findAllByDoctorIdAndServiceDateOrderBySequenceNumberAsc(doctorId, today);
        OpdToken patientToken = queue.stream()
            .filter(t -> t.getPatientId().equals(patientId))
            .findFirst()
            .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "TOKEN_NOT_FOUND", "No queue token found for patient."));

        int pos = 0;
        int waiting = 0;
        for (int i = 0; i < queue.size(); i++) {
            OpdToken t = queue.get(i);
            if ("WAITING".equals(t.getStatus())) {
                waiting++;
                if (t.getId().equals(patientToken.getId())) {
                    pos = waiting;
                }
            }
        }

        int estWait = Math.max(0, (pos - 1) * 15);
        return new OpdQueueDtos.QueuePosition(patientToken.getId(), patientToken.getTokenNumber(), pos, waiting, estWait, patientToken.getStatus());
    }

    @Transactional(readOnly = true)
    public OpdQueueDtos.TokenView getCurrentToken(UUID doctorId) {
        LocalDate today = LocalDate.now();
        return repository.findAllByDoctorIdAndServiceDateOrderBySequenceNumberAsc(doctorId, today).stream()
            .filter(t -> "CALLED".equals(t.getStatus()) || "IN_SERVICE".equals(t.getStatus()))
            .findFirst()
            .map(this::view)
            .orElse(null);
    }

    @Transactional
    public OpdQueueDtos.TokenView callToken(UUID actorUserId, UUID tokenId) {
        OpdToken token = repository.findByIdForUpdate(tokenId).orElseThrow(() -> notFound());
        token.call();
        audit.record(actorUserId, "OPD_TOKEN_CALLED", "OPD_TOKEN", tokenId, "SUCCESS");
        return view(token);
    }

    @Transactional
    public OpdQueueDtos.TokenView recallToken(UUID actorUserId, UUID tokenId) {
        OpdToken token = repository.findByIdForUpdate(tokenId).orElseThrow(() -> notFound());
        token.recall();
        audit.record(actorUserId, "OPD_TOKEN_RECALLED", "OPD_TOKEN", tokenId, "SUCCESS");
        return view(token);
    }

    @Transactional
    public OpdQueueDtos.TokenView skipToken(UUID actorUserId, UUID tokenId) {
        OpdToken token = repository.findByIdForUpdate(tokenId).orElseThrow(() -> notFound());
        token.skip();
        audit.record(actorUserId, "OPD_TOKEN_SKIPPED", "OPD_TOKEN", tokenId, "SUCCESS");
        return view(token);
    }

    @Transactional
    public OpdQueueDtos.TokenView completeToken(UUID actorUserId, UUID tokenId) {
        OpdToken token = repository.findByIdForUpdate(tokenId).orElseThrow(() -> notFound());
        token.complete();
        audit.record(actorUserId, "OPD_TOKEN_COMPLETED", "OPD_TOKEN", tokenId, "SUCCESS");
        return view(token);
    }

    @Transactional
    public void cancelToken(UUID actorUserId, UUID tokenId) {
        OpdToken token = repository.findByIdForUpdate(tokenId).orElseThrow(() -> notFound());
        token.cancel();
        audit.record(actorUserId, "OPD_TOKEN_CANCELLED", "OPD_TOKEN", tokenId, "SUCCESS");
    }

    private DomainException notFound() {
        return new DomainException(HttpStatus.NOT_FOUND, "TOKEN_NOT_FOUND", "OPD Queue Token was not found.");
    }

    private OpdQueueDtos.TokenView view(OpdToken t) {
        return new OpdQueueDtos.TokenView(
            t.getId(),
            t.getTokenNumber(),
            t.getDoctorId(),
            t.getDepartmentId(),
            t.getPatientId(),
            t.getServiceDate(),
            t.getSequenceNumber(),
            t.getStatus(),
            t.isWalkIn(),
            t.getCalledAt(),
            t.getCompletedAt(),
            t.getCreatedAt()
        );
    }
}
