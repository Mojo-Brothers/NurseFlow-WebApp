/**
 * NurseFlow Enterprise HIS 2026 — Master Governance Baseline Snapshot
 * High-fidelity canonical data snapshot generated directly from repository reality.
 */

export const GOVERNANCE_BASELINE_DATA = {
  scannedAt: '2026-10-01T11:40:00.000Z',
  project: {
    id: 'nurseflow-enterprise-his',
    name: 'NurseFlow Enterprise Hospital Information System',
    overallHealth: 'HOLD',
    currentGate: {
      phaseId: 'PHASE-15',
      name: 'P0-2B Wave 1B.0S Forensic Closure & Pre-UoW Baseline',
      status: 'HOLD',
      verdict: 'CONTAINMENT_VERIFIED_UOW_MIGRATION_PENDING',
      nextGate: 'Phase 16 — Wave 1B.1 Domain-by-Domain UoW Refactor (EMPI & CPOE)'
    },
    securityStatus: {
      foundation: 'CONTAINED',
      runtimeDbRole: 'VERIFIED_LEAST_PRIVILEGE',
      tenantIsolation: 'PARTIAL_RLS_ACTIVE',
      clinicalAuthorization: 'NOT_ENFORCED',
      wave1bStatus: 'HOLD',
      productionChangesAllowed: false
    },
    coverageMetrics: {
      evidenceCoveragePct: 98.4,
      implementationCoveragePct: 82.5,
      verificationCoveragePct: 78.0,
      securityControlsVerifiedCount: 7,
      securityControlsTotalCount: 11
    }
  },
  inventory: {
    migrationsCount: 86,
    testSuitesCount: 195,
    testCategories: {
      security: 32,
      verticalSlice: 24,
      chaosAndEndurance: 22,
      interoperability: 18,
      clinicalDomain: 103
    },
    routeFilesCount: 27,
    totalEndpoints: 144,
    routesWithJwt: 136,
    routesWithPermission: 39,
    routesWithClinicalAuth: 0,
    routesWithIdempotency: 1,
    tier1RoutesCount: 38,
    serviceFilesCount: 85,
    rawClientQueryCount: 515,
    manualBeginCount: 36,
    poolConnectCount: 78,
    auditDocsCount: 18,
    governanceDocsCount: 26,
    liveDbStatus: {
      connected: true,
      role: 'nurseflow_app_user',
      isSuperuser: false,
      rlsTablesCount: 100,
      policiesCount: 100,
      zeroPolicyTablesCount: 0,
      failOpenPoliciesCount: 0,
      truncateGrantsCount: 0,
      gucSplit: {
        currentAppTenantIdHelperCount: 54,
        directCurrentTenantIdGucCount: 46
      }
    }
  },
  securityControls: [
    {
      id: 'SEC-01',
      name: 'JWT Authentication & Cryptographic Verification',
      current: 'Active HS256 with constant-time verification; in-memory blacklist Set',
      target: 'Distributed Redis / DB token revocation ledger; strict secret entropy',
      status: 'PARTIAL',
      evidence: 'src/core/security/jwtSecurity.service.js',
      lastVerified: '2026-10-01',
      blocker: 'In-memory blacklist desynchronization on multi-node deployment'
    },
    {
      id: 'SEC-02',
      name: 'Tenant Extraction & Anti-Spoofing',
      current: 'Strict fail-closed tenant resolution on all requests; 0 fallback UUIDs in auth pipeline',
      target: 'Zero fallback UUIDs; fail-closed tenant resolution on all requests',
      status: 'VERIFIED',
      evidence: 'tests/tenantExtraction.test.js',
      lastVerified: '2026-10-01',
      blocker: 'None'
    },
    {
      id: 'SEC-03',
      name: 'Database Tenant Context Isolation (SET LOCAL)',
      current: 'Pool safe lease wrapper active with explicit cleanup; 156 raw client queries across 85 services awaiting UoW refactoring',
      target: 'Unified db.withTenantContext with ALS fallback and mandatory ROLLBACK on release',
      status: 'CONTAINED',
      evidence: 'tests/poolIsolation.test.js',
      lastVerified: '2026-10-01',
      blocker: '156 raw client queries await domain-by-domain UoW wrapper'
    },
    {
      id: 'SEC-04',
      name: 'Runtime Database Role Least Privilege',
      current: 'nurseflow_app_user (NON-SUPERUSER / 0 TRUNCATE grants / LOGIN active)',
      target: 'nurseflow_app_user (NON-SUPERUSER / BYPASSRLS=false / NO TRUNCATE)',
      status: 'VERIFIED',
      evidence: 'database/migrations/080_stage0_runtime_privilege_hardening.sql',
      lastVerified: '2026-10-01',
      blocker: 'None (Migrated in 068 & 080)'
    },
    {
      id: 'SEC-05',
      name: 'PostgreSQL Row-Level Security (RLS) Fail-Closed',
      current: '100 tables RLS enabled; 100 active fail-closed policies; 0 zero-policy tables; 0 fail-open policies',
      target: '100% fail-closed policies on all tables; unified single-source GUC reference',
      status: 'CONTAINED',
      evidence: 'database/migrations/070_harden_rls_fail_closed.sql',
      lastVerified: '2026-10-01',
      blocker: 'Catalog GUC split across 54 helper vs 46 direct GUC tables'
    },
    {
      id: 'SEC-06',
      name: 'Child Table Tenant Ownership & BOLA Protection',
      current: 'Child endpoints verified with parent joins and tenant verification in Wave 1A.11 test suite',
      target: 'Mandatory parent join verifying tenant_id or verified denormalized tenant_id',
      status: 'VERIFIED',
      evidence: 'tests/childTableBola.test.js',
      lastVerified: '2026-10-01',
      blocker: 'None'
    },
    {
      id: 'SEC-07',
      name: '7 Canonical Resource Resolvers',
      current: 'Specification completed in Wave 1A.5.2; resolvers ready for route mounting',
      target: 'All 7 resolvers active in clinicalAuthorization.middleware across 38 Tier-1 routes',
      status: 'DESIGNED_ONLY',
      evidence: 'docs/audit/P0-2B-WAVE1A5.2-FINAL-SECURITY-ARCHITECTURE.md',
      lastVerified: '2026-10-01',
      blocker: 'Requires Phase 17 Tier-1 route mounting'
    },
    {
      id: 'SEC-08',
      name: 'Tier-1 Clinical Authorization Enforcement',
      current: '0 of 38 routes mount requireClinicalAuthorization',
      target: '38 of 38 Tier-1 routes mount requireClinicalAuthorization',
      status: 'NOT_ENFORCED',
      evidence: 'scratch/tier1_exact_inventory.json',
      lastVerified: '2026-10-01',
      blocker: 'Middleware implemented in isolation but completely unmounted'
    },
    {
      id: 'SEC-09',
      name: 'Separation of Duties (SoD) & DPJP Privilege Guard',
      current: 'Service exists and tested in unit mocks; 0 HTTP invocations in production routes',
      target: 'Active validation on high-risk clinical mutations (e.g. CPOE prescribe vs dispense)',
      status: 'NOT_ENFORCED',
      evidence: 'server/services/separationOfDuties.service.js',
      lastVerified: '2026-10-01',
      blocker: 'Dependent on Tier-1 route middleware mounting'
    },
    {
      id: 'SEC-10',
      name: 'Break-The-Glass (BTG) Emergency Override Ledger',
      current: 'Service exists; immutable ledger schema designed; 0 HTTP invocations',
      target: '4-hour emergency credential override with reason logging and clinical director alert',
      status: 'NOT_ENFORCED',
      evidence: 'server/services/breakTheGlass.service.js',
      lastVerified: '2026-10-01',
      blocker: 'Dependent on Tier-1 route middleware mounting'
    },
    {
      id: 'SEC-11',
      name: 'Transactional Outbox & Worker Security Discovery',
      current: 'SECURITY DEFINER get_active_outbox_tenants() designed; at-least-once idempotency middleware ready',
      target: 'SECURITY DEFINER get_active_outbox_tenants() + Idempotency-Key headers on HTTP transport',
      status: 'DESIGNED_ONLY',
      evidence: 'docs/audit/P0-2B-WAVE1A5.3-ADVERSARIAL-ARCHITECTURE-REVIEW.md',
      lastVerified: '2026-10-01',
      blocker: 'Requires migration of SECURITY DEFINER function with locked search_path'
    }
  ],
  phases: [
    { id: 'PHASE-0', name: 'Phase 0 — Reality & Repository Audit', order: 0, status: 'VERIFIED', currentState: '100% complete audit', targetState: 'Complete baseline', blockers: [], evidenceIds: ['NURSEFLOW_SYSTEM_REALITY_AUDIT.md'] },
    { id: 'PHASE-1', name: 'Phase 1 — Domain & Architecture Baseline', order: 1, status: 'VERIFIED', currentState: 'Domain map established', targetState: 'Complete baseline', blockers: [], evidenceIds: ['NURSEFLOW_MASTER_DOMAIN_MAP.md'] },
    { id: 'PHASE-2', name: 'Phase 2 — Governance & Traceability Baseline', order: 2, status: 'VERIFIED', currentState: 'Traceability matrix established', targetState: 'Complete baseline', blockers: [], evidenceIds: ['NURSEFLOW_TRACEABILITY_MATRIX.md'] },
    { id: 'PHASE-3', name: 'Phase 3 — P0-2A Authorization Foundation', order: 3, status: 'RATIFIED', currentState: 'P0-2A foundation signed off', targetState: 'Baseline signed', blockers: [], evidenceIds: ['P0-2A_AUTHORIZATION_FOUNDATION_IMPLEMENTATION.md'] },
    { id: 'PHASE-4', name: 'Phase 4 — P0-2B Wave 1 Baseline', order: 4, status: 'VERIFIED', currentState: 'Wave 1 baseline completed', targetState: 'Contract mapping', blockers: [], evidenceIds: ['P0-2B-WAVE1-TENANT-BOUNDARY-DESIGN.md'] },
    { id: 'PHASE-5', name: 'Phase 5 — Wave 1A Contract Mapping', order: 5, status: 'VERIFIED', currentState: '38 Tier-1 contracts mapped', targetState: 'Contract inventory', blockers: [], evidenceIds: ['P0-2B-WAVE1-AUTHORIZATION-CONTRACT-MATRIX.md'] },
    { id: 'PHASE-6', name: 'Phase 6 — Wave 1A.2 Adversarial Verification', order: 6, status: 'VERIFIED', currentState: 'Cross-tenant flaws verified', targetState: 'Forensic challenge', blockers: [], evidenceIds: ['P0-2B-WAVE1-ADVERSARIAL-VERIFICATION.md'] },
    { id: 'PHASE-7', name: 'Phase 7 — Wave 1A.3 Security Boundary Resolution', order: 7, status: 'VERIFIED', currentState: 'Boundary resolution established', targetState: 'Capability closure', blockers: [], evidenceIds: ['P0-2B-WAVE1A5-SECURITY-BOUNDARY-RESOLUTION.md'] },
    { id: 'PHASE-8', name: 'Phase 8 — Wave 1A.4 Architecture Gate', order: 8, status: 'VERIFIED', currentState: 'Architecture gate passed', targetState: 'Ready gate', blockers: [], evidenceIds: ['P0-2B-WAVE1A4-TENANT-ARCHITECTURE-GATE.md'] },
    { id: 'PHASE-9', name: 'Phase 9 — Wave 1A.5 Security Resolution', order: 9, status: 'REFUTED', currentState: 'Ready verdict refuted due to unverified foundation', targetState: 'Truthful state', blockers: ['Unverified app_user runtime', 'Fail-open policies'], evidenceIds: ['P0-2B-WAVE1A5.1-READY-GATE-ADVERSARIAL-CHALLENGE.md'] },
    { id: 'PHASE-10', name: 'Phase 10 — Wave 1A.5.1 Adversarial Challenge', order: 10, status: 'REFUTED', currentState: 'Proved legacy foundation was NOT_READY', targetState: 'Evidence closure', blockers: ['7 Proven findings'], evidenceIds: ['P0-2B-WAVE1A5.1-READY-GATE-ADVERSARIAL-CHALLENGE.md'] },
    { id: 'PHASE-11', name: 'Phase 11 — Wave 1A.5.2 Evidence & Architecture Closure', order: 11, status: 'COMPLETE', currentState: 'Evidence closure COMPLETE, Arch READY', targetState: 'Implementation plan', blockers: [], evidenceIds: ['P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md'] },
    { id: 'PHASE-12', name: 'Phase 12 — Wave 1A.5.3 Adversarial Review', order: 12, status: 'COMPLETE', currentState: 'Adversarial review completed: Required revisions executed and closed', targetState: 'Architectural sign-off', blockers: [], evidenceIds: ['P0-2B-WAVE1A5.3-ADVERSARIAL-ARCHITECTURE-REVIEW.md'] },
    { id: 'PHASE-13', name: 'Phase 13 — Security Foundation Implementation (Wave 1A.10)', order: 13, status: 'COMPLETE', currentState: 'Migrations 068, 070, 080 applied; RLS fail-closed enforced', targetState: 'Catalog hardening', blockers: [], evidenceIds: ['P0-2B-WAVE1A10-IMPLEMENTATION.md'] },
    { id: 'PHASE-14', name: 'Phase 14 — Wave 1B.0 Critical Containment', order: 14, status: 'COMPLETE', currentState: '0 TRUNCATE grants, 100/100 RLS policies, secrets sanitized, 18/18 tests pass', targetState: 'Privilege containment', blockers: [], evidenceIds: ['P0-2B-WAVE1B0-CONTAINMENT-CLOSURE.md'] },
    { id: 'PHASE-15', name: 'Phase 15 — Wave 1B.0S Forensic Closure & Pre-UoW Baseline', order: 15, status: 'HOLD', isCurrent: true, currentState: 'STAGE 0 NO-GO, UoW refactoring preparation, GUC dependency mapped', targetState: 'Domain UoW unfreeze', blockers: ['156 Unsafe RLS paths', 'Catalog GUC split 54/46', 'Runner checksum advisory bypass'], evidenceIds: ['P0-2B-WAVE1B0S-FORENSIC-EVIDENCE.md'] },
    { id: 'PHASE-16', name: 'Phase 16 — Wave 1B.1 Domain-by-Domain UoW Refactoring', order: 16, status: 'NOT_STARTED', currentState: 'Scheduled for Batch 1: EMPI, Demographics, CPOE', targetState: 'Replace 515 raw queries with UoW', blockers: ['Phase 15 incomplete'], evidenceIds: [] },
    { id: 'PHASE-17', name: 'Phase 17 — Wave 1B.2 Tier-1 Clinical Authorization Mounting', order: 17, status: 'NOT_STARTED', currentState: 'Scheduled for 38 Tier-1 routes mounting requireClinicalAuthorization', targetState: 'Live clinical RBAC/ABAC', blockers: ['Phase 16 incomplete'], evidenceIds: [] },
    { id: 'PHASE-18', name: 'Phase 18 — Wave 1C Production Cutover & Accreditation Gate', order: 18, status: 'NOT_STARTED', currentState: 'Future milestone', targetState: 'Production readiness', blockers: ['Wave 1B incomplete'], evidenceIds: [] }
  ],
  workstreams: [
    {
      id: 'WS-01',
      name: 'Database Security & Role Hardening',
      category: 'DATABASE',
      ownerRole: 'PostgreSQL Security Engineer',
      currentStatus: 'CONTAINED',
      completionEvidence: 'Migrations 068, 070, 080, 081 applied; 0 TRUNCATE grants, 100/100 RLS policies',
      openFindingsCount: 1,
      dependencies: ['P0-2B Wave 1B.0S Forensics'],
      blockers: ['Catalog GUC split 54 vs 46'],
      nextAction: 'Unify catalog policies during domain UoW migrations',
      lastVerified: '2026-10-01'
    },
    {
      id: 'WS-02',
      name: 'Application Database Access Modernization',
      category: 'SECURITY',
      ownerRole: 'Principal Software Architect',
      currentStatus: 'HOLD',
      completionEvidence: 'Safe pool release active; 156 raw queries remain in services outside UoW',
      openFindingsCount: 1,
      dependencies: ['Connection pool safety wrapper'],
      blockers: ['156 Unsafe RLS request paths outside UoW'],
      nextAction: 'Execute Batch 1 UoW refactoring (EMPI, Demographics, CPOE)',
      lastVerified: '2026-10-01'
    },
    {
      id: 'WS-03',
      name: 'Tier-1 Clinical Authorization & Resolvers',
      category: 'AUTHORIZATION',
      ownerRole: 'Application Security Engineer',
      currentStatus: 'NOT_ENFORCED',
      completionEvidence: '0 of 38 routes mount requireClinicalAuthorization',
      openFindingsCount: 2,
      dependencies: ['WS-01 Database Hardening', 'WS-02 Access Modernization'],
      blockers: ['UoW domain migrations pending'],
      nextAction: 'Mount middleware on 38 Tier-1 routes in Phase 17',
      lastVerified: '2026-10-01'
    },
    {
      id: 'WS-04',
      name: 'Child Table BOLA & Parent Binding',
      category: 'DATA_INTEGRITY',
      ownerRole: 'Backend Security Auditor',
      currentStatus: 'VERIFIED',
      completionEvidence: 'All child endpoints audited and parent joins verified in Wave 1A.11 suite',
      openFindingsCount: 0,
      dependencies: ['WS-02 Scoped UoW'],
      blockers: [],
      nextAction: 'Maintain automated childTableBola regression tests',
      lastVerified: '2026-10-01'
    },
    {
      id: 'WS-05',
      name: 'Transactional Outbox & SATUSEHAT Interoperability',
      category: 'INTEROPERABILITY',
      ownerRole: 'Distributed Systems Engineer',
      currentStatus: 'DESIGNED_ONLY',
      completionEvidence: 'SECURITY DEFINER get_active_outbox_tenants() designed',
      openFindingsCount: 1,
      dependencies: ['WS-01 Migration 068'],
      blockers: ['Search path locking and worker user privileges'],
      nextAction: 'Deploy get_active_outbox_tenants() with pg_catalog locked path',
      lastVerified: '2026-10-01'
    }
  ],
  domains: [
    { id: 'EMPI', name: 'Master Patient Index & Demography', category: 'CORE_CLINICAL', designed: true, implemented: true, tested: true, verified: true, blocked: false, maturityScore: 92, totalRoutes: 12, totalTables: 8, primaryService: 'empiService.js' },
    { id: 'CPOE', name: 'Universal CPOE Orders Hub', category: 'CORE_CLINICAL', designed: true, implemented: true, tested: true, verified: false, blocked: true, maturityScore: 78, totalRoutes: 14, totalTables: 6, primaryService: 'cpoeService.js' },
    { id: 'MEDICATION', name: 'Closed-Loop Medication & eMAR', category: 'CORE_CLINICAL', designed: true, implemented: true, tested: true, verified: false, blocked: true, maturityScore: 74, totalRoutes: 11, totalTables: 9, primaryService: 'medicationClosedLoop.service.js' },
    { id: 'SURGERY', name: 'Operating Theatre & Perioperative', category: 'CORE_CLINICAL', designed: true, implemented: true, tested: true, verified: false, blocked: true, maturityScore: 71, totalRoutes: 9, totalTables: 12, primaryService: 'perioperativeClosedLoop.service.js' },
    { id: 'BLOOD_BANK', name: 'Blood Bank (BDRS) & MTP', category: 'CORE_CLINICAL', designed: true, implemented: true, tested: true, verified: false, blocked: false, maturityScore: 80, totalRoutes: 7, totalTables: 6, primaryService: 'bloodBank.service.js' },
    { id: 'TRIAGE', name: 'Emergency (IGD) & ATS/ESI Triage', category: 'CORE_CLINICAL', designed: true, implemented: true, tested: true, verified: true, blocked: false, maturityScore: 88, totalRoutes: 6, totalTables: 4, primaryService: 'triage.service.js' },
    { id: 'CLINICAL_NOTES', name: 'Integrated Clinical Notes (CPPT/SOAP)', category: 'CORE_CLINICAL', designed: true, implemented: true, tested: true, verified: true, blocked: false, maturityScore: 85, totalRoutes: 8, totalTables: 5, primaryService: 'clinicalNotes.service.js' },
    { id: 'LABORATORY', name: 'LIS Specimen & Panic Values', category: 'DIAGNOSTIC', designed: true, implemented: true, tested: true, verified: true, blocked: false, maturityScore: 86, totalRoutes: 10, totalTables: 7, primaryService: 'laboratory.service.js' },
    { id: 'RADIOLOGY', name: 'RIS / PACS DICOM Web Viewer', category: 'DIAGNOSTIC', designed: true, implemented: true, tested: true, verified: false, blocked: true, maturityScore: 75, totalRoutes: 11, totalTables: 8, primaryService: 'diagnosticInterpretation.service.js' },
    { id: 'PHARMACY', name: 'Multi-Depot FEFO & Controlled Substances', category: 'CORE_CLINICAL', designed: true, implemented: true, tested: true, verified: false, blocked: true, maturityScore: 73, totalRoutes: 12, totalTables: 11, primaryService: 'enterprisePharmacy.service.js' },
    { id: 'FINANCE', name: 'Billing, Casemix & BPJS VClaim', category: 'ADMINISTRATIVE', designed: true, implemented: true, tested: true, verified: false, blocked: true, maturityScore: 76, totalRoutes: 13, totalTables: 10, primaryService: 'patientFinancialAndRevenueCycle.service.js' },
    { id: 'SATUSEHAT', name: 'SATUSEHAT FHIR Interop Studio', category: 'INTEROPERABILITY', designed: true, implemented: true, tested: true, verified: true, blocked: false, maturityScore: 89, totalRoutes: 8, totalTables: 5, primaryService: 'satusehatIntegration.service.js' },
    { id: 'SECURITY', name: 'Tenant Security & Clinical Authorization', category: 'SECURITY', designed: true, implemented: true, tested: true, verified: false, blocked: true, maturityScore: 68, totalRoutes: 5, totalTables: 6, primaryService: 'authorizationDecision.service.js' }
  ],
  findings: [
    {
      id: 'FINDING-1B0-01',
      severity: 'CRITICAL',
      domain: 'DATABASE_ACCESS',
      title: '156 Unsafe RLS Request Paths Outside Scoped Unit-of-Work',
      currentState: '156 direct client.query calls across 85 services operate outside db.withTenantContext wrapper.',
      affectedComponents: ['server/services/*.service.js', 'server/controllers/*.js'],
      securityImpact: 'Lack of atomic transaction boundary and tenant context leak vulnerability on uncaught exceptions.',
      status: 'OPEN',
      remediation: 'Systematic domain-by-domain UoW migration (Phase 16 / Wave 1B.1) prioritizing EMPI and CPOE.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0S-FORENSIC-EVIDENCE.md',
      evidenceRef: 'P0-2B-WAVE1B0S'
    },
    {
      id: 'FINDING-1B0-02',
      severity: 'HIGH',
      domain: 'IDENTITY_SECURITY',
      title: 'Administrative Database Credential Requires Production Rotation',
      currentState: 'Legacy administrative development credentials must undergo formal zero-knowledge rotation post-audit.',
      affectedComponents: ['.env.local', 'pg_roles'],
      securityImpact: 'Legacy credential material may exist on unmanaged developer workstations.',
      status: 'OPEN',
      remediation: 'Execute zero-knowledge password rotation protocol post-UoW cutover.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0-CONTAINMENT-CLOSURE.md',
      evidenceRef: 'P0-2B-WAVE1B0'
    },
    {
      id: 'FINDING-1B0-03',
      severity: 'HIGH',
      domain: 'TENANT_ISOLATION',
      title: 'Catalog GUC Reference Split (54 app.tenant_id vs 46 app.current_tenant_id)',
      currentState: '54 tables reference app.tenant_id while 46 reference app.current_tenant_id in pg_policy. Polices bridged via current_app_tenant_id().',
      affectedComponents: ['pg_policy', 'server/db/postgresPool.js'],
      securityImpact: 'Potential policy mismatch if raw client sets only one GUC variable instead of calling centralized helper.',
      status: 'OPEN',
      remediation: 'Unify all 100 policies to canonical app.tenant_id during domain-by-domain UoW rollouts.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0S-FORENSIC-EVIDENCE.md',
      evidenceRef: 'P0-2B-WAVE1B0S'
    },
    {
      id: 'FINDING-1B0-04',
      severity: 'MEDIUM',
      domain: 'APPLICATION_SECURITY',
      title: 'Migration Runner Checksum Advisory Bypass',
      currentState: 'scripts/run_migrations.js logs checksum mismatch warning but does not abort execution with exit code 1.',
      affectedComponents: ['scripts/run_migrations.js'],
      securityImpact: 'Tampered or retrofitted migration files could execute in CI/CD pipeline undetected.',
      status: 'OPEN',
      remediation: 'Enforce fail-closed process.exit(1) on checksum mismatch in run_migrations.js.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0S-FORENSIC-EVIDENCE.md',
      evidenceRef: 'scripts/run_migrations.js'
    },
    {
      id: 'FINDING-1B0-05',
      severity: 'HIGH',
      domain: 'ROLE_SECURITY',
      title: 'Security-Weakening Rollback Down-Migration Risk',
      currentState: 'Down-migration 080_down would re-grant dangerous TRUNCATE privileges to nurseflow_app_user if executed.',
      affectedComponents: ['database/migrations/*_down.sql'],
      securityImpact: 'Uncontrolled rollback can silently reintroduce critical security vulnerabilities.',
      status: 'OPEN',
      remediation: 'Formally designate down-migrations as SECURITY_WEAKENING_ROLLBACK and enforce manual gate.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0S-FORENSIC-EVIDENCE.md',
      evidenceRef: 'database/migrations/080_down.sql'
    },
    {
      id: 'FINDING-1A51-01',
      severity: 'CRITICAL',
      domain: 'DATABASE_ACCESS',
      title: 'Raw Client Query Bypass of Central DB Wrapper',
      currentState: '515 raw client.query calls across 85 services without scoped UoW wrapper.',
      affectedComponents: ['server/services/*.service.js', 'server/db/postgresPool.js'],
      securityImpact: 'Connection leaks and lack of unified tenant context enforcement on 645 queries.',
      status: 'OPEN',
      remediation: 'Implement Scoped UoW db.withTenantContext with mandatory ROLLBACK on release.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md',
      evidenceRef: 'P0-2B-WAVE1A5.1'
    },
    {
      id: 'FINDING-1A51-02',
      severity: 'HIGH',
      domain: 'INTEGRATION',
      title: 'Cross-Tenant Outbox Discovery Block Under Fail-Closed RLS',
      currentState: 'Worker without tenant context receives 0 rows under strict fail-closed RLS.',
      affectedComponents: ['database/migrations/035_fhir_reliable_delivery_outbox.sql', 'server/services/fhirOutbox.service.js'],
      securityImpact: 'Worker unable to deliver events to SatuSehat without privilege escalation.',
      status: 'OPEN',
      remediation: 'Implement SECURITY DEFINER get_active_outbox_tenants() with search_path locked to pg_catalog, public.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.2-FINAL-SECURITY-ARCHITECTURE.md',
      evidenceRef: 'P0-2B-WAVE1A5.2'
    },
    {
      id: 'FINDING-1A51-03',
      severity: 'CRITICAL',
      domain: 'TENANT_ISOLATION',
      title: 'Fail-Open Policy Vulnerability on 5 Core Tables',
      currentState: 'master_patients, encounters, clinical_orders, safety_decision_registry, universal_audit_logs permit null tenant context.',
      affectedComponents: ['database/migrations/032_postgresql_rls_and_pki_lifecycle.sql'],
      securityImpact: 'Unauthenticated or context-less queries leak patients and allow cross-tenant insertion.',
      status: 'RESOLVED',
      remediation: 'Resolved in Migration 070 & 073 with strict fail-closed NULLIF comparison. 0 fail-open policies verified in pg_policy.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md',
      evidenceRef: 'database/migrations/070_harden_rls_fail_closed.sql'
    },
    {
      id: 'FINDING-1A51-04',
      severity: 'CRITICAL',
      domain: 'ROLE_SECURITY',
      title: 'Runtime Role Activation Incapacity and Over-Privilege',
      currentState: 'nurseflow_app_user had TRUNCATE privileges on all tables and could not login.',
      affectedComponents: ['pg_roles', 'information_schema.role_table_grants'],
      securityImpact: 'Application runs as postgres superuser, bypassing RLS and defeating least-privilege principles.',
      status: 'RESOLVED',
      remediation: 'Resolved in Migrations 068 & 080: LOGIN granted, TRUNCATE revoked from all 214 tables. 0 TRUNCATE grants verified.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0-CONTAINMENT-CLOSURE.md',
      evidenceRef: 'database/migrations/080_stage0_runtime_privilege_hardening.sql'
    },
    {
      id: 'FINDING-1A51-05',
      severity: 'CRITICAL',
      domain: 'AUTHORIZATION',
      title: 'Zero Mount of requireClinicalAuthorization Across Tier-1 Routes',
      currentState: '0 of 38 Tier-1 routes mount clinicalAuthorization.middleware.js.',
      affectedComponents: ['server/routes/*.routes.js', 'server/middlewares/clinicalAuthorization.middleware.js'],
      securityImpact: 'SoD, DPJP credentials, and Break-the-Glass are completely bypassed in HTTP requests.',
      status: 'OPEN',
      remediation: 'Mount requireClinicalAuthorization on all 38 Tier-1 routes in Phase 17 of P0-2B.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md',
      evidenceRef: 'scratch/tier1_exact_inventory.json'
    },
    {
      id: 'FINDING-1A51-06',
      severity: 'CRITICAL',
      domain: 'DATA_INTEGRITY',
      title: 'Direct Cross-Tenant Child Table Exposure on 5 Endpoints',
      currentState: 'medication_emar_administrations, medication_dispense_allocations, longitudinal_care_plans, patient_split_invoices, physician_diagnostic_interpretations queried by raw :id.',
      affectedComponents: ['server/services/medicationClosedLoop.service.js', 'server/services/careCoordinationAndTimeline.service.js', 'server/services/patientFinancialAndRevenueCycle.service.js', 'server/services/diagnosticInterpretation.service.js'],
      securityImpact: 'Cross-tenant IDOR / BOLA allows doctor in Hospital B to mutate clinical records in Hospital A.',
      status: 'RESOLVED',
      remediation: 'Parent joins and tenant-verifications enforced and verified in 1A.11 test suite.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A11-EVIDENCE.md',
      evidenceRef: 'tests/childTableBola.test.js'
    },
    {
      id: 'FINDING-1A51-07',
      severity: 'HIGH',
      domain: 'TENANT_ISOLATION',
      title: '21 Tables with RLS Enabled but Zero Policies Defined',
      currentState: '21 tables previously had RLS enabled with 0 policies in pg_policy.',
      affectedComponents: ['database/migrations/032_postgresql_rls_and_pki_lifecycle.sql', 'pg_policy'],
      securityImpact: 'When runtime role switches to non-superuser, all 21 tables will suffer complete access lockout (0 rows returned).',
      status: 'RESOLVED',
      remediation: 'Resolved in Migration 070. All 100 RLS tables now have 100 active fail-closed policies in pg_policy.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0-CONTAINMENT-CLOSURE.md',
      evidenceRef: 'database/migrations/070_harden_rls_fail_closed.sql'
    },
    {
      id: 'FM-001',
      severity: 'CRITICAL',
      domain: 'CONNECTION_POOL',
      title: 'Connection Pool Context Leakage on Uncommitted Release',
      currentState: 'Releasing client with open transaction retains SET LOCAL app.current_tenant_id for subsequent leases.',
      affectedComponents: ['server/db/postgresPool.js'],
      securityImpact: 'Tenant B inherits Tenant A context on pooled connection lease, resulting in catastrophic cross-tenant data leakage.',
      status: 'RESOLVED',
      remediation: 'Resolved in postgresPoolService safe release wrapper: executes explicit ROLLBACK and DISCARD ALL on dirty lease release.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0-CONTAINMENT-CLOSURE.md',
      evidenceRef: 'tests/poolIsolation.test.js'
    },
    {
      id: 'FM-002',
      severity: 'CRITICAL',
      domain: 'APPLICATION_SECURITY',
      title: 'Pervasive Hardcoded Default Tenant UUID Fallback Bypass',
      currentState: '38 files in controllers and services previously fell back to 00000000-0000-0000-0000-000000000001.',
      affectedComponents: ['server/controllers/*.js', 'src/core/security/jwtSecurity.service.js'],
      securityImpact: 'Unauthenticated requests bypass fail-closed RLS and pollute default tenant database tables.',
      status: 'RESOLVED',
      remediation: 'Purged fallback UUIDs from auth middleware and token validation pipelines. Verified in Wave 1A.11 suite.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0-CONTAINMENT-CLOSURE.md',
      evidenceRef: 'tests/tenantExtraction.test.js'
    },
    {
      id: 'FM-009',
      severity: 'HIGH',
      domain: 'IDENTITY_SECURITY',
      title: 'In-Memory JWT Blacklist Desynchronization',
      currentState: 'Token blacklist stored in JavaScript in-memory Set (SERVER_TOKEN_BLACKLIST).',
      affectedComponents: ['src/core/security/jwtSecurity.service.js:32'],
      securityImpact: 'Token revoked on Node 1 remains accepted on Node 2 for up to 15 minutes in multi-instance cluster.',
      status: 'OPEN',
      remediation: 'Migrate blacklist to shared Redis cluster or PostgreSQL blacklist ledger table.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.3-FAILURE-MODE-MATRIX.md',
      evidenceRef: 'src/core/security/jwtSecurity.service.js'
    },
    {
      id: 'FM-010',
      severity: 'HIGH',
      domain: 'IDENTITY_SECURITY',
      title: 'Tenant Loss on Refresh Token Rotation',
      currentState: 'rotateRefreshToken() calls issueTokenPair() without passing tenantId.',
      affectedComponents: ['src/core/security/jwtSecurity.service.js:211'],
      securityImpact: 'Users rotating their session silently lose original tenant context and fall back to default tenant.',
      status: 'RESOLVED',
      remediation: 'Pass tenantId: payload.tenantId in rotateRefreshToken(). Verified in auth test suite.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1B0-CONTAINMENT-CLOSURE.md',
      evidenceRef: 'src/core/security/jwtSecurity.service.js'
    }
  ],
  contradictions: [
    {
      claim: 'Clinical Authorization Middleware is fully implemented and protecting Tier-1 clinical endpoints.',
      reality: 'Physical route scan proves 0 of 144 routes (and 0 of 38 Tier-1 routes) mount requireClinicalAuthorization.',
      severity: 'CRITICAL',
      conservativeVerdict: 'NOT_ENFORCED',
      affectedEntity: 'Authorization Foundation'
    },
    {
      claim: 'Catalog policies use unified single-source GUC tenant identifier.',
      reality: 'Catalog split: 54 policies reference current_app_tenant_id() while 46 reference app.current_tenant_id.',
      severity: 'HIGH',
      conservativeVerdict: 'CATALOG_SPLIT',
      affectedEntity: 'PostgreSQL Catalog Policies'
    }
  ],
  nextRequiredActions: [
    {
      order: 1,
      title: 'Enforce Fail-Closed Migration Runner Checksum Verification (scripts/run_migrations.js)',
      why: 'Migration runner currently issues advisory warning instead of aborting with exit code 1 on checksum mismatch.',
      blocks: 'Phase 16 UoW Migration Gate',
      responsibleRole: 'Principal DevOps & Security Architect'
    },
    {
      order: 2,
      title: 'Formally Classify & Block Security-Weakening Down-Migrations (*_down.sql)',
      why: 'Down-migration 080_down would re-grant dangerous TRUNCATE privileges if triggered accidentally.',
      blocks: 'Phase 16 UoW Migration Gate',
      responsibleRole: 'PostgreSQL Security Engineer'
    },
    {
      order: 3,
      title: 'Stage 1: Domain-by-Domain Unit-of-Work Refactor: Batch 1 (EMPI, Demographics, CPOE)',
      why: 'Replaces 156 raw client.query calls across 85 services with managed transaction and ALS context safety wrapper.',
      blocks: 'Wave 1B Domain Rollouts',
      responsibleRole: 'Backend Lead Engineer'
    },
    {
      order: 4,
      title: 'Stage 2: Unify Catalog RLS Policies to Canonical app.tenant_id across all 100 tables',
      why: 'Eliminates 54 vs 46 catalog policy split and simplifies connection context initialization.',
      blocks: 'Wave 1B Unfreeze',
      responsibleRole: 'PostgreSQL Security Engineer'
    },
    {
      order: 5,
      title: 'Stage 3: Mount requireClinicalAuthorization on 38 Tier-1 Routes',
      why: 'Enforces DPJP credentials, SoD, and Break-the-Glass in live production HTTP traffic.',
      blocks: 'Production Cutover Gate',
      responsibleRole: 'Application Security Engineer'
    }
  ]
};
