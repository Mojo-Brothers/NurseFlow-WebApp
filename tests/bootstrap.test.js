import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Developer Bootstrap Wizard & Multi-Device Setup', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('should have .env.example with zero live production secrets', () => {
    const envExamplePath = path.join(rootDir, '.env.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);

    const content = fs.readFileSync(envExamplePath, 'utf8');
    expect(content).toContain('POSTGRES_DB=');
    expect(content).toContain('JWT_SECRET=');
    expect(content).toContain('your_local_postgres_password_here');
    // Ensure no actual hardcoded live secret
    expect(content).not.toContain('production_super_secret');
  });

  it('should have .gitignore actively excluding .env and sensitive certificate/key files', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const content = fs.readFileSync(gitignorePath, 'utf8');
    expect(content).toContain('.env');
    expect(content).toContain('!.env.example');
    expect(content).toContain('*.key');
    expect(content).toContain('*.pem');
    expect(content).toContain('service-account*.json');
  });

  it('should have required developer bootstrap and secret scanning scripts', () => {
    const setupScriptPath = path.join(rootDir, 'scripts', 'setup.js');
    const scannerScriptPath = path.join(rootDir, 'scripts', 'scan-secrets.js');

    expect(fs.existsSync(setupScriptPath)).toBe(true);
    expect(fs.existsSync(scannerScriptPath)).toBe(true);
  });
});
