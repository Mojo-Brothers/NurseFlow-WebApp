/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Coding, Casemix & Revenue Integrity Controller
 * Domain: Clinical Documentation Improvement (CDI), Multi-Version SCD2 Coding (ICD-10/ICD-9-CM),
 * Physician-Coder Query Clarification Loop, Permenkes 3/2023 INA-CBG Grouping,
 * Revenue Integrity Cross-Audit & Electronic Claim Lifecycle FSM.
 * Standards: Canonical JSON Response Envelope ({ success, data, meta } / { success, error, meta })
 */

import {
  clinicalCodingAndCasemixService,
  ClinicalCodingDomainError
} from '../services/clinicalCodingAndCasemix.service.js';

export const clinicalCodingAndCasemixController = {
  /**
   * 1. Record or Update Clinical Coding Record
   * POST /api/v1/casemix/coding-records
   */
  recordCoding: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'CODER-STAFF-01',
        username: 'perekam_medis_01',
        role: 'ROLE_CASEMIX_CODER'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Koding klinis v${result.version_number} (${result.principal_icd10_code}) berhasil dicatat`,
          codingId: result.id,
          version: result.version_number,
          principalCode: result.principal_icd10_code,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalCodingDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'CODING_RECORD_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 2. Create Physician-Coder Clarification Query (CDI Loop)
   * POST /api/v1/casemix/queries
   */
  createPhysicianQuery: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'CODER-STAFF-01',
        username: 'perekam_medis_01',
        role: 'ROLE_CASEMIX_CODER'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalCodingAndCasemixService.createPhysicianQuery(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Query klarifikasi koding (${result.query_type}) berhasil diajukan ke dokter DPJP`,
          queryId: result.id,
          queryNumber: result.query_number,
          status: result.status,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalCodingDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'CDI_QUERY_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 3. Respond to Physician Clarification Query (CDI Loop)
   * POST /api/v1/casemix/queries/:id/respond
   */
  respondPhysicianQuery: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'DOC-DPJP-01',
        username: 'dr_spesialis_dpjp',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalCodingAndCasemixService.respondToPhysicianQuery(
        req.params.id,
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Respon klarifikasi koding berhasil dicatat oleh dokter DPJP',
          queryId: result.id,
          status: result.status,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalCodingDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'CDI_RESPONSE_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 4. Execute Permenkes 3/2023 INA-CBG Grouping Engine
   * POST /api/v1/casemix/encounters/:id/grouping
   */
  executeGrouping: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'CASEMIX-OFFICER-01',
        username: 'petugas_casemix',
        role: 'ROLE_CASEMIX_CODER'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalCodingAndCasemixService.executeCasemixGrouping(
        req.params.id,
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Grouping INA-CBG berhasil (${result.inacbg_code} - Tingkat ${result.severity_level})`,
          groupingId: result.id,
          cbgCode: result.inacbg_code,
          finalTariff: result.final_claim_tariff_idr,
          costVariance: result.cost_variance_idr,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalCodingDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'GROUPING_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 5. Perform Revenue Integrity Cross-Audit (Leakage Protection)
   * POST /api/v1/casemix/encounters/:id/cross-audit
   */
  crossAuditRevenue: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'REV-AUDITOR-01',
        username: 'auditor_revenue',
        role: 'ROLE_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit(
        req.params.id,
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: `Audit Revenue Integrity berhasil diselesaikan (${result.audit_status})`,
          auditId: result.id,
          auditStatus: result.audit_status,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalCodingDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'REVENUE_AUDIT_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * 6. Submit Electronic Claim Lifecycle
   * POST /api/v1/casemix/claims
   */
  submitClaim: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'CLAIM-OFFICER-01',
        username: 'petugas_klaim',
        role: 'ROLE_ADMIN'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalCodingAndCasemixService.submitElectronicClaim(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: `Pengajuan klaim elektronik (${result.sep_number}) berhasil diproses dengan status ${result.claim_status}`,
          claimId: result.id,
          sepNumber: result.sep_number,
          claimStatus: result.claim_status,
          claimedAmount: result.claimed_amount_idr,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalCodingDomainError ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || 'CLAIM_SUBMISSION_FAILED',
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
