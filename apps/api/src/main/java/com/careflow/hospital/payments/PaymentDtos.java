package com.careflow.hospital.payments;

import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;

public final class PaymentDtos {
    private PaymentDtos() {}

    public record CreateOrderRequest(
        @NotNull UUID patientId,
        UUID invoiceId,
        UUID appointmentId,
        @Min(1) long amountMinor,
        String currency,
        String provider,
        String idempotencyKey
    ) {}

    public record VerifyPaymentRequest(
        @NotBlank String paymentId,
        @NotBlank String providerPaymentId,
        String providerSignature,
        String paymentMethod
    ) {}

    public record RefundRequest(
        @Min(1) long amountMinor,
        String reason
    ) {}

    public record OrderResponse(
        String providerOrderId,
        String providerStatus,
        String checkoutUrl
    ) {}

    public record PaymentInitiationResponse(
        String orderId,
        String provider,
        String status,
        String redirectUrl
    ) {}

    public record RefundResponse(
        String providerRefundId,
        String status
    ) {}

    public record View(
        UUID paymentId,
        UUID patientId,
        UUID invoiceId,
        UUID appointmentId,
        long amountMinor,
        String currency,
        String provider,
        String providerOrderId,
        String providerPaymentId,
        String transactionId,
        String status,
        String paymentMethod,
        String receiptUrl,
        Instant createdAt,
        Instant paidAt
    ) {}

    public record ReceiptView(
        String receiptNumber,
        UUID paymentId,
        UUID invoiceId,
        UUID patientId,
        long amountMinor,
        String currency,
        String provider,
        String transactionId,
        String paymentMethod,
        String status,
        Instant paidAt,
        String hospitalInfo
    ) {}
}
