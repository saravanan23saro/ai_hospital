package com.careflow.hospital.outbox;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class OutboxService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public OutboxService(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public void record(String eventType, String aggregateType, UUID aggregateId, Object payload, String idempotencyKey) {
        try {
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                jdbc.update(
                    "insert into outbox_event(event_id,event_type,aggregate_type,aggregate_id,payload,idempotency_key) values (?,?,?,?,cast(? as jsonb),?) on conflict (idempotency_key) do nothing",
                    UUID.randomUUID(), eventType, aggregateType, aggregateId, json.writeValueAsString(payload), idempotencyKey
                );
            } else {
                jdbc.update(
                    "insert into outbox_event(event_id,event_type,aggregate_type,aggregate_id,payload,idempotency_key) values (?,?,?,?,cast(? as jsonb),?)",
                    UUID.randomUUID(), eventType, aggregateType, aggregateId, json.writeValueAsString(payload), idempotencyKey
                );
            }
        } catch (JacksonException e) {
            throw new IllegalStateException("Could not serialize outbox event", e);
        } catch (DataIntegrityViolationException e) {
            // Idempotent duplicate event record safely ignored
        }
    }
}
