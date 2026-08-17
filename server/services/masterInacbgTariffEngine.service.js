/**
 * NurseFlow Enterprise HIS 2026 — Dynamic Versioned INA-CBG Tariff Engine
 * Standard: Permenkes No. 3 Tahun 2023 tentang Standar Tarif Pelayanan Kesehatan BPJS
 */

export const HOSPITAL_CLASS_MULTIPLIERS = {
  A: 1.15, // RSUP Kelas A
  B: 1.00, // RSUD / RS Swasta Tipe B (Baseline)
  C: 0.88, // RS Tipe C
  D: 0.76  // RS Tipe D
};

class MasterInacbgTariffEngineService {
  constructor() {
    this.tariffs = new Map();
    this.activeVersion = 'PERMENKES_3_2023';
    this.initMasterTariffs();
  }

  initMasterTariffs() {
    const defaultTariffs = [
      {
        id: 'TAR-001',
        version: 'PERMENKES_3_2023',
        inacbgCode: 'K-1-14-I',
        procedureCode: '47.0',
        diagnosisCode: 'K35.8',
        description: 'PROSEDUR USUS BUNTU RINGAN (APPENDECTOMY)',
        severityLevel: 'I',
        baseTariffIdr: 12850000.00
      },
      {
        id: 'TAR-002',
        version: 'PERMENKES_3_2023',
        inacbgCode: 'K-1-20-I',
        procedureCode: '51.23',
        diagnosisCode: 'K80.2',
        description: 'KOLESISTEKTOMI LAPAROSKOPIK',
        severityLevel: 'I',
        baseTariffIdr: 18500000.00
      },
      {
        id: 'TAR-003',
        version: 'PERMENKES_3_2023',
        inacbgCode: 'M-1-04-I',
        procedureCode: '79.32',
        diagnosisCode: 'S52.5',
        description: 'FIKSASI INTERNAL FRAKTUR TULANG RADIUS/ULNA (ORIF)',
        severityLevel: 'I',
        baseTariffIdr: 16200000.00
      },
      {
        id: 'TAR-004',
        version: 'PERMENKES_3_2023',
        inacbgCode: 'N-1-10-II',
        procedureCode: '01.24',
        diagnosisCode: 'S06.2',
        description: 'KRANIOTOMI EVAKUASI HEMATOMA INTRAKRANIAL CITO',
        severityLevel: 'II',
        baseTariffIdr: 34500000.00
      }
    ];

    defaultTariffs.forEach(t => this.tariffs.set(`${t.version}_${t.inacbgCode}`, t));
  }

  /**
   * Resolves tariff dynamically with hospital class multiplier
   */
  resolveTariff({ inacbgCode, version = this.activeVersion, hospitalClass = 'B' }) {
    const tariffKey = `${version}_${inacbgCode}`;
    const tariff = this.tariffs.get(tariffKey);

    if (!tariff) {
      // Default fallback
      return {
        inacbgCode,
        version,
        hospitalClass,
        description: 'PROSEDUR INA-CBG TERSTANDAR',
        baseTariffIdr: 10000000.00,
        adjustedTariffIdr: 10000000.00 * (HOSPITAL_CLASS_MULTIPLIERS[hospitalClass] || 1.0)
      };
    }

    const multiplier = HOSPITAL_CLASS_MULTIPLIERS[hospitalClass] || 1.0;
    const adjustedTariffIdr = tariff.baseTariffIdr * multiplier;

    return {
      ...tariff,
      hospitalClass,
      multiplier,
      adjustedTariffIdr
    };
  }

  /**
   * Resolves tariff dynamically from ICD-10 and ICD-9 codes
   */
  resolveDynamicTariff({ primaryIcd10 = 'K35.8', secondaryIcd10 = [], icd9Procedures = [], hospitalClass = 'B' }) {
    let inacbgCode = 'K-1-14-I';
    let description = 'PROSEDUR USUS BUNTU RINGAN (APPENDECTOMY)';
    let severityLevel = 'I';
    let baseTariffIdr = 12850000.00;

    if (icd9Procedures.includes('51.23') || primaryIcd10.startsWith('K80')) {
      inacbgCode = 'K-1-20-I';
      description = 'KOLESISTEKTOMI LAPAROSKOPIK';
      baseTariffIdr = 18500000.00;
    } else if (icd9Procedures.includes('79.32') || primaryIcd10.startsWith('S52')) {
      inacbgCode = 'M-1-04-I';
      description = 'FIKSASI INTERNAL FRAKTUR TULANG RADIUS/ULNA (ORIF)';
      baseTariffIdr = 16200000.00;
    } else if (icd9Procedures.includes('01.24') || primaryIcd10.startsWith('S06')) {
      inacbgCode = 'N-1-10-II';
      description = 'KRANIOTOMI EVAKUASI HEMATOMA INTRAKRANIAL CITO';
      severityLevel = 'II';
      baseTariffIdr = 34500000.00;
    }

    const multiplier = HOSPITAL_CLASS_MULTIPLIERS[hospitalClass] || 1.0;
    const finalTariff = baseTariffIdr * multiplier;

    return {
      cbgCode: inacbgCode,
      cbgDescription: description,
      severityLevel,
      baseTariff: baseTariffIdr,
      multiplier,
      finalTariff
    };
  }

  getAllTariffs(version = this.activeVersion) {
    return Array.from(this.tariffs.values()).filter(t => t.version === version);
  }
}

export const masterInacbgTariffEngineService = new MasterInacbgTariffEngineService();
