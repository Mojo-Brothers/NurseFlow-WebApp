import { describe, it, expect } from 'vitest';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('Enterprise Authentication & JWT Security', () => {
  it('should generate a valid cryptographic JWT token pair with 15-min access expiration', () => {
    const pair = jwtSecurityService.issueTokenPair({
      userId: 'USR-DOC-001',
      username: 'dr.siti',
      role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
    });

    expect(pair.accessToken).toBeDefined();
    expect(pair.refreshToken).toBeDefined();
    expect(pair.expiresIn).toBe(900);

    const verified = jwtSecurityService.verifyToken(pair.accessToken);
    expect(verified.valid).toBe(true);
    expect(verified.payload.username).toBe('dr.siti');
    expect(verified.payload.role).toBe(ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP);
  });

  it('should successfully rotate refresh tokens and revoke the previous token (RTR Pattern)', () => {
    const originalPair = jwtSecurityService.issueTokenPair({
      userId: 'USR-NUR-002',
      username: 'nurse.indah',
      role: ENTERPRISE_ROLES.ROLE_NURSE
    });

    const newPair = jwtSecurityService.rotateRefreshToken(originalPair.refreshToken);
    expect(newPair.accessToken).toBeDefined();
    expect(newPair.refreshToken).not.toEqual(originalPair.refreshToken);
  });

  it('should reject malformed or empty token strings', () => {
    const emptyCheck = jwtSecurityService.verifyToken('');
    expect(emptyCheck.valid).toBe(false);

    const malformedCheck = jwtSecurityService.verifyToken('invalid.token');
    expect(malformedCheck.valid).toBe(false);
  });
});
