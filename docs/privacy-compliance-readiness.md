# Data Privacy & HIPAA Readiness

## Current Implementation (Local MVP)
- **Data Export:** Patients can export their personal profile and linked appointment records (`GET /api/v1/patients/me/export`).
- **No-Store Headers:** Sensitive data export routes specify `Cache-Control: no-store, max-age=0`.
- **PHI Masking in Logs:** Application logs exclude patient medical notes, password hashes, and sensitive identifiers.

## External Production Gates (Pending Launch)
1. **Business Associate Agreement (BAA):** Must be executed with cloud infrastructure providers (AWS / GCP / Azure).
2. **HIPAA & GDPR Compliance Certification:** Formal legal audit of PHI storage, access controls, and retention policies.
3. **Data Encryption at Rest:** Database volume encryption using KMS keys (AWS KMS / GCP Cloud KMS).
4. **Data Encryption in Transit:** Enforced TLS 1.3 across all microservices and edge ingress endpoints.
