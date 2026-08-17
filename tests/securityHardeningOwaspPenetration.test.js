/**
 * NurseFlow Enterprise HIS 2026 — OWASP Top 10 Hardening & RBAC Penetration Test Suite
 * Standard: OWASP Top 10 2025, ISO 27001 Access Control & Permenkes No. 24/2022
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { redisRateLimiterService } from '../server/services/redisRateLimiter.service.js';
import {
  securityHardeningEngine,
  SecurityViolationError,
  ForbiddenAccessError
} from '../server/services/securityHardeningEngine.service.js';

describe('Sprint 6: OWASP Top 10 Security Hardening & RBAC Penetration Suite', () => {

  beforeEach(() => {
    redisRateLimiterService.resetStore();
  });

  // 1. Redis Token Bucket Rate Limiter (Brute Force / DDoS Guard)
  it('1. should enforce Redis sliding window rate limiter and block excessive requests with 429 status', () => {
    const clientId = 'IP-192.168.1.105';
    const maxReq = 5;
    const windowSec = 60;

    // Send 5 permitted requests
    for (let i = 1; i <= maxReq; i++) {
      const res = redisRateLimiterService.checkLimit(clientId, maxReq, windowSec);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(maxReq - i);
    }

    // 6th request must be blocked
    const blockedRes = redisRateLimiterService.checkLimit(clientId, maxReq, windowSec);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.error).toBe('TOO_MANY_REQUESTS');
    expect(blockedRes.remaining).toBe(0);
  });

  // 2. Anti-XSS Sanitizer Guard
  it('2. should sanitize and neutralize malicious XSS script tags and DOM event handlers', () => {
    const maliciousInput = '<script>alert("XSS Attack!");</script>Pasien mengalami demam tinggi<img src=x onerror="stealCookie()">';
    const cleanOutput = securityHardeningEngine.sanitizeXss(maliciousInput);

    expect(cleanOutput).not.toContain('<script>');
    expect(cleanOutput).not.toContain('onerror=');
    expect(cleanOutput).toContain('Pasien mengalami demam tinggi');
  });

  // 3. SQL Injection Guard (Detection & Payload Blocking)
  it('3. should detect SQL Injection patterns and block query execution with SecurityViolationError', () => {
    const sqliPayloads = [
      "1' OR '1'='1",
      "'; DROP TABLE patients; --",
      "UNION SELECT username, password FROM users --",
      "admin' --"
    ];

    sqliPayloads.forEach((payload) => {
      const isSqli = securityHardeningEngine.detectSqlInjection(payload);
      expect(isSqli).toBe(true);

      expect(() => {
        securityHardeningEngine.validatePayloadSecurity({ search_query: payload });
      }).toThrow(SecurityViolationError);
    });
  });

  // 4. RBAC Penetration Vector 1: Nurse tries to access Billing Cashier
  it('4. should reject Nurse trying to process Cashier billing with 403 Forbidden', () => {
    expect(() => {
      securityHardeningEngine.enforceRbacBoundary('NURSE', 'billing:process_payment');
    }).toThrow(ForbiddenAccessError);
  });

  // 5. RBAC Penetration Vector 2: Doctor tries to alter Master Hospital Tariffs
  it('5. should reject Doctor trying to modify Master INA-CBG tariffs with 403 Forbidden', () => {
    expect(() => {
      securityHardeningEngine.enforceRbacBoundary('DOCTOR', 'master:manage_tariffs');
    }).toThrow(ForbiddenAccessError);
  });

  // 6. RBAC Penetration Vector 3: Pharmacist tries to delete EMR SOAP CPPT notes
  it('6. should reject Pharmacist trying to delete Doctor EMR notes with 403 Forbidden', () => {
    expect(() => {
      securityHardeningEngine.enforceRbacBoundary('PHARMACIST', 'emr:delete_soap');
    }).toThrow(ForbiddenAccessError);
  });

  // 7. RBAC Penetration Vector 4: Cashier tries to access PACS Radiology DICOM
  it('7. should reject Cashier trying to view / order Radiology PACS with 403 Forbidden', () => {
    expect(() => {
      securityHardeningEngine.enforceRbacBoundary('CASHIER', 'cpoe:order_radiology');
    }).toThrow(ForbiddenAccessError);
  });

  // 8. Legitimate Role Permission Validation
  it('8. should authorize legitimate clinical actions for authorized professional roles', () => {
    expect(securityHardeningEngine.enforceRbacBoundary('DOCTOR', 'cpoe:prescribe')).toBe(true);
    expect(securityHardeningEngine.enforceRbacBoundary('NURSE', 'nursing:administer_emar')).toBe(true);
    expect(securityHardeningEngine.enforceRbacBoundary('PHARMACIST', 'pharmacy:dispense_fefo')).toBe(true);
    expect(securityHardeningEngine.enforceRbacBoundary('CASHIER', 'billing:create_invoice')).toBe(true);
    expect(securityHardeningEngine.enforceRbacBoundary('ADMIN', 'master:manage_tariffs')).toBe(true);
  });

});
