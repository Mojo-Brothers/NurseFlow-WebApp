-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 029: Wave 4 Human Resources & Multi-Profesi Practitioners
-- Standards: JCI Staff Qualifications & Education (SQE), KKI/IDI, PPNI, IAI & SATUSEHAT Practitioner
-- ==============================================================================

-- 1. Master Specialties (Taksonomi Spesialisasi Medis)
CREATE TABLE IF NOT EXISTS master_specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    kemenkes_code VARCHAR(50),
    bpjs_code VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Master Staff (Single Source of Truth Data Kepegawaian RS)
CREATE TABLE IF NOT EXISTS master_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES master_tenants(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES master_organizations(id) ON DELETE RESTRICT,
    staff_category_id UUID NOT NULL REFERENCES master_staff_categories(id),
    employee_number VARCHAR(30) UNIQUE NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender_code VARCHAR(10) NOT NULL REFERENCES master_genders(code),
    religion_id INT NOT NULL REFERENCES master_religions(id),
    marital_status_code VARCHAR(10) NOT NULL REFERENCES master_marital_statuses(code),
    birth_date DATE NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL
);

-- 3. Master Practitioners (Profil Nakes & Dokter Terdaftar SATUSEHAT)
CREATE TABLE IF NOT EXISTS master_practitioners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID UNIQUE NOT NULL REFERENCES master_staff(id) ON DELETE CASCADE,
    specialty_id UUID NULL REFERENCES master_specialties(id),
    practitioner_type VARCHAR(50) NOT NULL CHECK(practitioner_type IN ('DOCTOR_SPECIALIST', 'DOCTOR_GP', 'DENTIST', 'NURSE_PRIMARY', 'NURSE_VOCATIONAL', 'MIDWIFE', 'PHARMACIST', 'LAB_ANALYST', 'RADIOGRAPHER', 'NUTRITIONIST', 'PHYSIOTHERAPIST')),
    ihs_number VARCHAR(50) UNIQUE NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    bpjs_doctor_code VARCHAR(30),
    is_dpjp_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    is_clinical_staff BOOLEAN NOT NULL DEFAULT TRUE,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL
);

-- 4. Master Credentials (Multi-Dokumen STR, SIP, SIPA, SIKR, Sertifikat Kompetensi)
CREATE TABLE IF NOT EXISTS master_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES master_practitioners(id) ON DELETE CASCADE,
    credential_type_id UUID NOT NULL REFERENCES master_credential_types(id),
    credential_number VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(100) NOT NULL,
    issued_at DATE NOT NULL,
    valid_until DATE NOT NULL,
    attachment_url TEXT,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'VERIFIED',
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_practitioner_credential UNIQUE(practitioner_id, credential_type_id, credential_number)
);

-- 5. Master Practitioner Schedules (Roster Jadwal Praktik Poliklinik & Kuota Konsultasi)
CREATE TABLE IF NOT EXISTS master_practitioner_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES master_practitioners(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES master_clinics(id) ON DELETE RESTRICT,
    day_of_week INT NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_quota INT NOT NULL DEFAULT 30,
    slot_duration_minutes INT NOT NULL DEFAULT 15,
    status status_enum NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    deleted_by UUID NULL,
    CONSTRAINT uq_practitioner_schedule_slot UNIQUE(practitioner_id, clinic_id, day_of_week, start_time)
);

-- Indexes for Human Resources
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON master_staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_org ON master_staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_ihs ON master_practitioners(ihs_number);
CREATE INDEX IF NOT EXISTS idx_credential_expiry ON master_credentials(valid_until);
CREATE INDEX IF NOT EXISTS idx_schedule_clinic ON master_practitioner_schedules(clinic_id, day_of_week);
