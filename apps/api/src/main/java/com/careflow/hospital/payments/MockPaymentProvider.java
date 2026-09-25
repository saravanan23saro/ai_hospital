package com.careflow.hospital.payments;

import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component("mockPaymentProvider")
public class MockPaymentProvider implements PaymentProvider {

    @Override
    public String getProviderName() {
        return "MOCK";
    }

    @Override
    public PaymentDtos.OrderResponse createOrder(long amountMinor, String currency, String receiptId) {
        String orderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 8);
        return new PaymentDtos.OrderResponse(orderId, "CREATED", "http://localhost:3000/payments/mock-checkout?orderId=" + orderId);
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signature) {
        return true;
    }

    @Override
    public PaymentDtos.RefundResponse refund(String providerPaymentId, long amountMinor) {
        String refundId = "rfnd_mock_" + UUID.randomUUID().toString().substring(0, 8);
        return new PaymentDtos.RefundResponse(refundId, "REFUNDED");
    }
}
