# 🚀 SPRINT 4B.8A: CLINICAL INTELLIGENCE ORCHESTRATION ENGINE
## Arsitektur Orkestrasi Alert, Event Clustering, Pencegahan Alarm Fatigue & Kontrak Konsumsi Workspace
**Versi Dokumen:** v1.0.0 (Formal Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Software-Verified Deterministic Clinical Intelligence Orchestration Architecture  
**Otoritas:** Enterprise Health Informatics, Clinical Safety & Human Factors Council  
**Prinsip Inti:**  
> **"Detect early. Explain clearly. Prioritize intelligently. Escalate safely. Keep the clinician in control."**  
> **"Satu Pasien ➔ Satu Clinical Event Cluster ➔ Satu Actionable Alert (Bukan Badai Alarm)."**

---

## 🧭 1. EXECUTIVE SUMMARY & LATAR BELAKANG ARSITEKTUR

### 1.1 Masalah Kritis: Bahaya Alarm Fatigue di Lingkungan Klinis
Setelah penyelesaian modul-modul intelligence tingkat layanan (*service-layer*):
* **4B.3**: Closed-Loop Medication Administration & High-Alert Safety
* **4B.4**: Clinical Deterioration Engine & NEWS2 / ADE Detection
* **4B.5**: Clinical Safety & Escalation Governance
* **4B.6**: Longitudinal Patient Trajectory & Velocity Calculus
* **4B.7**: Clinical Risk Stratification Layer

Sistem kini memiliki kemampuan analitik fisiologis yang luar biasa. Namun, jika setiap engine menerbitkan notifikasi secara independen ke antarmuka klinisi (*User Interface*), seorang perawat yang merawat 1 pasien yang memburuk akan menerima **5 hingga 8 alarm terpisah secara bersamaan**:

```text
    ┌──────────────────────────────────────────────────────────┐
    │ ❌ MASALAH: BADAI ALARM TANPA ORKESTRASI (ALARM FATIGUE) │
    ├──────────────────────────────────────────────────────────┤
    │  🔴 ALERT 1: NEWS2 Score Critical (Score = 8)            │
    │  🔴 ALERT 2: Respiratory Deterioration Slope (+3.5/h)    │
    │  🔴 ALERT 3: SpO2 Hypoxemia Panic Boundary (< 90%)       │
    │  🔴 ALERT 4: Hemodynamic MAP Negative Drift (-6.0 mmHg/h)│
    │  🔴 ALERT 5: High Risk Stratification State             │
    │  🔴 ALERT 6: Incipient MODS Multi-Domain Alert           │
    └──────────────────────────────────────────────────────────┘
```

Kondisi ini memicu **Alarm Fatigue** (*Kelelahan Alarm*), penyebab nomor 1 kelalaian klinis di rumah sakit modern menurut *ECRI Institute & The Joint Commission*: klinisi menjadi terbiasa mematikan atau mengabaikan alarm tanpa membaca isinya.

### 1.2 Solusi Sprint 4B.8A: Clinical Alert Orchestrator
Sprint 4B.8A membangun **Clinical Alert Orchestrator** sebagai lapisan agregasi deterministik yang mengkorelasikan seluruh sinyal kejadian klinis menjadi **Satu Kluster Kejadian Klinis yang Terpadu (*One Actionable Clinical Event Cluster*)**.

```text
                      RAW CLINICAL EVENTS
           (NEWS2, Trajectory, ADE, Labs, Risk State)
                              │
                              ↓
              CLINICAL ALERT ORCHESTRATOR (4B.8A)
               ├── 1. Temporal Correlation Engine
               ├── 2. Intelligent Deduplication Filter
               ├── 3. Alert Fatigue Suppression Window
               ├── 4. Event Clustering & Headline Synthesis
               └── 5. Configurable Hospital Governance Protocol
                              │
                              ↓
                  ONE CLINICAL EVENT CLUSTER
             "CRITICAL CARDIORESPIRATORY COLLAPSE"
                              │
                              ↓
┌─────────────────────────────┼─────────────────────────────┐
│                             │                             │
↓                             ↓                             ↓
IGD WORKSPACE         INPATIENT WARD HUD               ICU WORKSPACE
(Rapid Triage Card)   (Bedside Action Banner)         (Telemetry Drawer)
```

---

## 📋 2. CLINICAL EVENT ENVELOPE MODEL (MODEL KEJADIAN KLINIS)

Setiap engine di NurseFlow menerbitkan kejadian (*event*) menggunakan format standar **Clinical Event Envelope**:

```typescript
export type ClinicalEventType = 
  | 'NEWS2_CALCULATED'
  | 'ADE_RECOGNIZED'
  | 'PANIC_LAB_EMITTED'
  | 'TRAJECTORY_VECTOR_UPDATED'
  | 'RISK_STATE_EVALUATED'
  | 'BEDSIDE_ADMINISTRATION_LOGGED'
  | 'CLINICIAN_OVERRIDE_RECORDED';

export interface ClinicalEventEnvelope {
  eventId: string; // UUID v4
  patientId: string;
  encounterId: string;
  tenantId: string;
  sourceService: '4B.3_MEDICATION' | '4B.4_DETERIORATION' | '4B.5_GOVERNANCE' | '4B.6_TRAJECTORY' | '4B.7_RISK_STRATIFIER';
  eventType: ClinicalEventType;
  occurredAt: string; // ISO 8601 UTC
  payload: Record<string, any>;
  idempotencyKey: string;
  tamperProofHash: string; // SHA-256
}
```

---

## 🔗 3. TEMPORAL ALERT CORRELATION ENGINE (KORELASI TEMPORAL)

Alert Orchestrator mengumpulkan seluruh event untuk pasien yang sama dalam jendela temporal geser (*sliding window*, $T_{\text{window}} = 15 - 60\text{ menit}$).

```text
                                  TEMPORAL CORRELATION MATRIX
           Event A (10:00) ─── NEWS2 = 5 (Respiratory Drift)
           Event B (10:05) ─── SpO2 = 91% (Desaturation)          ──┐
           Event C (10:12) ─── MAP = 68 mmHg (Compensating Shock)  ──┼───> CLUSTER: "ACUTE CARDIORESPIRATORY
           Event D (10:15) ─── Risk = HIGH (Urgent Review)        ──┘                 DETERIORATION"
```

### 3.1 Kunci Relasi Korelasi (*Correlation Graph Keys*)
1. **Patient & Encounter Alignment**: `patientId` dan `encounterId` identik.
2. **Temporal Proximity**: Terjadi dalam rentang $\le 30\text{ menit}$ dari event primer.
3. **Physiological Synergy**: Hubungan patofisiologis antar-organ (misal: Sepsis + Asidosis Laktat + Hipotensi dikorelasikan sebagai *Syok Septik Terpadu*).

---

## 🛡️ 4. INTELLIGENT ALERT DEDUPLICATION & SUPPRESSION

Untuk mencegah penerbitan alert berulang ketika kondisi pasien masih sama:

```typescript
export interface DeduplicationFingerprint {
  patientId: string;
  dominantDomain: string;
  severityBand: string;
  trajectoryBand: string;
  lastEmittedAt: number; // Timestamp epoch
  suppressionWindowMinutes: number; // e.g. 30 menit
}
```

### 4.1 Aturan Penekanan Alert (*Suppression Rules*)
1. **Identical State Suppression**: Jika pasien sudah berstatus `HIGH_RISK` dan observasi baru 15 menit kemudian masih menunjukkan `HIGH_RISK` dengan laju $\Delta\mathcal{V} < 0.5$, alarm **TIDAK DIBUNYIKAN KEMBALI**, melainkan status HUD diperbarui diam-diam (*silent update*).
2. **Dynamic Breakthrough Escalation**: Alarm baru **HANYA DIIZINKAN MENEROBOS (*Breakthrough Alert*)** jika:
   - Tingkat keparahan naik band (misal: `MODERATE` $\longrightarrow$ `CRITICAL`).
   - Laju perburukan mengalami akselerasi mendadak ($\Delta\mathcal{V} \ge +1.0/\text{jam}$).
   - Terjadi kondisi baru mengancam nyawa (*Emergent Threat*, misal: Anafilaksis atau Stridor).

---

## 🚨 5. ALERT PRIORITY HIERARCHY (HIERARKI PRIORITAS RESIDENSIAL)

Setiap kluster klinis dipetakan ke dalam 4 tingkatan prioritas universal:

```text
┌────────────────────────────────┬──────────────┬───────────────┬──────────────────────────────┐
│ PRIORITAS KLUSTER              │ KODE WARNA   │ TARGET RESPON │ PROTOKOL NOTIFIKASI          │
├────────────────────────────────┼──────────────┼───────────────┼──────────────────────────────┤
│ 1. IMMEDIATE_LIFE_THREAT (P1)  │ 🔴 Flash Red │ < 5 Menit     │ Alarm Suara Kritis + MET     │
│ 2. URGENT_CLINICAL_ACTION (P2) │ 🟠 Amber/Red │ 15 - 30 Menit │ Banner Kuning Terpancang DPJP│
│ 3. PRIORITY_REVIEW (P3)        │ 🟡 Yellow    │ 60 Menit      │ Notifikasi Banner Ward Nurse │
│ 4. ROUTINE_AWARENESS (P4)      │ 🔵 Teal/Blue │ 120 - 240 Men │ Indikator Halus Dashboard    │
└────────────────────────────────┴──────────────┴───────────────┴──────────────────────────────┘
```

---

## 📦 6. CLINICAL EVENT CLUSTER MODEL (STRUKTUR DATA KLUSTER TERPADU)

Struktur data resmi `ClinicalEventCluster` yang dikonsumsi oleh antarmuka pengguna:

```typescript
export type AlertLifecycleState = 
  | 'GENERATED'
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'ESCALATED'
  | 'OVERRIDDEN'
  | 'RESOLVED'
  | 'EXPIRED'
  | 'SUPPRESSED';

export interface ClinicalEventCluster {
  clusterId: string; // e.g. "CLUST-PT01-20260820-001"
  patientId: string;
  encounterId: string;
  wardOrBedLocation: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string;

  // 1. Cluster Identity & Headline
  clusterTitle: string; // e.g. "CRITICAL CARDIORESPIRATORY DETERIORATION"
  headlineAction: string; // e.g. "ACTIVATE MET TEAM / PREPARE INTUBATION & FLUID RESUSCITATION"
  priorityTier: 'IMMEDIATE_LIFE_THREAT' | 'URGENT_CLINICAL_ACTION' | 'PRIORITY_REVIEW' | 'ROUTINE_AWARENESS';
  targetSlaMinutes: number;

  // 2. Synthesized Clinical Status
  compositeSeverity: 'NORMAL' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';
  compositeTrajectory: 'IMPROVING' | 'STABLE' | 'SLOW_DRIFT' | 'MODERATE_WORSENING' | 'RAPID_WORSENING' | 'FULMINANT';
  compositeRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  dominantDomain: 'HEMODYNAMIC' | 'RESPIRATORY' | 'NEUROLOGIC' | 'RENAL_METABOLIC' | 'INFECTION_SEPSIS' | 'MEDICATION_EXPOSURE';
  affectedDomains: string[];

  // 3. Correlated Raw Events & Evidence
  correlatedEventIds: string[];
  evidenceQuality: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  explainability: DecomposedClusterEvidence;

  // 4. Governance & Lifecycle
  lifecycleState: AlertLifecycleState;
  acknowledgedBy?: ClinicianIdentity;
  acknowledgedAt?: string;
  snoozeUntil?: string;
  escalatedToRole?: string;
  overrideDetails?: Record<string, any>;
  
  // 5. Applied Hospital Protocol Reference
  appliedProtocol: {
    protocolId: string; // e.g. "HOSP-MET-RULE-V2026.08"
    protocolVersion: string;
    ruleDescription: string;
  };
  tamperProofHash: string; // SHA-256 Merkle root of all correlated events
}

export interface DecomposedClusterEvidence {
  summaryReason: string;
  keyDrivers: Array<{
    parameter: string;
    trend: string;
    slope: string;
    impact: 'PRIMARY' | 'SECONDARY' | 'CONTRIBUTING';
  }>;
  suggestedClinicalSteps: string[];
  protocolGovernanceNote: string;
}
```

---

## 🔄 7–11. SIKLUS HIDUP ALERT & MESIN KEADAAN (ALERT LIFECYCLE FSM)

```text
               ┌───────────────┐
               │   GENERATED   │
               └───────┬───────┘
                       ↓
               ┌───────────────┐
         ┌────>│    ACTIVE     │<────┐ (Auto-Wake on Slope Acceleration)
         │     └───────┬───────┘     │
         │             ↓             │
         │     ┌───────────────┐     │
         │     │ ACKNOWLEDGED  ├─────┘ (Snooze 30m / 60m)
         │     └───────┬───────┘
         │             ↓
         │     ┌───────────────┐
         │     │   ESCALATED   │ (MET / Code Blue Summoned)
         │     └───────┬───────┘
         │             ↓
   [OVERRIDDEN] ┌───────────────┐ [EXPIRED]
   (DPJP PIN)   │   RESOLVED    │ (Vitals Normalized >= 2h)
                └───────────────┘
```

### Rincian State Mesin Keadaan:
1. **`GENERATED`**: Kluster baru saja dibuat oleh orkestrator dari event-event mentah.
2. **`ACTIVE`**: Ditampilkan pada antarmuka pengguna dengan visual dan sinyal suara sesuai tingkat prioritas.
3. **`ACKNOWLEDGED`**: Perawat/dokter telah mengklik tombol konfirmasi. Suara alarm berhenti, namun banner tetap ada dalam status siaga.
4. **`ESCALATED`**: Tim spesialis (MET/ICU/DPJP) telah dihubungi melalui sistem panggilan terintegrasi.
5. **`OVERRIDDEN`**: DPJP mengubah level risiko secara medikolegal dengan PIN dan justifikasi klinis.
6. **`RESOLVED`**: Parameter pasien kembali ke batas aman atau tindakan definitif telah selesai.
7. **`EXPIRED`**: Jendela observasi berakhir tanpa adanya perburukan baru.
8. **`SUPPRESSED`**: Ditahan sementara oleh mekanisme *anti-storm throttle*.

---

## 💡 12. KONTRAK EXPLAINABILITY MULTI-LEVEL (EXPLAINABILITY CONTRACT)

Setiap kluster klinis wajib menyediakan visualisasi 3 tingkatan:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: BANNER HEADLINE (Dibaca dalam 2 detik)                        │
│ 🔴 CRITICAL CARDIORESPIRATORY COLLAPSE                                 │
│ NEWS2: 8 | Trajectory: RAPID_WORSENING (+2.5/h) | Risk: CRITICAL       │
│ Tindakan: AKTIFKAN TIM MET / SIAPKAN INTUBASI                          │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 2: 3 FAKTOR UTAMA (Dibaca dalam 10 detik)                        │
│ • Respiratorik : RR naik 18 -> 28 -> 34 x/m (+8.0/h), SpO2 88%         │
│ • Hemodinamik  : MAP anjlok 88 -> 68 mmHg (-10.0 mmHg/h)               │
│ • Sepsis       : Laktat akselerasi 1.4 -> 3.8 mmol/L                   │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 3: DEEP EVIDENCE LEDGER (Modal [VIEW EVIDENCE])                  │
│ • Sparkline runtun waktu lengkap 6 jam                                 │
│ • Riwayat obat dan infus inotropik                                     │
│ • Aturan Protokol: HOSP-MET-RULE-V2026.08 (Versioned Hospital Policy)  │
│ • SHA-256 Audit Trail Hash                                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ 13. INTEGRASI PROTOKOL TATA KELOLA RUMAH SAKIT TERVERSI (VERSIONED GOVERNANCE)

Sesuai arahan arsitektur:
> **"Threshold `≥3 domain = MET` adalah protokol rumah sakit yang dapat dikonfigurasi (*versioned*), bukan kebenaran klinis mutlak yang di-hardcode."**

```typescript
export interface HospitalGovernanceProtocol {
  protocolId: string; // e.g. "HOSP-MET-RULE-V2026.08"
  hospitalTenantId: string;
  effectiveDate: string;
  multiDomainMetThreshold: number; // Default: 3 domains (Dapat dikonfigurasi per RS)
  preCrisisVelocityThreshold: number; // Default: +1.5 NEWS2/h
  actionPolicy: 'MET_REVIEW_RECOMMENDED' | 'DPJP_DIRECT_PAGE' | 'ICU_CHARGE_ALERT';
  authorizedByMedicalCommittee: boolean;
  committeeApprovalRef: string;
}
```

---

## 🔐 14. HUMAN AUTHORIZATION & BREAK-GLASS CONTROLS

1. **Authorization Guard**: Sistem **TIDAK BOLEH** secara otomatis melakukan transfer bangsal atau pemesanan obat tanpa otorisasi manusia.
2. **Break-Glass Emergency Action**: Pada kondisi P1 (misal: *Cardiac Arrest / Anaphylaxis*), tombol `[EMERGENCY MET CALL]` dapat ditekan dengan 1-klik, mencatat identitas perawat dan waktu presisi di ledger medikolegal.

---

## 📜 15. AUDIT LINEAGE & SHA-256 MERKLE EVENT LINKING

Setiap kluster klinis mengaitkan hash dari seluruh event penyusunnya:

$$\text{ClusterHash} = \text{SHA256}(\text{ClusterID} + \sum \text{EventHash}_i + \text{LifecycleState} + \text{ProtocolVersion})$$

Menjamin integritas bukti saat evaluasi keselamatan pasien (*Incident Investigation / Morbidity Review*).

---

## 💤 16. ALERT FATIGUE PREVENTION & INTELLIGENT SNOOZE RULES

1. **Max Active Cluster**: Maksimal **1 Kluster Aktif per Pasien**. Event baru yang relevan akan di-*merge* ke dalam kluster yang sama, bukan membuat jendela alert baru.
2. **Intelligent Snooze**:
   - Jika perawat memilih *Snooze 30 menit*, suara alarm berhenti.
   - Jika dalam rentang 30 menit tersebut terjadi **akselerasi perburukan baru** (misal: $\text{SpO2} \le 85\%$), sistem **secara cerdas membatalkan snooze (*Auto-Wake*)** dan membunyikan alarm kembali.

---

## 🖥️ 17. KONTRAK KONSUMSI WORKSPACE (IGD, BANGSAL, ICU)

```text
┌───────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ WORKSPACE LOKASI          │ SPESIFIKASI PENAMPILAN KLUSTER KLINIS                                  │
├───────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 1. IGD Rapid Workspace    │ Header Card Pasien dengan Badge Prioritas Berkedip (P1/P2) & Tombol Cito│
│ 2. Inpatient Ward Desk    │ Papan Pengawas Sentral (Central Board) mengurutkan pasien berdasarkan SLA│
│ 3. ICU Acuity Workspace   │ Telemetry Acuity Drawer menampilkan multi-organ vector & slope grafis  │
└───────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ 18. EVENT IDEMPOTENCY & OUTBOX RELIABILITY

Mencegah pemrosesan ganda (*duplicate processing*) akibat latensi jaringan atau retry mekanisme via `Idempotency-Key` pada `persistenceAdapter`.

---

## ⚖️ 19. CONFLICT RESOLUTION MATRIX (RESOLUSI KONFLIK INPUT)

1. **Sensor vs Laboratorium**: Jika data sensor $\text{SpO2} = 80\%$ (sinyal noise), namun AGD $\text{PaO2} = 95\text{ mmHg}$ terbaru masuk, sistem memprioritaskan hasil AGD terverifikasi laboratorium.
2. **Concurrent Acknowledge vs Escalation**: Jika 2 staf melakukan aksi bersamaan, sistem menerapkan *Deterministic Timestamp Precedence* dan mencatat kedua staf di audit trail.

---

## 🚫 20. EXPLICIT NON-GOALS & ARSITEKTUR BOUNDARIES

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              NURSEFLOW SPRINT 4B.8A BOUNDARY COVENANT                                  │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ ❌ WHAT 4B.8A WILL NEVER DO (NON-GOALS)            │ ✅ WHAT 4B.8A DELIVERS (CORE CAPABILITIES)        │
├────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 1. NO Independent Multi-Popup Alarm Storms         │ 1. Unified One-Patient-One-Cluster Orchestration  │
│ 2. NO Autonomous Clinical Decisions                │ 2. Clear Headline & 3-Level Explainability        │
│ 3. NO Hardcoded Universal MET Dogma                │ 3. Versioned Hospital Policy & Threshold Protocol │
│ 4. NO Silent Death (No Blind Suppression)          │ 4. Intelligent Auto-Wake on Sudden Acceleration   │
│ 5. NO Unauditable Alarm Muting                     │ 5. Immutable Cryptographic WORM Audit Trace       │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 🧪 21. MATRIKS 40 SKENARIO UJI ORKESTRASI ALERT (40-SCENARIO TEST MATRIX)

| ID | Nama Skenario Uji | Event Influx & Pola Input | Ekspektasi Orkestrasi Kluster | Verifikasi Lifecycle & Workspace |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Single Clustered Alert from 5 Events** | 5 event serentak: NEWS2 8 + RR 30 + SpO2 89 + MAP 65 + High Risk | Dihasilkan **1 Kluster Tunggal**: `CRITICAL CARDIORESPIRATORY COLLAPSE` | Zero multi-popup, P1 Priority, SLA $\le 5$m |
| **TC-02** | **Pre-Crisis Early Deterioration Alert** | NEWS2 3 + Velocity $+1.8/\text{h}$ + Sepsis Laktat 2.4 | Kluster: `URGENT PRE-CRISIS DETERIORATION` (P2 Amber) | SLA $\le 15$m, Reviewer: DPJP Specialist |
| **TC-03** | **Alert Deduplication on Unchanged State**| Pasien High Risk menerima event serupa 10 menit kemudian | Event di-*merge* ke kluster aktif tanpa alarm suara baru | `isSuppressed: true`, Silent HUD update |
| **TC-04** | **Dynamic Breakthrough Escalation** | Pasien P2 memburuk mendadak menjadi Apnea/Stridor | Kluster aktif dielevasikan otomatis ke P1 `CRITICAL` | Snooze dibatalkan, Alarm P1 berbunyi |
| **TC-05** | **Multi-Domain Incipient MODS Cluster** | Disfungsi simultan: MAP drop + Oliguria + Ensefalopati | Kluster: `MULTI-ORGAN DYSFUNCTION SYNERGY` | Sesuai protokol RS: `MET_REVIEW_RECOMMENDED` |
| **TC-06** | **Versioned Hospital Protocol Adaptation**| RS mengonfigurasi threshold MODS $= 2$ domain (Protokol Khusus) | Sistem beradaptasi sesuai konfigurasi `HOSP-MET-RULE-V2026.08` | Audit mencatat versi protokol RS yang aktif |
| **TC-07** | **Nurse Acknowledge Lifecycle State** | Perawat menekan tombol [ACKNOWLEDGE] pada banner bangsal | Status kluster berubah menjadi `ACKNOWLEDGED` | Alarm suara berhenti, SLA waktu respon tercatat |
| **TC-08** | **Intelligent Snooze 30m with Auto-Wake**| Perawat snooze 30m, lalu SpO2 drop $< 85\%$ di menit ke-10 | Status kluster auto-wake kembali ke `ACTIVE` | Snooze gugur seketika saat perburukan terjadi |
| **TC-09** | **Clinician Escalation to MET Role** | Dokter jaga menekan tombol [ESCALATE TO MET] | Status kluster berubah menjadi `ESCALATED` | Notifikasi diteruskan ke Tim MET & ICU Coordinator |
| **TC-10** | **DPJP Downgrade Override with WORM PIN** | DPJP mendowngrade kluster P1 ke P3 dengan catatan klinis | Status kluster: `OVERRIDDEN`, Hash WORM baru terbentuk | Catatan justifikasi tersimpan kekal di ledger |
| **TC-11** | **Resolution on Clinical Normalization** | Parameter TTV normal dan stabil selama $\ge 2$ jam | Status kluster berubah otomatis menjadi `RESOLVED` | Banner hilang dari active worklist bangsal |
| **TC-12** | **Opioid OIRD Adverse Event Cluster** | Post-Morfin: RR 8 + Somnolen + NEWS2 6 | Kluster: `ACUTE OPIOID RESPIRATORY DEPRESSION` | Rekomendasi: `PREPARE NALOXONE RESCUE` |
| **TC-13** | **Insulin Hypoglycemia Acute Cluster** | GDS 40 mg/dL + Diaforesis + Takikardia | Kluster: `SEVERE HYPOGLYCEMIC RESCUE` | Rekomendasi: `DEXTROSE 40% IV STAT` |
| **TC-14** | **Post-Op Surgical Hemorrhage Cluster** | Post-Op: MAP turun $+10$ mmHg/h + HR 130 + Drain aktif | Kluster: `POST-OPERATIVE SURGICAL BLEEDING` | Prioritas: P1 Cito ke Tim Bedah & Anestesi |
| **TC-15** | **Isolated Benign Fever Gating** | Suhu 39.0°C tanpa takikardia/takipnea/laktat | Kluster: P4 `ROUTINE AWARENESS (ISOLATED FEVER)` | Tidak ada alarm suara yang mengganggu perawat |
| **TC-16** | **COPD Scale 2 Non-Alarm Gating** | Pasien PPOK SpO2 89% pada O2 2L stabil | Tidak memicu kluster alarm hipoksemia palsu | Status: `NORMAL_MONITORING_PPOK_SCALE_2` |
| **TC-17** | **Palliative DNR Patient Routing** | Pasien Kanker Terminal dengan DNR aktif mengalami apneu | Kluster: `PALLIATIVE COMFORT CARE PATHWAY` | Alarm MET ditekan; diarahkan ke perawat paliatif |
| **TC-18** | **Data Deficit Active Warning Cluster** | TTV tidak lengkap (SpO2 & Kesadaran kosong $> 4$ jam) | Kluster: `DATA DEFICIT RE-ASSESSMENT REQUIRED` | Mencegah kematian tersembunyi karena data kosong |
| **TC-19** | **Sensor Motion Artefact Filtering** | SpO2 drop 70% selama 5 detik lalu normal (Probe Noise) | Artefak dibuang; tidak menghasilkan kluster alarm | Audit log mencatat `SIGNAL_NOISE_DISCARDED` |
| **TC-20** | **Pediatric Decompensation Alert** | Anak usia 2 thn: HR 170 + RR 45 + Letargis | Kluster: `PEDIATRIC CARDIORESPIRATORY CRITICAL` | Mengaktifkan protokol PALS pediatrik khusus |
| **TC-21** | **Slow Drift Subdural Bleeding Cluster** | GCS turun perlahan 15 $\rightarrow$ 14 $\rightarrow$ 12 dalam 6 jam | Kluster: `NEUROLOGICAL SLOW-DRIFT DECLINE` | Rekomendasi: `CITO HEAD CT-SCAN & NEUROSURGERY` |
| **TC-22** | **Post-Extubation Stridor Alert** | Stridor inspirasi terdengar 30m pasca ekstubasi | Kluster: `UPPER AIRWAY COMPROMISE / POST-EXTUBATION` | P1 Immediate, Siapkan Re-intubasi & Steroid |
| **TC-23** | **Anaphylaxis Shock Immediate Cluster** | Post-Ceftriaxone: Urtikaria + Stridor + TD 70/40 | Kluster: `ACUTE ANAPHYLAXIS COLLAPSE` | Rekomendasi: `EPINEPHRINE 0.5MG IM STAT` |
| **TC-24** | **Hyperkalemic ECG Instability Alert** | K+ 7.0 mEq/L + Bradikardia 48 bpm | Kluster: `HYPERKALEMIA CARDIOVASCULAR COLLAPSE` | Rekomendasi: `CALCIUM GLUCONATE & INSULIN-DEXTROSE` |
| **TC-25** | **DKA/HHS Hyperglycemic Crisis Cluster** | GDS 620 mg/dL + pH 7.15 + Kussmaul | Kluster: `DIABETIC KETOACIDOSIS CRISIS` | Rekomendasi: `IV FLUID RESUSCITATION & INSULIN DRIP`|
| **TC-26** | **Silent Hypoxemia (Happy Hypoxia) Alert** | Pasien tampak nyaman, SpO2 83% pada udara bebas | Kluster: `SILENT HYPOXEMIA ALERT` | Rekomendasi: `O2 HIGH-FLOW & AGD CITO` |
| **TC-27** | **Rebound Hypotension Post-Vasodilator** | MAP anjlok 120 $\rightarrow$ 55 mmHg pasca titrasi antihipertensi | Kluster: `IATROGENIC HEMODYNAMIC COLLAPSE` | Rekomendasi: `STOP TITRATION & FLUID BOLUS` |
| **TC-28** | **Multi-Inotrope Critical Escalation** | Titrasi Norepinefrin + Vasopresin meningkat di bangsal | Kluster: `HIGH-ALERT VASOACTIVE ESCALATION` | Rekomendasi: `IMMEDIATE ICU BED TRANSFER` |
| **TC-29** | **Hepatic Encephalopathy Cluster** | Bilirubin 22 mg/dL + Asteriksis + GCS turun | Kluster: `ACUTE HEPATIC ENCEPHALOPATHY` | Rekomendasi: `LACTULOSE & AMMONIA MONITORING` |
| **TC-30** | **Dialysis Chronic Anuria Gating** | Pasien CKD anuria stabil tidak memicu alarm AKI palsu | Kluster disesuaikan: `CHRONIC_DIALYSIS_BASELINE` | Tidak ada false alarm oliguria di bangsal |
| **TC-31** | **Explainability Level 1 Headline Contract**| Kueri teks ringkasan untuk header bangsal | Output memenuhi struktur: Headline + NEWS2 + Velocity | String < 120 karakter terbaca dalam 2 detik |
| **TC-32** | **Explainability Level 2 Key Drivers Contract**| Kueri 3 faktor pendorong utama | Output mengembalikan: Parameter, Nilai, Slope, Dampak | Tepat 3 driver terurut signifikansi fisiologis |
| **TC-33** | **Explainability Level 3 Deep Ledger Contract**| Kueri modal detail bukti klinis | Mengembalikan runtun waktu lengkap & link protokol RS | SHA-256 Merkle root terverifikasi utuh |
| **TC-34** | **IGD Workspace Card Transformation Contract**| Render kluster pada konteks IGD Rapid Triage | Output: ESI/MTS Level + Headline Action + Cito Button | Sesuai kontrak UI IGD Sprint 4B.2 |
| **TC-35** | **Inpatient Ward Central Board Contract** | Render daftar pasien bangsal dengan pengurutan SLA | Urutan: P1 (Top) $\rightarrow$ P2 $\rightarrow$ P3 $\rightarrow$ P4 | Target SLA terhitung mundur (*Countdown Timer*) |
| **TC-36** | **ICU Acuity Telemetry Drawer Contract** | Render drawer analitik ICU multi-parameter | Output: 6 Vektor Organ + Delta Slope + High-Alert Meds| Format terintegrasi dengan ICU Acuity 4B.1 |
| **TC-37** | **Concurrent Acknowledge & Override Conflict**| Perawat Acknowledge pada 10:00:01, DPJP Override 10:00:02 | Sistem menerapkan Override DPJP sebagai status final | Kedua aksi tercatat lengkap di audit trail |
| **TC-38** | **Idempotent Influx & Duplicate Reject** | Event yang sama dikirim ulang 3x karena network retry | Hanya 1 event yang diproses; 2 lainnya diabaikan | Zero state duplication / Zero double counting |
| **TC-39** | **Massive Concurrent Influx (200 Patients)**| 200 pasien dievaluasi serentak dalam < 300 ms | Seluruh 200 kluster dihasilkan dengan zero cross-leak | Evaluasi independen terisolasi antar-pasien |
| **TC-40** | **End-to-End Orchestrator Pipeline Pass** | Runtun: Event $\rightarrow$ Correlate $\rightarrow$ Deduplicate $\rightarrow$ Cluster $\rightarrow$ UI | 100% Deterministic Pipeline Execution Succeeded | Seluruh invariant arsitektur terpenuhi utuh |

---

## 📌 22. KESIMPULAN & LANGKAH SELANJUTNYA

Dokumen spesifikasi ini menetapkan cetak biru arsitektural lengkap untuk **Sprint 4B.8A: Clinical Intelligence Orchestration Engine**.

Dengan spesifikasi ini:
1. **Bahaya Alarm Fatigue teratasi tuntas** melalui konsolidasi *One Patient ➔ One Actionable Alert*.
2. **Kewenangan Klinisi Terjaga Mutlak** melalui mekanisme Acknowledge, Override WORM, dan Adaptasi Protokol RS.
3. **Intelligence Operasional Nyata** siap terhubung mulus ke seluruh workspace kerja manusia di IGD, Rawat Inap, dan ICU.

Spesifikasi ini siap diajukan ke tahap **Arsitektural Review & Persetujuan Pengguna** sebelum implementasi kode dimulai.
