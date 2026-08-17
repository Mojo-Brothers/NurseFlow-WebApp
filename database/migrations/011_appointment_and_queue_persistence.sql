-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 011: Appointment & Outpatient Queue Persistence
-- Standar: JCI ACC (Access & Continuity of Care), BPJS Antrean Online v2 & Mobile JKN
-- Features: Appointment Slots with Active Mutex, Reschedule Audit Trail & Atomic Queue Sequences
-- ==============================================================================

-- ─── 1. APPOINTMENTS DOMAIN ───
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    appointment_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    doctor_id VARCHAR(50) NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    department_id VARCHAR(50) NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    slot_time VARCHAR(20) NOT NULL,
    booking_source VARCHAR(30) NOT NULL DEFAULT 'ON_SITE' CHECK (booking_source IN ('ON_SITE', 'MOBILE_JKN', 'CALL_CENTER', 'PATIENT_PORTAL', 'REFERRAL')),
    guarantor_type VARCHAR(50) DEFAULT 'UMUM',
    status VARCHAR(30) NOT NULL DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW')),
    cancellation_reason TEXT,
    rescheduled_from_id UUID REFERENCES appointments(id),
    bpjs_booking_code VARCHAR(50),
    ticket_number VARCHAR(20),
    version INT NOT NULL DEFAULT 1,
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIAL UNIQUE INDEX: Mencegah double-booking dokter HANYA untuk status aktif (Cancelled/No-Show dapat diisi kembali)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_doctor_slot 
ON appointments(tenant_id, doctor_id, appointment_date, slot_time) 
WHERE status IN ('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION');

CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_status ON appointments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_bpjs_booking ON appointments(bpjs_booking_code) WHERE bpjs_booking_code IS NOT NULL;

-- ─── 2. APPOINTMENT AUDIT & RESCHEDULE LOGS (APPEND-ONLY) ───
CREATE TABLE IF NOT EXISTS appointment_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('BOOKED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW_MARKED', 'OVERRIDE_SLOT')),
    old_slot_date DATE,
    old_slot_time VARCHAR(20),
    new_slot_date DATE,
    new_slot_time VARCHAR(20),
    reason TEXT,
    actor_id VARCHAR(50) NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_audit_tenant ON appointment_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_audit_parent ON appointment_audit_logs(appointment_id);

-- ─── 3. QUEUE SEQUENCES (ATOMIC COUNTER FOR DAILY CLINIC QUEUES) ───
CREATE TABLE IF NOT EXISTS queue_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    pool_code VARCHAR(30) NOT NULL,
    queue_date DATE NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    current_called_number INT NOT NULL DEFAULT 0,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_queue_sequence UNIQUE (tenant_id, pool_code, queue_date)
);

CREATE INDEX IF NOT EXISTS idx_queue_sequences_tenant ON queue_sequences(tenant_id);

-- ─── 4. EXTEND QUEUE_TICKETS & PATIENT_REGISTRATIONS WITH APPOINTMENT LINK ───
ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id);
ALTER TABLE patient_registrations ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id);

CREATE INDEX IF NOT EXISTS idx_queue_tickets_appointment ON queue_tickets(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_appointment ON patient_registrations(appointment_id) WHERE appointment_id IS NOT NULL;

-- ─── 5. PHYSICAL ROW-LEVEL SECURITY (RLS) FOR APPOINTMENTS & QUEUE SEQUENCES ───
DO $$
DECLARE
    tbl TEXT;
    apt_tables TEXT[] := ARRAY[
        'appointments',
        'appointment_audit_logs',
        'queue_sequences'
    ];
BEGIN
    FOREACH tbl IN ARRAY apt_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (tenant_id = current_app_tenant_id()) WITH CHECK (tenant_id = current_app_tenant_id());', tbl);
    END LOOP;
END $$;
