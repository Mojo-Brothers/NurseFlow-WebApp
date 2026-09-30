# NURSEFLOW GOVERNANCE DASHBOARD — ARCHITECTURE SPECIFICATION

> **Document ID:** `NF-GOV-DASHBOARD-ARCH-001`  
> **Status:** `RATIFIED`  
> **Classification:** `ENTERPRISE HIS ARCHITECTURE & AUDIT SYSTEM`  
> **Author:** Principal Software Architect & Governance Systems Engineer  
> **Date:** September 28, 2026  

---

## 1. System Mission & Core Directives

NurseFlow Project Governance & Progress Dashboard adalah sistem pemantauan arsitektur dan kepatuhan enterprise (*truth layer*) yang menyajikan status riil proyek NurseFlow secara transparan, berbasis bukti (*evidence-driven*), dan berorientasi keamanan (*security-first*).

Sistem ini dibangun untuk menjawab pertanyaan fundamental:
1. Di mana posisi NurseFlow sebenarnya?
2. Apa yang sudah benar-benar terbukti selesai?
3. Apa yang baru berupa desain konseptual?
4. Apa yang sedang terblokir dan mengapa?
5. Apa tindakan terstruktur yang wajib dilakukan berikutnya?

---

## 2. Architectural Layers

```text
┌────────────────────────────────────────────────────────┐
│               PRESENTATION LAYER                       │
│  React 19 + Tailwind CSS + Lucide React + Radix UI     │
│  Route: /engineering/governance/* (10 Specialized Hubs)│
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│               CLIENT GOVERNANCE LAYER                  │
│  governanceService.js (Cache, Search, Filtering)       │
│  Fallback: governanceBaselineData.js                   │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP JSON API (Read-Only)
┌───────────────────────────┴────────────────────────────┐
│                SERVER API ROUTER                       │
│  /api/v1/governance/* (Express 5 Router)              │
│  TTL Caching (10s), RFC 7807 Error Responses           │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│             EVIDENCE SCANNER SERVICE                   │
│  governanceScanner.service.js                          │
│  • AST & Regex Route Scanner (server/routes/*.js)      │
│  • Migration Catalog Scanner (database/migrations/*.sql│
│  • Test Suites Categorizer (tests/*.test.js)           │
│  • PostgreSQL Live System Catalog Reader (pg_policy)   │
│  • Contradiction & Stale Evidence Detection Engine     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Truth Layer & Conservative Status Resolution

Prinsip utama dashboard adalah **Conservative Status Resolution**:
- Jika sebuah komponen diklaim telah `IMPLEMENTED` di dokumen, namun scan fisik membuktikan kueri atau mounting rute belum ada (misalnya: `0/38 requireClinicalAuthorization`), status diturunkan menjadi **`NOT_ENFORCED`** atau **`REFUTED`**, dengan bendera `CONTRADICTION_DETECTED`.
- Jika sebuah kontrol memiliki desain arsitektur lengkap namun belum ada baris kode produksi, status adalah **`DESIGNED_ONLY`**.
- Jika pengujian database menunjukkan celah aktif (misalnya: koneksi berjalan sebagai superuser `postgres`), gerbang keamanan ditandai **`BLOCKED`**.

---

## 4. Security & Read-Only Safety Directives

Dashboard mematuhi batasan read-only yang ketat:
- **No Mutations:** Tidak ada endpoint mutasi (`POST`/`PUT`/`DELETE` ke basis data klinis).
- **No Role Modifications:** Tidak mengubah peran basis data atau konfigurasi pool.
- **No Active Migrations:** Tidak mengeksekusi DDL pada database aktif.
- **Production Clinical Changes: FALSE:** Tidak mengubah satu pun alur kerja klinis dokter, perawat, atau farmasi yang sedang berjalan.
