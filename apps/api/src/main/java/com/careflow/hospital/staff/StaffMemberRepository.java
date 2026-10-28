package com.careflow.hospital.staff;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StaffMemberRepository extends JpaRepository<StaffMember, UUID> {
  boolean existsByUserId(UUID userId);
  boolean existsByEmployeeIdIgnoreCase(String employeeId);
  Optional<StaffMember> findByUserId(UUID userId);
  Optional<StaffMember> findByEmployeeIdIgnoreCase(String employeeId);
  List<StaffMember> findAllByOrderByCreatedAtDesc();
  List<StaffMember> findAllByDepartmentId(UUID departmentId);
}
