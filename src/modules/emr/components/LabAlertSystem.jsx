import React, { useState } from 'react';
import { Microscope, AlertCircle, PhoneCall, CheckCircle2, User, Clock, Bell, Share2 } from 'lucide-react';

export default function LabAlertSystem({ formData, setFormData }) {
  const [labResults, setLabResults] = useState([
    { id: 1, test: 'Hemoglobin (Hb)', result: '6.8', unit: 'g/dL', range: '13.0 - 17.0', isCritical: true, status: 'PENDING_REPORT' },
    { id: 2, test: 'Leukosit (WBC)', result: '11.500', unit: '/uL', range: '5.000 - 10.000', isCritical: false, status: 'NORMAL' },
    { id: 3, test: 'Kalium (K+)', result: '6.2', unit: 'mEq/L', range: '3.5 - 5.0', isCritical: true, status: 'PENDING_REPORT' },
    { id: 4, test: 'Trombosit', result: '145.000', unit: '/uL', range: '150.000 - 450.000', isCritical: false, status: 'NORMAL' }
  ]);

  const [reports, setReports] = useState(formData.lab_reports || {});

  const handleReport = (labId, doctorName) => {
    const newReports = {
      ...reports,
      [labId]: {
        timestamp: new Date().toISOString(),
        reported_to: doctorName,
        reported_by: 'Nurse Sarah',
        method: 'Telepon (Read-Back Done)',
        status: 'REPORTED'
      }
    };
    setReports(newReports);
    setFormData({ ...formData, lab_reports: newReports });
    
    // Update local state for visual feedback
    setLabResults(labResults.map(l => l.id === labId ? { ...l, status: 'REPORTED' } : l));
  };

  return (
    <div className="space-y-8">
      {/* JCI COMPLIANCE BANNER */}
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[3rem] flex items-center gap-6 animate-pulse">
        <div className="w-16 h-16 rounded-[2rem] bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-500/40">
          <AlertCircle size={36} />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter text-red-600 dark:text-red-400">Peringatan Nilai Kritis (AOP.5.3)</h3>
          <p className="text-sm font-bold opacity-70 leading-relaxed">Nilai kritis WAJIB dilaporkan ke DPJP dalam waktu &lt; 30 menit. Dokumentasikan nama penerima laporan dan waktu lapor sesuai standar IPSG.2.</p>
        </div>
      </div>

      {/* LAB RESULTS GRID */}
      <div className="grid grid-cols-1 gap-4">
        {labResults.map((lab) => {
          const isCritical = lab.isCritical;
          const isReported = !!reports[lab.id];
          
          return (
            <div 
              key={lab.id} 
              className={`
                p-6 rounded-[2.5rem] border-2 transition-all duration-500
                ${isCritical 
                  ? (isReported ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/30 shadow-lg shadow-red-500/5') 
                  : 'bg-[var(--surface-container-low)] border-[var(--outline-variant)]'}
              `}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isCritical ? (isReported ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-bounce') : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                    <Microscope size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-[var(--on-surface)] uppercase tracking-tight">{lab.test}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest opacity-50">
                      <span>Rujukan: {lab.range}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end">
                   <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-[var(--on-surface)]'}`}>
                        {lab.result}
                      </span>
                      <span className="text-sm font-bold opacity-40 uppercase">{lab.unit}</span>
                   </div>
                   {isCritical && !isReported && (
                     <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mt-1">CRITICAL VALUE!</span>
                   )}
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                   {isCritical && !isReported && (
                     <button 
                       onClick={() => {
                         const doc = prompt("Masukkan Nama DPJP yang menerima laporan:");
                         if (doc) handleReport(lab.id, doc);
                       }}
                       className="flex-1 lg:flex-none px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 flex items-center justify-center gap-2"
                     >
                       <PhoneCall size={16} /> Lapor DPJP
                     </button>
                   )}
                   {isReported && (
                     <div className="flex-1 lg:flex-none px-8 py-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                       <CheckCircle2 size={16} /> Sudah Dilaporkan
                     </div>
                   )}
                   {!isCritical && (
                      <span className="px-6 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                         Dalam Rentang
                      </span>
                   )}
                </div>
              </div>

              {isReported && (
                <div className="mt-4 pt-4 border-t border-emerald-500/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-bold opacity-60">Dilaporkan kepada: <span className="text-[var(--on-surface)] font-black uppercase">{reports[lab.id].reported_to}</span></span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Clock size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-bold opacity-60">Waktu: <span className="text-[var(--on-surface)] font-black uppercase">{new Date(reports[lab.id].timestamp).toLocaleTimeString()}</span></span>
                  </div>
                  <div className="col-span-full flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 mt-2">
                    <Share2 size={12} />
                    Metode: {reports[lab.id].method}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SYSTEM LOGS */}
      <div className="p-6 rounded-3xl border border-dashed border-[var(--outline-variant)] opacity-50">
        <div className="flex items-center gap-3 mb-4">
          <Bell size={18} />
          <h4 className="text-[10px] font-black uppercase tracking-widest">Audit Log: Critical Results Management</h4>
        </div>
        <div className="space-y-2">
           <p className="text-[9px] font-bold">14:20 - Nilai Kritis Hb (6.8) Terdeteksi oleh Sistem.</p>
           <p className="text-[9px] font-bold">14:22 - Notifikasi Push Terkirim ke Perawat Sarah.</p>
           {Object.values(reports).map((r, i) => (
             <p key={i} className="text-[9px] font-bold text-emerald-600 italic">
               {new Date(r.timestamp).toLocaleTimeString()} - Laporan Nilai Kritis diterima oleh {r.reported_to}. (Verified)
             </p>
           ))}
        </div>
      </div>
    </div>
  );
}
