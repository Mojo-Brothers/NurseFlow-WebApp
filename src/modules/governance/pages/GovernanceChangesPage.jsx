import React from 'react';
import { History, ShieldAlert, FileText, CheckCircle2, FileCode, Tag } from 'lucide-react';

export default function GovernanceChangesPage() {
  const changelogEntries = [
    {
      date: '28 September 2026',
      phase: 'P0-2B Wave 1A.5.3',
      category: '[MAJOR] [SECURITY] [AUDIT]',
      tag: 'stage1-p02b-wave1a5-3-adversarial-architecture-review',
      isProductionChange: false,
      summary: 'Adversarial Security Architecture Review (Design Breaking). Menemukan kebocoran connection pool pada uncommitted client release (FM-001), 38 berkas fallback hardcoded UUID (FM-002), dan mengonfirmasi BOLA pada 5 endpoint transaksi anak.',
      verdict: 'VALID_WITH_REQUIRED_REVISIONS • FOUNDATION: NOT_READY • WAVE 1B: HOLD',
      docs: [
        'docs/audit/P0-2B-WAVE1A5.3-ADVERSARIAL-ARCHITECTURE-REVIEW.md',
        'docs/audit/P0-2B-WAVE1A5.3-FAILURE-MODE-MATRIX.md',
        'scratch/p02b_wave1a5_3_adversarial_evidence.json'
      ]
    },
    {
      date: '28 September 2026',
      phase: 'P0-2B Wave 1A.5.2',
      category: '[MAJOR] [SECURITY] [ARCHITECTURE] [DOCS]',
      tag: 'stage1-p02b-wave1a5-2-security-boundary-final-closure',
      isProductionChange: false,
      summary: 'Penutupan Bukti Forensik & Desain Arsitektur Perimeter Final. Memilih Option D Scoped UoW + ALS context, 5 role PostgreSQL least privilege, SECURITY DEFINER outbox discovery, dan spesifikasi 7 canonical resource resolvers.',
      verdict: 'EVIDENCE: COMPLETE • ARCHITECTURE: READY • FOUNDATION: NOT_READY',
      docs: [
        'docs/audit/P0-2B-WAVE1A5.2-EVIDENCE-CLOSURE.md',
        'docs/audit/P0-2B-WAVE1A5.2-FINAL-SECURITY-ARCHITECTURE.md',
        'docs/audit/P0-2B-WAVE1A5.2-IMPLEMENTATION-SEQUENCE.md'
      ]
    },
    {
      date: '27 September 2026',
      phase: 'P0-2B Wave 1A.5.1',
      category: '[MAJOR] [SECURITY] [AUDIT]',
      tag: 'stage1-p02b-wave1a5-1-ready-gate-adversarial-challenge',
      isProductionChange: false,
      summary: 'Adversarial Challenge terhadap verdict READY Wave 1A.5. Membuktikan secara empiris bahwa runtime role masih superuser, 5 tabel fail-open, 21 tabel zero policies, dan 0/38 rute Tier-1 memiliki otorisasi klinis.',
      verdict: 'READY VERDICT REFUTED • CURRENT FOUNDATION: NOT_READY',
      docs: [
        'docs/audit/P0-2B-WAVE1A5.1-READY-GATE-ADVERSARIAL-CHALLENGE.md'
      ]
    },
    {
      date: '27 September 2026',
      phase: 'P0-2B Wave 1A.5',
      category: '[MAJOR] [SECURITY] [RESOLUTION]',
      tag: 'stage1-p02b-wave1a5-security-boundary-resolution',
      isProductionChange: false,
      summary: 'Resolusi Batas Keamanan Tenant. Klasifikasi 59 tabel database, penyelesaian paradoks SSOT variabel context, dan pemetaan 22 tabel anak.',
      verdict: 'RESOLUTION COMPLETE',
      docs: [
        'docs/audit/P0-2B-WAVE1A5-SECURITY-BOUNDARY-RESOLUTION.md'
      ]
    },
    {
      date: '27 September 2026',
      phase: 'P0-2B Wave 1A.4',
      category: '[MAJOR] [SECURITY] [GATE]',
      tag: 'stage1-p02b-wave1a4-tenant-architecture-gate',
      isProductionChange: false,
      summary: 'Evaluasi Gerbang Arsitektur Tenant. Audit mendalam PostgreSQL RLS, arsitektur single-tenant vs multi-tenant, dan penetapan model hybrid.',
      verdict: 'GATE PASSED',
      docs: [
        'docs/audit/P0-2B-WAVE1A4-TENANT-ARCHITECTURE-GATE.md'
      ]
    },
    {
      date: '26 September 2026',
      phase: 'P0-2A Remediation',
      category: '[MAJOR] [SECURITY] [FOUNDATION]',
      tag: 'stage1-p02a-authorization-foundation-remediation',
      isProductionChange: false,
      summary: 'Remediasi dan ratifikasi fondasi otorisasi klinis (P0-2A). Perancangan RBAC/ABAC terpadu, DPJP clinical privileging, dan integrasi RFC 7807 problem details.',
      verdict: 'FOUNDATION RATIFIED',
      docs: [
        'docs/governance/P0-2A_AUTHORIZATION_FOUNDATION_IMPLEMENTATION.md',
        'docs/governance/P0-2A_INDEPENDENT_FORENSIC_VERIFICATION.md'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <span>Audit & Governance Change History</span>
        </h2>
        <p className="text-xs text-slate-400">
          Catatan kronologis perubahan tata kelola sistem. Seluruh entri mematuhi aturan ketat: mutasi produksi dilarang selama fase audit.
        </p>
      </div>

      <div className="space-y-4">
        {changelogEntries.map((c, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-cyan-400">{c.date}</span>
                <span className="text-xs font-bold text-white">{c.phase}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {c.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  PRODUCTION CHANGES: {c.isProductionChange ? 'TRUE' : 'FALSE'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-300 leading-relaxed">{c.summary}</p>
              <div className="mt-2 text-xs font-mono font-semibold text-amber-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                VERDICT: {c.verdict}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-slate-400">
                {c.docs.map((doc, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                    {doc}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Tag: {c.tag}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
