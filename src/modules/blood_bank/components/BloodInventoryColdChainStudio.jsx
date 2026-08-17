import React, { useState } from 'react';
import { bloodBankService, BLOOD_PRODUCTS } from '../../../../server/services/bloodBank.service.js';
import toast from 'react-hot-toast';

export default function BloodInventoryColdChainStudio() {
  const [units, setUnits] = useState(() => Array.from(bloodBankService.units.values()));
  const [refrigeratorTemp, setRefrigeratorTemp] = useState(4.2);
  const [freezerTemp, setFreezerTemp] = useState(-22.0);
  const [agitatorTemp, setAgitatorTemp] = useState(22.4);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">TERSEDIA</span>;
      case 'CROSSMATCHED':
        return <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">CROSSMATCHED</span>;
      case 'ISSUED':
        return <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px]">KELUAR KE BANGSAL</span>;
      case 'QUARANTINED':
        return <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[10px] animate-pulse">KARANTINA</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px]">{status}</span>;
    }
  };

  const handleSimulateExcursion = () => {
    setRefrigeratorTemp(8.5); // Deviation > 6°C
    toast.error('🚨 ALARM SUHU DINGIN (COLD CHAIN): Suhu Chiller Darah 8.5°C (> 6.0°C)! Unit darah masuk karantina otomatis.', {
      duration: 6000
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">bloodtype</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">BDRS Blood Product Inventory & Cold Chain Monitor</h3>
            <p className="text-xs text-slate-400">
              Pelacakan Komponen Darah (PRC, FFP, TC) & Rantai Dingin Standar Permenkes 91/2015
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 font-mono">
          ISBT 128 Standard
        </span>
      </div>

      {/* 3 Cold Storage Device Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Chiller 1: PRC */}
        <div className={`p-3.5 rounded-2xl border ${
          refrigeratorTemp > 6.0 || refrigeratorTemp < 2.0
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 dark:text-slate-200">Blood Bank Chiller (PRC/WB)</span>
            <span className="text-[10px] font-mono text-slate-400">Target: 2°C - 6°C</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{refrigeratorTemp}°C</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              refrigeratorTemp > 6.0 ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {refrigeratorTemp > 6.0 ? 'SUHU TIDAK NORMAL ⚠️' : 'NORMAL OPTIMAL'}
            </span>
          </div>
        </div>

        {/* Freezer: FFP / Cryo */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 dark:text-slate-200">Plasma Deep Freezer (FFP)</span>
            <span className="text-[10px] font-mono text-slate-400">Target: ≤ -18°C</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{freezerTemp}°C</span>
            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
              BEKU OPTIMAL
            </span>
          </div>
        </div>

        {/* Agitator: Platelets TC */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 dark:text-slate-200">Platelet Agitator (TC)</span>
            <span className="text-[10px] font-mono text-slate-400">Target: 20°C - 24°C</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{agitatorTemp}°C</span>
            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
              AGITASI AKTIF
            </span>
          </div>
        </div>
      </div>

      {/* Blood Units Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-mono text-[11px]">
              <th className="py-2 px-3">NO. KANTONG (ISBT 128)</th>
              <th className="py-2 px-3">KOMPONEN PRODUK</th>
              <th className="py-2 px-3">GOLONGAN / RHESUS</th>
              <th className="py-2 px-3">VOLUME</th>
              <th className="py-2 px-3">KEDALUWARSA</th>
              <th className="py-2 px-3">STATUS BDRS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {units.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                  {u.unitNumber}
                </td>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900 dark:text-white">{u.productType}</div>
                  <div className="text-[10px] text-slate-400">{u.storageLocation}</div>
                </td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black font-mono">
                    {u.aboType} Rh {u.rhesusType === 'POSITIVE' ? '+' : '-'}
                  </span>
                </td>
                <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                  {u.volumeMl} ml
                </td>
                <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                  {u.expiryDate.split('T')[0]}
                </td>
                <td className="py-3 px-3">
                  {getStatusBadge(u.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <span className="text-slate-400 text-[11px]">Sistem logger sensor suhu otomatis mencatat log setiap 15 menit.</span>
        <button
          type="button"
          onClick={handleSimulateExcursion}
          className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-300 cursor-pointer"
        >
          Simulasi Deviasi Suhu Chiller (Cold Chain Alert)
        </button>
      </div>
    </div>
  );
}
