# 📖 BUKU PANDUAN PENGGUNA RESMI SISTEM (END-TO-END USER MANUAL)
## NurseFlow Enterprise Hospital Information System (HIS 2026)
### *Panduan Teknis Operasional Modul Terpadu: IGD, EMR, CPOE, LIS, PACS, Farmasi, eMAR, ADT & Casemix*

---

> **PANDUAN OPERASIONAL PRODUKSI**  
> **Versi Aplikasi:** NurseFlow Enterprise v2026.8.1  
> **Kepatuhan:** Permenkes No. 24/2022 (RME), Standar Akreditasi KARS 2024 & JCI 7th Edition

---

## 1. PANDUAN LOGIN, KEAMANAN & CLINICAL CONTEXT RIBBON

### 1.1 Masuk ke Sistem (Single Sign-On & RBAC)
1. Buka peramban web modern (Google Chrome / Microsoft Edge) pada alamat URL server HIS: `http://his.hospital.local` atau `http://localhost:5173`.
2. Masukkan **Nomor Induk Pegawai (NIP)** dan **Kata Sandi**.
3. Sistem secara otomatis mendeteksi unit kerja, shift dinas, dan peran pengguna (contoh: *Dokter DPJP, Perawat Triase, Farmasis*).
4. Verifikasi status kredensial SIP/STR aktif pada panel kiri bawah (*Badge Hijau: SIP/STR Verified*).

### 1.2 Navigasi Clinical Context Ribbon (Bilah Konteks Pasien Aktif)
Di bagian atas layar terdapat bilah pita konteks pasien aktif (*Live Clinical Ribbon*):
* **Identitas Pasien:** No. RM, Nama Lengkap, Usia, Jenis Kelamin.
* **Kategori Triase:** Badge warna (Merah ESI 1, Jingga ESI 2, Kuning ESI 3, Hijau ESI 4, Biru ESI 5).
* **Penjamin:** BPJS Kesehatan, Asuransi Swasta, atau Umum.
* **Banner Peringatan Alergi:** Kotak peringatan merah jika pasien memiliki riwayat alergi obat/makanan mayor.
* **Banner Nilai Kritis:** Lampu peringatan merah berkedip jika hasil lab masuk batas *Panic Value*.

---

## 2. MODUL GAWAT DARURAT (IGD & TRIASE KLINIS)

### 2.1 Peta Keterisian Tempat Tidur IGD (IGD Command Center)
1. Akses menu **`Gawat Darurat (IGD)`** ➔ **`Triase 5-Level (ATS/ESI)`**.
2. Layar menampilkan 9 tempat tidur IGD yang terbagi atas zona:
   * **Zona Resusitasi (Merah):** `RES-01`, `RES-02`.
   * **Zona Akut (Kuning/Jingga):** `A-01` s/d `A-04`.
   * **Zona Observasi / Fast Track (Hijau):** `OBS-01`, `OBS-02`.
   * **Zona Isolasi Infeksius:** `ISO-01`.
3. Klik tombol **`⚡ Rapid ESI Intake`** untuk memulai asesmen pasien baru.

### 2.2 Input Pasien Darurat Anonim (Mr. X)
1. Klik tombol merah **`+ Pasien Darurat (Mr. X)`**.
2. Sistem menerbitkan Nomor RM darurat instan (`MRX-YYYYMMDD-XXXX`).
3. Masukkan keluhan utama dan nilai tanda vital (TD, HR, RR, SpO2, Suhu, GCS).
4. Sistem menghitung klasifikasi ESI otomatis dan menyalakan stopwatch SLA KARS PMKP.
5. Klik **`Simpan Asesmen Triase & Mulai Stopwatch SLA`**.

---

## 3. MODUL REKAM MEDIS ELEKTRONIK & CPPT DOKTER (SOAP EMR)

### 3.1 Konsultasi CPPT Terintegrasi
1. Akses menu **`Pelayanan Klinis`** ➔ **`Doctor Workspace (SOAP)`**.
2. Pilih pasien dari daftar antrean dokter.
3. Buka tab **`Konsultasi CPPT / SOAP`**.
4. Isi 4 pilar rekam medis:
   * **S (Subjective):** Anamnesis keluhan utama, riwayat penyakit sekarang, riwayat alergi.
   * **O (Objective):** Pemeriksaan fisik per organ dan tanda vital terverifikasi.
   * **A (Assessment):** Pilih diagnosis utama dan sekunder berbasis **ICD-10**.
   * **P (Plan):** Rencana terapi, instruksi diet, monitoring, dan CPOE penunjang.
5. Klik **`Simpan & Tanda Tangani Elektronik (BSrE Ready)`**.

---

## 4. MODUL ORDER ELEKTRONIK TERPADU (CPOE LIS & PACS)

### 4.1 Order Laboratorium Patologi Klinik
1. Pada lembar konsultasi dokter atau modul CPOE, klik **`+ Terbitkan Order Klinis`**.
2. Centang panel pemeriksaan: Darah Lengkap, GDS, Elektrolit, Faal Hemostasis, Troponin.
3. Tetapkan prioritas: `CITO / STAT` atau `RUTIN`.
4. Analis laboratorium menerima order di workstation LIS, mencetak barcode vacutainer, memproses sampel, dan menginput hasil.
5. Nilai kritis (*Panic Value*) wajib dilaporkan via telepon dalam $\le 15$ menit dengan verifikasi TBaK.

### 4.2 Order Radiologi & Web PACS DICOM Viewer
1. Pilih pemeriksaan: `CT Scan Kepala Non-Kontras CITO`.
2. Radiografer melakukan pemindaian pada mesin CT/CR/DR.
3. Citra DICOM otomatis terkirim ke server PACS.
4. Dokter DPJP dapat membuka tab **`DICOM Viewer`** pada workstation untuk melakukan:
   * *Windowing Leveling:* Brain Window (WL:40, WW:80), Bone Window (WL:400, WW:2000).
   * *Zoom, Panning, Invert, dan ROI Measure.*
5. Dokter Spesialis Radiologi mengetik ekspertise dan merilis hasil secara digital.

---

## 5. MODUL SIKLUS FARMASI & ADMINISTRASI OBAT eMAR

### 5.1 Telaah Resep 7-Prinsip & Dispensing FEFO
1. Apoteker membuka menu **`Farmasi Enterprise`** ➔ **`Multi-Depot FEFO & Telaah Resep`**.
2. Sistem CDSS menyaring interaksi obat dan riwayat alergi secara otomatis.
3. Apoteker memvalidasi **7-Prinsip Telaah Resep** (Tepat Pasien, Obat, Dosis, Rute, Waktu, Dokumentasi, Indikasi).
4. Sistem memotong stok dari lot batch kedaluwarsa terdekat (**FEFO**).
5. Apoteker mencetak label etiket obat ber-barcode 2D unik.

### 5.2 Administrasi eMAR oleh Perawat Pelaksana
1. Perawat membuka menu **`Pelayanan Klinis`** ➔ **`Nursing Workspace & eMAR`**.
2. Pilih tab **`eMAR (5-Benar Obat)`**.
3. Klik tombol **`Berikan Obat`** pada jadwal obat terkait.
4. Pindai barcode gelang pasien $\rightarrow$ Pindai barcode etiket obat.
5. Pada obat *High-Alert* (Insulin, Heparin, KCl pekat), masukkan **2 PIN Perawat (Dual-Check)**.
6. Status obat otomatis berubah menjadi **`GIVEN`** dan tersinkronisasi ke rekam medis.

---

## 6. MODUL ADT, SPRI & TRANSFER RAWAT INAP (SBAR HANDOVER)

### 6.1 Penerbitan SPRI & Alokasi Bed Bangsal
1. Dokter DPJP menerbitkan **Surat Perintah Rawat Inap (SPRI)** melalui Doctor Workspace.
2. Petugas Admisi / Perawat membuka modul **`Bed Management & ADT Center`**.
3. Pilih bangsal tujuan (contoh: *Bangsal Mawar Kamar 301-B*).
4. Klik **`Tempatkan Pasien (Allocate Bed)`** untuk mengunci tempat tidur.

### 6.2 Pengisian Lembar Transfer SBAR
1. Perawat IGD mengisi formulir serah terima transfer internal digital:
   * **S (Situation):** Identitas, DPJP, diagnosis kerja, keluhan terkini.
   * **B (Background):** Riwayat penyakit, riwayat alergi, tindakan yang sudah dilakukan di IGD.
   * **A (Assessment):** TTV terkini, GCS, skor risiko jatuh Morse, alat invasif terpasang.
   * **R (Recommendation):** Rencana terapi bangsal, jadwal obat berikutnya, edukasi keluarga.
2. Perawat IGD dan Perawat Bangsal menandatangani formulir transfer digital.
3. Status Encounter pasien resmi bertransisi dari **`EMERGENCY`** menjadi **`INPATIENT`**.
