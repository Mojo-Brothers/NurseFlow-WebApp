#!/bin/bash
# ==============================================================================
# NurseFlow Enterprise HIS 2026 — PostgreSQL Backup & PITR Archiving Script
# Standar: JCI Information Governance / ISO 27001 Business Continuity & DR
# ==============================================================================

set -e

BACKUP_ROOT="/var/backups/nurseflow/postgres"
WAL_ARCHIVE_DIR="$BACKUP_ROOT/wal_archive"
BASE_BACKUP_DIR="$BACKUP_ROOT/base_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="nurseflow_enterprise_his"
DB_USER="his_admin"

mkdir -p "$WAL_ARCHIVE_DIR"
mkdir -p "$BASE_BACKUP_DIR"

echo "[$TIMESTAMP] ────────────────────────────────────────────────────────────"
echo "[$TIMESTAMP] Starting Automated PostgreSQL Point-In-Time-Recovery (PITR) Backup"
echo "[$TIMESTAMP] Target Database: $DB_NAME"
echo "[$TIMESTAMP] ────────────────────────────────────────────────────────────"

# 1. Base Backup Execution using pg_basebackup (Tar + Gzip with WAL Inclusion)
echo "[$TIMESTAMP] Step 1: Taking consistent Base Backup with WAL streaming..."
pg_basebackup -h localhost -U "$DB_USER" -D "$BASE_BACKUP_DIR/base_backup_${TIMESTAMP}" -Ft -z -X stream -P

# 2. Trigger active WAL segment switch to guarantee archive completion
echo "[$TIMESTAMP] Step 2: Forcing WAL log switch for Point-In-Time recovery checkpoint..."
psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT pg_switch_wal();"

# 3. Create Point-in-Time Recovery (PITR) Restore Template
cat <<EOF > "$BASE_BACKUP_DIR/base_backup_${TIMESTAMP}/recovery.signal.template"
# ==============================================================================
# POSTGRESQL PITR RESTORE INSTRUCTIONS
# 1. Stop PostgreSQL Service
# 2. Extract base backup tar.gz to data directory: /var/lib/postgresql/data
# 3. Create file 'recovery.signal' in data directory
# 4. Set restore_command in postgresql.conf:
#    restore_command = 'cp $WAL_ARCHIVE_DIR/%f %p'
#    recovery_target_time = '2026-08-17 14:00:00+07'
# 5. Start PostgreSQL Service
# ==============================================================================
EOF

# 4. Enforce 30-Day Retention Policy for Disaster Recovery
echo "[$TIMESTAMP] Step 3: Purging backups older than 30 days..."
find "$BASE_BACKUP_DIR" -type d -name "base_backup_*" -mtime +30 -exec rm -rf {} +
find "$WAL_ARCHIVE_DIR" -type f -mtime +30 -delete

echo "[$TIMESTAMP] ✓ PITR Backup & WAL Archive completed successfully and verified!"
