package com.careflow.hospital.departments;
import jakarta.persistence.*; import java.time.Instant; import java.util.UUID;
@Entity @Table(name="department")
public class Department {@Id @Column(name="department_id") private UUID id;@Column(nullable=false,unique=true)private String name;@Column(nullable=false)private boolean active;@Column(nullable=false)private String timezone;@Column(name="created_at",nullable=false)private Instant createdAt;protected Department(){}public UUID getId(){return id;}public String getName(){return name;}public boolean isActive(){return active;}public String getTimezone(){return timezone;}}
