-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 065: Patient Financial & Revenue Cycle Closed Loop
-- Sprint 5A / Step 10 (VS-13): Itemized Charge Capture, Deposit & Guarantee Letter Management,
-- Multi-Payer Split Invoicing, Cashier Multi-Payment (Cash/QRIS/EDC/VA), Credit/Debit Notes & Refunds,
-- End-of-Day Shift Cash Reconciliation & Accounts Receivable (AR) Aging Lifecycle.
-- Standards: PMK 24/2022, Permenkes 3/2023, JCI MOI / FMS, PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Table: patient_deposit_ledgers
CREATE TABLE IF NOT EXISTS patient_deposit_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    deposit_number VARCHAR(50) UNIQUE NOT NULL,
    deposit_type VARCHAR(50) NOT NULL CHECK (deposit_type IN ('ADMISSION_DEPOSIT', 'SURGICAL_PREPAYMENT', 'GENERAL_RETAINER')),
    amount_idr NUMERIC(15, 2) NOT NULL,
    remaining_balance_idr NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'QRIS', 'EDC_DEBIT', 'EDC_CREDIT', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT')),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PARTIALLY_APPLIED', 'FULLY_APPLIED', 'REFUNDED')),
    received_by_id VARCHAR(50) NOT NULL,
    received_by_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposit_encounter ON patient_deposit_ledgers(encounter_id);
CREATE INDEX IF NOT EXISTS idx_deposit_patient ON patient_deposit_ledgers(patient_id);
CREATE INDEX IF NOT EXISTS idx_deposit_status ON patient_deposit_ledgers(status);

-- 2. Table: patient_split_invoices
CREATE TABLE IF NOT EXISTS patient_split_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    payer_type VARCHAR(50) NOT NULL DEFAULT 'BPJS_KESEHATAN' CHECK (payer_type IN ('BPJS_KESEHATAN', 'ASURANSI_SWASTA', 'CORPORATE_DIRECT', 'MANDIRI_UMUM')),
    total_gross_idr NUMERIC(15, 2) NOT NULL,
    discount_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payer_covered_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    patient_share_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- Co-pay, deductible, excess, non-covered
    deposit_applied_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_patient_payable_idr NUMERIC(15, 2) NOT NULL, -- patient_share_idr - deposit_applied_idr
    paid_amount_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    invoice_status VARCHAR(30) NOT NULL DEFAULT 'ISSUED' CHECK (invoice_status IN (
        'DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'CREDITED'
    )),
    issued_by_id VARCHAR(50) NOT NULL,
    issued_by_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_split_inv_encounter ON patient_split_invoices(encounter_id);
CREATE INDEX IF NOT EXISTS idx_split_inv_status ON patient_split_invoices(invoice_status);

-- 3. Table: cashier_payment_transactions
CREATE TABLE IF NOT EXISTS cashier_payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES patient_split_invoices(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN (
        'CASH', 'QRIS', 'EDC_DEBIT', 'EDC_CREDIT', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'DEPOSIT_DEDUCTION', 'INSURANCE_GL'
    )),
    payment_reference_number VARCHAR(100),
    amount_paid_idr NUMERIC(15, 2) NOT NULL,
    change_amount_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cashier_shift_id VARCHAR(50),
    cashier_id VARCHAR(50) NOT NULL,
    cashier_name VARCHAR(100) NOT NULL,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cashier_tx_invoice ON cashier_payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_cashier_tx_method ON cashier_payment_transactions(payment_method);

-- 4. Table: financial_adjustments_and_refunds
CREATE TABLE IF NOT EXISTS financial_adjustments_and_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES patient_split_invoices(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('CREDIT_NOTE', 'DEBIT_NOTE', 'DEPOSIT_REFUND', 'OVERPAYMENT_REFUND')),
    amount_idr NUMERIC(15, 2) NOT NULL,
    reason_category VARCHAR(100) NOT NULL,
    reason_details TEXT NOT NULL,
    authorized_by_id VARCHAR(50) NOT NULL,
    authorized_by_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EXECUTED' CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'EXECUTED', 'REJECTED')),
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fin_adj_invoice ON financial_adjustments_and_refunds(invoice_id);

-- 5. Table: cashier_shift_reconciliations
CREATE TABLE IF NOT EXISTS cashier_shift_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_number VARCHAR(50) UNIQUE NOT NULL,
    cashier_id VARCHAR(50) NOT NULL,
    cashier_name VARCHAR(100) NOT NULL,
    shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_cash_idr NUMERIC(15, 2) NOT NULL,
    actual_cash_counted_idr NUMERIC(15, 2) NOT NULL,
    cash_variance_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_non_cash_idr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_transactions_count INT NOT NULL DEFAULT 0,
    shift_status VARCHAR(30) NOT NULL DEFAULT 'CLOSED_BALANCED' CHECK (shift_status IN ('OPEN', 'CLOSED_BALANCED', 'CLOSED_WITH_VARIANCE')),
    variance_explanation TEXT,
    supervisor_sign_off_id VARCHAR(50),
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_reconcile_cashier ON cashier_shift_reconciliations(cashier_id, shift_status);

-- 6. Table: accounts_receivable_aging_ledgers
CREATE TABLE IF NOT EXISTS accounts_receivable_aging_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES patient_split_invoices(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    payer_name VARCHAR(100) NOT NULL,
    original_ar_amount_idr NUMERIC(15, 2) NOT NULL,
    current_balance_idr NUMERIC(15, 2) NOT NULL,
    aging_bucket VARCHAR(30) NOT NULL DEFAULT 'CURRENT_0_30' CHECK (aging_bucket IN (
        'CURRENT_0_30', 'AGING_31_60', 'AGING_61_90', 'AGING_OVER_90'
    )),
    ar_status VARCHAR(30) NOT NULL DEFAULT 'OUTSTANDING' CHECK (ar_status IN (
        'OUTSTANDING', 'PARTIAL_SETTLEMENT', 'FULLY_COLLECTED', 'DISPUTED', 'WRITTEN_OFF'
    )),
    due_date DATE NOT NULL,
    last_payment_date TIMESTAMP WITH TIME ZONE,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_invoice ON accounts_receivable_aging_ledgers(invoice_id);
CREATE INDEX IF NOT EXISTS idx_ar_aging_bucket ON accounts_receivable_aging_ledgers(aging_bucket, ar_status);
