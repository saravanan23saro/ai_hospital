package com.careflow.hospital.queue;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface OpdQueueRepository extends JpaRepository<OpdToken, UUID> {
    List<OpdToken> findAllByDoctorIdAndServiceDateOrderBySequenceNumberAsc(UUID doctorId, LocalDate serviceDate);
    
    Optional<OpdToken> findByDoctorIdAndServiceDateAndPatientId(UUID doctorId, LocalDate serviceDate, UUID patientId);

    @Query("select max(t.sequenceNumber) from OpdToken t where t.doctorId = :doctorId and t.serviceDate = :date")
    Integer findMaxSequenceNumber(@Param("doctorId") UUID doctorId, @Param("date") LocalDate serviceDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from OpdToken t where t.id = :id")
    Optional<OpdToken> findByIdForUpdate(@Param("id") UUID id);
}
