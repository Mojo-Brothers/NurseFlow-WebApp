/**
 * NurseFlow Enterprise HIS 2026 — Phase D2.3.0: Clinical Safety Surface Discovery & Contract Inventory
 * 
 * Mandated by Principal Architect (Bos Robby):
 * - Systematic Machine Discovery of all Alert, Confirmation, Modal, Badge, and Destructive surfaces across src/
 * - Discovers: window.confirm, alert, role="alert", modals, status indicators, destructive keywords
 * - Produces Classification Matrix to ground D2.3 Safety components on real clinical usage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

const EXCLUDED_PATTERNS = [
  /src[\\/]design-system[\\/]tokens/,
  /src[\\/]design-system[\\/]styles/,
  /src[\\/]archive/,
  /node_modules/,
  /\.test\.(js|jsx)$/
];

function getAllFiles(dir, exts = ['.jsx', '.js']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const isExcluded = EXCLUDED_PATTERNS.some(p => p.test(fullPath));
    if (isExcluded) continue;

    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

export function runSafetyInventory() {
  const files = getAllFiles(SRC_DIR);

  let rawConfirmCount = 0;
  let rawAlertCount = 0;
  let ariaAlertCount = 0;
  let modalDialogCount = 0;
  let badgeIndicatorCount = 0;
  let destructiveActionCount = 0;

  const rawConfirmFiles = [];
  const modalFiles = [];
  const destructiveFiles = [];

  const rawConfirmRegex = /(?:window\.)?confirm\s*\(/g;
  const rawAlertRegex = /(?:window\.)?alert\s*\(/g;
  const ariaAlertRegex = /role=['"](?:alert|alertdialog)['"]/g;
  const modalDialogRegex = /<(?:Modal|Dialog|ConfirmModal|ConfirmationDialog|PromptModal|AlertModal)\b/g;
  const badgeRegex = /<(?:Badge|Chip|Tag|StatusBadge|ClinicalBadge)\b|badge-[a-z0-9]+/g;
  const destructiveRegex = /(?:cancelOrder|discontinue|stopInfusion|overrideWarning|deletePatientRecord|revokePrivilege|emergencyOverride)/g;

  for (const filePath of files) {
    const relPath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    // Strip comments to avoid false positives
    const strippedContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    const confirms = (strippedContent.match(rawConfirmRegex) || []).length;
    const alerts = (strippedContent.match(rawAlertRegex) || []).length;
    const ariaAlerts = (strippedContent.match(ariaAlertRegex) || []).length;
    const modals = (strippedContent.match(modalDialogRegex) || []).length;
    const badges = (strippedContent.match(badgeRegex) || []).length;
    const destructives = (strippedContent.match(destructiveRegex) || []).length;

    rawConfirmCount += confirms;
    rawAlertCount += alerts;
    ariaAlertCount += ariaAlerts;
    modalDialogCount += modals;
    badgeIndicatorCount += badges;
    destructiveActionCount += destructives;

    if (confirms > 0) {
      rawConfirmFiles.push({ file: relPath, count: confirms });
    }
    if (modals > 0) {
      modalFiles.push({ file: relPath, count: modals });
    }
    if (destructives > 0) {
      destructiveFiles.push({ file: relPath, count: destructives });
    }
  }

  console.log('\n================================================================');
  console.log('🚨 PHASE D2.3.0: CLINICAL SAFETY SURFACE DISCOVERY INVENTORY');
  console.log('================================================================\n');
  console.log(`Source Files Scanned          : ${files.length}`);
  console.log('----------------------------------------------------------------');
  console.log(`Browser raw confirm() calls   : ${rawConfirmCount} (in ${rawConfirmFiles.length} files) -> Candidates for HardStopDialog`);
  console.log(`Browser raw alert() calls     : ${rawAlertCount} instances -> Candidates for ClinicalAlert`);
  console.log(`ARIA role="alert/dialog"      : ${ariaAlertCount} instances`);
  console.log(`Custom Modal / Dialog Elements: ${modalDialogCount} (in ${modalFiles.length} files)`);
  console.log(`Badge / Status Elements       : ${badgeIndicatorCount} instances`);
  console.log(`Destructive Clinical Mutators : ${destructiveActionCount} (in ${destructiveFiles.length} files)`);
  console.log('================================================================\n');

  console.log('🛡️ SAFETY PRIMITIVE TARGET CLASSIFICATION:');
  console.log('----------------------------------------------------------------');
  console.log('  1. ClinicalBadge:');
  console.log('     - Speaks clinical domain (severity: routine/info/warning/critical/panic, type: ESI, NEWS2, HAM)');
  console.log('  2. ClinicalStatusIndicator:');
  console.log('     - Multi-signal status (shape + icon + label) preventing pure color reliance');
  console.log('  3. ClinicalAlert:');
  console.log('     - RFC 7807 problem details integration with ARIA live strategy');
  console.log('  4. ClinicalModal:');
  console.log('     - Standard accessible modal dialog (Z-Index 1050, focus trap)');
  console.log('  5. HardStopDialog (Authoritative Z-Index 9999):');
  console.log('     - Anti-accidental dismissal, patient identity banner, mandatory acknowledgment & justification');
  console.log('================================================================\n');

  return {
    filesScanned: files.length,
    rawConfirmCount,
    rawAlertCount,
    ariaAlertCount,
    modalDialogCount,
    badgeIndicatorCount,
    destructiveActionCount
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSafetyInventory();
}
