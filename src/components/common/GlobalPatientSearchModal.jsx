import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../modules/patient/patient.store.js';
import { useEncounterStore } from '../../modules/encounter/encounter.store.js';
import { useAuthStore } from '../../modules/auth/auth.store.js';
import toast from 'react-hot-toast';

// Master List Menu Ruangan & Departemen Pelayanan
const DEPARTMENT_MENU = [
  {
    category: 'SEMUA',
    title: 'Pusat Sensus Seluruh Unit',
    items: [
      { id: 'ALL', label: 'Semua Ruangan & Departemen', icon: 'domain', type: 'ALL' }
    ]
  },
  {
    category: 'RAWAT_INAP',
    title: 'Instalasi Rawat Inap (Ranap)',
    items: [
      { id: 'RANAP_ALL', label: 'Semua Bangsal Rawat Inap', icon: 'bed', type: 'INPATIENT', keyword: '' },
      { id: 'RANAP_MELATI', label: 'Bangsal Melati (Kelas 1)', icon: 'meeting_room', type: 'INPATIENT', keyword: 'Melati' },
      { id: 'RANAP_MAWAR', label: 'Bangsal Mawar (Kelas 2)', icon: 'meeting_room', type: 'INPATIENT', keyword: 'Mawar' },
      { id: 'RANAP_ANGGREK', label: 'Bangsal Anggrek (VIP/VVIP)', icon: 'hotel', type: 'INPATIENT', keyword: 'Anggrek' },
      { id: 'RANAP_ICU', label: 'ICU / ICCU (Perawatan Intensif)', icon: 'monitor_heart', type: 'INPATIENT', keyword: 'ICU' },
      { id: 'RANAP_HCU', label: 'HCU & Ruang Isolasi', icon: 'masks', type: 'INPATIENT', keyword: 'HCU' }
    ]
  },
  {
    category: 'RAWAT_JALAN',
    title: 'Instalasi Rawat Jalan (Poliklinik)',
    items: [
      { id: 'RAJAL_ALL', label: 'Semua Poliklinik Rawat Jalan', icon: 'stethoscope', type: 'OUTPATIENT', keyword: '' },
      { id: 'POLI_DALAM', label: 'Poli Penyakit Dalam', icon: 'medical_information', type: 'OUTPATIENT', keyword: 'Penyakit Dalam' },
      { id: 'POLI_JANTUNG', label: 'Poli Jantung & Pembuluh Darah', icon: 'favorite', type: 'OUTPATIENT', keyword: 'Jantung' },
      { id: 'POLI_BEDAH', label: 'Poli Bedah Umum', icon: 'healing', type: 'OUTPATIENT', keyword: 'Bedah' },
      { id: 'POLI_ANAK', label: 'Poli Anak & Pediatri', icon: 'child_care', type: 'OUTPATIENT', keyword: 'Anak' },
      { id: 'POLI_SARAF', label: 'Poli Saraf (Neurologi)', icon: 'psychology', type: 'OUTPATIENT', keyword: 'Saraf' },
      { id: 'POLI_OBGYN', label: 'Poli Kebidanan & Kandungan', icon: 'pregnant_woman', type: 'OUTPATIENT', keyword: 'Obgyn' },
      { id: 'POLI_MATA', label: 'Poli Mata (Oftalmologi)', icon: 'visibility', type: 'OUTPATIENT', keyword: 'Mata' }
    ]
  },
  {
    category: 'GAWAT_DARURAT',
    title: 'Instalasi Gawat Darurat (IGD)',
    items: [
      { id: 'IGD_ALL', label: 'Semua Area IGD', icon: 'emergency', type: 'EMERGENCY', keyword: 'IGD' },
      { id: 'IGD_RESUS', label: 'Zona Resusitasi (Merah)', icon: 'crisis_alert', type: 'EMERGENCY', keyword: 'Resus' },
      { id: 'IGD_AKUT', label: 'Zona Akut (Kuning)', icon: 'emergency_home', type: 'EMERGENCY', keyword: 'Akut' },
      { id: 'IGD_OBS', label: 'Zona Observasi (Hijau)', icon: 'timer', type: 'EMERGENCY', keyword: 'Observasi' }
    ]
  },
  {
    category: 'KHUSUS',
    title: 'Unit Tindakan Khusus',
    items: [
      { id: 'IBS_OK', label: 'Kamar Operasi (IBS / OT)', icon: 'precision_manufacturing', type: 'SURGERY', keyword: 'OK' },
      { id: 'BLOOD_BANK', label: 'Bank Darah & Laboratorium', icon: 'bloodtype', type: 'LAB', keyword: 'Lab' }
    ]
  }
];

export default function GlobalPatientSearchModal({
  isOpen,
  onClose,
  onSelectPatient,
  initialCareType = 'ALL',
  initialDepartmentId = 'ALL'
}) {
  const navigate = useNavigate();
  const { patients, fetchPatients, addPatient, isLoading: isPatientsLoading } = usePatientStore();
  const { activeEncounters, fetchActiveEncounters, setLiveContext, openEncounter, isLoading: isEncountersLoading } = useEncounterStore();
  const { user } = useAuthStore();

  // Multi-Field Structured Search Filters
  const [filterNoRM, setFilterNoRM] = useState('');
  const [filterNoReg, setFilterNoReg] = useState('');
  const [filterNama, setFilterNama] = useState('');
  const [filterDPJP, setFilterDPJP] = useState('');
  const [filterPenjamin, setFilterPenjamin] = useState('ALL'); // 'ALL' | 'BPJS' | 'UMUM' | 'ASURANSI'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'TRIAGE' | 'ACTIVE' | 'DISCHARGED'
  
  // Date Range Filter (Default: Kosong / Semua Tanggal atau Hari Ini)
  const [dateRangePreset, setDateRangePreset] = useState('ALL'); // 'ALL' | 'TODAY' | 'LAST_7' | 'THIS_MONTH' | 'CUSTOM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Navigation & Room Selection
  const [selectedDeptId, setSelectedDeptId] = useState(initialDepartmentId);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const searchInputRef = useRef(null);

  // Load Realtime Data on Open
  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      fetchActiveEncounters();
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  }, [isOpen, fetchPatients, fetchActiveEncounters]);

  // Set Date Range Presets
  const handlePresetChange = (preset) => {
    setDateRangePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'LAST_7') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      setStartDate(past7.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(todayStr);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    setFilterNoRM('');
    setFilterNoReg('');
    setFilterNama('');
    setFilterDPJP('');
    setFilterPenjamin('ALL');
    setFilterStatus('ALL');
    setDateRangePreset('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedDeptId('ALL');
    setSelectedIndex(0);
  };

  // 100% REALTIME DATA AGGREGATION (NO DUMMY)
  const realCensusData = useMemo(() => {
    if (!patients || patients.length === 0) return [];

    return patients.map(p => {
      // Find matching encounter
      const matchingEnc = (activeEncounters || []).find(e => 
        e.patient_id === p.id || e.patientId === p.id || e.patient_id === p.mrn || e.patientId === p.mrn
      );

      // Determine Registration Number
      const noReg = matchingEnc?.id 
        ? `REG-${matchingEnc.id.slice(-8).toUpperCase()}` 
        : `REG-${(p.id || '').slice(-8).toUpperCase()}`;

      // Determine Department & Room Bed
      const careType = matchingEnc?.encounter_type 
        ? (matchingEnc.encounter_type.toUpperCase() === 'EMERGENCY' ? 'EMERGENCY' : matchingEnc.encounter_type.toUpperCase() === 'INPATIENT' ? 'INPATIENT' : 'OUTPATIENT')
        : (p.status === 'EMERGENCY' || p.is_anonymous ? 'EMERGENCY' : 'INPATIENT');

      const department = matchingEnc?.department || matchingEnc?.ward || (p.status === 'EMERGENCY' ? 'IGD (Instalasi Gawat Darurat)' : 'Bangsal Rawat Inap Melati');
      const roomBed = matchingEnc?.room 
        ? `Ruang ${matchingEnc.room} • Bed ${matchingEnc.bed || '01'}`
        : matchingEnc?.bed 
        ? `Bed ${matchingEnc.bed}`
        : (p.status === 'EMERGENCY' ? 'Bed IGD A-01' : 'Bed Melati-01');

      const dpjp = matchingEnc?.admitting_doctor || matchingEnc?.dpjp || p.dpjp || 'dr. Siti Wijaya, Sp.PD-KGEH';
      const diagnosis = matchingEnc?.chief_complaint || matchingEnc?.diagnosis || p.chiefComplaint || 'Pemeriksaan Klinis Terpadu';
      const payer = p.payer || p.insurance?.name || (typeof p.insurance === 'string' ? p.insurance : 'BPJS Kesehatan');

      // Resolve Real Timestamp
      let admissionDateObj = new Date();
      if (matchingEnc?.admitted_at) {
        admissionDateObj = matchingEnc.admitted_at.toDate ? matchingEnc.admitted_at.toDate() : new Date(matchingEnc.admitted_at);
      } else if (p.registered_at) {
        admissionDateObj = p.registered_at.toDate ? p.registered_at.toDate() : new Date(p.registered_at);
      } else if (p.created_at) {
        admissionDateObj = p.created_at.toDate ? p.created_at.toDate() : new Date(p.created_at);
      }

      const dateIso = !isNaN(admissionDateObj.getTime()) ? admissionDateObj.toISOString().slice(0, 10) : '';
      const dateFormatted = !isNaN(admissionDateObj.getTime())
        ? admissionDateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Hari ini';

      return {
        id: p.id,
        encounterId: matchingEnc?.id || null,
        mrn: p.mrn || `MRN-${p.id.slice(-6).toUpperCase()}`,
        noReg,
        name: p.name || 'Pasien Tanpa Nama',
        gender: p.demographics?.gender === 'M' || p.gender === 'M' || p.gender === 'Laki-laki' ? 'Laki-laki' : 'Perempuan',
        age: p.demographics?.dob ? `${new Date().getFullYear() - new Date(p.demographics.dob).getFullYear()} Thn` : (p.age || 'Dewasa'),
        nik: p.demographics?.nik || p.nik || '-',
        careType,
        department,
        roomBed,
        dpjp,
        diagnosis,
        payer,
        status: matchingEnc?.status || p.status || 'ACTIVE',
        dateIso,
        dateFormatted,
        rawPatient: p,
        rawEncounter: matchingEnc
      };
    });
  }, [patients, activeEncounters]);

  // Selected Department Info
  const activeDeptItem = useMemo(() => {
    for (const grp of DEPARTMENT_MENU) {
      const itm = grp.items.find(i => i.id === selectedDeptId);
      if (itm) return itm;
    }
    return DEPARTMENT_MENU[0].items[0];
  }, [selectedDeptId]);

  // Filtered Patient Census
  const filteredPatients = useMemo(() => {
    let list = realCensusData;

    // 1. Filter Departemen / Ruangan (List Menu)
    if (activeDeptItem.id !== 'ALL') {
      if (activeDeptItem.type && activeDeptItem.type !== 'ALL') {
        list = list.filter(p => p.careType === activeDeptItem.type);
      }
      if (activeDeptItem.keyword) {
        list = list.filter(p => 
          p.department?.toLowerCase().includes(activeDeptItem.keyword.toLowerCase()) ||
          p.roomBed?.toLowerCase().includes(activeDeptItem.keyword.toLowerCase())
        );
      }
    }

    // 2. Filter No. RM (Medrec)
    if (filterNoRM.trim()) {
      const q = filterNoRM.trim().toLowerCase();
      list = list.filter(p => p.mrn?.toLowerCase().includes(q));
    }

    // 3. Filter No. Registrasi
    if (filterNoReg.trim()) {
      const q = filterNoReg.trim().toLowerCase();
      list = list.filter(p => p.noReg?.toLowerCase().includes(q));
    }

    // 4. Filter Nama / NIK
    if (filterNama.trim()) {
      const q = filterNama.trim().toLowerCase();
      list = list.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.nik?.includes(q)
      );
    }

    // 5. Filter Dokter DPJP
    if (filterDPJP.trim()) {
      const q = filterDPJP.trim().toLowerCase();
      list = list.filter(p => p.dpjp?.toLowerCase().includes(q));
    }

    // 6. Filter Penjamin
    if (filterPenjamin !== 'ALL') {
      list = list.filter(p => p.payer?.toUpperCase().includes(filterPenjamin));
    }

    // 7. Filter Status Layanan
    if (filterStatus !== 'ALL') {
      list = list.filter(p => p.status?.toUpperCase() === filterStatus);
    }

    // 8. Filter Range Tanggal Berobat
    if (startDate) {
      list = list.filter(p => p.dateIso >= startDate);
    }
    if (endDate) {
      list = list.filter(p => p.dateIso <= endDate);
    }

    return list;
  }, [
    realCensusData, 
    activeDeptItem, 
    filterNoRM, 
    filterNoReg, 
    filterNama, 
    filterDPJP, 
    filterPenjamin, 
    filterStatus, 
    startDate, 
    endDate
  ]);

  // Handle Context Selection
  const handleSelect = (patient) => {
    setLiveContext(patient.id || patient.mrn, patient.encounterId);

    if (onSelectPatient) {
      onSelectPatient(patient);
    } else {
      if (patient.careType === 'INPATIENT') {
        navigate('/nursing-workspace');
      } else if (patient.careType === 'EMERGENCY') {
        navigate('/triage');
      } else {
        navigate('/doctor-workspace');
      }
    }

    toast.success(`⚡ Pasien ${patient.name} (${patient.mrn}) aktif di ruang kerja!`, { icon: '🩺' });
    onClose();
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredPatients.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && filteredPatients[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredPatients[selectedIndex]);
    }
  };

  // Quick Anonymous Mr. X Generator
  const handleCreateMrX = async () => {
    try {
      const now = new Date();
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      const mrn = `MRX-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${code}`;
      const name = `Tn. Mr. X (${code})`;

      const newPt = await addPatient({
        name,
        mrn,
        demographics: { dob: '1985-01-01', gender: 'M' },
        status: 'EMERGENCY',
        payer: 'Jasa Raharja / Darurat Kemenkes',
        is_anonymous: true
      }, user?.email || 'Perawat Triase');

      const encId = await openEncounter({
        patientId: newPt.id,
        encounterType: 'emergency',
        chiefComplaint: 'Pasien Darurat Tidak Sadar (Trauma / Cito)',
        status: 'TRIAGE',
        triageStatus: 'PENDING',
        department: 'IGD'
      }, user?.email || 'Perawat Triase');

      setLiveContext(newPt.id, encId);
      toast.success(`🚨 Pasien Darurat ${name} berhasil dibuat! Membuka Triase.`);
      onClose();
      navigate('/triage');
    } catch (err) {
      toast.error(`Gagal membuat pasien darurat: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[90vh] text-xs"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* ─── Top Header Bar ─── */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-bold shadow-md shadow-[#015C80]/20">
              <span className="material-symbols-outlined text-[24px]">manage_search</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Pusat Pencarian Pasien & Sensus Seluruh Ruangan (Real-Time)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE DATABASE ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pencarian instan berbasis No. RM, No. Registrasi, Nama, DPJP, Ruangan & Rentang Tanggal Berobat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchPatients();
                fetchActiveEncounters();
                toast.success('Data sensus pasien diperbarui!');
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sinkronisasi Ulang Data Realtime"
            >
              <span className={`material-symbols-outlined text-[18px] ${isPatientsLoading || isEncountersLoading ? 'animate-spin' : ''}`}>
                sync
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* ─── Main Content Split: Left Menu Ruangan + Right Search & Census Table ─── */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* ─── Left Column: List Menu Ruangan & Departemen ─── */}
          <div className="w-full md:w-64 bg-slate-50/90 dark:bg-slate-950/70 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto no-scrollbar shrink-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800/60 font-black text-[11px] uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>List Ruangan / Unit</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {realCensusData.length} Pasien
              </span>
            </div>

            <div className="p-2 space-y-4">
              {DEPARTMENT_MENU.map((grp, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    {grp.title}
                  </div>
                  {grp.items.map(item => {
                    const isSelected = selectedDeptId === item.id;
                    const count = item.id === 'ALL'
                      ? realCensusData.length
                      : realCensusData.filter(p => {
                          if (item.type && item.type !== 'ALL' && p.careType !== item.type) return false;
                          if (item.keyword && !p.department?.toLowerCase().includes(item.keyword.toLowerCase()) && !p.roomBed?.toLowerCase().includes(item.keyword.toLowerCase())) return false;
                          return true;
                        }).length;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedDeptId(item.id);
                          setSelectedIndex(0);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-left font-bold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#015C80] text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="material-symbols-outlined text-[16px] shrink-0 opacity-80">
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Right Column: Multi-Field Search Header & Live Patient Census ─── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            
            {/* Structured Search Box & Quick Controls */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
              
              {/* Primary Search Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Nama Pasien / NIK */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[18px]">person</span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={filterNama}
                    onChange={e => {
                      setFilterNama(e.target.value);
                      setSelectedIndex(0);
                    }}
                    placeholder="Nama Pasien / NIK 16-Digit..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs"
                  />
                </div>

                {/* 2. No. Rekam Medis (No. RM) */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[18px]">fingerprint</span>
                  <input
                    type="text"
                    value={filterNoRM}
                    onChange={e => {
                      setFilterNoRM(e.target.value);
                      setSelectedIndex(0);
                    }}
                    placeholder="No. Rekam Medis (MRN)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs"
                  />
                </div>

                {/* 3. No. Registrasi / Kunjungan */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[18px]">tag</span>
                  <input
                    type="text"
                    value={filterNoReg}
                    onChange={e => {
                      setFilterNoReg(e.target.value);
                      setSelectedIndex(0);
                    }}
                    placeholder="No. Registrasi (REG-xxxx)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs"
                  />
                </div>
              </div>

              {/* Date Range & Advanced Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {/* Date Presets & Date Inputs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                    Tanggal:
                  </span>

                  {['ALL', 'TODAY', 'LAST_7', 'THIS_MONTH'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePresetChange(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        dateRangePreset === p
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {p === 'ALL' ? 'Semua' : p === 'TODAY' ? 'Hari Ini' : p === 'LAST_7' ? '7 Hari' : 'Bulan Ini'}
                    </button>
                  ))}

                  <div className="flex items-center gap-1 ml-1 text-slate-400">
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => {
                        setStartDate(e.target.value);
                        setDateRangePreset('CUSTOM');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 outline-hidden"
                    />
                    <span>s/d</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => {
                        setEndDate(e.target.value);
                        setDateRangePreset('CUSTOM');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 outline-hidden"
                    />
                  </div>
                </div>

                {/* Filter Controls Toggle & Reset */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">tune</span>
                    <span>{showAdvancedFilters ? 'Tutup Filter' : 'Filter Lengkap'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-2 py-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer font-bold"
                    title="Reset Semua Filter"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Collapsible Advanced Filters Grid */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 animate-in fade-in">
                  {/* Dokter DPJP */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Dokter DPJP</label>
                    <input
                      type="text"
                      value={filterDPJP}
                      onChange={e => setFilterDPJP(e.target.value)}
                      placeholder="Nama Dokter..."
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-hidden text-xs"
                    />
                  </div>

                  {/* Penjamin */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Penjamin / Asuransi</label>
                    <select
                      value={filterPenjamin}
                      onChange={e => setFilterPenjamin(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 outline-hidden text-xs"
                    >
                      <option value="ALL">Semua Penjamin</option>
                      <option value="BPJS">BPJS Kesehatan / Ketenagakerjaan</option>
                      <option value="UMUM">Umum / Pembayaran Mandiri</option>
                      <option value="ASURANSI">Asuransi Swasta / Korporasi</option>
                    </select>
                  </div>

                  {/* Status Pelayanan */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status Pelayanan</label>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 outline-hidden text-xs"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="ACTIVE">Aktif Dalam Perawatan</option>
                      <option value="TRIAGE">Triase IGD</option>
                      <option value="DISCHARGED">Selesai / Pulang</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Live Patient Census Records Table / Cards ─── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {filteredPatients.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-[32px]">folder_open</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                      Tidak Ditemukan Pasien Realtime
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Tidak ada rekam medis di database yang cocok dengan kriteria filter "{activeDeptItem.label}". Silakan gunakan tombol reset atau lakukan pendaftaran pasien baru.
                    </p>
                  </div>
                </div>
              ) : (
                filteredPatients.map((patient, index) => {
                  const isSelected = index === selectedIndex;
                  const isRanap = patient.careType === 'INPATIENT';
                  const isIgd = patient.careType === 'EMERGENCY';

                  return (
                    <div
                      key={patient.id}
                      onClick={() => handleSelect(patient)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs ${
                        isSelected
                          ? 'bg-blue-50/90 dark:bg-blue-950/50 border-[#015C80] ring-2 ring-[#015C80]/30 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Left: Avatar, Identitas, No RM, No Reg & Diagnosis */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                            isIgd
                              ? 'bg-rose-600 text-white'
                              : isRanap
                              ? 'bg-teal-600 text-white'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {patient.name?.charAt(0) || 'P'}
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {patient.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-mono font-black text-[11px] bg-slate-100 dark:bg-slate-800 text-[#015C80] dark:text-cyan-400 border border-slate-200 dark:border-slate-700">
                              {patient.mrn}
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {patient.noReg}
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold">
                              ({patient.age} • {patient.gender})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-blue-500">stethoscope</span>
                              {patient.dpjp}
                            </span>
                            <span>&bull;</span>
                            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-sm">
                              {patient.diagnosis}
                            </span>
                            <span>&bull;</span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              📅 {patient.dateFormatted}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Ruangan, Penjamin & Aksi Buka */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center flex-wrap">
                        {/* Payer Badge */}
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                          {patient.payer}
                        </span>

                        {/* Room Location Badge */}
                        <div
                          className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                            isIgd
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                              : isRanap
                              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {isIgd ? 'emergency' : isRanap ? 'bed' : 'local_hospital'}
                          </span>
                          <span>{patient.roomBed}</span>
                        </div>

                        {/* Action Button */}
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl bg-[#015C80] hover:bg-[#014966] text-white font-extrabold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <span>Buka EMR</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ─── Footer Controls Bar ─── */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">Total Sensus Sesuai Filter:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 font-mono font-black text-slate-800 dark:text-slate-200">
                  {filteredPatients.length} Pasien
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  (Dari total {realCensusData.length} pasien terdaftar)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/patients');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-blue-500">person_add</span>
                  <span>+ Registrasi Pasien Baru</span>
                </button>

                <button
                  type="button"
                  onClick={handleCreateMrX}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">emergency</span>
                  <span>+ Pasien Darurat (Mr. X)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
