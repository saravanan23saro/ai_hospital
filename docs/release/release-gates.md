# Release gates

## Automated gates

- API unit and security tests pass on Java 21.
- Web production build and TypeScript validation pass on Node 22.
- Advisory AI tests pass on Python 3.12.
- Docker Compose configuration validates and all readiness probes pass.
- The acceptance smoke script confirms API, AI, web, and deterministic ranking behavior.
- Playwright confirms homepage routing, patient registration/profile/sign-out, and administrator approval-workspace access in Chromium.
- The resilience gate proves deterministic API fallback during a real advisory-service outage, restores the service, and completes 100 concurrent readiness requests within five seconds.
- Axe reports no WCAG 2 A/AA or WCAG 2.1 A/AA violations on the five public portal routes.
- The deployed security gate verifies anonymous access denial, response security headers, request correlation, and trusted-origin-only CORS behavior.
- Trivy blocks high or critical fixed vulnerabilities in source dependencies and each release-shaped runtime image, and scans the repository for secrets and insecure configuration.
- Executable Flyway migrations have strict names, unique contiguous versions, non-empty SQL, and corresponding root catalog entries.
- CycloneDX software bills of materials for the API, web, and AI runtime images are retained with a manifest binding their checksums to the commit and image IDs in the `release-security-evidence` workflow artifact.
- A PostgreSQL backup is created, hashed, and restored into the isolated `careflow_restore_check` database.
- Prometheus loads alert rules for availability, server errors, and latency.

The GitHub Actions `integration` job runs these full-stack checks after the API, web, and AI jobs pass. On failure it retains Compose logs as a CI artifact and tears down the disposable stack and volumes on every run.

## Human and environment gates

These cannot be completed by repository code and block any production or clinical-readiness claim:

- Clinical safety and model validation signed by the hospital's accountable clinical authority.
- Privacy impact assessment, retention schedule, consent language, and data-processing agreements approved for the deployment jurisdiction.
- Independent penetration test findings remediated and accepted.
- Production RBAC, network isolation, managed secrets, encryption keys, immutable audit retention, and alert routing verified by the platform owner.
- Backup/restore and regional recovery rehearsed against production-equivalent managed infrastructure with measured RPO/RTO.
- Accessibility review with assistive technology and representative users.
- Incident-response, downtime, rollback, and clinical escalation exercises signed off by operations.

Release approval must record the artifact digest, matching SBOM artifact, migration version, approvers, evidence links, rollback owner, and scheduled post-release review.
