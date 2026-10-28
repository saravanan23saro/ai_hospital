package com.careflow.hospital.doctors;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
  boolean existsByUserId(UUID userId);
  boolean existsByLicenseNumberIgnoreCase(String licenseNumber);
  boolean existsByDepartmentIdAndFullNameIgnoreCaseAndActiveTrue(UUID departmentId, String fullName);
  Optional<Doctor> findByUserId(UUID userId);
  Optional<Doctor> findByLicenseNumberIgnoreCase(String licenseNumber);
  List<Doctor> findAllByDepartmentIdAndActiveTrueOrderByFullNameAsc(UUID departmentId);
  List<Doctor> findAllByActiveTrueOrderByFullNameAsc();
  List<Doctor> findAllByOrderByFullNameAsc();
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select d from Doctor d where d.id=:id")
  Optional<Doctor> findByIdForUpdate(@Param("id") UUID id);
}
