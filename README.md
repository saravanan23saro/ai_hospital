# Hospital AI Scheduling

Greenfield modular hospital appointment platform. PostgreSQL and the deterministic scheduling engine are authoritative; AI only ranks already-valid doctors and slots.

## Quick start

1. Copy `.env.example` to `.env` and replace development secrets.
2. Run `docker compose up --build`.
3. Open the web app at http://localhost:3200, API health at http://localhost:8180/actuator/health, AI health at http://localhost:8000/health, Prometheus at http://localhost:9090, and Grafana at http://localhost:3101.

All seed data is synthetic development data. This software does not diagnose, prescribe, triage, or replace clinical judgment.

The local Compose stack bootstraps `admin@careflow.local` with password `CareFlowAdmin!2026` only when no account with that email exists. Override both `BOOTSTRAP_ADMIN_*` values in `.env` before shared or non-local use.

## Repository

- `apps/api`: Java 21 / Spring Boot modular monolith
- `apps/web`: Next.js / TypeScript UI
- `apps/ai-service`: FastAPI advisory ranking service
- `apps/api/src/main/resources/db/migration`: executable Flyway SQL packaged with the API
- `db/migrations`: repository-level migration catalog pointers
- `contracts/openapi`: API contract artifacts
- `infrastructure/monitoring`: Prometheus configuration
- `tests`: cross-service E2E, performance, security, and concurrency tests
- `docs`: architecture, security, database, AI, deployment, and runbooks

See [the implementation roadmap](docs/implementation-roadmap.md). The project is not yet claiming production readiness or clinical validation.
