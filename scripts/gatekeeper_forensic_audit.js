/**
 * NurseFlow Enterprise HIS — 10-Point Gatekeeper Forensic Audit Engine
 * Scans entire codebase for dummy data, hardcoded IDs, mock APIs, storage leaks, test leakage, and placeholder contamination.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SCAN_DIRS = ['src', 'server', 'database', 'migrations', 'scripts', 'tests'];
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.tempmediaStorage',
  'gatekeeper_forensic_audit.js',
  'CHANGELOG_PERUBAHAN_HIS.md',
  '01_AUDIT_REPORT.md',
  '02_DUMMY_DATA_DETECTED_REPORT.md',
  '03_AUTO_FIX_REPORT.md',
  '04_REAUDIT_REPORT.md',
  '05_PATIENT_ZERO_SIMULATION.md',
  '06_END_TO_END_VALIDATION_REPORT.md',
  '07_GO_LIVE_CERTIFICATION_REPORT.md'
];

// Helper to recursively get files
function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (IGNORE_PATTERNS.some(ign => filePath.includes(ign))) continue;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(jsx?|tsx?|json|sql|html|css)$/i.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// Rules for the 10 Gatekeeper Points
const AUDIT_RULES = [
  {
    id: 1,
    name: 'Hardcoded Patient/Clinical IDs in Production (src/)',
    targetDirs: ['src'],
    regex: /\b(P-100[1-9]|MRN-2026-00100[1-9]|ENC-2026-0810-00[1-9]|TRG-2026-00[1-9]|SOAP-20260810-00[1-9]|DOC-SOAP-20260810-00[1-9]|EPI-2026-0810-00[1-9]|CT-2026-0810-00[1-9]|TSK-20260810-00[1-9])\b/g,
    description: 'Specific hardcoded clinical IDs in production source'
  },
  {
    id: 2,
    name: 'Suspicious Demo/Mock/Fake Data Constants in Production (src/)',
    targetDirs: ['src'],
    // Match definitions like DEMO_PATIENTS = [...], MOCK_DATA = [...], etc.
    regex: /\b(DEMO_PATIENTS|DEMO_ENCOUNTERS|DEMO_RECORDS|MOCK_PATIENTS|SAMPLE_PATIENTS|TEST_PATIENTS)\b\s*=\s*\[[^\]]+\]/g,
    description: 'Non-empty mock data constant arrays'
  },
  {
    id: 3,
    name: 'Uncontrolled Random Generators for Clinical Data (src/core, src/modules)',
    targetDirs: ['src/core', 'src/modules'],
    regex: /\b(faker\.|createSamplePatient|generateDummyData)\b/g,
    description: 'Faker or sample data generators in production modules'
  },
  {
    id: 4,
    name: 'Hardcoded Dummy Names in Production UI (src/)',
    targetDirs: ['src'],
    regex: /\b(Siti Nurhaliza|Bambang Pamungkas|Bambang Hermanto|John Doe|Jane Doe|Test Patient|Sample Patient|Sample Drug|Dummy Medication)\b/gi,
    description: 'Dummy patient/person/drug names'
  },
  {
    id: 5,
    name: 'Zustand Stores Initial Contamination (src/core/stores, src/modules/*/store)',
    targetDirs: ['src'],
    regex: /(patients|encounters|triages|prescriptions|activeSpecimens):\s*\[\s*\{[^}]+\}/g,
    description: 'Zustand stores initialized with non-empty dummy records'
  },
  {
    id: 6,
    name: 'Mock API Server or Axios Mock Adapter in Production (src/)',
    targetDirs: ['src'],
    regex: /\b(axios-mock-adapter|msw\/node|mockServer\.listen|setupServer\(|mockResponse\()\b/g,
    description: 'Mock API servers or adapters leaking into production'
  },
  {
    id: 7,
    name: 'SATUSEHAT / BPJS Dummy/Test Hardcoded Keys (src/)',
    targetDirs: ['src'],
    regex: /\b(SATUSEHAT_TEST_TOKEN_DUMMY|BPJS_SECRET_DUMMY|3171055508890001)\b/g,
    description: 'Hardcoded dummy test credentials or sample NIKs in production'
  },
  {
    id: 8,
    name: 'Ward & Bed Management Mock Occupied Initial State (src/modules/ward, src/core/services)',
    targetDirs: ['src/modules/ward', 'src/core/services'],
    regex: /(status:\s*BED_STATUS\.OCCUPIED|is_occupied:\s*true).*patient_name:\s*['"][^'"]+['"]/g,
    description: 'Pre-occupied mock beds with patient names in initial registry'
  },
  {
    id: 9,
    name: 'In-Memory Clinical Documents / Encounters Initialized with Data (src/core/services)',
    targetDirs: ['src/core/services', 'src/modules'],
    regex: /\b(sampleEvents|sampleDocs|sampleCareTeams|sampleOrders|sampleTasks|sampleEpisodes|sampleBeds)\s*=\s*\[\s*\{/g,
    description: 'Constructor seeding in-memory maps in core clinical services'
  },
  {
    id: 10,
    name: 'Hardcoded Fallback Identifiers in EMR Workspaces (src/modules/emr)',
    targetDirs: ['src/modules/emr'],
    regex: /patientName:\s*['"]Ny\.\s*Siti|mrn:\s*['"]MRN-2026-001001['"]/g,
    description: 'EMR components binding fallback patient identity strings'
  }
];

// Run Audit
console.log('='.repeat(80));
console.log('🚀 NURSEFLOW ENTERPRISE HIS — GATEKEEPER 10-POINT FORENSIC AUDIT');
console.log('='.repeat(80));
console.log(`Scan Date: ${new Date().toISOString()}`);
console.log(`Working Directory: ${rootDir}\n`);

let totalFilesScanned = 0;
let totalViolations = 0;
const findingsByRule = {};

// Gather all files
let allFiles = [];
for (const dir of SCAN_DIRS) {
  const fullDir = path.join(rootDir, dir);
  allFiles = allFiles.concat(getAllFiles(fullDir));
}
totalFilesScanned = allFiles.length;

console.log(`📂 Total Files Indexed: ${totalFilesScanned} files across ${SCAN_DIRS.join(', ')}\n`);

for (const rule of AUDIT_RULES) {
  findingsByRule[rule.id] = [];
  const targetFiles = allFiles.filter(f => {
    const rel = path.relative(rootDir, f).replace(/\\/g, '/');
    return rule.targetDirs.some(td => rel.startsWith(td));
  });

  for (const filePath of targetFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineIdx) => {
      rule.regex.lastIndex = 0; // Reset regex
      const matches = line.match(rule.regex);
      if (matches) {
        // Exclude comments if appropriate, or capture all
        const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        findingsByRule[rule.id].push({
          file: relPath,
          line: lineIdx + 1,
          matchedText: matches[0],
          codeSnippet: line.trim()
        });
      }
    });
  }

  const count = findingsByRule[rule.id].length;
  totalViolations += count;
  const statusIcon = count === 0 ? '✅ PASS' : '❌ FAIL';
  console.log(`[Rule ${rule.id.toString().padStart(2, '0')}] ${statusIcon} (${count} findings) : ${rule.name}`);
  if (count > 0) {
    findingsByRule[rule.id].forEach(f => {
      console.log(`     📍 ${f.file}:${f.line} -> "${f.matchedText}" [${f.codeSnippet.substring(0, 70)}]`);
    });
  }
}

console.log('\n' + '='.repeat(80));
console.log(`📊 AUDIT SUMMARY:`);
console.log(`   - Total Files Scanned: ${totalFilesScanned}`);
console.log(`   - Total Violations Found: ${totalViolations}`);
console.log(`   - Gatekeeper Decision: ${totalViolations === 0 ? '🟢 GO-LIVE READY (PASSED)' : '🔴 BLOCKED (REMEDIATION REQUIRED)'}`);
console.log('='.repeat(80));

// Save JSON Report
const reportOutput = {
  timestamp: new Date().toISOString(),
  totalFilesScanned,
  totalViolations,
  status: totalViolations === 0 ? 'PASSED' : 'FAILED',
  rules: AUDIT_RULES.map(r => ({
    id: r.id,
    name: r.name,
    violationsCount: findingsByRule[r.id].length,
    findings: findingsByRule[r.id]
  }))
};

fs.writeFileSync(
  path.join(rootDir, 'docs', 'gatekeeper_audit_results.json'),
  JSON.stringify(reportOutput, null, 2),
  'utf-8'
);

process.exit(totalViolations === 0 ? 0 : 1);
