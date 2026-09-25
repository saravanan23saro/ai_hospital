-- V15__payments_and_gateways.sql: Payment Transactions, Gateways, Webhook Event Deduplication and Receipts
CREATE TABLE payment_transaction (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    invoice_id UUID REFERENCES invoice(invoice_id),
    appointment_id UUID REFERENCES appointment(appointment_id),
    amount_minor BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    provider VARCHAR(30) NOT NULL DEFAULT 'MOCK',
    provider_order_id VARCHAR(100),
    provider_payment_id VARCHAR(100),
    transaction_id VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    payment_method VARCHAR(30) DEFAULT 'CARD',
    gateway_response TEXT,
    failure_code VARCHAR(50),
    failure_message TEXT,
    webhook_event_id VARCHAR(100) UNIQUE,
    idempotency_key VARCHAR(100) UNIQUE,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pay_txn_patient ON payment_transaction(patient_id);
CREATE INDEX idx_pay_txn_invoice ON payment_transaction(invoice_id);
CREATE INDEX idx_pay_txn_status ON payment_transaction(status);
CREATE INDEX idx_pay_txn_provider_order ON payment_transaction(provider_order_id);
