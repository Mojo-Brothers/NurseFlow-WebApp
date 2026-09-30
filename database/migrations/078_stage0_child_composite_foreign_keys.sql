-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 078
-- Stage 0 Security Foundation: Child Composite Foreign Keys & Tenant Ownership
-- Target Tables:
--   1. medication_emar_administrations
--   2. medication_dispense_allocations
--   3. longitudinal_care_plans
--   4. patient_split_invoices
--   5. physician_diagnostic_interpretations
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
  has_col boolean;
  row_count integer;
  orphan_count integer;
BEGIN
  FOREACH tbl IN ARRAY child_tables LOOP
    -- 1. Check if table exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      RAISE EXCEPTION 'MIGRATION_078_ERROR: Table % does not exist in public schema', tbl;
    END IF;

    -- 2. Check if tenant_id column already exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
    ) INTO has_col;

    EXECUTE format('SELECT count(*) FROM %I', tbl) INTO row_count;

    -- If rows exist and tenant_id does not exist, attempt backfill from encounters
    IF NOT has_col THEN
      IF row_count > 0 THEN
        -- Add nullable first to allow backfill
        EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id uuid', tbl);
        EXECUTE format('
          UPDATE %I c 
          SET tenant_id = e.tenant_id 
          FROM encounters e 
          WHERE c.encounter_id = e.id
        ', tbl);
        
        -- Check if any NULL tenant_id remains
        EXECUTE format('SELECT count(*) FROM %I WHERE tenant_id IS NULL', tbl) INTO orphan_count;
        IF orphan_count > 0 THEN
          RAISE EXCEPTION 'MIGRATION_078_PRECONDITION_FAILED: % rows in % could not be mapped to an encounter tenant_id', orphan_count, tbl;
        END IF;

        EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', tbl);
      ELSE
        EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id uuid NOT NULL', tbl);
      END IF;
    ELSE
      -- tenant_id already exists, ensure it is NOT NULL
      EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET NOT NULL', tbl);
    END IF;

    -- Set fail-closed dynamic tenant default (inherits app.current_tenant_id from UoW)
    EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid', tbl);

    -- 3. Verify referential integrity preconditions
    IF row_count > 0 THEN
      -- Verify encounter composite integrity
      EXECUTE format('
        SELECT count(*) FROM %I c
        WHERE NOT EXISTS (
          SELECT 1 FROM encounters e WHERE e.id = c.encounter_id AND e.tenant_id = c.tenant_id
        )
      ', tbl) INTO orphan_count;
      IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION_078_PRECONDITION_FAILED: % orphan rows in % violate encounter composite foreign key', orphan_count, tbl;
      END IF;

      -- Verify patient composite integrity
      EXECUTE format('
        SELECT count(*) FROM %I c
        WHERE NOT EXISTS (
          SELECT 1 FROM master_patients p WHERE p.id = c.patient_id AND p.tenant_id = c.tenant_id
        )
      ', tbl) INTO orphan_count;
      IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION_078_PRECONDITION_FAILED: % orphan rows in % violate patient composite foreign key', orphan_count, tbl;
      END IF;
    END IF;

    -- 4. Create Composite Foreign Key to encounters(id, tenant_id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_' || tbl || '_enc_tenant'
    ) THEN
      EXECUTE format('
        ALTER TABLE %I 
          ADD CONSTRAINT %I 
          FOREIGN KEY (encounter_id, tenant_id) 
          REFERENCES encounters(id, tenant_id) 
          ON DELETE RESTRICT
      ', tbl, 'fk_' || tbl || '_enc_tenant');
    END IF;

    -- 5. Create Composite Foreign Key to master_patients(id, tenant_id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_' || tbl || '_pat_tenant'
    ) THEN
      EXECUTE format('
        ALTER TABLE %I 
          ADD CONSTRAINT %I 
          FOREIGN KEY (patient_id, tenant_id) 
          REFERENCES master_patients(id, tenant_id) 
          ON DELETE RESTRICT
      ', tbl, 'fk_' || tbl || '_pat_tenant');
    END IF;

    -- 6. Create Covering Composite Indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (tenant_id)', 'idx_' || tbl || '_tenant_id', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (encounter_id, tenant_id)', 'idx_' || tbl || '_enc_tenant', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (patient_id, tenant_id)', 'idx_' || tbl || '_pat_tenant', tbl);

    RAISE NOTICE 'Migration 078: Successfully configured composite FKs and indexes on %', tbl;
  END LOOP;
END $$;
