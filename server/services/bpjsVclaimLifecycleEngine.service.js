/**
 * NurseFlow Enterprise HIS 2026 — BPJS V-Claim 2.0 Lifecycle FSM Engine
 * Manages 5-stage claims progression: DRAFT -> SUBMITTED -> VERIFIED -> APPROVED -> PAID / DISPUTED
 */

export const VCLAIM_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  VERIFIED: 'VERIFIED',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  DISPUTED: 'DISPUTED'
};

class BpjsVclaimLifecycleEngineService {
  constructor() {
    this.claims = new Map();
    this.initDemoClaims();
  }

  initDemoClaims() {
    const c1 = {
      noSep: 'SEP-2026-0817-001',
      patientMrn: 'MRX-2026-A1',
      claimAmountRequested: 12850000.00,
      claimAmountApproved: null,
      currentStatus: VCLAIM_STATUS.SUBMITTED,
      history: [
        { status: VCLAIM_STATUS.DRAFT, timestamp: '2026-08-17T12:00:00Z', updatedBy: 'Staf Casemix RS' },
        { status: VCLAIM_STATUS.SUBMITTED, timestamp: '2026-08-17T12:30:00Z', updatedBy: 'Sistem Integrasi V-Claim 2.0' }
      ]
    };

    this.claims.set(c1.noSep, c1);
  }

  /**
   * Transitions claim through its FSM lifecycle
   */
  transitionClaimStatus(noSep, nextStatus, { amountApproved = null, verifierNote = '', updatedBy = 'Verifikator BPJS' } = {}) {
    const claim = this.claims.get(noSep);
    if (!claim) {
      throw new Error(`Klaim dengan nomor SEP ${noSep} tidak ditemukan.`);
    }

    claim.currentStatus = nextStatus;
    if (amountApproved !== null) {
      claim.claimAmountApproved = Number(amountApproved);
    }
    if (verifierNote) {
      claim.bpjsVerifierNote = verifierNote;
    }

    claim.history.push({
      status: nextStatus,
      amountApproved: claim.claimAmountApproved,
      verifierNote,
      timestamp: new Date().toISOString(),
      updatedBy
    });

    return claim;
  }

  getClaimBySep(noSep) {
    return this.claims.get(noSep);
  }

  getAllClaims() {
    return Array.from(this.claims.values());
  }
}

export const bpjsVclaimLifecycleEngineService = new BpjsVclaimLifecycleEngineService();
