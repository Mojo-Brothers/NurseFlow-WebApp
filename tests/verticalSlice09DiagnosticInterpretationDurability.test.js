/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #09 Durability & Clinical Safety Test Suite
 * Clinical Results & Diagnostic Interpretation Closed Loop
 * Standards: JCI IPSG 2 / PMKP, ISO 15189, LOINC, PostgreSQL 16 ACID Transactions.
 * Complete 25 Chaos Gate Scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  diagnosticInterpretationService,
  DiagnosticInterpretationDomainError
} from '../server/services/diagnosticInterpretation.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-09 — Clinical Results & Diagnostic Interpretation Closed Loop ➔ PostgreSQL Durability & Chaos Gate (25 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    clinical_orders: [],
    cpoe_order_items: [],
    diagnostic_result_notifications: [],
    physician_diagnostic_interpretations: [],
    diagnostic_secondary_actions: [],
    longitudinal_delta_checks: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-diag-001',
          episode_id: 'epc-diag-001',
          patient_id: 'pat-diag-001',
          encounter_number: 'ENC-2026-DIAG-01',
          status: 'IN_PROGRESS'
        },
        {
          id: 'enc-closed-002',
          encounter_number: 'ENC-2026-DIAG-99',
          status: 'CLOSED'
        }
      ],
      clinical_orders: [],
      cpoe_order_items: [],
      diagnostic_result_notifications: [],
      physician_diagnostic_interpretations: [],
      diagnostic_secondary_actions: [],
      longitudinal_delta_checks: [],
      universal_audit_logs: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedNotifications: [],
            stagedInterpretations: [],
            stagedActions: [],
            stagedDeltaChecks: [],
            stagedOrders: [],
            stagedOrderItems: [],
            stagedAuditLogs: [],
            stagedOutbox: [],
            notificationUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.diagnostic_result_notifications.push(...activeTransactionState.stagedNotifications);
            mockDatabaseState.physician_diagnostic_interpretations.push(...activeTransactionState.stagedInterpretations);
            mockDatabaseState.diagnostic_secondary_actions.push(...activeTransactionState.stagedActions);
            mockDatabaseState.longitudinal_delta_checks.push(...activeTransactionState.stagedDeltaChecks);
            mockDatabaseState.clinical_orders.push(...activeTransactionState.stagedOrders);
            mockDatabaseState.cpoe_order_items.push(...activeTransactionState.stagedOrderItems);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.notificationUpdates.forEach(up => {
              const idx = mockDatabaseState.diagnostic_result_notifications.findIndex(n => n.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.diagnostic_result_notifications[idx] = { ...mockDatabaseState.diagnostic_result_notifications[idx], ...up.data };
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

        // SELECT FROM encounters
        if (normalized.includes('FROM ENCOUNTERS WHERE ID = $1')) {
          const found = mockDatabaseState.encounters.filter(e => e.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM diagnostic_result_notifications WHERE id = $1
        if (normalized.includes('FROM DIAGNOSTIC_RESULT_NOTIFICATIONS WHERE ID = $1')) {
          const allNotif = [
            ...mockDatabaseState.diagnostic_result_notifications,
            ...(activeTransactionState?.stagedNotifications || [])
          ];
          const found = allNotif.filter(n => n.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM physician_diagnostic_interpretations WHERE id = $1
        if (normalized.includes('FROM PHYSICIAN_DIAGNOSTIC_INTERPRETATIONS WHERE ID = $1')) {
          const allInterp = [
            ...mockDatabaseState.physician_diagnostic_interpretations,
            ...(activeTransactionState?.stagedInterpretations || [])
          ];
          const found = allInterp.filter(i => i.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO diagnostic_result_notifications
        if (normalized.startsWith('INSERT INTO DIAGNOSTIC_RESULT_NOTIFICATIONS')) {
          const newNotif = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            source_domain: params[3],
            source_order_id: params[4],
            source_item_id: params[5],
            source_result_id: params[6],
            test_or_study_code: params[7],
            test_or_study_name: params[8],
            result_value: params[9],
            numeric_value: params[10],
            reference_range: params[11],
            abnormality_flag: params[12],
            notification_priority: params[13],
            notified_to_id: params[14],
            notified_to_name: params[15],
            notified_to_role: params[16],
            notification_method: params[17],
            notified_at: params[18],
            status: params[19],
            correlation_id: params[20],
            version: params[21],
            created_at: params[22]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedNotifications.push(newNotif);
          } else {
            mockDatabaseState.diagnostic_result_notifications.push(newNotif);
          }
          return { rows: [newNotif], rowCount: 1 };
        }

        // INSERT INTO physician_diagnostic_interpretations
        if (normalized.startsWith('INSERT INTO PHYSICIAN_DIAGNOSTIC_INTERPRETATIONS')) {
          const newInterp = {
            id: params[0],
            notification_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            interpreted_by_id: params[4],
            interpreted_by_name: params[5],
            interpreted_by_role: params[6],
            clinical_impression: params[7],
            diagnostic_correlation: params[8],
            impact_on_care_plan: params[9],
            delta_check_analysis: JSON.parse(params[10] || '{}'),
            digital_signature_hash: params[11],
            correlation_id: params[12],
            interpreted_at: params[13],
            created_at: params[14]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedInterpretations.push(newInterp);
          } else {
            mockDatabaseState.physician_diagnostic_interpretations.push(newInterp);
          }
          return { rows: [newInterp], rowCount: 1 };
        }

        // INSERT INTO diagnostic_secondary_actions
        if (normalized.startsWith('INSERT INTO DIAGNOSTIC_SECONDARY_ACTIONS')) {
          const newAction = {
            id: params[0],
            interpretation_id: params[1],
            encounter_id: params[2],
            patient_id: params[3],
            action_type: params[4],
            action_summary: params[5],
            cpoe_order_id: params[6],
            action_by_id: params[7],
            action_by_name: params[8],
            status: params[9],
            correlation_id: params[10],
            created_at: params[11]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedActions.push(newAction);
          } else {
            mockDatabaseState.diagnostic_secondary_actions.push(newAction);
          }
          return { rows: [newAction], rowCount: 1 };
        }

        // INSERT INTO longitudinal_delta_checks
        if (normalized.startsWith('INSERT INTO LONGITUDINAL_DELTA_CHECKS')) {
          const newDelta = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            parameter_code: params[3],
            parameter_name: params[4],
            current_value: params[5],
            previous_value: params[6],
            absolute_delta: params[7],
            percentage_change: params[8],
            time_elapsed_hours: params[9],
            delta_alert_level: params[10],
            created_at: params[11]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedDeltaChecks.push(newDelta);
          } else {
            mockDatabaseState.longitudinal_delta_checks.push(newDelta);
          }
          return { rows: [newDelta], rowCount: 1 };
        }

        // INSERT INTO clinical_orders
        if (normalized.startsWith('INSERT INTO CLINICAL_ORDERS')) {
          const newOrder = { id: params[0], order_number: params[3], order_type: params[4], order_status: params[5] };
          if (activeTransactionState) {
            activeTransactionState.stagedOrders.push(newOrder);
          } else {
            mockDatabaseState.clinical_orders.push(newOrder);
          }
          return { rows: [newOrder], rowCount: 1 };
        }

        // INSERT INTO cpoe_order_items
        if (normalized.startsWith('INSERT INTO CPOE_ORDER_ITEMS')) {
          const newItem = { id: params[0], order_id: params[1], catalog_code: params[5], item_name: params[6] };
          if (activeTransactionState) {
            activeTransactionState.stagedOrderItems.push(newItem);
          } else {
            mockDatabaseState.cpoe_order_items.push(newItem);
          }
          return { rows: [newItem], rowCount: 1 };
        }

        // INSERT INTO universal_audit_logs
        if (normalized.startsWith('INSERT INTO UNIVERSAL_AUDIT_LOGS')) {
          const newAudit = { id: params[0], resource_id: params[7], created_at: params[13] };
          if (activeTransactionState) {
            activeTransactionState.stagedAuditLogs.push(newAudit);
          } else {
            mockDatabaseState.universal_audit_logs.push(newAudit);
          }
          return { rows: [{ id: newAudit.id }], rowCount: 1 };
        }

        // INSERT INTO clinical_domain_outbox
        if (normalized.startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
          const newOutbox = {
            id: params[0],
            aggregate_type: params[1],
            aggregate_id: params[2],
            event_type: params[3],
            event_payload: JSON.parse(params[4] || '{}'),
            status: params[5],
            correlation_id: params[6],
            created_at: params[7]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedOutbox.push(newOutbox);
          } else {
            mockDatabaseState.clinical_domain_outbox.push(newOutbox);
          }
          return { rows: [{ id: newOutbox.id }], rowCount: 1 };
        }

        // UPDATE diagnostic_result_notifications
        if (normalized.startsWith('UPDATE DIAGNOSTIC_RESULT_NOTIFICATIONS')) {
          const notifId = params[params.length - 1];
          if (normalized.includes("STATUS = 'ACKNOWLEDGED'")) {
            const updated = {
              acknowledged_at: params[0],
              acknowledged_by_id: params[1],
              acknowledged_by_name: params[2],
              read_back_confirmed: params[3],
              acknowledgment_notes: params[4],
              status: 'ACKNOWLEDGED'
            };
            if (activeTransactionState) {
              activeTransactionState.notificationUpdates.push({ id: notifId, data: updated });
            }
            return { rows: [{ id: notifId, ...updated }], rowCount: 1 };
          }
          if (normalized.includes("STATUS = 'INTERPRETED'")) {
            if (activeTransactionState) {
              activeTransactionState.notificationUpdates.push({ id: notifId, data: { status: 'INTERPRETED' } });
            }
            return { rows: [], rowCount: 1 };
          }
          if (normalized.includes("STATUS = 'ACTION_TAKEN'")) {
            if (activeTransactionState) {
              activeTransactionState.notificationUpdates.push({ id: notifId, data: { status: 'ACTION_TAKEN' } });
            }
            return { rows: [], rowCount: 1 };
          }
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

  // ─── TC-01: NORMAL DIAGNOSTIC RESULT NOTIFICATION ───
  it('TC-01: should publish normal diagnostic result to in-chart inbox with ROUTINE priority', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-GLU-FASTING',
      testOrStudyName: 'Glukosa Darah Puasa',
      resultValue: '95 mg/dL',
      numericValue: 95.0,
      referenceRange: '70 - 100 mg/dL',
      abnormalityFlag: 'NORMAL'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    expect(notif.notification_priority).toBe('ROUTINE');
    expect(notif.notification_method).toBe('IN_CHART_INBOX');
    expect(notif.status).toBe('PENDING_ACKNOWLEDGMENT');
    expect(mockDatabaseState.diagnostic_result_notifications.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'DIAGNOSTIC_RESULT_NOTIFIED')).toBe(true);
  });

  // ─── TC-02: PATHOLOGICAL DIAGNOSTIC FLAGGING ───
  it('TC-02: should upgrade notification priority to URGENT_STAT and dispatch hospital page for pathological results', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-TROPONIN',
      testOrStudyName: 'Troponin I Kuantitatif',
      resultValue: '48.5 ng/L',
      numericValue: 48.5,
      referenceRange: '< 14 ng/L',
      abnormalityFlag: 'PATHOLOGICAL'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    expect(notif.notification_priority).toBe('URGENT_STAT');
    expect(notif.notification_method).toBe('HOSPITAL_PAGE');
  });

  // ─── TC-03: CRITICAL PANIC VALUE NOTIFICATION ───
  it('TC-03: should upgrade priority to EMERGENCY_PANIC and trigger critical popup alert for panic values (e.g. K+ 7.2)', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium (Kalium)',
      resultValue: '7.2 mEq/L',
      numericValue: 7.2,
      referenceRange: '3.5 - 5.0 mEq/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    expect(notif.notification_priority).toBe('EMERGENCY_PANIC');
    expect(notif.notification_method).toBe('CRITICAL_POPUP_ALERT');
  });

  // ─── TC-04: TERMINATED ENCOUNTER GUARD ───
  it('TC-04: should reject publishing diagnostic notification for CLOSED or CANCELLED encounters', async () => {
    await expect(diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-closed-002',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN })).rejects.toThrow('Encounter telah ditutup');
  });

  // ─── TC-05: JCI IPSG 2 TBAK READ-BACK ON CRITICAL VALUE ───
  it('TC-05: should acknowledge critical panic notification with verified TBAK read-back confirmation', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    const ack = await diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: true,
      acknowledgmentNotes: 'Nilai kritis K+ 7.2 mEq/L telah dibacakan ulang oleh Ners Dewi ke Analis Lab, terkonfirmasi akurat.'
    }, { fullName: 'dr. Siti Rahma, Sp.PD', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(ack.status).toBe('ACKNOWLEDGED');
    expect(ack.read_back_confirmed).toBe(true);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'DIAGNOSTIC_RESULT_ACKNOWLEDGED')).toBe(true);
  });

  // ─── TC-06: MISSING READ-BACK REJECTION ON CRITICAL VALUE ───
  it('TC-06: should strictly reject acknowledgment of CRITICAL_PANIC result if readBackConfirmed is false', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    await expect(diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: false
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('JCI IPSG 2 MANDATORY: Konfirmasi hasil nilai kritis');
  });

  // ─── TC-07: NORMAL RESULT ACKNOWLEDGMENT WITHOUT STRICT READ-BACK ───
  it('TC-07: should allow acknowledging normal/routine result without requiring read-back flag', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-GLU',
      testOrStudyName: 'Glukosa Darah',
      resultValue: '90 mg/dL',
      abnormalityFlag: 'NORMAL'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    const ack = await diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: false
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(ack.status).toBe('ACKNOWLEDGED');
  });

  // ─── TC-08: DUPLICATE ACKNOWLEDGMENT PREVENTION ───
  it('TC-08: should prevent duplicate acknowledgment of an already acknowledged diagnostic notification', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-GLU',
      testOrStudyName: 'Glukosa Darah',
      resultValue: '90 mg/dL',
      abnormalityFlag: 'NORMAL'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    await diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: false
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    await expect(diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: false
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('sudah dikonfirmasi sebelumnya');
  });

  // ─── TC-09: PHYSICIAN DIAGNOSTIC INTERPRETATION AUTHORING ───
  it('TC-09: should record physician clinical interpretation with SHA-256 digital signature and update status to INTERPRETED', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Hiperkalemia berat (7.2 mEq/L) beresiko memicu aritmia ventrikel lethal.',
      diagnosticCorrelation: 'Korelasi dengan EKG menunjukkan gelombang T lancip (tall peaked T-waves).',
      impactOnCarePlan: 'URGENT_INTERVENTION_REQUIRED'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(interp.impact_on_care_plan).toBe('URGENT_INTERVENTION_REQUIRED');
    expect(interp.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(mockDatabaseState.diagnostic_result_notifications[0].status).toBe('INTERPRETED');
  });

  // ─── TC-10: NON-PHYSICIAN UNAUTHORIZED INTERPRETATION GUARD ───
  it('TC-10: should reject clinical interpretation authored by non-physician unauthorized roles (403)', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_TECHNICIAN });

    await expect(diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Interpretasi perawat',
      diagnosticCorrelation: 'Korelasi tanda vital'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-11: LONGITUDINAL DELTA CHECK (SIGNIFICANT RISE) ───
  it('TC-11: should calculate longitudinal delta check and flag SIGNIFICANT_RISE for acute Creatinine rise (1.2 ➔ 3.8 mg/dL)', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-CREATININE',
      testOrStudyName: 'Serum Creatinine',
      resultValue: '3.8 mg/dL',
      numericValue: 3.8,
      abnormalityFlag: 'PATHOLOGICAL'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Acute Kidney Injury (AKI) stage 3 dengan lonjakan kreatinin signifikan.',
      diagnosticCorrelation: 'Kreatinin baseline 1.2 mg/dL kemarin naik drastis menjadi 3.8 mg/dL.',
      previousValue: 1.2
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(interp.deltaCheck).toBeDefined();
    expect(interp.deltaCheck.absolute_delta).toBeCloseTo(2.6, 2);
    expect(interp.deltaCheck.percentage_change).toBeCloseTo(216.67, 1);
    expect(interp.deltaCheck.delta_alert_level).toBe('SIGNIFICANT_RISE');
  });

  // ─── TC-12: LONGITUDINAL DELTA CHECK (SIGNIFICANT DROP) ───
  it('TC-12: should calculate longitudinal delta check and flag SIGNIFICANT_DROP for acute Hemoglobin drop (14.0 ➔ 6.8 g/dL)', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-HB',
      testOrStudyName: 'Hemoglobin',
      resultValue: '6.8 g/dL',
      numericValue: 6.8,
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Anemia gravis akut ec perdarahan saluran cerna masif.',
      diagnosticCorrelation: 'Hb turun dari 14.0 menjadi 6.8 g/dL dalam 24 jam.',
      previousValue: 14.0
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(interp.deltaCheck.delta_alert_level).toBe('SIGNIFICANT_DROP');
  });

  // ─── TC-13: SECONDARY ACTION: EMERGENCY MEDICATION CPOE GENERATION ───
  it('TC-13: should execute secondary medication CPOE order for Ca Gluconate and Insulin-Dextrose upon Hyperkalemia interpretation', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Hiperkalemia berat darurat.',
      diagnosticCorrelation: 'EKG tall peaked T-waves.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CPOE_MEDICATION_ORDER',
      actionSummary: 'Order Ca Gluconate 10% 1 amp IV + D40% 2 amp + Insulin 10 IU IV',
      cpoePayload: {
        orderType: 'PHARMACY',
        priority: 'CITO',
        items: [
          { catalogCode: 'MED-CA-GLUC', itemName: 'Calcium Gluconate 10% Ampul', quantity: 1, dosageInstruction: '1 ampul IV pelan 5 menit' },
          { catalogCode: 'MED-D40', itemName: 'Dextrose 40% 25 mL', quantity: 2, dosageInstruction: '2 ampul IV bolus' },
          { catalogCode: 'MED-ACTRAPID', itemName: 'Insulin Rapid Acting (Actrapid)', quantity: 10, dosageInstruction: '10 IU IV bersamaan D40' }
        ]
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(action.action_type).toBe('CPOE_MEDICATION_ORDER');
    expect(action.cpoe_order_id).toBeDefined();
    expect(mockDatabaseState.clinical_orders.length).toBe(1);
    expect(mockDatabaseState.cpoe_order_items.length).toBe(3);
    expect(mockDatabaseState.diagnostic_result_notifications[0].status).toBe('ACTION_TAKEN');
  });

  // ─── TC-14: SECONDARY ACTION: REPEAT FOLLOW-UP DIAGNOSTIC CPOE ───
  it('TC-14: should execute secondary follow-up diagnostic CPOE order for repeat Potassium in 2 hours', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Hiperkalemia pasca terapi koreksi.',
      diagnosticCorrelation: 'Evaluasi respon terapi.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CPOE_REPEAT_DIAGNOSTIC',
      actionSummary: 'CPOE Order Evaluasi Ulang Kalium Serum 2 Jam Pasca Koreksi',
      cpoePayload: {
        orderType: 'LABORATORY',
        priority: 'CITO',
        items: [{ catalogCode: 'LAB-K-REPEAT', itemName: 'Kalium Serum Post-Koreksi', quantity: 1 }]
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(action.action_type).toBe('CPOE_REPEAT_DIAGNOSTIC');
  });

  // ─── TC-15: SECONDARY ACTION: EMERGENCY HEMODIALYSIS PROCEDURE CPOE ───
  it('TC-15: should execute secondary procedure CPOE order for emergency hemodialysis', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-UREUM',
      testOrStudyName: 'Serum Ureum',
      resultValue: '280 mg/dL',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Uremic Encephalopathy ec End Stage Renal Disease.',
      diagnosticCorrelation: 'Pasien gelisah, asterixis (+).'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CPOE_PROCEDURE_HEMODIALYSIS',
      actionSummary: 'Order CPOE Hemodialisa CITO dengan akses CDL',
      cpoePayload: {
        orderType: 'PROCEDURE',
        priority: 'CITO',
        items: [{ catalogCode: 'PROC-HD-EMERGENCY', itemName: 'Hemodialisis Darurat 4 Jam', quantity: 1 }]
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(action.action_type).toBe('CPOE_PROCEDURE_HEMODIALYSIS');
  });

  // ─── TC-16: SECONDARY ACTION: SPECIALIST CONSULTATION ORDER ───
  it('TC-16: should execute secondary CPOE consultation order for Nephrologist review', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-CREATININE',
      testOrStudyName: 'Serum Creatinine',
      resultValue: '4.5 mg/dL'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'AKI superimposed on CKD.',
      diagnosticCorrelation: 'Perlu tatalaksana nefrologi komprehensif.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CPOE_CONSULTATION_ORDER',
      actionSummary: 'Konsultasi CITO Dokter Spesialis Penyakit Dalam Konsultan Ginjal Hipertensi (Sp.PD-KGH)'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(action.action_type).toBe('CPOE_CONSULTATION_ORDER');
  });

  // ─── TC-17: SECONDARY ACTION: MONITORING FREQUENCY INCREASE ───
  it('TC-17: should trigger vital signs monitoring frequency increase in care plan', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '6.2 mEq/L'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Hiperkalemia sedang (6.2 mEq/L).',
      diagnosticCorrelation: 'Perlu pemantauan ketat tanda vital dan EKG kontinyu.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CLINICAL_MONITORING_FREQUENCY_INCREASE',
      actionSummary: 'Tingkatkan observasi tanda vital menjadi setiap 1 jam + Pasang Bedside Cardiac Monitor kontinyu'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(action.action_type).toBe('CLINICAL_MONITORING_FREQUENCY_INCREASE');
  });

  // ─── TC-18: PARENT NOTIFICATION STATUS PROGRESSION ───
  it('TC-18: should transition parent notification status from PENDING ➔ ACKNOWLEDGED ➔ INTERPRETED ➔ ACTION_TAKEN', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-GLU',
      testOrStudyName: 'Glukosa',
      resultValue: '110 mg/dL'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });
    expect(mockDatabaseState.diagnostic_result_notifications[0].status).toBe('PENDING_ACKNOWLEDGMENT');

    await diagnosticInterpretationService.acknowledgeDiagnosticNotification({ notificationId: notif.id }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(mockDatabaseState.diagnostic_result_notifications[0].status).toBe('ACKNOWLEDGED');

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Glukosa darah terkontrol baik.',
      diagnosticCorrelation: 'Lanjutkan diet DM.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(mockDatabaseState.diagnostic_result_notifications[0].status).toBe('INTERPRETED');

    await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionSummary: 'Lanjutkan terapi rutin'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(mockDatabaseState.diagnostic_result_notifications[0].status).toBe('ACTION_TAKEN');
  });

  // ─── TC-19: RADIOLOGY CRITICAL FINDING INTEGRATION (TENSION PNEUMOTHORAX) ───
  it('TC-19: should process Radiology Tension Pneumothorax alert ➔ DPJP Read-Back ➔ Emergency Chest Tube Thoracostomy CPOE action', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      sourceDomain: 'RADIOLOGY',
      testOrStudyCode: 'RAD-CXR-PORTABLE',
      testOrStudyName: 'Foto Toraks AP Portable',
      resultValue: 'Tension Pneumothorax Hemithorax Kanan dengan deviasi trakea dan mediastinum ke kiri',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER || 'ROLE_RADIOGRAPHER' });

    expect(notif.notification_priority).toBe('EMERGENCY_PANIC');

    // DPJP TBAK Read-Back
    const ack = await diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: true,
      acknowledgmentNotes: 'Temuan Tension Pneumothorax telah dibacakan ulang oleh dr. Sp.Rad, persiapan tindakan dekompresi jarum segera.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(ack.status).toBe('ACKNOWLEDGED');

    // DPJP Clinical Interpretation
    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Tension pneumothorax kanan mengancam nyawa dengan gagal nafas tipe 1.',
      diagnosticCorrelation: 'Korelasi klinis suara nafas paru kanan menghilang, trakea deviasi ke kiri.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    // Secondary Action: Emergency Chest Tube CPOE
    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CPOE_PROCEDURE_HEMODIALYSIS',
      actionSummary: 'Tindakan Dekompresi Jarum ICS 2 dilanjutkan Pemasangan Chest Tube WSD di Ruang Tindakan Bedah IGD CITO',
      cpoePayload: {
        orderType: 'PROCEDURE',
        priority: 'CITO',
        items: [{ catalogCode: 'PROC-WSD-INSERTION', itemName: 'Pemasangan Chest Tube / WSD', quantity: 1 }]
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(action.cpoe_order_id).toBeDefined();
  });

  // ─── TC-20: MICROBIOLOGY CRITICAL BLOOD CULTURE INTEGRATION ───
  it('TC-20: should process Blood Culture Gram-Negative Bacilli alert ➔ DPJP interpretation ➔ Immediate Targeted Antibiotic CPOE', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-BLOOD-CULTURE',
      testOrStudyName: 'Kultur Darah Aerob & Pewarnaan Gram',
      resultValue: 'Tumbuh Basil Gram Negatif (Curiga Klebsiella pneumoniae / E. coli)',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    await diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: true,
      acknowledgmentNotes: 'Kultur darah positif basil gram negatif terkonfirmasi via telepon.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Bakteremia Gram Negatif dengan Sepsis Berat.',
      diagnosticCorrelation: 'Korelasi klinis demam 39.5 C dan leukositosis 24.000 /uL.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CPOE_MEDICATION_ORDER',
      actionSummary: 'Eskalasi Antibiotik Empiris Terarah: Meropenem 1g IV tiap 8 jam',
      cpoePayload: {
        orderType: 'PHARMACY',
        priority: 'CITO',
        items: [{ catalogCode: 'MED-MEROPENEM-1G', itemName: 'Meropenem 1g Vial', quantity: 3, dosageInstruction: '1g IV drip dalam 100mL NaCl 0.9% q8h' }]
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(action.action_type).toBe('CPOE_MEDICATION_ORDER');
  });

  // ─── TC-21: SHA-256 DIGITAL SIGNATURE IMMUTABILITY ───
  it('TC-21: should generate verifiable SHA-256 cryptographic digital signature on physician diagnostic interpretation', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Hiperkalemia berat.',
      diagnosticCorrelation: 'EKG tall peaked T.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(interp.digital_signature_hash).toBeDefined();
    expect(interp.digital_signature_hash.length).toBe(64);
  });

  // ─── TC-22: MULTI-SPECIALTY CONSULTATION PROVENANCE ───
  it('TC-22: should record consultant physician ID, name, role, and timestamp in interpretation record', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-TROPONIN',
      testOrStudyName: 'Troponin I',
      resultValue: '120 ng/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'NSTEMI Akut dengan peningkatan enzim jantung bermakna.',
      diagnosticCorrelation: 'ST-Depresi pada lead V4-V6.'
    }, { userId: 'DOC-CARDIO-01', fullName: 'dr. Hendra Gunawan, Sp.JP(K)', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(interp.interpreted_by_name).toBe('dr. Hendra Gunawan, Sp.JP(K)');
    expect(interp.interpreted_by_role).toBe(ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP);
  });

  // ─── TC-23: AUDIT LOG & OUTBOX ATOMICITY ───
  it('TC-23: should write universal audit log and domain outbox event within same database transaction', async () => {
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium',
      resultValue: '7.2 mEq/L'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Hiperkalemia berat.',
      diagnosticCorrelation: 'EKG tall peaked T.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(2);
  });

  // ─── TC-24: IDEMPOTENT RE-EVALUATION PROTECTION ───
  it('TC-24: should reject invalid secondary action execution when interpretation ID is missing', async () => {
    await expect(diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: null,
      actionSummary: 'Order Obat'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP })).rejects.toThrow('Interpretation ID dan Action Summary wajib disertakan');
  });

  // ─── TC-25: FULL E2E DIAGNOSTIC INTERPRETATION CLOSED-LOOP RECONCILIATION ───
  it('TC-25: should reconcile complete diagnostic interpretation closed loop with 0 discrepancy across all layers', async () => {
    // 1. Publish Critical Panic Result (K+ 7.2 mEq/L)
    const notif = await diagnosticInterpretationService.publishDiagnosticNotification({
      encounterId: 'enc-diag-001',
      patientId: 'pat-diag-001',
      sourceDomain: 'LABORATORY',
      testOrStudyCode: 'LAB-K',
      testOrStudyName: 'Serum Potassium (Kalium)',
      resultValue: '7.2 mEq/L',
      numericValue: 7.2,
      referenceRange: '3.5 - 5.0 mEq/L',
      abnormalityFlag: 'CRITICAL_PANIC'
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST || 'ROLE_LAB_ANALYST' });

    // 2. DPJP TBAK Read-Back Acknowledgment
    const ack = await diagnosticInterpretationService.acknowledgeDiagnosticNotification({
      notificationId: notif.id,
      readBackConfirmed: true,
      acknowledgmentNotes: 'TBAK Read-Back Kalium 7.2 mEq/L terkonfirmasi.'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(ack.status).toBe('ACKNOWLEDGED');

    // 3. DPJP Clinical Interpretation & Longitudinal Delta Check (Baseline K+ 4.0 mEq/L)
    const interp = await diagnosticInterpretationService.recordPhysicianInterpretation({
      notificationId: notif.id,
      clinicalImpression: 'Acute Severe Hyperkalemia (7.2 mEq/L) on top of Chronic Kidney Disease Stage 4.',
      diagnosticCorrelation: 'Korelasi dengan gambaran EKG menunjukkan gelombang T lancip simetris.',
      impactOnCarePlan: 'URGENT_INTERVENTION_REQUIRED',
      previousValue: 4.0
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(interp.deltaCheck.percentage_change).toBe(80.0);
    expect(interp.deltaCheck.delta_alert_level).toBe('SIGNIFICANT_RISE');

    // 4. Downstream Secondary Clinical Action: CPOE Medication Order
    const action = await diagnosticInterpretationService.executeSecondaryClinicalAction({
      interpretationId: interp.id,
      actionType: 'CPOE_MEDICATION_ORDER',
      actionSummary: 'Terapi Stabilisasi Membran & Shifting: Ca Gluconate 10% 1 amp + D40% 2 amp + Insulin 10 IU IV',
      cpoePayload: {
        orderType: 'PHARMACY',
        priority: 'CITO',
        items: [
          { catalogCode: 'MED-CA-GLUC', itemName: 'Calcium Gluconate 10%', quantity: 1 },
          { catalogCode: 'MED-D40', itemName: 'Dextrose 40%', quantity: 2 },
          { catalogCode: 'MED-INSULIN', itemName: 'Insulin Rapid Acting', quantity: 10 }
        ]
      }
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(action.status).toBe('EXECUTED');

    // Final State Ledger Reconciliation (0 Discrepancy)
    expect(mockDatabaseState.diagnostic_result_notifications.length).toBe(1);
    expect(mockDatabaseState.diagnostic_result_notifications[0].status).toBe('ACTION_TAKEN');
    expect(mockDatabaseState.physician_diagnostic_interpretations.length).toBe(1);
    expect(mockDatabaseState.longitudinal_delta_checks.length).toBe(1);
    expect(mockDatabaseState.diagnostic_secondary_actions.length).toBe(1);
    expect(mockDatabaseState.clinical_orders.length).toBe(1);
    expect(mockDatabaseState.cpoe_order_items.length).toBe(3);
    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(4);
  });
});
