-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 077
-- Stage 0 Security Foundation: Parent Composite Uniqueness
-- Standards: ISO/IEC 27001 Multi-Tenancy Data Isolation, HIPAA Technical Safeguards
-- ==============================================================================

DO $$
BEGIN
  -- 1. Precondition Verification: encounters
  IF EXISTS (
    SELECT 1 FROM encounters WHERE id IS NULL OR tenant_id IS NULL
  ) THEN
    RAISE EXCEPTION 'MIGRATION_077_PRECONDITION_FAILED: NULL id or tenant_id found in encounters';
  END IF;

  IF EXISTS (
    SELECT 1 FROM encounters GROUP BY id, tenant_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'MIGRATION_077_PRECONDITION_FAILED: Duplicate (id, tenant_id) pairs found in encounters';
  END IF;

  -- 2. Precondition Verification: master_patients
  IF EXISTS (
    SELECT 1 FROM master_patients WHERE id IS NULL OR tenant_id IS NULL
  ) THEN
    RAISE EXCEPTION 'MIGRATION_077_PRECONDITION_FAILED: NULL id or tenant_id found in master_patients';
  END IF;

  IF EXISTS (
    SELECT 1 FROM master_patients GROUP BY id, tenant_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'MIGRATION_077_PRECONDITION_FAILED: Duplicate (id, tenant_id) pairs found in master_patients';
  END IF;

  -- 3. Apply Composite UNIQUE Constraint on encounters
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_encounters_id_tenant'
  ) THEN
    ALTER TABLE encounters 
      ADD CONSTRAINT uq_encounters_id_tenant UNIQUE (id, tenant_id);
    RAISE NOTICE 'Constraint uq_encounters_id_tenant created successfully';
  END IF;

  -- 4. Apply Composite UNIQUE Constraint on master_patients
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_master_patients_id_tenant'
  ) THEN
    ALTER TABLE master_patients 
      ADD CONSTRAINT uq_master_patients_id_tenant UNIQUE (id, tenant_id);
    RAISE NOTICE 'Constraint uq_master_patients_id_tenant created successfully';
  END IF;

END $$;
