import React, { useState } from 'react';
import toast from 'react-hot-toast';

export const BED_STATES = {
  AVAILABLE: { label: 'Tersedia (Ready)', color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  OCCUPIED: { label: 'Terisi Pasien', color: 'bg-blue-600', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300' },
  RESERVED: { label: 'Dipesan (Admisi/IGD)', color: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  CLEANING: { label: 'Pembersihan / Sterilisasi', color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 animate-pulse' },
  MAINTENANCE: { label: 'Perbaikan (Rusak)', color: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' }
};

export default function BedManagementCenterPage() {
  const [selectedWard, setSelectedWard] = useState('ALL'); // 'ALL' | 'MELATI' | 'MAWAR' | 'ICU'
  const [beds, setBeds] = useState([
    {
      id: 'BED-01',
      code: 'MEL-01',
      ward: 'Bangsal Melati (Kelas 1)',
      wardKey: 'MELATI',
      status: 'OCCUPIED',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      admittedAt: '2026-08-16 08:30',
      dpjp: 'dr. Surya Johnson, Sp.PD',
      cleaningProgress: null
    },
    {
      id: 'BED-02',
      code: 'MEL-02',
      ward: 'Bangsal Melati (Kelas 1)',
      wardKey: 'MELATI',
      status: 'OCCUPIED',
      patientName: 'Tn. Bambang Pamungkas',
      mrn: 'MRN-2026-001002',
      admittedAt: '2026-08-16 14:15',
      dpjp: 'dr. Budi Santoso, Sp.B',
      cleaningProgress: null
    },
    {
      id: 'BED-03',
      code: 'MEL-03',
      ward: 'Bangsal Melati (Kelas 1)',
      wardKey: 'MELATI',
      status: 'CLEANING',
      patientName: null,
      mrn: null,
      admittedAt: null,
      dpjp: null,
      cleaningProgress: 'Pembersihan Disinfektan (Sisa 12 Menit)'
    },
    {
      id: 'BED-04',
      code: 'MEL-04',
      ward: 'Bangsal Melati (Kelas 1)',
      wardKey: 'MELATI',
      status: 'AVAILABLE',
      patientName: null,
      mrn: null,
      admittedAt: null,
      dpjp: null,
      cleaningProgress: null
    },
    {
      id: 'BED-05',
      code: 'MAW-01',
      ward: 'Bangsal Mawar (Kelas 2)',
      wardKey: 'MAWAR',
      status: 'RESERVED',
      patientName: 'Tn. Ahmad Fauzi (Admisi IGD)',
      mrn: 'MRN-2026-001005',
      admittedAt: 'Menunggu Transfer',
      dpjp: 'dr. Surya Johnson, Sp.PD',
      cleaningProgress: null
    },
    {
      id: 'BED-06',
      code: 'ICU-01',
      ward: 'ICU Intensif',
      wardKey: 'ICU',
      status: 'AVAILABLE',
      patientName: null,
      mrn: null,
      admittedAt: null,
      dpjp: null,
      cleaningProgress: null
    }
  ]);

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
  const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
  const cleaningBeds = beds.filter(b => b.status === 'CLEANING').length;
  const borRate = Math.round((occupiedBeds / totalBeds) * 100);

  const filteredBeds = selectedWard === 'ALL' ? beds : beds.filter(b => b.wardKey === selectedWard);

  const handleDischargePatient = (bedId) => {
    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'CLEANING',
          patientName: null,
          mrn: null,
          admittedAt: null,
          dpjp: null,
          cleaningProgress: 'Pembersihan Dimulai oleh Petugas Housekeeping'
        };
      }
      return b;
    }));
    toast.success('Pasien Telah Dipulangkan (Discharge). Tempat Tidur Masuk ke Status Sterilisasi & Pembersihan.');
  };

  const handleCompleteCleaning = (bedId) => {
    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: 'AVAILABLE',
          cleaningProgress: null
        };
      }
      return b;
    }));
    toast.success('Tempat Tidur Telah Disterilisasi & Siap Digunakan untuk Pasien Baru (Available)!');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
            <span className="material-symbols-outlined text-[28px]">bed</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Pusat Manajemen Tempat Tidur (Bed Management Center)</h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 font-bold">
                KARS PMKP & JCI
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Alokasi Tempat Tidur Real-Time, Monitoring BOR, Transfer Antar Bangsal & Siklus Sterilisasi Housekeeping
            </p>
          </div>
        </div>

        {/* Ward Filters */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
          {['ALL', 'MELATI', 'MAWAR', 'ICU'].map(w => (
            <button
              key={w}
              onClick={() => setSelectedWard(w)}
              className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                selectedWard === w
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {w === 'ALL' ? 'Semua Bangsal' : `Bangsal ${w}`}
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Tingkat Hunian (BOR)</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{borRate}%</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Target Kemenkes: 60 - 85%</div>
          </div>
          <span className="material-symbols-outlined text-blue-600 text-[32px]">pie_chart</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Tempat Tidur Terisi</div>
            <div className="text-2xl font-black text-blue-600 dark:text-cyan-300 mt-1">{occupiedBeds} <span className="text-xs font-normal text-slate-400">/ {totalBeds} Bed</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">Pasien Rawat Inap Aktif</div>
          </div>
          <span className="material-symbols-outlined text-blue-600 text-[32px]">hotel</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Siap Pakai (Available)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{availableBeds} <span className="text-xs font-normal text-slate-400">Bed</span></div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Siap Menerima Pasien IGD</div>
          </div>
          <span className="material-symbols-outlined text-emerald-600 text-[32px]">check_circle</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">Proses Pembersihan</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{cleaningBeds} <span className="text-xs font-normal text-slate-400">Bed</span></div>
            <div className="text-[10px] text-amber-600 font-bold mt-0.5">Housekeeping Sanitasi</div>
          </div>
          <span className="material-symbols-outlined text-amber-600 text-[32px]">cleaning_services</span>
        </div>
      </div>

      {/* Bed Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeds.map(bed => {
          const stateDef = BED_STATES[bed.status] || BED_STATES.AVAILABLE;
          return (
            <div
              key={bed.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stateDef.color}`} />
                    <span className="font-mono font-black text-base text-slate-900 dark:text-white">{bed.code}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${stateDef.badge}`}>
                    {stateDef.label}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mt-1">{bed.ward}</div>

                {/* Patient Information if Occupied/Reserved */}
                {bed.patientName ? (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="font-black text-slate-900 dark:text-white">{bed.patientName}</div>
                    <div className="text-[10px] font-mono text-slate-500">No. RM: {bed.mrn}</div>
                    <div className="text-[10px] text-blue-600 dark:text-cyan-400 font-bold">DPJP: {bed.dpjp}</div>
                    <div className="text-[9px] text-slate-400">Masuk: {bed.admittedAt}</div>
                  </div>
                ) : bed.cleaningProgress ? (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-1">
                    <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">cleaning_services</span>
                      <span>Siklus Sterilisasi Aktif</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{bed.cleaningProgress}</p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Tempat tidur bersih & siap dialokasikan</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
                {bed.status === 'OCCUPIED' && (
                  <button
                    onClick={() => handleDischargePatient(bed.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-transform active:scale-95 cursor-pointer shadow-sm"
                  >
                    Pulangkan Pasien (Discharge)
                  </button>
                )}

                {bed.status === 'CLEANING' && (
                  <button
                    onClick={() => handleCompleteCleaning(bed.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Selesai Dibersihkan (Ready)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
