-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 008: Universal Immutable Audit Trail & RBAC
-- Standar: JCI MOI (Information Governance), KARS 2024 & ISO 27001
-- ==============================================================================

CREATE TABLE IF NOT EXISTS enterprise_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(30) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'ROLE_SUPER_ADMIN',
        'ROLE_DOCTOR_DPJP',
        'ROLE_DOCTOR_EMERGENCY',
        'ROLE_NURSE',
        'ROLE_PHARMACIST',
        'ROLE_LAB_ANALYST',
        'ROLE_RADIOGRAPHER',
        'ROLE_CASHIER',
        'ROLE_REGISTRATION_CLERK',
        'ROLE_MEDICAL_RECORD_OFFICER',
        'ROLE_IT_ADMIN'
    )),
    department_id VARCHAR(50) NOT NULL,
    sip_number VARCHAR(100),
    str_number VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS universal_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    client_ip VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'OVERRIDE', 'SIGN', 'LOGIN', 'LOGOUT', 'SECURITY_BREACH_ATTEMPT')),
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    patient_id UUID REFERENCES master_patients(id),
    before_state JSONB,
    after_state JSONB,
    reason_for_action TEXT,
    signature_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make universal_audit_logs strictly APPEND-ONLY (Immutable Trigger)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'JCI AUDIT INTEGRITY VIOLATION: Universal audit trail logs are strictly immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON universal_audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
BEFORE UPDATE OR DELETE ON universal_audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

CREATE INDEX IF NOT EXISTS idx_audit_patient ON universal_audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON universal_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON universal_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON universal_audit_logs(created_at);
