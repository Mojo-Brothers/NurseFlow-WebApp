-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 003: Front Office, Queues, BPJS & Outbox
-- Standar: BPJS V-Claim 2.0 & Antrean Mobile JKN, Transactional Outbox Pattern
-- ==============================================================================

CREATE TABLE IF NOT EXISTS patient_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    episode_id UUID NOT NULL REFERENCES episodes_of_care(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    ticket_number VARCHAR(20) NOT NULL,
    registration_type VARCHAR(30) NOT NULL,
    guarantor_id VARCHAR(30) NOT NULL,
    guarantor_name VARCHAR(100) NOT NULL,
    sep_number VARCHAR(30),
    department_id VARCHAR(50) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    doctor_id VARCHAR(50) NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queue_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) NOT NULL,
    pool_code VARCHAR(30) NOT NULL,
    pool_name VARCHAR(100) NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    encounter_id UUID REFERENCES encounters(id),
    counter_name VARCHAR(50),
    is_priority BOOLEAN DEFAULT FALSE,
    priority_reason VARCHAR(30) DEFAULT 'NONE',
    queue_status VARCHAR(30) DEFAULT 'WAITING' CHECK (queue_status IN ('WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'ARCHIVED', 'SKIPPED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    called_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS bpjs_sep_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sep_number VARCHAR(30) UNIQUE NOT NULL,
    registration_id UUID NOT NULL REFERENCES patient_registrations(id),
    patient_id UUID NOT NULL REFERENCES master_patients(id),
    bpjs_card_number VARCHAR(30) NOT NULL,
    nik VARCHAR(16) NOT NULL,
    referral_number VARCHAR(30),
    referral_origin_faskes TEXT,
    treatment_type VARCHAR(5) DEFAULT '2',
    destination_poli_code VARCHAR(20) NOT NULL,
    destination_poli_name VARCHAR(100) NOT NULL,
    dpjp_bpjs_code VARCHAR(30) NOT NULL,
    dpjp_name VARCHAR(100) NOT NULL,
    primary_diagnose_icd10 VARCHAR(20) NOT NULL,
    primary_diagnose_name TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    headers JSONB DEFAULT '{}',
    published BOOLEAN DEFAULT FALSE,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS processed_events (
    event_id VARCHAR(100) PRIMARY KEY,
    subscriber_name VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_published ON outbox_events(published);
CREATE INDEX IF NOT EXISTS idx_queue_pool_status ON queue_tickets(pool_code, queue_status);
