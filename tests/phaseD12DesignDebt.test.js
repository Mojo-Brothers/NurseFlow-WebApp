/**
 * NurseFlow Enterprise HIS 2026 — Phase D1.2 Design Debt Baseline Test Suite
 * 
 * Verifies:
 * 1. Design Debt Baseline Scanner execution and JSON output generation.
 * 2. Presence of all 5 debt categories (Colors, Spacing, Typography, Radius, Elevation).
 * 3. Baseline stability without crash.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { scanDesignDebt } from '../scripts/audit_design_debt_baseline.mjs';

const REPORT_JSON_PATH = path.resolve(__dirname, '../docs/design_debt_baseline_2026.json');

describe('📊 Phase D1.2: Design Debt Baseline Discovery Suite', () => {
  it('1.1 should execute design debt scan and produce report object', () => {
    const report = scanDesignDebt();
    expect(report).toBeDefined();
    expect(report.filesScanned).toBeGreaterThan(500);
    expect(report.metrics).toBeDefined();
    expect(report.metrics.totalDebtPoints).toBeGreaterThan(0);
    expect(report.top10DebtFiles.length).toBe(10);
  });

  it('1.2 should persist baseline json in docs directory', () => {
    expect(fs.existsSync(REPORT_JSON_PATH)).toBe(true);
    const content = JSON.parse(fs.readFileSync(REPORT_JSON_PATH, 'utf8'));
    expect(content.metrics.hardcodedColors).toBeDefined();
    expect(content.metrics.hardcodedSpacing).toBeDefined();
    expect(content.metrics.hardcodedTypography).toBeDefined();
    expect(content.metrics.hardcodedRadius).toBeDefined();
    expect(content.metrics.hardcodedElevation).toBeDefined();
  });
});
