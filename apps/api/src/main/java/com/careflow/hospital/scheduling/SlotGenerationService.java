package com.careflow.hospital.scheduling;

import com.careflow.hospital.appointments.*;
import com.careflow.hospital.departments.*;
import com.careflow.hospital.doctors.*;
import com.careflow.hospital.reservations.SlotReservationRepository;
import com.careflow.hospital.shared.DomainException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SlotGenerationService {
  private static final Logger log = LoggerFactory.getLogger(SlotGenerationService.class);

  private final DepartmentRepository departments;
  private final DoctorRepository doctors;
  private final DoctorScheduleRepository schedules;
  private final DoctorScheduleExceptionRepository exceptions;
  private final AppointmentRepository appointments;
  private final SlotReservationRepository reservations;
  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;

  public SlotGenerationService(
      DepartmentRepository departments,
      DoctorRepository doctors,
      DoctorScheduleRepository schedules,
      DoctorScheduleExceptionRepository exceptions,
      AppointmentRepository appointments,
      SlotReservationRepository reservations) {
    this(departments, doctors, schedules, exceptions, appointments, reservations, null, null);
  }

  @Autowired
  public SlotGenerationService(
      DepartmentRepository departments,
      DoctorRepository doctors,
      DoctorScheduleRepository schedules,
      DoctorScheduleExceptionRepository exceptions,
      AppointmentRepository appointments,
      SlotReservationRepository reservations,
      @Autowired(required = false) StringRedisTemplate redisTemplate,
      @Autowired(required = false) ObjectMapper objectMapper) {
    this.departments = departments;
    this.doctors = doctors;
    this.schedules = schedules;
    this.exceptions = exceptions;
    this.appointments = appointments;
    this.reservations = reservations;
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
  }

  @Transactional(readOnly = true)
  public List<SlotDtos.Slot> generate(UUID departmentId, UUID requestedDoctorId, LocalDate date) {
    if (departmentId == null) {
      if (requestedDoctorId == null) {
        throw new DomainException(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER", "Either departmentId or doctorId must be provided.");
      }
      var doc = doctors.findById(requestedDoctorId).filter(Doctor::isActive)
          .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "DOCTOR_NOT_FOUND", "Active doctor was not found."));
      departmentId = doc.getDepartmentId();
    }
    var department = departments.findById(departmentId).filter(Department::isActive)
        .orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "DEPARTMENT_NOT_FOUND", "Department was not found."));
    ZoneId zone = zone(department.getTimezone());
    LocalDate today = LocalDate.now(zone);
    if (date.isBefore(today) || date.isAfter(today.plusDays(90))) {
      throw new DomainException(HttpStatus.BAD_REQUEST, "DATE_OUTSIDE_BOOKING_WINDOW", "Date must be within the next 90 days.");
    }

    String cacheKey = "careflow:slots:" + departmentId + ":" + (requestedDoctorId != null ? requestedDoctorId : "all") + ":" + date;
    if (redisTemplate != null && objectMapper != null) {
      try {
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null && !cached.isBlank()) {
          return objectMapper.readValue(cached, new TypeReference<List<SlotDtos.Slot>>() {});
        }
      } catch (Exception e) {
        log.debug("Redis cache read failed for key {}: {}", cacheKey, e.getMessage());
      }
    }

    var rawCandidates = doctors.findAllByDepartmentIdAndActiveTrueOrderByFullNameAsc(departmentId);
    var seenNames = new HashSet<String>();
    var candidates = new ArrayList<Doctor>();
    for (Doctor d : rawCandidates) {
      if (requestedDoctorId != null) {
        if (d.getId().equals(requestedDoctorId)) {
          candidates.add(d);
        }
      } else {
        String key = d.getFullName().strip().toLowerCase(Locale.ROOT);
        if (seenNames.add(key)) {
          candidates.add(d);
        }
      }
    }
    if (requestedDoctorId != null && candidates.isEmpty()) {
      throw new DomainException(HttpStatus.NOT_FOUND, "DOCTOR_NOT_FOUND", "Active doctor was not found in this department.");
    }

    List<SlotDtos.Slot> generated = candidates.stream()
        .flatMap(d -> slots(d, date, zone).stream())
        .sorted(Comparator.comparing(SlotDtos.Slot::startsAt).thenComparing(s -> s.doctorName().toLowerCase(Locale.ROOT)))
        .toList();

    if (redisTemplate != null && objectMapper != null) {
      try {
        redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(generated), Duration.ofSeconds(60));
      } catch (Exception e) {
        log.debug("Redis cache write failed for key {}: {}", cacheKey, e.getMessage());
      }
    }

    return generated;
  }

  public void invalidateCache() {
    if (redisTemplate != null) {
      try {
        Set<String> keys = redisTemplate.keys("careflow:slots:*");
        if (keys != null && !keys.isEmpty()) {
          redisTemplate.delete(keys);
        }
      } catch (Exception e) {
        log.debug("Redis cache invalidation failed: {}", e.getMessage());
      }
    }
  }

  private List<SlotDtos.Slot> slots(Doctor doctor, LocalDate date, ZoneId zone) {
    var ranges = new ArrayList<Range>();
    schedules.findAllByDoctorIdAndDayOfWeekAndActiveTrue(doctor.getId(), date.getDayOfWeek().getValue())
        .forEach(s -> ranges.add(new Range(s.getStartsAt(), s.getEndsAt(), s.getSlotDurationMinutes())));
    var dayExceptions = exceptions.findAllByDoctorIdAndDate(doctor.getId(), date);
    dayExceptions.stream()
        .filter(e -> "AVAILABLE".equals(e.getType()))
        .forEach(e -> ranges.add(new Range(e.getStartsAt(), e.getEndsAt(), e.getSlotDurationMinutes())));

    if (ranges.isEmpty() && date.getDayOfWeek().getValue() <= 6) {
      ranges.add(new Range(LocalTime.of(9, 0), LocalTime.of(13, 0), 30));
      ranges.add(new Range(LocalTime.of(14, 0), LocalTime.of(17, 0), 30));
    }

    Instant now = Instant.now();
    Instant dayStart = date.atStartOfDay(zone).toInstant();
    Instant dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant();

    var busy = appointments.findActiveOverlaps(doctor.getId(), dayStart, dayEnd);
    var held = reservations.findActiveOverlaps(doctor.getId(), dayStart, dayEnd, now);
    var result = new LinkedHashMap<Instant, SlotDtos.Slot>();

    for (var range : ranges) {
      for (LocalTime cursor = range.start; !cursor.plusMinutes(range.duration).isAfter(range.end); cursor = cursor.plusMinutes(range.duration)) {
        LocalTime end = cursor.plusMinutes(range.duration);
        if (unavailable(cursor, end, dayExceptions)) {
          continue;
        }
        Instant startInstant = ZonedDateTime.of(date, cursor, zone).toInstant();
        Instant endInstant = ZonedDateTime.of(date, end, zone).toInstant();

        // Check if slot is in the past, or overlaps with an active appointment or active held reservation
        if (!startInstant.isAfter(now)
            || busy.stream().anyMatch(a -> startInstant.isBefore(a.getEndsAt()) && endInstant.isAfter(a.getStartsAt()))
            || held.stream().anyMatch(r -> startInstant.isBefore(r.getEndsAt()) && endInstant.isAfter(r.getStartsAt()))) {
          continue;
        }

        result.putIfAbsent(startInstant, new SlotDtos.Slot(
            doctor.getId(),
            doctor.getFullName(),
            doctor.getSpecialization(),
            startInstant,
            endInstant,
            range.duration,
            zone.getId()));
      }
    }
    return new ArrayList<>(result.values());
  }

  private boolean unavailable(LocalTime start, LocalTime end, List<DoctorScheduleException> values) {
    return values.stream().filter(e -> "UNAVAILABLE".equals(e.getType()))
        .anyMatch(e -> e.getStartsAt() == null || (start.isBefore(e.getEndsAt()) && end.isAfter(e.getStartsAt())));
  }

  private ZoneId zone(String value) {
    try {
      return ZoneId.of(value);
    } catch (DateTimeException e) {
      throw new DomainException(HttpStatus.INTERNAL_SERVER_ERROR, "INVALID_DEPARTMENT_TIMEZONE", "Department timezone is invalid.");
    }
  }

  private record Range(LocalTime start, LocalTime end, int duration) {}
}
