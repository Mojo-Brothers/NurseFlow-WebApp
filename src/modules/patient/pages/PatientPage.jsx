import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePatientStore } from '../patient.store.js';
import { useNavigate } from 'react-router-dom';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { createEncounter } from '../../encounter/services/encounter.service.js';
import { logAudit } from '../../../core/services/audit.service.js';
import { AUDIT_ACTIONS, COLLECTIONS } from '../../../core/constants.js';
import '../styles/Patients.css';

export default function PatientPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { patients, isLoading: loading, fetchPatients, addPatient, selectPatient } = usePatientStore();
  const { setLiveContext } = useEncounterStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // ─── Local State: Unified Form Data (Super Complete JCI Standard) ───
  const [form, setForm] = useState({
    // Step 1: Identitas Utama (IPSG 1)
    name: '', nik: '', dob: '', gender: 'M', pob: '', 
    nationality: 'WNI', marital_status: 'Belum Kawin',
    // Step 2: Kontak & Demografi
    address: '', religion: 'Islam', phone: '', 
    education: 'SMA', occupation: 'Swasta',
    preferred_language: 'Indonesia', interpreter_needed: false,
    // Step 3: Penanggung Jawab / Wali
    emergency_name: '', emergency_phone: '', relationship: 'Keluarga',
    guarantor_name: '', guarantor_phone: '',
    // Step 4: Asuransi & Billing
    insurance_type: 'UMUM', insurance_no: '',
    // Step 5: Medis & Safety (IPSG 6)
    blood_type: 'O', allergies: '', fall_risk: false, 
    // Step 6: Hak Pasien & Spiritual (PFR)
    privacy_level: 'STANDARD', spiritual_needs: '', consent: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  
  // ─── Filter & Intelligence States (Modern 2026) ───
  const [activeFilters, setActiveFilters] = useState({
    insurance: 'ALL',
    safety: 'ALL',
    sortBy: 'RECENT'
  });

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // ─── Smart Filter Logic (Performance Optimized) ───
  const filteredPatients = patients.filter(p => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                         p.name?.toLowerCase().includes(s) || 
                         p.mrn?.toLowerCase().includes(s) || 
                         p.nik?.includes(s);
    
    const matchesInsurance = activeFilters.insurance === 'ALL' || p.insurance?.type === activeFilters.insurance;
    
    const matchesSafety = activeFilters.safety === 'ALL' || 
                         (activeFilters.safety === 'ALLERGY' && p.safety_flags?.allergy_risk) ||
                         (activeFilters.safety === 'FALL_RISK' && p.safety_flags?.fall_risk);
    
    return matchesSearch && matchesInsurance && matchesSafety;
  }).sort((a, b) => {
    if (activeFilters.sortBy === 'RECENT') return new Date(b.createdAt) - new Date(a.createdAt);
    if (activeFilters.sortBy === 'NAME') return a.name.localeCompare(b.name);
    return 0;
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.consent) return alert('Mohon setujui General Consent (JCI Policy).');

    try {
      await addPatient(
        { 
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
        },
        'system'
      );
      setIsModalOpen(false);
      setCurrentStep(1);
    } catch (error) {
      alert('Gagal: ' + error.message);
    }
  };

  const handleAdmit = async (patientId, patientName) => {
    const reason = prompt(`Alasan Admisi untuk ${patientName}:`, 'Pemeriksaan Rutin');
    if (!reason) return;

    try {
      // 1. Create Encounter (Architecture Step)
      const encounterId = await createEncounter({
        patientId,
        encounterType: 'EMERGENCY',
        chiefComplaint: reason,
        nurseInCharge: 'Nurse Robby',
        ward: 'IGD',
        createdBy: 'system'
      });

      // 2. Set Global Clinical Context (The Highway)
      setLiveContext(patientId, encounterId);

      // 3. JCI Audit Trail (Compliance)
      await logAudit({
        action: AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.ENCOUNTERS,
        resource_id: encounterId,
        delta: { patientName, reason },
        reason: 'NEW_ENCOUNTER_ADMISSION'
      });

      // 4. Auto-Transition (Seamless Flow)
      alert(`Pasien ${patientName} berhasil di-admit. Menuju modul Triage...`);
      navigate('/triage');
    } catch (err) {
      alert('Gagal admisi: ' + err.message);
    }
  };

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
    navigate('/emr');
  };

  return (
    <div className="patients-container p-6 lg:p-10 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-on-surface leading-tight">{t('patients_v2.title')}</h2>
          <p className="text-on-surface-variant text-sm mt-1 font-medium">{t('patients_v2.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="search-wrapper w-full sm:w-80">
            <span className="material-symbols-outlined search-icon" style={{ fontSize: '1.2rem' }}>search</span>
            <input 
              type="text" 
              placeholder={t('patients_v2.search_placeholder')} 
              className="form-input has-icon w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary w-full sm:w-auto" onClick={() => { setIsModalOpen(true); setCurrentStep(1); }}>
            <span className="material-symbols-outlined icon-small mr-2" style={{verticalAlign: 'bottom'}}>person_add</span>
            {t('patients_v2.btn_new')}
          </button>
        </div>
      </div>

      {/* ─── Premium Intelligence Filter Bar ─── */}
      <div className="flex-row gap-6 mb-8 items-center bg-surface-container-low p-4 rounded-3xl border border-outline-variant/30 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex-row gap-2 items-center shrink-0">
          <span className="material-symbols-outlined text-sm opacity-40 ml-2">filter_list</span>
          <span className="text-[10px] font-black uppercase opacity-40 px-2 tracking-widest">Insurance</span>
          <div className="flex-row gap-1">
            {['ALL', 'UMUM', 'BPJS KESEHATAN', 'ASURANSI SWASTA'].map(type => (
              <button 
                key={type}
                className={`filter-pill ${activeFilters.insurance === type ? 'active' : ''}`}
                onClick={() => setActiveFilters(prev => ({ ...prev, insurance: type }))}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        
        <div className="w-[1px] h-6 bg-outline-variant/50 shrink-0"></div>
        
        <div className="flex-row gap-2 items-center shrink-0">
          <span className="text-[10px] font-black uppercase opacity-40 px-2 tracking-widest">Clinical Safety</span>
          <div className="flex-row gap-1">
            {['ALL', 'ALLERGY', 'FALL_RISK'].map(risk => (
              <button 
                key={risk}
                className={`filter-pill ${activeFilters.safety === risk ? 'active' : ''}`}
                onClick={() => setActiveFilters(prev => ({ ...prev, safety: risk }))}
              >
                {risk === 'ALL' ? 'Show All' : risk.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex-row gap-2 items-center shrink-0">
          <span className="text-[10px] font-black uppercase opacity-40 px-2 tracking-widest">Sort By</span>
          <select 
            className="bg-transparent border-none text-xs font-bold text-primary focus:outline-none cursor-pointer"
            value={activeFilters.sortBy}
            onChange={e => setActiveFilters(prev => ({ ...prev, sortBy: e.target.value }))}
          >
            <option value="RECENT">Recently Added</option>
            <option value="NAME">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              <th className="py-4 px-6">{t('patients_v2.table.identity')}</th>
              <th className="py-4 px-6">{t('patients_v2.table.bio')}</th>
              <th className="py-4 px-6">{t('patients_v2.table.safety')}</th>
              <th className="py-4 px-6">{t('patients_v2.table.insurance')}</th>
              <th className="py-4 px-6 text-center">{t('patients_v2.table.reg_date')}</th>
              <th className="py-4 px-6 text-right">{t('patients_v2.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="py-8 text-center text-on-surface-variant animate-pulse">Synchronizing with Clinical Backend...</td></tr>
            ) : filteredPatients.length === 0 ? (
              <tr><td colSpan="6" className="py-8 text-center text-on-surface-variant">No records found matching "{searchTerm}".</td></tr>
            ) : (
              filteredPatients.map(p => (
                <tr key={p.id} className="border-b hover-bg-surface transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex-column">
                      <p className="text-[10px] font-black text-primary mb-0.5 tracking-wider">{p.mrn || 'MRN-UNASSIGNED'}</p>
                      <p className="font-black text-base text-on-surface group-hover:text-primary transition-colors leading-tight">
                        {p.name || <span className="text-error uppercase">UNIDENTIFIED PATIENT</span>}
                      </p>
                      <div className="flex-row gap-3 mt-1.5 opacity-80">
                        <span className="text-[10px] font-mono bg-surface-container px-1.5 py-0.5 rounded">NIK: {p.nik || 'Not Registered'}</span>
                        <span className="text-[10px] font-bold text-secondary">DOB: {p.demographics?.dob || 'Unknown'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex-row items-center gap-3">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[12px] shadow-sm ${(!p.demographics?.gender || p.demographics?.gender === 'M' || p.demographics?.gender === 'Laki-laki') ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-pink-100 text-pink-600 border border-pink-200'}`}>
                        {(!p.demographics?.gender || p.demographics?.gender === 'M' || p.demographics?.gender === 'Laki-laki') ? 'M' : 'F'}
                      </span>
                      <div className="flex-column">
                        <span className="font-black text-sm">{p.demographics?.dob ? calculateAge(p.demographics.dob) : '--'} Yrs</span>
                        <span className="text-[10px] opacity-60 uppercase font-black tracking-widest">{p.demographics?.marital_status || 'Single'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex-row gap-2 flex-wrap">
                      {p.safety_flags?.allergy_risk ? (
                        <div className="flex-row items-center gap-1 bg-error text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">warning</span> Alergi
                        </div>
                      ) : (
                        <div className="bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-md text-[10px] font-black uppercase border border-outline-variant/30">No Allergy</div>
                      )}
                      {p.safety_flags?.fall_risk ? (
                        <div className="flex-row items-center gap-1 bg-warning text-white px-2.5 py-1 rounded-md text-[10px] font-black uppercase shadow-sm animate-pulse">
                          <span className="material-symbols-outlined text-[14px]">potted_plant</span> Fall Risk
                        </div>
                      ) : (
                        <div className="bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded-md text-[10px] font-black uppercase border border-outline-variant/30">Stable</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex-column gap-1.5">
                      <span className={`chip text-[10px] px-2 py-0.5 ${p.insurance?.type === 'BPJS KESEHATAN' ? 'chip-info' : p.insurance?.type === 'UMUM' ? 'chip-success' : 'chip-warning'}`}>
                        {p.insurance?.type || 'UMUM'}
                      </span>
                      <div className="flex-row items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-primary">medical_services</span>
                        <span className="text-[11px] font-bold text-on-surface-variant">
                          {p.primary_physician?.name || 'Dr. Unassigned'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex-column items-center">
                      <span className="text-xs font-black text-on-surface">{p.registered_at ? new Date(p.registered_at.seconds * 1000).toLocaleDateString() : 'Today'}</span>
                      <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">Registered</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex-row gap-2 justify-end items-center">
                      <button className="btn-primary rounded-xl px-3 py-2 flex-row items-center gap-1.5 shadow-md hover:shadow-lg transition-all" onClick={() => handleAdmit(p.id, p.name || 'Unidentified Patient')} title="Admission">
                        <span className="material-symbols-outlined text-[16px]">emergency</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Admit</span>
                      </button>
                      <button className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-white transition-all flex items-center justify-center shadow-sm" onClick={() => handleViewEMR(p.id, p.mrn)} title="View EMR">
                        <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── JCI Multi-Step Registration Wizard ─── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card !max-w-[95vw] sm:!max-w-[650px]">
            <div className="flex-row justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-xl">{t('patients_v2.wizard.title')}</h3>
                <span className="text-sm font-bold text-on-surface-variant">{t('patients_v2.wizard.step', { current: currentStep })}</span>
              </div>
              <button 
                type="button" 
                className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center transition-colors text-on-surface-variant"
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
                  <p className="section-divider">Identitas Utama (IPSG 1 Compliance)</p>
                  <div>
                    <label className="metric-label mb-2 block">NAMA LENGKAP (SESUAI IDENTITAS)</label>
                    <input required className="form-input" value={form.name} onChange={e => updateField('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="metric-label mb-2 block">NIK / PASSPORT / ID NUMBER</label>
                    <input required className="form-input" value={form.nik} onChange={e => updateField('nik', e.target.value)} />
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">TEMPAT LAHIR</label>
                      <input className="form-input" value={form.pob} onChange={e => updateField('pob', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">TANGGAL LAHIR</label>
                      <input required type="date" className="form-input" value={form.dob} onChange={e => updateField('dob', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div>
                      <label className="metric-label mb-2 block">GENDER</label>
                      <select className="form-input" value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                        <option value="M">Laki-laki</option>
                        <option value="F">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">KEWARGANEGARAAN</label>
                      <input className="form-input" value={form.nationality} onChange={e => updateField('nationality', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">STATUS KAWIN</label>
                      <select className="form-input" value={form.marital_status} onChange={e => updateField('marital_status', e.target.value)}>
                        <option>Belum Kawin</option><option>Kawin</option><option>Cerai Hidup</option><option>Cerai Mati</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DEMOGRAFI & KOMUNIKASI */}
              {currentStep === 2 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Demografi & Preferensi Komunikasi (PFR Standard)</p>
                  <div>
                    <label className="metric-label mb-2 block">ALAMAT DOMISILI LENGKAP</label>
                    <textarea className="form-input" value={form.address} onChange={e => updateField('address', e.target.value)} rows="2" />
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">PEKERJAAN</label>
                      <input className="form-input" value={form.occupation} onChange={e => updateField('occupation', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">PENDIDIKAN TERAKHIR</label>
                      <select className="form-input" value={form.education} onChange={e => updateField('education', e.target.value)}>
                        <option>SD</option><option>SMP</option><option>SMA</option><option>D3</option><option>S1</option><option>S2/S3</option><option>Tidak Sekolah</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">BAHASA SEHARI-HARI</label>
                      <input className="form-input" value={form.preferred_language} onChange={e => updateField('preferred_language', e.target.value)} />
                    </div>
                    <div className="flex-row items-center gap-2 mt-6">
                      <input type="checkbox" id="interpreter" checked={form.interpreter_needed} onChange={e => updateField('interpreter_needed', e.target.checked)} />
                      <label htmlFor="interpreter" className="text-xs font-bold">Butuh Penerjemah?</label>
                    </div>
                  </div>
                  <div>
                    <label className="metric-label mb-2 block">NOMOR TELEPON AKTIF</label>
                    <input className="form-input" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 3: WALI & PENANGGUNG JAWAB */}
              {currentStep === 3 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Kontak Darurat & Penanggung Jawab</p>
                  <div className="p-4 bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                    <p className="text-[10px] font-black uppercase text-primary mb-3">Kontak Darurat (Emergency Contact)</p>
                    <div className="grid-2 gap-4">
                      <div>
                        <label className="metric-label mb-1 block">NAMA KONTAK</label>
                        <input className="form-input" value={form.emergency_name} onChange={e => updateField('emergency_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="metric-label mb-1 block">HUBUNGAN</label>
                        <input className="form-input" value={form.relationship} onChange={e => updateField('relationship', e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="metric-label mb-1 block">HP KONTAK DARURAT</label>
                      <input className="form-input" value={form.emergency_phone} onChange={e => updateField('emergency_phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="p-4 bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                    <p className="text-[10px] font-black uppercase text-secondary mb-3">Penanggung Jawab Biaya (Guarantor)</p>
                    <div className="grid-2 gap-4">
                      <div>
                        <label className="metric-label mb-1 block">NAMA PENANGGUNG JAWAB</label>
                        <input className="form-input" value={form.guarantor_name} onChange={e => updateField('guarantor_name', e.target.value)} />
                      </div>
                      <div>
                        <label className="metric-label mb-1 block">HP PENANGGUNG JAWAB</label>
                        <input className="form-input" value={form.guarantor_phone} onChange={e => updateField('guarantor_phone', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: DATA ASURANSI */}
              {currentStep === 4 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Data Penjamin / Asuransi</p>
                  <div>
                    <label className="metric-label mb-2 block">JENIS PENJAMIN</label>
                    <select className="form-input" value={form.insurance_type} onChange={e => updateField('insurance_type', e.target.value)}>
                      <option>UMUM</option>
                      <option>BPJS KESEHATAN</option>
                      <option>ASURANSI SWASTA</option>
                      <option>CORPORATE</option>
                    </select>
                  </div>
                  <div>
                    <label className="metric-label mb-2 block">NOMOR KARTU / POLIS / SEP</label>
                    <input className="form-input" value={form.insurance_no} onChange={e => updateField('insurance_no', e.target.value)} placeholder="Contoh: 000123456789" />
                  </div>
                </div>
              )}

              {/* STEP 5: MEDIS & SAFETY */}
              {currentStep === 5 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Screening Klinis & Safety (IPSG)</p>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">GOLONGAN DARAH</label>
                      <select className="form-input" value={form.blood_type} onChange={e => updateField('blood_type', e.target.value)}>
                        <option>A</option><option>B</option><option>AB</option><option>O</option><option>Tidak Tahu</option>
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">RIWAYAT ALERGI (OBAT/MAKANAN)</label>
                      <input className="form-input" value={form.allergies} onChange={e => updateField('allergies', e.target.value)} placeholder="Tulis 'TIDAK ADA' jika nihil" />
                    </div>
                  </div>

                  <div className="flex-row items-start gap-4 p-4 bg-error-container/20 rounded-xl border border-error/20 mt-4">
                    <div className="bg-error text-white p-2 rounded-full">
                      <span className="material-symbols-outlined text-sm">warning</span>
                    </div>
                    <div>
                      <label className="text-sm font-black text-error block mb-1">IPSG 6: RISIKO JATUH</label>
                      <div className="flex-row items-center gap-2">
                        <input type="checkbox" id="fall" checked={form.fall_risk} onChange={e => updateField('fall_risk', e.target.checked)} />
                        <label htmlFor="fall" className="text-xs font-bold text-on-surface">Pasien memiliki risiko jatuh tinggi / butuh bantuan alat jalan</label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: HAK PASIEN & LEGAL */}
              {currentStep === 6 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Hak Pasien (PFR) & Persetujuan Umum</p>
                  <div>
                    <label className="text-[10px] font-black uppercase text-on-surface-variant mb-2 block">Privacy Preference (JCI PFR.1)</label>
                    <select className="form-input text-xs" value={form.privacy_level} onChange={e => updateField('privacy_level', e.target.value)}>
                      <option value="STANDARD">Standard Privacy (Dapat dikunjungi)</option>
                      <option value="VIP">VIP Status (Nama tidak muncul di monitor publik)</option>
                      <option value="ANONYMOUS">Anonymous / High Security (Kerahasiaan Total)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-on-surface-variant mb-2 block">Kebutuhan Khusus / Spiritual (Misal: Doa Khusus)</label>
                    <textarea className="form-input" value={form.spiritual_needs} onChange={e => updateField('spiritual_needs', e.target.value)} rows="2" placeholder="Kosongkan jika tidak ada" />
                  </div>

                  <div className="p-5 border-2 border-primary/20 rounded-2xl bg-primary-container/5 mt-4">
                    <div className="flex-row items-start gap-3">
                      <input type="checkbox" id="consent" checked={form.consent} onChange={e => updateField('consent', e.target.checked)} required style={{ marginTop: '4px' }} />
                      <label htmlFor="consent" className="text-xs leading-relaxed font-medium">
                        <strong>PERSETUJUAN UMUM (GENERAL CONSENT):</strong> Dengan menandatangani secara digital, saya memahami hak dan kewajiban saya sebagai pasien, menyetujui asuhan medis sesuai standar RS, dan mengizinkan penggunaan data medis saya untuk kepentingan klinis & asuransi sesuai standar akreditasi JCI/KARS.
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-row justify-between mt-8 pt-4 border-t">
                {currentStep > 1 ? (
                  <button type="button" className="btn-ghost" onClick={() => setCurrentStep(prev => prev - 1)}>Kembali</button>
                ) : (
                  <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                )}
                
                {currentStep < 6 ? (
                  <button type="button" className="btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>Lanjut Step {currentStep + 1}</button>
                ) : (
                  <button type="submit" className="btn-primary">Finalize & Register</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
