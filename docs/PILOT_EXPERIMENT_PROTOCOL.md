# 🏥 PROTOKOL EKSPERIMEN TERKONTROL PILOT DEPLOYMENT (SPRINT 3K)
**NurseFlow Enterprise Hospital Information System**  
*Standar Pengujian Lapangan Klinis Terkendali, JCI IPSG, KARS, & Kemenkes RI*

> **Prinsip Utama Tata Kelola Saintifik (*Scientific Governance Framing*):**  
> *"Pilot ini bukan sekadar menguji apakah NurseFlow bagus, melainkan membuktikan apakah NurseFlow mampu mempertahankan keselamatan pasien, integritas informasi klinis, dan performa manusia di bawah kondisi kerja rumah sakit yang nyata."*

---

## 🚦 1. STATUS TATA KELOLA SAINTIFIK (*SCIENTIFIC GOVERNANCE READINESS*)

Kesiapan dinilai secara berbasis bukti protokol (*Protocol Readiness = 100%*), sementara keandalan sistem riil (*System Reliability*) akan dibuktikan selama 2 hari pelaksanaan pilot terkontrol:

| Domain Tata Kelola | Status Evaluasi | Keputusan Dewan Arsitektur & Klinis |
| :--- | :---: | :---: |
| **Arsitektur Inti & Event Stream** | 🟢 **PASS** | 🔒 **BASELINE LOCKED** |
| **Keamanan Klinis & Anti-IDOR** | 🟢 **PASS** | 🛡️ **SAFETY GATES LOCKED** |
| **Protokol Faktor Manusia & Anti-Bias** | 🟢 **PASS** | 📋 **PROTOCOL LOCKED** |
| **Desain Eksperimen & Skenario Cohort** | 🟢 **PASS** | 🎯 **PILOT READY** |
| **Tata Kelola Perubahan (Change Governance)** | 🟢 **PASS** | 🔒 **CHANGE FREEZE ACTIVE** |

---

## 🔒 2. PERNYATAAN PEMBEKUAN SISTEM & INTEGRITAS SIKLUS ILMIAH (*SCIENTIFIC CYCLE INTEGRITY*)

Selama pelaksanaan Pilot Deployment Sprint 3K, seluruh tim rekayasa terikat pada aturan integritas ilmiah mutlak:

| ⛔ DILARANG KERAS (FORBIDDEN) | ✅ HANYA DIIZINKAN (PERMITTED) |
| :--- | :--- |
| ❌ **Memperbaiki sistem selama pilot berlangsung** | ✅ **Mengumpulkan seluruh data & video terlebih dahulu** |
| ❌ **Mengubah UI setelah sesi pertama selesai** | ✅ **Menganalisis seluruh temuan secara menyeluruh & objektif** |
| ❌ **Menambah fitur baru atau merombak database** | ✅ **Melakukan perbaikan serentak setelah siklus 2 hari tuntas** |
| ❌ Memberi petunjuk atau mengoreksi salah klik | ✅ Membiarkan kebingungan terjadi sebagai bukti data UX |

---

## 🎯 3. JADWAL PELAKSANAAN HARI 1: 2 BATCH TERPISAH (INVERTED HIGH-ACUITY SHIFT)

Hari pertama **tidak menguji 10 skenario sekaligus**, melainkan dipecah menjadi 2 Batch terkontrol dengan jeda istirahat dan debriefing di antaranya:

```text
JADWAL SHIFT MALAM (PUKUL 02.00 – 04.00 WIB)

BATCH 1: KEDARURATAN RESUSITASI & CODE BLUE (3 SKENARIO)
├── [1] S-05: STEMI Akut & Code Blue Drill (Triase ESI-1, CPR/Defib, CPOE CITO Resuscitation, eMAR)
├── [2] S-06: Stroke Iskemik Akut (GCS Alert, CT-Scan PACS, Door-to-Needle Timer, Interruption Test)
└── [3] S-09: Sepsis Berat & Syok (Transfer ICU, Handover SBAR Digital, Balans Cairan, Shift Handover)

============================================================
☕ ISTIRAHAT & DEBRIEFING TERSTRUKTUR (15 – 20 MENIT)
============================================================

BATCH 2: TINDAKAN BEDAH CITO & SAFEGUARD KRITIS (2 SKENARIO)
├── [4] S-08: Appendicitis Akut Perforasi (Operasi CITO IBS, WHO Surgical Checklist)
└── [5] S-07: Alergi Berat Cross-Sensitivity (Resep Penisilin -> CDSS Critical Block)

============================================================
HARI 2: KASUS RAWAT INAP & POLIKLINIK RUTIN (5 SKENARIO)
├── [6] S-01: Pasien Baru "Mr. X" Non-BPJS (Registrasi Cepat, General Consent, Gelang)
├── [7] S-02: Pasien Lama Fast-Track RM (Pencarian EMPI Ctrl+K, Check-in Antrean Poli)
├── [8] S-03: Demam Berdarah Dengue (DHF Grade II, 1-Klik CDSS DHF Care Plan)
├── [9] S-04: Pneumonia Komunitas (CPOE Multi-Item, Telaah Farmasi, eMAR Bedside)
└── [10] S-10: Pasien Pulang & Discharge (Resume Medis Terkunci, Billing Kasir, Rilis Bed)
```

### 🚨 3 Uji Stres Kritis Tambahan (Clinical Reality Torture Tests):
1. **Code Blue Sudden Arrest Drill (Simulasi Henti Jantung Mendadak pada S-05)**:
   - Alur: CPR $\rightarrow$ Defibrilasi $\rightarrow$ Intubasi $\rightarrow$ CPOE Obat Resusitasi CITO (Epinefrin/Amiodaron) $\rightarrow$ Dokumentasi Bedside $\rightarrow$ Transfer ICU.
   - Evaluasi: Dokter mampu order CITO tanpa hambatan popup, perawat mencatat obat tanpa meninggalkan pasien, transfer ICU mulus.
2. **Interruption & Context Switching Test (Uji Gangguan Mendadak pada S-06)**:
   - Alur: Dokter sedang menulis SOAP/Order $\rightarrow$ Diinterupsi telepon konsul / keluarga pasien selama **3 menit** $\rightarrow$ Kembali ke sistem.
   - Evaluasi: Draf SOAP tersimpan utuh di `localStorage`, form tidak tertimpa, fokus tidak beralih ke pasien lain (`Interruption Recovery Rate >= 95%`).
3. **Shift Handover Continuity Validation (Uji Estafet Shift Malam ke Pagi pada S-09)**:
   - Alur: Dokter/Perawat shift malam (02.00–04.00) input encounter $\rightarrow$ Pergantian shift $\rightarrow$ Dokter/Perawat shift pagi (07.00) login membuka pasien yang sama.
   - Evaluasi: Seluruh riwayat tindakan dan order terlihat instan, formulir Handover SBAR terbaca jelas dan dapat ditindaklanjuti (`Shift Handover Success Rate >= 95%`).

### Rincian Profil 10 Skenario:

1. **S-01 — Pasien Baru Umum (Non-BPJS)**
   - *Profil*: Ny. Amanda (32 thn), WNI, Pembayaran Pribadi/Cash.
   - *Objektif*: Registrasi pasien baru, entri NIK, persetujuan General Consent digital, penerbitan gelang barcode identitas.
2. **S-02 — Pasien Lama Berulang (Fast-Track)**
   - *Profil*: Tn. Bambang (58 thn), No. RM `MRN-2026-001024`, Kontrol Hipertensi Poli Penyakit Dalam.
   - *Objektif*: Pencarian instan EMPI Guard (Ctrl+K), konfirmasi SEP BPJS, check-in antrean poli tanpa registrasi ulang.
3. **S-03 — Demam Berdarah Dengue (DHF Grade II)**
   - *Profil*: An. Dimas (9 thn), Demam tinggi 4 hari, Trombosit 68.000, Epistaksis ringan.
   - *Objektif*: Skoring Triase ESI Level 3, asesmen SOAP DPJP Anak, penerapan 1-klik CDSS DHF Care Plan (IVFD RL + Serial Darah Lengkap per 12 jam).
4. **S-04 — Pneumonia Komunitas (CAP)**
   - *Profil*: Bpk. Herman (67 thn), Sesak nafas, Batuk produktif, Ronki basah kasar.
   - *Objektif*: CPOE Ceftriaxone 1g IV + Nebulizer Combivent, telaah farmasi JCI MMU.4, verifikasi eMAR bedside 5-Benar oleh perawat bangsal.
5. **S-05 — STEMI Anteroseptal (Kedaruratan Kardiovaskular)**
   - *Profil*: Tn. Chandra (52 thn), Nyeri dada tipikal substernal tembus punggung, diaphoresis.
   - *Objektif*: Triase Resusitasi ESI Level 1 (SLA $< 60$ dtk), CPOE CITO Loading Aspilet + Clopidogrel + Isoket, koordinasi transfer Kateterisasi/ICCU.
6. **S-06 — Stroke Iskemik Akut (Onset $< 3$ Jam)**
   - *Profil*: Ibu Farida (64 thn), Hemiparesis dekstra mendadak, Afasia motorik.
   - *Objektif*: Skoring GCS dan NIHSS cepat, Order CITO CT-Scan Kepala non-kontras ke PACS, notifikasi alert Door-to-Needle timer.
7. **S-07 — Pasien Alergi Berat (Cross-Sensitivity Challenge)**
   - *Profil*: Tn. Gunawan (45 thn), Riwayat alergi berat: Anafilaksis Amoxicillin / Penicillin.
   - *Objektif*: Dokter meresepkan Ampicillin $\rightarrow$ Sistem CDSS memblokir seketika (*Critical Block*), dokter memilih obat alternatif aman (Azithromycin/Ciprofloxacin).
8. **S-08 — Appendicitis Akut Perforasi (Operasi CITO IBS)**
   - *Profil*: Sdr. Eko (23 thn), Nyeri perut kanan bawah akut, leukositosis 18.000.
   - *Objektif*: Konsultasi CITO Bedah, pemesanan kamar operasi, eksekusi 3-Fase *WHO Surgical Safety Checklist* (*Sign In, Time Out, Sign Out*).
9. **S-09 — Sepsis Berat & Transfer ICU**
   - *Profil*: Ny. Hartini (71 thn), Hipotensi refrakter, laktat darah tinggi, pneumonia berat.
   - *Objektif*: Pindah unit intensif, sinkronisasi bed ICU via ADT, formulir Handover SBAR elektronik, pemantauan balans cairan ketat.
10. **S-10 — Pasien Pulang (Clinical Discharge & Financial Settlement)**
    - *Profil*: Tn. Indra (40 thn), Kondisi klinis membaik, kriteria pulang terpenuhi.
    - *Objektif*: Pengisian resume medis rawat inap elektronik (Discharge Summary), penandatanganan DPJP, penutupan encounter (*LOCKED*), rilis tagihan lunas di Kasir, pelepasan bed.

---

## 👥 4. PENGENDALIAN BIAS OBSERVASI & PROTOKOL BERPIKIR NYARING (*HAWTHORNE EFFECT CONTROL*)

Untuk mencegah bias pengamatan di mana staf berusaha "terlihat kompeten" di depan pengamat (*Hawthorne Effect*), protokol interaksi dipisahkan secara ketat:

| Peran Tim Penguji | Tanggung Jawab Operasional | Larangan Keras (*Prohibited*) |
| :--- | :--- | :--- |
| **Fasilitator Sesi** | Memberikan pengantar skenario klinis & memandu alur pasien. | ❌ Dilarang berada tepat di samping layar saat staf mengetik. |
| **Silent Observer** | Mencatat waktu, klik, hesitation time, dan *near miss*. | ❌ Dilarang memberi petunjuk, menunjuk tombol, atau mengoreksi salah klik. |

### A. Protokol 3 Kamera Observasi Multi-Sudut (*3-Camera Rig*):
Jangan hanya merekam layar digital. Tiga sudut perekaman sinkron digunakan untuk mendeteksi friksi fisik dan psikologis:
* 📹 **KAMERA 1 (Screen Capture)**: Merekam pergerakan kursor, klik, form field, dan transisi layar.
* 📹 **KAMERA 2 (Hand/Hardware Capture)**: Merekam tangan staf saat berpindah antara keyboard shortcut, mouse, dan pemindai barcode bluetooth.
* 📹 **KAMERA 3 (Facial/Micro-Expression Capture)**: Merekam ekspresi wajah (mengernyit, menoleh bingung ke observer, helaan napas panjang) saat mengalami kebuntuan UX.

### B. Protokol Berpikir Nyaring (*Think-Aloud Protocol*):
Staf klinis diminta untuk secara verbal menyuarakan apa yang sedang mereka cari dan rasakan saat berinteraksi dengan layar:
* *"Saya mencari menu SOAP untuk memasukkan diagnosis..."*
* *"Saya kira tombol order lab ada di bagian bawah..."*
* *"Mengapa hasil lab darah harus membuka tab baru?"*
* *"Saya tidak mengerti maksud singkatan tombol ini..."*
* *Tujuan:* Menggali akar masalah mental model klinisi (*Cognitive Friction Root Cause*).

---

## 📝 5. FORMULIR OBSERVASI UAT, COGNITIVE FREEZE & REGISTRI NEAR-MISS

Setiap penguji (*Silent Observer*) mendampingi 1 pengguna staf rumah sakit dan mencatat parameter berikut:

| No | Parameter Evaluasi | Format Data | Standar Kelulusan |
| :-: | :--- | :---: | :--- |
| **1** | **Penyelesaian Tugas (Task Completion)** | `Ya` / `Tidak` | Wajib `Ya` (100%) |
| **2** | **Durasi Waktu Riil (Time-on-Task)** | Detik / Menit | Sesuai batas SLA per modul |
| **3** | **Waktu Ragu-Ragu (Hesitation Time)** | Detik | $\le 30\%$ dari total waktu tugas |
| **4** | **Cognitive Freeze Rate** | Detik Diam | Wajib $\le 5$ detik |
| **5** | **Jumlah Klik Riil (Click Count)** | Angka Riil | Maksimal 1.5x dari rute optimal |
| **6** | **Akurasi Klik Pertama (First-Click)** | `Benar` / `Salah` | Wajib $\ge 90\%$ benar |
| **7** | **Permintaan Bantuan (Asked for Help?)** | `Ya` / `Tidak` | `Tidak` (Sistem mandiri & intuitif) |
| **8** | **Salah Klik / Navigasi (Misclicks)** | Frekuensi | $\le 2$ kali per skenario |
| **9** | **Kejadian Nyaris Salah (Near Miss)** | `Ya` / `Tidak` | Catat jenis & apakah pulih mandiri |
| **10** | **Durasi Pemulihan Kesalahan (Recovery Time)** | Detik | Wajib $< 15$ detik |
| **11** | **Kemudahan Menemukan Tombol** | Skala 1 – 5 | Skor $\ge 4.0$ |
| **12** | **Kejelasan Istilah Klinis** | Skala 1 – 5 | Skor $\ge 4.0$ |
| **13** | **Skor Frustrasi / Beban Kognitif** | Skala 1 – 5 | Skor $\le 2.0$ (Beban rendah) |

### A. Taksonomi 5-Tingkat Kesalahan Klinis (*Clinical Error Taxonomy*):
Untuk menyatukan persepsi seluruh observer dan audit pasca-sesi, setiap kejadian diklasifikasikan secara ketat:
1. **Detected Error**: Kesalahan input yang disadari dan diperbaiki langsung oleh staf selama form masih aktif.
2. **Recovered Error**: Kesalahan yang sempat disubmit namun berhasil dibatalkan/direvisi melalui mekanisme resmi (void/revisi order) dalam batas SLA $< 15$ detik.
3. **Near Miss**: Kesalahan yang hampir terjadi (misal: kursor mengarah ke obat/pasien salah) namun staf menyadari dan membatalkan sebelum menekan submit.
4. **Silent Error**: Kesalahan input/keputusan yang lolos tanpa disadari oleh staf, observer, maupun sistem saat kejadian, dan baru terungkap melalui audit rekam medis pasca-sesi (*Post-Session Clinical Audit*).
5. **Harm Event**: Kesalahan yang lolos dan berpotensi/langsung mengakibatkan cedera pasien atau pelanggaran 5-Benar (P0/P1).

### B. Dekomposisi Akurasi Klik Pertama (*First-Click Learnability Tracking*):
Observer tidak hanya mencatat klik benar/salah, melainkan membedah akar penyebabnya:
$$\text{First Click Target} \longrightarrow \text{Reason for Misclick (UI Layout / Terminology / Cognitive Gap)} \longrightarrow \text{Correction Path} \longrightarrow \text{Final Task Success}$$

### C. Klasifikasi Waktu Henti Kognitif (*Cognitive Freeze Thresholds*):
Kondisi di mana staf berhenti total tanpa melakukan interaksi kursor/keyboard apa pun:
* **0 – 3 detik**: *Normal Processing* (Membaca data klinis biasa).
* **3 – 5 detik**: *Mild Hesitation* (Sedikit ragu namun dapat lanjut mandiri).
* **> 5 detik**: *Cognitive Freeze* (Terjadi kebingungan desain UI yang nyata).
* **> 10 detik**: *UX Dead End* (Staf tersesat di alur kerja).
* **> 15 detik**: *Observer Intervention Required* (Observer mencatat kegagalan navigasi).

### D. Registri Kejadian Nyaris Cedera (*Near-Miss Registry*):
Mencatat kesalahan yang hampir terjadi namun disadari dan dibatalkan oleh staf sebelum menekan tombol konfirmasi:
* **Near Miss Identitas**: Hampir memilih pasien yang salah pada daftar pencarian.
* **Near Miss Dosis/Obat**: Hampir memilih frekuensi yang keliru pada CPOE.
* **Near Miss Billing**: Hampir menutup invoice saat tindakan belum lengkap.
* *Metrik Pemulihan Kesalahan (Recovery Time SLA):*
  * Koreksi Salah Nomor RM: **$< 10$ detik**
  * Koreksi Salah Pilih DPJP: **$< 15$ detik**
  * Koreksi Salah Pilih Obat di CPOE: **$< 10$ detik**
  * Koreksi Salah Pilih Bangsal/Kamar: **$< 15$ detik**

---

## 🚨 6. MATRIKS KEPARAHAN TEMUAN & MANAJEMEN PERBAIKAN PASCA-PILOT

| Tingkat | Definisi & Dampak | Waktu Tindak Lanjut Perbaikan |
| :---: | :--- | :--- |
| **P0** | **Fatal / Patient Safety Hazard** | Perbaiki seketika (Immediate Halt) |
| **P1** | **Medication / High Clinical Hazard** | Perbaiki sebelum Limited Rollout |
| **P2** | **Workflow Blocker / Dead End** | Perbaiki sebelum Sprint 3L |
| **P3** | **Cognitive Friction / Ambiguous UI** | Masukkan ke UI Optimization Backlog |
| **P4** | **Cosmetic / Minor Polish** | Polish tampilan saat visual polish window |

*Catatan: Selama 2 hari pelaksanaan pilot, UI dibekukan total tanpa perbaikan di tengah jalan agar data perbandingan antar shift tetap valid secara ilmiah.*

Uji coba pilot lapangan **WAJIB DIHENTIKAN SEKETIKA (ABORT PILOT)** jika terjadi salah satu kondisi berikut:

$$\mathbf{P0 \ge 1} \quad \lor \quad \mathbf{P1 \ge 3} \quad \lor \quad \mathbf{Task\ Failure\ Rate \ge 20\%}$$

*Jika pilot dihentikan, seluruh temuan P0/P1 wajib diperbaiki dan diverifikasi ulang sebelum pengujian lapangan dapat dimulai kembali.*

---

## 📊 6. AMBANG BATAS KEBERHASILAN & MATRIKS PEMBANDING (BASELINE BEFORE VS AFTER)

### A. Matriks Pembanding Efisiensi (Legacy / Paper vs NurseFlow)
Keberhasilan pilot tidak hanya membuktikan sistem "berjalan", tetapi membuktikan sistem **"jauh lebih cepat, aman, dan efisien"**:

| Aktivitas Pelayanan Klinis | Sistem Lama / Manual | Target NurseFlow | Efisiensi Waktu |
| :--- | :---: | :---: | :---: |
| **Pendaftaran Pasien Baru** | 4 menit 20 detik | **1 menit 45 detik** | **-59%** |
| **Triase Gawat Darurat (IGD)** | 2 menit 00 detik | **0 menit 45 detik** | **-62%** |
| **SOAP & Order Dokter** | 6 menit 00 detik | **2 menit 20 detik** | **-61%** |
| **eMAR Bedside (5-Benar)** | 38 detik | **11 detik** | **-71%** |
| **Discharge & Billing Selesai** | 11 menit 00 detik | **4 menit 00 detik** | **-64%** |

### B. Ambang Batas Kelulusan Kuantitatif:
* **Registrasi Pasien**: $\ge 95\%$ berhasil ($< 2$ menit)
* **Triase IGD**: $\ge 95\%$ berhasil ($< 60$ detik)
* **SOAP Dokter**: $\ge 95\%$ berhasil ($< 3$ menit)
* **eMAR Bedside**: $\ge 99\%$ berhasil ($< 15$ detik)
* **Discharge & Billing**: $\ge 95\%$ berhasil ($< 5$ menit)
* **Tingkat Kepuasan Pengguna (CSAT)**: $\ge 4.0\ /\ 5.0$
* **Insiden Keselamatan Pasien (P0/P1)**: **0 Insiden**

---

## 🔍 7. 5 INSTRUMEN USABILITY LAPANGAN & 3 INDIKATOR HUMAN FACTORS

### A. 5 Instrumen Pengukuran Usability Klinis
1. **Hesitation Timer (Pengukur Keraguan/Kebingungan Staf)**:
   - Mengukur durasi staf berhenti dan terdiam mencari elemen aksi.
   - *Ambang Batas:* **Hesitation Time wajib $\le 30\%$ dari total waktu tugas**. (Contoh: SOAP 145 dtk $\rightarrow$ waktu ragu maksimal 43 dtk).
2. **First-Click Accuracy (Akurasi Klik Pertama)**:
   - Mengukur apakah tindakan klik pertama staf langsung mengarah ke alur yang benar.
   - *Target:* **$\ge 90\%$ akurasi klik pertama** pada seluruh peran.
3. **Menu Discovery Rate (Kecepatan Penemuan Fitur Kritis)**:
   - Target batas waktu pencarian menu:
     * Tambah Pasien Baru: **$< 3$ detik**
     * Triase 5-Level: **$< 5$ detik**
     * Form SOAP Dokter: **$< 5$ detik**
     * Order Laboratorium / Radiologi: **$< 5$ detik**
     * eMAR Bedside Scanner: **$< 3$ detik**
     * Discharge Summary: **$< 5$ detik**
4. **Keyboard vs Mouse Ratio (Efisiensi Power-User Klinis)**:
   - Mengukur utilisasi shortcut cepat keyboard vs mouse:
     * `Ctrl + K`: Pencarian instan EMPI
     * `Tab` / `Shift + Tab`: Navigasi kolom input
     * `Enter`: Konfirmasi / Submit draf
     * `Barcode Scanner`: Identifikasi instan pasien & obat
5. **Night Shift 02.00 – 04.00 AM Validation (Uji Jam Kritis Kelelahan Staf)**:
   - Pengujian wajib dilakukan pada rentang **02.00 – 04.00 WIB** di IGD saat staf mengalami kelelahan fisik dan beban kognitif puncak.

### B. 3 Indikator Human Factors Tambahan
1. **Adoption Rate Tracking**: Mengukur utilisasi mandiri fitur CDSS ($\ge 85\%$), eMAR ($100\%$), Barcode scan ($\ge 90\%$), Auto-Draft recovery ($\ge 80\%$).
2. **Workaround Detection**: Mendeteksi jalan pintas di luar sistem (catatan kertas saku, draft WA, hafalan RM, tab stacking).
3. **Silent Error Detection**: Mendeteksi transaksi yang sukses di UI namun salah secara klinis (salah DPJP, salah jadwal obat, tindakan tertinggal, resume belum ditandatangani).

---

## 🏆 8. HARD SAFETY GATES & MATRIKS KEANDALAN MANUSIA (*HUMAN RELIABILITY & SAFETY MATRIX*)

Evaluasi sistem klinis memisahkan secara tegas antara **Gerbang Keselamatan Mutlak (*Hard Safety Gates*)** yang tidak dapat ditawar dan **Indikator Kinerja Keandalan Manusia (*Human Reliability KPIs*)**:

### A. 3 Gerbang Keselamatan Mutlak (*Hard Safety Gates — Zero-Tolerance Barrier*):
Kegagalan pada salah satu gerbang ini seketika membatalkan status kelulusan pilot (*Automatic Rollout Abort*):

| No | Gerbang Keselamatan Mutlak | Ambang Batas Wajib | Definisi Operasional & Bukti Lapangan |
| :-: | :--- | :---: | :--- |
| **SG-1** | **P0 / P1 Safety Incidents** | **$0$ Insiden** | Zero insiden keselamatan pasien fatal, salah dosis, atau salah pasien. |
| **SG-2** | **Silent Error Rate** | **$0\%$** | $\frac{\text{Kesalahan Input Lolos Tanpa Terdeteksi Saat Kejadian}}{\text{Total Transaksi Klinis Pasca-Audit}} \times 100\% = 0$ |
| **SG-3** | **Clinical Data & Safety Integrity** | **$\ge 99.5\%$** | $\frac{\text{Passed Atomic Integrity Checks}}{\text{Total Executed Atomic Integrity Checks}} \times 100\%$ |

#### 🛡️ 9 Domain Atomic Integrity Checks (SG-3):
Denominator dihitung dari total *atomic checks* yang dieksekusi sepanjang alur kerja:
1. **Patient Identity**: NIK valid, No. RM cocok, EMPI match, Barcode match.
2. **Encounter Immutability**: Kunci status closed, anti-race condition update, hash valid.
3. **Medication Administration (eMAR)**: Pasien benar, Obat benar, Dosis benar, Rute benar, Waktu benar, Linkage eMAR benar.
4. **Allergy & CDSS Safeguard**: Deteksi alergi instan, blokir kontraindikasi 100%, override terjustifikasi audit.
5. **CPOE Order Completeness**: Parameter instruksi lengkap, frekuensi terdefinisi, rute tertera.
6. **Lab & Radiology Traceability**: ID spesimen cocok, nomor order tertaut, dokter perujuk valid.
7. **Chronological Timestamping**: Format waktu WIB ISO 8601, urutan waktu logis, zero clock drift.
8. **SBAR Handover Continuity**: Situasi, Latar Belakang, Asesmen, Rekomendasi terbaca utuh.
9. **Forensic Audit-Trail**: Catatan User ID, Role ID, Action ID tidak dapat dimanipulasi (*Append-Only*).

---

### B. 16 Indikator Keandalan Manusia & Usability Lapangan (*Human Reliability KPIs*):
Dihitung berbasis peluang eksekusi riil ($N = \sum \text{Assigned Scenario Executions}$ dari 9 Staf Naïve):

| No | Indikator Keandalan Manusia | Target Khusus | Rumus Denominator Eksak |
| :-: | :--- | :---: | :--- |
| **1** | **Task Completion Rate** | **$\ge 95\%$** | $\frac{\text{Eksekusi Skenario Selesai Tuntas}}{\text{Total Peluang Eksekusi Skenario (Assigned Executions)}} \times 100\%$ |
| **2** | **First-Click Accuracy** | **$\ge 90\%$** | $\frac{\text{Aksi Klik Pertama Tepat Sasaran}}{\text{Total Peluang Tindakan Awal (Initial Action Opportunities)}} \times 100\%$ |
| **3** | **Time to First Patient** | **$< 10$ menit** | Durasi mandiri sejak login pertama hingga membuka rekam medis kasus perdana. |
| **4** | **Training Independence Rate** | **$\ge 90\%$** | $\frac{\text{Tugas Selesai Tanpa Bertanya}}{\text{Total Seluruh Tugas Klinis}} \times 100\%$ |
| **5** | **Navigation Error Rate** | **$\le 5\%$** | $\frac{\text{Rute Navigasi / Menu Keliru}}{\text{Total Percabangan Menu yang Dikunjungi}} \times 100\%$ |
| **6** | **Chart Reopen Rate** | **$\le 3\%$** | $\frac{\text{Frekuensi Buka Ulang Rekam Medis yang Sama}}{\text{Total Rekam Medis yang Dibuka}} \times 100\%$ |
| **7** | **Help Request Rate** | **$\le 10\%$** | $\frac{\text{Permintaan Bantuan Staf ke Observer}}{\text{Total Peluang Eksekusi Skenario}} \times 100\%$ |
| **8** | **Hesitation Time Ratio** | **$\le 30\%$** | $\frac{\text{Total Durasi Ragu / Terdiam Mencari Tombol}}{\text{Total Waktu Penyelesaian Tugas (Time-on-Task)}} \times 100\%$ |
| **9** | **Cognitive Freeze Rate** | **$\le 5\%$** | $\frac{\text{Kejadian Henti Interaksi Total > 5 Detik}}{\text{Total Langkah Alur Kerja Klinis yang Dijalankan}} \times 100\%$ |
| **10** | **Interruption Recovery Rate** | **$\ge 95\%$** | $\frac{\text{Draf Form Utuh Tanpa Rusak Pasca Gangguan 3 Menit}}{\text{Total Pengujian Interupsi}} \times 100\%$ |
| **11** | **Shift Handover Success Rate** | **$\ge 95\%$** | $\frac{\text{Estafet Data Terbaca Akurat oleh Shift Berikutnya}}{\text{Total Sesi Handover Antar Shift}} \times 100\%$ |
| **12** | **Feature Adoption Rate** | **$\ge 85\%$** | $\frac{\text{Fitur Otomasi yang Digunakan Mandiri (CDSS/Barcode)}}{\text{Total Peluang Fitur yang Layak Digunakan (Eligible Opportunities)}} \times 100\%$ |
| **13** | **Workaround Rate** | **$\le 5\%$** | $\frac{\text{Kejadian Menggunakan Catatan Kertas / WA Manual}}{\text{Total Seluruh Tindakan Pelayanan}} \times 100\%$ |
| **14** | **Near Miss Rate** | **$< 2\%$** | $\frac{\text{Kejadian Nyaris Salah yang Dibatalkan Mandiri}}{\text{Total Peluang Tindakan Klinis (Action Opportunities)}} \times 100\%$ |
| **15** | **Error Recovery Time** | **$< 15$ detik** | Durasi rata-rata yang dibutuhkan untuk membatalkan/mengoreksi salah input mandiri. |
| **16** | **User Satisfaction (CSAT)** | **$\ge 4.0\ /\ 5.0$** | Rata-rata skor kuesioner kepuasan 9 staf klinis percontohan. |

---

## 🛑 9. 3 ATURAN EMAS UJI TERBANG LAPANGAN (*AVIATION-GRADE FLIGHT RULES*)

Untuk menjamin hasil pengujian bebas dari bias dan mencerminkan realitas operasional sesungguhnya:

1. **Aturan Emas #1: Wajib Peserta Tanpa Pengenalan Awal (*Zero-Familiarity Cohort*)**
   - ❌ **Dilarang keras:** Melibatkan developer, product owner, super user, staf yang pernah melihat demo, atau tim yang ikut menyusun SOP.
   - ✅ **Wajib:** Dokter, perawat, dan staf admisi murni yang belum pernah membuka NurseFlow sama sekali (*Naïve Clinicians*).
2. **Aturan Emas #2: Larangan Mutlak Mengoreksi Kesalahan (*Zero-Interference*)**
   - Observer dilarang memberi tahu letak tombol atau mengoreksi kesalahan alur.
   - *"Biarkan peserta mengalami kebingungan, karena kebingungan adalah data."*
3. **Aturan Emas #3: Rekam Semua Kesalahan Sekalipun Berhasil Diperbaiki (*Near-Miss Supremacy*)**
   - Status *Task = SUCCESS* tidak boleh menutupi kejadian di mana perawat hampir salah memilih pasien/obat dan baru menyadarinya di detik terakhir. Seluruh insiden nyaris salah wajib tercatat di *Near-Miss Registry*.

---

## 📊 10. KLASIFIKASI KEPUTUSAN HASIL PILOT (*NORMALIZED SCIENTIFIC OUTCOME MATRIX*)

Keputusan kelulusan dievaluasi berdasarkan kepatuhan mutlak terhadap Gerbang Keselamatan dan ambang batas masing-masing KPI:

| Status Kelulusan | Kriteria Evaluasi Saintifik Terstandar | Keputusan Komite Rekayasa Klinis |
| :---: | :--- | :--- |
| 🟢 **PASS** | **Hard Safety Gates 100% Terpenuhi:**<br>$\mathbf{(P0/P1 = 0) \land (Silent\ Error = 0) \land (Clinical\ Integrity \ge 99.5\%)}$<br>**DAN Seluruh 16 Human Reliability KPIs $\ge$ Ambang Batas Masing-Masing.** | Lulus Mutlak $\rightarrow$ Lanjut ke **Sprint 3L (Concurrent Load Testing)** |
| 🟡 **CONDITIONAL PASS** | **Hard Safety Gates 100% Terpenuhi:**<br>$\mathbf{(P0/P1 = 0) \land (Silent\ Error = 0) \land (Clinical\ Integrity \ge 99.5\%)}$<br>Namun terdapat 1–2 KPI Human Reliability yang sedikit di bawah ambang batas toleransi. | Lulus Bersyarat $\rightarrow$ **Batch Remediation** mikro terfokus sebelum rollout |
| 🔴 **FAIL** | **Pelanggaran Salah Satu Hard Safety Gate:**<br>$\mathbf{(P0/P1 \ge 1) \lor (Silent\ Error > 0) \lor (Clinical\ Integrity < 99.5\%) \lor (Task\ Completion < 80\%)}$ | **Hentikan Rollout $\rightarrow$ Desain Ulang Alur Kerja.** *(Kegagalan membuktikan pilot berhasil melindungi keselamatan pasien).* |

---

## 🎬 11. RANTAI BUKTI ARTEFAK PASCA-SESI (*ARTIFACT EVIDENCE PIPELINE*)

Di akhir setiap sesi pengujian, rantai bukti lengkap wajib dikumpulkan dan diarsipkan untuk audit medicolegal:

```text
SESI SELESAI
    ↓
📹 Screen Recording & 3-Camera Rig Footage (Sinkron)
    ↓
📋 Observer Log Sheet (Format Excel Kanonikal)
    ↓
🗣️ Think-Aloud Audio Transcript
    ↓
🗺️ Interaction Heat Map & Misclick Density
    ↓
⚠️ Near-Miss & Recovery Time Registry
    ↓
🎙️ Debriefing Interview Audio & Summary
    ↓
🚨 Severity Classification (P0 / P1 / P2 / P3 / P4)
    ↓
🛠️ Remediation Backlog (Triage Perbaikan Ergonomi)
```

---

## 📋 12. CHECKLIST PRA-PENERBANGAN HARI H-1 (*PRE-FLIGHT PILOT CHECKLIST*)

Sebelum hari pertama pilot dimulai, tim wajib menyelesaikan 5 item persiapan mutlak:
* [x] **OBSERVER LOG SHEET**: Formulir observasi cetak dan template input digital siap dibagikan ke seluruh observer.
* [x] **SCREEN RECORDER & 3-CAMERA RIG**: Perekam layar dan 3 kamera (layar, tangan, wajah) terpasang dan sinkron.
* [x] **10 SKENARIO PASIEN TERSTANDAR**: Data cohort 10 pasien ter-seed bersih ke dalam database sistem.
* [x] **9 STAF KLINIS NAÏVE**: Jadwal shift 9 staf klinis murni tanpa pelatihan awal terkonfirmasi.
* [x] **KRITERIA ABORT PILOT**: Seluruh observer dan fasilitator memahami aturan penghentian darurat ($P0 \ge 1 \lor P1 \ge 3 \lor Fail \ge 20\%$).

---

## 🎯 13. DEFINISI AKHIR KELULUSAN SPRINT 3K (*AVIATION-GRADE FLIGHT VALIDATION*)

```text
Dokter tidak mencari tombol.
Perawat tidak menggunakan kertas.
Apoteker tidak membuka WhatsApp.
Petugas admisi tidak bertanya.
Kasir tidak kehilangan transaksi.
Pasien tidak tertukar.
Dan tidak ada satu pun insiden keselamatan pasien.
```

---

## 🗺️ 14. ROADMAP STRATEGIS SPRINT (3K $\longrightarrow$ 3Q)

```text
Sprint 3K  →  Controlled Pilot Deployment (Inverted Emergency First & 9 Staf Klinis)
              ↓
Sprint 3L  →  Concurrent Load Testing (Stress Test Concurrency Skala Besar)
              ↓
Sprint 3M  →  Infrastructure Backup & Disaster Recovery Drill
              ↓
Sprint 3N  →  SATUSEHAT Official Sandbox Handshake & External Verification
              ↓
Sprint 3O  →  Limited Production Rollout (IGD / Unit Percontohan)
              ↓
Sprint 3P  →  Full Hospital Rollout (Seluruh Bangsal, Rawat Jalan, Casemix)
              ↓
Sprint 3Q  →  JCI & KARS Medicolegal Accreditation Audit
```

