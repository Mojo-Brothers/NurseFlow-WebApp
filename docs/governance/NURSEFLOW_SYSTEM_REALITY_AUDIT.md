# NURSEFLOW ENTERPRISE HIS — SYSTEM REALITY AUDIT (FORENSIK MENYELURUH)
**Status Dokumen:** `LIVEREPO-VERIFIED FORENSIC BASELINE`  
**Tanggal Audit:** 23 September 2026  
**Auditor Independen:** Enterprise Architectural Review & Clinical Forensic Team  
**Klasifikasi:** Governance & Architecture Source of Truth  

---

## 1. RINGKASAN EKSEKUTIF REALITAS SISTEM

NurseFlow WebApp saat ini **BUKAN** sebuah Enterprise Hospital Information System (HIS) yang monolitik, koheren, ataupun terpadu. Berdasarkan inspeksi forensik aktual terhadap source code, database PostgreSQL, Express backend gateway, Zustand stores, dan UI components, NurseFlow adalah sebuah **sistem hybrid tiga lapis yang terfragmentasi (Fragmented Tri-Layer System)**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAPIS 1: PROTOTYPE CLIENT LAYER (Legacy Firebase, LocalStorage & Mock Seed)  │
│ - Menggunakan firebase/firestore, firebase/auth, dan persistenceAdapter      │
│ - Penyimpanan lokal via localStorage ('nurseflow_pa_*', 'nurseflow_ro_*')   │
│ - Hardcoded persona switcher (14 role), 'demo-patient-dewi', 'ENC-DEMO-MOCK' │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ GAP / DISCONNECT
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAPIS 2: BACKEND APPLICATION GATEWAY (Express 5.2.1 + Node.js Services)       │
│ - 35+ Enterprise Application Services di /server/services/                   │
│ - 25+ REST Endpoints di /server/routes/                                      │
│ - Auth Router MOCK: issue token dr. Siti Sp.PD tanpa verifikasi password     │
│ - Hanya ~12 service frontend yang terhubung via requestApi / apiClient       │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ RELATIONAL VOID (Only 11 Foreign Keys)
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAPIS 3: POSTGRESQL 16 PHYSICAL DATABASE ENGINE                              │
│ - 72 Migration files, 211 Tabel unik didefinisikan                           │
│ - 92 Tabel Terisi (Populated), 118 Tabel KOSONG (Empty / 56% Dormant)        │
│ - Hanya 11 Foreign Key Constraints (Integritas Relasional Tidak Ditegakkan)  │
│ - Terdapat migrasi bernomor duplikat (031, 032, 033, 034, 035)               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TEMUAN FORENSIK UTAMA PER LAPISAN

### A. Lapisan Database (PostgreSQL 16 Engine)
1. **Total Tabel Terdefinisi:** 211 tabel unik dari 72 berkas migrasi SQL.
2. **Kekosongan Data Masif (56% Empty Tables):**
   - **92 tabel terisi data** (total baris tertinggi: `master_patients` 4.859 baris, `encounters` 4.810 baris, `episodes_of_care` 4.810 baris, `soap_notes` 3.848 baris, `clinical_orders` 2.278 baris).
   - **118 tabel KOSONG sama sekali (0 baris)**, mencakup hampir seluruh domain operasional lanjutan:
     * Domain Billing & Kasir: `accounts_receivable_aging_ledgers`, `billing_ledgers`, `cashier_payment_transactions`, `cashier_shift_reconciliations`, `financial_adjustments_and_refunds`, `hospital_invoices`, `patient_billing_reconciliation`, `patient_split_invoices`.
     * Domain BPJS & Klaim: `bpjs_claim_disputes`, `bpjs_claim_submissions`, `bpjs_sep_records`, `bpjs_vclaim_lifecycle_logs`.
     * Domain Casemix: `casemix_cases`, `casemix_grouping_audits`, `inacbg_claims`, `inacbg_grouping_results`.
     * Domain Operasi & Anestesi: `anesthesia_records` (0 baris, sementara `perioperative_anesthesia_evaluations` memiliki 44 baris — duplikasi tabel).
     * Domain Bank Darah: `blood_bedside_dual_nurse_verifications` (0 baris, sementara `blood_bedside_verifications` memiliki 14 baris).
3. **Ketiadaan Foreign Key (Relational Void):**
   - Dari 211 tabel, **HANYA ADA 11 FOREIGN KEY CONSTRAINTS**.
   - Integritas referensial (Parent-Child relation) antar-pasien, episode, encounter, order, spesimen laboratorium, billing, dan faktur tidak dijamin oleh RDBMS PostgreSQL, melainkan hanya diasumsikan oleh kode aplikasi.
4. **Anomali Nomor Berkas Migrasi (Duplicate Prefixes):**
   - Terdapat 5 pasang nomor migrasi kembar:
     * `031_financial_catalogs_tariffs.sql` vs `031_human_factors_observational_sessions.sql`
     * `032_enterprise_auth_rbac.sql` vs `032_postgresql_rls_and_pki_lifecycle.sql`
     * `033_satusehat_tenant_credentials.sql` vs `033_system_configuration_integrations.sql`
     * `034_lightweight_audit_engine.sql` vs `034_satusehat_credentials_rls_and_key_versioning.sql`
     * `035_canonical_seed_data.sql` vs `035_fhir_reliable_delivery_outbox.sql`
5. **Duplikasi Tabel DDL (Multiple CREATE TABLE):**
   - 11 tabel didefinisikan ulang di berkas migrasi berbeda: `anesthesia_records` (014 & 020), `master_beds` (010 & 026), `master_buildings` (010 & 026), `master_floors` (010 & 026), `master_inacbg_tariffs` (022 & 031), `master_medications` (030 & 036), `master_rooms` (010 & 026), `master_wards` (010 & 026), `operating_theatres` (014 & 019), `patient_allergies` (005 & 039), `radiology_orders` (006 & 018).

---

### B. Lapisan Backend (Express Gateway & Application Services)
1. **Server Standalone vs Vite Proxy:**
   - Server Express terletak di `server/server.js` (port 5000).
   - Perintah `npm run dev` di `package.json` **HANYA MENJALANKAN VITE** (`"dev": "vite"`). Express backend tidak otomatis aktif saat developer menjalankan `npm run dev` kecuali dijalankan manual (`node server/server.js`).
   - `vite.config.js` mengonfigurasi proxy `/api`, `/health`, dan `/dicomweb` ke `http://localhost:5000`. Jika backend tidak diaktifkan, panggilan API gagal dan aplikasi fallback ke Firestore/localStorage.
2. **Kelemahan Kritis Autentikasi Backend (`server/routes/auth.routes.js`):**
   - Endpoint `POST /api/v1/auth/login` **TIDAK MEMERIKSA PASSWORD**:
     ```javascript
     // server/routes/auth.routes.js: lines 9-22
     router.post('/login', (req, res) => {
       const { username, password } = req.body;
       if (!username) return res.status(400).json(...);
       const tokenPair = jwtSecurityService.issueTokenPair({
         userId: 'USR-DOC-001',
         username: username || 'dr.siti',
         role: ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP
       });
       ...
     });
     ```
   - Setiap pengguna yang memasukkan username apapun langsung diberikan token JWT ber-role `ROLE_DOCTOR_DPJP` (`dr. Siti Wijaya, Sp.PD-KGEH`) tanpa mencocokkan password ke tabel `auth_users` atau `enterprise_users`.
3. **Koneksi Database Timeout pada Resolusi Hostname Windows:**
   - `server/db/postgresPool.js` mengonfigurasi `host: process.env.POSTGRES_HOST || 'localhost'`.
   - Pada Windows 11 / Node.js 20+, `localhost` diresolve ke IPv6 `::1`, yang menyebabkan `Connection timeout` jika PostgreSQL hanya mendengarkan pada IPv4 `127.0.0.1`. Harus dinormalisasi ke `127.0.0.1`.

---

### C. Lapisan Frontend (State Management & UI Workspaces)
1. **Dua Sistem Autentikasi yang Tidak Berhubungan:**
   - Frontend Auth (`src/contexts/AuthContext.jsx` & `src/modules/auth/auth.store.js`) menggunakan Firebase Auth `onAuthStateChanged` atau `nurseflow_auth_session` di `localStorage`.
   - Backend Auth (`server/routes/auth.routes.js`) menggunakan JWT Bearer token via `jwtSecurityService`.
   - Tidak ada pertukaran token antara Firebase login frontend dan Express backend JWT token.
2. **Fragmentasi Data Store Frontend:**
   - Sebagian komponen memanggil `requestApi` (`apiClient.js`): `UniversalOrderModal`, `BloodBankWorkspacePage`, `DoctorSoapWorkspace`, `billing.service.js`, `triage.service.js`.
   - Komponen lain membaca/menulis langsung ke `localStorage`:
     * `MaterialRequestTab.jsx` & `VerificationEndpoint.jsx`: Menyimpan daftar permintaan logistik dan tanda tangan ke `localStorage['nurseflow_ro_list']` dan `localStorage['material_request_*']`.
     * `masterDataApi.service.js`: Menyimpan master data ke `localStorage['nurseflow_md_*']`.
     * `bpjsAntreanBridge.service.js`: Menyimpan log antrean BPJS ke `localStorage`.
   - Komponen formulir klinis di `src/modules/emr/components/` mengandung hardcoded identifier demo:
     * `ICUAdmissionCriteriaForm.jsx`, `ICUDischargeCriteriaForm.jsx`, `InitialAssessment.jsx`, `SurgicalSafetyChecklistForm.jsx`, dll.:
       ```javascript
       const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';
       encounterId: patient?.id ? ... : 'ENC-DEMO-MOCK';
       ```
3. **Keamanan 2FA / Approval Palsu:**
   - Pada `src/modules/inventory/components/MutasiBarangTab.jsx` dan `VerificationEndpoint.jsx`:
     ```javascript
     if (pin !== '123456' && pin !== '8888') {
       return toast.error('PIN Otorisasi 2FA Salah! (Gunakan demo PIN: 123456 atau 8888)');
     }
     ```
   - Otorisasi tanda tangan elektronik farmasi/logistik tidak divalidasi ke basis data kredensial staf, melainkan dicocokkan terhadap PIN statis `'123456'` di browser client.

---

### D. Lapisan Pengujian (Automated Test Reality)
1. **Total Berkas Test:** 189 berkas test di folder `tests/`.
2. **Ilusi Durability Testing via In-Memory Mocks:**
   - Pengujian bertitel *"Vertical Slice Durability"* (`tests/verticalSlice01PatientDurability.test.js`, `tests/verticalSlice06AUniversalCpoeDurability.test.js`, dll.) **TIDAK MENGUJI POSTGRESQL AKTUAL**.
   - Setiap berkas test membuat mock in-memory simulasi:
     ```javascript
     let mockDatabaseState = { master_patients: [], universal_audit_logs: [] };
     mockClient = {
       query: vi.fn(async (sql, params) => { ... })
     };
     ```
   - Test memverifikasi logika SQL string parser tiruan dalam memori JavaScript, bukan keandalan transaksi fisik PostgreSQL, foreign key, index, ataupun trigger WORM.
3. **Vitest Berjalan di Environment Node (Non-DOM):**
   - `vite.config.js` menetapkan `environment: 'node'`.
   - Sebagian besar test menguji fungsi utilitas dan service murni, bukan siklus rendering interaktif komponen React secara menyeluruh.

---

## 3. IDENTIFIKASI AKAR MASALAH (ROOT CAUSE ARCHITECTURE)

| ID | Gejala / Problem | Akar Masalah Arsitektural (Root Cause) | Dampak Klinis & Bisnis |
| :--- | :--- | :--- | :--- |
| **RC-01** | UI terlihat lengkap tapi data tidak tersimpan ke DB | Arsitektur transisi yang tidak tuntas: Frontend dibangun di atas Firestore/LocalStorage, lalu tim backend membuat PostgreSQL migrations & Express services tanpa melakukan *wiring* menyeluruh ke UI components. | Kehilangan data medis saat browser berganti perangkat / clear cache. |
| **RC-02** | Test suite 100% PASS tapi sistem tidak terhubung | Pengujian unit & vertical slice mengandalkan in-memory mocks (`vi.fn()`) dan simulasi array memory, sehingga menguji mock itu sendiri, bukan keterikatan end-to-end nyata. | *False confidence* (merasa sistem sudah production-ready padahal relasi antar modul terputus). |
| **RC-03** | Autentikasi & Otorisasi tidak konsisten | Terdapat 3 mekanisme auth yang berjalan paralel: (1) Firebase Auth, (2) Express JWT mock issuer, (3) LocalStorage persona state. | Risiko keamanan tinggi: bypass peran, tidak adanya audit staf yang dapat dipertanggungjawabkan secara hukum. |
| **RC-04** | Master data terisolasi & terduplikasi | Terdapat tabel spatial (`master_beds`, `master_rooms`) di migration `010` dan `026`, tabel obat di `030` dan `036`. Frontend master data membaca dari localStorage, sementara backend membaca dari PostgreSQL. | Pasien rawat inap dapat menempati bed yang di backend sudah terisi; resep dapat memesan obat yang tidak ada di formularium. |
| **RC-05** | Medical Forms berbentuk komponen statis terpisah | Setiap asesmen medis (MEOWS, PEWS, SOFA, Partograf, Pasca-Anestesi) dibuat sebagai komponen JSX hardcoded independen dengan state lokal dan mock encounter. | Tidak adanya versioning form, tidak dapat diamandemen secara medicolegal, dan tidak memiliki WORM audit trail. |

---

## 4. KESIMPULAN AUDIT FORENSIK

NurseFlow memiliki **aset teknis dan konseptual yang sangat kaya**:
- Logika aturan klinis (CDSS, DDI graph, renal dosing, pediatric safety) yang komprehensif di backend.
- Komponen UI modern berbasis Tailwind CSS dan Design System yang estetik.
- Skema PostgreSQL berstandar enterprise (72 migrasi yang mencakup hampir seluruh kebutuhan rumah sakit).

**Namun, NurseFlow saat ini belum menjadi sebuah Enterprise HIS yang operasional karena putusnya keterikatan antar-lapisan (Broken Inter-Layer Lifecycle).**

Tahap rekonstruksi wajib memprioritaskan pemulihan keterikatan data nyata (True End-to-End Persistence & Lifecycle), penyatuan identitas staf/pasien, penegakan integritas relasional basis data, dan penghapusan seluruh artefak demo/mock.
