import React, { useState } from 'react';

export default function PredictiveBedAvailabilityStudio() {
  const [prediction] = useState({
    currentAvailable: 14,
    projectedAvailable24h: 22,
    projectedDischarges24h: 9
  });

  return (
    <div className="space-y-6">
      {/* Top Forecast Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Ketersediaan Bed Saat Ini</span>
          <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {prediction.currentAvailable} Bed
          </p>
          <p className="text-[11px] text-slate-500">Status AVAILABLE langsung pakai</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Proyeksi Ketersediaan (24 Jam)</span>
          <p className="text-3xl font-black font-mono text-teal-600 dark:text-teal-400">
            {prediction.projectedAvailable24h} Bed
          </p>
          <p className="text-[11px] text-slate-500">Kapasitas siap untuk IGD & Kamar Operasi</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">Proyeksi Ketersediaan (48 Jam)</span>
          <p className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
            {prediction.projectedAvailable48h} Bed
          </p>
          <p className="text-[11px] text-slate-500">Estimasi berdasarkan Clinical Pathway LOS</p>
        </div>
      </div>

      {/* Discharge Forecast Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Prakiraan Pemulangan Pasien Rawat Inap (AI-Assisted LOS)
          </h3>
          <p className="text-[11px] text-slate-500">
            Kalkulasi otomatis tanggal estimasi pulang berdasarkan Clinical Pathway diagnosis ICD-10, usia pasien, dan milestone pemulihan.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-2.5 px-3">Bed / Bangsal</th>
                <th className="py-2.5 px-3">Pasien</th>
                <th className="py-2.5 px-3">Diagnosis Klinis</th>
                <th className="py-2.5 px-3">Estimasi Pulang</th>
                <th className="py-2.5 px-3">Kesiapan Pulang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {prediction.dischargeForecast.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{item.bedCode}</span>
                    <p className="text-[10px] text-slate-400">{item.wardName}</p>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                    {item.patientName}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {item.diagnosis}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {new Date(item.estimatedDischargeDate).toLocaleDateString('id-ID')}
                    </span>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400">~{item.hoursUntilDischarge} Jam Lagi</p>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.readinessScore >= 80 ? 'bg-emerald-500' : item.readinessScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${item.readinessScore}%` }}
                        ></div>
                      </div>
                      <span className="font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300">
                        {item.readinessScore}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
