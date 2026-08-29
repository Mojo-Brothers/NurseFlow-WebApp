# 🏥 AUDIT MASTER UI/UX & EVALUASI HEURISTIK KLINIS (UI/UX MASTER AUDIT 2026)
## NurseFlow Enterprise Hospital Information System 2026

**Dokumen Referensi:** Master Task — Clinical UX & Workflow Re-Engineering  
**Tanggal Rilis:** 26 Agustus 2026  
**Standar Evaluasi:** 10 Heuristik Usabilitas Nielsen-Molich + 5 Dimensi Khusus Sistem Informasi Kesehatan (EHR Usability Guidelines NIST IR 7804, AMIA Clinical Safety, JCI Patient Safety)  

---

## 📌 Executive Summary

Evaluasi komprehensif terhadap seluruh permukaan UI/UX NurseFlow menemukan bahwa meskipun arsitektur transaksi backend telah lulus gerbang validasi operasional yang dijalankan, **antarmuka pengguna masih mengandung defisit usabilitas dan pola visual heterogen** yang memerlukan transformasi arsitektur tingkat antarmuka.

### Ringkasan Kematangan & Taksonomi Metrik:
* **Tingkat Kematangan UX (UX Maturity):** `Level 2 (ESTIMATED — Inconsistent SaaS Pattern)`
* **Kematangan Alur Kerja Klinis (Workflow Maturity):** `Level 3 (ESTIMATED — Functional but Fragmented)`
* **Konsistensi Visual (Visual Consistency):** `58% (ESTIMATED — Ad-hoc vs Token Ratio)`
* **Usabilitas Klinis (Clinical Usability):** `62% (ESTIMATED — NIST IR 7804 Rubric)`
* **Waktu/Langkah Konsultasi Dokter:** `7-9 Clicks / 2 Context Switches (MEASURED via Scenario A)`
* **Status Validasi Defek (Pasca-Evidence Gate):**
  * **P0 — Patient Safety / Critical:** 1 Verified (`DEF-P0-03`), 2 Backend Protected / UX Gap (`DEF-P0-01`, `DEF-P0-04`), 1 False Positive (`DEF-P0-02`)
  * **P1 — Workflow Blocking:** 3 Verified, 2 Partially Verified, 2 Backend Protected / UX Gap, 1 False Positive
  * **P2 — Major UX & Cognitive Load:** 15 Masalah teridentifikasi

---

## 🔬 Evaluasi 15 Dimensi Heuristik Usabilitas Klinis

| Dimensi Heuristik | Skor (1–10) | Analisis Kondisi Saat Ini | Temuan Defek Kunci | Rekomendasi Perbaikan |
| :--- | :---: | :--- | :--- | :--- |
| **1. Visibility of System Status** | 6.5 | Indikator loading terkadang tidak muncul saat menyimpan SOAP; status sinkronisasi outbox kurang terlihat. | Status transaksi tidak terlihat saat koneksi jaringan lambat; pengguna bingung apakah data sudah tersimpan. | Tambahkan persistent status pill: *Tersimpan*, *Menyimpan...*, *Offline Outbox Pending*. |
| **2. Match between System & Real World** | 7.0 | Beberapa terminologi menggunakan istilah teknis IT (misal: *Encounter Payload*, *FHIR Resource*) alih-alih bahasa medis. | Form pendaftaran menggunakan label IT teknis; singkatan medis tidak standar di beberapa form. | Gunakan terminologi klinis baku Kemenkes/JCI (No. RM, DPJP, Rujukan, Asuhan Keperawatan, Resep CITO). |
| **3. User Control & Freedom** | 6.0 | Modal konfirmasi bertingkat sulit ditutup dengan tombol `Esc`; pembatalan tindakan membingungkan. | Modal bertumpuk (*stacked modals*) mengunci seluruh layar tanpa opsi kembali yang jelas. | Standarisasi modal drawer dengan tombol `Esc` dan konfirmasi simpan draft otomatis (*auto-save draft*). |
| **4. Consistency & Standards** | 5.5 | Komponen tombol, tabel, dan warna badge berbeda-beda antar modul (misal: tombol simpan di Lab berwarna ungu, di Triage berwarna hijau). | Terdapat 6 variasi komponen tombol dan 4 variasi komponen tabel di seluruh codebase. | Standarisasi 100% komponen UI ke dalam centralized design system (`src/design-system/`). |
| **5. Error Prevention** | 5.0 | Peringatan alergi obat dan kontraindikasi dosis belum memaksa konfirmasi eksplisit (*Hard-Stop Barrier*). | Dokter dapat menerbitkan obat yang berinteraksi berat tanpa memasukkan alasan klinis override. | Pasang CDSS Hard-Stop Alert Modal dengan kewajiban input alasan klinis (*Clinical Justification*). |
| **6. Recognition rather than Recall** | 6.0 | Saat menulis resep di CPOE, dokter tidak dapat melihat keluhan utama atau riwayat lab pasien sebelumnya. | Dokter harus mengingat hasil lab dari tab sebelumnya saat memilih jenis antibiotik. | Terapkan layout 3-Pane terintegrasi agar riwayat klinis pasien selalu berdampingan dengan keranjang order. |
| **7. Flexibility & Efficiency of Use** | 5.8 | Navigasi mouse-heavy; tenaga medis yang terbiasa mengetik cepat tidak dapat menggunakan keyboard shortcut. | Tidak ada pintasan keyboard untuk pencarian pasien, simpan SOAP, atau navigasi baris tabel lab. | Tambahkan Global Command Palette (`Ctrl+K`), Universal Patient Search (`Ctrl+P`), dan `Ctrl+S` untuk simpan. |
| **8. Aesthetic & Minimalist Design** | 6.2 | Terdapat ornamen visual dekoratif bergaya dashboard marketing (gradient berlebihan, whitespace terlalu lebar). | Tabel pasien di layar laptop 1366x768 hanya menampilkan 4 baris data karena padding kartu terlalu tebal. | Tingkatkan *Information Density* dengan typography yang padat, tinggi baris tabel 36px, dan eliminasi dekorasi sia-sia. |
| **9. Help Users Recognize & Recover from Errors** | 6.0 | Pesan error jaringan menampilkan stack trace mentah atau pesan generik *Request Failed*. | Pesan error database tidak menjelaskan tindakan korektif yang harus diambil oleh perawat/dokter. | Terapkan format pesan error ramah pengguna dengan tombol *Coba Lagi* (*Retry Action Button*). |
| **10. Help & Documentation** | 5.0 | Belum ada panduan konteks kerja atau tooltip singkat pada kode diagnosa ICD-10 dan nilai rujukan lab. | Tenaga medis baru kebingungan memahami arti singkatan kolom pada tabel ICU. | Tambahkan micro-tooltips pada seluruh header kolom dan indikator klinis penting. |
| **11. Patient Safety & Zero-Loss Context** | 6.0 | Ribbon konteks pasien melepaskan nama pasien saat berpindah ke modul master data atau administrasi. | Risiko salah memasukkan order pada pasien lain jika dokter membuka 2 tab peramban berbeda. | Kunci *ClinicalContextRibbon* sebagai komponen sacred global yang selalu memuat MRN, Nama, Alergi, dan NEWS2. |
| **12. Clinical Context Preservation** | 6.5 | Formulir SOAP terisolasi dari riwayat catatan CPPT dokter lain; dokter harus bolak-balik klik tombol riwayat. | Catatan dokter spesialis konsulen tidak terlihat langsung saat dokter utama menuliskan rencana terapi. | Satukan ringkasan kronologis CPPT multi-disiplin di sisi kiri editor SOAP aktif. |
| **13. Cognitive Load Optimization** | 5.5 | Terlalu banyak navigasi menu sidebar bertingkat 4 tingkat; waktu pencarian modul memakan waktu $> 10$ detik. | Perawat harus mengklik 4 kali untuk membuka lembar eMAR dari monitoring bangsal. | Terapkan *Contextual Quick-Jump Bar* dan *Care Workspace Auto-Resolver*. |
| **14. Workflow Continuity** | 5.8 | Alur triase IGD tidak langsung mengarahkan perawat ke antrean tindakan; alur kasir tidak langsung merilis ranjang. | Pengguna terhenti pada layar sukses tanpa petunjuk aksi berikutnya (*dead-end screen*). | Terapkan *Proactive Next Action Banner* di setiap akhir transaksi berhasil. |
| **15. Information Prioritization** | 6.0 | Informasi kritis (misal: Alergi Penisilin, ESI-1, NEWS2 = 9) memiliki bobot visual yang sama dengan nomor telepon pasien. | Dokter tidak langsung menyadari pasien memiliki alergi berat saat pertama kali membuka lembar konsultasi. | Berikan styling High-Alert dengan latar belakang merah kontras tinggi dan ikon peringatan berkedip lembut pada alergi aktif. |

---

## 🚨 Daftar Temuan Defek & Hasil Evidence Validation Gate

### 🔴 P0 — Patient Safety & Medicolegal Critical (Hasil Re-Audit Forensik)

1. **[DEF-P0-01] Alergi Obat Belum Memblokir Peresepan Secara Hard-Stop**
   - **Original Finding:** Pada modul CPOE, jika pasien memiliki alergi penisilin tercatat di rekam medis, dokter yang meresepkan Ampicillin hanya menerima toast peringatan kecil yang hilang dalam 3 detik tanpa memaksa konfirmasi klinis.
   - **Evidence Validation:** Backend PostgreSQL (`server/services/medicationClosedLoop.service.js`) telah menerapkan proteksi `ALLERGY_HARD_STOP` (422) secara authoritative. Namun di sisi UI (`DoctorSoapWorkspace.jsx` / `UniversalOrderModal.jsx`), ketiadaan in-situ clinical justification modal menyebabkan error hanya tampil sebagai toast generik tanpa antarmuka override resmi.
   - **Final Verdict:** **`BACKEND PROTECTED / UX GAP`**
   - **Confidence Level:** **`HIGH`**

2. **[DEF-P0-02] Ketiadaan Dual-Nurse Verification Hard-Stop pada eMAR Narkotika**
   - **Original Finding:** Administrasi obat high-alert (Fentanil/Morfin) di eMAR dapat dicatat oleh satu perawat saja tanpa meminta PIN/kredensial perawat saksi kedua.
   - **Evidence Validation:** Ditinjau langsung pada `src/modules/nursing/components/EmarAdministrationStudio.jsx` (lines 373-406 & lines 143-146). UI sudah memiliki field input Nama Perawat Saksi ke-2 dan PIN saksi dengan validasi mandatory blocking sebelum tombol aksi pemberian obat aktif.
   - **Final Verdict:** **`FALSE POSITIVE`** *(Already Implemented in eMAR Studio)*
   - **Confidence Level:** **`HIGH`**

3. **[DEF-P0-03] Potensi Hilangnya Konteks Pasien (Context Leakage) saat Navigasi Antar-Modul**
   - **Original Finding:** Ketika pengguna membuka pasien A di Doctor Workspace lalu beralih ke Orders Workspace via menu sidebar, filter encounter terkadang me-reset dan menampilkan seluruh order rumah sakit.
   - **Evidence Validation:** Terverifikasi pada `src/modules/orders/components/OrderEntryWorkspace.jsx` (lines 9-11 & lines 36-39) yang membaca `selectedPatient` dari `usePatientStore` dengan fallback default `patients[0]` dan hardcoded `activeEncounterId = 'ENC-2026-001'` alih-alih mengikat ke `useEncounterStore`.
   - **Final Verdict:** **`VERIFIED`**
   - **Confidence Level:** **`HIGH`**

4. **[DEF-P0-04] Nilai Kritis Laboratorium (Panic Value) Tidak Memicu Interupsi Visual di Layar Dokter**
   - **Original Finding:** Hasil lab dengan nilai kalium 7.2 mEq/L (ancaman henti jantung) hanya diberi label teks merah kecil di tabel lab tanpa memunculkan banner peringatan gawat darurat di lembar DPJP.
   - **Evidence Validation:** Backend LIS (`lisPacsEngine.service.js`) memancarkan event `EMERGENCY_PANIC` ke notification store, dan modul Lab memiliki `PanicValueEscalationModal.jsx` untuk TBAK Read-Back. Namun di UI aktif DPJP (`DoctorSoapWorkspace.jsx`), event ini belum memicu modal interupsi layar penuh otomatis saat konsultasi berlangsung.
   - **Final Verdict:** **`BACKEND PROTECTED / UX GAP`**
   - **Confidence Level:** **`HIGH`**

---

### 🟠 P1 — Workflow Blocking & Inefficiency (Hasil Re-Audit Forensik)

1. **[DEF-P1-01] Fragmentasi Layar SOAP Dokter & CPOE Orders**
   - **Original Finding:** Dokter harus menulis SOAP di satu halaman, berpindah ke halaman CPOE untuk pesan obat, lalu berpindah ke halaman Diagnosa untuk input ICD-10 (total 9 klik, 3 kali pindah halaman).
   - **Evidence Validation:** Terbukti melalui pengujian Skenario A: 7–9 klik/seleksi dan 2 context switches diperlukan untuk menyelesaikan konsultasi 1 pasien.
   - **Final Verdict:** **`VERIFIED`**
   - **Confidence Level:** **`HIGH`**

2. **[DEF-P1-02] Layar Triase IGD Terpotong di Resolusi Laptop Standar (1366x768)**
   - **Original Finding:** Tombol *Submit Triase* berada di bawah lipatan layar (*below the fold*), memaksa perawat scroll ke bawah pada situasi darurat.
   - **Evidence Validation:** Terbukti secara layout dimensi (Skenario B: tinggi total komponen ~770px-860px vs viewport 768px).
   - **Final Verdict:** **`VERIFIED`**
   - **Confidence Level:** **`HIGH`**

3. **[DEF-P1-03] Input Tanda Vital Tidak Otomatis Menghitung Skor NEWS2 & ESI**
   - **Original Finding:** Perawat harus menghitung skor NEWS2 secara manual sebelum memilih kategori triase.
   - **Evidence Validation:** Diperiksa pada `RapidTriageStudio.jsx` (lines 63-83); kalkulasi otomatis ESI dan deteksi vital berbahaya sudah berjalan otomatis via `triageEngineService.classifySeverity`.
   - **Final Verdict:** **`FALSE POSITIVE`** *(Already Implemented)*
   - **Confidence Level:** **`HIGH`**

4. **[DEF-P1-04] Pemisahan Viewer PACS dan Formulir Ekspertise Radiologi**
   - **Original Finding:** Dokter spesialis radiologi tidak dapat mengetik laporan ekspertise sambil melihat citra CT-Scan/X-Ray pada layar yang sama.
   - **Evidence Validation:** Terbukti pada `RadiologyWorkspacePage.jsx` yang memisahkan tab 'WORKLIST', 'REPORTING', dan 'VIEWER'.
   - **Final Verdict:** **`VERIFIED`**
   - **Confidence Level:** **`HIGH`**

5. **[DEF-P1-05] Ketiadaan Fast-Track Registrasi Pasien Darurat (Mr. X)**
   - **Original Finding:** Petugas pendaftaran IGD dipaksa mengisi field lengkap sebelum dapat menerbitkan nomor RM darurat.
   - **Evidence Validation:** Fungsi Mr. X sudah ada di `TriagePage.jsx` dan `RapidTriageStudio.jsx`, namun aksesibilitas tombol di layar registrasi pendaftaran utama perlu dipertegas.
   - **Final Verdict:** **`PARTIALLY VERIFIED`** *(Code Exists, Placement Sub-optimal)*
   - **Confidence Level:** **`HIGH`**

6. **[DEF-P1-06] Pemulangan Pasien Tidak Otomatis Merilis Ranjang ke Tim Housekeeping**
   - **Original Finding:** Kasir yang menyelesaikan pembayaran pasien pulang tidak otomatis memicu perubahan status ranjang menjadi *CLEANING*.
   - **Evidence Validation:** Backend `careStateEngine.service.js` memiliki logic pelepasan ranjang, namun di UI kasir (`BillingPage.jsx`), pelunasan invoice belum memicu transisi state encounter ke `DISCHARGED`.
   - **Final Verdict:** **`BACKEND PROTECTED / UX GAP`**
   - **Confidence Level:** **`HIGH`**

7. **[DEF-P1-07] Antrean Resep Farmasi Tidak Memisahkan Resep CITO vs Reguler**
   - **Original Finding:** Apoteker harus membaca baris per baris tabel untuk menemukan resep gawat darurat IGD.
   - **Evidence Validation:** Badge CITO ada, namun layout default antrean belum memecah tabel ke dalam split priority swimlanes.
   - **Final Verdict:** **`PARTIALLY VERIFIED`**
   - **Confidence Level:** **`HIGH`**

8. **[DEF-P1-08] WHO Surgical Checklist Tidak Terkunci Sebelum Penutupan Kasus Bedah**
   - **Original Finding:** Tim kamar bedah dapat menutup kunjungan operasi tanpa melengkapi verifikasi *Time Out*.
   - **Evidence Validation:** Validasi backend ada di `operatingTheatre.service.js`, namun UI belum memblokir tombol navigasi keluar jika Sign-Out belum lengkap.
   - **Final Verdict:** **`BACKEND PROTECTED / UX GAP`**
   - **Confidence Level:** **`HIGH`**

---

### 🟡 P2 — Major UX Deficit & High Cognitive Load (Summary)
1. **[DEF-P2-01]** Kepadatan informasi (*information density*) terlalu rendah pada tabel bangsal dan farmasi; terlalu banyak ruang kosong terbuang. (Verdict: `VERIFIED`)
2. **[DEF-P2-02]** Tidak ada filter pencarian cepat (*instant search filter*) pada tabel inventori obat multi-depo. (Verdict: `VERIFIED`)
3. **[DEF-P2-03]** Komponen pemilih tanggal (*date picker*) tidak mendukung input keyboard cepat. (Verdict: `VERIFIED`)
4. **[DEF-P2-04]** Modal bertingkat (*stacked modal*) pada histori encounter membingungkan navigasi pengguna. (Verdict: `VERIFIED`)
5. **[DEF-P2-05]** Status ranjang di peta bangsal (*Live Ward Map*) tidak menampilkan nama pasien dan nama DPJP saat kursor diarahkan (*hover*). (Verdict: `VERIFIED`)
6. **[DEF-P2-06]** Form pencarian ICD-10 tidak menampilkan deskripsi dalam Bahasa Indonesia dan sinonim medis umum. (Verdict: `PARTIALLY VERIFIED`)
7. **[DEF-P2-07]** Tampilan eMAR 24-jam tidak memiliki indikator garis waktu saat ini (*Now Line indicator*). (Verdict: `VERIFIED`)
8. **[DEF-P2-08]** Kurangnya visualisasi tren grafik tanda vital serial di lembar rekam medis dokter. (Verdict: `VERIFIED`)

---

## 🎯 Rekomendasi Transformasi UI/UX 2026

1. **Bangun Centralized Design System (`src/design-system/`)**:
   - Satukan token warna, tipografi Inter/Outfit, densitas tabel, dan komponen standar (Button, Input, Badge, Table, Modal, Drawer, Alert Banner).
2. **Redesign Application Shell & Sacred Clinical Context HUD**:
   - Jadikan *ClinicalContextRibbon* sebagai penunjuk identitas pasien permanen dengan alert alergi berlatar merah pekat, skor NEWS2 dinamis, dan navigasi 1-klik ke workspace relevan.
3. **Satukan Workspace Klinis Menjadi 3-Panel Integrated Studios**:
   - **Doctor Workspace**: Kiri (Riwayat & CPPT), Tengah (SOAP & ICD-10), Kanan (Universal CPOE & CDSS).
   - **Emergency Workspace**: Kiri (Daftar Antrean & Bed IGD), Tengah (Triase & Vitals), Kanan (Order CITO & Disposisi).
   - **Pharmacy Studio**: Kiri (Antrean Resep CITO/Reguler), Kanan (Telaah, FEFO Dispensing & Etiket).
   - **Radiology Studio**: Kiri (Viewer DICOMweb), Kanan (Editor Laporan Ekspertise).
4. **Hilangkan Seluruh Dead-End Screens & Kurangi Klik Secara Agresif**:
   - Setiap akhir aksi sukses harus menampilkan *Next Action Recommendation* (misal: Selesai SOAP $\rightarrow$ Langsung tampilkan tombol *Terbitkan Resep & Order Lab*).
