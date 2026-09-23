# NURSEFLOW ENTERPRISE HIS — DATABASE DOMAIN AUDIT (POSTGRESQL 16)
**Status Dokumen:** `FORENSIC DDL & SCHEMA AUDIT REPORT`  
**Target Basis Data:** `PostgreSQL 16.15 (Win64) — nurseflow_enterprise_his`  
**Tanggal Audit:** 23 September 2026  

---

## 1. METRIK EKSEKUTIF SKEMA BASIS DATA

| Metrik | Hasil Forensik Aktual | Status Evaluasi |
| :--- | :--- | :--- |
| **Total Berkas Migrasi** | 72 berkas (`database/migrations/*.sql`) | ⚠️ Mengandung anomali penomoran ganda |
| **Total Tabel Terdefinisi di DDL** | 211 tabel fisik unik | ⚠️ Skema sangat luas namun terfragmentasi |
| **Tabel Terisi Data (Populated)** | 92 tabel (43.6%) | 🟢 Core EMR & Pasien aktif |
| **Tabel Kosong (Empty / Dormant)** | 118 tabel (55.9%) | 🔴 56% tabel tidak pernah menerima mutasi |
| **Total Foreign Key Constraints** | **11 Foreign Keys** di seluruh database | 🚨 **KRITIS: Integritas referensial tidak ditegakkan** |
| **Total Database Triggers** | 8 trigger aktif | 🟣 Hanya aktif pada audit & WORM immutability |
| **Total Database Indexes** | 356 B-Tree / GIN Indexes | 🟢 Indexing query cukup baik |

---

## 2. ANOMALI KRITIS STRUKTUR BASIS DATA

### A. Anomali Penomoran Migrasi Duplikat (Duplicate Migration Prefixes)
Ditemukan 5 pasang berkas migrasi yang memiliki awalan angka urut yang sama. Hal ini membuktikan terjadinya penggabungan branch paralel oleh tim pengembang tanpa sinkronisasi nomor urut migrasi:

1. **Nomor `031` (Katalog Finansial vs Human Factors):**
   - `031_financial_catalogs_tariffs.sql` (Membuat tabel katalog tarif, BPJS, INA-CBG).
   - `031_human_factors_observational_sessions.sql` (Membuat tabel sesi observasi HFE).
2. **Nomor `032` (Auth RBAC vs PostgreSQL RLS):**
   - `032_enterprise_auth_rbac.sql` (Membuat tabel `auth_roles`, `auth_permissions`).
   - `032_postgresql_rls_and_pki_lifecycle.sql` (Mengaktifkan RLS dan tabel PKI).
3. **Nomor `033` (SATUSEHAT Credentials vs Konfigurasi Integrasi):**
   - `033_satusehat_tenant_credentials.sql`.
   - `033_system_configuration_integrations.sql`.
4. **Nomor `034` (Audit Engine vs SATUSEHAT RLS):**
   - `034_lightweight_audit_engine.sql`.
   - `034_satusehat_credentials_rls_and_key_versioning.sql`.
5. **Nomor `035` (Canonical Seed Data vs FHIR Outbox):**
   - `035_canonical_seed_data.sql`.
   - `035_fhir_reliable_delivery_outbox.sql`.

*Rekomendasi Remediasi:* Normalisasi penomoran migrasi secara sekuensial tanpa mengubah skema tabel yang sudah terbentuk di basis data produksi.

---

### B. Duplikasi Pernyataan `CREATE TABLE` (DDL Redefinition)
Sebanyak 11 tabel didefinisikan secara berulang di berkas migrasi berbeda menggunakan klausa `CREATE TABLE IF NOT EXISTS`:

| Nama Tabel | Berkas Migrasi 1 | Berkas Migrasi 2 | Analisis Dampak |
| :--- | :--- | :--- | :--- |
| `master_beds` | `010_bed_ward_hierarchy.sql` | `026_spatial_master_hierarchy.sql` | Kolom pada migrasi 026 tidak tertimpa karena `IF NOT EXISTS` mengabaikan DDL kedua. Struktur tabel terkunci pada migrasi 010. |
| `master_rooms` | `010_bed_ward_hierarchy.sql` | `026_spatial_master_hierarchy.sql` | Kolom relasi gedung/lantai berbeda antar kedua migrasi. |
| `master_wards` | `010_bed_ward_hierarchy.sql` | `026_spatial_master_hierarchy.sql` | Potensi inkonsistensi foreign key departemen. |
| `master_buildings` | `010_bed_ward_hierarchy.sql` | `026_spatial_master_hierarchy.sql` | Redefinisi identik. |
| `master_floors` | `010_bed_ward_hierarchy.sql` | `026_spatial_master_hierarchy.sql` | Redefinisi identik. |
| `master_medications` | `030_global_clinical_catalogs.sql` | `036_create_master_medications_and_classes.sql` | Migrasi 030 membuat skema flat sederhana; migrasi 036 mencoba membuat skema terminologi lengkap (KFA/BPJS). Karena `IF NOT EXISTS`, struktur 036 diabaikan! |
| `patient_allergies` | `005_emr_soap_cppt_and_cdss.sql` | `039_create_patient_allergies_scd2.sql` | Migrasi 005 membuat tabel alergi flat; migrasi 039 mendesain SCD Type 2 (Slowly Changing Dimensions). Struktur SCD 2 tidak diterapkan secara murni. |
| `operating_theatres` | `014_operating_theatre_and_icu_acuity.sql` | `019_operating_theatre_surgeries_and_who_checklist.sql` | Duplikasi konsep kamar operasi. |
| `anesthesia_records` | `014_operating_theatre_and_icu_acuity.sql` | `020_operating_theatre_enterprise_aims_cssd_and_scheduling.sql` | Tabel ini tetap 0 baris karena aplikasi menulis ke `perioperative_anesthesia_evaluations` (44 baris). |
| `radiology_orders` | `006_universal_orders_pharmacy_lis_pacs.sql` | `018_radiology_orders_workflow_and_audit.sql` | Redefinisi order radiologi; tabel tetap 0 baris karena order tersimpan di `clinical_orders`. |
| `master_inacbg_tariffs` | `022_enterprise_pharmacy_multidepot_fefo_and_recalls.sql` | `031_financial_catalogs_tariffs.sql` | Tabel tarif dimasukkan secara tidak sengaja di migrasi farmasi. |

---

### C. Defisit Kritis Foreign Key (Relational Void)
Dari 211 tabel, **hanya ada 11 Foreign Key**. Artinya:
- Relasi antara `encounters` dan `master_patients` **TIDAK DIKUNCI OLEH DATABASE FK**. Kolom `encounters.patient_id` hanyalah `VARCHAR(100)` biasa. Baris encounter dapat merujuk ke ID pasien yang fiktif atau telah dihapus (*orphan encounters*).
- Relasi antara `cpoe_order_items` dan `clinical_orders` tidak memiliki cascade constraint.
- Relasi antara `laboratory_specimens` dan `clinical_orders` tidak terkunci secara relasional.
- Relasi antara `bed_occupancies` dan `master_beds` tidak mencegah penghapusan master bed yang sedang ditempati pasien.

*Dampak:* RDBMS PostgreSQL berfungsi sebagai *document store* tabular tanpa integritas referensial ACID yang sesungguhnya.

---

## 3. AUDIT POPULASI DATA AKTUAL (DATA RESIDENCY)

### 10 Tabel Terbesar Berdasarkan Jumlah Baris
1. `master_patients`: **4.859 baris** (Data identitas pasien, NIK, tanggal lahir, penjamin).
2. `encounters`: **4.810 baris** (Data kunjungan IGD, Rawat Jalan, Rawat Inap).
3. `episodes_of_care`: **4.810 baris** (Episode perawatan longitudinal).
4. `soap_notes`: **3.848 baris** (Catatan SOAP klinis dokter & perawat).
5. `clinical_orders`: **2.278 baris** (Instruksi CPOE obat, lab, radiologi).
6. `universal_audit_logs`: **615 baris** (Log audit forensik dengan hash dan timestamp).
7. `clinical_observations`: **428 baris** (Observasi tanda vital & skor klinis).
8. `clinical_domain_outbox`: **365 baris** (Event domain untuk outbox pattern).
9. `break_glass_audit_ledger`: **198 baris** (Akses darurat bypass privilese).
10. `blood_donor_units`: **140 baris** (Stok unit darah bank darah BDRS).

### Analisis 118 Tabel Kosong (0 Baris)
1. **Domain Finansial & Kasir:**
   - `hospital_invoices`: 0 baris.
   - `cashier_payment_transactions`: 0 baris.
   - `cashier_shift_reconciliations`: 0 baris.
   - `billing_ledgers`: 0 baris.
   - *Penyebab:* Modul kasir di frontend masih menggunakan in-memory state dan mockup UI tanpa eksekusi `INSERT INTO hospital_invoices`.
2. **Domain Klaim BPJS & Casemix:**
   - `bpjs_sep_records`: 0 baris.
   - `bpjs_claim_submissions`: 0 baris.
   - `inacbg_claims`: 0 baris.
   - `inacbg_grouping_results`: 0 baris.
   - *Penyebab:* Bridging BPJS dan grouping INA-CBG disimulasikan di frontend tanpa persistensi transaksi klaim ke basis data.
3. **Domain Laboratorium Analitik:**
   - `laboratory_orders`: 0 baris (order tersimpan di `clinical_orders`).
   - `laboratory_test_results`: 0 baris (hasil lab tidak masuk ke tabel relasional).
   - `laboratory_panic_alerts`: 0 baris.

---

## 4. AUDIT KEAMANAN & ROW-LEVEL SECURITY (RLS)

1. **Status RLS pada Tabel Kunci:**
   - `safety_decision_registry` (Migrasi 067): RLS aktif dengan kebijakan `tenant_safety_isolation_policy` berbasis `current_setting('app.current_tenant_id', true)`.
   - `tenant_satusehat_credentials` (Migrasi 034): RLS aktif untuk isolasi kunci API OAuth SATUSEHAT.
   - Namun, tabel inti klinis seperti `master_patients`, `encounters`, `soap_notes`, dan `clinical_orders` **BELUM MENGAKTIFKAN RLS**. Isolasi multi-tenant pada data pasien hanya mengandalkan filter `WHERE tenant_id = $1` di lapisan aplikasi Node.js.
2. **Audit WORM (Write Once, Read Many):**
   - Tabel `universal_audit_logs` dan `break_glass_audit_ledger` memiliki trigger PostgreSQL yang menolak operasi `UPDATE` dan `DELETE` secara mutlak. Hal ini memenuhi standar JCI & HIPAA untuk integritas forensik bukti audit.

---

## 5. STRATEGI MIGRASI MAJU AMAN (FORWARD MIGRATION ROADMAP)

Dilarang melakukan penghapusan destruktif (`DROP TABLE`) secara sembarangan terhadap 118 tabel kosong atau tabel duplikat karena dependensi foreign script atau automated test.

Langkah Rekonsiliasi Database:
1. **Migration 068 (Schema Consolidation):**
   - Menambahkan Foreign Key Constraints secara bertahap menggunakan sintaks aman `NOT VALID` lalu di-`VALIDATE CONSTRAINT` agar tidak mengunci tabel operasional:
     * `encounters.patient_id` $\rightarrow$ `master_patients(id)`
     * `soap_notes.encounter_id` $\rightarrow$ `encounters(id)`
     * `clinical_orders.encounter_id` $\rightarrow$ `encounters(id)`
     * `cpoe_order_items.order_id` $\rightarrow$ `clinical_orders(id)`
2. **Penghapusan Ambiguitas Model Data:**
   - Menetapkan satu tabel definitif untuk setiap entitas:
     * Gunakan `master_beds` (migrasi 026) sebagai acuan tunggal bed management.
     * Gunakan `surgical_cases` sebagai acuan tunggal kamar bedah.
     * Gunakan `blood_bedside_verifications` sebagai acuan tunggal bedside transfusi.
3. **Konfigurasi Host Pool:**
   - Memastikan `server/db/postgresPool.js` menggunakan `127.0.0.1` secara eksplisit pada lingkungan Windows untuk mencegah kegagalan timeout IPv6 `::1`.
