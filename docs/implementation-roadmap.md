# Implementation roadmap

## Phase 0: foundation

Monorepo, architecture, service skeletons, PostgreSQL/Redis, Flyway, Docker, error contract, request correlation, health/readiness, base UI, CI, and smoke tests.

**MVP status: complete.** The repository includes reproducible containers, health probes, Prometheus/Grafana, Flyway migrations, request IDs, security defaults, and independent API/web/AI CI jobs.

## Phase 1: authoritative workflows

Identity/session security; patient onboarding; doctor application/admin approval; departments/resources; schedules/exceptions; slot generation; reservations; appointment state machine; atomic booking/cancellation/rescheduling; audit/outbox; concurrency and security tests.

**MVP status: complete.** Slot holds are converted atomically into appointments, ownership is enforced, doctor transitions are role-protected, and appointment changes emit audit and outbox records.

## Phase 2: advisory intelligence and portals

Versioned feature contracts, evaluated baselines, explainable doctor/slot ranking, predictions, fallback, feedback, notifications, and complete patient/doctor/admin UI workflows.

**MVP status: complete.** `/api/v1/intelligence/rank` proxies the versioned deterministic AI baseline and provides a timeout-safe deterministic fallback. Feedback and notifications are persisted. Patient and staff portals provide authenticated operational views. The baseline remains advisory and synthetic; clinical validation is explicitly out of scope.

## Phase 3: hospital operations and hardening

Billing abstraction, records, laboratory, emergency operations, capacity/simulation, observability dashboards, accessibility, E2E, load/resilience, backup/restore rehearsal, and final acceptance evidence.

**MVP status: complete.** Role-protected APIs cover invoices, clinical records, lab orders, emergency queues, and capacity snapshots, with a consolidated dashboard. Responsive, keyboard-operable portals, CI acceptance gates, monitoring, deployment guidance, and recovery runbooks provide the hardening baseline.

## Acceptance evidence

- API: `mvn test`
- Web: `npm run build`
- AI: `python -m pytest`
- Full stack: `docker compose up --build`, followed by the health endpoints documented in the root README

“Complete” here means the planned engineering MVP is implemented and testable. Production launch still requires organization-specific clinical validation, privacy/legal review, penetration testing, disaster-recovery rehearsal against the chosen managed infrastructure, and operational sign-off.

## Phase 4: integration and reliability

**Engineering status: complete.** Authentication throttling limits credential attacks, the transactional outbox has a bounded dispatcher, monitoring includes actionable availability/error/latency alerts, and the acceptance smoke script checks the running stack and deterministic ranking contract.

## Phase 5: privacy and recovery readiness

**Engineering status: complete.** Patients can export their own profile and linked operational data with `no-store` handling. Backup tooling produces a checksummed PostgreSQL custom-format archive, and restore verification uses a separate disposable database so the live database is not overwritten.

## Phase 6: controlled release acceptance

**Repository status: complete; external gates pending.** CI, smoke checks, recovery rehearsal, and the release evidence template are documented in `docs/release/release-gates.md`. Clinical, legal/privacy, independent security, production infrastructure, accessibility-user, and operational approvals remain mandatory external gates.

## Phase 7: complete patient journey

**Engineering status: complete.** The patient portal now supports registration with automatic sign-in, profile completion, department/date slot discovery, atomic reservation and booking, appointment history, cancellation, session expiry handling, and logout without exposing credentials.

## Phase 8: doctor and administrator workflows

**Engineering status: complete.** The staff portal discovers authenticated roles, accepts doctor applications, supports administrator approval/rejection, and gives approved doctors weekly availability and appointment views. Local Compose has an environment-overridable bootstrap administrator for development only.

## Phase 9: journey acceptance

**Engineering status: complete.** Java unit/security tests and the Next.js production/type build cover the compiled contracts. Running-stack acceptance verifies registration/login CORS and service health; organization-specific browser automation and representative-user acceptance remain release evidence gates.

## Phase 10: continuous release verification

**Engineering status: complete.** CI now promotes the independently tested API, web, and AI jobs into a full-stack integration gate. The gate waits for Compose health, exercises readiness and deterministic ranking, validates Prometheus rules and targets, creates a checksummed PostgreSQL backup, restores it into an isolated disposable database, uploads service logs on failure, and always removes CI volumes during teardown.

## Phase 11: browser journey acceptance

**Engineering status: complete.** Playwright exercises the deployed homepage navigation, patient registration/profile/sign-out journey, and administrator authentication/doctor-approval workspace in Chromium. The browser suite runs against the Compose stack inside the CI integration gate, retains traces and screenshots on failure, and uses retry-isolated synthetic patient identities.

## Phase 12: resilience and concurrent-load acceptance

**Engineering status: complete.** The integration gate proves the normal API-to-AI ranking path, stops the advisory AI container, verifies the declared deterministic fallback contract and stable ordering, and restores AI health in a guaranteed cleanup path. It also issues 100 simultaneous API readiness requests and enforces a five-second batch ceiling. The exercise exposed and fixed Java HTTP/2 upgrade incompatibility with Uvicorn by pinning the internal client to HTTP/1.1.

## Phase 13: automated accessibility acceptance

**Engineering status: complete.** Axe and Playwright scan all five public portal routes against WCAG 2 A/AA and WCAG 2.1 A/AA rules. The gate exposed and corrected insufficient contrast in eyebrow text and primary actions. Browser execution is serialized for deterministic stateful journeys, with traces and screenshots retained on failure. Representative-user and assistive-technology review remains an external release gate.

## Phase 14: deployed security-boundary acceptance

**Engineering status: complete.** A running-stack security gate verifies anonymous denial across patient, operations, administrator, and intelligence APIs; required CSP, frame, MIME-sniffing, and request-correlation headers; and explicit CORS allowlist behavior for trusted and untrusted origins. This executable boundary test complements but does not replace independent penetration testing.

## Phase 15: supply-chain vulnerability enforcement

**Engineering status: complete.** CI scans source dependencies, committed configuration, and secrets before integration. After building the release-shaped stack, it separately scans the API, web, and AI runtime images and blocks high or critical fixed vulnerabilities. Findings still require owner triage; automated scanning does not replace an independent penetration test.

## Phase 16: release component inventories

**Engineering status: complete; local evidence generated 2026-08-28 and CI evidence pending on the next run.** The integration gate emits CycloneDX JSON software bills of materials for all three runtime images and retains them as a versioned workflow artifact. Release owners must preserve the SBOMs with the selected image digests and approval record.

## Phase 17: migration integrity enforcement

**Engineering status: complete.** CI validates strict Flyway filenames, unique and contiguous versions, non-empty executable SQL, and matching entries in the repository migration catalog before API tests run. Flyway continues to enforce stored checksums against databases that have already applied a migration.

## Phase 18: build evidence binding

**Engineering status: complete; local evidence generated 2026-08-28 and CI evidence pending on the next run.** The integration gate creates a machine-readable manifest containing the commit SHA, exact local runtime image IDs, SBOM filenames, and SHA-256 checksums. The manifest and inventories are uploaded together as `release-security-evidence`, reducing the risk of attaching an inventory from a different build.

## Phase 19: doctor consultation and medical prescription engine

**Engineering status: complete.** The platform features an end-to-end clinical consultation workspace and digital prescription management system backed by Flyway migration `V16__consultation_and_prescriptions.sql`. Doctors can record clinical notes, diagnosis, treatment advice, and multi-medicine prescriptions with exact dosage/frequency/instructions. Completing a consultation updates the appointment status to `COMPLETED`, records audit logs (`CONSULTATION_COMPLETED`, `PRESCRIPTION_FINALIZED`), sends in-app notifications, and exposes a printable digital prescription document to the patient.

Each phase is compiled, tested, started, smoke-tested, inspected, fixed, rerun, and documented before the next phase is accepted.
