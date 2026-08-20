-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 052: LIS Laboratory Workflow & Durability
-- Sprint 5A / Step 2: Laboratory Order Consumer, Specimen Chain of Custody & Panic Values
-- Standards: JCI IPSG 2 (Effective Communication of Critical Results), LOINC, ISO 15189,
-- PostgreSQL 16 ACID Transactions, Optimistic Concurrency, Cryptographic Audit Trail.
-- ==============================================================================

-- 1. Enhance laboratory_specimens table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'accession_number') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN accession_number VARCHAR(50);
        ALTER TABLE laboratory_specimens ADD CONSTRAINT uq_lab_specimens_accession UNIQUE (accession_number);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'cpoe_item_id') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN cpoe_item_id UUID REFERENCES cpoe_order_items(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'version') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN version INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'specimen_quality_flag') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN specimen_quality_flag VARCHAR(50) DEFAULT 'OPTIMAL';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'quality_notes') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN quality_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'analyzing_at') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN analyzing_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'completed_at') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'cancelled_at') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN cancelled_at TIMESTAMPTZ;
        ALTER TABLE laboratory_specimens ADD COLUMN cancellation_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_specimens' AND column_name = 'correlation_id') THEN
        ALTER TABLE laboratory_specimens ADD COLUMN correlation_id VARCHAR(100);
    END IF;
END $$;

-- 2. Enhance laboratory_test_results table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'order_id') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN order_id UUID REFERENCES clinical_orders(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'cpoe_item_id') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN cpoe_item_id UUID REFERENCES cpoe_order_items(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'raw_analyzer_value') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN raw_analyzer_value TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'validation_status') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN validation_status VARCHAR(30) DEFAULT 'RAW';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'validated_by') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN validated_by VARCHAR(100);
        ALTER TABLE laboratory_test_results ADD COLUMN validated_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'released_by') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN released_by VARCHAR(100);
        ALTER TABLE laboratory_test_results ADD COLUMN released_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'version') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN version INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_test_results' AND column_name = 'amendment_reason') THEN
        ALTER TABLE laboratory_test_results ADD COLUMN amendment_reason TEXT;
        ALTER TABLE laboratory_test_results ADD COLUMN amended_by VARCHAR(100);
        ALTER TABLE laboratory_test_results ADD COLUMN amended_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Enhance laboratory_panic_alerts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_panic_alerts' AND column_name = 'order_id') THEN
        ALTER TABLE laboratory_panic_alerts ADD COLUMN order_id UUID REFERENCES clinical_orders(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_panic_alerts' AND column_name = 'cpoe_item_id') THEN
        ALTER TABLE laboratory_panic_alerts ADD COLUMN cpoe_item_id UUID REFERENCES cpoe_order_items(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_panic_alerts' AND column_name = 'escalation_level') THEN
        ALTER TABLE laboratory_panic_alerts ADD COLUMN escalation_level VARCHAR(30) DEFAULT 'PRIMARY_NURSE';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_panic_alerts' AND column_name = 'escalated_at') THEN
        ALTER TABLE laboratory_panic_alerts ADD COLUMN escalated_at TIMESTAMPTZ;
        ALTER TABLE laboratory_panic_alerts ADD COLUMN escalation_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_panic_alerts' AND column_name = 'acknowledged_by') THEN
        ALTER TABLE laboratory_panic_alerts ADD COLUMN acknowledged_by VARCHAR(100);
        ALTER TABLE laboratory_panic_alerts ADD COLUMN acknowledged_at TIMESTAMPTZ;
        ALTER TABLE laboratory_panic_alerts ADD COLUMN acknowledgement_notes TEXT;
        ALTER TABLE laboratory_panic_alerts ADD COLUMN clinician_feedback TEXT;
        ALTER TABLE laboratory_panic_alerts ADD COLUMN resolved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'laboratory_panic_alerts' AND column_name = 'correlation_id') THEN
        ALTER TABLE laboratory_panic_alerts ADD COLUMN correlation_id VARCHAR(100);
    END IF;
END $$;

-- 4. Create Master Laboratory Critical Thresholds Table
CREATE TABLE IF NOT EXISTS master_lab_critical_thresholds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_code VARCHAR(30) UNIQUE NOT NULL,
    test_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    reference_low NUMERIC(10, 3),
    reference_high NUMERIC(10, 3),
    panic_low NUMERIC(10, 3),
    panic_high NUMERIC(10, 3),
    clinical_threat_low TEXT,
    clinical_threat_high TEXT,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Seed Master Critical Thresholds (JCI / Permenkes 24/2022)
INSERT INTO master_lab_critical_thresholds 
(test_code, test_name, category, unit, reference_low, reference_high, panic_low, panic_high, clinical_threat_low, clinical_threat_high)
VALUES
('LAB-POTASSIUM', 'Kalium Serum (K+)', 'CLINICAL_CHEMISTRY', 'mEq/L', 3.500, 5.000, 2.800, 6.200, 'Aritmia Ventrikel Berat / Henti Jantung (Hipokalemia Berat)', 'Aritmia Ventrikel Letal / Henti Jantung (Hiperkalemia Berat)'),
('LAB-TROP-I', 'Troponin I Kuantitatif', 'CLINICAL_CHEMISTRY', 'ng/mL', 0.000, 0.040, NULL, 0.100, NULL, 'Infark Miokard Akut (STEMI / NSTEMI Letal)'),
('LAB-HB', 'Hemoglobin (Hb)', 'HEMATOLOGY', 'g/dL', 12.000, 16.000, 7.000, 20.000, 'Anemia Berat / Syok Hipovolemik Perlu Transfusi Cito', 'Polisitemia Berat / Risiko Hiperviskositas Serebral'),
('LAB-PLATELET', 'Trombosit (Platelet Count)', 'HEMATOLOGY', '10^3/uL', 150.000, 450.000, 20.000, 1000.000, 'Risiko Perdarahan Spontan Intrakranial / DHF Grade 4', 'Trombositosis Ekstrem / Risiko Trombosis Arteri Akut'),
('LAB-GLU-RANDOM', 'Glukosa Darah Sewaktu (GDS)', 'CLINICAL_CHEMISTRY', 'mg/dL', 70.000, 140.000, 50.000, 400.000, 'Koma Hipoglikemia Berat / Kerusakan Otak Permanen', 'Ketoasidosis Diabetik (KAD) / Status Hiperosmolar Hiperglikemik (HHS)'),
('LAB-LACTATE', 'Asam Laktat Serum', 'BLOOD_GAS', 'mmol/L', 0.500, 2.000, NULL, 4.000, NULL, 'Asidosis Laktat Berat / Syok Septik Dekompensasi')
ON CONFLICT (test_code) DO NOTHING;

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_lab_specimens_accession ON laboratory_specimens(accession_number);
CREATE INDEX IF NOT EXISTS idx_lab_specimens_cpoe_item ON laboratory_specimens(cpoe_item_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_cpoe_item ON laboratory_test_results(cpoe_item_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_validation ON laboratory_test_results(validation_status);
CREATE INDEX IF NOT EXISTS idx_lab_panic_escalation ON laboratory_panic_alerts(escalation_level, status);
