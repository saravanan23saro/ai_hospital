package com.careflow.hospital.reservations;
import jakarta.validation.constraints.*;import java.time.Instant;import java.util.UUID;
public final class ReservationDtos {private ReservationDtos(){}public record Create(@NotNull UUID doctorId,@NotNull @Future Instant startsAt){}public record View(UUID reservationId,UUID doctorId,Instant startsAt,Instant endsAt,Instant expiresAt,String status){}}
