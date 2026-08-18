import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/useAuth.js';
import { useEncounterStore } from '../../modules/encounter/encounter.store.js';
import { usePatientStore } from '../../modules/patient/patient.store.js';
import { persistenceAdapter } from '../../core/services/persistenceAdapter.service.js';
import { CARE_STATES, TERMINAL_STATES } from '../../core/services/careStateEngine.service.js';
import { careWorkspaceResolver } from '../../core/services/careWorkspaceResolver.service.js';
import toast from 'react-hot-toast';

export default function GlobalPatientSearchModal({
  isOpen,
  onClose,
  onSelectPatient = null,
  title = null,
  mode = 'GLOBAL' // 'GLOBAL' | 'SWITCHER'
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { setLiveContext } = useEncounterStore();
  const { patients } = usePatientStore();

  // Search State & Filter Controls
  const [activeSearchTab, setActiveSearchTab] = useState('ACTIVE'); // 'ACTIVE' | 'HISTORY'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterCareState, setFilterCareState] = useState('ALL');
  const [filterPenjamin, setFilterPenjamin] = useState('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Live Encounters from Persistence Adapter
  const [allEncounters, setAllEncounters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEncounters();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const loadEncounters = async () => {
    setIsLoading(true);
    try {
      const encounters = await persistenceAdapter.query('encounters');
      setAllEncounters(encounters);
    } catch (e) {
      console.error('[GlobalSearch] Failed to load encounters:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Build unified patient + encounter models
  const unifiedPatientList = useMemo(() => {
    const patientMap = new Map((patients || []).map(p => [p.id, p]));
    const encMapByPatient = new Map();

    // Map latest encounters to patients
    allEncounters.forEach(enc => {
      if (!encMapByPatient.has(enc.patientId) || new Date(enc.created_at) > new Date(encMapByPatient.get(enc.patientId).created_at)) {
        encMapByPatient.set(enc.patientId, enc);
      }
    });

    return (patients || [])
      .filter(p => p.status !== 'MERGED' && !p.mergedIntoId)
      .map(patient => {
        const enc = encMapByPatient.get(patient.id) || null;
        const primaryState = enc?.primaryState || enc?.status || (patient.status === 'EMERGENCY' ? CARE_STATES.IGD_ACTIVE : CARE_STATES.REGISTERED);
        const isTerminal = enc ? enc.isTerminal || TERMINAL_STATES.has(primaryState) : false;

        // Calculate age
        let ageStr = '-';
        if (patient.dob || patient.demographics?.dob) {
          const bDate = new Date(patient.dob || patient.demographics?.dob);
          ageStr = `${Math.abs(new Date(Date.now() - bDate.getTime()).getUTCFullYear() - 1970)} Th`;
        }

        // Location formatting
        const locationObj = enc?.location || {};
        const locationDisplay = locationObj.bedCode
          ? `${locationObj.wardName || 'Bangsal'} • Bed ${locationObj.bedCode}`
          : locationObj.departmentName || enc?.departmentName || (patient.status === 'EMERGENCY' ? 'IGD Zona Resusitasi' : 'Poliklinik');

        return {
          id: patient.id,
          mrn: patient.mrn || 'MRN-000000',
          name: patient.name || 'Pasien',
          gender: patient.gender || patient.demographics?.gender === 'F' ? 'P' : 'L',
          age: ageStr,
          dob: patient.dob || patient.demographics?.dob || '-',
          nik: patient.nik || patient.demographics?.nik || '-',
          payer: patient.payer || enc?.payer || 'Umum / Mandiri',
          encounterId: enc?.id || null,
          noReg: enc?.encounterNumber || `REG-${patient.mrn?.slice(-6) || '000000'}`,
          primaryState,
          secondaryStates: enc?.secondaryStates || [],
          location: locationObj,
          locationDisplay,
          dpjp: enc?.dpjpName || 'dr. DPJP On Duty',
          diagnosis: enc?.chiefComplaint || 'Pemeriksaan Rutin Klinis',
          dateFormatted: new Date(enc?.created_at || patient.created_at || Date.now()).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
          }),
          isTerminal,
          allergies: patient.allergies || []
        };
      });
  }, [patients, allEncounters]);

  // Filter based on active tab, search query, and dropdowns
  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return unifiedPatientList.filter(item => {
      // 1. Tab Separation (Active Patients vs Historical Records)
      if (activeSearchTab === 'ACTIVE' && item.isTerminal) return false;
      if (activeSearchTab === 'HISTORY' && !item.isTerminal) return false;

      // 2. Query Search
      if (q) {
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesMRN = item.mrn.toLowerCase().includes(q);
        const matchesNIK = (item.nik || '').includes(q);
        const matchesReg = (item.noReg || '').toLowerCase().includes(q);
        const matchesDPJP = item.dpjp.toLowerCase().includes(q);
        const matchesLocation = item.locationDisplay.toLowerCase().includes(q);

        if (!matchesName && !matchesMRN && !matchesNIK && !matchesReg && !matchesDPJP && !matchesLocation) {
          return false;
        }
      }

      // 3. Care State Filter
      if (filterCareState !== 'ALL' && item.primaryState !== filterCareState) {
        return false;
      }

      // 4. Penjamin Filter
      if (filterPenjamin !== 'ALL') {
        if (filterPenjamin === 'BPJS' && !item.payer.toUpperCase().includes('BPJS')) return false;
        if (filterPenjamin === 'UMUM' && !item.payer.toUpperCase().includes('UMUM') && !item.payer.toUpperCase().includes('MANDIRI')) return false;
      }

      return true;
    });
  }, [unifiedPatientList, activeSearchTab, searchQuery, filterCareState, filterPenjamin]);

  // Handle Context Selection (Stay on current page, update Live Context)
  const handleSelect = (patient) => {
    setLiveContext(patient.id || patient.mrn, patient.encounterId, patient.primaryState, patient.location);

    if (onSelectPatient) {
      onSelectPatient(patient);
    }

    toast.success(`⚡ Pasien ${patient.name} (${patient.mrn}) aktif di lembar kerja!`, { icon: '🩺' });
    onClose();
  };

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredPatients.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredPatients[selectedIndex]) {
          handleSelect(filteredPatients[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredPatients]);

  // State-Driven Dynamic Workspace Navigation (Gate 0G / Rule 5)
  const handleOpenWorkspace = (e, patient) => {
    e.stopPropagation();
    setLiveContext(patient.id || patient.mrn, patient.encounterId, patient.primaryState, patient.location);

    const resolution = careWorkspaceResolver.resolve({
      careState: patient.primaryState,
      role: role || 'DOCTOR',
      encounterId: patient.encounterId,
      isTerminal: patient.isTerminal
    });

    navigate(resolution.path);
    toast.success(`⚡ Membuka ${resolution.workspaceName} untuk ${patient.name}!`, { icon: '🩺' });
    onClose();
  };

  if (!isOpen) return null;

  const activeCount = unifiedPatientList.filter(p => !p.isTerminal).length;
  const historyCount = unifiedPatientList.filter(p => p.isTerminal).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 md:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[1550px] max-h-[96vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ─── 1. Header with Omnibox Input & 2-Tab Navigation ─── */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-black shadow-md shadow-[#015C80]/30">
                <span className="material-symbols-outlined text-[24px]">manage_search</span>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {title || 'Pencarian Rekam Medis & Sensus Pasien Terpadu'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {mode === 'SWITCHER' ? 'Pilih pasien untuk mengganti konteks lembar kerja aktif' : 'Canonical State-Driven Search • Sensus Rawat Aktif & Histori Rekam Medis'}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* 2-Tab Mode Switcher (Active Patients vs Historical Records) */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => { setActiveSearchTab('ACTIVE'); setSelectedIndex(0); }}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeSearchTab === 'ACTIVE'
                  ? 'bg-[#015C80] text-white shadow-md shadow-[#015C80]/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PASIEN RAWAT AKTIF ({activeCount})</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveSearchTab('HISTORY'); setSelectedIndex(0); }}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeSearchTab === 'HISTORY'
                  ? 'bg-[#015C80] text-white shadow-md shadow-[#015C80]/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>HISTORI & REKAM MEDIS LALU ({historyCount})</span>
            </button>
          </div>

          {/* Search Inputs & Filter Toolbar */}
          <div className="flex flex-col lg:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan Nama Pasien, No. RM, NIK, No. Registrasi, DPJP, atau Unit / Bed..."
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] shadow-xs"
                autoFocus
              />
            </div>

            {/* Filter Primary Care State */}
            <select
              value={filterCareState}
              onChange={(e) => setFilterCareState(e.target.value)}
              className="h-11 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#015C80] shadow-xs cursor-pointer"
            >
              <option value="ALL">Semua State Pelayanan</option>
              <option value={CARE_STATES.IGD_ACTIVE}>IGD (Gawat Darurat)</option>
              <option value={CARE_STATES.INPATIENT_ACTIVE}>Rawat Inap (Bangsal)</option>
              <option value={CARE_STATES.ICU_ACTIVE}>Perawatan Intensif (ICU)</option>
              <option value={CARE_STATES.OR_ACTIVE}>Kamar Bedah (IBS)</option>
              <option value={CARE_STATES.OUTPATIENT_ACTIVE}>Rawat Jalan (Poli)</option>
              <option value={CARE_STATES.ADMISSION_PENDING}>Menunggu Bed Ranap</option>
              <option value={CARE_STATES.DISCHARGED}>Selesai Pulang</option>
            </select>

            {/* Filter Penjamin */}
            <select
              value={filterPenjamin}
              onChange={(e) => setFilterPenjamin(e.target.value)}
              className="h-11 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 outline-hidden focus:border-[#015C80] shadow-xs cursor-pointer"
            >
              <option value="ALL">Semua Penjamin</option>
              <option value="BPJS">BPJS Kesehatan</option>
              <option value="UMUM">Umum / Mandiri</option>
            </select>
          </div>
        </div>

        {/* ─── 2. Patient Search Result Census ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-100/40 dark:bg-slate-950/20">
          {filteredPatients.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-[36px]">person_search</span>
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                Tidak Ada Pasien Sesuai Kriteria
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Periksa kembali kata kunci pencarian atau ganti filter state pelayanan.
              </p>
            </div>
          ) : (
            filteredPatients.map((patient, index) => {
              const isSelected = index === selectedIndex;
              const isEmergency = patient.primaryState === CARE_STATES.IGD_ACTIVE || patient.primaryState === CARE_STATES.TRIAGE_PENDING;
              const isIcu = patient.primaryState === CARE_STATES.ICU_ACTIVE;
              const isOr = patient.primaryState === CARE_STATES.OR_ACTIVE || patient.primaryState === CARE_STATES.PACU_RECOVERY;
              const isRanap = patient.primaryState === CARE_STATES.INPATIENT_ACTIVE;

              return (
                <div
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-[#015C80] ring-2 ring-[#015C80]/30 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#015C80]/60'
                  }`}
                >
                  {/* Left: Avatar, Identitas & Canonical Care State */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-xs shrink-0 ${
                      isEmergency ? 'bg-rose-600' : isIcu ? 'bg-purple-600' : isOr ? 'bg-amber-600' : isRanap ? 'bg-teal-600' : 'bg-[#015C80]'
                    }`}>
                      {patient.name.charAt(0)}
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {patient.name}
                        </span>

                        <span className="px-2 py-0.5 rounded-md font-mono font-black text-xs bg-slate-100 dark:bg-slate-800 text-[#015C80] dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                          {patient.mrn}
                        </span>

                        <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {patient.noReg}
                        </span>

                        <span className="text-[11px] text-slate-400 font-semibold">
                          ({patient.age} • {patient.gender} • NIK: {patient.nik})
                        </span>
                      </div>

                      {/* State Badge & Location */}
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isEmergency ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          isIcu ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                          isOr ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          isRanap ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {patient.primaryState}
                        </span>

                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-blue-500">location_on</span>
                          {patient.locationDisplay}
                        </span>

                        <span>&bull;</span>

                        <span className="text-slate-500 font-medium">
                          DPJP: <strong className="text-slate-700 dark:text-slate-200">{patient.dpjp}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Penjamin & State-Driven Workspace Action Button */}
                  <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300">
                      {patient.payer}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleOpenWorkspace(e, patient)}
                      className="px-4 py-2 rounded-xl bg-[#015C80] hover:bg-[#014966] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-[#015C80]/30 transition-transform active:scale-95 cursor-pointer"
                      title="Buka Ruang Kerja Sesuai Care State & Peran Pengguna"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      <span>Buka Workspace</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
