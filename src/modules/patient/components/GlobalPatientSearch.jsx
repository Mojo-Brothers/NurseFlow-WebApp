import React, { useState, useMemo } from 'react';
import { usePatientStore } from '../patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import toast from 'react-hot-toast';

export default function GlobalPatientSearch({ onSelectPatient, onNewEncounter, onOpenRegistration, onOpenEmergency }) {
  const { patients } = usePatientStore();
  const { setLiveContext, activePatientId } = useEncounterStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayer, setFilterPayer] = useState('ALL');

  // Multi-attribute search matching: MRN, NIK, Name, DOB, BPJS, Phone
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return patients.slice(0, 10);

    return patients.filter(p => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchMrn = p.mrn?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q);
      const matchNik = p.nik && String(p.nik).includes(q);
      const matchDob = p.dob && p.dob.includes(q);
      const matchBpjs = p.bpjsCardNumber && String(p.bpjsCardNumber).includes(q);
      const matchPhone = p.phone && p.phone.includes(q);

      const matchesFilter = filterPayer === 'ALL' || p.payer === filterPayer;

      return (matchName || matchMrn || matchNik || matchDob || matchBpjs || matchPhone) && matchesFilter;
    });
  }, [patients, searchQuery, filterPayer]);

  // Mask NIK for PHI Protection (e.g. ************1234)
  const maskNik = (nik) => {
    if (!nik) return 'Tidak terdata';
    const s = String(nik).trim();
    if (s.length < 5) return '************';
    return '*'.repeat(Math.max(0, s.length - 4)) + s.slice(-4);
  };

  const handleSelect = (patient) => {
    setLiveContext(patient.id || patient.mrn, null);
    if (onSelectPatient) onSelectPatient(patient);
    toast.success(`Pasien ${patient.name} (${patient.mrn}) aktif sebagai Live Context!`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
      {/* Search Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Pasien (Nama, No. RM, NIK, Tanggal Lahir YYYY-MM-DD, No. BPJS, Telp)..."
            className="w-full pl-11 pr-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterPayer}
            onChange={(e) => setFilterPayer(e.target.value)}
            className="px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
          >
            <option value="ALL">Semua Penjamin</option>
            <option value="BPJS Kesehatan">BPJS Kesehatan</option>
            <option value="Umum / Mandiri">Umum / Mandiri</option>
            <option value="Asuransi Swasta">Asuransi Swasta</option>
          </select>

          <button
            onClick={onOpenRegistration}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>+ Registrasi Pasien</span>
          </button>

          <button
            onClick={onOpenEmergency}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-transform active:scale-95 cursor-pointer shrink-0"
            title="Daftarkan Pasien Darurat Anonim (Mr./Mrs. X)"
          >
            <span className="material-symbols-outlined text-[16px]">emergency</span>
            <span>+ Pasien Darurat</span>
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
        <span>Menampilkan {searchResults.length} Pasien Terdaftar</span>
        <span className="text-[11px] font-mono">EMPI Index Real-Time</span>
      </div>

      {/* Results List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
        {searchResults.length === 0 ? (
          <div className="col-span-2 py-10 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 text-[48px]">person_search</span>
            <p className="text-xs text-slate-500 font-bold">Tidak ada pasien yang cocok dengan kata kunci "{searchQuery}".</p>
            <button
              onClick={onOpenRegistration}
              className="mt-1 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold text-xs hover:bg-blue-100 cursor-pointer"
            >
              Daftarkan Sebagai Pasien Baru
            </button>
          </div>
        ) : (
          searchResults.map((p) => {
            const isSelected = activePatientId === p.id || activePatientId === p.mrn;
            const isEmergencyAnon = p.status === 'EMERGENCY' || p.name?.startsWith('Mr. X') || p.name?.startsWith('Mrs. X');

            return (
              <div
                key={p.id || p.mrn}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                    : isEmergencyAnon
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${
                      isEmergencyAnon 
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-blue-600 text-white shadow-sm'
                    }`}>
                      {isEmergencyAnon ? 'ER' : (p.name?.charAt(0) || 'P')}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                          {p.name}
                        </span>
                        {isEmergencyAnon && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                            ANON DARURAT
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
                        {p.mrn}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                    p.gender === 'F' 
                      ? 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300' 
                      : p.gender === 'M'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700'
                  }`}>
                    {p.gender === 'F' ? 'Perempuan' : p.gender === 'M' ? 'Laki-Laki' : 'Anonim'}
                  </span>
                </div>

                {/* Identity Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tanggal Lahir:</span>
                    <span className="font-bold">{p.dob || 'Tidak terdata'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">NIK (Masked PHI):</span>
                    <span className="font-mono font-bold">{maskNik(p.nik)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Penjamin:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{p.payer || 'Umum'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kontak:</span>
                    <span className="font-bold">{p.phone || '-'}</span>
                  </div>
                </div>

                {/* Allergies tag */}
                {p.allergies?.length > 0 && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    <span>Alergi: {p.allergies.join(', ')}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    onClick={() => handleSelect(p)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isSelected ? '✓ Live Context Aktif' : 'Pilih Pasien'}
                  </button>

                  <button
                    onClick={() => onNewEncounter(p)}
                    className="py-1.5 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-cyan-400 text-xs font-black transition-colors cursor-pointer"
                    title="Buat Kunjungan / Encounter Baru"
                  >
                    + Encounter
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
