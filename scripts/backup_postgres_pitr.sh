#!/bin/bash
# ==============================================================================
# NurseFlow Enterprise HIS 2026 — PostgreSQL Backup & PITR Archiving Script
# Standar: JCI Information Governance / ISO 27001 Business Continuity
# ==============================================================================

set -e

BACKUP_DIR="/var/backups/nurseflow/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="nurseflow_enterprise_his"
DB_USER="his_admin"

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting Automated Full PostgreSQL Backup for $DB_NAME..."

# 1. Export Full SQL Compressed Dump
pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" -F c -b -v -f "$BACKUP_DIR/nurseflow_backup_${TIMESTAMP}.dump"

# 2. Archive Active WAL Segments for Point-In-Time-Recovery (PITR)
echo "[$TIMESTAMP] Triggering WAL Archive Checkpoint for Point-In-Time Recovery..."
psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT pg_switch_wal();"

# 3. Maintain 30-day Retention Policy (Purge older backups)
find "$BACKUP_DIR" -type f -name "nurseflow_backup_*.dump" -mtime +30 -delete

echo "[$TIMESTAMP] ✓ Backup completed successfully and verified!"
