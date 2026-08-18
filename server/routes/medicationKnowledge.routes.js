/**
 * NurseFlow Enterprise HIS 2026 — Master Medication, Terminology & Allergy REST API Router
 * Standards: REST Level 3, RFC 7807 Error Model, JCI Audit Compliance
 */

import express from 'express';
import { medicationKnowledgeBaseService } from '../services/medicationKnowledgeBase.service.js';
import { terminologyService } from '../services/terminologyService.service.js';
import { patientAllergyService } from '../services/patientAllergy.service.js';
import { hospitalFormularyService } from '../services/hospitalFormulary.service.js';

const router = express.Router();

// ─── 1. Master Medications Endpoints ───
router.get('/medications', async (req, res, next) => {
  try {
    const { search, drugClass, isHighAlert, status, limit, offset } = req.query;
    const result = await medicationKnowledgeBaseService.getMedications({
      search,
      drugClass,
      isHighAlert: isHighAlert !== undefined ? isHighAlert === 'true' : null,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.get('/medications/:id', async (req, res, next) => {
  try {
    const med = await medicationKnowledgeBaseService.getMedicationById(req.params.id);
    if (!med) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Obat ${req.params.id} tidak ditemukan.` });
    }
    res.json({ success: true, data: med });
  } catch (err) {
    next(err);
  }
});

router.post('/medications', async (req, res, next) => {
  try {
    const created = await medicationKnowledgeBaseService.createMedication(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.put('/medications/:id', async (req, res, next) => {
  try {
    const updated = await medicationKnowledgeBaseService.updateMedication(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/medications/:id/archive', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const archived = await medicationKnowledgeBaseService.archiveMedication(req.params.id, reason);
    res.json({ success: true, data: archived, message: 'Obat berhasil diarsipkan.' });
  } catch (err) {
    next(err);
  }
});

// Explicitly block hard DELETE
router.delete('/medications/:id', (req, res) => {
  res.status(405).json({
    success: false,
    error: 'METHOD_NOT_ALLOWED',
    message: '[CLINICAL_GOVERNANCE_BLOCKED] Hard delete dilarang keras untuk master obat. Gunakan endpoint PATCH .../archive.'
  });
});

// ─── 2. Terminology Service Endpoints ───
router.get('/terminologies/search', async (req, res, next) => {
  try {
    const { q, system } = req.query;
    const results = await terminologyService.searchTerminology({ query: q, system });
    res.json({ success: true, total: results.length, data: results });
  } catch (err) {
    next(err);
  }
});

// ─── 3. Patient Allergies Endpoints ───
router.get('/patients/:patientId/allergies', async (req, res, next) => {
  try {
    const { status } = req.query;
    const allergies = await patientAllergyService.getPatientAllergies(req.params.patientId, status);
    res.json({ success: true, patientId: req.params.patientId, total: allergies.length, data: allergies });
  } catch (err) {
    next(err);
  }
});

router.post('/patients/:patientId/allergies', async (req, res, next) => {
  try {
    const created = await patientAllergyService.recordAllergy({
      ...req.body,
      patientId: req.params.patientId,
      organizationId: req.body.organizationId || 'ORG-01'
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.patch('/patients/:patientId/allergies/:allergyId', async (req, res, next) => {
  try {
    const { action, mutationData, reason, actorId } = req.body;
    if (action === 'VOID') {
      const voided = await patientAllergyService.voidAllergy(req.params.allergyId, actorId, reason);
      return res.json({ success: true, data: voided, message: 'Alergi pasien berhasil dibatalkan (void).' });
    }
    const amended = await patientAllergyService.amendAllergy(req.params.allergyId, mutationData || req.body, actorId, reason);
    res.json({ success: true, data: amended, message: 'Alergi pasien berhasil diamendemen (SCD Type-2).' });
  } catch (err) {
    next(err);
  }
});

// ─── 4. Hospital Formulary Endpoints ───
router.get('/formulary', async (req, res, next) => {
  try {
    const { tier, status, organizationId } = req.query;
    const list = await hospitalFormularyService.getFormulary({ tier, status, organizationId });
    res.json({ success: true, total: list.length, data: list });
  } catch (err) {
    next(err);
  }
});

router.post('/formulary', async (req, res, next) => {
  try {
    const created = await hospitalFormularyService.addDrugToFormulary(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

router.patch('/formulary/:id', async (req, res, next) => {
  try {
    const updated = await hospitalFormularyService.updateFormularyEntry(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
