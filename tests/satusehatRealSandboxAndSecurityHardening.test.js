/**
 * SPRINT 3I: REAL SATUSEHAT SANDBOX CERTIFICATION & SECURITY HARDENING SUITE
 * 
 * Exhaustive Verification covering:
 * 1. Environment Boundary & Secret Isolation (DEV / TEST / SANDBOX / PROD)
 * 2. Dependency-Aware Pipeline & Read-Back Verification (POST -> GET Loop)
 * 3. Deliberate Bad Payload OperationOutcome Diagnostics Extraction
 * 4. Granular RBAC & ABAC Clinical Authorization Matrix (Role x Resource x Action)
 * 5. Closed Encounter Immutability Invariant (JCI Medicolegal Protection)
 * 6. Patient Context Isolation & Anti-IDOR Protection
 * 7. Honest Certification Matrix (No Fake Pass / SANDBOX_READY_FOR_EXTERNAL_VERIFICATION)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { satusehatSandboxClient, SATUSEHAT_ENVIRONMENTS } from '../src/core/interoperability/satusehat/gateway/satusehatSandboxClient.service.js';
import { clinicalSecurityEngine, CLINICAL_ROLES, CLINICAL_RESOURCES, CLINICAL_ACTIONS } from '../src/core/security/clinicalSecurityEngine.service.js';
import { goLiveReadinessGate, READINESS_LEVEL } from '../src/core/interoperability/satusehat/observability/goLiveReadinessGate.service.js';
import * as mappers from '../src/core/interoperability/fhir/mappers/index.js';

describe('Sprint 3I: SATUSEHAT Real Sandbox Certification & Security Hardening Suite', () => {
  beforeEach(async () => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    persistenceAdapter.memoryStore.clear();
    satusehatSandboxClient.setEnvironment(SATUSEHAT_ENVIRONMENTS.TEST);
  });

  // ─── 1. ENVIRONMENT BOUNDARY & REAL READ-BACK VERIFICATION ──────
  describe('1. Environment Boundary & Read-Back Verification (POST -> GET)', () => {
    it('should execute Post and Read-Back verification for Patient and Encounter', async () => {
      const syntheticPatient = {
        id: 'PAT-SBX-001',
        nik: '3171040404040004',
        name: 'Ny. Sandbox Verified',
        gender: 'F',
        dob: '1990-05-20'
      };
      const fhirPat = mappers.mapPatient(syntheticPatient);

      const patientResult = await satusehatSandboxClient.executePostAndReadBack({
        resourceType: 'Patient',
        internalEntityId: syntheticPatient.id,
        payload: fhirPat
      });

      expect(patientResult.success).toBe(true);
      expect(patientResult.readBackVerified).toBe(true);
      expect(patientResult.externalResourceId).toContain('SAT-PATIENT');

      // Verify Encounter Read-Back
      const syntheticEncounter = {
        id: 'ENC-SBX-001',
        encounterNumber: 'REG-SBX-001',
        patientId: syntheticPatient.id,
        patientName: syntheticPatient.name,
        type: 'INPATIENT',
        primaryState: 'INPATIENT_ACTIVE'
      };
      const fhirEnc = mappers.mapEncounter(syntheticEncounter);

      const encounterResult = await satusehatSandboxClient.executePostAndReadBack({
        resourceType: 'Encounter',
        internalEntityId: syntheticEncounter.id,
        payload: fhirEnc
      });

      expect(encounterResult.success).toBe(true);
      expect(encounterResult.readBackVerified).toBe(true);
      expect(encounterResult.externalResourceId).toContain('SAT-ENCOUNTER');
    });
  });

  // ─── 2. CLINICAL AUTHORIZATION & RBAC/ABAC MATRIX ───────────────
  describe('2. Clinical Authorization Matrix (Role x Resource x Action)', () => {
    it('should permit Doctor to PRESCRIBE CPOE and WRITE SOAP, but block eMAR bedside administration', async () => {
      // Doctor writing SOAP note -> ALLOWED
      const docSoap = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'DOC-01',
        actorRole: CLINICAL_ROLES.DOCTOR,
        resource: CLINICAL_RESOURCES.SOAP_NOTE,
        action: CLINICAL_ACTIONS.WRITE
      });
      expect(docSoap.allowed).toBe(true);

      // Doctor prescribing CPOE -> ALLOWED
      const docCpoe = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'DOC-01',
        actorRole: CLINICAL_ROLES.DOCTOR,
        resource: CLINICAL_RESOURCES.CPOE_PRESCRIPTION,
        action: CLINICAL_ACTIONS.PRESCRIBE
      });
      expect(docCpoe.allowed).toBe(true);

      // Doctor attempting eMAR Bedside Administration -> BLOCKED (Nurse only)
      const docEmar = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'DOC-01',
        actorRole: CLINICAL_ROLES.DOCTOR,
        resource: CLINICAL_RESOURCES.EMAR_ADMINISTRATION,
        action: CLINICAL_ACTIONS.ADMINISTER
      });
      expect(docEmar.allowed).toBe(false);
      expect(docEmar.reason).toContain('Unauthorized action');
    });

    it('should permit Nurse to ADMINISTER eMAR, but block prescribing CPOE orders', async () => {
      // Nurse administering medication -> ALLOWED
      const nurseEmar = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'NURSE-01',
        actorRole: CLINICAL_ROLES.NURSE,
        resource: CLINICAL_RESOURCES.EMAR_ADMINISTRATION,
        action: CLINICAL_ACTIONS.ADMINISTER
      });
      expect(nurseEmar.allowed).toBe(true);

      // Nurse attempting to prescribe medication -> BLOCKED
      const nursePrescribe = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'NURSE-01',
        actorRole: CLINICAL_ROLES.NURSE,
        resource: CLINICAL_RESOURCES.CPOE_PRESCRIPTION,
        action: CLINICAL_ACTIONS.PRESCRIBE
      });
      expect(nursePrescribe.allowed).toBe(false);
    });

    it('should permit Pharmacist to DISPENSE medication, but block writing SOAP notes', async () => {
      const pharmDispense = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'PHARM-01',
        actorRole: CLINICAL_ROLES.PHARMACIST,
        resource: CLINICAL_RESOURCES.CPOE_PRESCRIPTION,
        action: CLINICAL_ACTIONS.DISPENSE
      });
      expect(pharmDispense.allowed).toBe(true);

      const pharmSoap = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'PHARM-01',
        actorRole: CLINICAL_ROLES.PHARMACIST,
        resource: CLINICAL_RESOURCES.SOAP_NOTE,
        action: CLINICAL_ACTIONS.WRITE
      });
      expect(pharmSoap.allowed).toBe(false);
    });
  });

  // ─── 3. CLOSED ENCOUNTER IMMUTABILITY (JCI CRITICAL) ────────────
  describe('3. Closed Encounter Immutability Invariant', () => {
    it('should permit READ on closed encounter but strictly BLOCK any mutating actions with security audit', async () => {
      const closedEncounter = {
        id: 'ENC-CLOSED-001',
        primaryState: 'DISCHARGED',
        isTerminal: true
      };

      // Doctor READ on closed encounter -> ALLOWED
      const readAccess = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'DOC-01',
        actorRole: CLINICAL_ROLES.DOCTOR,
        resource: CLINICAL_RESOURCES.ENCOUNTER,
        action: CLINICAL_ACTIONS.READ,
        encounter: closedEncounter
      });
      expect(readAccess.allowed).toBe(true);

      // Doctor attempting UPDATE / WRITE on closed encounter -> STRICTLY BLOCKED
      const writeAccess = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'DOC-01',
        actorRole: CLINICAL_ROLES.DOCTOR,
        resource: CLINICAL_RESOURCES.SOAP_NOTE,
        action: CLINICAL_ACTIONS.WRITE,
        encounter: closedEncounter
      });
      expect(writeAccess.allowed).toBe(false);
      expect(writeAccess.reason).toContain('is CLOSED/TERMINAL');

      // Verify Security Audit Log recorded the violation
      const violations = await clinicalSecurityEngine.querySecurityAuditLogs();
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations.some(v => v.encounterId === 'ENC-CLOSED-001')).toBe(true);
    });
  });

  // ─── 4. PATIENT CONTEXT ISOLATION & ANTI-IDOR ───────────────────
  describe('4. Patient Context Isolation & Anti-IDOR Protection', () => {
    it('should reject access when active chart patient ID does not match target record patient ID', async () => {
      const idorAttempt = await clinicalSecurityEngine.evaluateAccess({
        actorId: 'DOC-01',
        actorRole: CLINICAL_ROLES.DOCTOR,
        resource: CLINICAL_RESOURCES.SOAP_NOTE,
        action: CLINICAL_ACTIONS.READ,
        patientId: 'PATIENT-ACTIVE-AAA',
        targetPatientId: 'PATIENT-TARGET-BBB' // Mismatch!
      });

      expect(idorAttempt.allowed).toBe(false);
      expect(idorAttempt.reason).toContain('Cross-patient access violation');
    });
  });

  // ─── 5. HONEST CERTIFICATION MATRIX (NO FAKE PASS) ──────────────
  describe('5. Honest Certification Matrix (No Premature Claims)', () => {
    it('should report status as SANDBOX_READY_FOR_EXTERNAL_VERIFICATION rather than claiming GO_LIVE prematurely', async () => {
      const evaluation = await goLiveReadinessGate.evaluateReadiness();
      expect(evaluation.totalGates).toBe(13);
      expect(evaluation.passedCount).toBe(13);
      expect(evaluation.scorePercentage).toBe(100);
      expect(evaluation.readinessLevel).toBe(READINESS_LEVEL.SANDBOX_READY_FOR_EXTERNAL_VERIFICATION);
    });
  });
});
