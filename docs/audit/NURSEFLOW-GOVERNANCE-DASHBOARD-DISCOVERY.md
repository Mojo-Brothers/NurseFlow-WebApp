# NURSEFLOW GOVERNANCE DASHBOARD — REPOSITORY DISCOVERY REPORT

> **Document ID:** `NF-GOV-DASHBOARD-DISCOVERY-001`  
> **Status:** `COMPLETE`  
> **Classification:** `ENTERPRISE HIS GOVERNANCE & AUDIT ARTIFACT`  
> **Audit Date:** September 28, 2026  
> **Author:** Principal Software Architect & Enterprise HIS Governance Auditor  

---

## 1. Executive Summary

Laporan ini merupakan hasil dari **Phase A — Repository Discovery** untuk perancangan dan implementasi **NurseFlow Project Governance & Progress Dashboard**. 

Audit dilakukan secara menyeluruh terhadap pohon kode sumber (*source code tree*), migrasi basis data, pengujian otomatis, rute API, berkas dokumentasi tata kelola (*governance*), serta artefak audit keamanan. Tujuannya adalah memastikan bahwa seluruh metrik, status, dan visualisasi yang akan ditampilkan pada dashboard diturunkan secara langsung dari fakta empiris repositori (*evidence-driven*), bukan dari estimasi subjektif atau asumsi dokumen.

---

## 2. Repository Topology & Physical Inventory

| Domain / Artefak | Lokasi Repositori | Metrik Aktual (Scanned) | Catatan Status |
|---|---|---|---|
| **Frontend Core** | `src/` | React 19.2.4, Vite 8.0.4, Tailwind 3.4.19, Radix UI | Menggunakan `react-router-dom` v7, Zustand store |
| **Backend API** | `server/` | Express 5.2.1, Node.js ES Modules | Terdiri dari 27 router, 85 servis, 144 endpoints |
| **Database Migrations** | `database/migrations/` | **76 SQL Migrations** (001 s/d 076) | Terakhir: `076_reconcile_authorization_decision_taxonomy.sql` |
| **Automated Test Suites**| `tests/` | **195 Test Files** | Mencakup unit, vertical slice, chaos, adversarial |
| **Audit Documents** | `docs/audit/` | **12 Laporan Audit Formal** | Dari P0-2B Wave 1 s/d Wave 1A.5.3 |
| **Governance Documents**| `docs/governance/`| **26 Dokumen Tata Kelola** | Termasuk Domain Map, Completeness, P0-2A Baseline |
| **Historical Logs** | `docs/CHANGELOG_PERUBAHAN_HIS.md` | 5,700+ baris catatan kronologis | Dari tahap inisiasi hingga P0-2B Wave 1A.5.3 |
| **Evidence Datasets** | `scratch/*.json` | 10+ JSON Evidence Registries | Termasuk Wave 1A.4, 1A.5, 1A.5.1, 1A.5.2, 1A.5.3 |

---

## 3. Reality vs Claim Contradiction Matrix

Discovery mengidentifikasi beberapa titik diskrepansi kritis antara klaim dokumentasi dan implementasi fisik di repositori:

| Area / Kontrol | Klaim Dokumentasi / Target Desain | Realitas Repositori (Empirical Scan) | Status Konservatif |
|---|---|---|---|
| **Runtime Database Role** | Target arsitektur: `nurseflow_app_user` (non-superuser, least-privilege). | Koneksi runtime di `postgresPool.js` masih menggunakan user `postgres` (Superuser, `BYPASSRLS=true`). | **`BLOCKED`** |
| **PostgreSQL RLS Policies** | RLS aktif pada seluruh tabel transaksi klinis. | 59 tabel memiliki RLS aktif, namun **21 tabel memiliki 0 kebijakan** dan **5 tabel memiliki kebijakan fail-open**. | **`NOT_READY`** |
| **Tier-1 Clinical Authorization** | Otorisasi klinis mencakup DPJP credentials, SoD, dan Break-The-Glass. | Middleware `requireClinicalAuthorization` diimplementasikan, tetapi **0 dari 38 rute Tier-1 yang memasangnya**. | **`NOT_ENFORCED`** |
| **Service DB Access Pattern** | Scoped Unit-of-Work dengan ALS context propagation. | Ditemukan **515 pemanggilan langsung `client.query`** pada 85 servis tanpa pembungkus UoW terpusat. | **`DESIGNED_ONLY`** |
| **Token Blacklist Revocation** | Zero-trust token revocation pada insiden keamanan. | Disimpan dalam in-memory JavaScript `Set` (`SERVER_TOKEN_BLACKLIST`), tidak terdistribusi antar kluster. | **`VULNERABLE`** |

---

## 4. Current Phase Roadmap Verification

Berdasarkan analisis silang dokumen audit dan repositori, status fase NurseFlow saat ini berada pada:

```text
PHASE 0 — Reality / Repository Audit                [VERIFIED / COMPLETE]
PHASE 1 — Domain & Architecture Baseline             [VERIFIED / COMPLETE]
PHASE 2 — Governance / Traceability Baseline         [VERIFIED / COMPLETE]
PHASE 3 — P0-2A Authorization Foundation             [RATIFIED]
PHASE 4 — P0-2B Wave 1 Baseline                      [VERIFIED / COMPLETE]
PHASE 5 — Wave 1A Contract Mapping                   [VERIFIED / COMPLETE]
PHASE 6 — Wave 1A.2 Adversarial Verification         [VERIFIED / COMPLETE]
PHASE 7 — Wave 1A.3 Security Boundary Resolution     [VERIFIED / COMPLETE]
PHASE 8 — Wave 1A.4 Architecture Gate                [VERIFIED / COMPLETE]
PHASE 9 — Wave 1A.5 Security Resolution              [REFUTED]
PHASE 10 — Wave 1A.5.1 Adversarial Challenge         [REFUTED]
PHASE 11 — Wave 1A.5.2 Evidence & Arch Closure       [COMPLETE / ARCH READY / FOUNDATION NOT READY]
PHASE 12 — Wave 1A.5.3 Adversarial Review            [HOLD / CURRENT]
PHASE 13 — Security Foundation Implementation        [BLOCKED]
PHASE 14 — Independent Post-Impl Security Audit      [NOT STARTED]
PHASE 15 — P0-2B Wave 1B Clinical Authorization      [HOLD]
PHASE 16+ — Clinical / Operational Completion        [FUTURE]
```

---

## 5. Architectural Implications for Dashboard UI

1. **Dashboard Location:**  
   Dashboard akan dipasang pada rute:
   - `/engineering/governance` (Executive Overview)
   - `/engineering/governance/roadmap` (Roadmap & Phases)
   - `/engineering/governance/workstreams` (Workstream Kanban/Board)
   - `/engineering/governance/security` (Critical Security Gate)
   - `/engineering/governance/findings` (Findings & Risk Register)
   - `/engineering/governance/evidence` (Evidence Explorer)
   - `/engineering/governance/domains` (Domain Maturity Matrix)
   - `/engineering/governance/tests` (Quality & Testing Engine)
   - `/engineering/governance/database` (Database & Schema Inventory)
   - `/engineering/governance/changes` (Audit & Change Timeline)

2. **Integration with Existing Navigation:**  
   Menambahkan entri menu `Project Governance & Control Center` pada domain `ADMINISTRATION` di [`src/layouts/MainLayout.jsx`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/layouts/MainLayout.jsx).

3. **Read-Only Safety Guarantee:**  
   Dashboard murni bersifat *read-only presentation and analysis layer*. Tidak mengeksekusi DDL, DML, atau mutasi data apa pun.
