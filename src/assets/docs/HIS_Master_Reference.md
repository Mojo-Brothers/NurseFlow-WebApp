# 📋 HIS Enterprise Master Reference (Standard JCI 2026)
Dokumen ini berisi referensi standarisasi master data untuk sistem NurseFlow, mencakup profesi, struktur ruangan, bed management, dan arsitektur Role-Based Access Control (RBAC).

---

## 1. 🩺 Daftar Lengkap Profesi (Medical & Support)
Setiap profesi memiliki kredensial klinis yang terverifikasi dalam sistem.

### A. Tenaga Medis (Medical Staff)
*   **Dokter Umum (GP):** Medical Officer (MO), Dokter Jaga IGD.
*   **Dokter Spesialis (Specialist):** Sp.PD, Sp.A, Sp.OG, Sp.B, Sp.OT, Sp.JP, Sp.S, dll.
*   **Dokter Sub-Spesialis (Consultant):** K-KV, K-GEH, K-Onk, dll.
*   **Dokter Gigi:** Dokter Gigi Umum, Sp.BM, Sp.Ort, dll.

### B. Tenaga Keperawatan (Nursing Staff)
*   **Perawat Klinik I - IV (PK I - PK IV):** Jenjang kompetensi klinis.
*   **Perawat Spesialis:** Perawat Anestesi, Perawat Bedah, Perawat Dialisis.
*   **Bidan:** Bidan Pelaksana, Bidan Koordinator.

### C. Tenaga Kesehatan Lain (Allied Health)
*   **Apoteker:** Farmasi Klinis, Farmasi Rawat Jalan.
*   **Radiografer:** Petugas CT-Scan, MRI, X-Ray.
*   **Analis Laboratorium:** Patologi Klinik, Patologi Anatomi.
*   **Fisioterapis:** Rehabilitasi Medik.
*   **Nutrisionis/Dietisien:** Manajemen Gizi Pasien.

---

## 2. 🏥 Struktur Ruangan, Divisi & Bed Management
Hierarki lokasi untuk pelacakan pasien (Patient Tracking).

### A. Instalasi Gawat Darurat (IGD)
*   **Area Resusitasi (P1):** Bed 01 - 03 (Critical).
*   **Area Tindakan (P2):** Bed 04 - 10 (Urgent).
*   **Area Observasi (P3):** Bed 11 - 20 (Non-Urgent).
*   **Kamar Operasi IGD:** Bed OK-IGD.

### B. Rawat Jalan (Outpatient/Poliklinik)
*   **Cluster Internal:** Poli Penyakit Dalam (Room 101-105).
*   **Cluster Surgical:** Poli Bedah Umum (Room 106), Orthopedi (Room 107).
*   **Cluster Pediatric:** Poli Anak (Room 108-110).
*   **Cluster Women's Health:** Poli Obgyn (Room 111-112).

### C. Rawat Inap (Inpatient Wards)
*   **Lantai 2 - VVIP (Presidency Suite):** Room 201 - 205 (1 Bed/Room).
*   **Lantai 3 - VIP (Executive):** Room 301 - 315 (1 Bed/Room).
*   **Lantai 4 - Kelas 1:** Room 401 - 420 (2 Bed/Room: 401A, 401B).
*   **Lantai 5 - Kelas 2:** Room 501 - 515 (4 Bed/Room).
*   **Lantai 6 - ICU/ICCU/NICU:** High Care Unit (Total 20 Bed).

---

## 3. 🔐 Arsitektur Role & Kewenangan (Complex RBAC)
Pembatasan akses data berdasarkan fungsi jabatan (Needs-to-know basis).

| Role ID | Role Name | Deskripsi Kewenangan |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | IT & System Admin | Full access, audit log management, user provisioning. |
| `MED_DIRECTOR` | Direktur Medis | View all clinical reports, medical audit, analytics dashboard. |
| `DR_DPJP` | Dokter DPJP | Full EMR access (Sign-off), Order Lab/Rad, E-Prescription. |
| `NS_HEAD` | Kepala Ruangan | Bed management, nurse scheduling, view ward dashboard. |
| `NS_CLINICAL` | Perawat Pelaksana | Vital sign entry, nursing notes, medication administration. |
| `PH_CLINICAL` | Apoteker Klinis | Prescription validation, drug interaction check, dispensing. |
| `ADM_REG` | Admission Officer | Patient registration, insurance verification, bed booking. |
| `BILL_CLERK` | Kasir/Billing | Invoicing, payment processing, discharge clearance. |

---

## 4. 📊 Catatan Pengkategorian & Status
Logika sistem untuk otomatisasi workflow.

### A. Kategori Akuitas (Triage Level)
*   **🔴 Level 1 (Resuscitation):** Immediate life-saving intervention.
*   **🟠 Level 2 (Emergency):** High risk, chest pain, unstable.
*   **🟡 Level 3 (Urgent):** Stable, but multiple resources needed.
*   **🟢 Level 4 (Less Urgent):** Simple issue, one resource needed.
*   **🔵 Level 5 (Non-Urgent):** Routine, no resources needed.

### B. Status Pasien (Patient Journey)
*   **REGISTERED:** Data identitas lengkap, menunggu antrian.
*   **TRIAGED:** Sudah melalui asesmen awal perawat.
*   **IN_CONSULTATION:** Sedang diperiksa dokter.
*   **ORDERED:** Menunggu hasil Lab/Radiologi.
*   **ADMITTED:** Sedang dalam perawatan rawat inap.
*   **DISCHARGED:** Selesai perawatan, administrasi lunas.

### C. Flagging Keselamatan (JCI Critical Flags)
*   **FALL_RISK:** Risiko jatuh (Gelang Kuning).
*   **ALLERGY:** Alergi obat/makanan (Gelang Merah).
*   **DNR:** Do Not Resuscitate (Kebijakan Akhir Hayat).
*   **INFECTIOUS:** Pasien isolasi (Airborne/Contact).

---
*NurseFlow Master Reference v1.0 — 2026 Enterprise Edition*
