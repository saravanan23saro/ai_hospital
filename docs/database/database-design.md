# Database design

UUID primary identifiers are used internally. Human-readable patient, doctor, and appointment numbers are unique references, never authorization inputs. Core aggregates include users/sessions/roles, patient profiles, doctor applications/profiles, departments, schedules/exceptions, hospital resources/maintenance, reservations, appointments/allocations, waitlist entries, notifications/outbox, invoices/payments, records, lab requests, emergency queues, model registry/recommendations/predictions, feedback, and audit logs.

Foreign keys enforce ownership, checks constrain enumerated state and time ordering, and partial/range indexes support active scheduling. Flyway owns all schema changes; Hibernate schema mutation is disabled.
