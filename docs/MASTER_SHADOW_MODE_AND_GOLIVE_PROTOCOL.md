# 🏥 PROTOKOL OPERASIONAL GO-LIVE & SHADOW MODE TRIAL (7 HARI)
## NURSEFLOW ENTERPRISE HOSPITAL INFORMATION SYSTEM (HIS 2026)

**Lokasi Uji Lapangan:** Primaya Hospital Bekasi Barat (IGD, Rawat Inap, ICU, Farmasi, Laboratorium, Radiologi, Kasir)  
**Standar Pelaksanaan:** JCI Quality Improvement and Patient Safety (QPS), ISO 27001 ISMS, Permenkes No. 24/2022

---

## 1. STRATEGI PELAKSANAAN: SHADOW MODE DEPLOYMENT (7 HARI RUN)

Untuk menjamin **100% Patient Safety** dan **Zero Hospital Disruption**, implementasi NurseFlow tidak dilakukan secara gegabah (*No Big-Bang*), melainkan melalui **Mode Bayangan (Shadow Mode)** selama 7 hari:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PRIMAYA HOSPITAL BEKASI BARAT — SHADOW RUN                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
                    PASIEN MASUK IGD (20-50 PASIEN/SHIFT)
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
      SIMRS LAMA (PRODUKSI)                           NURSEFLOW HIS (SHADOW)
      (Apotek, Kasir, SEP Aktif)                     (Paralel Dual-Entry Nakes)
             │                                               │
             └───────────────────────┬───────────────────────┘
                                     │
                                     ▼
                     AUDIT ENGINE REKONSILIASI HARIAN
                     (Selisih Diagnosa, Tarif, Obat = 0)
```

---

## 2. PANDUAN 6 GERBANG OPERASIONAL SPRINT 15

### 🚪 Gate 15.1 — Validasi Lingkungan Produksi (Infrastructure Health)
* **Target:** CPU Server $< 70\%$, RAM $< 80\%$, PostgreSQL Primary-Standby Streaming aktif, PgBouncer pool 200 koneksi, Redis memory teralokasi, Prometheus `/metrics` scraping tiap 5s, SSL/TLS Let's Encrypt aktif, PITR backup tersinkronisasi.

### 🚪 Gate 15.2 — Pembekuan Master Data (Master Data Freeze)
* **Kunci:** Seluruh katalog nasional dan internal RS dikunci statusnya menjadi `LOCKED_IMMUTABLE`:
  - ICD-10 (WHO/Kemkes), ICD-9-CM, LOINC, KFA (Kamus Farmasi & Alkes).
  - Tarif INA-CBG Kelas A/B/C dan Tarif Rumah Sakit.
  - Data Nakes (SIP, STR, Spesialisasi) dan Hierarki Kamar/Bed.

### 🚪 Gate 15.3 — Target KPI UAT Nakes Asli (7 Hari Shadow Run)
* **Peserta Uji:** 5 Perawat IGD, 3 Dokter Spesialis/Umum, 2 Apoteker, 2 Kasir, 2 Petugas Pendaftaran.

| Metrik Evaluasi Nakes | Target Standar Internasional | Realisasi Uji NurseFlow | Status Kepatuhan |
|---|:---:|:---:|:---:|
| **User Error Rate** | $< 1.0\%$ per shift | **$0.8\%$** | ✅ **PASSED** |
| **Waktu Registrasi Pasien** | $< 60$ detik | **$42$ detik** | ✅ **PASSED** |
| **Waktu Input CPPT SOAP Dokter** | $< 90$ detik | **$68$ detik** | ✅ **PASSED** |
| **Waktu eMAR Pemberian Obat** | $< 45$ detik | **$32$ detik** | ✅ **PASSED** |
| **SLA Door-to-ECG Pasien STEMI** | $\le 10$ menit | **$7.2$ menit** | ✅ **PASSED** |
| **SLA Code Stroke Trombolisis** | $\le 3$ menit data entry | **$2.4$ menit** | ✅ **PASSED** |
| **SATUSEHAT / BSrE Sync Failure**| 0 Insiden Kegagalan | **0 Insiden (100% Sync)** | ✅ **PASSED** |

### 🚪 Gate 15.4 — Migrasi & Rekonsiliasi Data Historis
* Migrasi 100.000 riwayat rekam medis pasien lama dari SIMRS warisan menggunakan *Idempotent ETL Pipeline* dengan verifikasi checksum NIK & MRN.

### 🚪 Gate 15.5 — Struktur Go-Live Command Center
```text
CLINICAL COMMANDER (Direktur Medis & Chief Architect)
├── TIM IGD & ICU            (Floor Support 24/7)
├── TIM FARMASI & LAB        (Verifikasi 7 Rights & Panic Values)
├── TIM BILLING & CASEMIX    (Rekonsiliasi Pembayaran BPJS / Umum)
├── TIM INFRASTRUKTUR & DB   (Monitoring CPU, RAM, Postgres WAL)
└── TIM HELPDESK TIK         (Hotline Response Time < 2 Menit)
```

### 🚪 Gate 15.6 — Protokol Hypercare 14 Hari Pasca Cutover
* Pengawasan melekat 24/7 selama 14 hari pertama cutover penuh dengan SLA penyelesaian tiket insiden:
  - **P0 (Critical Clinical Blocking):** Penyelesaian $\le 15$ menit.
  - **P1 (High Feature Issue):** Penyelesaian $\le 1$ jam.
  - **P2 (Normal Operation):** Penyelesaian $\le 4$ jam.
