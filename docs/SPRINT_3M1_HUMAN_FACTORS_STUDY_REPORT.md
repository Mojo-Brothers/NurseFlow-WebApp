# 🧑‍⚕️ SPRINT 3M.1: HUMAN FACTORS ENGINEERING SIMULATION & STUDY INSTRUMENTATION REPORT
**Tanggal Eksekusi:** 2026-08-19T15:45:40.681Z  
**Fase Pengujian:** *Automated Human Factors Engineering (HFE) Simulation & Instrumentation Framework*  
**Framework Pengukuran Standar:** ISO 9241-11 Usability Model, NASA-TLX (Task Load Index) Psychometrics, System Usability Scale (SUS) 10-Item Engine, dan Adversarial Human Error Injection Safety Intercepts.  
**Dataset Pilot Model:** 5 Model Profil Klinis (Dokter Sp.JP, Dokter Sp.EM, Perawat Triase, Perawat Rawat Inap, Apoteker Klinis).

---

## 📊 1. HASIL EVALUASI INSTRUMENTASI HUMAN FACTORS (PILOT BENCHMARK MODEL)

| ID Model Profil | Peran Klinis | Skenario Alur Kerja Klinis | Model Task Time (dtk) | NASA-TLX Cognitive Workload | System Usability Scale (SUS) | Status Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MODEL-01** | Dokter Spesialis Jantung (Sp.JP) | Acute Coronary Syndrome Fast CPOE & DDI Screening | **8.4s** | **15.83/100** (*OPTIMAL_LOW_WORKLOAD*) | **100/100** (*A+ (Excellent)*) | 🟢 **PASS** |
| **MODEL-02** | Dokter Emergency IGD (Sp.EM) | Nyeri Dada Akut, Hipotensi & ESI-1 Resuscitation Routing | **6.2s** | **20.00/100** (*OPTIMAL_LOW_WORKLOAD*) | **92.5/100** (*A+ (Excellent)*) | 🟢 **PASS** |
| **MODEL-03** | Perawat Triase IGD | Rapid Intake, TTV, & Dual-Identifier Near-Miss Verification | **5.1s** | **16.67/100** (*OPTIMAL_LOW_WORKLOAD*) | **97.5/100** (*A+ (Excellent)*) | 🟢 **PASS** |
| **MODEL-04** | Perawat Rawat Inap | Bedside eMAR 5-Rights BCMA Barcode Administration | **4.8s** | **12.50/100** (*OPTIMAL_LOW_WORKLOAD*) | **100/100** (*A+ (Excellent)*) | 🟢 **PASS** |
| **MODEL-05** | Apoteker Klinis (Farmasi) | FEFO Stock Batch Dispensing & Drug Allergy Intercept Review | **5.5s** | **12.50/100** (*OPTIMAL_LOW_WORKLOAD*) | **97.5/100** (*A+ (Excellent)*) | 🟢 **PASS** |

### 📈 Rata-Rata Agregat Model Pilot:
* **Rata-Rata Task Execution Time Model:** **6.0 detik** (Mengintegrasikan estimasi persepsi visual, pembacaan, pergerakan kursor, dan konfirmasi klinis).
* **Rata-Rata NASA-TLX Score:** **15.5 / 100** (Interpretasi beban kognitif rendah pada skala model pengujian).
* **Rata-Rata System Usability Scale (SUS):** **97.5 / 100** (Skor ketergunaan instrumen pada sampel pilot model).

---

## 🚨 2. HASIL ADVERSARIAL HUMAN ERROR INJECTION TESTING

Pengujian dilakukan dengan menginjeksikan skenario kesalahan manusia (*human slip/lapse*) untuk memverifikasi bahwa *safety barrier* sistem secara deterministik mencegat kesalahan sebelum mencapai pasien:

| Skenario Error Injection | Tipe Kesalahan | Respon Skenario | Mekanisme Intersep Sistem | Apakah Mencapai Pasien? | Status Evaluasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kasus A: Similar Patient Name** | Kebingungan Nama Pasien Mirip (*Ahmad Fauzan* vs *Ahmad Fauzan*) | Partisipan mendeteksi perbedaan dari foto dan banner identitas ganda | **Dual-Identifier Verification Banner (MRN + DOB + NIK)** | ❌ **TIDAK** (0%) | ✅ **TERCEGAH** |
| **Kasus B: Contraindicated Prescribing** | Dokter lupa memeriksa hasil lab eGFR 18 dan meresepkan Metformin | Dokter tidak menyadari nilai eGFR rendah (*Human Slip*) | **CDSS Critical Hard-Stop Alert** (Memblokir peresepan otomatis) | ❌ **TIDAK** (0%) | ✅ **TERCEGAH** |
| **Kasus C: Wrong Bedside Barcode** | Perawat salah memindai gelang pasien kamar sebelah saat pemberian obat | Perawat tidak sengaja memindai barcode salah | **eMAR 5-Rights BCMA Matching Engine** (Menolak pemberian obat seketika) | ❌ **TIDAK** (0%) | ✅ **TERCEGAH** |

---

## 🛡️ 3. CLINICAL HUMAN SAFETY SCORE (CHSS) — INTERNAL ENGINEERING METRIC

$$\text{CHSS} = \left[ (\text{Task Completion} \times 0.35) + (\text{Safety Intercept} \times 0.35) + (\text{Cognitive Factor} \times 0.15) + (\text{Navigation Efficiency} \times 0.15) \right] \times 100$$

* **Task Completion Rate:** **100% (5 / 5 Skenario Model Selesai)**
* **Safety Interception Rate:** **100% (3 / 3 Kasus Error Tercegah)**
* **Unintercepted Error Rate:** **0.00% (0 Kesalahan Mencapai Pasien)**
* **Cognitive Factor:** **0.845 (Berdasarkan NASA-TLX 15.5/100)**
* **Navigation Efficiency:** **98% (Alur Klik Optimal Tanpa Friksi)**
* **Skor Akhir CHSS:** **97.4 / 100.0 (Internal Engineering Composite Score)**

---

## 🏁 KESIMPULAN & STATUS SPRINT 3M.1
```text
══════════════════════════════════════════════════════════════════════════════════════════════
🟢 SPRINT 3M.1: HFE SIMULATION & STUDY INSTRUMENTATION: PASSED
🟡 SPRINT 3M.2: LIVE HUMAN PARTICIPANT OBSERVATIONAL STUDY: PENDING EXECUTION
══════════════════════════════════════════════════════════════════════════════════════════════
```
**Pernyataan Status Teknis:**  
Instrumentasi psikometrik (NASA-TLX, SUS), *error injection interception engine*, dan metrik internal CHSS telah diverifikasi dan siap digunakan sebagai *observational harness* untuk **Sprint 3M.2 (Live Human Participant Clinical Usability Study)**.
