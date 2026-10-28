-- V19__enhance_emergency_lab_billing.sql: Enhancements for Emergency, Laboratory & Billing Modules

-- Emergency Case Enhancements
ALTER TABLE emergency_case DROP CONSTRAINT IF EXISTS emergency_case_status_check;
ALTER TABLE emergency_case ADD CONSTRAINT emergency_case_status_check CHECK (status IN ('OPEN', 'ASSESSED', 'IN_ASSESSMENT', 'IN_TREATMENT', 'ADMITTED', 'DISCHARGED', 'TRANSFERRED', 'CANCELLED', 'CLOSED'));

ALTER TABLE emergency_case ADD COLUMN IF NOT EXISTS arrival_mode varchar(30) DEFAULT 'WALK_IN';
ALTER TABLE emergency_case ADD COLUMN IF NOT EXISTS assigned_doctor_id uuid REFERENCES doctor(doctor_id);
ALTER TABLE emergency_case ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES department(department_id);
ALTER TABLE emergency_case ADD COLUMN IF NOT EXISTS bed_number varchar(50);
ALTER TABLE emergency_case ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE emergency_case ADD COLUMN IF NOT EXISTS triage_vitals varchar(255);

-- Lab Order Enhancements
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS category varchar(50) DEFAULT 'General';
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS test_name varchar(150);
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS priority varchar(20) DEFAULT 'ROUTINE';
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS clinical_notes text;
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS result_flag varchar(20) DEFAULT 'NORMAL';
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS reference_range varchar(100);
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS unit varchar(30);
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS technician_name varchar(100);
ALTER TABLE lab_order ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Invoice Enhancements & Line Items
ALTER TABLE invoice DROP CONSTRAINT IF EXISTS invoice_status_check;
ALTER TABLE invoice ADD CONSTRAINT invoice_status_check CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'VOID', 'REFUNDED'));

ALTER TABLE invoice ADD COLUMN IF NOT EXISTS paid_amount_minor bigint DEFAULT 0;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS discount_minor bigint DEFAULT 0;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS tax_minor bigint DEFAULT 0;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS invoice_item (
    item_id uuid PRIMARY KEY,
    invoice_id uuid NOT NULL REFERENCES invoice(invoice_id) ON DELETE CASCADE,
    category varchar(50) NOT NULL,
    description varchar(255) NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price_minor bigint NOT NULL CHECK (unit_price_minor >= 0),
    total_price_minor bigint NOT NULL CHECK (total_price_minor >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_item_invoice ON invoice_item(invoice_id);
