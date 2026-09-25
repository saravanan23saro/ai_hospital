# Observability & Monitoring Guide

## Metrics & Health Probes
- **API Health:** `/actuator/health`, `/actuator/health/readiness`, `/actuator/health/liveness`
- **Prometheus Endpoint:** `/actuator/prometheus`
- **AI Metrics:** `/metrics` (FastAPI Prometheus ASGI exporter)

## Key Metrics Monitored
- `http_server_requests_seconds_count` (API latency & throughput)
- `appointment_booking_total` (Booking success rate)
- `slot_lock_conflict_total` (Slot reservation conflict rate)
- `ai_fallback_total` (AI outage fallback count)
- `jvm_memory_used_bytes` & `hikaricp_connections_active` (Resource usage)
