-- ============================================================================
-- Migration 045: Canonical Seed Data for Drug-Drug Interaction Rules
-- Standards: JCI IPSG 3, Lexicomp 2026 Interaction Matrix
-- ============================================================================

-- 1. Warfarin + Aspirin (Major Bleeding Risk)
INSERT INTO clinical_rules (
    id, rule_code, rule_version, rule_type, severity, alert_title, alert_message, clinical_recommendation,
    primary_entity_code, secondary_entity_code, effective_from, effective_until, is_active, created_at, updated_at
) VALUES (
    'RULE-DDI-001', 'DDI_WARFARIN_ASPIRIN', 1, 'DRUG_DRUG_INTERACTION', 'CRITICAL_WARNING',
    'INTERAKSI OBAT RISIKO TINGGI: WARFARIN + ASPIRIN',
    'Kombinasi Warfarin dan Aspirin meningkatkan risiko perdarahan mayor saluran cerna hingga 4.5x lipat via sinergisme antihemostasis.',
    'Pertimbangkan alternatif non-NSAID atau evaluasi indikasi ACS dengan pemantauan INR ketat dan gastroprotektor (PPI).',
    'B01AA03', 'B01AC06', 1723900000000, NULL, TRUE, 1723900000000, 1723900000000
) ON CONFLICT (rule_code, rule_version) DO NOTHING;

INSERT INTO clinical_rule_conditions (id, rule_id, field_name, operator, comparison_value, logical_operator, created_at) VALUES
('COND-DDI-001A', 'RULE-DDI-001', 'primary_atc', '=', 'B01AA03', 'AND', 1723900000000),
('COND-DDI-001B', 'RULE-DDI-001', 'secondary_atc', '=', 'B01AC06', 'AND', 1723900000000)
ON CONFLICT (id) DO NOTHING;

-- 2. Paracetamol Oral + Paracetamol IV (Duplicate Active Ingredient Hard Stop)
INSERT INTO clinical_rules (
    id, rule_code, rule_version, rule_type, severity, alert_title, alert_message, clinical_recommendation,
    primary_entity_code, secondary_entity_code, effective_from, effective_until, is_active, created_at, updated_at
) VALUES (
    'RULE-DUPL-001', 'DUPL_PARACETAMOL_ORAL_IV', 1, 'DUPLICATE_THERAPY', 'FATAL_HARD_STOP',
    'DUPLIKASI TERAPI MEMATIKAN: PARACETAMOL ORAL + IV',
    'Pasien sedang menerima Paracetamol rute lain. Pemberian ganda memicu overdosis kumulatif >4g/hari dan gagal hati akut.',
    'Batalkan peresepan Paracetamol rute kedua atau hentikan sediaan yang sedang aktif sebelum memulai rute baru.',
    'N02BE01', 'N02BE01', 1723900000000, NULL, TRUE, 1723900000000, 1723900000000
) ON CONFLICT (rule_code, rule_version) DO NOTHING;

INSERT INTO clinical_rule_conditions (id, rule_id, field_name, operator, comparison_value, logical_operator, created_at) VALUES
('COND-DUPL-001A', 'RULE-DUPL-001', 'primary_atc', '=', 'N02BE01', 'AND', 1723900000000),
('COND-DUPL-001B', 'RULE-DUPL-001', 'active_medication_atc', '=', 'N02BE01', 'AND', 1723900000000)
ON CONFLICT (id) DO NOTHING;
