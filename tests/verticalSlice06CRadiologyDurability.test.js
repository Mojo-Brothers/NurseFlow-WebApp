/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #06C Hardened Durability & Clinical Safety Test Suite
 * Radiology Order Consumer, RIS MWL, PACS DICOMweb & Critical Findings Durability Proof (25 Chaos Scenarios)
 * Standards: DICOM PS 3.10 / PS 3.18, JCI IPSG 2 (Critical Radiology Findings),
 * Multi-Attribute Demographic Patient Identity Lineage, DICOM UID Hierarchy Integrity,
 * Immutable Report Version History Preservation, Closed-Loop Communication Provenance,
 * Optimistic Concurrency Control, Partial vs Full CPOE Order Completion FSM, and SHA-256 Digital Signatures.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { radiologyApplicationService, RadiologyDomainError } from '../server/services/radiologyApplication.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-06C Hardened — Radiology RIS/PACS ➔ PostgreSQL Durability & Clinical Integrity Gate', () => {
  let mockDatabaseState = {
    encounters: [],
    clinical_orders: [],
    cpoe_order_items: [],
    radiology_orders: [],
    radiology_studies: [],
    radiology_series: [],
    radiology_instances: [],
    radiology_reports: [],
    radiology_report_versions: [],
    radiology_critical_finding_alerts: [],
    master_radiology_critical_findings: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-rad-001',
          episode_id: 'epc-rad-001',
          patient_id: 'pat-rad-001',
          encounter_number: 'ENC-2026-RAD-01',
          status: 'IN_PROGRESS'
        }
      ],
      clinical_orders: [
        {
          id: 'ord-cpoe-rad-001',
          order_number: 'ORD-20260820-2001',
          patient_id: 'pat-rad-001',
          episode_id: 'epc-rad-001',
          encounter_id: 'enc-rad-001',
          order_category: 'RADIOLOGY',
          priority: 'STAT_EMERGENCY',
          status: 'ORDERED',
          requester_id: 'DOC-RAD-REQ-01',
          requester_name: 'dr. Siti Rahma, Sp.PD',
          clinical_indication: 'Susp. Pneumothorax Desak Kanan pasca trauma toraks',
          version: 1
        },
        {
          id: 'ord-cancelled-rad-002',
          order_number: 'ORD-20260820-9998',
          patient_id: 'pat-rad-001',
          episode_id: 'epc-rad-001',
          encounter_id: 'enc-rad-001',
          order_category: 'RADIOLOGY',
          priority: 'ROUTINE',
          status: 'CANCELLED',
          version: 2
        }
      ],
      cpoe_order_items: [
        {
          id: 'item-rad-thorax-001',
          order_id: 'ord-cpoe-rad-001',
          item_type: 'RADIOLOGY',
          catalog_code: 'RAD-THORAX-PA',
          item_name: 'Foto Thorax PA / AP Cito',
          item_specifications: { modality: 'DX', bodyPart: 'CHEST' },
          quantity: 1,
          status: 'ORDERED'
        },
        {
          id: 'item-rad-ct-brain-002',
          order_id: 'ord-cpoe-rad-001',
          item_type: 'RADIOLOGY',
          catalog_code: 'RAD-CT-BRAIN-NC',
          item_name: 'CT Scan Kepala Non-Kontras Cito',
          item_specifications: { modality: 'CT', bodyPart: 'BRAIN' },
          quantity: 1,
          status: 'ORDERED'
        }
      ],
      radiology_orders: [],
      radiology_studies: [],
      radiology_series: [],
      radiology_instances: [],
      radiology_reports: [],
      radiology_report_versions: [],
      radiology_critical_finding_alerts: [],
      master_radiology_critical_findings: [
        {
          id: 'crit-rad-1',
          finding_code: 'RAD-CRIT-PNEUMO-TENSION',
          finding_name: 'Tension Pneumothorax dengan Deviasi Mediastinum',
          body_part: 'CHEST',
          modality: 'DX',
          clinical_threat: 'Kolaps Kardiovaskular / Syok Obstruktif Dekompensasi',
          urgency_level: 'STAT_IMMEDIATE',
          version: 1,
          effective_from: new Date('2026-01-01T00:00:00Z'),
          effective_to: null,
          approved_by: 'Komite Medis & KPRS RS 2026',
          is_active: true
        },
        {
          id: 'crit-rad-2',
          finding_code: 'RAD-CRIT-ICH',
          finding_name: 'Perdarahan Intrakranial Akut (ICH/SAH/EDH/SDH)',
          body_part: 'BRAIN',
          modality: 'CT',
          clinical_threat: 'Herniasi Serebral / Henti Nafas Sentral Letal',
          urgency_level: 'STAT_IMMEDIATE',
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
            stagedRadOrders: [],
            stagedStudies: [],
            stagedSeries: [],
            stagedInstances: [],
            stagedReports: [],
            stagedVersions: [],
            stagedAlerts: [],
            stagedAuditLogs: [],
            stagedOutbox: [],
            radOrderUpdates: [],
            studyUpdates: [],
            reportUpdates: [],
            alertUpdates: [],
            itemUpdates: [],
            orderUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.radiology_orders.push(...activeTransactionState.stagedRadOrders);
            mockDatabaseState.radiology_studies.push(...activeTransactionState.stagedStudies);
            mockDatabaseState.radiology_series.push(...activeTransactionState.stagedSeries);
            mockDatabaseState.radiology_instances.push(...activeTransactionState.stagedInstances);
            mockDatabaseState.radiology_reports.push(...activeTransactionState.stagedReports);
            mockDatabaseState.radiology_report_versions.push(...activeTransactionState.stagedVersions);
            mockDatabaseState.radiology_critical_finding_alerts.push(...activeTransactionState.stagedAlerts);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.radOrderUpdates.forEach(up => {
              const idx = mockDatabaseState.radiology_orders.findIndex(o => o.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.radiology_orders[idx] = { ...mockDatabaseState.radiology_orders[idx], ...up.data };
              }
            });

            activeTransactionState.studyUpdates.forEach(up => {
              const idx = mockDatabaseState.radiology_studies.findIndex(s => s.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.radiology_studies[idx] = { ...mockDatabaseState.radiology_studies[idx], ...up.data };
              }
            });

            activeTransactionState.reportUpdates.forEach(up => {
              const idx = mockDatabaseState.radiology_reports.findIndex(r => r.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.radiology_reports[idx] = { ...mockDatabaseState.radiology_reports[idx], ...up.data };
              }
            });

            activeTransactionState.alertUpdates.forEach(up => {
              const idx = mockDatabaseState.radiology_critical_finding_alerts.findIndex(a => a.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.radiology_critical_finding_alerts[idx] = { ...mockDatabaseState.radiology_critical_finding_alerts[idx], ...up.data };
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
          if (normalized.includes("AND ITEM_TYPE = 'RADIOLOGY'")) {
            found = found.filter(i => i.item_type === 'RADIOLOGY');
          }
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM radiology_orders WHERE cpoe_item_id = $1
        if (normalized.includes('FROM RADIOLOGY_ORDERS WHERE CPOE_ITEM_ID = $1')) {
          const allOrders = [
            ...mockDatabaseState.radiology_orders,
            ...(activeTransactionState?.stagedRadOrders || [])
          ];
          const found = allOrders.filter(o => o.cpoe_item_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM radiology_orders WHERE id = $1
        if (normalized.includes('FROM RADIOLOGY_ORDERS WHERE ID = $1')) {
          const allOrders = [
            ...mockDatabaseState.radiology_orders,
            ...(activeTransactionState?.stagedRadOrders || [])
          ];
          const found = allOrders.filter(o => o.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM radiology_studies WHERE study_instance_uid = $1
        if (normalized.includes('FROM RADIOLOGY_STUDIES WHERE STUDY_INSTANCE_UID = $1')) {
          const allStudies = [
            ...mockDatabaseState.radiology_studies,
            ...(activeTransactionState?.stagedStudies || [])
          ];
          const found = allStudies.filter(s => s.study_instance_uid === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM radiology_series WHERE series_instance_uid = $1
        if (normalized.includes('FROM RADIOLOGY_SERIES WHERE SERIES_INSTANCE_UID = $1')) {
          const allSeries = [
            ...mockDatabaseState.radiology_series,
            ...(activeTransactionState?.stagedSeries || [])
          ];
          const found = allSeries.filter(s => s.series_instance_uid === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM radiology_instances WHERE sop_instance_uid = $1
        if (normalized.includes('FROM RADIOLOGY_INSTANCES WHERE SOP_INSTANCE_UID = $1')) {
          const allInst = [
            ...mockDatabaseState.radiology_instances,
            ...(activeTransactionState?.stagedInstances || [])
          ];
          const found = allInst.filter(i => i.sop_instance_uid === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM radiology_studies WHERE id = $1
        if (normalized.includes('FROM RADIOLOGY_STUDIES WHERE ID = $1')) {
          const allStudies = [
            ...mockDatabaseState.radiology_studies,
            ...(activeTransactionState?.stagedStudies || [])
          ];
          const found = allStudies.filter(s => s.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM master_radiology_critical_findings WHERE finding_code = $1
        if (normalized.includes('FROM MASTER_RADIOLOGY_CRITICAL_FINDINGS WHERE FINDING_CODE = $1')) {
          const found = mockDatabaseState.master_radiology_critical_findings.filter(f => f.finding_code === params[0] && f.is_active);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM radiology_reports WHERE id = $1
        if (normalized.includes('FROM RADIOLOGY_REPORTS WHERE ID = $1')) {
          const allReports = [
            ...mockDatabaseState.radiology_reports,
            ...(activeTransactionState?.stagedReports || [])
          ];
          const found = allReports.filter(r => r.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM radiology_critical_finding_alerts WHERE id = $1
        if (normalized.includes('FROM RADIOLOGY_CRITICAL_FINDING_ALERTS WHERE ID = $1')) {
          const allAlerts = [
            ...mockDatabaseState.radiology_critical_finding_alerts,
            ...(activeTransactionState?.stagedAlerts || [])
          ];
          const found = allAlerts.filter(a => a.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO radiology_orders
        if (normalized.startsWith('INSERT INTO RADIOLOGY_ORDERS')) {
          const newOrder = {
            id: params[0],
            tenant_id: params[1],
            order_number: params[2],
            accession_number: params[3],
            patient_id: params[4],
            patient_mrn: params[5],
            patient_name: params[6],
            encounter_id: params[7],
            modality: params[8],
            examination_code: params[9],
            examination_name: params[10],
            priority: params[11],
            ordering_physician_id: params[12],
            ordering_physician_name: params[13],
            clinical_indication: params[14],
            status: params[15],
            cpoe_order_id: params[16],
            cpoe_item_id: params[17],
            version: params[18],
            correlation_id: params[19],
            created_at: params[20],
            updated_at: params[21]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedRadOrders.push(newOrder);
          } else {
            mockDatabaseState.radiology_orders.push(newOrder);
          }
          return { rows: [newOrder], rowCount: 1 };
        }

        // INSERT INTO radiology_studies
        if (normalized.startsWith('INSERT INTO RADIOLOGY_STUDIES')) {
          const newStudy = {
            id: params[0],
            tenant_id: params[1],
            order_id: params[2],
            encounter_id: params[3],
            patient_id: params[4],
            patient_mrn: params[5],
            study_instance_uid: params[6],
            accession_number: params[7],
            modality: params[8],
            body_part_examined: params[9],
            study_description: params[10],
            patient_position: params[11],
            referring_physician: params[12],
            performing_technologist: params[13],
            status: params[14],
            wado_rs_endpoint: params[15],
            cpoe_order_id: params[16],
            cpoe_item_id: params[17],
            version: params[18],
            correlation_id: params[19],
            patient_name: params[20],
            patient_birth_date: params[21],
            patient_sex: params[22],
            created_at: params[23],
            updated_at: params[24]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedStudies.push(newStudy);
          } else {
            mockDatabaseState.radiology_studies.push(newStudy);
          }
          return { rows: [newStudy], rowCount: 1 };
        }

        // INSERT INTO radiology_series
        if (normalized.startsWith('INSERT INTO RADIOLOGY_SERIES')) {
          const newSeries = {
            id: params[0],
            tenant_id: params[1],
            study_id: params[2],
            series_instance_uid: params[3],
            series_number: params[4],
            modality: params[5],
            series_description: params[6],
            num_instances: params[7],
            created_at: params[8]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedSeries.push(newSeries);
          } else {
            mockDatabaseState.radiology_series.push(newSeries);
          }
          return { rows: [newSeries], rowCount: 1 };
        }

        // INSERT INTO radiology_instances
        if (normalized.startsWith('INSERT INTO RADIOLOGY_INSTANCES')) {
          const newInstance = {
            id: params[0],
            tenant_id: params[1],
            series_id: params[2],
            sop_instance_uid: params[3],
            instance_number: params[4],
            storage_uri: params[5],
            created_at: params[6]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedInstances.push(newInstance);
          } else {
            mockDatabaseState.radiology_instances.push(newInstance);
          }
          return { rows: [newInstance], rowCount: 1 };
        }

        // INSERT INTO radiology_reports
        if (normalized.startsWith('INSERT INTO RADIOLOGY_REPORTS')) {
          const newReport = {
            id: params[0],
            tenant_id: params[1],
            study_id: params[2],
            encounter_id: params[3],
            patient_id: params[4],
            patient_mrn: params[5],
            radiologist_id: params[6],
            radiologist_name: params[7],
            clinical_history: params[8],
            technique_description: params[9],
            findings: params[10],
            impression_conclusion: params[11],
            rads_classification: params[12],
            is_urgent_critical_finding: params[13],
            critical_threat_summary: params[14],
            status: params[15],
            digital_signature_hash: params[16],
            workstation_ip: params[17],
            actor_role: params[18],
            correlation_id: params[19],
            cpoe_order_id: params[20],
            cpoe_item_id: params[21],
            version: params[22],
            signed_at: params[23],
            created_at: params[24],
            updated_at: params[25]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedReports.push(newReport);
          } else {
            mockDatabaseState.radiology_reports.push(newReport);
          }
          return { rows: [newReport], rowCount: 1 };
        }

        // INSERT INTO radiology_report_versions
        if (normalized.startsWith('INSERT INTO RADIOLOGY_REPORT_VERSIONS')) {
          const newVer = {
            id: params[0],
            report_id: params[1],
            version: params[2],
            findings: params[3],
            impression_conclusion: params[4],
            rads_classification: params[5],
            is_urgent_critical_finding: params[6],
            digital_signature_hash: params[7],
            signed_by: params[8] || params[9],
            signed_at: params[9] || params[10],
            created_at: params[10] || params[11]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedVersions.push(newVer);
          } else {
            mockDatabaseState.radiology_report_versions.push(newVer);
          }
          return { rows: [newVer], rowCount: 1 };
        }

        // INSERT INTO radiology_critical_finding_alerts
        if (normalized.startsWith('INSERT INTO RADIOLOGY_CRITICAL_FINDING_ALERTS')) {
          const newAlert = {
            id: params[0],
            tenant_id: params[1],
            report_id: params[2],
            study_instance_uid: params[3],
            encounter_id: params[4],
            patient_id: params[5],
            critical_finding_type: params[6],
            status: params[7],
            escalation_level: params[8],
            reported_to_clinician: params[9],
            reported_at: params[10],
            cpoe_order_id: params[11],
            cpoe_item_id: params[12],
            correlation_id: params[13],
            notification_method: params[14],
            notified_to_name: params[15],
            notified_to_role: params[16],
            severity: params[17],
            created_at: params[18]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAlerts.push(newAlert);
          } else {
            mockDatabaseState.radiology_critical_finding_alerts.push(newAlert);
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

        // UPDATE radiology_orders
        if (normalized.startsWith('UPDATE RADIOLOGY_ORDERS')) {
          const radOrderId = params[1] || params[2];
          const newStatus = normalized.includes("SET STATUS = 'IMAGE_ACQUIRED'") ? 'IMAGE_ACQUIRED' : 'REPORT_FINALIZED';
          if (activeTransactionState) {
            activeTransactionState.radOrderUpdates.push({ id: radOrderId, data: { status: newStatus } });
          }
          return { rows: [], rowCount: 1 };
        }

        // UPDATE radiology_studies
        if (normalized.startsWith('UPDATE RADIOLOGY_STUDIES')) {
          const studyId = params[1];
          if (activeTransactionState) {
            activeTransactionState.studyUpdates.push({ id: studyId, data: { status: 'REPORTED' } });
          }
          return { rows: [], rowCount: 1 };
        }

        // UPDATE radiology_reports (amend)
        if (normalized.startsWith('UPDATE RADIOLOGY_REPORTS')) {
          const reportId = params[7];
          const updatedData = {
            status: 'AMENDED',
            findings: params[0],
            impression_conclusion: params[1],
            amendment_reason: params[2],
            amended_by: params[3],
            amended_at: params[4],
            digital_signature_hash: params[5],
            version: params[6]
          };
          if (activeTransactionState) {
            activeTransactionState.reportUpdates.push({ id: reportId, data: updatedData });
          }
          return { rows: [{ id: reportId, ...updatedData }], rowCount: 1 };
        }

        // UPDATE radiology_critical_finding_alerts
        if (normalized.startsWith('UPDATE RADIOLOGY_CRITICAL_FINDING_ALERTS')) {
          if (normalized.includes("SET STATUS = 'ACKNOWLEDGED_READ_BACK'")) {
            const alertId = params[3];
            const updatedData = {
              status: 'ACKNOWLEDGED_READ_BACK',
              read_back_confirmed_by: params[0],
              read_back_at: params[1],
              read_back_statement: 'VERIFIED_READ_BACK_CONFIRMED',
              acknowledged_by: params[0],
              acknowledged_at: params[1],
              clinical_instruction: params[2],
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
          const found = mockDatabaseState.clinical_orders.find(o => o.id === orderId);
          if (found) found.status = newStatus;
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

  // ─── TC-01: CPOE RAD ➔ MODALITY WORKLIST (MWL) GENERATION ───
  it('TC-01: should consume CPOE Radiology Order and generate deterministic MWL with Accession Number', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });

    expect(worklists.length).toBe(2);
    expect(worklists[0].accession_number).toMatch(/^ACC-RAD-\d{8}-\d{4}$/);
    expect(worklists[0].modality).toBe('DX');
    expect(worklists[1].modality).toBe('CT');
    expect(mockDatabaseState.radiology_orders.length).toBe(2);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox[0].event_type).toBe('RAD_MWL_GENERATED');
  });

  // ─── TC-02: DUPLICATE MWL GENERATION PREVENTION (IDEMPOTENCY) ───
  it('TC-02: should prevent duplicate MWL generation when generateModalityWorklist is re-called', async () => {
    const firstCall = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    expect(firstCall.length).toBe(2);

    const secondCall = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    expect(secondCall.length).toBe(2);
    expect(secondCall[0].id).toBe(firstCall[0].id);
    expect(mockDatabaseState.radiology_orders.length).toBe(2);
  });

  // ─── TC-03: DISTINCT ACCESSION NUMBERS FOR DISTINCT ITEMS ───
  it('TC-03: should generate distinct accession numbers for distinct CPOE order items', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    expect(worklists[0].accession_number).not.toBe(worklists[1].accession_number);
  });

  // ─── TC-04: PATIENT ID MISMATCH SAFEGUARD ───
  it('TC-04: should strictly reject DICOM study ingestion if patient ID does not match order patient ID', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const radOrder = worklists[0];
    const techActor = { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };

    await expect(radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: radOrder.id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      patientId: 'pat-DIFFERENT-PATIENT-999',
      modality: 'DX'
    }, techActor)).rejects.toThrow('Pelanggaran Patient Safety: Patient ID citra DICOM');
  });

  // ─── TC-05: MULTI-ATTRIBUTE DEMOGRAPHIC SAFEGUARD (NAME / MRN MISMATCH QUARANTINE) ───
  it('TC-05: should reject/quarantine DICOM study if patient ID matches but patient name or MRN differs', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const radOrder = worklists[0];
    // Set specific patient name on order
    radOrder.patient_name = 'Tn. Budi Santoso';
    mockDatabaseState.radiology_orders.push(radOrder);

    const techActor = { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };

    // Name mismatch
    await expect(radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: radOrder.id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      patientId: radOrder.patient_id,
      patientName: 'Ny. Siti Aminah', // Demographic mismatch
      modality: 'DX'
    }, techActor)).rejects.toThrow('Pelanggaran Demographic Safety');
  });

  // ─── TC-06: ACQUISITION ON CANCELLED ORDER REJECTION ───
  it('TC-06: should reject MWL generation and study acquisition on CANCELLED CPOE order', async () => {
    await expect(radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cancelled-rad-002' }))
      .rejects.toThrow('CPOE Order yang telah dibatalkan');
  });

  // ─── TC-07: DUPLICATE DICOM STUDY INSTANCE UID INGESTION PREVENTION ───
  it('TC-07: should reject duplicate Study Instance UID ingestion into PACS (409)', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const radOrder = worklists[0];
    const techActor = { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };

    await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: radOrder.id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      patientId: 'pat-rad-001',
      modality: 'DX'
    }, techActor);

    await expect(radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: radOrder.id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      patientId: 'pat-rad-001',
      modality: 'DX'
    }, techActor)).rejects.toThrow('Duplikasi DICOM Object');
  });

  // ─── TC-08: DUPLICATE SERIES INSTANCE UID ACROSS STUDIES PREVENTION ───
  it('TC-08: should reject duplicate Series Instance UID across studies (409)', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const techActor = { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };

    // Study 1
    await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[0].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      patientId: 'pat-rad-001',
      modality: 'DX',
      seriesData: [{ seriesInstanceUid: '1.2.840.10008.1.1.20260820.001.SERIES_1', seriesNumber: 1 }]
    }, techActor);

    // Study 2 with duplicate series UID
    await expect(radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[1].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.002',
      patientId: 'pat-rad-001',
      modality: 'CT',
      seriesData: [{ seriesInstanceUid: '1.2.840.10008.1.1.20260820.001.SERIES_1', seriesNumber: 1 }]
    }, techActor)).rejects.toThrow('Duplikasi Series UID');
  });

  // ─── TC-09: DUPLICATE SOP INSTANCE UID PREVENTION ───
  it('TC-09: should reject duplicate SOP Instance UID ingestion into PACS (409)', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const techActor = { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };

    // Study 1
    await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[0].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      patientId: 'pat-rad-001',
      modality: 'DX',
      instancesData: [{ sopInstanceUid: '1.2.840.10008.1.1.20260820.001.SOP_GLOBAL_1', instanceNumber: 1 }]
    }, techActor);

    // Study 2 with duplicate SOP Instance UID
    await expect(radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[1].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.002',
      patientId: 'pat-rad-001',
      modality: 'CT',
      instancesData: [{ sopInstanceUid: '1.2.840.10008.1.1.20260820.001.SOP_GLOBAL_1', instanceNumber: 1 }]
    }, techActor)).rejects.toThrow('Duplikasi SOP Instance UID');
  });

  // ─── TC-10: DICOM STUDY, SERIES & INSTANCES HIERARCHY PERSISTENCE ───
  it('TC-10: should persist complete DICOM Study -> Series -> Instances hierarchy in PACS', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const radOrder = worklists[0];
    const techActor = { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };

    const study = await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: radOrder.id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      patientId: 'pat-rad-001',
      modality: 'DX',
      bodyPartExamined: 'CHEST',
      seriesData: [{ seriesInstanceUid: '1.2.840.10008.1.1.20260820.001.1', seriesNumber: 1, modality: 'DX', numInstances: 1 }],
      instancesData: [{ sopInstanceUid: '1.2.840.10008.1.1.20260820.001.1.1', instanceNumber: 1 }]
    }, techActor);

    expect(study.status).toBe('ACQUIRED');
    expect(mockDatabaseState.radiology_studies.length).toBe(1);
    expect(mockDatabaseState.radiology_series.length).toBe(1);
    expect(mockDatabaseState.radiology_instances.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'RAD_STUDY_ACQUIRED')).toBe(true);
  });

  // ─── TC-11: DRAFT VS FINALIZED STRUCTURED REPORTING ───
  it('TC-11: should support draft report saving without triggering final clinical completion', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const radOrder = worklists[0];
    const techActor = { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };

    const study = await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: radOrder.id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      modality: 'DX'
    }, techActor);

    const radActor = { userId: 'DOC-RAD-01', username: 'dr_sp_rad', role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };
    const draftReport = await radiologyApplicationService.draftOrFinalizeReport({
      studyId: study.id,
      findings: 'Cor dan pulmo dalam batas normal sementara.',
      impressionConclusion: 'Foto thorax evaluasi dalam batas normal',
      isDraft: true
    }, radActor);

    expect(draftReport.status).toBe('DRAFT');
    expect(mockDatabaseState.radiology_studies[0].status).toBe('ACQUIRED');
  });

  // ─── TC-12: CRYPTOGRAPHIC DIGITAL SIGNATURE (SHA-256) ───
  it('TC-12: should generate valid SHA-256 cryptographic digital signature for finalized report', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[0].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      modality: 'DX'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const report = await radiologyApplicationService.draftOrFinalizeReport({
      studyId: study.id,
      findings: 'Cor: CTR < 50%, Pulmo: tak tampak infiltrat, sinus kostofrenikus lancip.',
      impressionConclusion: 'Cor dan pulmo dalam batas normal (Normal Chest X-Ray)',
      isDraft: false
    }, { userId: 'DOC-RAD-01', role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    expect(report.status).toBe('FINALIZED');
    expect(report.digital_signature_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  // ─── TC-13: IMMUTABLE REPORT VERSION PRESERVATION (v1 SNAPSHOT) ───
  it('TC-13: should preserve immutable v1 snapshot in radiology_report_versions on report finalization', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[0].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      modality: 'DX'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const report = await radiologyApplicationService.draftOrFinalizeReport({
      studyId: study.id,
      findings: 'Cor dan pulmo normal.',
      impressionConclusion: 'Normal Chest X-Ray',
      isDraft: false
    }, { userId: 'DOC-RAD-01', role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    expect(mockDatabaseState.radiology_report_versions.length).toBe(1);
    expect(mockDatabaseState.radiology_report_versions[0].version).toBe(1);
    expect(mockDatabaseState.radiology_report_versions[0].findings).toBe('Cor dan pulmo normal.');
  });

  // ─── TC-14: CRITICAL RADIOLOGY FINDING DETECTION WITH PROVENANCE ───
  it('TC-14: should automatically detect critical finding and record complete notification provenance', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[0].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      modality: 'DX'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const report = await radiologyApplicationService.draftOrFinalizeReport({
      studyId: study.id,
      findings: 'Tampak hiperlusen avaskular pada hemitoraks kanan dengan kolaps paru total dan deviasi trakea ke kiri.',
      impressionConclusion: 'Tension Pneumothorax Hemitoraks Kanan Letal',
      isUrgentCriticalFinding: true,
      criticalFindingCode: 'RAD-CRIT-PNEUMO-TENSION',
      notifiedToName: 'dr. Siti Rahma, Sp.PD (DPJP)',
      notifiedToRole: 'ROLE_DOCTOR_DPJP',
      notificationMethod: 'TELEPHONE_DIRECT'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    expect(report.is_urgent_critical_finding).toBe(true);
    expect(report.criticalAlert).toBeDefined();
    expect(report.criticalAlert.critical_finding_type).toBe('RAD-CRIT-PNEUMO-TENSION');
    expect(report.criticalAlert.notified_to_name).toBe('dr. Siti Rahma, Sp.PD (DPJP)');
    expect(report.criticalAlert.notification_method).toBe('TELEPHONE_DIRECT');
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'RAD_CRITICAL_ALERT_DETECTED')).toBe(true);
  });

  // ─── TC-15: STRICT CLOSED-LOOP READ-BACK REJECTION ───
  it('TC-15: should reject read-back acknowledgement if confirmation is false or clinical instruction missing', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({ radiologyOrderId: worklists[0].id, studyInstanceUid: '1.2.840.10008.1.1.20260820.001', modality: 'DX' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });
    const report = await radiologyApplicationService.draftOrFinalizeReport({ studyId: study.id, findings: 'Tension pneumothorax', impressionConclusion: 'Tension pneumothorax', isUrgentCriticalFinding: true, criticalFindingCode: 'RAD-CRIT-PNEUMO-TENSION' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const doctorActor = { userId: 'DOC-1001', fullName: 'dr. Siti Rahma, Sp.PD', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP };

    await expect(radiologyApplicationService.acknowledgeCriticalFinding({
      alertId: report.criticalAlert.id,
      readBackConfirmed: false,
      clinicalInstruction: 'Needle thoracocentesis segera'
    }, doctorActor)).rejects.toThrow('Konfirmasi lisan Read-Back');

    await expect(radiologyApplicationService.acknowledgeCriticalFinding({
      alertId: report.criticalAlert.id,
      readBackConfirmed: true,
      clinicalInstruction: 'ok' // Less than 5 chars
    }, doctorActor)).rejects.toThrow('Instruksi klinis/tindakan terapeutik dari DPJP wajib dicatat');
  });

  // ─── TC-16: SUCCESSFUL CLOSED-LOOP READ-BACK ACKNOWLEDGEMENT ───
  it('TC-16: should successfully record valid closed-loop read-back acknowledgement', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({ radiologyOrderId: worklists[0].id, studyInstanceUid: '1.2.840.10008.1.1.20260820.001', modality: 'DX' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });
    const report = await radiologyApplicationService.draftOrFinalizeReport({ studyId: study.id, findings: 'Tension pneumothorax', impressionConclusion: 'Tension pneumothorax', isUrgentCriticalFinding: true, criticalFindingCode: 'RAD-CRIT-PNEUMO-TENSION' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const doctorActor = { userId: 'DOC-1001', fullName: 'dr. Siti Rahma, Sp.PD', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP };
    const ack = await radiologyApplicationService.acknowledgeCriticalFinding({
      alertId: report.criticalAlert.id,
      readBackConfirmed: true,
      clinicalInstruction: 'Needle thoracostomy cito di ICS 2 linea midklavikularis dilanjutkan WSD'
    }, doctorActor);

    expect(ack.status).toBe('ACKNOWLEDGED_READ_BACK');
    expect(ack.read_back_confirmed_by).toBe('dr. Siti Rahma, Sp.PD');
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'RAD_CRITICAL_ALERT_ACKNOWLEDGED')).toBe(true);
  });

  // ─── TC-17: ESCALATION TIMEOUT ───
  it('TC-17: should escalate unacknowledged critical radiology alert to DPJP_PHYSICIAN on timeout', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({ radiologyOrderId: worklists[0].id, studyInstanceUid: '1.2.840.10008.1.1.20260820.001', modality: 'DX' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });
    const report = await radiologyApplicationService.draftOrFinalizeReport({ studyId: study.id, findings: 'Tension pneumothorax', impressionConclusion: 'Tension pneumothorax', isUrgentCriticalFinding: true }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const escalated = await radiologyApplicationService.escalateCriticalFinding({
      alertId: report.criticalAlert.id,
      escalationReason: 'Timeout 15 menit tanpa respon IGD',
      targetLevel: 'DPJP_PHYSICIAN'
    }, { role: ENTERPRISE_ROLES.ROLE_SUPER_ADMIN });

    expect(escalated.status).toBe('ESCALATED_DPJP');
    expect(escalated.escalation_level).toBe('DPJP_PHYSICIAN');
  });

  // ─── TC-18: RADIOLOGIST AUTHORIZATION GUARD (RBAC) ───
  it('TC-18: should reject report creation by unauthorized non-radiologist roles (403)', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({ radiologyOrderId: worklists[0].id, studyInstanceUid: '1.2.840.10008.1.1.20260820.001', modality: 'DX' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const cashierActor = { userId: 'USR-CASHIER', role: ENTERPRISE_ROLES.ROLE_CASHIER };
    await expect(radiologyApplicationService.draftOrFinalizeReport({
      studyId: study.id,
      findings: 'Test',
      impressionConclusion: 'Test'
    }, cashierActor)).rejects.toThrow('Wewenang ditolak');
  });

  // ─── TC-19: OPTIMISTIC CONCURRENCY ON AMENDMENT ───
  it('TC-19: should reject report amendment if expected version mismatches database version (OCC 409)', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({ radiologyOrderId: worklists[0].id, studyInstanceUid: '1.2.840.10008.1.1.20260820.001', modality: 'DX' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });
    const report = await radiologyApplicationService.draftOrFinalizeReport({ studyId: study.id, findings: 'Normal', impressionConclusion: 'Normal', isDraft: false }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const radActor = { userId: 'DOC-RAD-01', role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };

    await expect(radiologyApplicationService.amendReport({
      reportId: report.id,
      amendmentReason: 'Koreksi penambahan evaluasi',
      amendedFindings: 'Temuan baru',
      amendedImpression: 'Kesimpulan baru',
      expectedVersion: 99 // Stale client version
    }, radActor)).rejects.toThrow('Konflik Konkurensi');
  });

  // ─── TC-20: MEDICOLEGAL AMENDMENT APPENDS v2 WHILE PRESERVING v1 ───
  it('TC-20: should create v2 snapshot in history table while leaving v1 reconstructible', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const study = await radiologyApplicationService.acquireDicomStudy({ radiologyOrderId: worklists[0].id, studyInstanceUid: '1.2.840.10008.1.1.20260820.001', modality: 'DX' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });
    const report = await radiologyApplicationService.draftOrFinalizeReport({ studyId: study.id, findings: 'Normal', impressionConclusion: 'Normal', isDraft: false }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const radActor = { userId: 'DOC-RAD-01', fullName: 'dr. Sp.Rad', role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER };
    const amended = await radiologyApplicationService.amendReport({
      reportId: report.id,
      amendmentReason: 'Koreksi penambahan evaluasi tulang iga pasca komparasi proyeksi lateral',
      amendedFindings: 'Tampak fraktur undisplaced pada kosta 4-5 lateral kanan.',
      amendedImpression: 'Fraktur undisplaced kosta 4-5 lateral kanan tanpa pneumotoraks',
      expectedVersion: 1
    }, radActor);

    expect(amended.status).toBe('AMENDED');
    expect(amended.version).toBe(2);
    expect(mockDatabaseState.radiology_report_versions.length).toBe(2); // v1 and v2 both exist!
    expect(mockDatabaseState.radiology_report_versions[0].version).toBe(1);
    expect(mockDatabaseState.radiology_report_versions[1].version).toBe(2);
  });

  // ─── TC-21: PARTIAL CPOE ORDER COMPLETION SEMANTICS ───
  it('TC-21: should transition parent CPOE order to PARTIALLY_COMPLETED when 1 of 2 radiology items is finalized', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    const radOrder1 = worklists[0];

    const study1 = await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: radOrder1.id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      modality: 'DX'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    await radiologyApplicationService.draftOrFinalizeReport({
      studyId: study1.id,
      findings: 'Normal',
      impressionConclusion: 'Normal',
      isDraft: false
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    // Item 1 finalized, Item 2 pending -> Parent Order MUST be PARTIALLY_COMPLETED
    const parentOrder = mockDatabaseState.clinical_orders.find(o => o.id === 'ord-cpoe-rad-001');
    expect(parentOrder.status).toBe('PARTIALLY_COMPLETED');
  });

  // ─── TC-22: FULL CPOE ORDER COMPLETION SEMANTICS ───
  it('TC-22: should transition parent CPOE order to COMPLETED only when ALL radiology items are finalized', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });

    // Finalize Item 1 (Thorax)
    const study1 = await radiologyApplicationService.acquireDicomStudy({ radiologyOrderId: worklists[0].id, studyInstanceUid: '1.2.840.10008.1.1.20260820.001', modality: 'DX' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });
    await radiologyApplicationService.draftOrFinalizeReport({ studyId: study1.id, findings: 'Normal', impressionConclusion: 'Normal', isDraft: false }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    // Finalize Item 2 (CT Brain)
    const study2 = await radiologyApplicationService.acquireDicomStudy({ radiologyOrderId: worklists[1].id, studyInstanceUid: '1.2.840.10008.1.1.20260820.002', modality: 'CT' }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });
    await radiologyApplicationService.draftOrFinalizeReport({ studyId: study2.id, findings: 'Tak tampak perdarahan intrakranial', impressionConclusion: 'CT Brain Normal', isDraft: false }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    // Both items finalized -> Parent Order MUST be COMPLETED
    const parentOrder = mockDatabaseState.clinical_orders.find(o => o.id === 'ord-cpoe-rad-001');
    expect(parentOrder.status).toBe('COMPLETED');
  });

  // ─── TC-23: AUDIT + OUTBOX ATOMICITY ───
  it('TC-23: should atomically persist audit logs and outbox events in single PostgreSQL transaction', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[0].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      modality: 'DX'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    expect(mockDatabaseState.universal_audit_logs.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBe(2);
  });

  // ─── TC-24: TRANSACTION ROLLBACK ON FAILURE ───
  it('TC-24: should completely rollback study acquisition if error occurs mid-transaction', async () => {
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });

    const baseQuery = mockClient.query;
    mockClient.query = vi.fn(async (sql, params) => {
      if (sql.trim().toUpperCase().startsWith('INSERT INTO CLINICAL_DOMAIN_OUTBOX')) {
        throw new Error('OUTBOX_WRITE_FAIL: Outbox database write failed');
      }
      return baseQuery(sql, params);
    });

    await expect(radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[0].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      modality: 'DX'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER })).rejects.toThrow('OUTBOX_WRITE_FAIL');

    expect(mockDatabaseState.radiology_studies.length).toBe(0);
  });

  // ─── TC-25: FULL RECONCILIATION & PARTIAL/FULL COMPLETION FSM PROOF ───
  it('TC-25: should reconcile 100% state with exact partial and full completion FSM proof', async () => {
    // 1. MWL Generation from CPOE (2 Items)
    const worklists = await radiologyApplicationService.generateModalityWorklistForOrder({ orderId: 'ord-cpoe-rad-001' });
    expect(worklists.length).toBe(2);

    // Initial state: 0 of 2 items finished -> Parent Order is ORDERED
    expect(mockDatabaseState.clinical_orders[0].status).toBe('ORDERED');

    // 2. Ingest Item 1 (Thorax DX) & Finalize Report with Critical Finding
    const study1 = await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[0].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.001',
      patientId: 'pat-rad-001',
      modality: 'DX'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    const report1 = await radiologyApplicationService.draftOrFinalizeReport({
      studyId: study1.id,
      findings: 'Tension pneumothorax kanan berat.',
      impressionConclusion: 'Tension Pneumothorax Kanan Cito',
      isUrgentCriticalFinding: true,
      criticalFindingCode: 'RAD-CRIT-PNEUMO-TENSION'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    // Read-back acknowledgement for Item 1
    await radiologyApplicationService.acknowledgeCriticalFinding({
      alertId: report1.criticalAlert.id,
      readBackConfirmed: true,
      clinicalInstruction: 'Pemasangan chest tube WSD cito'
    }, { role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    // State after Item 1: Exactly 1 of 2 finished -> Parent Order MUST BE PARTIALLY_COMPLETED
    expect(mockDatabaseState.clinical_orders[0].status).toBe('PARTIALLY_COMPLETED');

    // 3. Ingest Item 2 (CT Brain) & Finalize Report
    const study2 = await radiologyApplicationService.acquireDicomStudy({
      radiologyOrderId: worklists[1].id,
      studyInstanceUid: '1.2.840.10008.1.1.20260820.002',
      patientId: 'pat-rad-001',
      modality: 'CT'
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    await radiologyApplicationService.draftOrFinalizeReport({
      studyId: study2.id,
      findings: 'Dalam batas normal.',
      impressionConclusion: 'CT Brain Normal',
      isDraft: false
    }, { role: ENTERPRISE_ROLES.ROLE_RADIOGRAPHER });

    // State after Item 2: Exactly 2 of 2 finished -> Parent Order MUST BE COMPLETED
    expect(mockDatabaseState.clinical_orders[0].status).toBe('COMPLETED');

    // Complete Database Reconciliation Assertions
    expect(mockDatabaseState.radiology_orders.length).toBe(2);
    expect(mockDatabaseState.radiology_studies.length).toBe(2);
    expect(mockDatabaseState.radiology_reports.length).toBe(2);
    expect(mockDatabaseState.radiology_report_versions.length).toBe(2);
    expect(mockDatabaseState.radiology_critical_finding_alerts.length).toBe(1);
    expect(mockDatabaseState.universal_audit_logs.length).toBeGreaterThanOrEqual(2);
    expect(mockDatabaseState.clinical_domain_outbox.length).toBeGreaterThanOrEqual(6);
  });
});
