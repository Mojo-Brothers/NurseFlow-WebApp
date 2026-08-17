# 🏥 NurseFlow Enterprise HIS (Hospital Information System) 2026

[![CI Pipeline](https://github.com/Mojo-Brothers/NurseFlow-WebApp/actions/workflows/ci.yml/badge.svg)](https://github.com/Mojo-Brothers/NurseFlow-WebApp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Standards: JCI 7th Edition](https://img.shields.io/badge/Compliance-JCI%207th%20Edition-rose.svg)](docs/CLINICAL_STANDARDS.md)
[![Standards: Permenkes 24/2022](https://img.shields.io/badge/Kemenkes-Permenkes%2024%2F2022%20RME-emerald.svg)](docs/SATUSEHAT_INTEGRATION.md)
[![Standards: HL7 FHIR R4](https://img.shields.io/badge/Interoperability-HL7%20FHIR%20R4-blue.svg)](docs/FHIR_SPECIFICATION.md)
[![Tests: 44 Suites / 185 Tests](https://img.shields.io/badge/Automated%20Tests-185%20PASS%20(100%25)-brightgreen.svg)](tests/)

**NurseFlow** is a next-generation, high-performance, clinical-grade **Hospital Information System (HIS / SIMRS Enterprise)** architected to meet **Joint Commission International (JCI 7th Edition)** patient safety standards, **KARS 2024**, and the Indonesian Ministry of Health **SATUSEHAT / Permenkes No. 24/2022 (Rekam Medis Elektronik)** interoperability mandates.

---

## 🏗️ Enterprise Multi-Layer Architecture

NurseFlow enforces strict separation of concerns across 4 enterprise tiers:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. CLINICAL WORKSPACE & PRESENTATION LAYER (React 19 + Vite 8 + Tailwind)       │
│    ├── Application Shell & ClinicalContextRibbon (Facility, STR/SIP, Live Context)│
│    ├── Master Patient Index (EMPI) & Journey Timeline (Permenkes 24/2022)       │
│    ├── IGD Triage Command Center & Real-Time ESI 1-5 Stopwatch SLA             │
│    ├── Doctor Consultation & CPPT/SOAP Workspace (ICD-10, ICD-9-CM)             │
│    ├── Resuscitation Board & Code Blue Studio (2-Min CPR Timer & ROSC)          │
│    ├── Blood Bank (BDRS) Cold-Chain Inventory & Crossmatch Safety Gate         │
│    ├── ICU Acuity Sepsis-3 (SOFA / NEWS2) Deterministic Calculator              │
│    └── Operating Theatre (IBS) WHO Surgical Safety Checklist Studio             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 2. STATE MANAGEMENT & DOMAIN CLIENT LAYER (Zustand + React Lazy/Suspense)       │
│    ├── Reactive Stores: useEncounterStore, usePatientStore, useTriageStore       │
│    ├── Local Database Memory Cache & Offline Outbox Sync Pipeline               │
│    └── Granular Route-Level Code Splitting (Optimized Bundle < 850 kB)          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 3. ENTERPRISE BUSINESS LOGIC & CLINICAL DECISION SUPPORT (Node.js / Express)    │
│    ├── Master Order FSM Engine (DRAFT → ORDERED → VERIFIED → IN_PROGRESS)      │
│    ├── Drug-Allergy & Cross-Reactivity Blocker (JCI IPSG 3)                     │
│    ├── CDSS Protocol Bundles (Hour-1 Sepsis Campaign & AHA ACS/STEMI Pathway)   │
│    ├── 5-Factor Clinical Credentialing & STR/SIP Effective Dating Evaluator     │
│    └── Transactional Outbox Pattern & Event Publisher (JCI Immutable Audit)     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 4. PERSISTENCE & POSTGRESQL SAFETY BARRIER LAYER (Prisma ORM + PostgreSQL)      │
│    ├── Multi-Tenant Row Level Security (RLS) & Tenant Isolation                 │
│    ├── FEFO Pharmacy Inventory & Atomic Concurrency (available_quantity >= qty) │
│    ├── BDRS Crossmatch Barrier Trigger (Prevents Incompatible Transfusions)     │
│    └── 15 Migration Scripts, Multi-Column Partial Indexes & Cascade Foreign Keys│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Clinical Modules & Features

### 1. 🛡️ Master Patient Index (EMPI) & Journey Center
* **Single Master Identity:** Strict duplicate matching algorithm based on NIK, Full Name, and Date of Birth with confidence score percentage.
* **PHI Masking:** Automatic masking of sensitive Citizen Identification Numbers (`************1234`) for data protection compliance.
* **Emergency Anonymous Patient (`Mr./Mrs. X`):** Rapid emergency identity creation and post-hoc EMPI identity merge while **100% preserving the emergency encounter and clinical timeline history**.

### 2. ⚡ IGD Triage & Emergency Command Center (ESI v4)
* **ABCDE Primary Survey:** Structured assessment of Airway, Breathing, Circulation, Disability (GCS 3-15), and Exposure.
* **Automated Danger Zone Escalation:** Vital signs in critical thresholds ($\text{SpO}_2 < 90\%$, $\text{HR} > 130$, $\text{TDS} \le 80$) auto-escalate triage level to ESI 1 or ESI 2.
* **Real-Time SLA Stopwatch:** Color-coded countdown timers (🟢 Normal $\rightarrow$ 🟡 Approaching SLA $\rightarrow$ 🔴 SLA Breach) aligned with KARS PMKP response time quality indicators.
* **Code Blue Resuscitation Board:** 2-minute CPR cycle stopwatch, defibrillation shock counter, periodic Epinephrine 1mg log, and ROSC declaration.

### 3. 👨‍⚕️ Doctor Consultation & CPPT / SOAP Workspace
* **Integrated CPPT / SOAP Documentation:** Compliant with Permenkes No. 24/2022 with structured S-O-A-P fields, live vitals auto-import, and primary/secondary ICD-10 codification.
* **Clinical Decision Support System (CDSS):**
  * *Hour-1 Sepsis Bundle:* Blood culture, serum lactate, broad-spectrum IV antibiotics, and 30 mL/kg fluid resuscitation.
  * *Acute Coronary Syndrome (STEMI):* 10-minute ECG alert, DAPT loading (Aspilet + Clopidogrel), and cito Troponin.
  * *DHF Critical Phase:* Serial CBC every 12 hours and hard contraindication warnings for NSAIDs/Aspirin.
* **Universal Order Panel:** 6-category clinical ordering (Laboratory, Radiology, Pharmacy, Blood Bank, Operating Theatre, and Inpatient Ward/ICU Admission) with drug allergy hard blockers.

### 4. 🩸 Blood Bank (BDRS) & Cold-Chain Safety
* **Crossmatch Barrier:** Prevents issuing or transfusing uncrossmatched or incompatible blood units (`overall_compatibility = COMPATIBLE` database invariant).
* **Cold-Chain Audit:** Real-time temperature excursion monitoring ($2^\circ\text{C} - 6^\circ\text{C}$) with automatic blood unit quarantine on temperature violation.

### 5. 🏥 Intensive Care Acuity (Sepsis-3 SOFA & NEWS2)
* **Deterministic SOFA Scoring:** Serial organ failure assessment across Respiration, Coagulation, Liver, Cardiovascular, CNS, and Renal subsystems with 100% reproducible snapshot storage.
* **NEWS2 Early Warning System:** Real-time clinical deterioration scoring with automated nurse escalation triggers.

### 6. 🔪 Operating Theatre (IBS) Board
* **WHO Surgical Safety Checklist:** Mandatory Sign-In (before induction), Time-Out (before incision), and Sign-Out (before leaving OR) verification gates.
* **Post-Anesthesia Recovery:** Modified Aldrete & Bromage scoring determining safe discharge from PACU to ward or ICU.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI/UX** | React 19, TypeScript, Vite 8, TailwindCSS, Zustand, Lucide Icons |
| **Backend API** | Node.js (LTS), Express, Clean Architecture, REST, Outbox Event Publisher |
| **Database & ORM** | PostgreSQL 16, Prisma ORM 5.x, SQL Migrations (001 to 015) |
| **Interoperability** | HL7 FHIR R4, SATUSEHAT Kemenkes API, BPJS V-Claim API |
| **Testing & Quality** | Vitest, 44 Test Suites (185 Automated Tests), GitHub Actions CI/CD |
| **DevOps & Deploy** | Docker, Nginx, Firebase Hosting & Functions, PostgreSQL on Cloud SQL |

---

## 🚀 Quickstart & Local Development

### Prerequisites
* Node.js `>= 20.x`
* npm `>= 10.x`
* PostgreSQL `>= 15.x` (or Docker)

### 1. Clone & Install
```bash
git clone https://github.com/Mojo-Brothers/NurseFlow-WebApp.git
cd NurseFlow-WebApp
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your database credentials:
```bash
cp .env.example .env
```

### 3. Run Database Migrations
```bash
npx prisma migrate dev
node database/migration_runner.js
```

### 4. Run Automated Test Suite
```bash
npm test
```
*Expected: 44 test suites passing (185 tests).*

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing & Quality Verification

```bash
# Run all unit, integration, and negative-path tests
npm test

# Run type checks and Prisma schema validation
npx prisma validate

# Build optimized production bundle
npm run build
```

---

## 📜 Compliance & Regulatory Standards
1. **Joint Commission International (JCI 7th Edition):** International Patient Safety Goals (IPSG 1-6), Medication Management and Use (MMU), and Anesthesia and Surgical Care (ASC).
2. **KARS 2024 (Komisi Akreditasi Rumah Sakit):** PMKP (Peningkatan Mutu dan Keselamatan Pasien) emergency response time indicators.
3. **Permenkes No. 24/2022:** Rekam Medis Elektronik (RME) metadata, privacy, and clinical data governance.
4. **SATUSEHAT Kemenkes RI:** HL7 FHIR R4 profiling for `Patient`, `Encounter`, `Condition`, `Observation`, `ServiceRequest`, and `MedicationRequest`.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
