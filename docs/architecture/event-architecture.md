# Event architecture

Business services write an `outbox_event` row in the same transaction as the aggregate change. A worker leases pending rows using `FOR UPDATE SKIP LOCKED`, invokes idempotent notification handlers, and records attempts, next-attempt time, and delivery state. A unique idempotency key prevents duplicate delivery records. Failed external channels do not roll back appointment state; in-app notification remains available.
