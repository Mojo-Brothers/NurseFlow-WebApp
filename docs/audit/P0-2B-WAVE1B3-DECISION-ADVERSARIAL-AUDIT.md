# P0-2B WAVE 1B.3 ADVERSARIAL DECISION AUDIT
## Independent Adversarial Audit of Wave 1B.3 Next Candidate Decision Packet

**Date:** 2026-10-05  
**Governance Mode:** READ-ONLY ADVERSARIAL DECISION AUDIT  
**Target Decision Document:** `docs/audit/P0-2B-WAVE1B3-NEXT-CANDIDATE-DECISION.md` (Commit `51852e32ab9ea3d291fdecbf30dc5c72317fad0e`)  
**Active Branch:** `feature/security-foundation-wave1a10`  
**Lab Database:** `nurseflow_security_lab` (PostgreSQL 16)  
**Implementation Started:** NO (Strict Read-Only)

---

## Executive Verdict

Tinjauan adversarial independen terhadap paket keputusan `P0-2B-WAVE1B3-NEXT-CANDIDATE-DECISION.md` menetapkan klasifikasi akhir:

> **FINAL CLASSIFICATION: `VALID WITH FINDINGS`**

Rekomendasi pemilihan **Candidate D (Master Patient / Admission)** tetap **defensibel secara arsitektural** sebagai fondasi identitas pasien dan mitigasi mutasi tak terkontrol dari modul pendaftaran/antrean. Namun, proses audit adversarial membuktikan beberapa klaim justifikasi utama memiliki cacat evidentiary, distorsi konsep, dan bias formula:

1. **Material Artifact Defect (MAD-01):** Berkas companion JSON `scratch/p02b_wave1b3_next_candidate_decision.json` tidak disertakan dalam riwayat git commit `51852e3` (terabaikan di bawah aturan `.gitignore`).
2. **Klaim "Closing Downstream Leaks" Tidak Terbukti (UNSUPPORTED):** Semantik Row-Level Security (RLS) PostgreSQL adalah *per-table*. Menegakkan RLS pada tabel induk `master_patients` **sama sekali tidak mengamankan** pembacaan langsung pada tabel-tabel anak (`relrowsecurity = false`). RLS induk tidak bertransisi otomatis ke anak.
3. **Penyatuan Bias "Blast Radius Terkecil":** Dokumen menyatukan konsep *Code Surface* (15 call sites, 3 rute) dengan *Blast Radius*. Candidate D memiliki **permukaan kode terkecil**, namun memiliki **permukaan ketergantungan relasional terbesar di seluruh sistem HIS** (63 tabel merujuk secara langsung).
4. **Scoring Model Bersifat Weight-Sensitive (Bukan Pemenang Absolut):** Formula skoring 5 kriteria terbukti dapat dihitung ulang secara matematis (A=0.155, B=0.466, C1=0.544, D=0.888). Namun, bobot kriteria $R_{\text{impact}}$ (skor berbasis FK induk) secara struktural mengunci kemenangan D. Jika prioritas reduksi security debt Stage-0 dibobotkan $\ge 50\%$, **Candidate C1 mengungguli Candidate D**.
5. **Diskrepansi Foreign Key Terselesaikan oleh Katalog PostgreSQL:** Angka 42 vs 43 RESTRICT dan 23 vs 22 NO ACTION pada dokumen sebelumnya adalah akibat keterbatasan parsing regex teks migrasi statis. Katalog riil PostgreSQL 16 pada `nurseflow_security_lab` membuktikan baseline kanonik: **68 unique constraints** (47 RESTRICT, 21 NO ACTION, 0 CASCADE) yang tersebar pada **63 tabel unik** dengan **5 composite foreign keys**.
6. **Klaim Auto-Provisioning Candidate A Terbukti Akurat (100% FACT):** Penelusuran runtime membuktikan `appointment.controller.js:123` melakukan mutasi langsung `INSERT INTO master_patients` dengan `DEFAULT_TENANT_ID` hardcoded dan data pasien tiruan, memperkuat justifikasi pengamanan D sebelum A.
7. **Candidate C1 Adalah Alternatif Sangat Kuat (Counter-Candidate):** C1 menawarkan reduksi security debt terbesar (16 CS vs 10 CS) dan kontinuitas arsitektural langsung dari Candidate C2 yang baru saja menuntaskan fondasi RLS pada `clinical_orders` (`C2-RLS-05`).

---

## Repository Baseline

Berikut rekonsiliasi perbandingan metrik antara dokumen evidence sebelumnya (`P0-2B-WAVE1B2-TECHNICAL-DECISION-ANALYSIS.md`, commit `0194cf8`) dengan paket keputusan baru (`P0-2B-WAVE1B3-NEXT-CANDIDATE-DECISION.md`, commit `51852e3`):

| Metrik Evaluasi | Previous Evidence (`0194cf8`) | New Decision Packet (`51852e3`) | Status Rekonsiliasi | Penjelasan Diskrepansi / Bukti |
|---|:---:|:---:|:---:|---|
| **A Stage-0 Call Sites** | 3 | 3 | **SAME** | CS 1, CS 2, CS 3 (`master_patients`) |
| **B Stage-0 Call Sites** | 13 | 13 | **SAME** | CS 91-99, CS 100-103 (4 tabel Stage-0) |
| **C1 Stage-0 Call Sites** | 16 | 16 | **SAME** | CS 59-71, CS 143-145 (3 tabel Stage-0) |
| **D Stage-0 Call Sites** | 10 | 10 | **SAME** | CS 107-113, L31, L100, L170 (`master_patients`) |
| **A Static AST DB Calls** | 33 | 33 | **SAME** | 12 Writes, 21 Reads pada seluruh modul antrean |
| **B Static AST DB Calls** | 80 | 80 | **SAME** | 23 Writes, 57 Reads pada siklus obat tertutup |
| **C1 Static AST DB Calls** | 25 | 25 | **SAME** | 6 Writes, 19 Reads pada ordonansi klinis & safety |
| **D Static AST DB Calls** | 15 | 15 | **SAME** | 1 Write, 14 Reads/Locks pada master pasien |
| **D Inbound FK References** | 65 | 65 | **SAME** | 65 baris pernyataan `REFERENCES master_patients` pada file `.sql` |
| **D RESTRICT Constraints** | 42 | 43 | **DISCREPANCY** | Perbedaan parsing teks statis regex migrasi (Lihat Audit FK) |
| **D NO ACTION Constraints** | 23 | 22 | **DISCREPANCY** | Perbedaan parsing teks statis regex migrasi (Lihat Audit FK) |

---

## Artifact Integrity

Audit integritas artefak pada commit target `51852e32ab9ea3d291fdecbf30dc5c72317fad0e` membuktikan:
- Berkas Markdown `docs/audit/P0-2B-WAVE1B3-NEXT-CANDIDATE-DECISION.md` **berhasil dicatat** dalam riwayat git (`git show --name-status` = `A docs/audit/...`).
- Berkas companion JSON `scratch/p02b_wave1b3_next_candidate_decision.json` yang diklaim pada baris 8 dokumen keputusan **TIDAK ADA DALAM COMMIT GIT**. Berkas tersebut terabaikan secara otomatis karena direktori `scratch/` terdaftar dalam `.gitignore`.

```text
FINDING MAD-01: MATERIAL ARTIFACT DEFECT
Severity: MODERATE (Governance & Traceability Defect)
Impact: Companion JSON decision metadata tidak dapat dilacak secara deterministik pada checkout git bersih di lingkungan lain.
Status: FLAGGED (Strict Read-Only: Tidak diubah/di-commit pada audit ini).
```

---

## FK Evidence Discrepancy

### Investigasi Diskrepansi 42/23 vs 43/22
Pada dokumen `P0-2B-WAVE1B2-TECHNICAL-DECISION-ANALYSIS.md`, tercatat 42 RESTRICT dan 23 NO ACTION. Sementara pada `P0-2B-WAVE1B3-NEXT-CANDIDATE-DECISION.md`, tercatat 43 RESTRICT dan 22 NO ACTION.

Investigasi mendalam terhadap 65 berkas migrasi SQL membuktikan:
- Terdapat tepat **65 baris kemunculan teks** `REFERENCES master_patients` di seluruh berkas migrasi `database/migrations/*.sql`.
- 43 kemunculan memiliki klausa eksplisit `ON DELETE RESTRICT`.
- 22 kemunculan tidak memiliki klausa `ON DELETE` (secara standar ANSI SQL & PostgreSQL diterjemahkan menjadi default `ON DELETE NO ACTION`).
- Dokumen teknis terdahulu (`0194cf8`) mengalami kesalahan penangkapan regex baris tunggal pada satu constraint yang memindahkan 1 RESTRICT ke NO ACTION (menjadi 42/23).

### Canonical PostgreSQL 16 Catalog Evidence
Pemeriksaan langsung terhadap katalog basis data PostgreSQL 16 pada `nurseflow_security_lab` melalui tabel sistem `pg_catalog.pg_constraint` membuktikan bahwa **kedua angka statis tersebut (65 migrasi) tidak mencerminkan kenyataan runtime basis data yang sebenarnya**:

```sql
SELECT 
  con.conname AS constraint_name,
  rel.relname AS table_name,
  con.confdeltype
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_class frel ON frel.oid = con.confrelid
WHERE con.contype = 'f' AND frel.relname = 'master_patients';
```

**Hasil Katalog PostgreSQL Aktual:**
1. **Total Unique Foreign Key Constraints:** **68 constraints** (bukan 65).
2. **Total Unique Referring Tables:** **63 tabel unik**.
3. **Total Column Pairs Terlibat:** **73 pasangan kolom**.
4. **Distribusi Aturan Penghapusan (`confdeltype`):**
   - **`RESTRICT` (`confdeltype = 'r'`):** **47 constraints**
   - **`NO ACTION` (`confdeltype = 'a'`):** **21 constraints**
   - **`CASCADE` (`confdeltype = 'c'`):** **0 constraints**
5. **Composite Foreign Keys:** **5 constraints komposit** (`(patient_id, tenant_id) REFERENCES master_patients(id, tenant_id)`):
   - `fk_longitudinal_care_plans_pat_tenant` (`longitudinal_care_plans`)
   - `fk_medication_dispense_allocations_pat_tenant` (`medication_dispense_allocations`)
   - `fk_medication_emar_administrations_pat_tenant` (`medication_emar_administrations`)
   - `fk_patient_split_invoices_pat_tenant` (`patient_split_invoices`)
   - `fk_physician_diagnostic_interpretations_pat_tenant` (`physician_diagnostic_interpretations`)
6. **Penyebab Selisih Katalog vs Teks Migrasi:**
   - **Migration 078** mengeksekusi blok dinamis PL/pgSQL (`DO $$ FOREACH tbl IN ARRAY ... $$`) yang menambahkan 5 constraint komposit RESTRICT ke dalam katalog runtime. Teks file hanya memuat 1 baris string `REFERENCES master_patients`.
   - **Migration 075:34** secara eksplisit menghapus constraint `break_glass_audit_ledger_patient_id_fkey` (`ALTER TABLE break_glass_audit_ledger DROP CONSTRAINT IF EXISTS ...`), sehingga 22 NO ACTION statis berkurang 1 menjadi **21 NO ACTION** di runtime.
   - **Dual Constraints:** 5 tabel di atas memiliki *dua* foreign key sekaligus ke `master_patients` (satu foreign key tunggal `patient_id` dan satu foreign key komposit `patient_id, tenant_id`).

---

## Candidate D Claim Audit

### Root Entity Claim
- **Klaim Dokumen:** `master_patients` adalah entitas akar dari seluruh model data klinis rumah sakit.
- **Audit Adversarial:**
  - `master_patients` memiliki derajat keterkaitan masuk (*in-degree centrality*) yang luar biasa tinggi (68 foreign key constraints dari 63 tabel).
  - Namun, pelabelan sebagai "entitas akar dari *seluruh* model data" adalah **INTERPRETASI**, bukan fakta universal. Domain-domain enterprise penting beroperasi sepenuhnya independen dari `master_patients`, antara lain:
    - Master formularium & regulasi farmasi (`hospital_formulary`, `master_drug_class_cross_reactivities`).
    - Sterilisasi instrumen bedah & logistik CSSD (`cssd_instrument_sets`, `cssd_sterilization_cycles`).
    - Mesin aturan klinis & scoring CDSS (`clinical_rules`, `clinical_rule_conditions`, `casemix_rulesets`).
    - Otentikasi, perizinan, dan tata kelola kunci kriptografis (`auth_users`, `auth_roles`, `practitioner_key_lifecycle`).
    - Hierarki fisik rumah sakit (`master_facilities`, `master_buildings`, `master_floors`, `master_beds`).
- **Kesimpulan:** `master_patients` adalah pusat data rekam medis pasien (*Patient Identity Hub*), namun bukan akar dari seluruh skema enterprise HIS.

### Downstream RLS Claim
- **Klaim Dokumen:** "Mengamankan `master_patients` dengan penegakan tenant RLS menjamin bahwa entitas pasien tidak dapat diakses atau dimutasi secara cross-tenant oleh domain hilir mana pun."
- **Audit Adversarial:**
  - **FLAGGED AS UNSUPPORTED / TECHNICALLY INVALID.**
  - Dalam semantik PostgreSQL Row-Level Security, evaluasi kebijakan RLS bersifat **strictly table-specific**.
  - Jika tabel anak (misalnya `patient_allergies`, `clinical_observations`, atau `billing_ledgers`) memiliki `relrowsecurity = false`, maka eksekusi kueri langsung `SELECT * FROM patient_allergies WHERE allergy_type = 'MEDICATION';` **TIDAK AKAN** memicu evaluasi kebijakan RLS milik tabel `master_patients`.
  - Foreign key constraint hanya menegakkan integritas referensial pada operasi DML (`INSERT`/`UPDATE`/`DELETE`), dan **sama sekali tidak menyaring baris hasil kueri `SELECT`** lintas tenant jika tabel anak belum memiliki kebijakan RLS mandiri.
- **Kesimpulan:** Mengamankan `master_patients` **TIDAK OTOMATIS menutup celah kebocoran modul hilir**. Modul hilir tetap rentan bocor hingga masing-masing tabel hilir dilengkapi RLS fail-closed.

### Blast Radius Claim
- **Klaim Dokumen:** Candidate D memiliki blast radius terkecil di antara seluruh kandidat.
- **Audit Adversarial:**
  - Dokumen mencampuradukkan **Code Surface** dengan **Blast Radius / Dependency Surface**.
  - **Code Surface (Ringkas):** Candidate D memang memiliki permukaan kode tersempit: 15 static DB call sites, 3 rute Express, 1 controller, 1 service.
  - **Dependency Surface (Masif):** Candidate D memiliki permukaan dampak relasional terluas di seluruh sistem: 68 foreign key constraints dari 63 tabel anak. Mutasi pada `master_patients` (pendaftaran, penguncian NIK/BPJS, pembentukan MRN tahunan) memengaruhi seluruh siklus admisi pasien rumah sakit. Apabila terdapat cacat logika pada RLS atau serialisasi MRN, seluruh proses penerimaan pasien baru, triase IGD, dan registrasi rawat jalan akan lumpuh.
- **Kesimpulan:** D adalah **Smallest Code Surface**, tetapi **Largest Relational Dependency Surface**. Pelabelan sebagai "smallest blast radius" tanpa kualifikasi adalah keliru.

### Scoring Claim
- **Klaim Dokumen:** Skor kuantitatif objektif: A=0.155, B=0.466, C1=0.544, D=0.888.
- **Audit Adversarial:**
  - Formula: $\text{Score} = 0.20 \times D_{\text{stage0}} + 0.20 \times B_{\text{radius}} + 0.20 \times S_{\text{readiness}} + 0.20 \times T_{\text{boundary}} + 0.20 \times R_{\text{impact}}$
  - Perhitungan matematika: **REPRODUCIBLE** (A=0.1550, B=0.4656, C1=0.5437, D=0.8875).
  - Namun, model ini **STRUKTURAL WEIGHT-SENSITIVE**:
    1. Kriteria $R_{\text{impact}}$ ($\text{Inbound FKs} / 65$) sengaja dirancang menguntungkan Candidate D (D mendapat nilai sempurna 1.000, sedangkan C1 hanya 0.0308, B=0.0154, A=0.0000). Kriteria ini secara efektif memberikan "subsidi 20%" khusus untuk D.
    2. Jika tujuan utama gelombang fondasi keamanan (eliminasi unsafe call site Stage-0) dibobotkan secara proporsional:
       - **Skenario Prioritas Debt Reduction (Debt=50%, Radius=30%, Service=10%, Tx=10%, Root=0%):**
         - $\text{Score C1} = 0.50(1.0) + 0.30(0.6875) + 0.10(0.5) + 0.10(0.5) = \mathbf{0.8063}$
         - $\text{Score D} = 0.50(0.625) + 0.30(0.8125) + 0.10(1.0) + 0.10(1.0) = \mathbf{0.7563}$
         - **Hasil:** Candidate C1 mengalahkan Candidate D.
- **Kesimpulan:** Kemenangan Candidate D adalah fungsi dari pembobotan parameter, bukan keunggulan absolut matematis.

### Zero Coupling Claim
- **Klaim Dokumen:** Candidate D memiliki batas transaksi terisolasi tanpa kopling lintas-layanan (*zero cross-service coupling*).
- **Audit Adversarial:**
  - Penelusuran runtime pada `server/services/patientApplication.service.js`:
    - Direct synchronous service calls: **0** (hanya mengimpor `crypto` dan `postgresPoolService`).
    - Cross-service client passing: **0** (koneksi database tidak pernah diteruskan ke modul lain).
    - Event emitter / outbox publishing: **0**.
    - Shared datastore mutations: Hanya menulis ke `master_patients` dan `universal_audit_logs`.
- **Kesimpulan:** **VERIFIED AS FACT**. Candidate D benar-benar memiliki isolasi batas modul yang sangat bersih.

### UoW Readiness Claim
- **Klaim Dokumen:** Lapisan service telah terstruktur rapi dan siap mengadopsi `withUnitOfWork`.
- **Audit Adversarial:**
  - Metode `registerPatient` saat ini mengelola transaksi secara manual menggunakan koneksi pool mentah (`const client = await pool.connect(); await client.query('BEGIN ...');`).
  - Metode `searchPatients` dan `getPatientById` memanggil `pool.query` secara mandiri tanpa parameter `tenantId` dan tanpa konteks koneksi bersama.
  - Kueri `INSERT INTO master_patients` (baris 136) dan `universal_audit_logs` (baris 187) **belum mencantumkan kolom `tenant_id`**.
- **Kesimpulan:** **PARTIALLY UNSUPPORTED / FORWARD-LOOKING**. Service D memiliki struktur kode yang baik, tetapi **belum siap pakai secara instan**; masih memerlukan refactor substansial untuk menerima context UoW dan parameter tenant sebelum dapat lolos pengujian RLS.

---

## Candidate A Claim Audit

- **Klaim Dokumen:** Candidate A melakukan auto-provisioning pasien ke `master_patients`, sehingga mengamankan A sebelum D akan membiarkan mutasi pasien tanpa isolasi tenant yang kokoh.
- **Audit Adversarial:**
  - **VERIFIED FACT & CODE PROVEN.**
  - **Lokasi Kode:** `server/controllers/appointment.controller.js:121-128` dalam fungsi handler `book` (rute `POST /api/v1/appointments/book`).
  - **Bukti Eksekusi Runtime:**
    ```javascript
    realPatientId = isUUID(rawPatientId) ? rawPatientId : crypto.randomUUID();
    await client.query(`
      INSERT INTO master_patients (id, tenant_id, mrn, nik, full_name, birth_date, gender, phone_number, address_line, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'Pasien Booking Online', '1990-01-01', 'MALE', '08123456789', 'Jl. Rumah Sakit No. 1', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `, [realPatientId, tenantId, rawPatientId, `${Date.now()}111111`.slice(0, 16)]);
    ```
  - **Status Keamanan Ingress:** Pada baris 66:
    `const tenantId = req.headers['x-tenant-id'] || DEFAULT_TENANT_ID;`
    di mana `DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'`.
  - Operasi ini merupakan **Stage-0 Unsafe Call Site CS 3** yang memutasi entitas `master_patients` secara inline di dalam controller dengan data palsu dan fallback tenant terbuka.
- **Kesimpulan:** Klaim dokumen terbukti 100%. Memilih Candidate A sebelum `master_patients` (D) memiliki RLS yang teruji akan membiarkan mutasi pasien ilegal terus berlangsung.

---

## Candidate B Claim Audit

- **Klaim Dokumen:** Candidate B memiliki blast radius terbesar (80 call sites), memutasi 4 tabel Stage-0, dan berada di hilir alur ordonansi klinis.
- **Audit Adversarial:**
  - **VERIFIED AS FACT.**
  - Modul memuat 8 rute Express dan 80 static AST DB call sites (tertinggi di antara seluruh kandidat).
  - Melibatkan dependensi foreign key komposit multi-tabel (`078_stage0_child_composite_foreign_keys.sql`) pada `medication_emar_administrations` dan `medication_dispense_allocations`.
  - Alur bisnis verifikasi 5-Benar di tempat tidur (*bedside administration*) secara alami bergantung pada instruksi medis dokter (CPOE) dan data pasien (MPI).
- **Kesimpulan:** Candidate B memang tidak ideal untuk gelombang awal Wave 1B.3.

---

## Candidate C1 Claim Audit

- **Klaim Dokumen:** Candidate C1 adalah alternatif kuat, namun terbebani oleh ketergantungan modul legacy `transactionManager.js`, client-passing transaksional lintas-layanan ke `safetyAuthorization.service.js`, dan shared call site CS 71.
- **Audit Adversarial & Penemuan Keunggulan C1:**
  1. **Reduksi Security Debt Maksimal:** C1 mengeliminasi **16 Unsafe Call Sites** (terbanyak di antara semua kandidat), menurunkan Stage-0 debt dari 134 menjadi 118.
  2. **Domain Continuity dari C2 (Kekuatan Arsitektural Terkuat):**
     - Pada Wave 1B.2, Candidate C2 telah mengimplementasikan perbaikan CS 82 pada tabel `clinical_orders` dan memverifikasi isolasi baris PostgreSQL RLS pada suite `tests/p02b_wave1b2_c2_real_rls_integration.test.js: C2-RLS-05`.
     - Tabel `clinical_orders` adalah tabel domain utama milik Candidate C1 (`cpoeApplication.service.js`).
     - Fondasi RLS, test fixture, dan pola kebijakan tenant untuk `clinical_orders` **sudah ada dan terbukti di repositori**. Mengimplementasikan C1 secara langsung memanfaatkan momentum dan preseden arsitektural C2.
  3. **Tantangan Arsitektural C1:**
     - `cpoeApplication.service.js:401` meneruskan objek `client` koneksi transaksional ke layanan lain: `safetyAuthorizationService.verifyAndConsumeTransactional(client, ...)`.
     - Keterikatan dengan modul lawas `transactionManager.js` yang harus digantikan oleh `withUnitOfWork`.
- **Kesimpulan:** C1 adalah alternatif yang sangat solid dan memiliki dasar evidentiary yang sebanding dengan Candidate D.

---

## Counter-Recommendation

Apabila Human Owner memutuskan untuk **tidak memilih Candidate D** (misalnya karena ingin memprioritaskan reduksi security debt terbesar atau memanfaatkan momentum tabel `clinical_orders`), maka:

> **COUNTER-RECOMMENDATION: `Candidate C1 — CPOE Orders & Safety`**

**Alasan Evidentiary:**
1. **Reduksi Utang Keamanan Tertinggi:** 16 Stage-0 Unsafe Call Sites tereliminasi (dibandingkan 10 pada D, 13 pada B, 3 pada A).
2. **Preseden Arsitektural C2:** Kebijakan RLS tabel `clinical_orders` telah dibangun dan diverifikasi pada Wave 1B.2.
3. **Batas Implementasi Jelas:** 4 prasyarat konkret (`C1-PRE-1` s.d. `C1-PRE-4`) telah terdefinisi secara lengkap.

---

## Final Validity Classification

| Kategori Evaluasi | Status Dokumen Asal | Status Audit Adversarial | Keterangan Evaluasi |
|---|:---:|:---:|---|
| **Rekomendasi Utama (Candidate D)** | RECOMMENDED | **DEFENSIBLE WITH FINDINGS** | Fondasi identitas pasien yang solid, namun justifikasi downstream RLS tidak valid. |
| **Rekomendasi Alternatif (Candidate C1)** | ALTERNATIVE | **STRONG COUNTER-RECOMMENDATION** | Keunggulan reduksi utang keamanan (16 CS) dan kontinuitas tabel C2 `clinical_orders`. |
| **Klaim "Downstream Leaks Closed"** | CLAIMED | **UNSUPPORTED** | Bertentangan dengan semantik RLS PostgreSQL (`relrowsecurity = false`). |
| **Klaim "Blast Radius Terkecil"** | CLAIMED | **PARTIALLY MISLEADING** | Smallest code surface, tetapi largest relational dependency surface. |
| **Klaim "Auto-Provisioning A"** | CLAIMED | **FULLY VERIFIED (FACT)** | Terbukti pada `appointment.controller.js:123` (CS 3). |
| **Katalog Foreign Key** | 65 (43/22) | **RECONCILED (68 constraints)** | Katalog riil: 68 constraints (47 RESTRICT, 21 NO ACTION, 0 CASCADE, 63 tables). |
| **Integritas Artefak JSON** | CLAIMED | **MATERIAL DEFECT (MAD-01)** | `scratch/p02b_wave1b3_next_candidate_decision.json` tidak masuk commit git. |

**Klasifikasi Akhir Keputusan:**
```text
======================================================================
FINAL DECISION PACKET VALIDITY: VALID WITH FINDINGS
======================================================================
Alasan: Rekomendasi pemilihan Candidate D tetap dapat dipertahankan atas
dasar sentralitas relasional data pasien dan mitigasi auto-provisioning
ilegal dari Candidate A. Namun, klaim bahwa RLS D otomatis menutup kebocoran
modul anak dinyatakan UNSUPPORTED, dan skoring kuantitatif dinyatakan
WEIGHT-SENSITIVE.
======================================================================
```

---

## Human Owner Decision

```text
======================================================================
AI Recommendation      : Candidate D — Master Patient / Admission
Adversarial Verdict    : VALID WITH FINDINGS
Implementation Started : NO
======================================================================
```

Dokumen audit ini bersifat **strictly read-only decision support**. Tidak ada kode produksi atau pengujian yang diubah. Penentuan kandidat resmi untuk Wave 1B.3 sepenuhnya berada di tangan **Human Owner**.
