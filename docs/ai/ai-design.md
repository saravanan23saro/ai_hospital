# AI design

The API generates valid candidates and normalized features. FastAPI validates feature schemas and returns ranked candidates with score, confidence, model version, feature version, and reasons derived directly from non-zero feature contributions. Initial models use synthetic development data and documented baselines. They are not clinically validated.

The supported advisory tasks are doctor matching, slot ranking, no-show risk for reminders/operations, duration estimation bounded by configured limits, wait-time estimation, and waitlist ranking. No prediction can deny booking or override a hard constraint. Model activation is an audited admin operation. Production retraining is always explicit.

Fallback ordering is deterministic: preference fit, earliest valid time, workload balance, stable identifier. Responses expose `aiUsed`, `fallbackUsed`, model version, and latency.
