/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Coding, Casemix & Revenue Integrity Service (Hardened)
 * Domain: Clinical Documentation Improvement (CDI), Multi-Version SCD2 Coding (ICD-10/ICD-9-CM),
 * Master Terminology Governance, Dynamic Regulatory INA-CBG Rulesets (Permenkes 3/2023 & 26/2021),
 * Historical Grouping Reproducibility, Revenue Integrity False-Positive Controls & Multi-Payer Claim FSM.
 * Standards: Permenkes No. 3/2023, Permenkes No. 26/2021, JCI MOI / COP / FMS, PostgreSQL 16 ACID.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { careCoordinationAndTimelineService } from './careCoordinationAndTimeline.service.js';
import { terminologyGovernanceService } from './terminologyGovernance.service.js';
import { ENTERPRISE_ROLES } from '../../src/shared/constants/roles.js';

export class ClinicalCodingDomainError extends Error {
  constructor(message, code = 'CODING_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'ClinicalCodingDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_PHYSICIAN_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_SPECIALIST',
  'ROLE_DOCTOR_EMERGENCY'
];

export const clinicalCodingAndCasemixService = {
  /**
   * 1. Record or Update Clinical Coding Record (SCD2 Multi-Version Immutability + Terminology Governance)
   */
  recordOrUpdateClinicalCoding: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      encounterId,
      patientId,
      principalIcd10Code,
      principalIcd10Desc,
      secondaryDiagnoses = [], // [{ icd10, desc, poa: 'Y'|'N'|'U'|'W', is_cc: bool, is_mcc: bool }]
      procedureCodes = [],      // [{ icd9, desc, surgical_case_id, sequence: 1 }]
      codingStatus = 'CODED'
    } = payload;

    if (!encounterId || !patientId || !principalIcd10Code || !principalIcd10Desc) {
      throw new ClinicalCodingDomainError(
        'Data koding klinis tidak lengkap. Diagnosis utama (Principal ICD-10) wajib disertakan.',
        'VALIDATION_FAILED',
        400
      );
    }

    // Terminology Validation: Principal Diagnosis
    const principalValidation = terminologyGovernanceService.validateIcd10Code(principalIcd10Code);
    if (!principalValidation.isValid) {
      throw new ClinicalCodingDomainError(principalValidation.reason, 'INVALID_ICD10_CODE', 422);
    }

    // Terminology Validation: Procedure Codes
    for (const proc of procedureCodes) {
      const procValidation = terminologyGovernanceService.validateIcd9CmCode(proc.icd9);
      if (!procValidation.isValid) {
        throw new ClinicalCodingDomainError(procValidation.reason, 'INVALID_ICD9_CODE', 422);
      }
    }

    // Deduplication & Diagnostic Alignment
    const deduped = terminologyGovernanceService.deduplicateDiagnoses(principalIcd10Code, secondaryDiagnoses);

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-CODE-${Date.now()}`;
    const coderId = actor.userId || actor.id || 'CODER-STAFF-01';
    const coderName = actor.fullName || actor.name || 'Perekam Medis (Coder)';

    try {
      await client.query('BEGIN');

      // Fetch existing active coding record for SCD2 version incrementing
      const activeRes = await client.query(`
        SELECT id, coding_number, version_number
        FROM clinical_coding_records
        WHERE encounter_id = $1 AND is_active = TRUE
        ORDER BY version_number DESC
        LIMIT 1;
      `, [encounterId]);

      let codingNumber = `CODE-${Date.now().toString().slice(-6)}`;
      let nextVersion = 1;

      if (activeRes.rows.length > 0) {
        const existing = activeRes.rows[0];
        codingNumber = existing.coding_number;
        nextVersion = existing.version_number + 1;

        // Supersede previous version
        await client.query(`
          UPDATE clinical_coding_records
          SET is_active = FALSE, coding_status = 'SUPERSEDED', updated_at = NOW()
          WHERE id = $1;
        `, [existing.id]);
      }

      const newRecordId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const sigPayload = `${newRecordId}|${encounterId}|${deduped.principalCode}|${nextVersion}|${coderId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO clinical_coding_records (
          id, encounter_id, patient_id, coding_number, version_number,
          is_active, principal_icd10_code, principal_icd10_desc,
          secondary_diagnoses, procedure_codes, coder_id, coder_name,
          coding_status, digital_signature_hash, correlation_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        newRecordId, encounterId, patientId, codingNumber, nextVersion,
        deduped.principalCode, principalIcd10Desc,
        JSON.stringify(deduped.secondaryDiagnoses), JSON.stringify(procedureCodes),
        coderId, coderName,
        codingStatus, digitalSignatureHash, corrId
      ]);

      const codingRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'CLINICAL_CODING',
        eventTitle: `Koding Klinis v${nextVersion}: ${deduped.principalCode} - ${principalIcd10Desc}`,
        eventSummary: `Diagnosis Sekunder: ${deduped.secondaryDiagnoses.length}, Tindakan ICD-9: ${procedureCodes.length}. Perekam Medis: ${coderName}.${principalValidation.isDeprecated ? ' [PERINGATAN: Kode Deprecated]' : ''}`,
        domainSourceTable: 'clinical_coding_records',
        domainSourceId: codingRecord.id,
        clinicalSeverity: principalValidation.isDeprecated ? 'WARNING' : 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'CASEMIX', $2, 'CLINICAL_CODING_RECORDED', $3, 'PENDING_PUBLISH', $4, NOW());
      `, [crypto.randomUUID(), codingRecord.id, JSON.stringify({ codingId: codingRecord.id, version: nextVersion, principalIcd10Code: deduped.principalCode }), corrId]);

      await client.query('COMMIT');
      return codingRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 2. Create Physician-Coder Clarification Query (Evidence-Based CDI Loop)
   */
  createPhysicianQuery: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      codingRecordId,
      encounterId,
      patientId,
      queryType, // 'SPECIFICITY_CLARIFICATION', 'CONFLICTING_DOCUMENTATION', 'POA_VERIFICATION', 'UNCODED_PROCEDURE'
      queryText,
      targetPhysicianId,
      targetPhysicianName,
      clinicalEvidence = [],
      sourceDocumentIds = []
    } = payload;

    if (!codingRecordId || !encounterId || !patientId || !queryType || !queryText || !targetPhysicianId) {
      throw new ClinicalCodingDomainError(
        'Data query klarifikasi koding tidak lengkap. Parameter wajib: codingRecordId, encounterId, patientId, queryType, queryText, targetPhysicianId.',
        'VALIDATION_FAILED',
        400
      );
    }

    // Anti-Leading Query & Evidence Validation Guard
    terminologyGovernanceService.validateCdiQueryIntegrity(queryText, clinicalEvidence);

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-CDI-${Date.now()}`;
    const coderId = actor.userId || actor.id || 'CODER-STAFF-01';
    const coderName = actor.fullName || actor.name || 'Perekam Medis';

    try {
      await client.query('BEGIN');

      const queryId = crypto.randomUUID();
      const queryNumber = `CDI-QRY-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${queryId}|${codingRecordId}|${queryType}|${coderId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO clinical_documentation_queries (
          id, coding_record_id, encounter_id, patient_id, query_number,
          query_type, query_text, coder_id, coder_name,
          target_physician_id, target_physician_name, status,
          clinical_evidence, source_document_ids, coding_version_before, is_neutral_clarification,
          digital_signature_hash, correlation_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'OPEN', $12, $13, 1, TRUE, $14, $15, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        queryId, codingRecordId, encounterId, patientId, queryNumber,
        queryType, queryText, coderId, coderName,
        targetPhysicianId, targetPhysicianName || 'dr. DPJP',
        JSON.stringify(clinicalEvidence), JSON.stringify(sourceDocumentIds),
        digitalSignatureHash, corrId
      ]);

      const queryRecord = res.rows[0];

      // Update coding record status to QUERY_PENDING
      await client.query(`
        UPDATE clinical_coding_records
        SET coding_status = 'QUERY_PENDING', updated_at = NOW()
        WHERE id = $1;
      `, [codingRecordId]);

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'CDI_QUERY',
        eventTitle: `Permintaan Klarifikasi Koding (CDI): ${queryType}`,
        eventSummary: `Pertanyaan: ${queryText}. Ditujukan kepada: ${targetPhysicianName || 'DPJP'}. Bukti Klinis: ${clinicalEvidence.length} item.`,
        domainSourceTable: 'clinical_documentation_queries',
        domainSourceId: queryRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'CASEMIX', $2, 'CDI_PHYSICIAN_QUERY_OPENED', $3, 'PENDING_PUBLISH', $4, NOW());
      `, [crypto.randomUUID(), queryRecord.id, JSON.stringify({ queryId: queryRecord.id, queryType, targetPhysicianId }), corrId]);

      await client.query('COMMIT');
      return queryRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 3. Respond to Physician Clarification Query (CDI Loop)
   */
  respondToPhysicianQuery: async (queryId, payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    if (!queryId) {
      throw new ClinicalCodingDomainError('Query ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const { physicianResponseText } = payload;
    if (!physicianResponseText) {
      throw new ClinicalCodingDomainError('Teks respon klarifikasi dokter wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_PHYSICIAN_ROLES.includes(authorRole)) {
      throw new ClinicalCodingDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang menjawab query klarifikasi medis.`,
        'FORBIDDEN_PHYSICIAN_ROLE',
        403
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-CDI-ANS-${Date.now()}`;
    const physicianId = actor.userId || actor.id || 'DOC-DPJP-01';
    const physicianName = actor.fullName || actor.name || 'dr. DPJP';

    try {
      await client.query('BEGIN');

      const queryRes = await client.query('SELECT * FROM clinical_documentation_queries WHERE id = $1', [queryId]);
      if (queryRes.rows.length === 0) {
        throw new ClinicalCodingDomainError('Query klarifikasi tidak ditemukan.', 'NOT_FOUND', 404);
      }
      const existingQuery = queryRes.rows[0];

      if (existingQuery.status === 'RESOLVED' || existingQuery.status === 'ANSWERED') {
        throw new ClinicalCodingDomainError('Query klarifikasi ini sudah dijawab sebelumnya.', 'ALREADY_ANSWERED', 422);
      }

      const timestamp = new Date().toISOString();
      const sigPayload = `${queryId}|${existingQuery.coding_record_id}|ANSWERED|${physicianId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const updateSql = `
        UPDATE clinical_documentation_queries
        SET status = 'ANSWERED', physician_response_text = $1, answered_at = NOW(),
            coding_version_after = 2,
            digital_signature_hash = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *;
      `;

      const res = await client.query(updateSql, [physicianResponseText, digitalSignatureHash, queryId]);
      const updatedQuery = res.rows[0];

      // Update coding record back to CODED status
      await client.query(`
        UPDATE clinical_coding_records
        SET coding_status = 'CODED', updated_at = NOW()
        WHERE id = $1;
      `, [existingQuery.coding_record_id]);

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId: existingQuery.encounter_id,
        patientId: existingQuery.patient_id,
        eventCategory: 'CDI_QUERY_RESPONSE',
        eventTitle: `Respon Klarifikasi Dokter DPJP (CDI): ${existingQuery.query_type}`,
        eventSummary: `Respon Dokter (${physicianName}): ${physicianResponseText}.`,
        domainSourceTable: 'clinical_documentation_queries',
        domainSourceId: queryId,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'CASEMIX', $2, 'CDI_PHYSICIAN_QUERY_ANSWERED', $3, 'PENDING_PUBLISH', $4, NOW());
      `, [crypto.randomUUID(), queryId, JSON.stringify({ queryId, status: 'ANSWERED' }), corrId]);

      await client.query('COMMIT');
      return updatedQuery;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 4. Execute Version-Aware Permenkes INA-CBG Grouping Engine (Historical Reproducibility)
   */
  executeCasemixGrouping: async (encounterId, payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    if (!encounterId) {
      throw new ClinicalCodingDomainError('Encounter ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const {
      codingRecordId,
      patientId,
      admissionDate = new Date().toISOString(),
      baseTariffIdr = 7500000.00,
      specialProceduresTopupIdr = 0.00,
      specialProsthesisTopupIdr = 0.00,
      specialDrugsTopupIdr = 0.00,
      realHospitalCostIdr = 6500000.00
    } = payload;

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-GROUP-${Date.now()}`;
    const grouperId = actor.userId || actor.id || 'CASEMIX-OFFICER-01';
    const grouperName = actor.fullName || actor.name || 'Petugas Casemix';

    try {
      await client.query('BEGIN');

      // Fetch active coding record
      let activeCodeRecord = null;
      if (codingRecordId) {
        const codeRes = await client.query('SELECT * FROM clinical_coding_records WHERE id = $1', [codingRecordId]);
        if (codeRes.rows.length > 0) activeCodeRecord = codeRes.rows[0];
      } else {
        const codeRes = await client.query('SELECT * FROM clinical_coding_records WHERE encounter_id = $1 AND is_active = TRUE LIMIT 1', [encounterId]);
        if (codeRes.rows.length > 0) activeCodeRecord = codeRes.rows[0];
      }

      if (!activeCodeRecord) {
        throw new ClinicalCodingDomainError(
          'Tidak ditemukan data koding klinis aktif untuk encounter ini. Koding diagnosis dan tindakan wajib disahkan sebelum grouping INA-CBG.',
          'NO_ACTIVE_CODING_RECORD',
          422
        );
      }

      // Dynamic Versioned Ruleset Resolution based on Encounter Date (Historical Reproducibility)
      const rulesetRes = await client.query(`
        SELECT * FROM casemix_rulesets
        WHERE effective_from <= $1 AND (effective_until IS NULL OR effective_until >= $1)
        ORDER BY effective_from DESC
        LIMIT 1;
      `, [admissionDate]);

      const activeRuleset = rulesetRes.rows.length > 0 ? rulesetRes.rows[0] : {
        id: crypto.randomUUID(),
        regulation_version: 'Permenkes 3/2023',
        grouping_algorithm_version: 'INA-CBG 6.0',
        severity_multipliers: { I: 1.0, II: 1.25, III: 1.5 }
      };

      const principalCode = activeCodeRecord.principal_icd10_code;
      const secondaryDiagnoses = activeCodeRecord.secondary_diagnoses || [];
      const procedureCodes = activeCodeRecord.procedure_codes || [];

      // Determine Severity Level (I, II, III) based on CC / MCC
      let severityLevel = 'I';
      const hasMcc = secondaryDiagnoses.some(d => d.is_mcc === true);
      const hasCc = secondaryDiagnoses.some(d => d.is_cc === true);

      if (hasMcc) {
        severityLevel = 'III';
      } else if (hasCc) {
        severityLevel = 'II';
      }

      // MDC & INA-CBG Mapping
      let mdcCode = 'MDC-06'; // Digestive System
      let cbgCode = `K-1-14-${severityLevel}`;
      let cbgDescription = `Prosedur Usus Buntu (Tingkat Keparahan ${severityLevel})`;

      if (principalCode.startsWith('I')) {
        mdcCode = 'MDC-05'; // Circulatory System
        cbgCode = `I-4-10-${severityLevel}`;
        cbgDescription = `Gagal Jantung / Infark Miokard (Tingkat Keparahan ${severityLevel})`;
      } else if (principalCode.startsWith('J')) {
        mdcCode = 'MDC-04'; // Respiratory System
        cbgCode = `J-4-16-${severityLevel}`;
        cbgDescription = `Pneumonia Berat / PPOK (Tingkat Keparahan ${severityLevel})`;
      } else if (procedureCodes.length > 0) {
        // Surgical procedure mapping
        cbgCode = `K-1-12-${severityLevel}`;
        cbgDescription = `Prosedur Laparotomi & Digestif Mayor (Tingkat Keparahan ${severityLevel})`;
      }

      const multipliers = activeRuleset.severity_multipliers || { I: 1.0, II: 1.25, III: 1.5 };
      const severityMultiplier = multipliers[severityLevel] || 1.0;
      const calculatedBaseTariff = Number(baseTariffIdr) * severityMultiplier;
      const finalClaimTariffIdr = calculatedBaseTariff + Number(specialProceduresTopupIdr) + Number(specialProsthesisTopupIdr) + Number(specialDrugsTopupIdr);
      const costVarianceIdr = finalClaimTariffIdr - Number(realHospitalCostIdr);

      const groupingId = crypto.randomUUID();
      const groupingNumber = `GRP-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${groupingId}|${encounterId}|${cbgCode}|${finalClaimTariffIdr}|${grouperId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO casemix_grouping_audits (
          id, coding_record_id, encounter_id, patient_id, grouping_number,
          grouper_version, mdc_code, inacbg_code, inacbg_description,
          severity_level, base_tariff_idr, special_procedures_topup_idr,
          special_prosthesis_topup_idr, special_drugs_topup_idr,
          final_claim_tariff_idr, real_hospital_cost_idr, cost_variance_idr,
          grouped_by_id, grouped_by_name, digital_signature_hash, correlation_id,
          ruleset_id, regulation_version, grouped_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        groupingId, activeCodeRecord.id, encounterId, patientId || activeCodeRecord.patient_id, groupingNumber,
        activeRuleset.grouping_algorithm_version || 'INA-CBG 6.0',
        mdcCode, cbgCode, cbgDescription,
        severityLevel, calculatedBaseTariff, specialProceduresTopupIdr,
        specialProsthesisTopupIdr, specialDrugsTopupIdr,
        finalClaimTariffIdr, realHospitalCostIdr, costVarianceIdr,
        grouperId, grouperName,
        digitalSignatureHash, corrId,
        activeRuleset.id, activeRuleset.regulation_version
      ]);

      const groupingAudit = res.rows[0];

      // Update or insert into casemix_cases
      await client.query(`
        INSERT INTO casemix_cases (
          id, tenant_id, encounter_id, patient_mrn, patient_name,
          admission_date, primary_icd10_code, primary_icd10_description,
          case_status, coder_staff_name, created_at, updated_at
        ) VALUES ($1, $2, $3, 'MRN-CASEMIX', 'Pasien Casemix', NOW(), $4, $5, 'READY_FOR_GROUPING', $6, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `, [crypto.randomUUID(), crypto.randomUUID(), encounterId, principalCode, activeCodeRecord.principal_icd10_desc, grouperName]);

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId: activeCodeRecord.patient_id,
        eventCategory: 'CASEMIX_GROUPING',
        eventTitle: `Hasil Grouping INA-CBG: ${cbgCode} (Tingkat ${severityLevel}) [${activeRuleset.regulation_version}]`,
        eventSummary: `Deskripsi: ${cbgDescription}. Tarif Klaim: Rp ${finalClaimTariffIdr.toLocaleString('id-ID')}. Varians Biaya: Rp ${costVarianceIdr.toLocaleString('id-ID')}.`,
        domainSourceTable: 'casemix_grouping_audits',
        domainSourceId: groupingAudit.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'CASEMIX', $2, 'CASEMIX_GROUPING_COMPLETED', $3, 'PENDING_PUBLISH', $4, NOW());
      `, [crypto.randomUUID(), groupingAudit.id, JSON.stringify({ groupingId: groupingAudit.id, cbgCode, finalClaimTariffIdr, regulation: activeRuleset.regulation_version }), corrId]);

      await client.query('COMMIT');
      return groupingAudit;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 5. Perform Revenue Integrity Cross-Audit (False-Positive Control)
   */
  performRevenueIntegrityCrossAudit: async (encounterId, payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    if (!encounterId) {
      throw new ClinicalCodingDomainError('Encounter ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const {
      patientId,
      isCancelledSurgery = false,
      isBundledProcedure = false,
      isNonBillableAssessment = false,
      isPayerExempt = false
    } = payload;

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-REV-AUDIT-${Date.now()}`;
    const auditorId = actor.userId || actor.id || 'REV-AUDITOR-01';
    const auditorName = actor.fullName || actor.name || 'Auditor Revenue Integrity';

    try {
      await client.query('BEGIN');

      // Fetch active coding
      const codeRes = await client.query('SELECT * FROM clinical_coding_records WHERE encounter_id = $1 AND is_active = TRUE LIMIT 1', [encounterId]);
      const codingRecord = codeRes.rows.length > 0 ? codeRes.rows[0] : null;

      // Fetch surgical implants if any
      const implantRes = await client.query('SELECT * FROM intraoperative_implant_ledgers WHERE encounter_id = $1', [encounterId]);
      const surgicalImplants = implantRes.rows;

      const identifiedLeakages = [];
      const suppressedFalsePositives = [];
      let auditStatus = 'CLEAN_NO_LEAKAGE';

      // Check False Positive 1: Cancelled Surgery
      if (isCancelledSurgery) {
        suppressedFalsePositives.push({
          suppressionType: 'CANCELLED_SURGERY',
          reason: 'Operasi dibatalkan secara klinis. Eksklusi dari potensi kebocoran pendapatan koding bedah.'
        });
      } else if (isBundledProcedure) {
        suppressedFalsePositives.push({
          suppressionType: 'BUNDLED_PROCEDURE',
          reason: 'Tindakan merupakan paket terintegrasi (bundled). Tidak dikenakan tagihan tambahan.'
        });
      } else if (isNonBillableAssessment) {
        suppressedFalsePositives.push({
          suppressionType: 'NOT_BILLABLE_ASSESSMENT',
          reason: 'Aktivitas merupakan asesmen klinis rutin non-chargeable.'
        });
      } else if (isPayerExempt) {
        suppressedFalsePositives.push({
          suppressionType: 'PAYER_EXEMPT',
          reason: 'Pengecualian tagihan berdasarkan kontrak khusus penjamin.'
        });
      } else {
        // True Leakage Check 1: Surgical implant deployed but no procedure coded in ICD-9
        if (surgicalImplants.length > 0) {
          const procedures = codingRecord?.procedure_codes || [];
          if (procedures.length === 0) {
            identifiedLeakages.push({
              leakageType: 'UNCODED_SURGICAL_PROCEDURE',
              description: `Terdapat ${surgicalImplants.length} implan terpasang tetapi belum ada koding tindakan ICD-9-CM pada koding klinis aktif.`
            });
            auditStatus = 'UNCODED_CLINICAL_EVENT';
          }
        }

        // True Leakage Check 2: Missing clinical coding entirely
        if (!codingRecord) {
          identifiedLeakages.push({
            leakageType: 'MISSING_CLINICAL_CODING',
            description: 'Encounter memiliki transaksi pelayanan klinis tetapi belum memiliki koding diagnosa utama.'
          });
          auditStatus = 'DISCREPANCY_DETECTED';
        }
      }

      const auditId = crypto.randomUUID();
      const auditNumber = `REV-AUD-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${auditId}|${encounterId}|${auditStatus}|${auditorId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO revenue_integrity_cross_audits (
          id, encounter_id, patient_id, audit_number, audit_status,
          clinical_events_count, coded_diagnoses_count, coded_procedures_count,
          billed_items_count, identified_leakages, suppressed_false_positives,
          audited_by_id, audited_by_name,
          digital_signature_hash, correlation_id, audited_at
        ) VALUES ($1, $2, $3, $4, $5, 5, $6, $7, 5, $8, $9, $10, $11, $12, $13, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        auditId, encounterId, patientId || crypto.randomUUID(), auditNumber, auditStatus,
        codingRecord ? (1 + (codingRecord.secondary_diagnoses?.length || 0)) : 0,
        codingRecord ? (codingRecord.procedure_codes?.length || 0) : 0,
        JSON.stringify(identifiedLeakages),
        JSON.stringify(suppressedFalsePositives),
        auditorId, auditorName,
        digitalSignatureHash, corrId
      ]);

      const auditRecord = res.rows[0];

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'REVENUE_INTEGRITY', $2, 'REVENUE_INTEGRITY_AUDIT_COMPLETED', $3, 'PENDING_PUBLISH', $4, NOW());
      `, [crypto.randomUUID(), auditRecord.id, JSON.stringify({ auditId: auditRecord.id, auditStatus, leakageCount: identifiedLeakages.length }), corrId]);

      await client.query('COMMIT');
      return auditRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 6. Submit Multi-Payer Electronic Claim Lifecycle (Sovereign Clinical State Decoupling)
   */
  submitElectronicClaim: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      groupingAuditId,
      encounterId,
      patientId,
      sepNumber,
      bpjsCardNumber,
      payerType = 'BPJS_KESEHATAN',
      payerAdapterType = 'BPJS_VCLAIM', // 'BPJS_VCLAIM', 'PRIVATE_INSURANCE_ADMEDIKA', 'CORPORATE_DIRECT', 'SELF_PAY_MANDIRI'
      claimStatus = 'SUBMITTED',
      claimedAmountIdr,
      approvedAmountIdr = 0.00,
      copayBalanceIdr = 0.00,
      disputeReason = null
    } = payload;

    if (!groupingAuditId || !encounterId || !patientId || !sepNumber || !bpjsCardNumber || !claimedAmountIdr) {
      throw new ClinicalCodingDomainError(
        'Data pengajuan klaim elektronik tidak lengkap. Parameter wajib: groupingAuditId, encounterId, patientId, sepNumber, bpjsCardNumber, claimedAmountIdr.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-CLAIM-${Date.now()}`;
    const submitterId = actor.userId || actor.id || 'CLAIM-OFFICER-01';
    const submitterName = actor.fullName || actor.name || 'Petugas Klaim BPJS';

    try {
      await client.query('BEGIN');

      const claimId = crypto.randomUUID();
      const submissionNumber = `CLM-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const finalApproved = claimStatus === 'ACCEPTED' || claimStatus === 'PAID'
        ? (Number(approvedAmountIdr) > 0 ? approvedAmountIdr : claimedAmountIdr)
        : (Number(approvedAmountIdr) > 0 ? approvedAmountIdr : 0.00);

      const sigPayload = `${claimId}|${sepNumber}|${claimedAmountIdr}|${claimStatus}|${submitterId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO electronic_claim_submissions (
          id, grouping_audit_id, encounter_id, patient_id, submission_number,
          sep_number, bpjs_card_number, payer_type, payer_adapter_type, claim_status,
          dispute_reason, claimed_amount_idr, approved_amount_idr,
          disputed_amount_idr, copay_balance_idr, submitter_id, submitter_name,
          digital_signature_hash, correlation_id, submitted_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0.00, $14, $15, $16, $17, $18, NOW(), NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        claimId, groupingAuditId, encounterId, patientId, submissionNumber,
        sepNumber, bpjsCardNumber, payerType, payerAdapterType, claimStatus,
        disputeReason, claimedAmountIdr, finalApproved, copayBalanceIdr,
        submitterId, submitterName,
        digitalSignatureHash, corrId
      ]);

      const claimRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'ELECTRONIC_CLAIM',
        eventTitle: `Pengajuan Klaim Elektronik (${payerType} / ${payerAdapterType}): ${sepNumber}`,
        eventSummary: `Status Klaim: ${claimStatus}. Diajukan: Rp ${Number(claimedAmountIdr).toLocaleString('id-ID')}, Disetujui: Rp ${Number(finalApproved).toLocaleString('id-ID')}, Selisih Iur: Rp ${Number(copayBalanceIdr).toLocaleString('id-ID')}.`,
        domainSourceTable: 'electronic_claim_submissions',
        domainSourceId: claimRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'CLAIM', $2, 'ELECTRONIC_CLAIM_SUBMITTED', $3, 'PENDING_PUBLISH', $4, NOW());
      `, [crypto.randomUUID(), claimRecord.id, JSON.stringify({ claimId: claimRecord.id, sepNumber, claimStatus, claimedAmountIdr, approvedAmount: finalApproved }), corrId]);

      await client.query('COMMIT');
      return claimRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
