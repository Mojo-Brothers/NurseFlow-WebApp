import React, { useState, useEffect } from 'react';
import { medicationKnowledgeBaseService } from '../../../../server/services/medicationKnowledgeBase.service.js';
import { terminologyService } from '../../../../server/services/terminologyService.service.js';

export default function MedicationKnowledgeBaseStudio() {
  const [medications, setMedications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [filterHighAlert, setFilterHighAlert] = useState('ALL');
  const [selectedMed, setSelectedMed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMedications = async () => {
    setIsLoading(true);
    try {
      const res = await medicationKnowledgeBaseService.getMedications({
        search: searchQuery,
        drugClass: selectedClass === 'ALL' ? '' : selectedClass,
        isHighAlert: filterHighAlert === 'ALL' ? null : filterHighAlert === 'YES'
      });
      setMedications(res.data || []);
      if (!selectedMed && res.data?.length > 0) {
        setSelectedMed(res.data[0]);
      }
    } catch (e) {
      console.error('Failed to load medications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, [searchQuery, selectedClass, filterHighAlert]);

  const selectMedicationDetails = async (med) => {
    const detailed = await medicationKnowledgeBaseService.getMedicationById(med.id);
    setSelectedMed(detailed || med);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/30">
            <span className="material-symbols-outlined text-[26px]">medication</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Medication Knowledge Base & Terminology Studio
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                RXNORM & SNOMED CT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Master Farmakologi Terstruktur, Pemetaan Terminologi Internasional & Matriks DDI JCI
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">
            Total: <span className="text-emerald-600 dark:text-emerald-400 font-black">{medications.length}</span> Obat Terdaftar
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari obat (Nama Generik, Merek, ATC J01..., RxNorm 11124, KFA 930...)..."
            className="w-full pl-11 pr-4 py-2.5 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-inner"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="ALL">Semua Kelas Obat</option>
            <option value="CARBAPENEM">Carbapenem</option>
            <option value="CEPHALOSPORIN_3G">Cephalosporin 3G</option>
            <option value="ANTICOAGULANT">Antikoagulan</option>
            <option value="NSAID">NSAID</option>
            <option value="ANALGESIC_ANTIPYRETIC">Analgesik / Paracetamol</option>
            <option value="GLYCOPEPTIDE">Glycopeptide (Vancomycin)</option>
            <option value="INSULIN">Insulin (High-Alert)</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={filterHighAlert}
            onChange={(e) => setFilterHighAlert(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-bold rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="ALL">Semua Tingkat Kewaspadaan</option>
            <option value="YES">🔴 Hanya High-Alert / LASA</option>
          </select>
        </div>
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Medication Master List */}
        <div className="lg:col-span-5 flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
          {medications.map((m) => (
            <div
              key={m.id}
              onClick={() => selectMedicationDetails(m)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedMed?.id === m.id
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    {m.genericName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">{m.brandName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {m.isHighAlert && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-black animate-pulse">
                      HIGH ALERT
                    </span>
                  )}
                  {m.isLasa && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                      LASA
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-slate-400 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  ATC: {m.atcCode}
                </span>
                {m.rxnormCode && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                    RxNorm: {m.rxnormCode}
                  </span>
                )}
                {m.kfaCode && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                    KFA: {m.kfaCode}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Medication Deep-Dive & Knowledge Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {selectedMed ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedMed.genericName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                      {selectedMed.dosageForm} • {selectedMed.strengthAmount}{selectedMed.strengthUnit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Nama Komersial: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedMed.brandName}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Status Formularium</span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold inline-block mt-0.5 ${
                    selectedMed.formularyTier === 'RESTRICTED_ANTIBIOTIC'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {selectedMed.formularyTier || 'FORMULARIUM RS'}
                  </span>
                </div>
              </div>

              {/* Safety Badges & Thresholds */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Kategori Hamil</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    Kategori {selectedMed.pregnancyCategory || 'B'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Threshold eGFR</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedMed.renalAdjustmentThresholdEgfr ? `< ${selectedMed.renalAdjustmentThresholdEgfr} ml/min` : 'Normal'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Max Dosis Anak</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedMed.pediatricMaxMgPerKg ? `${selectedMed.pediatricMaxMgPerKg} mg/kg` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Relasi DDI Aktif</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {selectedMed.interactions?.length || 0} Aturan DDI
                  </span>
                </div>
              </div>

              {/* Terminology Code Bridge */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Pemetaan Multi-Terminologi Internasional & SATUSEHAT
                </h4>
                <div className="flex flex-col gap-2">
                  {selectedMed.terminologies?.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-black text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50">
                        {t.terminologySystem}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{t.terminologyCode}</span>
                      <span className="text-slate-500 font-medium truncate max-w-xs">{t.terminologyDisplay}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              Pilih obat di sebelah kiri untuk melihat rincian farmakologi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
