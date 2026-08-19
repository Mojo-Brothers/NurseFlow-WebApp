/**
 * NurseFlow Enterprise HIS 2026 — Sprint 3P.4: FHIR Clinical Graph Integrity Test Suite
 * Standards: HL7 FHIR R4 Bundle Specification (Normative), Transaction Semantics,
 * Reference Resolution, Orphan Detection, Prohibited Cycle Policy, Type Safety, Graph Explainability.
 */

import { describe, it, expect } from 'vitest';
import { fhirGraphIntegrityEngineService } from '../src/core/interoperability/fhir/engine/fhirGraphIntegrityEngine.service.js';
import { KEMKES_PROFILES, KEMKES_SYSTEMS } from '../src/core/interoperability/fhir/profiles/kemkesProfiles.js';

describe('🕸️ SPRINT 3P.4: FHIR Clinical Graph Integrity Engine Gate', () => {
  const patientResource = {
    resourceType: 'Patient',
    id: 'PAT-GRAPH-01',
    meta: { profile: [KEMKES_PROFILES.PATIENT] },
    identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201999988880001' }],
    name: [{ text: 'Bpk. Ahmad Suhendar' }],
    gender: 'male'
  };

  const encounterResource = {
    resourceType: 'Encounter',
    id: 'ENC-GRAPH-01',
    meta: { profile: [KEMKES_PROFILES.ENCOUNTER] },
    status: 'in-progress',
    class: { code: 'IMP' },
    subject: { reference: 'Patient/PAT-GRAPH-01' }
  };

  const observationResource = {
    resourceType: 'Observation',
    id: 'OBS-GRAPH-01',
    meta: { profile: [KEMKES_PROFILES.OBSERVATION_VITALS] },
    status: 'final',
    code: { coding: [{ system: KEMKES_SYSTEMS.LOINC, code: '8867-4' }] },
    subject: { reference: 'Patient/PAT-GRAPH-01' },
    encounter: { reference: 'Encounter/ENC-GRAPH-01' },
    valueQuantity: { value: 75, unit: '/min' }
  };

  const conditionResource = {
    resourceType: 'Condition',
    id: 'COND-GRAPH-01',
    meta: { profile: [KEMKES_PROFILES.CONDITION] },
    clinicalStatus: { coding: [{ code: 'active' }] },
    code: { coding: [{ system: KEMKES_SYSTEMS.ICD10, code: 'I10' }] },
    subject: { reference: 'Patient/PAT-GRAPH-01' },
    encounter: { reference: 'Encounter/ENC-GRAPH-01' }
  };

  // ==========================================================================
  // 1. VALID TRANSACTION BUNDLE & GRAPH RESOLUTION
  // ==========================================================================
  describe('1. Valid Transaction Bundle & Clinical Graph Resolution', () => {
    it('1.1 should PASS valid multi-resource clinical graph bundle', () => {
      const bundle = {
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          { fullUrl: 'urn:uuid:pat-01', resource: patientResource, request: { method: 'POST', url: 'Patient' } },
          { fullUrl: 'urn:uuid:enc-01', resource: encounterResource, request: { method: 'POST', url: 'Encounter' } },
          { fullUrl: 'urn:uuid:obs-01', resource: observationResource, request: { method: 'POST', url: 'Observation' } },
          { fullUrl: 'urn:uuid:cond-01', resource: conditionResource, request: { method: 'POST', url: 'Condition' } }
        ]
      };

      const result = fhirGraphIntegrityEngineService.evaluateBundleGraph(bundle);
      expect(result.isConformant).toBe(true);
      expect(result.decision).toBe('CONFORMANT');
      expect(result.totalErrors).toBe(0);
      expect(result.graphTree).toContain('Patient/PAT-GRAPH-01');
      expect(result.graphTree).toContain('Encounter/ENC-GRAPH-01');
    });
  });

  // ==========================================================================
  // 2. ORPHAN NODE DETECTION (L3)
  // ==========================================================================
  describe('2. Orphan Node Detection (L3)', () => {
    it('2.1 should REJECT Bundle with orphan child referencing non-existent Patient/999999', () => {
      const orphanObservation = {
        resourceType: 'Observation',
        id: 'OBS-ORPHAN-01',
        status: 'final',
        code: { coding: [{ code: '8867-4' }] },
        subject: { reference: 'Patient/999999' } // Non-existent!
      };

      const bundle = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          { resource: patientResource },
          { resource: orphanObservation }
        ]
      };

      const result = fhirGraphIntegrityEngineService.evaluateBundleGraph(bundle);
      expect(result.isConformant).toBe(false);
      expect(result.decision).toBe('REJECTED');
      expect(result.errors.some(e => e.layer === 'L3_ORPHAN_DETECTION' && e.code === 'unresolvable-reference')).toBe(true);
    });
  });

  // ==========================================================================
  // 3. PROHIBITED CIRCULAR REFERENCE POLICY (L4)
  // ==========================================================================
  describe('3. Prohibited Circular Reference Policy (L4)', () => {
    it('3.1 should REJECT illegal self-referential loop', () => {
      const selfLoopEncounter = {
        resourceType: 'Encounter',
        id: 'ENC-SELF-LOOP',
        status: 'in-progress',
        class: { code: 'IMP' },
        subject: { reference: 'Patient/PAT-GRAPH-01' },
        partOf: { reference: 'Encounter/ENC-SELF-LOOP' } // Illegal self loop!
      };

      const bundle = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          { resource: patientResource },
          { resource: selfLoopEncounter }
        ]
      };

      const result = fhirGraphIntegrityEngineService.evaluateBundleGraph(bundle);
      expect(result.isConformant).toBe(false);
      expect(result.errors.some(e => e.layer === 'L4_CYCLE_POLICY' && e.code === 'prohibited-self-reference')).toBe(true);
    });
  });

  // ==========================================================================
  // 4. REFERENTIAL TYPE SAFETY (L5)
  // ==========================================================================
  describe('4. Referential Type Safety (L5)', () => {
    it('4.1 should REJECT Observation subject pointing to Encounter instead of Patient', () => {
      const typeMismatchObs = {
        resourceType: 'Observation',
        id: 'OBS-TYPE-MISMATCH',
        status: 'final',
        code: { coding: [{ code: '8867-4' }] },
        subject: { reference: 'Encounter/ENC-GRAPH-01' } // Type mismatch: Observation.subject pointing to Encounter!
      };

      const bundle = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          { resource: patientResource },
          { resource: encounterResource },
          { resource: typeMismatchObs }
        ]
      };

      const result = fhirGraphIntegrityEngineService.evaluateBundleGraph(bundle);
      expect(result.isConformant).toBe(false);
      expect(result.errors.some(e => e.layer === 'L5_TYPE_SAFETY' && e.code === 'referential-type-mismatch')).toBe(true);
    });
  });

  // ==========================================================================
  // 5. DUPLICATE IDENTITY & CANONICAL COLLISION POLICY (L6)
  // ==========================================================================
  describe('5. Duplicate Identity & Canonical Collision Policy (L6)', () => {
    it('5.1 should REJECT two different Patient resources sharing identical NIK (Canonical Collision)', () => {
      const collidingPatient = {
        resourceType: 'Patient',
        id: 'PAT-COLLIDING-02', // Different ID
        identifier: [{ system: KEMKES_SYSTEMS.NIK, value: '3201999988880001' }], // Same NIK as PAT-GRAPH-01!
        name: [{ text: 'Bpk. Orang Lain' }]
      };

      const bundle = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          { resource: patientResource },
          { resource: collidingPatient }
        ]
      };

      const result = fhirGraphIntegrityEngineService.evaluateBundleGraph(bundle);
      expect(result.isConformant).toBe(false);
      expect(result.errors.some(e => e.layer === 'L6_DUPLICATE_IDENTITY' && e.code === 'duplicate-canonical-identity')).toBe(true);
    });
  });

  // ==========================================================================
  // 6. GRAPH EXPLAINABILITY TREE RENDERING
  // ==========================================================================
  describe('6. Graph Explainability Tree Rendering', () => {
    it('6.1 should render readable tree output reflecting root and children', () => {
      const bundle = {
        resourceType: 'Bundle',
        type: 'collection',
        entry: [
          { resource: patientResource },
          { resource: encounterResource },
          { resource: observationResource }
        ]
      };

      const result = fhirGraphIntegrityEngineService.evaluateBundleGraph(bundle);
      expect(result.graphTree).toBeDefined();
      expect(typeof result.graphTree).toBe('string');
      expect(result.graphTree).toContain('Patient/PAT-GRAPH-01');
    });
  });
});
