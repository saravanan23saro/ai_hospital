package com.careflow.hospital.payments;

import jakarta.validation.Valid;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @PostMapping("/orders")
    @PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")
    public ResponseEntity<PaymentDtos.View> createOrder(Authentication auth, @Valid @RequestBody PaymentDtos.CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createOrder(user(auth), request));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")
    public PaymentDtos.View verifyPayment(Authentication auth, @Valid @RequestBody PaymentDtos.VerifyPaymentRequest request) {
        return service.verifyPayment(user(auth), request);
    }

    @PostMapping("/{id}/refund")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    public PaymentDtos.View refund(Authentication auth, @PathVariable UUID id, @Valid @RequestBody PaymentDtos.RefundRequest request) {
        return service.refund(user(auth), id, request);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public PaymentDtos.View get(@PathVariable UUID id) {
        return service.get(id);
    }

    @GetMapping("/{id}/receipt")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public PaymentDtos.ReceiptView getReceipt(@PathVariable UUID id) {
        return service.getReceipt(id);
    }

    @GetMapping("/invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public List<PaymentDtos.View> getByInvoiceId(@PathVariable UUID invoiceId) {
        return service.getByInvoiceId(invoiceId);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')")
    public List<PaymentDtos.View> getByPatientId(@PathVariable UUID patientId) {
        return service.getByPatientId(patientId);
    }

    @PostMapping("/webhooks/{provider}")
    public ResponseEntity<Void> handleWebhook(
        @PathVariable String provider,
        @RequestBody String payload,
        @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
        @RequestHeader(value = "X-Event-ID", required = false) String eventId,
        @RequestParam(value = "orderId", required = false) String orderId,
        @RequestParam(value = "paymentId", required = false) String paymentId
    ) {
        service.processWebhook(provider, payload, signature, eventId, orderId, paymentId);
        return ResponseEntity.ok().build();
    }

    private UUID user(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
