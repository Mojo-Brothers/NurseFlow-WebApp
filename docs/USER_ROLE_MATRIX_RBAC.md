# 👥 User Role Matrix & RBAC / ABAC Permissions
## NurseFlow Enterprise HIS 2026

**Standard Compliance:** JCI 7th Edition (Information Management & Access Control), Permenkes No. 24/2022

---

## 1. 🛡️ Matrix Hak Akses Peran Klinis & Administratif

| Modul / Fitur Klinis | DOCTOR (DPJP) | NURSE | PHARMACIST | LAB ANALYST | RADIOGRAPHER | ADMISSION ADMIN | CASHIER | SUPERVISOR / AUDITOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Pencarian Master Pasien (EMPI)** | 👁️ Read | 👁️ Read | 👁️ Read | 👁️ Read | 👁️ Read | ✍️ Write | 👁️ Read | 👁️ Read |
| **Registrasi Pasien Baru / Mr. X** | ❌ | ✍️ Emergency | ❌ | ❌ | ❌ | ✍️ Full | ❌ | 👁️ Read |
| **Triase IGD (ABCDE & ESI 1-5)** | 👁️ Read | ✍️ Full | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ Read |
| **Input CPPT / SOAP Medis** | ✍️ Full (Sign) | 👁️ Read | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ Read |
| **Input Catatan Keperawatan (eMAR)** | 👁️ Read | ✍️ Full | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ Read |
| **Penerbitan Order Klinis (Rx, Lab, Rad)** | ✍️ Full | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ Read |
| **Dispensing Farmasi (FEFO)** | ❌ | ❌ | ✍️ Full | ❌ | ❌ | ❌ | ❌ | 👁️ Read |
| **Input Hasil Laboratorium & Nilai Kritis**| ❌ | ❌ | ❌ | ✍️ Full | ❌ | ❌ | ❌ | 👁️ Read |
| **Uji Crossmatch Bank Darah (BDRS)** | ❌ | ❌ | ❌ | ✍️ Full | ❌ | ❌ | ❌ | 👁️ Read |
| **Verifikasi Transfusi Bedside (Dual Nurse)**| ❌ | ✍️ Full | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ Read |
| **WHO Surgical Checklist (IBS)** | ✍️ Sign | ✍️ Sign | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ Read |
| **Kalkulasi Biaya & Tagihan Pasien** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✍️ Full | 👁️ Read |
| **Audit Log & Credentialing STR/SIP** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✍️ Full |

---

## 2. 🔐 Kebijakan Pembatasan Data Berbasis Atribut (ABAC)
1. **STR/SIP Validity:** Dokter/Perawat dengan STR/SIP kedaluwarsa diblokir dari menandatangani dokumen medis atau menerbitkan resep obat.
2. **Department Binding:** Petugas Farmasi hanya dapat mengubah status order pada kategori `PHARMACY`.
3. **Emergency Override (Break-Glass Protocol):** Dalam kondisi darurat *Code Blue*, dokter/perawat jaga IGD memiliki hak akses sementara untuk membaca riwayat medis pasien dari bangsal lain dengan pencatatan audit log wajib.
