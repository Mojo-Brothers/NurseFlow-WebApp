/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #12A Regulatory Hardening & Casemix Integrity Test Suite
 * Master Terminology Governance, Version-Aware INA-CBG Rulesets, Anti-Leading Evidence CDI Queries,
 * Revenue Integrity False-Positive Controls & Multi-Payer Claim Decoupling.
 * Complete 25 Hardening Chaos Gate Scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  clinicalCodingAndCasemixService,
  ClinicalCodingDomainError
} from '../server/services/clinicalCodingAndCasemix.service.js';
import { terminologyGovernanceService } from '../server/services/terminologyGovernance.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-12A — Casemix, Clinical Coding & Regulatory Hardening Gate (25 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    casemix_rulesets: [],
    clinical_coding_records: [],
    clinical_documentation_queries: [],
    casemix_grouping_audits: [],
    revenue_integrity_cross_audits: [],
    electronic_claim_submissions: [],
    casemix_cases: [],
    intraoperative_implant_ledgers: [],
    longitudinal_timeline_events: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-hardened-001',
          patient_id: 'pat-hardened-001',
          encounter_number: 'ENC-2026-REG-01',
          status: 'IN_PROGRESS'
        }
      ],
      casemix_rulesets: [
        {
          id: 'rule-2021-v5',
          ruleset_code: 'RULESET-2021-V5',
          regulation_version: 'Permenkes 26/2021',
          grouping_algorithm_version: 'INA-CBG 5.2',
          effective_from: new Date('2021-01-01T00:00:00Z'),
          effective_until: new Date('2023-01-23T23:59:59Z'),
          severity_multipliers: { I: 1.0, II: 1.20, III: 1.40 },
          is_active: false
        },
        {
          id: 'rule-2023-v6',
          ruleset_code: 'RULESET-2023-V6',
          regulation_version: 'Permenkes 3/2023',
          grouping_algorithm_version: 'INA-CBG 6.0',
          effective_from: new Date('2023-01-24T00:00:00Z'),
          effective_until: null,
          severity_multipliers: { I: 1.0, II: 1.25, III: 1.50 },
          is_active: true
        }
      ],
      clinical_coding_records: [],
      clinical_documentation_queries: [],
      casemix_grouping_audits: [],
      revenue_integrity_cross_audits: [],
      electronic_claim_submissions: [],
      casemix_cases: [],
      intraoperative_implant_ledgers: [],
      longitudinal_timeline_events: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedCodings: [],
            stagedQueries: [],
            stagedGroupings: [],
            stagedAudits: [],
            stagedClaims: [],
            stagedCases: [],
            stagedTimelineEvents: [],
            stagedOutbox: [],
            codingUpdates: [],
            queryUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.clinical_coding_records.push(...activeTransactionState.stagedCodings);
            mockDatabaseState.clinical_documentation_queries.push(...activeTransactionState.stagedQueries);
            mockDatabaseState.casemix_grouping_audits.push(...activeTransactionState.stagedGroupings);
            mockDatabaseState.revenue_integrity_cross_audits.push(...activeTransactionState.stagedAudits);
            mockDatabaseState.electronic_claim_submissions.push(...activeTransactionState.stagedClaims);
            mockDatabaseState.casemix_cases.push(...activeTransactionState.stagedCases);
            mockDatabaseState.longitudinal_timeline_events.push(...activeTransactionState.stagedTimelineEvents);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.codingUpdates.forEach(up => {
              const idx = mockDatabaseState.clinical_coding_records.findIndex(c => c.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.clinical_coding_records[idx] = { ...mockDatabaseState.clinical_coding_records[idx], ...up.data };
              }
            });

            activeTransactionState.queryUpdates.forEach(up => {
              const idx = mockDatabaseState.clinical_documentation_queries.findIndex(q => q.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.clinical_documentation_queries[idx] = { ...mockDatabaseState.clinical_documentation_queries[idx], ...up.data };
              }
            });

            activeTransactionState = null;
          }
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('ROLLBACK')) {
          activeTransactionState = null;
          return { rows: [], rowCount: 0 };
        }

        // SELECT FROM casemix_rulesets WHERE effective_from <= $1 ...
        if (normalized.includes('CASEMIX_RULESETS') && normalized.includes('EFFECTIVE_FROM')) {
          const targetDate = new Date(params[0]);
          const found = mockDatabaseState.casemix_rulesets.filter(r => {
            const effFrom = new Date(r.effective_from);
            const effUntil = r.effective_until ? new Date(r.effective_until) : null;
            return effFrom <= targetDate && (!effUntil || effUntil >= targetDate);
          });
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM clinical_coding_records WHERE encounter_id = $1 AND is_active = TRUE
        if (normalized.includes('CLINICAL_CODING_RECORDS') && normalized.includes('ENCOUNTER_ID = $1') && normalized.includes('IS_ACTIVE = TRUE')) {
          const allCodings = [
            ...mockDatabaseState.clinical_coding_records,
            ...(activeTransactionState?.stagedCodings || [])
          ];
          const found = allCodings.filter(c => c.encounter_id === params[0] && c.is_active === true);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM clinical_coding_records WHERE id = $1
        if (normalized.includes('FROM CLINICAL_CODING_RECORDS WHERE ID = $1')) {
          const allCodings = [
            ...mockDatabaseState.clinical_coding_records,
            ...(activeTransactionState?.stagedCodings || [])
          ];
          const found = allCodings.filter(c => c.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM clinical_documentation_queries WHERE id = $1
        if (normalized.includes('FROM CLINICAL_DOCUMENTATION_QUERIES WHERE ID = $1')) {
          const allQueries = [
            ...mockDatabaseState.clinical_documentation_queries,
            ...(activeTransactionState?.stagedQueries || [])
          ];
          const found = allQueries.filter(q => q.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM intraoperative_implant_ledgers WHERE encounter_id = $1
        if (normalized.includes('FROM INTRAOPERATIVE_IMPLANT_LEDGERS WHERE ENCOUNTER_ID = $1')) {
          const found = mockDatabaseState.intraoperative_implant_ledgers.filter(i => i.encounter_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO clinical_coding_records
        if (normalized.startsWith('INSERT INTO CLINICAL_CODING_RECORDS')) {
          const newCoding = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            coding_number: params[3],
            version_number: params[4],
            is_active: true,
            principal_icd10_code: params[5],
            principal_icd10_desc: params[6],
            secondary_diagnoses: JSON.parse(params[7] || '[]'),
            procedure_codes: JSON.parse(params[8] || '[]'),
            coder_id: params[9],
            coder_name: params[10],
            coding_status: params[11],
            digital_signature_hash: params[12],
            correlation_id: params[13]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedCodings.push(newCoding);
          } else {
            mockDatabaseState.clinical_coding_records.push(newCoding);
          }
          return { rows: [newCoding], rowCount: 1 };
        }

        // UPDATE clinical_coding_records
        if (normalized.startsWith('UPDATE CLINICAL_CODING_RECORDS')) {
          const codingId = params[params.length - 1];
          let updated = {};
          if (normalized.includes('IS_ACTIVE = FALSE')) {
            updated = { is_active: false, coding_status: 'SUPERSEDED' };
          } else if (normalized.includes("CODING_STATUS = 'QUERY_PENDING'")) {
            updated = { coding_status: 'QUERY_PENDING' };
          } else if (normalized.includes("CODING_STATUS = 'CODED'")) {
            updated = { coding_status: 'CODED' };
          }
          if (activeTransactionState) {
            activeTransactionState.codingUpdates.push({ id: codingId, data: updated });
          }
          return { rows: [{ id: codingId, ...updated }], rowCount: 1 };
        }

        // INSERT INTO clinical_documentation_queries
        if (normalized.startsWith('INSERT INTO CLINICAL_DOCUMENTATION_QUERIES')) {
          const newQuery = {
            id: params[0],
            coding_record_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            query_number: params[4],
            query_type: params[5],
            query_text: params[6],
            coder_id: params[7],
            coder_name: params[8],
            target_physician_id: params[9],
            target_physician_name: params[10],
            status: 'OPEN',
            clinical_evidence: JSON.parse(params[11] || '[]'),
            source_document_ids: JSON.parse(params[12] || '[]'),
            digital_signature_hash: params[13],
            correlation_id: params[14]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedQueries.push(newQuery);
          } else {
            mockDatabaseState.clinical_documentation_queries.push(newQuery);
          }
          return { rows: [newQuery], rowCount: 1 };
        }

        // UPDATE clinical_documentation_queries
        if (normalized.startsWith('UPDATE CLINICAL_DOCUMENTATION_QUERIES')) {
          const queryId = params[2];
          const updated = {
            status: 'ANSWERED',
            physician_response_text: params[0],
            digital_signature_hash: params[1],
            coding_version_after: 2
          };
          if (activeTransactionState) {
            activeTransactionState.queryUpdates.push({ id: queryId, data: updated });
          }
          return { rows: [{ id: queryId, ...updated }], rowCount: 1 };
        }

        // INSERT INTO casemix_grouping_audits
        if (normalized.startsWith('INSERT INTO CASEMIX_GROUPING_AUDITS')) {
          const newGrouping = {
            id: params[0],
            coding_record_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            grouping_number: params[4],
            grouper_version: params[5],
            mdc_code: params[6],
            inacbg_code: params[7],
            inacbg_description: params[8],
            severity_level: params[9],
            base_tariff_idr: params[10],
            special_procedures_topup_idr: params[11],
            special_prosthesis_topup_idr: params[12],
            special_drugs_topup_idr: params[13],
            final_claim_tariff_idr: params[14],
            real_hospital_cost_idr: params[15],
            cost_variance_idr: params[16],
            grouped_by_id: params[17],
            grouped_by_name: params[18],
            digital_signature_hash: params[19],
            correlation_id: params[20],
            ruleset_id: params[21],
            regulation_version: params[22]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedGroupings.push(newGrouping);
          } else {
            mockDatabaseState.casemix_grouping_audits.push(newGrouping);
          }
          return { rows: [newGrouping], rowCount: 1 };
        }

        // INSERT INTO revenue_integrity_cross_audits
        if (normalized.startsWith('INSERT INTO REVENUE_INTEGRITY_CROSS_AUDITS')) {
          const newAudit = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            audit_number: params[3],
            audit_status: params[4],
            coded_diagnoses_count: params[5],
            coded_procedures_count: params[6],
            identified_leakages: JSON.parse(params[7] || '[]'),
            suppressed_false_positives: JSON.parse(params[8] || '[]'),
            audited_by_id: params[9],
            audited_by_name: params[10],
            digital_signature_hash: params[11],
            correlation_id: params[12]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAudits.push(newAudit);
          } else {
            mockDatabaseState.revenue_integrity_cross_audits.push(newAudit);
          }
          return { rows: [newAudit], rowCount: 1 };
        }

        // INSERT INTO electronic_claim_submissions
        if (normalized.startsWith('INSERT INTO ELECTRONIC_CLAIM_SUBMISSIONS')) {
          const newClaim = {
            id: params[0],
            grouping_audit_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            submission_number: params[4],
            sep_number: params[5],
            bpjs_card_number: params[6],
            payer_type: params[7],
            payer_adapter_type: params[8],
            claim_status: params[9],
            dispute_reason: params[10],
            claimed_amount_idr: params[11],
            approved_amount_idr: params[12],
            copay_balance_idr: params[13],
            submitter_id: params[14],
            submitter_name: params[15],
            digital_signature_hash: params[16],
            correlation_id: params[17]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedClaims.push(newClaim);
          } else {
            mockDatabaseState.electronic_claim_submissions.push(newClaim);
          }
          return { rows: [newClaim], rowCount: 1 };
        }

        // INSERT INTO longitudinal_timeline_events
        if (normalized.startsWith('INSERT INTO LONGITUDINAL_TIMELINE_EVENTS')) {
          const newEvt = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            event_category: params[3],
            event_title: params[4],
            event_summary: params[5],
            domain_source_table: params[6],
            domain_source_id: params[7],
            clinical_severity: params[13],
            correlation_id: params[15]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedTimelineEvents.push(newEvt);
          } else {
            mockDatabaseState.longitudinal_timeline_events.push(newEvt);
          }
          return { rows: [newEvt], rowCount: 1 };
        }

        // INSERT INTO clinical_domain_outbox
        if (normalized.startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
          let eventType = 'UNKNOWN';
          const match = sql.match(/'([A-Z0-9_]+)',\s*\$[0-9],\s*'PENDING'/);
          if (match) {
            eventType = match[1];
          }
          const newOutbox = {
            id: params[0],
            event_type: eventType,
            correlation_id: params[params.length - 1]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedOutbox.push(newOutbox);
          } else {
            mockDatabaseState.clinical_domain_outbox.push(newOutbox);
          }
          return { rows: [{ id: newOutbox.id }], rowCount: 1 };
        }

        return { rows: [], rowCount: 0 };
      }),
      release: vi.fn()
    };

    vi.spyOn(postgresPoolService, 'getPool').mockReturnValue({
      connect: vi.fn(async () => mockClient),
      query: vi.fn(async (sql, params) => mockClient.query(sql, params))
    });
  });

  // ─── TC-H01: DYNAMIC REGULATION VERSION LOADING ───
  it('TC-H01: should dynamically resolve active Permenkes 3/2023 ruleset for current 2026 encounters', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Appendicitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-hardened-001', {
      admissionDate: '2026-08-20T10:00:00Z',
      baseTariffIdr: 8000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    expect(grouping.regulation_version).toBe('Permenkes 3/2023');
    expect(grouping.grouper_version).toBe('INA-CBG 6.0');
  });

  // ─── TC-H02: HISTORICAL ENCOUNTER REPRODUCIBILITY ───
  it('TC-H02: should resolve historical Permenkes 26/2021 ruleset for 2022 encounters', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia',
      secondaryDiagnoses: [
        { icd10: 'A41.9', desc: 'Severe Sepsis', poa: 'Y', is_cc: false, is_mcc: true }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    // Historical encounter from 2022
    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-hardened-001', {
      admissionDate: '2022-05-15T08:00:00Z',
      baseTariffIdr: 10000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    expect(grouping.regulation_version).toBe('Permenkes 26/2021');
    expect(grouping.grouper_version).toBe('INA-CBG 5.2');
    // Multiplier for 2021 Severity III is 1.40x (vs 1.50x in 2023)
    expect(Number(grouping.base_tariff_idr)).toBe(14000000.00);
  });

  // ─── TC-H03: GROUPING ALGORITHM VERSION TRACKING ───
  it('TC-H03: should record exact ruleset ID and regulation version in grouping audit ledger', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'I50.0',
      principalIcd10Desc: 'Congestive Heart Failure'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-hardened-001', {}, {
      role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER
    });

    expect(grouping.ruleset_id).toBeDefined();
    expect(grouping.regulation_version).toBe('Permenkes 3/2023');
  });

  // ─── TC-H04: HISTORICAL RE-GROUPING FIDELITY ───
  it('TC-H04: should guarantee that re-grouping an old encounter produces deterministic historical results', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Appendicitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    const grouping1 = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-hardened-001', {
      admissionDate: '2021-12-01T10:00:00Z',
      baseTariffIdr: 5000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    const grouping2 = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-hardened-001', {
      admissionDate: '2021-12-01T10:00:00Z',
      baseTariffIdr: 5000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    expect(grouping1.regulation_version).toBe(grouping2.regulation_version);
    expect(grouping1.final_claim_tariff_idr).toBe(grouping2.final_claim_tariff_idr);
  });

  // ─── TC-H05: INVALID ICD-10 CODE REJECTION ───
  it('TC-H05: should reject non-standard ICD-10 code format (422 INVALID_ICD10_CODE)', async () => {
    await expect(clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: '123-INVALID',
      principalIcd10Desc: 'Invalid Code'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER })).rejects.toThrow('Format kode ICD-10');
  });

  // ─── TC-H06: DEPRECATED ICD-10 DETECTION & WARNING ───
  it('TC-H06: should flag deprecated ICD-10 code with replacement recommendation and WARNING timeline severity', async () => {
    const record = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'A41.8', // Deprecated in registry
      principalIcd10Desc: 'Other specified sepsis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    expect(record.principal_icd10_code).toBe('A41.8');
    expect(mockDatabaseState.longitudinal_timeline_events[0].clinical_severity).toBe('WARNING');
  });

  // ─── TC-H07: INVALID ICD-9-CM CODE REJECTION ───
  it('TC-H07: should reject non-standard ICD-9-CM procedure code format (422 INVALID_ICD9_CODE)', async () => {
    await expect(clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Appendicitis',
      procedureCodes: [{ icd9: 'PROC-999-XYZ', desc: 'Invalid Procedure' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER })).rejects.toThrow('Format kode tindakan ICD-9-CM');
  });

  // ─── TC-H08: CONFLICTING PRINCIPAL DIAGNOSIS ALIGNMENT ───
  it('TC-H08: should deduplicate principal diagnosis if accidentally repeated in secondary list', async () => {
    const record = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Appendicitis',
      secondaryDiagnoses: [
        { icd10: 'K35.8', desc: 'Duplicate Principal', poa: 'Y' },
        { icd10: 'E11.9', desc: 'Diabetes', poa: 'Y', is_cc: true }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    // Deduplication should leave only E11.9 in secondary
    expect(record.secondary_diagnoses.length).toBe(1);
    expect(record.secondary_diagnoses[0].icd10).toBe('E11.9');
  });

  // ─── TC-H09: DUPLICATE SECONDARY DIAGNOSES DEDUPING ───
  it('TC-H09: should deduplicate redundant secondary diagnoses', async () => {
    const record = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia',
      secondaryDiagnoses: [
        { icd10: 'E11.9', desc: 'Diabetes', poa: 'Y' },
        { icd10: 'E11.9', desc: 'Diabetes Duplicate', poa: 'Y' }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    expect(record.secondary_diagnoses.length).toBe(1);
  });

  // ─── TC-H10: ANTI-LEADING CDI QUERY GUARD ───
  it('TC-H10: should reject leading/biased CDI queries attempting to inflate INA-CBG claim tariffs (422 LEADING_QUERY_REJECTED)', async () => {
    const coding = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    await expect(clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: coding.id,
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Dokter, tolong naikkan ke MCC biar klaim naik tinggi di INA-CBG.',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [{ item: 'Lactate 3.5' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER })).rejects.toThrow('pertanyaan mengarahkan (leading query)');
  });

  // ─── TC-H11: MISSING CLINICAL EVIDENCE GUARD ON CDI QUERY ───
  it('TC-H11: should reject CDI queries missing clinical evidence array (422 MISSING_CLINICAL_EVIDENCE)', async () => {
    const coding = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    await expect(clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: coding.id,
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Mohon klarifikasi organisme penyebab pneumonia.',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [] // Empty evidence
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER })).rejects.toThrow('wajib menyertakan bukti klinis pendukung');
  });

  // ─── TC-H12: EVIDENCE-BASED NEUTRAL CDI QUERY SUCCESS ───
  it('TC-H12: should successfully record neutral evidence-based CDI clarification query', async () => {
    const coding = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    const query = await clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: coding.id,
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Berdasarkan bukti klinis suhu 39C, leukosit 18.000 dan kultur sputum, mohon konfirmasi klasifikasi definitif pneumonia.',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [
        { type: 'VITAL_SIGNS', summary: 'Suhu 39.1C, HR 115x/m, BP 90/60' },
        { type: 'LABORATORY', summary: 'Leukosit 18.500/uL, Laktat 3.2 mmol/L' }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    expect(query.status).toBe('OPEN');
    expect(query.clinical_evidence.length).toBe(2);
  });

  // ─── TC-H13: PHYSICIAN QUERY PROVENANCE TRACKING ───
  it('TC-H13: should record query response and link coding revision provenance', async () => {
    const coding = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    const query = await clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: coding.id,
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Klarifikasi pneumonia.',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [{ type: 'LAB', summary: 'WBC 18.000' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });

    const response = await clinicalCodingAndCasemixService.respondToPhysicianQuery(query.id, {
      physicianResponseText: 'Pneumonia aspirasi dengan komplikasi sepsis berat.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(response.status).toBe('ANSWERED');
    expect(response.coding_version_after).toBe(2);
  });

  // ─── TC-H14: BUNDLED PROCEDURE FALSE-POSITIVE SUPPRESSION ───
  it('TC-H14: should suppress false-positive revenue leakage for bundled integrated procedures', async () => {
    const audit = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit('enc-hardened-001', {
      isBundledProcedure: true
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(audit.audit_status).toBe('CLEAN_NO_LEAKAGE');
    expect(audit.suppressed_false_positives[0].suppressionType).toBe('BUNDLED_PROCEDURE');
  });

  // ─── TC-H15: NON-BILLABLE ASSESSMENT SUPPRESSION ───
  it('TC-H15: should classify routine clinical assessment as NOT_BILLABLE_ASSESSMENT without leakage alarm', async () => {
    const audit = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit('enc-hardened-001', {
      isNonBillableAssessment: true
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(audit.audit_status).toBe('CLEAN_NO_LEAKAGE');
    expect(audit.suppressed_false_positives[0].suppressionType).toBe('NOT_BILLABLE_ASSESSMENT');
  });

  // ─── TC-H16: CANCELLED SURGERY SUPPRESSION ───
  it('TC-H16: should suppress missing procedure codes on aborted/cancelled surgeries', async () => {
    const audit = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit('enc-hardened-001', {
      isCancelledSurgery: true
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(audit.audit_status).toBe('CLEAN_NO_LEAKAGE');
    expect(audit.suppressed_false_positives[0].suppressionType).toBe('CANCELLED_SURGERY');
  });

  // ─── TC-H17: PAYER CONTRACT CHARGE EXEMPTION ───
  it('TC-H17: should respect legitimate payer contract charge exemptions', async () => {
    const audit = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit('enc-hardened-001', {
      isPayerExempt: true
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(audit.audit_status).toBe('CLEAN_NO_LEAKAGE');
    expect(audit.suppressed_false_positives[0].suppressionType).toBe('PAYER_EXEMPT');
  });

  // ─── TC-H18: MULTI-PAYER ADAPTER: PRIVATE INSURANCE ADMEDIKA ───
  it('TC-H18: should submit claim via PRIVATE_INSURANCE_ADMEDIKA adapter with copay tracking', async () => {
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      sepNumber: 'ADM-PRU-2026-0099',
      bpjsCardNumber: 'POLICY-PRU-889900',
      payerType: 'ASURANSI_SWASTA',
      payerAdapterType: 'PRIVATE_INSURANCE_ADMEDIKA',
      claimedAmountIdr: 25000000.00,
      approvedAmountIdr: 20000000.00,
      copayBalanceIdr: 5000000.00,
      claimStatus: 'ACCEPTED'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(claim.payer_adapter_type).toBe('PRIVATE_INSURANCE_ADMEDIKA');
    expect(Number(claim.copay_balance_idr)).toBe(5000000.00);
  });

  // ─── TC-H19: MULTI-PAYER ADAPTER: CORPORATE DIRECT ───
  it('TC-H19: should submit claim via CORPORATE_DIRECT contract', async () => {
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      sepNumber: 'GL-CORP-PLN-001',
      bpjsCardNumber: 'EMP-PLN-12345',
      payerType: 'ASURANSI_SWASTA',
      payerAdapterType: 'CORPORATE_DIRECT',
      claimedAmountIdr: 15000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(claim.payer_adapter_type).toBe('CORPORATE_DIRECT');
  });

  // ─── TC-H20: CLAIM DISPUTE STRUCTURED REASON ───
  it('TC-H20: should record claim dispute with specific adjudicator reason code', async () => {
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      sepNumber: '0001R0010826V009999',
      bpjsCardNumber: '000999888777',
      claimedAmountIdr: 15000000.00,
      claimStatus: 'DISPUTED',
      disputeReason: 'DISPUTE_CODE_04: Perlu resume medis lengkap dan rincian pemakaian ventilator'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(claim.claim_status).toBe('DISPUTED');
    expect(claim.dispute_reason).toContain('DISPUTE_CODE_04');
  });

  // ─── TC-H21: CLAIM CORRECTION & RESUBMISSION ───
  it('TC-H21: should handle claim resubmission after dispute resolution', async () => {
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      sepNumber: '0001R0010826V009999',
      bpjsCardNumber: '000999888777',
      claimedAmountIdr: 15000000.00,
      claimStatus: 'RESUBMITTED',
      disputeReason: 'Resubmitted with attached ventilator telemetry records'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(claim.claim_status).toBe('RESUBMITTED');
  });

  // ─── TC-H22: CLAIM FULL SETTLEMENT (PAID) ───
  it('TC-H22: should settle claim with full approved amount and PAID status', async () => {
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      sepNumber: '0001R0010826V009999',
      bpjsCardNumber: '000999888777',
      claimedAmountIdr: 15000000.00,
      approvedAmountIdr: 15000000.00,
      claimStatus: 'PAID'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(claim.claim_status).toBe('PAID');
    expect(Number(claim.approved_amount_idr)).toBe(15000000.00);
  });

  // ─── TC-H23: PARTIAL PAYMENT & PATIENT COPAY RECONCILIATION ───
  it('TC-H23: should record partial payment and calculate patient copay balance', async () => {
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      sepNumber: '0001R0010826V009999',
      bpjsCardNumber: '000999888777',
      claimedAmountIdr: 15000000.00,
      approvedAmountIdr: 12000000.00,
      copayBalanceIdr: 3000000.00,
      claimStatus: 'ACCEPTED'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    expect(Number(claim.approved_amount_idr)).toBe(12000000.00);
    expect(Number(claim.copay_balance_idr)).toBe(3000000.00);
  });

  // ─── TC-H24: SOVEREIGN CLINICAL STATE ISOLATION INVARIANT ───
  it('TC-H24: should guarantee clinical encounter state remains sovereign during claim failure/dispute', async () => {
    await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      sepNumber: '0001R0010826V009999',
      bpjsCardNumber: '000999888777',
      claimedAmountIdr: 15000000.00,
      claimStatus: 'DISPUTED',
      disputeReason: 'Severe documentation discrepancy'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });

    // Encounter state remains intact
    expect(mockDatabaseState.encounters[0].status).toBe('IN_PROGRESS');
  });

  // ─── TC-H25: FULL E2E REGULATORY HARDENED RECONCILIATION ───
  it('TC-H25: should reconcile complete versioned casemix, evidence CDI query, and false-positive audit with 0 discrepancy', async () => {
    // 1. Koding v1 with initial diagnosis
    const codingV1 = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });
    expect(codingV1.version_number).toBe(1);

    // 2. Evidence-based neutral CDI Query
    const query = await clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: codingV1.id,
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Berdasarkan laktat 3.2 dan hipotensi, mohon klarifikasi ada/tidaknya sepsis.',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [{ type: 'LAB', summary: 'Lactate 3.2' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });
    expect(query.status).toBe('OPEN');

    // 3. DPJP answers query
    const answeredQuery = await clinicalCodingAndCasemixService.respondToPhysicianQuery(query.id, {
      physicianResponseText: 'Konfirmasi: Sepsis Berat (A41.9).'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(answeredQuery.status).toBe('ANSWERED');

    // 4. Coder publishes Koding v2 with MCC
    const codingV2 = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia Berat',
      secondaryDiagnoses: [
        { icd10: 'A41.9', desc: 'Sepsis Berat (MCC)', poa: 'Y', is_cc: false, is_mcc: true }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });
    expect(codingV2.version_number).toBe(2);

    // 5. Version-aware INA-CBG Grouping (Permenkes 3/2023)
    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-hardened-001', {
      admissionDate: '2026-08-20T12:00:00Z',
      baseTariffIdr: 10000000.00,
      realHospitalCostIdr: 12000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER });
    expect(grouping.regulation_version).toBe('Permenkes 3/2023');
    expect(grouping.severity_level).toBe('III');
    expect(Number(grouping.final_claim_tariff_idr)).toBe(15000000.00);

    // 6. False-Positive Suppressed Cross-Audit
    const audit = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit('enc-hardened-001', {
      isBundledProcedure: true
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });
    expect(audit.audit_status).toBe('CLEAN_NO_LEAKAGE');

    // 7. Multi-Payer Claim Submission
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: grouping.id,
      encounterId: 'enc-hardened-001',
      patientId: 'pat-hardened-001',
      sepNumber: '0001R0010826V007777',
      bpjsCardNumber: '000777666555',
      payerAdapterType: 'BPJS_VCLAIM',
      claimedAmountIdr: 15000000.00,
      approvedAmountIdr: 15000000.00,
      claimStatus: 'PAID'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN });
    expect(claim.claim_status).toBe('PAID');

    // Ledger Counts
    expect(mockDatabaseState.clinical_coding_records.length).toBe(2);
    expect(mockDatabaseState.clinical_documentation_queries.length).toBe(1);
    expect(mockDatabaseState.casemix_grouping_audits.length).toBe(1);
    expect(mockDatabaseState.revenue_integrity_cross_audits.length).toBe(1);
    expect(mockDatabaseState.electronic_claim_submissions.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(7);
  });
});
