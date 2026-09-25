# Cloud Deployment Architecture Guide

## Production Topology (AWS / GCP / Azure)
- **Container Orchestration:** Amazon EKS / Google GKE using `infrastructure/k8s/` manifests.
- **Database Layer:** Multi-AZ Amazon RDS for PostgreSQL (Engine 16.x) with automated failover.
- **Cache Layer:** Amazon ElastiCache for Redis (Redis 7.x) cluster mode enabled.
- **Ingress & WAF:** AWS Load Balancer Controller with AWS WAF rules for rate-limiting and OWASP Top 10 protection.
- **Secrets Management:** AWS Secrets Manager / HashiCorp Vault.
