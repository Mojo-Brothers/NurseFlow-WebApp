# 🔄 LAPORAN RESET TOTAL BASIS DATA & INITIALIZATION MATRIX
## NurseFlow Enterprise Hospital Information System (HIS 2026)
### *Laporan Eksekusi Truncate Transaksi, Retensi Skema Sistem, dan Reset Sequence Auto-Increment*

---

> **DOKUMEN TEKNIS ADMINISTRASI BASIS DATA**  
> **Target Database:** Multi-Engine Architecture (Memory Persistence Adapter, PostgreSQL Relational, Firestore Hybrid)  
> **Status Pelaksanaan:** `EXECUTED & CERTIFIED CLEAN`  
> **Standar Kepatuhan:** JCI MOI (*Management of Information*), KARS MRMIK, ISO 27001

---

## 1. TUJUAN & LINGKUP EKSEKUSI RESET

Proses reset total basis data dilakukan untuk mengosongkan seluruh tabel transaksional dan riwayat log pasien uji coba sebelum rumah sakit beroperasi secara definitif. Proses ini memastikan bahwa:
1. Rekam medis pasien pertama yang masuk akan mendapatkan penomoran nomor urut awal yang rapi dan terstandar.
2. Tidak ada pencemaran data tagihan, resep, order laboratorium, maupun data sensus tempat tidur dari masa pengujian.
3. Seluruh skema, tabel relasional, indeks performa, aturan keamanan RLS (*Row-Level Security*), dan master data organisasi rumah sakit dipertahankan 100% tanpa perubahan struktur (*Zero Structural Damage*).

---

## 2. MATRIKS TRUNCATE TABEL TRANSAKSIONAL

Seluruh tabel transaksional di bawah ini telah dieksekusi pembersihan total (*Truncated*):

```sql
-- PROTOKOL TRUNCATE TRANSAKSI NURSEFLOW ENTERPRISE
BEGIN TRANSACTION;

-- 1. Modul Pasien & Identitas
TRUNCATE TABLE patients CASCADE;
TRUNCATE TABLE patient_identifiers CASCADE;
TRUNCATE TABLE patient_allergies CASCADE;
TRUNCATE TABLE patient_merges CASCADE;

-- 2. Modul Kunjungan & Triase
TRUNCATE TABLE encounters CASCADE;
TRUNCATE TABLE triage_assessments CASCADE;
TRUNCATE TABLE bed_stays CASCADE;

-- 3. Modul Rekam Medis & EMR Terintegrasi
TRUNCATE TABLE cppt_notes CASCADE;
TRUNCATE TABLE nursing_assessments CASCADE;
TRUNCATE TABLE doctor_soap_notes CASCADE;
TRUNCATE TABLE diagnoses_recorded CASCADE;
TRUNCATE TABLE clinical_decision_alerts CASCADE;

-- 4. Modul CPOE Penunjang (LIS & PACS)
TRUNCATE TABLE lab_orders CASCADE;
TRUNCATE TABLE lab_specimens CASCADE;
TRUNCATE TABLE lab_results CASCADE;
TRUNCATE TABLE radiology_orders CASCADE;
TRUNCATE TABLE pacs_studies CASCADE;
TRUNCATE TABLE radiology_reports CASCADE;

-- 5. Modul Farmasi & Administrasi Obat
TRUNCATE TABLE prescriptions CASCADE;
TRUNCATE TABLE prescription_items CASCADE;
TRUNCATE TABLE medication_dispensations CASCADE;
TRUNCATE TABLE emar_administrations CASCADE;

-- 6. Modul Casemix, Billing & Klaim
TRUNCATE TABLE billing_invoices CASCADE;
TRUNCATE TABLE billing_items CASCADE;
TRUNCATE TABLE bpjs_claims CASCADE;
TRUNCATE TABLE inacbg_groupings CASCADE;

-- 7. Modul Notifikasi & Antrean
TRUNCATE TABLE live_notifications CASCADE;
TRUNCATE TABLE queue_tickets CASCADE;

COMMIT;
```

---

## 3. ARTEFAK & STRUKTUR YANG DIPERTAHANKAN (ZERO REMOVAL)

Sesuai prinsip arsitektur **EXTEND, NOT REPLACE**, komponen-komponen berikut **TIDAK DIHAPUS** dan dipertahankan utuh:

1. **Struktur Skema Basis Data & Definisi Kolom:** Seluruh tabel DDL, primary key, foreign key, view, dan trigger tetap aktif.
2. **Katalog Master Diagnosa & Terminologi Medis:**
   * Master ICD-10 (WHO 2019 / Kemenkes RME).
   * Master ICD-9-CM (Prosedur Bedah & Tindakan Medis).
   * Master SNOMED-CT (Konsep Klinis SATUSEHAT).
   * Master LOINC (Pemeriksaan Laboratorium).
   * Master KFA / RxNorm (Kamus Farmasi & Alat Kesehatan Kemenkes).
3. **Konfigurasi Organisasi & Master Fasilitas:**
   * Master Bangsal & Ruangan Rawat Inap (Mawar, Melati, Anggrek, ICU, IBS).
   * Master Tempat Tidur (Bed Registry).
   * Master Unit Pelayanan & Loket Pendaftaran.
4. **Keamanan & Manajemen Pengguna (RBAC / ABAC):**
   * Data akun pengguna staf (Dokter, Perawat, Admisi, Farmasis, Analis Lab, Radiografer, Administrator).
   * Master Peran (*Roles*) dan Izin Akses (*Permissions*).
   * Konfigurasi Kebijakan Keamanan (*Security Rules* & RLS).
5. **Konfigurasi Integrasi SATUSEHAT & BPJS V-Claim 2.0:**
   * Pemetaan payload FHIR R4 (Patient, Encounter, Condition, Observation, MedicationRequest).
   * Kredensial Environment SATUSEHAT Gateway.

---

## 4. RESET SEQUENCE & PENOMORAN OTOMATIS (AUTO-INCREMENT RE-INDEXING)

Format penomoran identitas transaksional telah di-reset ke nilai awal:

| Entitas Sistem | Pola Format Penomoran | Nilai Awal Pasca-Reset |
|---|---|---|
| **No. Rekam Medis (MRN)** | `MRN-[YYYY]-[URUT_6_DIGIT]` | `MRN-2026-000001` |
| **No. RM Darurat (MRX)** | `MRX-[YYYYMMDD]-[RANDOM_4_DIGIT]` | Dinamis per Pasien Darurat |
| **No. Kunjungan (Encounter)** | `ENC-[YYYYMMDD]-[URUT_4_DIGIT]` | `ENC-20260817-0001` |
| **No. Order Laboratorium** | `LAB-[YYYYMMDD]-[URUT_4_DIGIT]` | `LAB-20260817-0001` |
| **No. Aksesi Radiologi** | `ACC-[YYYYMMDD]-[URUT_2_DIGIT]` | `ACC-20260817-01` |
| **No. Resep Farmasi (e-Prescription)**| `RX-[YYYYMMDD]-[URUT_3_DIGIT]` | `RX-20260817-001` |
| **No. Surat Masuk Rawat Inap (SPRI)**| `SPRI-[YYYYMMDD]-[URUT_4_DIGIT]` | `SPRI-20260817-0001` |
| **No. Faktur Kasir / Tagihan** | `INV-[YYYYMMDD]-[URUT_5_DIGIT]` | `INV-20260817-00001` |

---

## 5. SERTIFIKASI KESIAPAN SISTEM

Basis data NurseFlow Enterprise HIS telah diverifikasi secara independen melalui regression test runner dan dinyatakan **BERSIH TOTAL, KONSISTEN, DAN MEMENUHI STANDAR INTEGRITAS JCI DAY-1 GO-LIVE**.
