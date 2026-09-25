package com.careflow.hospital.identity;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="refresh_session")
public class RefreshSession {
 @Id @Column(name="session_id") private UUID id; @Column(name="user_id",nullable=false) private UUID userId; @Column(name="token_hash",nullable=false,unique=true) private String tokenHash; @Column(name="expires_at",nullable=false) private Instant expiresAt; @Column(name="revoked_at") private Instant revokedAt; @Column(name="created_at",nullable=false) private Instant createdAt;
 protected RefreshSession(){} public RefreshSession(UUID id,UUID userId,String hash,Instant expires){this.id=id;this.userId=userId;this.tokenHash=hash;this.expiresAt=expires;this.createdAt=Instant.now();}
 public UUID getUserId(){return userId;} public boolean active(){return revokedAt==null&&expiresAt.isAfter(Instant.now());} public void revoke(){revokedAt=Instant.now();}
}
