import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, ShieldAlert, CheckCircle2, Server, Key, FileCode } from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';

export default function GovernanceDatabasePage() {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceService.getInventory().then((res) => {
      setInventory(res);
      setLoading(false);
    });
  }, []);

  if (loading || !inventory) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { migrationsCount, liveDbStatus, rawClientQueryCount, serviceFilesCount } = inventory;

  const zeroPolicyTables = [
    'blood_bank_billing_reconciliations',
    'blood_bedside_dual_nurse_verifications',
    'bpjs_claim_disputes',
    'bpjs_claim_submissions',
    'bpjs_vclaim_lifecycle_logs',
    'cssd_sterilization_cycles',
    'hemovigilance_incident_investigations',
    'inacbg_grouping_results',
    'master_inacbg_tariffs',
    'medical_device_implant_recalls',
    'patient_billing_reconciliation',
    'pharmacy_controlled_substance_logs',
    'pharmacy_depots',
    'pharmacy_dispensing_orders',
    'post_anesthesia_aldrete_scores',
    'radiology_critical_finding_alerts',
    'radiology_instances',
    'radiology_series',
    'surgical_clinical_notes',
    'surgical_teams',
    'who_surgical_safety_checklists'
  ];

  const failOpenTables = [
    { name: 'master_patients', rows: '5,160 rows', flaw: 'USING (current_setting IS NULL OR tenant_id = ...)' },
    { name: 'encounters', rows: '5,102 rows', flaw: 'USING (current_setting IS NULL OR tenant_id = ...)' },
    { name: 'clinical_orders', rows: '7,400+ rows', flaw: 'USING (current_setting IS NULL OR tenant_id = ...)' },
    { name: 'safety_decision_registry', rows: 'Audit table', flaw: 'USING (current_setting IS NULL OR tenant_id = ...)' },
    { name: 'universal_audit_logs', rows: 'Audit table', flaw: 'USING (current_setting IS NULL OR tenant_id = ...)' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span>PostgreSQL 16 Schema & Catalog Inventory</span>
        </h2>
        <p className="text-xs text-slate-400">
          Kondisi fisik katalog basis data, status kebijakan RLS, migrasi, dan peran runtime PostgreSQL.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-500 text-xs font-medium">Applied Migrations</span>
          <div className="text-2xl font-black text-white mt-1">{migrationsCount} Files</div>
          <span className="text-[11px] text-cyan-400 mt-0.5 block font-mono">001 s/d 076 applied</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-500 text-xs font-medium">RLS Enabled Tables</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{liveDbStatus.rlsTablesCount} Tables</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Row-level security active</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-500 text-xs font-medium">Zero-Policy Lockout Risk</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{liveDbStatus.zeroPolicyTablesCount} Tables</div>
          <span className="text-[11px] text-rose-400/90 mt-0.5 block font-semibold">Total-deny on non-superuser</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-500 text-xs font-medium">Raw Client Queries</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{rawClientQueryCount} Queries</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Across {serviceFilesCount} service files</span>
        </div>
      </div>

      {/* Runtime Role Warning Banner */}
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="text-white block">Runtime Role: {liveDbStatus.role} (Superuser: {String(liveDbStatus.isSuperuser)})</strong>
            <span>Aplikasi masih terhubung sebagai superuser postgres. RLS bypass terjadi secara implisit pada seluruh kueri.</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-rose-500 text-white font-bold text-[10px] uppercase shrink-0">
          STATUS: BLOCKED
        </span>
      </div>

      {/* Two Column Grid: 21 Zero-Policy Tables & 5 Fail-Open Policies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 21 Zero-Policy Tables */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>21 Zero-Policy RLS Tables (Total-Deny Hazard)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              MUST FIX BEFORE CUTOVER
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Tabel-tabel ini telah memiliki RLS aktif namun 0 kebijakan di pg_policy. Seluruh kolom tenant_id ada, namun non-superuser akan diblokir total (0 rows).
          </p>

          <div className="max-h-64 overflow-y-auto space-y-1 pr-2 scrollbar-thin">
            {zeroPolicyTables.map((t, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                <span>{t}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">has tenant_id</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5 Fail-Open Policies */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>5 Fail-Open RLS Policies (Data Leakage Hazard)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              REDEFINE POLICY
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Kebijakan lama mengizinkan kueri tanpa tenant context untuk melihat seluruh baris tabel master pasien dan kunjungan.
          </p>

          <div className="space-y-2 pt-1">
            {failOpenTables.map((f, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-300">{f.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{f.rows}</span>
                </div>
                <p className="font-mono text-[10px] text-rose-300/80 bg-rose-500/5 p-1.5 rounded border border-rose-500/20">
                  {f.flaw}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
