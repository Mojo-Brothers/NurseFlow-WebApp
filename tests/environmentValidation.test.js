import { describe, it, expect } from 'vitest';
import { validateEnvironment } from '../server/config/envValidator.js';

describe('Environment Validator & Production Security Guard', () => {
  it('should pass validation in test mode with isolated synthetic env', () => {
    const result = validateEnvironment({ NODE_ENV: 'test' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing mandatory environment variables in production mode', () => {
    const result = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '5000'
      // missing JWT_SECRET, DATABASE_URL, POSTGRES_PASSWORD
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('JWT_SECRET'))).toBe(true);
    expect(result.errors.some(e => e.includes('DATABASE_URL'))).toBe(true);
  });

  it('should reject weak or placeholder JWT_SECRET in production', () => {
    const result = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '5000',
      DATABASE_URL: 'postgresql://prod:prod@localhost:5432/db',
      POSTGRES_PASSWORD: 'secure_prod_password_123',
      JWT_SECRET: 'password123'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Insecure JWT_SECRET') || e.includes('Weak JWT_SECRET'))).toBe(true);
  });

  it('should approve valid and strong production configuration', () => {
    const result = validateEnvironment({
      NODE_ENV: 'production',
      PORT: '5000',
      DATABASE_URL: 'postgresql://' + 'mock_admin:mock_password@' + 'localhost:5432/nurseflow',
      POSTGRES_PASSWORD: 'StrongPassword2026!',
      JWT_SECRET: 'k9#mP2$xL9!vQ8*wZ5@rT1^bY4%uJ7&cN0(eA3)dF6_sH8' // 47 chars
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
