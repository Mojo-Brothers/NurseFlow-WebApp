import React from 'react';
import { executiveCommandCenterService } from '../../../../server/services/executiveCommandCenter.service.js';

export default function BloodBankCommandStudio() {
  const bld = executiveCommandCenterService.getBloodBankMetrics();

  return (
    <div className="space-y-6">
      {/* 4 Blood Bank Component Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Packed Red Cells (PRC)</span>
          <p className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">{bld.components.PRC.units} Kantong</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Stok Siap Pakai (4°C)
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Fresh Frozen Plasma (FFP)</span>
          <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">{bld.components.FFP.units} Kantong</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Beku Plasma (-20°C)
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Thrombocyte Concentrate (TC)</span>
          <p className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400 mt-1">{bld.components.THROMBOCYTE.units} Kantong</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Platelet Agitator (22°C)
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-400">Whole Blood (WB)</span>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">{bld.components.WHOLE_BLOOD.units} Kantong</p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-block">
            Kesiagaan IGD / Bedah
          </span>
        </div>
      </div>

      {/* Expiry & Safety Integrity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Masa Simpan Kadaluarsa (&lt;48 Jam)</span>
            <p className="text-[11px] text-slate-500">Kantong darah mendekati tanggal batas simpan</p>
          </div>
          <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{bld.nearExpirationUnits48h} Unit</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Antrean Uji Crossmatch Cito</span>
            <p className="text-[11px] text-slate-500">Permintaan darah darurat aktif</p>
          </div>
          <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">{bld.pendingEmergencyCrossmatches} Order</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">Peringatan Suhu Cold Chain</span>
            <p className="text-[11px] text-slate-500">Sensor IoT Blood Refrigerator</p>
          </div>
          <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{bld.coldChainTempAlerts} Anomali</span>
        </div>
      </div>
    </div>
  );
}
