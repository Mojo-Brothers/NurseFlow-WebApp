/**
 * NurseFlow Enterprise HIS 2026 — Medication Clinical Safety Engine
 * Look-Alike Sound-Alike (LASA) detection with Tall Man Lettering,
 * Drug-Drug Interaction (DDI) severity checker, and High-Alert drug safeguards.
 */

export const KNOWN_LASA_PAIRS = [
  { drugA: 'DOPAmine', drugB: 'DOBUTamine', riskLevel: 'HIGH', note: 'Inotropik / Vasopresor Kritis' },
  { drugA: 'EPINephrine', drugB: 'EPHEdrine', riskLevel: 'CRITICAL', note: 'Adrenergik Emergensi' },
  { drugA: 'HumaLOG', drugB: 'HumuLIN', riskLevel: 'HIGH', note: 'Insulin Rapid vs Intermediate' },
  { drugA: 'CefaZOLIN', drugB: 'CefoTAXIME', riskLevel: 'MODERATE', note: 'Antibiotik Sefalosporin' }
];

export const KNOWN_DRUG_INTERACTIONS = [
  {
    drugA: 'MED-AML-10', // Amlodipine
    drugB: 'MED-SIM-20', // Simvastatin
    severity: 'MODERATE',
    effect: 'Meningkatkan konsentrasi plasma Simvastatin & risiko rhabdomyolysis',
    recommendation: 'Batasi dosis Simvastatin maksimal 20 mg/hari saat dikombinasikan dengan Amlodipine.'
  },
  {
    drugA: 'MED-WAR-05', // Warfarin
    drugB: 'MED-ASP-80', // Aspirin
    severity: 'MAJOR',
    effect: 'Sinergisme antikoagulan & antiplatelet meningkatkan risiko perdarahan mayor GIT/intrakranial',
    recommendation: 'Hindari kombinasi tanpa pemantauan ketat INR dan indikasi klinis kuat (misal: katup jantung mekanik).'
  },
  {
    drugA: 'MED-MOR-10', // Morphine
    drugB: 'MED-DIA-05', // Diazepam
    severity: 'MAJOR',
    effect: 'Depresi sistem saraf pusat dan depresi pernapasan berat / fatal',
    recommendation: 'Gunakan dosis terendah dengan monitor saturasi SpO2 & frekuensi napas kontinyu.'
  }
];

export const medicationSafetyService = {
  /**
   * Check if two drugs have LASA risk
   */
  detectLasaRisk: (drugNameA = '', drugNameB = '') => {
    if (!drugNameA || !drugNameB) return null;
    const nameA = drugNameA.toLowerCase().trim();
    const nameB = drugNameB.toLowerCase().trim();

    return KNOWN_LASA_PAIRS.find(pair => 
      (pair.drugA.toLowerCase() === nameA && pair.drugB.toLowerCase() === nameB) ||
      (pair.drugA.toLowerCase() === nameB && pair.drugB.toLowerCase() === nameA)
    ) || null;
  },

  /**
   * Check interactions across a list of prescribed medicines
   */
  checkMedicationInteractions: (medicineIds = [], interactionDb = KNOWN_DRUG_INTERACTIONS) => {
    if (!medicineIds || medicineIds.length < 2) return [];

    const detected = [];
    for (let i = 0; i < medicineIds.length; i++) {
      for (let j = i + 1; j < medicineIds.length; j++) {
        const idA = medicineIds[i];
        const idB = medicineIds[j];

        const match = interactionDb.find(item =>
          (item.drugA === idA && item.drugB === idB) ||
          (item.drugA === idB && item.drugB === idA)
        );

        if (match) {
          detected.push(match);
        }
      }
    }

    return detected;
  }
};
