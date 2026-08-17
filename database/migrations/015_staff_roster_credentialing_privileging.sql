-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 015: Staff Scheduling, Credentialing & Clinical Privileging
-- Standards: JCI GLD & KARS KPS (Kualifikasi & Pendidikan Staf), KKI & Permenkes No. 755/2011 (Komite Medik & SPK/RKK)
-- Features: Clinician Master, STR/SIP Effective Dating, Clinical Privileging (SPK/RKK), Shift & On-Call Roster, Authorization Logging
-- ==============================================================================

-- ─── 1. CLINICAL STAFF PROFILES (CLINICIAN MASTER) ───
CREATE TABLE IF NOT EXISTS clinical_staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES enterprise_users(id) ON DELETE RESTRICT,
    staff_number VARCHAR(30) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    title_prefix VARCHAR(30),
    title_suffix VARCHAR(50),
    staff_category VARCHAR(50) NOT NULL 
        CHECK (staff_category IN ('SPECIALIST_DOCTOR', 'GENERAL_PRACTITIONER', 'REGISTERED_NURSE', 'CLINICAL_PHARMACIST', 'LAB_TECHNICIAN', 'RADIOGRAPHER', 'PHYSIOTHERAPIST', 'NUTRITIONIST')),
    primary_specialty VARCHAR(100) NOT NULL,
    sub_specialty VARCHAR(100),
    primary_department_id VARCHAR(50) NOT NULL,
    employment_status VARCHAR(30) NOT NULL DEFAULT 'PERMANENT' 
        CHECK (employment_status IN ('PERMANENT', 'CONTRACT', 'VISITING_CONSULTANT', 'HONORARY', 'INACTIVE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_staff_tenant_number UNIQUE (tenant_id, staff_number)
);

CREATE INDEX IF NOT EXISTS idx_staff_tenant ON clinical_staff_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_category ON clinical_staff_profiles(tenant_id, staff_category);
CREATE INDEX IF NOT EXISTS idx_staff_department ON clinical_staff_profiles(tenant_id, primary_department_id);

-- ─── 2. STAFF CREDENTIALS & LICENSES (STR / SIP / SPECIALTY CERTIFICATES) ───
CREATE TABLE IF NOT EXISTS staff_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES clinical_staff_profiles(id) ON DELETE RESTRICT,
    credential_type VARCHAR(50) NOT NULL 
        CHECK (credential_type IN ('STR', 'SIP', 'SPK', 'BLS_ACLS', 'ATLS', 'SPECIALTY_BOARD', 'SUB_SPECIALTY_FELLOWSHIP')),
    credential_number VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(150) NOT NULL,
    issued_at DATE NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE_VERIFIED' 
        CHECK (verification_status IN ('ACTIVE_VERIFIED', 'UNDER_REVIEW', 'EXPIRED', 'REVOKED', 'SUSPENDED')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(100),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_credential_validity_dates CHECK (valid_until >= valid_from),
    CONSTRAINT uq_staff_credential_type_number UNIQUE (tenant_id, staff_id, credential_type, credential_number)
);

CREATE INDEX IF NOT EXISTS idx_cred_tenant ON staff_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cred_staff ON staff_credentials(staff_id);
CREATE INDEX IF NOT EXISTS idx_cred_validity ON staff_credentials(tenant_id, staff_id, valid_from, valid_until);

-- ─── 3. CLINICAL PRIVILEGES (RINCIAN KEWENANGAN KLINIS / RKK & SPK) ───
CREATE TABLE IF NOT EXISTS clinical_privileges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES clinical_staff_profiles(id) ON DELETE RESTRICT,
    department_id VARCHAR(50) NOT NULL,
    procedure_code VARCHAR(50) NOT NULL,
    procedure_name VARCHAR(255) NOT NULL,
    privilege_level VARCHAR(30) NOT NULL DEFAULT 'INDEPENDENT' 
        CHECK (privilege_level IN ('INDEPENDENT', 'UNDER_SUPERVISION', 'EMERGENCY_ONLY', 'PROCTORSHIP')),
    effective_from DATE NOT NULL,
    effective_until DATE NOT NULL,
    privilege_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (privilege_status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPENDED')),
    approved_by_komite_medik_id VARCHAR(50) NOT NULL,
    approved_by_komite_medik_name VARCHAR(100) NOT NULL,
    spk_document_number VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_privilege_dates CHECK (effective_until >= effective_from),
    CONSTRAINT uq_staff_proc_privilege UNIQUE (tenant_id, staff_id, department_id, procedure_code)
);

CREATE INDEX IF NOT EXISTS idx_priv_tenant ON clinical_privileges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_priv_staff ON clinical_privileges(staff_id);
CREATE INDEX IF NOT EXISTS idx_priv_proc ON clinical_privileges(tenant_id, procedure_code, department_id);

-- ─── 4. STAFF ROSTERS (PERIODIC MASTER ROSTERS) ───
CREATE TABLE IF NOT EXISTS staff_rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    roster_code VARCHAR(30) NOT NULL,
    roster_name VARCHAR(100) NOT NULL,
    department_id VARCHAR(50) NOT NULL,
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INT NOT NULL CHECK (period_year >= 2026),
    roster_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' 
        CHECK (roster_status IN ('DRAFT', 'APPROVED', 'PUBLISHED', 'LOCKED')),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_roster_period UNIQUE (tenant_id, department_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_roster_tenant ON staff_rosters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roster_dept ON staff_rosters(tenant_id, department_id);

-- ─── 5. SHIFT ASSIGNMENTS (DUTY ROSTER JAGA HARIAN) ───
CREATE TABLE IF NOT EXISTS shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    roster_id UUID REFERENCES staff_rosters(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES clinical_staff_profiles(id) ON DELETE RESTRICT,
    shift_date DATE NOT NULL,
    shift_code VARCHAR(20) NOT NULL 
        CHECK (shift_code IN ('PAGI', 'SIANG', 'MALAM', 'MIDDLE', 'LONG_SHIFT', 'OFF')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    unit_id VARCHAR(50) NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    assignment_status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' 
        CHECK (assignment_status IN ('SCHEDULED', 'CHECKED_IN', 'CHECKED_OUT', 'ABSENT', 'SWAPPED', 'CANCELLED')),
    check_in_at TIMESTAMP WITH TIME ZONE,
    check_out_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIAL UNIQUE INDEX: Mencegah duplikasi shift aktif staf pada tanggal dan shift yang sama
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_date_shift 
ON shift_assignments(tenant_id, staff_id, shift_date, shift_code) 
WHERE assignment_status IN ('SCHEDULED', 'CHECKED_IN');

CREATE INDEX IF NOT EXISTS idx_shift_tenant ON shift_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_staff ON shift_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_shift_date ON shift_assignments(tenant_id, shift_date, unit_id);

-- ─── 6. ON-CALL SCHEDULES (DOKTER SPESIALIS ON-CALL) ───
CREATE TABLE IF NOT EXISTS on_call_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES clinical_staff_profiles(id) ON DELETE RESTRICT,
    on_call_date DATE NOT NULL,
    specialty_group VARCHAR(50) NOT NULL,
    response_time_sla_minutes INT NOT NULL DEFAULT 30 CHECK (response_time_sla_minutes > 0),
    is_active_coverage BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_staff_oncall_date UNIQUE (tenant_id, staff_id, on_call_date, specialty_group)
);

CREATE INDEX IF NOT EXISTS idx_oncall_tenant ON on_call_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oncall_date ON on_call_schedules(tenant_id, on_call_date, specialty_group);

-- ─── 7. CLINICAL AUTHORIZATION LOGS (AUDIT TRAIL OTORISASI KLINIS) ───
CREATE TABLE IF NOT EXISTS clinical_authorization_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    staff_id UUID NOT NULL REFERENCES clinical_staff_profiles(id) ON DELETE RESTRICT,
    procedure_code VARCHAR(50) NOT NULL,
    target_unit_id VARCHAR(50) NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_authorized BOOLEAN NOT NULL,
    authorization_decision VARCHAR(30) NOT NULL 
        CHECK (authorization_decision IN ('AUTHORIZED', 'DENIED_CREDENTIAL_EXPIRED', 'DENIED_CREDENTIAL_REVOKED', 'DENIED_NO_PRIVILEGE', 'DENIED_PRIVILEGE_EXPIRED', 'DENIED_WRONG_UNIT', 'DENIED_NOT_ON_DUTY', 'DENIED_STAFF_INACTIVE')),
    denial_reason TEXT,
    evaluation_metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_tenant ON clinical_authorization_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_staff ON clinical_authorization_logs(staff_id, evaluated_at);

-- ─── 8. DATABASE SAFETY TRIGGERS ───

-- A. Trigger: Mencegah pemberian privilege jika STR/SIP staf tidak aktif atau kedaluwarsa
CREATE OR REPLACE FUNCTION fn_validate_privilege_prerequisites() 
RETURNS TRIGGER AS $$
DECLARE
    v_active_cred_count INT;
BEGIN
    SELECT COUNT(*) INTO v_active_cred_count
    FROM staff_credentials
    WHERE staff_id = NEW.staff_id
      AND tenant_id = NEW.tenant_id
      AND credential_type IN ('STR', 'SIP')
      AND verification_status = 'ACTIVE_VERIFIED'
      AND NEW.effective_from BETWEEN valid_from AND valid_until
      AND revoked_at IS NULL;

    IF v_active_cred_count = 0 THEN
        RAISE EXCEPTION 'AUTHORIZATION_DENIED: Clinician does NOT have an active, verified STR/SIP covering the privilege effective date!';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_privilege_prerequisites ON clinical_privileges;
CREATE TRIGGER trg_validate_privilege_prerequisites
BEFORE INSERT OR UPDATE ON clinical_privileges
FOR EACH ROW EXECUTE FUNCTION fn_validate_privilege_prerequisites();

-- ─── 9. ROW LEVEL SECURITY (RLS) FOR WORKFORCE & PRIVILEGING ───
DO $$
DECLARE
    tbl TEXT;
    staff_tables TEXT[] := ARRAY[
        'clinical_staff_profiles',
        'staff_credentials',
        'clinical_privileges',
        'staff_rosters',
        'shift_assignments',
        'on_call_schedules',
        'clinical_authorization_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY staff_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (tenant_id = current_app_tenant_id()) WITH CHECK (tenant_id = current_app_tenant_id());', tbl);
    END LOOP;
END $$;
