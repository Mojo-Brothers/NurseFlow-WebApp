-- ============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 031
-- Human Factors Engineering (HFE) Live Observational Session Ledger
-- Standards: ISO 9241-11 Usability, NASA-TLX, System Usability Scale (SUS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hfe_participant_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    participant_id VARCHAR(50) NOT NULL,
    participant_role VARCHAR(50) NOT NULL,
    scenario_code VARCHAR(50) NOT NULL,
    task_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    first_action_time TIMESTAMP WITH TIME ZONE,
    task_completed_time TIMESTAMP WITH TIME ZONE,
    total_duration_sec NUMERIC(8, 2),
    clicks_count INT DEFAULT 0,
    keystrokes_count INT DEFAULT 0,
    backtracks_count INT DEFAULT 0,
    wrong_patient_attempts INT DEFAULT 0,
    wrong_medication_attempts INT DEFAULT 0,
    safety_warnings_triggered INT DEFAULT 0,
    safety_warnings_acknowledged INT DEFAULT 0,
    overrides_attempted INT DEFAULT 0,
    override_reasons TEXT,
    help_requests_count INT DEFAULT 0,
    task_outcome VARCHAR(50) NOT NULL CHECK (task_outcome IN ('COMPLETED_AUTONOMOUSLY', 'COMPLETED_WITH_INTERCEPTION', 'ASSISTED', 'FAILED')),
    nasa_tlx_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    sus_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    observer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hfe_sessions_tenant ON hfe_participant_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hfe_sessions_role ON hfe_participant_sessions(tenant_id, participant_role);
CREATE INDEX IF NOT EXISTS idx_hfe_sessions_scenario ON hfe_participant_sessions(tenant_id, scenario_code);
