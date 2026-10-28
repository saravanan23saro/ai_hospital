package com.careflow.hospital.appointments;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.doctors.*;
import com.careflow.hospital.identity.AppUserRepository;
import com.careflow.hospital.outbox.OutboxService;
import com.careflow.hospital.patients.*;
import com.careflow.hospital.reservations.*;
import com.careflow.hospital.scheduling.SlotGenerationService;
import com.careflow.hospital.shared.DomainException;
import java.time.Instant;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {
  private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

  private final AppointmentRepository appointments;
  private final SlotReservationRepository reservations;
  private final PatientRepository patients;
  private final DoctorRepository doctors;
  private final AppUserRepository users;
  private final AuditService audit;
  private final OutboxService outbox;
  private final JdbcTemplate jdbc;
  private final SlotGenerationService slotGenerationService;
  private final com.careflow.hospital.scheduling.ScheduleEventBroadcaster broadcaster;

  public AppointmentService(
      AppointmentRepository a,
      SlotReservationRepository r,
      PatientRepository p,
      DoctorRepository d,
      AuditService audit,
      OutboxService outbox) {
    this(a, r, p, d, null, audit, outbox, null, null, null);
  }

  public AppointmentService(
      AppointmentRepository a,
      SlotReservationRepository r,
      PatientRepository p,
      DoctorRepository d,
      AppUserRepository u,
      AuditService audit,
      OutboxService outbox) {
    this(a, r, p, d, u, audit, outbox, null, null, null);
  }

  public AppointmentService(
      AppointmentRepository a,
      SlotReservationRepository r,
      PatientRepository p,
      DoctorRepository d,
      AppUserRepository u,
      AuditService audit,
      OutboxService outbox,
      JdbcTemplate jdbc,
      SlotGenerationService slotGenerationService) {
    this(a, r, p, d, u, audit, outbox, jdbc, slotGenerationService, null);
  }

  @Autowired
  public AppointmentService(
      AppointmentRepository a,
      SlotReservationRepository r,
      PatientRepository p,
      DoctorRepository d,
      @Autowired(required = false) AppUserRepository u,
      AuditService audit,
      OutboxService outbox,
      @Autowired(required = false) JdbcTemplate jdbc,
      @Autowired(required = false) SlotGenerationService slotGenerationService,
      @Autowired(required = false) com.careflow.hospital.scheduling.ScheduleEventBroadcaster broadcaster) {
    this.appointments = a;
    this.reservations = r;
    this.patients = p;
    this.doctors = d;
    this.users = u;
    this.audit = audit;
    this.outbox = outbox;
    this.jdbc = jdbc;
    this.slotGenerationService = slotGenerationService;
    this.broadcaster = broadcaster;
  }

  @Transactional
  public AppointmentDtos.View book(UUID userId, AppointmentDtos.Book request) {
    var patient = patient(userId);
    Appointment appointment;

    if (request != null && request.reservationId() != null) {
      var reservation = reservation(request.reservationId(), patient.getId());
      if (!"ACTIVE".equals(reservation.getStatus()) || !reservation.getExpiresAt().isAfter(Instant.now())) {
        throw new DomainException(HttpStatus.CONFLICT, "RESERVATION_NOT_ACTIVE", "Reservation is no longer active.");
      }

      // Concurrency check before finalizing booking
      var overlaps = appointments.findActiveOverlaps(reservation.getDoctorId(), reservation.getStartsAt(), reservation.getEndsAt());
      if (!overlaps.isEmpty()) {
        throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
      }

      reservation.consume();
      appointment = new Appointment(patient.getId(), reservation.getDoctorId(), reservation.getId(), reservation.getStartsAt(), reservation.getEndsAt());
    } else if (request != null && request.doctorId() != null && request.startsAt() != null) {
      Instant startsAt = request.startsAt();
      Instant endsAt = request.endsAt() != null ? request.endsAt() : startsAt.plusSeconds(1800);
      Instant now = Instant.now();

      if (!startsAt.isAfter(now)) {
        throw new DomainException(HttpStatus.BAD_REQUEST, "PAST_SLOT", "Cannot book appointment slots in the past.");
      }

      var doctor = doctors.findByIdForUpdate(request.doctorId())
          .filter(Doctor::isActive)
          .orElseThrow(() -> notFound("DOCTOR_NOT_FOUND", "Active doctor was not found."));

      // Check for active overlapping appointments
      var overlaps = appointments.findActiveOverlaps(doctor.getId(), startsAt, endsAt);
      if (!overlaps.isEmpty()) {
        throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
      }

      // Check for active reservation held by another user
      var held = reservations.findActiveOverlaps(doctor.getId(), startsAt, endsAt, now);
      if (!held.isEmpty()) {
        throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
      }

      appointment = new Appointment(patient.getId(), doctor.getId(), null, startsAt, endsAt);
    } else {
      throw new DomainException(HttpStatus.BAD_REQUEST, "MISSING_BOOKING_DETAILS", "Either reservationId or doctorId and startsAt must be provided.");
    }

    try {
      appointment = appointments.saveAndFlush(appointment);
    } catch (DataIntegrityViolationException e) {
      log.warn("Double-booking attempt detected for doctor {} at {}: {}", appointment.getDoctorId(), appointment.getStartsAt(), e.getMessage());
      throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
    }

    invalidateCache(appointment.getDoctorId());
    event(userId, "APPOINTMENT_BOOKED", appointment);
    broadcast("APPOINTMENT_BOOKED", appointment.getDoctorId(), appointment.getId(), appointment.getStartsAt(), appointment.getEndsAt(), "CONFIRMED");

    sendInAppNotification(patient.getUserId(), "Appointment Confirmed",
        "Your appointment " + appointment.getAppointmentNumber() + " has been booked successfully.");

    var doc = doctors.findById(appointment.getDoctorId()).orElse(null);
    if (doc != null && doc.getUserId() != null) {
      sendInAppNotification(doc.getUserId(), "New Appointment Booked",
          "Patient " + patient.getFullName() + " booked appointment " + appointment.getAppointmentNumber() + " for " + appointment.getStartsAt());
      notifyDepartmentStaff(doc.getDepartmentId(), "New Appointment Scheduled",
          "Appointment " + appointment.getAppointmentNumber() + " scheduled with " + doc.getFullName() + " for " + appointment.getStartsAt());
    }

    return view(appointment);
  }

  @Transactional
  public AppointmentDtos.View bookForPatient(UUID actorUserId, UUID patientId, UUID doctorId, Instant startsAt, Instant endsAt) {
    var patient = patients.findById(patientId)
        .orElseThrow(() -> notFound("PATIENT_NOT_FOUND", "Patient was not found."));

    Instant now = Instant.now();
    if (!startsAt.isAfter(now)) {
      throw new DomainException(HttpStatus.BAD_REQUEST, "PAST_SLOT", "Cannot book appointment slots in the past.");
    }
    Instant finalEndsAt = endsAt != null ? endsAt : startsAt.plusSeconds(1800);

    var doctor = doctors.findByIdForUpdate(doctorId)
        .filter(Doctor::isActive)
        .orElseThrow(() -> notFound("DOCTOR_NOT_FOUND", "Active doctor was not found."));

    var overlaps = appointments.findActiveOverlaps(doctor.getId(), startsAt, finalEndsAt);
    if (!overlaps.isEmpty()) {
      throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
    }

    var held = reservations.findActiveOverlaps(doctor.getId(), startsAt, finalEndsAt, now);
    if (!held.isEmpty()) {
      throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
    }

    Appointment appointment = new Appointment(patient.getId(), doctor.getId(), null, startsAt, finalEndsAt);
    try {
      appointment = appointments.saveAndFlush(appointment);
    } catch (DataIntegrityViolationException e) {
      log.warn("Double-booking attempt detected for doctor {} at {}: {}", appointment.getDoctorId(), appointment.getStartsAt(), e.getMessage());
      throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
    }

    invalidateCache(appointment.getDoctorId());
    event(actorUserId, "APPOINTMENT_BOOKED", appointment);
    broadcast("APPOINTMENT_BOOKED", appointment.getDoctorId(), appointment.getId(), appointment.getStartsAt(), appointment.getEndsAt(), "CONFIRMED");

    sendInAppNotification(patient.getUserId(), "Appointment Confirmed",
        "Your appointment " + appointment.getAppointmentNumber() + " has been booked by hospital staff.");

    if (doctor.getUserId() != null) {
      sendInAppNotification(doctor.getUserId(), "New Appointment Booked",
          "Patient " + patient.getFullName() + " booked appointment " + appointment.getAppointmentNumber() + " for " + appointment.getStartsAt());
      notifyDepartmentStaff(doctor.getDepartmentId(), "New Appointment Scheduled",
          "Appointment " + appointment.getAppointmentNumber() + " scheduled with " + doctor.getFullName() + " for " + appointment.getStartsAt());
    }

    return view(appointment);
  }

  @Transactional(readOnly = true)
  public List<AppointmentDtos.View> listAppointmentsForUser(UUID userId, Collection<? extends GrantedAuthority> authorities) {
    Set<String> roles = authorities != null
        ? authorities.stream().map(GrantedAuthority::getAuthority).collect(java.util.stream.Collectors.toSet())
        : Set.of();

    if (roles.contains("ROLE_ADMIN") || roles.contains("ROLE_STAFF")) {
      return appointments.findAll(Sort.by(Sort.Direction.DESC, "startsAt")).stream().map(this::view).toList();
    }
    if (roles.contains("ROLE_DOCTOR")) {
      return doctors.findByUserId(userId)
          .map(d -> appointments.findAllByDoctorIdOrderByStartsAtDesc(d.getId()).stream().map(this::view).toList())
          .orElse(List.of());
    }
    return patientAppointments(userId);
  }

  @Transactional(readOnly = true)
  public List<AppointmentDtos.View> patientAppointments(UUID userId) {
    return appointments.findAllByPatientIdOrderByStartsAtDesc(patient(userId).getId()).stream().map(this::view).toList();
  }

  @Transactional(readOnly = true)
  public List<AppointmentDtos.DoctorView> doctorAppointments(UUID userId) {
    var doctor = doctors.findByUserId(userId).filter(Doctor::isActive).orElseThrow(() -> notFound("DOCTOR_NOT_FOUND", "Active doctor profile was not found."));
    return appointments.findAllByDoctorIdOrderByStartsAtDesc(doctor.getId()).stream().map(this::doctorView).toList();
  }

  @Transactional
  public AppointmentDtos.View cancel(UUID userId, UUID id, String reason) {
    var a = findAppointmentWithAccess(userId, id);
    try {
      a.cancel(reason != null && !reason.isBlank() ? reason : "Cancelled by user");
    } catch (IllegalStateException e) {
      throw conflict(e.getMessage());
    }

    // Release any associated slot reservation so it no longer blocks
    if (a.getReservationId() != null) {
      reservations.findById(a.getReservationId()).ifPresent(SlotReservation::cancel);
    }

    appointments.saveAndFlush(a);

    // Invalidate slot cache immediately so the released slot appears to other patients
    invalidateCache(a.getDoctorId());

    event(userId, "APPOINTMENT_CANCELLED", a);
    broadcast("APPOINTMENT_CANCELLED", a.getDoctorId(), a.getId(), a.getStartsAt(), a.getEndsAt(), "CANCELLED");
    broadcast("APPOINTMENT_SLOT_AVAILABLE", a.getDoctorId(), a.getId(), a.getStartsAt(), a.getEndsAt(), "AVAILABLE");

    var pat = patients.findById(a.getPatientId()).orElse(null);
    if (pat != null && pat.getUserId() != null) {
      sendInAppNotification(pat.getUserId(), "Appointment Cancelled",
          "Your appointment " + a.getAppointmentNumber() + " has been cancelled.");
    }

    var doc = doctors.findById(a.getDoctorId()).orElse(null);
    if (doc != null && doc.getUserId() != null) {
      String patName = pat != null ? pat.getFullName() : "Patient";
      sendInAppNotification(doc.getUserId(), "Appointment Cancelled",
          "Appointment " + a.getAppointmentNumber() + " with " + patName + " was cancelled: " + a.getCancellationReason());
      notifyDepartmentStaff(doc.getDepartmentId(), "Appointment Cancelled",
          "Appointment " + a.getAppointmentNumber() + " with " + doc.getFullName() + " has been cancelled.");
    }

    return view(a);
  }

  @Transactional
  public AppointmentDtos.View reschedule(UUID userId, UUID id, UUID reservationId) {
    return reschedule(userId, id, new AppointmentDtos.Reschedule(reservationId));
  }

  @Transactional
  public AppointmentDtos.View reschedule(UUID userId, UUID id, AppointmentDtos.Reschedule request) {
    var original = findAppointmentWithAccess(userId, id);
    Appointment replacement;

    if (request != null && request.reservationId() != null) {
      var r = reservation(request.reservationId(), original.getPatientId());
      if (r.getDoctorId().equals(original.getDoctorId()) && r.getStartsAt().equals(original.getStartsAt())) {
        throw conflict("The replacement slot must differ from the current appointment.");
      }
      var overlaps = appointments.findActiveOverlaps(r.getDoctorId(), r.getStartsAt(), r.getEndsAt());
      if (!overlaps.isEmpty()) {
        throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
      }
      replacement = new Appointment(original.getPatientId(), r.getDoctorId(), r.getId(), r.getStartsAt(), r.getEndsAt(), original.getId());
      r.consume();
    } else if (request != null && request.startsAt() != null) {
      UUID targetDoctorId = request.doctorId() != null ? request.doctorId() : original.getDoctorId();
      Instant newStartsAt = request.startsAt();
      Instant newEndsAt = request.endsAt() != null ? request.endsAt() : newStartsAt.plusSeconds(1800);

      if (targetDoctorId.equals(original.getDoctorId()) && newStartsAt.equals(original.getStartsAt())) {
        throw conflict("The replacement slot must differ from the current appointment.");
      }
      var doc = doctors.findByIdForUpdate(targetDoctorId).filter(Doctor::isActive)
          .orElseThrow(() -> notFound("DOCTOR_NOT_FOUND", "Active doctor was not found."));
      var overlaps = appointments.findActiveOverlaps(targetDoctorId, newStartsAt, newEndsAt);
      if (!overlaps.isEmpty()) {
        throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
      }
      replacement = new Appointment(original.getPatientId(), targetDoctorId, null, newStartsAt, newEndsAt, original.getId());
    } else {
      throw conflict("Either reservationId or startsAt must be provided to reschedule.");
    }

    try {
      replacement = appointments.saveAndFlush(replacement);
    } catch (DataIntegrityViolationException e) {
      throw conflict("Sorry, this appointment slot is no longer available. Please select another time.");
    }

    try {
      original.markRescheduled(replacement.getId());
    } catch (IllegalStateException e) {
      throw conflict(e.getMessage());
    }

    invalidateCache(original.getDoctorId());
    invalidateCache(replacement.getDoctorId());

    audit.record(userId, "APPOINTMENT_RESCHEDULED_FROM", "APPOINTMENT", original.getId(), "SUCCESS");
    event(userId, "APPOINTMENT_RESCHEDULED", replacement);

    broadcast("APPOINTMENT_SLOT_AVAILABLE", original.getDoctorId(), original.getId(), original.getStartsAt(), original.getEndsAt(), "AVAILABLE");
    broadcast("APPOINTMENT_RESCHEDULED", replacement.getDoctorId(), replacement.getId(), replacement.getStartsAt(), replacement.getEndsAt(), "CONFIRMED");
    broadcast("APPOINTMENT_BOOKED", replacement.getDoctorId(), replacement.getId(), replacement.getStartsAt(), replacement.getEndsAt(), "CONFIRMED");

    var pat = patients.findById(replacement.getPatientId()).orElse(null);
    if (pat != null && pat.getUserId() != null) {
      sendInAppNotification(pat.getUserId(), "Appointment Rescheduled",
          "Your appointment has been rescheduled to " + replacement.getStartsAt() + " (Ref: " + replacement.getAppointmentNumber() + ").");
    }

    var oldDoc = doctors.findById(original.getDoctorId()).orElse(null);
    var newDoc = doctors.findById(replacement.getDoctorId()).orElse(null);
    if (oldDoc != null && oldDoc.getUserId() != null) {
      sendInAppNotification(oldDoc.getUserId(), "Appointment Rescheduled",
          "Appointment " + original.getAppointmentNumber() + " was rescheduled.");
    }
    if (newDoc != null && newDoc.getUserId() != null) {
      sendInAppNotification(newDoc.getUserId(), "New Rescheduled Appointment",
          "Appointment " + replacement.getAppointmentNumber() + " has been rescheduled to your schedule for " + replacement.getStartsAt());
      notifyDepartmentStaff(newDoc.getDepartmentId(), "Appointment Rescheduled",
          "Appointment " + replacement.getAppointmentNumber() + " rescheduled with " + newDoc.getFullName() + " for " + replacement.getStartsAt());
    }

    return view(replacement);
  }

  @Transactional
  public AppointmentDtos.View transition(UUID userId, UUID id, String status) {
    var doctor = doctors.findByUserId(userId).orElseThrow(() -> notFound("DOCTOR_NOT_FOUND", "Doctor profile was not found."));
    var a = appointments.findByIdForUpdate(id).filter(x -> x.getDoctorId().equals(doctor.getId())).orElseThrow(() -> notFound("APPOINTMENT_NOT_FOUND", "Appointment was not found."));
    try {
      a.transition(status);
    } catch (IllegalStateException e) {
      throw conflict(e.getMessage());
    }
    event(userId, "APPOINTMENT_" + status, a);
    broadcast("APPOINTMENT_" + status, a.getDoctorId(), a.getId(), a.getStartsAt(), a.getEndsAt(), status);
    return view(a);
  }

  private Appointment findAppointmentWithAccess(UUID userId, UUID id) {
    var a = appointments.findByIdForUpdate(id)
        .orElseThrow(() -> notFound("APPOINTMENT_NOT_FOUND", "Appointment was not found."));
    boolean isPatient = patients.findByUserId(userId)
        .map(p -> p.getId().equals(a.getPatientId()))
        .orElse(false);
    boolean isDoctor = doctors.findByUserId(userId)
        .map(d -> d.getId().equals(a.getDoctorId()))
        .orElse(false);
    boolean isStaffOrAdmin = users != null && users.findById(userId)
        .map(u -> u.getRoles().contains("ADMIN") || u.getRoles().contains("STAFF") || u.getRoles().contains("DOCTOR"))
        .orElse(false);
    if (!isPatient && !isDoctor && !isStaffOrAdmin) {
      if (patients.findByUserId(userId).isPresent()) {
        throw new DomainException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You are not authorized to access or modify this appointment.");
      }
      throw notFound("APPOINTMENT_NOT_FOUND", "Appointment was not found.");
    }
    return a;
  }

  private SlotReservation reservation(UUID id, UUID patientId) {
    return reservations.findByIdForUpdate(id)
        .filter(r -> r.getPatientId().equals(patientId))
        .orElseThrow(() -> notFound("RESERVATION_NOT_FOUND", "Reservation was not found."));
  }

  private Patient patient(UUID userId) {
    return patients.findByUserId(userId)
        .orElseThrow(() -> notFound("PATIENT_NOT_FOUND", "Patient profile was not found."));
  }

  private void event(UUID actor, String type, Appointment a) {
    audit.record(actor, type, "APPOINTMENT", a.getId(), "SUCCESS");
    outbox.record(type, "APPOINTMENT", a.getId(), view(a), type + ":" + a.getId() + ":" + a.getStatus());
  }

  private void invalidateCache(UUID doctorId) {
    if (slotGenerationService != null) {
      try {
        slotGenerationService.invalidateCache();
      } catch (Exception e) {
        log.debug("Cache invalidation failed: {}", e.getMessage());
      }
    }
  }

  private void sendInAppNotification(UUID userId, String subject, String body) {
    if (jdbc != null && userId != null) {
      try {
        jdbc.update(
            "insert into notification(notification_id, user_id, channel, subject, body, status) values (?, ?, 'IN_APP', ?, ?, 'SENT')",
            UUID.randomUUID(), userId, subject, body);
      } catch (Exception e) {
        log.debug("In-app notification delivery failed: {}", e.getMessage());
      }
    }
  }

  private void broadcast(String eventType, UUID doctorId, UUID appointmentId, Instant startsAt, Instant endsAt, String status) {
    if (broadcaster != null) {
      try {
        broadcaster.broadcast(eventType, doctorId, appointmentId, startsAt, endsAt, status);
      } catch (Exception e) {
        log.debug("Schedule broadcast failed: {}", e.getMessage());
      }
    }
  }

  private void notifyDepartmentStaff(UUID departmentId, String subject, String body) {
    if (jdbc == null) return;
    try {
      List<UUID> staffUserIds;
      if (departmentId != null) {
        staffUserIds = jdbc.queryForList(
            "SELECT DISTINCT u.user_id FROM user_role u " +
            "LEFT JOIN staff_member s ON u.user_id = s.user_id " +
            "WHERE u.role IN ('STAFF', 'ADMIN') AND (s.department_id = ? OR s.department_id IS NULL)",
            UUID.class, departmentId);
      } else {
        staffUserIds = jdbc.queryForList(
            "SELECT DISTINCT user_id FROM user_role WHERE role IN ('STAFF', 'ADMIN')",
            UUID.class);
      }
      for (UUID staffUserId : staffUserIds) {
        sendInAppNotification(staffUserId, subject, body);
      }
    } catch (Exception e) {
      log.debug("Department staff notification failed: {}", e.getMessage());
    }
  }

  private AppointmentDtos.View view(Appointment a) {
    var doc = doctors.findById(a.getDoctorId()).orElse(null);
    String docName = doc != null ? doc.getFullName() : "Doctor";
    String docSpec = doc != null ? doc.getSpecialization() : "";
    return new AppointmentDtos.View(a.getId(), a.getAppointmentNumber(), a.getPatientId(), a.getDoctorId(), docName, docSpec, a.getStartsAt(), a.getEndsAt(), a.getStatus(), a.getCancellationReason(), a.getRescheduledFromAppointmentId(), a.getRescheduledToAppointmentId());
  }

  private AppointmentDtos.DoctorView doctorView(Appointment a) {
    var p = patients.findById(a.getPatientId()).orElseThrow(() -> notFound("PATIENT_NOT_FOUND", "Patient profile was not found."));
    return new AppointmentDtos.DoctorView(a.getId(), a.getAppointmentNumber(), p.getId(), p.getPatientNumber(), p.getFullName(), p.getPhone(), p.getDateOfBirth(), p.getGender(), p.getBloodGroup(), p.getAllergies(), p.getMedicalConditions(), a.getStartsAt(), a.getEndsAt(), a.getStatus(), a.getDoctorId());
  }

  private DomainException notFound(String code, String message) {
    return new DomainException(HttpStatus.NOT_FOUND, code, message);
  }

  private DomainException conflict(String message) {
    return new DomainException(HttpStatus.CONFLICT, "INVALID_APPOINTMENT_STATE", message);
  }
}
