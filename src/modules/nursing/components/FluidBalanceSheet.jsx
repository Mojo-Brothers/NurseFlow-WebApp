import React, { useState } from 'react';
import { nursingCareEngineService } from '../services/nursingCareEngine.service.js';
import toast from 'react-hot-toast';

export default function FluidBalanceSheet({ activePatient }) {
  const patient = activePatient || {
    id: 'P-1001',
    name: 'Ny. Siti Nurhaliza, S.Pd',
    mrn: 'MRN-2026-001001',
    ward: 'Bangsal Melati',
    bed: 'Bed 04',
    bodyWeightKg: 55,
    temperatureCelsius: 37.8
  };

  const [bodyWeightKg, setBodyWeightKg] = useState(patient.bodyWeightKg || 55);
  const [temperatureCelsius, setTemperatureCelsius] = useState(patient.temperatureCelsius || 37.8);

  const [intakeList, setIntakeList] = useState([
    { id: 'IN-1', time: '07:00', category: 'INFUSION', label: 'Infus Ringer Lactate', amountMl: 500 },
    { id: 'IN-2', time: '09:00', category: 'ORAL', label: 'Minum Air Putih', amountMl: 250 },
    { id: 'IN-3', time: '11:00', category: 'INJECTION', label: 'Ceftriaxone 1g dalam 100ml NaCl', amountMl: 100 },
    { id: 'IN-4', time: '13:00', category: 'ORAL', label: 'Kuah Sup & Jus Buah', amountMl: 200 }
  ]);

  const [outputList, setOutputList] = useState([
    { id: 'OUT-1', time: '08:00', category: 'URINE', label: 'Urine Spontan (Urinal)', amountMl: 350 },
    { id: 'OUT-2', time: '12:00', category: 'URINE', label: 'Urine Spontan (Urinal)', amountMl: 400 },
    { id: 'OUT-3', time: '13:30', category: 'STOOL', label: 'Defekasi Lunak', amountMl: 100 }
  ]);

  // Form input for new item
  const [newEntryType, setNewEntryType] = useState('INTAKE'); // 'INTAKE' | 'OUTPUT'
  const [newCategory, setNewCategory] = useState('ORAL');
  const [newLabel, setNewLabel] = useState('');
  const [newAmountMl, setNewAmountMl] = useState('');
  const [newTime, setNewTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

  // Real-time calculation via engine
  const calculation = nursingCareEngineService.calculateFluidBalance({
    bodyWeightKg,
    bodyTemperatureCelsius: temperatureCelsius,
    intakeItems: intakeList,
    outputItems: outputList
  });

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!newLabel || !newAmountMl) {
      toast.error('Lengkapi label dan jumlah cairan (ml)');
      return;
    }

    const newItem = {
      id: `FLUID-${Date.now()}`,
      time: newTime,
      category: newCategory,
      label: newLabel,
      amountMl: Number(newAmountMl)
    };

    if (newEntryType === 'INTAKE') {
      setIntakeList(prev => [...prev, newItem]);
      toast.success(`Intake +${newAmountMl} ml ditambahkan`);
    } else {
      setOutputList(prev => [...prev, newItem]);
      toast.success(`Output -${newAmountMl} ml ditambahkan`);
    }

    setNewLabel('');
    setNewAmountMl('');
  };

  return (
    <div className="p-4 space-y-4">
      {/* KPI Balance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Total Intake (24 Jam)</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">+{calculation.totalIntakeMl} <span className="text-xs font-normal">ml</span></div>
          </div>
          <span className="material-symbols-outlined text-blue-600 text-[28px]">water_drop</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Output Terukur</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">-{calculation.totalRecordedOutputMl} <span className="text-xs font-normal">ml</span></div>
          </div>
          <span className="material-symbols-outlined text-amber-600 text-[28px]">output</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">IWL (Koreksi Suhu)</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">-{calculation.calculatedIwlMl} <span className="text-xs font-normal">ml</span></div>
          </div>
          <span className="material-symbols-outlined text-purple-600 text-[28px]">device_thermostat</span>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          calculation.netBalanceMl >= 0 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100'
        }`}>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider">Balans Cairan Netto</div>
            <div className="text-2xl font-black mt-1">
              {calculation.netBalanceMl > 0 ? `+${calculation.netBalanceMl}` : calculation.netBalanceMl} <span className="text-xs font-normal">ml</span>
            </div>
            <div className="text-[10px] font-bold mt-0.5 opacity-80">
              {calculation.balanceCategory === 'NORMAL_EUVOLEMIC' ? 'Euvolemia Terjaga' : calculation.balanceCategory}
            </div>
          </div>
          <span className="material-symbols-outlined text-[32px]">balance</span>
        </div>
      </div>

      {/* Patient Physical Factor Inputs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Berat Badan (BB):</span>
            <input
              type="number"
              value={bodyWeightKg}
              onChange={(e) => setBodyWeightKg(Number(e.target.value))}
              className="w-20 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-center font-mono"
            />
            <span className="text-slate-400">kg</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Suhu Tubuh:</span>
            <input
              type="number"
              step="0.1"
              value={temperatureCelsius}
              onChange={(e) => setTemperatureCelsius(Number(e.target.value))}
              className="w-20 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-center font-mono"
            />
            <span className="text-slate-400">°C</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Rumus IWL: 15 ml/kgBB/24 jam (+10% per 1°C di atas 37.0°C)
        </div>
      </div>

      {/* 2-Column Ledger: Intake vs Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* INTAKE TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="font-black text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">water_drop</span>
              CATATAN INTAKE CAIRAN (+{calculation.totalIntakeMl} ml)
            </span>
            <span className="text-[10px] font-mono text-slate-400">{intakeList.length} Entri</span>
          </div>
          <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto max-h-[300px]">
            {intakeList.map(it => (
              <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{it.time}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{it.label}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold">{it.category}</span>
                </div>
                <span className="font-mono font-black text-blue-600 dark:text-cyan-400">+{it.amountMl} ml</span>
              </div>
            ))}
          </div>
        </div>

        {/* OUTPUT TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="font-black text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">output</span>
              CATATAN OUTPUT & EKSKRESI (-{calculation.totalRecordedOutputMl} ml)
            </span>
            <span className="text-[10px] font-mono text-slate-400">{outputList.length} Entri</span>
          </div>
          <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1 overflow-y-auto max-h-[300px]">
            {outputList.map(it => (
              <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{it.time}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{it.label}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold">{it.category}</span>
                </div>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">-{it.amountMl} ml</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Fluid Entry Form */}
      <form onSubmit={handleAddEntry} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
        <div className="flex items-center gap-2">
          <select
            value={newEntryType}
            onChange={(e) => {
              setNewEntryType(e.target.value);
              setNewCategory(e.target.value === 'INTAKE' ? 'ORAL' : 'URINE');
            }}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
          >
            <option value="INTAKE">➕ Tambah INTAKE</option>
            <option value="OUTPUT">➖ Tambah OUTPUT</option>
          </select>

          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
          >
            {newEntryType === 'INTAKE' ? (
              <>
                <option value="INFUSION">Infus Kristaloid/Koloid</option>
                <option value="INJECTION">Injeksi Drip / Bolus</option>
                <option value="ORAL">Minum Oral / Air</option>
                <option value="ENTERAL">Nutrisi Enteral (NGT)</option>
                <option value="BLOOD">Transfusi Darah</option>
              </>
            ) : (
              <>
                <option value="URINE">Urine (Spontan/Kateter)</option>
                <option value="DRAIN">Drainase Luka Operasi</option>
                <option value="NGT">Cairan NGT / Gastric</option>
                <option value="STOOL">Feses / Diare</option>
                <option value="VOMIT">Muntah</option>
              </>
            )}
          </select>
        </div>

        <div className="flex-1 min-w-[200px] flex items-center gap-2">
          <input
            type="text"
            placeholder="Label / Sumber Cairan (Contoh: Infus Ringer Lactate 500ml)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          />
          <input
            type="number"
            placeholder="Jumlah (ml)"
            value={newAmountMl}
            onChange={(e) => setNewAmountMl(e.target.value)}
            className="w-28 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-transform active:scale-95 cursor-pointer shadow-sm"
        >
          Catat Entri
        </button>
      </form>
    </div>
  );
}
