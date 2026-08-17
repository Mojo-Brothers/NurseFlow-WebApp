import React from 'react';

export default function ClinicalLoadingSpinner() {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-3 p-8">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 animate-spin"></div>
        <span className="material-symbols-outlined absolute text-blue-600 text-[20px] animate-pulse">local_hospital</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-black tracking-wide text-slate-800 dark:text-slate-200">Memuat Modul Klinis...</span>
        <span className="text-[10px] text-slate-400 font-medium">NurseFlow Enterprise HIS 2026</span>
      </div>
    </div>
  );
}
