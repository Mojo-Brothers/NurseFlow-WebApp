-- ============================================================================
-- Migration 043: Relational Clinical Rule Conditions (B-Tree Indexed Engine)
-- Standards: High-Performance In-Database CDSS, Sub-Millisecond Evaluation
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_rule_conditions (
    id VARCHAR(36) PRIMARY KEY,
    rule_id VARCHAR(36) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    operator VARCHAR(10) NOT NULL CHECK (operator IN ('<', '<=', '=', '>=', '>', '!=', 'IN', 'CONTAINS')),
    comparison_value VARCHAR(100) NOT NULL,
    logical_operator VARCHAR(5) NOT NULL DEFAULT 'AND' CHECK (logical_operator IN ('AND', 'OR')),
    created_at BIGINT NOT NULL,
    FOREIGN KEY (rule_id) REFERENCES clinical_rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conditions_rule_field ON clinical_rule_conditions(rule_id, field_name);
