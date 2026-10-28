package com.careflow.hospital.scheduling;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1")
public class ScheduleEventBroadcaster {
  private static final Logger log = LoggerFactory.getLogger(ScheduleEventBroadcaster.class);
  private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  public record ScheduleEvent(
      String eventType,
      UUID doctorId,
      UUID appointmentId,
      Instant startsAt,
      Instant endsAt,
      String status,
      Instant timestamp
  ) {}

  @GetMapping(value = {"/schedules/stream", "/appointments/stream"}, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream() {
    // 30 minute timeout
    SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
    emitters.add(emitter);

    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> {
      try {
        emitter.complete();
      } catch (Exception ignored) {}
      emitters.remove(emitter);
    });
    emitter.onError(e -> {
      try {
        emitter.complete();
      } catch (Exception ignored) {}
      emitters.remove(emitter);
    });

    try {
      emitter.send(SseEmitter.event()
          .name("CONNECTED")
          .data(Map.of(
              "message", "Connected to CareFlow schedule stream",
              "timestamp", Instant.now().toString()
          )));
    } catch (IOException e) {
      emitters.remove(emitter);
    }

    return emitter;
  }

  public void broadcast(String eventType, UUID doctorId, UUID appointmentId, Instant startsAt, Instant endsAt, String status) {
    ScheduleEvent event = new ScheduleEvent(
        eventType, doctorId, appointmentId, startsAt, endsAt, status, Instant.now()
    );
    List<SseEmitter> deadEmitters = new ArrayList<>();
    for (SseEmitter emitter : emitters) {
      try {
        emitter.send(SseEmitter.event()
            .name(eventType)
            .data(event));
      } catch (Exception e) {
        deadEmitters.add(emitter);
      }
    }
    emitters.removeAll(deadEmitters);
  }

  public int getActiveSubscriberCount() {
    return emitters.size();
  }
}
