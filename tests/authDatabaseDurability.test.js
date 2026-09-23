/**
 * tests/authDatabaseDurability.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NurseFlow Enterprise HIS 2026 — Stage 1 Vertical Slice P0-1 Durability Test
 * REAL POSTGRESQL 16 PERSISTENCE & CRYPTOGRAPHIC VERIFICATION GATE
 * Standards: OWASP ASVS 4.0, NIST SP 800-132, NIST SP 800-63B, RFC 7807
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { authService } from '../server/services/auth.service.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';
import { passwordSecurity } from '../server/utils/passwordSecurity.js';

describe('Vertical Slice P0-1 Verification Gate: Database-Backed Identity & Auth Durability', () => {
  beforeAll(async () => {
    // 1. Verify direct connection to live PostgreSQL 16
    const res = await postgresPoolService.query('SELECT current_database(), current_user, version()');
    expect(res.rows[0].current_database).toBe('nurseflow_enterprise_his');

    // 2. Clean test counters
    await postgresPoolService.query(
      "UPDATE auth_users SET failed_login_attempts = 0 WHERE username IN ('dr.siti.wijaya', 'dr.budi.santoso', 'ners.indah', 'apt.dimas', 'admin.dev')"
    );
  });

  afterAll(async () => {
    // Reset test user counters
    await postgresPoolService.query(
      "UPDATE auth_users SET failed_login_attempts = 0 WHERE username IN ('dr.siti.wijaya', 'dr.budi.santoso', 'ners.indah', 'apt.dimas', 'admin.dev')"
    );
  });

  // ─── 1. PASSWORD CREDENTIAL HARDENING ───
  describe('Gate 1: Password Credential Hardening & Scrypt Parameters', () => {
    it('1.1: Two credentials with the same password must produce different hashes', () => {
      const password = 'NurseFlowPassword2026!';
      const hash1 = passwordSecurity.hashPassword(password);
      const hash2 = passwordSecurity.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('1.2: Salts for both credentials must be distinct and at least 128-bit (16 bytes)', () => {
      const password = 'NurseFlowPassword2026!';
      const hash1 = passwordSecurity.hashPassword(password);
      const hash2 = passwordSecurity.hashPassword(password);

      const parts1 = hash1.split('$');
      const parts2 = hash2.split('$');

      // scrypt$params$salt$key
      const salt1 = parts1[2];
      const salt2 = parts2[2];

      expect(salt1).not.toBe(salt2);
      expect(salt1.length).toBe(32); // 32 hex chars = 16 bytes = 128 bits
      expect(salt2.length).toBe(32);
    });

    it('1.3: Stored credential must explicitly encode algorithm, parameters, salt, and key', () => {
      const hash = passwordSecurity.hashPassword('NurseFlowPassword2026!');
      expect(hash).toMatch(/^scrypt\$N=16384,r=8,p=1,maxmem=33554432\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
    });

    it('1.4: Correct password verifies to true; wrong password verifies to false', () => {
      const password = 'ValidDoctorSecret123!';
      const hash = passwordSecurity.hashPassword(password);

      expect(passwordSecurity.verifyPassword(password, hash)).toBe(true);
      expect(passwordSecurity.verifyPassword('IncorrectSecret999!', hash)).toBe(false);
    });

    it('1.5: Malformed credentials must be safely rejected without throwing exceptions', () => {
      expect(passwordSecurity.verifyPassword('pass', 'not-a-hash')).toBe(false);
      expect(passwordSecurity.verifyPassword('pass', 'scrypt$bad$malformed$hash')).toBe(false);
      expect(passwordSecurity.verifyPassword('pass', 'scrypt$N=invalid$xyz$abc')).toBe(false);
      expect(passwordSecurity.verifyPassword('pass', null)).toBe(false);
      expect(passwordSecurity.verifyPassword(null, 'scrypt$a$b$c')).toBe(false);
    });

    it('1.6: DoS Defense: Excessively expensive scrypt parameters must be rejected without executing scrypt', () => {
      const validSalt = 'a'.repeat(32);
      const validKey = 'b'.repeat(128);
      // N = 1048576 (Huge computation DoS attack)
      const hugeN = `scrypt$N=1048576,r=8,p=1,maxmem=33554432$${validSalt}$${validKey}`;
      expect(passwordSecurity.verifyPassword('test', hugeN)).toBe(false);

      // maxmem = 1GB (Memory exhaustion DoS attack)
      const hugeMem = `scrypt$N=16384,r=8,p=1,maxmem=1073741824$${validSalt}$${validKey}`;
      expect(passwordSecurity.verifyPassword('test', hugeMem)).toBe(false);

      // r = 64 (Resource DoS)
      const hugeR = `scrypt$N=16384,r=64,p=1,maxmem=33554432$${validSalt}$${validKey}`;
      expect(passwordSecurity.verifyPassword('test', hugeR)).toBe(false);
    });

    it('1.7: Downgrade Resistance: Parameters weaker than NIST minimums must be rejected', () => {
      const validSalt = 'a'.repeat(32);
      const validKey = 'b'.repeat(128);
      // N = 1024 (Weakened scrypt downgrade attack)
      const weakN = `scrypt$N=1024,r=8,p=1,maxmem=33554432$${validSalt}$${validKey}`;
      expect(passwordSecurity.verifyPassword('test', weakN)).toBe(false);

      // r = 1, p = 1 (Trivial work)
      const weakR = `scrypt$N=16384,r=1,p=1,maxmem=33554432$${validSalt}$${validKey}`;
      expect(passwordSecurity.verifyPassword('test', weakR)).toBe(false);
    });

    it('1.8: Non-power-of-two N must be rejected immediately without runtime exception', () => {
      const validSalt = 'a'.repeat(32);
      const validKey = 'b'.repeat(128);
      const nonPow2 = `scrypt$N=16385,r=8,p=1,maxmem=33554432$${validSalt}$${validKey}`;
      expect(passwordSecurity.verifyPassword('test', nonPow2)).toBe(false);
    });

    it('1.9: Passwords exceeding 1024 characters must be rejected immediately to prevent buffer flooding DoS', () => {
      const hash = passwordSecurity.hashPassword('ShortPass123!');
      const massivePass = 'A'.repeat(1025);
      expect(passwordSecurity.verifyPassword(massivePass, hash)).toBe(false);
    });
  });

  // ─── 2. DEV CREDENTIAL ISOLATION & SEPARATION OF DUTIES ───
  describe('Gate 2: Dev Credential Isolation & Separation of Duties', () => {
    it('2.1: dr.siti.wijaya must have ROLE_DOCTOR_DPJP and MUST NOT have ROLE_SUPER_ADMIN', async () => {
      const res = await authService.authenticateUser('dr.siti.wijaya', 'NurseFlow2026!');
      expect(res.success).toBe(true);
      expect(res.user.role).toBe('ROLE_DOCTOR_DPJP');
      expect(res.user.roles).toContain('ROLE_DOCTOR_DPJP');
      expect(res.user.roles).not.toContain('ROLE_SUPER_ADMIN');
    });

    it('2.2: admin.dev must be the dedicated IT admin with ROLE_SUPER_ADMIN', async () => {
      const res = await authService.authenticateUser('admin.dev', 'NurseFlow2026!');
      expect(res.success).toBe(true);
      expect(res.user.role).toBe('ROLE_SUPER_ADMIN');
      expect(res.user.roles).toContain('ROLE_SUPER_ADMIN');
      expect(res.user.fullName).toBe('Dev IT Administrator, S.Kom');
      expect(res.user.employeeNumber).toBe('EMP-IT-DEV-001');
    });

    it('2.3: dr.budi.santoso must have ROLE_DOCTOR_EMERGENCY', async () => {
      const res = await authService.authenticateUser('dr.budi.santoso', 'NurseFlow2026!');
      expect(res.success).toBe(true);
      expect(res.user.role).toBe('ROLE_DOCTOR_EMERGENCY');
      expect(res.user.roles).toContain('ROLE_DOCTOR_EMERGENCY');
    });
  });

  // ─── 3. ACCOUNT LOCKOUT SEQUENCE & ATOMIC CONCURRENCY ───
  describe('Gate 3: Account Lockout Sequence & Atomic Concurrency', () => {
    it('3.1: Sequential failed attempts 1..5 trigger account lockout and reject subsequent correct password', async () => {
      const testUser = 'ners.indah';
      await postgresPoolService.query("UPDATE auth_users SET failed_login_attempts = 0 WHERE username = $1", [testUser]);

      // Attempts 1 to 4: should return 401 INVALID_CREDENTIALS
      for (let i = 1; i <= 4; i++) {
        const res = await authService.authenticateUser(testUser, `WrongPassword_${i}`);
        expect(res.success).toBe(false);
        expect(res.statusCode).toBe(401);
        expect(res.error).toBe('INVALID_CREDENTIALS');

        const dbCheck = await postgresPoolService.query(
          "SELECT failed_login_attempts FROM auth_users WHERE username = $1",
          [testUser]
        );
        expect(dbCheck.rows[0].failed_login_attempts).toBe(i);
      }

      // Attempt 5: triggers lockout (status 423)
      const res5 = await authService.authenticateUser(testUser, 'WrongPassword_5');
      expect(res5.success).toBe(false);
      expect(res5.statusCode).toBe(423);
      expect(res5.error).toBe('ACCOUNT_LOCKED');

      // Attempt 6 with CORRECT password: MUST REMAIN REJECTED (status 423) while locked
      const resCorrect = await authService.authenticateUser(testUser, 'NurseFlow2026!');
      expect(resCorrect.success).toBe(false);
      expect(resCorrect.statusCode).toBe(423);
      expect(resCorrect.error).toBe('ACCOUNT_LOCKED');

      // Reset test account
      await postgresPoolService.query("UPDATE auth_users SET failed_login_attempts = 0 WHERE username = $1", [testUser]);
    });

    it('3.2: Successful login resets counter ONLY when account is allowed to authenticate', async () => {
      const testUser = 'apt.dimas';
      // Set to 2 failed attempts
      await postgresPoolService.query("UPDATE auth_users SET failed_login_attempts = 2 WHERE username = $1", [testUser]);

      const res = await authService.authenticateUser(testUser, 'NurseFlow2026!');
      expect(res.success).toBe(true);

      const dbCheck = await postgresPoolService.query(
        "SELECT failed_login_attempts FROM auth_users WHERE username = $1",
        [testUser]
      );
      expect(dbCheck.rows[0].failed_login_attempts).toBe(0);
    });

    it('3.3: Concurrency: Parallel failed attempts must not suffer from lost-update race conditions', async () => {
      const testUser = 'dr.budi.santoso';
      await postgresPoolService.query("UPDATE auth_users SET failed_login_attempts = 0 WHERE username = $1", [testUser]);

      // Fire 3 simultaneous failed logins concurrently
      await Promise.all([
        authService.authenticateUser(testUser, 'ParallelWrong1!'),
        authService.authenticateUser(testUser, 'ParallelWrong2!'),
        authService.authenticateUser(testUser, 'ParallelWrong3!')
      ]);

      const dbCheck = await postgresPoolService.query(
        "SELECT failed_login_attempts FROM auth_users WHERE username = $1",
        [testUser]
      );
      // Atomic increment guarantee: count must be precisely 3
      expect(dbCheck.rows[0].failed_login_attempts).toBe(3);

      // Clean up
      await postgresPoolService.query("UPDATE auth_users SET failed_login_attempts = 0 WHERE username = $1", [testUser]);
    });
  });

  // ─── 4. CRYPTOGRAPHIC JWT SECURITY AUDIT & NEGATIVE TESTS ───
  describe('Gate 4: Cryptographic JWT Security Audit & Negative Tests', () => {
    it('4.1: Positive: Issues valid JWT with standard HS256 and expected claims', () => {
      const pair = jwtSecurityService.issueTokenPair({
        userId: 'd0000000-0000-0000-0000-000000000001',
        username: 'dr.siti.wijaya',
        role: 'ROLE_DOCTOR_DPJP',
        staffId: 'a0000000-0000-0000-0000-000000000001'
      });

      const check = jwtSecurityService.verifyToken(pair.accessToken);
      expect(check.valid).toBe(true);
      expect(check.payload.sub).toBe('d0000000-0000-0000-0000-000000000001');
      expect(check.payload.iss).toBe('nurseflow-enterprise-his');
      expect(check.payload.role).toBe('ROLE_DOCTOR_DPJP');
    });

    it('4.2: Negative: Rejects tampered signature (Tampering Detection)', () => {
      const pair = jwtSecurityService.issueTokenPair({
        userId: 'd0000000-0000-0000-0000-000000000001',
        username: 'dr.siti.wijaya'
      });

      const tampered = pair.accessToken.slice(0, -6) + 'xxxxxx';
      const check = jwtSecurityService.verifyToken(tampered);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('Signature JWT tidak valid');
    });

    it('4.3: Negative: Rejects tampered payload', () => {
      const pair = jwtSecurityService.issueTokenPair({
        userId: 'd0000000-0000-0000-0000-000000000001',
        username: 'dr.siti.wijaya',
        role: 'ROLE_DOCTOR_DPJP'
      });

      const parts = pair.accessToken.split('.');
      const evilPayload = Buffer.from(JSON.stringify({
        sub: 'd0000000-0000-0000-0000-000000000001',
        userId: 'd0000000-0000-0000-0000-000000000001',
        role: 'ROLE_SUPER_ADMIN',
        iss: 'nurseflow-enterprise-his'
      })).toString('base64url');

      const evilToken = `${parts[0]}.${evilPayload}.${parts[2]}`;
      const check = jwtSecurityService.verifyToken(evilToken);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('Signature JWT tidak valid');
    });

    it('4.4: Negative: Rejects non-HS256 algorithms (e.g., none, RS256)', () => {
      const pair = jwtSecurityService.issueTokenPair({
        userId: 'd0000000-0000-0000-0000-000000000001',
        username: 'dr.siti.wijaya'
      });

      const parts = pair.accessToken.split('.');
      const evilHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const evilToken = `${evilHeader}.${parts[1]}.`;

      const check = jwtSecurityService.verifyToken(evilToken);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('Hanya HS256 yang diizinkan');
    });

    it('4.5: Negative: Rejects revoked token (Session Revocation / Logout)', () => {
      const pair = jwtSecurityService.issueTokenPair({
        userId: 'd0000000-0000-0000-0000-000000000001',
        username: 'dr.siti.wijaya'
      });

      jwtSecurityService.revokeToken(pair.accessToken);
      const check = jwtSecurityService.verifyToken(pair.accessToken);
      expect(check.valid).toBe(false);
      expect(check.revoked).toBe(true);
    });
  });

  // ─── 5. CANONICAL STAFF PROFILE RETRIEVAL ───
  describe('Gate 5: Canonical Staff Profile Retrieval from master_staff', () => {
    it('5.1: Retrieves rich demography and legal identification from master_staff', async () => {
      const profile = await authService.getUserProfile('d0000000-0000-0000-0000-000000000001');
      expect(profile).not.toBeNull();
      expect(profile.username).toBe('dr.siti.wijaya');
      expect(profile.fullName).toBe('dr. Siti Wijaya, Sp.PD-KGEH');
      expect(profile.employeeNumber).toBe('EMP-DOC-101');
      expect(profile.email).toBe('dr.siti.wijaya@nurseflow.id');
      expect(profile.nik).toBe('3171012345670001');
      expect(profile.role).toBe('ROLE_DOCTOR_DPJP');
    });
  });
});
