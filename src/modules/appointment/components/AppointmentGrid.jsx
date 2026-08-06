import React from 'react';

// Initial sample appointments matching legacy HIS screenshot
const LEGACY_MOCK_APPOINTMENTS = [
  {
    id: 'mock-1',
    patient_name: 'ACHMAD SAPUTRA',
    medical_record_no: '00487358',
    patient_phone: '089613814964',
    patient_type: 'RETURNING',
    clinic: 'POLI JANTUNG DAN PEMBULUH DARAH',
    doctor: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA',
    schedule: { date: '2026-08-07', start_time: '16:00', estimated_duration: 10 },
    service_type: 'REGULAR',
    channel: 'PRIMAYAAPP',
    notes: 'Pendaftaran melalui PRIMAYAAPP',
    insurance: { use_insurance: true, provider: 'PRIMAYAAPP' }
  },
  {
    id: 'mock-2',
    patient_name: 'GINDO SIMANJUNTAK',
    medical_record_no: '00327636',
    patient_phone: '089637773930',
    patient_type: 'RETURNING',
    clinic: 'POLI JANTUNG DAN PEMBULUH DARAH',
    doctor: 'dr. Kevin Moses Hanky Jr Tandayu, Sp.Jp, FIHA',
    schedule: { date: '2026-08-07', start_time: '16:05', estimated_duration: 10 },
    service_type: 'REGULAR',
    channel: 'rahajeng',
    notes: '-',
    insurance: { use_insurance: false, provider: 'UMUM' }
  }
];

const DEFAULT_TIME_SLOTS = [
  { time: '16:00', type: 'APPT' },
  { time: '16:05', type: 'APPT' },
  { time: '16:10', type: 'W' },
  { time: '16:15', type: 'A' },
  { time: '16:20', type: 'E' },
  { time: '16:25', type: 'W' },
  { time: '16:30', type: 'A' },
  { time: '16:35', type: 'E' },
  { time: '16:40', type: 'W' },
  { time: '16:45', type: 'A' },
  { time: '16:50', type: 'E' }
];

export default function AppointmentGrid({ appointments = [], doctor, date, onSelectSlot, viewMode = 'card' }) {
  const allAppointments = [...LEGACY_MOCK_APPOINTMENTS, ...appointments];

  const gridRows = DEFAULT_TIME_SLOTS.map((slot, idx) => {
    const bookedAppt = allAppointments.find(a => 
      a.schedule?.start_time === slot.time
    );

    return {
      no: idx + 1,
      time: slot.time,
      type: slot.type,
      isBooked: Boolean(bookedAppt),
      data: bookedAppt || null
    };
  });

  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-200">
        {gridRows.map((s) => (
          <div 
            key={s.time}
            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-44 ${
              s.isBooked 
                ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800 shadow-xs' 
                : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            {/* Top header with Numbering (#1, #2...) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold text-[11px] flex items-center justify-center font-mono">
                  #{s.no}
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">{s.time}</span>
              </div>
              
              {s.isBooked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  APPT <span className="material-symbols-outlined text-[10px]">check</span>
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  SLOT KOSONG
                </span>
              )}
            </div>

            {/* Content */}
            {s.isBooked ? (
              <div className="my-2">
                <div className="text-[10px] font-mono font-bold text-slate-400">RM: {s.data.medical_record_no || '00487358'}</div>
                <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{s.data.patient_name}</div>
                <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-0.5">{s.data.channel || 'PRIMAYAAPP'}</div>
              </div>
            ) : (
              <div className="my-2 text-xs text-slate-400 font-medium">
                Siap menerima registrasi pasien.
              </div>
            )}

            {/* Bottom action */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              {s.isBooked ? (
                <button className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer active:scale-95 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">edit</span> Edit Slot
                </button>
              ) : (
                <button 
                  onClick={() => onSelectSlot(s.time)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">add_circle</span> Pilih Slot
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // TABLE VIEW MODE
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden animate-in fade-in duration-200">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
            <th className="p-3 text-center w-12">No</th>
            <th className="p-3 text-center w-20">Jam</th>
            <th className="p-3 text-center w-28">Status</th>
            <th className="p-3">Identitas Pasien</th>
            <th className="p-3">Penjamin / Channel</th>
            <th className="p-3">Dokter / Poli / Kontak</th>
            <th className="p-3 text-center w-28">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
          {gridRows.map((row) => (
            <tr 
              key={row.time}
              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                row.isBooked ? 'bg-teal-50/40 dark:bg-teal-950/20' : ''
              }`}
            >
              <td className="p-3 text-center font-bold text-slate-400">{row.no}</td>
              <td className="p-3 text-center font-extrabold text-slate-900 dark:text-slate-100 text-sm font-mono">{row.time}</td>
              <td className="p-3 text-center">
                {row.isBooked ? (
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
                {row.isBooked ? (
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 font-bold">{row.data.medical_record_no || 'RM-NEW'}</div>
                    <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{row.data.patient_name}</div>
                  </div>
                ) : (
                  <span className="text-slate-400 font-normal">-</span>
                )}
              </td>
              <td className="p-3">
                {row.isBooked ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{row.data.channel || 'PRIMAYAAPP'}</span>
                    <span className="px-1.5 py-0.5 bg-red-700 text-white text-[9px] font-bold rounded">Kirim</span>
                  </div>
                ) : (
                  <span className="text-slate-400 font-normal">-</span>
                )}
              </td>
              <td className="p-3">
                {row.isBooked ? (
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">{row.data.doctor}</div>
                    <div className="text-[10px] font-mono text-slate-400">{row.data.patient_phone}</div>
                  </div>
                ) : (
                  <span className="text-slate-400 font-normal">{doctor}</span>
                )}
              </td>
              <td className="p-3 text-center">
                {row.isBooked ? (
                  <button className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold rounded shadow-xs cursor-pointer active:scale-95">
                    Edit Slot
                  </button>
                ) : (
                  <button 
                    onClick={() => onSelectSlot(row.time)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded shadow-xs cursor-pointer active:scale-95"
                  >
                    Pilih Slot
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
