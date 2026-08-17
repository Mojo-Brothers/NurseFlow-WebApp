#!/bin/bash
# ==============================================================================
# NurseFlow Enterprise HIS 2026 — Primary Database Setup Script
# Standard: PostgreSQL 16 Streaming Replication Master Node
# ==============================================================================

set -e

echo "[Primary Setup] Initializing Primary Node Configuration..."

# 1. Apply postgresql.conf and pg_hba.conf
cp /etc/postgresql/postgresql.conf /var/lib/postgresql/data/postgresql.conf
cp /etc/postgresql/pg_hba.conf /var/lib/postgresql/data/pg_hba.conf

# 2. Reload PostgreSQL Configuration
psql -U his_admin -d nurseflow_enterprise_his -c "SELECT pg_reload_conf();"

# 3. Create Replication Role & Replication Slot
psql -U his_admin -d nurseflow_enterprise_his -f /scripts/create_replication_user.sql

echo "[Primary Setup] ✓ Primary PostgreSQL Node is ready and accepting streaming replication clients."
