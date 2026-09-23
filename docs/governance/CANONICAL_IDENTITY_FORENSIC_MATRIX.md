# NURSEFLOW ENTERPRISE HIS — CANONICAL IDENTITY FORENSIC MATRIX

**Status Dokumen:** `OFFICIAL CANONICAL IDENTITY AUDIT`  
**Tanggal Audit:** 23 September 2026  
**Metodologi:** Pemindaian metadata skema PostgreSQL (`information_schema.tables`, `key_column_usage`, `constraint_column_usage`) dan pemindaian dependensi codebase backend/frontend.  

---

## 1. Ringkasan Eksekutif Audit Identitas

Audit forensik terhadap seluruh entitas yang merepresentasikan pegawai (*employee*), staf (*staff*), dokter (*doctor*), perawat (*nurse*), praktisi (*practitioner*), dan pengguna (*user*) menemukan keberadaan **dua keluarga skema yang berbeda**:

1. **Enterprise Canonical Family (Keluarga Skema Standar 2026):**
   - Berakar pada `master_staff` sebagai entitas data induk kepegawaian dan NIK legal.
   - Dipasangkan dengan `auth_users` untuk otentikasi login digital melalui relasi `auth_users.staff_id -> master_staff.id`.
   - Diekstensikan oleh `master_practitioners` untuk wewenang dan lisensi profesi klinis (SIP, STR, IHS SatuSehat, BPJS).
2. **Legacy Prototype Family (Keluarga Skema Prototipe Lama):**
   - Berakar pada `enterprise_users` (0 baris) dan `clinical_staff_profiles` (96 baris data demo berulang).
   - Menggunakan tabel penunjang `staff_credentials` dan terikat ke `tenant_organizations` (bukan `master_tenants`).
   - Tidak terhubung dengan sistem otentikasi modern `auth_users` maupun `auth_roles`.

---

## 2. Matriks Forensik Entitas Identitas Staf & Pengguna

| Concept | Table | Rows | Used By (Dependents) | Foreign Keys (Outgoing) | Canonical? | Duplicate? | Rekomendasi Tindakan (Action) |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **Staff / Employee HR** | `master_staff` | 5 | `auth_users.staff_id`<br>`master_practitioners.staff_id`<br>`practitioner_procedure_privileges.approved_by_staff_id`<br>`shift_assignments.staff_id` | `tenant_id -> master_tenants.id`<br>`organization_id -> master_organizations.id`<br>`staff_category_id -> master_staff_categories.id`<br>`gender_code -> master_genders.code`<br>`religion_id -> master_religions.id`<br>`marital_status_code -> master_marital_statuses.code` | ✅ **CANONICAL** | ❌ NO | **RETAIN AS SINGLE SOURCE OF TRUTH (SSOT).** Semua modul wajib mereferensikan tabel ini untuk identitas legal personel. |
| **System User Account** | `auth_users` | 5 | `auth_user_roles.user_id`<br>Express Auth Service<br>JWT Token Issuer | `tenant_id -> master_tenants.id`<br>`staff_id -> master_staff.id` | ✅ **CANONICAL** | ❌ NO | **RETAIN AS AUTHENTICATION ROOT.** Setiap akun wajib terikat ke `master_staff` (zero orphan user). |
| **System Roles** | `auth_roles` | 7 | `auth_user_roles.role_id` | `tenant_id -> master_tenants.id` | ✅ **CANONICAL** | ❌ NO | **RETAIN.** Selaraskan secara ketat dengan `ENTERPRISE_ROLES` di kode aplikasi. |
| **User Role Assignment** | `auth_user_roles` | 5 | `auth.service.js`<br>`rbacMiddleware.js` | `user_id -> auth_users.id`<br>`role_id -> auth_roles.id` | ✅ **CANONICAL** | ❌ NO | **RETAIN.** Dilindungi dengan unique constraint `uq_user_role_assignment`. |
| **Clinical Practitioner** | `master_practitioners` | 4 | `master_practitioner_schedules.practitioner_id`<br>`practitioner_procedure_privileges.practitioner_id` | `staff_id -> master_staff.id`<br>`specialty_id -> master_specialties.id` | ✅ **CANONICAL** | ❌ NO | **RETAIN AS CLINICAL EXTENSION.** Menyimpan nomor STR, SIP, IHS, BPJS, dan status DPJP. |
| **Staff Category Master** | `master_staff_categories` | 7 | `master_staff.staff_category_id` | (None) | ✅ **CANONICAL** | ❌ NO | **RETAIN.** Taksonomi profesi staf RS. |
| **Practitioner Schedule** | `master_practitioner_schedules` | 0 | Modul Rawat Jalan & Janji Temu | `practitioner_id -> master_practitioners.id`<br>`clinic_id -> master_clinics.id` | ✅ **CANONICAL** | ❌ NO | **RETAIN.** Dasar jadwal poliklinik. |
| **Procedure Privileging** | `practitioner_procedure_privileges` | 0 | Modul Kamar Bedah & CPOE | `practitioner_id -> master_practitioners.id`<br>`surgical_procedure_id -> master_surgical_procedures.id`<br>`approved_by_staff_id -> master_staff.id` | ✅ **CANONICAL** | ❌ NO | **RETAIN.** Pembatasan tindakan bedah. |
| **Legacy Staff Profile** | `clinical_staff_profiles` | 96 | Halaman lama `StaffPrivilegingWorkspacePage.jsx` | `tenant_id -> tenant_organizations.id`<br>`user_id -> enterprise_users.id` | ❌ **NON-CANONICAL** | ⚠️ **YES** | **DEPRECATE & ISOLATE.** Berisi baris dummy demo. Migrasikan seluruh komponen UI yang masih membaca tabel ini ke `master_staff`. |
| **Legacy User Account** | `enterprise_users` | 0 | `clinical_staff_profiles.user_id` | `tenant_id -> tenant_organizations.id` | ❌ **NON-CANONICAL** | ⚠️ **YES** | **RETIRE.** Tabel usang tak berpenghuni (0 rows). Tidak digunakan oleh sistem otentikasi. |
| **Legacy STR/SIP Strings** | `staff_credentials` | 18 | Halaman lama kredensial | `tenant_id -> tenant_organizations.id`<br>`staff_id -> clinical_staff_profiles.id` | ❌ **NON-CANONICAL** | ⚠️ **YES** | **MIGRATE TO master_practitioners.** Pindahkan nomor lisensi yang valid ke `master_practitioners` lalu matikan tabel. |
| **Key Lifecycle Tracking** | `practitioner_key_lifecycle` | 70 | Pengujian tanda tangan prototipe | `tenant_id -> tenant_organizations.id` | 🟡 **PROTOTYPE** | ❌ NO | **HOLD FOR STAGE 6.** Dievaluasi saat implementasi Digital Signature Engine. |
| **Legacy Shift Roster** | `staff_rosters` | 0 | (None) | `tenant_id -> tenant_organizations.id` | ❌ **NON-CANONICAL** | ⚠️ **YES** | **RETIRE.** Digantikan oleh `shift_assignments` terhubung `master_staff`. |

---

## 3. Jawaban Tegas Berbasis Bukti (7 Pertanyaan Forensik)

1. **Apa canonical staff entity?**
   `master_staff` adalah satu-satunya entitas staf canonical di NurseFlow.
2. **Apa primary key-nya?**
   UUID (`id`), terisi nilai unik format UUIDv4.
3. **Bagaimana `auth_users.staff_id` berhubungan dengannya?**
   Melalui Foreign Key langsung `auth_users_staff_id_fkey` yang membatasi bahwa setiap akun `auth_users` wajib merujuk ke entitas valid di `master_staff(id)`.
4. **Apakah `clinical_staff_profiles` diperlukan?**
   **TIDAK DIPERLUKAN.** Tabel tersebut merupakan peninggalan masa prototipe dengan relasi ke tabel usang `enterprise_users` dan berisi 96 baris dummy duplikat.
5. **Apakah ada duplicate staff identity tables?**
   Ya, `clinical_staff_profiles` dan `staff_credentials` adalah tabel duplikat non-kanonikal.
6. **Apakah satu orang dapat memiliki banyak role?**
   Ya, melalui tabel junction `auth_user_roles(user_id, role_id)`.
7. **Apakah satu staff dapat memiliki banyak unit kerja?**
   Ya, staf dapat memiliki multi-penugasan melalui tabel penjadwalan dan departemen (`master_practitioner_schedules`, `shift_assignments`).

---

## 4. Pelarangan Keras (Enforcement Rule)
- **Dilarang membuat tabel identitas staf baru.**
- Seluruh modul klinis, penunjang, farmasi, kasir, dan audit yang membutuhkan identitas aktor **WAJIB** merujuk ke `master_staff.id` (untuk identitas personel) dan `master_practitioners.id` (untuk hak praktik medis).
