/**
 * NurseFlow Enterprise HIS 2026 — Emergency Protocol & Fast-Track Order Set Engine
 * Sprint 3: 1-Click Fast Track for STEMI, Stroke, Sepsis, Trauma, & Cardiac Arrest
 * Standar Kepatuhan: AHA/ACC STEMI Guidelines, AHA/ASA Stroke Protocol, Surviving Sepsis Campaign, ATLS.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';
import { universalEventContractService } from '../../clinical_core/services/universalEventContract.service.js';

export const EMERGENCY_PROTOCOLS = {
  STEMI_CODE: {
    protocol_code: 'STEMI_CODE',
    protocol_name: 'STEMI Fast-Track (Door-to-Balloon < 90 Menit)',
    target_golden_period_minutes: 90,
    badgeColor: 'bg-rose-600 text-white',
    medications: [
      { medicineCode: 'MED-ASP-80', medicineName: 'Aspirin Loading Dose (4 x 80mg)', dose: '320 mg Kunyah', route: 'ORAL', unitPrice: 15000 },
      { medicineCode: 'MED-CLO-75', medicineName: 'Clopidogrel Loading Dose (4 x 75mg)', dose: '300 mg', route: 'ORAL', unitPrice: 45000 },
      { medicineCode: 'MED-ISDN-5', medicineName: 'ISDN Sublingual', dose: '5 mg Sublingual', route: 'SUBLINGUAL', unitPrice: 10000 },
      { medicineCode: 'MED-HEP-5000', medicineName: 'Heparin Bolus IV', dose: '5000 IU', route: 'IV', unitPrice: 85000 }
    ],
    diagnostics: [
      { testCode: 'RAD-EKG-12', testName: 'EKG 12-Lead Cito (< 10 Menit)', isCito: true, category: 'EKG', unitPrice: 75000 },
      { testCode: 'LAB-TROP-I', testName: 'Troponin I Kuantitatif Cito', isCito: true, category: 'LAB', unitPrice: 220000 },
      { testCode: 'LAB-CKMB', testName: 'CK-MB Mass Cito', isCito: true, category: 'LAB', unitPrice: 150000 },
      { testCode: 'RAD-THORAX-CITO', testName: 'Rontgen Thorax AP Portable Cito', isCito: true, category: 'RAD', unitPrice: 180000 }
    ],
    procedures: [
      { procedureCode: 'PROC-CATHLAB-ALERT', procedureName: 'Aktivasi Tim Kateterisasi Jantung (Cath Lab On-Call)' }
    ]
  },
  STROKE_CODE: {
    protocol_code: 'STROKE_CODE',
    protocol_name: 'Code Stroke Akut (Door-to-Needle < 60 Menit)',
    target_golden_period_minutes: 60,
    badgeColor: 'bg-purple-600 text-white',
    medications: [
      { medicineCode: 'MED-CITICOLINE', medicineName: 'Citicoline Injeksi', dose: '1000 mg IV', route: 'IV', unitPrice: 95000 },
      { medicineCode: 'MED-ACTILYSE', medicineName: 'Alteplase (r-tPA) Standby', dose: '0.9 mg/kgBB Standby', route: 'IV', unitPrice: 6500000 }
    ],
    diagnostics: [
      { testCode: 'RAD-CT-HEAD-CITO', testName: 'CT Scan Kepala Non-Contrast Cito (< 20 Menit)', isCito: true, category: 'RAD', unitPrice: 850000 },
      { testCode: 'LAB-GDS-STICK', testName: 'Glukosa Darah Sewaktu (GDS) Rapid', isCito: true, category: 'LAB', unitPrice: 35000 },
      { testCode: 'LAB-COAG-CITO', testName: 'Koagulasi Lengkap (PT/APTT/INR) Cito', isCito: true, category: 'LAB', unitPrice: 195000 }
    ],
    procedures: [
      { procedureCode: 'PROC-NIHSS', procedureName: 'Skoring Skala Stroke NIHSS Lengkap' },
      { procedureCode: 'PROC-NEURO-ALERT', procedureName: 'Aktivasi DPJP Spesialis Saraf Konsultan Stroke' }
    ]
  },
  SEPSIS_BUNDLE: {
    protocol_code: 'SEPSIS_BUNDLE',
    protocol_name: 'Surviving Sepsis Hour-1 Bundle',
    target_golden_period_minutes: 60,
    badgeColor: 'bg-amber-600 text-white',
    medications: [
      { medicineCode: 'MED-CEFTRIAXONE', medicineName: 'Ceftriaxone Spektrum Luas IV', dose: '2 gram IV', route: 'IV', unitPrice: 65000 },
      { medicineCode: 'MED-RL-500', medicineName: 'Resusitasi Kristaloid Ringer Lactate 30ml/kg', dose: '1500 ml IV Rapid', route: 'IV', unitPrice: 45000 }
    ],
    diagnostics: [
      { testCode: 'LAB-LACTATE', testName: 'Laktat Darah Kuantitatif Awal', isCito: true, category: 'LAB', unitPrice: 110000 },
      { testCode: 'LAB-BLOOD-CULTURE', testName: 'Kultur Darah 2 Set (Sebelum Antibiotik)', isCito: true, category: 'LAB', unitPrice: 320000 },
      { testCode: 'LAB-PROCALCITONIN', testName: 'Prokalsitonin (PCT) Kuantitatif', isCito: true, category: 'LAB', unitPrice: 450000 }
    ],
    procedures: [
      { procedureCode: 'PROC-MAP-MONITOR', procedureName: 'Targeting Mean Arterial Pressure (MAP) ≥ 65 mmHg' }
    ]
  },
  TRAUMA_ACTIVATION: {
    protocol_code: 'TRAUMA_ACTIVATION',
    protocol_name: 'Aktivasi Tim Trauma Mayor (ATLS Protocol)',
    target_golden_period_minutes: 30,
    badgeColor: 'bg-rose-700 text-white',
    medications: [
      { medicineCode: 'MED-TXA-500', medicineName: 'Asam Traneksamat (Anti-Fibrinolitik)', dose: '1 gram IV Drips 10 Menit', route: 'IV', unitPrice: 40000 }
    ],
    diagnostics: [
      { testCode: 'RAD-FAST-USG', testName: 'Focused Assessment with Sonography for Trauma (FAST)', isCito: true, category: 'RAD', unitPrice: 250000 },
      { testCode: 'RAD-CERVICAL-CITO', testName: 'Rontgen Cervical AP/Lat/Odontoid Cito', isCito: true, category: 'RAD', unitPrice: 190000 },
      { testCode: 'LAB-CROSSMATCH-4', testName: 'Crossmatch Darah Cito 4 Unit PRC', isCito: true, category: 'LAB', unitPrice: 480000 }
    ],
    procedures: [
      { procedureCode: 'PROC-SURGERY-STANDBY', procedureName: 'Aktivasi Kamar Operasi (OK Cito) & Dokter Bedah' }
    ]
  }
};

const PROTOCOL_EXECUTIONS_KEY = 'nurseflow_emergency_protocol_executions';

const getStoredExecutions = () => {
  try {
    const raw = localStorage.getItem(PROTOCOL_EXECUTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[EmergencyProtocolEngine] Failed to load executions:', e);
  }
  return [];
};

const saveStoredExecutions = (list) => {
  try {
    localStorage.setItem(PROTOCOL_EXECUTIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[EmergencyProtocolEngine] Failed to save executions:', e);
  }
};

export const emergencyProtocolEngineService = {
  /**
   * Activate Emergency Fast-Track Protocol Order Set in 1-Click
   */
  activateProtocol: async ({
    encounterId,
    episodeId,
    patientId,
    patientName,
    protocolCode,
    doctorName = 'dr. Jaga Emergensi',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const proto = EMERGENCY_PROTOCOLS[protocolCode];
    if (!proto) {
      throw new Error(`Protokol emergensi tidak ditemukan: ${protocolCode}`);
    }

    const now = new Date().toISOString();
    const executionRecord = {
      id: `PROTO-EXEC-${Date.now()}`,
      encounter_id: encounterId,
      episode_id: episodeId,
      patient_id: patientId,
      patient_name: patientName,
      protocol_code: proto.protocol_code,
      protocol_name: proto.protocol_name,
      activated_at: now,
      activated_by: doctorName,
      total_items_ordered: proto.medications.length + proto.diagnostics.length + proto.procedures.length,
      status: 'ACTIVE'
    };

    const executions = getStoredExecutions();
    saveStoredExecutions([executionRecord, ...executions]);

    // 1. Automatically dispatch canonical SERVICE_CHARGED events for diagnostics & medications
    for (const med of proto.medications) {
      await universalEventContractService.recordServiceCharge({
        episodeId,
        encounterId,
        patientId,
        serviceCategory: 'MEDICATION',
        serviceCode: med.medicineCode,
        serviceName: `${med.medicineName} (${med.dose})`,
        unitPrice: med.unitPrice,
        quantity: 1,
        isCito: true,
        actorEmail
      });
    }

    for (const diag of proto.diagnostics) {
      await universalEventContractService.recordServiceCharge({
        episodeId,
        encounterId,
        patientId,
        serviceCategory: diag.category === 'LAB' ? 'LABORATORY' : 'RADIOLOGY',
        serviceCode: diag.testCode,
        serviceName: diag.testName,
        unitPrice: diag.unitPrice,
        quantity: 1,
        isCito: true,
        actorEmail
      });
    }

    // 2. Stage Outbox Event
    await outboxPublisherService.stageEvent({
      aggregateType: 'EMERGENCY_PROTOCOL',
      aggregateId: executionRecord.id,
      eventName: 'EMERGENCY_PROTOCOL_ACTIVATED',
      payload: executionRecord,
      actor: actorEmail
    });

    return executionRecord;
  },

  /**
   * Get Protocols Registry
   */
  getProtocols: () => {
    return Object.values(EMERGENCY_PROTOCOLS);
  },

  /**
   * Get Active Protocol Executions
   */
  getExecutions: (encounterId = null) => {
    let list = getStoredExecutions();
    if (encounterId) {
      list = list.filter(e => e.encounter_id === encounterId);
    }
    return list;
  }
};
