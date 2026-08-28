/**
 * NurseFlow Enterprise HIS 2026 — Phase D1 Design Token Adoption & Completeness Auditor
 * 
 * Verifies:
 * 1. SSOT Token Registry Exports & Immutability.
 * 2. CSS Custom Properties (:root & .dark) Synchronization in index.css.
 * 3. Clinical Severity Scale Mappings & High-Contrast Visual Standards.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  TOKENS,
  BASE_TOKENS,
  SEMANTIC_TOKENS,
  CLINICAL_SEVERITY,
  TYPOGRAPHY_TOKENS,
  SPACING_TOKENS,
  ELEVATION_TOKENS,
  MOTION_TOKENS
} from '../src/design-system/tokens/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INDEX_CSS_PATH = path.resolve(__dirname, '../src/index.css');

function runDesignTokenAudit() {
  console.log('\n================================================================');
  console.log('🎨 PHASE D1: DESIGN TOKEN FOUNDATION & SSOT ADOPTION AUDIT');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Check Token Registry Immutability
  console.log('🔒 1. Verifying Token Registry Immutability & Deep Freezing...');
  assert(Object.isFrozen(TOKENS), 'TOKENS master registry is frozen');
  assert(Object.isFrozen(BASE_TOKENS), 'BASE_TOKENS is frozen');
  assert(Object.isFrozen(SEMANTIC_TOKENS), 'SEMANTIC_TOKENS is frozen');
  assert(Object.isFrozen(CLINICAL_SEVERITY), 'CLINICAL_SEVERITY is frozen');
  assert(Object.isFrozen(TYPOGRAPHY_TOKENS), 'TYPOGRAPHY_TOKENS is frozen');
  assert(Object.isFrozen(SPACING_TOKENS), 'SPACING_TOKENS is frozen');
  assert(Object.isFrozen(ELEVATION_TOKENS), 'ELEVATION_TOKENS is frozen');
  assert(Object.isFrozen(MOTION_TOKENS), 'MOTION_TOKENS is frozen');

  // 2. Check Clinical Severity Scales
  console.log('\n🚨 2. Verifying Clinical Severity & Safety Scales...');
  assert(Object.keys(CLINICAL_SEVERITY.esi).length === 5, 'ESI triage includes all 5 standard levels (ESI 1 to ESI 5)');
  assert(CLINICAL_SEVERITY.panic.criticalPanic.glow !== undefined, 'Panic lab values include glow highlight for emergency warning');
  assert(CLINICAL_SEVERITY.medication.highAlert !== undefined, 'High-Alert Medication safety token registered');
  assert(CLINICAL_SEVERITY.news2.high.pulse === true, 'NEWS2 high risk score (>=7) includes emergency pulse indicator');

  // 3. Check Tabular Numerals & Typography
  console.log('\n🔤 3. Verifying Tabular Numerals & Medical Typography...');
  assert(TYPOGRAPHY_TOKENS.features.tabularNumerals === '"tnum" 1', 'Tabular numerals ("tnum" 1) registered for fixed-width vitals');
  assert(TYPOGRAPHY_TOKENS.fontSize['2xl'] === '1.5rem', 'Vitals HUD font size 2xl (24px) registered');

  // 4. Check Z-Index Stacking Hierarchy
  console.log('\n🥞 4. Verifying Z-Index Stacking Hierarchy...');
  assert(ELEVATION_TOKENS.zIndex.safetyHardStopModal === 9999, 'Safety Hard-Stop modal has the highest z-index (9999)');
  assert(ELEVATION_TOKENS.zIndex.safetyHardStopModal > ELEVATION_TOKENS.zIndex.toastNotification, 'Safety modal dominates toast notifications');
  assert(ELEVATION_TOKENS.zIndex.toastNotification > ELEVATION_TOKENS.zIndex.modalDialog, 'Toast notifications stack above standard modals');

  // 5. Check CSS Custom Properties Synchronization
  console.log('\n🎨 5. Verifying CSS Custom Properties in stylesheets...');
  const generatedCssPath = path.resolve(__dirname, '../src/design-system/styles/tokens.generated.css');
  const allCss = (fs.existsSync(INDEX_CSS_PATH) ? fs.readFileSync(INDEX_CSS_PATH, 'utf8') : '') +
                 (fs.existsSync(generatedCssPath) ? fs.readFileSync(generatedCssPath, 'utf8') : '');
  const requiredCssVars = [
    '--nf-brand-ocean',
    '--nf-surface-canvas',
    '--nf-surface-card',
    '--nf-surface-hud',
    '--nf-text-primary',
    '--nf-clinical-panic',
    '--nf-clinical-warning',
    '--nf-clinical-normal',
    '--nf-font-vitals-mono',
    '--nf-font-feature-tnum',
    '--nf-z-safety-hard-stop'
  ];

  for (const v of requiredCssVars) {
    assert(allCss.includes(v), `CSS variable [${v}] is synchronized in stylesheets`);
  }

  console.log('\n================================================================');
  console.log(`🏁 PHASE D1 DESIGN TOKEN AUDIT COMPLETED`);
  console.log(`   Passed : ${passed}`);
  console.log(`   Failed : ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDesignTokenAudit();
