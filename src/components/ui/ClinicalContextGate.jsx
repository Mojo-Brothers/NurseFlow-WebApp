/**
 * NurseFlow Enterprise HIS 2026 — Clinical Context Gate (Fail-Closed Barrier)
 * Standards: Joint Commission International (JCI IPSG 1) Wrong-Patient Interception,
 * Prevents execution of clinical actions without explicit active patient context.
 */

import React, { useState } from 'react';
import { useClinicalContext } from '../../core/context/ClinicalContextProvider.jsx';
import GlobalPatientSearchModal from '../common/GlobalPatientSearchModal.jsx';

export default function ClinicalContextGate({ children, workspaceName = 'Ruang Kerja Klinis' }) {
  const { hasActiveContext, patient, encounterId } = useClinicalContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  if (hasActiveContext) {
    return <>{children}</>;
  }

  return (
    <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 text-center animate-in fade-in">
      <div className="w-16 h-16 rounded-3xl bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700 flex items-center justify-center text-sky-700 dark:text-sky-300 mb-4 shadow-sm">
        <span className="material-symbols-outlined text-[32px]">person_search</span>
      </div>

      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">
        Konteks Pasien Belum Dipilih
      </h2>
      <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
        Demi keselamatan pasien (Standar JCI IPSG 1), modul <strong>{workspaceName}</strong> memerlukan identifikasi pasien aktif sebelum tindakan atau order dapat diterbitkan.
      </p>

      <button
        type="button"
        onClick={() => setIsSearchOpen(true)}
        className="btn-primary text-xs py-2.5 px-6 flex items-center gap-2 cursor-pointer shadow-md"
      >
        <span className="material-symbols-outlined text-base">search</span>
        <span>Cari & Pilih Pasien Aktif</span>
        <kbd className="px-1.5 py-0.5 bg-black/20 rounded text-[10px] font-mono">Ctrl+P</kbd>
      </button>

      <GlobalPatientSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
