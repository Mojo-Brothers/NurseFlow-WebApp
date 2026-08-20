/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Notes Controller
 * Domain: Physician SOAP & Integrated Multidisciplinary CPPT
 * Standards: Canonical JSON Response Envelope ({ data, meta } / { error, meta })
 */

import { clinicalNotesApplicationService, ClinicalNotesDomainError } from '../services/clinicalNotesApplication.service.js';

export const clinicalNotesController = {
  /**
   * Record Doctor SOAP Note
   * POST /api/v1/clinical-notes/soap
   */
  recordSoap: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-DOC-001',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalNotesApplicationService.recordSoapNote(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: 'Dokumentasi medis SOAP berhasil ditandatangani dan disimpan durable di PostgreSQL',
          soapId: result.id,
          auditSignature: result.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalNotesDomainError ? 400 : 500);
      const code = err.code || 'SOAP_RECORD_FAILED';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Amend Signed SOAP Note
   * POST /api/v1/clinical-notes/soap/:id/amend
   */
  amendSoap: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-DOC-001',
        username: 'dr_siti',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const payload = {
        ...req.body,
        originalSoapId: req.params.id
      };

      const result = await clinicalNotesApplicationService.amendSoapNote(
        payload,
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Amandemen SOAP berhasil dicatat dengan menjaga integritas dokumen asli',
          amendedId: result.id,
          originalSoapId: result.originalSoapId,
          auditSignature: result.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalNotesDomainError ? 400 : 500);
      const code = err.code || 'SOAP_AMEND_FAILED';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get SOAP Notes by Encounter
   * GET /api/v1/clinical-notes/soap/encounter/:encounterId
   */
  getSoapNotes: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const notes = await clinicalNotesApplicationService.getSoapNotesByEncounter(req.params.encounterId);
      return res.status(200).json({
        success: true,
        data: notes,
        meta: {
          count: notes.length,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'SOAP_FETCH_ERROR', message: err.message, details: [] },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Record Multidisciplinary CPPT Entry
   * POST /api/v1/clinical-notes/cppt
   */
  recordCppt: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-NURSE-001',
        username: 'perawat_bangsal',
        role: 'ROLE_NURSE'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalNotesApplicationService.recordCpptEntry(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: result,
        meta: {
          message: 'Catatan perkembangan terintegrasi (CPPT) berhasil dicatat',
          cpptId: result.id,
          auditSignature: result.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalNotesDomainError ? 400 : 500);
      const code = err.code || 'CPPT_RECORD_FAILED';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Verify CPPT by DPJP
   * PATCH /api/v1/clinical-notes/cppt/:id/verify
   */
  verifyCppt: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-DOC-001',
        username: 'dr_dpjp',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const result = await clinicalNotesApplicationService.verifyCpptEntry(
        { cpptId: req.params.id },
        actor,
        clientIp,
        correlationId
      );

      return res.status(200).json({
        success: true,
        data: result,
        meta: {
          message: 'Verifikasi DPJP 24 jam berhasil disahkan',
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof ClinicalNotesDomainError ? 400 : 500);
      const code = err.code || 'CPPT_VERIFY_FAILED';

      return res.status(statusCode).json({
        success: false,
        error: {
          code,
          message: err.message,
          details: err.details || []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get CPPT Notes by Encounter
   * GET /api/v1/clinical-notes/cppt/encounter/:encounterId
   */
  getCpptNotes: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const notes = await clinicalNotesApplicationService.getCpptNotesByEncounter(req.params.encounterId);
      return res.status(200).json({
        success: true,
        data: notes,
        meta: {
          count: notes.length,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'CPPT_FETCH_ERROR', message: err.message, details: [] },
        meta: { requestId, correlationId, timestamp }
      });
    }
  }
};
