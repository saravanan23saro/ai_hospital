# Complete Payment Gateway Architecture Guide

## System Overview
CareFlow AI implements a decoupled **Payment Gateway Abstraction Architecture** supporting multiple transaction providers (`MOCK`, `RAZORPAY`, `STRIPE`) with asynchronous webhook confirmation, idempotency key deduplication, digital receipt generation, and billing invoice integration.

```text
PATIENT / RECEPTIONIST
        │
        ▼
   BOOK APPOINTMENT
        │
        ▼
   GENERATE INVOICE (Status: UNPAID)
        │
        ▼
   POST /api/v1/payments/orders (Server validates amount from DB invoice)
        │
        ▼
   CREATE PAYMENT TRANSACTION (Status: CREATED)
        │
        ▼
   FRONTEND CHECKOUT (Mock / Razorpay Modal / Stripe PaymentIntent)
        │
        ▼
   POST /api/v1/payments/verify OR POST /api/v1/payments/webhooks/{provider}
        │
        ├─► Verify Signature (HMAC SHA256 / Provider Public Keys)
        ├─► Check Idempotency (X-Event-ID / Idempotency Key)
        ├─► Transition Payment Status: CREATED ➔ PENDING ➔ PAID
        ├─► Update Invoice Status: UNPAID ➔ PAID
        ├─► Generate Receipt (GET /api/v1/payments/{id}/receipt)
        └─► Record Audit Log (PAYMENT_VERIFIED) & Dispatch Event
```

## Provider Support & Environment Configuration

### 1. Mock Payment Provider (Local Development Default)
- **Configuration:** `PAYMENT_PROVIDER=mock`
- **Features:** Simulates instant order creation, verification, signature validation, and refund processing without external network dependencies.

### 2. Razorpay Provider
- **Configuration:** `PAYMENT_PROVIDER=razorpay`
- **Keys:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- **Currency:** INR (Paise currency units, e.g. ₹1000 = `100000` paise).

### 3. Stripe Provider
- **Configuration:** `PAYMENT_PROVIDER=stripe`
- **Keys:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Currency:** USD / INR (Minor units).

## Endpoints Reference
- `POST /api/v1/payments/orders`: Create server-validated payment order.
- `POST /api/v1/payments/verify`: Complete frontend verification.
- `POST /api/v1/payments/webhooks/{provider}`: Receive signature-verified webhook event.
- `GET /api/v1/payments/{id}`: View transaction state.
- `GET /api/v1/payments/{id}/receipt`: Download digital receipt.
- `POST /api/v1/payments/{id}/refund`: Issue staff-authorized refund.
