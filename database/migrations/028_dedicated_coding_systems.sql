-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 028: Wave 3 Dedicated Coding Systems
-- Standards: WHO ICD-10 2019, ICD-9-CM V3, Regenstrief LOINC 2.76, SNOMED-CT & Kemenkes KFA
-- ==============================================================================

-- 1. Master ICD-10 (Klasifikasi Baku Lapangan Diagnosis Klinis — High Performance Dedicated)
CREATE TABLE IF NOT EXISTS master_icd10 (
    code VARCHAR(10) PRIMARY KEY,
    description_id TEXT NOT NULL,
    description_en TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_bpjs_claimable BOOLEAN NOT NULL DEFAULT TRUE,
    is_infectious_disease BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Full-Text Search GIN Index on ICD-10
CREATE INDEX IF NOT EXISTS idx_icd10_desc_id_gin ON master_icd10 USING gin(to_tsvector('indonesian', description_id));
CREATE INDEX IF NOT EXISTS idx_icd10_desc_en_gin ON master_icd10 USING gin(to_tsvector('english', description_en));
CREATE INDEX IF NOT EXISTS idx_icd10_category ON master_icd10(category);

-- 2. Master ICD-9-CM (Klasifikasi Tindakan Medis & Pembedahan)
CREATE TABLE IF NOT EXISTS master_icd9cm (
    code VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_icd9cm_desc_gin ON master_icd9cm USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_icd9cm_category ON master_icd9cm(category);

-- 3. Master LOINC (Logical Observation Identifiers Names and Codes — Laboratorium & Imaging)
CREATE TABLE IF NOT EXISTS master_loinc (
    code VARCHAR(20) PRIMARY KEY,
    component VARCHAR(255) NOT NULL,
    property VARCHAR(50) NOT NULL,
    time_aspect VARCHAR(50) NOT NULL,
    system_type VARCHAR(50) NOT NULL,
    scale_type VARCHAR(50) NOT NULL,
    method_type VARCHAR(100),
    class VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loinc_comp ON master_loinc(component);
CREATE INDEX IF NOT EXISTS idx_loinc_class ON master_loinc(class);

-- 4. Master SNOMED-CT (Standardized Clinical Terminology Concepts)
CREATE TABLE IF NOT EXISTS master_snomed (
    concept_id VARCHAR(20) PRIMARY KEY,
    fully_specified_name TEXT NOT NULL,
    preferred_term TEXT NOT NULL,
    hierarchy VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snomed_term ON master_snomed(preferred_term);
CREATE INDEX IF NOT EXISTS idx_snomed_hierarchy ON master_snomed(hierarchy);

-- 5. Master KFA (Kamus Farmasi dan Alat Kesehatan Kemenkes RI)
CREATE TABLE IF NOT EXISTS master_kfa (
    kfa_code VARCHAR(30) PRIMARY KEY,
    product_name TEXT NOT NULL,
    dosage_form VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kfa_name ON master_kfa(product_name);
