import { describe, it, expect } from 'vitest';
import {
  casemixRevenueCycleEngineService,
  CLAIM_STAGES,
  DISPUTE_REASONS
} from '../server/services/casemixRevenueCycleEngine.service.js';

describe('Gate 1E.9: Casemix & Revenue Cycle Center Vertical Slice', () => {

  // 1. Casemix Case Creation
  it('1. should register a casemix case with ICD-10 primary diagnosis and ICD-9 procedures', () => {
    const cmCase = casemixRevenueCycleEngineService.createCasemixCase({
      encounterId: 'ENC-TEST-991',
      patientMrn: 'MRN-2026-001001',
      patientName: 'Ny. Siti Nurhaliza',
      lengthOfStayDays: 3,
      patientPayerType: 'BPJS_KESEHATAN',
      sepNumber: '0032R0010826V009999',
      primaryIcd10: { code: 'K35.8', description: 'Acute appendicitis, other and unspecified' },
      secondaryIcd10: [{ code: 'E11.9', description: 'Type 2 diabetes mellitus' }],
      icd9Procedures: [{ code: '47.0', description: 'Appendectomy' }]
    });

    expect(cmCase.id).toBeDefined();
    expect(cmCase.caseStatus).toBe('READY_FOR_GROUPING');
    expect(cmCase.primaryIcd10.code).toBe('K35.8');
    expect(cmCase.icd9Procedures[0].code).toBe('47.0');
  });

  // 2. Departmental Charge Ingestion
  it('2. should ingest itemized departmental real costs from 7 clinical units', () => {
    const billing = casemixRevenueCycleEngineService.ingestPatientDepartmentalCharges({
      encounterId: 'ENC-TEST-991',
      patientMrn: 'MRN-2026-001001',
      consultationChargesIdr: 300000.00,
      pharmacyChargesIdr: 850000.00,
      laboratoryChargesIdr: 450000.00,
      radiologyChargesIdr: 600000.00,
      surgeryChargesIdr: 3500000.00,
      bloodBankChargesIdr: 525000.00,
      roomIcuChargesIdr: 1200000.00
    });

    expect(billing.id).toBeDefined();
    expect(billing.totalRealChargesIdr).toBe(7425000.00);
    expect(billing.reconciliationStatus).toBe('BALANCED');
  });

  // 3. Dynamic INA-CBG Grouping & Margin Calculation
  it('3. should perform INA-CBG grouping, apply class B multiplier, and calculate financial margin', () => {
    const grouping = casemixRevenueCycleEngineService.performInaCbgGrouping({
      caseId: 'CASE-ENC-TEST-991',
      hospitalClass: 'B'
    });

    expect(grouping.id).toBeDefined();
    expect(grouping.cbgCode).toBe('K-1-14-I');
    expect(grouping.tariffFinalIdr).toBeGreaterThan(0);
    expect(grouping.realHospitalCostIdr).toBe(7425000.00);
    expect(grouping.marginProfitLossIdr).toBe(grouping.tariffFinalIdr - grouping.realHospitalCostIdr);
  });

  // 4. BPJS V-Claim Submission
  it('4. should submit claim to BPJS V-Claim advancing FSM to SUBMITTED', () => {
    const sub = casemixRevenueCycleEngineService.submitBpjsClaim({
      caseId: 'CASE-ENC-TEST-991',
      sepNumber: '0032R0010826V009999'
    });

    expect(sub.id).toBeDefined();
    expect(sub.fsmStage).toBe(CLAIM_STAGES.SUBMITTED);
  });

  // 5. Dispute Management & Resolution
  it('5. should raise a dispute and successfully resolve it to PAID status upon hospital justification', () => {
    const disp = casemixRevenueCycleEngineService.raiseBpjsDispute({
      submissionId: 'VCLAIM-SUB-SAMPLE-01',
      disputeCode: DISPUTE_REASONS.PENDING_RESUME_MEDIS,
      verifierNote: 'Resume medis belum ditandatangani digital oleh DPJP.'
    });

    expect(disp.id).toBeDefined();
    expect(disp.disputeStatus).toBe('OPEN');

    // Hospital resolves dispute
    const resolved = casemixRevenueCycleEngineService.resolveBpjsDispute({
      disputeId: disp.id,
      clarificationNote: 'Resume medis telah ditandatangani SHA-256 oleh dr. Budi Santoso, Sp.B',
      isAccepted: true
    });

    expect(resolved.disputeStatus).toBe('RESOLVED_ACCEPTED');
  });

  // 6. Hospital Financial Summary
  it('6. should aggregate overall hospital revenue cycle financial metrics', () => {
    const summary = casemixRevenueCycleEngineService.getHospitalFinancialSummary();

    expect(summary.totalCasesCount).toBeGreaterThan(0);
    expect(summary.totalRealCostsIdr).toBeGreaterThan(0);
    expect(summary.totalReimbursementIdr).toBeGreaterThan(0);
  });
});
