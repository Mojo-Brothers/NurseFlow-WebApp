/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Notes Controller
 * Domain: Physician SOAP & Integrated Multidisciplinary CPPT
 * Standards: Canonical JSON Response Envelope ({ data, meta }), RFC 7807 Global Error Handling, X-Correlation-ID
 */

import { clinicalNotesApplicationService } from '../services/clinicalNotesApplication.service.js';
import { respond } from '../utils/apiResponse.js';

export const clinicalNotesController = {
  /**
   * Record Doctor SOAP Note
   * POST /api/v1/clinical-notes/soap
   */
  recordSoap: async (req, res, next) => {
    try {
      const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
      const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
      const timestamp = new Date().toISOString();

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

      return respond.created(res, {
        data: result,
        meta: {
          message: 'Dokumentasi medis SOAP berhasil ditandatangani dan disimpan durable di PostgreSQL',
          soapId: result.id,
          auditSignature: result.auditSignature,
          requestId,
          timestamp
        },
        correlationId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Amend Signed SOAP Note
   * POST /api/v1/clinical-notes/soap/:id/amend
   */
  amendSoap: async (req, res, next) => {
    try {
      const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
      const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
      const timestamp = new Date().toISOString();

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

      return respond.ok(res, {
        data: result,
        meta: {
          message: 'Amandemen SOAP berhasil dicatat dengan menjaga integritas dokumen asli',
          amendedId: result.id,
          originalSoapId: result.originalSoapId,
          auditSignature: result.auditSignature,
          requestId,
          timestamp
        },
        correlationId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get SOAP Notes by Encounter
   * GET /api/v1/clinical-notes/soap/encounter/:encounterId
   */
  getSoapNotes: async (req, res, next) => {
    try {
      const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
      const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
      const notes = await clinicalNotesApplicationService.getSoapNotesByEncounter(req.params.encounterId);

      return respond.collection(res, {
        data: notes,
        page: 1,
        pageSize: notes.length || 20,
        total: notes.length,
        meta: {
          encounterId: req.params.encounterId,
          requestId
        },
        correlationId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Record Multidisciplinary CPPT Entry
   * POST /api/v1/clinical-notes/cppt
   */
  recordCppt: async (req, res, next) => {
    try {
      const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
      const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
      const timestamp = new Date().toISOString();

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

      return respond.created(res, {
        data: result,
        meta: {
          message: 'Catatan perkembangan terintegrasi (CPPT) berhasil dicatat',
          cpptId: result.id,
          auditSignature: result.auditSignature,
          requestId,
          timestamp
        },
        correlationId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Verify CPPT by DPJP
   * PATCH /api/v1/clinical-notes/cppt/:id/verify
   */
  verifyCppt: async (req, res, next) => {
    try {
      const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
      const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
      const timestamp = new Date().toISOString();

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

      return respond.ok(res, {
        data: result,
        meta: {
          message: 'Verifikasi DPJP 24 jam berhasil disahkan',
          requestId,
          timestamp
        },
        correlationId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get CPPT Notes by Encounter
   * GET /api/v1/clinical-notes/cppt/encounter/:encounterId
   */
  getCpptNotes: async (req, res, next) => {
    try {
      const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
      const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
      const notes = await clinicalNotesApplicationService.getCpptNotesByEncounter(req.params.encounterId);

      return respond.collection(res, {
        data: notes,
        page: 1,
        pageSize: notes.length || 20,
        total: notes.length,
        meta: {
          encounterId: req.params.encounterId,
          requestId
        },
        correlationId
      });
    } catch (err) {
      next(err);
    }
  }
};

