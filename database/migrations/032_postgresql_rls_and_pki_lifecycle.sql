-- ============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 032
-- PostgreSQL Row-Level Security (RLS), PKI Key Lifecycle & Break-Glass Ledger
-- Standards: NIST SP 800-207 (Zero Trust), ISO 27001, JCI MOI Patient Privacy
-- ============================================================================

-- ─── 1. PRACTITIONER KEY LIFECYCLE & PKI MANAGEMENT TABLE ───
CREATE TABLE IF NOT EXISTS practitioner_key_lifecycle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    practitioner_id VARCHAR(50) NOT NULL,
    practitioner_name VARCHAR(255) NOT NULL,
    public_key_pem TEXT NOT NULL,
    key_algorithm VARCHAR(50) NOT NULL DEFAULT 'ECDSA_P256',
    key_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (key_status IN ('ACTIVE', 'ROTATED_VERIFY_ONLY', 'REVOKED')),
    revocation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rotated_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pki_practitioner ON practitioner_key_lifecycle(tenant_id, practitioner_id);
CREATE INDEX IF NOT EXISTS idx_pki_status ON practitioner_key_lifecycle(tenant_id, key_status);

-- ─── 2. BREAK-GLASS RATE LIMITING & SUPERVISOR AUDIT LEDGER ───
CREATE TABLE IF NOT EXISTS break_glass_audit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    practitioner_id VARCHAR(50) NOT NULL,
    practitioner_name VARCHAR(255) NOT NULL,
    practitioner_role VARCHAR(50) NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    reason_text TEXT NOT NULL CHECK (LENGTH(TRIM(reason_text)) >= 10),
    is_rate_limit_exceeded BOOLEAN DEFAULT FALSE,
    supervisor_alert_dispatched BOOLEAN DEFAULT FALSE,
    client_ip VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_break_glass_practitioner_hourly ON break_glass_audit_ledger(tenant_id, practitioner_id, created_at);

-- ─── 3. ROW-LEVEL SECURITY (RLS) POLICIES ON MASTER PATIENTS & ENCOUNTERS ───
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nurseflow_app_user') THEN
    CREATE ROLE nurseflow_app_user WITH NOSUPERUSER NOBYPASSRLS;
  END IF;
  GRANT USAGE ON SCHEMA public TO nurseflow_app_user;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO nurseflow_app_user;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO nurseflow_app_user;
END $$;

ALTER TABLE master_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_patients FORCE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_orders FORCE ROW LEVEL SECURITY;

-- Allow unrestricted bypass only for superuser/migration admin or explicit bypass
DROP POLICY IF EXISTS tenant_isolation_patients ON master_patients;
CREATE POLICY tenant_isolation_patients ON master_patients
    FOR ALL
    USING (
        current_setting('app.current_tenant_id', true) IS NULL 
        OR current_setting('app.current_tenant_id', true) = '' 
        OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
    );

DROP POLICY IF EXISTS tenant_isolation_encounters ON encounters;
CREATE POLICY tenant_isolation_encounters ON encounters
    FOR ALL
    USING (
        current_setting('app.current_tenant_id', true) IS NULL 
        OR current_setting('app.current_tenant_id', true) = '' 
        OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
    );

DROP POLICY IF EXISTS tenant_isolation_orders ON clinical_orders;
CREATE POLICY tenant_isolation_orders ON clinical_orders
    FOR ALL
    USING (
        current_setting('app.current_tenant_id', true) IS NULL 
        OR current_setting('app.current_tenant_id', true) = '' 
        OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
    );
