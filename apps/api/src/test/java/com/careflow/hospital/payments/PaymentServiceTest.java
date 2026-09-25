package com.careflow.hospital.payments;

import com.careflow.hospital.audit.AuditService;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PaymentServiceTest {
    private PaymentRepository repository;
    private PaymentProvider provider;
    private PaymentProviderRegistry providerRegistry;
    private JdbcTemplate jdbc;
    private AuditService audit;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        repository = mock(PaymentRepository.class);
        provider = mock(PaymentProvider.class);
        jdbc = mock(JdbcTemplate.class);
        audit = mock(AuditService.class);
        when(provider.getProviderName()).thenReturn("MOCK");
        when(provider.verifyPayment(anyString(), anyString(), anyString())).thenReturn(true);
        providerRegistry = new PaymentProviderRegistry(List.of(provider), "MOCK");
        service = new PaymentService(repository, providerRegistry, jdbc, audit);
    }

    @Test
    void testCreateOrderSuccessfully() {
        UUID actorId = UUID.randomUUID();
        UUID patientId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        PaymentDtos.CreateOrderRequest req = new PaymentDtos.CreateOrderRequest(patientId, invoiceId, null, 100000L, "INR", "MOCK", "idemp-001");

        when(repository.findByIdempotencyKey("idemp-001")).thenReturn(Optional.empty());
        when(jdbc.queryForObject(anyString(), eq(Long.class), eq(invoiceId))).thenReturn(100000L);
        when(provider.createOrder(anyLong(), anyString(), anyString())).thenReturn(new PaymentDtos.OrderResponse("order_mock_123", "CREATED", "http://checkout"));
        when(repository.save(any(PaymentOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentDtos.View result = service.createOrder(actorId, req);

        assertNotNull(result);
        assertEquals(patientId, result.patientId());
        assertEquals(100000L, result.amountMinor());
        assertEquals("CREATED", result.status());
        verify(repository).save(any(PaymentOrder.class));
    }

    @Test
    void testVerifyPaymentUpdatesInvoiceAndAudit() {
        UUID actorId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        PaymentOrder order = new PaymentOrder(UUID.randomUUID(), invoiceId, null, 50000L, "INR", "MOCK", "ord_1", "key_1");

        when(repository.findById(paymentId)).thenReturn(Optional.of(order));
        PaymentDtos.VerifyPaymentRequest req = new PaymentDtos.VerifyPaymentRequest(paymentId.toString(), "pay_mock_999", "sig_valid", "CARD");

        PaymentDtos.View result = service.verifyPayment(actorId, req);

        assertEquals("PAID", result.status());
        assertEquals("pay_mock_999", result.providerPaymentId());
        verify(jdbc).update(contains("update invoice set status = 'PAID'"), eq(invoiceId));
        verify(audit).record(eq(actorId), eq("PAYMENT_VERIFIED"), eq("PAYMENT"), eq(order.getId()), eq("SUCCESS"));
    }

    @Test
    void testRefundPaymentTransitionsStatusToRefunded() {
        UUID actorId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        PaymentOrder order = new PaymentOrder(UUID.randomUUID(), invoiceId, null, 50000L, "INR", "MOCK", "ord_1", "key_1");
        order.verifyAndAuthorize("pay_1", "CARD");

        when(repository.findById(paymentId)).thenReturn(Optional.of(order));
        when(provider.refund(anyString(), anyLong())).thenReturn(new PaymentDtos.RefundResponse("rfnd_1", "REFUNDED"));

        PaymentDtos.View result = service.refund(actorId, paymentId, new PaymentDtos.RefundRequest(50000L, "Cancelled"));

        assertEquals("REFUNDED", result.status());
        verify(jdbc).update(contains("update invoice set status = ?"), eq("REFUNDED"), eq(invoiceId));
    }
}
