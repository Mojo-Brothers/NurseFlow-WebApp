-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 059: Clinical Results & Diagnostic Interpretation Closed-Loop
-- Sprint 5A / Step 6: Diagnostic Result Distribution, Critical Panic Alerts (JCI IPSG 2),
-- Physician Interpretation, Delta Checks, and Secondary CPOE Action Linkage.
-- Standards: JCI IPSG 2 / PMKP, ISO 15189, LOINC, PostgreSQL 16 ACID Transactions.
-- ==============================================================================

-- 1. Table: diagnostic_result_notifications (Result Distribution & Critical Alerts)
CREATE TABLE IF NOT EXISTS diagnostic_result_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    source_domain VARCHAR(30) NOT NULL CHECK (source_domain IN ('LABORATORY', 'RADIOLOGY', 'POINT_OF_CARE', 'CARDIOLOGY_ECG')),
    source_order_id UUID REFERENCES clinical_orders(id),
    source_item_id UUID REFERENCES cpoe_order_items(id),
    source_result_id UUID,
    test_or_study_code VARCHAR(50) NOT NULL,
    test_or_study_name VARCHAR(150) NOT NULL,
    result_value TEXT NOT NULL,
    numeric_value NUMERIC(10,2),
    reference_range VARCHAR(100),
    abnormality_flag VARCHAR(30) NOT NULL DEFAULT 'NORMAL' CHECK (abnormality_flag IN ('NORMAL', 'ABNORMAL', 'PATHOLOGICAL', 'CRITICAL_PANIC')),
    notification_priority VARCHAR(30) NOT NULL DEFAULT 'ROUTINE' CHECK (notification_priority IN ('ROUTINE', 'PRIORITY', 'URGENT_STAT', 'EMERGENCY_PANIC')),
    notified_to_id VARCHAR(50),
    notified_to_name VARCHAR(100),
    notified_to_role VARCHAR(50),
    notification_method VARCHAR(30) NOT NULL DEFAULT 'IN_CHART_INBOX' CHECK (notification_method IN ('IN_CHART_INBOX', 'HOSPITAL_PAGE', 'DIRECT_CALL', 'CRITICAL_POPUP_ALERT')),
    notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by_id VARCHAR(50),
    acknowledged_by_name VARCHAR(100),
    read_back_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledgment_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ACKNOWLEDGMENT' CHECK (status IN ('PENDING_ACKNOWLEDGMENT', 'ACKNOWLEDGED', 'INTERPRETED', 'ACTION_TAKEN')),
    correlation_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diag_notif_encounter ON diagnostic_result_notifications(encounter_id, notified_at DESC);
CREATE INDEX IF NOT EXISTS idx_diag_notif_patient ON diagnostic_result_notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_diag_notif_critical ON diagnostic_result_notifications(abnormality_flag) WHERE abnormality_flag = 'CRITICAL_PANIC';

-- 2. Table: physician_diagnostic_interpretations (Physician Clinical Synthesis)
CREATE TABLE IF NOT EXISTS physician_diagnostic_interpretations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES diagnostic_result_notifications(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    interpreted_by_id VARCHAR(50) NOT NULL,
    interpreted_by_name VARCHAR(100) NOT NULL,
    interpreted_by_role VARCHAR(50) NOT NULL,
    clinical_impression TEXT NOT NULL,
    diagnostic_correlation TEXT NOT NULL,
    impact_on_care_plan VARCHAR(50) NOT NULL CHECK (impact_on_care_plan IN ('CHANGE_IN_TREATMENT', 'CONTINUE_CURRENT_THERAPY', 'URGENT_INTERVENTION_REQUIRED', 'DIAGNOSTIC_CONFIRMATION', 'SPECIALIST_CONSULTATION_REQUIRED')),
    delta_check_analysis JSONB,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    interpreted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diag_interp_encounter ON physician_diagnostic_interpretations(encounter_id, interpreted_at DESC);
CREATE INDEX IF NOT EXISTS idx_diag_interp_notif ON physician_diagnostic_interpretations(notification_id);

-- 3. Table: diagnostic_secondary_actions (Downstream Closed-Loop CPOE Orders)
CREATE TABLE IF NOT EXISTS diagnostic_secondary_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interpretation_id UUID NOT NULL REFERENCES physician_diagnostic_interpretations(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('CPOE_MEDICATION_ORDER', 'CPOE_REPEAT_DIAGNOSTIC', 'CPOE_PROCEDURE_HEMODIALYSIS', 'CPOE_CONSULTATION_ORDER', 'CLINICAL_MONITORING_FREQUENCY_INCREASE')),
    action_summary TEXT NOT NULL,
    cpoe_order_id UUID REFERENCES clinical_orders(id),
    action_by_id VARCHAR(50) NOT NULL,
    action_by_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EXECUTED' CHECK (status IN ('EXECUTED', 'CANCELLED')),
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diag_actions_interp ON diagnostic_secondary_actions(interpretation_id);

-- 4. Table: longitudinal_delta_checks (Temporal Velocity & Baseline Comparative Analysis)
CREATE TABLE IF NOT EXISTS longitudinal_delta_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    parameter_code VARCHAR(50) NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    current_value NUMERIC(10,2) NOT NULL,
    previous_value NUMERIC(10,2) NOT NULL,
    absolute_delta NUMERIC(10,2) NOT NULL,
    percentage_change NUMERIC(7,2) NOT NULL,
    time_elapsed_hours NUMERIC(6,2) NOT NULL,
    delta_alert_level VARCHAR(30) NOT NULL DEFAULT 'NORMAL' CHECK (delta_alert_level IN ('NORMAL', 'SIGNIFICANT_RISE', 'SIGNIFICANT_DROP', 'VELOCITY_ALERT')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delta_checks_patient ON longitudinal_delta_checks(patient_id, parameter_code, created_at DESC);
