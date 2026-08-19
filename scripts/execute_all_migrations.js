/**
 * NurseFlow Enterprise HIS 2026 — Automated Native PostgreSQL Migration Executor
 * Executes all 50 SQL migrations in database/migrations/ sequentially against local PostgreSQL.
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

const psqlPath = process.env.PSQL_PATH || 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';
const user = process.env.POSTGRES_USER || 'postgres';
const password = process.env.POSTGRES_PASSWORD || '';
const host = process.env.POSTGRES_HOST || 'localhost';
const port = process.env.POSTGRES_PORT || '5432';
const database = process.env.POSTGRES_DB || 'nurseflow_enterprise_his';
const migrationsDir = path.resolve('database', 'migrations');

console.log('\n🚀 NURSEFLOW ENTERPRISE HIS 2026 — DATABASE MIGRATION ENGINE');
console.log(`📍 Target Database : ${database} (${host}:${port})`);
console.log(`👤 Database User    : ${user}`);
console.log(`📂 Migrations Path  : ${migrationsDir}\n`);

if (!fs.existsSync(migrationsDir)) {
  console.error(`❌ Migration directory not found: ${migrationsDir}`);
  process.exit(1);
}

const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} migration files to execute.\n`);

let passedCount = 0;
let failedCount = 0;

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  process.stdout.write(`  [${file}] ... `);
  try {
    execSync(`"${psqlPath}" -U ${user} -h ${host} -p ${port} -d ${database} -f "${filePath}" -v ON_ERROR_STOP=1 --no-password`, {
      env: { ...process.env, PGPASSWORD: password },
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('✅ APPLIED');
    passedCount++;
  } catch (err) {
    console.log('❌ ERROR');
    const errMsg = err.stderr || err.stdout || err.message;
    console.error(`     Error Details: ${errMsg.trim()}`);
    failedCount++;
  }
}

console.log('\n================================================================');
console.log(`🏁 MIGRATION EXECUTION COMPLETED`);
console.log(`   Total Migrations : ${files.length}`);
console.log(`   Applied / Passed : ${passedCount}`);
console.log(`   Failed           : ${failedCount}`);
console.log('================================================================\n');

try {
  const tableCount = execSync(`"${psqlPath}" -U ${user} -h ${host} -p ${port} -d ${database} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" --no-password`, {
    env: { ...process.env, PGPASSWORD: password },
    encoding: 'utf-8'
  });
  console.log(`📊 Verified Public Tables in [${database}]: ${tableCount.trim()} tables ready.\n`);
} catch (err) {
  // silent table count check
}
