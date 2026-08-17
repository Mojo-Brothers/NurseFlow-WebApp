#!/bin/bash
# ==============================================================================
# NurseFlow Enterprise HIS 2026 — Standby Replica Setup Script
# Standard: Hot Standby Streaming Replication with pg_basebackup
# ==============================================================================

set -e

PRIMARY_HOST="${PRIMARY_HOST:-postgres-primary}"
PRIMARY_PORT="${PRIMARY_PORT:-5432}"
REPLICATOR_USER="${REPLICATOR_USER:-replicator}"
REPLICATOR_PASS="${REPLICATOR_PASSWORD:-his_replicator_secure_token_2026}"
PGDATA="/var/lib/postgresql/data"

echo "[Standby Setup] Initializing Standby Replica from Primary ($PRIMARY_HOST:$PRIMARY_PORT)..."

# 1. Wait for Primary to become healthy
until pg_isready -h "$PRIMARY_HOST" -p "$PRIMARY_PORT" -U "$REPLICATOR_USER"; do
  echo "[Standby Setup] Waiting for Primary node to accept connections..."
  sleep 2
done

# 2. Clean data directory before basebackup
rm -rf "${PGDATA:?}"/*

# 3. Pull Base Backup from Primary with Streaming Replication Config (-R flag)
PGPASSWORD="$REPLICATOR_PASS" pg_basebackup \
  -h "$PRIMARY_HOST" \
  -p "$PRIMARY_PORT" \
  -U "$REPLICATOR_USER" \
  -D "$PGDATA" \
  -Fp \
  -Xs \
  -P \
  -R \
  -S standby_slot_1

# 4. Explicitly ensure standby.signal exists for PostgreSQL 16
touch "$PGDATA/standby.signal"

echo "[Standby Setup] ✓ Standby node initialized and synchronized with Primary node."
