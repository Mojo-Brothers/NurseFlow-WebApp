import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  UserPlus, 
  Activity, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ChevronRight, 
  Camera, 
  MapPin, 
  Smartphone, 
  Calendar,
  Lock,
  ArrowRight,
  User,
  ShieldCheck,
  History,
  Fingerprint,
  Zap,
  Sparkles,
  Edit2,
  Mail,
  Phone,
  Shield,
  HeartPulse
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { db } from '../../../core/firebase.js';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  orderBy, 
  limit,
  doc,
  updateDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { usePatientStore } from '../patient.store.js';
import { useNavigate } from 'react-router-dom';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { createEncounter } from '../../encounter/services/encounter.service.js';
import { getAvailableDoctors } from '../services/patient.service.js';
import { logAudit } from '../../../core/services/audit.service.js';
import { AUDIT_ACTIONS, COLLECTIONS, ENCOUNTER_TYPES } from '../../../core/constants.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { functions } from '../../../core/firebase.js';
import AuditTrailModal from '../components/AuditTrailModal.jsx';
import '../styles/Patients.css';

const DUMMY_DOCTORS = [
  { id: 'd1', name: 'dr. Budi Santoso, Sp.PD' },
  { id: 'd2', name: 'dr. Siti Aminah, Sp.A' },
  { id: 'd3', name: 'dr. Robert Wilson, Sp.OT' },
  { id: 'd4', name: 'dr. Linda Wijaya, Sp.OG' },
  { id: 'd5', name: 'dr. Ahmad Hidayat, Sp.JP' },
  { id: 'd6', name: 'dr. Maria Garcia, Sp.An' },
  { id: 'd7', name: 'dr. Kevin Hartanto, Sp.B' },
  { id: 'd8', name: 'dr. Sarah Connor, Sp.Rad' }
];

const initialFormState = {
  // Step 1: Identitas Utama (IPSG 1)
  title: 'Tn', name: '', nik: '', passport_no: '', dob: '', gender: 'M', pob: '', 
  nationality: 'WNI', religion: 'islam', ethnicity: '', marital_status: 'single',
  // Step 2: Kontak & Demografi
  address: '', city: '', province: '', postal_code: '', email: '', phone: '', 
  education: 'sma', occupation: 'Private',
  preferred_language: 'id', interpreter_needed: false,
  // Step 3: Penanggung Jawab / Wali
  emergency_name: '', emergency_phone: '', emergency_address: '', relationship: 'family',
  kin_name: '', kin_relation: '', guarantor_name: '', guarantor_phone: '',
  // Step 4: Asuransi & Billing
  insurance_type: 'umum', insurance_group: '', insurance_no: '', insurance_valid_thru: '', payment_preference: 'cash',
  // Step 5: Medis & Safety (IPSG 6)
  blood_type: 'o', allergies: '', infectious_disease: '', disability: '', implant_pacemaker: false, fall_risk: false, 
  primary_physician_id: '',
  // Step 6: Hak Pasien & Spiritual (PFR)
  privacy_level: 'STANDARD', spiritual_needs: '', dnr_status: false, organ_donor: false, data_release: true, consent: false
};

export default function PatientPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { patients, isLoading: loading, fetchPatients, addPatient, selectPatient } = usePatientStore();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // ─── Admission Modal State ───
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [selectedPatientForAdmit, setSelectedPatientForAdmit] = useState(null);

  // ─── View Mode Switcher State (Grid / Card vs Table) ───
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('nurseflow_view_mode') || 'grid');

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('nurseflow_view_mode', mode);
  };

  // ─── Local State: Unified Form Data (Super Complete JCI Standard) ───
  const [form, setForm] = useState(initialFormState);

  const applyPreset = (type) => {
    if (type === 'wni') {
      setForm({
        ...initialFormState,
        title: 'Tn',
        name: 'Budi Santoso',
        nik: '3171012304850001',
        passport_no: '',
        pob: 'Jakarta',
        dob: '1985-04-23',
        gender: 'M',
        religion: 'islam',
        nationality: 'WNI',
        ethnicity: 'Jawa',
        marital_status: 'single',
        address: 'Jl. Melati No. 12, Cilandak',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postal_code: '12430',
        phone: '081298765432',
        email: 'budi.santoso@gmail.com',
        occupation: 'Swasta',
        education: 's1',
        preferred_language: 'Indonesia',
        interpreter_needed: false,
        emergency_name: 'Siti Aminah',
        relationship: 'Istri',
        emergency_phone: '081311223344',
        emergency_address: 'Jl. Melati No. 12',
        kin_name: 'Siti Aminah',
        kin_relation: 'Istri',
        guarantor_name: 'Budi Santoso',
        guarantor_phone: '081298765432',
        insurance_type: 'UMUM',
        payment_preference: 'cash',
        blood_type: 'O',
        primary_physician_id: DUMMY_DOCTORS[0]?.id || '',
        allergies: 'Aspirin, Seafood',
        disability: '-',
        infectious_disease: '',
        fall_risk: false,
        implant_pacemaker: false,
        privacy_level: 'STANDARD',
        spiritual_needs: 'Bimbingan Doa Sebelum Operasi',
        dnr_status: false,
        organ_donor: false,
        data_release: true,
        consent: true
      });
      toast.success('Preset WNI Umum Berhasil Dimuat!');
    } else if (type === 'bpjs') {
      setForm({
        ...initialFormState,
        title: 'Ny',
        name: 'Ratna Sari Dewi',
        nik: '3201025508920003',
        passport_no: '',
        pob: 'Bandung',
        dob: '1992-08-15',
        gender: 'F',
        religion: 'islam',
        nationality: 'WNI',
        ethnicity: 'Sunda',
        marital_status: 'single',
        address: 'Jl. Raya Lembang No. 45',
        city: 'Bandung Barat',
        province: 'Jawa Barat',
        postal_code: '40391',
        phone: '085712345678',
        email: 'ratna.sd@gmail.com',
        occupation: 'Ibu Rumah Tangga',
        education: 'sma',
        emergency_name: 'Ahmad Supriadi',
        relationship: 'Suami',
        emergency_phone: '085799887766',
        insurance_type: 'BPJS KESEHATAN',
        insurance_group: 'BPJS Mandiri Kelas 1',
        insurance_no: '0001928374651',
        insurance_valid_thru: '2028-12-31',
        payment_preference: 'insurance',
        blood_type: 'A',
        primary_physician_id: DUMMY_DOCTORS[1]?.id || '',
        allergies: 'Penicillin',
        fall_risk: true,
        implant_pacemaker: false,
        consent: true,
        data_release: true
      });
      toast.success('Preset BPJS Emergency Berhasil Dimuat!');
    } else if (type === 'wna') {
      setForm({
        ...initialFormState,
        title: 'Tn',
        name: 'John Michael Smith',
        nik: '',
        passport_no: 'A98765432',
        pob: 'Sydney',
        dob: '1980-11-05',
        gender: 'M',
        religion: 'kristen',
        nationality: 'Australia',
        ethnicity: 'Caucasian',
        marital_status: 'single',
        address: 'Vimala Hills Villa 8, Ciawi',
        city: 'Bogor',
        province: 'Jawa Barat',
        postal_code: '16720',
        phone: '+61412345678',
        email: 'john.smith@sydney.au',
        occupation: 'Architect',
        education: 's2_s3',
        preferred_language: 'English',
        interpreter_needed: true,
        emergency_name: 'Emily Smith',
        relationship: 'Sister',
        emergency_phone: '+61488776655',
        insurance_type: 'ASURANSI SWASTA',
        insurance_group: 'Bupa Global International',
        insurance_no: 'BUPA-992104-AU',
        insurance_valid_thru: '2027-06-30',
        payment_preference: 'credit_card',
        blood_type: 'AB',
        primary_physician_id: DUMMY_DOCTORS[2]?.id || '',
        allergies: 'Nuts, Latex',
        disability: 'English Language Only',
        implant_pacemaker: true,
        privacy_level: 'VIP',
        consent: true,
        data_release: true
      });
      toast.success('Preset WNA Asuransi Berhasil Dimuat!');
    }
  };
  
  // Helper for step-by-step form updates
  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [targetPatientId, setTargetPatientId] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // ─── Filter & Intelligence States (Modern 2026) ───
  const [activeFilters, setActiveFilters] = useState({
    insurance: 'ALL',
    safety: 'ALL',
    triage: 'ALL',
    patientType: 'ALL',
    status: 'ACTIVE',
    sortBy: 'RECENT'
  });

  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // ─── Audit Trail & Merge State ───
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedPatientForAudit, setSelectedPatientForAudit] = useState(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedPatientForMerge, setSelectedPatientForMerge] = useState(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  useEffect(() => {
    fetchPatients();
    const loadDoctors = async () => {
      const docs = await getAvailableDoctors();
      setDoctors(docs);
    };
    loadDoctors();
  }, [fetchPatients]);


  // ─── Smart Filter Logic (Performance Optimized) ───
  const filteredPatients = patients.filter(p => {
    // Hide merged patient records from active directory (JCI / HIS MPI Standard)
    if (p.status === 'MERGED') return false;

    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                         p.name?.toLowerCase().includes(s) || 
                         p.mrn?.toLowerCase().includes(s) || 
                         p.nik?.includes(s);
    
    const matchesInsurance = activeFilters.insurance === 'ALL' || p.insurance?.type?.toLowerCase() === activeFilters.insurance.toLowerCase();
    
    const matchesSafety = activeFilters.safety === 'ALL' || 
                         (activeFilters.safety === 'ALLERGY' && p.safety_flags?.allergy_risk) ||
                         (activeFilters.safety === 'FALL_RISK' && p.safety_flags?.fall_risk);

    const matchesTriage = activeFilters.triage === 'ALL' || p.triage_level === activeFilters.triage;
    const matchesType = activeFilters.patientType === 'ALL' || p.type === activeFilters.patientType;
    const matchesStatus = activeFilters.status === 'ALL' || (activeFilters.status === 'ACTIVE' ? !p.discharged : p.discharged);
    
    return matchesSearch && matchesInsurance && matchesSafety && matchesTriage && matchesType && matchesStatus;
  }).sort((a, b) => {
    if (activeFilters.sortBy === 'RECENT') {
      const getTime = (p) => {
        let t = p.createdAt || p.registered_at || p.admitted_at;
        if (!t) return 0;
        if (typeof t.toDate === 'function') return t.toDate().getTime();
        if (t.seconds) return t.seconds * 1000;
        if (t instanceof Date) return t.getTime();
        return new Date(t).getTime() || 0;
      };
      return getTime(b) - getTime(a);
    }
    if (activeFilters.sortBy === 'NAME') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  // Calculate active filter count (excluding defaults)
  const activeFilterCount = Object.entries(activeFilters).filter(([key, value]) => {
    if (key === 'sortBy' || key === 'status') return false;
    return value !== 'ALL';
  }).length;

  const removeFilter = (key) => setActiveFilters(prev => ({ ...prev, [key]: 'ALL' }));

  // ─── Logic: Get Random Doctor for WOW Effect ───
  const getRandomDoctor = (patientId) => {
    // Deterministic random based on patientId so it doesn't change on every render
    const availableDocs = doctors.length > 0 ? doctors : DUMMY_DOCTORS;
    const seed = patientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return availableDocs[seed % availableDocs.length].name;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.consent) return toast.error(t('patients_v2.errors.consent_required'));

    try {
      const patientData = { 
        name: form.name, 
        nik: form.nik, 
        pob: form.pob,
        demographics: { 
          dob: form.dob, 
          gender: form.gender,
          address: form.address,
          religion: form.religion,
          pob: form.pob,
          nationality: form.nationality,
          marital_status: form.marital_status,
          education: form.education,
          occupation: form.occupation,
          language: {
            preferred: form.preferred_language,
            interpreter: form.interpreter_needed
          }
        }, 
        emergency_contact: {
          name: form.emergency_name,
          phone: form.emergency_phone,
          relationship: form.relationship
        },
        guarantor: {
          name: form.guarantor_name,
          phone: form.guarantor_phone
        },
        insurance: {
          type: form.insurance_type,
          card_number: form.insurance_no
        },
        clinical_baseline: {
          blood_type: form.blood_type,
          allergies: form.allergies ? [form.allergies] : []
        },
        primary_physician: form.primary_physician_id ? {
          id: form.primary_physician_id,
          name: doctors.find(d => d.id === form.primary_physician_id)?.name || getRandomDoctor(form.nik || 'temp')
        } : null,
        safety_flags: {
          fall_risk: form.fall_risk,
          allergy_risk: !!form.allergies
        },
        legal_consent: {
          general_consent: true,
          privacy_level: form.privacy_level,
          spiritual_requests: form.spiritual_needs,
          signed_at: new Date().toISOString()
        }
      };

      if (isEditing) {
        // JCI Requirement: Track EXACT changes (Delta)
        const delta = {};
        Object.keys(patientData).forEach(key => {
          if (JSON.stringify(patientData[key]) !== JSON.stringify(originalData[key])) {
            delta[key] = { from: originalData[key], to: patientData[key] };
          }
        });

        await addPatient(patientData, currentUser?.email || 'system', targetPatientId);
        
        await logAudit({
          action: AUDIT_ACTIONS.UPDATE,
          resource_type: COLLECTIONS.PATIENTS,
          resource_id: targetPatientId,
          delta,
          reason: 'DATA_RECTIFICATION'
        });
        toast.success(t('patients_v2.success.updated') || 'Data pasien diperbarui');
      } else {
        const newPatient = await addPatient(patientData, currentUser?.email || 'system');
        
        await logAudit({
          action: AUDIT_ACTIONS.CREATE,
          resource_type: COLLECTIONS.PATIENTS,
          resource_id: newPatient.id,
          delta: { name: patientData.name, nik: patientData.nik },
          reason: 'NEW_PATIENT_REGISTRATION'
        });

        // EHIS Phase 2: Bridging BPJS VClaim (Mock)
        if (form.insurance_type?.toLowerCase().includes('bpjs')) {
          toast.loading('Menghubungkan ke BPJS VClaim...', { id: 'bpjs-sep' });
          try {
            const createSEP = httpsCallable(functions, 'createSEP');
            const sepResult = await createSEP({
              noKartu: form.insurance_no,
              tglSep: new Date().toISOString().substring(0, 10),
              jnsPelayanan: '2', // Rawat Jalan
              klsRawat: '1',
              noMR: newPatient.mrn || 'NEW',
              diagAwal: form.allergies || 'A00', // Mock diagnosis
              poli: 'IGD',
              user: currentUser?.email || 'system'
            });
            const sepNo = sepResult.data?.response?.sep?.noSep;
            if (sepNo) {
               toast.success(`SEP BPJS Terbit: ${sepNo}`, { id: 'bpjs-sep' });
            } else {
               toast.error('Gagal menerbitkan SEP BPJS', { id: 'bpjs-sep' });
            }
          } catch (err) {
            console.error('BPJS Error:', err);
            toast.error('Koneksi VClaim Gagal', { id: 'bpjs-sep' });
          }
        } else {
          toast.success(t('patients_v2.success.registered') || 'Pasien berhasil didaftarkan');
        }
      }

      setIsModalOpen(false);
      setIsEditing(false);
      setCurrentStep(1);
    } catch (error) {
      console.error("Error during patient registration/update:", error);
      toast.error(t('patients_v2.errors.operation_failed') || 'Gagal menyimpan data');
    }
  };

  const handleEditPatient = (patient) => {
    setTargetPatientId(patient.id);
    setIsEditing(true);
    setOriginalData(patient);
    
    // Map patient data back to form state
    setForm({
      name: patient.name || '',
      nik: patient.nik || '',
      dob: patient.demographics?.dob || '',
      gender: (patient.demographics?.gender === 'UNKNOWN' ? 'U' : patient.demographics?.gender) || 'M',
      pob: patient.demographics?.pob || '',
      nationality: patient.demographics?.nationality || 'WNI',
      marital_status: patient.demographics?.marital_status || 'single',
      address: patient.demographics?.address || '',
      religion: patient.demographics?.religion || 'islam',
      phone: patient.demographics?.phone || '',
      education: patient.demographics?.education || 'sma',
      occupation: patient.demographics?.occupation || 'Private',
      preferred_language: patient.demographics?.language?.preferred || 'id',
      interpreter_needed: patient.demographics?.language?.interpreter || false,
      emergency_name: patient.emergency_contact?.name || '',
      emergency_phone: patient.emergency_contact?.phone || '',
      relationship: patient.emergency_contact?.relationship || 'family',
      guarantor_name: patient.guarantor?.name || '',
      guarantor_phone: patient.guarantor?.phone || '',
      insurance_type: patient.insurance?.type || 'umum',
      insurance_no: patient.insurance?.card_number || '',
      blood_type: patient.clinical_baseline?.blood_type || 'o',
      allergies: patient.clinical_baseline?.allergies?.[0] || '',
      fall_risk: patient.safety_flags?.fall_risk || false,
      primary_physician_id: patient.primary_physician?.id || '',
      privacy_level: patient.legal_consent?.privacy_level || 'STANDARD',
      spiritual_needs: patient.legal_consent?.spiritual_requests || '',
      consent: true // Assume consent persists for edits or re-verify
    });
    
    setIsModalOpen(true);
    setCurrentStep(1);
  };

  const handleAdmit = (patientId, patientName) => {
    setSelectedPatientForAdmit({ id: patientId, name: patientName });
    setIsAdmitModalOpen(true);
  };

  // finalizeAdmission moved to child component for performance

  const handleViewEMR = async (patientId, patientName) => {
    // JCI Requirement: Audit clinical access
    await logAudit({
      action: AUDIT_ACTIONS.VIEW,
      resource_type: COLLECTIONS.PATIENTS,
      resource_id: patientId,
      delta: { name: patientName },
      reason: 'CLINICAL_REVIEW'
    });
    
    // Inject patient into Global Context
    selectPatient(patientId);
    
    // Route to EMR Workspace
    navigate('/emr-rj');
  };

  return (
    <div className="patients-container p-4 lg:p-6 w-full max-w-full">
      <div className="flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-on-surface leading-tight">{t('patients_v2.title')}</h2>
          <p className="text-on-surface-variant text-sm mt-1 font-medium">{t('patients_v2.subtitle')}</p>
        </div>
      </div>

      {/* ─── Premium Glass Command Bar ─── */}
      <div className="relative mb-8 z-20">
        <div className="glass-panel rounded-2xl p-3 flex-row items-center justify-between gap-4 shadow-premium-soft">
          <div className="flex-1 flex-row items-center gap-3 px-3">
            <span className="material-symbols-outlined text-primary/70 text-[24px]">search</span>
            <input 
              type="text" 
              placeholder="Cari Pasien (Nama, MRN, NIK)..."
              className="w-full bg-transparent border-none text-on-surface focus:ring-0 font-medium placeholder-on-surface-variant/50 h-10 px-2"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="h-10 w-[1px] bg-outline-variant/50 hidden md:block"></div>
          
          <div className="flex-row items-center gap-3">
            {/* View Mode Switcher (Kartu vs Tabel) */}
            <div className="flex items-center bg-surface-container-high/80 p-1 rounded-xl border border-outline-variant/30">
              <button 
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => handleViewModeChange('grid')}
                title="Tampilan Kartu (Grid)"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                <span className="hidden sm:inline">Kartu</span>
              </button>
              <button 
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                onClick={() => handleViewModeChange('table')}
                title="Tampilan Tabel (List)"
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>

            <button 
              className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${activeFilterCount > 0 ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container text-on-surface-variant'}`}
              onClick={() => setIsFilterOpen(true)}
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <span className="hidden md:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] ml-1">{activeFilterCount}</span>
              )}
            </button>

            <button 
              id="btn-new-patient-registration"
              className="btn-primary"
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(false);
                setForm(initialFormState);
                setIsModalOpen(true); 
                setCurrentStep(1); 
              }}
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span className="font-bold text-sm hidden sm:inline">Daftar Pasien</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Centered Filter Panel ─── */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsFilterOpen(false)}></div>
          <div className="filter-modal-content" onClick={e => e.stopPropagation()}>
              <div className="flex-row justify-between items-center mb-6">
                <div className="flex-row items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex-row items-center justify-center">
                    <span className="material-symbols-outlined">tune</span>
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tighter">{t('patients_v2.filter.title')}</h4>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase opacity-60">{t('patients_v2.filter.subtitle')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsFilterOpen(false)} 
                  className="w-10 h-10 rounded-full hover:bg-surface-container-high flex-row items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="custom-scrollbar max-h-[60vh] overflow-y-auto pr-2">
                {/* Jenis Pasien */}
                <div className="filter-section">
                  <p className="filter-section-title">{t('patients_v2.filters.patient_type')}</p>
                  <div className="filter-option-grid">
                    {['ALL', 'IGD', 'RAWAT JALAN', 'RAWAT INAP'].map(type => (
                      <button 
                        key={type}
                        className={`filter-option-btn ${activeFilters.patientType === type ? 'active' : ''}`}
                        onClick={() => setActiveFilters(prev => ({ ...prev, patientType: type }))}
                      >
                        {type === 'ALL' ? t('patients_v2.filters.all') : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Penjamin */}
                <div className="filter-section">
                  <p className="filter-section-title">{t('patients_v2.filters.insurance')}</p>
                  <div className="filter-option-grid">
                    {['ALL', 'umum', 'bpjs', 'swasta'].map(type => (
                      <button 
                        key={type}
                        className={`filter-option-btn ${activeFilters.insurance.toLowerCase() === type ? 'active' : ''}`}
                        onClick={() => setActiveFilters(prev => ({ ...prev, insurance: type }))}
                      >
                        {type === 'ALL' ? t('patients_v2.filters.all') : t('patient_form.insurance_types.' + type)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Safety Flags */}
                <div className="filter-section">
                  <p className="filter-section-title">{t('patients_v2.filters.safety')}</p>
                  <div className="filter-option-grid">
                    {['ALL', 'ALLERGY', 'FALL_RISK'].map(risk => (
                      <button 
                        key={risk}
                        className={`filter-option-btn ${activeFilters.safety === risk ? 'active' : ''}`}
                        onClick={() => setActiveFilters(prev => ({ ...prev, safety: risk }))}
                      >
                        {risk === 'ALL' ? t('patients_v2.filters.all') : risk === 'ALLERGY' ? t('patients_v2.filters.allergy') : t('patients_v2.filters.fall_risk')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Triage Level */}
                <div className="filter-section">
                  <p className="filter-section-title">{t('patients_v2.filters.triage')}</p>
                  <div className="filter-option-grid">
                    {[
                      { id: 'ALL', label: t('patients_v2.filters.all') },
                      { id: 'P1', label: t('patients_v2.filters.triage_levels.p1'), color: '#ef4444' },
                      { id: 'P2', label: t('patients_v2.filters.triage_levels.p2'), color: '#f97316' },
                      { id: 'P3', label: t('patients_v2.filters.triage_levels.p3'), color: '#eab308' },
                      { id: 'P4', label: t('patients_v2.filters.triage_levels.p4'), color: '#22c55e' },
                      { id: 'P5', label: t('patients_v2.filters.triage_levels.p5'), color: '#3b82f6' }
                    ].map(tLevel => (
                      <button 
                        key={tLevel.id}
                        className={`filter-option-btn ${activeFilters.triage === tLevel.id ? 'active' : ''}`}
                        style={activeFilters.triage === tLevel.id ? { backgroundColor: tLevel.color, borderColor: tLevel.color, color: 'white' } : {}}
                        onClick={() => setActiveFilters(prev => ({ ...prev, triage: tLevel.id }))}
                      >
                        {tLevel.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lokasi / Ruang */}
                <div className="filter-section">
                  <p className="filter-section-title">{t('patients_v2.filters.location')}</p>
                  <div className="filter-option-grid">
                    {['ALL', 'igd', 'icu', 'ward_a', 'poli'].map(loc => (
                      <button 
                        key={loc}
                        className={`filter-option-btn ${activeFilters.location === loc ? 'active' : ''}`}
                        onClick={() => setActiveFilters(prev => ({ ...prev, location: loc }))}
                      >
                        {loc === 'ALL' ? t('patients_v2.filters.all') : t('patients_v2.admission.wards.' + loc, { defaultValue: loc })}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="filter-panel-footer border-t pt-6 mt-4">
                <button 
                  className="btn-ghost text-error"
                  onClick={() => setActiveFilters({ insurance: 'ALL', safety: 'ALL', triage: 'ALL', patientType: 'ALL', status: 'ACTIVE', sortBy: 'RECENT', location: 'ALL' })}
                >
                  {t('patients_v2.filters.reset')}
                </button>
                <div className="flex-row items-center gap-4">
                  <div className="flex-row items-center gap-2">
                    <span className="text-[10px] font-black uppercase opacity-40">{t('patients_v2.filters.sort_label')}</span>
                    <select 
                      className="text-[11px] font-black bg-surface-container-low px-2 py-1 rounded-lg border-none text-primary cursor-pointer focus:ring-0"
                      value={activeFilters.sortBy}
                      onChange={e => setActiveFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    >
                      <option value="RECENT">{t('patients_v2.filters.sort_recent')}</option>
                      <option value="NAME">{t('patients_v2.filters.sort_name')}</option>
                    </select>
                  </div>
                  <button 
                    className="btn-primary px-8"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    {t('patients_v2.filters.apply')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Active Filter Chips */}
      <div className="active-filters-row">
        {activeFilters.patientType !== 'ALL' && (
          <div className="filter-chip">
            <span>{t('patients_v2.filters.type_label')}: {activeFilters.patientType}</span>
            <button onClick={() => removeFilter('patientType')}><span className="material-symbols-outlined text-[14px]">close</span></button>
          </div>
        )}
        {activeFilters.insurance !== 'ALL' && (
          <div className="filter-chip">
            <span>{t('patients_v2.filters.insurance_label')}: {activeFilters.insurance}</span>
            <button onClick={() => removeFilter('insurance')}><span className="material-symbols-outlined text-[14px]">close</span></button>
          </div>
        )}
        {activeFilters.safety !== 'ALL' && (
          <div className="filter-chip">
            <span>{t('patients_v2.filters.safety_label')}: {activeFilters.safety}</span>
            <button onClick={() => removeFilter('safety')}><span className="material-symbols-outlined text-[14px]">close</span></button>
          </div>
        )}
      </div>

      {/* ─── DYNAMIC VIEW MODE (GRID CARD vs TABLE) ─── */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10 relative z-10">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <span className="font-bold text-on-surface-variant/60 animate-pulse">Menyiapkan Data Pasien...</span>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4 opacity-40">
              <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-2 shadow-inner">
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant">person_search</span>
              </div>
              <h3 className="text-2xl font-headline font-black tracking-tight">{t('patients_v2.table.no_records')}</h3>
              <p className="text-sm max-w-[300px] mx-auto text-center">{t('patients_v2.table.no_records_match', { term: searchTerm })}</p>
              <button 
                className="px-6 py-2 rounded-full border border-primary text-primary font-bold hover:bg-primary/10 transition-colors mt-4"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredPatients.map(patient => (
              <div key={patient.id} className="clinical-card group flex flex-col relative overflow-hidden">
                {/* Triage Edge Indicator */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${patient.status === 'EMERGENCY' ? 'bg-error shadow-glow-error' : 'bg-primary'}`}></div>
                
                <div className="flex-row justify-between items-start mb-4 pl-3">
                  <div>
                    <h3 className="font-headline font-black text-lg text-on-surface leading-tight group-hover:text-primary transition-colors">{patient.name || 'TANPA NAMA'}</h3>
                    <div className="flex-row items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono font-bold bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">MRN: {patient.mrn || 'PENDING'}</span>
                      <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase">{patient.demographics?.gender === 'M' ? 'Laki-laki' : patient.demographics?.gender === 'F' ? 'Perempuan' : 'Tidak Diketahui'} • {patient.demographics?.dob ? `${calculateAge(patient.demographics.dob)} Thn` : '--'}</span>
                    </div>
                  </div>
                  
                  <div className="action-menu-container">
                    <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors" onClick={(e) => toggleMenu(e, patient.id)}>
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {activeMenuId === patient.id && (
                      <div className="absolute right-0 top-10 w-48 glass-panel rounded-xl py-2 z-50 shadow-2xl animate-scale-in origin-top-right">
                        <button className="w-full text-left px-4 py-2 hover:bg-surface-container-high text-sm font-bold flex items-center gap-3 text-primary" onClick={() => handleViewEMR(patient.id, patient.name)}>
                          <span className="material-symbols-outlined text-[18px]">clinical_notes</span> Buka EMR
                        </button>
                        <button className="w-full text-left px-4 py-2 hover:bg-surface-container-high text-sm font-bold flex items-center gap-3 text-on-surface-variant" onClick={() => handleEditPatient(patient)}>
                          <span className="material-symbols-outlined text-[18px]">edit</span> Edit Data
                        </button>
                        <button className="w-full text-left px-4 py-2 hover:bg-surface-container-high text-sm font-bold flex items-center gap-3 text-on-surface-variant" onClick={() => { setSelectedPatientForAudit(patient); setIsAuditModalOpen(true); setActiveMenuId(null); }}>
                          <span className="material-symbols-outlined text-[18px]">history</span> Riwayat Audit
                        </button>
                        <button className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-sm font-bold flex items-center gap-3 text-purple-600 dark:text-purple-400" onClick={() => { setSelectedPatientForMerge(patient); setIsMergeModalOpen(true); setActiveMenuId(null); }}>
                          <span className="material-symbols-outlined text-[18px]">call_merge</span> Merger Rekam Medis
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 pl-3">
                  <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/50">Asuransi</span>
                    <span className="text-xs font-bold truncate text-on-surface">{(patient.insurance?.type || 'UMUM').toUpperCase()}</span>
                  </div>
                  <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/50">DPJP</span>
                    <span className="text-xs font-bold truncate text-on-surface">{patient.primary_physician?.name || getRandomDoctor(patient.id)}</span>
                  </div>
                </div>

                {/* Safety & Alerts */}
                <div className="flex-row flex-wrap gap-2 mb-4 pl-3">
                  {patient.safety_flags?.allergy_risk && (
                    <span className="px-2 py-1 bg-error-container text-on-error-container text-[9px] font-black rounded-md uppercase tracking-wider border border-error/20">Allergy Alert</span>
                  )}
                  {patient.safety_flags?.fall_risk && (
                    <span className="px-2 py-1 bg-warning-container text-warning text-[9px] font-black rounded-md uppercase tracking-wider border border-warning/20 animate-pulse-soft">Fall Risk</span>
                  )}
                  {patient.status === 'EMERGENCY' && (
                    <span className="px-2 py-1 bg-error text-white text-[9px] font-black rounded-md uppercase tracking-wider shadow-glow-error animate-pulse-alert">IGD Triage</span>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t border-outline-variant/30 pl-3">
                  <span className="text-[10px] font-medium text-on-surface-variant/60 line-clamp-1">
                    <strong className="font-bold text-on-surface-variant">Keluhan:</strong> {patient.medical_summary?.chief_complaint || patient.clinical_baseline?.allergies?.[0] || (patient.status === 'EMERGENCY' ? 'Belum Diisi (Darurat)' : 'Kunjungan Rutin')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ─── PREMIUM HIGH-DENSITY CLINICAL TABLE VIEW ─── */
        <div className="glass-panel rounded-2xl overflow-hidden border border-outline-variant/30 shadow-premium-soft mb-10 relative z-10">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <span className="font-bold text-on-surface-variant/60 animate-pulse">Menyiapkan Data Pasien...</span>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant">person_search</span>
              <h3 className="text-xl font-black">{t('patients_v2.table.no_records')}</h3>
              <p className="text-sm">{t('patients_v2.table.no_records_match', { term: searchTerm })}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3.5 px-4">Nama Pasien / MRN</th>
                    <th className="py-3.5 px-4">Demografi</th>
                    <th className="py-3.5 px-4">Asuransi</th>
                    <th className="py-3.5 px-4">DPJP</th>
                    <th className="py-3.5 px-4">Peringatan Safety</th>
                    <th className="py-3.5 px-4">Keluhan Utama</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-sm">
                  {filteredPatients.map(patient => (
                    <tr key={patient.id} className="hover:bg-surface-container-low/60 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        <div className="flex flex-col">
                          <span className="font-headline text-base group-hover:text-primary transition-colors">{patient.name || 'TANPA NAMA'}</span>
                          <span className="text-[11px] font-mono text-on-surface-variant/70">MRN: {patient.mrn || 'PENDING'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-on-surface-variant">
                        {patient.demographics?.gender === 'M' ? 'Laki-laki' : patient.demographics?.gender === 'F' ? 'Perempuan' : 'Tidak Diketahui'}
                        {patient.demographics?.dob ? ` • ${calculateAge(patient.demographics.dob)} Thn` : ''}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded bg-surface-container text-xs font-bold text-on-surface uppercase border border-outline-variant/30">
                          {(patient.insurance?.type || 'UMUM').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-on-surface">
                        {patient.primary_physician?.name || getRandomDoctor(patient.id)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {patient.safety_flags?.allergy_risk && (
                            <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-black rounded uppercase border border-error/20">Allergy Alert</span>
                          )}
                          {patient.safety_flags?.fall_risk && (
                            <span className="px-2 py-0.5 bg-warning-container text-warning text-[10px] font-black rounded uppercase border border-warning/20">Fall Risk</span>
                          )}
                          {patient.status === 'EMERGENCY' && (
                            <span className="px-2 py-0.5 bg-error text-white text-[10px] font-black rounded uppercase">IGD Triage</span>
                          )}
                          {!patient.safety_flags?.allergy_risk && !patient.safety_flags?.fall_risk && patient.status !== 'EMERGENCY' && (
                            <span className="text-xs text-on-surface-variant/40">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-on-surface-variant max-w-[200px] truncate">
                        {patient.medical_summary?.chief_complaint || patient.clinical_baseline?.allergies?.[0] || (patient.status === 'EMERGENCY' ? 'Belum Diisi (Darurat)' : 'Kunjungan Rutin')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                            onClick={() => handleViewEMR(patient.id, patient.name)}
                          >
                            <span className="material-symbols-outlined text-[16px]">clinical_notes</span> EMR
                          </button>
                          <div className="action-menu-container">
                            <button 
                              className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
                              onClick={(e) => toggleMenu(e, patient.id)}
                            >
                              <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            </button>
                            {activeMenuId === patient.id && (
                              <div className="absolute right-0 top-10 w-48 glass-panel rounded-xl py-2 z-50 shadow-2xl animate-scale-in origin-top-right">
                                <button className="w-full text-left px-4 py-2 hover:bg-surface-container-high text-sm font-bold flex items-center gap-3 text-primary" onClick={() => handleViewEMR(patient.id, patient.name)}>
                                  <span className="material-symbols-outlined text-[18px]">clinical_notes</span> Buka EMR
                                </button>
                                <button className="w-full text-left px-4 py-2 hover:bg-surface-container-high text-sm font-bold flex items-center gap-3 text-on-surface-variant" onClick={() => handleEditPatient(patient)}>
                                  <span className="material-symbols-outlined text-[18px]">edit</span> Edit Data
                                </button>
                                <button className="w-full text-left px-4 py-2 hover:bg-surface-container-high text-sm font-bold flex items-center gap-3 text-on-surface-variant" onClick={() => { setSelectedPatientForAudit(patient); setIsAuditModalOpen(true); setActiveMenuId(null); }}>
                                  <span className="material-symbols-outlined text-[18px]">history</span> Riwayat Audit
                                </button>
                                <button className="w-full text-left px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-sm font-bold flex items-center gap-3 text-purple-600 dark:text-purple-400" onClick={() => { setSelectedPatientForMerge(patient); setIsMergeModalOpen(true); setActiveMenuId(null); }}>
                                  <span className="material-symbols-outlined text-[18px]">call_merge</span> Merger Rekam Medis
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── MOBILE CARD VIEW (Visible on Small Screens) ─── */}
      <div className="mobile-only pb-10">
        {loading ? (
          <div className="py-12 text-center text-on-surface-variant animate-pulse font-bold">{t('patients_v2.table.syncing')}</div>
        ) : filteredPatients.length === 0 ? (
          <div className="py-12 text-center text-on-surface-variant bg-surface-container-low rounded-3xl border border-dashed border-outline-variant">
             <span className="material-symbols-outlined text-4xl opacity-20 block mb-2">person_search</span>
             {t('patients_v2.table.no_records_match', { term: searchTerm })}
          </div>
        ) : (
          <div className="patient-card-list">
            {filteredPatients.map(p => (
              <div key={p.id} className="patient-card">
                <div className="patient-card-header">
                  <div className="patient-card-identity">
                    <span className="text-[10px] font-black text-primary tracking-widest uppercase">{p.mrn || t('patients_v2.table.mrn_pending')}</span>
                    <h3 className="text-lg font-black text-on-surface leading-tight">{p.name || t('common.unidentified')}</h3>
                    <span className="text-[10px] font-mono opacity-60">{t('patient_form.nik')}: {p.nik || '--'}</span>
                  </div>
                  <span className={`w-12 h-12 rounded-2xl flex-row items-center justify-center font-black text-sm shadow-sm ${p.demographics?.gender === 'F' || p.demographics?.gender === 'Perempuan' ? 'bg-pink-100 text-pink-600' : p.demographics?.gender === 'U' ? 'bg-surface-variant text-on-surface-variant' : 'bg-primary/10 text-primary'}`}>
                    {p.demographics?.gender === 'F' || p.demographics?.gender === 'Perempuan' ? 'F' : p.demographics?.gender === 'U' ? '?' : 'M'}
                  </span>
                </div>

                <div className="patient-card-meta">
                   <div className="meta-item">
                     <span className="material-symbols-outlined text-sm">event</span>
                     {p.demographics?.dob ? `${calculateAge(p.demographics.dob)} ${t('common.years')}` : '--'}
                   </div>
                   <div className="meta-item">
                     <span className="material-symbols-outlined text-sm">family_restroom</span>
                     {p.demographics?.marital_status ? t('patient_form.marital_options.' + p.demographics.marital_status.toLowerCase(), { defaultValue: p.demographics.marital_status }) : t('patient_form.marital_options.single')}
                   </div>
                   <div className="meta-item">
                     <span className={`chip text-[9px] px-2 ${String(p.insurance?.type || 'UMUM').toUpperCase().includes('BPJS') ? 'chip-info' : String(p.insurance?.type || 'UMUM').toUpperCase() === 'UMUM' ? 'chip-success' : 'chip-warning'}`}>
                       {(p.insurance?.type || 'UMUM').toUpperCase()}
                     </span>
                   </div>
                   <div className="meta-item">
                     <span className="material-symbols-outlined text-sm text-primary">medical_services</span>
                     <span className="truncate max-w-[120px]">
                       {(!p.primary_physician?.name || p.primary_physician?.name === 'Dr. Unassigned') 
                         ? getRandomDoctor(p.id) 
                         : p.primary_physician.name}
                     </span>
                   </div>
                </div>

                <div className="flex-row gap-2 mt-4">
                  {p.safety_flags?.allergy_risk && (
                    <div className="bg-error text-white px-2 py-0.5 rounded text-[9px] font-black uppercase">{t('patients_v2.safety.allergy')}</div>
                  )}
                  {p.safety_flags?.fall_risk && (
                    <div className="bg-warning text-white px-2 py-0.5 rounded text-[9px] font-black uppercase animate-pulse">{t('patients_v2.safety.fall_risk')}</div>
                  )}
                </div>

                <div className="patient-card-actions">
                  <div className="action-menu-container w-full">
                    <button 
                      className="btn-primary w-full justify-between" 
                      onClick={(e) => toggleMenu(e, p.id)}
                    >
                      <div className="flex-row items-center gap-2">
                        <span className="material-symbols-outlined">menu_open</span>
                        {t('patients_v2.table.actions')}
                      </div>
                      <span className="material-symbols-outlined">expand_more</span>
                    </button>

                    {activeMenuId === p.id && (
                      <div className="action-menu-dropdown !left-0 !right-0 !bottom-full !top-auto mb-2 !w-full">
                        <button className="action-menu-item" onClick={() => { handleViewEMR(p.id, p.name); setActiveMenuId(null); }}>
                          <span className="material-symbols-outlined text-primary">clinical_notes</span>
                          <span>{t('patients_v2.actions.view_emr')}</span>
                        </button>
                        <button className="action-menu-item" onClick={() => { handleAdmit(p.id, p.name || t('common.unidentified')); setActiveMenuId(null); }}>
                          <span className="material-symbols-outlined text-error">emergency</span>
                          <span>{t('patients_v2.actions.admit')}</span>
                        </button>
                        <div className="border-t border-outline-variant/30 my-1"></div>
                        <button className="action-menu-item" onClick={() => { handleEditPatient(p); setActiveMenuId(null); }}>
                          <span className="material-symbols-outlined">edit</span>
                          <span>{t('patients_v2.actions.edit')}</span>
                        </button>
                        <button className="action-menu-item" onClick={() => { toast.success('Audit Log Feature Coming Soon'); setActiveMenuId(null); }}>
                          <span className="material-symbols-outlined">history</span>
                          <span>{t('patients_v2.actions.history') || 'Riwayat Audit'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── JCI Multi-Step Registration Wizard ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200/50 dark:border-white/5 animate-in slide-in-from-bottom-8 duration-500">
            {/* ─── EMR Header ─── */}
            <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm">
                  <UserPlus size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-black tracking-widest uppercase border border-orange-200 dark:border-orange-500/30 flex items-center gap-1">
                      <ShieldCheck size={12} /> IPSG Standard
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase">
                      Langkah {currentStep} dari 6 ({Math.round((currentStep / 6) * 100)}%)
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    {isEditing ? t('patients_v2.wizard.title_edit') || 'Edit Data Pasien' : t('patients_v2.wizard.title')}
                  </h3>
                </div>
              </div>
              
              <button 
                type="button" 
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-error/10 hover:text-error transition-all border border-slate-200 dark:border-white/10 shadow-xs"
                onClick={() => setIsModalOpen(false)}
              >
                <ArrowRight size={20} className="rotate-180" />
              </button>
            </div>

            {/* ─── Quick Presets Bar ─── */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-2.5 bg-primary/5 dark:bg-primary/10 border-b border-primary/10 text-xs font-bold">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-[11px]">
                <Zap size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
                Quick-Fill Demo Presets:
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => applyPreset('wni')} 
                  className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary text-slate-700 dark:text-slate-300 font-extrabold text-[11px] transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                >
                  🇮🇩 WNI Umum
                </button>
                <button 
                  type="button" 
                  onClick={() => applyPreset('bpjs')} 
                  className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-500 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                >
                  🟢 BPJS Emergency
                </button>
                <button 
                  type="button" 
                  onClick={() => applyPreset('wna')} 
                  className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 hover:border-purple-500 text-purple-700 dark:text-purple-300 font-extrabold text-[11px] transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                >
                  ✈️ WNA Asuransi
                </button>
              </div>
            </div>

            {/* ─── Interactive Glassmorphic Stepper ─── */}
            <div className="px-6 sm:px-12 pt-6 pb-4 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full z-0"></div>
                <div 
                  className="absolute left-4 top-4 -translate-y-1/2 h-1.5 bg-gradient-to-r from-primary to-emerald-500 rounded-full z-0 transition-all duration-500 ease-out shadow-sm" 
                  style={{ width: `calc(${((currentStep - 1) / 5) * 100}% - 2rem)` }}
                ></div>
                
                {[
                  { step: 1, label: '1. Identitas' },
                  { step: 2, label: '2. Demografi' },
                  { step: 3, label: '3. Wali' },
                  { step: 4, label: '4. Penjamin' },
                  { step: 5, label: '5. Medis' },
                  { step: 6, label: '6. Review & Legal' }
                ].map(({ step: s, label }) => (
                  <button 
                    key={s} 
                    type="button"
                    onClick={() => setCurrentStep(s)}
                    className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black transition-all duration-300 ${
                      currentStep === s 
                        ? 'bg-primary text-white ring-[6px] ring-primary/20 scale-110 shadow-lg shadow-primary/30' 
                        : currentStep > s 
                          ? 'bg-emerald-500 text-white shadow-md hover:scale-105' 
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    }`}>
                      {currentStep > s ? <CheckCircle2 size={18} strokeWidth={3} /> : s}
                    </div>
                    <span className={`text-[11px] font-bold mt-1.5 transition-colors ${
                      currentStep === s 
                        ? 'text-primary dark:text-primary-light font-black' 
                        : currentStep > s 
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'
                    }`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRegister} className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
              <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-6">
              {/* STEP 1: IDENTITAS UTAMA (IPSG 1) */}
              {currentStep === 1 && (
                <div className="flex-column gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      {t('patients_v2.wizard.step1')}
                    </h4>
                  </div>
                  <div className="grid-3">
                    <div className="col-span-1">
                      <label className="metric-label mb-2 block">{t('patient_form.title') || 'Gelar/Sapaan'}</label>
                      <select className="form-input" value={form.title} onChange={e => updateField('title', e.target.value)}>
                        <option value="Tn">Tn. (Tuan)</option>
                        <option value="Ny">Ny. (Nyonya)</option>
                        <option value="Nn">Nn. (Nona)</option>
                        <option value="An">An. (Anak)</option>
                        <option value="By">By. (Bayi)</option>
                        <option value="dr">dr. (Dokter)</option>
                        <option value="Prof">Prof.</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="metric-label mb-2 block">{t('patient_form.name')}</label>
                      <input required className="form-input" value={form.name} onChange={e => updateField('name', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.nik')}</label>
                      <input required className="form-input font-mono tracking-widest" value={form.nik} onChange={e => updateField('nik', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.passport') || 'No. Paspor / KITAS'}</label>
                      <input className="form-input font-mono tracking-widest" value={form.passport_no} onChange={e => updateField('passport_no', e.target.value)} placeholder="Opsional (WNA)" />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.pob')}</label>
                      <input className="form-input" value={form.pob} onChange={e => updateField('pob', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.dob')}</label>
                      <input required type="date" className="form-input" value={form.dob} onChange={e => updateField('dob', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.gender')}</label>
                      <select className="form-input" value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                        <option value="M">{t('patient_form.gender_m')}</option>
                        <option value="F">{t('patient_form.gender_f')}</option>
                        <option value="U">{t('patient_form.gender_u')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.religion') || 'Agama'}</label>
                      <select className="form-input" value={form.religion} onChange={e => updateField('religion', e.target.value)}>
                        <option value="islam">Islam</option>
                        <option value="kristen">Kristen Protestan</option>
                        <option value="katolik">Katolik</option>
                        <option value="hindu">Hindu</option>
                        <option value="buddha">Buddha</option>
                        <option value="konghucu">Konghucu</option>
                        <option value="other">Lainnya</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid-3">
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.nationality')}</label>
                      <input className="form-input" value={form.nationality} onChange={e => updateField('nationality', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.ethnicity') || 'Suku/Ras'}</label>
                      <input className="form-input" value={form.ethnicity} onChange={e => updateField('ethnicity', e.target.value)} placeholder="Contoh: Jawa, Melayu" />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.marital_status')}</label>
                      <select className="form-input" value={form.marital_status} onChange={e => updateField('marital_status', e.target.value)}>
                        <option value="single">{t('patient_form.marital_options.single')}</option>
                        <option value="married">{t('patient_form.marital_options.married')}</option>
                        <option value="divorced">{t('patient_form.marital_options.divorced')}</option>
                        <option value="widowed">{t('patient_form.marital_options.widowed')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DEMOGRAFI & KOMUNIKASI */}
              {currentStep === 2 && (
                <div className="flex-column gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Smartphone size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      {t('patients_v2.wizard.step2')}
                    </h4>
                  </div>
                  <div>
                    <label className="metric-label mb-2">{t('patient_form.address')}</label>
                    <textarea className="form-input" value={form.address} onChange={e => updateField('address', e.target.value)} rows="2" placeholder="Nama Jalan, RT/RW, Kelurahan" />
                  </div>
                  <div className="grid-3">
                    <div>
                      <label className="metric-label mb-2">{t('patient_form.city') || 'Kota/Kabupaten'}</label>
                      <input className="form-input" value={form.city} onChange={e => updateField('city', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2">{t('patient_form.province') || 'Provinsi'}</label>
                      <input className="form-input" value={form.province} onChange={e => updateField('province', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2">{t('patient_form.postal_code') || 'Kode Pos'}</label>
                      <input className="form-input" value={form.postal_code} onChange={e => updateField('postal_code', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2">{t('patient_form.phone')}</label>
                      <input className="form-input" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2">{t('patient_form.email') || 'Email'}</label>
                      <input type="email" className="form-input" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="email@contoh.com" />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2">{t('patient_form.occupation')}</label>
                      <input className="form-input" value={form.occupation} onChange={e => updateField('occupation', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2">{t('patient_form.education')}</label>
                      <select className="form-input" value={form.education} onChange={e => updateField('education', e.target.value)}>
                        <option value="sd">{t('patient_form.education_options.sd')}</option>
                        <option value="smp">{t('patient_form.education_options.smp')}</option>
                        <option value="sma">{t('patient_form.education_options.sma')}</option>
                        <option value="d3">{t('patient_form.education_options.d3')}</option>
                        <option value="s1">{t('patient_form.education_options.s1')}</option>
                        <option value="s2_s3">{t('patient_form.education_options.s2_s3')}</option>
                        <option value="none">{t('patient_form.education_options.none')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2">{t('patient_form.preferred_lang')}</label>
                      <input className="form-input" value={form.preferred_language} onChange={e => updateField('preferred_language', e.target.value)} />
                    </div>
                    <div className="flex-row items-center gap-2 mt-6">
                      <input type="checkbox" id="interpreter" checked={form.interpreter_needed} onChange={e => updateField('interpreter_needed', e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" />
                      <label htmlFor="interpreter" className="text-[13px] font-bold cursor-pointer">{t('patient_form.interpreter')}</label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: WALI & PENANGGUNG JAWAB */}
              {currentStep === 3 && (
                <div className="flex-column gap-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <UserPlus size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      {t('patients_v2.wizard.step3')}
                    </h4>
                  </div>
                  
                  {/* Kontak Darurat (Emergency) */}
                  <div className="p-5 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/60 shadow-2xs">
                    <p className="text-[11px] font-black uppercase text-primary mb-3 tracking-widest">{t('patient_form.emergency_contact')}</p>
                    <div className="grid-2 gap-4">
                      <div>
                        <label className="metric-label mb-2">{t('patient_form.emergency_name')}</label>
                        <input className="form-input" value={form.emergency_name} onChange={e => updateField('emergency_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="metric-label mb-2">{t('patient_form.relationship')}</label>
                        <input className="form-input" value={form.relationship} onChange={e => updateField('relationship', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid-2 gap-4 mt-4">
                      <div>
                        <label className="metric-label mb-2">{t('patient_form.emergency_phone')}</label>
                        <input className="form-input" value={form.emergency_phone} onChange={e => updateField('emergency_phone', e.target.value)} />
                      </div>
                      <div>
                        <label className="metric-label mb-2">{t('patient_form.emergency_address') || 'Alamat Darurat'}</label>
                        <input className="form-input" value={form.emergency_address} onChange={e => updateField('emergency_address', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Keluarga Terdekat (Next of Kin) */}
                  <div className="p-5 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/60 shadow-2xs mt-6">
                    <p className="text-[11px] font-black uppercase text-indigo-600 mb-3 tracking-widest">{t('patient_form.next_of_kin') || 'Keluarga Terdekat (Next of Kin)'}</p>
                    <div className="grid-2 gap-4">
                      <div>
                        <label className="metric-label mb-2">{t('patient_form.kin_name') || 'Nama Keluarga Terdekat'}</label>
                        <input className="form-input" value={form.kin_name} onChange={e => updateField('kin_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="metric-label mb-2">{t('patient_form.kin_relation') || 'Hubungan'}</label>
                        <input className="form-input" value={form.kin_relation} onChange={e => updateField('kin_relation', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Penanggung Jawab (Guarantor) */}
                  <div className="p-5 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/60 shadow-2xs mt-6">
                    <p className="text-[11px] font-black uppercase text-secondary mb-3 tracking-widest">{t('patient_form.guarantor')}</p>
                    <div className="grid-2 gap-4">
                      <div>
                        <label className="metric-label mb-2">{t('patient_form.guarantor_name')}</label>
                        <input className="form-input" value={form.guarantor_name} onChange={e => updateField('guarantor_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="metric-label mb-2">{t('patient_form.guarantor_phone')}</label>
                        <input className="form-input" value={form.guarantor_phone} onChange={e => updateField('guarantor_phone', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: DATA ASURANSI */}
              {currentStep === 4 && (
                <div className="flex-column gap-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CreditCard size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      {t('patients_v2.wizard.sections.insurance')}
                    </h4>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2">{t('patients_v2.wizard.fields.guarantor_type')}</label>
                      <select className="form-input" value={form.insurance_type} onChange={e => updateField('insurance_type', e.target.value)}>
                        <option value="UMUM">{t('patient_form.insurance_types.umum')}</option>
                        <option value="BPJS KESEHATAN">{t('patient_form.insurance_types.bpjs')}</option>
                        <option value="ASURANSI SWASTA">{t('patient_form.insurance_types.swasta')}</option>
                        <option value="CORPORATE">{t('patient_form.insurance_types.corporate')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2">{t('patients_v2.wizard.fields.payment_pref') || 'Preferensi Pembayaran'}</label>
                      <select className="form-input" value={form.payment_preference} onChange={e => updateField('payment_preference', e.target.value)}>
                        <option value="cash">Tunai / Transfer</option>
                        <option value="credit_card">Kartu Kredit / Debit</option>
                        <option value="insurance">Asuransi / BPJS</option>
                      </select>
                    </div>
                  </div>
                  
                  {form.insurance_type !== 'UMUM' && (
                    <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/30 mt-6 shadow-2xs">
                      <div className="grid-2 gap-4">
                        <div className="col-span-2">
                          <label className="metric-label mb-2">{t('patients_v2.wizard.fields.insurance_group') || 'Grup Asuransi / Perusahaan'}</label>
                          <input className="form-input bg-white dark:bg-slate-950" value={form.insurance_group} onChange={e => updateField('insurance_group', e.target.value)} placeholder="Contoh: Mandiri Inhealth, Admedika" />
                        </div>
                        <div>
                          <label className="metric-label mb-2">{t('patients_v2.wizard.fields.card_number')}</label>
                          <input className="form-input bg-white dark:bg-slate-950" value={form.insurance_no} onChange={e => updateField('insurance_no', e.target.value)} placeholder={t('patients_v2.wizard.fields.card_number_placeholder')} />
                        </div>
                        <div>
                          <label className="metric-label mb-2">{t('patients_v2.wizard.fields.insurance_valid') || 'Masa Berlaku (Valid Thru)'}</label>
                          <input type="date" className="form-input bg-white dark:bg-slate-950" value={form.insurance_valid_thru} onChange={e => updateField('insurance_valid_thru', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: MEDIS & SAFETY */}
              {currentStep === 5 && (
                <div className="flex-column gap-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                      <Activity size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      {t('patients_v2.wizard.sections.safety')}
                    </h4>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2">{t('patients_v2.wizard.fields.blood_type')}</label>
                      <select className="form-input" value={form.blood_type} onChange={e => updateField('blood_type', e.target.value)}>
                        {['a', 'b', 'ab', 'o', 'unknown'].map(bt => (
                          <option key={bt} value={bt.toUpperCase()}>{t('patient_form.blood_types.' + bt)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2">{t('patients_v2.wizard.fields.dpjp')}</label>
                      <select className="form-input" value={form.primary_physician_id} onChange={e => updateField('primary_physician_id', e.target.value)}>
                        <option value="">{t('patient_form.select_doctor')}</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid-2 gap-4">
                    <div>
                      <label className="metric-label mb-2">{t('patients_v2.wizard.fields.allergy_history')}</label>
                      <input className="form-input" value={form.allergies} onChange={e => updateField('allergies', e.target.value)} placeholder={t('patients_v2.wizard.fields.allergy_placeholder')} />
                    </div>
                    <div>
                      <label className="metric-label mb-2">{t('patients_v2.wizard.fields.disability') || 'Kebutuhan Khusus / Disabilitas'}</label>
                      <input className="form-input" value={form.disability} onChange={e => updateField('disability', e.target.value)} placeholder="Misal: Tunanetra, Kursi Roda" />
                    </div>
                  </div>

                  <div>
                    <label className="metric-label mb-2">{t('patients_v2.wizard.fields.infectious') || 'Kewaspadaan Penyakit Menular'}</label>
                    <input className="form-input" value={form.infectious_disease} onChange={e => updateField('infectious_disease', e.target.value)} placeholder="Kosongkan jika tidak ada. Misal: TBC, MRSA, Hepatitis" />
                  </div>

                  <div className="grid-2 gap-4 mt-6">
                    <div className="flex-row items-start gap-4 p-5 bg-error-container/20 rounded-2xl border-2 border-error/20">
                      <div className="bg-error text-white p-2 rounded-full shadow-sm">
                        <span className="material-symbols-outlined text-sm">warning</span>
                      </div>
                      <div>
                        <label className="text-[13px] font-black text-error block mb-2">{t('patients_v2.wizard.fields.fall_risk_title')}</label>
                        <div className="flex-row items-center gap-3">
                          <input type="checkbox" id="fall" checked={form.fall_risk} onChange={e => updateField('fall_risk', e.target.checked)} className="cursor-pointer w-4 h-4 rounded border-error text-error focus:ring-error" />
                          <label htmlFor="fall" className="text-[13px] font-bold text-on-surface cursor-pointer opacity-90">{t('patients_v2.wizard.fields.fall_risk_desc')}</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-row items-start gap-4 p-5 bg-orange-500/10 rounded-2xl border-2 border-orange-500/20">
                      <div className="bg-orange-500 text-white p-2 rounded-full shadow-sm flex items-center justify-center w-8 h-8">
                        <span className="material-symbols-outlined text-sm">settings_input_hdmi</span>
                      </div>
                      <div>
                        <label className="text-[13px] font-black text-orange-600 dark:text-orange-400 block mb-2">{t('patients_v2.wizard.fields.pacemaker') || 'Risiko Implan / MRI'}</label>
                        <div className="flex-row items-center gap-3">
                          <input type="checkbox" id="pacemaker" checked={form.implant_pacemaker} onChange={e => updateField('implant_pacemaker', e.target.checked)} className="cursor-pointer w-4 h-4 rounded border-orange-500 text-orange-500 focus:ring-orange-500" />
                          <label htmlFor="pacemaker" className="text-[13px] font-bold text-on-surface cursor-pointer opacity-90">{t('patients_v2.wizard.fields.pacemaker_desc')}</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: HAK PASIEN & LEGAL */}
              {currentStep === 6 && (
                <div className="flex-column gap-6 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-3 mb-2 pb-4 border-b border-slate-100 dark:border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      {t('patients_v2.wizard.sections.rights')}
                    </h4>
                  </div>
                  {/* Executive Pre-Submission Summary Card */}
                  <div className="p-5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                      <div className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-xs">
                        <Sparkles size={16} className="text-amber-500 fill-amber-500" />
                        Executive Pre-Submission Review (Ringkasan Data Pasien)
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">Periksa kembali data sebelum finalisasi</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Step 1 Summary */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-white/5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                            <span>1. Identitas Utama</span>
                            <button type="button" onClick={() => setCurrentStep(1)} className="text-primary hover:underline flex items-center gap-0.5"><Edit2 size={10} /> Ubah</button>
                          </div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">{form.title}. {form.name || '(Belum Diisi)'}</p>
                          <p className="text-slate-500">NIK: <span className="font-mono">{form.nik || form.passport_no || '-'}</span> | {form.gender === 'M' ? 'Laki-laki' : form.gender === 'F' ? 'Perempuan' : 'Lainnya'}</p>
                        </div>
                      </div>

                      {/* Step 2 Summary */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-white/5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                            <span>2. Demografi & Kontak</span>
                            <button type="button" onClick={() => setCurrentStep(2)} className="text-primary hover:underline flex items-center gap-0.5"><Edit2 size={10} /> Ubah</button>
                          </div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">{form.phone || '(No. HP Kosong)'}</p>
                          <p className="text-slate-500 truncate">{form.address ? `${form.address}, ${form.city}` : 'Alamat belum diisi'}</p>
                        </div>
                      </div>

                      {/* Step 3 Summary */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-white/5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                            <span>3. Wali / Emergency</span>
                            <button type="button" onClick={() => setCurrentStep(3)} className="text-primary hover:underline flex items-center gap-0.5"><Edit2 size={10} /> Ubah</button>
                          </div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">{form.emergency_name || '(Tidak ada)'}</p>
                          <p className="text-slate-500">{form.relationship} | <span className="font-mono">{form.emergency_phone || '-'}</span></p>
                        </div>
                      </div>

                      {/* Step 4 Summary */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-white/5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                            <span>4. Penjamin & Billing</span>
                            <button type="button" onClick={() => setCurrentStep(4)} className="text-primary hover:underline flex items-center gap-0.5"><Edit2 size={10} /> Ubah</button>
                          </div>
                          <p className="font-extrabold text-emerald-600 dark:text-emerald-400">{form.insurance_type} {form.insurance_group ? `(${form.insurance_group})` : ''}</p>
                          <p className="text-slate-500">No. Kartu: <span className="font-mono">{form.insurance_no || '-'}</span></p>
                        </div>
                      </div>

                      {/* Step 5 Summary */}
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-white/5 col-span-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">
                            <span>5. Skrining Medis & Safety (IPSG)</span>
                            <button type="button" onClick={() => setCurrentStep(5)} className="text-primary hover:underline flex items-center gap-0.5"><Edit2 size={10} /> Ubah</button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 font-black">GolDarah: {form.blood_type.toUpperCase()}</span>
                            <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold">Alergi: {form.allergies || 'TIDAK ADA'}</span>
                            {form.fall_risk && <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-black">⚠️ RISIKO JATUH</span>}
                            {form.implant_pacemaker && <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-black">⚡ PACEMAKER/IMPLAN</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2">{t('patients_v2.wizard.fields.privacy')}</label>
                      <select className="form-input" value={form.privacy_level} onChange={e => updateField('privacy_level', e.target.value)}>
                        {['standard', 'vip', 'anonymous'].map(opt => (
                          <option key={opt} value={opt.toUpperCase()}>{t(`patients_v2.wizard.fields.privacy_options.${opt}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2">{t('patients_v2.wizard.fields.spiritual')}</label>
                      <textarea className="form-input" value={form.spiritual_needs} onChange={e => updateField('spiritual_needs', e.target.value)} rows="1" placeholder={t('patients_v2.wizard.fields.spiritual_placeholder')} />
                    </div>
                  </div>

                  <div className="grid-2 gap-4 mt-6">
                    <div className="p-4 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex-row items-center justify-between">
                        <label htmlFor="dnr" className="text-[13px] font-bold opacity-90 cursor-pointer">{t('patients_v2.wizard.fields.dnr')}</label>
                        <input type="checkbox" id="dnr" checked={form.dnr_status} onChange={e => updateField('dnr_status', e.target.checked)} className="cursor-pointer w-4 h-4 rounded text-red-500 focus:ring-red-500" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{t('patients_v2.wizard.fields.dnr_desc')}</p>
                    </div>
                    <div className="p-4 border-2 border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex-row items-center justify-between">
                        <label htmlFor="organ" className="text-[13px] font-bold opacity-90 cursor-pointer">{t('patients_v2.wizard.fields.organ_donor')}</label>
                        <input type="checkbox" id="organ" checked={form.organ_donor} onChange={e => updateField('organ_donor', e.target.checked)} className="cursor-pointer w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500" />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border-2 border-primary/20 rounded-2xl bg-primary-container/10 mt-6">
                    <div className="flex-column gap-3">
                      <div className="flex-row items-start gap-3">
                        <input type="checkbox" id="data_release" checked={form.data_release} onChange={e => updateField('data_release', e.target.checked)} className="cursor-pointer w-4 h-4 mt-0.5 rounded border-primary text-primary focus:ring-primary" />
                        <label htmlFor="data_release" className="text-[13px] leading-relaxed font-bold opacity-90 cursor-pointer">
                          {t('patients_v2.wizard.fields.data_release_desc')}
                        </label>
                      </div>
                      <div className="flex-row items-start gap-3 border-t border-primary/10 pt-3">
                        <input type="checkbox" id="consent" checked={form.consent} onChange={e => updateField('consent', e.target.checked)} required className="cursor-pointer w-4 h-4 mt-0.5 rounded border-primary text-primary focus:ring-primary" />
                        <label htmlFor="consent" className="text-[13px] leading-relaxed font-bold opacity-90 cursor-pointer">
                          {t('patients_v2.wizard.consent_label')}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              </div>
            </form>
            
            {/* ─── EMR Footer Buttons ─── */}
            <div className="flex items-center justify-between p-6 sm:px-8 sm:py-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/50 dark:border-white/5">
              {currentStep > 1 ? (
                <button type="button" className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-2" onClick={() => setCurrentStep(prev => prev - 1)}>
                  <ArrowRight size={18} className="rotate-180" /> {t('patients_v2.wizard.back')}
                </button>
              ) : (
                <button type="button" className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2" onClick={() => setIsModalOpen(false)}>
                  <span className="material-symbols-outlined text-[20px]">cancel</span> {t('patients_v2.wizard.cancel')}
                </button>
              )}
              
              {currentStep < 6 ? (
                <button type="button" className="px-8 py-2.5 rounded-xl bg-primary text-white font-black hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/30" onClick={() => setCurrentStep(prev => prev + 1)}>
                  {t('patients_v2.wizard.next', { next: currentStep + 1 })} <ArrowRight size={18} />
                </button>
              ) : (
                <button type="submit" className="px-8 py-2.5 rounded-xl bg-emerald-500 text-white font-black hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 size={18} /> {isEditing ? t('patients_v2.wizard.save_changes') || 'Simpan Perubahan' : t('patients_v2.wizard.finalize')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Admission Modal (Direct to Triage) ─── */}
      {isAdmitModalOpen && (
        <AdmissionModal 
          patient={selectedPatientForAdmit}
          onClose={() => setIsAdmitModalOpen(false)}
          currentUser={currentUser}
          doctors={doctors}
          onSuccess={(name) => {
            setIsAdmitModalOpen(false);
            toast.success(t('patients_v2.admission.success_alert', { name }));
            navigate('/triage');
          }}
        />
      )}

      {/* ─── Audit Trail Modal ─── */}
      {isAuditModalOpen && (
        <AuditTrailModal 
          patient={selectedPatientForAudit}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      {/* ─── MPI Record Merge Modal ─── */}
      {isMergeModalOpen && (
        <MergePatientModal 
          sourcePatient={selectedPatientForMerge}
          patients={patients}
          currentUser={currentUser}
          onClose={() => setIsMergeModalOpen(false)}
          onSuccess={() => {
            setIsMergeModalOpen(false);
            fetchPatients();
          }}
        />
      )}
    </div>
  );
}

/**
 * Isolated Admission Modal to prevent Parent Re-renders (Performance Fix)
 */
function AdmissionModal({ patient, onClose, currentUser, doctors, onSuccess }) {
  const { t } = useTranslation();
  const { setLiveContext } = useEncounterStore();
  const [form, setForm] = useState({
    type: ENCOUNTER_TYPES.EMERGENCY,
    reason: '',
    ward: 'IGD'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const encounterId = await createEncounter({
        patientId: patient.id,
        encounterType: form.type,
        chiefComplaint: form.reason,
        admittingDoctor: doctors.find(d => d.id === patient.id)?.name || null,
        nurseInCharge: currentUser?.displayName || currentUser?.email || t('patients_v2.admission.nurse_staff'),
        ward: form.ward,
        createdBy: currentUser?.email || 'system'
      });

      setLiveContext(patient.id, encounterId);

      await logAudit({
        action: AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.ENCOUNTERS,
        resource_id: encounterId,
        delta: { patientName: patient.name, reason: form.reason },
        reason: 'NEW_ENCOUNTER_ADMISSION'
      });

      onSuccess(patient.name);
    } catch (err) {
      toast.error(`${t('patients_v2.admission.fail')}${err.message}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card !max-w-[500px]">
         <div className="flex-row items-center justify-between mb-10 gap-6">
            <div className="flex-column">
              <h3 className="text-2xl font-black tracking-tighter leading-none">{t('patients_v2.admission.title')}</h3>
              <p className="text-xs text-on-surface-variant font-bold mt-1 opacity-70">{t('patients_v2.admission.subtitle')}</p>
            </div>
            <button className="w-12 h-12 rounded-xl flex-row items-center justify-center bg-surface-container-high hover:bg-primary-container hover:text-primary transition-all" onClick={onClose}>
              <span className="material-symbols-outlined !text-2xl">close</span>
            </button>
         </div>

         <form onSubmit={handleSubmit} className="flex-column gap-8">
            <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant overflow-hidden">
              <span className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest block mb-1 opacity-60">{t('patients_v2.admission.selected_patient')}</span>
              <p className="text-xl font-black text-primary break-words">{patient.name}</p>
              <p className="text-[10px] text-on-surface-variant font-bold mt-1 opacity-50">MRN: {patient.mrn} • {t('patients_v2.admission.insurance_active')}</p>
            </div>

            <div className="flex-column gap-6">
              <div className="grid-2">
                 <div>
                    <label className="metric-label">{t('patients_v2.admission.service_type')}</label>
                    <select className="form-input" value={form.type} onChange={e => setForm(prev => ({...prev, type: e.target.value}))}>
                       {Object.values(ENCOUNTER_TYPES).map(et => (
                         <option key={et} value={et}>{t('encounter.types.' + et.toLowerCase())}</option>
                       ))}
                    </select>
                 </div>
                 <div>
                    <label className="metric-label">{t('patients_v2.admission.ward')}</label>
                    <select className="form-input" value={form.ward} onChange={e => setForm(prev => ({...prev, ward: e.target.value}))}>
                       {['igd', 'poli_umum', 'poli_spesialis', 'ward_a'].map(w => (
                         <option key={w} value={w.toUpperCase()}>{t('patients_v2.admission.wards.' + w)}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div>
                 <label className="metric-label">{t('patients_v2.admission.reason')}</label>
                 <textarea 
                   required
                   autoFocus
                   className="form-input" 
                   rows="4" 
                   placeholder={t('patients_v2.admission.reason_placeholder')}
                   value={form.reason}
                   onChange={e => setForm(prev => ({...prev, reason: e.target.value}))}
                 />
              </div>
            </div>

            <div className="flex-row gap-3 pt-6 border-t border-outline-variant">
               <button type="button" className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
               <button type="submit" className="btn-primary flex-[1.5]">
                  <span className="material-symbols-outlined mr-1">check_circle</span>
                  {t('patients_v2.admission.btn_process')}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}

/**
 * MPI Patient Record Merge Modal (Standard Deduplication & Relinking)
 */
function MergePatientModal({ sourcePatient, patients, currentUser, onClose, onSuccess }) {
  const [targetSearch, setTargetSearch] = useState('');
  const [targetPatientId, setTargetPatientId] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [merging, setMerging] = useState(false);

  const potentialTargets = patients.filter(p => 
    p.id !== sourcePatient?.id && 
    p.status !== 'MERGED' &&
    (!targetSearch || 
      p.name?.toLowerCase().includes(targetSearch.toLowerCase()) || 
      p.mrn?.toLowerCase().includes(targetSearch.toLowerCase()) ||
      p.demographics?.nik?.includes(targetSearch))
  );

  const handleMerge = async (e) => {
    e.preventDefault();
    if (!targetPatientId) {
      toast.error('Pilih pasien master utama terlebih dahulu!');
      return;
    }
    if (!consentChecked) {
      toast.error('Centang konfirmasi keabsahan dokumen legal terlebih dahulu!');
      return;
    }

    setMerging(true);
    try {
      const targetPatient = patients.find(p => p.id === targetPatientId);

      // 1. Relink Encounters associated with sourcePatient to targetPatientId
      const q1 = query(collection(db, COLLECTIONS.ENCOUNTERS), where('patient_id', '==', sourcePatient.id));
      const q2 = query(collection(db, COLLECTIONS.ENCOUNTERS), where('patientId', '==', sourcePatient.id));
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const uniqueDocs = new Map();
      [...snap1.docs, ...snap2.docs].forEach(d => uniqueDocs.set(d.id, d));

      const updatePromises = Array.from(uniqueDocs.values()).map(docSnap => 
        updateDoc(doc(db, COLLECTIONS.ENCOUNTERS, docSnap.id), {
          patient_id: targetPatientId,
          patientId: targetPatientId,
          mergedFromPatientId: sourcePatient.id,
          mergedFromMrn: sourcePatient.mrn || 'TEMP',
          mergedAt: serverTimestamp()
        })
      );
      await Promise.all(updatePromises);

      // 2. Soft-delete / Update source patient status to MERGED
      await updateDoc(doc(db, COLLECTIONS.PATIENTS, sourcePatient.id), {
        status: 'MERGED',
        mergedIntoId: targetPatientId,
        mergedIntoMrn: targetPatient?.mrn || 'MASTER',
        mergedAt: serverTimestamp(),
        mergedBy: currentUser?.email || 'system'
      });

      // 3. Log Audit Trail
      await logAudit({
        action: AUDIT_ACTIONS.UPDATE,
        resource_type: COLLECTIONS.PATIENTS,
        resource_id: targetPatientId,
        delta: { 
          sourcePatientName: sourcePatient.name, 
          sourceMrn: sourcePatient.mrn,
          targetPatientName: targetPatient?.name,
          targetMrn: targetPatient?.mrn,
          encountersTransferred: snap.docs.length
        },
        reason: 'MPI_PATIENT_RECORD_MERGE'
      });

      toast.success(`Berhasil Menggabungkan Rekam Medis ${sourcePatient.name} ke ${targetPatient?.name}!`);
      onSuccess();
    } catch (err) {
      toast.error(`Gagal melakukan merger data: ${err.message}`);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-950 w-full max-w-3xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-white/10 animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:px-8 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-sm">
              <span className="material-symbols-outlined text-2xl">call_merge</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-widest">
                  MPI Deduplication Tool
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                Merger Rekam Medis (MPI Record Merge)
              </h3>
            </div>
          </div>
          <button 
            type="button" 
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-500 hover:text-error transition-all border border-slate-200 dark:border-white/10"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleMerge} className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Source Patient (Mr. X) */}
            <div className="p-5 bg-orange-50/60 dark:bg-orange-950/20 rounded-2xl border-2 border-orange-200 dark:border-orange-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-orange-500 text-white font-black text-[10px] uppercase tracking-wider">
                  Pasien Temporer / Mr. X
                </span>
                <span className="text-[10px] font-mono text-orange-700 dark:text-orange-400 font-bold">SOURCE</span>
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-800 dark:text-slate-100">{sourcePatient?.name}</h4>
                <p className="text-slate-500 font-mono">No. RM: {sourcePatient?.mrn || 'TEMP'}</p>
                <p className="text-slate-500 mt-1">NIK/Paspor: {sourcePatient?.demographics?.nik || sourcePatient?.demographics?.passport_no || 'Belum Terdaftar'}</p>
                <p className="text-slate-500">Gender: {sourcePatient?.demographics?.gender === 'M' ? 'Laki-laki' : 'Perempuan'}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-orange-200/60 dark:border-orange-900/40 text-[11px] text-orange-800 dark:text-orange-300 space-y-1">
                <p className="font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">info</span> Data Yang Akan Dipindahkan:</p>
                <ul className="list-disc list-inside opacity-90 space-y-0.5 pl-1">
                  <li>Seluruh Riwayat Kunjungan / Encounters</li>
                  <li>Catatan Medis & Tanda Vital (Vitals)</li>
                  <li>Order Laboratorium & Resep Obat</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Target Master Patient */}
            <div className="p-5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/40 space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider">
                  Pasien Utama (Master Record)
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">TARGET</span>
              </div>

              <div>
                <label className="metric-label mb-1.5 block">Cari Pasien Utama (Master MPI):</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input 
                    type="text" 
                    className="form-input pl-9 text-xs" 
                    placeholder="Ketik Nama / NIK / No. RM Master..." 
                    value={targetSearch}
                    onChange={e => setTargetSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Target List */}
              <div className="flex-1 max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {potentialTargets.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 italic">Tidak ada pasien lain yang cocok.</p>
                ) : (
                  potentialTargets.map(target => (
                    <label 
                      key={target.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        targetPatientId === target.id 
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:border-emerald-400'
                      }`}
                    >
                      <div>
                        <p className="font-extrabold text-xs">{target.name}</p>
                        <p className={`text-[10px] font-mono ${targetPatientId === target.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                          RM: {target.mrn} | NIK: {target.demographics?.nik || '-'}
                        </p>
                      </div>
                      <input 
                        type="radio" 
                        name="targetPatient" 
                        checked={targetPatientId === target.id}
                        onChange={() => setTargetPatientId(target.id)}
                        className="w-4 h-4 text-emerald-600 cursor-pointer"
                      />
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Legal Consent Checkbox */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 flex items-start gap-3">
            <input 
              type="checkbox" 
              id="merge_consent"
              checked={consentChecked}
              onChange={e => setConsentChecked(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="merge_consent" className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed cursor-pointer">
              Saya mengonfirmasi keabsahan verifikasi identitas dan menyetujui penggabungan rekam medis pasien darurat di atas secara permanen sesuai standar akreditasi JCI / Permenkes RI.
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={merging}>
              Batal
            </button>
            <button 
              type="submit" 
              disabled={merging || !targetPatientId || !consentChecked}
              className="px-8 py-2.5 rounded-xl bg-purple-600 text-white font-black hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <span className="material-symbols-outlined text-lg">call_merge</span>
              {merging ? 'Menggabungkan Data...' : 'Eksekusi Merger Rekam Medis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
