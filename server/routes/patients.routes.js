import { Router } from 'express';
import { patientRepository } from '../../src/core/repositories/patientRepository.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// GET /api/v1/patients
router.get('/', authenticateJwt, async (req, res) => {
  const query = req.query.q || '';
  const patients = patientRepository.loadAll();
  const filtered = query
    ? patients.filter(p => p.full_name?.toLowerCase().includes(query.toLowerCase()) || p.mrn?.includes(query))
    : patients;

  return res.json({
    success: true,
    count: filtered.length,
    data: filtered
  });
});

// GET /api/v1/patients/:id
router.get('/:id', authenticateJwt, async (req, res) => {
  const patient = await patientRepository.findById(req.params.id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan' });
  }
  return res.json({ success: true, data: patient });
});

// POST /api/v1/patients
router.post('/', authenticateJwt, requirePermission('PATIENT_REGISTER'), async (req, res) => {
  const newPatient = await patientRepository.create(req.body);
  return res.status(201).json({
    success: true,
    message: 'Pasien berhasil didaftarkan di Master Patient Index',
    data: newPatient
  });
});

export default router;
