/**
 * NurseFlow Enterprise HIS 2026 — Nursing Care, Fluid Balance & Assessment Engine
 * Standards: JCI 7th Edition (IPSG 3, IPSG 6: Fall Risk), PPNI 3S (SDKI, SLKI, SIKI), ISBAR Handover
 */

const NURSING_CARE_STORAGE_KEY = 'nurseflow_nursing_care_records';
const FLUID_BALANCE_STORAGE_KEY = 'nurseflow_fluid_balance_records';

let inMemoryNursingCare = [];
let inMemoryFluidBalance = [];

export const nursingCareEngineService = {
  /**
   * Calculate 24-Hour Fluid Balance & Insensible Water Loss (IWL)
   * Formula: IWL = 15 ml/kgBB/24jam (ditambah 10% per 1°C kenaikan suhu di atas 37°C)
   * Net Balance = Total Intake - (Total Output + IWL)
   */
  calculateFluidBalance: ({
    bodyWeightKg = 60,
    bodyTemperatureCelsius = 37.0,
    intakeItems = [], // { category: 'INFUSION' | 'INJECTION' | 'ORAL' | 'ENTERAL' | 'BLOOD', amountMl: number }
    outputItems = []  // { category: 'URINE' | 'DRAIN' | 'NGT' | 'STOOL' | 'VOMIT', amountMl: number }
  }) => {
    const totalIntake = intakeItems.reduce((sum, it) => sum + Number(it.amountMl || 0), 0);
    const totalRecordedOutput = outputItems.reduce((sum, it) => sum + Number(it.amountMl || 0), 0);

    // Standard baseline IWL = 15 ml/kgBB/24h
    let iwlMl = 15 * Number(bodyWeightKg || 60);

    // Temperature correction if febrile (> 37.0 C)
    if (bodyTemperatureCelsius > 37.0) {
      const tempDiff = bodyTemperatureCelsius - 37.0;
      const iwlIncreasePercentage = tempDiff * 0.10; // +10% per 1°C
      iwlMl += iwlMl * iwlIncreasePercentage;
    }

    iwlMl = Math.round(iwlMl);
    const totalOutputWithIwl = totalRecordedOutput + iwlMl;
    const netBalanceMl = totalIntake - totalOutputWithIwl;

    let balanceCategory = 'NORMAL_EUVOLEMIC';
    if (netBalanceMl > 1000) {
      balanceCategory = 'POSITIVE_OVERLOAD_RISK';
    } else if (netBalanceMl < -1000) {
      balanceCategory = 'NEGATIVE_DEHYDRATION_RISK';
    }

    return {
      totalIntakeMl: totalIntake,
      totalRecordedOutputMl: totalRecordedOutput,
      calculatedIwlMl: iwlMl,
      totalOutputWithIwlMl: totalOutputWithIwl,
      netBalanceMl,
      balanceCategory,
      bodyWeightKg,
      bodyTemperatureCelsius,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Calculate Morse Fall Scale Risk
   * Score >= 45: High Risk (Gelang Kuning / Peringatan Risiko Jatuh Tinggi)
   * Score 25-44: Moderate Risk
   * Score 0-24: Low Risk
   */
  calculateMorseFallScale: ({
    historyOfFalling = false,       // 25 poin
    secondaryDiagnosis = false,     // 15 poin
    ambulatoryAid = 'NONE',         // 'NONE': 0, 'CRUTCHES_CANE': 15, 'FURNITURE': 30
    ivTherapyOrHeparin = false,     // 20 poin
    gaitStatus = 'NORMAL',          // 'NORMAL': 0, 'WEAK': 10, 'IMPAIRED': 20
    mentalStatus = 'ORIENTED'       // 'ORIENTED': 0, 'OVERESTIMATES': 15
  }) => {
    let score = 0;
    if (historyOfFalling) score += 25;
    if (secondaryDiagnosis) score += 15;
    if (ambulatoryAid === 'CRUTCHES_CANE') score += 15;
    if (ambulatoryAid === 'FURNITURE') score += 30;
    if (ivTherapyOrHeparin) score += 20;
    if (gaitStatus === 'WEAK') score += 10;
    if (gaitStatus === 'IMPAIRED') score += 20;
    if (mentalStatus === 'OVERESTIMATES') score += 15;

    let riskLevel = 'LOW';
    let requiresYellowWristband = false;
    let recommendedInterventions = [];

    if (score >= 45) {
      riskLevel = 'HIGH_RISK';
      requiresYellowWristband = true;
      recommendedInterventions = [
        'Pasang Gelang Identitas Kuning (Risiko Jatuh Tinggi)',
        'Pasang Segitiga Peringatan Jatuh di Tempat Tidur',
        'Kunci Roda Tempat Tidur & Pasang Side-Rail Kanan Kiri',
        'Dekatkan Bel Panggil & Edukasi Keluarga Selalu Mendampingi'
      ];
    } else if (score >= 25) {
      riskLevel = 'MODERATE_RISK';
      recommendedInterventions = [
        'Orientasikan Ruangan & Pastikan Penerangan Cukup',
        'Bantu Pasien saat Mobilisasi ke Kamar Mandi'
      ];
    } else {
      riskLevel = 'LOW_RISK';
      recommendedInterventions = ['Edukasi Keselamatan Standar'];
    }

    return {
      totalScore: score,
      riskLevel,
      requiresYellowWristband,
      recommendedInterventions,
      calculatedAt: new Date().toISOString()
    };
  },

  /**
   * Record Comprehensive Nursing Care Plan (SDKI, SLKI, SIKI)
   */
  recordNursingCarePlan: async ({
    encounterId,
    patientId,
    sdkiCode, // e.g. D.0001 Bersihan Jalan Napas Tidak Efektif
    sdkiName,
    slkiGoal, // e.g. Bersihan Jalan Napas Meningkat dalam 3x24 Jam
    sikiInterventions = [], // e.g. ['Manajemen Jalan Napas (I.01011)', 'Pemantauan Respirasi (I.01014)']
    recordedByNurseName = 'Ns. Ratna Sari, S.Kep'
  }) => {
    const record = {
      id: `NCP-${Date.now()}`,
      encounterId,
      patientId,
      sdkiCode,
      sdkiName,
      slkiGoal,
      sikiInterventions,
      recordedByNurseName,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    inMemoryNursingCare.push(record);
    return record;
  },

  /**
   * Generate ISBAR Structured Shift Handover Report
   */
  generateIsbarReport: ({
    patientName,
    mrn,
    wardName,
    bedNumber,
    primaryDoctor,
    situation,
    background,
    assessment,
    recommendation,
    handoverNursePrimary,
    handoverNurseSecondary
  }) => {
    return {
      id: `ISBAR-${Date.now()}`,
      patientName,
      mrn,
      wardName,
      bedNumber,
      primaryDoctor,
      isbar: {
        I_Introduction: `Pasien ${patientName} (${mrn}) dirawat di ${wardName} Bed ${bedNumber} bawah asuhan DPJP ${primaryDoctor}.`,
        S_Situation: situation,
        B_Background: background,
        A_Assessment: assessment,
        R_Recommendation: recommendation
      },
      handoverNursePrimary,
      handoverNurseSecondary,
      signedTimestamp: new Date().toISOString()
    };
  }
};
