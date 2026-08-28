/**
 * NurseFlow Enterprise HIS 2026 — Phase D1 Design Token Foundation Test Suite
 * 
 * Verifies:
 * 1. Token Registry Immutability & Deep Object Freezing.
 * 2. Dual-Theme Semantic Token Symmetry (Light vs Dark).
 * 3. Zero-Ambiguity Clinical Severity & Safety Scale Completeness (ESI, Panic Lab, NEWS2, High-Alert Meds).
 * 4. Tabular Numerals ("tnum" 1) & Medical Typography Alignment.
 * 5. Authoritative Stacking Context (Z-Index) Hierarchy Guarantee (Safety Modal > Toast > Dialog > HUD > Canvas).
 * 6. Semantic Resolution Helper Utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  TOKENS,
  BASE_TOKENS,
  SEMANTIC_TOKENS,
  CLINICAL_SEVERITY,
  TYPOGRAPHY_TOKENS,
  SPACING_TOKENS,
  ELEVATION_TOKENS,
  MOTION_TOKENS,
  getSemanticToken,
  getClinicalSeverityStyle,
  getNews2BadgeConfig
} from '../src/design-system/tokens/index.js';

describe('🎨 Phase D1: Design Token Foundation SSOT Suite', () => {

  // =========================================================================
  // 1. TOKEN REGISTRY IMMUTABILITY & INTEGRITY
  // =========================================================================
  describe('🔒 1. Immutability & Token Registry Integrity', () => {
    it('1.1 should ensure master TOKENS registry is frozen', () => {
      expect(Object.isFrozen(TOKENS)).toBe(true);
      expect(Object.isFrozen(BASE_TOKENS)).toBe(true);
      expect(Object.isFrozen(SEMANTIC_TOKENS)).toBe(true);
      expect(Object.isFrozen(CLINICAL_SEVERITY)).toBe(true);
      expect(Object.isFrozen(TYPOGRAPHY_TOKENS)).toBe(true);
      expect(Object.isFrozen(SPACING_TOKENS)).toBe(true);
      expect(Object.isFrozen(ELEVATION_TOKENS)).toBe(true);
      expect(Object.isFrozen(MOTION_TOKENS)).toBe(true);
    });

    it('1.2 should prevent runtime mutation of base primitive colors', () => {
      expect(() => {
        BASE_TOKENS.ocean[500] = '#000000';
      }).toThrow();
    });

    it('1.3 should prevent runtime mutation of clinical severity tokens', () => {
      expect(() => {
        CLINICAL_SEVERITY.esi.level1_resuscitation.color = '#00FF00';
      }).toThrow();
    });
  });

  // =========================================================================
  // 2. DUAL-THEME SEMANTIC SYMMETRY
  // =========================================================================
  describe('🌓 2. Dual-Theme Semantic Completeness (Light & Dark)', () => {
    it('2.1 should have matching top-level category keys between light and dark themes', () => {
      const lightKeys = Object.keys(SEMANTIC_TOKENS.light);
      const darkKeys = Object.keys(SEMANTIC_TOKENS.dark);
      expect(lightKeys).toEqual(darkKeys);
      expect(lightKeys).toContain('canvas');
      expect(lightKeys).toContain('surface');
      expect(lightKeys).toContain('text');
      expect(lightKeys).toContain('border');
      expect(lightKeys).toContain('interactive');
    });

    it('2.2 should have matching subkeys for surfaces and canvas', () => {
      expect(Object.keys(SEMANTIC_TOKENS.light.canvas)).toEqual(Object.keys(SEMANTIC_TOKENS.dark.canvas));
      expect(Object.keys(SEMANTIC_TOKENS.light.surface)).toEqual(Object.keys(SEMANTIC_TOKENS.dark.surface));
    });

    it('2.3 should have matching subkeys for text and borders', () => {
      expect(Object.keys(SEMANTIC_TOKENS.light.text)).toEqual(Object.keys(SEMANTIC_TOKENS.dark.text));
      expect(Object.keys(SEMANTIC_TOKENS.light.border)).toEqual(Object.keys(SEMANTIC_TOKENS.dark.border));
    });

    it('2.4 should have high-contrast text defined for both themes', () => {
      expect(SEMANTIC_TOKENS.light.text.primary).toBe(BASE_TOKENS.slate[900]);
      expect(SEMANTIC_TOKENS.dark.text.primary).toBe(BASE_TOKENS.slate[50]);
    });
  });

  // =========================================================================
  // 3. ZERO-AMBIGUITY CLINICAL SEVERITY TOKENS
  // =========================================================================
  describe('🚨 3. Zero-Ambiguity Clinical Severity & Safety Scales', () => {
    it('3.1 ESI Triage: should define all 5 levels with distinct colors and codes', () => {
      const { esi } = CLINICAL_SEVERITY;
      expect(esi.level1_resuscitation.code).toBe('ESI_1');
      expect(esi.level1_resuscitation.color).toBe(BASE_TOKENS.red[600]);

      expect(esi.level2_emergent.code).toBe('ESI_2');
      expect(esi.level2_emergent.color).toBe(BASE_TOKENS.amber[600]);

      expect(esi.level3_urgent.code).toBe('ESI_3');
      expect(esi.level3_urgent.color).toBe(BASE_TOKENS.blue[600]);

      expect(esi.level4_less_urgent.code).toBe('ESI_4');
      expect(esi.level4_less_urgent.color).toBe(BASE_TOKENS.emerald[600]);

      expect(esi.level5_non_urgent.code).toBe('ESI_5');
      expect(esi.level5_non_urgent.color).toBe(BASE_TOKENS.slate[500]);
    });

    it('3.2 Panic Labs: should provide panic value token with emergency glow highlight', () => {
      const { panic } = CLINICAL_SEVERITY;
      expect(panic.criticalPanic.color).toBe(BASE_TOKENS.red[600]);
      expect(panic.criticalPanic.glow).toBeDefined();
      expect(panic.abnormalHigh.color).toBe(BASE_TOKENS.amber[600]);
      expect(panic.abnormalLow.color).toBe(BASE_TOKENS.blue[600]);
      expect(panic.normalInRange.color).toBe(BASE_TOKENS.emerald[600]);
    });

    it('3.3 Medication Safety: should define High-Alert, LASA, and Narcotics classes', () => {
      const { medication } = CLINICAL_SEVERITY;
      expect(medication.highAlert.label).toContain('HIGH ALERT');
      expect(medication.lasaLookAlike.label).toContain('LASA');
      expect(medication.narcoticsPsychotropics.label).toContain('NARKOTIKA');
    });

    it('3.4 NEWS2: should resolve early warning scores accurately', () => {
      expect(getNews2BadgeConfig(1)).toBe(CLINICAL_SEVERITY.news2.low);
      expect(getNews2BadgeConfig(5)).toBe(CLINICAL_SEVERITY.news2.medium);
      expect(getNews2BadgeConfig(8)).toBe(CLINICAL_SEVERITY.news2.high);
    });
  });

  // =========================================================================
  // 4. TABULAR NUMERALS & TYPOGRAPHY METRICS
  // =========================================================================
  describe('🔤 4. Tabular Numerals & Typography Scaling', () => {
    it('4.1 should enforce tabular numerals font features for clinical vitals', () => {
      expect(TYPOGRAPHY_TOKENS.features.tabularNumerals).toBe('"tnum" 1');
      expect(TYPOGRAPHY_TOKENS.features.slashedZero).toBe('"zero" 1');
      expect(TYPOGRAPHY_TOKENS.features.clinicalVitalsMono).toContain('tnum');
    });

    it('4.2 should define comprehensive font size hierarchy from 2xs to 4xl', () => {
      const { fontSize } = TYPOGRAPHY_TOKENS;
      expect(fontSize['2xs']).toBe('0.6875rem'); // 11px
      expect(fontSize.xs).toBe('0.75rem');       // 12px
      expect(fontSize.sm).toBe('0.875rem');      // 14px
      expect(fontSize.base).toBe('1rem');        // 16px
      expect(fontSize['2xl']).toBe('1.5rem');    // 24px - Vitals HUD
      expect(fontSize['4xl']).toBe('2.25rem');   // 36px - ICU monitor
    });
  });

  // =========================================================================
  // 5. AUTHORITATIVE Z-INDEX STACKING HIERARCHY
  // =========================================================================
  describe('🥞 5. Z-Index Layer Stacking Hierarchy', () => {
    it('5.1 should guarantee safetyHardStopModal has the highest priority over all layers', () => {
      const { zIndex } = ELEVATION_TOKENS;
      expect(zIndex.safetyHardStopModal).toBe(9999);
      expect(zIndex.safetyHardStopModal).toBeGreaterThan(zIndex.toastNotification);
      expect(zIndex.toastNotification).toBeGreaterThan(zIndex.modalDialog);
      expect(zIndex.modalDialog).toBeGreaterThan(zIndex.drawerSidebar);
      expect(zIndex.drawerSidebar).toBeGreaterThan(zIndex.dropdownPopover);
      expect(zIndex.dropdownPopover).toBeGreaterThan(zIndex.topNavbar);
      expect(zIndex.topNavbar).toBeGreaterThan(zIndex.patientRibbonHud);
      expect(zIndex.patientRibbonHud).toBeGreaterThan(zIndex.tableHeaderSticky);
      expect(zIndex.tableHeaderSticky).toBeGreaterThan(zIndex.base);
    });
  });

  // =========================================================================
  // 6. UTILITY RESOLUTION HELPERS
  // =========================================================================
  describe('🛠️ 6. Token Resolution Utilities', () => {
    it('6.1 getSemanticToken: should resolve deep token paths for light and dark modes', () => {
      expect(getSemanticToken('text.primary', 'light')).toBe(BASE_TOKENS.slate[900]);
      expect(getSemanticToken('text.primary', 'dark')).toBe(BASE_TOKENS.slate[50]);
      expect(getSemanticToken('canvas.default', 'dark')).toBe(BASE_TOKENS.slate[950]);
      expect(getSemanticToken('non.existent.path')).toBeNull();
    });

    it('6.2 getClinicalSeverityStyle: should correctly resolve ESI and Panic styles', () => {
      expect(getClinicalSeverityStyle('ESI_1')).toBe(CLINICAL_SEVERITY.esi.level1_resuscitation);
      expect(getClinicalSeverityStyle('ESI_3')).toBe(CLINICAL_SEVERITY.esi.level3_urgent);
      expect(getClinicalSeverityStyle('CRITICAL')).toBe(CLINICAL_SEVERITY.panic.criticalPanic);
      expect(getClinicalSeverityStyle('NORMAL')).toBe(CLINICAL_SEVERITY.panic.normalInRange);
    });
  });
});
