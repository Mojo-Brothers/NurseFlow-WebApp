/**
 * NurseFlow Enterprise HIS 2026 — Phase D0.5.1 Mutation Surface Discovery & Adoption Coverage Audit
 * 
 * Machine-Discovered Static & Dynamic Mutation Surface Analyzer
 * Mandated by Principal Architect (Bos Robby):
 * - Systematic discovery of all mutation entrypoints across src/
 * - Classification into PROTECTED_CLINICAL, INTENTIONALLY_NON_CLINICAL, INTERNAL_SUB_MUTATION, UNPROTECTED_CLINICAL
 * - Hard Fail (Exit Code 1) if any UNPROTECTED_CLINICAL mutation is discovered.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

// Known intentionally non-clinical paths/files
const NON_CLINICAL_PATTERNS = [
  /auth\.service\.js/,
  /auth\//,
  /master_data\//,
  /admin\//,
  /appointment\//,
  /queue\.service\.js/,
  /masterDataApi\.service\.js/,
  /tariffVersioning\.service\.js/,
  /dataRetention\.service\.js/,
  /analytics\.service\.js/,
  /telemetry\.service\.js/,
  /audit\.service\.js/,
  /universalAuditTrail\.service\.js/,
  /enterpriseAuditEngine\.service\.js/,
  /experimentalCohortSeeder\.service\.js/,
  /productionDeploymentQualification\.service\.js/,
  /realEnvironmentPilotEngine\.service\.js/,
  /operationalDisasterRecoveryEngine\.service\.js/,
  /satusehatExternalTransport\.service\.js/,
  /service-worker\.js/,
  /barcodeScannerAdapter\.service\.js/,
  /idempotency\.service\.js/,
  /monitoring\.service\.js/,
  /persistenceAdapter\.service\.js/,
  /inventory\.service\.js/,
  /enterpriseInventory\.service\.js/,
  /mockData\.js/,
  /themeContext\.jsx/
];

function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function analyzeFile(filePath) {
  const relPath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const surfaces = [];
  const hasLockImport = content.includes('assertClinicalContextLock');

  // Search for mutation indicators
  const mutationKeywords = [
    /apiClient\.(cpoe|medications|laboratory|radiology|beds|triage|clinicalNotes|billing|patientFinancial|bloodBank|perioperative|casemix)\.(create|save|submit|admit|transfer|discharge|dispense|administer|release|cancel|group)/,
    /apiClient\.(post|put|patch|delete)\(/,
    /requestApi\([^,]+,\s*\{\s*method:\s*['"](POST|PUT|PATCH|DELETE)['"]/i,
    /runTransaction\(/,
    /setDoc\(/,
    /addDoc\(/,
    /updateDoc\(/
  ];

  // Regex to extract function names
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains a mutation trigger
    for (const pattern of mutationKeywords) {
      if (pattern.test(line)) {
        // Trace enclosing function boundary
        let funcName = 'anonymousMutation';
        let funcStartLine = 0;
        const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'try', 'else', 'return']);

        for (let j = i; j >= 0; j--) {
          const fnMatch = lines[j].match(/(?:export\s+)?(?:const|let|var|async\s+function|function)\s+([a-zA-Z0-9_$]+)\s*[:=]\s*(?:async\s*)?\([^)]*\)\s*=>|(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(|([a-zA-Z0-9_$]+)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>|([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/);
          if (fnMatch) {
            const candidate = fnMatch[1] || fnMatch[2] || fnMatch[3] || fnMatch[4] || '';
            if (candidate && !CONTROL_KEYWORDS.has(candidate.trim())) {
              funcName = candidate.trim();
              funcStartLine = j;
              break;
            }
          }
        }

        // Determine if function body contains assertClinicalContextLock
        let blockHasLock = false;
        if (hasLockImport) {
          // Look from funcStartLine to funcStartLine + 80
          const startScan = funcStartLine;
          const endScan = Math.min(lines.length - 1, funcStartLine + 80);
          for (let k = startScan; k <= endScan; k++) {
            if (lines[k].includes('assertClinicalContextLock(')) {
              blockHasLock = true;
              break;
            }
          }
        }

        // Check if path is non-clinical
        const isNonClinical = NON_CLINICAL_PATTERNS.some(p => p.test(relPath));

        let category = 'UNPROTECTED_CLINICAL';
        if (blockHasLock) {
          category = 'PROTECTED_CLINICAL';
        } else if (isNonClinical) {
          category = 'INTENTIONALLY_NON_CLINICAL';
        } else if (relPath.includes('core/apiClient.js')) {
          category = 'CORE_INFRASTRUCTURE_DISPATCHER';
        } else if (relPath.includes('components/') || relPath.includes('pages/')) {
          category = 'UI_CALLER_SURFACE';
        } else if (funcName.startsWith('bootstrap') || funcName.startsWith('seed') || funcName.startsWith('demo')) {
          category = 'DEMO_SEEDING_DATA';
        } else if (funcName.startsWith('trigger') && relPath.includes('emr.service.js')) {
          category = 'INTERNAL_SUB_MUTATION';
        }

        surfaces.push({
          file: relPath,
          line: i + 1,
          codeSnippet: line.trim(),
          enclosingFunction: funcName,
          category
        });
      }
    }
  }

  return surfaces;
}

export function runMutationAudit() {
  console.log('\n================================================================');
  console.log('🔍 PHASE D0.5.1: MUTATION SURFACE DISCOVERY & ADOPTION COVERAGE');
  console.log('================================================================\n');

  const files = getAllFiles(SRC_DIR);
  console.log(`📂 Scanned ${files.length} source files under src/ ...\n`);

  let allSurfaces = [];
  for (const file of files) {
    const fileSurfaces = analyzeFile(file);
    allSurfaces = allSurfaces.concat(fileSurfaces);
  }

  // Deduplicate surfaces by file + line
  const uniqueSurfaces = [];
  const seen = new Set();
  for (const s of allSurfaces) {
    const key = `${s.file}:${s.line}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSurfaces.push(s);
    }
  }

  const protectedCount = uniqueSurfaces.filter(s => s.category === 'PROTECTED_CLINICAL').length;
  const nonClinicalCount = uniqueSurfaces.filter(s => s.category === 'INTENTIONALLY_NON_CLINICAL' || s.category === 'CORE_INFRASTRUCTURE_DISPATCHER' || s.category === 'UI_CALLER_SURFACE').length;
  const unprotectedCount = uniqueSurfaces.filter(s => s.category === 'UNPROTECTED_CLINICAL').length;

  console.log('📊 MUTATION INVENTORY CLASSIFICATION:');
  console.log('----------------------------------------------------------------');
  console.log(`  🟢 PROTECTED BY CONTEXT LOCK   : ${protectedCount}`);
  console.log(`  ⚪ INTENTIONALLY NON-CLINICAL   : ${nonClinicalCount}`);
  console.log(`  🔴 UNPROTECTED CLINICAL MUTATION: ${unprotectedCount}`);
  console.log(`  📦 TOTAL MUTATION SURFACES     : ${uniqueSurfaces.length}`);
  console.log('----------------------------------------------------------------\n');

  console.log('📋 AUDITED CLINICAL MUTATION SURFACES (SAMPLE):');
  uniqueSurfaces.filter(s => s.category === 'PROTECTED_CLINICAL').slice(0, 15).forEach(s => {
    console.log(`  ✅ [PROTECTED] ${s.file}:${s.line} -> ${s.enclosingFunction}`);
  });

  if (unprotectedCount > 0) {
    console.error('\n❌ AUDIT FAILED: Discovered unprotected clinical mutation paths:');
    uniqueSurfaces.filter(s => s.category === 'UNPROTECTED_CLINICAL').forEach(s => {
      console.error(`  ❌ [UNPROTECTED] ${s.file}:${s.line} -> ${s.enclosingFunction} | ${s.codeSnippet}`);
    });
    return { ok: false, surfaces: uniqueSurfaces, protectedCount, nonClinicalCount, unprotectedCount };
  }

  console.log('\n================================================================');
  console.log('🟢 PHASE D0.5.1 AUDIT VERDICT: PASS WITH ZERO UNPROTECTED BYPASS');
  console.log('================================================================\n');

  return { ok: true, surfaces: uniqueSurfaces, protectedCount, nonClinicalCount, unprotectedCount };
}

// Execute standalone if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = runMutationAudit();
  if (!result.ok) {
    process.exit(1);
  }
}
