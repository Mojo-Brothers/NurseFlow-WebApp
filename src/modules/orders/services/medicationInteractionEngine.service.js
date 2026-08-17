/**
 * NurseFlow Enterprise HIS 2026 — Medication Interaction & Clinical Pharmacy Guard
 * Sprint 5: High-Alert, LASA, Antibiotic Stewardship, Pediatric & Renal Calculators
 * Standar Kepatuhan: WHO Medication Safety Challenge & JCI MMU Standards.
 */

export const medicationInteractionEngineService = {
  /**
   * Screen Medication for High-Alert & LASA Flags
   */
  screenMedicationSafety: (medicationCode, medicationName) => {
    const nameLower = (medicationName || '').toLowerCase();
    const codeLower = (medicationCode || '').toLowerCase();

    const isHighAlert = 
      nameLower.includes('heparin') ||
      nameLower.includes('insulin') ||
      nameLower.includes('kcl') ||
      nameLower.includes('morphine') ||
      nameLower.includes('fentanyl') ||
      nameLower.includes('potassium chloride');

    const isLasa = 
      nameLower.includes('heparin') ||
      nameLower.includes('cefazolin') ||
      nameLower.includes('ceftriaxone') ||
      nameLower.includes('ephedrine') ||
      nameLower.includes('epinephrine');

    const isAntibiotic = 
      nameLower.includes('amoxicillin') ||
      nameLower.includes('ceftriaxone') ||
      nameLower.includes('ciprofloxacin') ||
      nameLower.includes('meropenem') ||
      nameLower.includes('azithromycin');

    return {
      isHighAlert,
      isLasa,
      isAntibiotic,
      warningMessage: isHighAlert 
        ? '🚨 PERINGATAN HIGH-ALERT MEDICATION (JCI IPSG 3): Obat konsentrasi tinggi / berisiko fatal jika salah dosis. Double-Check independen wajib dilakukan.'
        : null
    };
  },

  /**
   * Pediatric Dose Calculator based on Weight (mg/kg/day)
   */
  calculatePediatricDose: (weightKg, standardMgPerKg, frequencyTimesPerDay = 3) => {
    const totalDailyMg = Number(weightKg) * Number(standardMgPerKg);
    const perDoseMg = (totalDailyMg / frequencyTimesPerDay).toFixed(1);
    return {
      weightKg,
      totalDailyMg,
      perDoseMg: Number(perDoseMg),
      recommendation: `${perDoseMg} mg setiap ${24 / frequencyTimesPerDay} jam (${frequencyTimesPerDay}x sehari)`
    };
  },

  /**
   * Renal Dose Adjustment Advice
   */
  getRenalDoseAdjustment: (drugName, egfr) => {
    const q = (drugName || '').toLowerCase();
    if (egfr < 30) {
      if (q.includes('ciprofloxacin')) return 'Kurangi dosis 50% atau berikan 250-500 mg setiap 18-24 jam.';
      if (q.includes('ceftriaxone')) return 'Maksimal 2 gram/hari tanpa penyesuaian interval berat.';
      if (q.includes('metformin')) return 'KONTRAINDIKASI TOTAL (eGFR < 30 mL/min): Hentikan segera.';
    }
    return 'Dosis standar dapat dilanjutkan dengan pemantauan serial kreatinin.';
  }
};
