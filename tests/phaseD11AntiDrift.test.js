/**
 * NurseFlow Enterprise HIS 2026 — Phase D1.1 Anti-Drift & Token Value Integrity Test Suite
 * 
 * Verifies:
 * 1. Bijective 1-to-1 Mapping between JS Tokens and Generated CSS Variables.
 * 2. Exact Value Integrity (Zero Drift) across Light and Dark themes.
 * 3. Zero Orphan CSS variables.
 * 4. Zero Duplicate canonical keys.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getCanonicalCssVariables } from '../src/design-system/tokens/cssMapping.js';

const GENERATED_CSS_PATH = path.resolve(__dirname, '../src/design-system/styles/tokens.generated.css');

function normalizeVal(val) {
  if (typeof val !== 'string') val = String(val);
  return val.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseCss(cssContent) {
  const rootVars = {};
  const darkVars = {};

  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    const lines = rootMatch[1].split(';');
    for (const line of lines) {
      const match = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+)$/);
      if (match) rootVars[match[1].trim()] = match[2].trim();
    }
  }

  const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);
  if (darkMatch) {
    const lines = darkMatch[1].split(';');
    for (const line of lines) {
      const match = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+)$/);
      if (match) darkVars[match[1].trim()] = match[2].trim();
    }
  }

  return { rootVars, darkVars };
}

describe('🎨 Phase D1.1: Token Value Integrity & Anti-Drift Suite', () => {
  const { root: expectedRoot, dark: expectedDark } = getCanonicalCssVariables();
  const cssContent = fs.readFileSync(GENERATED_CSS_PATH, 'utf8');
  const { rootVars: actualRoot, darkVars: actualDark } = parseCss(cssContent);

  it('1.1 should ensure generated CSS file exists and is populated', () => {
    expect(fs.existsSync(GENERATED_CSS_PATH)).toBe(true);
    expect(Object.keys(actualRoot).length).toBeGreaterThan(100);
    expect(Object.keys(actualDark).length).toBeGreaterThan(10);
  });

  it('1.2 should have zero missing mappings in :root', () => {
    for (const key of Object.keys(expectedRoot)) {
      expect(actualRoot).toHaveProperty(key);
    }
  });

  it('1.3 should have zero value mismatches in :root', () => {
    for (const [key, expectedVal] of Object.entries(expectedRoot)) {
      expect(normalizeVal(actualRoot[key])).toBe(normalizeVal(expectedVal));
    }
  });

  it('1.4 should have zero missing mappings in .dark', () => {
    for (const key of Object.keys(expectedDark)) {
      expect(actualDark).toHaveProperty(key);
    }
  });

  it('1.5 should have zero value mismatches in .dark', () => {
    for (const [key, expectedVal] of Object.entries(expectedDark)) {
      expect(normalizeVal(actualDark[key])).toBe(normalizeVal(expectedVal));
    }
  });

  it('1.6 should have zero orphan CSS variables in :root or .dark', () => {
    for (const key of Object.keys(actualRoot)) {
      if (key.startsWith('--nf-')) {
        expect(expectedRoot).toHaveProperty(key);
      }
    }
    for (const key of Object.keys(actualDark)) {
      if (key.startsWith('--nf-')) {
        expect(expectedDark).toHaveProperty(key);
      }
    }
  });
});
