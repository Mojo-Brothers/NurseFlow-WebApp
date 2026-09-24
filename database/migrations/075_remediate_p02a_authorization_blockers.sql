-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 075: P0-2A Authorization Blockers Remediation
-- Standards: ISO 27001 Multi-Tenancy Isolation, JCI MOI / KARS & NIST SP 800-162 ABAC
-- Remediation Targets:
--   1. Fix clinical_authorization_logs.user_id FK (enterprise_users -> auth_users)
--   2. Break-The-Glass Dedicated Ledger Schema Expansion (break_glass_audit_ledger)
--   3. Normalized Practitioner Legacy Identifier Mapping Table (practitioner_legacy_mappings)
--   4. Canonical Clinician Test Fixtures & Live Licensure Baseline (Zero-Mock Security Proof)
-- ==============================================================================

-- ─── 1. FIX CLINICAL AUDIT USER FOREIGN KEY (BLOCKER A) ───
ALTER TABLE clinical_authorization_logs 
    DROP CONSTRAINT IF EXISTS clinical_authorization_logs_user_id_fkey;

ALTER TABLE clinical_authorization_logs 
    ADD CONSTRAINT clinical_authorization_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE SET NULL;

ALTER TABLE clinical_staff_profiles 
    DROP CONSTRAINT IF EXISTS clinical_staff_profiles_user_id_fkey;

ALTER TABLE clinical_staff_profiles 
    ADD CONSTRAINT clinical_staff_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE SET NULL;

-- ─── 2. EXPAND BREAK-THE-GLASS AUDIT LEDGER (BLOCKER C) ───
ALTER TABLE break_glass_audit_ledger ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE break_glass_audit_ledger ALTER COLUMN encounter_id DROP NOT NULL;
ALTER TABLE break_glass_audit_ledger ALTER COLUMN client_ip DROP NOT NULL;
ALTER TABLE break_glass_audit_ledger ALTER COLUMN practitioner_id DROP NOT NULL;
ALTER TABLE break_glass_audit_ledger ALTER COLUMN practitioner_name DROP NOT NULL;
ALTER TABLE break_glass_audit_ledger ALTER COLUMN practitioner_role DROP NOT NULL;

ALTER TABLE break_glass_audit_ledger DROP CONSTRAINT IF EXISTS break_glass_audit_ledger_patient_id_fkey;
ALTER TABLE break_glass_audit_ledger DROP CONSTRAINT IF EXISTS break_glass_audit_ledger_encounter_id_fkey;

ALTER TABLE break_glass_audit_ledger 
    ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL;
ALTER TABLE break_glass_audit_ledger 
    ADD COLUMN IF NOT EXISTS resource_type VARCHAR(100) NULL;
ALTER TABLE break_glass_audit_ledger 
    ADD COLUMN IF NOT EXISTS resource_id VARCHAR(100) NULL;
ALTER TABLE break_glass_audit_ledger 
    ADD COLUMN IF NOT EXISTS action_code VARCHAR(100) NULL;
ALTER TABLE break_glass_audit_ledger 
    ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100) NULL;
ALTER TABLE break_glass_audit_ledger 
    ADD COLUMN IF NOT EXISTS outcome VARCHAR(50) DEFAULT 'AUTHORIZED_BREAK_THE_GLASS';
ALTER TABLE break_glass_audit_ledger 
    ADD COLUMN IF NOT EXISTS reason TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_bgal_actor_time 
    ON break_glass_audit_ledger(tenant_id, actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bgal_resource 
    ON break_glass_audit_ledger(resource_type, resource_id);

-- ─── 3. CANONICAL CLINICAL STAFF & CREDENTIAL FIXTURES (BLOCKER B) ───
-- Ensure dr. Siti Wijaya has a linked clinical_staff_profile and active credentials
INSERT INTO clinical_staff_profiles (
    id, tenant_id, user_id, staff_number, full_name, title_prefix, title_suffix,
    staff_category, primary_specialty, primary_department_id, employment_status, is_active, created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001',
    'STF-SITI-01', 'dr. Siti Wijaya, Sp.PD-KGEH', 'dr.', 'Sp.PD-KGEH',
    'SPECIALIST_DOCTOR', 'Penyakit Dalam', 'POLI_PENYAKIT_DALAM', 'PERMANENT', true, NOW(), NOW()
) ON CONFLICT (id) DO UPDATE SET user_id = 'd0000000-0000-0000-0000-000000000001', is_active = true;

-- Seed Valid SIP and Valid STR for dr. Siti Wijaya
INSERT INTO staff_credentials (
    id, tenant_id, staff_id, credential_type, credential_number,
    issued_at, valid_from, valid_until, issuing_authority, verification_status, revoked_at, created_at, updated_at
) VALUES 
    ('e0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     'SIP', 'SIP/503/SITI/IDI/2026', '2024-01-01', '2024-01-01', '2030-12-31', 'Dinas Kesehatan Prov DKI', 'ACTIVE_VERIFIED', null, NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     'STR', 'STR/KKI/SITI/2026', '2024-01-01', '2024-01-01', '2030-12-31', 'Konsil Kedokteran Indonesia', 'ACTIVE_VERIFIED', null, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Clinical Privilege for dr. Siti Wijaya
INSERT INTO clinical_privileges (
    id, tenant_id, staff_id, department_id, procedure_code, procedure_name,
    privilege_level, effective_from, effective_until, privilege_status,
    approved_by_komite_medik_id, approved_by_komite_medik_name, spk_document_number, granted_at, created_at, updated_at
) VALUES (
    'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
    'POLI_PENYAKIT_DALAM', 'ICD9CM-47.0', 'Diagnostic Endoscopy',
    'INDEPENDENT', CURRENT_DATE - 30, CURRENT_DATE + 365, 'ACTIVE',
    'KM-01', 'dr. Ketua Komite Medik', 'SPK-SITI-2026', NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- ─── 4. NORMALIZED PRACTITIONER LEGACY IDENTIFIER MAPPING (BLOCKER D) ───
CREATE TABLE IF NOT EXISTS practitioner_legacy_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    legacy_identifier VARCHAR(100) NOT NULL,
    canonical_practitioner_id UUID NULL REFERENCES master_practitioners(id) ON DELETE CASCADE,
    canonical_staff_id UUID NULL REFERENCES clinical_staff_profiles(id) ON DELETE SET NULL,
    practitioner_id UUID NULL REFERENCES master_practitioners(id) ON DELETE CASCADE,
    staff_id UUID NULL REFERENCES master_staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_tenant_legacy_practitioner UNIQUE (tenant_id, legacy_identifier)
);

CREATE INDEX IF NOT EXISTS idx_prac_legacy_lookup 
    ON practitioner_legacy_mappings(tenant_id, legacy_identifier);

-- Seed canonical mappings for legacy encounter doctor identifiers
INSERT INTO practitioner_legacy_mappings (tenant_id, legacy_identifier, canonical_practitioner_id, canonical_staff_id, practitioner_id, staff_id)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'DOC-01', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000001', 'DOC-A-01', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000001', 'DOC-EMER-01', 'b0000000-0000-0000-0000-000000000002', null, 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
    ('10000000-0000-0000-0000-000000000001', 'DOC-B-01', 'b0000000-0000-0000-0000-000000000002', null, 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (tenant_id, legacy_identifier) DO UPDATE SET 
    canonical_practitioner_id = EXCLUDED.canonical_practitioner_id,
    canonical_staff_id = EXCLUDED.canonical_staff_id;

-- ─── 5. SECURITY INTEGRATION TEST FIXTURES (REAL SQL ROWS FOR ZERO-MOCK TESTS) ───
-- Clinician with EXPIRED SIP and EXPIRED STR
INSERT INTO clinical_staff_profiles (
    id, tenant_id, user_id, staff_number, full_name, staff_category, primary_specialty, primary_department_id, employment_status, is_active, created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null,
    'STF-EXPIRED-01', 'dr. Expired License', 'SPECIALIST_DOCTOR', 'Bedah', 'BEDAH', 'PERMANENT', true, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_credentials (
    id, tenant_id, staff_id, credential_type, credential_number, issued_at, valid_from, valid_until, issuing_authority, verification_status, revoked_at, created_at, updated_at
) VALUES 
    ('e0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
     'SIP', 'SIP-EXPIRED-2020', '2015-01-01', '2015-01-01', '2020-01-01', 'Dinkes', 'EXPIRED', null, NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
     'STR', 'STR-EXPIRED-2020', '2015-01-01', '2015-01-01', '2020-01-01', 'KKI', 'EXPIRED', null, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinician with REVOKED SIP and REVOKED STR
INSERT INTO clinical_staff_profiles (
    id, tenant_id, user_id, staff_number, full_name, staff_category, primary_specialty, primary_department_id, employment_status, is_active, created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', null,
    'STF-REVOKED-01', 'dr. Revoked License', 'SPECIALIST_DOCTOR', 'Bedah', 'BEDAH', 'PERMANENT', true, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_credentials (
    id, tenant_id, staff_id, credential_type, credential_number, issued_at, valid_from, valid_until, issuing_authority, verification_status, revoked_at, revocation_reason, created_at, updated_at
) VALUES 
    ('e0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
     'SIP', 'SIP-REVOKED-2025', '2024-01-01', '2024-01-01', '2030-12-31', 'Dinkes', 'REVOKED', NOW() - INTERVAL '10 days', 'Disciplinary revocation by MKDKI', NOW(), NOW()),
    ('e0000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003',
     'STR', 'STR-REVOKED-2025', '2024-01-01', '2024-01-01', '2030-12-31', 'KKI', 'REVOKED', NOW() - INTERVAL '10 days', 'Disciplinary revocation by MKDKI', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinician with INACTIVE Staff Status
INSERT INTO clinical_staff_profiles (
    id, tenant_id, user_id, staff_number, full_name, staff_category, primary_specialty, primary_department_id, employment_status, is_active, created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', null,
    'STF-INACTIVE-01', 'dr. Suspended Inactive', 'SPECIALIST_DOCTOR', 'Bedah', 'BEDAH', 'INACTIVE', false, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_credentials (
    id, tenant_id, staff_id, credential_type, credential_number, issued_at, valid_from, valid_until, issuing_authority, verification_status, revoked_at, created_at, updated_at
) VALUES 
    ('e0000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004',
     'SIP', 'SIP-INACTIVE-VALID', '2024-01-01', '2024-01-01', '2030-12-31', 'Dinkes', 'ACTIVE_VERIFIED', null, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinician with EXPIRED Privilege
INSERT INTO clinical_staff_profiles (
    id, tenant_id, user_id, staff_number, full_name, staff_category, primary_specialty, primary_department_id, employment_status, is_active, created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', null,
    'STF-EXPPRIV-01', 'dr. Expired Privilege', 'SPECIALIST_DOCTOR', 'Anak', 'POLI_ANAK', 'PERMANENT', true, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_credentials (
    id, tenant_id, staff_id, credential_type, credential_number, issued_at, valid_from, valid_until, issuing_authority, verification_status, revoked_at, created_at, updated_at
) VALUES 
    ('e0000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
     'SIP', 'SIP-EXPPRIV-VALID', '2024-01-01', '2024-01-01', '2030-12-31', 'Dinkes', 'ACTIVE_VERIFIED', null, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinical_privileges (
    id, tenant_id, staff_id, department_id, procedure_code, procedure_name,
    privilege_level, effective_from, effective_until, privilege_status,
    approved_by_komite_medik_id, approved_by_komite_medik_name, spk_document_number, granted_at, created_at, updated_at
) VALUES (
    'f0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000005',
    'POLI_ANAK', 'PROC-PALS-01', 'Pediatric Resuscitation',
    'INDEPENDENT', CURRENT_DATE - 730, CURRENT_DATE - 30, 'EXPIRED',
    'KM-01', 'dr. Ketua Komite Medik', 'SPK-EXP-2024', NOW(), NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Clinician belonging to TENANT B (Wrong Tenant)
INSERT INTO tenant_organizations (id, tenant_code, organization_name, hospital_type, status)
VALUES ('20000000-0000-0000-0000-000000000002', 'TENANT-GRP-02', 'RS Partner Secondary Tenant B', 'GENERAL_HOSPITAL', 'ACTIVE')
ON CONFLICT (tenant_code) DO NOTHING;

INSERT INTO clinical_staff_profiles (
    id, tenant_id, user_id, staff_number, full_name, staff_category, primary_specialty, primary_department_id, employment_status, is_active, created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', null,
    'STF-TENANTB-01', 'dr. Tenant B Clinician', 'SPECIALIST_DOCTOR', 'Bedah', 'BEDAH', 'PERMANENT', true, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_credentials (
    id, tenant_id, staff_id, credential_type, credential_number, issued_at, valid_from, valid_until, issuing_authority, verification_status, revoked_at, created_at, updated_at
) VALUES 
    ('e0000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000006',
     'SIP', 'SIP-TENANTB-VALID', '2024-01-01', '2024-01-01', '2030-12-31', 'Dinkes', 'ACTIVE_VERIFIED', null, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
