package com.careflow.hospital.identity;
import java.util.*; import org.springframework.data.jpa.repository.JpaRepository;
public interface RefreshSessionRepository extends JpaRepository<RefreshSession,UUID>{Optional<RefreshSession> findByTokenHash(String hash);}
