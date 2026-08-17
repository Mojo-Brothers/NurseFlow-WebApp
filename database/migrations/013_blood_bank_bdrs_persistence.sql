-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 013: Blood Bank (BDRS) Units, Crossmatch & Safety Traceability Chain
-- Standar: Permenkes No. 91/2015 (Standar Pelayanan Transfusi Darah), WHO Blood Safety & JCI IPSG
-- Features: 3-Tier Clinical Safety Invariants, Immutable Crossmatch, Traceable Custody Issue & Bedside Verification
-- ==============================================================================

-- ─── 1. BLOOD DONOR UNITS (MASTER KANTONG DARAH BDRS) ───
CREATE TABLE IF NOT EXISTS blood_donor_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    unit_number VARCHAR(50) NOT NULL,
    product_type VARCHAR(30) NOT NULL 
        CHECK (product_type IN ('WHOLE_BLOOD', 'PACKED_RED_CELLS', 'FRESH_FROZEN_PLASMA', 'THROMBOCYTE_CONCENTRATE', 'CRYOPRECIPITATE')),
    abo_type VARCHAR(5) NOT NULL CHECK (abo_type IN ('A', 'B', 'AB', 'O')),
    rhesus_type VARCHAR(10) NOT NULL CHECK (rhesus_type IN ('POSITIVE', 'NEGATIVE')),
    volume_ml INT NOT NULL CHECK (volume_ml > 0),
    donation_date DATE NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    storage_temperature_celsius DECIMAL(4,1),
    storage_location VARCHAR(100) NOT NULL,
    screening_status VARCHAR(30) NOT NULL DEFAULT 'NON_REACTIVE' 
        CHECK (screening_status IN ('NON_REACTIVE', 'REACTIVE', 'PENDING')),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' 
        CHECK (status IN ('QUARANTINED', 'AVAILABLE', 'RESERVED', 'CROSSMATCHED', 'ISSUED', 'TRANSFUSED', 'DISCARDED', 'EXPIRED')),
    reserved_for_patient_id UUID REFERENCES master_patients(id) ON DELETE RESTRICT,
    reserved_for_encounter_id UUID REFERENCES encounters(id) ON DELETE RESTRICT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_blood_unit_tenant_number UNIQUE (tenant_id, unit_number)
);

CREATE INDEX IF NOT EXISTS idx_blood_units_tenant ON blood_donor_units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_blood_units_lookup ON blood_donor_units(tenant_id, product_type, abo_type, rhesus_type, status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_blood_units_patient ON blood_donor_units(reserved_for_patient_id) WHERE reserved_for_patient_id IS NOT NULL;

-- ─── 2. BLOOD STORAGE TEMPERATURE LOGS (COLD-CHAIN AUDIT TRAIL) ───
CREATE TABLE IF NOT EXISTS blood_storage_temperature_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    unit_id UUID REFERENCES blood_donor_units(id) ON DELETE RESTRICT,
    storage_device_id VARCHAR(50) NOT NULL,
    product_type VARCHAR(30) DEFAULT 'PACKED_RED_CELLS',
    temperature_celsius DECIMAL(4,1) NOT NULL,
    min_allowed_celsius DECIMAL(4,1) NOT NULL DEFAULT 2.0,
    max_allowed_celsius DECIMAL(4,1) NOT NULL DEFAULT 6.0,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    recorded_by VARCHAR(100) NOT NULL,
    alarm_status VARCHAR(30) NOT NULL DEFAULT 'NORMAL' 
        CHECK (alarm_status IN ('NORMAL', 'HIGH_TEMP_ALARM', 'LOW_TEMP_ALARM', 'SENSOR_FAULT')),
    excursion_duration_minutes INT DEFAULT 0 CHECK (excursion_duration_minutes >= 0),
    action_taken TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_temp_tenant ON blood_storage_temperature_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_temp_unit ON blood_storage_temperature_logs(unit_id) WHERE unit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_storage_temp_device ON blood_storage_temperature_logs(storage_device_id, recorded_at);

-- ─── 3. BLOOD CROSSMATCH TESTS (IMMUTABLE UJI SILANG SERASI & EVIDENCE CHAIN) ───
CREATE TABLE IF NOT EXISTS blood_crossmatch_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    test_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    blood_unit_id UUID NOT NULL REFERENCES blood_donor_units(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES clinical_orders(id),
    patient_abo VARCHAR(5) NOT NULL CHECK (patient_abo IN ('A', 'B', 'AB', 'O')),
    patient_rhesus VARCHAR(10) NOT NULL CHECK (patient_rhesus IN ('POSITIVE', 'NEGATIVE')),
    donor_abo VARCHAR(5) NOT NULL CHECK (donor_abo IN ('A', 'B', 'AB', 'O')),
    donor_rhesus VARCHAR(10) NOT NULL CHECK (donor_rhesus IN ('POSITIVE', 'NEGATIVE')),
    antibody_screen VARCHAR(30) NOT NULL DEFAULT 'NEGATIVE' CHECK (antibody_screen IN ('POSITIVE', 'NEGATIVE')),
    major_crossmatch VARCHAR(30) NOT NULL CHECK (major_crossmatch IN ('COMPATIBLE', 'INCOMPATIBLE')),
    minor_crossmatch VARCHAR(30) DEFAULT 'COMPATIBLE' CHECK (minor_crossmatch IN ('COMPATIBLE', 'INCOMPATIBLE')),
    auto_control VARCHAR(30) NOT NULL DEFAULT 'NEGATIVE' CHECK (auto_control IN ('POSITIVE', 'NEGATIVE')),
    overall_compatibility VARCHAR(30) NOT NULL CHECK (overall_compatibility IN ('COMPATIBLE', 'INCOMPATIBLE')),
    technician_id VARCHAR(50) NOT NULL,
    technician_name VARCHAR(100) NOT NULL,
    verified_by_doctor_id VARCHAR(50),
    verified_by_doctor_name VARCHAR(100),
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    finalized_at TIMESTAMP WITH TIME ZONE,
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crossmatch_tenant ON blood_crossmatch_tests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crossmatch_patient ON blood_crossmatch_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_crossmatch_unit ON blood_crossmatch_tests(blood_unit_id);
CREATE INDEX IF NOT EXISTS idx_crossmatch_encounter ON blood_crossmatch_tests(encounter_id);

-- Immutability trigger for finalized crossmatch tests
CREATE OR REPLACE FUNCTION fn_protect_finalized_crossmatch() 
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_finalized = TRUE THEN
        IF (OLD.patient_id <> NEW.patient_id OR 
            OLD.blood_unit_id <> NEW.blood_unit_id OR 
            OLD.overall_compatibility <> NEW.overall_compatibility OR 
            OLD.major_crossmatch <> NEW.major_crossmatch OR 
            OLD.patient_abo <> NEW.patient_abo OR 
            OLD.donor_abo <> NEW.donor_abo) THEN
            RAISE EXCEPTION 'IMMUTABILITY_VIOLATION: Finalized crossmatch record cannot be modified. Create a clinical amendment record instead!';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_finalized_crossmatch ON blood_crossmatch_tests;
CREATE TRIGGER trg_protect_finalized_crossmatch
BEFORE UPDATE ON blood_crossmatch_tests
FOR EACH ROW EXECUTE FUNCTION fn_protect_finalized_crossmatch();

-- ─── 4. BLOOD ISSUE RECORDS (HANDOFF DARI BDRS KE RUANG RAWAT) ───
CREATE TABLE IF NOT EXISTS blood_issue_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    issue_number VARCHAR(30) UNIQUE NOT NULL,
    blood_unit_id UUID NOT NULL REFERENCES blood_donor_units(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    crossmatch_id UUID NOT NULL REFERENCES blood_crossmatch_tests(id) ON DELETE RESTRICT,
    issued_by_id VARCHAR(50) NOT NULL,
    issued_by_name VARCHAR(100) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    received_by_id VARCHAR(50) NOT NULL,
    received_by_name VARCHAR(100) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    temperature_at_issue DECIMAL(4,1) NOT NULL,
    issue_status VARCHAR(30) NOT NULL DEFAULT 'ISSUED' 
        CHECK (issue_status IN ('ISSUED', 'RECEIVED_BY_WARD', 'RETURNED_UNUSED', 'QUARANTINED', 'DISCARDED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_tenant ON blood_issue_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_issue_unit ON blood_issue_records(blood_unit_id);
CREATE INDEX IF NOT EXISTS idx_issue_patient ON blood_issue_records(patient_id);

-- ─── 5. BLOOD TRANSFUSION RECORDS (PELAKSANAAN TRANSFUSI) ───
CREATE TABLE IF NOT EXISTS blood_transfusion_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    transfusion_number VARCHAR(30) UNIQUE NOT NULL,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    blood_unit_id UUID NOT NULL REFERENCES blood_donor_units(id) ON DELETE RESTRICT,
    crossmatch_id UUID NOT NULL REFERENCES blood_crossmatch_tests(id) ON DELETE RESTRICT,
    issue_id UUID REFERENCES blood_issue_records(id) ON DELETE RESTRICT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    initial_vitals JSONB NOT NULL,
    monitoring_15min_vitals JSONB,
    post_vitals JSONB,
    administered_by_nurse VARCHAR(100) NOT NULL,
    witnessed_by_nurse VARCHAR(100) NOT NULL,
    transfusion_status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' 
        CHECK (transfusion_status IN ('IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION', 'CANCELLED')),
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTIAL UNIQUE INDEX: Allows CANCELLED transfusions without permanently blocking reusable units
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_blood_unit_transfusion
ON blood_transfusion_records(tenant_id, blood_unit_id)
WHERE transfusion_status IN ('IN_PROGRESS', 'COMPLETED', 'STOPPED_REACTION');

CREATE INDEX IF NOT EXISTS idx_transfusions_tenant ON blood_transfusion_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfusions_encounter ON blood_transfusion_records(encounter_id);
CREATE INDEX IF NOT EXISTS idx_transfusions_patient ON blood_transfusion_records(patient_id);

-- ─── 6. BEDSIDE VERIFICATION CHECKLIST (MANDATORY 7-POINT SAFETY CHECK) ───
CREATE TABLE IF NOT EXISTS blood_bedside_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    transfusion_id UUID UNIQUE NOT NULL REFERENCES blood_transfusion_records(id) ON DELETE RESTRICT,
    patient_identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    blood_unit_verified BOOLEAN NOT NULL DEFAULT FALSE,
    abo_verified BOOLEAN NOT NULL DEFAULT FALSE,
    rhesus_verified BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_verified BOOLEAN NOT NULL DEFAULT FALSE,
    crossmatch_verified BOOLEAN NOT NULL DEFAULT FALSE,
    informed_consent_verified BOOLEAN NOT NULL DEFAULT FALSE,
    administered_by_nurse_id VARCHAR(50) NOT NULL,
    administered_by_nurse_name VARCHAR(100) NOT NULL,
    witnessed_by_nurse_id VARCHAR(50) NOT NULL,
    witnessed_by_nurse_name VARCHAR(100) NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_all_verifications_true CHECK (
        patient_identity_verified = TRUE AND 
        blood_unit_verified = TRUE AND 
        abo_verified = TRUE AND 
        rhesus_verified = TRUE AND 
        expiry_verified = TRUE AND 
        crossmatch_verified = TRUE AND 
        informed_consent_verified = TRUE
    ),
    CONSTRAINT chk_distinct_nurses CHECK (administered_by_nurse_id <> witnessed_by_nurse_id)
);

CREATE INDEX IF NOT EXISTS idx_bedside_tenant ON blood_bedside_verifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bedside_transfusion ON blood_bedside_verifications(transfusion_id);

-- ─── 7. DATABASE TRIGGER: CLINICAL SAFETY INVARIANT ENFORCEMENT ───
CREATE OR REPLACE FUNCTION fn_enforce_transfusion_safety() 
RETURNS TRIGGER AS $$
DECLARE
    v_unit blood_donor_units%ROWTYPE;
    v_cm blood_crossmatch_tests%ROWTYPE;
BEGIN
    -- Immutability on Core Identity Fields during UPDATE
    IF TG_OP = 'UPDATE' THEN
        IF (OLD.patient_id <> NEW.patient_id OR 
            OLD.blood_unit_id <> NEW.blood_unit_id OR 
            OLD.crossmatch_id <> NEW.crossmatch_id OR 
            OLD.encounter_id <> NEW.encounter_id) THEN
            RAISE EXCEPTION 'IMMUTABILITY_VIOLATION: Patient, blood unit, and crossmatch links on transfusion record are strictly immutable!';
        END IF;
        RETURN NEW;
    END IF;

    -- 1. Fetch & Verify Blood Unit
    SELECT * INTO v_unit FROM blood_donor_units WHERE id = NEW.blood_unit_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SAFETY_VIOLATION: Blood unit % not found.', NEW.blood_unit_id;
    END IF;

    -- 2. Expiry Safety Barrier
    IF v_unit.expiry_date <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'SAFETY_VIOLATION: Blood unit % is EXPIRED (Expiry: %). Transfusion forbidden!', v_unit.unit_number, v_unit.expiry_date;
    END IF;

    -- 3. Screening Status Barrier
    IF v_unit.screening_status <> 'NON_REACTIVE' THEN
        RAISE EXCEPTION 'SAFETY_VIOLATION: Blood unit % has reactive/pending screening (%). Transfusion forbidden!', v_unit.unit_number, v_unit.screening_status;
    END IF;

    -- 4. Reservation Ownership Barrier
    IF v_unit.reserved_for_patient_id IS NOT NULL AND v_unit.reserved_for_patient_id <> NEW.patient_id THEN
        RAISE EXCEPTION 'SAFETY_VIOLATION: Blood unit % is reserved for patient %, but attempted transfusion to patient %!', v_unit.unit_number, v_unit.reserved_for_patient_id, NEW.patient_id;
    END IF;

    -- 5. Fetch & Verify Crossmatch Test
    SELECT * INTO v_cm FROM blood_crossmatch_tests WHERE id = NEW.crossmatch_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SAFETY_VIOLATION: Crossmatch record % not found.', NEW.crossmatch_id;
    END IF;

    -- 6. Crossmatch Compatibility Barrier
    IF v_cm.overall_compatibility <> 'COMPATIBLE' THEN
        RAISE EXCEPTION 'SAFETY_VIOLATION: Crossmatch result is % for unit %. Transfusion BLOCKED by database engine!', v_cm.overall_compatibility, v_unit.unit_number;
    END IF;

    -- 7. Crossmatch Patient-Unit Matching Integrity
    IF v_cm.blood_unit_id <> NEW.blood_unit_id OR v_cm.patient_id <> NEW.patient_id THEN
        RAISE EXCEPTION 'SAFETY_VIOLATION: Crossmatch test mismatch with transfusion patient or blood unit!';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_transfusion_safety ON blood_transfusion_records;
CREATE TRIGGER trg_enforce_transfusion_safety
BEFORE INSERT OR UPDATE ON blood_transfusion_records
FOR EACH ROW EXECUTE FUNCTION fn_enforce_transfusion_safety();

-- ─── 8. TRANSFUSION REACTION LOGS (HEMOVIGILANCE & REACTION TRACKING) ───
CREATE TABLE IF NOT EXISTS transfusion_reaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_organizations(id) ON DELETE RESTRICT,
    transfusion_id UUID NOT NULL REFERENCES blood_transfusion_records(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES master_patients(id) ON DELETE RESTRICT,
    reaction_type VARCHAR(50) NOT NULL 
        CHECK (reaction_type IN ('FEBRILE_NON_HEMOLYTIC', 'ALLERGIC_URTICARIA', 'ACUTE_HEMOLYTIC', 'ANAPHYLACTIC', 'TRALI', 'TACO', 'SEPTIC', 'DELAYED_HEMOLYTIC')),
    severity VARCHAR(30) NOT NULL CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING', 'FATAL')),
    symptoms_description TEXT NOT NULL,
    interventions_taken TEXT NOT NULL,
    reported_to_bdrs_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    doctor_in_charge VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactions_tenant ON transfusion_reaction_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reactions_transfusion ON transfusion_reaction_logs(transfusion_id);
CREATE INDEX IF NOT EXISTS idx_reactions_patient ON transfusion_reaction_logs(patient_id);

-- ─── 9. PHYSICAL ROW-LEVEL SECURITY (RLS) FOR BLOOD BANK DOMAIN ───
DO $$
DECLARE
    tbl TEXT;
    blood_tables TEXT[] := ARRAY[
        'blood_donor_units',
        'blood_storage_temperature_logs',
        'blood_crossmatch_tests',
        'blood_issue_records',
        'blood_transfusion_records',
        'blood_bedside_verifications',
        'transfusion_reaction_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY blood_tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (tenant_id = current_app_tenant_id()) WITH CHECK (tenant_id = current_app_tenant_id());', tbl);
    END LOOP;
END $$;
