import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Layers, ShieldAlert, ArrowUpDown } from 'lucide-react';
import { governanceService } from '../../../core/governance/governanceService.js';

export default function GovernanceDomainsPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    governanceService.getDomains().then((res) => {
      setDomains(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>Domain Maturity & Readiness Matrix</span>
        </h2>
        <p className="text-xs text-slate-400">
          Kematangan 13 domain klinis dan operasional NurseFlow. Keberadaan berkas servis tidak disamakan dengan kelulusan verifikasi otorisasi.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4">Domain</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-center">Designed</th>
              <th className="p-4 text-center">Implemented</th>
              <th className="p-4 text-center">Tested</th>
              <th className="p-4 text-center">Verified</th>
              <th className="p-4 text-center">Blocked</th>
              <th className="p-4 text-center">Maturity</th>
              <th className="p-4">Primary Service</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {domains.map((d) => (
              <tr key={d.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-bold text-white">
                  <div className="flex flex-col">
                    <span>{d.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-normal">{d.id}</span>
                  </div>
                </td>

                <td className="p-4 text-[11px] text-slate-400 font-mono">
                  {d.category}
                </td>

                <td className="p-4 text-center">
                  {d.designed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600 mx-auto" />
                  )}
                </td>

                <td className="p-4 text-center">
                  {d.implemented ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600 mx-auto" />
                  )}
                </td>

                <td className="p-4 text-center">
                  {d.tested ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600 mx-auto" />
                  )}
                </td>

                <td className="p-4 text-center">
                  {d.verified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      NO
                    </span>
                  )}
                </td>

                <td className="p-4 text-center">
                  {d.blocked ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      YES
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      NO
                    </span>
                  )}
                </td>

                <td className="p-4 text-center">
                  <span className={`font-mono font-bold text-xs ${
                    d.maturityScore >= 85 ? 'text-emerald-400' : d.maturityScore >= 70 ? 'text-cyan-400' : 'text-rose-400'
                  }`}>
                    {d.maturityScore}%
                  </span>
                </td>

                <td className="p-4 font-mono text-[11px] text-slate-400">
                  {d.primaryService}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
