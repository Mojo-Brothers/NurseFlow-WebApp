/**
 * NurseFlow Enterprise HIS 2026 — Laboratory Information System (LIS) Engine
 * Sprint 5: Specimen Tracking, Analyzer Simulation, Panic Values & Result Validation
 * Standar Kepatuhan: LOINC, Permenkes 24/2022, JCI GLD (Laboratory Standards).
 */

import { universalOrderEngineService } from './universalOrderEngine.service.js';
import { lisBridgeService } from './lisBridge.service.js';
import { universalEventContractService } from '../../clinical_core/services/universalEventContract.service.js';
import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const LAB_ORDERS_KEY = 'nurseflow_laboratory_orders';

const getStoredLabOrders = () => {
  try {
    const raw = localStorage.getItem(LAB_ORDERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[LaboratoryEngine] Failed to load lab orders:', e);
  }
  return [
    {
      id: 'LAB-ORD-001',
      order_id: 'ORD-2026-001',
      loinc_code: '58410-2',
      test_name: 'Darah Lengkap (Complete Blood Count / CBC)',
      specimen_type: 'WHOLE_BLOOD',
      collected_at: '2026-08-17T09:05:00Z',
      received_at: '2026-08-17T09:10:00Z',
      validated_at: '2026-08-17T09:25:00Z',
      released_at: '2026-08-17T09:25:00Z',
      result_value: 'Hb: 13.8 g/dL, Leuko: 3.2 10^3/uL, Trombo: 48.000 /uL (Kritis), Ht: 44%',
      unit: 'Multi-parameter',
      reference_range: 'Trombosit: 150.000 - 450.000 /uL',
      is_critical_panic: true,
      delta_check_flag: true,
      analyzer_instrument: 'Sysmex XN-1000 Hematology Auto-Analyzer',
      unit_price: 120000,
      result_status: 'RELEASED'
    },
    {
      id: 'LAB-ORD-002',
      order_id: 'ORD-2026-001',
      loinc_code: '42757-5',
      test_name: 'Troponin I Kuantitatif Cito',
      specimen_type: 'SERUM',
      collected_at: '2026-08-17T09:05:00Z',
      received_at: '2026-08-17T09:10:00Z',
      validated_at: null,
      released_at: null,
      result_value: null,
      unit: 'ng/mL',
      reference_range: '< 0.04 ng/mL',
      is_critical_panic: false,
      delta_check_flag: false,
      analyzer_instrument: null,
      unit_price: 220000,
      result_status: 'SPECIMEN_RECEIVED'
    }
  ];
};

const saveStoredLabOrders = (list) => {
  try {
    localStorage.setItem(LAB_ORDERS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[LaboratoryEngine] Failed to save lab orders:', e);
  }
};

export const laboratoryEngineService = {
  /**
   * Create Laboratory Order from Clinical EMR
   */
  createLabOrder: async ({
    patientId,
    patientName,
    mrn,
    episodeId,
    encounterId,
    orderedBy = 'dr. Siti Wijaya, Sp.PD-KGEH',
    priority = 'CITO',
    clinicalIndication = 'Evaluasi laboratorium klinis',
    items = [],
    actorEmail = 'doctor@nurseflow.id'
  }) => {
    let totalEst = 0;
    items.forEach(it => {
      totalEst += Number(it.unitPrice) || 0;
    });

    // 1. Create Universal Order Root
    const parentOrder = await universalOrderEngineService.createOrder({
      patientId,
      patientName,
      mrn,
      episodeId,
      encounterId,
      orderedBy,
      orderCategory: 'LABORATORY',
      priority,
      clinicalIndication,
      itemsCount: items.length,
      estimatedAmount: totalEst,
      actorEmail
    });

    // 2. Create Lab Order Item Records
    const labRecords = items.map((item, idx) => ({
      id: `LAB-ORD-${Date.now()}-${idx}`,
      order_id: parentOrder.id,
      loinc_code: item.loinc || '58410-2',
      test_name: item.name,
      specimen_type: item.specimen || 'WHOLE_BLOOD',
      collected_at: null,
      received_at: null,
      validated_at: null,
      released_at: null,
      result_value: null,
      unit: item.unit || 'Standard',
      reference_range: item.refRange || '-',
      is_critical_panic: false,
      delta_check_flag: false,
      analyzer_instrument: null,
      unit_price: Number(item.unitPrice) || 0,
      result_status: 'ORDERED'
    }));

    const currentList = getStoredLabOrders();
    saveStoredLabOrders([...labRecords, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'LABORATORY_ORDER',
      aggregateId: parentOrder.id,
      eventName: 'LAB_ORDER_CREATED',
      payload: { parentOrder, labRecords },
      actor: actorEmail
    });

    return { parentOrder, laboratoryOrders: labRecords };
  },

  /**
   * Update Specimen Tracking Lifecycle (COLLECTED -> RECEIVED -> ANALYZING)
   */
  updateSpecimenStatus: async ({ labOrderId, nextStatus, analyzerInstrument = null }) => {
    const list = getStoredLabOrders();
    const index = list.findIndex(l => l.id === labOrderId);
    if (index === -1) throw new Error(`Lab item ${labOrderId} tidak ditemukan.`);

    const lab = list[index];
    const now = new Date().toISOString();

    lab.result_status = nextStatus;
    if (nextStatus === 'SPECIMEN_COLLECTED') lab.collected_at = now;
    if (nextStatus === 'SPECIMEN_RECEIVED') lab.received_at = now;
    if (nextStatus === 'ANALYZING' && analyzerInstrument) lab.analyzer_instrument = analyzerInstrument;

    list[index] = lab;
    saveStoredLabOrders(list);
    return lab;
  },

  /**
   * Run Analyzer & Validate/Release Lab Results
   */
  releaseLabResult: async ({
    labOrderId,
    episodeId = 'EOC-2026-001',
    encounterId = 'ENC-2026-001',
    patientId = 'P-1001',
    isCito = true,
    validatorName = 'dr. Sp.PK (Dokter Patologi Klinik)',
    actorEmail = 'lab@nurseflow.id'
  }) => {
    const list = getStoredLabOrders();
    const index = list.findIndex(l => l.id === labOrderId);
    if (index === -1) throw new Error(`Lab item ${labOrderId} tidak ditemukan.`);

    const lab = list[index];
    const sim = await lisBridgeService.simulateAnalyzerRun(lab.loinc_code, lab.specimen_type);
    const now = new Date().toISOString();

    lab.analyzer_instrument = sim.analyzerInstrument;
    lab.result_value = sim.resultValue;
    lab.unit = sim.unit;
    lab.is_critical_panic = sim.isPanicValue;
    lab.validated_at = now;
    lab.released_at = now;
    lab.result_status = 'RELEASED';

    list[index] = lab;
    saveStoredLabOrders(list);

    // Automatically Dispatch Canonical Event to Universal Event Bus for Billing Ledger Projection
    await universalEventContractService.recordServiceCharge({
      episodeId,
      encounterId,
      patientId,
      serviceCategory: 'LABORATORY',
      serviceCode: lab.loinc_code,
      serviceName: lab.test_name,
      unitPrice: lab.unit_price,
      quantity: 1,
      isCito,
      actorEmail
    });

    await outboxPublisherService.stageEvent({
      aggregateType: 'LABORATORY_RESULT',
      aggregateId: lab.id,
      eventName: 'LAB_RESULT_RELEASED',
      payload: { ...lab, validatorName, panicMessage: sim.panicMessage },
      actor: actorEmail
    });

    return lab;
  },

  getLabOrders: (orderId = null) => {
    let list = getStoredLabOrders();
    if (orderId) {
      list = list.filter(l => l.order_id === orderId);
    }
    return list;
  }
};
