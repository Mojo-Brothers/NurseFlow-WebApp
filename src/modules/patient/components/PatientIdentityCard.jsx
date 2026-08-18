import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import toast from 'react-hot-toast';

export default function PatientIdentityCard({ 
  patient, 
  onOpenNewEncounter, 
  onOpenReconciliation,
  onOpenGlobalSearch 
}) {
  const navigate = useNavigate();
  const { liveContext, clearLiveContext } = useEncounterStore();

  if (!patient) {
    return (
      <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-4 shadow-xs">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-[#015C80] dark:text-cyan-400 flex items-center justify-center shadow-inner">
          <span className="material-symbols-outlined text-[36px]">person_search</span>
        </div>
        <div className="max-w-md">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Belum Ada Pasien Aktif di Lembar Kerja
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan tombol pencarian global untuk memilih pasien yang akan dilayani atau daftarkan pasien baru.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="px-5 py-2.5 rounded-2xl bg-[#015C80] hover:bg-[#014966] text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-[#015C80]/30 transition-transform active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Pilih / Cari Pasien (Ctrl + K)</span>
        </button>
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

  const handleOpenWorkspace = () => {
    if (patient.status === 'EMERGENCY' || isEmergencyAnon) {
      navigate('/triage');
    } else {
      navigate('/doctor-workspace');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5 relative overflow-hidden">
      {/* Top Banner: Avatar, Identity, Badges & Action Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        
        {/* Left: Avatar & Patient Clinical Master Data */}
        <div className="flex items-start sm:items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0 ${
            isEmergencyAnon 
              ? 'bg-rose-600 animate-pulse shadow-rose-600/30' 
              : 'bg-[#015C80] shadow-[#015C80]/30'
          }`}>
            {isEmergencyAnon ? 'ER' : (patient.name?.charAt(0) || 'P')}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {patient.name}
              </h2>
              
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#015C80] dark:text-cyan-400 font-mono font-black text-xs border border-blue-200 dark:border-blue-800">
                {patient.mrn}
              </span>

              {isEmergencyAnon ? (
                <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                  🚨 PASIEN ANONIM DARURAT
                </span>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                  patient.gender === 'F' || patient.demographics?.gender === 'F'
                    ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300' 
                    : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                }`}>
                  {patient.gender === 'F' || patient.demographics?.gender === 'F' ? 'Perempuan' : 'Laki-Laki'}
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                LIVE CONTEXT AKTIF
              </span>
            </div>

            <p className="text-xs text-slate-500 font-bold flex items-center gap-2 flex-wrap">
              <span>Usia: <strong>{calculateAge(patient.dob || patient.demographics?.dob)} Tahun</strong> ({patient.dob || patient.demographics?.dob || 'Tgl Lahir -'})</span>
              <span>&bull;</span>
              <span>NIK: <strong className="font-mono">{patient.nik || patient.demographics?.nik || '-'}</strong></span>
              <span>&bull;</span>
              <span>Telp: <strong>{patient.phone || '-'}</strong></span>
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            type="button"
            onClick={onOpenGlobalSearch}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ganti atau Cari Pasien Lain (Ctrl+K)"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-500">manage_search</span>
            <span>Ganti Pasien</span>
          </button>

          <button
            type="button"
            onClick={handlePrintWristband}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cetak Gelang Pasien Standar JCI IPSG 1"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Cetak Gelang</span>
          </button>

          {isEmergencyAnon && onOpenReconciliation && (
            <button
              type="button"
              onClick={() => onOpenReconciliation(patient)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
              title="Rekonsiliasi Identitas Pasien Anonim ke Master Pasien"
            >
              <span className="material-symbols-outlined text-[16px]">merge_type</span>
              <span>Rekonsiliasi</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenNewEncounter(patient)}
            className="px-4 py-2 rounded-xl bg-[#015C80] hover:bg-[#014966] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#015C80]/30 transition-transform active:scale-95 cursor-pointer"
            title="Daftarkan Episode Rawat / Kunjungan Baru"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Buka Encounter</span>
          </button>
        </div>
      </div>

      {/* 4 Multi-Grid Information Cards (Full-Width Summary Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Status Alergi Obat (JCI Critical Alert) */}
        <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
          patient.allergies?.length > 0
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            patient.allergies?.length > 0 ? 'bg-rose-200 dark:bg-rose-900' : 'bg-emerald-200 dark:bg-emerald-900'
          }`}>
            <span className="material-symbols-outlined text-[22px]">
              {patient.allergies?.length > 0 ? 'warning' : 'check_circle'}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Status Alergi Obat</span>
            <span className="text-xs font-extrabold truncate">
              {patient.allergies?.length > 0 ? patient.allergies.join(', ') : 'Tidak Ada Riwayat Alergi'}
            </span>
          </div>
        </div>

        {/* Card 2: Penjamin & Nomor Polis */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">credit_card</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Penjamin / Asuransi</span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {patient.payer || 'Umum / Mandiri'} {patient.bpjsCardNumber ? `(${patient.bpjsCardNumber})` : ''}
            </span>
          </div>
        </div>

        {/* Card 3: Ruang Pelayanan / Lokasi Aktif */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">meeting_room</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unit / Ruangan</span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {isEmergencyAnon ? 'IGD - Zona Resusitasi' : (patient.room || 'Bangsal Rawat Inap Melati')}
            </span>
          </div>
        </div>

        {/* Card 4: Kontak Darurat */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">contact_phone</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kontak Darurat</span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {patient.emergencyContact ? `${patient.emergencyContact.name} (${patient.emergencyContact.relation || 'Keluarga'})` : (patient.phone || 'Belum Terdata')}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
