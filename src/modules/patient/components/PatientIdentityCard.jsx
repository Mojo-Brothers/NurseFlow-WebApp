import React from 'react';
import { usePatientStore } from '../patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import toast from 'react-hot-toast';

export default function PatientIdentityCard({ patient, onOpenNewEncounter, onOpenReconciliation }) {
  const { clearLiveContext } = useEncounterStore();

  if (!patient) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-2.5 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px]">person_off</span>
        </div>
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Tidak Ada Pasien Aktif</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Pilih pasien dari direktori EMPI di sebelah kiri untuk memuat identitas klinis, status penjamin, dan alur pelayanan.
        </p>
      </div>
    );
  }

  const isEmergencyAnon = patient.status === 'EMERGENCY' || patient.name?.startsWith('Mr. X') || patient.name?.startsWith('Mrs. X');

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handlePrintWristband = () => {
    toast.success(`🖨️ Cetak Gelang Identifikasi Pasien: ${patient.name} (${patient.mrn})`, {
      icon: '🖨️',
      duration: 3000
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col gap-4 relative overflow-hidden">
      {/* Top Banner with Patient Name & MRN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md ${
            isEmergencyAnon ? 'bg-rose-600 animate-pulse shadow-rose-600/30' : 'bg-blue-600 shadow-blue-600/30'
          }`}>
            {isEmergencyAnon ? 'ER' : (patient.name?.charAt(0) || 'P')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{patient.name}</h2>
              {isEmergencyAnon && (
                <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                  PASIEN ANONIM DARURAT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              No. Rekam Medis: <span className="font-mono font-black text-blue-600 dark:text-cyan-400">{patient.mrn}</span> • {patient.gender === 'F' ? 'Perempuan' : 'Laki-Laki'} • {calculateAge(patient.dob)} Tahun ({patient.dob})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintWristband}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak Gelang Pasien Standar JCI IPSG 1"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Cetak Gelang</span>
          </button>

          {isEmergencyAnon && onOpenReconciliation && (
            <button
              type="button"
              onClick={() => onOpenReconciliation(patient)}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
              title="Rekonsiliasi Identitas Pasien Anonim ke Master Pasien"
            >
              <span className="material-symbols-outlined text-[16px]">merge_type</span>
              <span>Rekonsiliasi Identitas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenNewEncounter(patient)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Buka Encounter</span>
          </button>
        </div>
      </div>

      {/* Allergies & Safety Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
          patient.allergies?.length > 0
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        }`}>
          <span className="material-symbols-outlined text-[20px]">
            {patient.allergies?.length > 0 ? 'warning' : 'check_circle'}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider">Status Alergi Obat</span>
            <span className="text-xs font-extrabold truncate max-w-[150px]">
              {patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'Tidak Ada Riwayat Alergi'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-blue-500">credit_card</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Penjamin / Asuransi</span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]">
              {patient.payer || 'Umum / Mandiri'} {patient.bpjsCardNumber ? `(${patient.bpjsCardNumber})` : ''}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-purple-500">contact_phone</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kontak Darurat</span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[150px]">
              {patient.emergencyContact ? `${patient.emergencyContact.name} (${patient.emergencyContact.relation || 'Keluarga'})` : 'Belum Terdata'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
