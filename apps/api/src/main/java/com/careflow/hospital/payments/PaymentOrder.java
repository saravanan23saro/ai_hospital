package com.careflow.hospital.payments;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "payment_transaction")
public class PaymentOrder {
    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "invoice_id")
    private UUID invoiceId;

    @Column(name = "appointment_id")
    private UUID appointmentId;

    @Column(name = "amount_minor", nullable = false)
    private long amountMinor;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, length = 30)
    private String provider;

    @Column(name = "provider_order_id")
    private String providerOrderId;

    @Column(name = "provider_payment_id")
    private String providerPaymentId;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "gateway_response", columnDefinition = "text")
    private String gatewayResponse;

    @Column(name = "failure_code", length = 50)
    private String failureCode;

    @Column(name = "failure_message", columnDefinition = "text")
    private String failureMessage;

    @Column(name = "webhook_event_id", unique = true)
    private String webhookEventId;

    @Column(name = "idempotency_key", unique = true)
    private String idempotencyKey;

    @Column(name = "receipt_url", columnDefinition = "text")
    private String receiptUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "refunded_at")
    private Instant refundedAt;

    protected PaymentOrder() {}

    public PaymentOrder(UUID patientId, UUID invoiceId, UUID appointmentId, long amountMinor, String currency, String provider, String providerOrderId, String idempotencyKey) {
        this.id = UUID.randomUUID();
        this.patientId = patientId;
        this.invoiceId = invoiceId;
        this.appointmentId = appointmentId;
        this.amountMinor = amountMinor;
        this.currency = currency != null ? currency : "INR";
        this.provider = provider != null ? provider : "MOCK";
        this.providerOrderId = providerOrderId;
        this.idempotencyKey = idempotencyKey;
        this.paymentMethod = "CARD";
        this.status = "CREATED";
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    public void markPending() {
        if (!"CREATED".equals(this.status)) {
            throw new IllegalStateException("Payment status transition invalid: " + this.status + " -> PENDING");
        }
        this.status = "PENDING";
        this.updatedAt = Instant.now();
    }

    public void cancel() {
        if (!Set.of("CREATED", "PENDING").contains(this.status)) {
            throw new IllegalStateException("Payment status transition invalid: " + this.status + " -> CANCELLED");
        }
        this.status = "CANCELLED";
        this.updatedAt = Instant.now();
    }

    public void markAuthorized(String providerPaymentId) {
        if (!Set.of("CREATED", "PENDING").contains(this.status)) {
            throw new IllegalStateException("Payment status transition invalid: " + this.status + " -> AUTHORIZED");
        }
        this.providerPaymentId = providerPaymentId;
        this.status = "AUTHORIZED";
        this.updatedAt = Instant.now();
    }

    public void verifyAndAuthorize(String providerPaymentId, String paymentMethod) {
        if (!Set.of("CREATED", "PENDING", "AUTHORIZED", "PAID").contains(this.status)) {
            throw new IllegalStateException("Payment status transition invalid: " + this.status + " -> PAID");
        }
        if (!"PAID".equals(this.status)) {
            this.providerPaymentId = providerPaymentId;
            this.transactionId = "txn_" + UUID.randomUUID().toString().substring(0, 8);
            if (paymentMethod != null && !paymentMethod.isBlank()) this.paymentMethod = paymentMethod;
            this.status = "PAID";
            this.paidAt = Instant.now();
            this.receiptUrl = "http://localhost:8180/api/v1/payments/" + this.id + "/receipt";
            this.updatedAt = this.paidAt;
        }
    }

    public void fail(String code, String message) {
        if (!Set.of("CREATED", "PENDING", "AUTHORIZED").contains(this.status)) {
            throw new IllegalStateException("Payment status transition invalid: " + this.status + " -> FAILED");
        }
        this.status = "FAILED";
        this.failureCode = code;
        this.failureMessage = message;
        this.updatedAt = Instant.now();
    }

    public void refund(long refundAmountMinor) {
        if (!"PAID".equals(this.status) && !"PARTIALLY_REFUNDED".equals(this.status)) {
            throw new IllegalStateException("Only PAID or PARTIALLY_REFUNDED payments can be refunded.");
        }
        if (refundAmountMinor >= this.amountMinor) {
            this.status = "REFUNDED";
        } else {
            this.status = "PARTIALLY_REFUNDED";
        }
        this.refundedAt = Instant.now();
        this.updatedAt = this.refundedAt;
    }

    public void refund() {
        refund(this.amountMinor);
    }

    public void recordWebhookEvent(String webhookEventId) {
        this.webhookEventId = webhookEventId;
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getPatientId() { return patientId; }
    public UUID getInvoiceId() { return invoiceId; }
    public UUID getAppointmentId() { return appointmentId; }
    public long getAmountMinor() { return amountMinor; }
    public String getCurrency() { return currency; }
    public String getProvider() { return provider; }
    public String getProviderOrderId() { return providerOrderId; }
    public String getProviderPaymentId() { return providerPaymentId; }
    public String getTransactionId() { return transactionId; }
    public String getStatus() { return status; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getGatewayResponse() { return gatewayResponse; }
    public String getFailureCode() { return failureCode; }
    public String getFailureMessage() { return failureMessage; }
    public String getWebhookEventId() { return webhookEventId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getReceiptUrl() { return receiptUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getPaidAt() { return paidAt; }
    public Instant getRefundedAt() { return refundedAt; }
}
