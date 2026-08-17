import React from 'react';
import { forensicAuditEcosystemService } from '../../../../../server/services/forensicAuditEcosystem.service.js';
import toast from 'react-hot-toast';

export default function ComplianceReportingStudio() {
  const scorecard = forensicAuditEcosystemService.getComplianceScorecard();

  const handleExportCsv = () => {
    const data = forensicAuditEcosystemService.queryLedger({ limit: 1000 }).logs;
    const headers = ['ID,Waktu,Pelaksana,Role,Aksi,Modul,Pasien_MRN,Pasien_Nama,Alasan,Hash_SHA256\n'];
    const rows = data.map(d => `"${d.id}","${d.performed_at}","${d.performed_by}","${d.user_role}","${d.action}","${d.module_name}","${d.patient_mrn || ''}","${d.patient_name || ''}","${d.reason || ''}","${d.signature_hash}"\n`);
    
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `JCI_Forensic_Audit_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan Jejak Audit JCI berhasil diekspor ke CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Top Compliance Scorecard Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-teal-500/10 text-teal-600 rounded-2xl">
            <span className="material-symbols-outlined text-3xl">workspace_premium</span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Skor Kepatuhan Audit Forensik Rumah Sakit
            </span>
            <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {scorecard.overallComplianceScore}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Sesuai dengan standar Akreditasi JCI 7th Edition, ISO 27001 ISMS, dan Permenkes 24/2022.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Ekspor Laporan Audit Lengkap (CSV)
        </button>
      </div>

      {/* Standards Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scorecard.standards.map((std, i) => (
          <div
            key={i}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white max-w-[80%] leading-relaxed">
                {std.standardName}
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                std.status === 'COMPLIANT'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {std.score}% {std.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {std.details}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
