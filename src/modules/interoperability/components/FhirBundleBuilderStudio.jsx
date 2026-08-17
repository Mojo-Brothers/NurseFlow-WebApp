import React, { useState } from 'react';
import { satusehatFhirStudioService } from '../../../../server/services/satusehatFhirStudio.service.js';
import toast from 'react-hot-toast';

export default function FhirBundleBuilderStudio() {
  const [includePatient, setIncludePatient] = useState(true);
  const [includeEncounter, setIncludeEncounter] = useState(true);
  const [includeCondition, setIncludeCondition] = useState(true);
  const [includeObservation, setIncludeObservation] = useState(true);
  const [includeMedication, setIncludeMedication] = useState(true);
  const [includeProcedure, setIncludeProcedure] = useState(true);
  const [includeDiagnosticReport, setIncludeDiagnosticReport] = useState(true);
  const [copied, setCopied] = useState(false);

  // Assemble Selected Resources into Bundle
  const assembleBundle = () => {
    const resources = [];
    if (includePatient) resources.push(satusehatFhirStudioService.serializePatient());
    if (includeEncounter) resources.push(satusehatFhirStudioService.serializeEncounter());
    if (includeCondition) resources.push(satusehatFhirStudioService.serializeCondition());
    if (includeObservation) resources.push(satusehatFhirStudioService.serializeObservation());
    if (includeMedication) resources.push(satusehatFhirStudioService.serializeMedicationRequest());
    if (includeProcedure) resources.push(satusehatFhirStudioService.serializeProcedure());
    if (includeDiagnosticReport) resources.push(satusehatFhirStudioService.serializeDiagnosticReport());

    return satusehatFhirStudioService.buildTransactionBundle(resources);
  };

  const currentBundle = assembleBundle();
  const jsonString = JSON.stringify(currentBundle, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success('Bundle Transaksi SATUSEHAT berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Configuration & Selection Panel */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Penyusun Bundle Transaksi
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pilih episode perawatan klinis yang akan digabungkan ke dalam 1 paket Bundle SATUSEHAT.
            </p>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-teal-600">person</span>
                1. Patient Identity (NIK)
              </span>
              <input type="checkbox" checked={includePatient} onChange={(e) => setIncludePatient(e.target.checked)} className="rounded accent-teal-600 w-4 h-4 cursor-pointer" />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-blue-600">meeting_room</span>
                2. Encounter (Kunjungan)
              </span>
              <input type="checkbox" checked={includeEncounter} onChange={(e) => setIncludeEncounter(e.target.checked)} className="rounded accent-teal-600 w-4 h-4 cursor-pointer" />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-rose-600">clinical_notes</span>
                3. Condition (ICD-10)
              </span>
              <input type="checkbox" checked={includeCondition} onChange={(e) => setIncludeCondition(e.target.checked)} className="rounded accent-teal-600 w-4 h-4 cursor-pointer" />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-amber-600">monitoring</span>
                4. Observation (Lab & Vital)
              </span>
              <input type="checkbox" checked={includeObservation} onChange={(e) => setIncludeObservation(e.target.checked)} className="rounded accent-teal-600 w-4 h-4 cursor-pointer" />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-600">prescriptions</span>
                5. MedicationRequest (KFA)
              </span>
              <input type="checkbox" checked={includeMedication} onChange={(e) => setIncludeMedication(e.target.checked)} className="rounded accent-teal-600 w-4 h-4 cursor-pointer" />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-purple-600">medical_services</span>
                6. Procedure (ICD-9-CM)
              </span>
              <input type="checkbox" checked={includeProcedure} onChange={(e) => setIncludeProcedure(e.target.checked)} className="rounded accent-teal-600 w-4 h-4 cursor-pointer" />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-indigo-600">radiology</span>
                7. DiagnosticReport (DICOM)
              </span>
              <input type="checkbox" checked={includeDiagnosticReport} onChange={(e) => setIncludeDiagnosticReport(e.target.checked)} className="rounded accent-teal-600 w-4 h-4 cursor-pointer" />
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 text-xs">
              <p className="font-bold text-teal-800 dark:text-teal-200">Total Entries Terpilih:</p>
              <p className="text-xl font-black font-mono text-teal-600 dark:text-teal-400 mt-0.5">
                {currentBundle.entry.length} Resources
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Bundle JSON Output */}
      <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-emerald-300">Bundle_Transaction.json</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700">
              Type: transaction
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Tersalin' : 'Salin Bundle'}
          </button>
        </div>

        <div className="p-5 overflow-auto flex-1 font-mono text-xs text-emerald-400 bg-slate-950/90 leading-relaxed max-h-[620px]">
          <pre className="font-mono">{jsonString}</pre>
        </div>

        <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Target Transmisi: <strong className="text-slate-300">POST /Bundle (Kemenkes Sandbox / Prod)</strong></span>
          <span className="font-mono text-emerald-400">{(jsonString.length / 1024).toFixed(2)} KB</span>
        </div>
      </div>
    </div>
  );
}
