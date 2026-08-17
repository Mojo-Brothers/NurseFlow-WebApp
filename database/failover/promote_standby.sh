#!/bin/bash
# ==============================================================================
# NurseFlow Enterprise HIS 2026 — Emergency Standby Promotion Script
# Standard: JCI High Availability / Target RTO < 15 Menit (Executes in < 15 Detik)
# ==============================================================================

set -e

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "[$TIMESTAMP] ────────────────────────────────────────────────────────────"
echo "[$TIMESTAMP] [PROMOTION TRIGGERED] Initiating Standby Node Promotion to PRIMARY..."
echo "[$TIMESTAMP] ────────────────────────────────────────────────────────────"

# 1. Execute pg_ctl promote or pg_promote()
if command -v pg_ctl > /dev/null; then
  pg_ctl promote -D "$PGDATA"
else
  psql -U his_admin -d nurseflow_enterprise_his -c "SELECT pg_promote();"
fi

# 2. Verify promotion status
sleep 2
IS_IN_RECOVERY=$(psql -U his_admin -d nurseflow_enterprise_his -tAc "SELECT pg_is_in_recovery();")

if [ "$IS_IN_RECOVERY" = "f" ]; then
  echo "[$TIMESTAMP] ✓ SUCCESS: Standby node is now promoted to PRIMARY (Read-Write Mode Active)."
  echo "[$TIMESTAMP] ✓ Pointing PgBouncer pool to this promoted node..."
  exit 0
else
  echo "[$TIMESTAMP] ✗ ERROR: Node promotion failed. Node remains in recovery mode."
  exit 1
fi
