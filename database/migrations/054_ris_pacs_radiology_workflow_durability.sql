-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 054: RIS & PACS Radiology Workflow Durability
-- Sprint 5A / Step 3: Universal CPOE Radiology Consumer, DICOM MWL, Structured Reports,
-- Critical Findings Closed-Loop Read-Back, and PACS WADO-RS Metadata Ingestion.
-- Standards: DICOM PS 3.10 / PS 3.18, JCI IPSG 2, ISO 15189, PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Enhance radiology_orders with CPOE link & versioning
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_orders' AND column_name = 'cpoe_order_id') THEN
        ALTER TABLE radiology_orders ADD COLUMN cpoe_order_id UUID REFERENCES clinical_orders(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_orders' AND column_name = 'cpoe_item_id') THEN
        ALTER TABLE radiology_orders ADD COLUMN cpoe_item_id UUID REFERENCES cpoe_order_items(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_orders' AND column_name = 'version') THEN
        ALTER TABLE radiology_orders ADD COLUMN version INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_orders' AND column_name = 'correlation_id') THEN
        ALTER TABLE radiology_orders ADD COLUMN correlation_id VARCHAR(100);
    END IF;
END $$;

-- 2. Enhance radiology_studies with CPOE link, versioning & PACS metadata
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_studies' AND column_name = 'cpoe_order_id') THEN
        ALTER TABLE radiology_studies ADD COLUMN cpoe_order_id UUID REFERENCES clinical_orders(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_studies' AND column_name = 'cpoe_item_id') THEN
        ALTER TABLE radiology_studies ADD COLUMN cpoe_item_id UUID REFERENCES cpoe_order_items(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_studies' AND column_name = 'version') THEN
        ALTER TABLE radiology_studies ADD COLUMN version INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_studies' AND column_name = 'correlation_id') THEN
        ALTER TABLE radiology_studies ADD COLUMN correlation_id VARCHAR(100);
    END IF;
END $$;

-- 3. Enhance radiology_reports with CPOE link, versioning, and amendment tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_reports' AND column_name = 'cpoe_order_id') THEN
        ALTER TABLE radiology_reports ADD COLUMN cpoe_order_id UUID REFERENCES clinical_orders(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_reports' AND column_name = 'cpoe_item_id') THEN
        ALTER TABLE radiology_reports ADD COLUMN cpoe_item_id UUID REFERENCES cpoe_order_items(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_reports' AND column_name = 'version') THEN
        ALTER TABLE radiology_reports ADD COLUMN version INT DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_reports' AND column_name = 'amendment_reason') THEN
        ALTER TABLE radiology_reports ADD COLUMN amendment_reason TEXT;
        ALTER TABLE radiology_reports ADD COLUMN amended_by VARCHAR(100);
        ALTER TABLE radiology_reports ADD COLUMN amended_at TIMESTAMPTZ;
    END IF;
END $$;

-- 4. Enhance radiology_critical_finding_alerts with strict closed-loop fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'cpoe_order_id') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN cpoe_order_id UUID REFERENCES clinical_orders(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'cpoe_item_id') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN cpoe_item_id UUID REFERENCES cpoe_order_items(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'escalation_level') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN escalation_level VARCHAR(30) DEFAULT 'PRIMARY_PHYSICIAN';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'escalated_at') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN escalated_at TIMESTAMPTZ;
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN escalation_reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'acknowledged_at') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN acknowledged_at TIMESTAMPTZ;
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN acknowledged_by VARCHAR(100);
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN clinical_instruction TEXT;
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN resolved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'radiology_critical_finding_alerts' AND column_name = 'correlation_id') THEN
        ALTER TABLE radiology_critical_finding_alerts ADD COLUMN correlation_id VARCHAR(100);
    END IF;
END $$;

-- 5. Master Radiology Critical Findings Dictionary
CREATE TABLE IF NOT EXISTS master_radiology_critical_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    finding_code VARCHAR(50) UNIQUE NOT NULL,
    finding_name VARCHAR(150) NOT NULL,
    body_part VARCHAR(50) NOT NULL,
    modality VARCHAR(10) NOT NULL,
    clinical_threat TEXT NOT NULL,
    urgency_level VARCHAR(30) NOT NULL DEFAULT 'STAT_IMMEDIATE',
    version INT DEFAULT 1,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    approved_by VARCHAR(100) DEFAULT 'Komite Medis & KPRS RS 2026',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Seed Master Critical Findings (JCI IPSG 2 / WHO Patient Safety)
INSERT INTO master_radiology_critical_findings
(finding_code, finding_name, body_part, modality, clinical_threat, urgency_level)
VALUES
('RAD-CRIT-ICH', 'Perdarahan Intrakranial Akut (ICH/SAH/EDH/SDH)', 'BRAIN', 'CT', 'Herniasi Serebral / Henti Nafas Sentral Letal', 'STAT_IMMEDIATE'),
('RAD-CRIT-PNEUMO-TENSION', 'Tension Pneumothorax dengan Deviasi Mediastinum', 'CHEST', 'DX', 'Kolaps Kardiovaskular / Syok Obstruktif Dekompensasi', 'STAT_IMMEDIATE'),
('RAD-CRIT-AORTIC-DISSECT', 'Diseksi Aorta Torakalis Akut', 'CHEST', 'CT', 'Ruptur Aorta Masif / Tamponade Jantung Letal', 'STAT_IMMEDIATE'),
('RAD-CRIT-MASSIVE-PE', 'Emboli Paru Masif (Massive Pulmonary Embolism)', 'CHEST', 'CT', 'Gagal Jantung Kanan Akut / Syok Kardiogenik', 'STAT_IMMEDIATE'),
('RAD-CRIT-BOWEL-PERF', 'Pneumoperitoneum / Perforasi Organ Berongga', 'ABDOMEN', 'DX', 'Peritonitis Akut / Syok Septik Berat', 'STAT_IMMEDIATE'),
('RAD-CRIT-CORD-COMPRESS', 'Kompresi Medulla Spinalis Akut', 'SPINE', 'MR', 'Paraplegia / Kerusakan Neurologis Permanen', 'STAT_IMMEDIATE')
ON CONFLICT (finding_code) DO NOTHING;

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_rad_orders_cpoe ON radiology_orders(cpoe_order_id, cpoe_item_id);
CREATE INDEX IF NOT EXISTS idx_rad_studies_cpoe ON radiology_studies(cpoe_order_id, cpoe_item_id);
CREATE INDEX IF NOT EXISTS idx_rad_reports_cpoe ON radiology_reports(cpoe_order_id, cpoe_item_id);
CREATE INDEX IF NOT EXISTS idx_rad_critical_finding_code ON master_radiology_critical_findings(finding_code);
