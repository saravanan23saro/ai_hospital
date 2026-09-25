# Security architecture

Passwords use an adaptive one-way hash. Short-lived access tokens and rotating refresh sessions are server-issued; logout revokes the session. Public registration always creates a patient-capable account and can never create an admin. Doctor privileges require an approved application. The backend derives identity and roles from authenticated claims and checks resource ownership in services.

Sensitive records use least-privilege authorization and auditable access. Validation, parameterized persistence, CSRF-appropriate token transport, rate limits, security headers, request IDs, secret injection, log redaction, generic errors, and dependency/container scanning are required. Passwords, tokens, clinical content, and secrets must not enter logs.

Authentication routes are rate-limited per source address and route. Only an explicitly configured web origin is allowed through CORS. Patient exports require the patient role, are scoped from the authenticated identity, and return `Cache-Control: no-store`. Account erasure is intentionally not automated because medical-record retention and legal-hold rules must be configured and approved for each deployment jurisdiction.

CI treats supply-chain checks as release gates. It scans the repository for vulnerable dependencies, exposed secrets, and insecure configuration, then scans each built runtime image for high and critical fixed vulnerabilities. The same release-shaped images produce CycloneDX JSON SBOMs. Release evidence must bind those inventories to immutable image digests; an SBOM generated from a different build is not valid evidence.
