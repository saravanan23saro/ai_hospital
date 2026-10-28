package com.careflow.hospital.scheduling;

import java.time.LocalDate;
import java.util.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SlotController {
  private final SlotGenerationService service;

  public SlotController(SlotGenerationService service) {
    this.service = service;
  }

  @GetMapping({"/slots", "/appointments/available-slots"})
  public List<SlotDtos.Slot> list(
      @RequestParam(required = false) UUID departmentId,
      @RequestParam(required = false) UUID doctorId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return service.generate(departmentId, doctorId, date);
  }
}
