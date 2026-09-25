package com.careflow.hospital.identity;
import jakarta.persistence.*; import java.time.Instant; import java.util.*;
@Entity @Table(name="app_user")
public class AppUser {
  @Id @Column(name="user_id") private UUID id;
  @Column(nullable=false,unique=true) private String email;
  @Column(name="password_hash",nullable=false) private String passwordHash;
  @Column(nullable=false) private String status;
  @Column(name="created_at",nullable=false) private Instant createdAt;
  @ElementCollection(fetch=FetchType.EAGER) @CollectionTable(name="user_role",joinColumns=@JoinColumn(name="user_id")) @Column(name="role") private Set<String> roles=new HashSet<>();
  protected AppUser() {}
  public AppUser(UUID id,String email,String passwordHash){this.id=id;this.email=email;this.passwordHash=passwordHash;this.status="ACTIVE";this.createdAt=Instant.now();this.roles.add("PATIENT");}
  public UUID getId(){return id;} public String getEmail(){return email;} public String getPasswordHash(){return passwordHash;} public String getStatus(){return status;} public Set<String> getRoles(){return Set.copyOf(roles);}
  public void addRole(String role){roles.add(role);} public void deactivate(){status="DEACTIVATED";}
}
