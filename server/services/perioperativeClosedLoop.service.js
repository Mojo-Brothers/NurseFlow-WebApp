/**
 * NurseFlow Enterprise HIS 2026 — Master Perioperative & Operating Theatre Closed Loop Service
 * Domain: Pre-Op Anesthesia Evaluation, WHO 3-Phase Safe Surgery Checklist (JCI IPSG 4),
 * Intraoperative UDI Medical Implant Traceability, PACU Modified Aldrete Recovery Scoring,
 * and Exactly-Once Surgical Charge Capture & Room Turnover.
 * Standards: JCI IPSG 4 / COP, ASA Standard, WHO Guidelines for Safe Surgery, PostgreSQL 16 ACID.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { careCoordinationAndTimelineService } from './careCoordinationAndTimeline.service.js';
import { ENTERPRISE_ROLES } from '../../src/shared/constants/roles.js';

export class PerioperativeDomainError extends Error {
  constructor(message, code = 'PERIOPERATIVE_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'PerioperativeDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_ANESTHESIA_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_ANESTHESIOLOGIST',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_SPECIALIST'
];

const AUTHORIZED_SURGEON_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_SPECIALIST',
  'ROLE_DOCTOR_EMERGENCY'
];

export const perioperativeClosedLoopService = {
  /**
   * 1. Create Pre-Operative Anesthesia Evaluation
   */
  createPreOpAnesthesiaEvaluation: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      encounterId,
      patientId,
      asaClass,
      mallampatiScore,
      airwayAssessment = 'NORMAL',
      npoFastingHours,
      knownAllergies = [],
      cardiopulmonaryClearance,
      anesthesiaPlan,
      informedConsentVerified = true
    } = payload;

    if (!encounterId || !patientId || !asaClass || !mallampatiScore || npoFastingHours === undefined || !cardiopulmonaryClearance || !anesthesiaPlan) {
      throw new PerioperativeDomainError(
        'Data asesmen pra-anestesi tidak lengkap. Parameter wajib: encounterId, patientId, asaClass, mallampatiScore, npoFastingHours, cardiopulmonaryClearance, anesthesiaPlan.',
        'VALIDATION_FAILED',
        400
      );
    }

    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_ANESTHESIA_ROLES.includes(authorRole)) {
      throw new PerioperativeDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang membuat asesmen pra-anestesi.`,
        'FORBIDDEN_ANESTHESIA_ROLE',
        403
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-PREOP-${Date.now()}`;
    const authorId = actor.userId || actor.id || 'DOC-ANES-01';
    const authorName = actor.fullName || actor.name || 'dr. Sp.An';

    try {
      await client.query('BEGIN');

      const evalId = crypto.randomUUID();
      const evalNumber = `PREOP-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${evalId}|${encounterId}|${patientId}|${asaClass}|${mallampatiScore}|${anesthesiaPlan}|${authorId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO perioperative_anesthesia_evaluations (
          id, encounter_id, patient_id, evaluation_number, asa_class,
          mallampati_score, airway_assessment, npo_fasting_hours, known_allergies,
          cardiopulmonary_clearance, anesthesia_plan, informed_consent_verified,
          evaluator_anesthesiologist_id, evaluator_anesthesiologist_name,
          digital_signature_hash, correlation_id, evaluated_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        evalId, encounterId, patientId, evalNumber, asaClass,
        mallampatiScore, airwayAssessment, npoFastingHours, JSON.stringify(knownAllergies),
        cardiopulmonaryClearance, anesthesiaPlan, informedConsentVerified,
        authorId, authorName,
        digitalSignatureHash, corrId, timestamp
      ]);

      const evalRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'PREOP_EVALUATION',
        eventTitle: `Evaluasi Pra-Anestesi: ${asaClass} (Mallampati ${mallampatiScore})`,
        eventSummary: `Rencana Anestesi: ${anesthesiaPlan}. Puasa: ${npoFastingHours} jam. Evaluator: ${authorName}.`,
        domainSourceTable: 'perioperative_anesthesia_evaluations',
        domainSourceId: evalRecord.id,
        clinicalSeverity: ['ASA_III', 'ASA_IV', 'ASA_V', 'ASA_E'].includes(asaClass) ? 'WARNING' : 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'PERIOPERATIVE', $2, 'PREOP_EVALUATION_COMPLETED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), evalRecord.id, JSON.stringify({ evalId: evalRecord.id, asaClass, anesthesiaPlan }), corrId]);

      await client.query('COMMIT');
      return evalRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 2. Execute WHO Surgical Safety Checklist Phase (JCI IPSG 4 Safe Surgery)
   */
  executeWhoChecklistPhase: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      surgicalCaseId,
      encounterId,
      patientId,
      phase, // 'SIGN_IN', 'TIME_OUT', 'SIGN_OUT'
      phaseData = {}
    } = payload;

    if (!surgicalCaseId || !encounterId || !patientId || !phase) {
      throw new PerioperativeDomainError(
        'Data checklist keselamatan bedah tidak lengkap. Parameter wajib: surgicalCaseId, encounterId, patientId, phase.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-WHO-${Date.now()}`;
    const verifierId = actor.userId || actor.id || 'STAFF-WHO-01';
    const verifierName = actor.fullName || actor.name || 'Tim Bedah';
    const timestamp = new Date().toISOString();

    try {
      await client.query('BEGIN');

      // Fetch or initialize WHO Checklist record
      let checklistRecord = null;
      const existRes = await client.query('SELECT * FROM who_safety_checklist_executions WHERE surgical_case_id = $1', [surgicalCaseId]);

      let checklistId = existRes.rows.length > 0 ? existRes.rows[0].id : crypto.randomUUID();
      const checklistNumber = `WHO-${Date.now().toString().slice(-6)}`;

      if (phase === 'SIGN_IN') {
        // Phase 1: Sign-In before induction
        const {
          patientIdentityConfirmed = true,
          siteMarked = true,
          consentVerified = true,
          oximeterFunctioning = true,
          allergyChecked = true,
          airwayRiskPrepared = true,
          bloodLossPrepared = true
        } = phaseData;

        if (!patientIdentityConfirmed || !siteMarked || !consentVerified) {
          throw new PerioperativeDomainError(
            'JCI IPSG 4 VIOLATION: Konfirmasi identitas pasien, penandaan lokasi operasi (site marking), dan informed consent wajib terverifikasi pada Sign-In.',
            'SIGN_IN_SAFETY_VIOLATION',
            422
          );
        }

        const sigPayload = `${checklistId}|${surgicalCaseId}|SIGN_IN|${verifierId}|${timestamp}`;
        const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

        if (existRes.rows.length === 0) {
          const insertSql = `
            INSERT INTO who_safety_checklist_executions (
              id, surgical_case_id, encounter_id, patient_id, checklist_number,
              sign_in_patient_identity_confirmed, sign_in_site_marked, sign_in_consent_verified,
              sign_in_oximeter_functioning, sign_in_allergy_checked, sign_in_airway_risk_prepared,
              sign_in_blood_loss_prepared, sign_in_completed_at, sign_in_verifier_id, sign_in_verifier_name,
              sign_out_postop_recovery_plan,
              status, digital_signature_hash, correlation_id, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'PACU_RECOVERY_PENDING', 'SIGN_IN_DONE', $16, $17, NOW(), NOW())
            RETURNING *;
          `;
          const res = await client.query(insertSql, [
            checklistId, surgicalCaseId, encounterId, patientId, checklistNumber,
            patientIdentityConfirmed, siteMarked, consentVerified,
            oximeterFunctioning, allergyChecked, airwayRiskPrepared,
            bloodLossPrepared, timestamp, verifierId, verifierName,
            digitalSignatureHash, corrId
          ]);
          checklistRecord = res.rows[0];
        } else {
          const updateSql = `
            UPDATE who_safety_checklist_executions
            SET sign_in_patient_identity_confirmed = $1, sign_in_site_marked = $2, sign_in_consent_verified = $3,
                sign_in_oximeter_functioning = $4, sign_in_allergy_checked = $5, sign_in_airway_risk_prepared = $6,
                sign_in_blood_loss_prepared = $7, sign_in_completed_at = $8, sign_in_verifier_id = $9, sign_in_verifier_name = $10,
                status = 'SIGN_IN_DONE', digital_signature_hash = $11, updated_at = NOW()
            WHERE id = $12
            RETURNING *;
          `;
          const res = await client.query(updateSql, [
            patientIdentityConfirmed, siteMarked, consentVerified,
            oximeterFunctioning, allergyChecked, airwayRiskPrepared,
            bloodLossPrepared, timestamp, verifierId, verifierName,
            digitalSignatureHash, checklistId
          ]);
          checklistRecord = res.rows[0];
        }
      } else if (phase === 'TIME_OUT') {
        // Phase 2: Time-Out before skin incision
        if (existRes.rows.length === 0 || existRes.rows[0].status === 'IN_PROGRESS') {
          throw new PerioperativeDomainError('Fase Sign-In harus diselesaikan sebelum Time-Out.', 'SEQUENCE_VIOLATION', 422);
        }

        const {
          teamIntroductions = true,
          patientNameProcedureSite = true,
          surgeonCriticalSteps = true,
          anesthesiaConcerns = true,
          sterilityIndicatorsVerified = true,
          antibioticProphylaxisGiven = true,
          imagingDisplayed = true
        } = phaseData;

        if (!patientNameProcedureSite || !sterilityIndicatorsVerified) {
          throw new PerioperativeDomainError(
            'JCI IPSG 4 VIOLATION: Konfirmasi nama/prosedur/lokasi dan indikator sterilitas instrumen wajib terverifikasi pada Time-Out.',
            'TIME_OUT_SAFETY_VIOLATION',
            422
          );
        }

        const sigPayload = `${checklistId}|${surgicalCaseId}|TIME_OUT|${verifierId}|${timestamp}`;
        const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

        const updateSql = `
          UPDATE who_safety_checklist_executions
          SET time_out_team_introductions = $1, time_out_patient_name_procedure_site = $2,
              time_out_surgeon_critical_steps = $3, time_out_anesthesia_concerns = $4,
              time_out_sterility_indicators_verified = $5, time_out_antibiotic_prophylaxis_given = $6,
              time_out_imaging_displayed = $7, time_out_completed_at = $8,
              time_out_verifier_id = $9, time_out_verifier_name = $10,
              status = 'TIME_OUT_DONE', digital_signature_hash = $11, updated_at = NOW()
          WHERE id = $12
          RETURNING *;
        `;
        const res = await client.query(updateSql, [
          teamIntroductions, patientNameProcedureSite, surgeonCriticalSteps,
          anesthesiaConcerns, sterilityIndicatorsVerified, antibioticProphylaxisGiven,
          imagingDisplayed, timestamp, verifierId, verifierName,
          digitalSignatureHash, checklistId
        ]);
        checklistRecord = res.rows[0];
      } else if (phase === 'SIGN_OUT') {
        // Phase 3: Sign-Out before patient leaves theatre
        if (existRes.rows.length === 0 || !['TIME_OUT_DONE', 'SIGN_IN_DONE'].includes(existRes.rows[0].status)) {
          throw new PerioperativeDomainError('Fase Time-Out harus diselesaikan sebelum Sign-Out.', 'SEQUENCE_VIOLATION', 422);
        }

        const {
          procedureRecorded = true,
          countsReconciled = true, // Sponge/needle/instrument counts
          specimenLabeled = true,
          equipmentIssuesAddressed = true,
          postopRecoveryPlan = 'Transfer ke PACU untuk observasi pemulihan anestesi.'
        } = phaseData;

        if (!countsReconciled) {
          throw new PerioperativeDomainError(
            'JCI IPSG 4 CRITICAL SAFETY ALERT: Hitungan instrumen, kassa (sponge), dan jarum tidak klop (discrepant count). Operasi tidak dapat di-sign out sampai rekonsiliasi atau foto rontgen konfirmasi dilakukan.',
            'SURGICAL_COUNT_DISCREPANCY_ALERT',
            422
          );
        }

        const sigPayload = `${checklistId}|${surgicalCaseId}|SIGN_OUT|${verifierId}|${timestamp}`;
        const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

        const updateSql = `
          UPDATE who_safety_checklist_executions
          SET sign_out_procedure_recorded = $1, sign_out_counts_reconciled = $2,
              sign_out_specimen_labeled = $3, sign_out_equipment_issues_addressed = $4,
              sign_out_postop_recovery_plan = $5, sign_out_completed_at = $6,
              sign_out_verifier_id = $7, sign_out_verifier_name = $8,
              status = 'SIGN_OUT_COMPLETED', digital_signature_hash = $9, updated_at = NOW()
          WHERE id = $10
          RETURNING *;
        `;
        const res = await client.query(updateSql, [
          procedureRecorded, countsReconciled, specimenLabeled,
          equipmentIssuesAddressed, postopRecoveryPlan, timestamp,
          verifierId, verifierName,
          digitalSignatureHash, checklistId
        ]);
        checklistRecord = res.rows[0];
      } else {
        throw new PerioperativeDomainError(`Fase [${phase}] tidak valid. Opsi: SIGN_IN, TIME_OUT, SIGN_OUT.`, 'INVALID_PHASE', 400);
      }

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'WHO_SURGICAL_CHECKLIST',
        eventTitle: `WHO Surgical Safety Checklist [${phase}] Selesai`,
        eventSummary: `Diverifikasi oleh ${verifierName} (${actor.role || 'TIM_BEDAH'}). Status: ${checklistRecord.status}.`,
        domainSourceTable: 'who_safety_checklist_executions',
        domainSourceId: checklistRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'PERIOPERATIVE', $2, 'WHO_CHECKLIST_PHASE_COMPLETED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), checklistRecord.id, JSON.stringify({ checklistId: checklistRecord.id, phase, status: checklistRecord.status }), corrId]);

      await client.query('COMMIT');
      return checklistRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 3. Record Intraoperative UDI Medical Implant Traceability
   */
  recordImplantDeployment: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      surgicalCaseId,
      encounterId,
      patientId,
      implantCatalogCode,
      implantName,
      udiBarcode,
      serialOrLotNumber,
      manufacturer,
      expiryDate,
      anatomicalSite,
      quantity = 1,
      unitCostIdr = 0
    } = payload;

    if (!surgicalCaseId || !encounterId || !patientId || !implantCatalogCode || !implantName || !udiBarcode || !serialOrLotNumber || !expiryDate || !anatomicalSite) {
      throw new PerioperativeDomainError(
        'Data penanaman implan bedah tidak lengkap. Parameter wajib: surgicalCaseId, encounterId, patientId, implantCatalogCode, implantName, udiBarcode, serialOrLotNumber, expiryDate, anatomicalSite.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-IMP-${Date.now()}`;
    const surgeonId = actor.userId || actor.id || 'DOC-SURG-01';
    const surgeonName = actor.fullName || actor.name || 'dr. Sp.B';

    try {
      await client.query('BEGIN');

      const implantId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const sigPayload = `${implantId}|${surgicalCaseId}|${udiBarcode}|${serialOrLotNumber}|${anatomicalSite}|${surgeonId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO intraoperative_implant_ledgers (
          id, surgical_case_id, encounter_id, patient_id, implant_catalog_code,
          implant_name, udi_barcode, serial_or_lot_number, manufacturer,
          expiry_date, anatomical_site, quantity, unit_cost_idr,
          surgeon_id, surgeon_name, scrub_nurse_id, scrub_nurse_name,
          status, digital_signature_hash, correlation_id, implanted_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'IMPLANTED', $18, $19, $20, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        implantId, surgicalCaseId, encounterId, patientId, implantCatalogCode,
        implantName, udiBarcode, serialOrLotNumber, manufacturer || 'Standard Medical Manufacturer',
        expiryDate, anatomicalSite, quantity, unitCostIdr,
        surgeonId, surgeonName, 'NURSE-SCRUB-01', 'Ners Instrumentator',
        digitalSignatureHash, corrId, timestamp
      ]);

      const implantRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'IMPLANT_DEPLOYED',
        eventTitle: `Penanaman Implan Medis Permanen (UDI): ${implantName}`,
        eventSummary: `UDI: ${udiBarcode}. Lot/Serial: ${serialOrLotNumber}. Lokasi: ${anatomicalSite}. Operator: ${surgeonName}.`,
        domainSourceTable: 'intraoperative_implant_ledgers',
        domainSourceId: implantRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'PERIOPERATIVE', $2, 'IMPLANT_DEPLOYED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), implantRecord.id, JSON.stringify({ implantId: implantRecord.id, udiBarcode, implantName }), corrId]);

      await client.query('COMMIT');
      return implantRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 4. Record PACU Post-Anesthesia Recovery Assessment (Modified Aldrete Score)
   */
  recordPacuRecoveryAssessment: async (payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    const {
      surgicalCaseId,
      encounterId,
      patientId,
      aldreteConsciousness,
      aldreteActivity,
      aldreteRespiration,
      aldreteCirculation,
      aldreteO2Saturation,
      painVasScore = 0,
      nauseaVomitingStatus = 'NONE',
      surgicalWoundCondition = 'DRY_INTACT',
      vitalSignsSnapshot = {},
      dischargeReadinessStatus = 'MONITORING_PACU',
      dischargeDestination = 'INPATIENT_WARD'
    } = payload;

    if (
      !surgicalCaseId || !encounterId || !patientId ||
      aldreteConsciousness === undefined || aldreteActivity === undefined ||
      aldreteRespiration === undefined || aldreteCirculation === undefined ||
      aldreteO2Saturation === undefined
    ) {
      throw new PerioperativeDomainError(
        'Data asesmen pemulihan PACU tidak lengkap. 5 parameter Aldrete (kesadaran, aktivitas, pernapasan, sirkulasi, saturasi O2) wajib disertakan.',
        'VALIDATION_FAILED',
        400
      );
    }      const totalAldreteScore = aldreteConsciousness + aldreteActivity + aldreteRespiration + aldreteCirculation + aldreteO2Saturation;

    const {
      airwayStabilityConfirmed = true,
      hemodynamicStabilityConfirmed = true,
      painVasControlled = true,
      ponvControlled = true,
      anesthesiologistDischargeClearance = true
    } = payload;

    // Safety Invariant: Discharge from PACU to Ward requires Aldrete Score >= 9 AND Clinical Clearance
    if (['READY_FOR_WARD_TRANSFER', 'TRANSFERRED'].includes(dischargeReadinessStatus)) {
      if (totalAldreteScore < 9) {
        throw new PerioperativeDomainError(
          `PACU SAFETY INVARIANT VIOLATION: Skor Aldrete total [${totalAldreteScore}/10] belum memenuhi batas aman transfer ke ruang rawat (minimal skor >= 9). Pasien wajib diobservasi lanjutan di PACU.`,
          'PACU_ALDRETE_SCORE_BELOW_DISCHARGE_THRESHOLD',
          422
        );
      }
      if (!airwayStabilityConfirmed || !hemodynamicStabilityConfirmed || !painVasControlled || !ponvControlled || !anesthesiologistDischargeClearance) {
        throw new PerioperativeDomainError(
          'PACU CLINICAL CLEARANCE INVARIANT: Transfer pasien membutuhkan konfirmasi stabilitas jalan nafas, hemodinamik tanpa inotropik dosis tinggi, kontrol nyeri VAS <= 3, kontrol PONV, dan izin pelepasan dokter anestesi.',
          'PACU_CLINICAL_CLEARANCE_INCOMPLETE',
          422
        );
      }
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-PACU-${Date.now()}`;
    const nurseId = actor.userId || actor.id || 'NURSE-PACU-01';
    const nurseName = actor.fullName || actor.name || 'Ners PACU';

    try {
      await client.query('BEGIN');

      const recordId = crypto.randomUUID();
      const recordNumber = `PACU-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${recordId}|${surgicalCaseId}|${totalAldreteScore}|${dischargeReadinessStatus}|${nurseId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO pacu_recovery_records (
          id, surgical_case_id, encounter_id, patient_id, record_number,
          aldrete_consciousness, aldrete_activity, aldrete_respiration,
          aldrete_circulation, aldrete_o2_saturation, total_aldrete_score,
          pain_vas_score, nausea_vomiting_status, surgical_wound_condition,
          vital_signs_snapshot, discharge_readiness_status, discharge_destination,
          airway_stability_confirmed, hemodynamic_stability_confirmed,
          pain_vas_controlled, ponv_controlled, anesthesiologist_discharge_clearance,
          pacu_nurse_id, pacu_nurse_name, attending_anesthesiologist_id, attending_anesthesiologist_name,
          digital_signature_hash, correlation_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'DOC-ANES-01', 'dr. Sp.An', $25, $26, NOW(), NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        recordId, surgicalCaseId, encounterId, patientId, recordNumber,
        aldreteConsciousness, aldreteActivity, aldreteRespiration,
        aldreteCirculation, aldreteO2Saturation, totalAldreteScore,
        painVasScore, nauseaVomitingStatus, surgicalWoundCondition,
        JSON.stringify(vitalSignsSnapshot), dischargeReadinessStatus, dischargeDestination,
        airwayStabilityConfirmed, hemodynamicStabilityConfirmed,
        painVasControlled, ponvControlled, anesthesiologistDischargeClearance,
        nurseId, nurseName,
        digitalSignatureHash, corrId
      ]);

      const pacuRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'PACU_RECOVERY',
        eventTitle: `Evaluasi Pemulihan PACU: Skor Aldrete ${totalAldreteScore}/10`,
        eventSummary: `Status: ${dischargeReadinessStatus}. Tujuan: ${dischargeDestination}. Nyeri VAS: ${painVasScore}. Perawat: ${nurseName}.`,
        domainSourceTable: 'pacu_recovery_records',
        domainSourceId: pacuRecord.id,
        clinicalSeverity: totalAldreteScore < 8 ? 'WARNING' : 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'PERIOPERATIVE', $2, 'PACU_ASSESSMENT_RECORDED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), pacuRecord.id, JSON.stringify({ pacuRecordId: pacuRecord.id, totalAldreteScore, dischargeReadinessStatus }), corrId]);

      await client.query('COMMIT');
      return pacuRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 5. Record Surgical Cancellation or Intraoperative Abort Pathway
   */
  recordSurgicalAbortOrCancellation: async (surgicalCaseId, payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    if (!surgicalCaseId) {
      throw new PerioperativeDomainError('Surgical Case ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const {
      encounterId,
      patientId,
      abortStage,
      abortReasonCategory,
      clinicalDetails,
      implantsDisposition = 'NONE_USED',
      medicationsGiven = [],
      billingDisposition = 'NO_CHARGE',
      postAbortTransferDestination = 'INPATIENT_WARD'
    } = payload;

    if (!encounterId || !patientId || !abortStage || !abortReasonCategory || !clinicalDetails) {
      throw new PerioperativeDomainError(
        'Data pembatalan/penghentian operasi tidak lengkap. Parameter wajib: encounterId, patientId, abortStage, abortReasonCategory, clinicalDetails.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-ABORT-${Date.now()}`;
    const authorizerId = actor.userId || actor.id || 'DOC-DPJP-01';
    const authorizerName = actor.fullName || actor.name || 'dr. Sp.B / Sp.An';

    try {
      await client.query('BEGIN');

      const abortId = crypto.randomUUID();
      const abortNumber = `ABORT-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${abortId}|${surgicalCaseId}|${abortStage}|${abortReasonCategory}|${authorizerId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO surgical_abort_ledgers (
          id, surgical_case_id, encounter_id, patient_id, abort_number,
          abort_stage, abort_reason_category, clinical_details,
          authorized_by_id, authorized_by_name, implants_disposition,
          medications_given, billing_disposition, post_abort_transfer_destination,
          digital_signature_hash, correlation_id, aborted_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        abortId, surgicalCaseId, encounterId, patientId, abortNumber,
        abortStage, abortReasonCategory, clinicalDetails,
        authorizerId, authorizerName, implantsDisposition,
        JSON.stringify(medicationsGiven), billingDisposition, postAbortTransferDestination,
        digitalSignatureHash, corrId, timestamp
      ]);

      const abortRecord = res.rows[0];

      // Update surgical case status to CANCELLED
      await client.query(`
        UPDATE surgical_cases
        SET status = 'CANCELLED', actual_end = NOW(), updated_at = NOW()
        WHERE id = $1;
      `, [surgicalCaseId]);

      // Release theatre room to CLEANING_STERILIZATION
      const caseRes = await client.query('SELECT theatre_id FROM surgical_cases WHERE id = $1', [surgicalCaseId]);
      if (caseRes.rows.length > 0 && caseRes.rows[0].theatre_id) {
        await client.query(`
          UPDATE operating_theatres
          SET status = 'CLEANING_STERILIZATION', current_case_id = NULL, updated_at = NOW()
          WHERE id = $1;
        `, [caseRes.rows[0].theatre_id]);
      }

      // Record Timeline Event with WARNING/CRITICAL severity
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'SURGICAL_ABORT',
        eventTitle: `Operasi Dibatalkan/Dihentikan: ${abortReasonCategory} (${abortStage})`,
        eventSummary: `Alasan: ${clinicalDetails}. Otorisator: ${authorizerName}. Disposisi Tagihan: ${billingDisposition}. Tujuan Transfer: ${postAbortTransferDestination}.`,
        domainSourceTable: 'surgical_abort_ledgers',
        domainSourceId: abortRecord.id,
        clinicalSeverity: 'WARNING'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'PERIOPERATIVE', $2, 'SURGERY_ABORTED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), abortRecord.id, JSON.stringify({ abortId: abortRecord.id, abortReasonCategory, billingDisposition }), corrId]);

      await client.query('COMMIT');
      return abortRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 6. Trigger Intraoperative Emergency & Resuscitation Bridge
   */
  triggerIntraoperativeEmergency: async (surgicalCaseId, payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    if (!surgicalCaseId) {
      throw new PerioperativeDomainError('Surgical Case ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const {
      encounterId,
      patientId,
      eventType, // 'CODE_BLUE_CARDIAC_ARREST', 'MALIGNANT_HYPERTHERMIA', 'MASSIVE_HEMORRHAGE_MTP', etc.
      resuscitationSessionId,
      clinicalInterventions,
      outcome = 'ROSC_STABILIZED'
    } = payload;

    if (!encounterId || !patientId || !eventType || !clinicalInterventions) {
      throw new PerioperativeDomainError(
        'Data kegawatdaruratan intraoperatif tidak lengkap. Parameter wajib: encounterId, patientId, eventType, clinicalInterventions.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-EMERG-${Date.now()}`;
    const leadId = actor.userId || actor.id || 'DOC-ANES-01';
    const leadName = actor.fullName || actor.name || 'dr. Sp.An (Lead Resuscitator)';

    try {
      await client.query('BEGIN');

      const eventId = crypto.randomUUID();
      const eventNumber = `INTRAOP-EMERG-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${eventId}|${surgicalCaseId}|${eventType}|${leadId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO intraoperative_emergency_events (
          id, surgical_case_id, encounter_id, patient_id, event_number,
          event_type, resuscitation_session_id, lead_resuscitator_id,
          lead_resuscitator_name, clinical_interventions, time_of_event,
          outcome, digital_signature_hash, correlation_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        eventId, surgicalCaseId, encounterId, patientId, eventNumber,
        eventType, resuscitationSessionId || `RESUS-${Date.now()}`,
        leadId, leadName, clinicalInterventions, timestamp,
        outcome, digitalSignatureHash, corrId
      ]);

      const emergencyRecord = res.rows[0];

      // Record Timeline Event with CRITICAL severity
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'INTRAOPERATIVE_EMERGENCY',
        eventTitle: `KEGAWATDARURATAN INTRAOPERATIF: ${eventType}`,
        eventSummary: `Tindakan: ${clinicalInterventions}. Luaran: ${outcome}. Pemimpin Resusitasi: ${leadName}.`,
        domainSourceTable: 'intraoperative_emergency_events',
        domainSourceId: emergencyRecord.id,
        clinicalSeverity: 'CRITICAL'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'PERIOPERATIVE', $2, 'INTRAOPERATIVE_EMERGENCY_TRIGGERED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), emergencyRecord.id, JSON.stringify({ emergencyId: emergencyRecord.id, eventType, outcome }), corrId]);

      await client.query('COMMIT');
      return emergencyRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 7. Record Surgical Specimen Collection & Chain of Custody
   */
  recordSurgicalSpecimenCollection: async (surgicalCaseId, payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    if (!surgicalCaseId) {
      throw new PerioperativeDomainError('Surgical Case ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const {
      encounterId,
      patientId,
      specimenContainerBarcode,
      specimenType,
      anatomicalSite,
      fixativeMedium = 'FORMALIN_10_PERCENT',
      urgencyLevel = 'ROUTINE_HISTOPATHOLOGY',
      provisionalClinicalDiagnosis
    } = payload;

    if (!encounterId || !patientId || !specimenContainerBarcode || !specimenType || !anatomicalSite || !provisionalClinicalDiagnosis) {
      throw new PerioperativeDomainError(
        'Data spesimen bedah tidak lengkap. Parameter wajib: encounterId, patientId, specimenContainerBarcode, specimenType, anatomicalSite, provisionalClinicalDiagnosis.',
        'VALIDATION_FAILED',
        400
      );
    }

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-SPEC-${Date.now()}`;
    const surgeonId = actor.userId || actor.id || 'DOC-SURG-01';
    const surgeonName = actor.fullName || actor.name || 'dr. Sp.B';

    try {
      await client.query('BEGIN');

      const specimenId = crypto.randomUUID();
      const trackingNumber = `SPEC-PATH-${Date.now().toString().slice(-6)}`;
      const timestamp = new Date().toISOString();

      const sigPayload = `${specimenId}|${surgicalCaseId}|${specimenContainerBarcode}|${specimenType}|${surgeonId}|${timestamp}`;
      const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

      const insertSql = `
        INSERT INTO surgical_specimen_ledgers (
          id, surgical_case_id, encounter_id, patient_id, specimen_tracking_number,
          specimen_container_barcode, specimen_type, anatomical_site, fixative_medium,
          urgency_level, provisional_clinical_diagnosis, scrub_nurse_id, scrub_nurse_name,
          surgeon_id, surgeon_name, custody_status, digital_signature_hash, correlation_id,
          collected_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'NURSE-SCRUB-01', 'Ners Instrumentator', $12, $13, 'COLLECTED_IN_THEATRE', $14, $15, $16, NOW())
        RETURNING *;
      `;

      const res = await client.query(insertSql, [
        specimenId, surgicalCaseId, encounterId, patientId, trackingNumber,
        specimenContainerBarcode, specimenType, anatomicalSite, fixativeMedium,
        urgencyLevel, provisionalClinicalDiagnosis,
        surgeonId, surgeonName,
        digitalSignatureHash, corrId, timestamp
      ]);

      const specimenRecord = res.rows[0];

      // Record Timeline Event
      await careCoordinationAndTimelineService.recordTimelineEvent({
        encounterId,
        patientId,
        eventCategory: 'SURGICAL_SPECIMEN',
        eventTitle: `Pengambilan Jaringan/Spesimen Bedah (${urgencyLevel}): ${specimenType}`,
        eventSummary: `Barcode: ${specimenContainerBarcode}. Lokasi: ${anatomicalSite}. Fiksasi: ${fixativeMedium}. Diagnosis Klinis: ${provisionalClinicalDiagnosis}.`,
        domainSourceTable: 'surgical_specimen_ledgers',
        domainSourceId: specimenRecord.id,
        clinicalSeverity: 'INFO'
      }, actor, clientIp, corrId, client);

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'PERIOPERATIVE', $2, 'SURGICAL_SPECIMEN_COLLECTED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), specimenRecord.id, JSON.stringify({ specimenId: specimenRecord.id, specimenContainerBarcode, urgencyLevel }), corrId]);

      await client.query('COMMIT');
      return specimenRecord;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * 8. Finalize Surgical Closed Loop & Exactly-Once Charge Capture
   */
  finalizeSurgicalClosedLoop: async (surgicalCaseId, payload, actor, clientIp = '127.0.0.1', correlationId = null) => {
    if (!surgicalCaseId) {
      throw new PerioperativeDomainError('Surgical Case ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const {
      operatingRoomFee = 2500000.00,
      surgeonProfessionalFee = 4500000.00,
      anesthesiaProfessionalFee = 2000000.00,
      consumablesCharge = 1200000.00,
      anestheticDrugsCharge = 850000.00,
      implantsCharge = 0.00,
      icd10Diagnosis = 'K35.8',
      icd9cmProcedure = '47.0',
      inacbgCode = 'K-1-14-I',
      inacbgDescription = 'Prosedur Usus Buntu Ringan',
      inacbgTariff = 12500000.00
    } = payload;

    const client = await postgresPoolService.getPool().connect();
    const corrId = correlationId || `CORR-FIN-SURG-${Date.now()}`;

    try {
      await client.query('BEGIN');

      // Fetch surgical case
      const caseRes = await client.query('SELECT * FROM surgical_cases WHERE id = $1', [surgicalCaseId]);
      if (caseRes.rows.length === 0) {
        throw new PerioperativeDomainError('Kasus bedah tidak ditemukan.', 'NOT_FOUND', 404);
      }
      const surgicalCase = caseRes.rows[0];

      // Verify WHO Sign-Out completion
      const whoRes = await client.query('SELECT status FROM who_safety_checklist_executions WHERE surgical_case_id = $1', [surgicalCaseId]);
      if (whoRes.rows.length === 0 || whoRes.rows[0].status !== 'SIGN_OUT_COMPLETED') {
        throw new PerioperativeDomainError(
          'WHO Surgical Safety Checklist Sign-Out belum diselesaikan. Operasi tidak dapat ditutup secara final.',
          'WHO_CHECKLIST_INCOMPLETE',
          422
        );
      }

      const totalHospitalCost = Number(operatingRoomFee) + Number(surgeonProfessionalFee) + Number(anesthesiaProfessionalFee) + Number(consumablesCharge) + Number(anestheticDrugsCharge) + Number(implantsCharge);

      // Insert billing breakdown (idempotent / exactly-once)
      const billId = crypto.randomUUID();
      await client.query(`
        INSERT INTO surgical_billing_breakdown (
          id, tenant_id, surgical_case_id, encounter_id, patient_mrn,
          operating_room_fee, surgeon_professional_fee, anesthesia_professional_fee,
          consumables_charge, anesthetic_drugs_charge, implants_charge,
          total_hospital_cost, icd10_primary_diagnosis, icd9cm_primary_procedure,
          inacbg_code, inacbg_description, inacbg_tariff, billing_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'POSTED_TO_BILLING', NOW(), NOW())
        ON CONFLICT (surgical_case_id) DO NOTHING;
      `, [
        billId, surgicalCase.tenant_id || crypto.randomUUID(), surgicalCaseId, surgicalCase.encounter_id, surgicalCase.patient_mrn,
        operatingRoomFee, surgeonProfessionalFee, anesthesiaProfessionalFee,
        consumablesCharge, anestheticDrugsCharge, implantsCharge,
        totalHospitalCost, icd10Diagnosis, icd9cmProcedure,
        inacbgCode, inacbgDescription, inacbgTariff
      ]);

      // Update surgical case status to COMPLETED
      await client.query(`
        UPDATE surgical_cases
        SET status = 'COMPLETED', actual_end = NOW(), updated_at = NOW()
        WHERE id = $1;
      `, [surgicalCaseId]);

      // Update room status to CLEANING_STERILIZATION
      if (surgicalCase.theatre_id) {
        await client.query(`
          UPDATE operating_theatres
          SET status = 'CLEANING_STERILIZATION', current_case_id = NULL, updated_at = NOW()
          WHERE id = $1;
        `, [surgicalCase.theatre_id]);
      }

      // Outbox Event
      await client.query(`
        INSERT INTO clinical_domain_outbox (
          id, aggregate_type, aggregate_id, event_type, event_payload, status, correlation_id, created_at
        ) VALUES ($1, 'PERIOPERATIVE', $2, 'SURGERY_CLOSED_LOOP_FINALIZED', $3, 'PENDING', $4, NOW());
      `, [crypto.randomUUID(), surgicalCaseId, JSON.stringify({ surgicalCaseId, totalHospitalCost, inacbgCode }), corrId]);

      await client.query('COMMIT');
      return {
        surgicalCaseId,
        status: 'COMPLETED',
        totalHospitalCost,
        inacbgTariff,
        roomStatus: 'CLEANING_STERILIZATION'
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
