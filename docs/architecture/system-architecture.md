# System architecture

## Decisions

The backend is a modular monolith. Modules own their domain, service, persistence, DTOs, validation, and authorization boundaries. Cross-module actions go through application services or explicit domain events, never another module's repository. This keeps transactions reliable without premature distributed-systems overhead.

The request path is `Next.js -> Spring Boot -> PostgreSQL`. Redis accelerates availability and holds expiring booking intents, but PostgreSQL is the final authority. Spring Boot sends only valid candidates to FastAPI; AI returns scores and feature-derived explanations. If FastAPI fails or times out, the API performs documented deterministic ranking.

## Modules

Identity, patients, doctors, departments, scheduling, appointments, resources, notifications, billing, medical-records, laboratory, emergency, analytics, and audit. Package boundaries are enforced in tests as implementation grows.

## Reliability boundaries

- Appointment writes use database transactions and exclusion/unique constraints.
- Booking validates all hard constraints inside the committing transaction.
- Rescheduling creates the replacement allocation and releases the old allocation atomically.
- Notifications use an outbox committed with the business change.
- AI, notifications, Redis, and analytics are non-critical dependencies; their failure cannot invalidate core booking.
- All timestamps are UTC instants; hospital timezone is configuration used for display and schedule interpretation.

## Safety

AI is operational decision support only. It cannot diagnose, prescribe, perform clinical triage, deny access, or bypass scheduling constraints.
