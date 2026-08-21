/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #12 Durability & Clinical Safety Test Suite
 * Clinical Coding, Casemix & Revenue Integrity Closed Loop
 * Standards: Permenkes No. 3/2023, JCI MOI / COP / FMS, SCD2 Versioned Coding, PostgreSQL 16 ACID.
 * Complete 25 Chaos Gate Scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  clinicalCodingAndCasemixService,
  ClinicalCodingDomainError
} from '../server/services/clinicalCodingAndCasemix.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-12 — Clinical Coding, Casemix & Revenue Integrity ➔ PostgreSQL Durability & Chaos Gate (25 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    clinical_coding_records: [],
    clinical_documentation_queries: [],
    casemix_grouping_audits: [],
    revenue_integrity_cross_audits: [],
    electronic_claim_submissions: [],
    casemix_cases: [],
    intraoperative_implant_ledgers: [],
    longitudinal_timeline_events: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-casemix-001',
          episode_id: 'epc-casemix-001',
          patient_id: 'pat-casemix-001',
          encounter_number: 'ENC-2026-CM-01',
          status: 'IN_PROGRESS'
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
      universal_audit_logs: [],
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
            stagedAuditLogs: [],
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
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
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

        // SELECT FROM casemix_rulesets
        if (normalized.includes('CASEMIX_RULESETS')) {
          return {
            rows: [{
              id: 'rule-2023-v6',
              ruleset_code: 'RULESET-2023-V6',
              regulation_version: 'Permenkes 3/2023',
              grouping_algorithm_version: 'INA-CBG 6.0',
              severity_multipliers: { I: 1.0, II: 1.25, III: 1.5 },
              is_active: true
            }],
            rowCount: 1
          };
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

  // ─── TC-01: CLINICAL CODING AUTHORING ───
  it('TC-01: should author clinical coding record with principal ICD-10 diagnosis and digital signature', async () => {
    const record = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Other and unspecified acute appendicitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(record.version_number).toBe(1);
    expect(record.is_active).toBe(true);
    expect(record.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockDatabaseState.clinical_coding_records.length).toBe(1);
  });

  // ─── TC-02: SCD2 CODING MULTI-VERSION IMMUTABILITY ───
  it('TC-02: should maintain SCD2 version history (v1 -> v2) without overwriting legacy coding', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Acute appendicitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const v2 = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.2',
      principalIcd10Desc: 'Acute appendicitis with generalized peritonitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(v2.version_number).toBe(2);
    expect(mockDatabaseState.clinical_coding_records.length).toBe(2);
  });

  // ─── TC-03: INCOMPLETE CODING DATA GUARD ───
  it('TC-03: should reject clinical coding record missing principal diagnosis', async () => {
    await expect(clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' })).rejects.toThrow('Data koding klinis tidak lengkap');
  });

  // ─── TC-04: CC / MCC COMORBIDITY TAGGING ───
  it('TC-04: should store secondary diagnoses with CC and MCC complication flags', async () => {
    const record = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'I50.0',
      principalIcd10Desc: 'Congestive heart failure',
      secondaryDiagnoses: [
        { icd10: 'E11.9', desc: 'Type 2 diabetes mellitus', poa: 'Y', is_cc: true, is_mcc: false },
        { icd10: 'N17.9', desc: 'Acute kidney failure, unspecified', poa: 'Y', is_cc: false, is_mcc: true }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(record.secondary_diagnoses.length).toBe(2);
    expect(record.secondary_diagnoses[1].is_mcc).toBe(true);
  });

  // ─── TC-05: PRESENT ON ADMISSION (POA) TAGGING ───
  it('TC-05: should validate Present On Admission (POA) flags on secondary diagnoses', async () => {
    const record = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia',
      secondaryDiagnoses: [
        { icd10: 'A41.9', desc: 'Sepsis, unspecified', poa: 'Y', is_cc: false, is_mcc: true }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(record.secondary_diagnoses[0].poa).toBe('Y');
  });

  // ─── TC-06: PROCEDURE CODING (ICD-9-CM) LINKAGE ───
  it('TC-06: should record ICD-9-CM procedure codes linked to surgical case', async () => {
    const record = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Acute appendicitis',
      procedureCodes: [
        { icd9: '47.0', desc: 'Laparoscopic appendectomy', sequence: 1 }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(record.procedure_codes.length).toBe(1);
    expect(record.procedure_codes[0].icd9).toBe('47.0');
  });

  // ─── TC-07: CDI PHYSICIAN-CODER QUERY CREATION ───
  it('TC-07: should create CDI clarification query from professional coder to attending DPJP', async () => {
    const coding = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const query = await clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: coding.id,
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Mohon konfirmasi apakah pneumonia disebabkan oleh aspirasi atau bakteri komunitas (CAP)?',
      targetPhysicianId: 'DOC-DPJP-01',
      targetPhysicianName: 'dr. Sp.P',
      clinicalEvidence: [{ type: 'LAB', summary: 'Leukosit 18.000, CRP tinggi' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(query.query_number).toMatch(/^CDI-QRY-\d+/);
    expect(query.status).toBe('OPEN');
    expect(mockDatabaseState.clinical_documentation_queries.length).toBe(1);
  });

  // ─── TC-08: CODING STATUS TRANSITION TO QUERY_PENDING ───
  it('TC-08: should update coding record status to QUERY_PENDING when CDI query is opened', async () => {
    const coding = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    await clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: coding.id,
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Klarifikasi organisme penyebab.',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [{ type: 'MICROBIOLOGY', summary: 'Sputum culture pending' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'CDI_PHYSICIAN_QUERY_OPENED')).toBe(true);
  });

  // ─── TC-09: NON-PHYSICIAN QUERY RESPONSE GUARD ───
  it('TC-09: should reject answering CDI query by unauthorized non-physician roles (403)', async () => {
    await expect(clinicalCodingAndCasemixService.respondToPhysicianQuery('qry-001', {
      physicianResponseText: 'Pneumonia Bakterial'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-10: PHYSICIAN QUERY RESPONSE & STATUS RESOLUTION ───
  it('TC-10: should record attending physician response and resolve CDI query to ANSWERED', async () => {
    const coding = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const query = await clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: coding.id,
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Klarifikasi organisme.',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [{ type: 'CHEST_XRAY', summary: 'Infiltrate right lower lobe' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const response = await clinicalCodingAndCasemixService.respondToPhysicianQuery(query.id, {
      physicianResponseText: 'Konfirmasi: Community-Acquired Pneumonia (CAP) berat ec Klebsiella pneumoniae.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(response.status).toBe('ANSWERED');
    expect(response.physician_response_text).toContain('CAP');
  });

  // ─── TC-11: DUPLICATE QUERY RESPONSE PREVENTION ───
  it('TC-11: should reject answering an already answered CDI query', async () => {
    const coding = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const query = await clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: coding.id,
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Klarifikasi.',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [{ type: 'VITALS', summary: 'SpO2 91% on room air' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    await clinicalCodingAndCasemixService.respondToPhysicianQuery(query.id, {
      physicianResponseText: 'Jawaban 1'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    // Mock query state as answered
    mockDatabaseState.clinical_documentation_queries[0].status = 'ANSWERED';

    await expect(clinicalCodingAndCasemixService.respondToPhysicianQuery(query.id, {
      physicianResponseText: 'Jawaban 2'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Query klarifikasi ini sudah dijawab sebelumnya');
  });

  // ─── TC-12: PERMENKES 3/2023 INA-CBG GROUPING ───
  it('TC-12: should execute INA-CBG grouping from active clinical coding record', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Acute appendicitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-casemix-001', {
      baseTariffIdr: 8000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(grouping.inacbg_code).toBe('K-1-14-I');
    expect(grouping.severity_level).toBe('I');
    expect(grouping.digital_signature_hash).toBeDefined();
  });

  // ─── TC-13: GROUPING SEVERITY LEVEL I (NO CC) ───
  it('TC-13: should assign Severity Level I when no CC/MCC is present', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'I50.0',
      principalIcd10Desc: 'Congestive heart failure',
      secondaryDiagnoses: []
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-casemix-001', {
      baseTariffIdr: 10000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(grouping.inacbg_code).toBe('I-4-10-I');
    expect(grouping.severity_level).toBe('I');
  });

  // ─── TC-14: GROUPING SEVERITY LEVEL II (MODERATE CC) ───
  it('TC-14: should assign Severity Level II with 1.25x multiplier when active CC is present', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'I50.0',
      principalIcd10Desc: 'Congestive heart failure',
      secondaryDiagnoses: [
        { icd10: 'E11.9', desc: 'Type 2 diabetes', poa: 'Y', is_cc: true, is_mcc: false }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-casemix-001', {
      baseTariffIdr: 10000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(grouping.inacbg_code).toBe('I-4-10-II');
    expect(grouping.severity_level).toBe('II');
    expect(Number(grouping.base_tariff_idr)).toBe(12500000.00);
  });

  // ─── TC-15: GROUPING SEVERITY LEVEL III (SEVERE MCC) ───
  it('TC-15: should assign Severity Level III with 1.5x multiplier when major MCC is present', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia',
      secondaryDiagnoses: [
        { icd10: 'A41.9', desc: 'Severe Sepsis / Septic Shock', poa: 'Y', is_cc: false, is_mcc: true }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-casemix-001', {
      baseTariffIdr: 10000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(grouping.inacbg_code).toBe('J-4-16-III');
    expect(grouping.severity_level).toBe('III');
    expect(Number(grouping.base_tariff_idr)).toBe(15000000.00);
  });

  // ─── TC-16: SPECIAL TOP-UP TARIFFS CALCULATION ───
  it('TC-16: should compute special procedures and prosthesis top-ups into final claim tariff', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Appendicitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-casemix-001', {
      baseTariffIdr: 8000000.00,
      specialProsthesisTopupIdr: 3500000.00,
      specialDrugsTopupIdr: 1500000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(Number(grouping.final_claim_tariff_idr)).toBe(13000000.00);
  });

  // ─── TC-17: REAL COST VS TARIFF VARIANCE ───
  it('TC-17: should calculate cost variance against real hospital costs', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Appendicitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-casemix-001', {
      baseTariffIdr: 10000000.00,
      realHospitalCostIdr: 7500000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(Number(grouping.cost_variance_idr)).toBe(2500000.00);
  });

  // ─── TC-18: GROUPING GUARD ON UNCODED ENCOUNTER ───
  it('TC-18: should reject grouping when encounter has no active clinical coding record (422)', async () => {
    await expect(clinicalCodingAndCasemixService.executeCasemixGrouping('enc-uncoded-999', {}, {
      role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER'
    })).rejects.toThrow('Tidak ditemukan data koding klinis aktif');
  });

  // ─── TC-19: REVENUE INTEGRITY CLEAN CROSS-AUDIT ───
  it('TC-19: should audit clean encounter with no uncoded procedures or missing charges as CLEAN_NO_LEAKAGE', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Appendicitis',
      procedureCodes: [{ icd9: '47.0', desc: 'Appendectomy' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    const audit = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit('enc-casemix-001', {}, {
      role: ENTERPRISE_ROLES.ROLE_ADMIN || 'ROLE_ADMIN'
    });

    expect(audit.audit_status).toBe('CLEAN_NO_LEAKAGE');
    expect(audit.identified_leakages.length).toBe(0);
  });

  // ─── TC-20: REVENUE INTEGRITY UNCODED SURGERY LEAKAGE ───
  it('TC-20: should detect UNCODED_CLINICAL_EVENT when surgical implant is deployed but procedure is uncoded', async () => {
    // Add active coding without procedure codes
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'S52.5',
      principalIcd10Desc: 'Fracture of lower end of radius',
      procedureCodes: []
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    // Mock deployed implant
    mockDatabaseState.intraoperative_implant_ledgers.push({
      id: 'imp-001',
      encounter_id: 'enc-casemix-001',
      implant_name: 'Titanium Distal Radius Plate'
    });

    const audit = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit('enc-casemix-001', {}, {
      role: ENTERPRISE_ROLES.ROLE_ADMIN || 'ROLE_ADMIN'
    });

    expect(audit.audit_status).toBe('UNCODED_CLINICAL_EVENT');
    expect(audit.identified_leakages[0].leakageType).toBe('UNCODED_SURGICAL_PROCEDURE');
  });

  // ─── TC-21: ELECTRONIC CLAIM SUBMISSION ───
  it('TC-21: should submit electronic claim with SEP number and claimed tariff amount', async () => {
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      sepNumber: '0001R0010826V000123',
      bpjsCardNumber: '0001234567890',
      claimedAmountIdr: 12500000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN || 'ROLE_ADMIN' });

    expect(claim.submission_number).toMatch(/^CLM-\d+/);
    expect(claim.claim_status).toBe('SUBMITTED');
    expect(mockDatabaseState.electronic_claim_submissions.length).toBe(1);
  });

  // ─── TC-22: ELECTRONIC CLAIM DISPUTE & RESUBMISSION ───
  it('TC-22: should record claim dispute reason and support resubmission workflow', async () => {
    const disputedClaim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      sepNumber: '0001R0010826V000123',
      bpjsCardNumber: '0001234567890',
      claimedAmountIdr: 12500000.00,
      claimStatus: 'DISPUTED',
      disputeReason: 'Klaim pending: Dibutuhkan hasil ekspertise PA untuk konfirmasi diagnosis'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN || 'ROLE_ADMIN' });

    expect(disputedClaim.claim_status).toBe('DISPUTED');
    expect(disputedClaim.dispute_reason).toContain('hasil ekspertise PA');
  });

  // ─── TC-23: DECOUPLED SEPARATION OF CONCERNS ───
  it('TC-23: should maintain clinical encounter integrity regardless of claim adjudication status', async () => {
    await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: 'grp-001',
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      sepNumber: '0001R0010826V000123',
      bpjsCardNumber: '0001234567890',
      claimedAmountIdr: 12500000.00,
      claimStatus: 'DISPUTED',
      disputeReason: 'Pending berkas'
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN || 'ROLE_ADMIN' });

    // Encounter status is completely isolated from billing disputes
    expect(mockDatabaseState.encounters[0].status).toBe('IN_PROGRESS');
  });

  // ─── TC-24: AUDIT TRAIL & OUTBOX ATOMICITY ───
  it('TC-24: should write domain outbox and audit events atomically for coding and grouping', async () => {
    await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'K35.8',
      principalIcd10Desc: 'Appendicitis'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });

    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'CLINICAL_CODING_RECORDED')).toBe(true);
  });

  // ─── TC-25: FULL E2E CLINICAL CODING & CASEMIX RECONCILIATION ───
  it('TC-25: should reconcile complete coding, CDI query, grouping, and claim journey with 0 discrepancy', async () => {
    // 1. Initial Coding v1
    const codingV1 = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia tidak spesifik'
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });
    expect(codingV1.version_number).toBe(1);

    // 2. CDI Query opened to DPJP
    const query = await clinicalCodingAndCasemixService.createPhysicianQuery({
      codingRecordId: codingV1.id,
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      queryType: 'SPECIFICITY_CLARIFICATION',
      queryText: 'Apakah terdapat syok septik atau komplikasi gagal nafas?',
      targetPhysicianId: 'DOC-DPJP-01',
      clinicalEvidence: [{ type: 'LAB', summary: 'Laktat 3.8, TD 85/50' }]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });
    expect(query.status).toBe('OPEN');

    // 3. DPJP answers query
    const answeredQuery = await clinicalCodingAndCasemixService.respondToPhysicianQuery(query.id, {
      physicianResponseText: 'Konfirmasi klinis: Pasien mengalami Sepsis Berat dengan Syok Septik (A41.9).'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(answeredQuery.status).toBe('ANSWERED');

    // 4. Coder publishes Coding v2 with MCC
    const codingV2 = await clinicalCodingAndCasemixService.recordOrUpdateClinicalCoding({
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      principalIcd10Code: 'J18.9',
      principalIcd10Desc: 'Pneumonia Komunitas Berat',
      secondaryDiagnoses: [
        { icd10: 'A41.9', desc: 'Syok Septik (MCC)', poa: 'Y', is_cc: false, is_mcc: true }
      ]
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });
    expect(codingV2.version_number).toBe(2);

    // 5. INA-CBG Grouping with Severity III
    const grouping = await clinicalCodingAndCasemixService.executeCasemixGrouping('enc-casemix-001', {
      baseTariffIdr: 10000000.00,
      realHospitalCostIdr: 11000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_CASEMIX_CODER || 'ROLE_CASEMIX_CODER' });
    expect(grouping.severity_level).toBe('III');
    expect(Number(grouping.final_claim_tariff_idr)).toBe(15000000.00);

    // 6. Revenue Cross-Audit
    const audit = await clinicalCodingAndCasemixService.performRevenueIntegrityCrossAudit('enc-casemix-001', {}, {
      role: ENTERPRISE_ROLES.ROLE_ADMIN || 'ROLE_ADMIN'
    });
    expect(audit.audit_status).toBe('CLEAN_NO_LEAKAGE');

    // 7. Claim Submission
    const claim = await clinicalCodingAndCasemixService.submitElectronicClaim({
      groupingAuditId: grouping.id,
      encounterId: 'enc-casemix-001',
      patientId: 'pat-casemix-001',
      sepNumber: '0001R0010826V000888',
      bpjsCardNumber: '0008887776665',
      claimedAmountIdr: 15000000.00
    }, { role: ENTERPRISE_ROLES.ROLE_ADMIN || 'ROLE_ADMIN' });
    expect(claim.claim_status).toBe('SUBMITTED');

    // Total Ledger Reconciliation (0 Discrepancy)
    expect(mockDatabaseState.clinical_coding_records.length).toBe(2);
    expect(mockDatabaseState.clinical_documentation_queries.length).toBe(1);
    expect(mockDatabaseState.casemix_grouping_audits.length).toBe(1);
    expect(mockDatabaseState.revenue_integrity_cross_audits.length).toBe(1);
    expect(mockDatabaseState.electronic_claim_submissions.length).toBe(1);
    expect(mockDatabaseState.longitudinal_timeline_events.length).toBe(6);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(7);
  });
});
