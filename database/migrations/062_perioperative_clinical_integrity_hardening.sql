-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 062: Perioperative Clinical Integrity Hardening
-- Sprint 5A / Step 8 Hardening: Surgical Cancellation/Abort Pathway, Intraoperative Emergency
-- & Resuscitation Bridge, Surgical Specimen Chain of Custody & Enhanced PACU Multi-Criteria Clearance.
-- Standards: JCI IPSG 4, ASA Guidelines, College of American Pathologists (CAP), PostgreSQL 16 ACID.
-- ==============================================================================

-- 1. Table: surgical_abort_ledgers (Surgical Cancellation & Intraoperative Abort Tracking)
CREATE TABLE IF NOT EXISTS surgical_abort_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    abort_number VARCHAR(50) UNIQUE NOT NULL,
    abort_stage VARCHAR(50) NOT NULL CHECK (abort_stage IN ('PRE_INDUCTION', 'POST_SIGN_IN', 'POST_TIME_OUT', 'INTRAOPERATIVE_POST_INCISION')),
    abort_reason_category VARCHAR(50) NOT NULL CHECK (abort_reason_category IN (
        'PATIENT_CLINICAL_INSTABILITY', 'UNFIT_FOR_ANESTHESIA', 'EQUIPMENT_FAILURE',
        'SEVERE_ANAPHYLAXIS', 'CARDIAC_ARREST', 'PATIENT_REFUSAL', 'MASSIVE_BLEEDING_CONVERSION'
    )),
    clinical_details TEXT NOT NULL,
    authorized_by_id VARCHAR(50) NOT NULL,
    authorized_by_name VARCHAR(100) NOT NULL,
    implants_disposition VARCHAR(50) NOT NULL DEFAULT 'NONE_USED' CHECK (implants_disposition IN ('NONE_USED', 'CONTAMINATED_WASTED', 'REMOVED_RETAINED')),
    medications_given JSONB NOT NULL DEFAULT '[]'::jsonb,
    billing_disposition VARCHAR(50) NOT NULL DEFAULT 'NO_CHARGE' CHECK (billing_disposition IN ('NO_CHARGE', 'PREOP_MEDICATIONS_ONLY', 'PARTIAL_OR_FEE', 'FULL_SURGERY_CHARGE')),
    post_abort_transfer_destination VARCHAR(50) NOT NULL DEFAULT 'INPATIENT_WARD' CHECK (post_abort_transfer_destination IN ('ICU', 'HDU', 'INPATIENT_WARD', 'EMERGENCY_OBSERVATION', 'MORTUARY')),
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    aborted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abort_case ON surgical_abort_ledgers(surgical_case_id);
CREATE INDEX IF NOT EXISTS idx_abort_encounter ON surgical_abort_ledgers(encounter_id);

-- 2. Table: surgical_specimen_ledgers (Surgical Pathology & Chain of Custody)
CREATE TABLE IF NOT EXISTS surgical_specimen_ledgers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    specimen_tracking_number VARCHAR(50) UNIQUE NOT NULL,
    specimen_container_barcode VARCHAR(100) UNIQUE NOT NULL,
    specimen_type VARCHAR(100) NOT NULL,
    anatomical_site VARCHAR(150) NOT NULL,
    fixative_medium VARCHAR(50) NOT NULL CHECK (fixative_medium IN ('FORMALIN_10_PERCENT', 'FRESH_FROZEN_SECTION', 'STERILE_SALINE', 'GLUTARALDEHYDE')),
    urgency_level VARCHAR(50) NOT NULL CHECK (urgency_level IN ('ROUTINE_HISTOPATHOLOGY', 'FROZEN_SECTION_CITO', 'CYTOPATHOLOGY')),
    provisional_clinical_diagnosis VARCHAR(255) NOT NULL,
    scrub_nurse_id VARCHAR(50) NOT NULL,
    scrub_nurse_name VARCHAR(100) NOT NULL,
    surgeon_id VARCHAR(50) NOT NULL,
    surgeon_name VARCHAR(100) NOT NULL,
    custody_status VARCHAR(50) NOT NULL DEFAULT 'COLLECTED_IN_THEATRE' CHECK (custody_status IN ('COLLECTED_IN_THEATRE', 'DISPATCHED_TO_PATHOLOGY', 'RECEIVED_BY_LAB', 'ANALYSIS_IN_PROGRESS', 'REPORT_FINALIZED')),
    dispatched_at TIMESTAMP WITH TIME ZONE,
    lab_order_id UUID,
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specimen_case ON surgical_specimen_ledgers(surgical_case_id);
CREATE INDEX IF NOT EXISTS idx_specimen_barcode ON surgical_specimen_ledgers(specimen_container_barcode);

-- 3. Table: intraoperative_emergency_events (Intraoperative Critical Deterioration & Resuscitation Bridge)
CREATE TABLE IF NOT EXISTS intraoperative_emergency_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    surgical_case_id UUID NOT NULL REFERENCES surgical_cases(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    event_number VARCHAR(50) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'CODE_BLUE_CARDIAC_ARREST', 'MALIGNANT_HYPERTHERMIA', 'MASSIVE_HEMORRHAGE_MTP',
        'ANAPHYLACTIC_SHOCK', 'CANNOT_INTUBATE_CANNOT_OXYGENATE', 'TENSION_PNEUMOTHORAX'
    )),
    resuscitation_session_id VARCHAR(100),
    lead_resuscitator_id VARCHAR(50) NOT NULL,
    lead_resuscitator_name VARCHAR(100) NOT NULL,
    clinical_interventions TEXT NOT NULL,
    time_of_event TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    time_of_stabilization TIMESTAMP WITH TIME ZONE,
    outcome VARCHAR(50) NOT NULL CHECK (outcome IN ('ROSC_STABILIZED', 'TRANSFERRED_TO_ICU_CRITICAL', 'FATALITY_ON_TABLE', 'CONTINUED_WITH_MODIFIED_SURGERY')),
    digital_signature_hash VARCHAR(128) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intraop_emerg_case ON intraoperative_emergency_events(surgical_case_id);
CREATE INDEX IF NOT EXISTS idx_intraop_emerg_encounter ON intraoperative_emergency_events(encounter_id);

-- 4. PACU Multi-Criteria Recovery Columns
ALTER TABLE pacu_recovery_records
    ADD COLUMN IF NOT EXISTS airway_stability_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS hemodynamic_stability_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS pain_vas_controlled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS ponv_controlled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS anesthesiologist_discharge_clearance BOOLEAN NOT NULL DEFAULT TRUE;
