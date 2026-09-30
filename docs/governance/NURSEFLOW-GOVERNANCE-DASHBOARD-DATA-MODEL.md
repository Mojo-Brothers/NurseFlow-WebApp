# NURSEFLOW GOVERNANCE DASHBOARD — DATA MODEL SPECIFICATION

> **Document ID:** `NF-GOV-DATA-MODEL-001`  
> **Status:** `RATIFIED`  
> **Classification:** `ENTERPRISE HIS GOVERNANCE DATA ARCHITECTURE`  
> **Author:** Principal Software Architect & Governance Data Engineer  
> **Date:** September 28, 2026  

---

## 1. Architectural Philosophy & Principles

Data model ini dirancang untuk mendukung **NurseFlow Project Governance & Progress Dashboard** sebagai *Single Source of Truth* status kesehatan, kematangan domain, temuan keamanan, dan kesiapan rilis sistem.

Model ini mematuhi prinsip inti:
1. **Evidence-Driven:** Setiap entitas status (`Phase`, `Control`, `Workstream`, `Finding`) wajib terhubung ke minimal satu simpul `Evidence` dengan referensi berkas dan baris yang valid.
2. **Current State ≠ Target State:** Memisahkan secara ketat kondisi yang terbukti saat ini (`CURRENT_PROVEN`) dengan target arsitektur masa depan (`TARGET_DESIGNED`).
3. **No Fake Progress:** Menghindari angka agregasi tunggal fiktif (*no simplistic 73% complete*). Menggunakan metrik cakupan berdimensi ganda (*Evidence Coverage, Implementation Coverage, Verification Coverage, Security Gate Coverage*).
4. **Conservative Resolution:** Jika ditemukan kontradiksi antara klaim dokumen dan kode sumber aktual, status diselesaikan secara konservatif (`CONTRADICTED` / `UNVERIFIED` / `REFUTED`).

---

## 2. Entity Relationship Overview

```text
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Project    │──────<│    Phase     │──────<│  Workstream  │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                      │
       │                      ▼                      ▼
       │               ┌──────────────┐       ┌──────────────┐
       ├──────────────<│     Gate     │>──────│   Finding    │
       │               └──────────────┘       └──────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Domain    │──────<│  Dependency  │──────<│   Evidence   │
└──────────────┘       └──────────────┘       └──────────────┘
       │                                             │
       ▼                                             ▼
┌──────────────┐                              ┌──────────────┐
│  TestResult  │                              │   Artifact   │
└──────────────┘                              └──────────────┘
```

---

## 3. Detailed Canonical Entity Schemas

### 3.1 `Project`
```typescript
interface Project {
  id: string; // 'nurseflow-enterprise-his'
  name: string; // 'NurseFlow Enterprise Hospital Information System'
  version: string;
  scannedAt: string; // ISO 8601
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL_BLOCKER';
  currentGate: {
    phaseId: string; // 'PHASE-12-WAVE1A53'
    name: string; // 'P0-2B Wave 1A.5.3 Adversarial Architecture Review'
    status: 'ACTIVE' | 'HOLD' | 'BLOCKED';
    nextGate: string; // 'Security Foundation Implementation'
  };
  securityStatus: {
    foundation: 'NOT_READY' | 'READY';
    runtimeDbRole: 'BLOCKED' | 'VERIFIED';
    tenantIsolation: 'NOT_READY' | 'READY';
    clinicalAuthorization: 'NOT_ENFORCED' | 'ENFORCED';
    wave1bStatus: 'HOLD' | 'OPEN';
    productionChangesAllowed: boolean; // false
  };
  metrics: {
    evidenceCoveragePct: number;
    implementationCoveragePct: number;
    verificationCoveragePct: number;
    securityControlsVerifiedCount: number;
    securityControlsTotalCount: number;
  };
}
```

### 3.2 `Phase`
```typescript
interface Phase {
  id: string; // 'PHASE-12-WAVE1A53'
  order: number;
  name: string;
  category: 'AUDIT' | 'GOVERNANCE' | 'SECURITY' | 'ARCHITECTURE' | 'IMPLEMENTATION' | 'CLINICAL';
  status: 'VERIFIED' | 'RATIFIED' | 'COMPLETE' | 'REFUTED' | 'HOLD' | 'BLOCKED' | 'NOT_STARTED';
  currentState: string;
  targetState: string;
  blockers: string[];
  nextAction: string;
  evidenceIds: string[];
}
```

### 3.3 `Workstream`
```typescript
interface Workstream {
  id: string;
  name: string;
  category: 'SECURITY' | 'DATABASE' | 'AUTHORIZATION' | 'CLINICAL' | 'INTEROPERABILITY';
  ownerRole: string;
  currentStatus: 'VERIFIED' | 'IMPLEMENTED_UNVERIFIED' | 'DESIGNED_ONLY' | 'BLOCKED' | 'HOLD';
  completionEvidence: string;
  openFindingsCount: number;
  dependencies: string[];
  blockers: string[];
  nextAction: string;
  lastVerified: string;
}
```

### 3.4 `Domain`
```typescript
interface Domain {
  id: string; // 'EMPI', 'CPOE', 'SURGERY', etc.
  name: string;
  category: 'CORE_CLINICAL' | 'DIAGNOSTIC' | 'ADMINISTRATIVE' | 'SECURITY';
  designed: boolean;
  implemented: boolean;
  tested: boolean;
  verified: boolean;
  blocked: boolean;
  maturityScore: number; // 0 to 100 based on rigorous formula
  totalRoutes: number;
  totalTables: number;
  primaryService: string;
  evidenceIds: string[];
}
```

### 3.5 `Finding`
```typescript
interface Finding {
  id: string; // e.g. 'FINDING-1A51-01', 'FM-001'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  domain: string;
  title: string;
  currentState: string;
  affectedComponents: string[];
  securityImpact: string;
  status: 'OPEN' | 'REMEDIATED' | 'ACCEPTED_RISK' | 'BLOCKED';
  remediation: string;
  sourceDoc: string;
  evidenceRef: string;
}
```

### 3.6 `Evidence`
```typescript
interface Evidence {
  id: string;
  type: 'SOURCE_CODE' | 'MIGRATION' | 'TEST_RESULT' | 'AUDIT_REPORT' | 'JSON_DATASET';
  source: string;
  sourcePath: string;
  lineStart?: number;
  lineEnd?: number;
  claim: string;
  status: 'PROVEN' | 'PROVEN_BY_DISPOSABLE_TEST' | 'PARTIAL' | 'TARGET_ONLY' | 'UNVERIFIED' | 'REFUTED';
  confidence: 'DIRECT' | 'DERIVED' | 'DOCUMENTED' | 'MANUAL';
  lastVerified: string;
}
```

### 3.7 `Gate`
```typescript
interface Gate {
  id: string;
  name: string;
  prerequisites: {
    name: string;
    satisfied: boolean;
    evidenceRef: string;
  }[];
  decision: 'GO' | 'CONDITIONAL' | 'HOLD' | 'BLOCKED';
  blockers: string[];
  downstreamAccess: string;
}
```

### 3.8 `Change`
```typescript
interface Change {
  id: string;
  date: string;
  changeType: 'AUDIT' | 'DESIGN' | 'SECURITY' | 'DATABASE' | 'TEST' | 'REFACTOR';
  phase: string;
  summary: string;
  isProductionChange: boolean; // Must be false for audit phases
  actor: string;
  affectedFiles: string[];
}
```

---

## 4. Status Taxonomy & Visual Representation

| Status | Deskripsi Semantik | Warna UI Standar | Kriteria Pemenuhan |
|---|---|---|---|
| **`VERIFIED`** | Terbukti secara empiris melalui uji otomatis/audit | Hijau (#10b981) | Memiliki test lulus atau bukti eksekusi sandbox |
| **`RATIFIED`** | Telah disahkan secara arsitektural dan disetujui | Hijau Emerald (#059669) | Dokumen formal ditandatangani |
| **`IMPLEMENTED`** | Kode telah ditulis dan terpasang | Biru (#3b82f6) | Kode mounted dan lulus unit test |
| **`DESIGNED_ONLY`**| Desain ada di dokumen, kode belum dibuat | Cyan (#06b6d4) | Spesifikasi lengkap, 0 baris kode |
| **`PARTIAL`** | Terpasang sebagian atau belum teruji penuh | Kuning (#eab308) | Framework ada, belum semua rute terpasang |
| **`HOLD`** | Ditahan menunggu pemenuhan prasyarat gerbang | Oranye (#f97316) | Gerbang dependen belum dibuka |
| **`BLOCKED`** | Terhalang oleh celah keamanan kritis | Merah (#ef4444) | Ditemukan temuan kritis tak termitigasi |
| **`REFUTED`** | Klaim terbukti salah oleh bukti adversarial | Merah Marun (#b91c1c) | Dibatalkan oleh audit forensik |
| **`UNKNOWN`** | Tidak ada bukti yang dapat diverifikasi | Abu-abu (#6b7280) | Tidak ada artefak kode/test |
