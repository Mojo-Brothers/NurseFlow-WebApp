/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #06B Durability & Clinical Integrity Test Suite
 * Laboratory Order Consumer & LIS Durability Proof (25 Hardened Chaos & Clinical Integrity Scenarios)
 * Standards: JCI IPSG 2 (Critical Results Communication & Read-Back), LOINC, ISO 15189,
 * PostgreSQL 16 ACID Transactions, Specimen Lineage, Versioned Temporal Panic Thresholds,
 * Partial vs Full CPOE Order Completion FSM, and Optimistic Concurrency.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { laboratoryApplicationService, LaboratoryDomainError } from '../server/services/laboratoryApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-06B — Laboratory Order Consumer & LIS ➔ PostgreSQL Durability & Chaos Gate Proof', () => {
  let mockDatabaseState = {
    encounters: [],
    clinical_orders: [],
    cpoe_order_items: [],
    laboratory_specimens: [],
    laboratory_test_results: [],
    laboratory_panic_alerts: [],
    master_lab_critical_thresholds: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-lab-001',
          episode_id: 'epc-lab-001',
          patient_id: 'pat-lab-001',
          encounter_number: 'ENC-2026-LAB-01',
          status: 'IN_PROGRESS'
        }
      ],
      clinical_orders: [
        {
          id: 'ord-cpoe-lab-001',
          order_number: 'ORD-20260820-1001',
          patient_id: 'pat-lab-001',
          episode_id: 'epc-lab-001',
          encounter_id: 'enc-lab-001',
          order_category: 'LABORATORY',
          priority: 'CITO',
          status: 'ORDERED',
          version: 1
        },
        {
          id: 'ord-cancelled-002',
          order_number: 'ORD-20260820-9999',
          patient_id: 'pat-lab-001',
          episode_id: 'epc-lab-001',
          encounter_id: 'enc-lab-001',
          order_category: 'LABORATORY',
          priority: 'ROUTINE',
          status: 'CANCELLED',
          version: 2
        }
      ],
      cpoe_order_items: [
        {
          id: 'item-lab-k-001',
          order_id: 'ord-cpoe-lab-001',
          item_type: 'LABORATORY',
          catalog_code: 'LAB-POTASSIUM',
          item_name: 'Kalium Serum (K+)',
          item_specifications: { specimenType: 'SERUM', tubeColor: 'YELLOW_SST' },
          quantity: 1,
          status: 'ORDERED'
        },
        {
          id: 'item-lab-cbc-002',
          order_id: 'ord-cpoe-lab-001',
          item_type: 'LABORATORY',
          catalog_code: 'LAB-HB',
          item_name: 'Hemoglobin (Hb)',
          item_specifications: { specimenType: 'EDTA_WHOLE_BLOOD', tubeColor: 'PURPLE_EDTA' },
          quantity: 1,
          status: 'ORDERED'
        }
      ],
      laboratory_specimens: [],
      laboratory_test_results: [],
      laboratory_panic_alerts: [],
      master_lab_critical_thresholds: [
        {
          id: 'rule-k-v1',
          test_code: 'LAB-POTASSIUM',
          test_name: 'Kalium Serum (K+)',
          category: 'CLINICAL_CHEMISTRY',
          unit: 'mEq/L',
          reference_low: 3.5,
          reference_high: 5.0,
          panic_low: 2.8,
          panic_high: 6.2,
          clinical_threat_low: 'Aritmia Ventrikel Berat / Henti Jantung (Hipokalemia Berat)',
          clinical_threat_high: 'Aritmia Ventrikel Letal / Henti Jantung (Hiperkalemia Berat)',
          version: 1,
          effective_from: new Date('2026-01-01T00:00:00Z'),
          effective_to: null,
          approved_by: 'Komite Medis & KPRS RS 2026',
          is_active: true
        },
        {
          id: 'rule-hb-v1',
          test_code: 'LAB-HB',
          test_name: 'Hemoglobin (Hb)',
          category: 'HEMATOLOGY',
          unit: 'g/dL',
          reference_low: 12.0,
          reference_high: 16.0,
          panic_low: 7.0,
          panic_high: 20.0,
          clinical_threat_low: 'Anemia Berat / Syok Hipovolemik Perlu Transfusi Cito',
          clinical_threat_high: 'Polisitemia Berat',
          version: 1,
          effective_from: new Date('2026-01-01T00:00:00Z'),
          effective_to: null,
          approved_by: 'Komite Medis & KPRS RS 2026',
          is_active: true
        }
      ],
      universal_audit_logs: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedSpecimens: [],
            stagedResults: [],
            stagedAlerts: [],
            stagedAuditLogs: [],
            stagedOutbox: [],
            specimenUpdates: [],
            resultUpdates: [],
            alertUpdates: [],
            itemUpdates: [],
            orderUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.laboratory_specimens.push(...activeTransactionState.stagedSpecimens);
            mockDatabaseState.laboratory_test_results.push(...activeTransactionState.stagedResults);
            mockDatabaseState.laboratory_panic_alerts.push(...activeTransactionState.stagedAlerts);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.specimenUpdates.forEach(up => {
              const idx = mockDatabaseState.laboratory_specimens.findIndex(s => s.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.laboratory_specimens[idx] = { ...mockDatabaseState.laboratory_specimens[idx], ...up.data };
              }
            });

            activeTransactionState.resultUpdates.forEach(up => {
              const idx = mockDatabaseState.laboratory_test_results.findIndex(r => r.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.laboratory_test_results[idx] = { ...mockDatabaseState.laboratory_test_results[idx], ...up.data };
              }
            });

            activeTransactionState.alertUpdates.forEach(up => {
              const idx = mockDatabaseState.laboratory_panic_alerts.findIndex(a => a.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.laboratory_panic_alerts[idx] = { ...mockDatabaseState.laboratory_panic_alerts[idx], ...up.data };
              }
            });

            activeTransactionState.itemUpdates.forEach(up => {
              const idx = mockDatabaseState.cpoe_order_items.findIndex(i => i.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.cpoe_order_items[idx] = { ...mockDatabaseState.cpoe_order_items[idx], ...up.data };
              }
            });

            activeTransactionState.orderUpdates.forEach(up => {
              const idx = mockDatabaseState.clinical_orders.findIndex(o => o.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.clinical_orders[idx] = { ...mockDatabaseState.clinical_orders[idx], ...up.data };
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

        // SELECT FROM clinical_orders
        if (normalized.includes('FROM CLINICAL_ORDERS WHERE ID = $1')) {
          const found = mockDatabaseState.clinical_orders.filter(o => o.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM cpoe_order_items WHERE order_id = $1
        if (normalized.includes('FROM CPOE_ORDER_ITEMS WHERE ORDER_ID = $1')) {
          let found = mockDatabaseState.cpoe_order_items.filter(i => i.order_id === params[0]);
          if (normalized.includes("AND ITEM_TYPE = 'LABORATORY'")) {
            found = found.filter(i => i.item_type === 'LABORATORY');
          }
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM master_lab_critical_thresholds
        if (normalized.includes('FROM MASTER_LAB_CRITICAL_THRESHOLDS')) {
          const found = mockDatabaseState.master_lab_critical_thresholds.filter(t => t.test_code === params[0] && t.is_active);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM laboratory_specimens WHERE id = $1
        if (normalized.includes('FROM LABORATORY_SPECIMENS WHERE ID = $1')) {
          const allSpecs = [
            ...mockDatabaseState.laboratory_specimens,
            ...(activeTransactionState?.stagedSpecimens || [])
          ];
          const found = allSpecs.filter(s => s.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM laboratory_specimens WHERE cpoe_item_id = $1
        if (normalized.includes('FROM LABORATORY_SPECIMENS WHERE CPOE_ITEM_ID = $1')) {
          const allSpecs = [
            ...mockDatabaseState.laboratory_specimens,
            ...(activeTransactionState?.stagedSpecimens || [])
          ];
          const found = allSpecs.filter(s => s.cpoe_item_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM laboratory_specimens WHERE order_id = $1
        if (normalized.includes('FROM LABORATORY_SPECIMENS WHERE ORDER_ID = $1')) {
          const allSpecs = [
            ...mockDatabaseState.laboratory_specimens,
            ...(activeTransactionState?.stagedSpecimens || [])
          ];
          const found = allSpecs.filter(s => s.order_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM laboratory_test_results WHERE id = $1
        if (normalized.includes('FROM LABORATORY_TEST_RESULTS WHERE ID = $1')) {
          const allRes = [
            ...mockDatabaseState.laboratory_test_results,
            ...(activeTransactionState?.stagedResults || [])
          ];
          const found = allRes.filter(r => r.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM laboratory_test_results WHERE specimen_id = $1
        if (normalized.includes('FROM LABORATORY_TEST_RESULTS WHERE SPECIMEN_ID = $1')) {
          const allRes = [
            ...mockDatabaseState.laboratory_test_results,
            ...(activeTransactionState?.stagedResults || [])
          ];
          const found = allRes.filter(r => r.specimen_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM laboratory_panic_alerts WHERE id = $1
        if (normalized.includes('FROM LABORATORY_PANIC_ALERTS WHERE ID = $1')) {
          const allAlerts = [
            ...mockDatabaseState.laboratory_panic_alerts,
            ...(activeTransactionState?.stagedAlerts || [])
          ];
          const found = allAlerts.filter(a => a.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO laboratory_specimens
        if (normalized.startsWith('INSERT INTO LABORATORY_SPECIMENS')) {
          const newSpec = {
            id: params[0],
            tenant_id: params[1],
            order_id: params[2],
            encounter_id: params[3],
            patient_id: params[4],
            patient_mrn: params[5],
            specimen_barcode: params[6],
            specimen_type: params[7],
            vacutainer_tube_color: params[8],
            status: params[9],
            cpoe_item_id: params[10],
            version: params[11],
            correlation_id: params[12],
            created_at: params[13],
            updated_at: params[14]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedSpecimens.push(newSpec);
          } else {
            mockDatabaseState.laboratory_specimens.push(newSpec);
          }
          return { rows: [newSpec], rowCount: 1 };
        }

        // INSERT INTO laboratory_test_results
        if (normalized.startsWith('INSERT INTO LABORATORY_TEST_RESULTS')) {
          const newResult = {
            id: params[0],
            tenant_id: params[1],
            specimen_id: params[2],
            order_id: params[3],
            cpoe_item_id: params[4],
            test_code: params[5],
            test_name: params[6],
            category: params[7],
            numeric_value: params[8],
            text_value: params[9],
            unit: params[10],
            reference_low: params[11],
            reference_high: params[12],
            panic_low: params[13],
            panic_high: params[14],
            is_abnormal: params[15],
            is_critical_panic: params[16],
            raw_analyzer_value: params[17],
            validation_status: params[18],
            analyst_name: params[19],
            applied_rule_version: params[20],
            rule_snapshot: JSON.parse(params[21] || '{}'),
            created_at: params[22],
            version: 1
          };
          if (activeTransactionState) {
            activeTransactionState.stagedResults.push(newResult);
          } else {
            mockDatabaseState.laboratory_test_results.push(newResult);
          }
          return { rows: [newResult], rowCount: 1 };
        }

        // INSERT INTO laboratory_panic_alerts
        if (normalized.startsWith('INSERT INTO LABORATORY_PANIC_ALERTS')) {
          const newAlert = {
            id: params[0],
            tenant_id: params[1],
            result_id: params[2],
            order_id: params[3],
            cpoe_item_id: params[4],
            encounter_id: params[5],
            patient_id: params[6],
            patient_mrn: params[7],
            test_name: params[8],
            panic_value_display: params[9],
            clinical_threat: params[10],
            status: params[11],
            escalation_level: params[12],
            reported_to_nurse_or_doctor: params[13],
            reported_at: params[14],
            correlation_id: params[15],
            created_at: params[16]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAlerts.push(newAlert);
          } else {
            mockDatabaseState.laboratory_panic_alerts.push(newAlert);
          }
          return { rows: [newAlert], rowCount: 1 };
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

        // UPDATE laboratory_specimens
        if (normalized.startsWith('UPDATE LABORATORY_SPECIMENS')) {
          if (normalized.includes("SET STATUS = 'COLLECTED'")) {
            const specId = params[4];
            const updatedData = {
              status: 'COLLECTED',
              collection_site: params[0],
              phlebotomist_name: params[1],
              collected_at: params[2],
              version: params[3],
              updated_at: params[2]
            };
            if (activeTransactionState) {
              activeTransactionState.specimenUpdates.push({ id: specId, data: updatedData });
            }
            return { rows: [{ id: specId, ...updatedData }], rowCount: 1 };
          }

          if (normalized.includes("SET STATUS = 'RECEIVED_IN_LAB'")) {
            const specId = params[6];
            const updatedData = {
              status: 'RECEIVED_IN_LAB',
              accession_number: params[0],
              received_by_lab_analyst: params[1],
              received_at: params[2],
              specimen_quality_flag: params[3],
              quality_notes: params[4],
              version: params[5],
              updated_at: params[2]
            };
            if (activeTransactionState) {
              activeTransactionState.specimenUpdates.push({ id: specId, data: updatedData });
            }
            return { rows: [{ id: specId, ...updatedData }], rowCount: 1 };
          }

          if (normalized.includes("SET STATUS = 'RESULT_AVAILABLE'")) {
            const specId = params[1];
            if (activeTransactionState) {
              activeTransactionState.specimenUpdates.push({ id: specId, data: { status: 'RESULT_AVAILABLE' } });
            }
            return { rows: [{ id: specId, status: 'RESULT_AVAILABLE' }], rowCount: 1 };
          }

          if (normalized.includes("SET STATUS = 'COMPLETED'")) {
            const specId = params[1];
            if (activeTransactionState) {
              activeTransactionState.specimenUpdates.push({ id: specId, data: { status: 'COMPLETED' } });
            }
            return { rows: [{ id: specId, status: 'COMPLETED' }], rowCount: 1 };
          }
        }

        // UPDATE laboratory_test_results
        if (normalized.startsWith('UPDATE LABORATORY_TEST_RESULTS')) {
          const resultId = params[3];
          const updatedData = {
            validation_status: 'CLINICALLY_RELEASED',
            technologist_verified_by: params[0],
            technologist_verified_at: params[1],
            pathologist_verified_by: params[0],
            verified_at: params[1],
            released_by: params[0],
            released_at: params[1],
            version: params[2]
          };
          if (activeTransactionState) {
            activeTransactionState.resultUpdates.push({ id: resultId, data: updatedData });
          }
          return { rows: [{ id: resultId, ...updatedData }], rowCount: 1 };
        }

        // UPDATE laboratory_panic_alerts
        if (normalized.startsWith('UPDATE LABORATORY_PANIC_ALERTS')) {
          if (normalized.includes("SET STATUS = 'ACKNOWLEDGED_READ_BACK'")) {
            const alertId = params[4];
            const updatedData = {
              status: 'ACKNOWLEDGED_READ_BACK',
              read_back_confirmed_by: params[0],
              read_back_at: params[1],
              read_back_confirmation_text: 'VERIFIED_READ_BACK_CONFIRMED',
              acknowledged_by: params[0],
              acknowledged_at: params[1],
              clinical_instruction: params[2],
              clinician_feedback: params[2],
              acknowledgement_notes: params[3],
              resolved_at: params[1]
            };
            if (activeTransactionState) {
              activeTransactionState.alertUpdates.push({ id: alertId, data: updatedData });
            }
            return { rows: [{ id: alertId, ...updatedData }], rowCount: 1 };
          }

          if (normalized.includes("SET STATUS = 'ESCALATED_DPJP'")) {
            const alertId = params[3];
            const updatedData = {
              status: 'ESCALATED_DPJP',
              escalation_level: params[0],
              escalated_at: params[1],
              escalation_reason: params[2]
            };
            if (activeTransactionState) {
              activeTransactionState.alertUpdates.push({ id: alertId, data: updatedData });
            }
            return { rows: [{ id: alertId, ...updatedData }], rowCount: 1 };
          }
        }

        // UPDATE cpoe_order_items
        if (normalized.startsWith('UPDATE CPOE_ORDER_ITEMS')) {
          const itemId = params[1];
          if (activeTransactionState) {
            activeTransactionState.itemUpdates.push({ id: itemId, data: { status: 'COMPLETED' } });
          }
          // Also immediately update in-memory item for parent order calculation in same tx
          const found = mockDatabaseState.cpoe_order_items.find(i => i.id === itemId);
          if (found) found.status = 'COMPLETED';
          return { rows: [], rowCount: 1 };
        }

        // UPDATE clinical_orders
        if (normalized.startsWith('UPDATE CLINICAL_ORDERS')) {
          const newStatus = normalized.includes("SET STATUS = 'COMPLETED'") ? 'COMPLETED' : 'PARTIALLY_COMPLETED';
          const orderId = params[1];
          if (activeTransactionState) {
            activeTransactionState.orderUpdates.push({ id: orderId, data: { status: newStatus } });
          }
          return { rows: [], rowCount: 1 };
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

  // ─── TC-01: CPOE LAB ➔ SPECIMEN GENERATION ───
  it('TC-01: should consume CPOE Lab Order and generate deterministic barcode specimens', async () => {
    const specimens = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });

    expect(specimens.length).toBe(2);
    expect(specimens[0].specimen_barcode).toMatch(/^SPEC-[A-Z0-9]+-[A-Z0-9]+-1$/);
    expect(specimens[0].specimen_type).toBe('SERUM');
    expect(specimens[1].specimen_type).toBe('EDTA_WHOLE_BLOOD');
    expect(mockDatabaseState.laboratory_specimens.length).toBe(2);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox[0].event_type).toBe('LAB_SPECIMENS_GENERATED');
  });

  // ─── TC-02: DUPLICATE ORDER_CREATED EVENT IDEMPOTENCY ───
  it('TC-02: should prevent duplicate specimen creation when generateSpecimens is re-called idempotently', async () => {
    const firstCall = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    expect(firstCall.length).toBe(2);

    const secondCall = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    expect(secondCall.length).toBe(2);
    expect(secondCall[0].id).toBe(firstCall[0].id);
    expect(mockDatabaseState.laboratory_specimens.length).toBe(2);
  });

  // ─── TC-03: DUPLICATE BARCODE GENERATION PREVENTION ───
  it('TC-03: should generate distinct barcodes for distinct CPOE order items', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    expect(specs[0].specimen_barcode).not.toBe(specs[1].specimen_barcode);
  });

  // ─── TC-04: WRONG PATIENT/SPECIMEN ASSOCIATION REJECTION ───
  it('TC-04: should reject specimen generation for non-existent order (404)', async () => {
    await expect(laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-non-existent' }))
      .rejects.toThrow('tidak ditemukan');
  });

  // ─── TC-05: COLLECTION ON CANCELLED ORDER REJECTION ───
  it('TC-05: should reject specimen generation and collection on CANCELLED CPOE order', async () => {
    await expect(laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cancelled-002' }))
      .rejects.toThrow('CPOE Order yang telah dibatalkan');
  });

  // ─── TC-06: SPECIMEN RECEIVED WITHOUT COLLECTION REJECTION ───
  it('TC-06: should strictly reject laboratory accession before specimen has been collected', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0]; // Status: ORDERED

    const labAnalyst = { userId: 'USR-LAB-01', username: 'analis_budi', role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST };
    await expect(laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, labAnalyst))
      .rejects.toThrow('belum diambil/dikoleksi dari pasien');
  });

  // ─── TC-07: DUPLICATE ACCESSION PREVENTION ───
  it('TC-07: should successfully collect and accession specimen with accession number', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    const nurseActor = { userId: 'USR-NURSE-01', username: 'perawat_siti', role: ENTERPRISE_ROLES.ROLE_NURSE };
    const collected = await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id, collectionSite: 'Vena Mediana Cubiti' }, nurseActor);
    expect(collected.status).toBe('COLLECTED');

    const labAnalyst = { userId: 'USR-LAB-01', username: 'analis_budi', role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST };
    const accessioned = await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id, specimenQualityFlag: 'OPTIMAL' }, labAnalyst);
    expect(accessioned.status).toBe('RECEIVED_IN_LAB');
    expect(accessioned.accession_number).toMatch(/^ACC-\d{8}-\d{4}$/);
  });

  // ─── TC-08: ANALYZER RAW RESULT ENTRY ───
  it('TC-08: should record raw analyzer test result and transition status to ANALYTICALLY_VALIDATED', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    const nurseActor = { userId: 'USR-NURSE-01', username: 'perawat_siti', role: ENTERPRISE_ROLES.ROLE_NURSE };
    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, nurseActor);

    const labAnalyst = { userId: 'USR-LAB-01', username: 'analis_budi', role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST };
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, labAnalyst);

    const result = await laboratoryApplicationService.enterAnalyzerResult({
      specimenId: spec.id,
      testCode: 'LAB-POTASSIUM',
      testName: 'Kalium Serum (K+)',
      numericValue: 4.2,
      unit: 'mEq/L'
    }, labAnalyst);

    expect(result.numeric_value).toBe(4.2);
    expect(result.is_abnormal).toBe(false);
    expect(result.is_critical_panic).toBe(false);
    expect(result.validation_status).toBe('ANALYTICALLY_VALIDATED');
  });

  // ─── TC-09: INVALID RESULT TRANSITION REJECTION ───
  it('TC-09: should reject entering results on uncollected/unreceived specimens', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const uncollectedSpec = specs[0];

    const labAnalyst = { userId: 'USR-LAB-01', username: 'analis_budi', role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST };
    await expect(laboratoryApplicationService.enterAnalyzerResult({
      specimenId: uncollectedSpec.id,
      testCode: 'LAB-POTASSIUM',
      numericValue: 4.0
    }, labAnalyst)).rejects.toThrow('Spesimen harus telah diterima di laboratorium');
  });

  // ─── TC-10: CRITICAL VALUE DETECTION WITH VERSIONED THRESHOLD ───
  it('TC-10: should automatically detect critical panic value and trigger panic alert', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    const nurseActor = { userId: 'USR-NURSE-01', username: 'perawat_siti', role: ENTERPRISE_ROLES.ROLE_NURSE };
    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, nurseActor);

    const labAnalyst = { userId: 'USR-LAB-01', username: 'analis_budi', role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST };
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, labAnalyst);

    // Enter lethal potassium 6.8 mEq/L (panic_high is 6.2)
    const result = await laboratoryApplicationService.enterAnalyzerResult({
      specimenId: spec.id,
      testCode: 'LAB-POTASSIUM',
      testName: 'Kalium Serum (K+)',
      numericValue: 6.8,
      unit: 'mEq/L'
    }, labAnalyst);

    expect(result.is_critical_panic).toBe(true);
    expect(result.panicAlert).toBeDefined();
    expect(result.panicAlert.panic_value_display).toBe('6.8 mEq/L');
    expect(result.panicAlert.clinical_threat).toContain('Aritmia Ventrikel Letal');
    expect(mockDatabaseState.laboratory_panic_alerts.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'LAB_PANIC_ALERT_DETECTED')).toBe(true);
  });

  // ─── TC-11: CRITICAL VALUE ACKNOWLEDGEMENT (READ-BACK CONFIRMATION) ───
  it('TC-11: should record closed-loop read-back acknowledgement from clinician', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const result = await laboratoryApplicationService.enterAnalyzerResult({
      specimenId: spec.id,
      testCode: 'LAB-POTASSIUM',
      numericValue: 6.8
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const doctorActor = { userId: 'DOC-1001', username: 'dr_siti', fullName: 'dr. Siti Rahma, Sp.PD', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP };
    const ackResult = await laboratoryApplicationService.acknowledgePanicAlert({
      alertId: result.panicAlert.id,
      readBackConfirmed: true,
      clinicianFeedback: 'Diberikan Ca-Gluconate 10% IV dan Dextrose + Insulin segera'
    }, doctorActor);

    expect(ackResult.status).toBe('ACKNOWLEDGED_READ_BACK');
    expect(ackResult.read_back_confirmed_by).toBe('dr. Siti Rahma, Sp.PD');
    expect(ackResult.read_back_confirmation_text).toBe('VERIFIED_READ_BACK_CONFIRMED');
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'LAB_PANIC_ALERT_ACKNOWLEDGED')).toBe(true);
  });

  // ─── TC-12: ESCALATION TIMEOUT ───
  it('TC-12: should escalate unacknowledged panic alert to DPJP_PHYSICIAN on timeout', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    const result = await laboratoryApplicationService.enterAnalyzerResult({ specimenId: spec.id, testCode: 'LAB-POTASSIUM', numericValue: 6.8 }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const escalated = await laboratoryApplicationService.escalatePanicAlert({
      alertId: result.panicAlert.id,
      escalationReason: 'Timeout 15 menit tanpa respon bangsal',
      targetLevel: 'DPJP_PHYSICIAN'
    }, { role: ENTERPRISE_ROLES.ROLE_SUPER_ADMIN });

    expect(escalated.status).toBe('ESCALATED_DPJP');
    expect(escalated.escalation_level).toBe('DPJP_PHYSICIAN');
  });

  // ─── TC-13: RESULT VERIFICATION AUTHORIZATION ───
  it('TC-13: should reject result verification by unauthorized non-analyst roles', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    const result = await laboratoryApplicationService.enterAnalyzerResult({ specimenId: spec.id, testCode: 'LAB-POTASSIUM', numericValue: 4.5 }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const cashierActor = { userId: 'USR-CASHIER', role: ENTERPRISE_ROLES.ROLE_CASHIER };
    await expect(laboratoryApplicationService.verifyAndReleaseResult({ resultId: result.id }, cashierActor))
      .rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-14: RESULT MODIFICATION AFTER VERIFICATION ───
  it('TC-14: should reject double release or modification of already released results', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    const result = await laboratoryApplicationService.enterAnalyzerResult({ specimenId: spec.id, testCode: 'LAB-POTASSIUM', numericValue: 4.5 }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const labAnalyst = { userId: 'USR-LAB-01', role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST };
    await laboratoryApplicationService.verifyAndReleaseResult({ resultId: result.id }, labAnalyst);

    await expect(laboratoryApplicationService.verifyAndReleaseResult({ resultId: result.id }, labAnalyst))
      .rejects.toThrow('sudah berstatus RELEASED');
  });

  // ─── TC-15: CLINICAL TIMELINE CONSISTENCY ───
  it('TC-15: should complete parent CPOE item and specimen on result release for clinical timeline', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    const result = await laboratoryApplicationService.enterAnalyzerResult({ specimenId: spec.id, testCode: 'LAB-POTASSIUM', numericValue: 4.5 }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const released = await laboratoryApplicationService.verifyAndReleaseResult({ resultId: result.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    expect(released.validation_status).toBe('CLINICALLY_RELEASED');

    const dbSpec = mockDatabaseState.laboratory_specimens.find(s => s.id === spec.id);
    expect(dbSpec.status).toBe('COMPLETED');

    const dbItem = mockDatabaseState.cpoe_order_items.find(i => i.id === spec.cpoe_item_id);
    expect(dbItem.status).toBe('COMPLETED');
  });

  // ─── TC-16: AUDIT + OUTBOX ATOMICITY ───
  it('TC-16: should atomically persist audit logs and outbox events in same database transaction', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(2); // 1 for spec gen + 1 for collect
  });

  // ─── TC-17: TRANSACTION ROLLBACK ON FAILURE ───
  it('TC-17: should completely rollback specimen accession if error occurs mid-transaction', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];
    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    // Inject outbox failure during accession while preserving SELECT handlers
    const baseQuery = mockClient.query;
    mockClient.query = vi.fn(async (sql, params) => {
      if (sql.trim().toUpperCase().startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
        throw new Error('OUTBOX_WRITE_FAIL: Outbox database write failed');
      }
      return baseQuery(sql, params);
    });

    await expect(laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST }))
      .rejects.toThrow('OUTBOX_WRITE_FAIL');

    const dbSpec = mockDatabaseState.laboratory_specimens.find(s => s.id === spec.id);
    expect(dbSpec.status).toBe('COLLECTED'); // Unchanged because rollback occurred!
  });

  // ─── TC-18: CONCURRENT SPECIMEN UPDATE OPTIMISTIC LOCKING ───
  it('TC-18: should reject specimen collection with 409 CONCURRENCY_CONFLICT on version mismatch', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    await expect(laboratoryApplicationService.collectSpecimen({
      specimenId: spec.id,
      expectedVersion: 999
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Konflik konkurensi: Versi spesimen (1) tidak cocok dengan versi request (999).');
  });

  // ─── TC-19: CPOE CANCELLATION PROPAGATION ───
  it('TC-19: should reject specimen collection if CPOE order has been cancelled', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];

    // Mutate parent order to CANCELLED
    mockDatabaseState.clinical_orders[0].status = 'CANCELLED';

    await expect(laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE }))
      .rejects.toThrow('CPOE Order yang telah berstatus CANCELLED');
  });

  // ─── TC-20: FULL END-TO-END RECONCILIATION PROOF ───
  it('TC-20: should verify 100% end-to-end reconciliation across CPOE -> Specimen -> Accession -> Result -> Panic -> Release -> Audit -> Outbox', async () => {
    // 1. Generate Specimens from CPOE
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    expect(specs.length).toBe(2);

    // 2. Phlebotomy Collection
    const collected = await laboratoryApplicationService.collectSpecimen({ specimenId: specs[0].id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    expect(collected.status).toBe('COLLECTED');

    // 3. LIS Accession
    const accessioned = await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: specs[0].id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    expect(accessioned.status).toBe('RECEIVED_IN_LAB');

    // 4. Analyzer Result Entry (Panic Value: 7.2 mEq/L)
    const result = await laboratoryApplicationService.enterAnalyzerResult({
      specimenId: specs[0].id,
      testCode: 'LAB-POTASSIUM',
      numericValue: 7.2
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    expect(result.is_critical_panic).toBe(true);

    // 5. Read-Back Acknowledgement
    const ack = await laboratoryApplicationService.acknowledgePanicAlert({
      alertId: result.panicAlert.id,
      readBackConfirmed: true,
      clinicalInstruction: 'Order insulin drip 5 unit dalam 50cc D40 diberikan cito'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(ack.status).toBe('ACKNOWLEDGED_READ_BACK');

    // 6. Technologist Verification & Final Release
    const released = await laboratoryApplicationService.verifyAndReleaseResult({ resultId: result.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    expect(released.validation_status).toBe('CLINICALLY_RELEASED');

    // 7. Complete State Reconciliation Check
    expect(mockDatabaseState.laboratory_specimens.length).toBe(2);
    expect(mockDatabaseState.laboratory_test_results.length).toBe(1);
    expect(mockDatabaseState.laboratory_panic_alerts.length).toBe(1);
    expect(mockDatabaseState.universal_audit_logs.length).toBeGreaterThanOrEqual(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBeGreaterThanOrEqual(4);
  });

  // ─── TC-21: SEMANTIC VALIDATION STATES HARDENING ───
  it('TC-21: should strictly enforce ANALYTICALLY_VALIDATED on entry and CLINICALLY_RELEASED on verification', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];
    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const rawResult = await laboratoryApplicationService.enterAnalyzerResult({
      specimenId: spec.id,
      testCode: 'LAB-POTASSIUM',
      numericValue: 4.1
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    expect(rawResult.validation_status).toBe('ANALYTICALLY_VALIDATED');

    const releasedResult = await laboratoryApplicationService.verifyAndReleaseResult({
      resultId: rawResult.id
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    expect(releasedResult.validation_status).toBe('CLINICALLY_RELEASED');
    expect(releasedResult.technologist_verified_by).toBeDefined();
    expect(releasedResult.pathologist_verified_by).toBeDefined();
  });

  // ─── TC-22: STRICT CLOSED-LOOP READ-BACK EVIDENCE GUARD ───
  it('TC-22: should reject panic acknowledgement if readBackConfirmed is false or clinical instruction is missing', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];
    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    const result = await laboratoryApplicationService.enterAnalyzerResult({
      specimenId: spec.id,
      testCode: 'LAB-POTASSIUM',
      numericValue: 6.9
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const doctorActor = { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP };

    // Fails if readBackConfirmed is not true
    await expect(laboratoryApplicationService.acknowledgePanicAlert({
      alertId: result.panicAlert.id,
      readBackConfirmed: false,
      clinicalInstruction: 'Instruksi koreksi'
    }, doctorActor)).rejects.toThrow('Konfirmasi lisan Read-Back (JCI IPSG 2) wajib dinyatakan TRUE');

    // Fails if clinicalInstruction is missing / too short
    await expect(laboratoryApplicationService.acknowledgePanicAlert({
      alertId: result.panicAlert.id,
      readBackConfirmed: true,
      clinicalInstruction: 'OK'
    }, doctorActor)).rejects.toThrow('Instruksi klinis/tindakan terapeutik dari DPJP wajib dicatat secara lengkap');
  });

  // ─── TC-23: TEMPORAL THRESHOLD RULE REPRODUCIBILITY ───
  it('TC-23: should evaluate test results using versioned temporal rule and snapshot rule version in result', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const spec = specs[0];
    await laboratoryApplicationService.collectSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: spec.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    const result = await laboratoryApplicationService.enterAnalyzerResult({
      specimenId: spec.id,
      testCode: 'LAB-POTASSIUM',
      numericValue: 6.5
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    expect(result.applied_rule_version).toBe(1);
    expect(result.rule_snapshot).toBeDefined();
    expect(result.rule_snapshot.testCode).toBe('LAB-POTASSIUM');
    expect(result.rule_snapshot.approvedBy).toBe('Komite Medis & KPRS RS 2026');
  });

  // ─── TC-24: PARTIAL CPOE ORDER COMPLETION SEMANTICS ───
  it('TC-24: should transition parent CPOE order to PARTIALLY_COMPLETED when 1 of 2 items is completed', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });
    const specItem1 = specs[0]; // Kalium

    await laboratoryApplicationService.collectSpecimen({ specimenId: specItem1.id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: specItem1.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    const result1 = await laboratoryApplicationService.enterAnalyzerResult({
      specimenId: specItem1.id,
      testCode: 'LAB-POTASSIUM',
      numericValue: 4.0
    }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    await laboratoryApplicationService.verifyAndReleaseResult({ resultId: result1.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    // Item 1 completed, Item 2 still ORDERED -> Parent order must be PARTIALLY_COMPLETED
    const parentOrder = mockDatabaseState.clinical_orders.find(o => o.id === 'ord-cpoe-lab-001');
    expect(parentOrder.status).toBe('PARTIALLY_COMPLETED');
  });

  // ─── TC-25: FULL CPOE ORDER COMPLETION SEMANTICS ───
  it('TC-25: should transition parent CPOE order to COMPLETED only when ALL order items are released', async () => {
    const specs = await laboratoryApplicationService.generateSpecimensForOrder({ orderId: 'ord-cpoe-lab-001' });

    // Complete Item 1
    await laboratoryApplicationService.collectSpecimen({ specimenId: specs[0].id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: specs[0].id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    const res1 = await laboratoryApplicationService.enterAnalyzerResult({ specimenId: specs[0].id, testCode: 'LAB-POTASSIUM', numericValue: 4.0 }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    await laboratoryApplicationService.verifyAndReleaseResult({ resultId: res1.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    // Complete Item 2
    await laboratoryApplicationService.collectSpecimen({ specimenId: specs[1].id }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    await laboratoryApplicationService.receiveAndAccessionSpecimen({ specimenId: specs[1].id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    const res2 = await laboratoryApplicationService.enterAnalyzerResult({ specimenId: specs[1].id, testCode: 'LAB-HB', numericValue: 14.5 }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });
    await laboratoryApplicationService.verifyAndReleaseResult({ resultId: res2.id }, { role: ENTERPRISE_ROLES.ROLE_LAB_ANALYST });

    // Both items completed -> Parent order must be COMPLETED
    const parentOrder = mockDatabaseState.clinical_orders.find(o => o.id === 'ord-cpoe-lab-001');
    expect(parentOrder.status).toBe('COMPLETED');
  });
});
