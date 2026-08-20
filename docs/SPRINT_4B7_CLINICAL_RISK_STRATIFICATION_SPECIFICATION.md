# 🚀 SPRINT 4B.7: CLINICAL RISK STRATIFICATION ENGINE
## Arsitektur, Dekomposisi Risiko Multidomain, Integrasi Trajektori & Matriks Validasi 30+ Skenario
**Versi Dokumen:** v1.0.0 (Formal Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Software-Verified Deterministic Clinical Risk Stratification Architecture  
**Otoritas:** Enterprise Health Informatics & Clinical Safety Council  
**Prinsip Inti:**  
> **"Trajectory Engine observes. Risk Stratifier structures. Safety Governance enforces. Clinician decides."**

---

## 🧭 1. EXECUTIVE SUMMARY & LATAR BELAKANG ARSITEKTUR

### 1.1 Evolusi Intelligence Fabric NurseFlow HIS
Melalui penyelesaian Sprint 4B.3 (Closed-Loop Medication), Sprint 4B.4 (Deterioration Engine), Sprint 4B.5 (Safety Governance), dan Sprint 4B.6 (Longitudinal Trajectory Engine), sistem NurseFlow telah membangun fondasi observasi temporal yang tangguh.

```text
    ┌────────────────────────────────────────────────────────┐
    │       SPRINT 4B.3: CLOSED-LOOP MEDICATION (CLMA)       │  5-Rights, Barcode, High-Alert Dual-Sign
    └───────────────────────────┬────────────────────────────┘
                                ↓
    ┌────────────────────────────────────────────────────────┐
    │       SPRINT 4B.4: CLINICAL DETERIORATION ENGINE       │  NEWS2, ADE Detection, Panic Values
    └───────────────────────────┬────────────────────────────┘
                                ↓
    ┌────────────────────────────────────────────────────────┐
    │       SPRINT 4B.5: CLINICAL SAFETY GOVERNANCE          │  Alert Deduplication, Hard Escalation
    └───────────────────────────┬────────────────────────────┘
                                ↓
    ┌────────────────────────────────────────────────────────┐
    │     SPRINT 4B.6: LONGITUDINAL PATIENT TRAJECTORY       │  Velocity Calculus, Temporal Vectors
    └───────────────────────────┬────────────────────────────┘
                                ↓
    ┌────────────────────────────────────────────────────────┐
    │   ★ SPRINT 4B.7: CLINICAL RISK STRATIFICATION LAYER    │  Triad Synthesis (Severity+Trajectory+Risk)
    └───────────────────────────┬────────────────────────────┘
                                ↓
    ┌────────────────────────────────────────────────────────┐
    │       HOSPITAL CLINICAL ACTION & HUMAN DECISION        │  Bedside Intervention, MET Activation
    └────────────────────────────────────────────────────────┘
```

### 1.2 Masalah Klinis yang Diselesaikan di Sprint 4B.7
Meskipun Trajectory Engine (4B.6) mampu mendeteksi arah pergerakan fisiologis (misal: `RESPIRATORY: DETERIORATING`, `HEMODYNAMIC: DECOMPENSATING`), tim dokter dan perawat jaga di bangsal rawat inap membutuhkan jawaban operasional instan:
> *"Seberapa serius kombinasi kondisi pasien ini dan seberapa cepat kami harus melakukan tindakan intervensi?"*

Sering kali terjadi dilema klinis:
1. **Pasien A**: Skor NEWS2 = 6, tetapi grafiknya **STABIL** (sudah berada pada kondisi tersebut selama 8 jam dalam terapi).
2. **Pasien B**: Skor NEWS2 = 3, tetapi grafiknya **RAPID_WORSENING** (laju perburukan $+1.5\text{ skor/jam}$, dari skor 0 naik ke skor 3 dalam 2 jam terakhir).

Pada sistem HIS tradisional tanpa Risk Stratifier, Pasien A akan diprioritaskan di atas Pasien B. Namun secara fisiologis dan keselamatan klinis, **Pasien B berisiko mengalami kolaps kardiorespirasi akut yang tidak terdeteksi jika tidak diintervensi dini**.

Sprint 4B.7 membangun **Deterministic Clinical Risk Stratification Layer** yang menjembatani **Snapshot Severity** dan **Temporal Trajectory** menuju **Aksi Prioritas Klinis Terdekomposisi**.

---

## 🧩 2. TRIAD PEMISAHAN KONSEP KLINIS: SEVERITY vs TRAJECTORY vs RISK

NurseFlow secara tegas memisahkan tiga entitas klinis ini tanpa merusak instrumen standar (NEWS2 tetap NEWS2 asli):

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NURSEFLOW RISK TRIAD                                   │
├─────────────────────────┬───────────────────────────┬──────────────────────────────────┤
│ 1. SEVERITY             │ 2. TRAJECTORY             │ 3. CLINICAL RISK STATE           │
├─────────────────────────┼───────────────────────────┼──────────────────────────────────┤
│ "Seberapa abnormal      │ "Seberapa cepat kondisi   │ "Seberapa besar perhatian dan    │
│ kondisi pasien SAAT INI │ pasien BERGERAK sepanjang │ urgensi tindakan klinis yang     │
│ (snapshot)?"            │ waktu (vektor)?"          │ DIBUTUHKAN saat ini?"            │
├─────────────────────────┼───────────────────────────┼──────────────────────────────────┤
│ • NEWS2 Current Score   │ • Velocity (Laju/Slope)   │ • Urgensi Eskalasi & Review      │
│ • Lab Panic Boundaries  │ • Persistence (Ketahanan) │ • Multi-Domain Compounding       │
│ • High-Alert Exposure   │ • Acceleration (Laktat)   │ • Tindakan & Respon Waktu Maks   │
└─────────────────────────┴───────────────────────────┴──────────────────────────────────┘
```

---

## 🧬 3. CLINICAL RISK STATE DATA MODEL (KONTRAK TIPE DATA)

Model data `ClinicalRiskState` didefinisikan secara deterministik, tanpa atribut probabilitas kotak-gelap (*no black-box probability*):

```typescript
export interface ClinicalRiskState {
  patientId: string;
  encounterId: string;
  evaluatedAt: string; // ISO 8601 UTC
  engineVersion: string; // "4B.7-RISK-STRATIFIER-v1.0"
  ruleRevisionHash: string; // SHA-256 for audit immutability

  // 1. Core Triad Outputs
  severityState: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  trajectoryState: 'IMPROVING' | 'STABLE' | 'SLOW_DRIFT' | 'MODERATE_WORSENING' | 'RAPID_WORSENING' | 'FULMINANT_CRISIS';
  overallRiskState: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

  // 2. Multi-Domain Risk Decomposition (6 Clinical Systems)
  domainRisks: {
    hemodynamic: DomainRiskProfile;
    respiratory: DomainRiskProfile;
    neurologic: DomainRiskProfile;
    renalMetabolic: DomainRiskProfile;
    infectionSepsis: DomainRiskProfile;
    medicationExposure: DomainRiskProfile;
  };

  // 3. Multi-Domain Metrics & Synergy
  domainsInvolvedCount: number; // Jumlah domain yang berstatus MODERATE ke atas (0 - 6)
  highRiskDomainsCount: number; // Jumlah domain berstatus HIGH / CRITICAL (0 - 6)
  crossDomainSynergyAlert: boolean; // Flag sinergi multiorgan (misal: Sepsis + Syok + AKI)

  // 4. Clinical Escalation Priority & Response Guidelines
  escalationPriority: 'ROUTINE_MONITORING' | 'SCHEDULED_ROUND' | 'PROMPT_REVIEW' | 'URGENT_REVIEW' | 'IMMEDIATE_EMERGENCY_RESPONSE';
  maxResponseTimeMinutes: number; // Waktu target respon klinis (Routine: 240m, Prompt: 60m, Urgent: 15m, Immediate: 5m)
  recommendedReviewerRole: 'WARD_NURSE' | 'CHARGE_NURSE' | 'RESIDENT_DOCTOR' | 'DPJP_SPECIALIST' | 'MET_ICU_TEAM';
  suggestedActionProtocols: string[]; // Contoh: ["ACTIVATE_MET_TEAM", "PREPARE_ARTERIAL_LINE", "RECHECK_BLOOD_GAS_60M"]

  // 5. Evidence Quality & Traceability
  evidenceQuality: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  evidenceDeficitReason?: string; // e.g. "SpO2 missing for > 2 hours in high-risk patient"
  isExplainable: boolean;
  explainability: DecomposedRiskFactors;

  // 6. Governance & Medicolegal State
  governanceStatus: 'SYSTEM_EVALUATED' | 'CLINICIAN_ACKNOWLEDGED' | 'CLINICIAN_OVERRIDDEN';
  overrideDetails?: {
    overriddenBy: string;
    overrideTimestamp: string;
    overrideDirection: 'UPGRADE' | 'DOWNGRADE';
    justificationCategory: 'CHRONIC_BASELINE' | 'PALLIATIVE_GOALS' | 'CLINICAL_CONCERN' | 'POST_PROCEDURAL_EXPECTED';
    justificationNotes: string;
  };
  tamperProofHash: string; // SHA-256 hash of all input vector fields
}

export interface DomainRiskProfile {
  domainName: 'HEMODYNAMIC' | 'RESPIRATORY' | 'NEUROLOGIC' | 'RENAL_METABOLIC' | 'INFECTION_SEPSIS' | 'MEDICATION_EXPOSURE';
  severity: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE';
  trajectory: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'RAPID_WORSENING';
  compositeDomainRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  primaryFindings: string[];
  contributingParameters: Record<string, any>;
}

export interface DecomposedRiskFactors {
  primaryDriver: string;
  secondaryDriver?: string;
  compoundingFactors: string[];
  trajectoryInfluence: string;
  clinicalNarrative: string;
}
```

---

## 📊 4. MODEL SEVERITY (SNAPSHOT DERANGEMENT)

Severity dihitung secara deterministik dari data observasi titik waktu terkini ($t_{\text{now}}$):

```text
                               ┌───────────────────────────┐
                               │     OBSERVATIONS (t_now)  │
                               └─────────────┬─────────────┘
                                             ↓
               ┌─────────────────────────────┼─────────────────────────────┐
               ↓                             ↓                             ↓
        NEWS2 SCORE EVAL               LAB PANIC VALUES             HIGH-ALERT ADE
   (0-1: NORMAL, 2-4: MILD,       (pH < 7.25, K+ > 6.0,         (Opioid RR < 10,
    5-6: MOD, 7-8: SEV, >=9: CRIT) Lactate > 4.0, Cr > 3x)      GDS < 55, Inotrope High)
               │                             │                             │
               └─────────────────────────────┼─────────────────────────────┘
                                             ↓
                               ┌───────────────────────────┐
                               │  DETERMINISTIC SEVERITY   │
                               │   MAX(NEWS2, LAB, ADE)    │
                               └───────────────────────────┘
```

### 4.1 Aturan Penentuan Tingkat Severity
1. **CRITICAL**:
   - NEWS2 $\ge 9$, ATAU
   - Salah satu parameter fisiologis tunggal bernilai ekstrem (NEWS2 Single Parameter $= 3$ dengan koma/henti napas), ATAU
   - Nilai kritis lab ekstrem (Laktat $> 4.0\text{ mmol/L}$, $\text{pH} < 7.20$, $\text{K}^+ > 6.5\text{ mmol/L}$), ATAU
   - Pasca henti jantung (*post-resuscitation active shock*).
2. **SEVERE**:
   - NEWS2 skor $7 - 8$, ATAU
   - Laktat $2.5 - 4.0\text{ mmol/L}$ dengan hipotensi MAP $< 65\text{ mmHg}$, ATAU
   - GCS turun $\ge 3$ poin.
3. **MODERATE**:
   - NEWS2 skor $5 - 6$, ATAU
   - Single Parameter NEWS2 $= 3$ (misal: $\text{RR} \ge 25$ atau $\text{SpO2} \le 91\%$), ATAU
   - Urine output KDIGO Stage 1 ($< 0.5\text{ ml/kg/jam}$ selama 2 jam berturut-turut).
4. **MILD**:
   - NEWS2 skor $2 - 4$ tanpa parameter bernilai 3.
5. **NORMAL**:
   - NEWS2 skor $0 - 1$.

---

## 📈 5. INTEGRASI KONTRAK TRAJEKTORI (4B.6 TRAJECTORY VECTORS)

Risk Stratifier menerima output dari `ClinicalTrajectoryEngine` (Sprint 4B.6):

| Metrik Trajektori | Ambang Batas | Status Trajektori Domain |
| :--- | :--- | :--- |
| **Laju NEWS2 ($\mathcal{V}_{\text{NEWS2}}$)** | $\ge +2.0\text{ /jam}$ | `FULMINANT_CRISIS` |
| | $+1.0\text{ s.d. } +1.9\text{ /jam}$ | `RAPID_WORSENING` |
| | $+0.5\text{ s.d. } +0.9\text{ /jam}$ | `MODERATE_WORSENING` |
| | $+0.1\text{ s.d. } +0.4\text{ /jam}$ | `SLOW_DRIFT` |
| | $\le 0.0\text{ /jam}$ | `STABLE` / `IMPROVING` |
| **Laju Tekanan Darah ($\mathcal{V}_{\text{MAP}}$)** | $\le -5.0\text{ mmHg/jam}$ persisten | `HEMODYNAMIC_DECOMPENSATING` |
| **Laju Laju Napas ($\mathcal{V}_{\text{RR}}$)** | $\ge +3.0\text{ napas/jam}$ | `RESPIRATORY_DETERIORATING` |
| **Akselerasi Laktat ($\Delta\text{Lactate}$)** | $\ge +0.5\text{ mmol/L/jam}$ | `SEPSIS_HYPOPERFUSION_ACCELERATING` |
| **Persistence Flag** | Perburukan bertahan $\ge 2$ jendela berurutan | Multiplier Resiko Aktif |

---

## 🏛️ 6. DEKOMPOSISI & AGREGASI RISIKO MULTIDOMAIN (DECOMPOSABLE RISK SYNTHESIS)

Risk Stratifier **menolak penggunaan bobot misterius (black-box weights)**. Semua agregasi risiko dihitung melalui **Hukum Agregasi Multidomain Terbuka**:

$$\text{Risk} = f(\text{Severity}, \text{Trajectory}, \text{Persistence}, \text{MultiDomainInvolvement}, \text{EvidenceQuality})$$

### 6.1 Matriks Sintesis Risiko Utama (The Master Stratification Matrix)

```text
┌───────────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
│ SEVERITY SAAT INI         │ VEKTOR TRAJEKTORI (TEMPORAL VELOCITY)                                       │
│ (SNAPSHOT)                ├──────────────────────┬──────────────────────┬───────────────────────────────┤
│                           │ IMPROVING / STABLE   │ MODERATE_WORSENING   │ RAPID / FULMINANT WORSENING   │
├───────────────────────────┼──────────────────────┼──────────────────────┼───────────────────────────────┤
│ CRITICAL (NEWS2 >= 9)     │ HIGH (Stabilizing)   │ CRITICAL             │ CRITICAL (Fulminant Arrest)   │
│ SEVERE (NEWS2 7 - 8)      │ MODERATE (Recovering)│ HIGH                 │ CRITICAL                      │
│ MODERATE (NEWS2 5 - 6)    │ MODERATE             │ HIGH                 │ HIGH (Early MET Alert)        │
│ MILD (NEWS2 2 - 4)        │ LOW                  │ MODERATE             │ HIGH (Pre-Crisis Trigger) ★   │
│ NORMAL (NEWS2 0 - 1)      │ LOW                  │ LOW                  │ MODERATE (Early Deviation)    │
└───────────────────────────┴──────────────────────┴──────────────────────┴───────────────────────────────┘
```

> ★ **Titik Diferensiasi Utama:**  
> Pasien dengan `NEWS2 = 3` (MILD) namun mengalami `RAPID_WORSENING` ($+1.5\text{ /jam}$) secara deterministik diklasifikasikan sebagai **`HIGH_RISK`** dengan eskalasi **`URGENT_REVIEW`** (memerlukan tinjauan DPJP dalam 15-30 menit), mencegah terjadinya gagal napas / syok tak terduga di bangsal umum.

### 6.2 Hukum Multi-Domain Compounding (Sinergi Kerusakan Antar-Organ)
Tubuh manusia adalah sistem adaptif terintegrasi. Ketika lebih dari satu organ mengalami gangguan secara simultan:
1. **Single Domain High**: Jika 1 domain berstatus `HIGH` (misal: Respirasi gagal), maka `overallRiskState` $\ge \text{HIGH}$.
2. **Dual Domain Synergy**: Jika 2 domain berstatus `MODERATE` dan keduanya memiliki tren `WORSENING` (misal: Hemodinamik MAP turun + Ginjal Urin drop), maka `overallRiskState` ditingkatkan otomatis menjadi **`HIGH_RISK`** (Deteksi Dini Syok Kompensasi / Pre-Sepsis).
3. **Triple Domain Involvement (MODS Alert)**: Jika $\ge 3$ domain menunjukkan disfungsi (meskipun masing-masing ringan/sedang), `overallRiskState` dinaikkan menjadi **`CRITICAL_RISK`** dengan `crossDomainSynergyAlert = true` (Incipient Multiple Organ Dysfunction Syndrome).

---

## 🔍 7. EVIDENCE QUALITY MODEL & ALARM FATIGUE PREVENTION

Untuk mencegah *alarm fatigue* akibat artefak sensor atau kelalaian input, sistem menilai kualitas data sebelum menetapkan level risiko:

```text
                               ┌───────────────────────────┐
                               │   DATA QUALITY EVALUATION │
                               └─────────────┬─────────────┘
                                             ↓
               ┌─────────────────────────────┼─────────────────────────────┐
               ↓                             ↓                             ↓
        COMPLETENESS                     FRESHNESS                 ARTIFACT FILTERING
   (Semua TTV Utama Ada)           (Observasi < 60 menit)       (Probe Lepas / Noise Dibuang)
               │                             │                             │
               └─────────────────────────────┼─────────────────────────────┘
                                             ↓
                               ┌───────────────────────────┐
                               │      EVIDENCE QUALITY     │
                               │ HIGH | MOD | LOW | INSUF  │
                               └───────────────────────────┘
```

### 7.1 Kriteria Evidence Quality
* **HIGH**: Seluruh 6 parameter TTV lengkap, data terbaru $< 60$ menit, tersedia $\ge 3$ titik serial waktu dalam 6 jam terakhir.
* **MODERATE**: Parameter dasar lengkap, data berumur $1 - 2$ jam, tersedia 2 titik serial waktu.
* **LOW**: Terdapat parameter yang belum diukur dalam $> 2$ jam, atau hanya ada 1 titik snapshot tunggal.
* **INSUFFICIENT**: Parameter krusial tidak ada (misal: Laju Napas atau Kesadaran tidak diisi).

### 7.2 Perilaku Protektif Sistem Terhadap Kualitas Data
* Jika Evidence Quality = `INSUFFICIENT`, sistem **TIDAK MENGHALUSINASIKAN RISIKO RENDAH**, melainkan menerbitkan `DATA_DEFICIT_WARNING` dan merekomendasikan: *"Pengukuran TTV Lengkap Segera Diperlukan untuk Menentukan Status Risiko Pasien"*.

---

## 🚦 8. ESCALATION PRIORITY & RESPONSE GUIDELINES

Setiap tingkat `overallRiskState` dipetakan ke Prosedur Operasional Standar (SOP) klinis:

```text
┌────────────────────────────────┬──────────────────────┬────────────────────────┬──────────────────────────────────────────┐
│ OVERALL RISK STATE             │ ESCALATION PRIORITY  │ TARGET MAX RESPON      │ TIM / PERAN PENANGGUNG JAWAB             │
├────────────────────────────────┼──────────────────────┼────────────────────────┼──────────────────────────────────────────┤
│ CRITICAL                       │ IMMEDIATE_EMERGENCY  │ < 5 Menit              │ Medical Emergency Team (MET) / Code Blue │
│ HIGH                           │ URGENT_REVIEW        │ 15 - 30 Menit          │ DPJP Spesialis / Dokter Jaga Bangsal     │
│ MODERATE                       │ PROMPT_REVIEW        │ 30 - 60 Menit          │ Resident Dokter / Charge Nurse           │
│ LOW (Worsening Drift)          │ SCHEDULED_ROUND      │ 120 Menit              │ Perawat Penanggung Jawab Pasien (PPJP)   │
│ LOW (Stable / Improving)       │ ROUTINE_MONITORING   │ 240 Menit (4 Jam)      │ Perawat Pelaksana Rutin                  │
└────────────────────────────────┴──────────────────────┴────────────────────────┴──────────────────────────────────────────┘
```

---

## 💬 9. EXPLAINABILITY CONTRACT (DEKOMPOSISI BUKTI AUDITABEL)

Setiap output klasifikasi risiko wajib menyediakan struktur bahasa alami terurai (*Explainable Evidence Chain*):

```json
{
  "summary": "Overall Risk: HIGH [Urgent Review Required]",
  "reasoningNarrative": "Pasien menunjukkan perburukan cepat pada 2 domain (Respiratorik & Hemodinamik) meskipun skor NEWS2 saat ini baru mencapai 4.",
  "decomposedEvidence": {
    "primaryDriver": {
      "domain": "RESPIRATORY",
      "velocity": "+4.0 napas/jam",
      "finding": "Laju napas meningkat dari 18 ke 26 x/menit dalam 2 jam terakhir dengan desaturasi SpO2 93% pada udara bebas."
    },
    "secondaryDriver": {
      "domain": "HEMODYNAMIC",
      "velocity": "-6.5 mmHg/jam",
      "finding": "MAP menurun dari 92 mmHg menjadi 79 mmHg disertai takikardia kompensasi 108 bpm (+15 bpm/jam)."
    },
    "compoundingFactor": "Sinergi 2 domain organ mengindikasikan fase awal syok septik / dekompensasi kardiorespirasi."
  },
  "actionableRecommendations": [
    "Berikan suplementasi Oksigen target SpO2 94-98% (atau 88-92% bila riwayat PPOK terkonfirmasi).",
    "Lakukan evaluasi DPJP / Dokter Jaga dalam rentang waktu <= 15 menit.",
    "Persiapkan pemeriksaan Analisa Gas Darah (AGD) dan evaluasi resusitasi cairan kristaloid."
  ]
}
```

---

## ⚖️ 10. GOVERNANCE, OVERRIDE & HUMAN-IN-THE-LOOP MODEL

Sesuai direktif arsitektur medis: **"Clinician decides."**

```text
                      ┌────────────────────────────────────┐
                      │    SYSTEM RISK STRATIFICATION      │
                      └─────────────────┬──────────────────┘
                                        ↓
                      ┌────────────────────────────────────┐
                      │      CLINICAL NOTIFICATION HUD     │
                      └─────────────────┬──────────────────┘
                                        ↓
                      ┌─────────────────┴──────────────────┐
                      ↓                                    ↓
        [ ACCEPT & IMPLEMENT ]                  [ CLINICIAN OVERRIDE ]
     Menerapkan rekomendasi klinis           Mengubah level risiko secara manual
              │                                    │
              │                              Wajib menyertakan:
              │                              • Alasan Klinis (Justifikasi)
              │                              • Kategori Alasan
              │                              • PIN/Biometrik DPJP
              ↓                                    ↓
     ┌─────────────────────────────────────────────────────────────┐
     │        IMMUTABLE WORM AUDIT TRAIL & PKI DIGITAL SIGN        │
     └─────────────────────────────────────────────────────────────┘
```

### 10.1 Protokol Override Clinician
1. **Downgrade Override**:
   - Contoh: Pasien PPOK berat dengan baseline $\text{SpO2 } 89\%$ dan retensi $\text{CO}_2$ kronis. Dokter mendowngrade dari `HIGH_RISK` ke `MODERATE_RISK`.
   - Wajib memilih kategori: `CHRONIC_BASELINE_COMPENSATION` atau `PALLIATIVE_CARE_GOALS` dan mencatat alasan naratif.
2. **Upgrade Override**:
   - Contoh: Angka vital masih tampak stabil, namun dokter melihat tanda klinis *mottling*, ekstremitas dingin, dan gelisah (*clinical intuition / gut feeling*).
   - Dokter meng-upgrade dari `LOW_RISK` ke `HIGH_RISK`. Sistem langsung memperbarui prioritas bangsal.

---

## 🔒 11. AUDIT MODEL & IMMUTABILITY (WORM LEDGER)

Setiap kalkulasi Stratifikasi Risiko di-hash menggunakan **SHA-256** dan dicatat ke dalam audit trail kekal (*Write-Once-Read-Many*):

$$\text{TamperProofHash} = \text{SHA256}(\text{PatientID} + \text{Timestamp} + \text{Severity} + \text{Trajectory} + \text{Risk} + \text{DomainPayload} + \text{Salt})$$

Hal ini menjamin data tidak dapat dimanipulasi secara retroaktif untuk kebutuhan sidang medikolegal, akreditasi KARS/JCI, maupun konferensi morbiditas & mortalitas (*M&M Conference*).

---

## 🛡️ 12. BOUNDARY CASES & KASUS KHUSUS FISIOLOGIS

| Kasus Khusus | Tantangan Fisiologis | Penanganan Sistem Stratifikasi Risiko 4B.7 |
| :--- | :--- | :--- |
| **PPOK / Hiperkapnia Kronis** | SpO2 normal pasien adalah $88-92\%$. Penggunaan target normal ($>95\%$) memicu alarm palsu masif. | Mendeteksi flag *COPD SpO2 Scale 2* secara otomatis, menyesuaikan ambang batas respiratory risk tanpa menaikkan prioritas palsu. |
| **Pasca Operasi Mayor (Jam 0-2)** | Efek sisa anestesi dan nyeri menyebabkan fluktuasi sementara TTV. | Menerapkan *Post-Op Transient Normalization Gate*, membedakan nyeri/anestesi dari perdarahan intraabdomen progresif via tren MAP. |
| **Pasien Hemodialisis Kronis** | Serum Kreatinin baseline $8.0\text{ mg/dL}$ (tanpa AKI akut). | Menggunakan *Baseline Relative Delta* ($\Delta\text{Creatinine}$), bukan nilai absolut statis. |
| **Atlet / Bradikardia Fisiologis** | HR baseline $45 - 50\text{ bpm}$ saat istirahat. | Mengintegrasikan *Patient Baseline Profile* sehingga bradikardia fisiologis tidak memicu alarm bradikardia patologis. |
| **Pediatrik vs Dewasa** | Rentang frekuensi napas dan denyut nadi normal sangat berbeda menurut usia. | Melakukan *Age-Stratified Normalization Matrix* sebelum mengevaluasi skor keparahan. |

---

## 🎯 13. MATRIKS FALSE-POSITIVE & FALSE-NEGATIVE MITIGATION

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               SAFETY BALANCING & ALARM ACCURACY MATRIX                                 │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ FALSE-POSITIVE MITIGATION (Mencegah Alarm Lelah)   │ FALSE-NEGATIVE MITIGATION (Mencegah Kematian Diam)│
├────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 1. Multi-Point Persistence Filter                  │ 1. Early Velocity Trigger                         │
│    Spike sesaat (misal batuk atau bergerak) tidak  │    Memicu alarm saat kondisi bergerak cepat,      │
│    memicu alarm jika tidak bertahan >= 2 menit.    │    bahkan sebelum ambang batas kritis terlampaui. │
│ 2. Isolated Vital Derangement Trap                 │ 2. Multi-Domain Compounding                       │
│    Kenaikan suhu murni tanpa takikardia/takipnea   │    Mendeteksi syok tersembunyi (Occult Shock) via │
│    diklasifikasikan sebagai Demam Terisolasi.      │    kombinasi penurunan MAP + penurunan Urin.      │
│ 3. Signal Quality Gating                           │ 3. Data Deficit Active Warning                    │
│    Sensor lepas (Probe OFF) langsung ditandai      │    Tidak pernah menganggap 'tidak ada data'       │
│    sebagai artefak, bukan asistol/henti napas.     │    sebagai 'pasien baik-baik saja'.               │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 🧪 14. MATRIKS 32 SKENARIO UJI STRATIFIKASI RISIKO (32-SCENARIO TEST HARNESS CONTRACT)

| ID | Nama Skenario | Profil Klinis & Input Vektor | Ekspektasi Triad (Severity / Trajectory / Risk) | Output Prioritas & Tindakan |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Rapid Deterioration Pre-Crisis** | NEWS2 naik 0 $\rightarrow$ 2 $\rightarrow$ 4 dalam 2 jam ($\mathcal{V}=+2.0/\text{h}$), RR 24, HR 102 | `MILD` / `RAPID_WORSENING` / **`HIGH`** | `URGENT_REVIEW` (Review DPJP $\le 15$m) |
| **TC-02** | **Stable Chronic NEWS2 6** | NEWS2 stabil pada angka 6 selama 8 jam ($\mathcal{V}=0.0/\text{h}$), PPOK stabil | `MODERATE` / `STABLE` / **`MODERATE`** | `SCHEDULED_ROUND` (Observasi 2 jam) |
| **TC-03** | **Occult Septic Shock Influx** | TD turun perlahan (MAP -6 mmHg/h), Laktat naik 1.2 $\rightarrow$ 2.4, Suhu 38.8 | `MODERATE` / `RAPID_WORSENING` / **`HIGH`** | `URGENT_REVIEW` (Kultur darah & Cairan) |
| **TC-04** | **Fulminant Respiratory Failure** | RR naik 18 $\rightarrow$ 28 $\rightarrow$ 36 x/m ($\mathcal{V}=+9/\text{h}$), SpO2 88% | `CRITICAL` / `FULMINANT_CRISIS` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Aktivasi Tim MET) |
| **TC-05** | **Post-Arrest Improving Stability** | Pasca RJP, NEWS2 turun 11 $\rightarrow$ 7 $\rightarrow$ 4 dalam 6 jam ($\mathcal{V}=-1.2/\text{h}$) | `MILD` / `IMPROVING` / **`MODERATE`** | `SCHEDULED_ROUND` (De-eskalasi bertahap) |
| **TC-06** | **Triple Domain MODS Synergy** | MAP turun (Mod), Urin $<0.4$ ml/kg/h (Mod), Ensefalopati GCS 13 (Mod) | `MODERATE` / `WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Sinergi 3 Organ) |
| **TC-07** | **Isolated Fever Artifact (Benign)** | Suhu 38.9°C mendadak, namun HR 76, RR 16, TD 120/80, Kesadaran Alert | `MILD` / `STABLE` / **`LOW`** | `ROUTINE_MONITORING` (Antipiretik) |
| **TC-08** | **COPD Scale 2 Adaptive Target** | Pasien PPOK SpO2 89% pada O2 2L, RR 20, GCS 15 | `MILD` / `STABLE` / **`LOW`** | `ROUTINE_MONITORING` (Target 88-92%) |
| **TC-09** | **Opioid Over-sedation ADE** | Pasca Morfin: RR turun 16 $\rightarrow$ 11 $\rightarrow$ 8 x/m, Respon Verbal lambat | `CRITICAL` / `RAPID_WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Nalokson Alert) |
| **TC-10** | **Insulin Hypoglycemia Crisis** | GDS turun 140 $\rightarrow$ 75 $\rightarrow$ 42 mg/dL, Diaforesis, HR 118 | `CRITICAL` / `RAPID_WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Dextrose 40% IV) |
| **TC-11** | **Oliguric AKI Progression** | Urin $0.25\text{ ml/kg/jam}$ $\ge 4$ jam, Kreatinin naik $+0.8\text{ mg/dL/hari}$ | `SEVERE` / `MODERATE_WORSENING` / **`HIGH`** | `URGENT_REVIEW` (Stop Nefrotoksik) |
| **TC-12** | **Post-Op Surgical Bleeding** | Pasca Laparatomi: TD 120/80 $\rightarrow$ 90/60, HR 80 $\rightarrow$ 125, Drain aktif | `SEVERE` / `RAPID_WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Re-eksplorasi OK) |
| **TC-13** | **Data Deficit Incomplete Vital** | Pasien pasca ICU, SpO2 dan Kesadaran kosong $> 4$ jam | `NORMAL` / `STABLE` / **`MODERATE`** | `DATA_DEFICIT_WARNING` (Ukur Ulang) |
| **TC-14** | **Single Parameter Extreme Rule** | NEWS2 total = 3, namun berasal dari 1 parameter (GCS = 8 / Coma) | `CRITICAL` / `STABLE` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Amankan Airway) |
| **TC-15** | **Transient Post-Nebulization HR** | Pasca Salbutamol nebulizer: HR naik 82 $\rightarrow$ 104, namun RR turun 28 $\rightarrow$ 18 | `MILD` / `IMPROVING` / **`LOW`** | `ROUTINE_MONITORING` (Efek Samping Beta) |
| **TC-16** | **Dialysis Chronic Uremia Baseline**| Pasien CKD Stage 5: Kreatinin 9.2 statis, Urin Anuria, TTV stabil | `MILD` / `STABLE` / **`LOW`** | `ROUTINE_MONITORING` (Sesuai Jadwal HD) |
| **TC-17** | **Palliative DNR Patient Boundary** | Pasien Kanker Stadium Akhir dengan Instruksi DNR/DNI aktif | `SEVERE` / `WORSENING` / **`MODERATE`** | `PALLIATIVE_COMFORT_PATHWAY` (No MET) |
| **TC-18** | **Clinician Downgrade Override** | Sistem memberi `HIGH`, DPJP mendowngrade ke `LOW` + Catatan Valid | `HIGH` $\rightarrow$ `LOW` / `STABLE` / **`LOW`** | `OVERRIDDEN_WORM_LOGGED` (Audit OK) |
| **TC-19** | **Clinician Upgrade Override** | Sistem memberi `LOW`, Dokter mengupgrade ke `HIGH` karena klinis dingin | `LOW` $\rightarrow$ `HIGH` / `STABLE` / **`HIGH`** | `URGENT_REVIEW` (Prioritas Bangsal Naik) |
| **TC-20** | **Pediatric Decompensation Shock** | Anak 3 thn: HR 165 bpm, RR 42 x/m, CRT $> 3$ detik, Letargis | `CRITICAL` / `RAPID_WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (PALS Protocol) |
| **TC-21** | **Tamper-Proof Ledger Verification**| Evaluasi risiko di-hash SHA-256 dan diverifikasi ulang | `ALL` / `ANY` / **`ANY`** | `HASH_INTEGRITY_VERIFIED_100%` |
| **TC-22** | **Transient Motion Artifact Filter** | SpO2 drop ke 75% selama 10 detik lalu kembali 98% (Sinyal Buruk) | `NORMAL` / `STABLE` / **`LOW`** | `FILTERED_AS_NOISE` (No False Alarm) |
| **TC-23** | **Slow Drift Neurologic Decline** | GCS turun 15 $\rightarrow$ 14 $\rightarrow$ 12 dalam 6 jam (Perdarahan Subdural) | `MODERATE` / `SLOW_DRIFT` / **`HIGH`** | `URGENT_REVIEW` (Cito CT-Scan Kepala) |
| **TC-24** | **Rebound Deterioration Post-Meds** | Pasca antihipertensi IV: TD anjlok MAP 115 $\rightarrow$ 58 mmHg mendadak | `CRITICAL` / `FULMINANT_CRISIS` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Stop Infus Titrasi) |
| **TC-25** | **Multi-Inotrope High Risk Exposure**| Pasien mendapat Norepinefrin + Dobutamin titrasi naik di bangsal | `SEVERE` / `MODERATE_WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Transfer ICU) |
| **TC-26** | **Hyperkalemic ECG Instability** | K+ naik ke 6.8 mEq/L, HR melambat 52 bpm dengan QRS melebar | `CRITICAL` / `RAPID_WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Kalsium Glukonat) |
| **TC-27** | **Anaphylaxis Sudden Collapse** | Pasca antibiotik IV: Stridor, Urtikaria masif, TD 70/40 dalam 3 menit | `CRITICAL` / `FULMINANT_CRISIS` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Epinefrin IM Cito) |
| **TC-28** | **Hyperglycemic HHS/DKA Trajectory** | GDS 580 mg/dL, pH 7.18, Nafas Kussmaul (RR 34), Dehidrasi berat | `CRITICAL` / `RAPID_WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Protokol DKA) |
| **TC-29** | **Silent Hypoxemia (Happy Hypoxia)** | Pasien tampak tenang, namun SpO2 84% pada udara bebas, RR 26 | `SEVERE` / `MODERATE_WORSENING` / **`HIGH`** | `URGENT_REVIEW` (Oksigenasi & Lab Cito) |
| **TC-30** | **Post-Extubation Stridor Risk** | Pasca ekstubasi 1 jam: RR naik 22 $\rightarrow$ 32, Stridor inspirasi terdengar | `SEVERE` / `RAPID_WORSENING` / **`CRITICAL`** | `IMMEDIATE_EMERGENCY` (Re-intubasi Siap) |
| **TC-31** | **Hepatic Encephalopathy Influx** | Bilirubin 18 mg/dL, Asteriksis positif, GCS turun fluktuatif | `MODERATE` / `SLOW_DRIFT` / **`HIGH`** | `URGENT_REVIEW` (Laktulosa & Evaluasi) |
| **TC-32** | **Massive Concurrent Batch Influx** | 100 pasien bangsal dievaluasi serentak dalam < 200 ms | `ALL` / `ALL` / **`DETERMINISTIC`** | `ZERO_LEAK_ZERO_RACE_CONDITION` |

---

## 🚫 15. EXPLICIT NON-GOALS & BOUNDARY DEFINITIONS

Untuk menjaga kepatuhan regulasi medis internasional (MDR EU Class IIa/IIb, US FDA SaMD, dan Permenkes RI No 24/2022), NurseFlow Sprint 4B.7 secara tegas **MEMBATASI RUANG LINGKUP**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              NURSEFLOW SPRINT 4B.7 BOUNDARY COVENANT                                   │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ ❌ WHAT NURSEFLOW WILL NEVER DO (NON-GOALS)        │ ✅ WHAT NURSEFLOW DELIVERS (CORE CAPABILITIES)   │
├────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 1. NO Mortality Probability Scoring                │ 1. Deterministic Multi-Domain Clinical Risk State │
│    Sistem TIDAK memprediksi 'persentase kematian'. │    Mengkategorikan urgensi perhatian klinis nyata.│
│ 2. NO Autonomous ICU Bed Booking                   │ 2. Actionable Response Guidelines                 │
│    Sistem TIDAK memindahkan pasien tanpa DPJP.     │    Menyarankan target waktu respon & peran dokter.│
│ 3. NO Automated Treatment / Dosing Trigger         │ 3. Decomposed Explainability Chain                │
│    Sistem TIDAK menginjeksi obat otomatis.         │    Menjelaskan faktor fisiologis pemicu perburukan│
│ 4. NO Black-Box Neural Network Classification      │ 4. Fully Auditable Mathematical Calculus          │
│    Tidak ada bobot AI tak terlacak di persidangan. │    100% transparan, deterministik, dan teruji.    │
│ 5. NO Clinician Bypass                             │ 5. Absolute Clinician Authority & WORM Override   │
│    Kewenangan tertinggi tetap di tangan klinisi.   │    Klinisi dapat meng-upgrade atau men-downgrade. │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 📌 16. KESIMPULAN & LANGKAH SELANJUTNYA

Dokumen spesifikasi ini menetapkan kontrak arsitektural lengkap untuk **Sprint 4B.7: Clinical Risk Stratification Engine**.

Dengan spesifikasi ini:
1. **Pemisahan Konsep** (*Severity vs Trajectory vs Risk*) terjamin secara matematis.
2. **Dekomposisi Risiko** transparan dan dapat diaudit secara medikolegal.
3. **Pemberian Prioritas Tindakan** (*Escalation Priority*) langsung membantu dokter dan perawat di lapangan menyelamatkan nyawa pasien lebih awal.

Spesifikasi ini siap untuk diajukan ke tahap **Arsitektural Review & Persetujuan Pengguna** sebelum implementasi kode dimulai.
