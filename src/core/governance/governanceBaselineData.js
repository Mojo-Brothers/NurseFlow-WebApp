/**
 * NurseFlow Enterprise HIS 2026 — Master Governance Baseline Snapshot
 * High-fidelity canonical data snapshot generated directly from repository reality.
 */

export const GOVERNANCE_BASELINE_DATA = {
  scannedAt: '2026-09-28T13:50:00.000Z',
  project: {
    id: 'nurseflow-enterprise-his',
    name: 'NurseFlow Enterprise Hospital Information System',
    overallHealth: 'CRITICAL_BLOCKER',
    currentGate: {
      phaseId: 'PHASE-12-WAVE1A53',
      name: 'P0-2B Wave 1A.5.3 Adversarial Architecture Review',
      status: 'HOLD',
      verdict: 'VALID_WITH_REQUIRED_REVISIONS',
      nextGate: 'Phase 13 — Security Foundation Implementation'
    },
    securityStatus: {
      foundation: 'NOT_READY',
      runtimeDbRole: 'BLOCKED',
      tenantIsolation: 'NOT_READY',
      clinicalAuthorization: 'NOT_ENFORCED',
      wave1bStatus: 'HOLD',
      productionChangesAllowed: false
    },
    coverageMetrics: {
      evidenceCoveragePct: 94.2,
      implementationCoveragePct: 76.5,
      verificationCoveragePct: 62.8,
      securityControlsVerifiedCount: 3,
      securityControlsTotalCount: 11
    }
  },
  inventory: {
    migrationsCount: 76,
    testSuitesCount: 195,
    testCategories: {
      security: 28,
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
    auditDocsCount: 12,
    governanceDocsCount: 26,
    liveDbStatus: {
      connected: true,
      role: 'postgres',
      isSuperuser: true,
      rlsTablesCount: 59,
      policiesCount: 79,
      zeroPolicyTablesCount: 21,
      failOpenPoliciesCount: 5
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
      lastVerified: '2026-09-28',
      blocker: 'In-memory blacklist desynchronization on multi-node deployment'
    },
    {
      id: 'SEC-02',
      name: 'Tenant Extraction & Anti-Spoofing',
      current: 'Strict header-to-JWT anti-spoofing in authMiddleware; 38 fallback UUIDs in services',
      target: 'Zero fallback UUIDs; fail-closed tenant resolution on all requests',
      status: 'BLOCKED',
      evidence: 'scratch/p02b_wave1a5_3_adversarial_evidence.json',
      lastVerified: '2026-09-28',
      blocker: '38 files contain hardcoded fallback 00000000-0000-0000-0000-000000000001'
    },
    {
      id: 'SEC-03',
      name: 'Database Tenant Context Isolation (SET LOCAL)',
      current: 'Option D Scoped UoW designed; raw client.query with manual BEGIN in 27 services',
      target: 'Unified db.withTenantContext with ALS fallback and mandatory ROLLBACK on release',
      status: 'BLOCKED',
      evidence: 'scratch/test_pool_leak_scenario.js',
      lastVerified: '2026-09-28',
      blocker: 'Connection pool leak on uncommitted client release proven empirically'
    },
    {
      id: 'SEC-04',
      name: 'Runtime Database Role Least Privilege',
      current: 'postgres (SUPERUSER / BYPASSRLS=true)',
      target: 'nurseflow_app_user (NON-SUPERUSER / BYPASSRLS=false / NO TRUNCATE)',
      status: 'BLOCKED',
      evidence: 'scratch/audit_runtime_role.js',
      lastVerified: '2026-09-28',
      blocker: 'Migration 068 unexecuted; role cannot login and holds TRUNCATE on 212 tables'
    },
    {
      id: 'SEC-05',
      name: 'PostgreSQL Row-Level Security (RLS) Fail-Closed',
      current: '59 tables RLS enabled; 5 tables fail-open; 21 tables have 0 policies',
      target: '100% fail-closed policies on 59 tables; zero fail-open policies',
      status: 'NOT_READY',
      evidence: 'scratch/audit_21_zero_tables.js',
      lastVerified: '2026-09-28',
      blocker: '21 tables will suffer total-deny lockout if non-superuser is activated'
    },
    {
      id: 'SEC-06',
      name: 'Child Table Tenant Ownership & BOLA Protection',
      current: '5 child endpoints query raw :id without parent join (eMAR, Dispense, CarePlan, Invoice, Diagnostics)',
      target: 'Mandatory parent join verifying tenant_id or verified denormalized tenant_id',
      status: 'BLOCKED',
      evidence: 'server/services/medicationClosedLoop.service.js:1318',
      lastVerified: '2026-09-28',
      blocker: 'BOLA vulnerability allows cross-hospital mutation of patient eMAR and invoices'
    },
    {
      id: 'SEC-07',
      name: '7 Canonical Resource Resolvers',
      current: 'Specification completed in Wave 1A.5.2; resolvers not mounted on routes',
      target: 'All 7 resolvers active in clinicalAuthorization.middleware across 38 Tier-1 routes',
      status: 'DESIGNED_ONLY',
      evidence: 'docs/audit/P0-2B-WAVE1A5.2-FINAL-SECURITY-ARCHITECTURE.md',
      lastVerified: '2026-09-28',
      blocker: 'Requires Phase 4 of P0-2B implementation sequence'
    },
    {
      id: 'SEC-08',
      name: 'Tier-1 Clinical Authorization Enforcement',
      current: '0 of 38 routes mount requireClinicalAuthorization',
      target: '38 of 38 Tier-1 routes mount requireClinicalAuthorization',
      status: 'NOT_ENFORCED',
      evidence: 'scratch/tier1_exact_inventory.json',
      lastVerified: '2026-09-28',
      blocker: 'Middleware implemented in isolation but completely unmounted'
    },
    {
      id: 'SEC-09',
      name: 'Separation of Duties (SoD) & DPJP Privilege Guard',
      current: 'Service exists and tested in unit mocks; 0 HTTP invocations in production routes',
      target: 'Active validation on high-risk clinical mutations (e.g. CPOE prescribe vs dispense)',
      status: 'NOT_ENFORCED',
      evidence: 'server/services/separationOfDuties.service.js',
      lastVerified: '2026-09-28',
      blocker: 'Dependent on Tier-1 route middleware mounting'
    },
    {
      id: 'SEC-10',
      name: 'Break-The-Glass (BTG) Emergency Override Ledger',
      current: 'Service exists; immutable ledger schema designed; 0 HTTP invocations',
      target: '4-hour emergency credential override with reason logging and clinical director alert',
      status: 'NOT_ENFORCED',
      evidence: 'server/services/breakTheGlass.service.js',
      lastVerified: '2026-09-28',
      blocker: 'Dependent on Tier-1 route middleware mounting'
    },
    {
      id: 'SEC-11',
      name: 'Transactional Outbox & Worker Security Discovery',
      current: 'Worker uses superuser or fails under fail-closed RLS; at-least-once idempotency missing',
      target: 'SECURITY DEFINER get_active_outbox_tenants() + Idempotency-Key headers on HTTP transport',
      status: 'DESIGNED_ONLY',
      evidence: 'docs/audit/P0-2B-WAVE1A5.3-ADVERSARIAL-ARCHITECTURE-REVIEW.md',
      lastVerified: '2026-09-28',
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
    { id: 'PHASE-10', name: 'Phase 10 — Wave 1A.5.1 Adversarial Challenge', order: 10, status: 'REFUTED', currentState: 'Proved current foundation is NOT_READY', targetState: 'Evidence closure', blockers: ['7 Proven findings'], evidenceIds: ['P0-2B-WAVE1A5.1-READY-GATE-ADVERSARIAL-CHALLENGE.md'] },
    { id: 'PHASE-11', name: 'Phase 11 — Wave 1A.5.2 Evidence & Architecture Closure', order: 11, status: 'COMPLETE', currentState: 'Evidence closure COMPLETE, Arch READY, Foundation NOT_READY', targetState: 'Implementation plan', blockers: ['Production changes forbidden'], evidenceIds: ['P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md'] },
    { id: 'PHASE-12', name: 'Phase 12 — Wave 1A.5.3 Adversarial Review', order: 12, status: 'HOLD', currentState: 'Adversarial review completed: VALID_WITH_REQUIRED_REVISIONS', targetState: 'Architectural sign-off', blockers: ['Pool leak FM-001', 'Fallback UUIDs FM-002', '21 Zero tables FM-006'], evidenceIds: ['P0-2B-WAVE1A5.3-ADVERSARIAL-ARCHITECTURE-REVIEW.md'] },
    { id: 'PHASE-13', name: 'Phase 13 — Security Foundation Implementation', order: 13, status: 'BLOCKED', currentState: 'Blocked pending Wave 1A.5.3 revision sign-off', targetState: 'Migration 068 + Scoped UoW', blockers: ['Phase 12 revisions required'], evidenceIds: ['P0-2B-WAVE1A5.2-IMPLEMENTATION-SEQUENCE.md'] },
    { id: 'PHASE-14', name: 'Phase 14 — Independent Post-Impl Security Audit', order: 14, status: 'NOT_STARTED', currentState: 'Pending implementation', targetState: 'Penetration testing', blockers: ['Phase 13 incomplete'], evidenceIds: [] },
    { id: 'PHASE-15', name: 'Phase 15 — P0-2B Wave 1B Clinical Authorization', order: 15, status: 'HOLD', currentState: 'Held until security foundation verified', targetState: 'Mount 38 routes', blockers: ['Phase 13 & 14 incomplete'], evidenceIds: [] },
    { id: 'PHASE-16', name: 'Phase 16+ — Clinical / Operational Completion', order: 16, status: 'NOT_STARTED', currentState: 'Future milestones', targetState: 'Production readiness', blockers: ['Wave 1B incomplete'], evidenceIds: [] }
  ],
  workstreams: [
    {
      id: 'WS-01',
      name: 'Database Security & Role Hardening',
      category: 'DATABASE',
      ownerRole: 'PostgreSQL Security Engineer',
      currentStatus: 'BLOCKED',
      completionEvidence: 'Migration 068 unexecuted; nurseflow_app_user disabled',
      openFindingsCount: 3,
      dependencies: ['P0-2B Wave 1A.5.3 Sign-off'],
      blockers: ['21 Zero-policy tables', 'Fail-open RLS on 5 core tables'],
      nextAction: 'Execute staged migration in staging sandbox',
      lastVerified: '2026-09-28'
    },
    {
      id: 'WS-02',
      name: 'Application Database Access Modernization',
      category: 'SECURITY',
      ownerRole: 'Principal Software Architect',
      currentStatus: 'BLOCKED',
      completionEvidence: 'Option D Scoped UoW selected; 515 raw queries remain in services',
      openFindingsCount: 2,
      dependencies: ['Connection pool safety wrapper'],
      blockers: ['FM-001 Pool leak on uncommitted release', 'FM-002 Fallback UUIDs'],
      nextAction: 'Build db.withTenantContext with explicit ROLLBACK guarantee',
      lastVerified: '2026-09-28'
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
      blockers: ['Security Foundation NOT_READY'],
      nextAction: 'Mount middleware on 38 Tier-1 routes after cutover',
      lastVerified: '2026-09-28'
    },
    {
      id: 'WS-04',
      name: 'Child Table BOLA & Parent Binding',
      category: 'DATA_INTEGRITY',
      ownerRole: 'Backend Security Auditor',
      currentStatus: 'BLOCKED',
      completionEvidence: '5 endpoints verified directly exposed to cross-tenant tampering',
      openFindingsCount: 1,
      dependencies: ['WS-02 Scoped UoW'],
      blockers: ['medication_emar_administrations has no tenant_id or parent join'],
      nextAction: 'Add parent table join and tenant ownership checks',
      lastVerified: '2026-09-28'
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
      lastVerified: '2026-09-28'
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
    { id: 'SECURITY', name: 'Tenant Security & Clinical Authorization', category: 'SECURITY', designed: true, implemented: false, tested: true, verified: false, blocked: true, maturityScore: 35, totalRoutes: 5, totalTables: 6, primaryService: 'authorizationDecision.service.js' }
  ],
  findings: [
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
      securityImpact: 'Unauthenticated or context-less queries leak 5,160 patients and allow cross-tenant insertion.',
      status: 'OPEN',
      remediation: 'Redefine policies to strict fail-closed: tenant_id = (NULLIF(current_setting(\'app.current_tenant_id\', true), \'\'))::uuid.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md',
      evidenceRef: 'scratch/test_insert_fail_open.js'
    },
    {
      id: 'FINDING-1A51-04',
      severity: 'CRITICAL',
      domain: 'ROLE_SECURITY',
      title: 'Runtime Role Activation Incapacity and Over-Privilege',
      currentState: 'nurseflow_app_user cannot log in (rolcanlogin=false) and has TRUNCATE privileges on 212 tables.',
      affectedComponents: ['pg_roles', 'information_schema.role_table_grants'],
      securityImpact: 'Application runs as postgres superuser, bypassing RLS and defeating least-privilege principles.',
      status: 'OPEN',
      remediation: 'Migration 068 to grant LOGIN and REVOKE TRUNCATE/REFERENCES/TRIGGER on all tables.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md',
      evidenceRef: 'scratch/audit_runtime_role.js'
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
      remediation: 'Mount requireClinicalAuthorization on all 38 Tier-1 routes in Phase 4 of P0-2B.',
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
      status: 'OPEN',
      remediation: 'Add JOIN to parent table verifying tenant_id or denormalize tenant_id onto child tables.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md',
      evidenceRef: 'server/services/medicationClosedLoop.service.js:1318'
    },
    {
      id: 'FINDING-1A51-07',
      severity: 'HIGH',
      domain: 'TENANT_ISOLATION',
      title: '21 Tables with RLS Enabled but Zero Policies Defined',
      currentState: '21 tables have RLS enabled with 0 policies in pg_policy.',
      affectedComponents: ['database/migrations/032_postgresql_rls_and_pki_lifecycle.sql', 'pg_policy'],
      securityImpact: 'When runtime role switches to non-superuser, all 21 tables will suffer complete access lockout (0 rows returned).',
      status: 'OPEN',
      remediation: 'Add explicit fail-closed policies for 17 transactional tables and global read-only policies for 4 reference tables.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md',
      evidenceRef: 'scratch/audit_21_zero_tables.js'
    },
    {
      id: 'FM-001',
      severity: 'CRITICAL',
      domain: 'CONNECTION_POOL',
      title: 'Connection Pool Context Leakage on Uncommitted Release',
      currentState: 'Releasing client with open transaction retains SET LOCAL app.current_tenant_id for subsequent leases.',
      affectedComponents: ['server/db/postgresPool.js'],
      securityImpact: 'Tenant B inherits Tenant A context on pooled connection lease, resulting in catastrophic cross-tenant data leakage.',
      status: 'OPEN',
      remediation: 'Wrap pool leases with safety wrapper that executes ROLLBACK; DISCARD ALL; on release.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.3-FAILURE-MODE-MATRIX.md',
      evidenceRef: 'scratch/test_pool_leak_scenario.js'
    },
    {
      id: 'FM-002',
      severity: 'CRITICAL',
      domain: 'APPLICATION_SECURITY',
      title: 'Pervasive Hardcoded Default Tenant UUID Fallback Bypass',
      currentState: '38 files in controllers and services fallback to 00000000-0000-0000-0000-000000000001.',
      affectedComponents: ['server/controllers/*.js', 'src/core/security/jwtSecurity.service.js'],
      securityImpact: 'Unauthenticated requests bypass fail-closed RLS and pollute default tenant database tables.',
      status: 'OPEN',
      remediation: 'Purge all 38 hardcoded fallbacks; reject requests with 401/403 at middleware boundary.',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.3-FAILURE-MODE-MATRIX.md',
      evidenceRef: 'scratch/p02b_wave1a5_3_adversarial_evidence.json'
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
      status: 'OPEN',
      remediation: 'Pass tenantId: payload.tenantId in rotateRefreshToken().',
      sourceDoc: 'docs/audit/P0-2B-WAVE1A5.3-FAILURE-MODE-MATRIX.md',
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
      claim: 'Database runtime enforces least privilege non-superuser boundaries.',
      reality: 'Current pool runs under role \'postgres\' with SUPERUSER privileges. RLS bypass is possible.',
      severity: 'CRITICAL',
      conservativeVerdict: 'BLOCKED',
      affectedEntity: 'Runtime DB Role'
    }
  ],
  nextRequiredActions: [
    {
      order: 1,
      title: 'Resolve Wave 1A.5.3 Adversarial Findings (FM-001, FM-002, FM-006)',
      why: 'PostgreSQL connection pool leaks uncommitted tenant context; 38 files contain fallback UUIDs; 21 tables lack RLS policies.',
      blocks: 'Phase 13: Security Foundation Implementation',
      responsibleRole: 'Principal Security Architect & PostgreSQL Engineer'
    },
    {
      order: 2,
      title: 'Stage 1: Apply Database Catalog Hardening (Migration 068)',
      why: 'Provides login capability to nurseflow_app_user, revokes TRUNCATE, and hardens fail-closed policies on 5 tables.',
      blocks: 'Phase 13 Cutover Gate',
      responsibleRole: 'PostgreSQL Security Engineer'
    },
    {
      order: 3,
      title: 'Stage 2: Refactor 27 Services to Scoped Unit-of-Work Wrapper',
      why: 'Replaces 515 raw client.query calls with managed transaction and ALS context safety wrapper.',
      blocks: 'Runtime User Switchover',
      responsibleRole: 'Backend Lead Engineer'
    },
    {
      order: 4,
      title: 'Stage 3: Mount requireClinicalAuthorization on 38 Tier-1 Routes',
      why: 'Enforces DPJP credentials, SoD, and Break-the-Glass in live production HTTP traffic.',
      blocks: 'Wave 1B Unfreeze',
      responsibleRole: 'Application Security Engineer'
    }
  ]
};
