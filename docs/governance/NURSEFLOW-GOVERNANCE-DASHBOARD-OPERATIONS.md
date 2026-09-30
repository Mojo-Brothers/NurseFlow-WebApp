# NURSEFLOW GOVERNANCE DASHBOARD — OPERATIONS & MAINTENANCE MANUAL

> **Document ID:** `NF-GOV-OPERATIONS-001`  
> **Status:** `RATIFIED`  
> **Classification:** `ENTERPRISE HIS OPERATIONS & GOVERNANCE GUIDE`  
> **Author:** Governance Systems Engineer & Site Reliability Auditor  
> **Date:** September 28, 2026  

---

## 1. Operational Overview

NurseFlow Project Governance Dashboard beroperasi sebagai sistem inspeksi dan telemetri *read-only* terintegrasi. Sistem ini menyediakan visibilitas tingkat tinggi bagi Principal Engineer, Security Auditor, dan Project Leadership tanpa memerlukan akses konsol basis data langsung.

---

## 2. Refresh & Rescan Model

Dashboard mendukung dua model pembaruan data:
1. **Live On-Demand Rescan:**
   - Menekan tombol **Rescan** di header dashboard memicu pemanggilan `GET /api/v1/governance/full-audit`.
   - Layanan `governanceScanner.service.js` membaca ulang rute Express, berkas migrasi SQL, suite pengujian, dan katalog PostgreSQL.
   - Hasil scan di-cache selama 10 detik (`CACHE_TTL_MS = 10000`) untuk mencegah I/O thrashing pada server.
2. **Resilient Offline Fallback:**
   - Jika server backend tidak aktif (misalnya saat peninjauan antarmuka statis atau pengujian unit front-end), `governanceService.js` secara otomatis menyajikan snapshot kanonikal dari `governanceBaselineData.js`.

---

## 3. Stale Evidence & Contradiction Detection Protocols

### 3.1 Contradiction Detection
Ketika terjadi diskrepansi antara klaim dokumen dan kode sumber fisik (misalnya: dokumen menyatakan otorisasi klinis selesai, namun 0 rute yang memasang middleware):
1. Scanner secara otomatis membangkitkan objek kontradiksi:
   ```json
   {
     "claim": "Clinical Authorization is implemented and active.",
     "reality": "Physical scan proves 0 of 38 Tier-1 routes mount requireClinicalAuthorization.",
     "conservativeVerdict": "NOT_ENFORCED"
   }
   ```
2. Banner peringatan berwarna merah marun secara otomatis muncul di bagian atas halaman utama dashboard (`GovernanceOverviewPage`).
3. Sistem secara otomatis memilih status konservatif terendah (`NOT_ENFORCED` / `REFUTED`), mencegah pelaporan kemajuan palsu (*progress theater*).

### 3.2 Stale Evidence Protocol
Jika berkas kode sumber memiliki waktu modifikasi yang lebih baru daripada dokumen audit terkait, sistem menandai bukti dengan bendera `EVIDENCE_POTENTIALLY_STALE`.

---

## 4. Security Hardening & Zero-Mutation Invariant

Untuk menjamin kepatuhan medis dan audit ISO 27001 / Permenkes:
- **Zero Mutation API:** Router `server/routes/governance.routes.js` murni hanya mengekspos metode HTTP `GET`. Tidak ada handler `POST`, `PUT`, `DELETE`, atau `PATCH`.
- **Zero Role Alteration:** Scanner membaca katalog `pg_roles` dan `pg_policy` secara pasif tanpa mengubah kepemilikan objek atau hak akses.
- **Production Clinical Changes = FALSE:** Seluruh operasi dashboard terisolasi pada namespace `/engineering/governance/*` dan tidak mempengaruhi rute pasien, IGD, bangsal, atau farmasi.
