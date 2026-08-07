import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, RotateCcw, Fingerprint, CalendarDays, Activity, Building2, User, ChevronRight, Hash, ShieldCheck, Stethoscope } from 'lucide-react';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { format } from 'date-fns';

export default function PatientSearchModal({ isOpen, onClose, onSelect, initialCareType = 'ALL' }) {
  const { patients, fetchPatients } = usePatientStore();
  const { activeEncounters, fetchActiveEncounters, isLoading } = useEncounterStore();

  const [filters, setFilters] = useState({
    noReg: '',
    noRM: '',
    nama: '',
    departemen: '',
    penjamin: '',
    tanggal: '',
    careType: initialCareType
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (isOpen) {
      setFilters(prev => ({ ...prev, careType: initialCareType }));
    }
  }, [isOpen, initialCareType]);

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      fetchActiveEncounters();
    }
  }, [isOpen, fetchPatients, fetchActiveEncounters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      noReg: '',
      noRM: '',
      nama: '',
      departemen: '',
      penjamin: '',
      tanggal: '',
      careType: 'ALL'
    });
  };

  const handleSearch = () => {
    fetchPatients();
    fetchActiveEncounters();
  };

  const mergedData = useMemo(() => {
    // 1. Encounters Mapped
    const encMapped = activeEncounters.map(enc => {
      const p = patients.find(pat => pat.id === enc.patient_id || pat.id === enc.patientId) || {};
      return {
        encounterId: enc.id,
        patientId: enc.patient_id || enc.patientId || p.id,
        noReg: enc.id?.slice(-8).toUpperCase() || 'REG-PENDING',
        noRM: p.mrn || '-',
        nama: p.name || enc.patient_name || 'UNKNOWN',
        kelamin: p.demographics?.gender === 'M' ? 'Laki-laki' : p.demographics?.gender === 'F' ? 'Perempuan' : '-',
        tglLahir: p.demographics?.dob || '-',
        umur: p.demographics?.dob ? calculateAge(p.demographics.dob) : '-',
        departemen: enc.department || enc.ward || '-',
        dokter: enc.admitting_doctor || '-',
        penjamin: enc.insurance_provider || enc.guarantor || (p.insurance?.type || 'Umum').toUpperCase(),
        tanggalMasuk: enc.admitted_at?.toDate ? format(enc.admitted_at.toDate(), 'yyyy-MM-dd') : '',
        rawDate: enc.admitted_at?.toDate ? enc.admitted_at.toDate().getTime() : (enc.created_at?.toDate ? enc.created_at.toDate().getTime() : 0),
        encounterType: enc.encounter_type || 'OPD',
        status: p.status || 'ACTIVE',
        patientObj: p
      };
    }).filter(item => item.status !== 'MERGED');

    // 2. Master Patients Without Active Encounters
    const mappedPatientIds = new Set(encMapped.map(item => item.patientId));
    const registeredPatientsOnly = patients
      .filter(p => !mappedPatientIds.has(p.id) && p.status !== 'MERGED')
      .map(p => ({
        encounterId: null,
        patientId: p.id,
        noReg: 'DRAFT',
        noRM: p.mrn || 'PENDING',
        nama: p.name || 'TANPA NAMA',
        kelamin: p.demographics?.gender === 'M' ? 'Laki-laki' : p.demographics?.gender === 'F' ? 'Perempuan' : '-',
        tglLahir: p.demographics?.dob || '-',
        umur: p.demographics?.dob ? calculateAge(p.demographics.dob) : '-',
        departemen: 'Master Data / Registrasi',
        dokter: p.primary_physician?.name || 'DPJP Utama',
        penjamin: (p.insurance?.type || 'UMUM').toUpperCase(),
        tanggalMasuk: p.registered_at ? (typeof p.registered_at.toDate === 'function' ? format(p.registered_at.toDate(), 'yyyy-MM-dd') : String(p.registered_at).substring(0, 10)) : '-',
        rawDate: 0,
        encounterType: 'MASTER',
        status: p.status || 'ACTIVE',
        patientObj: p
      }));

    return [...encMapped, ...registeredPatientsOnly];
  }, [activeEncounters, patients]);

  const filteredData = useMemo(() => {
    const filtered = mergedData.filter(item => {
      if (filters.noReg && !item.noReg.includes(filters.noReg.toUpperCase())) return false;
      if (filters.noRM && !item.noRM.includes(filters.noRM)) return false;
      if (filters.nama && !item.nama.toLowerCase().includes(filters.nama.toLowerCase())) return false;
      if (filters.departemen && filters.departemen !== '' && !item.departemen.includes(filters.departemen)) return false;
      if (filters.penjamin && filters.penjamin !== '' && item.penjamin !== filters.penjamin) return false;
      if (filters.tanggal && item.tanggalMasuk !== filters.tanggal) return false;
      if (filters.careType !== 'ALL' && item.encounterType !== filters.careType) return false;
      return true;
    });
    
    // Default Sort: Newest to Oldest (Descending)
    return filtered.sort((a, b) => b.rawDate - a.rawDate);
  }, [mergedData, filters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  if (!isOpen) return null;

   return (
    <div className="fixed inset-0 z-[1000] flex animate-in fade-in duration-300">
      {/* Super Modern Backdrop - Lighter and respecting persistent sidebar */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-all cursor-zoom-out" 
        onClick={onClose}
      />
      
      {/* Content Area Centered Container (Respects Persistent Sidebar) */}
      <div className="flex-1 flex items-center justify-center p-4 md:pl-72 md:pr-8 py-6 relative z-10 pointer-events-none">
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-[1350px] h-[92vh] flex flex-col shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 pointer-events-auto">
        
        {/* Modal Header */}
        <div className="relative flex justify-between items-center px-8 py-3 border-b border-[var(--outline-variant)] bg-gradient-to-r from-[var(--surface-container)] to-[var(--surface-container-low)]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--outline-variant)] to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-30"></div>
          
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--on-surface)] to-[var(--on-surface-variant)] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/30 ring-1 ring-[var(--outline-variant)]">
              <Search size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="block drop-shadow-sm text-[var(--on-surface)]">Cari Pasien Aktif</span>
              <span className="block text-[10px] font-bold text-[var(--primary)] tracking-widest uppercase mt-0.5 opacity-80">Command Center Outpatient</span>
            </div>
          </h2>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-container-high)] border border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-[var(--error)] hover:text-white hover:border-[var(--error)] hover:shadow-lg hover:shadow-[var(--error)]/30 hover:rotate-90 transition-all duration-300"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body - Filters */}
        <div className="px-8 py-2.5 bg-[var(--surface-container-low)] border-b border-[var(--outline-variant)] relative flex flex-col gap-2">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.01)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none"></div>
          
          {/* Filter Grid - Unified Single Row for Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-2.5 relative z-10">
          
          <div className="relative z-10 group">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-1 ml-1 group-focus-within:text-[var(--primary)] transition-colors">
              <Hash size={10} /> No.Reg
            </label>
            <input name="noReg" value={filters.noReg} onChange={handleFilterChange} type="text" placeholder="No Registrasi" className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-xl px-3 py-2 text-[11px] font-bold text-[var(--on-surface)] focus:bg-[var(--surface-container)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-fixed)] outline-none transition-all placeholder:text-[var(--on-surface-variant)] opacity-90 focus:opacity-100" />
          </div>
          
          <div className="relative z-10 group">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-1 ml-1 group-focus-within:text-[var(--primary)] transition-colors">
              <Fingerprint size={10} /> No.RM
            </label>
            <input name="noRM" value={filters.noRM} onChange={handleFilterChange} type="text" placeholder="No RM" className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-xl px-3 py-2 text-[11px] font-bold text-[var(--on-surface)] focus:bg-[var(--surface-container)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-fixed)] outline-none transition-all placeholder:text-[var(--on-surface-variant)] opacity-90 focus:opacity-100" />
          </div>
          
          <div className="lg:col-span-2 relative z-10 group">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-1 ml-1 group-focus-within:text-[var(--primary)] transition-colors">
              <User size={10} /> Nama Pasien
            </label>
            <input name="nama" value={filters.nama} onChange={handleFilterChange} type="text" placeholder="Cari nama pasien..." className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-xl px-3 py-2 text-[11px] font-bold text-[var(--on-surface)] focus:bg-[var(--surface-container)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-fixed)] outline-none transition-all placeholder:text-[var(--on-surface-variant)] opacity-90 focus:opacity-100" />
          </div>
          <div className="relative z-10 group">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-1 ml-1 group-focus-within:text-[var(--primary)] transition-colors">
              <Building2 size={10} /> Departemen
            </label>
            <div className="relative">
              <select name="departemen" value={filters.departemen} onChange={handleFilterChange} className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--on-surface)] focus:bg-[var(--surface-container)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-fixed)] outline-none transition-all appearance-none bg-none cursor-pointer">
                <option value="" className="bg-[var(--surface-container)]">Pilih Dept</option>
              <optgroup label="Emergency & Critical Care" className="bg-[var(--surface-container)]">
                <option value="IGD">Instalasi Gawat Darurat (IGD)</option>
                <option value="ICU">Intensive Care Unit (ICU)</option>
                <option value="NICU">Neonatal ICU (NICU)</option>
                <option value="PICU">Pediatric ICU (PICU)</option>
                <option value="HCU">High Care Unit (HCU)</option>
              </optgroup>
              <optgroup label="Center of Excellence" className="bg-[var(--surface-container)]">
                <option value="Kardiologi">Pusat Jantung & Kardiologi</option>
                <option value="Onkologi">Pusat Kanker Komprehensif (Onkologi)</option>
                <option value="Saraf">Pusat Saraf & Otak (Neurologi)</option>
                <option value="Ortopedi">Pusat Ortopedi & Traumatologi</option>
              </optgroup>
              <optgroup label="Poliklinik Spesialis" className="bg-[var(--surface-container)]">
                <option value="Penyakit Dalam">Poli Penyakit Dalam (Internis)</option>
                <option value="Anak">Poli Anak (Pediatri)</option>
                <option value="Kandungan">Poli Kandungan (Obgyn)</option>
                <option value="Bedah Umum">Poli Bedah Umum</option>
                <option value="Mata">Poli Mata (Oftalmologi)</option>
                <option value="THT">Poli THT-KL</option>
                <option value="Gigi dan Mulut">Poli Gigi & Mulut</option>
                <option value="Kulit">Poli Kulit & Kelamin (Dermatologi)</option>
                <option value="Paru">Poli Paru (Pulmonologi)</option>
                <option value="Urologi">Poli Urologi</option>
                <option value="Rehabilitasi Medik">Rehabilitasi Medik (Fisioterapi)</option>
                <option value="Gizi Klinik">Poli Gizi Klinik</option>
                <option value="Kedokteran Jiwa">Poli Kedokteran Jiwa (Psikiatri)</option>
              </optgroup>
              <optgroup label="Layanan Lainnya" className="bg-[var(--surface-container)]">
                <option value="MCU">Medical Check Up (MCU)</option>
                <option value="Hemodialisa">Unit Hemodialisa</option>
                <option value="Radiologi">Radiologi & Diagnostic Imaging</option>
                <option value="Laboratorium">Laboratorium Klinik</option>
              </optgroup>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--on-surface-variant)] group-focus-within:text-[var(--primary)] transition-colors">
              <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            </div>
          </div>
          
          <div className="relative z-10 group">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-1 ml-1 group-focus-within:text-[var(--primary)] transition-colors">
              <ShieldCheck size={10} /> Penjamin
            </label>
            <div className="relative">
            <select name="penjamin" value={filters.penjamin} onChange={handleFilterChange} className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--on-surface)] focus:bg-[var(--surface-container)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-fixed)] outline-none transition-all appearance-none bg-none cursor-pointer">
              <option value="" className="bg-[var(--surface-container)]">Pilih Penjamin</option>
              <optgroup label="Pemerintah & BUMN" className="bg-[var(--surface-container)]">
                <option value="BPJS Kesehatan">BPJS Kesehatan</option>
                <option value="BPJS Ketenagakerjaan (JKK)">BPJS Ketenagakerjaan (JKK)</option>
                <option value="Jasa Raharja">PT Jasa Raharja</option>
                <option value="Pertamedika">Pertamedika (IHC)</option>
                <option value="PLN">Yakes PLN</option>
                <option value="Telkom">Yakes Telkom</option>
                <option value="TASPEN">TASPEN</option>
                <option value="ASABRI">ASABRI</option>
              </optgroup>
              <optgroup label="Asuransi Swasta & TPA Terkemuka" className="bg-[var(--surface-container)]">
                <option value="Umum/Pribadi">Umum / Pembayaran Pribadi</option>
                <option value="AdMedika">AdMedika (TPA)</option>
                <option value="Halodoc">Halodoc (TPA)</option>
                <option value="Prudential">Prudential Indonesia</option>
                <option value="Allianz">Allianz Life Indonesia</option>
                <option value="AXA Mandiri">AXA Mandiri</option>
                <option value="Manulife">Manulife Indonesia</option>
                <option value="AIA Financial">AIA Financial</option>
                <option value="FWD Insurance">FWD Insurance</option>
                <option value="Generali">Generali Indonesia</option>
                <option value="Sinarmas">Asuransi Sinar Mas (ASM)</option>
                <option value="Avrist">Avrist Assurance</option>
                <option value="Cigna">Cigna / Chubb Life</option>
                <option value="Great Eastern">Great Eastern Life</option>
                <option value="Astra Life">Astra Life</option>
                <option value="Sequis Life">Sequis Life</option>
                <option value="Mandiri Inhealth">Mandiri Inhealth</option>
                <option value="Lippo Insurance">Lippo General Insurance</option>
                <option value="Sompo">Sompo Insurance</option>
                <option value="Tokio Marine">Tokio Marine Life</option>
                <option value="BCA Life">BCA Life</option>
                <option value="BNI Life Insurance">BNI Life Insurance</option>
                <option value="BRI Life">BRI Life</option>
                <option value="Asuransi Reliance">Asuransi Reliance</option>
                <option value="Mega Insurance">Mega Insurance</option>
                <option value="MNC Life">MNC Life</option>
                <option value="Panin-Dai Ichi">Panin Dai-ichi Life</option>
                <option value="Zurich">Zurich Asuransi Indonesia</option>
                <option value="Bintang">Asuransi Bintang</option>
                <option value="Ramayana">Asuransi Ramayana</option>
                <option value="Takaful">Asuransi Takaful Keluarga</option>
                <option value="BCAinsurance">BCAinsurance</option>
                <option value="Bumiputera">AJB Bumiputera 1912</option>
                <option value="Bumi Asih">Asuransi Bumi Asih Jaya</option>
                <option value="Kresna Life">Kresna Life</option>
                <option value="Hanwha Life">Hanwha Life Insurance</option>
                <option value="WanaArtha">WanaArtha Life</option>
                <option value="Capital Life">Capital Life Indonesia</option>
                <option value="CAR Life">Central Asia Raya (CAR Life)</option>
                <option value="Etiqa">Etiqa Insurance</option>
                <option value="Garda Medika">Garda Medika (Asuransi Astra)</option>
                <option value="Vitalia">Vitalia (TPA)</option>
                <option value="Fullerton Health">Fullerton Health Group (TPA)</option>
                <option value="Owlexa">Owlexa Healthcare (TPA)</option>
                <option value="Nayaka">Yayasan Kesehatan Nayaka</option>
                <option value="Yakespen">Yakespen BI</option>
                <option value="Yakesma">Yakesma</option>
                <option value="Asuransi MAG">Asuransi Multi Artha Guna (MAG)</option>
                <option value="Asuransi MSIG">Asuransi MSIG Indonesia</option>
                <option value="Kesehatan Tugu">Tugu Mandiri / Tugu Insurance</option>
                <option value="Bina Dana">Asuransi Bina Dana Arta (ABDA)</option>
                <option value="Asuransi Cakrawala">Asuransi Cakrawala Proteksi</option>
                <option value="Chubb General">Chubb General Insurance</option>
                <option value="Dayin Mitra">Asuransi Dayin Mitra</option>
                <option value="Asuransi Fapindo">Asuransi Fapindo</option>
                <option value="Asuransi Harta">Asuransi Harta Aman Pratama</option>
                <option value="Intra Asia">Asuransi Intra Asia</option>
                <option value="Malacca Trust">Asuransi Malacca Trust Wuwungan</option>
                <option value="Asuransi Mitra">Asuransi Mitra Pelindung Mustika</option>
                <option value="Asuransi Parolamas">Asuransi Parolamas</option>
                <option value="Asuransi Raksa">Asuransi Raksa Pratikara</option>
                <option value="Asuransi Staco">Asuransi Staco Mandiri</option>
                <option value="Asuransi Tri Pakarta">Asuransi Tri Pakarta</option>
                <option value="Asuransi Wahana">Asuransi Wahana Tata (Aswata)</option>
                <option value="China Taiping">China Taiping Insurance</option>
                <option value="Kookmin Best">Kookmin Best Insurance</option>
                <option value="Samsung Tugu">Samsung Tugu</option>
                <option value="Asuransi Tugu">Tugu Pratama Indonesia</option>
                <option value="Asuransi Victoria">Victoria Insurance</option>
                <option value="Mizuho">PT Asuransi Kumpulan Global</option>
                <option value="Aig Insurance">AIG Insurance Indonesia</option>
                <option value="ACA">Asuransi Central Asia (ACA)</option>
                <option value="Jasindo">Asuransi Jasa Indonesia (Jasindo)</option>
                <option value="Equity">Equity Life Indonesia</option>
                <option value="Aswata">Aswata</option>
                <option value="Takaful Umum">Takaful Umum</option>
                <option value="Puspa">Puspa (TPA)</option>
                <option value="Medicare">Medicare (TPA)</option>
                <option value="ThirdParty">Third Party Administrator (TPA) Lainnya</option>
                <option value="Korporat">Perusahaan / Corporate (B2B)</option>
              </optgroup>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--on-surface-variant)] group-focus-within:text-[var(--primary)] transition-colors">
              <svg width="8" height="5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            </div>
          </div>
          
          <div className="relative z-10 group">
            <label className="flex items-center gap-1.5 text-[8px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest mb-1 ml-1 group-focus-within:text-[var(--primary)] transition-colors">
              <CalendarDays size={10} /> Tanggal
            </label>
            <input name="tanggal" value={filters.tanggal} onChange={handleFilterChange} type="date" className="w-full bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)] rounded-xl px-3 py-2 text-[10px] font-bold text-[var(--on-surface)] focus:bg-[var(--surface-container)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-fixed)] outline-none transition-all dark:[&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
          </div>
        </div>

          {/* Filter Actions Row */}
          <div className="flex items-center justify-between gap-4 relative z-10 border-t border-[var(--outline-variant)] pt-2.5 bg-[var(--surface-container-low)]">
            <div className="flex bg-[var(--surface-container-high)] p-1 rounded-2xl border border-[var(--outline-variant)] shadow-inner relative w-[320px] h-[36px]">
              {/* Animated Background Indicator */}
              <div 
                className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-[var(--primary)] rounded-xl transition-all duration-500 ease-out shadow-lg shadow-[var(--primary)]/30 z-0"
                style={{
                  transform: `translateX(${
                    filters.careType === 'ALL' ? '0%' : 
                    filters.careType === 'OPD' ? '100.5%' : 
                    '201%'
                  })`
                }}
              />
              <button 
                onClick={() => setFilters(prev => ({ ...prev, careType: 'ALL' }))}
                className={`flex-1 relative z-10 text-[9px] font-black uppercase tracking-wider transition-colors duration-300 ${filters.careType === 'ALL' ? 'text-white' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, careType: 'OPD' }))}
                className={`flex-1 relative z-10 text-[9px] font-black uppercase tracking-wider transition-colors duration-300 ${filters.careType === 'OPD' ? 'text-white' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'}`}
              >
                RJ
              </button>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, careType: 'IPD' }))}
                className={`flex-1 relative z-10 text-[9px] font-black uppercase tracking-wider transition-colors duration-300 ${filters.careType === 'IPD' ? 'text-white' : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'}`}
              >
                RI
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={resetFilters} className="bg-[var(--surface-container-high)] hover:bg-[var(--outline-variant)] hover:-translate-y-0.5 border border-[var(--outline-variant)] text-[var(--on-surface)] h-[36px] px-5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 group shadow-sm cursor-pointer">
                <RotateCcw size={12} className="group-hover:-rotate-180 transition-transform duration-500" /> Reset
              </button>
              <button onClick={handleSearch} className="bg-[#007399] hover:bg-[#005e7e] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(0,115,153,0.3)] text-white h-[36px] px-6 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 group cursor-pointer">
                <Search size={14} className="group-hover:scale-110 transition-transform" /> Mulai Pencarian
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body - Table */}
        <div className="flex-1 overflow-auto bg-[var(--surface-container-lowest)] relative custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[var(--primary)] animate-spin"></div>
              <div className="text-[var(--primary)] text-sm font-black tracking-widest uppercase animate-pulse">Menghubungkan ke Command Center...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 m-8 bg-[var(--surface-container-low)] rounded-[2rem] border border-[var(--outline-variant)] border-dashed relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-fixed)] via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-1000"></div>
              <div className="w-24 h-24 mb-6 relative">
                <div className="absolute inset-0 border-2 border-[var(--outline-variant)] rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 border-2 border-[var(--primary-fixed)] rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-container-high)] rounded-full shadow-lg z-10 border border-[var(--outline-variant)] text-[var(--on-surface-variant)]">
                  <Search size={32} strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-xl font-black text-[var(--on-surface)] tracking-tight mb-2">Tidak Ada Pasien Ditemukan</h3>
              <p className="text-[var(--on-surface-variant)] text-sm font-medium text-center max-w-sm">Data pasien tidak sesuai dengan filter yang Anda masukkan. Cobalah untuk mereset filter atau mengubah parameter pencarian.</p>
              <button onClick={resetFilters} className="mt-6 text-[var(--primary)] text-xs font-black uppercase tracking-widest hover:text-[var(--on-surface)] transition-colors flex items-center gap-2">
                <RotateCcw size={14} /> Reset Filter
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-20 shadow-sm border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-10 py-3 text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Pasien</th>
                  <th className="px-8 py-3 text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Identifikasi</th>
                  <th className="px-8 py-3 text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Klinis</th>
                  <th className="px-8 py-3 text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Departemen & Dokter</th>
                  <th className="px-8 py-3 text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Administrasi</th>
                  <th className="px-10 py-3 text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedData.map((item) => (
                  <tr 
                    key={item.encounterId || item.patientId} 
                    onClick={() => onSelect(item.patientId, item.encounterId)}
                    className="hover:bg-[#007399]/5 dark:hover:bg-slate-900/60 transition-all duration-200 cursor-pointer group relative overflow-hidden"
                  >
                    <td className="px-10 py-3.5 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#007399] scale-y-0 group-hover:scale-y-100 transition-transform origin-center"></div>
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-[#007399]/10 border border-[#007399]/30 flex items-center justify-center text-[#007399] font-black group-hover:bg-[#007399] group-hover:text-white transition-all shadow-2xs shrink-0">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-[#007399] transition-colors uppercase tracking-tight">{item.nama}</div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${item.encounterType === 'IPD' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' : 'bg-[#007399]/15 text-[#007399] dark:text-cyan-300 border border-[#007399]/30'}`}>
                              {item.encounterType === 'IPD' ? 'RI' : 'RJ'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-bold mt-0.5 flex items-center gap-2">
                            <span className={item.kelamin === 'Perempuan' ? 'text-pink-600 font-extrabold' : 'text-[#007399] font-extrabold'}>{item.kelamin}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{item.umur}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-3.5">
                      <div className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-black font-mono text-[12px]">
                        <Hash size={13} className="text-rose-500 shrink-0" />
                        <span>{item.noReg}</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mt-1 font-mono text-[11px] font-bold">
                        <Fingerprint size={13} className="text-slate-500 shrink-0" />
                        <span>{item.noRM}</span>
                      </div>
                    </td>
                    <td className="px-8 py-3.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                        <CalendarDays size={15} className="text-[#007399] shrink-0" />
                        <span>Masuk: <strong className="font-black text-slate-900 dark:text-white">{item.tanggalMasuk}</strong></span>
                      </div>
                    </td>
                    <td className="px-8 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1.5 bg-[#007399]/15 text-[#007399] dark:text-cyan-300 border border-[#007399]/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                          <Building2 size={12} className="text-[#007399] dark:text-cyan-300 shrink-0" />
                          <span>{item.departemen}</span>
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 text-[10px] font-extrabold flex items-center gap-1.5 mt-0.5">
                          <Stethoscope size={12} className="text-slate-500 shrink-0" />
                          <span>{item.dokter}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                        item.penjamin?.includes('BPJS')
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'bg-[#007399]/15 text-[#007399] dark:text-cyan-300 border-[#007399]/30'
                      }`}>
                        <ShieldCheck size={12} className={item.penjamin?.includes('BPJS') ? 'text-emerald-600' : 'text-[#007399]'} />
                        <span>{item.penjamin}</span>
                      </span>
                    </td>
                    <td className="px-10 py-3.5 text-right">
                      <div className="inline-flex w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-[#007399] group-hover:text-white group-hover:shadow-md transition-all">
                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[var(--surface-container)] border-t border-[var(--outline-variant)] px-12 py-4 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative z-20">
          <div className="flex items-center gap-2 text-[10px] font-black text-[var(--on-surface-variant)] uppercase tracking-widest">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--surface-container-high)] border border-[var(--outline-variant)] hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-white hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] transition-all disabled:opacity-30 disabled:pointer-events-none"
            >&laquo;</button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--surface-container-high)] border border-[var(--outline-variant)] hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-white hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] transition-all disabled:opacity-30 disabled:pointer-events-none"
            >&lsaquo;</button>
            <span className="mx-3 flex items-center gap-2">
              Page <span className="font-bold text-[var(--on-surface)]">{currentPage}</span> of <span className="font-bold text-[var(--on-surface)]">{totalPages}</span>
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--surface-container-high)] border border-[var(--outline-variant)] hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-white hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] transition-all disabled:opacity-30 disabled:pointer-events-none"
            >&rsaquo;</button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--surface-container-high)] border border-[var(--outline-variant)] hover:bg-[var(--primary)] hover:border(--primary)] hover:text-white hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] transition-all disabled:opacity-30 disabled:pointer-events-none"
            >&raquo;</button>
            <span className="ml-8 opacity-70 bg-[var(--surface-container-high)] px-3 py-1.5 rounded-full border border-[var(--outline-variant)]">
              Menampilkan <span className="text-[var(--on-surface)]">{paginatedData.length}</span> dari <span className="text-[var(--on-surface)]">{filteredData.length}</span> pasien
            </span>
          </div>
          <button 
            onClick={onClose}
            className="bg-[var(--surface-container-high)] border border-[var(--outline-variant)] hover:bg-[var(--outline-variant)] text-[var(--on-surface)] px-10 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
          >
            Tutup Windows
          </button>
        </div>
         </div>
       </div>
     </div>
   );
}
