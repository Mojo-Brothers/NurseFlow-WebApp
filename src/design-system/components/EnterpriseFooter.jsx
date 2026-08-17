import React from 'react';

export default function EnterpriseFooter() {
  const syncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono mt-auto">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>CORE ONLINE • REALTIME WEBSOCKET ACTIVE</span>
        </span>
        <span className="text-slate-600">|</span>
        <span>SATUSEHAT FHIR R4: <strong className="text-slate-200">CONNECTED</strong></span>
        <span className="text-slate-600">|</span>
        <span>BPJS V-CLAIM 2.0: <strong className="text-slate-200">STANDBY</strong></span>
      </div>

      <div className="flex items-center gap-3">
        <span>Sinkronisasi Terakhir: <strong className="text-slate-200">{syncTime} WIB</strong></span>
        <span className="text-slate-600">|</span>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
          NurseFlow HIS v2026.8.1-Enterprise
        </span>
      </div>
    </footer>
  );
}
