-- ============================================================================
-- Migration 047: Canonical Seed Data for Pediatric Max Dose Rules
-- Standards: WHO Model Formulary for Children, JCI IPSG 3
-- ============================================================================

-- 1. Paracetamol Pediatric Max 15 mg/kg Single Dose
INSERT INTO clinical_rules (
    id, rule_code, rule_version, rule_type, severity, alert_title, alert_message, clinical_recommendation,
    primary_entity_code, secondary_entity_code, effective_from, effective_until, is_active, created_at, updated_at
) VALUES (
    'RULE-PED-001', 'PED_PARACETAMOL_MAX15', 1, 'PEDIATRIC_DOSE', 'FATAL_HARD_STOP',
    'OVERDOSIS PEDIATRIK DITOLAK: PARACETAMOL >15 MG/KG',
    'Dosis yang diinput melebihi batas aman maksimal 15 mg/kgBB per kali pemberian untuk pasien anak.',
    'Hitung ulang dosis: Berat Badan (kg) × 10–15 mg. Batas maksimal harian adalah 60 mg/kg/hari.',
    'N02BE01', NULL, 1723900000000, NULL, TRUE, 1723900000000, 1723900000000
) ON CONFLICT (rule_code, rule_version) DO NOTHING;

INSERT INTO clinical_rule_conditions (id, rule_id, field_name, operator, comparison_value, logical_operator, created_at) VALUES
('COND-PED-001A', 'RULE-PED-001', 'primary_atc', '=', 'N02BE01', 'AND', 1723900000000),
('COND-PED-001B', 'RULE-PED-001', 'patient_age_years', '<', '12', 'AND', 1723900000000),
('COND-PED-001C', 'RULE-PED-001', 'dose_mg_per_kg', '>', '15.0', 'AND', 1723900000000)
ON CONFLICT (id) DO NOTHING;

-- 2. Ceftriaxone Pediatric Max 80 mg/kg Daily Dose
INSERT INTO clinical_rules (
    id, rule_code, rule_version, rule_type, severity, alert_title, alert_message, clinical_recommendation,
    primary_entity_code, secondary_entity_code, effective_from, effective_until, is_active, created_at, updated_at
) VALUES (
    'RULE-PED-002', 'PED_CEFTRIAXONE_MAX80', 1, 'PEDIATRIC_DOSE', 'FATAL_HARD_STOP',
    'OVERDOSIS PEDIATRIK DITOLAK: CEFTRIAXONE >80 MG/KG',
    'Dosis Ceftriaxone melebihi batas aman harian 80 mg/kgBB untuk pasien anak (maksimal 2g/hari non-meningitis).',
    'Turunkan dosis sesuai pedoman BB anak: 50–80 mg/kg/hari terbagi setiap 12–24 jam.',
    'J01DD04', NULL, 1723900000000, NULL, TRUE, 1723900000000, 1723900000000
) ON CONFLICT (rule_code, rule_version) DO NOTHING;

INSERT INTO clinical_rule_conditions (id, rule_id, field_name, operator, comparison_value, logical_operator, created_at) VALUES
('COND-PED-002A', 'RULE-PED-002', 'primary_atc', '=', 'J01DD04', 'AND', 1723900000000),
('COND-PED-002B', 'RULE-PED-002', 'patient_age_years', '<', '12', 'AND', 1723900000000),
('COND-PED-002C', 'RULE-PED-002', 'dose_mg_per_kg', '>', '80.0', 'AND', 1723900000000)
ON CONFLICT (id) DO NOTHING;
