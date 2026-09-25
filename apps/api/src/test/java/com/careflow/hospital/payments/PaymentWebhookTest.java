package com.careflow.hospital.payments;

import com.careflow.hospital.audit.AuditService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentWebhookTest {
    private PaymentRepository repository;
    private PaymentProvider mockProvider;
    private PaymentProvider rzpProvider;
    private PaymentProviderRegistry providerRegistry;
    private JdbcTemplate jdbc;
    private AuditService audit;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        repository = mock(PaymentRepository.class);
        mockProvider = mock(PaymentProvider.class);
        rzpProvider = mock(PaymentProvider.class);
        jdbc = mock(JdbcTemplate.class);
        audit = mock(AuditService.class);

        when(mockProvider.getProviderName()).thenReturn("MOCK");
        when(rzpProvider.getProviderName()).thenReturn("RAZORPAY");

        providerRegistry = new PaymentProviderRegistry(List.of(mockProvider, rzpProvider), "MOCK");
        service = new PaymentService(repository, providerRegistry, jdbc, audit);
    }

    @Test
    void testProcessWebhookSkipsDuplicateEvents() {
        String eventId = "evt_dup_001";
        PaymentOrder existingOrder = new PaymentOrder(UUID.randomUUID(), null, null, 1000L, "INR", "MOCK", "ord_1", "k1");
        when(repository.findByWebhookEventId(eventId)).thenReturn(Optional.of(existingOrder));

        service.processWebhook("MOCK", "{}", "sig", eventId, "ord_1", "pay_1");

        verify(mockProvider, never()).verifyWebhookSignature(anyString(), anyString());
    }

    @Test
    void testProcessWebhookVerifiesSignatureAndUpdatesPayment() {
        String eventId = "evt_new_100";
        String orderId = "ord_rzp_555";
        PaymentOrder order = new PaymentOrder(UUID.randomUUID(), UUID.randomUUID(), null, 250000L, "INR", "RAZORPAY", orderId, "k2");

        when(repository.findByWebhookEventId(eventId)).thenReturn(Optional.empty());
        when(rzpProvider.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);
        when(repository.findByProviderOrderId(orderId)).thenReturn(Optional.of(order));

        service.processWebhook("RAZORPAY", "{\"event\":\"payment.captured\"}", "valid_sig", eventId, orderId, "pay_rzp_999");

        assertEquals("PAID", order.getStatus());
        assertEquals(eventId, order.getWebhookEventId());
        verify(jdbc).update(contains("update invoice set status = 'PAID'"), eq(order.getInvoiceId()));
    }
}
