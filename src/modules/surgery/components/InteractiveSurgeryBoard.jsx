import React, { useState } from 'react';
import { operatingTheatreEngineService, SURGERY_STATUS } from '../services/operatingTheatreEngine.service.js';

export default function InteractiveSurgeryBoard({ onSelectCase, activeCaseId }) {
  const [theatres, setTheatres] = useState(operatingTheatreEngineService.getTheatres());
  const [cases] = useState(operatingTheatreEngineService.getCases());

  const getStatusBadge = (status) => {
    switch (status) {
      case 'IN_USE':
        return <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 text-[11px] animate-pulse">Sedang Operasi</span>;
      case 'CLEANING_STERILIZATION':
        return <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800 text-[11px]">Sterilisasi Ruangan</span>;
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 text-[11px]">Siap Pakai (Ready)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[24px]">surgical</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Interactive Operating Room (IBS) Matrix</h3>
            <p className="text-xs text-slate-400">Monitoring Kamar Bedah Sentral Real-Time & Alur Kasus Operasi</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 font-mono">
          JCI IPSG 4 Standard
        </span>
      </div>

      {/* Grid of 4 Operating Rooms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {theatres.map((room) => {
          const currentCase = cases.find(c => c.theatreId === room.id);
          const isSelected = currentCase && currentCase.id === activeCaseId;

          return (
            <div
              key={room.id}
              onClick={() => currentCase && onSelectCase(currentCase)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-md ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Room Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
                    {room.roomNumber}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{room.roomName}</span>
                </div>
                {getStatusBadge(room.status)}
              </div>

              {/* Case Details if In Use or Scheduled */}
              {currentCase ? (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 dark:text-white text-xs">{currentCase.procedureName}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {currentCase.surgicalUrgency}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    Pasien: <strong className="text-slate-900 dark:text-white">{currentCase.patientName}</strong> ({currentCase.patientMrn})
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>Operator: <strong className="text-slate-700 dark:text-slate-300">{currentCase.primarySurgeonName}</strong></div>
                    <div>Anestesi: <strong className="text-slate-700 dark:text-slate-300">{currentCase.anesthesiologistName}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                  Tidak ada jadwal operasi aktif saat ini.
                </div>
              )}

              {/* Equipment Tags */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
                <span className="font-mono">Peralatan:</span>
                {room.equipment.map((eq, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
