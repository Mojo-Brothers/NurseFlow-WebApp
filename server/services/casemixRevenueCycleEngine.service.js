/**
 * NurseFlow Enterprise HIS 2026 — Casemix & Revenue Cycle Engine Service
 * Complies with Permenkes No. 3/2023 (INA-CBG 6.0 Tariffs) & BPJS V-Claim 2.0 Integration
 */

import { masterInacbgTariffEngineService } from './masterInacbgTariffEngine.service.js';
import { eventBusService, DOMAIN_EVENTS } from '../realtime/eventBus.service.js';

export const DISPUTE_REASONS = {
  PENDING_RESUME_MEDIS: 'PENDING_RESUME_MEDIS',
  UNAPPROVED_SECONDARY_DIAGNOSIS: 'UNAPPROVED_SECONDARY_DIAGNOSIS',
  MISSING_SURGICAL_REPORT: 'MISSING_SURGICAL_REPORT',
  DOSAGE_JUSTIFICATION_NEEDED: 'DOSAGE_JUSTIFICATION_NEEDED'
};

export const CLAIM_STAGES = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  VERIFIED_OK: 'VERIFIED_OK',
  APPROVED_BPJS: 'APPROVED_BPJS',
  DISPUTED: 'DISPUTED',
  PAID: 'PAID'
};

class CasemixRevenueCycleEngineService {
  constructor() {
    this.casemixCases = new Map();
    this.billingLedger = new Map();
    this.groupingResults = new Map();
    this.claimSubmissions = new Map();
    this.disputeLogs = new Map();
    this.initializeDefaultData();
  }

  initializeDefaultData() {
    // Seed standard sample cases
    this.createCasemixCase({
      encounterId: 'ENC-2026-003',
      patientMrn: 'MRX-2026-A1',
      patientName: 'Tn. Hendra (Mr. X)',
      admissionDate: '2026-08-14T08:00:00Z',
      dischargeDate: '2026-08-17T12:00:00Z',
      lengthOfStayDays: 4,
      patientPayerType: 'BPJS_KESEHATAN',
      sepNumber: '0032R0010826V000182',
      primaryIcd10: { code: 'K35.8', description: 'Acute appendicitis, other and unspecified' },
      secondaryIcd10: [{ code: 'K56.6', description: 'Other and unspecified intestinal obstruction' }],
      icd9Procedures: [{ code: '47.0', description: 'Appendectomy, laparoscopic / open' }]
    });

    this.ingestPatientDepartmentalCharges({
      encounterId: 'ENC-2026-003',
      patientMrn: 'MRX-2026-A1',
      consultationChargesIdr: 450000.00,
      pharmacyChargesIdr: 1250000.00,
      laboratoryChargesIdr: 680000.00,
      radiologyChargesIdr: 950000.00,
      surgeryChargesIdr: 4500000.00,
      bloodBankChargesIdr: 1050000.00,
      roomIcuChargesIdr: 2400000.00
    });

    try {
      this.performInaCbgGrouping({ caseId: 'CASE-ENC-2026-003', hospitalClass: 'B' });
      this.submitBpjsClaim({ caseId: 'CASE-ENC-2026-003', sepNumber: '0032R0010826V000182' });
    } catch (e) {
      // Seed fallback
    }
  }

  /**
   * 1. Create / Register Casemix Case
   */
  createCasemixCase({
    encounterId,
    patientMrn,
    patientName,
    admissionDate = new Date().toISOString(),
    dischargeDate = null,
    lengthOfStayDays = 1,
    patientPayerType = 'BPJS_KESEHATAN',
    bpjsCardNumber = '0001928374650',
    sepNumber = `0032R0010826V${Math.floor(100000 + Math.random() * 900000)}`,
    primaryIcd10,
    secondaryIcd10 = [],
    icd9Procedures = []
  }) {
    const caseId = `CASE-${encounterId}`;
    const casemixCase = {
      id: caseId,
      encounterId,
      patientMrn,
      patientName,
      admissionDate,
      dischargeDate,
      lengthOfStayDays: Math.max(1, lengthOfStayDays),
      patientPayerType,
      bpjsCardNumber,
      sepNumber,
      primaryIcd10,
      secondaryIcd10,
      icd9Procedures,
      caseStatus: 'READY_FOR_GROUPING',
      coderStaffName: 'Perekam Medis Rian, A.Md.RMIK',
      createdAt: new Date().toISOString()
    };

    this.casemixCases.set(caseId, casemixCase);
    return casemixCase;
  }

  /**
   * 2. Ingest Itemized Departmental Charges into Billing Reconciliation
   */
  ingestPatientDepartmentalCharges({
    encounterId,
    patientMrn,
    consultationChargesIdr = 0,
    pharmacyChargesIdr = 0,
    laboratoryChargesIdr = 0,
    radiologyChargesIdr = 0,
    surgeryChargesIdr = 0,
    bloodBankChargesIdr = 0,
    roomIcuChargesIdr = 0,
    auditedBy = 'Kasir RS Ratna, S.E.'
  }) {
    const total = 
      Number(consultationChargesIdr) +
      Number(pharmacyChargesIdr) +
      Number(laboratoryChargesIdr) +
      Number(radiologyChargesIdr) +
      Number(surgeryChargesIdr) +
      Number(bloodBankChargesIdr) +
      Number(roomIcuChargesIdr);

    const reconciliation = {
      id: `BILL-REC-${encounterId}`,
      encounterId,
      patientMrn,
      consultationChargesIdr: Number(consultationChargesIdr),
      pharmacyChargesIdr: Number(pharmacyChargesIdr),
      laboratoryChargesIdr: Number(laboratoryChargesIdr),
      radiologyChargesIdr: Number(radiologyChargesIdr),
      surgeryChargesIdr: Number(surgeryChargesIdr),
      bloodBankChargesIdr: Number(bloodBankChargesIdr),
      roomIcuChargesIdr: Number(roomIcuChargesIdr),
      totalRealChargesIdr: total,
      reconciliationStatus: 'BALANCED',
      auditedByCashier: auditedBy,
      auditedAt: new Date().toISOString()
    };

    this.billingLedger.set(encounterId, reconciliation);
    return reconciliation;
  }

  /**
   * 3. Perform Dynamic INA-CBG Grouping & Financial Margin Calculation
   */
  performInaCbgGrouping({ caseId, hospitalClass = 'B' }) {
    const cmCase = this.casemixCases.get(caseId);
    if (!cmCase) {
      throw new Error(`Casemix case ${caseId} tidak ditemukan.`);
    }

    const billing = this.billingLedger.get(cmCase.encounterId) || { totalRealChargesIdr: 0 };
    const realCost = billing.totalRealChargesIdr;

    // Resolve tariff through masterInacbgTariffEngineService
    const tariffResult = masterInacbgTariffEngineService.resolveDynamicTariff({
      primaryIcd10: cmCase.primaryIcd10.code,
      secondaryIcd10: cmCase.secondaryIcd10.map(s => s.code),
      icd9Procedures: cmCase.icd9Procedures.map(p => p.code),
      hospitalClass
    });

    const finalTariff = tariffResult.finalTariff;
    const marginProfitLoss = finalTariff - realCost;

    const groupingResult = {
      id: `GROUP-${Date.now()}`,
      casemixCaseId: caseId,
      encounterId: cmCase.encounterId,
      cbgCode: tariffResult.cbgCode,
      cbgDescription: tariffResult.cbgDescription,
      severityLevel: tariffResult.severityLevel,
      tariffStandardIdr: tariffResult.baseTariff,
      hospitalClassMultiplier: tariffResult.multiplier,
      tariffFinalIdr: finalTariff,
      realHospitalCostIdr: realCost,
      marginProfitLossIdr: marginProfitLoss,
      grouperVersion: 'INA-CBG 6.0 (Permenkes 3/2023)',
      groupedAt: new Date().toISOString()
    };

    this.groupingResults.set(caseId, groupingResult);
    cmCase.caseStatus = 'VERIFIED_INTERNAL';

    return groupingResult;
  }

  /**
   * 4. Submit BPJS V-Claim Batch
   */
  submitBpjsClaim({ caseId, sepNumber }) {
    const cmCase = this.casemixCases.get(caseId);
    const grouping = this.groupingResults.get(caseId);
    if (!grouping) {
      throw new Error('Kasus belum dilakukan INA-CBG Grouping!');
    }

    const submissionId = `VCLAIM-SUB-${Date.now()}`;
    const submission = {
      id: submissionId,
      casemixCaseId: caseId,
      sepNumber: sepNumber || cmCase.sepNumber,
      fsmStage: CLAIM_STAGES.SUBMITTED,
      submissionBatchId: `BATCH-2026-08-${Math.floor(10 + Math.random() * 90)}`,
      claimAmountRequestedIdr: grouping.tariffFinalIdr,
      claimAmountApprovedIdr: null,
      submittedAt: new Date().toISOString()
    };

    this.claimSubmissions.set(submissionId, submission);
    cmCase.caseStatus = 'SUBMITTED_BPJS';
    return submission;
  }

  /**
   * 5. Raise BPJS Claim Dispute
   */
  raiseBpjsDispute({
    submissionId,
    disputeCode = DISPUTE_REASONS.PENDING_RESUME_MEDIS,
    verifierNote = 'Resume medis elektronik belum melampirkan laporan operasi lengkap.'
  }) {
    let submission = this.claimSubmissions.get(submissionId);
    if (!submission) {
      submission = Array.from(this.claimSubmissions.values())[0] || {
        id: submissionId || `SUB-${Date.now()}`,
        sepNumber: '0032R0010826V000182',
        fsmStage: CLAIM_STAGES.SUBMITTED
      };
      this.claimSubmissions.set(submission.id, submission);
    }

    submission.fsmStage = CLAIM_STAGES.DISPUTED;
    const disputeId = `DISPUTE-${Date.now()}`;
    const dispute = {
      id: disputeId,
      submissionId,
      sepNumber: submission.sepNumber,
      disputeCode,
      bpjsVerifierNote: verifierNote,
      disputeStatus: 'OPEN',
      hospitalResponseNote: null,
      createdAt: new Date().toISOString()
    };

    this.disputeLogs.set(disputeId, dispute);

    eventBusService.publish(DOMAIN_EVENTS.PANIC_VALUE_TRIGGERED, {
      type: 'BPJS_CLAIM_DISPUTED',
      disputeId,
      sepNumber: submission.sepNumber,
      reason: disputeCode
    });

    return dispute;
  }

  /**
   * 6. Resolve Dispute & Finalize Payment
   */
  resolveBpjsDispute({ disputeId, clarificationNote, isAccepted = true }) {
    const dispute = this.disputeLogs.get(disputeId);
    if (!dispute) {
      throw new Error(`Dispute ${disputeId} tidak ditemukan.`);
    }

    dispute.hospitalResponseNote = clarificationNote;
    dispute.resolvedAt = new Date().toISOString();

    const submission = this.claimSubmissions.get(dispute.submissionId);
    if (isAccepted) {
      dispute.disputeStatus = 'RESOLVED_ACCEPTED';
      if (submission) {
        submission.fsmStage = CLAIM_STAGES.PAID;
        submission.claimAmountApprovedIdr = submission.claimAmountRequestedIdr;
        submission.paidAt = new Date().toISOString();
      }
    } else {
      dispute.disputeStatus = 'REJECTED_UNPAID';
      if (submission) {
        submission.fsmStage = 'REJECTED';
      }
    }

    return dispute;
  }

  /**
   * 7. Aggregate Hospital Financial Summary & Revenue Cycle KPIs
   */
  getHospitalFinancialSummary() {
    const cases = Array.from(this.casemixCases.values());
    const groupings = Array.from(this.groupingResults.values());
    const disputes = Array.from(this.disputeLogs.values());

    const totalRealCosts = groupings.reduce((acc, g) => acc + Number(g.realHospitalCostIdr || 0), 0);
    const totalReimbursement = groupings.reduce((acc, g) => acc + Number(g.tariffFinalIdr || 0), 0);
    const totalMargin = totalReimbursement - totalRealCosts;
    const marginPercentage = totalRealCosts > 0 ? ((totalMargin / totalRealCosts) * 100).toFixed(1) : '0.0';

    return {
      totalCasesCount: cases.length,
      totalRealCostsIdr: totalRealCosts,
      totalReimbursementIdr: totalReimbursement,
      totalMarginIdr: totalMargin,
      marginPercentage: Number(marginPercentage),
      activeDisputesCount: disputes.filter(d => d.disputeStatus === 'OPEN').length,
      readyToSubmitCount: cases.filter(c => c.caseStatus === 'READY_FOR_GROUPING' || c.caseStatus === 'VERIFIED_INTERNAL').length
    };
  }

  getAllCases() {
    return Array.from(this.casemixCases.values());
  }

  getAllGroupings() {
    return Array.from(this.groupingResults.values());
  }

  getAllDisputes() {
    return Array.from(this.disputeLogs.values());
  }
}

export const casemixRevenueCycleEngineService = new CasemixRevenueCycleEngineService();
