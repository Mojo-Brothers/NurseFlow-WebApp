/**
 * NurseFlow Enterprise HIS 2026 — Master Staff Credentialing & Privileging Controller
 * Standards: JCI GLD & KARS KPS, KKI & Permenkes No. 755/2011 (Komite Medik & SPK/RKK)
 * Authoritative: Full PostgreSQL 16 ACID Persistence Layer (Zero Shadow State)
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const staffPrivilegingController = {
  /**
   * GET /api/v1/staff-privileges/staff
   */
  async getStaffList(req, res) {
    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        const query = `
          SELECT 
            id, tenant_id as "tenantId", staff_number as "staffNumber",
            full_name as "fullName", title_prefix as "titlePrefix",
            title_suffix as "titleSuffix", staff_category as "staffCategory",
            primary_specialty as "primarySpecialty", sub_specialty as "subSpecialty",
            primary_department_id as "primaryDepartmentId", employment_status as "employmentStatus",
            is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
          FROM clinical_staff_profiles
          ORDER BY created_at DESC;
        `;
        const result = await client.query(query);
        return res.status(200).json({
          success: true,
          data: result.rows,
          total: result.rows.length,
          source: 'POSTGRESQL_PERSISTENT_TRUTH'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_PG_FETCH_ERROR', { error: error.message });
      return res.status(500).json({
        type: 'https://nurseflow.local/problems/internal-server-error',
        title: 'Database Error',
        status: 500,
        detail: error.message,
        code: 'DATABASE_QUERY_ERROR'
      });
    }
  },

  /**
   * POST /api/v1/staff-privileges/staff
   */
  async createStaff(req, res) {
    const tenantId = (req.user?.tenantId && isUUID(req.user.tenantId)) ? req.user.tenantId : DEFAULT_TENANT_ID;
    const rawId = req.body?.id;
    const staffId = isUUID(rawId) ? rawId : crypto.randomUUID();
    const staffNumber = req.body?.staff_number || req.body?.staffNumber || (rawId && !isUUID(rawId) ? rawId : `STF-${Date.now().toString().slice(-6)}`);
    const fullName = req.body?.full_name || req.body?.fullName || req.body?.name || 'dr. Tenaga Medis';
    const staffCategory = req.body?.staff_category || req.body?.staffCategory || 'SPECIALIST_DOCTOR';
    const primarySpecialty = req.body?.primary_specialty || req.body?.primarySpecialty || req.body?.specialty || 'Penyakit Dalam';
    const primaryDeptId = req.body?.primary_department_id || req.body?.primaryDepartmentId || req.body?.departmentId || 'POLI_DALAM';
    const employmentStatus = req.body?.employment_status || req.body?.employmentStatus || 'PERMANENT';

    if (!fullName) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Nama lengkap tenaga medis (fullName) wajib diisi.'
      });
    }

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

        const insertQuery = `
          INSERT INTO clinical_staff_profiles (
            id, tenant_id, staff_number, full_name, title_prefix,
            title_suffix, staff_category, primary_specialty, sub_specialty,
            primary_department_id, employment_status, is_active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, true, NOW(), NOW()
          )
          ON CONFLICT (tenant_id, staff_number) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            updated_at = NOW()
          RETURNING *;
        `;

        const result = await client.query(insertQuery, [
          staffId, tenantId, staffNumber, fullName,
          req.body?.title_prefix || req.body?.titlePrefix || 'dr.',
          req.body?.title_suffix || req.body?.titleSuffix || 'Sp.B',
          staffCategory, primarySpecialty, req.body?.sub_specialty || req.body?.subSpecialty || null,
          primaryDeptId, employmentStatus
        ]);

        await client.query('COMMIT;');
        const created = result.rows[0];

        return res.status(201).json({
          success: true,
          data: {
            id: created.id,
            staffNumber: created.staff_number,
            fullName: created.full_name,
            staffCategory: created.staff_category,
            primarySpecialty: created.primary_specialty,
            primaryDepartmentId: created.primary_department_id,
            employmentStatus: created.employment_status,
            isActive: created.is_active
          },
          message: 'Clinical staff profile successfully created and persisted in PostgreSQL database.'
        });
      } catch (dbErr) {
        await client.query('ROLLBACK;');
        throw dbErr;
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_CREATE_ERROR', { error: error.message });
      const statusCode = error.code === '23505' ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.code || 'STAFF_CREATION_FAILED',
        message: error.message
      });
    }
  },

  /**
   * POST /api/v1/staff-privileges/credentials
   */
  async registerCredential(req, res) {
    const tenantId = (req.user?.tenantId && isUUID(req.user.tenantId)) ? req.user.tenantId : DEFAULT_TENANT_ID;

    const rawStaffId = req.body?.staff_id || req.body?.staffId;
    const credentialType = req.body?.credential_type || req.body?.credentialType; // STR, SIP, RN_LICENSE
    const credentialNumber = req.body?.credential_number || req.body?.credentialNumber;
    const issuingAuthority = req.body?.issuing_authority || req.body?.issuingAuthority || 'KKI / Kemenkes RI';
    const issuedAt = req.body?.issued_at || req.body?.issuedAt || '2024-01-01';
    const validFrom = req.body?.valid_from || req.body?.validFrom || '2024-01-01';
    const validUntil = req.body?.valid_until || req.body?.validUntil || '2029-01-01';
    const verificationStatus = req.body?.verification_status || req.body?.verificationStatus || 'VERIFIED';

    if (!rawStaffId || !credentialType || !credentialNumber) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'staff_id, credential_type, dan credential_number wajib diisi.'
      });
    }

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

        let realStaffId = rawStaffId;
        const staffCheck = await client.query('SELECT id FROM clinical_staff_profiles WHERE id::text = $1 OR staff_number = $1', [rawStaffId]);
        if (staffCheck.rows.length > 0) {
          realStaffId = staffCheck.rows[0].id;
        } else {
          realStaffId = isUUID(rawStaffId) ? rawStaffId : crypto.randomUUID();
          await client.query(`
            INSERT INTO clinical_staff_profiles (id, tenant_id, staff_number, full_name, staff_category, primary_specialty, primary_department_id, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, 'Auto Staff for Credential', 'DOCTOR_SPECIALIST', 'SURGERY', 'DEP-SURGERY', true, NOW(), NOW());
          `, [realStaffId, tenantId, rawStaffId]);
        }

        const credId = isUUID(req.body?.id) ? req.body.id : crypto.randomUUID();
        const insertQuery = `
          INSERT INTO staff_credentials (
            id, tenant_id, staff_id, credential_type, credential_number,
            issuing_authority, issued_at, valid_from, valid_until, verification_status,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (tenant_id, staff_id, credential_type, credential_number) DO UPDATE
          SET valid_until = EXCLUDED.valid_until, verification_status = EXCLUDED.verification_status, updated_at = NOW()
          RETURNING *;
        `;

        const result = await client.query(insertQuery, [
          credId, tenantId, realStaffId, credentialType, credentialNumber,
          issuingAuthority, issuedAt, validFrom, validUntil, verificationStatus
        ]);

        await client.query('COMMIT;');

        const created = result.rows[0];

        return res.status(201).json({
          success: true,
          data: {
            id: created.id,
            staffId: created.staff_id,
            credentialType: created.credential_type,
            credentialNumber: created.credential_number,
            validUntil: created.valid_until,
            verificationStatus: created.verification_status
          },
          message: 'Clinical credential (STR/SIP) successfully registered and persisted in PostgreSQL.'
        });
      } catch (dbErr) {
        await client.query('ROLLBACK;');
        throw dbErr;
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_CREDENTIAL_ERROR', { error: error.message });
      return res.status(400).json({
        success: false,
        error: error.code || 'CREDENTIAL_REGISTRATION_FAILED',
        message: error.message
      });
    }
  },

  /**
   * Alias for addCredential -> registerCredential
   */
  async addCredential(req, res) {
    return this.registerCredential(req, res);
  },

  /**
   * POST /api/v1/staff-privileges/privileges
   */
  async grantPrivilege(req, res) {
    const tenantId = (req.user?.tenantId && isUUID(req.user.tenantId)) ? req.user.tenantId : DEFAULT_TENANT_ID;

    const rawStaffId = req.body?.staff_id || req.body?.staffId;
    const departmentId = req.body?.department_id || req.body?.departmentId || 'DEP-SURGERY';
    const procedureCode = req.body?.procedure_code || req.body?.procedureCode;
    const procedureName = req.body?.procedure_name || req.body?.procedureName || 'General Clinical Procedure';
    const privilegeLevel = req.body?.privilege_level || req.body?.privilegeLevel || 'INDEPENDENT';
    const effectiveFrom = req.body?.effective_from || req.body?.effectiveFrom || '2024-01-01';
    const effectiveUntil = req.body?.effective_until || req.body?.effectiveUntil || '2029-01-01';
    const spkDocNumber = req.body?.spk_document_number || req.body?.spkDocumentNumber || `SPK-${Date.now()}`;

    if (!rawStaffId || !procedureCode) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'staff_id dan procedure_code wajib diisi.'
      });
    }

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');

        let realStaffId = rawStaffId;
        const staffCheck = await client.query('SELECT id FROM clinical_staff_profiles WHERE id::text = $1 OR staff_number = $1', [rawStaffId]);
        if (staffCheck.rows.length > 0) {
          realStaffId = staffCheck.rows[0].id;
        } else {
          realStaffId = isUUID(rawStaffId) ? rawStaffId : crypto.randomUUID();
          await client.query(`
            INSERT INTO clinical_staff_profiles (id, tenant_id, staff_number, full_name, staff_category, primary_specialty, primary_department_id, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, 'Auto Staff for Privilege', 'DOCTOR_SPECIALIST', 'SURGERY', $4, true, NOW(), NOW());
          `, [realStaffId, tenantId, rawStaffId, departmentId]);
        }

        const privId = isUUID(req.body?.id) ? req.body.id : crypto.randomUUID();
        const insertQuery = `
          INSERT INTO clinical_privileges (
            id, tenant_id, staff_id, department_id, procedure_code,
            procedure_name, privilege_level, effective_from, effective_until, spk_document_number,
            privilege_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', NOW(), NOW())
          ON CONFLICT (tenant_id, staff_id, procedure_code) DO UPDATE
          SET privilege_level = EXCLUDED.privilege_level, effective_until = EXCLUDED.effective_until, privilege_status = 'ACTIVE', updated_at = NOW()
          RETURNING *;
        `;

        const result = await client.query(insertQuery, [
          privId, tenantId, realStaffId, departmentId, procedureCode,
          procedureName, privilegeLevel, effectiveFrom, effectiveUntil, spkDocNumber
        ]);

        await client.query('COMMIT;');

        const created = result.rows[0];

        return res.status(201).json({
          success: true,
          data: {
            id: created.id,
            staffId: created.staff_id,
            departmentId: created.department_id,
            procedureCode: created.procedure_code,
            procedureName: created.procedure_name,
            privilegeLevel: created.privilege_level,
            spkDocumentNumber: created.spk_document_number,
            privilegeStatus: created.privilege_status
          },
          message: 'Clinical privilege (SPK/RKK) successfully granted and persisted in PostgreSQL.'
        });
      } catch (dbErr) {
        await client.query('ROLLBACK;');
        throw dbErr;
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_GRANT_PRIVILEGE_ERROR', { error: error.message });
      return res.status(400).json({
        success: false,
        error: error.code || 'PRIVILEGE_GRANT_FAILED',
        message: error.message
      });
    }
  },

  /**
   * POST /api/v1/staff-privileges/verify
   */
  async verifyAuthorization(req, res) {
    const staffId = req.body?.staff_id || req.body?.staffId;
    const procedureCode = req.body?.procedure_code || req.body?.procedureCode;
    const date = req.body?.date;
    const evalDate = date ? new Date(date) : new Date();

    try {
      const pool = postgresPoolService.getPool();
      const client = await pool.connect();
      try {
        const query = `
          SELECT 
            p.*, 
            s.full_name as staff_name, s.staff_category, s.is_active as staff_active,
            c.credential_type, c.verification_status as cred_status, c.valid_until as cred_expiry
          FROM clinical_privileges p
          JOIN clinical_staff_profiles s ON p.staff_id = s.id
          LEFT JOIN staff_credentials c ON p.staff_id = c.staff_id AND c.credential_type IN ('STR', 'SIP')
          WHERE (p.staff_id::text = $1 OR s.staff_number = $1)
            AND p.procedure_code = $2
            AND p.privilege_status = 'ACTIVE'
            AND $3 BETWEEN p.effective_from AND p.effective_until;
        `;
        const result = await client.query(query, [staffId, procedureCode, evalDate.toISOString().split('T')[0]]);

        const isAuthorized = result.rows.length > 0 && (result.rows[0].staff_active !== false);
        const decision = isAuthorized ? 'AUTHORIZED' : 'DENIED_NO_PRIVILEGE';

        return res.status(200).json({
          success: true,
          authorized: isAuthorized,
          data: {
            staffId,
            procedureCode,
            isAuthorized,
            decision,
            privilege: result.rows[0] || null
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      structuredLoggerService.error('STAFF_PRIVILEGING_VERIFY_ERROR', { error: error.message });
      return res.status(500).json({
        type: 'https://nurseflow.local/problems/internal-server-error',
        title: 'Database Error',
        status: 500,
        detail: error.message,
        code: 'DATABASE_QUERY_ERROR'
      });
    }
  }
};
