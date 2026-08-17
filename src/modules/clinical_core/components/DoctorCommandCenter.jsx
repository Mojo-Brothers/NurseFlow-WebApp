import React, { useState } from 'react';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import toast from 'react-hot-toast';

export default function DoctorCommandCenter({ onSelectPatientForConsultation }) {
  const { patients } = usePatientStore();
  const { setLiveContext, activePatientId } = useEncounterStore();

  const [activeQueueFilter, setActiveQueueFilter] = useState('ALL'); // 'ALL' | 'WAITING' | 'IN_TREATMENT' | 'CRITICAL'

  // Dynamic Physician Worklist from Active Patients
  const doctorWorklist = (patients || []).map((p, idx) => ({
    id: `WL-${p.id || idx}`,
    patientId: p.id,
    patientName: p.name || p.nama || 'Pasien',
    mrn: p.mrn || p.no_rm || '-',
    age: p.age || 35,
    gender: p.gender || 'L',
    triageLevel: p.triageLevel || 'ESI 3',
    chiefComplaint: p.chief_complaint || p.keluhan_utama || 'Pemeriksaan Klinis',
    waitTime: '0 Menit',
    status: p.status || 'WAITING',
    criticalAlert: p.criticalAlert || null,
    pendingOrders: 0
  }));

  const handleOpenConsultation = (item) => {
    const p = patients.find(pt => pt.id === item.patientId || pt.mrn === item.mrn) || {
      id: item.patientId,
      name: item.patientName,
      mrn: item.mrn,
      gender: item.gender,
      payer: 'BPJS Kesehatan',
      allergies: ['Penicillin']
    };

    setLiveContext(p.id, `ENC-${item.id}`);
    toast.success(`Memuat Workspace Konsultasi Pasien: ${item.patientName}`);
    if (onSelectPatientForConsultation) onSelectPatientForConsultation(p);
  };

  const filteredQueue = doctorWorklist.filter(item => {
    if (activeQueueFilter === 'WAITING') return item.status === 'WAITING';
    if (activeQueueFilter === 'IN_TREATMENT') return item.status === 'IN_TREATMENT';
    if (activeQueueFilter === 'CRITICAL') return item.criticalAlert !== null || item.triageLevel === 'ESI 1';
    return true;
  });

  const waitingCount = doctorWorklist.filter(w => w.status === 'WAITING').length;
  const inTreatmentCount = doctorWorklist.filter(w => w.status === 'IN_TREATMENT').length;
  const criticalCount = doctorWorklist.filter(w => w.criticalAlert !== null || w.triageLevel === 'ESI 1').length;
  const pendingOrdersCount = doctorWorklist.reduce((acc, w) => acc + (w.pendingOrders || 0), 0);
  const totalCount = doctorWorklist.length;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Clinician Duty Card & KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Menunggu Konsultasi</span>
            <h3 className="text-2xl font-black text-blue-700 dark:text-blue-300">{waitingCount} Pasien</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Sedang Diperiksa</span>
            <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{inTreatmentCount} Pasien</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">stethoscope</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">Hasil Kritis (Panic Alert)</span>
            <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300">{criticalCount} Kasus</h3>
          </div>
          <div className={`w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold ${criticalCount > 0 ? 'animate-pulse' : ''}`}>
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">Order Menunggu Hasil</span>
            <h3 className="text-2xl font-black text-purple-700 dark:text-purple-300">{pendingOrdersCount} Order</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[20px]">biotech</span>
          </div>
        </div>
      </div>

      {/* Doctor Worklist Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Daftar Antrean Pasien Dokter (Doctor Clinical Worklist)</h3>
            <p className="text-[11px] text-slate-500">Pilih pasien untuk memulai anamnesis, pemeriksaan fisik, CPPT / SOAP, dan penerbitan order.</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            {[
              { id: 'ALL', label: `Semua (${totalCount})` },
              { id: 'WAITING', label: `Menunggu (${waitingCount})` },
              { id: 'IN_TREATMENT', label: `Aktif (${inTreatmentCount})` },
              { id: 'CRITICAL', label: `🚨 Kritis (${criticalCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveQueueFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeQueueFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">No. RM & Nama Pasien</th>
                <th className="py-2.5 px-3">Triase & Waktu Tunggu</th>
                <th className="py-2.5 px-3">Keluhan Utama / Tanda Kritis</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi DPJP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQueue.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs">{item.patientName}</span>
                      <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400">{item.mrn} • {item.age} Th • {item.gender}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        item.triageLevel === 'ESI 1' ? 'bg-rose-600 text-white animate-pulse' :
                        item.triageLevel === 'ESI 2' ? 'bg-amber-600 text-white' :
                        item.triageLevel === 'ESI 3' ? 'bg-yellow-500 text-black' :
                        'bg-emerald-600 text-white'
                      }`}>
                        {item.triageLevel}
                      </span>
                      <span className="font-mono text-slate-500 font-bold text-[11px]">⏱️ {item.waitTime}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 max-w-md">
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.chiefComplaint}</span>
                      {item.criticalAlert && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black animate-pulse">
                          {item.criticalAlert}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                      item.status === 'IN_TREATMENT'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.status === 'IN_TREATMENT' ? 'SEDANG DIPERIKSA' : 'MENUNGGU DPJP'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleOpenConsultation(item)}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
                    >
                      Buka Konsultasi (SOAP) &rarr;
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
