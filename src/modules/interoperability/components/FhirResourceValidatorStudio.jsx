import React, { useState } from 'react';
import { satusehatFhirStudioService } from '../../../../server/services/satusehatFhirStudio.service.js';
import toast from 'react-hot-toast';

export default function FhirResourceValidatorStudio() {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(satusehatFhirStudioService.serializePatient(), null, 2)
  );
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const res = satusehatFhirStudioService.validateFhirResource(parsed);
      setValidationResult(res);
      if (res.isValid) {
        toast.success(`Validasi Berhasil! Skor Kesesuaian: ${res.conformanceScore}%`);
      } else {
        toast.error(`Ditemukan ${res.errorCount} error pada payload.`);
      }
    } catch (err) {
      setValidationResult({
        isValid: false,
        conformanceScore: 0,
        errorCount: 1,
        warningCount: 0,
        issues: [{ severity: 'error', field: 'Syntax JSON', message: `Format JSON tidak valid: ${err.message}` }]
      });
      toast.error('Format JSON tidak valid.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Editor Panel */}
      <div className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Editor Payload JSON FHIR R4
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setJsonInput(JSON.stringify(satusehatFhirStudioService.serializePatient(), null, 2))}
              className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Load Contoh Pasien
            </button>
            <button
              onClick={() => setJsonInput(JSON.stringify(satusehatFhirStudioService.serializeEncounter(), null, 2))}
              className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Load Contoh Encounter
            </button>
          </div>
        </div>

        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={22}
            className="w-full bg-transparent font-mono text-xs text-teal-300 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste JSON FHIR Resource di sini..."
          />
        </div>

        <button
          onClick={handleValidate}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <span className="material-symbols-outlined text-base">rule</span>
          Jalankan Validasi Profil SATUSEHAT DTO
        </button>
      </div>

      {/* Validation Score & Issues Output */}
      <div className="lg:col-span-5 space-y-4">
        {/* Score Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Hasil Uji Profil Kemenkes DTO
          </h3>

          {validationResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Conformance Score</p>
                  <p className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {validationResult.conformanceScore}%
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                  validationResult.isValid
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300'
                }`}>
                  {validationResult.isValid ? 'PASSED ✅' : 'FAILED ❌'}
                </span>
              </div>

              {/* Granular Issues List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daftar Temuan ({validationResult.issues.length}):
                </p>
                {validationResult.issues.length === 0 ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Struktur & kodifikasi valid 100% sesuai standar FHIR R4.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {validationResult.issues.map((iss, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          iss.severity === 'error'
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]">
                          <span className="material-symbols-outlined text-xs">
                            {iss.severity === 'error' ? 'error' : 'warning'}
                          </span>
                          {iss.severity} {iss.field && `• ${iss.field}`}
                        </div>
                        <p className="font-medium text-[11px]">{iss.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-2">
              <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700">fact_check</span>
              <p>Klik tombol validasi untuk memeriksa kepatuhan profil SATUSEHAT.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
