package com.careflow.hospital.payments;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component("stripePaymentProvider")
public class StripePaymentProvider implements PaymentProvider {

    @Value("${hospital.payments.stripe.secret-key:mock_stripe_secret_key}")
    private String secretKey;

    @Value("${hospital.payments.stripe.webhook-secret:mock_stripe_webhook_secret}")
    private String webhookSecret;

    @Override
    public String getProviderName() {
        return "STRIPE";
    }

    @Override
    public PaymentDtos.OrderResponse createOrder(long amountMinor, String currency, String receiptId) {
        String orderId = "pi_stripe_" + UUID.randomUUID().toString().substring(0, 8);
        return new PaymentDtos.OrderResponse(orderId, "requires_payment_method", "https://checkout.stripe.com/pay/" + orderId);
    }

    @Override
    public boolean verifyWebhookSignature(String payload, String signature) {
        return signature != null && !signature.isBlank();
    }

    @Override
    public PaymentDtos.RefundResponse refund(String providerPaymentId, long amountMinor) {
        String refundId = "re_stripe_" + UUID.randomUUID().toString().substring(0, 8);
        return new PaymentDtos.RefundResponse(refundId, "succeeded");
    }
}
