-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Rollback Migration 078
-- Stage 0 Security Foundation: Rollback Child Composite Foreign Keys & Columns
-- ==============================================================================

DO $$
DECLARE
  tbl text;
  child_tables text[] := ARRAY[
    'medication_emar_administrations',
    'medication_dispense_allocations',
    'longitudinal_care_plans',
    'patient_split_invoices',
    'physician_diagnostic_interpretations'
  ];
BEGIN
  FOREACH tbl IN ARRAY child_tables LOOP
    -- 1. Drop foreign key constraints
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', tbl, 'fk_' || tbl || '_enc_tenant');
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', tbl, 'fk_' || tbl || '_pat_tenant');

    -- 2. Drop covering indexes
    EXECUTE format('DROP INDEX IF EXISTS %I', 'idx_' || tbl || '_enc_tenant');
    EXECUTE format('DROP INDEX IF EXISTS %I', 'idx_' || tbl || '_pat_tenant');
    EXECUTE format('DROP INDEX IF EXISTS %I', 'idx_' || tbl || '_tenant_id');

    -- 3. Drop tenant_id column (CASCADE ensures dependent triggers or views are cleaned if any)
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS tenant_id CASCADE', tbl);

    RAISE NOTICE 'Rollback 078: Successfully removed composite FKs and tenant_id from %', tbl;
  END LOOP;
END $$;
