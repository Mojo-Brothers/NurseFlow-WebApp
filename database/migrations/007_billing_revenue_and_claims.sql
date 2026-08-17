-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 007: Billing Ledger & Revenue Cycle
-- Standar: PMK No. 24/2022, BPJS INA-CBGs & KARS FMS/Financial Management
-- ==============================================================================

CREATE TABLE IF NOT EXISTS billing_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    charge_id VARCHAR(50) UNIQUE NOT NULL,
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    service_category VARCHAR(50) NOT NULL CHECK (service_category IN ('CONSULTATION', 'PROCEDURE', 'MEDICATION', 'LABORATORY', 'RADIOLOGY', 'ROOM_ACCOMMODATION', 'EQUIPMENT_USE', 'ADMINISTRATION')),
    service_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(15,2) NOT NULL,
    is_cito BOOLEAN DEFAULT FALSE,
    cito_surcharge DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    charged_by VARCHAR(100) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PENDING_CLAIM', 'PAID', 'PARTIALLY_PAID', 'WAIVED', 'CANCELLED')),
    invoice_id VARCHAR(50),
    charged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospital_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    total_gross DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    deposit_applied DECIMAL(15,2) DEFAULT 0.00,
    insurance_covered DECIMAL(15,2) DEFAULT 0.00,
    patient_payable DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    status VARCHAR(30) DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'SETTLED', 'CANCELLED')),
    cashier_name VARCHAR(100) NOT NULL,
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inacbg_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_number VARCHAR(30) UNIQUE NOT NULL,
    sep_number VARCHAR(30) NOT NULL,
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    cbg_code VARCHAR(20) NOT NULL,
    cbg_tariff DECIMAL(15,2) NOT NULL,
    hospital_tariff DECIMAL(15,2) NOT NULL,
    variance DECIMAL(15,2) NOT NULL,
    grouper_status VARCHAR(30) DEFAULT 'FINALIZED',
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_episode ON billing_ledgers(episode_id);
CREATE INDEX IF NOT EXISTS idx_billing_patient ON billing_ledgers(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing_ledgers(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoice_number ON hospital_invoices(invoice_number);
