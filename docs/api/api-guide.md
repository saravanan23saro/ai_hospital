# API guide

All endpoints use `/api/v1`. Errors contain `timestamp`, `status`, stable `code`, safe `message`, and `requestId`. Collections use bounded page size, explicit sorting allowlists, and indexed filters. OpenAPI is generated from the implementation and treated as a reviewed contract artifact.

Resource groups: auth, patients, doctors, departments, scheduling, resources, appointments, waitlist, notifications, billing, laboratory, medical-records, emergency, analytics, and AI.

## Patient profile

- `GET /api/v1/patients/me` returns the authenticated patient's profile, or `PATIENT_PROFILE_NOT_FOUND` until onboarding is complete.
- `PUT /api/v1/patients/me` creates or replaces the authenticated patient's profile. It requires the `PATIENT` role and is idempotent for an account.
- Dates of birth must be in the past. Text fields are trimmed, length-limited, and validated before persistence.

## Doctor availability

Approved doctors manage recurring weekly availability through `GET`, `POST`, and `DELETE /api/v1/doctors/me/schedules`. Days use ISO numbering (`1` Monday through `7` Sunday), ranges cannot overlap, and slot durations are 5–240 minutes.

Date-specific availability and unavailability use the corresponding methods under `/api/v1/doctors/me/schedule-exceptions`. An unavailable exception without times blocks the whole day; available exceptions always require a time range and slot duration.

## Slot discovery

`GET /api/v1/slots?departmentId={id}&date={yyyy-MM-dd}` deterministically expands schedules in the department timezone, applies date exceptions, and removes elapsed or appointment-conflicting slots. An optional `doctorId` restricts results to one active doctor. The booking window is today through 90 days ahead, and returned timestamps are UTC instants with the originating timezone included.

## Reservations

Patients with complete profiles create five-minute holds using `POST /api/v1/reservations` with a `doctorId` and an exact `startsAt` value returned by slot discovery. `GET /api/v1/reservations` lists the patient's holds and `DELETE /api/v1/reservations/{id}` cancels an active hold. Doctor locking and a database exclusion constraint prevent concurrent overlapping reservations; expired holds are never treated as available bookings.

## Appointments and intelligence

`POST /api/v1/appointments` consumes a patient's active reservation atomically. Patients list, cancel, and reschedule their appointments; doctors list assigned appointments and advance the guarded state machine. Every change is audited and written to the transactional outbox.

`POST /api/v1/intelligence/rank` accepts already-valid candidates and returns versioned, explained rankings. If the advisory service is unavailable, the API returns the same policy-weighted ordering with `X-AI-Fallback: true`. `POST /api/v1/intelligence/feedback` records acceptance feedback without changing authoritative scheduling decisions.

## Hospital operations

`/api/v1/operations` contains role-protected invoice, clinical-record, laboratory, emergency-case, capacity, and dashboard endpoints. `/api/v1/notifications` provides user-scoped in-app notifications and read state. These are operational abstractions, not diagnosis, prescription, or autonomous triage features.
