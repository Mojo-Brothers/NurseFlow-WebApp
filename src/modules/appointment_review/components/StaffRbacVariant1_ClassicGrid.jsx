import React, { useState } from 'react';

/**
 * StaffRbacVariant1_ClassicGrid - Varian 1: Enterprise Clean Medical Grid & Compact KPI Cards
 */
export default function StaffRbacVariant1_ClassicGrid({ onSelectVariant }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  const staffData = [
    {
      id: 'USR-001',
      name: 'Apt. Rian Hidayat, S.Farm',
      nip: 'NIP-19940822-2026-001',
      role: 'PHARMACIST_SUPERVISOR',
      dept: 'Departemen Logistik Farmasi',
      str: 'STR-19940822-2026-001 (Exp: 2028-12-31)',
      sip: 'SIP-440/1289/DISKES (Exp: 2027-06-30)',
      status: 'ACTIVE',
      pinStatus: 'SECURED (256-Bit)',
      warning: false,
    },
    {
      id: 'USR-002',
      name: 'Ns. Ratna M., S.Kep',
      nip: 'NIP-19910314-2026-002',
      role: 'HEAD_NURSE',
      dept: 'Departemen Pelayanan Rawat Inap',
      str: 'STR-19910314-2026-002 (Exp: 2027-08-15)',
      sip: 'SIP-440/2210/DISKES (Exp: 2026-11-20)',
      status: 'ACTIVE',
      pinStatus: 'SECURED (256-Bit)',
      warning: true,
    },
    {
      id: 'USR-003',
      name: 'dr. Hendra Wijaya, Sp.An',
      nip: 'NIP-19851105-2026-003',
      role: 'DOCTOR_SPECIALIST',
      dept: 'Departemen Pelayanan Medis & Anestesi',
      str: 'STR-19851105-2026-003 (Exp: 2028-04-10)',
      sip: 'SIP-440/0912/DISKES (Exp: 2028-01-15)',
      status: 'ACTIVE',
      pinStatus: 'SECURED (256-Bit)',
      warning: false,
    },
    {
      id: 'USR-004',
      name: 'Apt. Maya Indah, S.Farm',
      nip: 'NIP-19960218-2026-004',
      role: 'PHARMACIST_SUPERVISOR',
      dept: 'Departemen Logistik Farmasi',
      str: 'STR-19960218-2026-004 (Exp: 2028-09-30)',
      sip: 'SIP-440/3389/DISKES (Exp: 2027-04-12)',
      status: 'ACTIVE',
      pinStatus: 'SECURED (256-Bit)',
      warning: false,
    },
    {
      id: 'USR-005',
      name: 'dr. Budi Santoso, Sp.PD',
      nip: 'NIP-19800712-2026-005',
      role: 'DOCTOR_SPECIALIST',
      dept: 'Departemen Pelayanan Medis',
      str: 'STR-19800712-2026-005 (Exp: 2026-10-01)',
      sip: 'SIP-440/9181/DISKES (Exp: 2026-09-15)',
      status: 'ACTIVE',
      pinStatus: 'SECURED (256-Bit)',
      warning: true,
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 text-slate-800 dark:text-slate-100 shadow-xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#007399] dark:text-cyan-400 text-3xl">badge</span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Manajemen Data Karyawan & Kontrol Hak Akses (HR & RBAC Matrix)
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[#007399]/15 text-[#007399] dark:text-cyan-300 border border-[#007399]/30">
              JCI SQE COMPLIANT
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Enterprise Human Resources, Credentialing (STR/SIP Tracking), & Centralized Role Permissions Matrix.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSelectVariant && (
            <button
              onClick={() => onSelectVariant('staff_v1')}
              className="px-4 py-2 rounded-full bg-[#007399] hover:bg-[#005e7e] text-white text-xs font-extrabold transition-all shadow-md shadow-[#007399]/25 cursor-pointer"
            >
              Pilih Varian 1 (Classic Grid)
            </button>
          )}
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staf Medis Aktif</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">6 Staf</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Ready & Authorized</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PIN Security Otorisasi</div>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400">100% Secured</div>
            <div className="text-[10px] text-slate-500">256-Bit Encrypted Passcode</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">key</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Credentialing STR & SIP</div>
            <div className="text-2xl font-black text-amber-500">2 Staf Warning</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Monitoring Masa Berlaku</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari NIP, Nama Staf, Role, atau Departemen..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0">
          <span className="material-symbols-outlined text-sm">person_add</span>
          Tambah Staf Medis Baru
        </button>
      </div>

      {/* Main Data Table Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="p-4">Informasi Staf / NIP</th>
                <th className="p-4">Role & Departemen</th>
                <th className="p-4">Legal Credentialing (STR / SIP)</th>
                <th className="p-4">PIN Security</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
              {staffData.map((staf) => (
                <tr key={staf.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs border border-teal-300 dark:border-teal-800">
                        {staf.name.split(' ')[0][0]}{staf.name.split(' ')[1]?.[0] || ''}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{staf.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{staf.nip}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-teal-600 dark:text-teal-400 text-[11px]">{staf.role}</div>
                    <div className="text-[10px] text-slate-500">{staf.dept}</div>
                  </td>

                  <td className="p-4 space-y-0.5">
                    <div className="text-[10px] font-mono text-slate-700 dark:text-slate-300">{staf.str}</div>
                    <div className={`text-[10px] font-mono ${staf.warning ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500'}`}>
                      {staf.sip}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono border border-slate-200 dark:border-slate-700 flex items-center gap-1 w-max">
                      <span className="material-symbols-outlined text-[12px] text-teal-500">lock</span>
                      ••••••
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      {staf.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
