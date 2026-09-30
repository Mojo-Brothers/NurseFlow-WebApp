import React, { useState } from 'react';
import { FileSearch, CheckCircle2, Code2, Database, Terminal, FileText, ExternalLink, ShieldCheck } from 'lucide-react';

export default function GovernanceEvidencePage() {
  const [selectedType, setSelectedType] = useState('ALL');

  const evidenceRegistry = [
    {
      id: 'EV-001',
      title: 'Connection Pool Context Leakage on Uncommitted Release',
      type: 'SANDBOX_PROOF',
      path: 'scratch/test_pool_leak_scenario.js',
      line: '16-37',
      claim: 'Releasing leased client with open transaction without ROLLBACK causes next leased client on PID 1600 to inherit tenant context.',
      status: 'PROVEN_BY_DISPOSABLE_TEST',
      confidence: 'DIRECT',
      lastVerified: '2026-09-28'
    },
    {
      id: 'EV-002',
      title: '21 Zero-Policy Tables Columns & RLS Configuration',
      type: 'CATALOG_AUDIT',
      path: 'scratch/audit_21_zero_tables.js',
      line: '1-80',
      claim: 'All 21 tables contain a tenant_id column, but 0 policies are defined in pg_policy, causing total-deny on non-superuser.',
      status: 'PROVEN_BY_DISPOSABLE_TEST',
      confidence: 'DIRECT',
      lastVerified: '2026-09-28'
    },
    {
      id: 'EV-003',
      title: 'Child Table BOLA on eMAR Adverse Reaction Route',
      type: 'SOURCE_CODE',
      path: 'server/services/medicationClosedLoop.service.js',
      line: '1318-1330',
      claim: 'SELECT * FROM medication_emar_administrations WHERE id = $1 FOR UPDATE lacks tenant verification or parent join.',
      status: 'PROVEN',
      confidence: 'DIRECT',
      lastVerified: '2026-09-28'
    },
    {
      id: 'EV-004',
      title: 'Zero Mount of Clinical Authorization on Tier-1 Routes',
      type: 'INVENTORY_AUDIT',
      path: 'scratch/tier1_exact_inventory.json',
      line: '1-572',
      claim: 'Exact scanning of all 38 Tier-1 routes reveals hasClinicalAuth is false for 100% of endpoints.',
      status: 'PROVEN',
      confidence: 'DIRECT',
      lastVerified: '2026-09-28'
    },
    {
      id: 'EV-005',
      title: 'Hardcoded Fallback Tenant UUID Bypass in 38 Files',
      type: 'SOURCE_CODE',
      path: 'server/controllers/bedManagement.controller.js',
      line: '24',
      claim: 'Fallback to 00000000-0000-0000-0000-000000000001 violates fail-closed security principles.',
      status: 'PROVEN',
      confidence: 'DIRECT',
      lastVerified: '2026-09-28'
    },
    {
      id: 'EV-006',
      title: 'Refresh Token Rotation Tenant Context Loss',
      type: 'SOURCE_CODE',
      path: 'src/core/security/jwtSecurity.service.js',
      line: '211-216',
      claim: 'rotateRefreshToken() calls issueTokenPair() omitting tenantId, falling back to default tenant.',
      status: 'PROVEN',
      confidence: 'DIRECT',
      lastVerified: '2026-09-28'
    },
    {
      id: 'EV-007',
      title: 'Fail-Open RLS Policy on master_patients & encounters',
      type: 'MIGRATION',
      path: 'database/migrations/032_postgresql_rls_and_pki_lifecycle.sql',
      line: '45-65',
      claim: 'Policy evaluates USING (current_setting IS NULL OR ...), leaking all 5,160 rows on unauthenticated query.',
      status: 'PROVEN',
      confidence: 'DIRECT',
      lastVerified: '2026-09-28'
    },
    {
      id: 'EV-008',
      title: 'In-Memory Token Blacklist Set Desynchronization',
      type: 'SOURCE_CODE',
      path: 'src/core/security/jwtSecurity.service.js',
      line: '32',
      claim: 'SERVER_TOKEN_BLACKLIST is an in-memory JS Set; revocation does not sync across PM2 / Kubernetes cluster.',
      status: 'PROVEN',
      confidence: 'DIRECT',
      lastVerified: '2026-09-28'
    }
  ];

  const filtered = selectedType === 'ALL'
    ? evidenceRegistry
    : evidenceRegistry.filter(e => e.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-cyan-400" />
          <span>Repository Evidence Explorer</span>
        </h2>
        <p className="text-xs text-slate-400">
          Penelusuran bukti fisik repositori dari berkas kode sumber, skrip sandbox, dan migrasi yang mendasari setiap status keamanan.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pt-1">
        {['ALL', 'SOURCE_CODE', 'SANDBOX_PROOF', 'CATALOG_AUDIT', 'INVENTORY_AUDIT', 'MIGRATION'].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedType === t
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Evidence Cards */}
      <div className="space-y-4">
        {filtered.map((ev) => (
          <div
            key={ev.id}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-cyan-400">{ev.id}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {ev.type}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  CONFIDENCE: {ev.confidence}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                {ev.status}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{ev.title}</h3>
              <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                {ev.claim}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-[11px] text-cyan-300">
                  {ev.path}{ev.line ? `:${ev.line}` : ''}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Verified: {ev.lastVerified}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
