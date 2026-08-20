/**
 * NurseFlow Enterprise HIS 2026 — CDSS REST API Gateway
 * Standards: REST Level 3, JCI IPSG 3 Safety Verification & Replay
 */

import express from 'express';
import { dynamicCdssEngineService } from '../services/dynamicCdssEngine.service.js';
import { cdssReplayEngineService } from '../services/cdssReplayEngine.service.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(authenticateJwt);

// 1. Evaluate Proposed Prescription
router.post('/cdss/evaluate', async (req, res, next) => {
  try {
    const evaluation = await dynamicCdssEngineService.evaluatePrescription(req.body);
    res.json({ success: true, data: evaluation });
  } catch (err) {
    next(err);
  }
});

// 2. Commit CDSS Execution Snapshot
router.post('/cdss/executions/record', async (req, res, next) => {
  try {
    const recorded = await dynamicCdssEngineService.commitExecutionSnapshot(req.body);
    res.status(201).json({ success: true, data: recorded, message: 'Snapshot evaluasi CDSS berhasil direkam.' });
  } catch (err) {
    next(err);
  }
});

// 3. Get CDSS Audit Trail for Encounter
router.get('/cdss/executions/:encounterId', async (req, res, next) => {
  try {
    const records = await cdssReplayEngineService.getAuditTrailForEncounter(req.params.encounterId);
    res.json({ success: true, total: records.length, data: records });
  } catch (err) {
    next(err);
  }
});

// 4. Replay Historical CDSS Execution
router.post('/cdss/replay/:executionId', async (req, res, next) => {
  try {
    const replayReport = await cdssReplayEngineService.replayExecution(req.params.executionId);
    res.json({ success: true, data: replayReport });
  } catch (err) {
    next(err);
  }
});

export default router;
