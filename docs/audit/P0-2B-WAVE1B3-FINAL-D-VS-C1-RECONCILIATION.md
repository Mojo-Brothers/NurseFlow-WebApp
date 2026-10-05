# P0-2B WAVE 1B.3 — FINAL D vs C1 DECISION RECONCILIATION

**Date:** 2026-10-05  
**Governance Mode:** READ-ONLY — FINAL CANDIDATE DECISION RECONCILIATION  
**Repository HEAD:** `203fcaf1bafbd3894d666f3193dfacaab6a848d6`  
**Active Branch:** `feature/security-foundation-wave1a10`  
**Target Candidates:** Candidate D (Master Patient / Admission) vs Candidate C1 (CPOE Orders & Safety)  
**Implementation Started:** NO (Strict Read-Only)

---

## 1. Baseline Verification

Pemeriksaan status repositori pada awal sesi rekonsiliasi:
- **`git status --short`:** Clean (zero uncommitted files).
- **`git rev-parse HEAD`:** `203fcaf1bafbd3894d666f3193dfacaab6a848d6`.
- **`git log -3 --oneline`:**
  - `203fcaf audit(p02b): adversarially validate next-wave decision`
  - `51852e3 audit(p02b): select next wave candidate from evidence`
  - `e5d7ba5 audit(p02b): finalize C2 closure evidence`
- **Regression Suite Baseline:** **129/129 PASS** (81/81 Canonical Baseline + 48/48 C2 Foundation).
- **Remaining System Stage-0 Unsafe Call Sites:** **134** (setelah reduksi 11 CS dari C2).

---

## 2. Canonical FK Evidence (Catalog Ground Truth)

Berdasarkan kueri sistem langsung pada `pg_catalog.pg_constraint` di basis data laboratorium `nurseflow_security_lab` (PostgreSQL 16), bukti relasional kanonik untuk `master_patients` (Candidate D) dan `clinical_orders` (Candidate C1) adalah sebagai berikut:

### Canonical Relational Metrics untuk `master_patients` (Candidate D):
- **Unique FK constraints:** **68 constraints**
- **Unique referring tables:** **63 tabel unik**
- **FK column pairs:** **73 pasang kolom**
- **`ON DELETE CASCADE`:** **0 constraints**
- **`ON DELETE RESTRICT`:** **47 constraints**
- **`ON DELETE NO ACTION`:** **21 constraints**
- **`ON DELETE SET NULL`:** **0 constraints**
- **`ON DELETE SET DEFAULT`:** **0 constraints**
- **Composite FK constraints:** **5 constraints** (`(patient_id, tenant_id) REFERENCES master_patients(id, tenant_id)`):
  1. `fk_longitudinal_care_plans_pat_tenant`
  2. `fk_medication_dispense_allocations_pat_tenant`
  3. `fk_medication_emar_administrations_pat_tenant`
  4. `fk_patient_split_invoices_pat_tenant`
  5. `fk_physician_diagnostic_interpretations_pat_tenant`

### Canonical Relational Metrics untuk `clinical_orders` (Candidate C1):
- **Unique inbound FK constraints:** **17 constraints**
- **Unique referring tables:** **13 tabel unik** (`blood_crossmatch_tests`, `cpoe_order_items`, `diagnostic_result_notifications`, `diagnostic_secondary_actions`, `laboratory_orders`, `laboratory_panic_alerts`, `laboratory_test_results`, `medication_dispense_allocations`, `medication_emar_administrations`, `medication_orders` [2 FK], `prescription_dispense_records`, `radiology_critical_finding_alerts`, `radiology_orders` [2 FK], `radiology_reports`, `radiology_studies`).
- **Outbound FK constraints:** **4 constraints** (`encounters`, `episodes_of_care`, `master_patients`, `tenant_organizations`).

---

## 3. Important Correction to Previous Decision Metrics

1. **Pembaruan Denominator Relasional:**
   - Dokumen keputusan terdahulu (`51852e3`) menggunakan angka statis `65 inbound FK` dan menghasilkan skor $D = 0.888$.
   - Angka statis tersebut tidak memperhitungkan penghapusan constraint pada Migration 075:34 (`break_glass_audit_ledger`) dan ekspansi dinamis Migration 078 (5 composite FKs).
   - Nilai kanonik katalog saat ini adalah **68 unique constraints**. Denominator $R_{\text{impact}}$ diperbarui menjadi **68**.
2. **Koreksi Dampak Relasional Candidate C1:**
   - Dokumen terdahulu hanya menghitung 2 inbound FK untuk C1 (hanya sub-tabel lokal CPOE).
   - Katalog PostgreSQL membuktikan bahwa `clinical_orders` memiliki **17 inbound FK constraints** dari 13 tabel klinis di seluruh rumah sakit. Normalisasi $R_{\text{impact}}$ untuk C1 meningkat dari $2/65 = 0.0308$ menjadi $17/68 = \mathbf{0.2500}$.

---

## 4. Deconstruction of Invalid D Claims

Audit adversarial membuktikan bahwa tiga klaim awal yang mendukung Candidate D tidak dapat dipertahankan dalam bentuk aslinya:

1. **Klaim 1: "master_patients is the root of the entire clinical model"**
   - *Status:* **INVALID AS AN ABSOLUTE ARCHITECTURAL FACT**.
   - *Koreksi Faktual:* `master_patients` memiliki derajat sentralitas masuk (*in-degree*) tertinggi pada data pasien (63 tabel), tetapi **bukan entitas akar untuk seluruh model HIS**. Domain non-pasien seperti formularium farmasi, siklus sterilisasi CSSD, mesin aturan CDSS, manajemen fasilitas/bed, dan infrastruktur PKI/otentikasi beroperasi sepenuhnya independen dari `master_patients`.
2. **Klaim 2: "RLS on master_patients closes downstream patient-data leakage"**
   - *Status:* **UNSUPPORTED / TECHNICALLY INVALID**.
   - *Koreksi Faktual:* Semantik PostgreSQL RLS bersifat *strictly per-table*. Menegakkan RLS pada `master_patients` **sama sekali tidak memfilter** kueri `SELECT` langsung pada tabel anak yang memiliki `relrowsecurity = false`. Kueri langsung ke tabel anak tetap mengekspos data lintas-tenant kecuali tabel anak tersebut memiliki kebijakan RLS mandiri.
3. **Klaim 3: "D has the smallest blast radius"**
   - *Status:* **MISLEADING / CONFLATED**.
   - *Koreksi Faktual:* Candidate D memiliki **Code Surface terkecil** (15 DB calls, 3 rute), namun memiliki **Relational Dependency Surface terbesar di seluruh basis data** (68 inbound constraints, 63 tabel anak). Cacat logika atau penguncian pada pendaftaran D berdampak luas pada seluruh proses penerimaan pasien rumah sakit.

---

## 5. D vs C1 — Factual Side-by-Side Comparison

| Dimensi Evaluasi | Candidate D (Master Patient) | Candidate C1 (CPOE Orders) | Klasifikasi Bukti | Sumber Bukti Repositori |
|---|:---:|:---:|:---:|---|
| **Stage-0 Unsafe Call Sites** | **10** (CS 107-113, L31, L100, L170) | **16** (CS 59-71, CS 143-145) | `[FACT]` | AST Scan Stage-0 Inventory |
| **Stage-0 DML Writes** | **3** | **4** | `[FACT]` | SQL write analysis |
| **Stage-0 Query Reads** | **7** | **12** | `[FACT]` | SQL read analysis |
| **Active Stage-0 Routes** | **3** (100%) | **6** (66.7%) | `[FACT]` | Express route definitions |
| **Total Module Routes** | **3** | **9** | `[FACT]` | Express route definitions |
| **Static DB Call Sites** | **15** (1W / 14R) | **25** (6W / 19R) | `[DERIVED]` | Static AST query traversal |
| **Shared Call Sites** | **0** | **1** (CS 71 pada `/cpoe` dan `/orders`) | `[FACT]` | Route call-graph mapping |
| **Tabel Stage-0 Terlibat** | **1** (`master_patients`) | **3** (`clinical_orders`, audit, safety) | `[FACT]` | Schema mapping |
| **Inbound FK Constraints** | **68** | **17** | `[FACT]` | `pg_catalog.pg_constraint` |
| **Referring Tables** | **63** | **13** | `[FACT]` | `pg_catalog.pg_constraint` |
| **Cross-Service Transaction** | **TIDAK** (Local single-service) | **YA** (CPOE $\to$ Safety Authorization) | `[FACT]` | `cpoeApplication.service.js:401` |
| **Legacy Transaction Manager** | **TIDAK** (`pool.connect()` langsung) | **YA** (`transactionManager.js`) | `[FACT]` | `cpoeApplication.service.js:128` |
| **Existing UoW Readiness** | **TIDAK** (Perlu refactor UoW) | **TIDAK** (Perlu refactor UoW) | `[FACT]` | Service transaction inspection |
| **Real PG RLS Evidence** | **0%** (0 / 11 suites) | **0%** (0 / 3 suites) | `[FACT]` | Directory `tests/` inspection |
| **Durability Evidence Eksisting** | **YA** (`verticalSlice01PatientDurability`) | **YA** (`verticalSlice06AUniversalCpoeDurability`) | `[FACT]` | Filesystem test verification |
| **Prasyarat Konkret Implementasi** | **6 items** (`D-PRE-1` s.d. `D-PRE-6`) | **4 items** (`C1-PRE-1` s.d. `C1-PRE-4`) | `[FACT]` | Gap analysis terhadap C2 |

---

## 6. Security-Debt Priority Analysis

Dalam mandat gelombang fondasi keamanan (*Security Foundation Wave*), prioritas utama adalah meniadakan titik pemanggilan tidak aman (*Stage-0 Unsafe Call Sites*):

- **Baseline Saat Ini:** **134 Stage-0 Unsafe Call Sites** tersisa di seluruh sistem.
- **Reduksi oleh Candidate D:**
  - Call sites tereliminasi: **10 Call Sites**
  - Sisa call sites di sistem: $134 - 10 = \mathbf{124}$
  - Persentase utang keamanan tereliminasi: $\frac{10}{134} = \mathbf{7.46\%}$
- **Reduksi oleh Candidate C1:**
  - Call sites tereliminasi: **16 Call Sites**
  - Sisa call sites di sistem: $134 - 16 = \mathbf{118}$
  - Persentase utang keamanan tereliminasi: $\frac{16}{134} = \mathbf{11.94\%}$

> **Komparasi Utang Keamanan:** Candidate C1 memberikan **reduksi utang keamanan 60% lebih besar** dibandingkan Candidate D (+6 call sites aman).

---

## 7. C2 Continuity Analysis

Evaluasi apakah Candidate C1 secara sah dapat menggunakan preseden dan artefak arsitektur dari Candidate C2 yang baru saja ditutup:

| Komponen / Permukaan | Klasifikasi Hubungan | Bukti Teknis Repositori |
|---|:---:|---|
| **Tabel `clinical_orders`** | **`DIRECT SHARED DATA SURFACE`** | Pada C2, CS 82 diselesaikan dengan menambahkan `tenant_id` pada insert `clinical_orders`, dan diverifikasi pada `tests/p02b_wave1b2_c2_real_rls_integration.test.js: C2-RLS-05`. Tabel ini adalah entitas primer C1 (`cpoeApplication.service.js`). |
| **Tabel `universal_audit_logs`** | **`DIRECT SHARED DATA SURFACE`** | Kedua modul menulis catatan audit WORM dengan hash signature terenkripsi di bawah konteks tenant UoW. |
| **Tenant Context & L1 Gate** | **`ARCHITECTURAL PRECEDENT`** | Pola gerbang `isValidUuid` fail-closed 403 dari C2 dapat direplikasi 1-to-1 pada rute C1. |
| **Pola `withUnitOfWork`** | **`ARCHITECTURAL PRECEDENT`** | C2 membuktikan pembungkusan transaksi multi-tabel (`encounters`, `physician_diagnostic_interpretations`, `clinical_orders`) ke dalam UoW. C1 mengikuti struktur yang identik. |
| **PostgreSQL RLS Fixtures** | **`ARCHITECTURAL PRECEDENT`** | Fixture tenant ganda (`TENANT_A`, `TENANT_B`), aktor klinis, dan mitigasi koneksi reuse (`DISCARD ALL`, PID check) dapat langsung diwarisi oleh test C1. |

> **Kesimpulan Kontinuitas:** Candidate C1 memiliki **kontinuitas data langsung (*Direct Shared Data Surface*)** dan **momentum arsitektural terkuat** terhadap C2. Sebaliknya, Candidate D memiliki **`NO DIRECT RELATION`** terhadap tabel C2 (`clinical_orders`), mewajibkan pembentukan fixture baru dari awal.

---

## 8. D Relational Risk: Dekopling Permukaan

Untuk Candidate D, dimensi risiko harus dipisahkan secara tegas:

1. **Code Surface (Sangat Ringkas):** 15 pemanggilan DB statis, 3 rute (100% aktif), 1 service, 1 controller. Risiko regresi kode langsung sangat rendah.
2. **Dependency Surface (Masif):** 68 constraint foreign key masuk dari 63 tabel anak. Jika kebijakan RLS pada `master_patients` mengalami kesalahan konfigurasi (misal: *false negative* pada isolasi baris), pembacaan join dan referensi foreign key di seluruh 63 modul hilir akan gagal (*cascading failure*).
3. **Data Centrality (Tinggi):** `master_patients` adalah repositori identitas pasien rumah sakit. Pengamanan D menghentikan auto-provisioning tak terkontrol dari `appointment.controller.js:123` (`CS 3`).
4. **Security Debt (Sedang):** Mengeliminasi 10 titik tidak aman (7.46% sistem).

---

## 9. C1 Transactional Risk: Utang vs Blocker

Pemeriksaan mendalam terhadap kompleksitas transaksional Candidate C1:

1. **`transactionManager.js`:**
   - *Status:* **EXISTING ARCHITECTURAL DEBT (BUKAN BLOCKER)**.
   - *Analisis:* Modul ini hanyalah wrapper lama di atas `pool.connect()`. Menggantinya dengan `withUnitOfWork({ tenantId, actor }, async (tx) => { ... })` adalah refactoring 1-to-1 tanpa mengubah logika ordonansi dokter.
2. **Client Passing ke `safetyAuthorization.service.js`:**
   - *Status:* **EXISTING ARCHITECTURAL DEBT (BUKAN BLOCKER)**.
   - *Analisis:* Fungsi `safetyAuthorizationService.verifyAndConsumeTransactional(client, ...)` sudah dirancang menerima parameter `client` transaksi yang memiliki method `.query()`. Dalam `withUnitOfWork`, objek `tx` diteruskan secara alami sehingga konsumsi token SHA-256 dan pembatalan order dieksekusi atomik dalam transaksi yang sama.
3. **Shared Call Site CS 71:**
   - *Status:* **EXISTING ARCHITECTURAL DEBT (BUKAN BLOCKER)**.
   - *Analisis:* Fungsi `listOrders` dipanggil oleh `/api/v1/orders/cpoe` dan `/api/v1/orders`. Memasang konteks tenant pada controller mengamankan kedua endpoint sekaligus.
4. **Transaction Boundary & Rollback:**
   - C1 memiliki batas rollback yang bersih. Jika otorisasi token safety gagal, seluruh transaksi di-rollback tanpa mutasi parsial pada `clinical_orders` maupun `safety_decision_registry`.

---

## 10. Score Reconciliation & Sensitivity Analysis

### Formula Kuantitatif Terkalibrasi:
$$\text{Score} = w_D \cdot D_{\text{stage0}} + w_B \cdot B_{\text{radius}} + w_S \cdot S_{\text{readiness}} + w_T \cdot T_{\text{boundary}} + w_R \cdot R_{\text{impact}}$$

**Nilai Ternormalisasi Input:**
- $D_{\text{stage0}}$: $D = 10/16 = 0.6250$; $C1 = 16/16 = 1.0000$
- $B_{\text{radius}}$: $D = 1 - (15/80) = 0.8125$; $C1 = 1 - (25/80) = 0.6875$
- $S_{\text{readiness}}$: $D = 1.0000$; $C1 = 0.5000$ (penalti legacy manager)
- $T_{\text{boundary}}$: $D = 1.0000$; $C1 = 0.5000$ (penalti client-passing)
- $R_{\text{impact}}$: $D = 68/68 = 1.0000$; $C1 = 17/68 = 0.2500$ (17 inbound constraints riil di katalog)

### Uji Sensitivitas Bobot Multi-Skenario:

| Skenario Pengujian | Bobot ($w_D, w_B, w_S, w_T, w_R$) | Skor D | Skor C1 | Pemenang Skenario |
|---|---|:---:|:---:|:---:|
| **Baseline 20% Equal** | $(0.20, 0.20, 0.20, 0.20, 0.20)$ | **0.8875** | **0.5875** | **D (+0.3000)** |
| **Sensitivitas 1 (Debt 25%)** | $(0.25, 0.25, 0.20, 0.20, 0.10)$ | **0.8594** | **0.6469** | **D (+0.2125)** |
| **Sensitivitas 2 (Debt 40%)** | $(0.40, 0.25, 0.15, 0.15, 0.05)$ | **0.8031** | **0.7344** | **D (+0.0687)** |
| **Sensitivitas 3 (Debt 50%)** | $(0.50, 0.20, 0.15, 0.15, 0.00)$ | **0.7750** | **0.7875** | **C1 (+0.0125)** |
| **Sensitivitas 4 (Debt 60%)** | $(0.60, 0.15, 0.15, 0.10, 0.00)$ | **0.7469** | **0.8281** | **C1 (+0.0812)** |
| **Sensitivitas 5 (Debt 75%)** | $(0.75, 0.10, 0.075, 0.075, 0.00)$ | **0.7000** | **0.8937** | **C1 (+0.1937)** |

> **Klasifikasi Skoring:** **`WEIGHT-SENSITIVE`**.  
> Tidak ada kandidat yang "unggul secara objektif mutlak". Pemilihan kandidat bergantung pada apakah arsitektur memprioritaskan reduksi utang keamanan langsung ($w_D \ge 0.50 \to \text{C1}$) atau kesederhanaan batas transaksi lokal ($w_D \le 0.40 \to \text{D}$).

---

## 11. Security-Foundation Preference Rule Evaluation

Mengevaluasi kedua kandidat berdasarkan 5 aturan preferensi gelombang fondasi keamanan:

1. **Tenant Isolation:**
   - *D:* Mengisolasi identitas master pasien; menutup pintu masuk mutasi ilegal dari antrean/booking online (`appointment.controller.js:123`).
   - *C1:* Mengisolasi ordonansi medis dokter; mencegah akses lintas-tenant terhadap instruksi klinis dan token pembatalan berisiko tinggi.
   - *Evaluasi:* **Seimbang (Keduanya krusial)**.
2. **Stage-0 Reduction:**
   - *D:* 10 call sites (7.46%).
   - *C1:* 16 call sites (11.94%).
   - *Evaluasi:* **C1 Menang Mutlak (+60% reduksi utang)**.
3. **Real PostgreSQL Evidence & C2 Continuity:**
   - *D:* 0% bukti riil, tabel baru tanpa preseden C2.
   - *C1:* Memiliki preseden data langsung pada `clinical_orders` yang sudah ber-RLS di C2 (`C2-RLS-05`).
   - *Evaluasi:* **C1 Menang Mutlak**.
4. **Transaction Correctness:**
   - *D:* Transaksi lokal tunggal, minim kompleksitas.
   - *C1:* Transaksi lintas layanan (CPOE $\to$ Safety Authorization), memerlukan passing context UoW yang cermat.
   - *Evaluasi:* **D Menang**.
5. **Regression Containment:**
   - *D:* 15 titik pemanggilan kode, tetapi terhubung ke 63 tabel anak.
   - *C1:* 25 titik pemanggilan kode, 1 shared call site, terhubung ke 13 tabel anak.
   - *Evaluasi:* **Seimbang**.

---

## 12. Detailed Candidate Profiles

### Candidate D — Master Patient / Admission
- **Strengths:**
  1. *Sentralitas Identitas Pasien:* Entitas rujukan utama untuk seluruh data rekam medis pasien di rumah sakit.
  2. *Isolasi Transaksi Bersih:* Transaksi pendaftaran pasien berada dalam satu service (`patientApplication.service.js`) tanpa ketergantungan lintas-layanan.
  3. *Mitigasi Auto-Provisioning Ilegal:* Menutup celah pendaftaran pasien fail-open dengan `DEFAULT_TENANT_ID` pada modul antrean (`appointment.controller.js:123`).
  4. *Permukaan Kode Sangat Ringkas:* Hanya 15 DB call sites dan 3 rute Express.
- **Weaknesses:**
  1. *Reduksi Utang Keamanan Lebih Rendah:* Hanya mengeliminasi 10 Stage-0 Call Sites (7.46% dari total utang).
  2. *Permukaan Ketergantungan Relasional Masif:* 68 constraint foreign key masuk dari 63 tabel; risiko gangguan operasional luas jika terjadi kegagalan pencarian pasien.
  3. *Zero Preseden dari C2:* Tidak ada penggunaan kembali skema atau fixture dari Wave 1B.2.
  4. *Klaim Downstream RLS Tidak Valid:* Mengamankan D tidak otomatis mengamankan tabel anak.
- **Verified Implementation Blockers:**
  - **TIDAK ADA BLOCKER KRITIS.** Seluruh 6 prasyarat (`D-PRE-1` s.d. `D-PRE-6`) terdefinisi dengan jelas dan dapat dikelola.

### Candidate C1 — CPOE Orders & Safety
- **Strengths:**
  1. *Reduksi Utang Keamanan Maksimal:* Mengeliminasi 16 Stage-0 Call Sites (11.94% dari total utang), tertinggi di antara seluruh kandidat.
  2. *Kontinuitas Arsitektural Kuat dari C2:* Memanfaatkan momentum tabel `clinical_orders` yang baru saja diperbaiki dan diuji RLS-nya pada C2 (`C2-RLS-05`).
  3. *Perlindungan Aksi Klinis Berisiko Tinggi:* Mengamankan otorisasi pembatalan order dua orang via token SHA-256 (`safety_decision_registry`).
  4. *Prasyarat Implementasi Lebih Sedikit:* Hanya 4 item prasyarat (`C1-PRE-1` s.d. `C1-PRE-4`).
- **Weaknesses:**
  1. *Kompleksitas Transaksional Lintas Modul:* Passing objek client database ke `safetyAuthorizationService.verifyAndConsumeTransactional`.
  2. *Keterikatan Legacy Transaction Manager:* Menggunakan `transactionManager.js` pada `createOrder` yang harus dimigrasikan ke `withUnitOfWork`.
  3. *Shared Call Site:* CS 71 dipanggil oleh dua rute Express (`/cpoe` dan `/orders`).
- **Verified Implementation Blockers:**
  - **TIDAK ADA BLOCKER KRITIS.** `safetyAuthorizationService` sudah mendukung transaksi client secara native, dan `transactionManager` dapat diganti secara 1-to-1 dengan `withUnitOfWork`.

---

## 13. Final Decision Standard & AI Recommendation

Berdasarkan standar keputusan yang ditetapkan:

1. **Kriteria Pemilihan C1 Terpenuhi:**
   - Memiliki reduksi utang keamanan yang material lebih tinggi (16 vs 10, +60%).
   - C2 menyediakan preseden arsitektural dan data langsung yang bermakna pada tabel `clinical_orders`.
   - Kompleksitas transaksi terbukti bounded dan bukan blocker implementasi.
   - Prasyarat konkret dan terdefinisi dengan jelas (4 prasyarat).
2. **Kriteria Pemilihan D:**
   - D memiliki keunggulan sentralitas identitas pasien dan isolasi transaksi single-service.
   - Namun, justifikasi utama D (klaim downstream RLS closure dan blast radius terkecil) telah terbantahkan, dan D menghasilkan reduksi utang keamanan yang lebih rendah.

Mengikuti **Aturan Preferensi Keamanan** yang memprioritaskan reduksi utang Stage-0 dan kesinambungan bukti PostgreSQL riil di atas kesederhanaan permukaan kode:

```text
======================================================================
FINAL AI RECOMMENDATION : CANDIDATE C1 — CPOE ORDERS & SAFETY
COUNTER-ALTERNATIVE     : CANDIDATE D — MASTER PATIENT / ADMISSION
IMPLEMENTATION STARTED  : NO (STRICT READ-ONLY)
======================================================================
```

### Rangkuman Justifikasi Rekomendasi:
> **Candidate C1 (CPOE Orders & Safety)** direkomendasikan sebagai pilihan utama untuk **P0-2B Wave 1B.3** karena memaksimalkan reduksi utang keamanan sistem (16 Stage-0 Call Sites) dan mempertahankan momentum arsitektural langsung dari Candidate C2 pada tabel `clinical_orders`.
>
> Namun, jika **Human Owner** memandang bahwa **penguncian identitas master pasien (MPI)** harus mendahului seluruh ordonansi klinis demi mencegah mutasi tak terkontrol dari modul pendaftaran, maka **Candidate D** adalah alternatif yang sepenuhnya sah dan siap untuk direncanakan.
