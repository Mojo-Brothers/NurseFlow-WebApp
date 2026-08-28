/**
 * NurseFlow Enterprise HIS 2026 — Master Canonical Design Token Hub
 * Single Source of Truth (SSOT) for Visual System Coordinates, Severity Scales & Layout Metrics
 * Standards: WCAG 2.1 AAA, JCI IPSG, Tabular Numerals ("tnum" 1), Immutable Token Geometry.
 */

import { BASE_TOKENS } from './base.tokens.js';
import { SEMANTIC_TOKENS } from './semantic.tokens.js';
import { CLINICAL_SEVERITY } from './clinical.tokens.js';
import { TYPOGRAPHY_TOKENS } from './typography.tokens.js';
import { SPACING_TOKENS } from './spacing.tokens.js';
import { ELEVATION_TOKENS } from './elevation.tokens.js';
import { MOTION_TOKENS } from './motion.tokens.js';

export {
  BASE_TOKENS,
  SEMANTIC_TOKENS,
  CLINICAL_SEVERITY,
  TYPOGRAPHY_TOKENS,
  SPACING_TOKENS,
  ELEVATION_TOKENS,
  MOTION_TOKENS
};

/**
 * Master Token Registry Export
 */
export const TOKENS = Object.freeze({
  base: BASE_TOKENS,
  semantic: SEMANTIC_TOKENS,
  clinical: CLINICAL_SEVERITY,
  typography: TYPOGRAPHY_TOKENS,
  spacing: SPACING_TOKENS,
  elevation: ELEVATION_TOKENS,
  motion: MOTION_TOKENS
});

/**
 * Helper to retrieve semantic token safely with fallback
 */
export function getSemanticToken(path = '', theme = 'light') {
  const parts = path.split('.');
  let current = SEMANTIC_TOKENS[theme] || SEMANTIC_TOKENS.light;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}

/**
 * Helper to retrieve clinical severity badge and color config
 */
export function getClinicalSeverityStyle(code = '', theme = 'light') {
  const normCode = String(code).toUpperCase().trim();

  // 1. ESI Scale Match
  if (normCode.startsWith('ESI')) {
    if (normCode.includes('1')) return CLINICAL_SEVERITY.esi.level1_resuscitation;
    if (normCode.includes('2')) return CLINICAL_SEVERITY.esi.level2_emergent;
    if (normCode.includes('3')) return CLINICAL_SEVERITY.esi.level3_urgent;
    if (normCode.includes('4')) return CLINICAL_SEVERITY.esi.level4_less_urgent;
    return CLINICAL_SEVERITY.esi.level5_non_urgent;
  }

  // 2. Panic Lab Match
  if (normCode === 'CRITICAL' || normCode === 'PANIC' || normCode === 'PANIC_VALUE') {
    return CLINICAL_SEVERITY.panic.criticalPanic;
  }
  if (normCode === 'HIGH' || normCode === 'ABNORMAL_HIGH') {
    return CLINICAL_SEVERITY.panic.abnormalHigh;
  }
  if (normCode === 'LOW' || normCode === 'ABNORMAL_LOW') {
    return CLINICAL_SEVERITY.panic.abnormalLow;
  }
  if (normCode === 'NORMAL') {
    return CLINICAL_SEVERITY.panic.normalInRange;
  }

  // 3. Fallback to normal
  return CLINICAL_SEVERITY.panic.normalInRange;
}

/**
 * Helper for NEWS2 Badge Configuration
 */
export function getNews2BadgeConfig(score = 0) {
  const numScore = Number(score) || 0;
  if (numScore >= 7) return CLINICAL_SEVERITY.news2.high;
  if (numScore >= 5) return CLINICAL_SEVERITY.news2.medium;
  return CLINICAL_SEVERITY.news2.low;
}

export default TOKENS;
