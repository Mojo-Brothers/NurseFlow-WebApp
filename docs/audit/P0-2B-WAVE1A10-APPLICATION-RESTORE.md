# NURSEFLOW — P0-2B WAVE 1A.10 APPLICATION RESTORE AUDIT
## LOGICAL RESTORE & APPLICATION RUNTIME SMOKE TEST

### 1. Methodology & Boundary
- **Capability:** Logical custom-format backup (`pg_dump -Fc`) and restore (`pg_restore --clean`).
- **Terminology Notice:** Strictly classified as **Logical Backup & Restore** (not physical block-level streaming backup).
- **Target Restored DB:** `nurseflow_restored_smoke` (disposable verification database).

### 2. Execution Sequence
1. Created compressed custom-format dump of `nurseflow_enterprise_his` (`scratch/dev_backup_smoke.dump`).
2. Created fresh target database `nurseflow_restored_smoke`.
3. Executed `pg_restore` to populate schema, constraints, indexes, RLS policies, and clinical data.
4. Granted least-privilege runtime permissions to `nurseflow_app_user` on `nurseflow_restored_smoke`.
5. Connected application client pool using `nurseflow_app_user` against `nurseflow_restored_smoke`.
6. Executed Unit of Work queries:
   - Tenant A query: Verified 5,068 encounters and 5,126 patients intact.
   - Tenant B query: Verified 36 encounters intact.
   - Cross-tenant RLS isolation: Verified intact.
7. Cleaned up disposable restore database.

### 3. Verdict
```text
DATABASE_RESTORE:
PASS

APPLICATION_RESTORE_SMOKE:
PASS
```
Both the physical schema/data restoration and application-level UoW runtime against the restored database have been successfully demonstrated with zero defects.
