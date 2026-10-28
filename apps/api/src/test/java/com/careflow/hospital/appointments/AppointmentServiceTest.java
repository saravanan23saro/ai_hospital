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
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AppointmentServiceTest {

  @Test
  void doctorOnlyReceivesAppointmentsAssignedToTheirDoctorProfile() {
    var appointments = mock(AppointmentRepository.class);
    var patients = mock(PatientRepository.class);
    var doctors = mock(DoctorRepository.class);
    var doctor = mock(Doctor.class);
    var appointment = mock(Appointment.class);
    var patient = mock(Patient.class);
    UUID userId = UUID.randomUUID(), doctorId = UUID.randomUUID(), patientId = UUID.randomUUID();

    when(doctor.getId()).thenReturn(doctorId);
    when(doctor.isActive()).thenReturn(true);
    when(doctors.findByUserId(userId)).thenReturn(Optional.of(doctor));
    when(appointment.getPatientId()).thenReturn(patientId);
    when(appointments.findAllByDoctorIdOrderByStartsAtDesc(doctorId)).thenReturn(List.of(appointment));
    when(patients.findById(patientId)).thenReturn(Optional.of(patient));
    when(patient.getFullName()).thenReturn("Assigned Patient");

    var service = new AppointmentService(appointments, mock(SlotReservationRepository.class), patients, doctors, mock(AuditService.class), mock(OutboxService.class));
    var result = service.doctorAppointments(userId);
    assertEquals(1, result.size());
    assertEquals("Assigned Patient", result.get(0).patientName());
    verify(appointments).findAllByDoctorIdOrderByStartsAtDesc(doctorId);
    verifyNoMoreInteractions(appointments);
  }

  @Test
  void reschedulePreservesOriginalAndCreatesProtectedConfirmedReplacement() {
    var appointments = mock(AppointmentRepository.class);
    var reservations = mock(SlotReservationRepository.class);
    var patients = mock(PatientRepository.class);
    var audit = mock(AuditService.class);
    var outbox = mock(OutboxService.class);
    UUID userId = UUID.randomUUID(), patientId = UUID.randomUUID(), oldDoctorId = UUID.randomUUID(), newDoctorId = UUID.randomUUID(), reservationId = UUID.randomUUID();
    var patient = mock(Patient.class);

    when(patient.getId()).thenReturn(patientId);
    when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));
    var oldStart = Instant.now().plusSeconds(86400);
    var original = new Appointment(patientId, oldDoctorId, UUID.randomUUID(), oldStart, oldStart.plusSeconds(1800));
    var newStart = oldStart.plusSeconds(3600);
    var reservation = new SlotReservation(patientId, newDoctorId, newStart, newStart.plusSeconds(1800), Instant.now().plusSeconds(300));

    when(appointments.findByIdForUpdate(original.getId())).thenReturn(Optional.of(original));
    when(reservations.findByIdForUpdate(reservationId)).thenReturn(Optional.of(reservation));
    when(appointments.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var service = new AppointmentService(appointments, reservations, patients, mock(DoctorRepository.class), audit, outbox);
    var result = service.reschedule(userId, original.getId(), reservationId);
    assertEquals("RESCHEDULED", original.getStatus());
    assertEquals(result.appointmentId(), original.getRescheduledToAppointmentId());
    assertEquals(original.getId(), result.rescheduledFromAppointmentId());
    assertEquals("CONFIRMED", result.status());
    assertEquals(newStart, result.startsAt());
    assertEquals("CONSUMED", reservation.getStatus());
    verify(audit).record(userId, "APPOINTMENT_RESCHEDULED_FROM", "APPOINTMENT", original.getId(), "SUCCESS");
  }

  @Test
  void patientAppointmentsReturnsAppointmentsWhenPatientProfileExists() {
    var appointments = mock(AppointmentRepository.class);
    var patients = mock(PatientRepository.class);
    var patient = mock(Patient.class);
    UUID userId = UUID.randomUUID(), patientId = UUID.randomUUID();

    when(patient.getId()).thenReturn(patientId);
    when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));
    when(appointments.findAllByPatientIdOrderByStartsAtDesc(patientId)).thenReturn(List.of());

    var service = new AppointmentService(appointments, mock(SlotReservationRepository.class), patients, mock(DoctorRepository.class), mock(AuditService.class), mock(OutboxService.class));
    var result = service.patientAppointments(userId);
    assertNotNull(result);
    assertTrue(result.isEmpty());
    verify(appointments).findAllByPatientIdOrderByStartsAtDesc(patientId);
  }

  @Test
  void patientAppointmentsThrowsNotFoundWhenPatientProfileMissing() {
    var appointments = mock(AppointmentRepository.class);
    var patients = mock(PatientRepository.class);
    UUID userId = UUID.randomUUID();

    when(patients.findByUserId(userId)).thenReturn(Optional.empty());
    var service = new AppointmentService(appointments, mock(SlotReservationRepository.class), patients, mock(DoctorRepository.class), mock(AuditService.class), mock(OutboxService.class));
    var ex = assertThrows(DomainException.class, () -> service.patientAppointments(userId));
    assertEquals(HttpStatus.NOT_FOUND, ex.status());
    assertEquals("PATIENT_NOT_FOUND", ex.code());
  }

  @Test
  void bookDirectSlotFailsWhenOverlappingAppointmentExists() {
    var appointments = mock(AppointmentRepository.class);
    var patients = mock(PatientRepository.class);
    var doctors = mock(DoctorRepository.class);
    var reservations = mock(SlotReservationRepository.class);
    var slotService = mock(SlotGenerationService.class);

    UUID userId = UUID.randomUUID(), patientId = UUID.randomUUID(), doctorId = UUID.randomUUID();
    var patient = mock(Patient.class);
    var doctor = mock(Doctor.class);
    Instant start = Instant.now().plusSeconds(7200);

    when(patient.getId()).thenReturn(patientId);
    when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));
    when(doctor.getId()).thenReturn(doctorId);
    when(doctor.isActive()).thenReturn(true);
    when(doctors.findByIdForUpdate(doctorId)).thenReturn(Optional.of(doctor));

    var existingAppt = mock(Appointment.class);
    when(appointments.findActiveOverlaps(eq(doctorId), any(), any())).thenReturn(List.of(existingAppt));

    var service = new AppointmentService(appointments, reservations, patients, doctors, null, mock(AuditService.class), mock(OutboxService.class), null, slotService);
    var ex = assertThrows(DomainException.class, () -> service.book(userId, new AppointmentDtos.Book(null, doctorId, start, start.plusSeconds(1800))));
    assertEquals(HttpStatus.CONFLICT, ex.status());
    assertTrue(ex.getMessage().contains("no longer available"));
  }

  @Test
  void bookDirectSlotFailsForPastSlot() {
    var appointments = mock(AppointmentRepository.class);
    var patients = mock(PatientRepository.class);
    UUID userId = UUID.randomUUID(), patientId = UUID.randomUUID(), doctorId = UUID.randomUUID();
    var patient = mock(Patient.class);

    when(patient.getId()).thenReturn(patientId);
    when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));
    Instant past = Instant.now().minusSeconds(3600);

    var service = new AppointmentService(appointments, mock(SlotReservationRepository.class), patients, mock(DoctorRepository.class), mock(AuditService.class), mock(OutboxService.class));
    var ex = assertThrows(DomainException.class, () -> service.book(userId, new AppointmentDtos.Book(null, doctorId, past, past.plusSeconds(1800))));
    assertEquals(HttpStatus.BAD_REQUEST, ex.status());
    assertEquals("PAST_SLOT", ex.code());
  }

  @Test
  void cancelThrowsForbiddenWhenUnauthorizedPatientAttemptsToCancel() {
    var appointments = mock(AppointmentRepository.class);
    var patients = mock(PatientRepository.class);
    var users = mock(AppUserRepository.class);

    UUID patientAUserId = UUID.randomUUID(), patientBUserId = UUID.randomUUID();
    UUID patientAId = UUID.randomUUID(), patientBId = UUID.randomUUID();
    UUID appointmentId = UUID.randomUUID();

    var patientA = mock(Patient.class);
    when(patientA.getId()).thenReturn(patientAId);
    var patientB = mock(Patient.class);
    when(patientB.getId()).thenReturn(patientBId);

    when(patients.findByUserId(patientBUserId)).thenReturn(Optional.of(patientB));

    var appointment = mock(Appointment.class);
    when(appointment.getPatientId()).thenReturn(patientAId);
    when(appointments.findByIdForUpdate(appointmentId)).thenReturn(Optional.of(appointment));

    var service = new AppointmentService(appointments, mock(SlotReservationRepository.class), patients, mock(DoctorRepository.class), users, mock(AuditService.class), mock(OutboxService.class));
    var ex = assertThrows(DomainException.class, () -> service.cancel(patientBUserId, appointmentId, "Unauthorized"));
    assertEquals(HttpStatus.FORBIDDEN, ex.status());
    assertEquals("FORBIDDEN", ex.code());
  }

  @Test
  void cancelSuccessfullyReleasesSlotAndPreservesAppointment() {
    var appointments = mock(AppointmentRepository.class);
    var reservations = mock(SlotReservationRepository.class);
    var patients = mock(PatientRepository.class);
    var doctors = mock(DoctorRepository.class);
    var slotService = mock(SlotGenerationService.class);

    UUID userId = UUID.randomUUID(), patientId = UUID.randomUUID(), doctorId = UUID.randomUUID();
    UUID appointmentId = UUID.randomUUID(), reservationId = UUID.randomUUID();

    var patient = mock(Patient.class);
    when(patient.getId()).thenReturn(patientId);
    when(patients.findByUserId(userId)).thenReturn(Optional.of(patient));
    when(patients.findById(patientId)).thenReturn(Optional.of(patient));

    var appointment = new Appointment(patientId, doctorId, reservationId, Instant.now().plusSeconds(86400), Instant.now().plusSeconds(88200));
    when(appointments.findByIdForUpdate(appointment.getId())).thenReturn(Optional.of(appointment));

    var reservation = mock(SlotReservation.class);
    when(reservations.findById(reservationId)).thenReturn(Optional.of(reservation));

    var service = new AppointmentService(appointments, reservations, patients, doctors, null, mock(AuditService.class), mock(OutboxService.class), null, slotService);
    var result = service.cancel(userId, appointment.getId(), "Doctor emergency");

    assertEquals("CANCELLED", result.status());
    assertEquals("Doctor emergency", result.cancellationReason());
    assertEquals("CANCELLED", appointment.getStatus());
    verify(reservation).cancel();
    verify(slotService).invalidateCache();
    verify(appointments).saveAndFlush(appointment);
  }
}
