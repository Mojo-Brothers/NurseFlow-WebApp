import { patientRepository } from '../../src/core/repositories/patientRepository.js';

export const patientController = {
  getPatients: async (req, res) => {
    try {
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
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  getPatientById: async (req, res) => {
    try {
      const patient = await patientRepository.findById(req.params.id);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Pasien tidak ditemukan' });
      }
      return res.json({ success: true, data: patient });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  createPatient: async (req, res) => {
    try {
      const newPatient = await patientRepository.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Pasien berhasil didaftarkan di Master Patient Index',
        data: newPatient
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
