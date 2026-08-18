/**
 * NurseFlow Enterprise HIS 2026 — CDSS Clinical Production Safety Hardening Suite (Sprint 2.1)
 * Standards: JCI MCI, KDIGO 2024, WHO Pediatric Formulary, WORM Cryptographic Ledgers
 */

import { describe, it, expect } from 'vitest';
import { dynamicCdssEngineService } from '../server/services/dynamicCdssEngine.service.js';
import { clinicalRuleGovernanceRepository } from '../server/repositories/clinicalRuleGovernance.repository.js';
import { multiDrugInteractionClusterRepository } from '../server/repositories/multiDrugInteractionCluster.repository.js';
import { immutableCdssLedgerRepository } from '../server/repositories/immutableCdssLedger.repository.js';

describe('Sprint 2.1: CDSS Clinical Production Safety Hardening & Governance', () => {

  // 1. Clinical Rule Provenance & Approval
  it('1. should verify complete provenance, evidence source, and committee approval for clinical rules', async () => {
    const gov = await clinicalRuleGovernanceRepository.findByRuleCodeAndVersion('DDI_WARFARIN_ASPIRIN', 1);

    expect(gov).toBeDefined();
    expect(gov.evidenceSource).toContain('Lexicomp');
    expect(gov.approvedByCommitteeId).toBe('KFT-COMMITTEE-01');
    expect(gov.approvalStatus).toBe('APPROVED');
  });

  // 2. Multi-Drug Interaction Graph: Triple Antithrombotic Polipharmacy Cascade
  it('2. should detect multi-drug interaction cluster when Warfarin, Aspirin, and NSAID are co-prescribed', async () => {
    // Proposing Aspirin (MED-004, NSAID/ANTIPLATELET) while patient has Warfarin (MED-003, ANTICOAGULANT) and Clopidogrel (ANTIPLATELET)
    const evalResult = await dynamicCdssEngineService.evaluatePrescription({
      patientId: 'P-POLY-01',
      proposedDrugId: 'MED-004', // Aspirin (NSAID)
      doseAmount: 80,
      doseUnit: 'mg',
      patientContext: {
        activeMedicationIds: ['MED-003', 'MED-010'] // Warfarin (ANTICOAGULANT) + Clopidogrel (ANTIPLATELET)
      }
    });

    const clusterAlert = evalResult.alerts.find(a => a.type === 'MULTI_DRUG_INTERACTION_CLUSTER');
    expect(clusterAlert).toBeDefined();
    expect(clusterAlert.title).toContain('KLASTER POLIFARMASI BERISIKO TINGGI');
    expect(clusterAlert.message).toContain('perdarahan fatal');
  });

  // 3. Cryptographic WORM Hash Chain on CDSS Execution Snapshots
  it('3. should create cryptographically chained WORM ledger entries and verify integrity', async () => {
    const inputContext = {
      doseAmount: 80,
      doseUnit: 'mg',
      patientContext: { activeMedicationIds: ['MED-003'] }
    };

    const recorded = await dynamicCdssEngineService.commitExecutionSnapshot({
      organizationId: 'ORG-01',
      encounterId: 'ENC-WORM-01',
      patientId: 'P-WORM-01',
      medicationId: 'MED-004',
      evaluationResult: 'WARNING_OVERRIDDEN',
      overrideJustification: 'Indikasi STEMI Akut dengan pantauan INR berkala.',
      inputSnapshot: inputContext,
      outputSnapshot: [{ type: 'DRUG_DRUG_INTERACTION', severity: 'CRITICAL_HIGH' }],
      actorId: 'PRAC-DOC-01'
    });

    expect(recorded.id).toBeDefined();

    // Verify ledger entry
    const ledgerEntry = await immutableCdssLedgerRepository.findByExecutionId(recorded.id);
    expect(ledgerEntry).toBeDefined();
    expect(ledgerEntry.cryptographicHash).toContain('sha256_mock_');

    // Verify overall ledger integrity
    const verification = await immutableCdssLedgerRepository.verifyLedgerIntegrity();
    expect(verification.isIntact).toBe(true);
  });

  // 4. Renal eGFR Lab Provenance Validation
  it('4. should validate renal adjustment alert with lab measurement source in audit message', async () => {
    const evalResult = await dynamicCdssEngineService.evaluatePrescription({
      patientId: 'P-CKD-PROV-01',
      proposedDrugId: 'MED-001', // Meropenem
      doseAmount: 1000,
      doseUnit: 'mg',
      patientContext: {
        latestEgfr: 18.0,
        renalLabProvenance: {
          source: 'LIS_AUTOMATED_ROCHE_COBAS',
          formula: 'CKD-EPI 2021',
          serumCreatinineMgDl: 3.4
        }
      }
    });

    const renalAlert = evalResult.alerts.find(a => a.type === 'RENAL_ADJUSTMENT');
    expect(renalAlert).toBeDefined();
    expect(renalAlert.message).toContain('LIS_AUTOMATED_ROCHE_COBAS');
    expect(renalAlert.message).toContain('eGFR: 18 ml/min');
  });

});
