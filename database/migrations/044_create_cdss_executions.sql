-- ============================================================================
-- Migration 044: CDSS Executions Ledger (Medicolegal Audit Snapshot)
-- Standards: JCI MCI, HIPAA Audit Trail, Deterministic Replay Engine
-- ============================================================================

CREATE TABLE IF NOT EXISTS cdss_executions (
    id VARCHAR(36) PRIMARY KEY,
    organization_id VARCHAR(36) NOT NULL,
    encounter_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    medication_id VARCHAR(36) NOT NULL,
    executed_rule_id VARCHAR(36) NOT NULL,
    executed_rule_version INT NOT NULL,
    evaluation_result VARCHAR(20) NOT NULL CHECK (
        evaluation_result IN ('PASSED', 'WARNING_OVERRIDDEN', 'HARD_STOPPED')
    ),
    override_justification TEXT,
    input_snapshot_json TEXT NOT NULL,
    output_snapshot_json TEXT NOT NULL,
    executed_by_practitioner_id VARCHAR(36) NOT NULL,
    executed_at BIGINT NOT NULL,
    FOREIGN KEY (executed_rule_id) REFERENCES clinical_rules(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_cdss_executions_lookup ON cdss_executions(encounter_id, executed_at);
CREATE INDEX IF NOT EXISTS idx_cdss_executions_patient ON cdss_executions(patient_id, executed_at);
