package com.careflow.hospital.operations;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.shared.DomainException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/operations")
@PreAuthorize("hasAnyRole('DOCTOR','ADMIN','STAFF')")
public class OperationsController {
  private final JdbcTemplate jdbc;
  private final AuditService audit;

  public OperationsController(JdbcTemplate jdbc, AuditService audit) {
    this.jdbc = jdbc;
    this.audit = audit;
  }

  public record InvoiceRequest(@NotNull UUID patientId, UUID appointmentId, @PositiveOrZero long amountMinor, @NotNull @Pattern(regexp = "[A-Z]{3}") String currency) {}
  public record RecordRequest(@NotNull UUID patientId, UUID appointmentId, @NotBlank @Size(max = 40) String recordType, @NotBlank @Size(max = 5000) String summary) {}
  public record LabRequest(@NotNull UUID patientId, @NotBlank @Size(max = 80) String testCode) {}
  public record LabUpdate(@NotNull @Pattern(regexp = "COLLECTED|PROCESSING|COMPLETED|CANCELLED") String status, @Size(max = 5000) String resultSummary) {}
  public record EmergencyRequest(UUID patientId, @Min(1) @Max(5) int acuity, @NotBlank @Size(max = 500) String presentingComplaint) {}
  public record EmergencyUpdate(@NotNull @Pattern(regexp = "ASSESSED|ADMITTED|DISCHARGED|CLOSED") String status) {}
  public record CapacityRequest(@NotNull UUID departmentId, @PositiveOrZero int staffedBeds, @PositiveOrZero int occupiedBeds, @PositiveOrZero int waitingPatients) {}

  @PostMapping("/invoices")
  @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
  ResponseEntity<Map<String, Object>> invoice(Authentication auth, @Valid @RequestBody InvoiceRequest request) {
    UUID id = UUID.randomUUID();
    jdbc.update("insert into invoice(invoice_id,patient_id,appointment_id,amount_minor,currency,status) values (?,?,?,?,?,'ISSUED')", id, request.patientId(), request.appointmentId(), request.amountMinor(), request.currency());
    audit.record(user(auth), "INVOICE_ISSUED", "INVOICE", id, "SUCCESS");
    return created("invoiceId", id, "status", "ISSUED");
  }

  @GetMapping("/invoices")
  @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
  List<Map<String, Object>> invoices() {
    return rows("select invoice_id,patient_id,appointment_id,amount_minor,currency,status,created_at from invoice order by created_at desc");
  }

  @PostMapping("/records")
  ResponseEntity<Map<String, Object>> record(Authentication auth, @Valid @RequestBody RecordRequest request) {
    requirePatientAccess(auth, request.patientId());
    UUID id = UUID.randomUUID();
    jdbc.update("insert into clinical_record(record_id,patient_id,appointment_id,author_id,record_type,summary) values (?,?,?,?,?,?)", id, request.patientId(), request.appointmentId(), user(auth), request.recordType(), request.summary());
    audit.record(user(auth), "CLINICAL_RECORD_CREATED", "CLINICAL_RECORD", id, "SUCCESS");
    return created("recordId", id, "status", "CREATED");
  }

  @GetMapping("/records/{patientId}")
  List<Map<String, Object>> records(Authentication auth, @PathVariable UUID patientId) {
    requirePatientAccess(auth, patientId);
    audit.record(user(auth), "CLINICAL_RECORDS_VIEWED", "PATIENT", patientId, "SUCCESS");
    return jdbc.queryForList("select record_id,appointment_id,author_id,record_type,summary,created_at from clinical_record where patient_id=? order by created_at desc", patientId);
  }

  @PostMapping("/lab-orders")
  ResponseEntity<Map<String, Object>> lab(Authentication auth, @Valid @RequestBody LabRequest request) {
    requirePatientAccess(auth, request.patientId());
    UUID id = UUID.randomUUID();
    jdbc.update("insert into lab_order(lab_order_id,patient_id,ordered_by,test_code,status) values (?,?,?,?,'ORDERED')", id, request.patientId(), user(auth), request.testCode());
    audit.record(user(auth), "LAB_ORDER_CREATED", "LAB_ORDER", id, "SUCCESS");
    return created("labOrderId", id, "status", "ORDERED");
  }

  @GetMapping("/lab-orders")
  List<Map<String, Object>> labs(Authentication auth) {
    if (privileged(auth)) return rows("select lab_order_id,patient_id,ordered_by,test_code,status,result_summary,created_at,updated_at from lab_order order by created_at desc");
    return jdbc.queryForList("select l.lab_order_id,l.patient_id,l.ordered_by,l.test_code,l.status,l.result_summary,l.created_at,l.updated_at from lab_order l where exists (select 1 from doctor d join appointment a on a.doctor_id=d.doctor_id where d.user_id=? and d.active=true and a.patient_id=l.patient_id) order by l.created_at desc", user(auth));
  }

  @PatchMapping("/lab-orders/{id}")
  Map<String, Object> labUpdate(Authentication auth, @PathVariable UUID id, @Valid @RequestBody LabUpdate request) {
    UUID patientId = patientFor("select patient_id from lab_order where lab_order_id=?", id);
    requirePatientAccess(auth, patientId);
    required(jdbc.update("update lab_order set status=?,result_summary=?,updated_at=now() where lab_order_id=?", request.status(), request.resultSummary(), id));
    audit.record(user(auth), "LAB_ORDER_" + request.status(), "LAB_ORDER", id, "SUCCESS");
    return Map.of("labOrderId", id, "status", request.status());
  }

  @PostMapping("/emergency-cases")
  ResponseEntity<Map<String, Object>> emergency(Authentication auth, @Valid @RequestBody EmergencyRequest request) {
    if (request.patientId() != null) requirePatientAccess(auth, request.patientId());
    UUID id = UUID.randomUUID();
    jdbc.update("insert into emergency_case(emergency_case_id,patient_id,opened_by,acuity,status,presenting_complaint) values (?,?,?,?,'OPEN',?)", id, request.patientId(), user(auth), request.acuity(), request.presentingComplaint());
    audit.record(user(auth), "EMERGENCY_CASE_OPENED", "EMERGENCY_CASE", id, "SUCCESS");
    return created("emergencyCaseId", id, "status", "OPEN");
  }

  @GetMapping("/emergency-cases")
  List<Map<String, Object>> emergencies(Authentication auth) {
    String order = " order by case when status in ('OPEN','ASSESSED','ADMITTED') then 0 else 1 end,acuity,opened_at";
    if (privileged(auth)) return rows("select emergency_case_id,patient_id,acuity,status,presenting_complaint,opened_at,updated_at from emergency_case" + order);
    return jdbc.queryForList("select e.emergency_case_id,e.patient_id,e.acuity,e.status,e.presenting_complaint,e.opened_at,e.updated_at from emergency_case e where e.opened_by=? or exists (select 1 from doctor d join appointment a on a.doctor_id=d.doctor_id where d.user_id=? and d.active=true and a.patient_id=e.patient_id)" + order, user(auth), user(auth));
  }

  @PatchMapping("/emergency-cases/{id}")
  Map<String, Object> emergencyUpdate(Authentication auth, @PathVariable UUID id, @Valid @RequestBody EmergencyUpdate request) {
    List<Map<String, Object>> scopes = jdbc.query("select patient_id,opened_by from emergency_case where emergency_case_id=?", (rs, row) -> {
      Map<String, Object> scope = new HashMap<>();
      scope.put("patientId", rs.getObject(1, UUID.class));
      scope.put("openedBy", rs.getObject(2, UUID.class));
      return scope;
    }, id);
    if (scopes.isEmpty()) throw notFound();
    Map<String, Object> scope = scopes.getFirst();
    UUID patientId = (UUID) scope.get("patientId");
    if (!privileged(auth) && !user(auth).equals(scope.get("openedBy"))) {
      if (patientId == null) throw notFound();
      requirePatientAccess(auth, patientId);
    }
    required(jdbc.update("update emergency_case set status=?,updated_at=now() where emergency_case_id=?", request.status(), id));
    audit.record(user(auth), "EMERGENCY_CASE_" + request.status(), "EMERGENCY_CASE", id, "SUCCESS");
    return Map.of("emergencyCaseId", id, "status", request.status());
  }

  @PostMapping("/capacity")
  ResponseEntity<Map<String, Object>> capacity(Authentication auth, @Valid @RequestBody CapacityRequest request) {
    if (request.occupiedBeds() > request.staffedBeds()) throw new DomainException(HttpStatus.BAD_REQUEST, "INVALID_CAPACITY", "Occupied beds cannot exceed staffed beds.");
    UUID id = UUID.randomUUID();
    jdbc.update("insert into capacity_snapshot(snapshot_id,department_id,captured_by,staffed_beds,occupied_beds,waiting_patients) values (?,?,?,?,?,?)", id, request.departmentId(), user(auth), request.staffedBeds(), request.occupiedBeds(), request.waitingPatients());
    audit.record(user(auth), "CAPACITY_CAPTURED", "CAPACITY_SNAPSHOT", id, "SUCCESS");
    return created("snapshotId", id, "status", "CAPTURED");
  }

  @GetMapping("/dashboard")
  Map<String, Object> dashboard() {
    return Map.of("activeEmergencyCases", count("select count(*) from emergency_case where status not in ('DISCHARGED','CLOSED')"), "pendingLabOrders", count("select count(*) from lab_order where status not in ('COMPLETED','CANCELLED')"), "unpaidInvoices", count("select count(*) from invoice where status='ISSUED'"), "latestCapacity", rows("select distinct on (department_id) department_id,staffed_beds,occupied_beds,waiting_patients,captured_at from capacity_snapshot order by department_id,captured_at desc"));
  }

  private void requirePatientAccess(Authentication auth, UUID patientId) {
    if (privileged(auth)) return;
    Boolean allowed = jdbc.queryForObject("select exists(select 1 from doctor d join appointment a on a.doctor_id=d.doctor_id where d.user_id=? and d.active=true and a.patient_id=?)", Boolean.class, user(auth), patientId);
    if (!Boolean.TRUE.equals(allowed)) throw notFound();
  }

  private boolean privileged(Authentication auth) {
    return auth.getAuthorities().stream().anyMatch(a -> Set.of("ROLE_ADMIN", "ROLE_STAFF").contains(a.getAuthority()));
  }

  private UUID patientFor(String sql, UUID id) {
    List<UUID> values = jdbc.query(sql, (rs, row) -> rs.getObject(1, UUID.class), id);
    if (values.isEmpty()) throw notFound();
    return values.getFirst();
  }

  private DomainException notFound() { return new DomainException(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", "The requested resource was not found."); }
  private List<Map<String, Object>> rows(String sql) { return jdbc.queryForList(sql); }
  private int count(String sql) { return Optional.ofNullable(jdbc.queryForObject(sql, Integer.class)).orElse(0); }
  private UUID user(Authentication auth) { return UUID.fromString(auth.getName()); }
  private void required(int changed) { if (changed == 0) throw notFound(); }
  private ResponseEntity<Map<String, Object>> created(String key, Object value, String key2, Object value2) { return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(key, value, key2, value2)); }
}
