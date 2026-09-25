# Payment Gateway Security & Compliance Guide

## PCI-DSS Scope Minimization
CareFlow AI operates strictly within **PCI-DSS SAQ A / SAQ A-EP** scope rules:
1. **Zero Raw Card Data Storage:** Primary Account Numbers (PAN), CVV/CVC verification codes, and PINs are **NEVER** stored, transmitted, or logged by the backend application or database.
2. **Hosted Checkouts:** All credit card and bank input fields render inside provider-hosted iFrames or JS elements (Razorpay Checkout / Stripe Elements).
3. **Secret Isolation:** Provider secret API keys (`RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`) reside exclusively in environment variables and are never passed to Next.js client bundles or frontend APIs.

## Server-Side Security Safeguards
- **Server Amount Calculation:** The backend `PaymentService.createOrder()` ignores amount inputs sent from the frontend and reads the authoritative `amount_minor` directly from the database `invoice` table.
- **HMAC Signature Verification:** Webhook endpoints verify signatures before updating transaction statuses.
- **Idempotency & Duplicate Prevention:** Unique database constraints on `idempotency_key` and `webhook_event_id` prevent double processing or duplicate refunds.
