-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Rollback Migration 077
-- Stage 0 Security Foundation: Rollback Parent Composite Uniqueness
-- ==============================================================================

DO $$
BEGIN
  ALTER TABLE encounters DROP CONSTRAINT IF EXISTS uq_encounters_id_tenant;
  ALTER TABLE master_patients DROP CONSTRAINT IF EXISTS uq_master_patients_id_tenant;
  RAISE NOTICE 'Rollback 077: Dropped parent composite UNIQUE constraints successfully';
END $$;
