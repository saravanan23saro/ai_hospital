package com.careflow.hospital.waitlist;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface WaitlistRepository extends JpaRepository<WaitlistEntry, UUID> {
    List<WaitlistEntry> findAllByPatientIdOrderByCreatedAtDesc(UUID patientId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WaitlistEntry w where w.departmentId = :deptId and w.requestedDate = :date and w.status = 'WAITING' order by w.urgencyLevel asc, w.createdAt asc")
    List<WaitlistEntry> findCandidatesForUpdate(@Param("deptId") UUID departmentId, @Param("date") LocalDate requestedDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select w from WaitlistEntry w where w.id = :id")
    Optional<WaitlistEntry> findByIdForUpdate(@Param("id") UUID id);
}
