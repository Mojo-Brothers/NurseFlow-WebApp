-- ============================================================================
-- Migration 048: Clinical Rule Provenance, Approval & Governance Ledger
-- Standards: JCI MCI (Clinical Governance & Evidence Traceability)
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_rule_governance (
    id VARCHAR(36) PRIMARY KEY,
    rule_id VARCHAR(36) NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    rule_version INT NOT NULL,
    evidence_source VARCHAR(100) NOT NULL, -- 'Lexicomp 2026', 'KDIGO 2024', 'WHO Model Formulary 2026', 'FDA Black Box'
    evidence_version VARCHAR(50),
    evidence_reference_url TEXT,
    author_practitioner_id VARCHAR(36) NOT NULL,
    clinical_reviewer_id VARCHAR(36) NOT NULL,
    approved_by_committee_id VARCHAR(36) NOT NULL, -- e.g. 'KFT-COMMITTEE-01'
    approval_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'DEPRECATED')),
    approved_at BIGINT NOT NULL,
    change_justification TEXT NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (rule_id) REFERENCES clinical_rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rule_gov_lookup ON clinical_rule_governance(rule_code, rule_version);
