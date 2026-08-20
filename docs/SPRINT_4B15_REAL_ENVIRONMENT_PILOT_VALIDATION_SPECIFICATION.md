# 🏥 SPRINT 4B.15: REAL ENVIRONMENT PRODUCTION READINESS & HOSPITAL PILOT VALIDATION
## Spesifikasi Formal Validasi Lingkungan Rumah Sakit Nyata, Kualifikasi PostgreSQL/WAL, UAT Klinis 10 Peran & Ketahanan Operasional Mandiri
**Versi Dokumen:** v1.0.0 (Real Hospital Environment Pilot Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Enterprise Hospital Information System (HIS) Real-World Operational Qualification Framework  
**Standar Kepatuhan:** Permenkes No. 24/2022 (RME), Standar Akreditasi Rumah Sakit (STARKES 2022 / JCI FMS.8), ISO 22301 (Business Continuity)  
**Aksioma Inti:**  
> **"Fokusnya bukan: 'Apakah kode kita bekerja?' Tetapi: 'Apakah NurseFlow benar-benar bisa hidup di lingkungan rumah sakit nyata?'"**  
> 🔒 **"No More Synthetic Confidence."** *(Menambah jumlah unit test tidak otomatis membuat sistem production-ready. Yang dibutuhkan adalah diversitas bukti nyata: Real Database, Real Network, Real External Gateways, Human Clinical UAT 10 Peran, dan Observabilitas Nyata).*

---

## 🧭 1. EXECUTIVE SUMMARY & PARADIGM SHIFT: REAL HOSPITAL QUALIFICATION

Sprint 4B.15 adalah gerbang pembuktian operasional skala rumah sakit sesungguhnya (*Real Hospital Environment Pilot Validation*). Sistem tidak lagi diuji dalam isolasi mock memori murni, melainkan dihadapkan pada **kondisi fisik infrastruktur, fluktuasi jaringan bangsal, batas integrasi Kemenkes/BPJS, serta faktor manusia (*Human Factors*) dari 10 peran staf rumah sakit**.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│              REAL HOSPITAL OPERATIONAL PILOT PIPELINE                   │
├─────────────────────────────────────────────────────────────────────────┤
│ REAL POSTGRESQL ➔ REAL RS WI-FI ➔ REAL BACKUP DESTRUCTION ➔ GATEWAYS   │
│                                  │                                      │
│                                  ▼                                      │
│ REAL OBSERVABILITY TIMESTAMPS ➔ HUMAN CLINICAL UAT (10 HOSPITAL ROLES) │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ 2. ENAM DOMAIN VALIDASI LINGKUNGAN RUMAH SAKIT NYATA

### 2.1 Domain 1: Real Database & PostgreSQL Reality
1. **Engine PostgreSQL & WAL Replay**: Operasi transaksi real ACID, eksekusi Point-In-Time Recovery (PITR) dari berkas WAL fisik.
2. **Tekanan Basis Data**: Simulasi *connection pool exhaustion* (200 query konkuren), disk pressure (90%, 99%, 100%), restart proses mendadak, dan transaksi korup dengan jaminan *zero phantom entity*.

### 2.2 Domain 2: Real Hospital Network Failure Reality
1. **Topologi Jaringan Bangsal Nyata**:
   $$\text{Tablet Perawat} \longrightarrow \text{Wi-Fi AP Bangsal} \longrightarrow \text{Switch PoE} \longrightarrow \text{Core Gateway} \longrightarrow \text{Server HIS}$$
2. **Uji Fluktuasi Jaringan**:
   - Injeksi packet loss (10%, 30%, 50%, 100%), *network flapping* 3 detik, latensi $5.000\text{ ms}$, dan DNS failure.
   - Pengukuran objektif: MTTD, MTTR, RPO aktual, RTO aktual, *lost events = 0*, dan *sync lag*.

### 2.3 Domain 3: Real Backup Destruction & Restore Reality
1. **Penghancuran Nyata Database Uji**:
   $$\text{Full Dump Backup} \longrightarrow \text{Hancurkan Total Database (Wipe)} \longrightarrow \text{Restore Snapshot} \longrightarrow \text{Replay WAL Delta}$$
2. **Pengukuran Waktu Nyata**: Menghitung durasi pemulihan menit aktual (*Actual Minutes to Recover*), bukan sekadar klaim target teoritis.

### 2.4 Domain 4: Real External Integration Reality (SATUSEHAT, BPJS, PACS)
1. **SATUSEHAT Kemenkes**: Siklus hidup token OAuth2, pengiriman Bundle FHIR R4 (Encounter, Observation, Condition, Medication), isolasi error 500/429 ke antrean Dead-Letter Queue (DLQ).
2. **BPJS VClaim**: Validasi SEP, pemeriksaan eligibilitas peserta, penanganan timeout & gateway 503 dengan penerbitan SEP darurat offline.
3. **PACS Radiologi**: Integrasi DICOM Modality Worklist (MWL), penyimpanan C-STORE, dan penanganan server gambar lambat.
4. **Aturan Mutlak:** **Kegagalan integrasi eksternal tidak boleh menghentikan pelayanan klinis dokter/perawat.**

### 2.5 Domain 5: Human Clinical UAT (10 Peran Staf Rumah Sakit)
Pengujian seluruh alur perjalanan pasien (*End-to-End Patient Journey*) yang dijalankan oleh 10 staf medis tanpa bantuan tim developer:
```text
Pasien Baru IGD ➔ Registrasi ➔ Triage Triase ➔ Vital Sign ➔ Dokter SOAP ➔ CPOE Obat ➔
Farmasi Verifikasi & Dispensing ➔ Perawat eMAR ➔ Order Lab & Spesimen ➔ PACS Radiologi ➔
Billing Kasir & Ina-CBG ➔ Discharge & Serah Terima SBAR
```
* **10 Peran Teruji:** (1) Dokter Spesialis/DPJP, (2) Dokter IGD, (3) Perawat Pelaksana, (4) Kepala Ruangan, (5) Apoteker/Farmasi, (6) Petugas Admisi, (7) Kasir Billing, (8) Radiografer, (9) Analis Lab, (10) Petugas IT SRE.

### 2.6 Domain 6: Real Observability & Operational Incident Timestamps
Pencatatan transkrip objektif insiden pemadaman dengan stempel waktu detik presisi:
```text
02:13:00  Outage basis data terjadi
02:13:05  Metrik connection pool anomali terdeteksi
02:13:08  Alarm SRE otomatis dikirim ke operator on-call
02:13:20  Operator menerima pesan alert
02:13:35  Insiden di-acknowledge oleh operator (Status: INVESTIGATING)
02:14:15  Prosedur failover dan restore snapshot dijalankan mandiri
02:22:00  Sinkronisasi WAL delta selesai
02:25:00  Seluruh layanan rekam medis aktif kembali (Total Downtime: 12 Menit)
```

---

## 🔒 3. MATRIKS INVARIANT VALIDASI LINGKUNGAN NYATA

| Parameter Kualitas Nyata | Standar Keamanan Klinis | Verifikasi Uji Nyata |
| :--- | :---: | :--- |
| **Lost Clinical Action** | **0** | Aksi medis di tablet tersimpan 100% saat Wi-Fi putus |
| **Duplicate Medication Dispense** | **0** | Idempotency token mengunci dispensing ganda |
| **Wrong Patient Contamination** | **0** | Konteks pasien terisolasi 100% pada multi-perangkat |
| **Audit Divergence** | **0** | Root hash SHA-256 identik bit-for-bit pasca restore |
| **Human Journey Completion** | **100%** | 10 Peran staf menyelesaikan seluruh alur tanpa crash |
| **External Decoupling** | **100%** | Pelayanan IGD berlanjut normal saat Kemenkes/BPJS down |

---

## 🧪 4. MATRIKS 50 SKENARIO UJI REAL ENVIRONMENT PILOT (TC-01 s.d. TC-50)

| ID | Domain Pengujian | Skenario Uji Nyata & Input | Kriteria Keberhasilan |
| :--- | :--- | :--- | :--- |
| **TC-01** | **DB: Real PostgreSQL Connect** | Koneksi ke engine database PostgreSQL | Kueri ACID berjalan dengan latensi $< 5\text{ ms}$ |
| **TC-02** | **DB: Real WAL Log Append** | Penulisan transaksi rekam medis ke WAL | Segmen WAL ter-append secara persisten di disk |
| **TC-03** | **DB: SIGKILL & Clean Reinit** | Kill proses database di tengah transaksi | Rollback atomik membersihkan memori tanpa korupsi |
| **TC-04** | **DB: Connection Pool Exhaustion**| 200 koneksi konkuren menghabiskan pool | Gateway menahan antrean tanpa memicu server crash |
| **TC-05** | **DB: Disk Pressure 90% Warning**| Penggunaan disk mencapai 90% | Sistem mengirimkan peringatan kapasitas storage |
| **TC-06** | **DB: Disk Full 99% Rejection** | Penggunaan disk mencapai 99.5% | Penulisan baru ditolak aman dengan `STORAGE_FULL` |
| **TC-07** | **DB: Corrupted Tx Rollback** | Simulasikan penulisan sebagian tabel | Rollback atomik membatalkan seluruh operasi |
| **TC-08** | **DB: PITR WAL Segment Replay** | Replay 50 segmen WAL pasca-crash | 100% data transaksi delta pulih dengan hash valid |
| **TC-09** | **DB: Table Lock Concurrency** | 10 Dokter update resep pasien berbeda | Row-level locking mencegah tabrakan kueri |
| **TC-10** | **DB: Auto Vacuum & Index Health**| Pembersihan tuple mati pada database | Kinerja kueri pencarian pasien tetap optimal |
| **TC-11** | **Net: Real Wi-Fi Drop 0%** | Wi-Fi tablet perawat mati total | Beralih ke Local-First IndexedDB tanpa hilang input |
| **TC-12** | **Net: 10% Packet Loss Spike** | Simulasi 10% packet drop di switch | Automatic retry memulihkan pengiriman data |
| **TC-13** | **Net: 30% Packet Loss Jitter** | Simulasi 30% packet drop di bangsal | Chunked streaming payload menjaga stabilitas |
| **TC-14** | **Net: 50% Packet Loss Extreme**| Simulasi 50% packet drop | UI menandai `DEGRADED_NETWORK` tanpa freeze |
| **TC-15** | **Net: High Latency 5.000 ms** | Latensi jaringan melonjak ke 5 detik | Input form SOAP dokter tetap responsif asinkron |
| **TC-16** | **Net: Network Flapping 3s** | Jaringan hidup-mati setiap 3 detik | Debounce sync mencegah banjir koneksi ke server |
| **TC-17** | **Net: DNS Gateway Failure** | Server DNS lokal rumah sakit down | Fallback ke alamat IP gateway statis otomatis |
| **TC-18** | **Net: Split-Brain 2 Tablets** | Tablet A & B input terapi pasien saat offline | Vector clock menggabungkan timeline tanpa overwrite |
| **TC-19** | **Net: Split-Brain Med Flagging** | Tablet A beri Dopamin, Tablet B beri Cairan | Kedua obat tercatat & ditandai untuk review dokter |
| **TC-20** | **Net: Reconnection Sync Lag** | 50 tablet tersambung serentak | Antrean sinkronisasi tuntas dalam $< 15\text{ detik}$ |
| **TC-21** | **Restore: Full Dump Creation** | Backup snapshot lengkap 1.000 pasien | Berkas dump terenkripsi dan terverifikasi checksum |
| **TC-22** | **Restore: Complete DB Wipe** | Hapus total database (*Drop All Tables*) | Database kosong 0 tabel |
| **TC-23** | **Restore: Physical Dump Restore**| Pulihkan database dari file dump fisik | 100% tabel dan data master berhasil ter-restore |
| **TC-24** | **Restore: Actual RTO Measurement**| Ukur waktu riil mulai restore s.d. aktif | Layanan rekam medis pulih dalam $12\text{ menit } (< 15\text{m})$ |
| **TC-25** | **Restore: 5 Invariants Check** | Verifikasi 5 Invarian Klinis pasca restore | Pasien, MRN, SEP, Stok, dan SHA-256 lulus 100% |
| **TC-26** | **Gateways: SATUSEHAT OAuth2** | Otentikasi token SATUSEHAT Kemenkes | Token tersimpan aman dan ter-refresh otomatis |
| **TC-27** | **Gateways: SATUSEHAT Bundle** | Pengiriman Bundle FHIR R4 | Resource Encounter & Observation terkirim valid |
| **TC-28** | **Gateways: SATUSEHAT 500 Drop** | Endpoint Kemenkes error 500 | Transaksi lokal sukses, payload tersimpan di DLQ |
| **TC-29** | **Gateways: SATUSEHAT 429 Limit**| Endpoint Kemenkes respon 429 | Exponential backoff menunda pengiriman teratur |
| **TC-30** | **Gateways: BPJS VClaim SEP** | Penerbitan SEP online peserta BPJS | SEP terbit dengan nomor registrasi sah |
| **TC-31** | **Gateways: BPJS 503 Downtime** | Server BPJS down saat SEP dibuat | SEP provisional offline diterbitkan darurat |
| **TC-32** | **Gateways: PACS DICOM MWL** | Permintaan daftar kerja modalitas radiologi| Modality worklist terkirim ke mesin rontgen |
| **TC-33** | **Gateways: PACS Server Timeout** | Server PACS tidak merespon gambar | SOAP dokter tersimpan aman tanpa ketergantungan |
| **TC-34** | **Gateways: DLQ Drain on Reconnect**| Gateway eksternal kembali normal | Seluruh antrean DLQ terproses tuntas |
| **TC-35** | **Gateways: Zero Patient Delay** | Kegagalan gateway eksternal | Pelayanan dokter tidak tertunda 1 detik pun |
| **TC-36** | **UAT: Peran 1 - Dokter DPJP** | Dokter mengisi SOAP, CPOE, & edukasi | Resume medis tersimpan dan terverifikasi digital |
| **TC-37** | **UAT: Peran 2 - Dokter IGD** | Dokter IGD triase & tata laksana syok | Alur resusitasi tercatat cepat tanpa lag |
| **TC-38** | **UAT: Peran 3 - Perawat Ruangan**| Perawat input TTV & administrasi eMAR | Verifikasi 5 Benar obat berhasil tervalidasi |
| **TC-39** | **UAT: Peran 4 - Kepala Ruangan**| Validasi dashboard kapasitas tempat tidur | Barber-Johnson BOR/LOS terhitung otomatis |
| **TC-40** | **UAT: Peran 5 - Apoteker Farmasi**| Telaah resep CPOE, dispensing, & stok | Stok obat terpotong akurat tanpa minus |
| **TC-41** | **UAT: Peran 6 - Petugas Admisi** | Registrasi pasien baru, NIK & BPJS | Pasien terdaftar dengan nomor RM unik |
| **TC-42** | **UAT: Peran 7 - Kasir Billing** | Pembayaran kasir & bridging Ina-CBG | Tagihan terkalkulasi tepat tanpa selisih |
| **TC-43** | **UAT: Peran 8 - Radiografer** | Upload hasil ekspertise & DICOM | Laporan radiologi terhubung ke chart pasien |
| **TC-44** | **UAT: Peran 9 - Analis Lab** | Validasi hasil tes darah & nilai kritis | Alert nilai kritis otomatis sampai ke DPJP |
| **TC-45** | **UAT: Peran 10 - IT SRE Admin** | Monitoring kesehatan sistem & backup | Dashboard SRE hijau dengan log terstruktur |
| **TC-46** | **UAT: Full Patient Journey E2E**| 1 Pasien melalui seluruh 10 peran staf | 100% alur selesai tanpa crash atau dev support |
| **TC-47** | **Obs: 02:13 Real Timestamp Outage**| Simulasi outage IGD jam 02:13 dini hari | Transkrip log mencatat stempel waktu presisi |
| **TC-48** | **Obs: Alert Dispatch to Human** | Alarm otomatis terkirim ke Telegram SRE | Operator menerima pesan dalam $< 30\text{ detik}$ |
| **TC-49** | **Obs: Incident Acknowledgment** | Operator menekan tombol Acknowledge | Status berubah menjadi `INVESTIGATING` |
| **TC-50** | **Master Real Environment Drill**| Gabungan DB Crash + Wi-Fi Drop + 10 UAT | 100% Uji Lulus, 0 Data Hilang, 0 Invarian Rusak |

---

## 📌 5. KESIMPULAN ARSITEKTURAL

Dokumen spesifikasi formal ini menetapkan kerangka kerja **Sprint 4B.15: Real Environment Production Readiness & Hospital Pilot Validation**. Implementasi dan pengujian lingkungan nyata akan dimulai setelah mendapatkan tinjauan dan persetujuan resmi dari Bos Robby.
