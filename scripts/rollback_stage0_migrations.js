/**
 * NurseFlow Enterprise HIS 2026 — Stage 0 Migration Rollback Executor
 * Reverses migrations 079 -> 078 -> 077 in strict topological dependency order.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load .env.local or .env
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim();
    }
  });
}

const psqlPath = process.env.PSQL_PATH || (process.platform === 'win32' ? 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe' : 'psql');
const user = process.env.MIGRATION_USER || process.env.POSTGRES_MIGRATION_USER || process.env.POSTGRES_ADMIN_USER || 'postgres';
const password = process.env.MIGRATION_PASSWORD || process.env.POSTGRES_MIGRATION_PASSWORD || process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD || '';
const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_PORT || '5432';
const database = process.env.POSTGRES_DB || 'nurseflow_enterprise_his';
const migrationsDir = path.resolve('database', 'migrations');

console.log('\n🔄 NURSEFLOW ENTERPRISE HIS 2026 — STAGE 0 ROLLBACK ENGINE');
console.log(`📍 Target Database : ${database} (${host}:${port})`);
console.log(`👤 Database User    : ${user}\n`);

// Strict reverse dependency ordering: 079_down (policies) -> 078_down (child FKs & cols) -> 077_down (parent UNIQUE)
const rollbackFiles = [
  '079_down_stage0_purge_legacy_policies_and_enforce_default_deny.sql',
  '078_down_stage0_child_composite_foreign_keys.sql',
  '077_down_stage0_parent_composite_uniqueness.sql'
];

let passedCount = 0;
let failedCount = 0;

for (const file of rollbackFiles) {
  const filePath = path.join(migrationsDir, file);
  process.stdout.write(`  [${file}] ... `);
  try {
    execSync(`"${psqlPath}" -U ${user} -h ${host} -p ${port} -d ${database} -f "${filePath}" -v ON_ERROR_STOP=1 --no-password`, {
      env: { ...process.env, PGPASSWORD: password },
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('✅ ROLLED BACK');
    passedCount++;
  } catch (err) {
    console.log('❌ ERROR');
    const errMsg = err.stderr || err.stdout || err.message;
    console.error(`     Error Details: ${errMsg.trim()}`);
    failedCount++;
    break; // Stop rollback chain on error
  }
}

console.log('\n================================================================');
console.log(`🏁 ROLLBACK EXECUTION COMPLETED`);
console.log(`   Rolled Back      : ${passedCount}`);
console.log(`   Failed           : ${failedCount}`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
