-- ============================================================================
-- Migration 049: Immutable CDSS Execution Snapshots & WORM Tamper-Proofing
-- Standards: JCI MCI, Cryptographic SHA-256 Audit Trail (WORM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cdss_immutable_execution_ledgers (
    id VARCHAR(36) PRIMARY KEY,
    execution_id VARCHAR(36) NOT NULL UNIQUE,
    organization_id VARCHAR(36) NOT NULL,
    encounter_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    medication_id VARCHAR(36) NOT NULL,
    engine_semantic_version VARCHAR(20) NOT NULL DEFAULT '2.1.0',
    terminology_release_version VARCHAR(50) NOT NULL DEFAULT 'SNOMED_2026-03_RXNORM_2026',
    applied_rules_snapshot_json TEXT NOT NULL,
    patient_clinical_snapshot_json TEXT NOT NULL,
    evaluated_alerts_json TEXT NOT NULL,
    decision_outcome VARCHAR(30) NOT NULL CHECK (
        decision_outcome IN ('PASSED', 'WARNING_OVERRIDDEN', 'HARD_STOP_OVERRIDDEN', 'HARD_STOPPED_BLOCKED')
    ),
    override_reason TEXT,
    override_authorized_by VARCHAR(36),
    override_digital_signature_hash VARCHAR(64),
    cryptographic_hash VARCHAR(64) NOT NULL, -- SHA-256 (prevHash + payload)
    previous_hash VARCHAR(64),
    executed_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_immutable_exec_lookup ON cdss_immutable_execution_ledgers(encounter_id, executed_at);
