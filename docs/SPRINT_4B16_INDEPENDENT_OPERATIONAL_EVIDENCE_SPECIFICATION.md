# 🏛️ SPRINT 4B.16: INDEPENDENT OPERATIONAL EVIDENCE ACQUISITION & PILOT EXECUTION
## Spesifikasi Formal Akuisisi Bukti Operasional Independen, Pengujian Infrastruktur Nyata, UAT Klinis Tanpa Pendampingan & Kualifikasi Go-Live Rumah Sakit
**Versi Dokumen:** v1.0.0 (Independent Operational Evidence Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Enterprise Hospital Information System (HIS) Production Go-Live Evidence Framework  
**Standar Kepatuhan:** Permenkes No. 24/2022 (RME), Standar Akreditasi Rumah Sakit (STARKES 2022 / JCI FMS.8), ISO 22301 (Business Continuity), ISO 27001 (Information Security)  
**Aksioma Inti:**  
> **"Mengubah simulated evidence menjadi independently captured operational evidence."**  
> 🔒 **"1.243 Unit Test PASS tidak bisa mengalahkan 1 bukti nyata bahwa backup production gagal direstore."**  
> 🔒 **"Test code bukan satu-satunya sumber kebenaran. Hierarki Kepercayaan: Independent Evidence > Real Infrastructure > Real Transactions > Human Evidence > Observability Data > Integration Logs > Automated Tests > Unit Tests > Synthetic Simulation."**

---

## 🧭 1. EXECUTIVE SUMMARY & PARADIGM SHIFT: BEYOND SYNTHETIC TESTS

Sprint 4B.16 menghentikan seluruh penambahan fitur (*Feature Engineering Frozen*) dan memfokuskan 100% kapasitas rekayasa pada **Akuisisi Bukti Operasional Independen (*Independent Operational Evidence Acquisition*)**.

```text
                    TRUST HIERARCHY
                          ▲
                          │
                Independent Evidence
                          │
                 Real Infrastructure
                          │
                 Real Transactions
                          │
                   Human Evidence
                          │
                 Observability Data
                          │
                 Integration Logs
                          │
                  Automated Tests
                          │
                   Unit Tests
                          │
                 Synthetic Simulation
                          ▼
```

---

## 🏛️ 2. TUJUH GERBANG AKUISISI BUKTI OPERASIONAL (GATES G1 s.d. G7)

### 2.1 Gate G1 — Real Infrastructure Evidence
* **Katalog Bukti:**
  - Instansiasi nyata engine PostgreSQL dengan direktori fisik `pg_wal`.
  - Spesifikasi komputasi server (CPU, RAM, NVMe Storage).
  - Telemetri utilisasi memori dan batas *connection pool* (200 kueri paralel).
  - File konfigurasi `postgresql.conf` dengan `wal_level = replica`, `archive_mode = on`.

### 2.2 Gate G2 — Real Network Fault Injection Evidence
* **Pengujian Layer Jaringan Fisik:**
  - Injeksi packet loss nyata (10%, 30%, 50%, 100%) menggunakan traffic control/netem pada layer router.
  - Injeksi latensi $5.000\text{ ms}$ pada antarmuka Wi-Fi tablet bangsal.
  - Pencatatan telemetri: Packet Drop Rate, Jitter, RTT, Bandwidth Throttling, dan Sync Recovery Time.

### 2.3 Gate G3 — Real Recovery & Destruction Evidence
* **Protokol Penghancuran & Pemulihan Nyata:**
  - `Snapshot ID` dan stempel waktu backup fisik.
  - Ukuran basis data dan ukuran dump terkompresi.
  - Posisi Log Sequence Number (LSN) WAL saat insiden.
  - Catatan stempel waktu: *Destroy Time*, *Restore Start Time*, *Restore Finish Time*, *Verification Finish Time*.
  - Kalkulasi RTO aktual dan RPO aktual yang terbukti secara operasional.

### 2.4 Gate G4 — Independent External Integration Evidence
* **Pemisahan Bukti Integrasi:**
  1. *SATUSEHAT Sandbox Environment:* Log pertukaran token OAuth2 dan Bundle FHIR R4 ke endpoint resmi Kemenkes.
  2. *BPJS VClaim Test Environment:* Log pembuatan SEP dan bridging klaim Ina-CBG pada environment terotorisasi BPJS.
  3. *PACS / DICOM Test Environment:* Log Modality Worklist (MWL) dan penyimpanan citra medis C-STORE.

### 2.5 Gate G5 — Unaided Human Clinical UAT Evidence (10 Hospital Roles)
* **Aturan Keras:** **Tim developer DILARANG MEMBERIKAN BANTUAN (*Zero Assistance*) selama staf medis menguji.**
* **Format Lembar Kerja Bukti UAT:**
  ```text
  Role                     : [Dokter DPJP / Dokter IGD / Perawat / Farmasi / Admisi / Kasir / ...]
  Tester Pseudonym ID      : [UAT-MD-01, UAT-RN-02, UAT-PH-03, ...]
  Tanggal & Waktu Uji      : [YYYY-MM-DD HH:mm:ss]
  Lingkungan Uji           : [Hospital Staging Pilot Server]
  Skenario Pasien          : [Kasus S-01 s.d. S-06 / Pasien IGD Kritis]
  Waktu Mulai - Selesai    : [HH:mm:ss - HH:mm:ss]
  Error yang Ditemui       : [0 / Deskripsi]
  Bantuan Diminta?         : [TIDAK (Wajib)]
  Status Kelulusan Alur    : [100% LULUS]
  Skor Usability (SUS)     : [> 85.0]
  Temuan Kritis            : [Nihil]
  Tanda Tangan Penguji     : [Tervalidasi Digital]
  ```

### 2.6 Gate G6 — Real Operational Observability & Incident Audit Trail
* **Transkrip Insiden Operasional:**
  - Log deteksi anomali metrik secara otomatis.
  - Dispatch alert alarm via Webhook/Telegram SRE.
  - Respon operator on-call (*Incident Acknowledged*).
  - Eksekusi failover SOP dan rekonsiliasi data klinis post-restore.

### 2.7 Gate G7 — Independent Multi-Stakeholder Sign-Off
* **Daftar Persetujuan Resmi Stakeholder:**
  1. *Clinical Lead / Ketua Komite Medis (DPJP Owner)*
  2. *Nursing Lead / Kepala Bidang Keperawatan*
  3. *Pharmacy Lead / Kepala Instalasi Farmasi*
  4. *IT & Infrastructure / SRE Lead*
  5. *Hospital Security & Compliance Officer*
  6. *System Owner / Direktur Rumah Sakit*

---

## 🔒 3. MATRIKS INVARIANT BUKTI OPERASIONAL INDEPENDEN

| Parameter Kualitas Bukti | Standar Bukti Independen | Target Kelulusan |
| :--- | :--- | :---: |
| **Bantuan Developer pada UAT** | **0 Bantuan (Mandiri Penuh)** | 100% Mandiri |
| **Unaided Task Completion** | **100% Skenario Klinis Selesai** | 100% Lulus |
| **System Usability Scale (SUS)**| **Skor Rata-Rata $> 85.0$** | $> 85.0$ (Grade A) |
| **Actual RTO (Terukur)** | **$< 15\text{ Menit}$ dari Catatan Log** | 12 Menit |
| **Actual RPO (Terukur)** | **$< 5\text{ Menit}$ dari Posisi WAL** | 2 Menit |
| **External Decoupling Proof** | **Pelayanan IGD Berjalan saat Gateway Down**| 100% Terisolasi |
| **Stakeholder Sign-Off** | **6/6 Pemangku Kepentingan Menyetujui** | 6/6 Ditandatangani |

---

## 🧪 4. MATRIKS 50 SKENARIO AKUISISI BUKTI INDEPENDEN (TC-01 s.d. TC-50)

| ID | Gate | Skenario Uji & Akuisisi Bukti | Bukti Independen yang Ditangkap |
| :--- | :--- | :--- | :--- |
| **TC-01** | **G1: Infra** | Verifikasi koneksi physical PostgreSQL | Catatan koneksi socket & latensi query $< 5\text{ms}$ |
| **TC-02** | **G1: Infra** | Verifikasi direktori fisik `pg_wal` | Segmen WAL terbit dengan LSN checksum SHA-256 |
| **TC-03** | **G1: Infra** | Verifikasi alokasi memory heap $< 25\text{MB}$ | Log telemetri V8 heap profiling 12 jam |
| **TC-04** | **G1: Infra** | Verifikasi connection pool 200 kueri | Metrik pool saturation tanpa deadlocks |
| **TC-05** | **G1: Infra** | Verifikasi disk quota alert 90% | Alarm kapasitas volume storage terkirim |
| **TC-06** | **G1: Infra** | Verifikasi storage full rejection 99.8% | Error `STORAGE_FULL` tercatat di error log |
| **TC-07** | **G1: Infra** | Verifikasi auto-vacuum tuple cleanup | Metrik defragmentasi indeks PostgreSQL |
| **TC-08** | **G1: Infra** | Verifikasi row-level locking 10 user | Bukti transaksional ACID tanpa dirty read |
| **TC-09** | **G1: Infra** | Verifikasi process supervisor systemd/PM2| Bukti restart proses $< 2\text{ detik}$ pasca crash |
| **TC-10** | **G1: Infra** | Verifikasi integritas TLS 1.3 & cipher suite| Sertifikat SSL/TLS tervalidasi A+ rating |
| **TC-11** | **G2: Net** | Injeksi 10% packet drop di switch bangsal | Log retransmisi TCP & kestabilan data |
| **TC-12** | **G2: Net** | Injeksi 30% packet drop jitter | Log chunked payload streaming |
| **TC-13** | **G2: Net** | Injeksi 50% packet drop ekstrim | Status `DEGRADED_NETWORK` pada banner UI |
| **TC-14** | **G2: Net** | Injeksi 100% Wi-Fi blackout | Bukti penyimpanan Local-First IndexedDB |
| **TC-15** | **G2: Net** | Injeksi latensi $5.000\text{ ms}$ | Bukti form asinkron dokter tanpa UI freeze |
| **TC-16** | **G2: Net** | Injeksi flapping jaringan 3 detik | Log debounced sync mencegah flood server |
| **TC-17** | **G2: Net** | Injeksi DNS failure lokal RS | Bukti fallback ke gateway IP statis |
| **TC-18** | **G2: Net** | Split-brain 2 tablet saat Wi-Fi putus | Log penggabungan vector clock (0 data hilang) |
| **TC-19** | **G2: Net** | Split-brain konflik obat Norepinephrine | Bukti flag konflik klinis pada dashboard DPJP |
| **TC-20** | **G2: Net** | Reconnection sync 50 tablet serentak | Log drain antrean tuntas dalam $< 15\text{ detik}$ |
| **TC-21** | **G3: Rec** | Pembuatan full dump snapshot terenkripsi | Checksum SHA-256 berkas backup tersimpan |
| **TC-22** | **G3: Rec** | Penghancuran database uji fisik | Bukti log drop table (Database 0 baris) |
| **TC-23** | **G3: Rec** | Pemulihan fisik database dari snapshot | Log waktu mulai dan selesai pg_restore |
| **TC-24** | **G3: Rec** | Stopwatch RTO aktual dari stempel waktu | RTO terbukti operasional **12 Menit** ($\le 15\text{m}$) |
| **TC-25** | **G3: Rec** | Verifikasi 5 Invarian Klinis pasca restore | Bukti 1.000 pasien, MRN, SEP, Stok valid |
| **TC-26** | **G4: Gate**| SATUSEHAT Sandbox OAuth2 Auth | Log access_token resmi Kemenkes Sandbox |
| **TC-27** | **G4: Gate**| SATUSEHAT FHIR R4 Bundle Dispatch | Log HTTP 201 Created Bundle Encounter/Observation|
| **TC-28** | **G4: Gate**| SATUSEHAT 500 Server Error Isolation | Log pengalihan payload ke local DLQ |
| **TC-29** | **G4: Gate**| SATUSEHAT 429 Rate Limit Backoff | Log penundaan exponential backoff 60s |
| **TC-30** | **G4: Gate**| BPJS VClaim Test SEP Issuance | Bukti nomor SEP sah pada BPJS Sandbox |
| **TC-31** | **G4: Gate**| BPJS 503 Gateway Drop Handling | Bukti penerbitan SEP provisional offline |
| **TC-32** | **G4: Gate**| PACS Modality Worklist DICOM Query | Bukti daftar kerja MWL terkirim ke mesin CR |
| **TC-33** | **G4: Gate**| PACS Server Timeout Handling | Bukti resep/SOAP dokter tersimpan normal |
| **TC-34** | **G4: Gate**| DLQ Drain pasca gateway pulih | Bukti 100% antrean DLQ terkirim tuntas |
| **TC-35** | **G4: Gate**| Zero Clinician Delay Verification | Bukti dokter tidak terhambat 1 detik pun |
| **TC-36** | **G5: UAT** | UAT Mandiri: Dokter DPJP (UAT-MD-01) | Lembar kerja UAT tuntas, skor SUS $> 85$ |
| **TC-37** | **G5: UAT** | UAT Mandiri: Dokter IGD (UAT-ER-02) | Lembar kerja UAT tuntas, alur triase cepat |
| **TC-38** | **G5: UAT** | UAT Mandiri: Perawat Ruangan (UAT-RN-03)| Lembar kerja UAT tuntas, eMAR 5-Benar valid |
| **TC-39** | **G5: UAT** | UAT Mandiri: Kepala Ruangan (UAT-HN-04)| Lembar kerja UAT tuntas, BOR/LOS valid |
| **TC-40** | **G5: UAT** | UAT Mandiri: Apoteker Farmasi (UAT-PH-05)| Lembar kerja UAT tuntas, dispensing stok valid |
| **TC-41** | **G5: UAT** | UAT Mandiri: Petugas Admisi (UAT-AD-06) | Lembar kerja UAT tuntas, MRN unik valid |
| **TC-42** | **G5: UAT** | UAT Mandiri: Kasir Billing (UAT-CS-07) | Lembar kerja UAT tuntas, tagihan akurat |
| **TC-43** | **G5: UAT** | UAT Mandiri: Radiografer (UAT-RD-08) | Lembar kerja UAT tuntas, upload DICOM valid |
| **TC-44** | **G5: UAT** | UAT Mandiri: Analis Lab (UAT-LB-09) | Lembar kerja UAT tuntas, nilai kritis alert |
| **TC-45** | **G5: UAT** | UAT Mandiri: IT SRE Admin (UAT-IT-10) | Lembar kerja UAT tuntas, audit trail bersih |
| **TC-46** | **G5: UAT** | Master End-to-End Patient Journey | 1 Pasien melalui seluruh 10 peran tanpa dev |
| **TC-47** | **G6: Obs** | Catatan stempel waktu insiden 02:13:00 | Transkrip log insiden detik presisi |
| **TC-48** | **G6: Obs** | Alarm SRE dispatch ke Telegram on-call | Bukti pesan Telegram terkirim dalam 8s |
| **TC-49** | **G6: Obs** | Incident Acknowledged oleh operator | Bukti status berubah `INVESTIGATING` dalam 35s |
| **TC-50** | **G7: Sign**| Independent Multi-Stakeholder Sign-Off | 6/6 Tanda Tangan Stakeholder Tervalidasi Sah |

---

## 📌 5. KESIMPULAN ARSITEKTURAL

Dokumen spesifikasi formal ini menetapkan kerangka kerja **Sprint 4B.16: Independent Operational Evidence Acquisition & Pilot Execution**. Tahap ini menjadi dasar penetapan keputusan resmi **GO / CONDITIONAL GO / NO-GO** untuk implementasi produksi rumah sakit nyata.
