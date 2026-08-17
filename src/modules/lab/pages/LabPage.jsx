import React, { useState } from 'react';
import LisCommandCenter from '../components/LisCommandCenter.jsx';
import SpecimenAccessioningStudio from '../components/SpecimenAccessioningStudio.jsx';
import AnalyticalResultEntryStudio from '../components/AnalyticalResultEntryStudio.jsx';
import PanicValueEscalationModal from '../components/PanicValueEscalationModal.jsx';

export default function LabPage() {
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'ACCESSIONING' | 'ANALYTICAL'
  const [selectedSpecimen, setSelectedSpecimen] = useState(null);
  const [panicModalData, setPanicModalData] = useState(null);

  const handleSpecimenSelectedFromAccessioning = (specimen) => {
    setSelectedSpecimen(specimen);
    setActiveTab('ANALYTICAL');
  };

  const handlePanicDetected = (panicInfo) => {
    setPanicModalData(panicInfo);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">biotech</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white">Laboratory Information System (LIS)</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">
                JCI IPSG 2 & ISO 15189
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pelacakan Rantai Penjagaan Spesimen (Chain of Custody), Analitikal Multi-Parameter & Nilai Kritis
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DASHBOARD'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            <span>Dashboard & Metrik</span>
          </button>

          <button
            onClick={() => setActiveTab('ACCESSIONING')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ACCESSIONING'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
            <span>Flebotomi & Accessioning</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICAL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ANALYTICAL'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            <span>Input Analitikal & Validasi</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 max-w-7xl w-full mx-auto">
        {activeTab === 'DASHBOARD' && (
          <LisCommandCenter
            onOpenAccessioning={() => setActiveTab('ACCESSIONING')}
            onOpenEntry={() => setActiveTab('ANALYTICAL')}
          />
        )}

        {activeTab === 'ACCESSIONING' && (
          <SpecimenAccessioningStudio
            onSpecimenSelected={handleSpecimenSelectedFromAccessioning}
          />
        )}

        {activeTab === 'ANALYTICAL' && (
          <AnalyticalResultEntryStudio
            activeSpecimen={selectedSpecimen}
            onPanicDetected={handlePanicDetected}
          />
        )}
      </div>

      {/* Panic Value Read-Back Modal */}
      {panicModalData && (
        <PanicValueEscalationModal
          panicData={panicModalData}
          onClose={() => setPanicModalData(null)}
        />
      )}
    </div>
  );
}
