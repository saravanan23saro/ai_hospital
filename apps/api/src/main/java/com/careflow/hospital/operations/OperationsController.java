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

  // Records
  public record InvoiceItemRequest(@NotBlank String category, @NotBlank String description, @Min(1) int quantity, @PositiveOrZero long unitPriceMinor) {}
  public record InvoiceRequest(@NotNull UUID patientId, UUID appointmentId, @PositiveOrZero long amountMinor, @NotNull @Pattern(regexp = "[A-Z]{3}") String currency, long discountMinor, long taxMinor, String notes, List<InvoiceItemRequest> items) {}
  public record RecordRequest(@NotNull UUID patientId, UUID appointmentId, @NotBlank @Size(max = 40) String recordType, @NotBlank @Size(max = 5000) String summary) {}
  public record LabRequest(@NotNull UUID patientId, @NotBlank @Size(max = 80) String testCode, String testName, String category, String priority, String clinicalNotes) {}
  public record LabUpdate(String status, String resultSummary, String resultFlag, String referenceRange, String unit, String technicianName) {}
  public record EmergencyRequest(UUID patientId, @Min(1) @Max(5) int acuity, @NotBlank @Size(max = 500) String presentingComplaint, String arrivalMode, UUID departmentId, UUID assignedDoctorId, String bedNumber, String triageVitals, String notes) {}
  public record EmergencyUpdate(String status, UUID assignedDoctorId, UUID departmentId, String bedNumber, String triageVitals, String notes) {}
  public record CapacityRequest(@NotNull UUID departmentId, @PositiveOrZero int staffedBeds, @PositiveOrZero int occupiedBeds, @PositiveOrZero int waitingPatients) {}

  // Patient Search API
  @GetMapping("/patients/search")
  public List<Map<String, Object>> searchPatients(@RequestParam(value = "query", required = false, defaultValue = "") String query) {
    String term = "%" + query.trim().toLowerCase() + "%";
    return jdbc.queryForList(
      "select patient_id, patient_number, full_name, date_of_birth, gender, phone from patient where lower(full_name) like ? or lower(patient_number) like ? or phone like ? order by full_name limit 20",
      term, term, term
    );
  }

  // --- EMERGENCY MODULE ENDPOINTS ---

  @GetMapping("/emergency/stats")
  public Map<String, Object> emergencyStats() {
    Map<String, Object> stats = new HashMap<>();
    stats.put("waitingPatients", count("select count(*) from emergency_case where status in ('OPEN','ASSESSED')"));
    stats.put("criticalCases", count("select count(*) from emergency_case where acuity in (1,2) and status not in ('DISCHARGED','CLOSED','CANCELLED')"));
    stats.put("inAssessment", count("select count(*) from emergency_case where status = 'ASSESSED'"));
    stats.put("inTreatment", count("select count(*) from emergency_case where status = 'IN_TREATMENT'"));

    Integer availBeds = jdbc.queryForObject("select coalesce(sum(greatest(staffed_beds - occupied_beds, 0)), 0) from (select distinct on (department_id) staffed_beds, occupied_beds from capacity_snapshot order by department_id, captured_at desc) s", Integer.class);
    Integer occBeds = jdbc.queryForObject("select coalesce(sum(occupied_beds), 0) from (select distinct on (department_id) occupied_beds from capacity_snapshot order by department_id, captured_at desc) s", Integer.class);

    stats.put("availableBeds", availBeds != null ? availBeds : 0);
    stats.put("occupiedBeds", occBeds != null ? occBeds : 0);
    stats.put("admittedToday", count("select count(*) from emergency_case where status = 'ADMITTED' and updated_at >= current_date"));
    return stats;
  }

  @PostMapping("/emergency-cases")
  public ResponseEntity<Map<String, Object>> emergency(Authentication auth, @Valid @RequestBody EmergencyRequest request) {
    if (request.patientId() != null) requirePatientAccess(auth, request.patientId());
    UUID id = UUID.randomUUID();
    String arrivalMode = request.arrivalMode() != null ? request.arrivalMode() : "WALK_IN";

    jdbc.update(
      "insert into emergency_case(emergency_case_id,patient_id,opened_by,acuity,status,presenting_complaint,arrival_mode,department_id,assigned_doctor_id,bed_number,triage_vitals,notes) values (?,?,?,?,'OPEN',?,?,?,?,?,?,?)",
      id, request.patientId(), user(auth), request.acuity(), request.presentingComplaint(), arrivalMode, request.departmentId(), request.assignedDoctorId(), request.bedNumber(), request.triageVitals(), request.notes()
    );

    audit.record(user(auth), "EMERGENCY_CASE_OPENED", "EMERGENCY_CASE", id, "SUCCESS");
    return created("emergencyCaseId", id, "status", "OPEN");
  }

  @GetMapping("/emergency-cases")
  public List<Map<String, Object>> emergencies(Authentication auth,
      @RequestParam(required = false) Integer acuity,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) UUID departmentId,
      @RequestParam(required = false) String search) {

    StringBuilder sql = new StringBuilder(
      "select e.emergency_case_id, e.patient_id, e.acuity, e.status, e.presenting_complaint, " +
      "e.arrival_mode, e.assigned_doctor_id, e.department_id, e.bed_number, e.triage_vitals, e.notes, " +
      "e.opened_at, e.updated_at, " +
      "p.full_name as patient_name, p.patient_number, p.gender as patient_gender, p.date_of_birth as patient_dob, " +
      "d.full_name as doctor_name, " +
      "dept.name as department_name " +
      "from emergency_case e " +
      "left join patient p on e.patient_id = p.patient_id " +
      "left join doctor d on e.assigned_doctor_id = d.doctor_id " +
      "left join department dept on e.department_id = dept.department_id " +
      "where 1=1 "
    );

    List<Object> params = new ArrayList<>();

    if (acuity != null) {
      sql.append("and e.acuity = ? ");
      params.add(acuity);
    }
    if (status != null && !status.isBlank()) {
      sql.append("and e.status = ? ");
      params.add(status);
    }
    if (departmentId != null) {
      sql.append("and e.department_id = ? ");
      params.add(departmentId);
    }
    if (search != null && !search.isBlank()) {
      sql.append("and (lower(p.full_name) like ? or lower(e.presenting_complaint) like ? or cast(e.emergency_case_id as text) like ?) ");
      String term = "%" + search.trim().toLowerCase() + "%";
      params.add(term);
      params.add(term);
      params.add(term);
    }

    if (!privileged(auth)) {
      sql.append("and (e.opened_by=? or exists (select 1 from doctor doc join appointment a on a.doctor_id=doc.doctor_id where doc.user_id=? and doc.active=true and a.patient_id=e.patient_id)) ");
      params.add(user(auth));
      params.add(user(auth));
    }

    sql.append("order by case when e.status in ('OPEN','ASSESSED','IN_TREATMENT','ADMITTED') then 0 else 1 end, e.acuity, e.opened_at desc");
    return jdbc.queryForList(sql.toString(), params.toArray());
  }

  @PatchMapping("/emergency-cases/{id}")
  public Map<String, Object> emergencyUpdate(Authentication auth, @PathVariable UUID id, @Valid @RequestBody EmergencyUpdate request) {
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

    StringBuilder sql = new StringBuilder("update emergency_case set updated_at=now()");
    List<Object> params = new ArrayList<>();

    if (request.status() != null && !request.status().isBlank()) {
      sql.append(", status=?");
      params.add(request.status());
    }
    if (request.assignedDoctorId() != null) {
      sql.append(", assigned_doctor_id=?");
      params.add(request.assignedDoctorId());
    }
    if (request.departmentId() != null) {
      sql.append(", department_id=?");
      params.add(request.departmentId());
    }
    if (request.bedNumber() != null) {
      sql.append(", bed_number=?");
      params.add(request.bedNumber());
    }
    if (request.triageVitals() != null) {
      sql.append(", triage_vitals=?");
      params.add(request.triageVitals());
    }
    if (request.notes() != null) {
      sql.append(", notes=?");
      params.add(request.notes());
    }

    sql.append(" where emergency_case_id=?");
    params.add(id);

    required(jdbc.update(sql.toString(), params.toArray()));
    audit.record(user(auth), "EMERGENCY_CASE_UPDATED", "EMERGENCY_CASE", id, "SUCCESS");
    return Map.of("emergencyCaseId", id, "status", request.status() != null ? request.status() : "UPDATED");
  }

  // --- LABORATORY MODULE ENDPOINTS ---

  @GetMapping("/lab/stats")
  public Map<String, Object> labStats() {
    Map<String, Object> stats = new HashMap<>();
    stats.put("pendingOrders", count("select count(*) from lab_order where status = 'ORDERED'"));
    stats.put("samplesCollected", count("select count(*) from lab_order where status = 'COLLECTED'"));
    stats.put("processing", count("select count(*) from lab_order where status = 'PROCESSING'"));
    stats.put("completed", count("select count(*) from lab_order where status = 'COMPLETED'"));
    stats.put("criticalResults", count("select count(*) from lab_order where result_flag = 'CRITICAL'"));
    stats.put("todaysTests", count("select count(*) from lab_order where created_at >= current_date"));
    return stats;
  }

  @PostMapping("/lab-orders")
  public ResponseEntity<Map<String, Object>> lab(Authentication auth, @Valid @RequestBody LabRequest request) {
    requirePatientAccess(auth, request.patientId());
    UUID id = UUID.randomUUID();
    String testName = request.testName() != null ? request.testName() : request.testCode();
    String category = request.category() != null ? request.category() : "General";
    String priority = request.priority() != null ? request.priority() : "ROUTINE";

    jdbc.update(
      "insert into lab_order(lab_order_id,patient_id,ordered_by,test_code,test_name,category,priority,clinical_notes,status) values (?,?,?,?,?,?,?,?,'ORDERED')",
      id, request.patientId(), user(auth), request.testCode(), testName, category, priority, request.clinicalNotes()
    );

    audit.record(user(auth), "LAB_ORDER_CREATED", "LAB_ORDER", id, "SUCCESS");
    return created("labOrderId", id, "status", "ORDERED");
  }

  @GetMapping("/lab-orders")
  public List<Map<String, Object>> labs(Authentication auth,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String priority,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String search) {

    StringBuilder sql = new StringBuilder(
      "select l.lab_order_id, l.patient_id, l.ordered_by, l.test_code, l.test_name, l.category, l.priority, " +
      "l.status, l.result_summary, l.result_flag, l.reference_range, l.unit, l.technician_name, l.clinical_notes, " +
      "l.created_at, l.updated_at, l.completed_at, " +
      "p.full_name as patient_name, p.patient_number, " +
      "u.email as ordered_by_email " +
      "from lab_order l " +
      "left join patient p on l.patient_id = p.patient_id " +
      "left join app_user u on l.ordered_by = u.user_id " +
      "where 1=1 "
    );

    List<Object> params = new ArrayList<>();

    if (status != null && !status.isBlank()) {
      sql.append("and l.status = ? ");
      params.add(status);
    }
    if (priority != null && !priority.isBlank()) {
      sql.append("and l.priority = ? ");
      params.add(priority);
    }
    if (category != null && !category.isBlank()) {
      sql.append("and l.category = ? ");
      params.add(category);
    }
    if (search != null && !search.isBlank()) {
      sql.append("and (lower(p.full_name) like ? or lower(l.test_code) like ? or lower(coalesce(l.test_name, '')) like ?) ");
      String term = "%" + search.trim().toLowerCase() + "%";
      params.add(term);
      params.add(term);
      params.add(term);
    }

    if (!privileged(auth)) {
      sql.append("and exists (select 1 from doctor d join appointment a on a.doctor_id=d.doctor_id where d.user_id=? and d.active=true and a.patient_id=l.patient_id) ");
      params.add(user(auth));
    }

    sql.append("order by case when l.priority='STAT' then 0 when l.priority='URGENT' then 1 else 2 end, l.created_at desc");
    return jdbc.queryForList(sql.toString(), params.toArray());
  }

  @PatchMapping("/lab-orders/{id}")
  public Map<String, Object> labUpdate(Authentication auth, @PathVariable UUID id, @Valid @RequestBody LabUpdate request) {
    UUID patientId = patientFor("select patient_id from lab_order where lab_order_id=?", id);
    requirePatientAccess(auth, patientId);

    StringBuilder sql = new StringBuilder("update lab_order set updated_at=now()");
    List<Object> params = new ArrayList<>();

    if (request.status() != null && !request.status().isBlank()) {
      sql.append(", status=?");
      params.add(request.status());
      if ("COMPLETED".equals(request.status())) {
        sql.append(", completed_at=now()");
      }
    }
    if (request.resultSummary() != null) {
      sql.append(", result_summary=?");
      params.add(request.resultSummary());
    }
    if (request.resultFlag() != null) {
      sql.append(", result_flag=?");
      params.add(request.resultFlag());
    }
    if (request.referenceRange() != null) {
      sql.append(", reference_range=?");
      params.add(request.referenceRange());
    }
    if (request.unit() != null) {
      sql.append(", unit=?");
      params.add(request.unit());
    }
    if (request.technicianName() != null) {
      sql.append(", technician_name=?");
      params.add(request.technicianName());
    }

    sql.append(" where lab_order_id=?");
    params.add(id);

    required(jdbc.update(sql.toString(), params.toArray()));
    audit.record(user(auth), "LAB_ORDER_UPDATED", "LAB_ORDER", id, "SUCCESS");
    return Map.of("labOrderId", id, "status", request.status() != null ? request.status() : "UPDATED");
  }

  // --- BILLING MODULE ENDPOINTS ---

  @GetMapping("/billing/stats")
  public Map<String, Object> billingStats() {
    Map<String, Object> stats = new HashMap<>();
    Long todaysRev = jdbc.queryForObject("select coalesce(sum(amount_minor), 0) from payment_transaction where status = 'PAID' and paid_at >= current_date", Long.class);
    stats.put("todaysRevenueMinor", todaysRev != null ? todaysRev : 0L);
    stats.put("pendingPaymentsCount", count("select count(*) from invoice where status = 'ISSUED'"));
    stats.put("paidInvoicesCount", count("select count(*) from invoice where status = 'PAID'"));
    stats.put("partiallyPaidCount", count("select count(*) from invoice where status = 'PARTIALLY_PAID'"));
    stats.put("refundsCount", count("select count(*) from payment_transaction where status = 'REFUNDED'"));
    stats.put("todaysTransactionsCount", count("select count(*) from payment_transaction where created_at >= current_date"));
    return stats;
  }

  @PostMapping("/invoices")
  @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
  public ResponseEntity<Map<String, Object>> invoice(Authentication auth, @Valid @RequestBody InvoiceRequest request) {
    UUID id = UUID.randomUUID();
    long calculatedTotal = request.amountMinor();

    if (request.items() != null && !request.items().isEmpty()) {
      long itemsSum = 0;
      for (InvoiceItemRequest item : request.items()) {
        itemsSum += item.quantity() * item.unitPriceMinor();
      }
      calculatedTotal = Math.max(0, itemsSum - request.discountMinor() + request.taxMinor());
    }

    jdbc.update(
      "insert into invoice(invoice_id,patient_id,appointment_id,amount_minor,paid_amount_minor,discount_minor,tax_minor,currency,status,notes) values (?,?,?,?,0,?,?,?,'ISSUED',?)",
      id, request.patientId(), request.appointmentId(), calculatedTotal, request.discountMinor(), request.taxMinor(), request.currency(), request.notes()
    );

    if (request.items() != null && !request.items().isEmpty()) {
      for (InvoiceItemRequest item : request.items()) {
        UUID itemId = UUID.randomUUID();
        long lineTotal = item.quantity() * item.unitPriceMinor();
        jdbc.update(
          "insert into invoice_item(item_id,invoice_id,category,description,quantity,unit_price_minor,total_price_minor) values (?,?,?,?,?,?,?)",
          itemId, id, item.category(), item.description(), item.quantity(), item.unitPriceMinor(), lineTotal
        );
      }
    }

    audit.record(user(auth), "INVOICE_ISSUED", "INVOICE", id, "SUCCESS");
    return created("invoiceId", id, "status", "ISSUED");
  }

  @GetMapping("/invoices")
  @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
  public List<Map<String, Object>> invoices(@RequestParam(required = false) String status, @RequestParam(required = false) String search) {
    StringBuilder sql = new StringBuilder(
      "select i.invoice_id, i.patient_id, i.appointment_id, i.amount_minor, i.paid_amount_minor, " +
      "i.discount_minor, i.tax_minor, i.currency, i.status, i.notes, i.created_at, " +
      "p.full_name as patient_name, p.patient_number " +
      "from invoice i " +
      "left join patient p on i.patient_id = p.patient_id " +
      "where 1=1 "
    );

    List<Object> params = new ArrayList<>();
    if (status != null && !status.isBlank()) {
      sql.append("and i.status = ? ");
      params.add(status);
    }
    if (search != null && !search.isBlank()) {
      sql.append("and (lower(p.full_name) like ? or cast(i.invoice_id as text) like ?) ");
      String term = "%" + search.trim().toLowerCase() + "%";
      params.add(term);
      params.add(term);
    }

    sql.append("order by i.created_at desc");
    List<Map<String, Object>> invoiceRows = jdbc.queryForList(sql.toString(), params.toArray());

    for (Map<String, Object> inv : invoiceRows) {
      UUID invId = (UUID) inv.get("invoice_id");
      List<Map<String, Object>> items = jdbc.queryForList("select item_id, category, description, quantity, unit_price_minor, total_price_minor from invoice_item where invoice_id=? order by item_id", invId);
      inv.put("items", items);
    }

    return invoiceRows;
  }

  // Clinical Records & Capacity
  @PostMapping("/records")
  public ResponseEntity<Map<String, Object>> record(Authentication auth, @Valid @RequestBody RecordRequest request) {
    requirePatientAccess(auth, request.patientId());
    UUID id = UUID.randomUUID();
    jdbc.update("insert into clinical_record(record_id,patient_id,appointment_id,author_id,record_type,summary) values (?,?,?,?,?,?)", id, request.patientId(), request.appointmentId(), user(auth), request.recordType(), request.summary());
    audit.record(user(auth), "CLINICAL_RECORD_CREATED", "CLINICAL_RECORD", id, "SUCCESS");
    return created("recordId", id, "status", "CREATED");
  }

  @GetMapping("/records/{patientId}")
  public List<Map<String, Object>> records(Authentication auth, @PathVariable UUID patientId) {
    requirePatientAccess(auth, patientId);
    audit.record(user(auth), "CLINICAL_RECORDS_VIEWED", "PATIENT", patientId, "SUCCESS");
    return jdbc.queryForList("select record_id,appointment_id,author_id,record_type,summary,created_at from clinical_record where patient_id=? order by created_at desc", patientId);
  }

  @PostMapping("/capacity")
  public ResponseEntity<Map<String, Object>> capacity(Authentication auth, @Valid @RequestBody CapacityRequest request) {
    if (request.occupiedBeds() > request.staffedBeds()) throw new DomainException(HttpStatus.BAD_REQUEST, "INVALID_CAPACITY", "Occupied beds cannot exceed staffed beds.");
    UUID id = UUID.randomUUID();
    jdbc.update("insert into capacity_snapshot(snapshot_id,department_id,captured_by,staffed_beds,occupied_beds,waiting_patients) values (?,?,?,?,?,?)", id, request.departmentId(), user(auth), request.staffedBeds(), request.occupiedBeds(), request.waitingPatients());
    audit.record(user(auth), "CAPACITY_CAPTURED", "CAPACITY_SNAPSHOT", id, "SUCCESS");
    return created("snapshotId", id, "status", "CAPTURED");
  }

  @GetMapping("/capacity")
  public List<Map<String, Object>> capacityList() {
    return rows("select distinct on (c.department_id) c.snapshot_id, c.department_id, d.name as department_name, c.staffed_beds, c.occupied_beds, (c.staffed_beds - c.occupied_beds) as available_beds, c.waiting_patients, c.captured_at from capacity_snapshot c left join department d on c.department_id = d.department_id order by c.department_id, c.captured_at desc");
  }

  @GetMapping("/dashboard")
  public Map<String, Object> dashboard() {
    return Map.of(
      "activeEmergencyCases", count("select count(*) from emergency_case where status not in ('DISCHARGED','CLOSED','CANCELLED')"),
      "pendingLabOrders", count("select count(*) from lab_order where status not in ('COMPLETED','CANCELLED')"),
      "unpaidInvoices", count("select count(*) from invoice where status='ISSUED'"),
      "latestCapacity", rows("select distinct on (c.department_id) c.department_id, d.name as department_name, c.staffed_beds, c.occupied_beds, c.waiting_patients, c.captured_at from capacity_snapshot c left join department d on c.department_id = d.department_id order by c.department_id, c.captured_at desc")
    );
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
