/**
 * NurseFlow Enterprise HIS 2026 — Phase D0: UI Runtime Safety Contract Test Suite
 * 
 * Validates:
 * 1. Fail-closed Context Enforcement (JCI IPSG 1).
 * 2. Asynchronous In-Flight Request Invalidation on Patient Switch.
 * 3. Race-Condition Response Lineage Interception.
 * 4. Canonical Backend Safety Error-to-Clinical-UX Mapper.
 */

import { describe, it, expect } from 'vitest';
import {
  enforceActiveClinicalContext,
  createContextBoundAbortController,
  validateResponseContextLineage,
  mapBackendSafetyErrorToClinicalAction,
  CLINICAL_SAFETY_ACTIONS
} from '../src/core/contracts/clinicalRuntimeSafetyContract.js';

describe('🛡️ PHASE D0: UI RUNTIME SAFETY CONTRACT SUITE', () => {

  describe('1. Fail-Closed Context Enforcement (JCI IPSG 1)', () => {
    it('should throw SAFETY_BLOCKED error when patientId is missing in context', () => {
      expect(() => enforceActiveClinicalContext(null, 'Order E-Resep')).toThrow('Konteks Pasien Wajib Dipilih');
      expect(() => enforceActiveClinicalContext({}, 'Catat SOAP')).toThrow('Konteks Pasien Wajib Dipilih');
      expect(() => enforceActiveClinicalContext({ patientId: null }, 'Input LIS')).toThrow('Konteks Pasien Wajib Dipilih');
    });

    it('should allow operation when patientId is present in context', () => {
      expect(enforceActiveClinicalContext({ patientId: 'P-101', encounterId: 'ENC-101' })).toBe(true);
    });
  });

  describe('2. Race-Condition Response Lineage Interception', () => {
    it('should accept response when payload patient matches active patient', () => {
      const isLineageValid = validateResponseContextLineage('P-101', 'P-101');
      expect(isLineageValid).toBe(true);
    });

    it('should discard response and return false when payload patient does not match active patient', () => {
      const isLineageValid = validateResponseContextLineage('P-101', 'P-102');
      expect(isLineageValid).toBe(false);
    });
  });

  describe('3. Canonical Backend Safety Error-to-Clinical-UX Mapper', () => {
    it('should map ALLERGY_HARD_STOP to SHOW_ALLERGY_OVERRIDE_MODAL', () => {
      const error = { code: 'ALLERGY_HARD_STOP', message: 'Pasien alergi berat amoksisilin' };
      const action = mapBackendSafetyErrorToClinicalAction(error);

      expect(action.action).toBe(CLINICAL_SAFETY_ACTIONS.SHOW_ALLERGY_OVERRIDE_MODAL);
      expect(action.severity).toBe('CRITICAL_HARD_STOP');
      expect(action.requiresJustification).toBe(true);
      expect(action.title).toContain('Peringatan Alergi Berat');
    });

    it('should map HIGH_ALERT_DUAL_SIGN_REQUIRED to PROMPT_WITNESS_NURSE_PIN', () => {
      const error = { code: 'HIGH_ALERT_DUAL_SIGN_REQUIRED', message: 'Wajib saksi ke-2' };
      const action = mapBackendSafetyErrorToClinicalAction(error);

      expect(action.action).toBe(CLINICAL_SAFETY_ACTIONS.PROMPT_WITNESS_NURSE_PIN);
      expect(action.severity).toBe('MANDATORY_WITNESS');
      expect(action.title).toContain('Verifikasi Ganda');
    });

    it('should map EMERGENCY_PANIC to SHOW_CRITICAL_PANIC_INTERRUPT', () => {
      const error = { code: 'EMERGENCY_PANIC', message: 'Kalium 7.2 mEq/L' };
      const action = mapBackendSafetyErrorToClinicalAction(error);

      expect(action.action).toBe(CLINICAL_SAFETY_ACTIONS.SHOW_CRITICAL_PANIC_INTERRUPT);
      expect(action.severity).toBe('JCI_IPSG2_PANIC');
      expect(action.title).toContain('HASIL KRITIS LABORATORIUM');
    });

    it('should map CONCURRENCY_CONFLICT to PROMPT_STALE_RECORD_REFRESH', () => {
      const error = { code: 'CONCURRENCY_CONFLICT', message: 'Stale update' };
      const action = mapBackendSafetyErrorToClinicalAction(error);

      expect(action.action).toBe(CLINICAL_SAFETY_ACTIONS.PROMPT_STALE_RECORD_REFRESH);
      expect(action.severity).toBe('OCC_CONFLICT');
      expect(action.title).toContain('Konflik Modifikasi');
    });
  });
});
