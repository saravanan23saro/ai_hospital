# Production-readiness audit

Audit date: 2026-08-29. Scope: source, migrations V1-V11, Compose and Dockerfiles, CI, monitoring, scripts, tests, contracts, and all web routes. Documentation claims were treated as unverified until matched to executable code.

## Implementation matrix

| Capability | Exists | Complete | Correct | Production ready | Priority / evidence |
| --- | --- | --- | --- | --- | --- |
| Authentication and refresh sessions | Yes | Partial | Partial | No | P1: bearer and refresh tokens are exposed to browser JavaScript in `sessionStorage`; no account lockout or server-side session UI integration. |
| RBAC and object authorization | Yes | Partial | No | No | P0: appointment ownership is checked, but operations APIs allow any doctor to access arbitrary patients by ID and list all lab orders. |
| Development administrator | Yes | Partial | No | No | P0: Compose enables a known bootstrap administrator by default without an explicit development-profile guard. |
| Patient onboarding | Yes | Mostly | Mostly | No | P1: workflow works; no settings, preferences, deactivation, retention, or export implementation matching the security documentation. |
| Doctor applications | Yes | Partial | Mostly | No | P1: apply/approve/reject works; no verification evidence, suspension, pagination, or concurrency lock on review. |
| Departments and doctors | Partial | No | Partial | No | P2: departments are read-only; no doctor discovery/details APIs, specialization mapping, location, or resources. |
| Doctor schedules and exceptions | Yes | Partial | Mostly | No | P1: basic overlap checks exist; no breaks/leave workflow, admin management, versioning, or database exclusion constraint for races. |
| Slot generation | Yes | Partial | Mostly | No | P1: deterministic availability works; search lacks specialization, appointment type, preference, location/resource, and pagination. |
| Slot reservations | Yes | Partial | Partial | No | P1: five-minute holds and exclusion constraint exist; no idempotency key or explicit duplicate-request contract. |
| Appointment booking | Yes | Partial | Mostly | No | P1: reservation consumption is transactional; no request idempotency, booking type, confirmation view, or integration concurrency tests. |
| Appointment cancellation | Yes | Partial | Partial | No | P1: patient-only basic cancellation; no policy, refund state, doctor/admin action, or notification delivery. |
| Appointment rescheduling | Yes | No | No | No | P0: the moved appointment becomes `RESCHEDULED`, so its new time is excluded from active-overlap protection and may be booked again; original/new appointment lineage is absent. |
| Appointment state machine | Partial | No | Partial | No | P1: only CONFIRMED/CHECKED_IN/IN_PROGRESS transitions exist; HELD, WAITING, EXPIRED and transition history are absent. |
| Waitlist and matching | No | No | No | No | P2. |
| Check-in and queue | Partial | No | Partial | No | P2: CHECKED_IN exists, but arrival, queue number, WAITING, late arrival, progression, and queue APIs do not. |
| Transactional outbox | Partial | No | No | No | P1: durable rows exist, but dispatcher marks events SENT without a provider and has no scheduled backoff/dead-letter timestamp contract. |
| Notifications | Partial | No | Partial | No | P2: in-app CRUD exists; no preferences, templates, provider adapters, retries, idempotency, delivery audit, reminders, email, or SMS workflow. |
| Billing | Partial | No | Partial | No | P2: one aggregate amount exists; no line items, tax, discount, payment/refund transitions, receipt, patient view, or provider abstraction. |
| Clinical and laboratory operations | Partial | No | No | No | P0 authorization defects; also raw maps, no pagination, incomplete state validation, and no audit events. |
| Emergency and capacity operations | Partial | No | Partial | No | P1/P2: basic tables/endpoints exist; transitions are not state-aware, analytics and resource allocation are absent. |
| AI ranking | Yes | Partial | Mostly | No | P2: deterministic ranking and API fallback work; inputs are generic client-supplied features, not authoritative scheduling features. |
| AI predictions and governance | No | No | No | No | P2: no prediction contracts, recommendation audit, latency/error/usage metrics, acceptance analytics, overrides, or admin monitor. |
| Patient portal | Partial | No | Partial | No | P1/P2: registration, profile, slot list, booking, appointment list and cancellation exist; most required screens/workflows are absent. |
| Doctor portal | Partial | No | Partial | No | P2: profile, schedules, appointments and limited transitions exist; calendar, queue, leave/breaks, reschedule, analytics and notifications are absent. |
| Admin portal | Partial | No | Partial | No | P2: doctor review and a small operations page exist; management, analytics, audit search, queue, resources and health views are absent. |
| API consistency | Partial | No | No | No | P1: domain errors are consistent, but `ResponseStatusException` paths diverge; collections lack pagination/filter/sort and no actual OpenAPI artifact exists. |
| Observability | Partial | No | Partial | No | P1: health, Prometheus and request IDs exist; no structured log configuration or booking/AI/outbox/notification/queue metrics and alerts. |
| Database integrity | Yes | Partial | Partial | No | P1: strong core FKs/checks/exclusions exist; workflow history, idempotency, resources, waitlist, billing detail and operational indexes are absent. |
| Backup and recovery | Yes | Partial | Mostly | No | P1: isolated restore is good; no retention cleanup, checksum sidecar verification, timing/RPO/RTO capture, or production-equivalent rehearsal. |
| CI and supply chain | Yes | Partial | Mostly | No | P1: broad CI exists; load test only exercises readiness, security test lacks authenticated BOLA cases, and release manifest records image IDs but not registry digests/test results. |
| Automated tests | Yes | No | Partial | No | P1: mostly Mockito unit tests; no database integration suite, state/concurrency/idempotency coverage, complete journeys, or representative mobile checks. |
| Accessibility | Yes | Partial | Partial | No | P2: axe route scans exist, including mostly unauthenticated shells; authenticated workflows and assistive-technology review remain untested. |
| Documentation | Yes | No | No | No | P1: several documents claim pagination, exports, event envelopes, notification retry, and complete journeys that the implementation does not provide. |

## Prioritized gaps

### P0 - security and correctness

1. Repair rescheduling so the replacement slot remains protected and original appointment lineage is preserved.
2. Enforce patient-level authorization on clinical records and laboratory data; add authenticated BOLA tests.
3. Require an explicit development mode before creating the known bootstrap administrator.
4. Translate database uniqueness/exclusion races into stable safe conflict errors rather than generic 500 responses.

### P1 - core workflows and platform controls

1. Add idempotency to reservation and appointment mutation APIs and test concurrent retries.
2. Formalize the appointment state machine and persist transition history.
3. Make schedule overlap protection safe under concurrent writes.
4. Standardize errors, pagination/filtering, auditing, structured logs, and domain metrics.
5. Replace the no-op outbox delivery claim with explicit adapter status, backoff and dead-letter behavior.
6. Expand integration, authorization, transaction, concurrency, and complete patient journey tests.
7. Align CI evidence and documentation with what is actually executed.

### P2 - major operational features

Waitlist, queue/check-in, doctor/admin cancellation and rescheduling, searchable doctor/department/resource availability, notification providers/preferences, complete billing, role-specific dashboards, AI governance/predictions, and the missing portal screens.

### P3 - UX and optimization

Responsive authenticated workflow coverage, confirmation dialogs, skeleton/loading detail, richer empty states, calendar ergonomics, performance budgets, and representative accessibility refinement.

## External gates

Clinical validation, legal/privacy approval, independent penetration testing, production infrastructure approval, production-equivalent disaster recovery rehearsal, representative-user accessibility testing, and operational sign-off remain external. Repository automation cannot legitimately mark these complete.
