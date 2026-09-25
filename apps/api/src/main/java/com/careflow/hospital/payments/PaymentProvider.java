package com.careflow.hospital.payments;

public interface PaymentProvider {
    String getProviderName();
    PaymentDtos.OrderResponse createOrder(long amountMinor, String currency, String receiptId);

    default PaymentDtos.PaymentInitiationResponse initiatePayment(String orderId, long amountMinor, String currency) {
        return new PaymentDtos.PaymentInitiationResponse(orderId, getProviderName(), "PENDING", null);
    }

    default boolean verifyPayment(String orderId, String paymentId, String signature) {
        return true;
    }

    boolean verifyWebhookSignature(String payload, String signature);

    default boolean processWebhook(String payload, String signature) {
        return verifyWebhookSignature(payload, signature);
    }

    PaymentDtos.RefundResponse refund(String providerPaymentId, long amountMinor);

    default String getPaymentStatus(String providerPaymentId) {
        return "PAID";
    }
}

