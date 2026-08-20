# 🏛️ AUDIT FASE 5A & 5B: BACKEND REALITY, EXECUTION PATH & MOCK GRAVITY AUDIT
## Laporan Investigasi Mendalam Jalur Eksekusi Data Riil, Analisis Ketergantungan Mock/Simulasi, dan Desain Unifikasi Backend PostgreSQL
**Tanggal Audit:** 20 Agustus 2026  
**Auditor Tim:** Enterprise HIS Architecture Board & CTO Technical Review  
**Klasifikasi:** Phase 5A & 5B Technical Audit Baseline  
**Status Evaluasi:**  
- 🟡 **SPRINT 4B.16:** `ACCEPTED — SOFTWARE EVIDENCE FRAMEWORK VERIFIED`  
- 🔒 **REAL OPERATIONAL EVIDENCE:** `PENDING REAL EXTERNAL ACQUISITION`  
- 🚫 **GO-LIVE AUTHORITY:** `NOT GRANTED (BLOCKED PENDING BACKEND UNIFICATION & FIELD UAT)`  

---

## 🎯 1. PERNYATAAN EPISTEMIK CTO

> 🔒 **"Fondasi perangkat lunak NurseFlow telah diverifikasi secara luas pada level automated verification dan framework evidence. Ketahanan operasional nyata, integritas execution path backend, dan kesiapan go-live masih memerlukan pembuktian eksternal."**  
> 🔒 **"A test may prove that a control exists. Only external evidence may prove that the control operated in reality."**  
> 🔒 **"Tidak boleh ada status 'diasumsikan sudah backend'. Setiap tindakan klinis harus dapat ditelusuri hingga menjadi durable state di PostgreSQL."**

---

## 🔍 2. PHASE 5A: BACKEND REALITY & EXECUTION PATH MATRIX

Berikut adalah hasil penelusuran jalur eksekusi nyata (*code path tracing*) dari antarmuka pengguna (UI) hingga ke penyimpanan persisten:

| No | Domain Klinis Kritis | UI Component | Real API Endpoint | Auth Guard | Transaction FSM | PostgreSQL Table | Audit Trail | Outbox Event | Status Jalur Eksekusi Nyata |
| :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| **1** | **Patient Admission** | `RegistrationDeskWorkspace.jsx` | ❌ *Bypassed* | `PermissionGate` | `CareStateEngine` (Memory) | `001_master_patients.sql` (Idle) | `localStorage` | Client Memory | **`SIMULATED`** |
| **2** | **IGD / Rapid Triage** | `RapidTriageStudio.jsx` | ❌ *Bypassed* | `PermissionGate` | `triageEngine.service.js` | `004_triage_and_emergency.sql` (Idle) | `localStorage` | Client Memory | **`SIMULATED`** |
| **3** | **EMR / CPPT SOAP** | `SoapWorkspace.jsx` | ❌ *Bypassed* | `PermissionGate` | `soapEngine.service.js` | `005_emr_soap_cppt_and_cdss.sql` (Idle)| `localStorage` | Client Memory | **`SIMULATED`** |
| **4** | **CPOE Clinical Orders**| `OrderEntryWorkspace.jsx` | ❌ *Bypassed* | `PermissionGate` | `universalOrderEngine.js`| `006_universal_orders.sql` (Idle) | `localStorage` | Client Memory | **`SIMULATED`** |
| **5** | **eMAR 5-Benar** | `EmarAdministrationStudio.jsx` | ❌ *Bypassed* | `PermissionGate` | `pointOfCareFiveRights.js`| `006_universal_orders.sql` (Idle) | `localStorage` | Client Memory | **`SIMULATED`** |
| **6** | **Pharmacy FEFO Depot** | `EnterprisePharmacyWorkspace.jsx`| ❌ *Bypassed* | `PermissionGate` | `fefoMultiDepotInventory.js`| `012_pharmacy_inventory_fefo.sql` (Idle)| `localStorage` | Client Memory | **`SIMULATED`** |
| **7** | **Laboratory (LIS)** | `LabPage.jsx` | ❌ *Bypassed* | `PermissionGate` | `lisSpecimenTracking.js` | `016_lis_specimen_tracking.sql` (Idle) | `localStorage` | Client Memory | **`SIMULATED`** |
| **8** | **Radiology (PACS)** | `RadiologyWorkspacePage.jsx` | ❌ *Bypassed* | `PermissionGate` | `pacsDicomEngine.service.js`| `017_pacs_radiology_dicom.sql` (Idle)| `localStorage` | Client Memory | **`SIMULATED`** |
| **9** | **Billing & Ina-CBG** | `BillingPage.jsx` | ❌ *Bypassed* | `PermissionGate` | `surgicalRevenueCycle.js`| `007_billing_revenue_claims.sql` (Idle)| `localStorage` | Client Memory | **`SIMULATED`** |
| **10**| **External Integration**| `SatusehatStudioPage.jsx` | ❌ *Bypassed* | `ZeroTrustGuard` | `satusehatFhir.service.js`| `035_fhir_reliable_delivery.sql` (Idle)| `localStorage` | Sandbox HTTP | **`MOCK_BACKED`** |

### 🔎 Temuan Kritis Phase 5A:
1. **Semua Domain Klinis Utama Saat Ini Berstatus `SIMULATED`:**
   - Ketika dokter memasukkan SOAP, perawat melakukan eMAR, atau apoteker merilis obat, data disimpan ke dalam `localStorage` browser dan array JavaScript in-memory via `BaseRepository` / `PersistenceAdapter`.
   - Backend Express (`server/server.js`) dan 55 migrasi SQL DDL PostgreSQL telah terdefinisi secara sangat lengkap dan rapi, namun **belum ada kabel data (HTTP fetch / API call) yang menghubungkan frontend SPA ke endpoint server tersebut**.
2. **Dampak Medicolegal & Keamanan Data:**
   - Jika browser melakukan *Clear Site Data / Cache*, seluruh data rekam medis yang diinput di UI akan hilang seketika karena belum pernah mencapai tabel fisik PostgreSQL.
   - Status ini membuktikan kebenaran putusan CTO: **NurseFlow belum boleh di-deploy ke rumah sakit fisik sebelum dilakukan unifikasi backend.**

---

## 🔬 3. PHASE 5B: MOCK & SIMULATION GRAVITY AUDIT

Hasil inventarisasi dan klasifikasi tingkat risiko mock/simulasi di seluruh basis kode:

| Kategori Kode | Lokasi File / Pola Temuan | Klasifikasi Risiko | Evaluasi & Dampak Keamanan Klinis |
| :--- | :--- | :---: | :--- |
| **`localStorage` Mirror** | `src/core/services/persistenceAdapter.service.js`, `src/core/repositories/baseRepository.js` | ⚠️ **CLINICAL_SAFETY_RISK** | *Tinggi*: Digunakan sebagai tempat penyimpanan utama data pasien. Seharusnya hanya menjadi *Offline Cache* sementara saat jaringan mati. |
| **In-Memory Store Map** | `src/modules/*/services/*.service.js` (`inMemoryTriages`, `inMemorySoap`, `memoryOrders`) | ⚠️ **CLINICAL_SAFETY_RISK** | *Tinggi*: State transaksi klinis hidup di variabel global JavaScript client. Reset saat tab browser ditutup jika localStorage penuh. |
| **`Math.random()` IDs** | `src/modules/*/services/*.service.js` (`REC-${Date.now()}`, `TRG-${Date.now()}`) | 🟡 **PRODUCTION_RISK** | *Sedang*: ID entitas dibuat di sisi client dengan timestamp/random, bukan UUID v4 / PostgreSQL Sequence berintegritas tinggi. |
| **`setTimeout` Latency** | `src/core/services/adversarialAssuranceEngine.service.js`, `realEnvironmentPilotEngine.service.js` | 🟢 **TEST_ONLY** | *Aman*: Digunakan secara sah untuk mensimulasikan fluktuasi latensi jaringan Wi-Fi pada test harness. |
| **`demoData.js` & Seeds** | `src/core/demoData.js`, `src/modules/master_data/data/masterDataSeed.js` | 🟢 **DEVELOPMENT_ONLY** | *Aman*: Digunakan untuk initial seeder development. Harus diisolasi agar tidak menimpa data master rumah sakit riil. |
| **Mock SATUSEHAT Gateway**| `src/core/services/satusehatFhir.service.js` (Mock OAuth2 / Sandbox endpoint) | 🟡 **PRODUCTION_ALLOWED** | *Aman untuk Staging*: Valid untuk pengujian integrasi sandbox Kemenkes, namun butuh switch environment otomatis untuk Production. |
| **IndexedDB Local-First** | `src/core/services/syncQueue.service.js` (Offline sync queue) | 🟢 **PRODUCTION_ALLOWED** | *Sangat Bagus*: Sesuai standar Local-First Architecture untuk menjamin tablet perawat tetap bisa input saat Wi-Fi bangsal drop. |

---

## 🛠️ 4. PHASE 5C: CETAK BIRU UNIFIKASI BACKEND REALITY (THE SINGLE PIPELINE)

Untuk mengeliminasi seluruh status `SIMULATED` dan menyatukan sistem ke dalam satu-satunya *Single Source of Truth*, seluruh transaksi klinis harus mengikuti jalur pipa tunggal:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE UNIFIED PRODUCTION PIPELINE                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                [ React UI ]
                                      │
                        (Authenticated HTTP Request)
                                      ▼
                        [ Express REST API Gateway ]
                                      │
                         (RBAC / ABAC Permission)
                                      ▼
                        [ Domain Service Command ]
                                      │
                         (Clinical Business Rules)
                                      ▼
                     [ ACID PostgreSQL 16 Transaction ]
                     ├── 1. Insert/Update Clinical Record
                     ├── 2. Append-Only Immutable Audit Log (SHA-256)
                     └── 3. Insert Outbox Event (Transactional Outbox)
                                      ▼
                                [ COMMIT TX ]
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        [ Local-First Client Cache ]           [ Async Background Worker ]
          (Survives Network Loss)              ├── Send SATUSEHAT FHIR R4
                                               ├── Send BPJS VClaim SEP
                                               └── Notify PACS Modality
```

### Rencana Kerja Teknis Phase 5C:
1. **Membangun HTTP API Client Terpusat (`src/core/api/httpClient.js`):** Menggunakan `fetch` dengan interceptor JWT token, Correlation ID, dan offline fallback ke `syncQueue` (IndexedDB).
2. **Mengubah Seluruh Service UI:** Menggantikan pemanggilan `localStorage.setItem()` dengan `httpClient.post('/api/v1/...')`.
3. **Mengaktifkan PostgreSQL Controllers di Server (`server/controllers/`):** Mengubah seluruh endpoint Express agar menjalankan kueri SQL relasional via `postgresPool.js` di dalam blok `BEGIN ... COMMIT`.

---

## 📋 5. PHASE 5D: STRUKTUR MANIFEST EVIDENCE & CHAIN OF CUSTODY (GATE G8 SPECIFICATION)

Gate G8 memvalidasi rantai bukti tak terbantahkan (*Chain of Custody*) menggunakan schema formal:

```json
{
  "evidence_id": "EVID-POSTGRES-ACID-20260820-001",
  "scenario_id": "G1-PG-PHYSICAL-TRANSACTION-STRESS",
  "source_type": "BARE_METAL_POSTGRES_NODE",
  "source_system_identity": "srv-db-his-prod-01.hospital.internal (Kernel 6.1.0-Debian-x86_64)",
  "environment_identity": "ON_PREMISE_HOSPITAL_DATA_CENTER_RACK_A4",
  "captured_at": "2026-08-20T02:15:30.120Z",
  "captured_by": "Ahmad Fauzi, S.Kom (Lead Infrastructure SRE, NIK: 19880412)",
  "raw_artifact_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "acquisition_method": "DIRECT_KERNEL_EBPF_PCAP_STREAM",
  "chain_of_custody": [
    { "step": "CAPTURED", "by": "Ahmad Fauzi (SRE)", "time": "2026-08-20T02:15:30Z" },
    { "step": "SEALED", "by": "Hendro (CISO)", "time": "2026-08-20T02:18:00Z" },
    { "step": "UNDER_REVIEW", "by": "dr. Bambang Sp.PD (Clinical Lead)", "time": "2026-08-20T03:00:00Z" },
    { "step": "VERIFIED", "by": "Independent KARS IT Auditor", "time": "2026-08-20T04:30:00Z" }
  ],
  "independent_observer": "Ir. Haryanto, M.Kom (Lead Assessor KARS/JCI)",
  "reviewer": "dr. Robby (Enterprise System Owner)",
  "retention_policy": "PERMENKES_24_2022_25_YEARS_IMMUTABLE",
  "status": "VERIFIED",
  "supersedes": null
}
```

### Aturan Status Bukti:
- `CAPTURED` $\rightarrow$ `SEALED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `VERIFIED`
- Status alternatif: `REJECTED`, `REVOKED`, `EXPIRED`.
- **HANYA BUKTI BERSTATUS `VERIFIED` YANG BOLEH DIHITUNG DALAM PENILAIAN READINESS.**

---

## 📊 6. STATUS PROYEK NURSEFLOW TERKINI (SCORECARD RESMI)

```text
NURSEFLOW PROJECT STATUS — CTO AUDIT SCORECARD
══════════════════════════════════════════════════════════════════════════════

SOFTWARE FOUNDATION
█████████████████████████████████░  VERIFIED (In-Memory / State Models Solid)

AUTOMATED ASSURANCE
██████████████████████████████████  VERIFIED (149 Suites / 1.293 Tests PASS)

DEPLOYMENT QUALIFICATION
██████████████████████████████░░░░  SOFTWARE QUALIFIED (Docker/Nginx/Build Ready)

EVIDENCE FRAMEWORK
████████████████████████████████░░  VERIFIED (G1-G8 Engine & Provenance Ready)

REAL BACKEND EXECUTION PATH
████████████████░░░░░░░░░░░░░░░░░░  AUDITED — SIMULATED (Phase 5C Required)

REAL INFRASTRUCTURE
████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  PENDING PHYSICAL SERVER SETUP

INDEPENDENT HUMAN UAT
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  PENDING REAL CLINICAL PILOT

EXTERNAL OPERATIONAL EVIDENCE
████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  FRAMEWORK ONLY (Awaiting Live Field Capture)

GO-LIVE AUTHORITY
🔴 BLOCKED (Pending Phase 5C Backend Unification & Phase 5D Field Evidence)
══════════════════════════════════════════════════════════════════════════════
```

---

## 🚀 7. LANGKAH STRATEGIS BERIKUTNYA

```text
[FASE 5A & 5B: AUDIT SELESAI]
              │
              ▼
[FASE 5C: REAL BACKEND UNIFICATION]
   ├── Step 1: Bangun Centralized API Client (`httpClient.js`)
   ├── Step 2: Hubungkan 10 Domain Kritis ke Express REST API Gateway
   ├── Step 3: Aktifkan Relational PostgreSQL 16 Transactions di Server
   └── Step 4: Reduksi LocalStorage menjadi Murni Offline Cache
              │
              ▼
[FASE 5D: REAL INFRASTRUCTURE QUALIFICATION & FIELD EVIDENCE ACQUISITION]
   ├── On-premise bare-metal server setup & router fault injection
   ├── Real Disaster Recovery drill dengan rekaman stopwatch tim SRE
   └── Sesi UAT mandiri 10 staf medis rumah sakit (pengumpulan kuesioner SUS bertanda tangan)
              │
              ▼
[FASE 5E: GO / NO-GO GOVERNANCE REVIEW]
```
