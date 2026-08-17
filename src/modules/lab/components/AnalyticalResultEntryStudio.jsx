import React, { useState } from 'react';
import { lisPacsEngineService, PANIC_THRESHOLDS } from '../../../../server/services/lisPacsEngine.service.js';
import { useNotificationStore } from '../../../core/stores/notification.store.js';
import toast from 'react-hot-toast';

export default function AnalyticalResultEntryStudio({ activeSpecimen, onPanicDetected }) {
  const specimen = activeSpecimen || {
    barcode: 'LAB-0817-7193',
    patientName: 'Tn. Hendra (Mr. X)',
    mrn: 'MRX-2026-A1',
    tubeName: 'Tutup Kuning (SST Gel)',
    collectedAt: '10:30 WIB'
  };

  const [parameters, setParameters] = useState([
    {
      code: 'LOINC-2524-7',
      name: 'Laktat Darah Kuantitatif',
      category: 'CLINICAL_CHEMISTRY',
      value: '5.2',
      unit: 'mmol/L',
      refLow: 0.5,
      refHigh: 2.0,
      previousValue: 1.8, // Delta Check Trigger (+188%)
      isPanic: true
    },
    {
      code: 'LOINC-2823-3',
      name: 'Kalium Serum (K+)',
      category: 'ELECTROLYTE',
      value: '6.4',
      unit: 'mmol/L',
      refLow: 3.5,
      refHigh: 5.0,
      previousValue: 4.2,
      isPanic: true
    },
    {
      code: 'LOINC-2951-2',
      name: 'Natrium Serum (Na+)',
      category: 'ELECTROLYTE',
      value: '138',
      unit: 'mmol/L',
      refLow: 135,
      refHigh: 145,
      previousValue: 137,
      isPanic: false
    },
    {
      code: 'LOINC-777-3',
      name: 'Trombosit Darah (Platelet)',
      category: 'HEMATOLOGY',
      value: '85000',
      unit: '/uL',
      refLow: 150000,
      refHigh: 450000,
      previousValue: 110000,
      isPanic: false
    }
  ]);

  const [analystName, setAnalystName] = useState('Analis Budi, S.Tr.Kes');
  const [pathologistName, setPathologistName] = useState('dr. Maya Indriani, Sp.PK');
  const [isValidated, setIsValidated] = useState(false);

  const handleValueChange = (idx, newVal) => {
    const num = parseFloat(newVal) || 0;
    setParameters(prev => prev.map((p, i) => {
      if (i === idx) {
        const pDef = PANIC_THRESHOLDS[p.code];
        const isPanic = pDef && (
          (pDef.panicLow !== undefined && num <= pDef.panicLow) ||
          (pDef.panicHigh !== undefined && num >= pDef.panicHigh)
        );
        return { ...p, value: newVal, isPanic: !!isPanic };
      }
      return p;
    }));
  };

  const handleValidateAndRelease = (e) => {
    e.preventDefault();
    let detectedPanic = null;

    for (const param of parameters) {
      const res = lisPacsEngineService.enterAndValidateResult({
        specimenBarcode: specimen.barcode,
        testCode: param.code,
        testName: param.name,
        category: param.category,
        numericValue: Number(param.value),
        unit: param.unit,
        refLow: param.refLow,
        refHigh: param.refHigh,
        analystName,
        previousNumericValue: param.previousValue
      });

      if (res.isCriticalPanic && !detectedPanic) {
        detectedPanic = res;
      }
    }

    setIsValidated(true);
    toast.success(`Hasil Laboratorium ${specimen.barcode} Berhasil Divalidasi oleh ${pathologistName}!`);

    if (detectedPanic) {
      useNotificationStore.getState().addNotification({
        type: 'CRITICAL_PANIC_VALUE',
        category: 'LABORATORY',
        severity: 'CRITICAL',
        title: `🚨 NILAI KRITIS LAB: ${detectedPanic.testName} (${detectedPanic.numericValue} ${detectedPanic.unit})`,
        message: `Pasien ${specimen.patientName} (${specimen.mrn}) mengalami kondisi kritis: ${detectedPanic.panicThreat}!`,
        patientId: specimen.patientId || null,
        patientName: specimen.patientName,
        mrn: specimen.mrn
      });

      if (onPanicDetected) {
        onPanicDetected({
          specimen,
          panicTestName: detectedPanic.testName,
          panicValue: `${detectedPanic.numericValue} ${detectedPanic.unit}`,
          threat: detectedPanic.panicThreat
        });
      }
    }
  };

  return (
    <div className="p-4 space-y-5">
      <form onSubmit={handleValidateAndRelease} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[24px]">science</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Lembar Kerja Analitikal & Validasi Hasil (LIS Workstation)</h3>
              <p className="text-xs text-slate-400 font-mono">Spesimen: {specimen.barcode} • {specimen.patientName} ({specimen.mrn})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              Tabung: {specimen.tubeName}
            </span>
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="space-y-3">
          {parameters.map((param, idx) => (
            <div
              key={param.code}
              className={`p-3.5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                param.isPanic
                  ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-400 ring-1 ring-rose-400/30'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{param.name}</span>
                  <span className="text-[9px] font-mono text-slate-400">({param.code})</span>
                  {param.isPanic && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] uppercase animate-pulse flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px]">warning</span>
                      NILAI KRITIS (Panic)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Nilai Rujukan: <span className="font-mono font-bold">{param.refLow} - {param.refHigh} {param.unit}</span> • Tes Sebelumnya: <span className="font-mono">{param.previousValue} {param.unit}</span>
                </div>
              </div>

              {/* Value Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                  className={`w-24 p-2 rounded-xl text-center font-mono font-black text-sm border ${
                    param.isPanic
                      ? 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 border-rose-500'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                  }`}
                />
                <span className="text-xs font-mono text-slate-400 w-12">{param.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Validation Signature Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Analis Pelaksana (Teknisi Lab)</label>
            <input
              type="text"
              value={analystName}
              onChange={(e) => setAnalystName(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Dokter Penanggung Jawab Lab (Sp.PK)</label>
            <input
              type="text"
              value={pathologistName}
              onChange={(e) => setPathologistName(e.target.value)}
              className="w-full mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Validasi & Rilis Hasil ke Rekam Medis (EMR)
          </button>
        </div>
      </form>
    </div>
  );
}
