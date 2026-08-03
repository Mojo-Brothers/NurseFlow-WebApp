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
  Fingerprint
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
  name: '', nik: '', dob: '', gender: 'M', pob: '', 
  nationality: 'WNI', marital_status: 'single',
  // Step 2: Kontak & Demografi
  address: '', religion: 'islam', phone: '', 
  education: 'sma', occupation: 'Private',
  preferred_language: 'id', interpreter_needed: false,
  // Step 3: Penanggung Jawab / Wali
  emergency_name: '', emergency_phone: '', relationship: 'family',
  guarantor_name: '', guarantor_phone: '',
  // Step 4: Asuransi & Billing
  insurance_type: 'umum', insurance_no: '',
  // Step 5: Medis & Safety (IPSG 6)
  blood_type: 'o', allergies: '', fall_risk: false, 
  primary_physician_id: '',
  // Step 6: Hak Pasien & Spiritual (PFR)
  privacy_level: 'STANDARD', spiritual_needs: '', consent: false
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

  // ─── Local State: Unified Form Data (Super Complete JCI Standard) ───
  const [form, setForm] = useState(initialFormState);
  
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
  
  // ─── Audit Trail State ───
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedPatientForAudit, setSelectedPatientForAudit] = useState(null);

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
    if (a.is_demo && !b.is_demo) return -1;
    if (!a.is_demo && b.is_demo) return 1;
    if (activeFilters.sortBy === 'RECENT') {
      const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || a.registered_at || 0);
      const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || b.registered_at || 0);
      return dateB - dateA;
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
      gender: patient.demographics?.gender || 'M',
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

      {/* ─── UNIFIED PREMIUM CARD GRID ─── */}
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
                    <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase">{patient.demographics?.gender === 'M' ? 'Laki-laki' : 'Perempuan'} • {patient.demographics?.dob ? `${calculateAge(patient.demographics.dob)} Thn` : '--'}</span>
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
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 pl-3">
                <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/50">Asuransi</span>
                  <span className="text-xs font-bold truncate text-on-surface">{patient.insurance?.type || 'UMUM'}</span>
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
                  <strong className="font-bold text-on-surface-variant">Keluhan:</strong> {patient.medical_summary?.chief_complaint || patient.clinical_baseline?.allergies?.[0] || 'Kunjungan Rutin'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

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
                  <span className={`w-12 h-12 rounded-2xl flex-row items-center justify-center font-black text-sm shadow-sm ${(!p.demographics?.gender || p.demographics?.gender === 'M' || p.demographics?.gender === 'Laki-laki') ? 'bg-primary/10 text-primary' : 'bg-pink-100 text-pink-600'}`}>
                    {(!p.demographics?.gender || p.demographics?.gender === 'M' || p.demographics?.gender === 'Laki-laki') ? 'M' : 'F'}
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
                     <span className={`chip text-[9px] px-2 ${p.insurance?.type === 'BPJS KESEHATAN' ? 'chip-info' : p.insurance?.type === 'UMUM' ? 'chip-success' : 'chip-warning'}`}>
                       {p.insurance?.type || 'UMUM'}
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
        <div className="modal-overlay">
          <div className="modal-content card !max-w-[95vw] sm:!max-w-[650px]">
            <div className="flex-row items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl">{isEditing ? t('patients_v2.wizard.title_edit') || 'Edit Data Pasien' : t('patients_v2.wizard.title')}</h3>
                <span className="text-sm font-bold text-on-surface-variant">{t('patients_v2.wizard.step', { current: currentStep })}</span>
              </div>
              <button 
                type="button" 
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex-row items-center justify-center transition-colors text-on-surface-variant"
                onClick={() => setIsModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="wizard-stepper">
              {[1, 2, 3, 4, 5, 6].map(s => (
                <div key={s} className={`step-item ${currentStep === s ? 'active' : currentStep > s ? 'completed' : ''}`}>
                  <div className="step-indicator">{currentStep > s ? '✓' : s}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleRegister}>
              {/* STEP 1: IDENTITAS UTAMA (IPSG 1) */}
              {currentStep === 1 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">{t('patient_form.emergency_contact')}</p>
                  <div>
                    <label className="metric-label mb-2 block">{t('patient_form.name')}</label>
                    <input required className="form-input" value={form.name} onChange={e => updateField('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="metric-label mb-2 block">{t('patient_form.nik')}</label>
                    <input required className="form-input" value={form.nik} onChange={e => updateField('nik', e.target.value)} />
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
                  <div className="grid-3">
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.gender')}</label>
                      <select className="form-input" value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                        <option value="M">{t('patient_form.gender_m')}</option>
                        <option value="F">{t('patient_form.gender_f')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.nationality')}</label>
                      <input className="form-input" value={form.nationality} onChange={e => updateField('nationality', e.target.value)} />
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
                <div className="flex-column gap-4">
                  <p className="section-divider">{t('patients_v2.wizard.step2')}</p>
                  <div>
                    <label className="metric-label mb-2 block">{t('patient_form.address')}</label>
                    <textarea className="form-input" value={form.address} onChange={e => updateField('address', e.target.value)} rows="2" />
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.occupation')}</label>
                      <input className="form-input" value={form.occupation} onChange={e => updateField('occupation', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">{t('patient_form.education')}</label>
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
                      <label className="metric-label mb-2 block">{t('patient_form.preferred_lang')}</label>
                      <input className="form-input" value={form.preferred_language} onChange={e => updateField('preferred_language', e.target.value)} />
                    </div>
                    <div className="flex-row items-center gap-2 mt-6">
                      <input type="checkbox" id="interpreter" checked={form.interpreter_needed} onChange={e => updateField('interpreter_needed', e.target.checked)} />
                      <label htmlFor="interpreter" className="text-xs font-bold">{t('patient_form.interpreter')}</label>
                    </div>
                  </div>
                  <div>
                    <label className="metric-label mb-2 block">{t('patient_form.phone')}</label>
                    <input className="form-input" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 3: WALI & PENANGGUNG JAWAB */}
              {currentStep === 3 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">{t('patients_v2.wizard.step3')}</p>
                  <div className="p-4 bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                    <p className="text-[10px] font-black uppercase text-primary mb-3">{t('patient_form.emergency_contact')}</p>
                    <div className="grid-2 gap-4">
                      <div>
                        <label className="metric-label mb-1 block">{t('patient_form.emergency_name')}</label>
                        <input className="form-input" value={form.emergency_name} onChange={e => updateField('emergency_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="metric-label mb-1 block">{t('patient_form.relationship')}</label>
                        <input className="form-input" value={form.relationship} onChange={e => updateField('relationship', e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="metric-label mb-1 block">{t('patient_form.emergency_phone')}</label>
                      <input className="form-input" value={form.emergency_phone} onChange={e => updateField('emergency_phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                    <p className="text-[10px] font-black uppercase text-secondary mb-3">{t('patient_form.guarantor')}</p>
                    <div className="grid-2 gap-4">
                      <div>
                        <label className="metric-label mb-1 block">{t('patient_form.guarantor_name')}</label>
                        <input className="form-input" value={form.guarantor_name} onChange={e => updateField('guarantor_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="metric-label mb-1 block">{t('patient_form.guarantor_phone')}</label>
                        <input className="form-input" value={form.guarantor_phone} onChange={e => updateField('guarantor_phone', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: DATA ASURANSI */}
              {currentStep === 4 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">{t('patients_v2.wizard.sections.insurance')}</p>
                  <div>
                    <label className="metric-label">{t('patients_v2.wizard.fields.guarantor_type')}</label>
                    <select className="form-input" value={form.insurance_type} onChange={e => updateField('insurance_type', e.target.value)}>
                      <option value="UMUM">{t('patient_form.insurance_types.umum')}</option>
                      <option value="BPJS KESEHATAN">{t('patient_form.insurance_types.bpjs')}</option>
                      <option value="ASURANSI SWASTA">{t('patient_form.insurance_types.swasta')}</option>
                      <option value="CORPORATE">{t('patient_form.insurance_types.corporate')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="metric-label">{t('patients_v2.wizard.fields.card_number')}</label>
                    <input className="form-input" value={form.insurance_no} onChange={e => updateField('insurance_no', e.target.value)} placeholder={t('patients_v2.wizard.fields.card_number_placeholder')} />
                  </div>
                </div>
              )}

              {/* STEP 5: MEDIS & SAFETY */}
              {currentStep === 5 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">{t('patients_v2.wizard.sections.safety')}</p>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label">{t('patients_v2.wizard.fields.blood_type')}</label>
                      <select className="form-input" value={form.blood_type} onChange={e => updateField('blood_type', e.target.value)}>
                        {['a', 'b', 'ab', 'o', 'unknown'].map(bt => (
                          <option key={bt} value={bt.toUpperCase()}>{t('patient_form.blood_types.' + bt)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="metric-label">{t('patients_v2.wizard.fields.dpjp')}</label>
                      <select className="form-input" value={form.primary_physician_id} onChange={e => updateField('primary_physician_id', e.target.value)}>
                        <option value="">{t('patient_form.select_doctor')}</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="metric-label">{t('patients_v2.wizard.fields.allergy_history')}</label>
                    <input className="form-input" value={form.allergies} onChange={e => updateField('allergies', e.target.value)} placeholder={t('patients_v2.wizard.fields.allergy_placeholder')} />
                  </div>

                  <div className="flex-row items-start gap-4 p-4 bg-error-container/20 rounded-xl border border-error/20 mt-4">
                    <div className="bg-error text-white p-2 rounded-full">
                      <span className="material-symbols-outlined text-sm">warning</span>
                    </div>
                    <div>
                      <label className="text-sm font-black text-error block mb-1">{t('patients_v2.wizard.fields.fall_risk_title')}</label>
                      <div className="flex-row items-center gap-2">
                        <input type="checkbox" id="fall" checked={form.fall_risk} onChange={e => updateField('fall_risk', e.target.checked)} />
                        <label htmlFor="fall" className="text-xs font-bold text-on-surface">{t('patients_v2.wizard.fields.fall_risk_desc')}</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: HAK PASIEN & LEGAL */}
              {currentStep === 6 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">{t('patients_v2.wizard.sections.rights')}</p>
                  <div>
                    <label className="text-[10px] font-black uppercase text-on-surface-variant mb-2 block">{t('patients_v2.wizard.fields.privacy')}</label>
                    <select className="form-input text-xs" value={form.privacy_level} onChange={e => updateField('privacy_level', e.target.value)}>
                      {['standard', 'vip', 'anonymous'].map(opt => (
                        <option key={opt} value={opt.toUpperCase()}>{t(`patients_v2.wizard.fields.privacy_options.${opt}`)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-on-surface-variant mb-2 block">{t('patients_v2.wizard.fields.spiritual')}</label>
                    <textarea className="form-input" value={form.spiritual_needs} onChange={e => updateField('spiritual_needs', e.target.value)} rows="2" placeholder={t('patients_v2.wizard.fields.spiritual_placeholder')} />
                  </div>

                  <div className="p-5 border-2 border-primary/20 rounded-2xl bg-primary-container/5 mt-4">
                    <div className="flex-row items-start gap-3">
                      <input type="checkbox" id="consent" checked={form.consent} onChange={e => updateField('consent', e.target.checked)} required style={{ marginTop: '4px' }} />
                      <label htmlFor="consent" className="text-xs leading-relaxed font-medium">
                        {t('patients_v2.wizard.consent_label')}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-row justify-between mt-8 pt-4 border-t">
                {currentStep > 1 ? (
                  <button type="button" className="btn-ghost" onClick={() => setCurrentStep(prev => prev - 1)}>{t('patients_v2.wizard.back')}</button>
                ) : (
                  <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>{t('patients_v2.wizard.cancel')}</button>
                )
                }
                
                {currentStep < 6 ? (
                  <button type="button" className="btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>
                    {t('patients_v2.wizard.next', { next: currentStep + 1 })}
                  </button>
                ) : (
                  <button type="submit" className="btn-primary">{isEditing ? t('patients_v2.wizard.save_changes') || 'Simpan Perubahan' : t('patients_v2.wizard.finalize')}</button>
                )}
              </div>
            </form>
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
