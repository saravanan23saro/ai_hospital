package com.careflow.hospital.payments;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<PaymentOrder, UUID> {
    Optional<PaymentOrder> findByIdempotencyKey(String idempotencyKey);
    Optional<PaymentOrder> findByProviderOrderId(String providerOrderId);
    Optional<PaymentOrder> findByWebhookEventId(String webhookEventId);
    List<PaymentOrder> findAllByInvoiceId(UUID invoiceId);
    List<PaymentOrder> findAllByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
