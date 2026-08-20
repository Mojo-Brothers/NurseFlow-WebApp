/**
 * NurseFlow Enterprise HIS 2026 — Encounter Routes
 */

import { Router } from 'express';
import { encounterController } from '../controllers/encounter.controller.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// GET /api/v1/encounters — List / Search Encounters
router.get('/', authenticateJwt, encounterController.getEncounters);

// GET /api/v1/encounters/:id — Get Single Encounter
router.get('/:id', authenticateJwt, encounterController.getEncounterById);

// POST /api/v1/encounters — Create Encounter & Episode (ACID Transaction)
router.post('/', authenticateJwt, requirePermission('ENCOUNTER_CREATE'), encounterController.createEncounter);

// PATCH /api/v1/encounters/:id/status — Transition Encounter Status FSM
router.patch('/:id/status', authenticateJwt, requirePermission('ENCOUNTER_UPDATE'), encounterController.transitionStatus);

export default router;
