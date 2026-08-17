-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 001: Master Patient & Identity
-- Standar: Permenkes No. 24/2022, SATUSEHAT Patient Resource & JCI IPSG 1
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS master_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(30) UNIQUE NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    ihs_number VARCHAR(30) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    birth_place VARCHAR(100),
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN')),
    marital_status VARCHAR(20),
    religion VARCHAR(30),
    education VARCHAR(50),
    occupation VARCHAR(100),
    phone_number VARCHAR(30) NOT NULL,
    email VARCHAR(100),
    address_line TEXT NOT NULL,
    rt VARCHAR(5),
    rw VARCHAR(5),
    kelurahan_code VARCHAR(20),
    kecamatan_code VARCHAR(20),
    city_code VARCHAR(20),
    province_code VARCHAR(20),
    postal_code VARCHAR(10),
    guarantor_type VARCHAR(50) DEFAULT 'UMUM',
    bpjs_card_number VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    is_merged BOOLEAN DEFAULT FALSE,
    merged_into_id UUID REFERENCES master_patients(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_mrn ON master_patients(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_nik ON master_patients(nik);
CREATE INDEX IF NOT EXISTS idx_patients_bpjs ON master_patients(bpjs_card_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON master_patients(full_name);
