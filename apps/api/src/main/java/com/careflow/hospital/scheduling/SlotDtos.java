package com.careflow.hospital.scheduling;
import java.time.Instant; import java.util.UUID;
public final class SlotDtos {private SlotDtos(){}public record Slot(UUID doctorId,String doctorName,String specialization,Instant startsAt,Instant endsAt,int durationMinutes,String timezone){}}
