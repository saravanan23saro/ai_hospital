package com.careflow.hospital.prescriptions;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PrescriptionRepository extends JpaRepository<Prescription, UUID> {
    Optional<Prescription> findByConsultationId(UUID consultationId);
    Optional<Prescription> findByAppointmentId(UUID appointmentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Prescription p WHERE p.id = :id")
    Optional<Prescription> findByIdForUpdate(@Param("id") UUID id);

    List<Prescription> findAllByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<Prescription> findAllByDoctorIdOrderByCreatedAtDesc(UUID doctorId);
}
