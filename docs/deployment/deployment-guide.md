# Deployment guide

Local development uses Docker Compose. Copy `.env.example`, replace secrets, then run `docker compose up --build`. Readiness checks gate dependent service startup. Production requires managed secret storage, TLS, externalized durable PostgreSQL/object storage, backups, restricted networks, alerting, and an explicit security/performance review.
