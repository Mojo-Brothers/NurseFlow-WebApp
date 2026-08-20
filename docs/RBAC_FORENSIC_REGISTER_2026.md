# 🏛️ RBAC FORENSIC REGISTER: NURSEFLOW ENTERPRISE HIS 2026

**Tanggal:** 21 Agustus 2026  
**Auditor:** Enterprise HIS Architecture Board & CISO Team  
**Prinsip Keamanan:** *"Zero-Trust Clinical Access. Frontend guards are only visual conveniences; true authorization and separation of clinical/financial powers MUST be enforced server-side."*

---

## 1. 📊 AUDIT HAK AKSES PER RUTE REACT ROUTER (61 ROUTES)

| # | React Route | Route Module | Frontend Role Guard (`allowedRoles`) | Backend API Path Terkait | Backend Role Enforcement | Status RBAC | Analisis Risiko Keamanan |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **01** | `/dashboard` | `clinical.routes.jsx` | `AuthRedirector` (Authenticated) | `GET /api/v1/auth/me` | Authenticated JWT | 🟢 **SECURE** | Dashboard umum dapat diakses semua staf yang login. |
| **02** | `/patients` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `GET /api/v1/patients/search` | Authenticated JWT | 🟡 **LOW RISK** | Pencarian pasien umum untuk identifikasi staf. |
| **03** | `/appointments` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/appointments` (Pending API) | - | 🟡 **MEDIUM RISK** | Perlu proteksi role `['ADMIN', 'NURSE', 'DOCTOR']`. |
| **04** | `/encounters` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/encounters` | Authenticated JWT | 🟡 **MEDIUM RISK** | Perlu proteksi role `['ADMIN', 'NURSE', 'DOCTOR']`. |
| **05** | `/triage` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/triage/assessments` | Verified role | 🟡 **MEDIUM RISK** | Seharusnya dibatasi ke `['NURSE', 'DOCTOR', 'ADMIN']`. |
| **06** | `/front-office` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/encounters` | Authenticated JWT | 🟡 **MEDIUM RISK** | Perlu proteksi role `['ADMIN', 'NURSE']`. |
| **07** | `/emergency` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/monitoring/rapid-response`| Verified role | 🟡 **MEDIUM RISK** | Perlu proteksi role `['NURSE', 'DOCTOR', 'ADMIN']`. |
| **08** | `/doctor-workspace` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/clinical-notes` | `ROLE_DOCTOR_DPJP` verified | 🟡 **MEDIUM RISK** | Rute frontend terbuka, meski backend memvalidasi dokter. Pasang guard `['DOCTOR', 'ADMIN']`. |
| **09** | `/nursing-workspace` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/medications/administer` | `ROLE_NURSE` verified | 🟡 **MEDIUM RISK** | Rute frontend terbuka, pasang guard `['NURSE', 'ADMIN']`. |
| **10** | `/patient-chart` | `emr.routes.jsx` | ⚠️ Tidak ada role guard | `GET /api/v1/coordination/encounters/:id/timeline` | Authenticated JWT | 🟡 **LOW RISK** | Rekam medis terpadu dapat dibaca seluruh nakes terotentikasi. |
| **11** | `/lab` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/laboratory/*` | `ROLE_LAB_ANALYST` verified | 🟡 **MEDIUM RISK** | Rute frontend terbuka, pasang guard `['LAB_ANALYST', 'DOCTOR', 'ADMIN']`. |
| **12** | `/radiology` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/radiology/*` | `ROLE_RADIOLOGIST` verified | 🟡 **MEDIUM RISK** | Rute frontend terbuka, pasang guard `['RADIOLOGIST', 'DOCTOR', 'ADMIN']`. |
| **13** | `/operating-theatre` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | `POST /api/v1/perioperative/*` | `ROLE_SURGEON` verified | 🟡 **MEDIUM RISK** | Rute frontend terbuka, pasang guard `['SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE', 'ADMIN']`. |
| **14** | `/pharmacy-enterprise`| `clinical.routes.jsx`| ⚠️ Tidak ada role guard | `POST /api/v1/medications/dispense` | `ROLE_PHARMACIST` verified | 🟡 **MEDIUM RISK** | Rute frontend terbuka, pasang guard `['PHARMACIST', 'ADMIN']`. |
| **15** | `/pharmacy` | `pharmacy.routes.jsx` | ✅ `['PHARMACIST', 'ADMIN', 'DOCTOR']`| `POST /api/v1/medications/*` | `ROLE_PHARMACIST` | 🟢 **SECURE** | Terproteksi dengan baik. |
| **16** | `/blood-bank` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | Pending API | - | 🔴 **HIGH RISK** | Rute terbuka, wajib diproteksi ke `['BLOOD_BANK_OFFICER', 'LAB_ANALYST', 'ADMIN']`. |
| **17** | `/icu-acuity` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | Pending API | - | 🟡 **MEDIUM RISK** | Wajib diproteksi ke `['ICU_NURSE', 'DOCTOR', 'ADMIN']`. |
| **18** | `/staff-privileges` | `clinical.routes.jsx` | ⚠️ Tidak ada role guard | Pending API | - | 🔴 **HIGH RISK** | Rute terbuka pada level klinis! Wajib diproteksi ke `['ADMIN', 'SUPERVISOR', 'CLINICAL_DIRECTOR']`. |
| **19** | `/billing` | `admin.routes.jsx` | ✅ `['ADMIN', 'DOCTOR']` | `POST /api/v1/patient-financial/*` | Verified role | 🟡 **PARTIAL GUARD** | Perlu ditambahkan role `['CASHIER', 'CASEMIX_CODER']`. |
| **20** | `/admin` | `admin.routes.jsx` | ✅ `['ADMIN', 'SUPERVISOR']` | Authenticated Admin | `ROLE_ADMIN` | 🟢 **SECURE** | Terproteksi admin. |
| **21** | `/admin/staff-access` | `admin.routes.jsx` | ✅ `['ADMIN', 'SUPERVISOR']` | Authenticated Admin | `ROLE_ADMIN` | 🟢 **SECURE** | Terproteksi admin. |
| **22** | `/audit-trail` | `admin.routes.jsx` | ✅ `['ADMIN', 'SUPERVISOR']` | Authenticated Admin | `ROLE_ADMIN` | 🟢 **SECURE** | Terproteksi admin. |
| **23** | `/admin/master-hub` | `admin.routes.jsx` | ✅ `['ADMIN', 'SUPERVISOR']` | Authenticated Admin | `ROLE_ADMIN` | 🟢 **SECURE** | Terproteksi admin. |
| **24** | `/master-data` | `admin.routes.jsx` | ⚠️ Tidak ada role guard | Pending API | - | 🔴 **HIGH RISK** | Rute master data terbuka tanpa guard admin! Wajib diproteksi `['ADMIN', 'SUPERVISOR']`. |
| **25** | `/command-center` | `admin.routes.jsx` | ⚠️ Tidak ada role guard | Pending API | - | 🟡 **MEDIUM RISK** | Wajib diproteksi ke `['ADMIN', 'SUPERVISOR', 'HOSPITAL_DIRECTOR']`. |
| **26** | `/inventory/*` | `pharmacy.routes.jsx` | ⚠️ Tidak ada role guard | Pending API | - | 🟡 **MEDIUM RISK** | Wajib diproteksi ke `['PHARMACIST', 'LOGISTICS_OFFICER', 'ADMIN']`. |
| **27** | `/satusehat` | `enterprise.routes.jsx`| ⚠️ Tidak ada role guard | Pending API | - | 🔴 **HIGH RISK** | Kredensial & integrasi Kemenkes terbuka! Wajib diproteksi `['ADMIN', 'IT_ADMIN']`. |

---

## 2. 🛡️ REKOMENDASI PENGUATAN RBAC SEGERA (P0 & P1 ACTION ITEMS)

1. **Pasang `ProtectedRoute` pada seluruh rute sensitif di `src/routes/clinical.routes.jsx`**:
   - Batasi `/blood-bank` $\rightarrow$ `['BLOOD_BANK_OFFICER', 'LAB_ANALYST', 'ADMIN']`
   - Batasi `/staff-privileges` $\rightarrow$ `['ADMIN', 'SUPERVISOR', 'CLINICAL_DIRECTOR']`
   - Batasi `/doctor-workspace` $\rightarrow$ `['DOCTOR', 'ADMIN']`
   - Batasi `/nursing-workspace` $\rightarrow$ `['NURSE', 'ADMIN']`
   - Batasi `/operating-theatre` $\rightarrow$ `['SURGEON', 'ANESTHESIOLOGIST', 'OR_NURSE', 'ADMIN']`
2. **Pasang `ProtectedRoute` pada rute tata kelola di `src/routes/admin.routes.jsx` & `enterprise.routes.jsx`**:
   - Batasi `/master-data` $\rightarrow$ `['ADMIN', 'SUPERVISOR']`
   - Batasi `/command-center` $\rightarrow$ `['ADMIN', 'SUPERVISOR', 'HOSPITAL_DIRECTOR']`
   - Batasi `/satusehat` & `/interoperability` $\rightarrow$ `['ADMIN', 'IT_ADMIN']`
   - Batasi `/inventory/*` $\rightarrow$ `['PHARMACIST', 'LOGISTICS_OFFICER', 'ADMIN']`
3. **Tambahkan role kasir dan casemix coder pada `/billing`**:
   - Update `allowedRoles` pada `/billing` menjadi `['ADMIN', 'DOCTOR', 'CASHIER', 'CASEMIX_CODER']`.
