-- ==============================================================================
-- NurseFlow Enterprise HIS 2026 — Migration 073
-- Reconcile Canonical Authentication & Identity Schema Constraints (P0 Foundation)
-- Standard: OWASP ASVS 4.0, JCI Information Governance
-- NOTE: Credentials provisioning is separated into scripts/provision_dev_credentials.mjs (DEV ONLY)
-- ==============================================================================

BEGIN;

-- 1. Ensure performance & integrity indices on auth_users & auth_user_roles
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_staff_id ON auth_users(staff_id);
CREATE INDEX IF NOT EXISTS idx_auth_user_roles_user ON auth_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_user_roles_role ON auth_user_roles(role_id);

-- 2. Ensure canonical clinical emergency role exists in auth_roles
INSERT INTO auth_roles (
  id, tenant_id, role_code, role_name, description, status, version, is_deleted, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000000007',
  '10000000-0000-0000-0000-000000000001',
  'ROLE_DOCTOR_EMERGENCY',
  'Dokter Jaga IGD (Emergency Physician)',
  'Akses Triase IGD, Resusitasi Kritis, Order CPOE Akut & Transfer Ranap',
  'ACTIVE',
  1,
  FALSE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role_code = EXCLUDED.role_code,
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description;

-- 3. Strict Separation of Duties: Revoke ROLE_SUPER_ADMIN from clinical identity dr.siti.wijaya
DELETE FROM auth_user_roles
WHERE user_id = 'd0000000-0000-0000-0000-000000000001'
  AND role_id = 'c0000000-0000-0000-0000-000000000001';

-- Ensure dr.siti.wijaya has ROLE_DOCTOR_DPJP
INSERT INTO auth_user_roles (id, user_id, role_id, assigned_at)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000002',
  NOW()
) ON CONFLICT ON CONSTRAINT uq_user_role_assignment DO NOTHING;

-- Ensure dr.budi.santoso has ROLE_DOCTOR_EMERGENCY (replace previous DPJP if mapped)
DELETE FROM auth_user_roles
WHERE user_id = 'd0000000-0000-0000-0000-000000000002'
  AND role_id = 'c0000000-0000-0000-0000-000000000002';

INSERT INTO auth_user_roles (id, user_id, role_id, assigned_at)
VALUES (
  'e0000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000007',
  NOW()
) ON CONFLICT ON CONSTRAINT uq_user_role_assignment DO NOTHING;

-- 4. Create dedicated IT Administrator in master_staff for Development Governance
INSERT INTO master_staff (
  id, tenant_id, organization_id, staff_category_id, employee_number, nik, full_name,
  gender_code, religion_id, marital_status_code, birth_date, email, phone, status, version, is_deleted, created_at, updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000099',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  'EMP-IT-DEV-001',
  '3171019999990001',
  'Dev IT Administrator, S.Kom',
  'MALE',
  1,
  'M',
  '1990-01-01',
  'admin.dev@nurseflow.id',
  '081199990099',
  'ACTIVE',
  1,
  FALSE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Create dedicated dev administrator user in auth_users
INSERT INTO auth_users (
  id, tenant_id, staff_id, username, password_hash, is_active, status, failed_login_attempts, is_deleted, created_at, updated_at
) VALUES (
  'd0000000-0000-0000-0000-000000000099',
  '10000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000099',
  'admin.dev',
  'PENDING_INITIAL_BOOTSTRAP',
  TRUE,
  'ACTIVE',
  0,
  FALSE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 6. Assign ROLE_SUPER_ADMIN exclusively to admin.dev
INSERT INTO auth_user_roles (id, user_id, role_id, assigned_at)
VALUES (
  'e0000000-0000-0000-0000-000000000099',
  'd0000000-0000-0000-0000-000000000099',
  'c0000000-0000-0000-0000-000000000001',
  NOW()
) ON CONFLICT ON CONSTRAINT uq_user_role_assignment DO NOTHING;

COMMIT;
