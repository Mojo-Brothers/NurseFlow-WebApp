/**
 * NurseFlow Enterprise HIS 2026 — Clinical Severity & Safety Tokens
 * Single Source of Truth (SSOT) for Patient Safety, Triage Scales, and Criticality
 * Standards: JCI IPSG, KARS 2024, ESI 5-Level Triage, NEWS2, WHO Safety Protocols.
 */

import { BASE_TOKENS } from './base.tokens.js';

export const CLINICAL_SEVERITY = Object.freeze({
  // ─── 1. Emergency Severity Index (ESI 1–5 Triage) ───
  esi: Object.freeze({
    level1_resuscitation: Object.freeze({
      code: 'ESI_1',
      label: 'ESI 1 — Resusitasi / Mengancam Nyawa',
      color: BASE_TOKENS.red[600],
      bgLight: BASE_TOKENS.red[50],
      bgDark: BASE_TOKENS.red[950],
      border: BASE_TOKENS.red[500],
      textLight: BASE_TOKENS.red[900],
      textDark: BASE_TOKENS.red[100],
      badgeStyle: 'bg-red-600 text-white font-bold animate-pulse'
    }),
    level2_emergent: Object.freeze({
      code: 'ESI_2',
      label: 'ESI 2 — Emergensi / Risiko Tinggi',
      color: BASE_TOKENS.amber[600],
      bgLight: BASE_TOKENS.amber[50],
      bgDark: BASE_TOKENS.amber[950],
      border: BASE_TOKENS.amber[500],
      textLight: BASE_TOKENS.amber[900],
      textDark: BASE_TOKENS.amber[100],
      badgeStyle: 'bg-amber-500 text-slate-950 font-bold'
    }),
    level3_urgent: Object.freeze({
      code: 'ESI_3',
      label: 'ESI 3 — Urgensi / Butuh Banyak Sumber Daya',
      color: BASE_TOKENS.blue[600],
      bgLight: BASE_TOKENS.blue[50],
      bgDark: BASE_TOKENS.blue[950],
      border: BASE_TOKENS.blue[500],
      textLight: BASE_TOKENS.blue[900],
      textDark: BASE_TOKENS.blue[100],
      badgeStyle: 'bg-blue-600 text-white font-semibold'
    }),
    level4_less_urgent: Object.freeze({
      code: 'ESI_4',
      label: 'ESI 4 — Kurang Urgen / 1 Sumber Daya',
      color: BASE_TOKENS.emerald[600],
      bgLight: BASE_TOKENS.emerald[50],
      bgDark: BASE_TOKENS.emerald[950],
      border: BASE_TOKENS.emerald[500],
      textLight: BASE_TOKENS.emerald[900],
      textDark: BASE_TOKENS.emerald[100],
      badgeStyle: 'bg-emerald-600 text-white font-medium'
    }),
    level5_non_urgent: Object.freeze({
      code: 'ESI_5',
      label: 'ESI 5 — Non-Urgen / Rawat Jalan',
      color: BASE_TOKENS.slate[500],
      bgLight: BASE_TOKENS.slate[100],
      bgDark: BASE_TOKENS.slate[900],
      border: BASE_TOKENS.slate[300],
      textLight: BASE_TOKENS.slate[800],
      textDark: BASE_TOKENS.slate[200],
      badgeStyle: 'bg-slate-500 text-white font-normal'
    })
  }),

  // ─── 2. Laboratory & Diagnostic Panic / Critical Alerts ───
  panic: Object.freeze({
    criticalPanic: Object.freeze({
      label: 'NILAI KRITIS / PANIC VALUE',
      color: BASE_TOKENS.red[600],
      bgLight: BASE_TOKENS.red[100],
      bgDark: BASE_TOKENS.red[950],
      border: BASE_TOKENS.red[600],
      text: BASE_TOKENS.red[900],
      glow: '0 0 12px rgba(220, 38, 38, 0.45)'
    }),
    abnormalHigh: Object.freeze({
      label: 'ABNORMAL TINGGI (H)',
      color: BASE_TOKENS.amber[600],
      bgLight: BASE_TOKENS.amber[50],
      bgDark: BASE_TOKENS.amber[950],
      border: BASE_TOKENS.amber[500],
      text: BASE_TOKENS.amber[900]
    }),
    abnormalLow: Object.freeze({
      label: 'ABNORMAL RENDAH (L)',
      color: BASE_TOKENS.blue[600],
      bgLight: BASE_TOKENS.blue[50],
      bgDark: BASE_TOKENS.blue[950],
      border: BASE_TOKENS.blue[500],
      text: BASE_TOKENS.blue[900]
    }),
    normalInRange: Object.freeze({
      label: 'NORMAL / IN-RANGE',
      color: BASE_TOKENS.emerald[600],
      bgLight: BASE_TOKENS.emerald[50],
      bgDark: BASE_TOKENS.emerald[950],
      border: BASE_TOKENS.emerald[500],
      text: BASE_TOKENS.emerald[900]
    })
  }),

  // ─── 3. Medication Safety (High-Alert, LASA, Narcotics) ───
  medication: Object.freeze({
    highAlert: Object.freeze({
      label: 'HIGH ALERT MEDICATION (HAM)',
      color: BASE_TOKENS.red[600],
      bg: BASE_TOKENS.red[50],
      border: BASE_TOKENS.red[500],
      badgeClass: 'bg-red-700 text-white font-bold tracking-wider'
    }),
    lasaLookAlike: Object.freeze({
      label: 'LASA / NORUM (Look-Alike Sound-Alike)',
      color: BASE_TOKENS.amber[600],
      bg: BASE_TOKENS.amber[50],
      border: BASE_TOKENS.amber[500],
      badgeClass: 'bg-amber-600 text-white font-bold uppercase'
    }),
    narcoticsPsychotropics: Object.freeze({
      label: 'NARKOTIKA & PSIKOTROPIKA (DD)',
      color: BASE_TOKENS.purple[600],
      bg: BASE_TOKENS.purple[50],
      border: BASE_TOKENS.purple[500],
      badgeClass: 'bg-purple-700 text-white font-bold'
    })
  }),

  // ─── 4. NEWS2 Early Warning System (Adults) ───
  news2: Object.freeze({
    low: Object.freeze({
      scoreRange: '0 - 4',
      label: 'Risiko Klinis Rendah (Pemantauan Rutin Tiap 4-6 Jam)',
      color: BASE_TOKENS.emerald[600],
      bg: BASE_TOKENS.emerald[50],
      border: BASE_TOKENS.emerald[500]
    }),
    medium: Object.freeze({
      scoreRange: '5 - 6 (atau skor 3 pada 1 parameter)',
      label: 'Risiko Klinis Sedang (Evaluasi Dokter Jaga / Edukasi DPJP)',
      color: BASE_TOKENS.amber[600],
      bg: BASE_TOKENS.amber[50],
      border: BASE_TOKENS.amber[500]
    }),
    high: Object.freeze({
      scoreRange: '>= 7',
      label: 'Risiko Klinis Tinggi / Emergency (Aktivasi Tim Medis Reaksi Cepat)',
      color: BASE_TOKENS.red[600],
      bg: BASE_TOKENS.red[50],
      border: BASE_TOKENS.red[600],
      pulse: true
    })
  }),

  // ─── 5. Code Protocols (Hospital Emergency Codes) ───
  codes: Object.freeze({
    codeBlue: Object.freeze({ label: 'CODE BLUE — Henti Jantung/Napas', color: BASE_TOKENS.blue[600], bg: BASE_TOKENS.blue[100] }),
    codeRed: Object.freeze({ label: 'CODE RED — Kebakaran / Api', color: BASE_TOKENS.red[600], bg: BASE_TOKENS.red[100] }),
    mtpProtocol: Object.freeze({ label: 'MTP — Protokol Transfusi Masif', color: BASE_TOKENS.purple[700], bg: BASE_TOKENS.purple[100] }),
    fallRiskYellow: Object.freeze({ label: 'RISIKO JATUH TINGGI (Gelang Kuning)', color: BASE_TOKENS.amber[500], bg: BASE_TOKENS.amber[100] })
  })
});

export default CLINICAL_SEVERITY;
