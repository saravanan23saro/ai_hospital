package com.careflow.hospital.prescriptions;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, UUID> {
}
