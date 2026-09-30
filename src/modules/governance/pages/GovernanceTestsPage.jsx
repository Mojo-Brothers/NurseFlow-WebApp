import React, { useState, useEffect } from 'react';
import { Terminal, CheckCircle2, ShieldCheck, Flame, Cpu, FolderCheck, Play } from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';

export default function GovernanceTestsPage() {
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

  const { testSuitesCount, testCategories } = inventory;

  const topSuites = [
    { name: 'p02a_security_database_integration.test.js', size: '68 KB', category: 'Security & Auth', focus: 'RLS fail-open verification & privilege boundaries' },
    { name: 'verticalSlice07MedicationDurability.test.js', size: '76 KB', category: 'Vertical Slice', focus: 'Closed-loop medication & 5-rights bedside verification' },
    { name: 'verticalSlice06CRadiologyDurability.test.js', size: '56 KB', category: 'Vertical Slice', focus: 'PACS DICOM studies & critical alerts durability' },
    { name: 'verticalSlice06BLaboratoryDurability.test.js', size: '48 KB', category: 'Vertical Slice', focus: 'LIS specimen tracking & panic values workflow' },
    { name: 'clinicalChaosTortureSuite.test.js', size: '22 KB', category: 'Chaos & Torture', focus: 'Network partitions, concurrency torture & race conditions' },
    { name: 'sprint3P1FhirCanonicalConformance.test.js', size: '20 KB', category: 'Interoperability', focus: 'SATUSEHAT FHIR R4 profile & resource validation' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span>Quality & Test Suite Ecosystem</span>
        </h2>
        <p className="text-xs text-slate-400">
          Inventori pengujian otomatis menyeluruh: unit test, vertical slice, integrasi basis data, dan chaos testing.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-500 text-xs font-medium">Total Test Suites</span>
          <div className="text-2xl font-black text-white mt-1">{testSuitesCount} Files</div>
          <span className="text-[11px] text-cyan-400 mt-0.5 block font-mono">Runner: vitest</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-500 text-xs font-medium">Security Test Suites</span>
          <div className="text-2xl font-black text-rose-400 mt-1">{testCategories.security} Suites</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">ABAC, RLS, Tokens, Roles</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-500 text-xs font-medium">Vertical Slice Suites</span>
          <div className="text-2xl font-black text-blue-400 mt-1">{testCategories.verticalSlice} Suites</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">End-to-end clinical durability</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-500 text-xs font-medium">Chaos & Torture</span>
          <div className="text-2xl font-black text-amber-400 mt-1">{testCategories.chaosAndEndurance} Suites</div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">High concurrency & fail-recovery</span>
        </div>
      </div>

      {/* Top Intensive Test Suites */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Core Durability & Verification Test Suites</span>
        </h3>

        <div className="space-y-3">
          {topSuites.map((s, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono">{s.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {s.size}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {s.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{s.focus}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  AUTOMATED
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
