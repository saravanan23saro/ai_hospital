# Disaster Recovery & Backup Runbook

## Automated Backup Procedure
Run `./scripts/backup.ps1 -OutputDirectory ./backups` to generate a SHA-256 checksummed PostgreSQL database dump.

## Restore Rehearsal & Verification Procedure
Run `./scripts/verify-restore.ps1 -BackupFile <path_to_dump>` to test database restore in a isolated, disposable schema without touching the live database.

## RPO & RTO Targets
- **Recovery Point Objective (RPO):** < 15 minutes (using Point-In-Time-Recovery WAL archiving).
- **Recovery Time Objective (RTO):** < 1 hour (using automated Kubernetes StatefulSet failover & RDS snapshot restores).
