/**
 * NurseFlow Enterprise HIS 2026 — LIS Instrument Analyzer Simulator & Delta Check Bridge
 * Sprint 5: HL7 v2 / ASTM E1381 Instrument Communication Simulator
 * Standar Kepatuhan: LOINC & KARS/JCI Laboratory Quality Standards.
 */

export const lisBridgeService = {
  /**
   * Simulate Analyzer Execution for Specimen
   */
  simulateAnalyzerRun: async (loincCode, specimenType) => {
    // Generate realistic clinical values based on test
    if (loincCode === '58410-2') { // CBC
      const thrombocyte = Math.floor(35000 + Math.random() * 80000); // Thrombocytopenia in DHF
      return {
        analyzerInstrument: 'Sysmex XN-1000 Hematology Auto-Analyzer',
        resultValue: `Hb: 13.8 g/dL, Leuko: 3.2 10^3/uL, Trombo: ${thrombocyte} /uL, Ht: 44%`,
        unit: 'Multi-parameter',
        isPanicValue: thrombocyte < 50000,
        panicMessage: thrombocyte < 50000 ? `🚨 NILAI KRITIS LAB (PANIC VALUE): Trombosit ${thrombocyte} /uL (< 50.000 /uL). Segera lapor DPJP!` : null
      };
    }

    if (loincCode === '42757-5') { // Troponin I
      const trop = 1.85;
      return {
        analyzerInstrument: 'Roche cobas e 411 Immunoassay Analyzer',
        resultValue: `${trop}`,
        unit: 'ng/mL',
        isPanicValue: true,
        panicMessage: '🚨 NILAI KRITIS LAB (PANIC VALUE): Troponin I 1.85 ng/mL (> 0.04 ng/mL). Indikasi Infark Miokard Akut!'
      };
    }

    if (loincCode === '2339-0') { // GDS
      return {
        analyzerInstrument: 'Abbott FreeStyle Point of Care',
        resultValue: '128',
        unit: 'mg/dL',
        isPanicValue: false,
        panicMessage: null
      };
    }

    return {
      analyzerInstrument: 'Mindray BS-800 Chemistry Analyzer',
      resultValue: 'Normal / Dalam Batas Rujukan',
      unit: 'Standard',
      isPanicValue: false,
      panicMessage: null
    };
  }
};
