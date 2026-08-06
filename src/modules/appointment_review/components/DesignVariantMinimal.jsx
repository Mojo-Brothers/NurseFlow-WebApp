import React, { useState } from 'react';

const TIMELINE_SLOTS = [
  { no: 1, time: '16:00', status: 'BOOKED', patient: 'ACHMAD SAPUTRA', rm: '00487358', service: 'POLI JANTUNG', type: 'BPJS / PRIMAYAAPP', phone: '089613814964', duration: '10 Mnt' },
  { no: 2, time: '16:05', status: 'BOOKED', patient: 'GINDO SIMANJUNTAK', rm: '00327636', service: 'POLI JANTUNG', type: 'UMUM / rahajeng', phone: '089637773930', duration: '10 Mnt' },
  { no: 3, time: '16:10', status: 'FREE', type: 'W', duration: '15 Mnt' },
  { no: 4, time: '16:15', status: 'FREE', type: 'A', duration: '15 Mnt' },
  { no: 5, time: '16:20', status: 'FREE', type: 'E', duration: '20 Mnt' },
  { no: 6, time: '16:25', status: 'FREE', type: 'W', duration: '15 Mnt' },
  { no: 7, time: '16:30', status: 'FREE', type: 'A', duration: '15 Mnt' },
  { no: 8, time: '16:35', status: 'FREE', type: 'E', duration: '20 Mnt' },
  { no: 9, time: '16:40', status: 'FREE', type: 'W', duration: '15 Mnt' },
];

export default function DesignVariantMinimal() {
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'

  return (
    <div className="space-y-4">
      {/* Variant Info Banner with View Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Varian 3: Clinical Minimalist Timeline
            </span>
            <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded-full text-[10px] font-bold border border-teal-300 dark:border-teal-700">
              Terpilih ⭐
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Desain bersih dengan penomoran urut dan fitur beralih tampilan Kartu/Tabel.
          </p>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'card' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">grid_view</span> Tampilan Kartu
          </button>
          
          <button 
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table' 
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-sm">table_rows</span> Tampilan Tabel
          </button>
        </div>
      </div>

      {/* Doctor Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-xl">stethoscope</span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA</h3>
            <p className="text-xs text-slate-500 font-medium">POLI JANTUNG DAN PEMBULUH DARAH • Jumat, 07 Agustus 2026</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Slot: <strong className="text-teal-600">2 / 9 Terisi</strong></span>
        </div>
      </div>

      {/* RENDER MODE: CARD VIEW WITH NUMBERING */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-200">
          {TIMELINE_SLOTS.map((s) => (
            <div 
              key={s.time}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between h-44 relative ${
                s.status === 'BOOKED' 
                  ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800 shadow-xs' 
                  : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {/* Header with Slot Number & Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold text-[11px] flex items-center justify-center font-mono">
                    #{s.no}
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">{s.time}</span>
                </div>

                {s.status === 'BOOKED' ? (
                  <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    APPT <span className="material-symbols-outlined text-[10px]">check</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                    KOSONG ({s.duration})
                  </span>
                )}
              </div>

              {s.status === 'BOOKED' ? (
                <div className="my-1.5">
                  <div className="text-[10px] font-mono font-bold text-slate-400">RM: {s.rm}</div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{s.patient}</div>
                  <div className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">{s.type}</div>
                </div>
              ) : (
                <div className="my-1.5 text-[11px] text-slate-400 font-medium">
                  Tersedia untuk pendaftaran pasien.
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                {s.status === 'BOOKED' ? (
                  <button className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer">
                    Edit Slot <span className="material-symbols-outlined text-xs">edit</span>
                  </button>
                ) : (
                  <button className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer">
                    Pilih Slot <span className="material-symbols-outlined text-xs">add_circle</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RENDER MODE: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden animate-in fade-in duration-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3 text-center w-20">Jam</th>
                <th className="p-3 text-center w-28">Status</th>
                <th className="p-3">Identitas Pasien</th>
                <th className="p-3">Penjamin / Channel</th>
                <th className="p-3">Kontak</th>
                <th className="p-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {TIMELINE_SLOTS.map((s) => (
                <tr 
                  key={s.time}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    s.status === 'BOOKED' ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''
                  }`}
                >
                  <td className="p-3 text-center font-bold text-slate-400">{s.no}</td>
                  <td className="p-3 text-center font-extrabold text-slate-900 dark:text-slate-100 text-sm font-mono">{s.time}</td>
                  <td className="p-3 text-center">
                    {s.status === 'BOOKED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        APPT <span className="material-symbols-outlined text-[10px]">check</span>
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        KOSONG
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {s.status === 'BOOKED' ? (
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 font-bold">{s.rm}</div>
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">{s.patient}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    {s.status === 'BOOKED' ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{s.type}</span>
                    ) : (
                      <span className="text-slate-400 font-normal">-</span>
                    )}
                  </td>
                  <td className="p-3 font-mono">
                    {s.status === 'BOOKED' ? s.phone : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {s.status === 'BOOKED' ? (
                      <button className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold rounded shadow-xs cursor-pointer active:scale-95">
                        Edit Slot
                      </button>
                    ) : (
                      <button className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded shadow-xs cursor-pointer active:scale-95">
                        Pilih Slot
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
