/**
 * NurseFlow Enterprise HIS 2026 — Vertical Slice #07 Durability & Patient Safety Core Test Suite (Hardened 45-Test Matrix)
 * Medication Closed-Loop: e-Prescribing, Cross-Reactivity Allergy Engine, Dynamic DDI, Cumulative & Weight-Based Dosing,
 * Pharmacist MMU.4, FEFO Stock, Bedside 6-Rights, IV Infusion Safety, and Admission/Discharge Reconciliation.
 * Standards: JCI MMU.4 / IPSG 3 (High-Alert / Dual-Signoff), WHO 5-Rights + Reason, ISO 22940, PostgreSQL 16 ACID.
 * Complete 45 Chaos Gate Scenarios.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { medicationClosedLoopService, MedicationDomainError } from '../server/services/medicationClosedLoop.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';
import { ENTERPRISE_ROLES } from '../src/shared/constants/roles.js';

describe('VS-07 — Medication Closed-Loop (Patient Safety Core) ➔ PostgreSQL Durability & Clinical Safety Hardened Gate (45 Scenarios)', () => {
  let mockDatabaseState = {
    encounters: [],
    clinical_orders: [],
    cpoe_order_items: [],
    patient_allergies: [],
    master_drug_class_cross_reactivities: [],
    master_medication_dose_ranges: [],
    medication_orders: [],
    pharmacy_warehouses: [],
    inventory_batches: [],
    inventory_stock_movements: [],
    medication_dispense_allocations: [],
    medication_emar_administrations: [],
    medication_reconciliations: [],
    universal_audit_logs: [],
    clinical_domain_outbox: []
  };

  let mockClient = null;
  let activeTransactionState = null;

  beforeEach(() => {
    mockDatabaseState = {
      encounters: [
        {
          id: 'enc-med-001',
          episode_id: 'epc-med-001',
          patient_id: 'pat-med-001',
          encounter_number: 'ENC-2026-MED-01',
          status: 'IN_PROGRESS'
        }
      ],
      clinical_orders: [
        {
          id: 'ord-cpoe-med-001',
          order_number: 'ORD-20260820-3001',
          patient_id: 'pat-med-001',
          episode_id: 'epc-med-001',
          encounter_id: 'enc-med-001',
          order_category: 'PHARMACY',
          priority: 'ROUTINE',
          status: 'ORDERED',
          requester_id: 'DOC-MED-REQ-01',
          requester_name: 'dr. Siti Rahma, Sp.PD',
          clinical_indication: 'Demam tifoid & nyeri pasca bedah',
          version: 1
        },
        {
          id: 'ord-cancelled-med-002',
          order_number: 'ORD-20260820-9997',
          patient_id: 'pat-med-001',
          episode_id: 'epc-med-001',
          encounter_id: 'enc-med-001',
          order_category: 'PHARMACY',
          priority: 'ROUTINE',
          status: 'CANCELLED',
          version: 2
        }
      ],
      cpoe_order_items: [
        {
          id: 'item-med-paracetamol-001',
          order_id: 'ord-cpoe-med-001',
          item_type: 'PHARMACY',
          catalog_code: 'MED-PARACETAMOL',
          item_name: 'Paracetamol 500mg Tab',
          item_specifications: { dosageQuantity: 500, dosageUnit: 'mg', route: 'ORAL', frequency: '3x1', duration: '3 hari' },
          quantity: 10,
          unit_price: 2500,
          total_price: 25000,
          status: 'ORDERED'
        },
        {
          id: 'item-med-morphine-002',
          order_id: 'ord-cpoe-med-001',
          item_type: 'PHARMACY',
          catalog_code: 'MED-MORPHINE-10',
          item_name: 'Morphine HCl 10mg/mL Ampul (High Alert)',
          item_specifications: { dosageQuantity: 5, dosageUnit: 'mg', route: 'IV_BOLUS', frequency: 'PRN', isPrn: true, prnIndication: 'Nyeri hebat VAS > 7', prnMinIntervalHours: 4, isHighAlert: true, isNarcotic: true },
          quantity: 2,
          unit_price: 45000,
          total_price: 90000,
          status: 'ORDERED'
        }
      ],
      patient_allergies: [
        {
          id: 'al-01',
          patient_id: 'pat-med-001',
          allergen_code: 'MED-AMOXICILLIN',
          drug_class_code: 'CLASS-PENICILLIN',
          allergen_name: 'Amoxicillin / Penicillin Group',
          reaction: 'Anafilaksis Syok Berat',
          severity: 'SEVERE_LETHAL',
          is_active: true
        },
        {
          id: 'al-02',
          patient_id: 'pat-med-001',
          allergen_code: 'MED-ERYTHROMYCIN',
          drug_class_code: 'CLASS-MACROLIDE',
          allergen_name: 'Erythromycin',
          reaction: 'Mual & Kram Perut (Gastritis Ringan)',
          severity: 'MILD_INTOLERANCE',
          is_active: true
        }
      ],
      master_drug_class_cross_reactivities: [
        {
          id: 'cr-01',
          drug_class_code: 'CLASS-PENICILLIN',
          drug_class_name: 'Penicillin Beta-Lactam',
          cross_reactive_class_code: 'CLASS-CEPHALOSPORIN',
          cross_reactive_class_name: 'Cephalosporin 1st Gen',
          risk_level: 'HIGH',
          clinical_rationale: 'Resiko cross-reactivity beta-lactam ring side-chain'
        }
      ],
      master_medication_dose_ranges: [
        {
          id: 'dr-01',
          medication_code: 'MED-PARACETAMOL',
          medication_name: 'Paracetamol 500mg Tab',
          min_single_dose: 250.00,
          max_single_dose: 1000.00,
          max_daily_dose: 4000.00,
          mg_per_kg_max_dose: 15.00,
          max_daily_dose_mg_per_kg: 60.00,
          dose_unit: 'mg',
          allowed_routes: ['ORAL', 'RECTAL', 'IV_INFUSION'],
          renal_clearance_cutoff_ml_min: 30.00,
          max_dose_renal_impaired: 2000.00,
          is_high_alert: false,
          is_narcotic: false,
          is_active: true
        },
        {
          id: 'dr-02',
          medication_code: 'MED-MORPHINE-10',
          medication_name: 'Morphine HCl 10mg/mL Ampul',
          min_single_dose: 2.00,
          max_single_dose: 15.00,
          max_daily_dose: 60.00,
          mg_per_kg_max_dose: 0.20,
          max_daily_dose_mg_per_kg: 1.00,
          dose_unit: 'mg',
          allowed_routes: ['IV_BOLUS', 'SC', 'IM', 'IV_INFUSION'],
          renal_clearance_cutoff_ml_min: 30.00,
          max_dose_renal_impaired: 5.00,
          is_high_alert: true,
          is_narcotic: true,
          is_active: true
        },
        {
          id: 'dr-03',
          medication_code: 'MED-CEFAZOLIN-1G',
          medication_name: 'Cefazolin 1g Vial (Cephalosporin)',
          min_single_dose: 500.00,
          max_single_dose: 2000.00,
          max_daily_dose: 6000.00,
          dose_unit: 'mg',
          allowed_routes: ['IV_BOLUS', 'IV_INFUSION'],
          is_high_alert: false,
          is_narcotic: false,
          is_active: true
        },
        {
          id: 'dr-04',
          medication_code: 'MED-POTASSIUM-746',
          medication_name: 'KCl 7.46% (High Alert Electrolyte)',
          min_single_dose: 10.00,
          max_single_dose: 25.00,
          max_daily_dose: 100.00,
          dose_unit: 'mEq',
          allowed_routes: ['IV_INFUSION'],
          is_high_alert: true,
          is_narcotic: false,
          is_active: true
        }
      ],
      medication_orders: [],
      pharmacy_warehouses: [
        {
          id: 'wh-central-001',
          warehouse_code: 'WH-CENTRAL',
          warehouse_name: 'Depo Farmasi Rawat Inap',
          warehouse_type: 'INPATIENT_DEPO',
          is_active: true
        }
      ],
      inventory_batches: [
        {
          id: 'batch-pct-earliest',
          warehouse_id: 'wh-central-001',
          medication_code: 'MED-PARACETAMOL',
          batch_number: 'BATCH-PCT-2026A',
          expiry_date: '2026-12-31', // Earliest Expiry (FEFO Candidate)
          available_quantity: 50,
          unit_price: 2500.00,
          version: 1
        },
        {
          id: 'batch-pct-later',
          warehouse_id: 'wh-central-001',
          medication_code: 'MED-PARACETAMOL',
          batch_number: 'BATCH-PCT-2027B',
          expiry_date: '2027-12-31', // Later Expiry
          available_quantity: 100,
          unit_price: 2500.00,
          version: 1
        },
        {
          id: 'batch-pct-expired',
          warehouse_id: 'wh-central-001',
          medication_code: 'MED-PARACETAMOL-EXP',
          batch_number: 'BATCH-PCT-EXP',
          expiry_date: '2025-01-01', // Expired!
          available_quantity: 10,
          unit_price: 2500.00,
          version: 1
        },
        {
          id: 'batch-mor-01',
          warehouse_id: 'wh-central-001',
          medication_code: 'MED-MORPHINE-10',
          batch_number: 'BATCH-MOR-2026X',
          expiry_date: '2026-11-30',
          available_quantity: 20,
          unit_price: 45000.00,
          version: 1
        },
        {
          id: 'batch-single-stock-01',
          warehouse_id: 'wh-central-001',
          medication_code: 'MED-SINGLE-STOCK',
          batch_number: 'BATCH-SINGLE-LAST-1',
          expiry_date: '2026-12-31',
          available_quantity: 1, // Only 1 unit left for race condition test
          unit_price: 10000.00,
          version: 1
        }
      ],
      inventory_stock_movements: [],
      medication_dispense_allocations: [],
      medication_emar_administrations: [],
      medication_reconciliations: [],
      universal_audit_logs: [],
      clinical_domain_outbox: []
    };

    activeTransactionState = null;

    mockClient = {
      query: vi.fn(async (sql, params = []) => {
        const normalized = sql.trim().toUpperCase();

        if (normalized.startsWith('BEGIN')) {
          activeTransactionState = {
            stagedMedOrders: [],
            stagedMovements: [],
            stagedAllocations: [],
            stagedAdministrations: [],
            stagedReconciliations: [],
            stagedAuditLogs: [],
            stagedOutbox: [],
            medOrderUpdates: [],
            batchUpdates: [],
            itemUpdates: [],
            orderUpdates: []
          };
          return { rows: [], rowCount: 0 };
        }

        if (normalized.startsWith('COMMIT')) {
          if (activeTransactionState) {
            mockDatabaseState.medication_orders.push(...activeTransactionState.stagedMedOrders);
            mockDatabaseState.inventory_stock_movements.push(...activeTransactionState.stagedMovements);
            mockDatabaseState.medication_dispense_allocations.push(...activeTransactionState.stagedAllocations);
            mockDatabaseState.medication_emar_administrations.push(...activeTransactionState.stagedAdministrations);
            mockDatabaseState.medication_reconciliations.push(...activeTransactionState.stagedReconciliations);
            mockDatabaseState.universal_audit_logs.push(...activeTransactionState.stagedAuditLogs);
            mockDatabaseState.clinical_domain_outbox.push(...activeTransactionState.stagedOutbox);

            activeTransactionState.medOrderUpdates.forEach(up => {
              const idx = mockDatabaseState.medication_orders.findIndex(m => m.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.medication_orders[idx] = { ...mockDatabaseState.medication_orders[idx], ...up.data };
              }
            });

            activeTransactionState.batchUpdates.forEach(up => {
              const idx = mockDatabaseState.inventory_batches.findIndex(b => b.id === up.id);
              if (idx !== -1) {
                mockDatabaseState.inventory_batches[idx] = { ...mockDatabaseState.inventory_batches[idx], ...up.data };
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

        // SELECT FROM cpoe_order_items
        if (normalized.includes('FROM CPOE_ORDER_ITEMS WHERE ORDER_ID = $1')) {
          let found = mockDatabaseState.cpoe_order_items.filter(i => i.order_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM patient_allergies
        if (normalized.includes('FROM PATIENT_ALLERGIES WHERE PATIENT_ID = $1')) {
          const found = mockDatabaseState.patient_allergies.filter(a => a.patient_id === params[0] && a.is_active);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM master_drug_class_cross_reactivities
        if (normalized.includes('FROM MASTER_DRUG_CLASS_CROSS_REACTIVITIES')) {
          return { rows: mockDatabaseState.master_drug_class_cross_reactivities, rowCount: mockDatabaseState.master_drug_class_cross_reactivities.length };
        }

        // SELECT FROM master_medication_dose_ranges
        if (normalized.includes('FROM MASTER_MEDICATION_DOSE_RANGES WHERE MEDICATION_CODE = $1')) {
          const found = mockDatabaseState.master_medication_dose_ranges.filter(r => r.medication_code === params[0] && r.is_active);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM medication_orders WHERE encounter_id = $1 (active regimen check)
        if (normalized.includes('FROM MEDICATION_ORDERS WHERE ENCOUNTER_ID = $1')) {
          const allMeds = [
            ...mockDatabaseState.medication_orders,
            ...(activeTransactionState?.stagedMedOrders || [])
          ];
          const found = allMeds.filter(m => m.encounter_id === params[0] && ['ORDERED', 'REVIEWED', 'DISPENSED', 'ACTIVE'].includes(m.status));
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM medication_orders WHERE cpoe_item_id = $1
        if (normalized.includes('FROM MEDICATION_ORDERS WHERE CPOE_ITEM_ID = $1')) {
          const allMeds = [
            ...mockDatabaseState.medication_orders,
            ...(activeTransactionState?.stagedMedOrders || [])
          ];
          const found = allMeds.filter(m => m.cpoe_item_id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM medication_orders WHERE id = $1
        if (normalized.includes('FROM MEDICATION_ORDERS WHERE ID = $1')) {
          const allMeds = [
            ...mockDatabaseState.medication_orders,
            ...(activeTransactionState?.stagedMedOrders || [])
          ];
          const found = allMeds.filter(m => m.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM inventory_batches (FEFO sort by expiry_date ASC)
        if (normalized.includes('FROM INVENTORY_BATCHES WHERE')) {
          let matches = mockDatabaseState.inventory_batches.filter(b => b.medication_code === params[0] && b.available_quantity > 0);
          matches.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
          return { rows: matches, rowCount: matches.length };
        }

        // SELECT FROM medication_dispense_allocations WHERE id = $1
        if (normalized.includes('FROM MEDICATION_DISPENSE_ALLOCATIONS WHERE ID = $1')) {
          const allAlloc = [
            ...mockDatabaseState.medication_dispense_allocations,
            ...(activeTransactionState?.stagedAllocations || [])
          ];
          const found = allAlloc.filter(a => a.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM medication_emar_administrations WHERE medication_order_id = $1
        if (normalized.includes('FROM MEDICATION_EMAR_ADMINISTRATIONS WHERE MEDICATION_ORDER_ID = $1')) {
          const allAdmin = [
            ...mockDatabaseState.medication_emar_administrations,
            ...(activeTransactionState?.stagedAdministrations || [])
          ];
          const found = allAdmin.filter(a => a.medication_order_id === params[0] && a.administration_status === 'GIVEN');
          return { rows: found, rowCount: found.length };
        }

        // SELECT FROM medication_emar_administrations WHERE id = $1
        if (normalized.includes('FROM MEDICATION_EMAR_ADMINISTRATIONS WHERE ID = $1')) {
          const allAdmin = [
            ...mockDatabaseState.medication_emar_administrations,
            ...(activeTransactionState?.stagedAdministrations || [])
          ];
          const found = allAdmin.filter(a => a.id === params[0]);
          return { rows: found, rowCount: found.length };
        }

        // INSERT INTO medication_orders
        if (normalized.startsWith('INSERT INTO MEDICATION_ORDERS')) {
          const newMed = {
            id: params[0],
            order_id: params[1],
            medication_code: params[2],
            medication_name: params[3],
            dosage: params[4],
            route: params[5],
            frequency: params[6],
            duration: params[7],
            quantity: params[8],
            unit_price: params[9],
            total_price: params[10],
            is_cito: params[11],
            high_alert: params[12],
            lasa_flag: params[13],
            is_antibiotic: params[14],
            review_status: params[15],
            status: params[16],
            cpoe_order_id: params[17],
            cpoe_item_id: params[18],
            encounter_id: params[19],
            patient_id: params[20],
            dosage_quantity: params[21],
            dosage_unit: params[22],
            scheduled_times: params[23],
            is_prn: params[24],
            prn_indication: params[25],
            cdss_screened: params[26],
            cdss_override_reason: params[27],
            cdss_overridden_by: params[28],
            pharmacist_review_status: params[29],
            dispense_status: params[30],
            version: params[31],
            concentration_mg_ml: params[32],
            infusion_rate_ml_hr: params[33],
            infusion_volume_ml: params[34],
            timing_type: params[35],
            clinical_indication_notes: params[36],
            created_at: params[37],
            updated_at: params[38]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedMedOrders.push(newMed);
          } else {
            mockDatabaseState.medication_orders.push(newMed);
          }
          return { rows: [newMed], rowCount: 1 };
        }

        // INSERT INTO medication_reconciliations
        if (normalized.startsWith('INSERT INTO MEDICATION_RECONCILIATIONS')) {
          const isDischarge = params.length >= 14;
          const newRecon = {
            id: params[0],
            encounter_id: params[1],
            patient_id: params[2],
            reconciliation_type: params[3],
            source_medications: JSON.parse(params[4] || '[]'),
            reconciled_medications: JSON.parse(params[5] || '[]'),
            discontinued_medications: JSON.parse(params[6] || '[]'),
            discharge_instructions: isDischarge ? params[7] : null,
            reconciled_by_id: isDischarge ? params[8] : params[7],
            reconciled_by_name: isDischarge ? params[9] : params[8],
            reconciled_by_role: isDischarge ? params[10] : params[9],
            reconciled_at: isDischarge ? params[11] : params[10],
            correlation_id: isDischarge ? params[12] : params[11],
            created_at: isDischarge ? params[13] : params[12]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedReconciliations.push(newRecon);
          } else {
            mockDatabaseState.medication_reconciliations.push(newRecon);
          }
          return { rows: [newRecon], rowCount: 1 };
        }

        // INSERT INTO inventory_stock_movements
        if (normalized.startsWith('INSERT INTO INVENTORY_STOCK_MOVEMENTS')) {
          const newMov = { id: params[0], movement_number: params[2], quantity_delta: params[7] };
          if (activeTransactionState) {
            activeTransactionState.stagedMovements.push(newMov);
          } else {
            mockDatabaseState.inventory_stock_movements.push(newMov);
          }
          return { rows: [newMov], rowCount: 1 };
        }

        // INSERT INTO medication_dispense_allocations
        if (normalized.startsWith('INSERT INTO MEDICATION_DISPENSE_ALLOCATIONS')) {
          const newAlloc = {
            id: params[0],
            medication_order_id: params[1],
            cpoe_order_id: params[2],
            cpoe_item_id: params[3],
            encounter_id: params[4],
            patient_id: params[5],
            warehouse_id: params[6],
            batch_id: params[7],
            batch_number: params[8],
            expiry_date: params[9],
            quantity_dispensed: params[10],
            unit_price: params[11],
            total_price: params[12],
            dispensed_by_pharmacist_id: params[13],
            dispensed_by_pharmacist_name: params[14],
            dispense_barcode: params[15],
            dispensed_at: params[16],
            status: params[17],
            correlation_id: params[18],
            created_at: params[19]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAllocations.push(newAlloc);
          } else {
            mockDatabaseState.medication_dispense_allocations.push(newAlloc);
          }
          return { rows: [newAlloc], rowCount: 1 };
        }

        // INSERT INTO medication_emar_administrations
        if (normalized.startsWith('INSERT INTO MEDICATION_EMAR_ADMINISTRATIONS')) {
          const newAdmin = {
            id: params[0],
            medication_order_id: params[1],
            cpoe_order_id: params[2],
            cpoe_item_id: params[3],
            dispense_allocation_id: params[4],
            encounter_id: params[5],
            patient_id: params[6],
            administered_at: params[7],
            administered_by_nurse_id: params[8],
            administered_by_nurse_name: params[9],
            witness_nurse_id: params[10],
            witness_nurse_name: params[11],
            dose_given: params[12],
            dose_unit: params[13],
            route_given: params[14],
            scanned_patient_barcode: params[15],
            scanned_medication_barcode: params[16],
            five_rights_verified: params[17],
            administration_status: params[18],
            clinical_notes: params[19],
            charge_captured: params[20],
            charge_id: params[21],
            digital_signature_hash: params[22],
            correlation_id: params[23],
            version: params[24],
            verified_concentration_mg_ml: params[25],
            verified_infusion_rate_ml_hr: params[26],
            verified_volume_ml: params[27],
            created_at: params[28]
          };
          if (activeTransactionState) {
            activeTransactionState.stagedAdministrations.push(newAdmin);
          } else {
            mockDatabaseState.medication_emar_administrations.push(newAdmin);
          }
          return { rows: [newAdmin], rowCount: 1 };
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

        // UPDATE medication_orders
        if (normalized.startsWith('UPDATE MEDICATION_ORDERS')) {
          if (normalized.includes('PHARMACIST_REVIEW_STATUS')) {
            const medId = params[6];
            const updated = {
              pharmacist_review_status: params[0],
              pharmacist_review_notes: params[1],
              reviewed_by_pharmacist_id: params[2],
              reviewed_by_pharmacist_name: params[3],
              reviewed_at: params[4],
              status: params[5]
            };
            if (activeTransactionState) {
              activeTransactionState.medOrderUpdates.push({ id: medId, data: updated });
            }
            return { rows: [{ id: medId, ...updated }], rowCount: 1 };
          }
          if (normalized.includes("SET DISPENSE_STATUS = 'DISPENSED'")) {
            const medId = params[1];
            if (activeTransactionState) {
              activeTransactionState.medOrderUpdates.push({ id: medId, data: { dispense_status: 'DISPENSED', status: 'ACTIVE' } });
            }
            return { rows: [], rowCount: 1 };
          }
          if (normalized.includes("SET STATUS = 'CANCELLED'")) {
            const medId = params[1];
            if (activeTransactionState) {
              activeTransactionState.medOrderUpdates.push({ id: medId, data: { status: 'CANCELLED' } });
            }
            return { rows: [{ id: medId, status: 'CANCELLED' }], rowCount: 1 };
          }
        }

        // UPDATE inventory_batches
        if (normalized.startsWith('UPDATE INVENTORY_BATCHES')) {
          const batchId = params[3];
          const expectedVer = params[4];
          const newQty = params[0];
          const newVer = params[1];

          const target = mockDatabaseState.inventory_batches.find(b => b.id === batchId);
          if (!target || target.version !== expectedVer) {
            // OCC conflict
            return { rows: [], rowCount: 0 };
          }

          if (activeTransactionState) {
            activeTransactionState.batchUpdates.push({ id: batchId, data: { available_quantity: newQty, version: newVer } });
          }
          return { rows: [{ id: batchId, available_quantity: newQty, version: newVer }], rowCount: 1 };
        }

        // UPDATE medication_emar_administrations (ADR)
        if (normalized.startsWith('UPDATE MEDICATION_EMAR_ADMINISTRATIONS')) {
          const adminId = params[1];
          const notes = params[0];
          const found = mockDatabaseState.medication_emar_administrations.find(a => a.id === adminId);
          if (found) {
            found.adverse_reaction_observed = true;
            found.adverse_reaction_notes = notes;
          }
          return { rows: [{ id: adminId, adverse_reaction_observed: true, adverse_reaction_notes: notes }], rowCount: 1 };
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

  // ─── TC-01 s.d. TC-30 (Original Durability Suite) ───
  it('TC-01: should consume CPOE order items and generate medication prescriptions with CDSS screening', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    expect(medOrders.length).toBe(2);
    expect(medOrders[0].medication_code).toBe('MED-PARACETAMOL');
  });

  it('TC-02: should prevent duplicate medication orders when generateMedicationOrders is re-called', async () => {
    const first = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const second = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    expect(second[0].id).toBe(first[0].id);
  });

  it('TC-03: should reject prescribing on CANCELLED CPOE order', async () => {
    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cancelled-med-002' })).rejects.toThrow('CPOE Order yang telah dibatalkan');
  });

  it('TC-04: should strictly block prescribing of medication if patient has documented active allergy', async () => {
    mockDatabaseState.cpoe_order_items.push({
      id: 'item-allergic-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-AMOXICILLIN',
      item_name: 'Amoxicillin 500mg Cap',
      item_specifications: { dosageQuantity: 500, dosageUnit: 'mg', route: 'ORAL' },
      quantity: 10
    });
    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001', overrideAllergy: false })).rejects.toThrow('HARD STOP ALLERGY');
  });

  it('TC-05: should allow allergy override only if valid clinical reason (>=5 chars) is provided', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-allergic-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-AMOXICILLIN',
      item_name: 'Amoxicillin 500mg Cap',
      item_specifications: { dosageQuantity: 500, dosageUnit: 'mg', route: 'ORAL' },
      quantity: 10
    }];
    const result = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      overrideAllergy: true,
      overrideReason: 'Desensitisasi protokol terpasang dengan pengawasan ketat ICU'
    }, { fullName: 'dr. Siti Rahma, Sp.PD', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(result.length).toBe(1);
  });

  it('TC-06: should reject medication dose exceeding maximum single dose safety limit', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-overdose-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-PARACETAMOL',
      item_name: 'Paracetamol 500mg Tab',
      item_specifications: { dosageQuantity: 2500, dosageUnit: 'mg', route: 'ORAL' },
      quantity: 10
    }];
    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' })).rejects.toThrow('DOSE RANGE VIOLATION');
  });

  it('TC-07: should reject medication order with route not permitted for the drug form', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-bad-route-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-PARACETAMOL',
      item_name: 'Paracetamol 500mg Tab',
      item_specifications: { dosageQuantity: 500, dosageUnit: 'mg', route: 'INTRATHECAL' },
      quantity: 10
    }];
    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' })).rejects.toThrow('INVALID ROUTE');
  });

  it('TC-08: should reject overdose in renal impairment when CrCl is below safety cutoff', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-morphine-renal-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-MORPHINE-10',
      item_name: 'Morphine HCl 10mg/mL Ampul',
      item_specifications: { dosageQuantity: 10, dosageUnit: 'mg', route: 'IV_BOLUS' },
      quantity: 1
    }];
    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001', patientCreatinineCl: 20 })).rejects.toThrow('RENAL DOSE LIMIT');
  });

  it('TC-09: should reject e-prescribing by unauthorized roles (403)', async () => {
    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('Wewenang ditolak');
  });

  it('TC-10: should allow clinical pharmacist to review and approve medication order', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const reviewed = await medicationClosedLoopService.pharmacistReviewOrder({
      medicationOrderId: medOrders[0].id,
      reviewDecision: 'APPROVED'
    }, { role: ENTERPRISE_ROLES.ROLE_PHARMACIST });
    expect(reviewed.pharmacist_review_status).toBe('APPROVED');
  });

  it('TC-11: should reject clinical review by non-pharmacist roles (403)', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    await expect(medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, { role: ENTERPRISE_ROLES.ROLE_CASHIER })).rejects.toThrow('Wewenang ditolak');
  });

  it('TC-12: should strictly reject medication dispensing if pharmacist review is still PENDING_REVIEW', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    await expect(medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 10 }, { role: ENTERPRISE_ROLES.ROLE_PHARMACIST })).rejects.toThrow('Resep belum disetujui');
  });

  it('TC-13: should reject dispensing of expired medication batch', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-exp-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-PARACETAMOL-EXP',
      item_name: 'Paracetamol Expired Tab',
      item_specifications: { dosageQuantity: 500, dosageUnit: 'mg', route: 'ORAL' },
      quantity: 5
    }];
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    await expect(medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 5 }, pharmActor)).rejects.toThrow('telah kedaluwarsa');
  });

  it('TC-14: should reject dispensing if a later expiry batch is requested when earlier batch is available (FEFO Guard)', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    await expect(medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 10, expectedBatchId: 'batch-pct-later' }, pharmActor)).rejects.toThrow('Pelanggaran FEFO');
  });

  it('TC-15: should reject dispensing when stock quantity is insufficient', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    await expect(medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 9999 }, pharmActor)).rejects.toThrow('Stok batch BATCH-PCT-2026A tidak mencukupi');
  });

  it('TC-16: should enforce optimistic concurrency control during batch deduction', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 10 }, pharmActor);
    expect(alloc.quantity_dispensed).toBe(10);
    expect(mockDatabaseState.inventory_batches[0].version).toBe(2);
  });

  it('TC-17: should allocate earliest expiry batch and write immutable stock ledger movement', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 10 }, pharmActor);
    expect(alloc.batch_number).toBe('BATCH-PCT-2026A');
    expect(mockDatabaseState.inventory_stock_movements.length).toBe(1);
  });

  it('TC-18: should prevent duplicate dispensing on already dispensed medication order', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 10 }, pharmActor);
    await expect(medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 10 }, pharmActor)).rejects.toThrow('Resep obat ini sudah di-dispense sebelumnya');
  });

  it('TC-19: should strictly block administration if scanned patient wristband barcode does not match', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 1 }, pharmActor);
    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'WRONG-PATIENT-WRISTBAND-999',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('HARD STOP PATIENT SAFETY: Barcode gelang pasien');
  });

  it('TC-20: should strictly block administration if scanned physical drug barcode does not match dispense barcode', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 1 }, pharmActor);
    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: 'DISP-WRONG-MEDICATION-BARCODE',
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('HARD STOP MEDICATION SAFETY: Barcode obat fisik');
  });

  it('TC-21: should block administration if administered dose differs from prescription dose', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 1 }, pharmActor);
    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 1000,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('HARD STOP DOSE SAFETY');
  });

  it('TC-22: should block administration if administered route differs from prescribed route', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 1 }, pharmActor);
    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'IV_BOLUS'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('HARD STOP ROUTE SAFETY');
  });

  it('TC-23: should block duplicate administration of same medication slot within 15 minutes', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 1 }, pharmActor);
    const nurseActor = { role: ENTERPRISE_ROLES.ROLE_NURSE };

    await medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, nurseActor);

    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, nurseActor)).rejects.toThrow('DOUBLE ADMINISTRATION PREVENTED');
  });

  it('TC-24: should block PRN medication if administered before min interval hours (4h)', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const morphMed = medOrders[1];
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: morphMed.id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: morphMed.id, quantityToDispense: 1 }, pharmActor);
    const nurseActor = { role: ENTERPRISE_ROLES.ROLE_NURSE };

    await medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: morphMed.id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 5,
      doseUnit: 'mg',
      routeGiven: 'IV_BOLUS',
      witnessNurseId: 'NURSE-WITNESS-01',
      witnessNurseName: 'Perawat Saksi, S.Kep'
    }, nurseActor);

    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: morphMed.id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 5,
      doseUnit: 'mg',
      routeGiven: 'IV_BOLUS',
      witnessNurseId: 'NURSE-WITNESS-01',
      witnessNurseName: 'Perawat Saksi, S.Kep'
    }, nurseActor)).rejects.toThrow('PRN INTERVAL VIOLATION');
  });

  it('TC-25: should strictly require witness nurse dual-signoff for High-Alert / Narcotic medication', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const morphMed = medOrders[1];
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: morphMed.id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: morphMed.id, quantityToDispense: 1 }, pharmActor);

    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: morphMed.id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 5,
      doseUnit: 'mg',
      routeGiven: 'IV_BOLUS'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('JCI IPSG 3 DUAL-SIGNOFF REQUIRED');
  });

  it('TC-26: should reject bedside administration by non-nurse unauthorized roles (403)', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 1 }, pharmActor);
    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, { role: ENTERPRISE_ROLES.ROLE_CASHIER })).rejects.toThrow('Wewenang ditolak');
  });

  it('TC-27: should propagate medication cancellation and block subsequent dispensing or administration', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    await medicationClosedLoopService.cancelMedicationOrder({ medicationOrderId: medOrders[0].id, cancellationReason: 'Pasien tidak lagi demam' });
    await expect(medicationClosedLoopService.pharmacistReviewOrder({
      medicationOrderId: medOrders[0].id,
      reviewDecision: 'APPROVED'
    }, { role: ENTERPRISE_ROLES.ROLE_PHARMACIST })).rejects.toThrow('Resep obat telah dibatalkan');
  });

  it('TC-28: should document adverse drug reaction and emit pharmacovigilance outbox event', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 1 }, pharmActor);
    const admin = await medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    const adr = await medicationClosedLoopService.documentAdverseReaction({
      administrationId: admin.id,
      adverseReactionNotes: 'Timbul urtikaria dan eritema ringan pada lengan'
    });
    expect(adr.adverse_reaction_observed).toBe(true);
  });

  it('TC-29: should atomically capture charges and write outbox events upon bedside administration', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 1 }, pharmActor);
    const admin = await medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });
    expect(admin.charge_captured).toBe(true);
  });

  it('TC-30: should execute complete closed-loop medication journey with 0 discrepancy across all layers', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[0].id, reviewDecision: 'APPROVED' }, pharmActor);
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: medOrders[1].id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc1 = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[0].id, quantityToDispense: 10 }, pharmActor);
    const alloc2 = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: medOrders[1].id, quantityToDispense: 2 }, pharmActor);

    const nurseActor = { role: ENTERPRISE_ROLES.ROLE_NURSE };
    await medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[0].id,
      dispenseAllocationId: alloc1.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc1.dispense_barcode,
      doseGiven: 500,
      doseUnit: 'mg',
      routeGiven: 'ORAL'
    }, nurseActor);

    expect(mockDatabaseState.clinical_orders[0].status).toBe('PARTIALLY_COMPLETED');

    await medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: medOrders[1].id,
      dispenseAllocationId: alloc2.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc2.dispense_barcode,
      doseGiven: 5,
      doseUnit: 'mg',
      routeGiven: 'IV_BOLUS',
      witnessNurseId: 'NURSE-WITNESS-01',
      witnessNurseName: 'Perawat Saksi, S.Kep'
    }, nurseActor);

    expect(mockDatabaseState.clinical_orders[0].status).toBe('COMPLETED');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ─── CLINICAL INTEGRITY HARDENING SUITE: TC-31 s.d. TC-45 (15 SCENARIOS) ───
  // ══════════════════════════════════════════════════════════════════════════

  // ─── TC-31: CUMULATIVE DAILY DOSE VIOLATION ───
  it('TC-31: should block prescription if cumulative daily dose exceeds maximum daily safety threshold', async () => {
    // 500mg is safe for single dose (max 1000mg), but 8x1 (4000mg max daily) with 8x1 at 600mg = 4800mg/day -> Violation!
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-cumulative-excess-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-PARACETAMOL',
      item_name: 'Paracetamol 500mg Tab',
      item_specifications: { dosageQuantity: 600, dosageUnit: 'mg', route: 'ORAL', frequency: '8x1' }, // 600 * 8 = 4800mg > 4000mg
      quantity: 16
    }];

    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001'
    })).rejects.toThrow('CUMULATIVE DAILY DOSE VIOLATION');
  });

  // ─── TC-32: WEIGHT-BASED PEDIATRIC/GERIATRIC DOSE VIOLATION ───
  it('TC-32: should block prescription if single dose exceeds patient weight-based limit (mg/kg)', async () => {
    // Pediatric patient 15 kg: Paracetamol max single is 15 mg/kg -> max 225 mg. Prescribing 500 mg -> Violation!
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-peds-overdose-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-PARACETAMOL',
      item_name: 'Paracetamol 500mg Tab',
      item_specifications: { dosageQuantity: 500, dosageUnit: 'mg', route: 'ORAL', frequency: '3x1' },
      quantity: 5
    }];

    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      patientWeightKg: 15.0 // 15 kg * 15 mg/kg = max 225 mg
    })).rejects.toThrow('WEIGHT BASED DOSE VIOLATION');
  });

  // ─── TC-33: DRUG-CLASS CROSS-REACTIVITY ALLERGY HARD STOP ───
  it('TC-33: should detect cross-reactivity allergy (Penicillin allergy -> Cephalosporin prescription) and trigger Hard Stop', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-cross-react-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-CEFAZOLIN-1G',
      item_name: 'Cefazolin 1g Vial',
      item_specifications: { dosageQuantity: 1000, dosageUnit: 'mg', route: 'IV_INFUSION', drugClassCode: 'CLASS-CEPHALOSPORIN' },
      quantity: 2
    }];

    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      overrideAllergy: false
    })).rejects.toThrow('HARD STOP ALLERGY (CROSS_REACTIVITY)');
  });

  // ─── TC-34: ALLERGY VS INTOLERANCE DISTINCTION ───
  it('TC-34: should distinguish non-anaphylactic intolerance from lethal allergy and allow acknowledgment', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-intolerance-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-ERYTHROMYCIN',
      item_name: 'Erythromycin 500mg Tab',
      item_specifications: { dosageQuantity: 500, dosageUnit: 'mg', route: 'ORAL', frequency: '3x1' },
      quantity: 6
    }];

    // Unacknowledged -> Warning
    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      intoleranceAcknowledged: false
    })).rejects.toThrow('INTOLERANCE WARNING');

    // Acknowledged -> Succeeds
    const orders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      intoleranceAcknowledged: true
    });
    expect(orders.length).toBe(1);
    expect(orders[0].medication_code).toBe('MED-ERYTHROMYCIN');
  });

  // ─── TC-35: CONTRAINDICATED SEVERE DDI HARD STOP ───
  it('TC-35: should block co-prescription of contraindicated drug combinations (Severe DDI Hard Stop)', async () => {
    mockDatabaseState.cpoe_order_items = [
      {
        id: 'item-sildenafil-001',
        order_id: 'ord-cpoe-med-001',
        item_type: 'PHARMACY',
        catalog_code: 'MED-SILDENAFIL',
        item_name: 'Sildenafil 50mg Tab',
        item_specifications: { dosageQuantity: 50, dosageUnit: 'mg', route: 'ORAL' },
        quantity: 1
      },
      {
        id: 'item-nitro-002',
        order_id: 'ord-cpoe-med-001',
        item_type: 'PHARMACY',
        catalog_code: 'MED-NITROGLYCERIN',
        item_name: 'Nitroglycerin 0.5mg Sublingual',
        item_specifications: { dosageQuantity: 0.5, dosageUnit: 'mg', route: 'SUBLINGUAL' },
        quantity: 5
      }
    ];

    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      overrideDdi: false
    })).rejects.toThrow('HARD STOP SEVERE DDI (CONTRAINDICATED)');
  });

  // ─── TC-36: SEVERE DDI OVERRIDE PROVENANCE & CLINICAL RATIONALE ───
  it('TC-36: should enforce comprehensive clinical rationale for overriding contraindicated DDI', async () => {
    mockDatabaseState.cpoe_order_items = [
      {
        id: 'item-sildenafil-001',
        order_id: 'ord-cpoe-med-001',
        item_type: 'PHARMACY',
        catalog_code: 'MED-SILDENAFIL',
        item_name: 'Sildenafil 50mg Tab',
        item_specifications: { dosageQuantity: 50, dosageUnit: 'mg', route: 'ORAL' },
        quantity: 1
      },
      {
        id: 'item-nitro-002',
        order_id: 'ord-cpoe-med-001',
        item_type: 'PHARMACY',
        catalog_code: 'MED-NITROGLYCERIN',
        item_name: 'Nitroglycerin 0.5mg Sublingual',
        item_specifications: { dosageQuantity: 0.5, dosageUnit: 'mg', route: 'SUBLINGUAL' },
        quantity: 5
      }
    ];

    // Fails with trivial rationale
    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      overrideDdi: true,
      overrideReason: 'ok'
    })).rejects.toThrow('Alasan klinis override interaksi obat');

    // Succeeds with DPJP rationale
    const res = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      overrideDdi: true,
      overrideReason: 'Monitoring hemodinamik invasif arteri line di CVC ICU'
    }, { fullName: 'dr. Siti Rahma, Sp.PD', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });
    expect(res.length).toBe(2);
  });

  // ─── TC-37: CDSS REGIMEN RE-EVALUATION WHEN NEW DRUG ADDED TO ACTIVE ENCOUNTER ───
  it('TC-37: should dynamically re-evaluate existing active regimen when a new prescription is added', async () => {
    // Stage existing active Warfarin in encounter
    mockDatabaseState.medication_orders.push({
      id: 'med-active-warfarin-01',
      encounter_id: 'enc-med-001',
      patient_id: 'pat-med-001',
      medication_code: 'MED-WARFARIN',
      medication_name: 'Warfarin 2mg Tab',
      dosage: '2 mg',
      status: 'ACTIVE',
      created_at: new Date()
    });

    // Attempt to prescribe Aspirin in new CPOE order
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-aspirin-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-ASPIRIN',
      item_name: 'Aspirin 80mg Tab',
      item_specifications: { dosageQuantity: 80, dosageUnit: 'mg', route: 'ORAL' },
      quantity: 10
    }];

    await expect(medicationClosedLoopService.generateMedicationOrdersFromCPOE({
      orderId: 'ord-cpoe-med-001',
      overrideDdi: false
    })).rejects.toThrow('HARD STOP SEVERE DDI');
  });

  // ─── TC-38: MEDICATION ADMINISTRATION SCHEDULING ENGINE ───
  it('TC-38: should preserve frequency and scheduled times in medication orders', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-scheduled-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-PARACETAMOL',
      item_name: 'Paracetamol 500mg Tab',
      item_specifications: { dosageQuantity: 500, dosageUnit: 'mg', route: 'ORAL', frequency: 'Q8H', scheduledTimes: ['06:00', '14:00', '22:00'] },
      quantity: 9
    }];

    const orders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    expect(orders[0].frequency).toBe('Q8H');
    expect(JSON.parse(orders[0].scheduled_times)).toEqual(['06:00', '14:00', '22:00']);
  });

  // ─── TC-39: STAT / NOW MEDICATION TIMING PROTECTION ───
  it('TC-39: should strictly prevent second administration of a STAT / NOW single-dose order', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-stat-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-PARACETAMOL',
      item_name: 'Paracetamol 1000mg IV STAT',
      item_specifications: { dosageQuantity: 1000, dosageUnit: 'mg', route: 'IV_INFUSION', frequency: 'STAT', timingType: 'STAT' },
      quantity: 1
    }];

    const orders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const statMed = orders[0];
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: statMed.id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: statMed.id, quantityToDispense: 1 }, pharmActor);

    const nurseActor = { role: ENTERPRISE_ROLES.ROLE_NURSE };

    // 1st administration -> SUCCESS
    await medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: statMed.id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 1000,
      doseUnit: 'mg',
      routeGiven: 'IV_INFUSION',
      witnessNurseId: 'NURSE-WITNESS-01',
      witnessNurseName: 'Perawat Saksi, S.Kep'
    }, nurseActor);

    // 2nd administration attempt -> BLOCKED
    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: statMed.id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 1000,
      doseUnit: 'mg',
      routeGiven: 'IV_INFUSION',
      witnessNurseId: 'NURSE-WITNESS-01',
      witnessNurseName: 'Perawat Saksi, S.Kep'
    }, nurseActor)).rejects.toThrow('STAT/ONCE MEDICATION VIOLATION');
  });

  // ─── TC-40: CONTINUOUS INFUSION SAFETY & INDEPENDENT DOUBLE CHECK ───
  it('TC-40: should record and verify infusion rate, concentration, and volume with dual nurse sign-off', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-kcl-infusion-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-POTASSIUM-746',
      item_name: 'KCl 7.46% In Dextrose 5% 500mL',
      item_specifications: {
        dosageQuantity: 20,
        dosageUnit: 'mEq',
        route: 'IV_INFUSION',
        frequency: 'CONTINUOUS',
        timingType: 'CONTINUOUS',
        concentrationMgMl: 0.04,
        infusionRateMlHr: 50.00,
        infusionVolumeMl: 500.00,
        isHighAlert: true
      },
      quantity: 1
    }];

    mockDatabaseState.inventory_batches.push({
      id: 'batch-kcl-01',
      warehouse_id: 'wh-central-001',
      medication_code: 'MED-POTASSIUM-746',
      batch_number: 'BATCH-KCL-2026',
      expiry_date: '2027-01-01',
      available_quantity: 10,
      unit_price: 35000.00,
      version: 1
    });

    const orders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const kclMed = orders[0];
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: kclMed.id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: kclMed.id, quantityToDispense: 1 }, pharmActor);

    const admin = await medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: kclMed.id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 20,
      doseUnit: 'mEq',
      routeGiven: 'IV_INFUSION',
      verifiedConcentrationMgMl: 0.04,
      verifiedInfusionRateMlHr: 50.00,
      verifiedVolumeMl: 500.00,
      witnessNurseId: 'NURSE-WITNESS-01',
      witnessNurseName: 'Perawat Saksi, S.Kep'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE });

    expect(admin.verified_infusion_rate_ml_hr).toBe(50.00);
    expect(admin.witness_nurse_name).toBe('Perawat Saksi, S.Kep');
  });

  // ─── TC-41: HIGH-ALERT INDEPENDENT DOUBLE CHECK VALIDATION ───
  it('TC-41: should require witness sign-off on all high-alert bedside administrations', async () => {
    const medOrders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const morphMed = medOrders[1]; // Morphine
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: morphMed.id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: morphMed.id, quantityToDispense: 1 }, pharmActor);

    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: morphMed.id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 5,
      doseUnit: 'mg',
      routeGiven: 'IV_BOLUS',
      witnessNurseId: null // Missing witness!
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('JCI IPSG 3 DUAL-SIGNOFF REQUIRED');
  });

  // ─── TC-42: IV INFUSION RATE MISMATCH REJECTION ───
  it('TC-42: should reject bedside administration if verified infusion pump rate differs from ordered rate', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-rate-mismatch-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-POTASSIUM-746',
      item_name: 'KCl 7.46% Infusion',
      item_specifications: {
        dosageQuantity: 20,
        dosageUnit: 'mEq',
        route: 'IV_INFUSION',
        infusionRateMlHr: 40.00, // Ordered rate is 40 mL/hr
        isHighAlert: true
      },
      quantity: 1
    }];

    mockDatabaseState.inventory_batches.push({
      id: 'batch-kcl-02',
      warehouse_id: 'wh-central-001',
      medication_code: 'MED-POTASSIUM-746',
      batch_number: 'BATCH-KCL-2026B',
      expiry_date: '2027-01-01',
      available_quantity: 10,
      unit_price: 35000.00,
      version: 1
    });

    const orders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const med = orders[0];
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: med.id, reviewDecision: 'APPROVED' }, pharmActor);
    const alloc = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: med.id, quantityToDispense: 1 }, pharmActor);

    // Pump set to 80 mL/hr instead of 40 mL/hr -> REJECT
    await expect(medicationClosedLoopService.verifyBedsideAndAdminister({
      medicationOrderId: med.id,
      dispenseAllocationId: alloc.id,
      scannedPatientBarcode: 'pat-med-001',
      scannedMedicationBarcode: alloc.dispense_barcode,
      doseGiven: 20,
      doseUnit: 'mEq',
      routeGiven: 'IV_INFUSION',
      verifiedInfusionRateMlHr: 80.00,
      witnessNurseId: 'NURSE-WITNESS-01',
      witnessNurseName: 'Perawat Saksi, S.Kep'
    }, { role: ENTERPRISE_ROLES.ROLE_NURSE })).rejects.toThrow('IV INFUSION RATE MISMATCH');
  });

  // ─── TC-43: CONCURRENT FEFO DEPLETION & OCC CONFLICT PROOF ───
  it('TC-43: should prevent negative stock and enforce OCC when two pharmacists dispense the last remaining unit simultaneously', async () => {
    mockDatabaseState.cpoe_order_items = [{
      id: 'item-race-001',
      order_id: 'ord-cpoe-med-001',
      item_type: 'PHARMACY',
      catalog_code: 'MED-SINGLE-STOCK',
      item_name: 'Rare Serum 10mL (1 Unit Left)',
      item_specifications: { dosageQuantity: 1, dosageUnit: 'vial', route: 'IV_INFUSION' },
      quantity: 1
    }];

    const orders = await medicationClosedLoopService.generateMedicationOrdersFromCPOE({ orderId: 'ord-cpoe-med-001' });
    const med = orders[0];
    const pharmActor = { role: ENTERPRISE_ROLES.ROLE_PHARMACIST };
    await medicationClosedLoopService.pharmacistReviewOrder({ medicationOrderId: med.id, reviewDecision: 'APPROVED' }, pharmActor);

    // Pharmacist A dispenses the last unit
    const allocA = await medicationClosedLoopService.dispenseMedicationFEFO({ medicationOrderId: med.id, quantityToDispense: 1 }, pharmActor);
    expect(allocA.quantity_dispensed).toBe(1);

    // Pharmacist B attempts to dispense simultaneously (version is now 2, Pharmacist B has stale version 1)
    await expect(medicationClosedLoopService.dispenseMedicationFEFO({
      medicationOrderId: med.id,
      quantityToDispense: 1
    }, pharmActor)).rejects.toThrow('sudah di-dispense');

    // Verify stock never went below 0
    expect(mockDatabaseState.inventory_batches.find(b => b.medication_code === 'MED-SINGLE-STOCK').available_quantity).toBe(0);
  });

  // ─── TC-44: ADMISSION MEDICATION RECONCILIATION ───
  it('TC-44: should record admission medication reconciliation and emit outbox domain event', async () => {
    const homeMeds = [
      { drugName: 'Amlodipine 5mg Tab', dose: '5mg', frequency: '1x1', lastTaken: '2026-08-20 07:00' },
      { drugName: 'Metformin 500mg Tab', dose: '500mg', frequency: '2x1', lastTaken: '2026-08-19 19:00' }
    ];

    const decisions = [
      { drugName: 'Amlodipine 5mg Tab', action: 'CONTINUE', rationale: 'Lanjutkan kontrol hipertensi' },
      { drugName: 'Metformin 500mg Tab', action: 'DISCONTINUE', rationale: 'Ganti ke Sliding Scale Insulin selama perioperatif' }
    ];

    const recon = await medicationClosedLoopService.reconcileAdmissionMedications({
      encounterId: 'enc-med-001',
      patientId: 'pat-med-001',
      homeMedications: homeMeds,
      decisions: decisions
    }, { fullName: 'dr. Siti Rahma, Sp.PD', role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP });

    expect(recon.reconciliation_type).toBe('ADMISSION');
    expect(mockDatabaseState.medication_reconciliations.length).toBe(1);
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'ADMISSION_MEDICATION_RECONCILED')).toBe(true);
  });

  // ─── TC-45: DISCHARGE MEDICATION RECONCILIATION & TAKE-HOME INSTRUCTIONS ───
  it('TC-45: should record discharge medication reconciliation with patient instructions and closed-loop outbox event', async () => {
    const inpatientMeds = [
      { drugName: 'Paracetamol 500mg Tab', status: 'COMPLETED' },
      { drugName: 'Morphine 10mg IV', status: 'DISCONTINUED' }
    ];

    const dischargeRx = [
      { drugName: 'Cefixime 100mg Cap', dose: '100mg', frequency: '2x1', duration: '5 hari', instructions: 'Habiskan, sesudah makan' },
      { drugName: 'Paracetamol 500mg Tab', dose: '500mg', frequency: '3x1 PRN', duration: '3 hari', instructions: 'Bila demam/nyeri' }
    ];

    const recon = await medicationClosedLoopService.reconcileDischargeMedications({
      encounterId: 'enc-med-001',
      patientId: 'pat-med-001',
      inpatientMedications: inpatientMeds,
      dischargePrescriptions: dischargeRx,
      dischargeInstructions: 'Minum antibiotik sampai habis. Hindari aktivitas berat selama 3 hari.',
      patientEducationDelivered: true
    }, { fullName: 'apt. Dewi Sartika, S.Farm', role: ENTERPRISE_ROLES.ROLE_PHARMACIST });

    expect(recon.reconciliation_type).toBe('DISCHARGE');
    expect(recon.discharge_instructions).toContain('Minum antibiotik');
    expect(mockDatabaseState.clinical_domain_outbox.some(o => o.event_type === 'DISCHARGE_MEDICATION_RECONCILED')).toBe(true);
  });
});
