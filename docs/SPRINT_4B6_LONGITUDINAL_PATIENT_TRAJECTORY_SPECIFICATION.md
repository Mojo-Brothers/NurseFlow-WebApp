# 🚀 SPRINT 4B.6: LONGITUDINAL PATIENT TRAJECTORY ENGINE
## Arsitektur, Model State Klinis, Kontrak Data Temporal & Matriks Pengujian
**Versi Dokumen:** v1.0.0 (Design & Contract Baseline)  
**Tanggal:** 2026-08-20  
**Penulis:** Enterprise Health Informatics & Architecture Council  
**Prinsip Utama:** *"Trend > Snapshot — Dari Deteksi Statis Menuju Kesadaran Vektor Trajektori Temporal"*

---

## 🧭 1. EXECUTIVE SUMMARY & LATAR BELAKANG ARSITEKTUR

Pada implementasi HIS/EMR konvensional, evaluasi kondisi klinis pasien bersifat **statis (snapshot-based)**:
* Pasien diperiksa pada jam 10:00 (NEWS2 = 2) $\rightarrow$ "Pasien Stabil"
* Pasien diperiksa pada jam 12:00 (NEWS2 = 5) $\rightarrow$ "Pasien Risiko Sedang"
* Pasien diperiksa pada jam 14:00 (NEWS2 = 8) $\rightarrow$ **"Pasien Gagal Napas / Syok di ICU" (Terlambat)**

Model reaktif seperti ini melewatkan sinyal paling berharga dalam fisiologi manusia: **Kecepatan Perburukan (*Velocity of Deterioration*) dan Vektor Perjalanan Klinis (*Longitudinal Patient Trajectory*)**.

Sprint 4B.6 memperkenalkan **Longitudinal Patient Trajectory Engine** yang mengolah data berkala (Tanda Vital, Seri Laboratorium, Terapi Obat, dan Keseimbangan Cairan) menjadi representasi multiorgan deterministik: **Clinical State Vector**.

```text
                 PATIENT CLINICAL STATE
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
      VITALS          LAB RESULTS      MEDICATION & FLUIDS
        │                │                │
        └────────────────┼────────────────┘
                         ↓
              TEMPORAL NORMALIZATION (2h, 4h, 12h, 24h)
                         ↓
             TRAJECTORY CALCULUS & DELTA SLOPES
                         ↓
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
    STABLE           WORSENING          IMPROVING
       │                 │                 │
       ↓                 ↓                 ↓
   ROUTINE         EARLY WARNING       DE-ESCALATE &
   MONITOR         (PRE-CRISIS)        DOWNGRADE
                         │
                         ↓
             GOVERNANCE & EXPLAINABILITY ENGINE
                         │
             ┌───────────┴───────────┐
             ↓                       ↓
       RECOMMENDATION            WORM AUDIT
```

---

## 🧬 2. CLINICAL STATE VECTOR MODEL

Setiap pasien secara berkala direpresentasikan dalam **Vektor Status Klinis Multiorgan**:

```typescript
export interface ClinicalStateVector {
  patientId: string;
  encounterId: string;
  evaluatedAt: string; // ISO 8601 Timestamp
  windowHours: number; // 2 | 4 | 12 | 24 hours

  // 1. Multi-Organ System Vectors
  systems: {
    hemodynamic: {
      status: 'STABLE' | 'COMPENSATING' | 'DECOMPENSATING' | 'UNSTABLE';
      mapMean: number;
      mapVelocityMmHgPerHour: number; // e.g. -4.5 mmHg/h
      hrVelocityBpmPerHour: number;   // e.g. +8.0 bpm/h
      vasopressorEscalation: boolean;
      evidence: string;
    };
    respiratory: {
      status: 'STABLE' | 'INCREASING_EFFORT' | 'DETERIORATING' | 'FAILURE';
      rrVelocityBreathsPerHour: number; // e.g. +3.0 breaths/h
      spo2DeltaPercent: number;          // e.g. -6%
      supplementalO2Escalated: boolean;
      evidence: string;
    };
    neurologic: {
      status: 'STABLE' | 'FLUCTUATING' | 'DETERIORATING';
      gcsDelta: number; // e.g. -3 points
      acvpuTransition: string;
      evidence: string;
    };
    metabolicRenal: {
      status: 'STABLE' | 'AT_RISK' | 'ACUTE_INJURY';
      urineOutputMlPerKgPerHour: number; // e.g. 0.35 ml/kg/h (< 0.5 KDIGO criteria)
      creatinineVelocityMgPerDlPerDay: number;
      lactateVelocityMmolPerHour: number; // e.g. +0.8 mmol/h
      evidence: string;
    };
    infectionSepsis: {
      status: 'LOW_RISK' | 'INFLAMMATORY_RESPONSE' | 'HIGH_RISK_SEPTIC';
      temperatureTrajectory: 'STABLE' | 'SPIKING' | 'HYPOTHERMIC';
      lactateTrend: 'NORMAL' | 'RISING' | 'CLEARING';
      evidence: string;
    };
    medicationExposureRisk: {
      status: 'LOW' | 'ELEVATED' | 'HIGH_ALERT_ACTIVE';
      activeHighAlertCategories: string[];
      recentVasoactiveTitrations: number;
    };
  };

  // 2. Global Trajectory & Velocity
  overallTrajectory: 'IMPROVING' | 'STABLE' | 'WORSENING';
  trajectoryVelocity: 'STABLE' | 'MODERATE' | 'RAPID' | 'FULMINANT';
  news2VelocityPerHour: number; // e.g. +1.5 score/h

  // 3. Risk Stratification & Clinical Intent
  escalationRisk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  leadTimeHours: number; // Waktu estimasi sebelum mencapai critical threshold (contoh: 2.5 jam)
  clinicalLeadRecommendation: string;
  isExplainable: boolean;
  contributingSlopeBreakdown: Record<string, any>;
}
```

---

## ⏱️ 3. TEMPORAL DATA CONTRACT & NORMALIZATION ENGINE

Kontrak data temporal mengumpulkan 4 seri observasi runtun waktu (*time-series stream*):

### A. Vitals Series (`VitalsStream`)
```json
[
  { "timestamp": "2026-08-20T10:00:00Z", "hr": 78, "sbp": 122, "dbp": 78, "map": 93, "rr": 16, "spo2": 98, "o2": "ROOM_AIR", "temp": 36.8, "consciousness": "ALERT", "news2": 2 },
  { "timestamp": "2026-08-20T11:00:00Z", "hr": 92, "sbp": 110, "dbp": 70, "map": 83, "rr": 21, "spo2": 95, "o2": "ROOM_AIR", "temp": 37.4, "consciousness": "ALERT", "news2": 4 },
  { "timestamp": "2026-08-20T12:00:00Z", "hr": 108, "sbp": 98, "dbp": 62, "map": 74, "rr": 24, "spo2": 93, "o2": "NASAL_3L", "temp": 38.2, "consciousness": "ALERT", "news2": 5 }
]
```

### B. Lab Series (`LabStream`)
```json
[
  { "timestamp": "2026-08-20T10:00:00Z", "lactate": 1.4, "wbc": 9.2, "creatinine": 0.9, "bloodGlucose": 112 },
  { "timestamp": "2026-08-20T12:00:00Z", "lactate": 2.8, "wbc": 14.8, "creatinine": 1.3, "bloodGlucose": 165 }
]
```

### C. Medication & Fluid Series (`TherapyStream`)
```json
[
  { "timestamp": "2026-08-20T10:30:00Z", "drug": "Ceftriaxone 2g IV", "category": "ANTIBIOTIC" },
  { "timestamp": "2026-08-20T11:30:00Z", "urineOutputMl": 25, "patientWeightKg": 70, "urineRate": "0.35 ml/kg/h" }
]
```

---

## 📐 4. TRAJECTORY VELOCITY CALCULUS (FORMULA DETERMINISTIK)

1. **Velocity Laju NEWS2 ($\mathcal{V}_{\text{NEWS2}}$):**
   $$\mathcal{V}_{\text{NEWS2}} = \frac{\text{NEWS2}(t_{\text{now}}) - \text{NEWS2}(t_{\text{baseline}})}{\Delta t \text{ (jam)}}$$
   * **Kriteria:**
     * $\mathcal{V}_{\text{NEWS2}} \le 0$: `IMPROVING / STABLE`
     * $0 < \mathcal{V}_{\text{NEWS2}} < 0.5$: `SLOW_DRIFT` (Low/Moderate)
     * $0.5 \le \mathcal{V}_{\text{NEWS2}} < 1.0$: `MODERATE_WORSENING` (Elevated)
     * $1.0 \le \mathcal{V}_{\text{NEWS2}} < 2.0$: `RAPID_DETERIORATION` (High/Elevated Risk $\rightarrow$ Pemicu DPJP Review 2 Jam Lebih Awal)
     * $\mathcal{V}_{\text{NEWS2}} \ge 2.0$: `FULMINANT_CRISIS` (Critical)

2. **MAP Negative Velocity ($\mathcal{V}_{\text{MAP}}$):**
   $$\mathcal{V}_{\text{MAP}} = \frac{\text{MAP}(t_{\text{now}}) - \text{MAP}(t_{\text{prev}})}{\Delta t \text{ (jam)}}$$
   * Jika $\mathcal{V}_{\text{MAP}} \le -5\text{ mmHg/h}$ selama 2 observasi berturut-turut $\rightarrow$ `HEMODYNAMIC_DECOMPENSATING` (meskipun MAP saat ini masih $> 70\text{ mmHg}$).

3. **KDIGO Urine Output Velocity ($\mathcal{U}_{\text{rate}}$):**
   $$\mathcal{U}_{\text{rate}} = \frac{\text{Urine Output (ml)}}{\text{Berat Badan (kg)} \times \Delta t \text{ (jam)}}$$
   * Jika $\mathcal{U}_{\text{rate}} < 0.5\text{ ml/kg/h}$ selama $\ge 2\text{ jam}$ $\rightarrow$ `METABOLIC_RENAL_AT_RISK / OLIGURIA_ALERT`.

4. **Lactate Acceleration ($\Delta \text{Lactate}$):**
   * Peningkatan Laktat $> +0.5\text{ mmol/L/h}$ $\rightarrow$ `HIGH_RISK_SEPTIC / TISSUE_HYPOPERFUSION`.

---

## 🛡️ 5. GUARDRAILS & NON-PREDICTIVE SAFETY BOUNDARIES

1. **Deterministic Rule-Based Slopes (Bukan Model Kotak Gelap / Black-Box):**
   * Semua kalkulasi menggunakan regresi linier sederhana / finite difference delta yang 100% dapat dihitung ulang dan dijelaskan di persidangan audit (*Medicolegal Traceable*).
2. **Tidak Ada "Predictive Mortality Score":**
   * Sistem tidak memprediksi probabilitas kematian, melainkan **arah pergerakan fisiologis (*Physiological Trajectory*) dan laju perburukan organ**.
3. **Pemicu Intervensi Dini (*Pre-Crisis Alert*):**
   * Ketika pasien menunjukkan kecepatan $+1.5\text{ score/jam}$ pada rentang NEWS2 2 $\rightarrow$ 5, sistem menerbitkan peringatan:
   > *"Deterioration Trajectory Detected: Laju perburukan +1.5 skor/jam. Estimasi mencapai ambang kritis ICU dalam 1.5 - 2 jam. Membutuhkan evaluasi dokter bangsal sebelum krisis hemodinamik terjadi."*

---

## 🧪 6. MATRIKS UJI SPESIFIKASI SPRINT 4B.6 (TEST MATRIX CONTRACT)

| No | Skenario Validasi Trajectory | Input Time-Series Data | Expected Vector Output | Clinical Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Rapid Deterioration Trajectory** | Jam 10: NEWS2 2 $\rightarrow$ Jam 11: NEWS2 4 $\rightarrow$ Jam 12: NEWS2 5 | `overallTrajectory: WORSENING`, `velocity: +1.5/h`, `escalationRisk: ELEVATED` | Peringatan dini DPJP terbit pada jam 12 (skor 5), bukan menunggu jam 14 (skor 7). |
| **2** | **Compensating Shock (Occult Shock)** | TD 125/80 (MAP 95) $\rightarrow$ TD 110/70 (MAP 83) $\rightarrow$ TD 98/62 (MAP 74), HR naik 78 $\rightarrow$ 110 bpm | `hemodynamic.status: DECOMPENSATING`, `mapVelocity: -9.5 mmHg/h` | Deteksi syok kompensasi sebelum pasien mengalami hipotensi berat $< 90$. |
| **3** | **Recovery / Improving Trajectory** | Jam 14: NEWS2 8 (ICU) $\rightarrow$ Jam 16: NEWS2 5 $\rightarrow$ Jam 18: NEWS2 2 | `overallTrajectory: IMPROVING`, `velocity: -1.5/h`, `escalationRisk: LOW` | Memvalidasi stabilitas pemulihan dan merekomendasikan alur de-eskalasi bangsal. |
| **4** | **Oliguria & AKI Velocity** | Pasien BB 70 kg, urin 2 jam berturut-turut 20 ml/jam ($0.28\text{ ml/kg/jam}$) | `metabolicRenal.status: ACUTE_INJURY`, `urineRate: 0.28 ml/kg/h` | Memicu peringatan KDIGO Stage 1 AKI dan proteksi obat nefrotoksik. |
| **5** | **Respiratory Failure Trajectory** | RR naik 18 $\rightarrow$ 24 $\rightarrow$ 30 x/m, SpO2 turun 97 $\rightarrow$ 94 $\rightarrow$ 90% pada O2 nasal | `respiratory.status: DETERIORATING`, `rrVelocity: +6 breaths/h` | Memicu kesiapan HFNC / Ventilator non-invasif dini. |
| **6** | **Explainability & Slope Decomposition** | Kueri laporan trajektori pasien perburukan | `isExplainable: true`, Breakdown sub-slopes MAP, RR, SpO2, Laktat terperinci. | Laporan trajektori deterministik tersimpan di ledger audit WORM. |
