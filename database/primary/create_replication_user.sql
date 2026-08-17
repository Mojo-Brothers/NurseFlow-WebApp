-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Replication Role & Privileges Script
-- Standard: PostgreSQL 16 Streaming Replication & ISO 27001 Least Privilege
-- ==============================================================================

-- 1. Create dedicated replicator role with replication privileges
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'replicator') THEN
    CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'his_replicator_secure_token_2026';
    RAISE NOTICE 'Role replicator created successfully.';
  ELSE
    RAISE NOTICE 'Role replicator already exists.';
  END IF;
END $$;

-- 2. Create physical replication slot for Standby Server
SELECT pg_create_physical_replication_slot('standby_slot_1')
WHERE NOT EXISTS (
  SELECT 1 FROM pg_replication_slots WHERE slot_name = 'standby_slot_1'
);

-- 3. Verify replication slot status
SELECT slot_name, plugin, slot_type, active, wal_status 
FROM pg_replication_slots;
