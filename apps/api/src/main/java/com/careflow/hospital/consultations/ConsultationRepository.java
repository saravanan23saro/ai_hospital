package com.careflow.hospital.consultations;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {
    Optional<Consultation> findByAppointmentId(UUID appointmentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Consultation c WHERE c.id = :id")
    Optional<Consultation> findByIdForUpdate(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Consultation c WHERE c.appointmentId = :appointmentId")
    Optional<Consultation> findByAppointmentIdForUpdate(@Param("appointmentId") UUID appointmentId);

    List<Consultation> findAllByPatientIdOrderByStartedAtDesc(UUID patientId);
    List<Consultation> findAllByDoctorIdOrderByStartedAtDesc(UUID doctorId);
}
