/**
 * NurseFlow Enterprise HIS 2026 — Surgical Revenue Cycle & INA-CBG Grouper Service
 * Standard: Permenkes Tarif INA-CBG BPJS, BPJS V-Claim 2.0 Bridge, Medical Device UDI Implants
 */

import { eventBusService, DOMAIN_EVENTS } from '../realtime/eventBus.service.js';

// Standard INA-CBG Tariff Catalog for Surgical Procedures (Kelas 1 / RS Tipe B Standar)
export const INACBG_SURGICAL_CATALOG = {
  'K35.8+47.0': {
    code: 'K-1-14-I',
    description: 'PROSEDUR USUS BUNTU RINGAN (APPENDECTOMY)',
    severity: 'I (RINGAN)',
    tariffIdr: 12850000.00
  },
  'K80.2+51.23': {
    code: 'K-1-20-I',
    description: 'KOLESISTEKTOMI LAPAROSKOPIK (LAPAROSCOPIC CHOLECYSTECTOMY)',
    severity: 'I (RINGAN)',
    tariffIdr: 18500000.00
  },
  'S52.5+79.32': {
    code: 'M-1-04-I',
    description: 'FIKSASI INTERNAL FRAKTUR TULANG RADIUS/ULNA (ORIF)',
    severity: 'I (RINGAN)',
    tariffIdr: 16200000.00
  },
  'S06.2+01.24': {
    code: 'N-1-10-II',
    description: 'KRANIOTOMI EVAKUASI HEMATOMA INTRAKRANIAL CITO',
    severity: 'II (SEDANG)',
    tariffIdr: 34500000.00
  },
  'O82.0+74.1': {
    code: 'O-1-10-I',
    description: 'SEKSIO SESAREA ELEKTIF / CITO (C-SECTION)',
    severity: 'I (RINGAN)',
    tariffIdr: 11400000.00
  }
};

class SurgicalRevenueCycleService {
  constructor() {
    this.implants = new Map();
    this.billingLedger = new Map();
    this.initDemoBillingData();
  }

  initDemoBillingData() {
    // 1. Demo Implant (ORIF Plate)
    const imp1 = {
      id: 'IMP-2026-001',
      surgicalCaseId: 'CASE-SURG-001',
      encounterId: 'ENC-2026-003',
      patientMrn: 'MRX-2026-A1',
      implantName: 'Synthes Titanium Distal Radius Locking Compression Plate 3.5mm',
      udiBarcode: '(01)07612345678901(17)291231(10)LOT-8823(21)SN-99824',
      serialNumber: 'SN-99824',
      lotNumber: 'LOT-8823',
      manufacturer: 'DePuy Synthes Medical',
      expirationDate: '2029-12-31',
      anatomicalLocation: 'Radius Distal Sinistra',
      implantedBySurgeon: 'dr. Budi Santoso, Sp.B',
      unitCostIdr: 4500000.00,
      billingStatus: 'BILLED'
    };

    this.implants.set(imp1.id, imp1);
  }

  /**
   * 1. Track Permanent Implant (UDI Compliance)
   */
  trackPermanentImplant(payload) {
    if (!payload.udiBarcode || !payload.serialNumber || !payload.lotNumber) {
      throw new Error('Pencatatan implan wajib menyertakan UDI Barcode, Serial Number, dan Lot Number.');
    }

    const id = payload.id || `IMP-${Date.now()}`;
    const newImplant = {
      id,
      surgicalCaseId: payload.surgicalCaseId,
      encounterId: payload.encounterId,
      patientMrn: payload.patientMrn,
      implantName: payload.implantName,
      udiBarcode: payload.udiBarcode,
      serialNumber: payload.serialNumber,
      lotNumber: payload.lotNumber,
      manufacturer: payload.manufacturer,
      expirationDate: payload.expirationDate,
      anatomicalLocation: payload.anatomicalLocation,
      implantedBySurgeon: payload.implantedBySurgeon,
      unitCostIdr: Number(payload.unitCostIdr) || 0,
      billingStatus: 'BILLED',
      createdAt: new Date().toISOString()
    };

    this.implants.set(id, newImplant);
    return newImplant;
  }

  getImplantsByCase(caseId) {
    return Array.from(this.implants.values()).filter(i => i.surgicalCaseId === caseId);
  }

  /**
   * 2. Calculate Itemized Surgical Billing & INA-CBG Grouper
   */
  calculateSurgicalBilling(caseId, {
    encounterId = 'ENC-2026-003',
    patientMrn = 'MRX-2026-A1',
    operatingRoomFee = 2500000.00,
    surgeonProfessionalFee = 4500000.00,
    anesthesiaProfessionalFee = 2000000.00,
    consumablesCharge = 1200000.00,
    anestheticDrugsCharge = 850000.00,
    icd10 = 'K35.8',
    icd9cm = '47.0'
  } = {}) {
    const caseImplants = this.getImplantsByCase(caseId);
    const implantsCharge = caseImplants.reduce((sum, imp) => sum + imp.unitCostIdr, 0);

    const totalHospitalCost = Number(operatingRoomFee) +
      Number(surgeonProfessionalFee) +
      Number(anesthesiaProfessionalFee) +
      Number(consumablesCharge) +
      Number(anestheticDrugsCharge) +
      Number(implantsCharge);

    // INA-CBG Match
    const matchKey = `${icd10}+${icd9cm}`;
    const inacbgMatch = INACBG_SURGICAL_CATALOG[matchKey] || {
      code: 'K-1-14-I',
      description: 'PROSEDUR BEDAH UMUM TERSTANDAR (INA-CBG)',
      severity: 'I (RINGAN)',
      tariffIdr: 12850000.00
    };

    const inacbgTariff = inacbgMatch.tariffIdr;
    const hospitalMargin = inacbgTariff - totalHospitalCost;

    const breakdown = {
      id: `SURG-BILL-${Date.now()}`,
      surgicalCaseId: caseId,
      encounterId,
      patientMrn,
      operatingRoomFee: Number(operatingRoomFee),
      surgeonProfessionalFee: Number(surgeonProfessionalFee),
      anesthesiaProfessionalFee: Number(anesthesiaProfessionalFee),
      consumablesCharge: Number(consumablesCharge),
      anestheticDrugsCharge: Number(anestheticDrugsCharge),
      implantsCharge,
      implantsCount: caseImplants.length,
      totalHospitalCost,
      icd10PrimaryDiagnosis: icd10,
      icd9cmPrimaryProcedure: icd9cm,
      inacbgCode: inacbgMatch.code,
      inacbgDescription: inacbgMatch.description,
      inacbgSeverity: inacbgMatch.severity,
      inacbgTariff,
      hospitalMargin,
      claimSubmissionStatus: 'READY_FOR_SUBMISSION',
      calculatedAt: new Date().toISOString()
    };

    this.billingLedger.set(caseId, breakdown);

    // Publish Billing Event
    eventBusService.publish(DOMAIN_EVENTS.ORDER_CREATED, {
      type: 'SURGICAL_BILLING_FINALIZED',
      caseId,
      totalHospitalCost,
      inacbgTariff,
      margin: hospitalMargin
    });

    return breakdown;
  }

  /**
   * 3. Generate BPJS V-Claim 2.0 Surgical Claim Payload
   */
  generateBpjsVclaimSurgicalPayload(caseId) {
    const bill = this.billingLedger.get(caseId);
    if (!bill) {
      throw new Error(`Rincian billing untuk kasus ${caseId} belum dihitung.`);
    }

    return {
      request: {
        t_klaim: {
          noSep: `SEP-2026-0817-${caseId.slice(-4)}`,
          noKartuBpjs: '0001234567891',
          tglSep: bill.calculatedAt.split('T')[0],
          tglPulang: bill.calculatedAt.split('T')[0],
          jenisPelayanan: '1 (Rawat Inap Bedah)',
          diagnosaUtama: bill.icd10PrimaryDiagnosis,
          prosedurUtama: bill.icd9cmPrimaryProcedure,
          kodeInacbg: bill.inacbgCode,
          tarifInacbg: bill.inacbgTariff,
          tarifBiayaRiilRS: bill.totalHospitalCost,
          pembiayaan: '1 (BPJS Kesehatan)',
          userVerifikator: 'Verifikator BPJS RSUP'
        }
      }
    };
  }

  getBillingByCaseId(caseId) {
    return this.billingLedger.get(caseId);
  }
}

export const surgicalRevenueCycleService = new SurgicalRevenueCycleService();
