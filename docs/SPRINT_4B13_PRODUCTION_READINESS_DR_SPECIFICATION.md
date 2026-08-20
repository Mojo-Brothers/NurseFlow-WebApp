# 🚨 SPRINT 4B.13: PRODUCTION READINESS GATE & OPERATIONAL DISASTER RECOVERY
## Spesifikasi Formal Kesiapan Operasional Rumah Sakit, Pemulihan Bencana (RPO $\le 5\text{m}$, RTO $\le 15\text{m}$), Mitigasi Split-Brain & Simulasi Outage IGD 02:13 Dini Hari
**Versi Dokumen:** v1.0.0 (Formal Disaster Recovery Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Enterprise Hospital Information System (HIS) Business Continuity, Disaster Recovery (DR) & Operational Readiness Framework  
**Standar Kepatuhan:** JCI Facility Management & Safety (FMS.8), ISO 22301 Business Continuity, Permenkes No. 24/2022 Rekam Medis Elektronik  
**Otoritas:** Chief Technology Officer (CTO), Chief Medical Officer (CMO), Head of Clinical Safety & Lead Infrastructure Engineer  
**Aksioma Inti:**  
> **"Stop proving that the code works. Start proving that the hospital can survive when the code, network, database, infrastructure, and humans fail."**  
> **"4B.12 proved the software survives our simulated chaos. 4B.13 must prove the hospital organization can recover the system when real catastrophic disasters strike."**

---

## 🧭 1. EXECUTIVE SUMMARY & PARADIGM SHIFT: OPERATIONAL SURVIVABILITY

Sprint 4B.13 memindahkan fokus dari pengujian logika kode (*Software Simulation*) menuju **Kesiapan Pemulihan Operasional Nyata (*Operational Disaster Recovery & Readiness Gate*)**.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│              ENTERPRISE DISASTER RECOVERY LIFECYCLE                     │
├─────────────────────────────────────────────────────────────────────────┤
│ INCIDENT ➔ DETECTION ➔ DECLARATION ➔ ISOLATION ➔ RECOVERY ➔ RECONCILE  │
│                                                     │                   │
│                                                     ▼                   │
│                   CLINICAL SERVICE RESTORED ➔ AUDIT VERIFY (SHA-256)   │
└─────────────────────────────────────────────────────────────────────────┘
```

Kriteria Keberhasilan Bukan Hanya Status `PASS`, melainkan:
* **RPO (Recovery Point Objective)** $\le 5\text{ menit}$ (Maksimal kehilangan data $\le 5$ menit).
* **RTO (Recovery Time Objective)** $\le 15\text{ menit}$ (Layanan rekam medis kembali aktif dalam $< 15$ menit).
* **Zero Clinical Invariant Corruption** (Tidak ada resep hilang, tidak ada mutasi ganda, tidak ada salah pasien).

---

## 💥 2. ENAM DOMAIN TORTURE OPERASIONAL (6 DISASTER DOMAINS)

### 2.1 Domain 1: Database Disaster
1. **DB Process Killed**: Proses database PostgreSQL/In-Memory dimatikan mendadak (`SIGKILL`) di tengah penulisan resep CPOE ➔ Recovery Point-In-Time Restore (PITR) memulihkan state tanpa *phantom entities*.
2. **Connection Pool Exhaustion**: 200 koneksi serentak menghabiskan connection pool ➔ Gateway menahan request pada antrean aman tanpa memicu crash proses server.
3. **Corrupted Disk / Bad Sectors**: Isolasi blok memori rusak tanpa menyebarkan korupsi ke tabel rekam medis lainnya.

### 2.2 Domain 2: Infrastructure Disaster
1. **API Node Crash & Container Restart**: Worker API mati mendadak ➔ Load balancer mengalihkan traffic seketika ke node cadangan (*Zero Downtime Failover*).
2. **Clinical Workflow Degradation $\neq$ Clinical Data Corruption**: Jika microservice pendukung (misal: mesin analitik) down, core rekam medis SOAP/CPPT tetap beroperasi dalam mode aman (*Fail-Safe Degraded Mode*).

### 2.3 Domain 3: Network Disaster & Split-Brain Scenario
1. **Network Flapping & Severe Packet Loss (10%, 30%, 50%)**: Koneksi Wi-Fi bangsal hidup-mati dengan latensi tinggi ➔ Exponential backoff jitter dan chunked streaming mencegah transmisi rusak.
2. **Split-Brain Scenario (TORTURE KRITIS)**:
   - Dua perangkat tablet (Tablet A dan Tablet B) terputus dari server dan mengedit data pasien yang sama secara bersamaan.
   - *Resolusi Deterministik*: Algoritma *Vector Clock + Last-Write-Wins (LWW) with Clinical Priority* menyatukan tindakan tanpa menghapus aksi klinis perawat manapun (*Zero Lost Clinical Action*).

### 2.4 Domain 4: Recovery Verification (RPO $\le 5\text{m}$, RTO $\le 15\text{m}$)
Pengujian siklus pemulihan bencana penuh dari snapshot dasar (*Base Backup at T0*) ditambah replay log transaksi (*WAL Delta Replay at T1*):
$$\text{RPO} \le 5\text{ menit}, \quad \text{RTO} \le 15\text{ menit}, \quad \Delta \text{Audit Hash} = 0$$

### 2.5 Domain 5: Human Operational Drill (Simulasi Outage IGD Pukul 02:13 Dini Hari)
Pengujian kesiapan staf operator non-developer saat bencana terjadi di jam kritis:
* Skenario: Database mati pukul 02:13 saat IGD penuh 20 pasien darurat.
* Parameter Pengukuran:
  - *Time to Detect (TTD)* $< 1\text{ menit}$
  - *Time to Declare (TTDec)* $< 2\text{ menit}$
  - *Time to Recover (TTR)* $< 8\text{ menit}$
  - *Time to Reconcile (TTRec)* $< 4\text{ menit}$
  - *Time to Resume Clinical Workflow (TTRC)* $< 15\text{ menit}$
* **Syarat Mutlak**: Operator dan perawat jaga harus dapat memulihkan sistem menggunakan *Standard Operating Procedure (SOP) Runbook* tanpa intervensi tim developer.

### 2.6 Domain 6: Observability Reality Test
Pengujian jalur nyata penyampaian alarm kegagalan:
$$\text{Failure} \longrightarrow \text{Metric} \longrightarrow \text{Log} \longrightarrow \text{Trace} \longrightarrow \text{Alert} \longrightarrow \text{Human Notification} \longrightarrow \text{Incident Acknowledged}$$
> *Alarm yang tidak diterima oleh manusia dalam 3 menit dianggap sebagai kegagalan sistem observabilitas.*

---

## 🔒 3. MATRIKS INVARIANT PRESERVATION UNDER DISASTER

| Invariant Indikator | Target Toleransi | Verifikasi Uji Bencana |
| :--- | :---: | :--- |
| **Phantom Entity Created** | **0** | Rollback atomik membersihkan data setengah tersimpan |
| **Duplicate Mutation** | **0** | Idempotency key mencegah eksekusi ganda pasca recovery |
| **Lost Clinical Event** | **0** | Replay WAL & jurnal lokal memulihkan 100% tindakan |
| **Audit Divergence** | **0** | SHA-256 Merkle root sebelum vs sesudah recovery identik |
| **Split-Brain Overwrite** | **0** | Vector clock menggabungkan mutasi konkuren tanpa kehilangan data |
| **Stock Discrepancy** | **0** | Stok obat fisik dan server konsisten pasca sinkronisasi |

---

## 🧪 4. MATRIKS 50 SKENARIO UJI DISASTER RECOVERY (TC-01 s.d. TC-50)

| ID | Domain Pengujian | Skenario Uji Bencana & Input | Kriteria Keberhasilan Pemulihan |
| :--- | :--- | :--- | :--- |
| **TC-01** | **DB: Process Killed (SIGKILL)** | Kill proses basis data saat 5 dokter submit SOAP | PITR recovery memulihkan data tanpa korupsi |
| **TC-02** | **DB: Connection Pool Exhaustion**| 200 request serentak ke pool ukuran 20 | Antrean request tertampung rapi tanpa server crash |
| **TC-03** | **DB: Transaction Rollback Guard**| Gagal tulis pada tabel ke-3 dalam transaksi 4-tabel | Rollback membersihkan seluruh tabel (Zero Phantom) |
| **TC-04** | **DB: Partial Commit Isolation** | Jaringan putus di antara 2 perintah INSERT | State basis data kembali utuh ke checkpoint terakhir |
| **TC-05** | **DB: Corrupted Disk Block** | Simulasi 1 sektor data rusak | Checksum validator mengisolasi tabel tanpa merusak RS |
| **TC-06** | **DB: WAL Replay Segments** | Replay 50 segmen WAL delta pasca crash | 100% Rekam medis pulih dengan checksum valid |
| **TC-07** | **DB: Disk Full (99% Usage)** | Disk server penuh saat penulisan SOAP | Sistem menolak aman dengan `STORAGE_QUOTA_EXCEEDED` |
| **TC-08** | **DB: Index Corruption Rebuild** | Index pencarian pasien rusak | Rebuild index otomatis dalam $< 30\text{ detik}$ |
| **TC-09** | **DB: Master-Replica Failover** | Master DB mati mendadak | Replica beralih menjadi Master dalam $< 5\text{ detik}$ |
| **TC-10** | **DB: Transaction Deadlock Kill** | 2 transaksi saling mengunci baris encounter | Deadlock detector membatalkan 1 tx secara aman |
| **TC-11** | **Infra: API Server Crash** | Kill instance Node.js utama | Failover ke instance redundan tanpa error di browser |
| **TC-12** | **Infra: Background Worker Crash**| Worker pengirim alert SATUSEHAT mati | Worker supervisor me-restart otomatis & memproses antrean |
| **TC-13** | **Infra: Frontend Asset 404** | CDN asset terputus | Browser memuat fallback cache lokal ServiceWorker |
| **TC-14** | **Infra: Reverse Proxy Down** | Nginx gateway mengalami crash | Gateway sekunder mengambil alih rute traffic |
| **TC-15** | **Infra: Redis Cache Crash** | Redis cache mati mendadak | Sistem beralih ke basis data langsung tanpa downtime |
| **TC-16** | **Infra: Memory OOM Killer** | Server mendekati batas memori RAM | Garbage collector otomatis membebaskan cache transient |
| **TC-17** | **Infra: Graceful Draining** | Perintah deployment update versi | Menunggu transaksi in-flight selesai sebelum restart |
| **TC-18** | **Infra: Circuit Breaker Cascade** | 3 service eksternal mati bersamaan | Isolasi circuit breaker mencegah *cascading failure* |
| **TC-19** | **Infra: Microservice Isolation**| Service antrean display TV mati | Core rekam medis IGD tetap beroperasi normal 100% |
| **TC-20** | **Infra: SSL/TLS Certificate Expiry**| Sertifikat SSL kedaluwarsa | Fallback peringatan operasional otomatis |
| **TC-21** | **Net: Total 0% Connectivity** | Jaringan Wi-Fi RS putus total | Sistem beralih ke Local-First IndexedDB Mode |
| **TC-22** | **Net: 10% Packet Loss Spike** | Simulasi 10% paket data hilang | Mekanisme automatic retransmit memulihkan payload |
| **TC-23** | **Net: 30% Packet Loss Jitter** | Simulasi 30% paket data hilang | Chunked payload compression menjaga stabilitas |
| **TC-24** | **Net: 50% Packet Loss Extreme**| Simulasi 50% paket data hilang | UI menandai status `DEGRADED_NETWORK` tanpa crash |
| **TC-25** | **Net: High Latency (5.000 ms)**| Latensi jaringan melonjak ke 5 detik | Loading indicator asinkron tanpa memblokir form dokter |
| **TC-26** | **Net: Connection Flapping** | Jaringan hidup-mati setiap 3 detik | Debounce sync mencegah banjir koneksi ke server |
| **TC-27** | **Net: Out-of-Order Packet Delivery**| Event TTV ke-2 tiba sebelum Event ke-1 | Monotonic sequencing mengurutkan ulang secara presisi |
| **TC-28** | **Net: Duplicate Packet Storm** | Jaringan mengirimkan paket identik 10x | Deduplication filter membuang 9 paket redundan |
| **TC-29** | **Net: Split-Brain Conc. Mutation**| Tablet A & B edit pasien sama saat offline | Vector Clock menggabungkan data tanpa overwrite |
| **TC-30** | **Net: Split-Brain Medication Conflict**| Tablet A beri Inotropik, Tablet B beri Cairan | Kedua tindakan tercatat lengkap di timeline kronologis |
| **TC-31** | **Recovery: RPO $\le 5$ min Target**| Simulasi bencana data jam 10:05 | Data yang dipulihkan mencakup transaksi s.d. 10:00+ |
| **TC-32** | **Recovery: RTO $\le 15$ min Target**| Ukur total durasi deteksi s.d. aktif | Layanan pulih total dalam $11\text{ menit } (< 15\text{m})$ |
| **TC-33** | **Recovery: Base Snapshot Ingestion**| Muat snapshot dasar 1.000 pasien | Seluruh data master termuat lengkap dan terverifikasi |
| **TC-34** | **Recovery: WAL Delta Stream Replay**| Terapkan 1.200 order dari WAL stream | Delta transaksi tersinkronisasi tanpa ada order hilang |
| **TC-35** | **Recovery: 5 Invariant Post-Restore**| Verifikasi 5 Invarian Klinis pasca restore | Pasien, MRN, SEP, Stok, dan SHA-256 lulus 100% |
| **TC-36** | **Human: 02:13 AM Outage Drill**| Simulasi database mati pukul 02:13 WIB | Operator menerima notifikasi insiden dalam $< 1\text{ menit}$ |
| **TC-37** | **Human: Runbook SOP Execution**| Operator menjalankan SOP tanpa developer | Prosedur restore backup berhasil dijalankan mandiri |
| **TC-38** | **Human: Time to Detect (TTD)** | Ukur durasi insiden ➔ alarm berbunyi | TTD tercatat $35\text{ detik } (< 60\text{s})$ |
| **TC-39** | **Human: Time to Declare (TTDec)** | Ukur durasi konfirmasi insiden bencana | TTDec tercatat $80\text{ detik } (< 120\text{s})$ |
| **TC-40** | **Human: Time to Resume Clinical Flow**| Dokter kembali bisa input SOAP di IGD | Alur klinis pulih total dalam $12\text{ menit } (< 15\text{m})$ |
| **TC-41** | **Obs: Real Metric Threshold Trip**| Error rate melonjak $> 5\%$ | Metrik real-time memicu status `ALERT_CRITICAL` |
| **TC-42** | **Obs: Structured JSON Log Trace**| Log memuat correlation ID & error stack | Format log terurai sempurna untuk investigasi akar masalah |
| **TC-43** | **Obs: Human Notification Dispatch**| Alarm dikirim ke Telegram/SMS on-call | Pesan tersampaikan ke operator dalam $< 30\text{ detik}$ |
| **TC-44** | **Obs: Incident Acknowledgment Lock**| Operator menekan tombol Acknowledge | Status insiden beralih ke `INVESTIGATING` |
| **TC-45** | **Obs: Post-Mortem Incident Timeline**| Generator laporan kronologis insiden | Menghasilkan transkrip objektif akar penyebab insiden |
| **TC-46** | **Integration: SATUSEHAT Fail-Safe**| Endpoint SATUSEHAT Kemenkes error 500 | Transaksi lokal sukses, payload tersimpan di DLQ |
| **TC-47** | **Integration: BPJS VClaim Fail-Safe**| Server BPJS down saat SEP diterbitkan | SEP sementara diterbitkan offline dengan tanda darurat |
| **TC-48** | **Integration: PACS Server Timeout** | Server radiologi PACS tidak merespon | Catatan klinis tetap dapat disimpan tanpa gambar |
| **TC-49** | **Readiness: SRE Disaster Portal**| Tampilan status portal kesiapan bencana | Menampilkan RPO, RTO, status replikasi, dan status backup |
| **TC-50** | **End-to-End Master DR Drill** | Gabungan DB Crash + Split-Brain + 02:13 Drill | Sistem pulih 100%, data aman, 0 invarian terlanggar |

---

## 📌 5. KESIMPULAN & ARAH IMPLEMENTASI

Dokumen spesifikasi formal ini menetapkan kerangka kerja **Sprint 4B.13: Production Readiness Gate & Operational Disaster Recovery**. Implementasi kode akan dimulai setelah mendapatkan tinjauan dan persetujuan resmi dari Bos Robby.
