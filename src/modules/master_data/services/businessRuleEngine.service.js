/**
 * NurseFlow Enterprise HIS 2026 — Business Rules Engine
 * Evaluates dynamic healthcare business logic, demographic screening,
 * holiday surcharges, and insurance claim rules.
 */

export const DEFAULT_BUSINESS_RULES = [
  {
    id: 'RUL-PED',
    rule_code: 'PEDIATRIC_RULE',
    rule_name: 'Pemeriksaan Klinis Pasien Anak (Pediatrik)',
    description: 'Pasien usia di bawah 12 tahun wajib diarahkan ke poli spesialis anak & dosis obat disesuaikan berat badan.',
    is_active: true,
    condition: (ctx) => ctx.patientAge !== undefined && ctx.patientAge < 12,
    action: { category: 'PEDIATRIC', warning: 'Wajib verifikasi dosis berbasis Berat Badan (mg/kgBB).' }
  },
  {
    id: 'RUL-GER',
    rule_code: 'GERIATRIC_RULE',
    rule_name: 'Skrining Komprehensif Pasien Lanjut Usia (Geriatrik)',
    description: 'Pasien usia > 60 tahun mendapatkan prioritas antrean & skrining polifarmasi.',
    is_active: true,
    condition: (ctx) => ctx.patientAge !== undefined && ctx.patientAge >= 60,
    action: { category: 'GERIATRIC', warning: 'Prioritas antrean & waspada interaksi polifarmasi.' }
  },
  {
    id: 'RUL-HOL',
    rule_code: 'HOLIDAY_SURCHARGE',
    rule_name: 'Penyesuaian Tarif Hari Libur Nasional & Akhir Pekan',
    description: 'Pelayanan pada tanggal merah dikenakan penyesuaian tarif +20%.',
    is_active: true,
    condition: (ctx) => Boolean(ctx.isWeekend || ctx.isHoliday),
    action: { adjustmentPercentage: 20, reason: 'Pelayanan Hari Libur Resmi' }
  },
  {
    id: 'RUL-CIT',
    rule_code: 'CITO_SURCHARGE',
    rule_name: 'Penyesuaian Tarif Tindakan Emergensi (Cito)',
    description: 'Tindakan cito di luar jam kerja reguler dikenakan tambahan jasa medis +25%.',
    is_active: true,
    condition: (ctx) => Boolean(ctx.isEmergency || ctx.isCito),
    action: { adjustmentPercentage: 25, reason: 'Tindakan Cito Emergensi' }
  },
  {
    id: 'RUL-BPJS',
    rule_code: 'INA_CBG_RULE',
    rule_name: 'Validasi Paket Klaim BPJS Kesehatan INA-CBGs',
    description: 'Pasien peserta BPJS wajib menggunakan paket tarif INA-CBG tanpa tagihan tambahan ke pasien.',
    is_active: true,
    condition: (ctx) => ctx.insuranceType === 'BPJS',
    action: { billingMode: 'INA_CBGS', coPayAllowed: false }
  }
];

export const businessRuleEngineService = {
  /**
   * Evaluate context against all active business rules
   */
  evaluateRules: (context = {}, customRules = DEFAULT_BUSINESS_RULES) => {
    const activeRules = customRules.filter(r => r.is_active);
    const triggeredActions = [];

    activeRules.forEach(rule => {
      try {
        if (rule.condition && rule.condition(context)) {
          triggeredActions.push({
            ruleCode: rule.rule_code,
            ruleName: rule.rule_name,
            action: rule.action
          });
        }
      } catch (err) {
        console.warn(`[BusinessRuleEngine] Error evaluating rule ${rule.rule_code}:`, err);
      }
    });

    return {
      evaluatedCount: activeRules.length,
      triggeredCount: triggeredActions.length,
      results: triggeredActions
    };
  },

  /**
   * Get all registered business rules
   */
  getRules: () => {
    return DEFAULT_BUSINESS_RULES;
  }
};
