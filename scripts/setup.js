/**
 * NurseFlow Enterprise HIS 2026 — Developer Environment Bootstrap Script
 * Usage: npm run setup
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('\n🏥 ═══════════════════════════════════════════════════════════════');
console.log('   NURSEFLOW ENTERPRISE HIS 2026 — DEVELOPER BOOTSTRAP WIZARD');
console.log('═══════════════════════════════════════════════════════════════════\n');

// 1. Check Node.js Version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
console.log(`[1/5] ⚙️  Checking Node.js Runtime... (Found: v${nodeVersion})`);

if (majorVersion < 18) {
  console.error(`❌ ERROR: NurseFlow requires Node.js version 18.0.0 or higher (LTS recommended). Current version: v${nodeVersion}`);
  process.exit(1);
}
console.log('      ✅ Node.js runtime compatible.');

// 2. Check and Initialize .env.local
console.log('\n[2/5] 🔒 Checking Local Environment Configuration (.env.local)...');
const envExamplePath = path.join(ROOT_DIR, '.env.example');
const envLocalPath = path.join(ROOT_DIR, '.env.local');

if (!fs.existsSync(envLocalPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log('      ✅ Created fresh .env.local from .env.example template.');
    console.log('      ℹ️  You can customize credentials inside .env.local for your local device.');
  } else {
    console.warn('      ⚠️ Warning: .env.example template not found. Please create .env.local manually.');
  }
} else {
  console.log('      ✅ .env.local already exists. Preserving your existing configuration.');
}

// 3. Verify .gitignore protection
console.log('\n[3/5] 🛡️  Verifying Git Secret Exclusions (.gitignore)...');
const gitignorePath = path.join(ROOT_DIR, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (gitignoreContent.includes('.env') && gitignoreContent.includes('*.key')) {
    console.log('      ✅ .gitignore is actively protecting secret credentials and certificates.');
  } else {
    console.warn('      ⚠️ Warning: .gitignore might be missing strict secret rules.');
  }
}

// 4. Verify Directory Structure
console.log('\n[4/5] 📂 Verifying Core Directories...');
const requiredDirs = [
  path.join(ROOT_DIR, 'server'),
  path.join(ROOT_DIR, 'src'),
  path.join(ROOT_DIR, 'tests'),
  path.join(ROOT_DIR, 'docs')
];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`      Created directory: ${path.basename(dir)}`);
  }
}
console.log('      ✅ Core directories ready.');

// 5. Final Instructions
console.log('\n[5/5] 🚀 Bootstrap Verification Completed!');
console.log('\n───────────────────────────────────────────────────────────────────');
console.log('🎉 Setup Selesai! Anda siap menjalankan NurseFlow di device ini:');
console.log('   1. Jalankan Unit Test:     npm test');
console.log('   2. Jalankan Dev Server:    npm run dev');
console.log('   3. Jalankan Docker DB:     docker compose up -d (opsional)');
console.log('───────────────────────────────────────────────────────────────────\n');
