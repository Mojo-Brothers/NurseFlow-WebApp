/**
 * NurseFlow Enterprise HIS 2026 — Master Patient Controller
 * Domain: Patient Registration, MPI Search & Demographics Detail
 * Standards: Canonical JSON Response Envelope ({ data, meta } / { error, meta })
 */

import { patientApplicationService, PatientDomainError } from '../services/patientApplication.service.js';

export const patientController = {
  /**
   * Search / List Patients (MPI Query)
   * GET /api/v1/patients?q=&limit=&offset=
   */
  getPatients: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const query = req.query.q || '';
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);

      const patients = await patientApplicationService.searchPatients(query, limit, offset);

      return res.status(200).json({
        success: true,
        data: patients,
        meta: {
          count: patients.length,
          query,
          limit,
          offset,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PATIENT_SEARCH_ERROR',
          message: err.message,
          details: []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Get Single Patient Profile By ID
   * GET /api/v1/patients/:id
   */
  getPatientById: async (req, res) => {
    const requestId = req.headers['x-request-id'] || `REQ-${Date.now()}`;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const patient = await patientApplicationService.getPatientById(req.params.id);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: `Pasien dengan ID ${req.params.id} tidak ditemukan.`,
            details: []
          },
          meta: { requestId, correlationId, timestamp }
        });
      }

      return res.status(200).json({
        success: true,
        data: patient,
        meta: { requestId, correlationId, timestamp }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PATIENT_FETCH_ERROR',
          message: err.message,
          details: []
        },
        meta: { requestId, correlationId, timestamp }
      });
    }
  },

  /**
   * Register New Patient to MPI (ACID Transaction)
   * POST /api/v1/patients
   */
  createPatient: async (req, res) => {
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

      const newPatient = await patientApplicationService.registerPatient(
        req.body,
        actor,
        clientIp,
        correlationId
      );

      return res.status(201).json({
        success: true,
        data: newPatient,
        meta: {
          message: 'Pasien berhasil didaftarkan di Master Patient Index & disimpan ke PostgreSQL',
          mrn: newPatient.mrn,
          auditSignature: newPatient.auditSignature,
          requestId,
          correlationId,
          timestamp
        }
      });
    } catch (err) {
      const statusCode = err.statusCode || (err instanceof PatientDomainError ? 400 : 500);
      const code = err.code || 'PATIENT_CREATION_FAILED';

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
