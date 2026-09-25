# Scheduling engine

The engine expands recurring doctor schedules into candidate intervals, applies schedule exceptions, and intersects them with department hours and required resource availability. It then removes overlaps, buffers, leave, holidays, blocks, booking-window violations, capacity violations, workload-limit violations, and incompatible consultation types.

Booking follows: validate identity and ownership; create/verify an expiring reservation; lock relevant allocation rows; re-evaluate constraints; insert the appointment and resource allocations; emit audit and outbox records; commit. PostgreSQL range exclusion constraints are the last line of defense against overlapping active allocations.

Appointment transitions are explicit: `REQUESTED -> CONFIRMED -> CHECKED_IN -> IN_PROGRESS -> COMPLETED`; confirmed appointments can become `CANCELLED`, `RESCHEDULED`, or `NO_SHOW`. No generic status setter is exposed.

Concurrency acceptance: 100 simultaneous confirmations for one slot must yield exactly one committed appointment and 99 conflicts.
