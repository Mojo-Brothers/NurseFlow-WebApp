import React from 'react';
import { lisPacsEngineService, SPECIMEN_STATUS } from '../../../../server/services/lisPacsEngine.service.js';

export default function LisCommandCenter({ orders, onSelectOrder, onOpenAccessioning, onOpenEntry }) {
  const allSpecimens = Array.from(lisPacsEngineService.specimens.values());
  const waitingPhlebotomy = orders?.length || allSpecimens.filter(s => s.status === SPECIMEN_STATUS.ORDERED || s.status === 'ORDERED').length;
  const inAnalysis = allSpecimens.filter(s => s.status === SPECIMEN_STATUS.ANALYZING || s.status === SPECIMEN_STATUS.RECEIVED_IN_LAB).length;
  const panicCount = (lisPacsEngineService.panicAlerts || []).filter(a => !a.isAcknowledged && a.status !== 'READBACK_CONFIRMED').length;
  const releasedCount = Array.from(lisPacsEngineService.testResults.values()).filter(r => r.status === SPECIMEN_STATUS.RELEASED || r.status === SPECIMEN_STATUS.VERIFIED).length;

  return (
    <div className="p-4 space-y-5">
      {/* 4 LIVE LIS METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Order Menunggu Flebotomi</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{waitingPhlebotomy} <span className="text-xs font-normal">Order</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">Ruang Sampling &amp; Rawat Inap</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">colorize</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Spesimen Dalam Analisis</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{inAnalysis} <span className="text-xs font-normal">Tabung</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">{inAnalysis > 0 ? 'Auto-Analyzer Sedang Berjalan' : 'Antrean Analyzer Kosong'}</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-600/20 text-amber-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">biotech</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400">Nilai Kritis (Panic Values)</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{panicCount} <span className="text-xs font-normal">{panicCount > 0 ? 'Belum Konfirmasi' : 'Kasus Kritis'}</span></div>
            <div className="text-[10px] text-rose-500 font-bold mt-0.5">{panicCount > 0 ? 'JCI IPSG 2 Wajib Read-Back' : 'Seluruh Nilai Kritis Terverifikasi'}</div>
          </div>
          <div className={`w-11 h-11 rounded-2xl bg-rose-600/20 text-rose-600 flex items-center justify-center font-black ${panicCount > 0 ? 'animate-pulse' : ''}`}>
            <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Selesai &amp; Validasi Sp.PK</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{releasedCount} <span className="text-xs font-normal">Hasil Rilis</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">Tersinkronisasi ke EMR</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-600/20 text-emerald-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
        </div>
      </div>

      {/* QUICK WORKSTATION SHORTCUTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={onOpenAccessioning}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all cursor-pointer flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Meja Pengambilan & Barcode Spesimen</h4>
              <p className="text-xs text-slate-400 mt-0.5">Flebotomi, pemilihan tabung vacutainer & pelacakan suhu transport</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
        </div>

        <div 
          onClick={onOpenEntry}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all cursor-pointer flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[28px]">science</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">Workstation Analitikal & Validasi Sp.PK</h4>
              <p className="text-xs text-slate-400 mt-0.5">Input hasil multi-parameter, Delta Check & rilis nilai kritis</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
        </div>
      </div>
    </div>
  );
}
