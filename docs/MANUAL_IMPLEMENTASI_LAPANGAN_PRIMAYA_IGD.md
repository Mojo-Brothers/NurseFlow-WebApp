# 🏥 MANUAL IMPLEMENTASI LAPANGAN & UJI COBA 100 PASIEN IGD
## PRIMAYA HOSPITAL BEKASI BARAT — NURSEFLOW ENTERPRISE HIS 2026

**Clinical Commander:** Direktur Medis, Kepala Ruangan IGD & Bos Robby  
**Lokasi Fisik:** Nurse Station IGD, Ruang Triase, Ruang Resusitasi & Ruang Tindakan  
**Durasi Uji:** 8 Jam Shift Penuh (08.00–16.00 / 14.00–22.00 WIB)  
**Target Validasi:** 100 Pasien Nyata Tanpa Kesalahan Medis & Tanpa Hambatan Alur Kerja

---

## 1. URUTAN TAHAP DEPLOYMENT MODULAR RUMAH SAKIT

NurseFlow TIDAK BOLEH di-deploy secara *Big-Bang*. Rollout mengikuti urutan prioritas klinis bertahap:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   URUTAN IMPLEMENTASI MODULAR BERTAHAP (PHASED ROLLOUT)                │
└────────────────────────────────────────────────────────────────────────────────────────┘
  1. 🚨 INSTALASI GAWAT DARURAT (IGD)  ──► Titik Krusial Pasien Masuk, Triase & CITO
  2. 🫀 INTENSIVE CARE UNIT (ICU)      ──► Pasien Kritis, Ventilator, Inotropik
  3. 🛏️ RAWAT INAP (WARD MONITOR)      ──► CPPT Terintegrasi, Handover SBAR, eMAR
  4. 🧪 LABORATORIUM (LIS)             ──► Specimen Tracking, Analyzer, Panic Values
  5. ☢️ RADIOLOGI (PACS DICOM)         ──► Worklist CITO, PACS Viewer, Expertise
  6. 💊 FARMASI (DISPENSING & FEFO)    ──► E-Resep, Telaah 7 Rights, Stok Depo
  7. 👨‍⚕️ RAWAT JALAN (POLIKLINIK)       ──► Antrean Terpadu, Rekam Medis Rawat Jalan
  8. 🔪 KAMAR BEDAH (OPERATING THEATRE)──► WHO Surgical Safety Checklist, Anestesi
  9. 🏛️ SELURUH RUMAH SAKIT            ──► Integrasi Finansial, BPJS VClaim, SATUSEHAT
```

---

## 2. STRUKTUR WAR ROOM IMPLEMENTASI LAPANGAN (ON-SITE TEAM)

```text
WAR ROOM COMMAND CENTER (NURSE STATION IGD)
├── 5 PERAWAT IGD        : Input Triase, Vital Signs Bedside, eMAR Injeksi
├── 3 DOKTER (Sp./Umum)  : Input SOAP CPPT Cepat, Diagnosis ICD-10, CPOE Order
├── 2 APOTEKER           : Verifikasi Resep STAT, Telaah 7 Rights, Dispensing
├── 2 KASIR BILLING      : Cetak Rincian Billing, Verifikasi BPJS vs Umum
├── 2 PETUGAS ADMISI     : Pendaftaran Pasien, EMPI NIK Search, Cetak Gelang
├── 2 OBSERVER LAPANGAN  : Mencatat Stopwatch Durasi, Misclicks & Kebingungan
└── 1 SYSTEM ARCHITECT   : Bos Robby (Live UI Tweak, Bugfix Instan & Monitoring DB)
```

---

## 3. LOG MASALAH & ANOMALI LAPANGAN 100 PASIEN (TEMPLATE SPREADSHEET)

Setiap keraguan atau hambatan nakes wajib langsung dicatat untuk perbaikan UI seketika:

| No | Gejala / Hambatan Nakes | Modul Terdampak | Dampak Klinis | Tindakan Perbaikan Langsung |
|:---:|---|---|---|---|
| **1** | Field Tensi Darah (TD) terlalu kecil di layar tablet | Triase ESI | Perawat butuh 2x klik | Perbesar font & input box 1.5x |
| **2** | ICD-10 terlalu lama dicari saat dokter ketik "Stroke" | SOAP Dokter | Dokter kehilangan 15 detik | Pasang *Instant Fuse.js Autocomplete* |
| **3** | Rincian selisih naik kelas BPJS tidak otomatis muncul | Kasir Billing | Kasir hitung manual kalkulator | Tampilkan selisih plafon INA-CBG riil |
| **4** | Urutan vital signs beda dengan monitor Philips bedside | Monitoring | Perawat bingung urutan entri | Samakan: TD $\rightarrow$ Nadi $\rightarrow$ RR $\rightarrow$ SpO2 $\rightarrow$ Suhu |
| **5** | Tombol Simpan eMAR tertutup keyboard virtual tablet | Farmasi / eMAR | Perawat harus scroll manual | Pasang *Auto-Scroll on Focus* |

---

## 4. SIMULASI BEBAN PUNCAK IGD (JAM SIBUK 19.00 WIB)

Sistem harus siap menghadapi lonjakan **16 pasien dalam 20 menit**:
- **4 Pasien Trauma Kecelakaan Lalu Lintas** $\rightarrow$ Fast-Track ATLS (FAST USG + Darah BDRS).
- **2 Pasien Serangan Jantung STEMI** $\rightarrow$ Door-to-ECG $< 10$ menit $\rightarrow$ Aktivasi Cathlab.
- **1 Pasien Stroke Akut (Code Stroke)** $\rightarrow$ CT Non-Kontras $< 20$ menit $\rightarrow$ r-tPA Alteplase.
- **8 Pasien Demam & Infeksi Akut** $\rightarrow$ Triase Hijau/Kuning $\rightarrow$ E-Resep Parasetamol/Antibiotik.
- **1 Pasien Anak Kejang Demam** $\rightarrow$ Resusitasi CITO Diazepam Rektal / IV.

**Target Sistem:** Zero Latency Spike ($p_{95} \le 185\text{ms}$), Zero Database Lock, Zero Panic Interface.

---

## 5. SKOR AKHIR KESIAPAN OPERASIONAL

* **Arsitektur Perangkat Lunak:** **98 / 100** (Ready).
* **Infrastruktur & HA Failover:** **98 / 100** (Ready).
* **Keamanan & Standar SATUSEHAT:** **95 / 100** (Ready).
* **Validasi Lapangan Nakes Asli:** **Menunggu Hasil Uji 100 Pasien IGD Primaya Hospital**.

*Manual ini resmi menjadi panduan kerja hidup bagi Bos Robby dan tim klinis di lapangan.*
