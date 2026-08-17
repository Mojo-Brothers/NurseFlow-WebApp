import { describe, it, expect } from 'vitest';
import { sanitizeLogData } from '../server/utils/logSanitizer.js';

describe('Log Sanitization & Credential Redaction', () => {
  it('should redact sensitive keys (password, token, authorization) in log payloads', () => {
    const rawLog = {
      userId: 'USR-001',
      username: 'dr_siti',
      password: 'superSecretPassword!',
      token: 'jwt.sample.token.payload',
      authorization: 'Bearer sample-token-123',
      metadata: {
        attempt: 1,
        apiKey: 'sk_live_123456789'
      }
    };

    const sanitized = sanitizeLogData(rawLog);

    expect(sanitized.username).toBe('dr_siti');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.authorization).toBe('[REDACTED]');
  });
});
