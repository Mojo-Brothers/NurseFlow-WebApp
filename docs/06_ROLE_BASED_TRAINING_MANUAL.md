# 🎓 BUKU PANDUAN PELATIHAN BERDASARKAN PERAN (ROLE-BASED TRAINING MANUAL)
## NurseFlow Enterprise Hospital Information System (HIS 2026)
### *Kurikulum Pelatihan Staf Klinis & Non-Klinis: 8 Peran Utama Rumah Sakit Sesuai Standar JCI & KARS*

---

> **DOKUMEN RESMI KURIKULUM TRAINING & UAT RUMAH SAKIT**  
> **Target Audiens:** Perawat Triase, Petugas Admisi/HIM, Perawat IGD, Dokter DPJP, Analis Lab, Radiografer, Apoteker, Perawat Rawat Inap  
> **Standar Akreditasi:** KARS 2024 (Bab KPS & PMKP), JCI 7th Edition (SQE - Staff Qualifications and Education)

---

# 📚 MODUL 1: PERAWAT TRIASE (TRIAGE NURSE TRAINING)

## 1.1 Profil Kompetensi & Kewenangan Klinis
* **Tujuan Pelatihan:** Menguasai identifikasi pasien gawat darurat dalam $< 2\text{ menit}$, pengoperasian algoritma ESI v4 otomatis, dan pembuatan rekam medis pasien darurat anonim (*Unknown Patient Ingestion*).
* **Hak Akses Sistem:** `TRIAGE_READ_WRITE`, `EMERGENCY_INGESTION`, `BED_IGD_UPDATE`.
* **Standar Mutu Terkait:** KARS SKP 1 (Identifikasi Pasien), JCI COP 3 (Care of High-Risk Patients), ESI v4 Guidelines.

## 1.2 Prosedur Operasional Standar (SOP) Langkah Demi Langkah
1. **Langkah 1 (Buka Layar Triase):** Klik menu `Gawat Darurat (IGD)` ➔ `Triase 5-Level (ATS/ESI)`.
2. **Langkah 2 (Pasien Darurat Anonim):** Jika pasien tanpa identitas, klik tombol merah `+ Pasien Darurat (Mr. X)`.
3. **Langkah 3 (Input ABCDE):** Pilih status Airway, Breathing, Circulation, dan masukkan nilai GCS (Eye, Verbal, Motor).
4. **Langkah 4 (Input TTV):** Masukkan TD, HR, RR, Suhu, SpO2, dan Skala Nyeri.
5. **Langkah 5 (Verifikasi ESI & Stopwatch):** Periksa kategori ESI terhitung (ESI 1 s/d ESI 5). Klik `Simpan Asesmen Triase & Mulai Stopwatch SLA`.
6. **Langkah 6 (Pasang Gelang Identitas):** Ambil gelang hasil cetak barcode dan pasang di pergelangan tangan pasien.

## 1.3 Checklist Evaluasi Kelulusan Pelatihan
- [ ] Mampu menerbitkan nomor RM darurat `MRX-...` dalam waktu $< 5$ detik.
- [ ] Memahami 4 pertanyaan keputusan algoritma ESI v4.
- [ ] Mampu memasang gelang identitas putih dan gelang risiko jatuh kuning sebelum memindahkan pasien ke zona akut/resusitasi.

---

# 📚 MODUL 2: PETUGAS ADMISI & HIM (REGISTRATION & EMPI SPECIALIST)

## 2.1 Profil Kompetensi & Kewenangan Klinis
* **Tujuan Pelatihan:** Menguasai pencarian NIK pada Enterprise Master Patient Index (EMPI), bridging BPJS V-Claim 2.0, dan penggabungan legal rekam medis darurat (*EMPI Identity Merge Guard*).
* **Hak Akses Sistem:** `PATIENT_REGISTRATION`, `EMPI_MERGE_EXECUTE`, `BPJS_VCLAIM_READ_WRITE`.
* **Standar Mutu Terkait:** JCI IPSG 1, Permenkes No. 24/2022 Pasal 12 (Satu Pasien Satu Nomor RM).

## 2.2 Prosedur Operasional Standar (SOP) Langkah Demi Langkah
1. **Langkah 1 (Klaim Pasien Darurat):** Buka menu `Pasien & EMPI` ➔ `Antrean Registrasi / Front Office`.
2. **Langkah 2 (Pencarian NIK EMPI):** Saat keluarga menyerahkan e-KTP, masukkan NIK 16 digit pada kolom pencarian EMPI.
3. **Langkah 3 (Registrasi Pasien Master):** Jika pasien baru, isi biodata lengkap dan nomor BPJS Kesehatan. Klik `Daftarkan Pasien Master`.
4. **Langkah 4 (Eksekusi EMPI Merge):** Buka formulir `EMPI Duplicate & Identity Merge Guard`. Tetapkan Primary Record (`MRN-...`) dan Secondary Record (`MRX-...`).
5. **Langkah 5 (Verifikasi & Merge):** Masukkan alasan penggabungan rekam medis dan klik `Execute Legal Merge`.

---

# 📚 MODUL 3: PERAWAT IGD (EMERGENCY NURSE TRAINING)

## 3.1 Profil Kompetensi & Kewenangan Klinis
* **Tujuan Pelatihan:** Menguasai asesmen keperawatan gawat darurat, pengkajian risiko jatuh Morse, manajemen pencegahan infeksi, dan serah terima transfer intra-rumah sakit.
* **Hak Akses Sistem:** `NURSING_ASSESSMENT_RW`, `EMAR_ADMINISTRATION`, `SBAR_HANDOVER_RW`.
* **Standar Mutu Terkait:** KARS SKP 6 (Pengurangan Risiko Pasien Jatuh), JCI IPSG 6.

## 3.2 Prosedur Operasional Standar (SOP)
1. **Langkah 1 (Asesmen Keperawatan):** Buka menu `Pelayanan Klinis` ➔ `Nursing Workspace & eMAR`.
2. **Langkah 2 (Skrining Morse Fall Scale):** Isi 6 parameter Morse. Jika skor $\ge 45$, pasang tanda risiko jatuh kuning di atas bed.
3. **Langkah 3 (Dokumentasi Alergi):** Masukkan riwayat alergi obat dan pasang gelang alergi warna merah.
4. **Langkah 4 (Pelaksanaan CPOE):** Ambil sampel laboratorium, tempelkan barcode LIS, dan dampingi pasien saat pemeriksaan CT-Scan.

---

# 📚 MODUL 4: DOKTER JAGA IGD & DPJP (PHYSICIAN & CONSULTANT TRAINING)

## 4.1 Profil Kompetensi & Kewenangan Klinis
* **Tujuan Pelatihan:** Menguasai pengisian CPPT SOAP terintegrasi, standarisasi diagnosis ICD-10, penerbitan CPOE terpadu, penandatanganan elektronik BSrE, dan penerbitan SPRI rawat inap.
* **Hak Akses Sistem:** `CLINICAL_CORE_RW`, `CPOE_ORDER_AUTHORITY`, `SPRI_ADMISSION_ISSUE`, `DIGITAL_SIGNATURE`.
* **Standar Mutu Terkait:** JCI COP 2.1, Permenkes No. 24/2022 (Tanda Tangan Elektronik Tersertifikasi).

## 4.2 Prosedur Operasional Standar (SOP)
1. **Langkah 1 (Buka SOAP Pasien):** Akses `Pelayanan Klinis` ➔ `Doctor Workspace (SOAP)` ➔ Klik `Buka Konsultasi (SOAP)`.
2. **Langkah 2 (Input SOAP):** Isi Subjective, periksa Objective (TTV tersinkron otomatis), tentukan kode ICD-10 pada kolom Assessment, dan masukkan instruksi Plan.
3. **Langkah 3 (Penerbitan CPOE):** Klik `+ Terbitkan Order Klinis` untuk memesan pemeriksaan Lab Cito, CT-Scan Kepala Cito, dan Resep Farmasi.
4. **Langkah 4 (Tanda Tangan Digital):** Klik `Simpan & Tanda Tangani Elektronik (BSrE Ready)`.
5. **Langkah 5 (Penerbitan SPRI):** Jika pasien perlu mondok, klik `Terbitkan SPRI / Admission Order` dan pilih bangsal rawat inap.

---

# 📚 MODUL 5: ANALIS LABORATORIUM KLINIS (LIS TECHNICIAN TRAINING)

## 5.1 Profil Kompetensi & Kewenangan Klinis
* **Tujuan Pelatihan:** Menguasai accessioning spesimen, pelabelan barcode vacutainer, validasi hasil analitikal, dan pelaporan nilai kritis (*Panic Value Alert*) $\le 15\text{ menit}$.
* **Hak Akses Sistem:** `LAB_LIS_RW`, `CRITICAL_VALUE_REPORT`, `SPECIMEN_TRACKING`.
* **Standar Mutu Terkait:** JCI IPSG 2 (Komunikasi Efektif), ISO 15189.

## 5.2 Prosedur Operasional Standar (SOP)
1. **Langkah 1 (Penerimaan Order):** Buka menu `Layanan Diagnostik` ➔ `Laboratorium (LIS)`.
2. **Langkah 2 (Accessioning & Barcoding):** Scan barcode tabung atau klik `Cetak Barcode Spesimen`.
3. **Langkah 3 (Entri Hasil Auto-Analyzer):** Masukkan nilai kuantitatif parameter darah pada tab `Workstation Analitikal`.
4. **Langkah 4 (Pelaporan Nilai Kritis):** Jika ada hasil kritis, segera telepon perawat ruangan dalam $\le 15$ menit, lakukan konfirmasi TBaK, dan catat nama penerima di sistem.
5. **Langkah 5 (Validasi Sp.PK):** Klik `Validasi & Rilis Hasil ke EMR`.

---

# 📚 MODUL 6: RADIOGRAFER & SPESIALIS RADIOLOGI (PACS / RIS TRAINING)

## 6.1 Profil Kompetensi & Kewenangan Klinis
* **Tujuan Pelatihan:** Menguasai Modality Worklist (MWL), penerimaan citra DICOM STOW-RS, manipulasi citra Web PACS Viewer, dan rilis ekspertise radiologi.
* **Hak Akses Sistem:** `PACS_RIS_RW`, `DICOM_VIEWER_FULL`, `RADIOLOGY_EXPERTISE_RELEASE`.
* **Standar Mutu Terkait:** JCI AOP 5 (Radiology and Diagnostic Imaging Services).

## 6.2 Prosedur Operasional Standar (SOP)
1. **Langkah 1 (Cek Antrean MWL):** Buka menu `Layanan Diagnostik` ➔ `PACS & DICOM Web Viewer`.
2. **Langkah 2 (Eksekusi Pemindaian):** Jalankan pemeriksaan CT-Scan pada mesin scanner; kirim citra via jaringan PACS.
3. **Langkah 3 (Evaluasi Citra):** Buka tab `DICOM Viewer`, sesuaikan Windowing (*Brain Window* WL:40, WW:80), periksa tanda iskemia/perdarahan.
4. **Langkah 4 (Ekspertise Sp.Rad):** Buka tab `Ekspertise Sp.Rad`, ketik temuan dan kesimpulan klinis, lalu klik `Validasi & Rilis Hasil ke EMR`.

---

# 📚 MODUL 7: APOTEKER KLINIS (CLINICAL PHARMACY TRAINING)

## 7.1 Profil Kompetensi & Kewenangan Klinis
* **Tujuan Pelatihan:** Menguasai telaah resep 7-prinsip Permenkes No. 73/2016, deteksi interaksi obat CDSS, dispensing multi-depot FEFO, dan pengawasan obat *High-Alert*.
* **Hak Akses Sistem:** `PHARMACY_DISPENSING_RW`, `FEFO_INVENTORY_CONTROL`, `CDSS_OVERRIDE`.
* **Standar Mutu Terkait:** JCI MMU (Medication Management and Use), KARS PKPO.

## 7.2 Prosedur Operasional Standar (SOP)
1. **Langkah 1 (Buka Antrean Resep):** Buka `Farmasi Enterprise` ➔ `Multi-Depot FEFO & Telaah Resep`.
2. **Langkah 2 (Telaah Resep):** Klik tab `Telaah & Dispensing`. Evaluasi alert CDSS dan centang kotak 7-Prinsip Telaah Resep.
3. **Langkah 3 (Dispensing FEFO):** Pilih lot batch kedaluwarsa terdekat yang disarankan sistem.
4. **Langkah 4 (Cetak Etiket Barcode):** Cetak label barcode 2D untuk setiap unit obat dan kemas dalam plastik transparan.
5. **Langkah 5 (Verifikasi Akhir):** Klik `Verifikasi Resep & Potong Stok FEFO` dan serahkan obat ke perawat.

---

# 📚 MODUL 8: PERAWAT PELAKSANA RAWAT INAP (WARD NURSE TRAINING)

## 8.1 Profil Kompetensi & Kewenangan Klinis
* **Tujuan Pelatihan:** Menguasai penerimaan transfer pasien SBAR, administrasi obat eMAR berbasis barcode (5-Benar), protokol verifikasi ganda *High-Alert*, dan transisi encounter rawat inap.
* **Hak Akses Sistem:** `WARD_CARE_RW`, `EMAR_ADMINISTRATION`, `BED_STATUS_UPDATE`, `SBAR_HANDOVER_RW`.
* **Standar Mutu Terkait:** JCI IPSG 2 (Handover SBAR), JCI IPSG 3 (High-Alert Medications).

## 8.2 Prosedur Operasional Standar (SOP)
1. **Langkah 1 (Penerimaan Pasien & SBAR):** Buka menu `Pelayanan Klinis` ➔ `Nursing Workspace & eMAR`.
2. **Langkah 2 (Konfirmasi SBAR):** Evaluasi lembar transfer SBAR dari IGD, periksa kondisi klinis pasien di kamar rawat inap (`Bed Mawar 301-B`), dan tandatangani secara digital.
3. **Langkah 3 (Jadwal eMAR):** Buka tab `eMAR (5-Benar Obat)` untuk melihat jadwal dosis obat harian.
4. **Langkah 4 (Pemberian Obat Barcode Scan):** Klik `Berikan Obat` ➔ Pindai gelang pasien ➔ Pindai obat.
5. **Langkah 5 (Dual Sign-Off High-Alert):** Jika obat bertanda *High-Alert*, minta perawat kedua memasukkan PIN saksi sebelum menyuntikkan obat.
