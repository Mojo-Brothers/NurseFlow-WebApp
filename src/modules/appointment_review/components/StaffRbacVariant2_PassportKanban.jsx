import React, { useState } from 'react';

/**
 * StaffRbacVariant2_PassportKanban - Varian 2: Staff Medical Passport Cards & Department Kanban
 * Disesuaikan 100% dengan Warna Tema Proyek NurseFlow HIS (Teal, Emerald, Cyan, Slate & White/Dark)
 */
export default function StaffRbacVariant2_PassportKanban({ onSelectVariant }) {
  const [selectedStaff, setSelectedStaff] = useState(null);

  const staffCards = [
    {
      id: 'USR-001',
      name: 'Apt. Rian Hidayat, S.Farm',
      role: 'PHARMACIST_SUPERVISOR',
      dept: 'Logistik Farmasi',
      nip: '19940822-2026-001',
      strExpiry: '2028-12-31',
      sipExpiry: '2027-06-30',
      badgeGradient: 'from-teal-600 via-teal-500 to-emerald-600',
      status: 'ACTIVE',
      rbacCount: 14,
    },
    {
      id: 'USR-002',
      name: 'Ns. Ratna M., S.Kep',
      role: 'HEAD_NURSE',
      dept: 'Pelayanan Rawat Inap',
      nip: '19910314-2026-002',
      strExpiry: '2027-08-15',
      sipExpiry: '2026-11-20',
      badgeGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      status: 'ACTIVE',
      warning: true,
      rbacCount: 12,
    },
    {
      id: 'USR-003',
      name: 'dr. Hendra Wijaya, Sp.An',
      role: 'DOCTOR_SPECIALIST',
      dept: 'Pelayanan Medis & Anestesi',
      nip: '19851105-2026-003',
      strExpiry: '2028-04-10',
      sipExpiry: '2028-01-15',
      badgeGradient: 'from-cyan-600 via-teal-600 to-emerald-600',
      status: 'ACTIVE',
      rbacCount: 18,
    },
    {
      id: 'USR-004',
      name: 'dr. Budi Santoso, Sp.PD',
      role: 'DOCTOR_SPECIALIST',
      dept: 'Poliklinik Penyakit Dalam',
      nip: '19800712-2026-005',
      strExpiry: '2026-10-01',
      sipExpiry: '2026-09-15',
      badgeGradient: 'from-teal-700 via-emerald-600 to-teal-500',
      status: 'ACTIVE',
      warning: true,
      rbacCount: 16,
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-900 dark:text-slate-100 shadow-xl font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#007399] dark:text-cyan-400 text-3xl">badge</span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Review Varian 2: Staff Medical Passport & Credentials Cards
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[#007399]/15 text-[#007399] dark:text-cyan-300 border border-[#007399]/30">
              NURSEFLOW THEME MATCH
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Visualisasi Staf Medis berbasis Digital Medical Passport dengan skema warna resmi proyek (Oceanic Teal #007399, Ice Cyan & Slate).
          </p>
        </div>

        {onSelectVariant && (
          <button
            onClick={() => onSelectVariant('staff_v2')}
            className="px-4 py-2 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold transition-all shadow-md shadow-[#007399]/25 cursor-pointer"
          >
            Pilihan Utama Varian 2
          </button>
        )}
      </div>

      {/* Grid of Passport Cards in NurseFlow Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {staffCards.map((staf) => (
          <div
            key={staf.id}
            onClick={() => setSelectedStaff(staf)}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#007399] transition-all hover:scale-[1.02] cursor-pointer space-y-4 shadow-md hover:shadow-xl group relative overflow-hidden"
          >
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#007399]"></div>

            {/* Passport Card Header */}
            <div className="flex items-start justify-between mt-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#007399] text-white font-black text-sm flex items-center justify-center shadow-md shadow-[#007399]/25 uppercase">
                  {staf.name.split(' ')[0][0]}{staf.name.split(' ')[1]?.[0] || ''}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#007399] dark:group-hover:text-cyan-400 transition-colors">
                    {staf.name}
                  </h3>
                  <p className="text-[10px] text-[#007399] dark:text-cyan-400 font-mono font-bold">{staf.nip}</p>
                </div>
              </div>
            </div>

            {/* Role & Department */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <div className="text-[11px] font-extrabold text-[#007399] dark:text-cyan-300 font-mono">{staf.role}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{staf.dept}</div>
            </div>

            {/* Credentials Status Badges */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-semibold text-slate-500">STR Expiry:</span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{staf.strExpiry}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] font-semibold text-slate-500">SIP Expiry:</span>
                <span className={`text-[11px] font-mono font-bold ${staf.warning ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                  {staf.sipExpiry}
                </span>
              </div>
            </div>

            {/* Footer info */}
            <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <span className="font-semibold">{staf.rbacCount} Izin Hak Akses</span>
              <span className="text-[#007399] dark:text-cyan-400 font-extrabold flex items-center gap-1">
                Inspector <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Staff Inspector Drawer Preview */}
      {selectedStaff && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-500 space-y-3 animate-in fade-in shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">badge</span>
              Staff Credentials Inspector: {selectedStaff.name}
            </h4>
            <button onClick={() => setSelectedStaff(null)} className="text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-bold">
              Tutup [X]
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-500">Departemen</div>
              <div className="font-bold text-slate-900 dark:text-white">{selectedStaff.dept}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-500">Security PIN</div>
              <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Encrypted 256-Bit Passcode</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-500">Digital Signature BSrE</div>
              <div className="font-mono text-teal-600 dark:text-teal-400 font-bold">Verified Active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
