/**
 * NurseFlow Enterprise HIS 2026 — Sprint 4B.2: IGD Rapid Workspace & Resuscitation Board Stress Test
 * Standards: ESI v4 5-Level Triage, Shock Trauma Protocol, CITO CPOE Bundle,
 * Sub-2-Minute End-to-End Emergency Clinical Journey Benchmark.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { triageEngineService } from '../src/modules/emergency/services/triageEngine.service.js';
import { universalOrderEngineService } from '../src/modules/orders/services/universalOrderEngine.service.js';
import { usePatientStore } from '../src/modules/patient/patient.store.js';
import { useEncounterStore } from '../src/modules/encounter/encounter.store.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';

// Polyfill localStorage in test environment
const mockStorage = new Map();
const storagePolyfill = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k),
  clear: () => mockStorage.clear()
};
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = storagePolyfill;
}

describe('🚨 SPRINT 4B.2: IGD Emergency Stress Test Simulation (< 2 Menit)', () => {
  beforeEach(() => {
    mockStorage.clear();
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    useEncounterStore.getState().clearLiveContext();
  });

  // ==========================================================================
  // STEP 1: EMERGENCY REGISTRATION OF UNIDENTIFIED PATIENT (TN. MR. X)
  // Target: < 30 Detik
  // ==========================================================================
  it('1. Step 1: Emergency Patient Registration (Mr. X, 35 Th, KLL Trauma)', async () => {
    const startTime = performance.now();

    const timestamp = Date.now().toString().slice(-4);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const mrn = `MRX-${today}-${timestamp}`;

    const newPatient = {
      id: `P-${mrn}`,
      mrn,
      name: `Tn. Mr. X (${timestamp})`,
      dob: '1991-01-01',
      age: '35 Th',
      gender: 'M',
      is_anonymous: true,
      status: 'EMERGENCY_ACTIVE',
      room: 'Bed RES-01 (Resusitasi)',
      payer: 'Jasa Raharja / Darurat Kemenkes',
      emergencyContact: { name: 'Petugas Ambulans 118', phone: '118' }
    };

    await usePatientStore.getState().addPatient(newPatient, 'Perawat Triase IGD');
    useEncounterStore.getState().setLiveContext(newPatient.id, `ENC-${newPatient.id}`);

    const elapsedMs = performance.now() - startTime;
    expect(useEncounterStore.getState().activePatientId).toBe(newPatient.id);
    expect(elapsedMs).toBeLessThan(100); // Sub-100ms in in-memory test (< 30s target)
  });

  // ==========================================================================
  // STEP 2 & 3: TRIASE ESI-1 AUTO-CLASSIFICATION & VITAL SIGNS FAST INPUT
  // Parameters: TD 80/50, Nadi 132, RR 32, SpO2 88%, GCS 9 (E2V3M4) -> SHOCK ESI 1
  // Target: < 30 Detik Triase + < 20 Detik Vitals
  // ==========================================================================
  it('2. Step 2 & 3: Vital Signs Fast Entry & ESI-1 Resuscitation Classification', () => {
    const startTime = performance.now();

    const classification = triageEngineService.classifySeverity({
      airwayStatus: 'THREATENED',
      breathingStatus: 'DYSPNEA',
      circulationStatus: 'SHOCK',
      spo2: 88,
      heartRate: 132,
      gcsTotal: 9, // E2 + V3 + M4
      painScale: 8
    });

    const elapsedMs = performance.now() - startTime;

    expect(classification.level).toBe(1); // ESI 1 (Immediate / Red)
    expect(classification.targetMinutes).toBe(0); // Zero wait time!
    expect(elapsedMs).toBeLessThan(10);
  });

  // ==========================================================================
  // STEP 4, 5, 6: 1-CLICK CPOE EMERGENCY TRAUMA BUNDLE
  // Target: Lab CITO < 10s, Rad CITO < 10s, Fluid Resus < 5s
  // ==========================================================================
  it('3. Step 4, 5, 6: CITO CPOE Bundle Dispatch (Lab, Radiology & Fluid Resus)', async () => {
    const startTime = performance.now();

    const patientId = 'P-MRX-2026-9999';
    const encounterId = 'ENC-P-MRX-2026-9999';

    // 1. Lab CITO Orders
    const labOrders = [
      'Darah Lengkap (CBC) CITO',
      'Golongan Darah & Crossmatch 2 Unit PRC CITO',
      'Analisa Gas Darah (AGD) CITO',
      'Serum Laktat CITO'
    ];
    for (const name of labOrders) {
      await universalOrderEngineService.createOrder({
        encounterId,
        patientId,
        patientName: 'Tn. Mr. X',
        mrn: 'MRX-2026-9999',
        orderCategory: 'LABORATORY',
        priority: 'CITO',
        clinicalIndication: 'KLL Trauma Multipel, Penurunan Kesadaran, Syok Hemoragik',
        items: [{ name, quantity: 1 }]
      });
    }

    // 2. Radiology CITO Orders
    const radOrders = [
      'Foto Thorax AP CITO',
      'USG FAST Trauma Abdomen CITO',
      'CT-Scan Brain Non-Kontras CITO'
    ];
    for (const name of radOrders) {
      await universalOrderEngineService.createOrder({
        encounterId,
        patientId,
        patientName: 'Tn. Mr. X',
        mrn: 'MRX-2026-9999',
        orderCategory: 'RADIOLOGY',
        priority: 'CITO',
        clinicalIndication: 'KLL Trauma Kepala & Abdomen',
        items: [{ name, quantity: 1 }]
      });
    }

    // 3. Fluid Resuscitation CITO Orders
    const medOrders = [
      'Infus Ringer Lactate 1000ml CITO (Rapid Bolus)',
      'Oksigen Masker NRM 12 lpm'
    ];
    for (const name of medOrders) {
      await universalOrderEngineService.createOrder({
        encounterId,
        patientId,
        patientName: 'Tn. Mr. X',
        mrn: 'MRX-2026-9999',
        orderCategory: 'PHARMACY',
        priority: 'CITO',
        clinicalIndication: 'Resusitasi Syok Hipovolemik',
        items: [{ name, quantity: 1 }]
      });
    }

    const elapsedMs = performance.now() - startTime;
    const allOrders = universalOrderEngineService.getOrders({ encounter_id: encounterId });

    expect(allOrders.length).toBe(9);
    expect(allOrders.every(o => o.priority === 'CITO')).toBe(true);
    expect(elapsedMs).toBeLessThan(100);
  });

  // ==========================================================================
  // TOTAL CLINICAL E2E JOURNEY RECONCILIATION (< 2 MENIT)
  // ==========================================================================
  it('4. Total IGD Journey Benchmark (< 2 Menit E2E Target)', async () => {
    const totalStart = performance.now();

    // 1. Register Mr. X
    const mrn = `MRX-TEST-E2E`;
    const patient = {
      id: `P-${mrn}`,
      mrn,
      name: 'Tn. Mr. X (Trauma)',
      dob: '1991-01-01',
      gender: 'M',
      status: 'EMERGENCY_ACTIVE'
    };
    await usePatientStore.getState().addPatient(patient, 'Perawat Triase');
    useEncounterStore.getState().setLiveContext(patient.id, `ENC-${patient.id}`);

    // 2. Classify Triage & Record
    const triageRecord = await triageEngineService.recordTriageAssessment({
      episodeId: 'EOC-IGD-001',
      encounterId: `ENC-${patient.id}`,
      patientId: patient.id,
      patientName: patient.name,
      mrn: patient.mrn,
      triageMethod: 'ESI_V4',
      chiefComplaint: 'KLL, GCS 9, Syok Hemoragik',
      airwayStatus: 'THREATENED',
      breathingStatus: 'DYSPNEA',
      circulationStatus: 'SHOCK',
      bloodPressureSystolic: 80,
      bloodPressureDiastolic: 50,
      heartRate: 132,
      respiratoryRate: 32,
      spo2: 88,
      gcsEye: 2,
      gcsVerbal: 3,
      gcsMotor: 4,
      painScale: 8,
      assessorName: 'Ns. Sarah, S.Kep'
    });

    expect(triageRecord.is_cito).toBe(true);
    expect(triageRecord.target_response_minutes).toBe(0);

    // 3. Dispatch 9 CITO Orders in 1 batch
    const orderPromises = [
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'LABORATORY', priority: 'CITO', items: [{ name: 'Darah Lengkap CITO' }] }),
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'LABORATORY', priority: 'CITO', items: [{ name: 'Crossmatch 2 Unit PRC CITO' }] }),
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'LABORATORY', priority: 'CITO', items: [{ name: 'AGD CITO' }] }),
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'LABORATORY', priority: 'CITO', items: [{ name: 'Serum Laktat CITO' }] }),
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'RADIOLOGY', priority: 'CITO', items: [{ name: 'Foto Thorax AP CITO' }] }),
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'RADIOLOGY', priority: 'CITO', items: [{ name: 'USG FAST CITO' }] }),
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'RADIOLOGY', priority: 'CITO', items: [{ name: 'CT Brain Non-Kontras CITO' }] }),
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'PHARMACY', priority: 'CITO', items: [{ name: 'Infus RL 1000ml CITO' }] }),
      universalOrderEngineService.createOrder({ encounterId: `ENC-${patient.id}`, patientId: patient.id, orderCategory: 'PHARMACY', priority: 'CITO', items: [{ name: 'Oksigen NRM 12 lpm' }] })
    ];

    await Promise.all(orderPromises);

    const totalElapsedMs = performance.now() - totalStart;

    // Total execution in engine benchmark is sub-250ms (well within the human-operated SLA target of < 120 seconds / 2 minutes)
    expect(totalElapsedMs).toBeLessThan(1000);
  });
});
