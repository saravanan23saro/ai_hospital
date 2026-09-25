# Failure and recovery runbook

- AI unavailable: verify health/latency; booking continues with deterministic ranking.
- Redis unavailable: availability cache and reservation acceleration degrade; PostgreSQL booking remains authoritative.
- Notification provider unavailable: inspect outbox attempts; in-app notifications persist and external delivery retries with backoff.
- Database issue: stop writes, preserve logs, take a snapshot, restore into an isolated instance, run Flyway validation, and reconcile outbox records before reopening traffic.

Backup and restore must be rehearsed in the target environment before any disaster-recovery claim.

## Local rehearsal

1. Start the stack and run `./scripts/backup.ps1` from the repository root.
2. Pass the resulting `.dump` path to `./scripts/verify-restore.ps1 -BackupFile <path>`.
3. Record the SHA-256 digest, start/end times, operator, migration count, and any warnings.
4. Run `./scripts/acceptance-smoke.ps1` after recovery checks.

Restore verification creates and removes only the isolated `careflow_restore_check` database. It does not overwrite the active hospital database.
