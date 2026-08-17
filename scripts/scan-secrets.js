/**
 * NurseFlow Enterprise HIS 2026 — Automated Secret & Credential Scanner
 * Scans codebase files for exposed API keys, private keys, and passwords.
 * Usage: npm run scan:secrets
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SECRET_PATTERNS = [
  { name: 'Private Cryptographic Key', regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Personal Access Token', regex: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
  { name: 'Hardcoded Production Database URL with Password', regex: /postgres(ql)?:\/\/(?!his_admin:your_local|mock:mock|postgres:postgres)[a-zA-Z0-9_]+:[a-zA-Z0-9_!@#$%^&*()\-+=~]{8,}@/i }
];

const IGNORED_DIRECTORIES = ['node_modules', 'dist', 'build', '.git', '.rollup.cache', 'coverage', '.system_generated', 'scratch'];
const IGNORED_FILES = ['.env.example', '.env.local', 'scan-secrets.js', 'package-lock.json', 'SECURITY_SECRET_MANAGEMENT.md'];

let totalFilesScanned = 0;
const violations = [];

function scanDirectory(currentPath) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      if (IGNORED_FILES.some(f => entry.name.endsWith(f) || entry.name.includes('.local'))) continue;

      totalFilesScanned += 1;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, lineIndex) => {
          for (const pattern of SECRET_PATTERNS) {
            if (pattern.regex.test(line)) {
              violations.push({
                file: relPath,
                line: lineIndex + 1,
                pattern: pattern.name,
                snippet: line.trim().substring(0, 80)
              });
            }
          }
        });
      } catch {
        // Skip binary or unreadable files
      }
    }
  }
}

console.log('🔍 [DevSecOps] Scanning NurseFlow codebase for secrets & credentials...');
scanDirectory(ROOT_DIR);

console.log(`📊 Scanned ${totalFilesScanned} files.`);

if (violations.length > 0) {
  console.error('\n🚨 [SECURITY ALERT] Potential exposed secrets detected:');
  violations.forEach(v => {
    console.error(`  ❌ ${v.file}:${v.line} [${v.pattern}] -> ${v.snippet}...`);
  });
  console.error('\nPlease remove credentials from source code and use .env.local instead.\n');
  process.exit(1);
} else {
  console.log('✅ [PASSED] Zero exposed secrets found in codebase.');
  process.exit(0);
}
