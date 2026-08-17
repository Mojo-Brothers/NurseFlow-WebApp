-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 025: Reference, Demography & Lookup Tables
-- Standards: Kemendagri Permendagri No. 72/2019, ISO 3166-1, JCI 7th Edition & Kemenkes RME
-- ==============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Standard Status PostgreSQL ENUM
DO $$ BEGIN
    CREATE TYPE status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED', 'UNDER_REVIEW', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Master Genders (Shared Global)
CREATE TABLE IF NOT EXISTS master_genders (
    code VARCHAR(10) PRIMARY KEY,
    name_id VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    satusehat_code VARCHAR(10) NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Master Religions (Shared Global)
CREATE TABLE IF NOT EXISTS master_religions (
    id INT PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    satusehat_code VARCHAR(30) NOT NULL,
    display_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Master Marital Statuses (Shared Global)
CREATE TABLE IF NOT EXISTS master_marital_statuses (
    code VARCHAR(10) PRIMARY KEY,
    name_id VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    satusehat_code VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Master Countries (Shared Global — ISO 3166-1)
CREATE TABLE IF NOT EXISTS master_countries (
    alpha3_code CHAR(3) PRIMARY KEY,
    numeric_code CHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Master Provinces (Kemendagri)
CREATE TABLE IF NOT EXISTS master_provinces (
    code VARCHAR(10) PRIMARY KEY,
    country_code CHAR(3) NOT NULL REFERENCES master_countries(alpha3_code),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Master Cities / Kabupaten (Kemendagri)
CREATE TABLE IF NOT EXISTS master_cities (
    code VARCHAR(10) PRIMARY KEY,
    province_code VARCHAR(10) NOT NULL REFERENCES master_provinces(code),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK(type IN ('KOTA', 'KABUPATEN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Master Districts / Kecamatan (Kemendagri)
CREATE TABLE IF NOT EXISTS master_districts (
    code VARCHAR(10) PRIMARY KEY,
    city_code VARCHAR(10) NOT NULL REFERENCES master_cities(code),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Master Villages / Kelurahan (Kemendagri)
CREATE TABLE IF NOT EXISTS master_villages (
    code VARCHAR(15) PRIMARY KEY,
    district_code VARCHAR(10) NOT NULL REFERENCES master_districts(code),
    name VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Master Hospital Types (Shared Lookup)
CREATE TABLE IF NOT EXISTS master_hospital_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. Master Staff Categories (Shared Lookup)
CREATE TABLE IF NOT EXISTS master_staff_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_clinical BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. Master Credential Types (Shared Lookup)
CREATE TABLE IF NOT EXISTS master_credential_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    issuing_body VARCHAR(100) NOT NULL,
    requires_expiry_tracking BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 13. Master Surgery Categories (Shared Lookup)
CREATE TABLE IF NOT EXISTS master_surgery_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 14. Master Payer Types (Shared Lookup)
CREATE TABLE IF NOT EXISTS master_payer_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK(category IN ('GOVERNMENT_BPJS', 'COMMERCIAL_INSURANCE', 'CORPORATE', 'SELF_PAY')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for Reference Tables
CREATE INDEX IF NOT EXISTS idx_cities_province ON master_cities(province_code);
CREATE INDEX IF NOT EXISTS idx_districts_city ON master_districts(city_code);
CREATE INDEX IF NOT EXISTS idx_villages_district ON master_villages(district_code);
