/**
 * NurseFlow Enterprise HIS 2026 — DICOMweb REST API Router
 * Standards Compliance: DICOM PS 3.18 (Web Services: QIDO-RS, WADO-RS, STOW-RS)
 */

import express from 'express';
import { pacsDicomEngineService } from '../../src/modules/radiology/services/pacsDicomEngine.service.js';
import { radiologyWorkflowEngineService } from '../services/radiologyWorkflowEngine.service.js';
import { eventBusService, DOMAIN_EVENTS } from '../realtime/eventBus.service.js';

const router = express.Router();

/**
 * 0. DICOM Modality Worklist (MWL)
 * GET /dicomweb/worklist?modality=...&date=...
 */
router.get('/worklist', (req, res) => {
  try {
    const { modality, date } = req.query;
    const worklist = radiologyWorkflowEngineService.getModalityWorklist({ modality, date });
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(worklist);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 0.1 Radiology Orders Query & Lifecycle
 * GET /dicomweb/orders
 */
router.get('/orders', (req, res) => {
  try {
    const orders = radiologyWorkflowEngineService.getAllOrders();
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 1. QIDO-RS: Query for Studies
 * GET /dicomweb/studies?PatientID=...&AccessionNumber=...&ModalitiesInStudy=...
 */
router.get('/studies', (req, res) => {
  try {
    const { PatientID, AccessionNumber, ModalitiesInStudy } = req.query;
    const studies = pacsDicomEngineService.queryStudies({
      patientMrn: PatientID,
      accessionNumber: AccessionNumber,
      modality: ModalitiesInStudy
    });

    // Format to DICOM JSON Model (PS 3.18 Section 6.7)
    const dicomJson = studies.map(s => ({
      '0020000D': { vr: 'UI', Value: [s.studyInstanceUid] }, // StudyInstanceUID
      '00080050': { vr: 'SH', Value: [s.accessionNumber] },  // AccessionNumber
      '00100020': { vr: 'LO', Value: [s.patientMrn] },        // PatientID
      '00100010': { vr: 'PN', Value: [{ Alphabetic: s.patientName }] }, // PatientName
      '00080060': { vr: 'CS', Value: [s.modality] },          // Modality
      '00081030': { vr: 'LO', Value: [s.studyDescription] },  // StudyDescription
      '00080020': { vr: 'DA', Value: [s.studyDate.replace(/-/g, '')] }, // StudyDate
      '00080030': { vr: 'TM', Value: [s.studyTime.replace(/:/g, '')] }  // StudyTime
    }));

    res.setHeader('Content-Type', 'application/dicom+json');
    return res.status(200).json(dicomJson);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 2. WADO-RS: Retrieve Study Metadata
 * GET /dicomweb/studies/:studyInstanceUid/metadata
 */
router.get('/studies/:studyInstanceUid/metadata', (req, res) => {
  try {
    const { studyInstanceUid } = req.params;
    const study = pacsDicomEngineService.getStudyByUid(studyInstanceUid);

    const metadataJson = [
      {
        '0020000D': { vr: 'UI', Value: [study.studyInstanceUid] },
        '00080050': { vr: 'SH', Value: [study.accessionNumber] },
        '00100020': { vr: 'LO', Value: [study.patientMrn] },
        '00080060': { vr: 'CS', Value: [study.modality] },
        '0020000E': { vr: 'UI', Value: [study.series[0]?.seriesInstanceUid] },
        '00080018': { vr: 'UI', Value: [study.series[0]?.instances[0]?.sopInstanceUid] }
      }
    ];

    res.setHeader('Content-Type', 'application/dicom+json');
    return res.status(200).json(metadataJson);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
});

/**
 * 3. WADO-RS: Retrieve Rendered Frame / Pixel Stream
 * GET /dicomweb/studies/:studyInstanceUid/series/:seriesInstanceUid/instances/:sopInstanceUid/rendered
 */
router.get('/studies/:studyInstanceUid/series/:seriesInstanceUid/instances/:sopInstanceUid/rendered', (req, res) => {
  try {
    const { studyInstanceUid } = req.params;
    const study = pacsDicomEngineService.getStudyByUid(studyInstanceUid);

    return res.status(200).json({
      status: 'SUCCESS',
      protocol: 'WADO-RS Rendered Frame',
      studyInstanceUid: study.studyInstanceUid,
      accessionNumber: study.accessionNumber,
      transferSyntaxUid: '1.2.840.10008.1.2.1 (Explicit VR Little Endian)',
      windowCenter: study.series[0]?.instances[0]?.windowCenter || 40,
      windowWidth: study.series[0]?.instances[0]?.windowWidth || 350,
      rows: 512,
      columns: 512,
      compression: 'LOSSLESS'
    });
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
});

/**
 * 4. STOW-RS: Store DICOM Studies
 * POST /dicomweb/studies
 */
router.post('/studies', async (req, res) => {
  try {
    const studyPayload = req.body;
    const stored = pacsDicomEngineService.storeDicomStudy(studyPayload);

    await eventBusService.publish(DOMAIN_EVENTS.RADIOLOGY_ORDER_CREATED, {
      studyInstanceUid: stored.studyInstanceUid,
      accessionNumber: stored.accessionNumber,
      modality: stored.modality,
      patientMrn: stored.patientMrn
    });

    res.setHeader('Content-Type', 'application/dicom+json');
    return res.status(200).json({
      status: 'STORED',
      studyInstanceUid: stored.studyInstanceUid,
      accessionNumber: stored.accessionNumber
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
