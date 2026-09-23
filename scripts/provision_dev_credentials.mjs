/**
 * NurseFlow Enterprise HIS 2026 — Development Credential Provisioning Script
 * ─────────────────────────────────────────────────────────────────────────────
 * PURPOSE: Provision local development credentials with unique, cryptographically
 * random 128-bit salts per account.
 * 
 * ENVIRONMENT: STRICTLY FOR LOCAL DEVELOPMENT / CI TEST TESTING ONLY.
 * NEVER USE IN PRODUCTION ENVIRONMENTS.
 * 
 * Standards: OWASP ASVS 4.0, NIST SP 800-132
 * Format: scrypt$N=16384,r=8,p=1,maxmem=33554432$<salt_16bytes_hex>$<derived_key_64bytes_hex>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { postgresPoolService } from '../server/db/postgresPool.js';
import { passwordSecurity } from '../server/utils/passwordSecurity.js';

// Dev password sourced from environment variable with safe fallback for local development only
const DEV_BOOTSTRAP_PASSWORD = process.env.DEV_BOOTSTRAP_PASSWORD || 'NurseFlow2026!';

const DEV_ACCOUNTS = [
  'dr.siti.wijaya',
  'dr.budi.santoso',
  'ners.indah',
  'apt.dimas',
  'admin.dev'
];

async function provisionDevCredentials() {
  console.log('=== [DEV ONLY] NurseFlow Development Credential Provisioning ===');
  console.log('Target Accounts:', DEV_ACCOUNTS.join(', '));

  const client = await postgresPoolService.getClient();
  try {
    await client.query('BEGIN');

    const generatedSalts = new Set();

    for (const username of DEV_ACCOUNTS) {
      // Generate unique hash with fresh random 128-bit salt
      const hash = passwordSecurity.hashPassword(DEV_BOOTSTRAP_PASSWORD);
      const salt = hash.split('$')[2];

      if (generatedSalts.has(salt)) {
        throw new Error(`CRITICAL: Salt collision detected for ${username}!`);
      }
      generatedSalts.add(salt);

      await client.query(
        `UPDATE auth_users 
         SET password_hash = $1, 
             is_active = TRUE, 
             status = 'ACTIVE', 
             failed_login_attempts = 0, 
             updated_at = NOW() 
         WHERE username = $2`,
        [hash, username]
      );

      console.log(`[OK] Provisioned: ${username} | Unique Salt (128-bit): ${salt.substring(0, 8)}... | Param: N=16384,r=8,p=1`);
    }

    await client.query('COMMIT');
    console.log('=== [SUCCESS] All 5 Dev Accounts Provisioned with Unique Random Salts ===');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[ERROR] Provisioning failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

provisionDevCredentials()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
