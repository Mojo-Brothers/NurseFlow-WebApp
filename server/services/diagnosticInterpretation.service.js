/**
 * NurseFlow Enterprise HIS 2026 — Master Diagnostic Results & Clinical Interpretation Closed-Loop Service
 * Domain Authority: Diagnostic Result Distribution (Lab/Rad), Critical Panic Alerts (JCI IPSG 2 TBAK),
 * Physician Clinical Interpretation, Longitudinal Delta Checks, and Secondary CPOE Action Execution.
 * Standards: JCI IPSG 2 / PMKP, ISO 15189, LOINC, PostgreSQL 16 ACID Transactions.
 *
 * P0-2B WAVE 1B.2 — Multi-Tenant Unit of Work & CS 82 Remediation
 */

import crypto from 'crypto';
import { postgresPoolService } from '../db/postgresPool.js';
import { withUnitOfWork, isValidUuid } from '../db/unitOfWork.js';

export class DiagnosticInterpretationDomainError extends Error {
  constructor(message, code = 'DIAGNOSTIC_DOMAIN_ERROR', statusCode = 400, details = []) {
    super(message);
    this.name = 'DiagnosticInterpretationDomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

const AUTHORIZED_INTERPRETATION_ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_DOCTOR_DPJP',
  'ROLE_DOCTOR_EMERGENCY',
  'ROLE_DOCTOR_SPECIALIST',
  'ROLE_ICU_SPECIALIST',
  'ROLE_CARDIOLOGIST',
  'ROLE_ANESTHESIOLOGIST',
  'ROLE_RADIOLOGIST',
  'ROLE_PATHOLOGIST'
];

export const diagnosticInterpretationService = {
  /**
   * 1. Publish Diagnostic Result Notification (Distribution & Critical Panic Alerts)
   */
  publishDiagnosticNotification: async ({
    encounterId,
    patientId,
    sourceDomain = 'LABORATORY',
    sourceOrderId = null,
    sourceItemId = null,
    sourceResultId = null,
    testOrStudyCode,
    testOrStudyName,
    resultValue,
    numericValue = null,
    referenceRange = null,
    abnormalityFlag = 'NORMAL',
    notificationPriority = null,
    notifiedToId = 'DOC-DPJP-01',
    notifiedToName = 'dr. Siti Rahma, Sp.PD',
    notifiedToRole = 'ROLE_DOCTOR_DPJP',
    notificationMethod = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!encounterId || !patientId || !testOrStudyCode || !resultValue) {
      throw new DiagnosticInterpretationDomainError(
        'Encounter ID, Patient ID, Test/Study Code, dan Result Value wajib disertakan.',
        'VALIDATION_FAILED',
        400
      );
    }

    const resolvedTenantId = actor?.tenantId || actor?.tenant_id;
    if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
      throw new DiagnosticInterpretationDomainError(
        'Actor tenantId (UUID) wajib disertakan untuk melakukan operasi diagnostik.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    // Determine notification priority & delivery channel
    let effectivePriority = notificationPriority;
    let effectiveMethod = notificationMethod;

    if (abnormalityFlag === 'CRITICAL_PANIC') {
      effectivePriority = effectivePriority || 'EMERGENCY_PANIC';
      effectiveMethod = effectiveMethod || 'CRITICAL_POPUP_ALERT';
    } else if (abnormalityFlag === 'PATHOLOGICAL') {
      effectivePriority = effectivePriority || 'URGENT_STAT';
      effectiveMethod = effectiveMethod || 'HOSPITAL_PAGE';
    } else if (abnormalityFlag === 'ABNORMAL') {
      effectivePriority = effectivePriority || 'PRIORITY';
      effectiveMethod = effectiveMethod || 'IN_CHART_INBOX';
    } else {
      effectivePriority = effectivePriority || 'ROUTINE';
      effectiveMethod = effectiveMethod || 'IN_CHART_INBOX';
    }

    return withUnitOfWork(
      postgresPoolService.getPool(),
      {
        tenantId: resolvedTenantId,
        actorId: actor.userId || actor.id || null,
        userRole: actor.role || null,
        isolationLevel: 'READ COMMITTED'
      },
      async ({ query, tenantId }) => {
        // Verify encounter
        const encRes = await query('SELECT * FROM encounters WHERE id = $1 FOR UPDATE;', [encounterId]);
        if (encRes.rows.length === 0) {
          throw new DiagnosticInterpretationDomainError(`Encounter ${encounterId} tidak ditemukan.`, 'ENCOUNTER_NOT_FOUND', 404);
        }
        const encounter = encRes.rows[0];

        if (['CLOSED', 'CANCELLED'].includes(encounter.status)) {
          throw new DiagnosticInterpretationDomainError(
            `Ditolak: Encounter telah ditutup (${encounter.status}).`,
            'ENCOUNTER_ALREADY_TERMINATED',
            400
          );
        }

        const notifId = crypto.randomUUID();
        const serverTimestamp = new Date();

        const insertNotifSql = `
          INSERT INTO diagnostic_result_notifications (
            id, encounter_id, patient_id, source_domain,
            source_order_id, source_item_id, source_result_id,
            test_or_study_code, test_or_study_name, result_value,
            numeric_value, reference_range, abnormality_flag,
            notification_priority, notified_to_id, notified_to_name,
            notified_to_role, notification_method, notified_at,
            status, correlation_id, version, created_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10,
            $11, $12, $13,
            $14, $15, $16,
            $17, $18, $19,
            $20, $21, $22,
            $23
          ) RETURNING *;
        `;

        const notifRes = await query(insertNotifSql, [
          notifId,
          encounterId,
          patientId,
          sourceDomain,
          sourceOrderId,
          sourceItemId,
          sourceResultId,
          testOrStudyCode,
          testOrStudyName,
          resultValue,
          numericValue,
          referenceRange,
          abnormalityFlag,
          effectivePriority,
          notifiedToId,
          notifiedToName,
          notifiedToRole,
          effectiveMethod,
          serverTimestamp,
          'PENDING_ACKNOWLEDGMENT',
          correlationId,
          1,
          serverTimestamp
        ]);

        // Outbox Event
        await query(`
          INSERT INTO clinical_domain_outbox (
            id, aggregate_type, aggregate_id, event_type,
            event_payload, status, correlation_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [
          crypto.randomUUID(),
          'DIAGNOSTIC_NOTIFICATION',
          notifId,
          'DIAGNOSTIC_RESULT_NOTIFIED',
          JSON.stringify({
            notificationId: notifId,
            encounterId,
            patientId,
            sourceDomain,
            testCode: testOrStudyCode,
            testName: testOrStudyName,
            resultValue,
            abnormalityFlag,
            priority: effectivePriority,
            notifiedTo: notifiedToName,
            notifiedAt: serverTimestamp.toISOString()
          }),
          'PENDING',
          correlationId,
          serverTimestamp
        ]);

        return notifRes.rows[0];
      }
    );
  },

  /**
   * 2. Acknowledge Diagnostic Result Notification (Closed-Loop Read-Back for Critical Values)
   */
  acknowledgeDiagnosticNotification: async ({
    notificationId,
    readBackConfirmed = false,
    acknowledgmentNotes = 'Hasil telah diterima dan ditelaah.'
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!notificationId) {
      throw new DiagnosticInterpretationDomainError('Notification ID wajib disertakan.', 'VALIDATION_FAILED', 400);
    }

    const resolvedTenantId = actor?.tenantId || actor?.tenant_id;
    if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
      throw new DiagnosticInterpretationDomainError(
        'Actor tenantId (UUID) wajib disertakan untuk melakukan operasi diagnostik.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    return withUnitOfWork(
      postgresPoolService.getPool(),
      {
        tenantId: resolvedTenantId,
        actorId: actor.userId || actor.id || null,
        userRole: actor.role || null,
        isolationLevel: 'READ COMMITTED'
      },
      async ({ query }) => {
        const notifRes = await query('SELECT * FROM diagnostic_result_notifications WHERE id = $1 FOR UPDATE;', [notificationId]);
        if (notifRes.rows.length === 0) {
          throw new DiagnosticInterpretationDomainError(`Notifikasi diagnostik ${notificationId} tidak ditemukan.`, 'NOTIFICATION_NOT_FOUND', 404);
        }
        const notif = notifRes.rows[0];

        if (notif.status === 'ACKNOWLEDGED' || notif.status === 'INTERPRETED' || notif.status === 'ACTION_TAKEN') {
          throw new DiagnosticInterpretationDomainError('Notifikasi hasil ini sudah dikonfirmasi sebelumnya.', 'ALREADY_ACKNOWLEDGED', 400);
        }

        // Strict JCI IPSG 2 Guard for Critical / Panic Results
        if (notif.abnormality_flag === 'CRITICAL_PANIC' && !readBackConfirmed) {
          throw new DiagnosticInterpretationDomainError(
            'JCI IPSG 2 MANDATORY: Konfirmasi hasil nilai kritis (Panic Value) wajib menyertakan verifikasi Read-Back TBAK (readBackConfirmed = true)!',
            'READ_BACK_CONFIRMATION_REQUIRED',
            400
          );
        }

        const serverTimestamp = new Date();
        const ackByName = actor.fullName || actor.username || 'dr. Siti Rahma, Sp.PD';
        const ackById = actor.userId || 'DOC-DPJP-01';

        const updateSql = `
          UPDATE diagnostic_result_notifications
          SET acknowledged_at = $1,
              acknowledged_by_id = $2,
              acknowledged_by_name = $3,
              read_back_confirmed = $4,
              acknowledgment_notes = $5,
              status = 'ACKNOWLEDGED',
              version = version + 1
          WHERE id = $6
          RETURNING *;
        `;

        const updatedRes = await query(updateSql, [
          serverTimestamp,
          ackById,
          ackByName,
          readBackConfirmed,
          acknowledgmentNotes,
          notificationId
        ]);

        // Outbox Event
        await query(`
          INSERT INTO clinical_domain_outbox (
            id, aggregate_type, aggregate_id, event_type,
            event_payload, status, correlation_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [
          crypto.randomUUID(),
          'DIAGNOSTIC_NOTIFICATION',
          notificationId,
          'DIAGNOSTIC_RESULT_ACKNOWLEDGED',
          JSON.stringify({
            notificationId,
            acknowledgedBy: ackByName,
            readBackConfirmed,
            acknowledgedAt: serverTimestamp.toISOString()
          }),
          'PENDING',
          correlationId,
          serverTimestamp
        ]);

        return updatedRes.rows[0];
      }
    );
  },

  /**
   * 3. Record Physician Clinical Interpretation & Longitudinal Delta Check
   */
  recordPhysicianInterpretation: async ({
    notificationId,
    clinicalImpression,
    diagnosticCorrelation,
    impactOnCarePlan = 'CHANGE_IN_TREATMENT',
    previousValue = null,
    deltaCheckAnalysis = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!notificationId || !clinicalImpression || !diagnosticCorrelation) {
      throw new DiagnosticInterpretationDomainError(
        'Notification ID, Clinical Impression, dan Diagnostic Correlation wajib disertakan.',
        'VALIDATION_FAILED',
        400
      );
    }

    const authorRole = actor.role || 'UNAUTHENTICATED';
    if (!AUTHORIZED_INTERPRETATION_ROLES.includes(authorRole)) {
      throw new DiagnosticInterpretationDomainError(
        `Wewenang ditolak: Peran [${authorRole}] tidak memiliki wewenang membuat interpretasi klinis dokter.`,
        'FORBIDDEN_INTERPRETATION_ROLE',
        403
      );
    }

    const resolvedTenantId = actor?.tenantId || actor?.tenant_id;
    if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
      throw new DiagnosticInterpretationDomainError(
        'Actor tenantId (UUID) wajib disertakan untuk melakukan operasi diagnostik.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    return withUnitOfWork(
      postgresPoolService.getPool(),
      {
        tenantId: resolvedTenantId,
        actorId: actor.userId || actor.id || null,
        userRole: authorRole,
        isolationLevel: 'READ COMMITTED'
      },
      async ({ query, tenantId }) => {
        const notifRes = await query('SELECT * FROM diagnostic_result_notifications WHERE id = $1 FOR UPDATE;', [notificationId]);
        if (notifRes.rows.length === 0) {
          throw new DiagnosticInterpretationDomainError(`Notifikasi diagnostik ${notificationId} tidak ditemukan.`, 'NOTIFICATION_NOT_FOUND', 404);
        }
        const notif = notifRes.rows[0];

        const interpId = crypto.randomUUID();
        const serverTimestamp = new Date();
        const doctorName = actor.fullName || actor.username || 'dr. Siti Rahma, Sp.PD';
        const doctorId = actor.userId || 'DOC-DPJP-01';

        // Digital Signature SHA-256
        const sigPayload = `${interpId}:${notif.encounter_id}:${doctorId}:${clinicalImpression}:${impactOnCarePlan}:${serverTimestamp.toISOString()}`;
        const digitalSignatureHash = crypto.createHash('sha256').update(sigPayload).digest('hex');

        // Longitudinal Delta Check Computation
        let deltaRecord = null;
        if (previousValue !== null && notif.numeric_value !== null) {
          const currentNum = Number(notif.numeric_value);
          const prevNum = Number(previousValue);
          const absDelta = currentNum - prevNum;
          const pctChange = prevNum !== 0 ? ((absDelta / prevNum) * 100) : 0;

          let deltaAlert = 'NORMAL';
          if (pctChange >= 50) deltaAlert = 'SIGNIFICANT_RISE';
          else if (pctChange <= -50) deltaAlert = 'SIGNIFICANT_DROP';

          const insertDeltaSql = `
            INSERT INTO longitudinal_delta_checks (
              id, encounter_id, patient_id, parameter_code,
              parameter_name, current_value, previous_value,
              absolute_delta, percentage_change, time_elapsed_hours,
              delta_alert_level, created_at
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7,
              $8, $9, $10,
              $11, $12
            ) RETURNING *;
          `;

          const deltaRes = await query(insertDeltaSql, [
            crypto.randomUUID(),
            notif.encounter_id,
            notif.patient_id,
            notif.test_or_study_code,
            notif.test_or_study_name,
            currentNum,
            prevNum,
            absDelta,
            pctChange,
            24.0,
            deltaAlert,
            serverTimestamp
          ]);
          deltaRecord = deltaRes.rows[0];
        }

        const insertInterpSql = `
          INSERT INTO physician_diagnostic_interpretations (
            id, tenant_id, notification_id, encounter_id, patient_id,
            interpreted_by_id, interpreted_by_name, interpreted_by_role,
            clinical_impression, diagnostic_correlation, impact_on_care_plan,
            delta_check_analysis, digital_signature_hash, correlation_id,
            interpreted_at, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            $9, $10, $11,
            $12, $13, $14,
            $15, $16
          ) RETURNING *;
        `;

        const interpRes = await query(insertInterpSql, [
          interpId,
          tenantId,
          notificationId,
          notif.encounter_id,
          notif.patient_id,
          doctorId,
          doctorName,
          authorRole,
          clinicalImpression,
          diagnosticCorrelation,
          impactOnCarePlan,
          JSON.stringify(deltaCheckAnalysis || deltaRecord || {}),
          digitalSignatureHash,
          correlationId,
          serverTimestamp,
          serverTimestamp
        ]);

        // Update notification status
        await query(`
          UPDATE diagnostic_result_notifications
          SET status = 'INTERPRETED',
              version = version + 1
          WHERE id = $1;
        `, [notificationId]);

        // Universal Audit Log
        await query(`
          INSERT INTO universal_audit_logs (
            id, actor_id, actor_name, actor_role, client_ip,
            action_type, resource_type, resource_id, patient_id,
            before_state, after_state, reason_for_action, signature_hash, created_at,
            tenant_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);
        `, [
          crypto.randomUUID(),
          doctorId,
          doctorName,
          authorRole,
          clientIp,
          'CREATE',
          'DIAGNOSTIC_INTERPRETATION',
          interpId,
          notif.patient_id,
          null,
          JSON.stringify(interpRes.rows[0]),
          `Interpretasi Hasil Diagnostik: ${clinicalImpression}`,
          digitalSignatureHash,
          serverTimestamp,
          tenantId
        ]);

        // Outbox Event
        await query(`
          INSERT INTO clinical_domain_outbox (
            id, aggregate_type, aggregate_id, event_type,
            event_payload, status, correlation_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [
          crypto.randomUUID(),
          'DIAGNOSTIC_INTERPRETATION',
          interpId,
          'DIAGNOSTIC_INTERPRETATION_RECORDED',
          JSON.stringify({
            interpretationId: interpId,
            notificationId,
            encounterId: notif.encounter_id,
            patientId: notif.patient_id,
            clinicalImpression,
            impactOnCarePlan,
            doctorName,
            interpretedAt: serverTimestamp.toISOString()
          }),
          'PENDING',
          correlationId,
          serverTimestamp
        ]);

        return {
          ...interpRes.rows[0],
          deltaCheck: deltaRecord
        };
      }
    );
  },

  /**
   * 4. Execute Secondary Clinical Action (Downstream CPOE Order Creation & Closed-Loop Resolution)
   */
  executeSecondaryClinicalAction: async ({
    interpretationId,
    actionType = 'CPOE_MEDICATION_ORDER',
    actionSummary,
    cpoePayload = null
  }, actor = {}, clientIp = '127.0.0.1', correlationId = `CORR-${Date.now()}`) => {
    if (!interpretationId || !actionSummary) {
      throw new DiagnosticInterpretationDomainError(
        'Interpretation ID dan Action Summary wajib disertakan.',
        'VALIDATION_FAILED',
        400
      );
    }

    const resolvedTenantId = actor?.tenantId || actor?.tenant_id;
    if (!resolvedTenantId || !isValidUuid(resolvedTenantId)) {
      throw new DiagnosticInterpretationDomainError(
        'Actor tenantId (UUID) wajib disertakan untuk melakukan operasi diagnostik.',
        'AUTHORITATIVE_TENANT_REQUIRED',
        403,
        [{ field: 'actor.tenantId' }]
      );
    }

    return withUnitOfWork(
      postgresPoolService.getPool(),
      {
        tenantId: resolvedTenantId,
        actorId: actor.userId || actor.id || null,
        userRole: actor.role || null,
        isolationLevel: 'READ COMMITTED'
      },
      async ({ query, tenantId }) => {
        const interpRes = await query('SELECT * FROM physician_diagnostic_interpretations WHERE id = $1 FOR UPDATE;', [interpretationId]);
        if (interpRes.rows.length === 0) {
          throw new DiagnosticInterpretationDomainError(`Interpretasi klinis ${interpretationId} tidak ditemukan.`, 'INTERPRETATION_NOT_FOUND', 404);
        }
        const interp = interpRes.rows[0];

        const actionId = crypto.randomUUID();
        const serverTimestamp = new Date();
        const actorName = actor.fullName || actor.username || 'dr. Siti Rahma, Sp.PD';
        const actorId = actor.userId || 'DOC-DPJP-01';

        // Fetch episode_id from encounters for relational integrity in clinical_orders
        const encRes = await query('SELECT episode_id FROM encounters WHERE id = $1;', [interp.encounter_id]);
        const episodeId = encRes.rows[0]?.episode_id || crypto.randomUUID();

        let generatedCpoeOrderId = null;

        // If cpoePayload provided, create downstream CPOE Order
        if (cpoePayload) {
          generatedCpoeOrderId = crypto.randomUUID();
          const orderNumber = `ORD-DIAG-${Date.now().toString().slice(-6)}`;
          const rawCategory = (cpoePayload.orderCategory || cpoePayload.orderType || 'PHARMACY').toUpperCase();
          const allowedCategories = ['PHARMACY', 'LABORATORY', 'RADIOLOGY', 'PROCEDURE', 'DIET'];
          const orderCategory = allowedCategories.includes(rawCategory) ? rawCategory : 'PHARMACY';
          const priority = (cpoePayload.priority || 'CITO').toUpperCase();
          const clinicalIndication = cpoePayload.clinicalIndication || `Downstream order dari Interpretasi Diagnostik [${interpretationId}]: ${actionSummary}`;

          // CS 82 REMEDIATED: Explicit tenant_id ($2) in INSERT into clinical_orders
          await query(`
            INSERT INTO clinical_orders (
              id, tenant_id, order_number, patient_id, episode_id, encounter_id,
              ordered_by, order_category, priority, clinical_indication,
              status, requester_id, requester_name, requester_role,
              correlation_id, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10,
              $11, $12, $13, $14,
              $15, $16, $17
            );
          `, [
            generatedCpoeOrderId,
            tenantId, // <--- REMEDIATION OF CS 82
            orderNumber,
            interp.patient_id,
            episodeId,
            interp.encounter_id,
            actorName,
            orderCategory,
            priority,
            clinicalIndication,
            'ORDERED',
            actorId,
            actorName,
            actor.role || 'ROLE_DOCTOR_DPJP',
            correlationId,
            serverTimestamp,
            serverTimestamp
          ]);

          if (Array.isArray(cpoePayload.items)) {
            for (const itm of cpoePayload.items) {
              const itemType = (itm.itemType || 'MEDICATION').toUpperCase();
              const allowedItemTypes = ['MEDICATION', 'LABORATORY', 'RADIOLOGY', 'PROCEDURE', 'NURSING_CARE', 'DIET'];
              const normalizedItemType = allowedItemTypes.includes(itemType) ? itemType : 'MEDICATION';

              await query(`
                INSERT INTO cpoe_order_items (
                  id, order_id, item_type, catalog_code, item_name,
                  quantity, instructions, priority, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
              `, [
                crypto.randomUUID(),
                generatedCpoeOrderId,
                normalizedItemType,
                itm.catalogCode || 'MED-RES-01',
                itm.itemName || itm.catalogCode || 'Emergency Medication',
                itm.quantity || 1,
                itm.dosageInstruction || itm.instructions || 'Sesuai indikasi darurat',
                priority,
                'ORDERED',
                serverTimestamp,
                serverTimestamp
              ]);
            }
          }
        }

        const insertActionSql = `
          INSERT INTO diagnostic_secondary_actions (
            id, interpretation_id, encounter_id, patient_id,
            action_type, action_summary, cpoe_order_id,
            action_by_id, action_by_name, status, correlation_id, created_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10, $11, $12
          ) RETURNING *;
        `;

        const actionRes = await query(insertActionSql, [
          actionId,
          interpretationId,
          interp.encounter_id,
          interp.patient_id,
          actionType,
          actionSummary,
          generatedCpoeOrderId,
          actorId,
          actorName,
          'EXECUTED',
          correlationId,
          serverTimestamp
        ]);

        // Update parent notification status to ACTION_TAKEN
        await query(`
          UPDATE diagnostic_result_notifications
          SET status = 'ACTION_TAKEN',
              version = version + 1
          WHERE id = $1;
        `, [interp.notification_id]);

        // Outbox Event
        await query(`
          INSERT INTO clinical_domain_outbox (
            id, aggregate_type, aggregate_id, event_type,
            event_payload, status, correlation_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `, [
          crypto.randomUUID(),
          'DIAGNOSTIC_ACTION',
          actionId,
          'SECONDARY_ACTION_EXECUTED',
          JSON.stringify({
            actionId,
            interpretationId,
            actionType,
            actionSummary,
            cpoeOrderId: generatedCpoeOrderId,
            executedBy: actorName,
            executedAt: serverTimestamp.toISOString()
          }),
          'PENDING',
          correlationId,
          serverTimestamp
        ]);

        return actionRes.rows[0];
      }
    );
  }
};
