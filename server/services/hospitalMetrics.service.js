/**
 * NurseFlow Enterprise HIS 2026 — Hospital Operational & Clinical Indicators Service
 * Standar: Petunjuk Teknis Pelaporan SIRS Kemenkes RI & JCI Quality & Patient Safety (QPS)
 */

export const hospitalMetricsService = {
  /**
   * Calculate Barber-Johnson Inpatient Hospital Quality Indicators
   */
  calculateInpatientMetrics: ({
    totalBeds = 120,
    totalBedDaysInPeriod = 30, // misal 30 hari dalam 1 bulan
    totalPatientDays = 2700,   // Total hari perawatan (HP)
    totalDischargedPatients = 450 // Total pasien keluar hidup + mati
  }) => {
    const availableBedDays = totalBeds * totalBedDaysInPeriod;

    // 1. Bed Occupancy Rate (BOR %) — Ideal: 60 - 85%
    const bor = ((totalPatientDays / availableBedDays) * 100).toFixed(2);

    // 2. Average Length of Stay (ALOS Hari) — Ideal: 3 - 6 Hari
    const alos = (totalPatientDays / totalDischargedPatients).toFixed(2);

    // 3. Turn Over Interval (TOI Hari) — Ideal: 1 - 3 Hari
    const toi = ((availableBedDays - totalPatientDays) / totalDischargedPatients).toFixed(2);

    // 4. Bed Turn Over (BTO Kali) — Frekuensi pemakaian tempat tidur
    const bto = (totalDischargedPatients / totalBeds).toFixed(2);

    return {
      bor: parseFloat(bor),
      alos: parseFloat(alos),
      toi: parseFloat(toi),
      bto: parseFloat(bto),
      isBorOptimal: parseFloat(bor) >= 60 && parseFloat(bor) <= 85,
      isAlosOptimal: parseFloat(alos) >= 3 && parseFloat(alos) <= 6,
      isToiOptimal: parseFloat(toi) >= 1 && parseFloat(toi) <= 3
    };
  },

  /**
   * Calculate Emergency Door-to-Doctor Response Time Compliance
   */
  evaluateEmergencySla: (triageSeverityCode, actualMinutesToDoctor) => {
    const SLA_THRESHOLDS = {
      P1_RESUSCITATION: 0,
      P2_EMERGENT: 10,
      P3_URGENT: 30,
      P4_SEMI_URGENT: 60,
      P5_NON_URGENT: 120
    };

    const targetMinutes = SLA_THRESHOLDS[triageSeverityCode] ?? 60;
    const isCompliant = actualMinutesToDoctor <= targetMinutes;

    return {
      triageSeverityCode,
      targetMinutes,
      actualMinutesToDoctor,
      isCompliant,
      varianceMinutes: actualMinutesToDoctor - targetMinutes
    };
  }
};
