package com.careflow.hospital.appointments;
import jakarta.validation.constraints.*;import java.time.*;import java.util.UUID;
public final class AppointmentDtos {
  private AppointmentDtos() {}

  public record Book(UUID reservationId, UUID doctorId, Instant startsAt, Instant endsAt) {
    public Book(UUID reservationId) {
      this(reservationId, null, null, null);
    }
  }

  public record Cancel(@Size(max = 500) String reason) {}

  public record Reschedule(UUID reservationId, UUID doctorId, Instant startsAt, Instant endsAt, String reason) {
    public Reschedule(UUID reservationId) {
      this(reservationId, null, null, null, null);
    }
  }

  public record Transition(@NotBlank @Pattern(regexp = "CHECKED_IN|IN_PROGRESS|COMPLETED|NO_SHOW") String status) {}

  public record View(UUID appointmentId, String appointmentNumber, UUID patientId, UUID doctorId, String doctorName, String doctorSpecialization, Instant startsAt, Instant endsAt, String status, String cancellationReason, UUID rescheduledFromAppointmentId, UUID rescheduledToAppointmentId) {}

  public record DoctorView(UUID appointmentId, String appointmentNumber, UUID patientId, String patientNumber, String patientName, String patientPhone, LocalDate patientDateOfBirth, String patientGender, String bloodGroup, String allergies, String medicalConditions, Instant startsAt, Instant endsAt, String status, UUID doctorId) {
    public DoctorView(UUID appointmentId, String appointmentNumber, UUID patientId, String patientNumber, String patientName, String patientPhone, LocalDate patientDateOfBirth, String patientGender, String bloodGroup, String allergies, String medicalConditions, Instant startsAt, Instant endsAt, String status) {
      this(appointmentId, appointmentNumber, patientId, patientNumber, patientName, patientPhone, patientDateOfBirth, patientGender, bloodGroup, allergies, medicalConditions, startsAt, endsAt, status, null);
    }
  }
}
