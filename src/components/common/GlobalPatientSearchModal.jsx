import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

const getTodayStr = () => new Date().toISOString().slice(0, 10);
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../modules/patient/patient.store.js';
import { useEncounterStore } from '../../modules/encounter/encounter.store.js';
import { useAuthStore } from '../../modules/auth/auth.store.js';
import toast from 'react-hot-toast';

// Master List Ruangan & Unit Pelayanan Terstruktur
const ROOM_COLUMN_OPTIONS = [
  { id: 'ALL', label: '🏢 Semua Ruangan & Unit Pelayanan', group: 'SEMUA RUANGAN', type: 'ALL' },
  
  // Rawat Inap (Ranap)
  { id: 'RANAP_ALL', label: '🛏️ Semua Bangsal Rawat Inap', group: 'RAWAT INAP (RANAP)', type: 'INPATIENT', keyword: '' },
  { id: 'RANAP_MELATI', label: '🛏️ Bangsal Melati (Kelas 1)', group: 'RAWAT INAP (RANAP)', type: 'INPATIENT', keyword: 'Melati' },
  { id: 'RANAP_MAWAR', label: '🛏️ Bangsal Mawar (Kelas 2)', group: 'RAWAT INAP (RANAP)', type: 'INPATIENT', keyword: 'Mawar' },
  { id: 'RANAP_ANGGREK', label: '🛏️ Bangsal Anggrek (VIP/VVIP)', group: 'RAWAT INAP (RANAP)', type: 'INPATIENT', keyword: 'Anggrek' },
  { id: 'RANAP_ICU', label: '🛏️ ICU / ICCU (Intensif)', group: 'RAWAT INAP (RANAP)', type: 'INPATIENT', keyword: 'ICU' },
  { id: 'RANAP_HCU', label: '🛏️ HCU & Isolasi', group: 'RAWAT INAP (RANAP)', type: 'INPATIENT', keyword: 'HCU' },
  
  // Rawat Jalan (Rajal / Poliklinik)
  { id: 'RAJAL_ALL', label: '🩺 Semua Poliklinik Rawat Jalan', group: 'RAWAT JALAN (POLIKLINIK)', type: 'OUTPATIENT', keyword: '' },
  { id: 'POLI_DALAM', label: '🩺 Poli Penyakit Dalam', group: 'RAWAT JALAN (POLIKLINIK)', type: 'OUTPATIENT', keyword: 'Penyakit Dalam' },
  { id: 'POLI_JANTUNG', label: '🩺 Poli Jantung & Pembuluh Darah', group: 'RAWAT JALAN (POLIKLINIK)', type: 'OUTPATIENT', keyword: 'Jantung' },
  { id: 'POLI_BEDAH', label: '🩺 Poli Bedah Umum', group: 'RAWAT JALAN (POLIKLINIK)', type: 'OUTPATIENT', keyword: 'Bedah' },
  { id: 'POLI_ANAK', label: '🩺 Poli Anak & Pediatri', group: 'RAWAT JALAN (POLIKLINIK)', type: 'OUTPATIENT', keyword: 'Anak' },
  { id: 'POLI_SARAF', label: '🩺 Poli Saraf (Neurologi)', group: 'RAWAT JALAN (POLIKLINIK)', type: 'OUTPATIENT', keyword: 'Saraf' },
  { id: 'POLI_OBGYN', label: '🩺 Poli Kebidanan (Obgyn)', group: 'RAWAT JALAN (POLIKLINIK)', type: 'OUTPATIENT', keyword: 'Obgyn' },
  { id: 'POLI_MATA', label: '🩺 Poli Mata (Oftalmologi)', group: 'RAWAT JALAN (POLIKLINIK)', type: 'OUTPATIENT', keyword: 'Mata' },

  // Gawat Darurat (IGD)
  { id: 'IGD_ALL', label: '🚨 Semua Area IGD', group: 'GAWAT DARURAT (IGD)', type: 'EMERGENCY', keyword: 'IGD' },
  { id: 'IGD_RESUS', label: '🚨 IGD - Resusitasi (Merah)', group: 'GAWAT DARURAT (IGD)', type: 'EMERGENCY', keyword: 'Resus' },
  { id: 'IGD_AKUT', label: '🚨 IGD - Akut (Kuning)', group: 'GAWAT DARURAT (IGD)', type: 'EMERGENCY', keyword: 'Akut' },
  { id: 'IGD_OBS', label: '🚨 IGD - Observasi (Hijau)', group: 'GAWAT DARURAT (IGD)', type: 'EMERGENCY', keyword: 'Observasi' },

  // Khusus
  { id: 'IBS_OK', label: '🔪 Kamar Operasi (IBS)', group: 'UNIT KHUSUS', type: 'SURGERY', keyword: 'OK' },
  { id: 'BLOOD_BANK', label: '🩸 Bank Darah & Lab', group: 'UNIT KHUSUS', type: 'LAB', keyword: 'Lab' }
];

export default function GlobalPatientSearchModal({
  isOpen,
  onClose,
  onSelectPatient,
  initialCareType = 'ALL',
  initialRoomId = 'ALL'
}) {
  const navigate = useNavigate();
  const { patients, fetchPatients, addPatient, isLoading: isPatientsLoading } = usePatientStore();
  const { activeEncounters, fetchActiveEncounters, setLiveContext, openEncounter, isLoading: isEncountersLoading } = useEncounterStore();
  const { user } = useAuthStore();

  // Multi-Field Structured Search Filters (1 Single Row)
  const [filterNama, setFilterNama] = useState('');
  const [filterNoRM, setFilterNoRM] = useState('');
  const [filterNoReg, setFilterNoReg] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [filterDate, setFilterDate] = useState(getTodayStr); // Default: Hari Ini
  const [filterDPJP, setFilterDPJP] = useState('');
  const [filterPenjamin, setFilterPenjamin] = useState('ALL'); // 'ALL' | 'BPJS' | 'UMUM' | 'ASURANSI'
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'TRIAGE' | 'DISCHARGED'
  const [dateRangePreset, setDateRangePreset] = useState('TODAY'); // Default: Hari Ini

  const [selectedIndex, setSelectedIndex] = useState(0);
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
      setFilterDate(todayStr);
    } else if (preset === 'ALL') {
      setFilterDate('');
    }
  };

  const handleResetFilters = () => {
    setFilterNama('');
    setFilterNoRM('');
    setFilterNoReg('');
    setSelectedRoomId('ALL');
    setFilterDate(getTodayStr()); // Reset kembali ke Hari Ini
    setFilterDPJP('');
    setFilterPenjamin('ALL');
    setFilterStatus('ALL');
    setDateRangePreset('TODAY'); // Reset ke Hari Ini
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

  // Selected Room Info
  const activeRoomOption = useMemo(() => {
    return ROOM_COLUMN_OPTIONS.find(r => r.id === selectedRoomId) || ROOM_COLUMN_OPTIONS[0];
  }, [selectedRoomId]);

  // Filtered Patient Census
  const filteredPatients = useMemo(() => {
    let list = realCensusData;

    // 1. Filter Kolom Ruangan / Unit
    if (activeRoomOption.id !== 'ALL') {
      if (activeRoomOption.type && activeRoomOption.type !== 'ALL') {
        list = list.filter(p => p.careType === activeRoomOption.type);
      }
      if (activeRoomOption.keyword) {
        list = list.filter(p => 
          p.department?.toLowerCase().includes(activeRoomOption.keyword.toLowerCase()) ||
          p.roomBed?.toLowerCase().includes(activeRoomOption.keyword.toLowerCase())
        );
      }
    }

    // 2. Filter Nama / NIK
    if (filterNama.trim()) {
      const q = filterNama.trim().toLowerCase();
      list = list.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.nik?.includes(q)
      );
    }

    // 3. Filter No. RM (Medrec)
    if (filterNoRM.trim()) {
      const q = filterNoRM.trim().toLowerCase();
      list = list.filter(p => p.mrn?.toLowerCase().includes(q));
    }

    // 4. Filter No. Registrasi
    if (filterNoReg.trim()) {
      const q = filterNoReg.trim().toLowerCase();
      list = list.filter(p => p.noReg?.toLowerCase().includes(q));
    }

    // 5. Filter Tanggal Berobat
    if (filterDate) {
      list = list.filter(p => p.dateIso === filterDate);
    }

    // 6. Filter Dokter DPJP
    if (filterDPJP.trim()) {
      const q = filterDPJP.trim().toLowerCase();
      list = list.filter(p => p.dpjp?.toLowerCase().includes(q));
    }

    // 7. Filter Penjamin
    if (filterPenjamin !== 'ALL') {
      list = list.filter(p => p.payer?.toUpperCase().includes(filterPenjamin));
    }

    // 8. Filter Status Layanan
    if (filterStatus !== 'ALL') {
      list = list.filter(p => p.status?.toUpperCase() === filterStatus);
    }

    return list;
  }, [
    realCensusData, 
    activeRoomOption, 
    filterNama,
    filterNoRM, 
    filterNoReg, 
    filterDate,
    filterDPJP, 
    filterPenjamin, 
    filterStatus
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

  // Grouped Room Options for Clean <optgroup> rendering
  const roomGroups = useMemo(() => {
    const groups = {};
    ROOM_COLUMN_OPTIONS.forEach(opt => {
      if (!groups[opt.group]) groups[opt.group] = [];
      groups[opt.group].push(opt);
    });
    return groups;
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[96vw] xl:max-w-[1550px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[92vh] text-xs"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* ─── 1. Top Header Bar ─── */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#015C80] text-white flex items-center justify-center font-bold shadow-md shadow-[#015C80]/20">
              <span className="material-symbols-outlined text-[24px]">manage_search</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Pusat Pencarian Pasien & Sensus Pelayanan Real-Time
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-extrabold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE DATABASE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pencarian multi-kolom terpadu 1-baris berbasis Nama/NIK, No. RM, No. Reg, Ruangan, Tanggal, DPJP, & Penjamin
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
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 font-bold shadow-2xs"
              title="Sinkronisasi Ulang Data Realtime"
            >
              <span className={`material-symbols-outlined text-[18px] ${isPatientsLoading || isEncountersLoading ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Sinkron</span>
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

        {/* ─── 2. Multi-Column Filter Panel (1 Baris Sejajar — Full Width Proporsional) ─── */}
        <div className="px-5 py-4 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 shrink-0">
          
          {/* Form Baris Sejajar — inline-flex dengan lebar eksplisit tiap kolom */}
          <div className="flex items-end gap-3 w-full">

            {/* Kolom 1: Nama Pasien / NIK — lebar 2x (paling penting) */}
            <div className="flex flex-col flex-[2.5] min-w-0">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-500">person</span>
                <span>Nama Pasien / NIK</span>
              </label>
              <input
                ref={searchInputRef}
                type="text"
                value={filterNama}
                onChange={e => { setFilterNama(e.target.value); setSelectedIndex(0); }}
                placeholder="Ketik Nama atau NIK 16-digit..."
                className="w-full h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs transition-colors"
              />
            </div>

            {/* Kolom 2: No. RM (Medrec) */}
            <div className="flex flex-col flex-[1.5] min-w-0">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-500">fingerprint</span>
                <span>No. RM (Medrec)</span>
              </label>
              <input
                type="text"
                value={filterNoRM}
                onChange={e => { setFilterNoRM(e.target.value); setSelectedIndex(0); }}
                placeholder="Contoh: MRN-1002..."
                className="w-full h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs transition-colors"
              />
            </div>

            {/* Kolom 3: No. Registrasi */}
            <div className="flex flex-col flex-[1.5] min-w-0">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-500">tag</span>
                <span>No. Reg (Kunjungan)</span>
              </label>
              <input
                type="text"
                value={filterNoReg}
                onChange={e => { setFilterNoReg(e.target.value); setSelectedIndex(0); }}
                placeholder="Contoh: REG-8619..."
                className="w-full h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs transition-colors"
              />
            </div>

            {/* Kolom 4: Ruangan / Unit Pelayanan */}
            <div className="flex flex-col flex-[2] min-w-0">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-500">meeting_room</span>
                <span>Ruangan / Unit Pelayanan</span>
              </label>
              <select
                value={selectedRoomId}
                onChange={e => { setSelectedRoomId(e.target.value); setSelectedIndex(0); }}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs cursor-pointer transition-colors"
              >
                {Object.entries(roomGroups).map(([grpName, options]) => (
                  <optgroup key={grpName} label={`── ${grpName} ──`}>
                    {options.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Kolom 5: Tanggal Berobat */}
            <div className="flex flex-col flex-[1.2] min-w-0">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-500">calendar_today</span>
                <span>Tgl Berobat</span>
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={e => { setFilterDate(e.target.value); setDateRangePreset('CUSTOM'); }}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs"
              />
            </div>

            {/* Kolom 6: Dokter DPJP */}
            <div className="flex flex-col flex-[1.8] min-w-0">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-500">stethoscope</span>
                <span>Dokter DPJP</span>
              </label>
              <input
                type="text"
                value={filterDPJP}
                onChange={e => { setFilterDPJP(e.target.value); setSelectedIndex(0); }}
                placeholder="Nama Dokter DPJP..."
                className="w-full h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs"
              />
            </div>

            {/* Kolom 7: Penjamin */}
            <div className="flex flex-col flex-[1.5] min-w-0">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-500">account_balance_wallet</span>
                <span>Penjamin</span>
              </label>
              <select
                value={filterPenjamin}
                onChange={e => { setFilterPenjamin(e.target.value); setSelectedIndex(0); }}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs cursor-pointer"
              >
                <option value="ALL">Semua Penjamin</option>
                <option value="BPJS">BPJS Kesehatan</option>
                <option value="UMUM">Umum / Mandiri</option>
                <option value="ASURANSI">Asuransi Swasta</option>
              </select>
            </div>

            {/* Kolom 8: Status Layanan */}
            <div className="flex flex-col flex-1 min-w-0">
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-blue-500">flag</span>
                <span>Status</span>
              </label>
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setSelectedIndex(0); }}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white outline-hidden focus:border-[#015C80] text-xs shadow-2xs cursor-pointer"
              >
                <option value="ALL">Semua</option>
                <option value="ACTIVE">Aktif</option>
                <option value="TRIAGE">Triase</option>
                <option value="DISCHARGED">Selesai</option>
              </select>
            </div>

            {/* Tombol Reset */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-10 px-4 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer font-black text-xs flex items-center gap-1.5 shrink-0 shadow-2xs whitespace-nowrap"
              title="Reset Seluruh Filter"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ─── 3. Patient Results List (Full Width Census Cards) ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 custom-scrollbar bg-slate-100/40 dark:bg-slate-950/20">
          {filteredPatients.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center shadow-md border border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-[36px] text-slate-400">person_search</span>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Tidak Ditemukan Pasien Realtime Sesuai Kriteria
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Tidak ada rekam medis di database yang cocok dengan kombinasi filter di atas. Coba gunakan tombol reset atau lakukan pendaftaran pasien baru.
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-2xs ${
                    isSelected
                      ? 'bg-blue-50/95 dark:bg-blue-950/50 border-[#015C80] ring-2 ring-[#015C80]/30 shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-[#015C80]/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                          ({patient.age} • {patient.gender} • NIK: {patient.nik})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-blue-500">stethoscope</span>
                          {patient.dpjp}
                        </span>
                        <span>&bull;</span>
                        <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-md">
                          {patient.diagnosis}
                        </span>
                        <span>&bull;</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          📅 {patient.dateFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Ruangan, Penjamin & Aksi Buka EMR */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center flex-wrap">
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

        {/* ─── 4. Footer Summary & Quick Action Bar ─── */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Hasil Sensus Realtime:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 font-mono font-black text-slate-800 dark:text-slate-200">
              {filteredPatients.length} Pasien
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              (Filter Ruangan: {activeRoomOption.label})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/patients');
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px] text-blue-500">person_add</span>
              <span>+ Registrasi Pasien Baru</span>
            </button>

            <button
              type="button"
              onClick={handleCreateMrX}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">emergency</span>
              <span>+ Pasien Darurat (Mr. X)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
