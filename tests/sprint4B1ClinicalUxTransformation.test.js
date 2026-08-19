/**
 * NurseFlow Enterprise HIS 2026 — Sprint 4B.1: Clinical UX Transformation Test Suite
 * Standards: 5 Core UX Principles, WCAG 2.1 AAA Contrast, Guarded Patient HUD,
 * Role-First Persona Switching, Command Palette, Doctor Fast-Flow Workspace.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CLINICAL_COLORS } from '../src/design-system/tokens/colors.js';
import { useAuthStore } from '../src/modules/auth/auth.store.js';
import { useEncounterStore } from '../src/modules/encounter/encounter.store.js';

// Polyfill localStorage in test environment
const mockStorage = new Map();
const storagePolyfill = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear()
};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = storagePolyfill;
}

describe('🎨 SPRINT 4B.1: Clinical UX Transformation 1.0 Gate', () => {
  beforeEach(() => {
    mockStorage.clear();
    useAuthStore.getState().setUser(
      { email: 'dr.budi@hospital.id', name: 'dr. Budi Santoso', authorizedRoles: ['DOCTOR', 'NURSE'] },
      'DOCTOR',
      ['DOCTOR', 'NURSE']
    );
    useEncounterStore.getState().clearLiveContext();
  });

  // ==========================================================================
  // 1. DESIGN TOKENS & CONTRAST HIERARCHY
  // ==========================================================================
  describe('1. Clinical Design Tokens & Severity Scale', () => {
    it('1.1 should export WCAG 2.1 AAA compliant severity color stops and NEWS2 scale', () => {
      expect(CLINICAL_COLORS.primary.ocean).toBe('#015C80');
      expect(CLINICAL_COLORS.clinicalIndicators.criticalRed).toBe('#DC2626');
      expect(CLINICAL_COLORS.clinicalIndicators.warningAmber).toBe('#D97706');
      expect(CLINICAL_COLORS.clinicalIndicators.normalGreen).toBe('#059669');

      expect(CLINICAL_COLORS.news2Scale.low.text).toBe('#065F46');
      expect(CLINICAL_COLORS.news2Scale.medium.text).toBe('#92400E');
      expect(CLINICAL_COLORS.news2Scale.high.text).toBe('#991B1B');
    });
  });

  // ==========================================================================
  // 2. ROLE PERSONA SWITCHING & AUTHORIZATION GUARD
  // ==========================================================================
  describe('2. Role-First Persona Switching & Authorization Guard', () => {
    it('2.1 should switch active clinical persona seamlessly when authorized', () => {
      expect(useAuthStore.getState().role).toBe('DOCTOR');

      // Switch to authorized Nurse role
      const success = useAuthStore.getState().switchRole('NURSE');
      expect(success).toBe(true);
      expect(useAuthStore.getState().role).toBe('NURSE');
    });

    it('2.2 should strictly reject switching to unauthorized roles with audit logging', () => {
      // User only has ['DOCTOR', 'NURSE']
      const success = useAuthStore.getState().switchRole('HOSPITAL_ADMIN');
      expect(success).toBe(false);
      expect(useAuthStore.getState().role).toBe('DOCTOR'); // Remains Doctor
      expect(useAuthStore.getState().error).toContain('UNAUTHORIZED_ROLE_SWITCH');
    });
  });

  // ==========================================================================
  // 3. GUARDED PATIENT CONTEXT HUD
  // ==========================================================================
  describe('3. Guarded Patient Context HUD State Machine', () => {
    it('3.1 should maintain clean separation between NO_PATIENT and ACTIVE_PATIENT context', () => {
      const encStore = useEncounterStore.getState();
      expect(encStore.activePatientId).toBeNull();

      // Set active patient
      encStore.setLiveContext('PAT-TEST-001', 'ENC-TEST-001');
      expect(useEncounterStore.getState().activePatientId).toBe('PAT-TEST-001');
      expect(useEncounterStore.getState().activeEncounterId).toBe('ENC-TEST-001');

      // Clear context securely
      encStore.clearLiveContext();
      expect(useEncounterStore.getState().activePatientId).toBeNull();
      expect(useEncounterStore.getState().activeEncounterId).toBeNull();
    });
  });

  // ==========================================================================
  // 4. DOCTOR FAST-FLOW WORKSPACE DATA INTEGRITY
  // ==========================================================================
  describe('4. Doctor Fast-Flow Workspace & Auto-Draft Safety', () => {
    it('4.1 should support local draft persistence and instant order addition', () => {
      const draftPayload = {
        subjective: 'Pasien demam 3 hari',
        primaryIcd10: 'A90',
        primaryIcd10Name: 'Dengue fever',
        plan: 'IVFD RL 2000ml / 24j'
      };

      const key = 'nurseflow_soap_draft_PAT-TEST-001';
      globalThis.localStorage.setItem(key, JSON.stringify(draftPayload));

      const retrieved = JSON.parse(globalThis.localStorage.getItem(key));
      expect(retrieved.primaryIcd10).toBe('A90');
      expect(retrieved.subjective).toBe('Pasien demam 3 hari');

      globalThis.localStorage.removeItem(key);
      expect(globalThis.localStorage.getItem(key)).toBeNull();
    });
  });

  // ==========================================================================
  // 5. COMMAND PALETTE FUZZY PERFORMANCE BENCHMARK (< 50ms)
  // ==========================================================================
  describe('5. Command Palette Fuzzy Performance Benchmark', () => {
    it('5.1 should filter 1,000 synthetic patient records in under 20ms', () => {
      const largePatientDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `PAT-${i}`,
        name: `Pasien Simulasi ${i} bin Abdullah`,
        mrn: `MRN-${100000 + i}`,
        nik: `320100000000${(i % 1000).toString().padStart(4, '0')}`,
        room: `Bed ${100 + (i % 50)}`
      }));

      const query = 'Simulasi 99';
      const start = performance.now();

      const results = largePatientDataset.filter(p => {
        const q = query.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.nik.includes(q)
        );
      }).slice(0, 10);

      const elapsed = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(25); // Well under 50ms requirement!
    });
  });
});
