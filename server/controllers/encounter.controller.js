/**
 * NurseFlow Enterprise HIS 2026 — Master Encounter Controller
 * Domain: Clinical Encounters, FSM Transitions & Episodes of Care
 * Standards: Canonical JSON Response Envelope ({ data, meta } / { error, meta })
 */

import { encounterApplicationService, EncounterDomainError } from '../services/encounterApplication.service.js';

export const encounterController = {
  /**
   * List / Search Encounters
   * GET /api/v1/encounters
   */
  getEncounters: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const filters = {
        patientId: req.query.patientId,
        status: req.query.status,
        encounterClass: req.query.encounterClass,
        limit: parseInt(req.query.limit || '50', 10),
        offset: parseInt(req.query.offset || '0', 10)
      };

      const encounters = await encounterApplicationService.getEncounters(filters);

      return res.status(200).json({
        success: true,
        data: encounters,
        meta: {
          count: encounters.length,
          filters,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'ENCOUNTER_FETCH_ERROR',
          message: err.message,
          details: []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get Single Encounter Detail
   * GET /api/v1/encounters/:id
   */
  getEncounterById: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const encounter = await encounterApplicationService.getEncounterById(req.params.id);
      if (!encounter) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ENCOUNTER_NOT_FOUND',
            message: `Encounter dengan ID ${req.params.id} tidak ditemukan.`,
            details: []
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      return res.status(200).json({
        success: true,
        data: encounter,
        meta: { requestId, correlationId, timestamp }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'ENCOUNTER_FETCH_ERROR',
          message: err.message,
          details: []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Create New Encounter (ACID Transaction)
   * POST /api/v1/encounters
   */
  createEncounter: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-REG-001',
        username: 'petugas_admisi',
        role: 'ROLE_REGISTRATION_CLERK'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const encounter = await encounterApplicationService.createEncounter(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: encounter,
        meta: {
          message: 'Encounter klinis berhasil dibuka dan disimpan secara durable di PostgreSQL',
          encounterNumber: encounter.encounter_number,
          auditSignature: encounter.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof EncounterDomainError ? 400 : 500);
      const code = err.code || 'ENCOUNTER_CREATION_FAILED';

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
   * Transition Encounter Status FSM (ACID Transaction)
   * PATCH /api/v1/encounters/:id/status
   */
  transitionStatus: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const actor = req.user || {
        userId: 'USR-CLINICIAN-001',
        username: 'dokter_dpjp',
        role: 'ROLE_DOCTOR_DPJP'
      };
      const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';

      const updated = await encounterApplicationService.transitionEncounterStatus({
        encounterId: req.params.id,
        nextStatus: req.body.status || req.body.nextStatus,
        reason: req.body.reason,
        dischargeDisposition: req.body.dischargeDisposition
      }, actor, clientIp, correlationId);

      return res.status(200).json({
        success: true,
        data: updated,
        meta: {
          message: `Status Encounter berhasil dialihkan ke '${updated.status}'`,
          previousStatus: updated.previousStatus,
          auditSignature: updated.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof EncounterDomainError ? 400 : 500);
      const code = err.code || 'ENCOUNTER_TRANSITION_FAILED';

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
  }
};
