# AI Advisory & Safety Guidelines

## Overview
CareFlow AI operates strictly as an **advisory intelligence engine**. The system provides doctor ranking, appointment duration prediction, and no-show risk estimates to streamline hospital scheduling operations.

> ⚠️ **CRITICAL DISCLAIMER**  
> AI recommendations are advisory and do not replace professional medical judgment. CareFlow AI does NOT provide medical diagnoses, treatment plans, or triage clinical emergencies.

## Safety Controls
1. **Deterministic Fallback:** If the AI service is unreachable or encounters an error, the API automatically falls back to a deterministic, weighted calculation policy within 500 ms (`X-AI-Fallback: true`).
2. **Failure Isolation:** AI service degradation or outage never prevents patients from booking, canceling, or rescheduling appointments.
3. **No Direct PHI Storage in ML Models:** Features sent to the advisory model use anonymized UUIDs and numerical metrics (`preference_fit`, `availability_quality`, `workload_balance`, lead time days).
4. **Advisory Header:** All AI endpoints emit explicit `disclaimer` metadata and response headers.
