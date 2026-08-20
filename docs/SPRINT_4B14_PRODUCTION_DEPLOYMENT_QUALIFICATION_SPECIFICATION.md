# 🚀 SPRINT 4B.14: PRODUCTION DEPLOYMENT QUALIFICATION
## Spesifikasi Formal Kualifikasi Deployment Produksi, Keamanan Migrasi Skema, Rollback Tanpa Kehilangan Data & Ketahanan Integrasi Eksternal
**Versi Dokumen:** v1.0.0 (Production Deployment Qualification Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Enterprise Hospital Information System (HIS) Trust & Release Engineering Framework  
**Standar Kepatuhan:** Permenkes No. 24/2022 (RME), ISO 27001 (Information Security Management), Open Web Application Security Project (OWASP) Top 10  
**Aksioma Inti:**  
> **"Buktikan artefak yang sudah kita bangun benar-benar dapat di-deploy, dioperasikan, dimonitor, di-upgrade, di-rollback, dan dipulihkan."**  
> 🔒 **"Clinical Data Must Survive Application Lifecycle Events."** *(Restart, deploy, rollback, migration, failover, backup, restore, network loss, worker crash tidak boleh menyebabkan kehilangan atau korupsi data klinis).*

---

## 🧭 1. EXECUTIVE SUMMARY & TRUST & RELEASE ENGINEERING

Sprint 4B.14 memindahkan fokus pengujian dari simulasi runtime ke **Kualifikasi Lingkungan Deployment Produksi Nyata (*Production Deployment Qualification*)**.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│              ENTERPRISE DEPLOYMENT QUALIFICATION PIPELINE               │
├─────────────────────────────────────────────────────────────────────────┤
│ CLEAN REPO ➔ INSTALL ➔ MIGRATE ➔ SEED ➔ BUNDLE AUDIT ➔ SECRETS AUDIT   │
│                                  │                                      │
│                                  ▼                                      │
│ ROLLBACK VERIFICATION ➔ BACKUP DESTROY & RESTORE ➔ INTEGRATION RESILIENCE│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 2. ENAM GERBANG KUALIFIKASI DEPLOYMENT (6 DEPLOYMENT GATES)

### 2.1 Gate G1: Clean Environment Deployment Qualification
Memverifikasi bahwa aplikasi dapat dibangun dan dijalankan dari repository bersih tanpa bergantung pada state tersembunyi developer:
$$\text{Clean Repository} \longrightarrow \text{Install} \longrightarrow \text{Migrate} \longrightarrow \text{Seed} \longrightarrow \text{Build} \longrightarrow \text{Start} \longrightarrow \text{Health Probe 200 OK}$$

### 2.2 Gate G2: Configuration Integrity & Secret Leak Prevention
Audit ketat terhadap seluruh rahasia sistem:
* `.env`, private keys JWT, DB connection strings, token SATUSEHAT/BPJS/PACS.
* **Invariant:** 0 Rahasia bocor ke bundle frontend Vite, console log, error trace, atau git history.

### 2.3 Gate G3: Migration Safety & Rollback Atomicity
* Uji skema migrasi maju (*Forward Migration*) dan mundur (*Rollback Migration*).
* Kegagalan migrasi di tengah jalan harus memicu rollback bersih tanpa meninggalkan skema setengah jadi (*Zero Schema Inconsistency*).

### 2.4 Gate G4: Deployment Rollback & Zero Clinical Data Loss
* Skenario: Versi N $\rightarrow$ Deploy Versi N+1 $\rightarrow$ Terdeteksi regresi kritis $\rightarrow$ Rollback ke Versi N.
* **Invariant Mutlak:** Seluruh transaksi dan catatan rekam medis yang dibuat selama Versi N+1 aktif **tetap utuh, konsisten, dan dapat dibaca oleh Versi N pasca-rollback**.

### 2.5 Gate G5: Backup Destruction & Restore Reality Test
* Bukan sekadar memeriksa keberadaan file backup.
* Jalur pengujian nyata:
  $$\text{Backup Snapshot} \longrightarrow \text{Destroy Database} \longrightarrow \text{Restore} \longrightarrow \text{Verify 5 Invariants} \longrightarrow \text{Replay Audit}$$

### 2.6 Gate G6: External Integration Degradation & Circuit Resilience
* Simulasi kegagalan gateway eksternal (SATUSEHAT, BPJS VClaim, PACS Radiologi):
  $$\text{Gateway Online} \longrightarrow \text{Timeout} \longrightarrow \text{Error 500} \longrightarrow \text{Rate Limit 429} \longrightarrow \text{Fail-Safe Fallback}$$
* **Prinsip Utama:** **Kegagalan integrasi eksternal tidak boleh menghentikan pelayanan klinis dokter/perawat.**

---

## 🔒 3. MATRIKS INVARIANT SIKLUS HIDUP APLIKASI (APPLICATION LIFECYCLE INVARIANTS)

| Lifecycle Event | Invarian Keamanan Data Klinis | Target Toleransi |
| :--- | :--- | :---: |
| **Server Restart** | Zero lost in-flight clinical events | **0 Lost** |
| **Version Upgrade** | Schema forward-compatible, zero clinical field corruption | **0 Corrupt** |
| **Version Rollback** | Transaksi saat versi baru tetap terbaca di versi lama | **0 Lost** |
| **Migration Failure** | Clean rollback, zero half-baked tables | **0 Phantom** |
| **Database Restore** | Merkle audit root & record count identik bit-for-bit | **0 Divergence** |
| **Secret Scanning** | Zero API keys / secrets in client-side bundle | **0 Leakage** |

---

## 🧪 4. MATRIKS 50 SKENARIO UJI DEPLOYMENT QUALIFICATION (TC-01 s.d. TC-50)

| ID | Gate Pengujian | Skenario Uji Deployment & Input | Kriteria Keberhasilan |
| :--- | :--- | :--- | :--- |
| **TC-01** | **G1: Clean Install** | Fresh install `npm ci` tanpa cache lokal | Dependency tree bersih 100% tanpa conflict |
| **TC-02** | **G1: DB Migration Initial** | Eksekusi migrasi skema awal ke basis data bersih | Seluruh tabel rekam medis terbuat dengan index valid |
| **TC-03** | **G1: Master Seed Data** | Seed data master obat, bangsal, ICD-10, staf | Master data termuat lengkap dengan relasi valid |
| **TC-04** | **G1: Production Build Bundle**| Eksekusi `vite build` environment produksi | Bundle terkompilasi 0 error dengan code-splitting |
| **TC-05** | **G1: Health Check Probe** | Request `/api/health` dan `/api/ready` | HTTP 200 OK dengan status `DATABASE_CONNECTED` |
| **TC-06** | **G1: Node Environment Guard** | Validasi `NODE_ENV=production` | Debugging flags dinonaktifkan secara otomatis |
| **TC-07** | **G1: Port Binding Conflict** | Port 3000 terpakai proses lain | Error message deskriptif tanpa crash memori |
| **TC-08** | **G1: Missing Env Var Error** | Variabel `DATABASE_URL` sengaja dikosongkan | Proses startup gagal dini (*Fail-Fast*) dengan error jelas |
| **TC-09** | **G1: Static Asset Compression**| Verifikasi file Gzip/Brotli pada asset dist | Asset terkompresi $>60\%$ menghemat bandwidth |
| **TC-10** | **G1: SPA Routing Fallback** | Akses direct URL `/doctor/workspace` | `index.html` fallback merespon dengan benar |
| **TC-11** | **G2: Client Bundle Secrets Scan**| Scan seluruh file `.js` pada folder `dist/` | 0 JWT private keys, DB passwords, atau API secrets |
| **TC-12** | **G2: Telemetry Redaction Scan**| Analisis output structured logs di stdout | Seluruh NIK, no telepon, dan token ter-masking otomatis |
| **TC-13** | **G2: Error Stack Sanitization**| Trigger unhandled exception pada endpoint API | Error stack trace tidak dibocorkan ke client |
| **TC-14** | **G2: Git Ignore Enforcement** | Verifikasi file `.env` dan `*.pem` dalam `.gitignore`| File kredensial terblokir dari commit repository |
| **TC-15** | **G2: Secure Cookie Flags** | Verifikasi atribut session cookies | Flag `HttpOnly`, `Secure`, `SameSite=Strict` aktif |
| **TC-16** | **G2: CORS Origin Strictness** | Request dari origin tidak terdaftar | Ditolak dengan `CORS_ORIGIN_DENIED` |
| **TC-17** | **G2: CSP Header Compliance** | Header `Content-Security-Policy` | Mencegah inline scripts dan objek tidak terpercaya |
| **TC-18** | **G2: Secret Rotation Grace** | Rotasi signing key JWT dengan 2 key aktif | Token lama tetap valid dalam masa transisi 1 jam |
| **TC-19** | **G2: FHIR Credential Guard** | Kredensial SATUSEHAT disimpan di vault aman | Kredensial tidak pernah tertulis di localStorage |
| **TC-20** | **G2: BPJS Secret Guard** | Secret key VClaim diisolasi di backend | Frontend hanya berkomunikasi via proxy internal |
| **TC-21** | **G3: Forward Migration** | Terapkan migrasi skema tabel baru V2 | Data eksisting di V1 tetap utuh dan ter-mapping |
| **TC-22** | **G3: Migration Rollback** | Eksekusi `migrate:down` ke skema V1 | Skema kembali ke V1 tanpa merusak konsistensi data |
| **TC-23** | **G3: Mid-Migration Crash** | Simulasikan error SQL di langkah 3 dari 5 migrasi | Rollback atomik membersihkan tabel sementara |
| **TC-24** | **G3: Zero Downtime Migration** | Jalankan migrasi kolom baru saat kueri aktif | Kueri baca/tulis tetap berjalan tanpa lock tabel total |
| **TC-25** | **G3: Backward-Compatible View**| Aplikasi versi lama mengakses skema hasil migrasi | Backward-compatible views mencegah error kueri |
| **TC-26** | **G4: Blue-Green Deployment** | Beralih traffic dari Blue (V1) ke Green (V2) | Traffic beralih mulus tanpa ada request 502/504 |
| **TC-27** | **G4: Deployment Rollback Flow**| Rollback dari Green (V2) kembali ke Blue (V1) | Transaksi yang dicatat saat V2 tetap dapat dibaca V1 |
| **TC-28** | **G4: Canary 10% Traffic Rollout**| Alokasikan 10% traffic ke instance versi baru | 90% traffic tetap di versi stabil dengan session stickiness |
| **TC-29** | **G4: In-Flight Request Draining**| Graceful shutdown menunggu koneksi aktif selesai | 0 Transaksi CPOE terputus saat deploy |
| **TC-30** | **G4: Version Header Assertion**| Response HTTP memuat header `X-App-Version` | Memudahkan audit forensik versi saat insiden |
| **TC-31** | **G5: Snapshot Creation at T0** | Eksekusi full snapshot basis data 1.000 pasien | File snapshot terenkripsi dan diverifikasi SHA-256 |
| **TC-32** | **G5: Test DB Complete Wipe** | Hancurkan total database lokal (*Drop All Tables*) | Database kosong 0 tabel |
| **TC-33** | **G5: Restore From Snapshot** | Pulihkan database dari snapshot T0 | Seluruh tabel dan 1.000 pasien pulih 100% |
| **TC-34** | **G5: 5 Invariants Post-Restore**| Verifikasi 5 Invarian Klinis pada data hasil restore | Pasien, MRN, SEP, Stok, dan Hash valid 100% |
| **TC-35** | **G5: Audit Replay Verification**| Eksekusi replay audit pada database hasil restore | Timeline rekonsiliasi menghasilkan keputusan yang sama |
| **TC-36** | **G6: SATUSEHAT 500 Timeout** | Endpoint SATUSEHAT Kemenkes timeout 30s | Request lokal sukses, pesan masuk antrean retry DLQ |
| **TC-37** | **G6: SATUSEHAT Rate Limit 429**| Endpoint Kemenkes merespon 429 Too Many Requests | Backoff exponential menunda pengiriman otomatis |
| **TC-38** | **G6: BPJS VClaim Server Down** | Gateway VClaim BPJS merespon 503 Service Unavailable | Pasien tetap dapat dilayani dengan SEP provisional |
| **TC-39** | **G6: PACS DICOM Server Drop** | Server radiologi tidak merespon pengunduhan gambar | Resume klinis dokter tersimpan normal tanpa gambar |
| **TC-40** | **G6: Reconnection & Drain DLQ**| Gateway eksternal kembali online | Worker memproses seluruh antrean DLQ secara teratur |
| **TC-41** | **SRE: Readiness Dashboard HUD** | Tampilan status portal deployment qualification | Menampilkan status migrasi, secrets scan, dan bundle size |
| **TC-42** | **SRE: Synthetic Health Monitor**| Ping berkala ke seluruh subsistem kritis | Status kesehatan subsistem terpantau hijau |
| **TC-43** | **SRE: Memory Leak 12h Session** | Eksekusi kueri berulang 500x pada instance produksi| Pertambahan memori RAM $< 25\text{ MB}$ |
| **TC-44** | **SRE: CPU Spike Handling** | Beban komputasi analitik klinis 100% CPU | Penjadwal memprioritaskan antrean rekam medis gawat darurat |
| **TC-45** | **SRE: Structured Log Output** | Log JSON standar dengan correlation ID | Terintegrasi mulus dengan Elastic/Grafana Loki |
| **TC-46** | **E2E: Full Lifecycle Disaster** | Kombinasi Deploy V2 ➔ Rollback V1 ➔ SATUSEHAT Down | Pelayanan klinis 100% aman tanpa kehilangan data |
| **TC-47** | **E2E: Zero Ghost Patient** | Validasi ketiadaan pasien hantu pasca rollback | Pasien terverifikasi konsisten dengan data registrasi |
| **TC-48** | **E2E: Pharmacy Stock Consistency**| Validasi stok obat pasca migrasi skema baru | Stok fisik dan stok sistem tetap akurat |
| **TC-49** | **E2E: BSrE Signature Integrity**| Verifikasi tanda tangan digital pasca restore DB | Hash sertifikat digital dokter tetap valid dan terverifikasi |
| **TC-50** | **Master Deployment Qualification**| Eksekusi seluruh 6 Gerbang Kualifikasi (G1 s.d. G6) | 100% Gerbang Lulus dengan Zero Invariant Corruption |

---

## 📌 5. KESIMPULAN ARSITEKTURAL

Dokumen spesifikasi formal ini menetapkan panduan eksekusi **Sprint 4B.14: Production Deployment Qualification**. Implementasi kode dan pengujian akan dimulai setelah mendapatkan tinjauan dan persetujuan resmi dari Bos Robby.
