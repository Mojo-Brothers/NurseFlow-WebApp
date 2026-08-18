/**
 * NurseFlow Enterprise HIS 2026 — Clinical Rule Governance & Provenance Repository
 * Standards: JCI MCI & Clinical Evidence Traceability
 */

import { ClinicalRuleGovernance } from '../modules/cdss/entities/ClinicalSafetyEntities.js';

class ClinicalRuleGovernanceRepository {
  constructor() {
    this.governanceRecords = new Map();
    this.initCanonicalGovernance();
  }

  initCanonicalGovernance() {
    const records = [
      new ClinicalRuleGovernance({
        id: 'GOV-DDI-001',
        ruleId: 'RULE-DDI-001',
        ruleCode: 'DDI_WARFARIN_ASPIRIN',
        ruleVersion: 1,
        evidenceSource: 'FDA Black Box & Lexicomp Drug Interactions 2026',
        evidenceVersion: '2026.1',
        evidenceReferenceUrl: 'https://reference.medscape.com/drug-interactionchecker/warfarin-aspirin',
        authorPractitionerId: 'PRAC-PHARM-01',
        clinicalReviewerId: 'PRAC-DOC-CHAIR-KFT',
        approvedByCommitteeId: 'KFT-COMMITTEE-01',
        approvalStatus: 'APPROVED',
        approvedAt: 1723900000000,
        changeJustification: 'Initial baseline high-risk bleeding interaction rule.'
      }),
      new ClinicalRuleGovernance({
        id: 'GOV-RENAL-001',
        ruleId: 'RULE-RENAL-001',
        ruleCode: 'RENAL_MEROPENEM_EGFR30',
        ruleVersion: 1,
        evidenceSource: 'KDIGO 2024 Clinical Practice Guideline for Acute Kidney Injury',
        evidenceVersion: '2024.3',
        evidenceReferenceUrl: 'https://kdigo.org/guidelines/acute-kidney-injury',
        authorPractitionerId: 'PRAC-PHARM-02',
        clinicalReviewerId: 'PRAC-DOC-NEPHRO-01',
        approvedByCommitteeId: 'KFT-COMMITTEE-01',
        approvalStatus: 'APPROVED',
        approvedAt: 1723900000000,
        changeJustification: 'Renal clearance dose threshold for carbapenem neurotoxicity prevention.'
      }),
      new ClinicalRuleGovernance({
        id: 'GOV-PED-001',
        ruleId: 'RULE-PED-001',
        ruleCode: 'PED_PARACETAMOL_MAX15',
        ruleVersion: 1,
        evidenceSource: 'WHO Model Formulary for Children 2026',
        evidenceVersion: '2026.02',
        evidenceReferenceUrl: 'https://www.who.int/publications/i/item/9789241547857',
        authorPractitionerId: 'PRAC-PHARM-01',
        clinicalReviewerId: 'PRAC-DOC-PED-01',
        approvedByCommitteeId: 'KFT-COMMITTEE-01',
        approvalStatus: 'APPROVED',
        approvedAt: 1723900000000,
        changeJustification: 'Pediatric hepatotoxicity safety threshold per single administration.'
      })
    ];

    records.forEach(r => this.governanceRecords.set(r.id, r));
  }

  async findByRuleCodeAndVersion(ruleCode, version = 1) {
    return Array.from(this.governanceRecords.values()).find(g => g.ruleCode === ruleCode && g.ruleVersion === version) || null;
  }

  async recordGovernance(data) {
    const id = data.id || `GOV-${Date.now()}`;
    const record = new ClinicalRuleGovernance({ ...data, id, createdAt: Date.now() });
    this.governanceRecords.set(id, record);
    return record;
  }
}

export const clinicalRuleGovernanceRepository = new ClinicalRuleGovernanceRepository();
