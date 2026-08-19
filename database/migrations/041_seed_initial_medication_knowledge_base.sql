-- ============================================================================
-- Migration 041: Canonical Seed Data for Medication Knowledge Base
-- Includes: Core Drugs, Classes, ATC/RxNorm/SNOMED Mapping, DDI & Formulary
-- ============================================================================

-- 1. Medication Classes
INSERT INTO master_medication_classes (id, class_code, class_name, description, is_active, created_at, updated_at) VALUES
('CLASS-001', 'CARBAPENEM', 'Carbapenem Antibiotics', 'Broad-spectrum beta-lactam antibiotics reserved for multidrug-resistant bacterial infections.', TRUE, 1723900000000, 1723900000000),
('CLASS-002', 'CEPHALOSPORIN_3G', 'Third-Generation Cephalosporins', 'Broad-spectrum beta-lactams with enhanced gram-negative coverage.', TRUE, 1723900000000, 1723900000000),
('CLASS-003', 'PENICILLIN_DERIVATIVE', 'Penicillin & Aminopenicillins', 'Beta-lactam antibiotics including ampicillin, amoxicillin, and piperacillin.', TRUE, 1723900000000, 1723900000000),
('CLASS-004', 'ANTICOAGULANT', 'Oral Anticoagulants (Vitamin K Antagonists & DOAC)', 'Medications that prevent blood clot formation.', TRUE, 1723900000000, 1723900000000),
('CLASS-005', 'NSAID', 'Non-Steroidal Anti-Inflammatory Drugs', 'Inhibitors of cyclooxygenase enzymes providing analgesia and antipyresis.', TRUE, 1723900000000, 1723900000000),
('CLASS-006', 'ANALGESIC_ANTIPYRETIC', 'Aniline Analgesics & Antipyretics', 'Centrally acting analgesic and antipyretic agents including paracetamol.', TRUE, 1723900000000, 1723900000000),
('CLASS-007', 'INSULIN', 'Insulin & Analogues', 'Hormonal agents regulating glucose metabolism, High-Alert class.', TRUE, 1723900000000, 1723900000000),
('CLASS-008', 'GLYCOPEPTIDE', 'Glycopeptide Antibiotics', 'Inhibitors of bacterial cell wall synthesis active against MRSA, e.g., Vancomycin.', TRUE, 1723900000000, 1723900000000),
('CLASS-009', 'INOTROPE_VASOPRESSOR', 'Inotropes & Vasopressors', 'Sympathomimetic agents supporting cardiac output and vascular tone in critical care.', TRUE, 1723900000000, 1723900000000),
('CLASS-010', 'OPIOID_ANALGESIC', 'Opioid Receptor Agonists (Narcotics)', 'Potent central analgesics requiring strict dual sign and vault logging.', TRUE, 1723900000000, 1723900000000)
ON CONFLICT (class_code) DO NOTHING;

-- 1.5. Master KFA Codes Seed
INSERT INTO master_kfa (kfa_code, product_name, dosage_form, manufacturer, is_active) VALUES
('93001003', 'Meropenem 1g Injeksi', 'VIAL', 'Generik Kemenkes', TRUE),
('93002014', 'Ceftriaxone 1g Injeksi', 'VIAL', 'Generik Kemenkes', TRUE),
('93003055', 'Simarc-2 2mg Tablet', 'TABLET', 'Pharos Indonesia', TRUE),
('93004012', 'Aspilets 80mg Tablet Kunyah', 'TABLET', 'Medifarma', TRUE),
('93005088', 'Paracetamol 500mg Tablet', 'TABLET', 'Kimia Farma', TRUE),
('93005099', 'Sanmol Infus 1000mg/100ml', 'INFUSION', 'Sanbe Farma', TRUE),
('93006001', 'Vancocin 500mg VIAL', 'VIAL', 'Kalbe Farma', TRUE),
('93007011', 'Novorapid Flexpen 100 IU/ml', 'PEN', 'Novo Nordisk', TRUE),
('93008022', 'Vascon 4mg/4ml Ampul', 'AMPUL', 'Fahrenheit', TRUE),
('93009033', 'Fentanyl 0.05mg/ml (2ml)', 'AMPUL', 'Kimia Farma', TRUE)
ON CONFLICT (kfa_code) DO NOTHING;

-- 2. Master Medications
INSERT INTO master_medications (
    id, tenant_id, generic_name, brand_name, atc_code, rxnorm_code, kfa_code, dosage_form, strength, strength_amount, strength_unit,
    drug_class_code, is_high_alert, is_lasa, is_narcotic, pregnancy_category, renal_adjustment_threshold_egfr, pediatric_max_mg_per_kg,
    record_status, version, created_at, updated_at
) VALUES
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Meropenem Trihydrate', 'Meropenem 1g Injeksi', 'J01DH02', '11124', '93001003', 'VIAL', '1000 mg', 1000, 'mg', 'CARBAPENEM', FALSE, FALSE, FALSE, 'B', 30.0, 40.0, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Ceftriaxone Sodium', 'Ceftriaxone 1g Injeksi', 'J01DD04', '2193', '93002014', 'VIAL', '1000 mg', 1000, 'mg', 'CEPHALOSPORIN_3G', FALSE, TRUE, FALSE, 'B', NULL, 80.0, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Warfarin Sodium', 'Simarc-2 2mg Tablet', 'B01AA03', '11289', '93003055', 'TABLET', '2 mg', 2, 'mg', 'ANTICOAGULANT', TRUE, FALSE, FALSE, 'X', NULL, NULL, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Acetylsalicylic Acid (Aspirin)', 'Aspilets 80mg Tablet Kunyah', 'B01AC06', '1191', '93004012', 'TABLET', '80 mg', 80, 'mg', 'NSAID', FALSE, FALSE, FALSE, 'D', NULL, NULL, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Paracetamol (Acetaminophen)', 'Paracetamol 500mg Tablet', 'N02BE01', '7052', '93005088', 'TABLET', '500 mg', 500, 'mg', 'ANALGESIC_ANTIPYRETIC', FALSE, FALSE, FALSE, 'B', NULL, 15.0, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'Paracetamol Infus 1%', 'Sanmol Infus 1000mg/100ml', 'N02BE01', '7052', '93005099', 'INFUSION', '1000 mg/100ml', 1000, 'mg', 'ANALGESIC_ANTIPYRETIC', FALSE, FALSE, FALSE, 'B', NULL, 15.0, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Vancomycin Hydrochloride', 'Vancocin 500mg VIAL', 'J01XA01', '11124', '93006001', 'VIAL', '500 mg', 500, 'mg', 'GLYCOPEPTIDE', TRUE, FALSE, FALSE, 'C', 50.0, 15.0, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'Insulin Aspart Rapid-Acting', 'Novorapid Flexpen 100 IU/ml', 'A10AB05', '285018', '93007011', 'PEN', '300 IU', 300, 'IU', 'INSULIN', TRUE, TRUE, FALSE, 'B', NULL, NULL, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'Norepinephrine Bitartrate', 'Vascon 4mg/4ml Ampul', 'C01CA03', '7512', '93008022', 'AMPUL', '4 mg/4ml', 4, 'mg', 'INOTROPE_VASOPRESSOR', TRUE, FALSE, FALSE, 'C', NULL, NULL, 'ACTIVE', 1, NOW(), NOW()),
('00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'Fentanyl Citrate Injeksi', 'Fentanyl 0.05mg/ml (2ml)', 'N01AH01', '4337', '93009033', 'AMPUL', '0.1 mg/2ml', 0.1, 'mg', 'OPIOID_ANALGESIC', TRUE, FALSE, TRUE, 'C', NULL, NULL, 'ACTIVE', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Medication Terminologies
INSERT INTO medication_terminologies (id, medication_id, terminology_system, terminology_code, terminology_display, created_at) VALUES
('TERM-001', '00000000-0000-0000-0000-000000000001', 'SNOMED_CT', '372729009', 'Meropenem (substance)', 1723900000000),
('TERM-002', '00000000-0000-0000-0000-000000000001', 'RXNORM', '11124', 'meropenem 1000 MG Injection', 1723900000000),
('TERM-003', '00000000-0000-0000-0000-000000000001', 'KFA_KEMENKES', '93001003', 'Meropenem Serbuk Injeksi 1000 mg (Generik)', 1723900000000),
('TERM-004', '00000000-0000-0000-0000-000000000001', 'GTIN_BARCODE', '08991234567891', 'GTIN-14 Meropenem 1g RS', 1723900000000),
('TERM-005', '00000000-0000-0000-0000-000000000003', 'SNOMED_CT', '372862008', 'Warfarin (substance)', 1723900000000),
('TERM-006', '00000000-0000-0000-0000-000000000004', 'SNOMED_CT', '387458008', 'Aspirin (substance)', 1723900000000),
('TERM-007', '00000000-0000-0000-0000-000000000005', 'SNOMED_CT', '387517004', 'Paracetamol (substance)', 1723900000000),
('TERM-008', '00000000-0000-0000-0000-000000000007', 'SNOMED_CT', '372740003', 'Vancomycin (substance)', 1723900000000)
ON CONFLICT (medication_id, terminology_system, terminology_code) DO NOTHING;

-- 4. Medication Interactions (DDI Matrix)
INSERT INTO medication_interactions (id, drug_a_id, drug_b_id, severity, clinical_mechanism, clinical_effect, management_recommendation, evidence_source, is_active, created_at, updated_at) VALUES
('DDI-001', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'CRITICAL_HIGH', 'Sinergisme antikoagulasi dan inhibisi agregasi trombosit via jalur COX-1.', 'Peningkatan risiko perdarahan mayor gastrointestinal hingga 4.5x lipat.', 'Hindari kombinasi kecuali pada indikasi khusus sindrom koroner akut dengan pemantauan INR ketat.', 'FDA / Lexicomp Clinical Drug Interactions 2026', TRUE, 1723900000000, 1723900000000),
('DDI-002', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 'CRITICAL_HIGH', 'Duplikasi zat aktif Paracetamol (Acetaminophen) secara simultan melalui rute oral dan intravena.', 'Risiko overdosis kumulatif >4g/hari dan hepatotoksisitas berat.', 'Hentikan salah satu rute pemberian; pilih oral atau intravena.', 'American Liver Foundation & JCI Safety Alert', TRUE, 1723900000000, 1723900000000)
ON CONFLICT (drug_a_id, drug_b_id) DO NOTHING;
