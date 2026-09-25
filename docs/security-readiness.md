# Security Architecture & Boundary Controls

## Implemented Security Controls
1. **Stateless JWT Bearer Auth:** BCrypt password hashing (`$2a$10$...`), role-protected routes (`PATIENT`, `DOCTOR`, `RECEPTIONIST`, `ADMIN`).
2. **Method-Level Security & IDOR Protection:** `@PreAuthorize` annotations and user ID matching prevent cross-patient or cross-role data access.
3. **Rate Limiting:** `AuthenticationRateLimitFilter` active on login/register endpoints.
4. **Security Headers:** Enforced `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`.
5. **CORS Allowlist:** Origin restricted to trusted web application addresses (`http://localhost:3000`).

## External Security Gates
- Independent third-party white-box & black-box penetration testing.
