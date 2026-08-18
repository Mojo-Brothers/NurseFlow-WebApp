-- ============================================================================
-- Migration 046: Canonical Seed Data for Renal eGFR Dose Adjustment Rules
-- Standards: KDIGO 2024 Guidelines, JCI Medication Management (MMU)
-- ============================================================================

-- 1. Meropenem Dose Reduction on eGFR < 30 ml/min
INSERT INTO clinical_rules (
    id, rule_code, rule_version, rule_type, severity, alert_title, alert_message, clinical_recommendation,
    primary_entity_code, secondary_entity_code, effective_from, effective_until, is_active, created_at, updated_at
) VALUES (
    'RULE-RENAL-001', 'RENAL_MEROPENEM_EGFR30', 1, 'RENAL_ADJUSTMENT', 'CRITICAL_WARNING',
    'PENYESUAIAN DOSIS GINJAL DIPERLUKAN: MEROPENEM',
    'Fungsi ginjal pasien eGFR < 30 ml/min. Akumulasi Meropenem memicu neurotoksisitas dan kejang.',
    'Turunkan dosis Meropenem menjadi 500 mg setiap 12 jam IV (atau 500 mg q24h jika eGFR < 10 ml/min).',
    'J01DH02', NULL, 1723900000000, NULL, TRUE, 1723900000000, 1723900000000
) ON CONFLICT (rule_code, rule_version) DO NOTHING;

INSERT INTO clinical_rule_conditions (id, rule_id, field_name, operator, comparison_value, logical_operator, created_at) VALUES
('COND-RENAL-001A', 'RULE-RENAL-001', 'primary_atc', '=', 'J01DH02', 'AND', 1723900000000),
('COND-RENAL-001B', 'RULE-RENAL-001', 'latest_egfr', '<', '30', 'AND', 1723900000000)
ON CONFLICT (id) DO NOTHING;

-- 2. Vancomycin Trough Monitoring on eGFR < 50 ml/min
INSERT INTO clinical_rules (
    id, rule_code, rule_version, rule_type, severity, alert_title, alert_message, clinical_recommendation,
    primary_entity_code, secondary_entity_code, effective_from, effective_until, is_active, created_at, updated_at
) VALUES (
    'RULE-RENAL-002', 'RENAL_VANCOMYCIN_EGFR50', 1, 'RENAL_ADJUSTMENT', 'CRITICAL_WARNING',
    'PENYESUAIAN DOSIS GINJAL & PEMANTAUAN KADAR: VANCOMYCIN',
    'Fungsi ginjal pasien eGFR < 50 ml/min. Risiko nefrotoksisitas sinergis meningkat secara signifikan.',
    'Perpanjang interval pemberian menjadi q24h atau q48h dan lakukan pemeriksaan TDM (Therapeutic Drug Monitoring) kadar trough.',
    'J01XA01', NULL, 1723900000000, NULL, TRUE, 1723900000000, 1723900000000
) ON CONFLICT (rule_code, rule_version) DO NOTHING;

INSERT INTO clinical_rule_conditions (id, rule_id, field_name, operator, comparison_value, logical_operator, created_at) VALUES
('COND-RENAL-002A', 'RULE-RENAL-002', 'primary_atc', '=', 'J01XA01', 'AND', 1723900000000),
('COND-RENAL-002B', 'RULE-RENAL-002', 'latest_egfr', '<', '50', 'AND', 1723900000000)
ON CONFLICT (id) DO NOTHING;
