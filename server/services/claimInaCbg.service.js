/**
 * NurseFlow Enterprise HIS 2026 — Insurance Claim & INA-CBG Grouping Engine
 * Standar: E-Klaim Kemenkes RI, BPJS Kesehatan & Casemix System
 */

export const INACBG_TARIFF_TABLE = {
  'I-4-10-I': { code: 'I-4-10-I', name: 'HIPERTENSI RINGAN (RAWAT JALAN)', tariff: 185000 },
  'I-4-10-II': { code: 'I-4-10-II', name: 'HIPERTENSI SEDANG DENGAN KOMORBID', tariff: 350000 },
  'I-1-03-III': { code: 'I-1-03-III', name: 'INFARK MIOKARD AKUT BERAT (ICU/STEMI)', tariff: 24500000 },
  'K-1-14-I': { code: 'K-1-14-I', name: 'APENDEKTOMI RINGAN (BEDAH)', tariff: 7800000 }
};

class ClaimInaCbgService {
  constructor() {
    this.claims = new Map();
  }

  /**
   * 1. Execute Clinical INA-CBG Grouping
   */
  generateInaCbgGrouping({
    episodeId,
    patientId,
    patientName,
    sepNumber,
    primaryDiagnosisIcd10 = 'I10',
    secondaryDiagnosis = [],
    procedureIcd9cm = [],
    totalHospitalCost = 210000
  }) {
    let cbgsCode = 'I-4-10-I';
    let severityLevel = 'I';

    if (primaryDiagnosisIcd10 === 'I21.9') {
      cbgsCode = 'I-1-03-III';
      severityLevel = 'III';
    } else if (procedureIcd9cm.includes('47.09')) {
      cbgsCode = 'K-1-14-I';
      severityLevel = 'I';
    } else if (secondaryDiagnosis.length > 0) {
      cbgsCode = 'I-4-10-II';
      severityLevel = 'II';
    }

    const cbgsTariff = INACBG_TARIFF_TABLE[cbgsCode]?.tariff || 185000;
    const costVariance = cbgsTariff - totalHospitalCost; // Positive: Profit margin, Negative: Hospital Deficit

    const claimId = `CLM-${Date.now()}`;
    const claim = {
      claimId,
      episodeId,
      patientId,
      patientName,
      sepNumber,
      primaryDiagnosisIcd10,
      secondaryDiagnosis,
      procedureIcd9cm,
      cbgsCode,
      cbgsName: INACBG_TARIFF_TABLE[cbgsCode]?.name || 'KLAIM RAWAT JALAN',
      severityLevel,
      cbgsTariff,
      totalHospitalCost,
      costVariance,
      isProfitable: costVariance >= 0,
      status: 'GROUPED_READY_FOR_EKLAIM',
      createdAt: new Date().toISOString()
    };

    this.claims.set(claimId, claim);
    return claim;
  }

  getClaim(claimId) {
    return this.claims.get(claimId);
  }
}

export const claimInaCbgService = new ClaimInaCbgService();
