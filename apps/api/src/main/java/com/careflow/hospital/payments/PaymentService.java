package com.careflow.hospital.payments;

import com.careflow.hospital.audit.AuditService;
import com.careflow.hospital.shared.DomainException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private final PaymentRepository repository;
    private final PaymentProviderRegistry providerRegistry;
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    public PaymentService(PaymentRepository repository, PaymentProviderRegistry providerRegistry, JdbcTemplate jdbc, AuditService audit) {
        this.repository = repository;
        this.providerRegistry = providerRegistry;
        this.jdbc = jdbc;
        this.audit = audit;
    }

    @Transactional
    public PaymentDtos.View createOrder(UUID actorUserId, PaymentDtos.CreateOrderRequest request) {
        if (request.idempotencyKey() != null && !request.idempotencyKey().isBlank()) {
            Optional<PaymentOrder> existing = repository.findByIdempotencyKey(request.idempotencyKey());
            if (existing.isPresent()) {
                return view(existing.get());
            }
        }

        long validatedAmount = request.amountMinor();
        if (request.invoiceId() != null) {
            try {
                Long serverInvoiceAmount = jdbc.queryForObject("select amount_minor from invoice where invoice_id = ?", Long.class, request.invoiceId());
                if (serverInvoiceAmount != null && serverInvoiceAmount > 0) {
                    validatedAmount = serverInvoiceAmount;
                }
            } catch (Exception e) {
                // If invoice non-existent or table structure differs, retain non-zero amount
            }
        }

        PaymentProvider provider = providerRegistry.getProvider(request.provider());
        String receiptId = "rcpt_" + UUID.randomUUID().toString().substring(0, 8);
        PaymentDtos.OrderResponse orderRes = provider.createOrder(validatedAmount, request.currency() != null ? request.currency() : "INR", receiptId);

        PaymentOrder order = new PaymentOrder(
            request.patientId(),
            request.invoiceId(),
            request.appointmentId(),
            validatedAmount,
            request.currency() != null ? request.currency() : "INR",
            provider.getProviderName(),
            orderRes.providerOrderId(),
            request.idempotencyKey()
        );
        order = repository.save(order);
        audit.record(actorUserId, "PAYMENT_ORDER_CREATED", "PAYMENT", order.getId(), "SUCCESS");
        return view(order);
    }

    @Transactional
    public PaymentDtos.View verifyPayment(UUID actorUserId, PaymentDtos.VerifyPaymentRequest request) {
        UUID paymentId = UUID.fromString(request.paymentId());
        PaymentOrder order = repository.findById(paymentId).orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Payment order was not found."));

        PaymentProvider provider = providerRegistry.getProvider(order.getProvider());
        boolean isValid = provider.verifyPayment(order.getProviderOrderId(), request.providerPaymentId(), request.providerSignature());
        if (!isValid) {
            order.fail("SIGNATURE_INVALID", "Payment signature verification failed.");
            audit.record(actorUserId, "PAYMENT_FAILED", "PAYMENT", order.getId(), "FAILED");
            throw new DomainException(HttpStatus.BAD_REQUEST, "INVALID_SIGNATURE", "Payment verification signature failed.");
        }

        order.verifyAndAuthorize(request.providerPaymentId(), request.paymentMethod());

        if (order.getInvoiceId() != null) {
            jdbc.update("update invoice set status = 'PAID', updated_at = now() where invoice_id = ?", order.getInvoiceId());
        }

        audit.record(actorUserId, "PAYMENT_VERIFIED", "PAYMENT", order.getId(), "SUCCESS");
        return view(order);
    }

    @Transactional
    public PaymentDtos.View refund(UUID actorUserId, UUID paymentId, PaymentDtos.RefundRequest request) {
        PaymentOrder order = repository.findById(paymentId).orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Payment order was not found."));
        
        long refundAmount = (request != null && request.amountMinor() > 0) ? request.amountMinor() : order.getAmountMinor();
        if (refundAmount > order.getAmountMinor()) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "REFUND_EXCEEDS_AMOUNT", "Refund amount cannot exceed original paid amount.");
        }

        PaymentProvider provider = providerRegistry.getProvider(order.getProvider());
        provider.refund(order.getProviderPaymentId() != null ? order.getProviderPaymentId() : order.getProviderOrderId(), refundAmount);
        order.refund(refundAmount);
        
        if (order.getInvoiceId() != null) {
            String newInvoiceStatus = "REFUNDED".equals(order.getStatus()) ? "REFUNDED" : "PARTIALLY_REFUNDED";
            jdbc.update("update invoice set status = ?, updated_at = now() where invoice_id = ?", newInvoiceStatus, order.getInvoiceId());
        }

        audit.record(actorUserId, "PAYMENT_REFUNDED", "PAYMENT", order.getId(), "SUCCESS");
        return view(order);
    }

    @Transactional(readOnly = true)
    public PaymentDtos.View get(UUID paymentId) {
        return repository.findById(paymentId).map(this::view).orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Payment order was not found."));
    }

    @Transactional(readOnly = true)
    public PaymentDtos.ReceiptView getReceipt(UUID paymentId) {
        PaymentOrder order = repository.findById(paymentId).orElseThrow(() -> new DomainException(HttpStatus.NOT_FOUND, "PAYMENT_NOT_FOUND", "Payment order was not found."));
        if (!"PAID".equals(order.getStatus()) && !"REFUNDED".equals(order.getStatus()) && !"PARTIALLY_REFUNDED".equals(order.getStatus())) {
            throw new DomainException(HttpStatus.BAD_REQUEST, "RECEIPT_UNAVAILABLE", "Receipt is only available for PAID or REFUNDED transactions.");
        }
        return new PaymentDtos.ReceiptView(
            "RCPT-" + order.getId().toString().substring(0, 8).toUpperCase(),
            order.getId(),
            order.getInvoiceId(),
            order.getPatientId(),
            order.getAmountMinor(),
            order.getCurrency(),
            order.getProvider(),
            order.getTransactionId(),
            order.getPaymentMethod(),
            order.getStatus(),
            order.getPaidAt(),
            "CareFlow Smart Hospital Infrastructure | License #CF-2026-HOSP"
        );
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.View> getByInvoiceId(UUID invoiceId) {
        return repository.findAllByInvoiceId(invoiceId).stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.View> getByPatientId(UUID patientId) {
        return repository.findAllByPatientIdOrderByCreatedAtDesc(patientId).stream().map(this::view).toList();
    }

    @Transactional
    public void processWebhook(String providerName, String payload, String signature, String eventId, String orderId, String paymentId) {
        if (eventId != null && repository.findByWebhookEventId(eventId).isPresent()) {
            return; // Duplicate webhook event, skip execution
        }

        PaymentProvider provider = providerRegistry.getProvider(providerName);
        if (provider.verifyWebhookSignature(payload, signature)) {
            if (orderId != null) {
                repository.findByProviderOrderId(orderId).ifPresent(order -> {
                    if (eventId != null) order.recordWebhookEvent(eventId);
                    if ("CREATED".equals(order.getStatus()) || "PENDING".equals(order.getStatus()) || "AUTHORIZED".equals(order.getStatus())) {
                        order.verifyAndAuthorize(paymentId != null ? paymentId : "wh_" + UUID.randomUUID().toString().substring(0, 8), "WEBHOOK");
                        if (order.getInvoiceId() != null) {
                            jdbc.update("update invoice set status = 'PAID', updated_at = now() where invoice_id = ?", order.getInvoiceId());
                        }
                        audit.record(UUID.fromString("00000000-0000-0000-0000-000000000000"), "WEBHOOK_PAYMENT_PROCESSED", "PAYMENT", order.getId(), "SUCCESS");
                    }
                });
            }
        }
    }

    private PaymentDtos.View view(PaymentOrder p) {
        return new PaymentDtos.View(
            p.getId(),
            p.getPatientId(),
            p.getInvoiceId(),
            p.getAppointmentId(),
            p.getAmountMinor(),
            p.getCurrency(),
            p.getProvider(),
            p.getProviderOrderId(),
            p.getProviderPaymentId(),
            p.getTransactionId(),
            p.getStatus(),
            p.getPaymentMethod(),
            p.getReceiptUrl(),
            p.getCreatedAt(),
            p.getPaidAt()
        );
    }
}
