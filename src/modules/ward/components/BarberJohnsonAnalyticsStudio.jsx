import React, { useState } from 'react';
import { bedManagementFsmEngine } from '../../../../server/services/bedManagementFsmEngine.service.js';

export default function BarberJohnsonAnalyticsStudio() {
  const [totalBeds, setTotalBeds] = useState(120);
  const [periodDays, setPeriodDays] = useState(30);
  const [patientDays, setPatientDays] = useState(2700);
  const [totalDischarges, setTotalDischarges] = useState(450);

  const metrics = bedManagementFsmEngine.calculateBarberJohnsonIndicators({
    totalBeds,
    periodDays,
    patientDays,
    totalDischarges
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Parameter Control */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Parameter Kinerja Pelayanan Rawat Inap
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Total Kapasitas Tempat Tidur (TT):
              </label>
              <input
                type="number"
                value={totalBeds}
                onChange={(e) => setTotalBeds(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Jumlah Hari Periode Evaluasi (Hari):
              </label>
              <input
                type="number"
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Total Hari Perawatan (HP Pasien):
              </label>
              <input
                type="number"
                value={patientDays}
                onChange={(e) => setPatientDays(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Total Pasien Keluar Hidup + Mati:
              </label>
              <input
                type="number"
                value={totalDischarges}
                onChange={(e) => setTotalDischarges(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-xs"
              />
            </div>
          </div>
        </div>

        {/* Barber-Johnson Efficiency Verdict */}
        <div className={`p-4 rounded-2xl border ${metrics.graphPlot.isInEfficiencyPolygon ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200' : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-800 dark:text-amber-200'} space-y-1 text-xs`}>
          <div className="flex items-center gap-2 font-black uppercase text-[11px]">
            <span className="material-symbols-outlined text-base">
              {metrics.graphPlot.isInEfficiencyPolygon ? 'verified' : 'warning'}
            </span>
            {metrics.graphPlot.isInEfficiencyPolygon ? 'DAERAH EFISIENSI TERCAPAI' : 'DILUAR DAERAH EFISIENSI'}
          </div>
          <p className="text-[11px] font-medium leading-relaxed">
            {metrics.graphPlot.isInEfficiencyPolygon
              ? 'Kombinasi BOR (60-85%) dan TOI (1-3 Hari) berada tepat di dalam poligon efisiensi standar Kemenkes RI & WHO.'
              : 'Kinerja rumah sakit memerlukan penyesuaian alur pasien rawat inap untuk mencapai titik temu efisiensi ideal.'}
          </p>
        </div>
      </div>

      {/* 4 Core Barber-Johnson Metrics & Graph Plot */}
      <div className="lg:col-span-8 space-y-4">
        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* BOR */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">BOR (Tingkat Hunian)</span>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{metrics.bor}%</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${metrics.benchmarks.isBorOptimal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'}`}>
              Standar: 60-85%
            </span>
          </div>

          {/* ALOS */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">ALOS (Lama Rawat)</span>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{metrics.alos} Hari</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${metrics.benchmarks.isAlosOptimal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-700'}`}>
              Standar: 3-6 Hari
            </span>
          </div>

          {/* TOI */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">TOI (Tenggang Kosong)</span>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{metrics.toi} Hari</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${metrics.benchmarks.isToiOptimal ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-700'}`}>
              Standar: 1-3 Hari
            </span>
          </div>

          {/* BTO */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">BTO (Perputaran Bed)</span>
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">{metrics.bto} Kali</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
              Optimal / Periode
            </span>
          </div>
        </div>

        {/* Visual Barber-Johnson Diagram Representation */}
        <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Grafik Barber-Johnson Interaktif
              </h4>
              <p className="text-[11px] text-slate-400">Titik Koordinat Kinerja Rumah Sakit (TOI vs BOR)</p>
            </div>
            <div className="font-mono text-xs text-teal-400 font-bold">
              X (TOI): {metrics.graphPlot.x_toi} | Y (BOR): {metrics.graphPlot.y_bor}%
            </div>
          </div>

          {/* Simulated 2D Coordinate Box */}
          <div className="h-64 bg-slate-900/90 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden">
            {/* Efficiency Box Overlay (TOI: 1-3, BOR: 60-85%) */}
            <div className="absolute w-44 h-28 bg-emerald-500/10 border-2 border-dashed border-emerald-400 rounded-lg flex items-center justify-center">
              <span className="text-[10px] font-black uppercase text-emerald-400">Poligon Efisiensi Kemenkes</span>
            </div>

            {/* Current RS Point */}
            <div className="absolute flex flex-col items-center z-10">
              <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-white animate-ping"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white absolute"></div>
              <span className="mt-4 px-2 py-0.5 rounded bg-slate-950/90 text-[10px] font-black text-white border border-slate-700 shadow-md">
                Titik Kinerja RS ({metrics.graphPlot.x_toi}, {metrics.graphPlot.y_bor}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
