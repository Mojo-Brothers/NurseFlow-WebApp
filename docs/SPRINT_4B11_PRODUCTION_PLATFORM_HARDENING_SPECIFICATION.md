# 🚀 SPRINT 4B.11: PRODUCTION CLINICAL SAFETY & PLATFORM HARDENING
## Spesifikasi Formal Keamanan Platform, Ketahanan Transaksional, Observabilitas SRE & Matriks 50 Skenario Uji
**Versi Dokumen:** v1.0.0 (Formal Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Enterprise Hospital Information System (HIS) Production Hardening, Security, Reliability & SRE Framework  
**Otoritas:** Clinical Safety Council, Information Security (CISO), Chief Medical Informatics Officer (CMIO) & Lead Architect  
**Aksioma Inti:**  
> **"A brilliant clinical algorithm without production hardening is an unacceptable patient safety liability."**  
> **"Do not add more intelligence until the entire platform is battle-tested against extreme concurrent load, network drops, security attacks, and data corruption."**

---

## 🧭 1. EXECUTIVE SUMMARY & PERUBAHAN STRATEGI ARSITEKTUR (ARCHITECTURAL PIVOT)

### 1.1 Penutupan Rantai Klinis Inti (Fase 4B.1 s.d. 4B.10)
NurseFlow telah berhasil membangun dan menguji secara deterministik rangkaian closed-loop clinical safety loop:
$$\text{OBSERVE} \longrightarrow \text{TRAJECTORY} \longrightarrow \text{RISK} \longrightarrow \text{INTELLIGENCE} \longrightarrow \text{WORKSPACE} \longrightarrow \text{ACCOUNTABILITY} \longrightarrow \text{ESCALATION} \longrightarrow \text{EVIDENCE} \longrightarrow \text{REPLAY} \longrightarrow \text{GOVERNANCE}$$

### 1.2 Pivot Strategis: Stop Menambah "Otak", Perkuat Fondasi Produksi!
Menambahkan algoritma kecerdasan lebih lanjut pada titik ini hanya akan memperluas bidang risiko (*Clinical Risk Surface*) tanpa meningkatkan stabilitas dasar.

Sprint 4B.11 mengalihkan fokus secara terpadu menuju **Production Hardening**:
1. **P0 — Security & Access Hardening:** Proteksi injeksi, anti-IDOR, isolasi tenant multi-rumah sakit, sanitasi PHI, enkripsi data bergerak & istirahat.
2. **P0 — Transaction Reliability & Idempotency:** Proteksi *retry storm*, outbox event transactional consistency, mitigasi kegagalan parsial jaringan.
3. **P0 — Enterprise Observability & SRE:** Structured JSON logging, korelasi terdistribusi (`x-correlation-id`), metrik latensi pengiriman alert waktu nyata.
4. **P1 — Interoperability Gateway & Resilience:** Integrasi SATUSEHAT FHIR R4, BPJS VClaim, dan PACS dengan mekanisme *Circuit Breaker*.
5. **P1 — Disaster Recovery & High Concurrency:** Target RPO $\le 5$ menit, RTO $\le 15$ menit, dan uji beban 100 $\rightarrow$ 500 $\rightarrow$ 1.000 pasien tanpa kebocoran memori pada shift panjang 12 jam.

---

## 🔐 2. PILAR P0 — KEAMANAN & ISOLASI TENANT (ZERO-TRUST SECURITY)

```text
┌────────────────────────────────────────────────────────────────────────┐
│             NURSEFLOW ZERO-TRUST ACCESS HARDENING LAYER                │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Granular RBAC/ABAC Context   │ Role + Department + Active Shift Lock │
│ 2. Anti-IDOR Enforcement        │ Strict Patient-Encounter Bound Check │
│ 3. PHI Redaction Engine         │ Automatic Masking of NIK/Phone/MRN   │
│ 4. Session Hijack Defense       │ Cryptographic Nonce + User-Agent Lock│
│ 5. Audit Anti-Tampering         │ Immutable WORM SHA-256 Merkle Ledger │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Pencegahan Akses Lintas Konteks (Anti-IDOR)
Setiap permintaan pembacaan atau mutasi data medis pasien wajib melalui validasi 3 lapis:
1. **Identitas Staf & Sesi Aktif**: Staf terotentikasi dan memiliki peran klinis sah.
2. **Penugasan Pasien / Bangsal**: Pasien berada dalam unit atau penugasan tugas klinisi terkait.
3. **Status Keterkaitan Kunjungan (*Encounter State*)**: Kunjungan terminal/tutup terkunci secara permanen (*Read-Only*).

### 2.2 Redaksi Otomatis Data Identitas Pribadi (PHI Masking)
Log diagnostik dan telemetri sistem secara otomatis menyensor data NIK, nomor telepon, dan identitas langsung sebelum ditulis ke log agregator.

---

## ⚡ 3. PILAR P0 — RELIABILITAS TRANSAKSI & IDEMPOTENSI (TRANSACTIONAL INTEGRITY)

```text
┌────────────────────────────────────────────────────────────────────────┐
│             TRANSACTIONAL RELIABILITY & CIRCUIT BREAKER                │
├────────────────────────────────────────────────────────────────────────┤
│ INCOMING EVENT ➔ IDEMPOTENCY KEY CHECK ➔ OUTBOX TRANSACTION ➔ EVENTBUS │
│                       │ (Duplicate Dropped)       │ (Rollback on Err)  │
│                       ▼                           ▼                    │
│                 CACHE HIT 200 OK           DEAD-LETTER QUEUE (DLQ)     │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Idempotency Key Protocol**: Setiap pengiriman TTV, order laboratorium, dan konfirmasi alert membawa `idempotency-key` unik dengan TTL 24 jam untuk mencegah aksi ganda akibat fluktuasi jaringan Wi-Fi rumah sakit.
2. **Transactional Outbox Pattern**: Seluruh perubahan state klinis dan penerbitan event tersimpan dalam satu unit transaksi basis data terpadu sebelum disiarkan ke EventBus.
3. **Dead-Letter Queue (DLQ) & Circuit Breaker**: Jika integrasi eksternal (misal: Gateway SATUSEHAT) gagal berturut-turut $> 5$ kali, *circuit breaker* otomatis terbuka (*OPEN state*) dan mengalihkan event ke antrean DLQ lokal tanpa memblokir alur kerja dokter/perawat di bangsal.

---

## 📈 4. PILAR P0 — OBSERVABILITAS TERDISTRIBUSI & SRE (OBSERVABILITY SUITE)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                 ENTERPRISE OBSERVABILITY & TRACING                     │
├────────────────────────────────────────────────────────────────────────┤
│ • Correlation ID : x-correlation-id (UUIDv4) Lintas Seluruh Micro-Flow │
│ • Structured Log : JSON Format with timestamp, level, actor, errorStack│
│ • Health Probes  : /health/liveness, /health/readiness, /health/audit  │
│ • Alert Metrics  : Delivery Latency p95 < 250ms, Queue Depth < 50      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 5. PILAR P1 — INTEROPERABILITAS SATUSEHAT, BPJS & TERMINOLOGI

1. **Kepatuhan FHIR R4 Bundle**:
   - `Patient`, `Encounter`, `Observation`, `Condition`, `MedicationRequest`, `AuditEvent`.
2. **Circuit Breaker Gateway**:
   - Isolasi kegagalan BPJS VClaim / SATUSEHAT agar tidak memicu kegagalan sistem inti rekam medis lokal.
3. **Pemetaan Terminologi**:
   - ICD-10 (Diagnosis), ICD-9-CM (Tindakan/Prosedur), LOINC (Laboratorium), SNOMED CT (Temuan Klinis), KFA (Kamus Farmasi dan Alat Kesehatan Kemenkes).

---

## 💾 6. PILAR P1 — DISASTER RECOVERY, BACKUP & PENGUJIAN BEBAN

1. **Target Pemulihan Bencana**:
   - **RPO (Recovery Point Objective)** $\le 5$ menit.
   - **RTO (Recovery Time Objective)** $\le 15$ menit.
2. **Ketahanan Mode Offline (Local-First Journaling)**:
   - Jika koneksi terputus, sistem beroperasi lokal via IndexedDB dan melakukan sinkronisasi otomatis menggunakan *Vector Clock Resolution* saat koneksi pulih.
3. **Target Beban & Stabilitas**:
   - Concurrency: **100 $\rightarrow$ 500 $\rightarrow$ 1.000 Pasien Aktif Serentak** dengan latensi agregasi $< 300\text{ ms}$.
   - Stabilitas Sesi Panjang: Pembersihan memori (*Garbage Collection*) berkala untuk mencegah kebocoran RAM browser selama pergantian shift 12 jam.

---

## 🧪 7. MATRIKS 50 SKENARIO UJI VALIDASI HARDENING & STABILITAS (TC-01 s.d. TC-50)

| ID | Kategori Pengujian | Deskripsi Skenario & Input | Ekspektasi Verifikasi Hardening |
| :--- | :--- | :--- | :--- |
| **TC-01** | **RBAC Unauthorized Action** | Perawat mencoba meresepkan obat via API | Sistem menolak dengan `403 FORBIDDEN: ROLE_UNAUTHORIZED` |
| **TC-02** | **ABAC Terminal Encounter** | Dokter mencoba mengedit SOAP pada encounter `CLOSED` | Sistem memblokir aksi mutasi (`TERMINAL_ENCOUNTER_LOCKED`) |
| **TC-03** | **Anti-IDOR Patient Access** | User mencoba akses pasien beda unit tanpa relasi | Sistem menolak kueri (`CROSS_PATIENT_ACCESS_DENIED`) |
| **TC-04** | **PHI Auto-Redaction** | Logger mencatat event dengan data NIK & Telepon | String NIK/Telepon teredaksi otomatis (`NIK: 320101******0001`) |
| **TC-05** | **Session Hijack Prevention** | Request datang dengan token valid tapi User-Agent berubah | Sistem membatalkan sesi (`SESSION_ANOMALY_TERMINATED`) |
| **TC-06** | **XSS Payload Sanitization** | Input CPPT disisipi script `<script>alert(1)</script>` | Payload disanitasi bersih tanpa eksekusi script |
| **TC-07** | **SQL/NoSQL Injection Guard** | Kueri pencarian mengandung pattern `' OR '1'='1` | Sanitasi parameter mencegah bypass kueri basis data |
| **TC-08** | **Audit Log Anti-Tampering** | Upaya modifikasi langsung ke tabel riwayat audit | Sistem menolak modifikasi (WORM Read-Only Enforced) |
| **TC-09** | **Tenant Isolation Check** | Tenant RS A mencoba kueri master data Tenant RS B | Kueri terisolasi ketat pada tenant ID aktif |
| **TC-10** | **Rate Limiting Protection** | 100 request otentikasi dalam 1 detik | Sistem membatasi request dengan `429 TOO_MANY_REQUESTS` |
| **TC-11** | **Idempotent Vital Recording**| Kirim observasi TTV yang sama 2x dengan key sama | Request ke-2 mengembalikan respon cache tanpa duplikasi |
| **TC-12** | **Idempotent Medication Dispense**| Konfirmasi dispensing 2x berturut-turut | Stok obat terpotong tepat 1x tanpa pengurangan ganda |
| **TC-13** | **Transactional Outbox Rollback**| Database gagal saat simpan SOAP | Event bus tidak menerbitkan event palsu (*Zero Phantom Event*) |
| **TC-14** | **Circuit Breaker Activation** | Gateway SATUSEHAT timeout 5x beruntun | Circuit breaker beralih ke `OPEN`, pesan masuk DLQ |
| **TC-15** | **Circuit Breaker Auto-Recovery**| Gateway eksternal kembali stabil | Circuit breaker beralih ke `HALF-OPEN` ➔ `CLOSED` |
| **TC-16** | **Dead-Letter Queue Replay** | Replay 10 pesan tertunda dari antrean DLQ | Seluruh pesan berhasil diproses ulang tanpa hilang |
| **TC-17** | **Retry Storm Mitigation** | 50 klien offline tersambung bersamaan | Exponential backoff jitter mencegah server crash |
| **TC-18** | **Race Condition on Bed ADT** | 2 perawat menempatkan pasien ke Bed yang sama | Tepat 1 pasien berhasil, request ke-2 ditolak `BED_OCCUPIED` |
| **TC-19** | **Partial Network Drop in CPOE**| Jaringan putus di tengah order resep | Transaksi rollback utuh tanpa resep setengah tersimpan |
| **TC-20** | **Event Deduplication Buffer** | Menerima event duplicate dari broker pesan | Buffer membuang duplicate hash dalam jendela 60 detik |
| **TC-21** | **Structured JSON Logging** | Evaluasi format output log | Output memuat `timestamp`, `level`, `correlationId`, `message` |
| **TC-22** | **Correlation ID Propagation**| Request masuk diproses melintasi 4 service internal | Header `x-correlation-id` diteruskan identik ke seluruh service |
| **TC-23** | **Health Check Liveness Probe**| Panggilan ke endpoint `/health/liveness` | Mengembalikan `200 OK (status: ALIVE)` |
| **TC-24** | **Health Check Readiness Probe**| Panggilan ke endpoint `/health/readiness` | Mengembalikan kesiapan database, persistence, & memory |
| **TC-25** | **Alert Latency Telemetry** | Ukur durasi kalkulasi sinyal ➔ penerbitan alert | Latensi p95 tercatat stabil $< 250\text{ ms}$ |
| **TC-26** | **FHIR R4 Patient Mapping** | Konversi entitas Pasien internal ke FHIR R4 | Resource `Patient` valid mematuhi skema HL7 FHIR |
| **TC-27** | **FHIR R4 Observation Mapping**| Konversi TTV & Lab ke FHIR R4 `Observation` | Resource memuat kode LOINC dan nilai terstandar |
| **TC-28** | **FHIR R4 AuditEvent Mapping**| Konversi log tindakan ke FHIR `AuditEvent` | Resource memuat aktor, timestamp, tipe aksi, dan outcome |
| **TC-29** | **BPJS VClaim Fallback Mode** | Service BPJS error/down | Sistem beralih ke antrean klaim asinkron lokal |
| **TC-30** | **PACS DICOM Gateway Resilience**| Server PACS lambat merespon gambar | Thumbnail loading asinkron tanpa memblokir UI SOAP |
| **TC-31** | **Point-in-Time Backup Snapshot**| Trigger simulasi backup database | Snapshot state tersimpan lengkap dengan hash verifikasi |
| **TC-32** | **Database Disaster Recovery** | Simulasi pemulihan dari file backup | Seluruh data pasien & riwayat audit pulih 100% |
| **TC-33** | **IndexedDB Local Journaling**| Catat 20 tindakan saat browser offline | Seluruh tindakan tersimpan aman di local storage jurnal |
| **TC-34** | **Offline-to-Online Sync** | Koneksi internet terhubung kembali | 20 tindakan tersinkronisasi ke server tanpa konflik |
| **TC-35** | **Vector Clock Conflict Resolution**| Pasien diedit offline di Tablet A dan Tablet B | Aturan resolusi deterministik mempertahankan integritas data |
| **TC-36** | **Stress Load 100 Patients** | 100 pasien dimonitor bersamaan di command board | Render UI stabil 60 FPS, memory footprint terkontrol |
| **TC-37** | **Stress Load 500 Patients** | 500 pasien aktif dengan kalkulasi NEWS2 konstan | Waktu kalkulasi batch agregat $< 350\text{ ms}$ |
| **TC-38** | **Stress Load 1,000 Patients** | 1.000 pasien aktif dievaluasi trajektori | Waktu kalkulasi agregat $< 800\text{ ms}$, CPU stabil |
| **TC-39** | **12-Hour Session Memory Leak**| Simulasi 12 jam event polling (10.000 event) | Pertambahan memory RAM browser $< 15\text{ MB}$ (No leak) |
| **TC-40** | **EventBus Garbage Collection**| Unmount komponen workspace klinis | Event listener terlepas sempurna tanpa dangling references |
| **TC-41** | **Deterministic Invariant Engine**| Perubahan data observasi berulang kali | Seluruh rule deterministik menghasilkan output konsisten |
| **TC-42** | **Zero Regression 4B.4-4B.10** | Jalankan regression suite komprehensif | Seluruh skenario klinis, eskalasi, & replay tetap 100% lulus |
| **TC-43** | **Feature Flag Toggle Safety** | Matikan fitur eksperimental via feature flag | Fitur nonaktif bersih tanpa runtime crash |
| **TC-44** | **Canary Deployment Isolation**| Rilis versi canary pada bangsal percontohan | Bangsal lain tetap berjalan stabil pada versi reguler |
| **TC-45** | **Graceful Shutdown Protocol** | Server/Node menerima sinyal SIGTERM | Menyelesaikan transaksi in-flight sebelum termination |
| **TC-46** | **Payload Size Overflow Guard**| Unggah payload SOAP raksasa (> 10 MB) | Sistem menolak dengan `413 PAYLOAD_TOO_LARGE` |
| **TC-47** | **Secure Headers Verification**| Inspeksi response header HTTP | Header CSP, HSTS, X-Frame-Options terpasang ketat |
| **TC-48** | **Dependency Security Audit** | Scan package dependencies dari celah kritis | 0 Kerentanan tingkat kritis / High (Clean audit) |
| **TC-49** | **Multi-Tab Broadcast Channel**| Buka 3 tab browser untuk bangsal yang sama | Penugasan perawat tersinkron instan via BroadcastChannel |
| **TC-50** | **Full Production Hardening E2E**| Serangan simulasi + Lonjakan beban + Gangguan jaringan | Sistem bertahan tangguh, data aman, audit utuh 100% |

---

## 📌 8. KESIMPULAN

Dokumen ini merupakan cetak biru spesifikasi formal untuk **Sprint 4B.11: Production Clinical Safety & Platform Hardening**. Dokumen ini diajukan untuk ditinjau dan disahkan sebelum tahap implementasi dimulai.
