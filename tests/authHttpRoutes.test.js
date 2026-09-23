/**
 * tests/authHttpRoutes.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * NurseFlow Enterprise HIS 2026 — Stage 1 Vertical Slice P0-1 HTTP Route Tests
 * Verifies RFC 7807 problem details, anti-enumeration, rate limiting, and lockout.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../server/server.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { redisRateLimiterService } from '../server/services/redisRateLimiter.service.js';

let server;
let baseUrl;

describe('Vertical Slice P0-1: HTTP /api/v1/auth Route Integration', () => {
  beforeAll(async () => {
    // Reset rate limiter store for clean testing
    redisRateLimiterService.resetStore();

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Reset test user counters
    await postgresPoolService.query(
      "UPDATE auth_users SET failed_login_attempts = 0 WHERE username IN ('dr.siti.wijaya', 'dr.budi.santoso', 'admin.dev')"
    );
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('1. POST /api/v1/auth/login with wrong credentials should return 401 with RFC 7807 Problem Details', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dr.siti.wijaya',
        password: 'IncorrectPassword123!'
      })
    });

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    expect(res.headers.get('x-correlation-id')).toBeDefined();

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('INVALID_CREDENTIALS');
    expect(body.type).toContain('unauthenticated');
    expect(body.detail).toBe('Kombinasi nama pengguna atau kata sandi tidak valid.');
  });

  it('2. Anti-Enumeration: unknown username must return identical 401 response contract as wrong password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'nonexistent.doctor.attacker.target',
        password: 'RandomPassword123!'
      })
    });

    expect(res.status).toBe(401);
    expect(res.headers.get('content-type')).toContain('application/problem+json');

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('INVALID_CREDENTIALS');
    expect(body.type).toContain('unauthenticated');
    expect(body.detail).toBe('Kombinasi nama pengguna atau kata sandi tidak valid.');
  });

  it('3. POST /api/v1/auth/login for dr.siti.wijaya: must have ROLE_DOCTOR_DPJP and NOT ROLE_SUPER_ADMIN', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dr.siti.wijaya',
        password: 'NurseFlow2026!'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe('dr.siti.wijaya');
    expect(body.data.fullName).toBe('dr. Siti Wijaya, Sp.PD-KGEH');
    expect(body.data.role).toBe('ROLE_DOCTOR_DPJP');
    expect(body.data.roles).toContain('ROLE_DOCTOR_DPJP');
    // Critical Separation of Duties: She must NOT have ROLE_SUPER_ADMIN
    expect(body.data.roles).not.toContain('ROLE_SUPER_ADMIN');
  });

  it('4. POST /api/v1/auth/login for admin.dev: dedicated dev admin has ROLE_SUPER_ADMIN', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin.dev',
        password: 'NurseFlow2026!'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.username).toBe('admin.dev');
    expect(body.data.role).toBe('ROLE_SUPER_ADMIN');
    expect(body.data.roles).toContain('ROLE_SUPER_ADMIN');
  });

  it('5. POST /api/v1/auth/login for dr.budi.santoso: canonical mapping to ROLE_DOCTOR_EMERGENCY', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'dr.budi.santoso',
        password: 'NurseFlow2026!'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe('ROLE_DOCTOR_EMERGENCY');
    expect(body.data.roles).toContain('ROLE_DOCTOR_EMERGENCY');
  });

  it('6. Account Lockout: 5 failed attempts trigger 423 ACCOUNT_LOCKED (RFC 7807)', async () => {
    // Reset counter first
    await postgresPoolService.query("UPDATE auth_users SET failed_login_attempts = 4 WHERE username = 'apt.dimas'");

    // 5th failed attempt
    const res5 = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'apt.dimas',
        password: 'WrongPasswordAttempt5!'
      })
    });

    expect(res5.status).toBe(423);
    expect(res5.headers.get('content-type')).toContain('application/problem+json');
    const body5 = await res5.json();
    expect(body5.error).toBe('ACCOUNT_LOCKED');
    expect(body5.status).toBe(423);
    expect(body5.detail).toContain('terkunci sementara');

    // Subsequent attempt with CORRECT password must still be rejected while locked
    const resCorrect = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'apt.dimas',
        password: 'NurseFlow2026!'
      })
    });

    expect(resCorrect.status).toBe(423);
    const bodyCorrect = await resCorrect.json();
    expect(bodyCorrect.error).toBe('ACCOUNT_LOCKED');

    // Clean up
    await postgresPoolService.query("UPDATE auth_users SET failed_login_attempts = 0 WHERE username = 'apt.dimas'");
  });

  it('7. Rate Limiter: Per-IP limiting triggers 429 Too Many Requests after threshold', async () => {
    // Set custom IP via header to isolate test bucket
    const testIp = '192.168.100.55';
    const clientHeaders = {
      'Content-Type': 'application/json',
      'X-Forwarded-For': testIp
    };

    // Rapid attempts (rateLimiter configured to 10 max requests per 60s window)
    let lastRes;
    for (let i = 0; i < 11; i++) {
      lastRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: clientHeaders,
        body: JSON.stringify({
          username: 'dr.siti.wijaya',
          password: 'NurseFlow2026!'
        })
      });
    }

    // 11th request should be blocked by rate limiter
    expect(lastRes.status).toBe(429);
    expect(lastRes.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(lastRes.headers.get('x-ratelimit-limit')).toBe('10');
    const body = await lastRes.json();
    expect(body.error).toBe('TOO_MANY_REQUESTS');
    expect(body.retryAfter).toBeDefined();
  });
});
