-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 009: Tenant & Identity Foundation
-- Standar: ISO/IEC 27001 Multi-Tenancy Isolation & Healthcare Data Governance
-- Features: Canonical Tenant Organizations, Subscriptions, Tenant-ID Propagation,
--           Zero-Permanent-Default Hardening & Physical PostgreSQL Row-Level Security
-- ==============================================================================

-- ─── 1. CANONICAL TENANT ORGANIZATIONS ───
CREATE TABLE IF NOT EXISTS tenant_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(50) UNIQUE NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    hospital_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL_HOSPITAL',
    kemenkes_faskes_code VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIAL', 'SUSPENDED', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_faskes_code ON tenant_organizations(kemenkes_faskes_code) WHERE kemenkes_faskes_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_status ON tenant_organizations(status);

-- ─── 2. CANONICAL TENANT SUBSCRIPTIONS & LICENSING ───
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    plan_code VARCHAR(50) NOT NULL DEFAULT 'PROFESSIONAL_HOSPITAL',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE_TRIAL' CHECK (status IN ('ACTIVE_TRIAL', 'ACTIVE_PAID', 'SUSPENDED', 'EXPIRED')),
    max_beds INT NOT NULL DEFAULT 150 CHECK (max_beds >= 0),
    max_users INT NOT NULL DEFAULT 100 CHECK (max_users >= 0),
    features_enabled JSONB NOT NULL DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON tenant_subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry ON tenant_subscriptions(expires_at);

-- ─── 3. SEED DEFAULT ROOT TENANT (FOR BACKWARD COMPATIBILITY & ZERO ORPHAN ROWS) ───
INSERT INTO tenant_organizations (id, tenant_code, organization_name, hospital_type, status)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'TENANT-HOSPITAL-01', 'NurseFlow General Hospital Central', 'GENERAL_HOSPITAL', 'ACTIVE')
ON CONFLICT (tenant_code) DO NOTHING;

INSERT INTO tenant_subscriptions (tenant_id, plan_code, status, max_beds, max_users, features_enabled)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'ENTERPRISE_NETWORK', 'ACTIVE_PAID', 9999, 9999, '["ALL_MODULES"]')
ON CONFLICT DO NOTHING;

-- ─── 4. PROPAGATE TENANT_ID & BACKFILL (SAFE TEMPORARY DEFAULT → NOT NULL → DROP DEFAULT) ───

-- Helper Macro Procedure for Zero-Permanent-Default Tenant Hardening
DO $$
DECLARE
    tbl TEXT;
    tenant_tables TEXT[] := ARRAY[
        'master_patients',
        'enterprise_users',
        'episodes_of_care',
        'encounters',
        'patient_registrations',
        'queue_tickets',
        'bpjs_sep_records',
        'triage_assessments',
        'triage_sla_timers',
        'resuscitation_events',
        'soap_notes',
        'cppt_notes',
        'patient_allergies',
        'clinical_observations',
        'cdss_alerts',
        'clinical_orders',
        'medication_orders',
        'laboratory_orders',
        'radiology_orders',
        'billing_ledgers',
        'hospital_invoices',
        'inacbg_claims'
    ];
BEGIN
    FOREACH tbl IN ARRAY tenant_tables LOOP
        -- Step 4.1: Add column nullable with FK
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenant_organizations(id);', tbl);
        -- Step 4.2: Backfill existing orphan rows to root tenant
        EXECUTE format('UPDATE %I SET tenant_id = ''00000000-0000-0000-0000-000000000001''::uuid WHERE tenant_id IS NULL;', tbl);
        -- Step 4.3: Enforce NOT NULL (Hard isolation)
        EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL;', tbl);
        -- Step 4.4: Ensure NO permanent DEFAULT remains (prevents silent default insertion)
        EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id DROP DEFAULT;', tbl);
    END LOOP;
END $$;

-- Universal Audit Logs (Nullable for system events, populated for tenant events)
ALTER TABLE universal_audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenant_organizations(id);
UPDATE universal_audit_logs SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE universal_audit_logs ALTER COLUMN tenant_id DROP DEFAULT;

-- ─── 5. TENANT-SCOPED CONSTRAINTS ───
-- Master Patients: Scoped MRN uniqueness per tenant
ALTER TABLE master_patients DROP CONSTRAINT IF EXISTS master_patients_mrn_key;
ALTER TABLE master_patients DROP CONSTRAINT IF EXISTS uq_patients_tenant_mrn;
ALTER TABLE master_patients ADD CONSTRAINT uq_patients_tenant_mrn UNIQUE (tenant_id, mrn);

-- Enterprise Users: Scoped Username & EmployeeId per tenant
ALTER TABLE enterprise_users ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE enterprise_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE enterprise_users DROP CONSTRAINT IF EXISTS enterprise_users_username_key;
ALTER TABLE enterprise_users DROP CONSTRAINT IF EXISTS enterprise_users_employee_id_key;
ALTER TABLE enterprise_users DROP CONSTRAINT IF EXISTS uq_users_tenant_username;
ALTER TABLE enterprise_users DROP CONSTRAINT IF EXISTS uq_users_tenant_employee_id;
ALTER TABLE enterprise_users ADD CONSTRAINT uq_users_tenant_username UNIQUE (tenant_id, username);
ALTER TABLE enterprise_users ADD CONSTRAINT uq_users_tenant_employee_id UNIQUE (tenant_id, employee_id);

-- ─── 6. TENANT-AWARE COMPOSITE INDEXES ───
CREATE INDEX IF NOT EXISTS idx_patients_tenant_created ON master_patients(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_episodes_tenant_status ON episodes_of_care(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_encounters_tenant_status ON encounters(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON clinical_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_billing_tenant_status ON billing_ledgers(tenant_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_created ON universal_audit_logs(tenant_id, created_at);

-- ─── 7. POSTGRESQL ROW-LEVEL SECURITY (RLS) SESSION CONTEXT & POLICIES ───
CREATE OR REPLACE FUNCTION current_app_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Apply Physical RLS Policies to Tenant-Owned Tables
DO $$
DECLARE
    tbl TEXT;
    tenant_tables TEXT[] := ARRAY[
        'master_patients',
        'enterprise_users',
        'episodes_of_care',
        'encounters',
        'patient_registrations',
        'queue_tickets',
        'bpjs_sep_records',
        'triage_assessments',
        'triage_sla_timers',
        'resuscitation_events',
        'soap_notes',
        'cppt_notes',
        'patient_allergies',
        'clinical_observations',
        'cdss_alerts',
        'clinical_orders',
        'medication_orders',
        'laboratory_orders',
        'radiology_orders',
        'billing_ledgers',
        'hospital_invoices',
        'inacbg_claims'
    ];
BEGIN
    FOREACH tbl IN ARRAY tenant_tables LOOP
        -- Enable RLS physically on table
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        -- Drop existing policy if present
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        -- Create strict fail-closed tenant policy (Only matching tenant_id permitted; NULL returns FALSE)
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (tenant_id = current_app_tenant_id()) WITH CHECK (tenant_id = current_app_tenant_id());', tbl);
    END LOOP;
END $$;

-- Universal Audit Logs RLS Policy (Permits tenant records and system background events)
ALTER TABLE universal_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_audit_isolation_policy ON universal_audit_logs;
CREATE POLICY tenant_audit_isolation_policy ON universal_audit_logs
FOR ALL
USING (tenant_id = current_app_tenant_id() OR tenant_id IS NULL OR current_app_tenant_id() IS NULL)
WITH CHECK (tenant_id = current_app_tenant_id() OR current_app_tenant_id() IS NULL);
