/**
 * NurseFlow Enterprise HIS 2026 — Master Governance & Evidence API Routes
 * Read-only endpoints for the Project Governance & Progress Dashboard.
 */

import express from 'express';
import { governanceScannerService } from '../services/governanceScanner.service.js';

const router = express.Router();

let cachedScan = null;
let lastScanTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds cache to prevent disk spam

async function getOrRefreshScan() {
  const now = Date.now();
  if (!cachedScan || now - lastScanTime > CACHE_TTL_MS) {
    cachedScan = await governanceScannerService.scanRepositoryReality();
    lastScanTime = now;
  }
  return cachedScan;
}

/**
 * GET /api/v1/governance/summary
 * High-level executive project status, current gate, and core coverage metrics.
 */
router.get('/summary', async (req, res) => {
  try {
    const data = await getOrRefreshScan();
    res.json({
      success: true,
      scannedAt: data.scannedAt,
      project: data.project,
      contradictionsCount: data.contradictions.length,
      openFindingsCount: data.findings.length,
      nextActionsCount: data.nextRequiredActions.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/governance/full-audit
 * Complete repository reality, findings, phases, domains, inventory, and contradictions.
 */
router.get('/full-audit', async (req, res) => {
  try {
    const data = await getOrRefreshScan();
    res.json({
      success: true,
      ...data
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/governance/findings
 * Canonical findings and failure-modes register.
 */
router.get('/findings', async (req, res) => {
  try {
    const data = await getOrRefreshScan();
    const severity = req.query.severity;
    let list = data.findings;
    if (severity) {
      list = list.filter(f => f.severity.toUpperCase() === severity.toUpperCase());
    }
    res.json({ success: true, count: list.length, findings: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/governance/phases
 * Hierarchical phase tracking and roadmap.
 */
router.get('/phases', async (req, res) => {
  try {
    const data = await getOrRefreshScan();
    res.json({ success: true, count: data.phases.length, phases: data.phases });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/governance/domains
 * 13-domain maturity and completion matrix.
 */
router.get('/domains', async (req, res) => {
  try {
    const data = await getOrRefreshScan();
    res.json({ success: true, count: data.domains.length, domains: data.domains });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/governance/contradictions
 * Live discrepancies between documentation claims and physical repository code.
 */
router.get('/contradictions', async (req, res) => {
  try {
    const data = await getOrRefreshScan();
    res.json({ success: true, count: data.contradictions.length, contradictions: data.contradictions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
