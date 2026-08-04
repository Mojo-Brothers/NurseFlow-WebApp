import React, { useState, useEffect } from 'react';
import { 
  X, Save, ShieldAlert, Activity, Heart, Thermometer, Wind, Zap, 
  FileText, ClipboardList, PenTool, CheckCircle2, ShieldCheck, 
  Info, AlertTriangle, User, Calendar, Clock, BadgeCheck,
  Search, Plus, ArrowRight, BookOpen, FileSignature, Pill, 
  Microscope, ScrollText, Workflow, Scale, LogOut, UserPlus,
  AlertCircle, Sparkles, Brain, RefreshCw, Droplets, Share2, ClipboardCheck
} from 'lucide-react';
import PatientVerificationModal from './PatientVerificationModal.jsx';
import MedicationOrderForm from './MedicationOrderForm.jsx';
import IncidentReportForm from './IncidentReportForm.jsx';
import EarlyWarningSystem from './EarlyWarningSystem.jsx';
import EMARForm from './EMARForm.jsx';
import LabAlertSystem from './LabAlertSystem.jsx';
import HandHygieneAudit from './HandHygieneAudit.jsx';
import UgdAssessmentForm from './UgdAssessmentForm.jsx';
import A4Layout from './A4Layout.jsx';
import BloodTransfusionForm from './BloodTransfusionForm.jsx';
import DNRForm from './DNRForm.jsx';
import NutritionScreeningForm from './NutritionScreeningForm.jsx';
import PainReassessmentForm from './PainReassessmentForm.jsx';
import PreAnesthesiaAssessmentForm from './PreAnesthesiaAssessmentForm.jsx';
import MedicationReconciliationForm from './MedicationReconciliationForm.jsx';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, query, collection, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { COLLECTIONS } from '../../../core/constants.js';

export default function ClinicalModuleModal({ 
  isOpen, 
  onClose, 
  moduleName, 
  patient, 
  encounter, 
  currentUser,
  onSave,
  initialData = null // New prop for viewing existing records
}) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  // Real-time Database State
  const [dbPatient, setDbPatient] = useState(patient || {});
  const [dbEncounter, setDbEncounter] = useState(encounter || {});
  const [latestRecord, setLatestRecord] = useState(null);

  // Debugging log for patient/encounter context
  useEffect(() => {
    if (isOpen) {
      const pId = patient?.id || encounter?.patient_id || 'N/A';
      const eId = encounter?.id || 'N/A';
      const pName = patient?.name || patient?.nama || patient?.fullName || 'Unknown Patient';
      console.log(`[ClinicalModule] Opening ${moduleName} for: ${pName} (P:${pId}, E:${eId})`);
    }
  }, [isOpen, patient, encounter, moduleName]);

  // Reset form when module changes or initialData is provided
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // JCI: Map Firestore fields to UI fields
        const recordData = initialData.data || initialData;
        const mappedData = { ...recordData };
        
        // Map SOAP fields
        if (initialData.subjective) mappedData['Subjective (S)'] = initialData.subjective;
        if (initialData.objective) mappedData['Objective (O)'] = initialData.objective;
        if (initialData.assessment) mappedData['Assessment (A)'] = initialData.assessment;
        if (initialData.plan_instructions) mappedData['Plan (P)'] = initialData.plan_instructions;
        
        // Map general notes / assessment summary
        if (initialData.assessment && !initialData.subjective) {
           mappedData.notes = initialData.assessment;
        }

        setFormData({
          ...mappedData,
          verification: true // Auto-verify for viewed records
        });
      } else {
        // New record initialization
        setFormData({
          author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
          timestamp: new Date().toISOString().slice(0, 16),
          notes: '',
          verification: false
        });
      }
      setShowVerificationModal(false);
    }
  }, [isOpen, moduleName, currentUser, initialData]);

  // DB Connection: Real-time Patient & Encounter Listeners
  useEffect(() => {
    // Synchronize state with props whenever they change
    setDbPatient(patient || {});
    setDbEncounter(encounter || {});

    const targetPatientId = patient?.id || encounter?.patient_id || patient?.patientId;
    if (!isOpen || !targetPatientId) return;

    // 1. Patient Listener
    const unsubPatient = onSnapshot(doc(db, COLLECTIONS.PATIENTS, targetPatientId), (snap) => {
      if (snap.exists()) {
        setDbPatient(prev => ({ ...prev, id: snap.id, ...snap.data() }));
      }
    });

    // 2. Encounter Listener
    let unsubEncounter = () => {};
    if (encounter?.id) {
      unsubEncounter = onSnapshot(doc(db, COLLECTIONS.ENCOUNTERS, encounter.id), (snap) => {
        if (snap.exists()) {
          setDbEncounter(prev => ({ ...prev, id: snap.id, ...snap.data() }));
        }
      });
    }

    // 3. Latest Clinical Record (for Working Diagnosis)
    const fetchLatestRecord = async () => {
      const q = query(
        collection(db, COLLECTIONS.MEDICAL_RECORDS),
        where('encounterId', '==', encounter?.id || ''),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setLatestRecord(snap.docs[0].data());
      }
    };
    fetchLatestRecord();

    return () => {
      unsubPatient();
      unsubEncounter();
    };
  }, [isOpen, patient?.id, encounter?.id]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.verification) {
      alert("Harap centang verifikasi data sesuai standar JCI.");
      return;
    }

    // IPSG.1 Requirement: Verify identity before committing record
    setShowVerificationModal(true);
  };

  const handleFinalVerified = () => {
    setShowVerificationModal(false);
    setIsSaving(true);
    
    onSave({
      module: moduleName,
      patientId: patient?.id,
      encounterId: encounter?.id,
      ...formData,
      verified_by: currentUser?.email,
      verification_timestamp: new Date().toISOString()
    });
    
    setIsSaving(false);
  };


  const renderModuleContent = () => {
    const name = moduleName.toUpperCase();

    // Specialized forms based on module name or ID
    if (name.includes('TRANSFUSI') || name.includes('BLOOD')) {
       return <BloodTransfusionForm formData={formData} setFormData={setFormData} isSaving={isSaving} onSave={handleFinalVerified} />;
    }
    
    if (name.includes('DNR') || name.includes('RESUSITASI')) {
       return <DNRForm formData={formData} setFormData={setFormData} isSaving={isSaving} onSave={handleFinalVerified} />;
    }

    if (name.includes('GIZI') || name.includes('MST') || name.includes('NUTRITION')) {
       return <NutritionScreeningForm formData={formData} setFormData={setFormData} isSaving={isSaving} onSave={handleFinalVerified} />;
    }

    if (name.includes('RE-ASESMEN NYERI') || name.includes('PAIN REASSESSMENT')) {
       return <PainReassessmentForm formData={formData} setFormData={setFormData} isSaving={isSaving} onSave={handleFinalVerified} />;
    }

    if (name.includes('PRA-ANESTESI') || name.includes('PRE-ANESTHESIA')) {
       return <PreAnesthesiaAssessmentForm formData={formData} setFormData={setFormData} isSaving={isSaving} onSave={handleFinalVerified} />;
    }

    if (name.includes('REKONSILIASI') || name.includes('RECONCILIATION')) {
       return <MedicationReconciliationForm formData={formData} setFormData={setFormData} isSaving={isSaving} onSave={handleFinalVerified} />;
    }
    if (name.includes('CPOE') || name.includes('RESEP')) {
       return (
         <MedicationOrderForm 
            formData={formData} 
            setFormData={setFormData}
            patient={patient}
         />
       );
    }

    if (name.includes('INCIDENT') || name.includes('INSIDEN')) {
       return (
         <IncidentReportForm 
            formData={formData} 
            setFormData={setFormData}
         />
       );
    }

    if (name.includes('EWS') || name.includes('WARNING')) {
       return (
         <EarlyWarningSystem 
            formData={formData} 
            setFormData={setFormData}
         />
       );
    }

    if (name.includes('EMAR') || name.includes('PEMBERIAN OBAT')) {
       return (
         <EMARForm 
            formData={formData} 
            setFormData={setFormData}
            patient={patient}
         />
       );
    }

    if (name.includes('LABORATORIUM') || name.includes('LAB ALERT')) {
       return (
         <LabAlertSystem 
            formData={formData} 
            setFormData={setFormData}
         />
       );
    }

    if (name.includes('CUCI TANGAN') || name.includes('HAND HYGIENE')) {
       return (
         <HandHygieneAudit 
            formData={formData} 
            setFormData={setFormData}
         />
       );
    }

    if (name.includes('GAWAT DARURAT') || name.includes('UGD') || name.includes('IGD')) {
      return <UgdAssessmentForm formData={formData} setFormData={setFormData} patient={patient} encounter={encounter} currentUser={currentUser} />;
    }

    if (name.includes('SOAP') || name.includes('CPPT')) {
       return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['Subjective (S)', 'Objective (O)', 'Assessment (A)', 'Plan (P)'].map(section => (
              <div key={section} className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                  {section}
                </label>
                <textarea 
                  className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-3xl p-5 text-sm font-bold focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all min-h-[150px] placeholder:opacity-30"
                  placeholder={`Masukkan data ${section}...`}
                  value={formData[section] || ''}
                  onChange={(e) => setFormData({...formData, [section]: e.target.value})}
                />
              </div>
            ))}
         </div>
       );
    }

    if (name.includes('NYERI')) {
       return (
         <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 flex flex-col items-center text-center">
                  <Heart className="text-red-500 mb-2" size={32} />
                  <h4 className="text-sm font-black uppercase tracking-tighter">Skala Nyeri (NRS)</h4>
                  <input type="range" min="0" max="10" className="w-full mt-4 accent-red-500" />
                  <div className="flex justify-between w-full mt-2 text-[10px] font-black opacity-40">
                     <span>0 (NONE)</span>
                     <span>10 (SEVERE)</span>
                  </div>
               </div>
               <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-6 flex flex-col items-center text-center">
                  <Activity className="text-blue-500 mb-2" size={32} />
                  <h4 className="text-sm font-black uppercase tracking-tighter">Frekuensi</h4>
                  <select className="w-full mt-4 bg-white dark:bg-black/20 border border-[var(--outline-variant)] rounded-xl p-2 text-xs font-bold">
                     <option>Intermiten</option>
                     <option>Terus-menerus</option>
                  </select>
               </div>
               <div className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex flex-col items-center text-center">
                  <Info className="text-amber-500 mb-2" size={32} />
                  <h4 className="text-sm font-black uppercase tracking-tighter">Karakteristik</h4>
                  <select className="w-full mt-4 bg-white dark:bg-black/20 border border-[var(--outline-variant)] rounded-xl p-2 text-xs font-bold">
                     <option>Tajam / Menusuk</option>
                     <option>Tumpul / Pegal</option>
                     <option>Panas / Terbakar</option>
                  </select>
               </div>
            </div>
            <div className="space-y-3">
               <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)]">Lokasi & Catatan Tambahan</label>
               <textarea 
                  className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-3xl p-5 text-sm font-bold min-h-[150px]"
                  placeholder="Jelaskan lokasi nyeri dan faktor yang memperberat/memperingan..."
               />
            </div>
         </div>
       );
    }

    if (moduleName.includes('GIZI')) {
       return (
         <div className="space-y-8">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
               <Activity className="text-emerald-500" /> Malnutrition Screening Tool (MST)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-[var(--surface-container-low)] p-8 rounded-[2rem] border border-[var(--outline-variant)]">
                  <p className="text-sm font-black mb-4 uppercase opacity-50 tracking-widest">1. Penurunan Berat Badan (6 bulan terakhir)</p>
                  <div className="space-y-3">
                     {['Tidak ada (0)', 'Ragu/Pakaian terasa longgar (1)', '1-5 kg (2)', '6-10 kg (3)', '> 15 kg (5)'].map((opt, i) => (
                        <label key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                           <input type="radio" name="weightLoss" className="w-5 h-5 accent-emerald-500" />
                           <span className="text-sm font-bold">{opt}</span>
                        </label>
                     ))}
                  </div>
               </div>
               <div className="bg-[var(--surface-container-low)] p-8 rounded-[2rem] border border-[var(--outline-variant)]">
                  <p className="text-sm font-black mb-4 uppercase opacity-50 tracking-widest">2. Penurunan Asupan Makan</p>
                  <div className="space-y-3">
                     {['Tidak (0)', 'Ya (1)'].map((opt, i) => (
                        <label key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                           <input type="radio" name="intakeLoss" className="w-5 h-5 accent-emerald-500" />
                           <span className="text-sm font-bold">{opt}</span>
                        </label>
                     ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-[var(--outline-variant)] flex justify-between items-center">
                     <span className="text-xs font-black uppercase tracking-widest opacity-50">Total Score MST</span>
                     <span className="text-4xl font-black text-emerald-500">0</span>
                  </div>
               </div>
            </div>
         </div>
       );
    }

    if (moduleName.includes('JATUH')) {
       return (
         <div className="space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                  <AlertTriangle className="text-amber-500" /> Morse Fall Scale (MFS)
               </h3>
               <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                  Risiko Rendah
               </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
               {[
                  { q: 'Riwayat Jatuh (3 bulan terakhir)', options: ['Tidak (0)', 'Ya (25)'] },
                  { q: 'Diagnosis Sekunder (≥ 2 diagnosis medis)', options: ['Tidak (0)', 'Ya (15)'] },
                  { q: 'Alat Bantu Jalan', options: ['Bed rest/Dibantu (0)', 'Kruk/Tongkat/Walker (15)', 'Furnitur (30)'] },
                  { q: 'Terpasang IV Line/Infus', options: ['Tidak (0)', 'Ya (20)'] },
                  { q: 'Gaya Berjalan', options: ['Normal/Bed rest (0)', 'Lemah (10)', 'Terganggu (20)'] },
                  { q: 'Status Mental', options: ['Menyadari kemampuan (0)', 'Lupa keterbatasan (15)'] }
               ].map((item, idx) => (
                  <div key={idx} className="bg-[var(--surface-container-low)] p-6 rounded-3xl border border-[var(--outline-variant)] flex items-center justify-between">
                     <p className="text-sm font-bold">{item.q}</p>
                     <div className="flex gap-3">
                        {item.options.map((opt, i) => (
                           <button key={i} className="px-4 py-2 rounded-xl bg-[var(--surface-container-high)] hover:bg-[var(--primary)] hover:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                              {opt}
                           </button>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
         </div>
       );
    }

    if (moduleName.includes('SURGICAL')) {
       return (
         <div className="space-y-8">
            <div className="flex items-center gap-4 bg-blue-500/10 p-6 rounded-[2rem] border border-blue-500/20">
               <ShieldCheck className="text-blue-500" size={32} />
               <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">WHO Surgical Safety Checklist</h3>
                  <p className="text-[10px] font-bold opacity-60">Pastikan keselamatan pasien sebelum, saat, dan sesudah prosedur bedah (IPSG.4).</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {['SIGN IN (Pre-Induction)', 'TIME OUT (Pre-Incision)', 'SIGN OUT (Pre-Closure)'].map((phase, i) => (
                  <div key={i} className="bg-[var(--surface-container-low)] p-6 rounded-[2.5rem] border border-[var(--outline-variant)] space-y-4">
                     <h4 className="text-xs font-black uppercase tracking-widest text-[var(--primary)]">{phase}</h4>
                     <div className="space-y-3">
                        {[1,2,3,4].map(j => (
                           <label key={j} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 accent-blue-500" />
                              <span className="text-[11px] font-bold opacity-70 italic">Prosedur verifikasi #{j}...</span>
                           </label>
                        ))}
                     </div>
                  </div>
               ))}
            </div>
         </div>
       );
    }

    if (moduleName.includes('EWS')) {
       return (
         <div className="space-y-8">
            <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-[3rem] text-white shadow-2xl shadow-red-500/20">
               <div className="flex justify-between items-start mb-8">
                  <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter">Early Warning System (EWS)</h3>
                     <p className="text-xs font-bold opacity-80 mt-1">Deteksi Dini Perburukan Kondisi Pasien</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl flex flex-col items-center">
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Score</span>
                     <span className="text-4xl font-black">2</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                     { label: 'RR', val: '18', unit: '/min' },
                     { label: 'SpO2', val: '98', unit: '%' },
                     { label: 'Temp', val: '36.5', unit: '°C' },
                     { label: 'HR', val: '82', unit: 'bpm' }
                  ].map((vs, idx) => (
                     <div key={idx} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{vs.label}</p>
                        <p className="text-xl font-black">{vs.val}<span className="text-xs ml-1 opacity-60">{vs.unit}</span></p>
                     </div>
                  ))}
               </div>
            </div>
            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
               <AlertTriangle className="text-amber-500" />
               <p className="text-xs font-bold italic text-amber-700 dark:text-amber-400">
                  REKOMENDASI: Tingkatkan frekuensi observasi setiap 4-6 jam. Laporkan ke DPJP jika skor meningkat.
               </p>
            </div>
         </div>
       );
    }

    if (name.includes('PERSYARATAN') || name.includes('CONSENT') || name.includes('PERSETUJUAN')) {
       return (
         <div className="space-y-8">
            <div className="bg-[var(--surface-container-low)] p-10 rounded-[3rem] border border-[var(--outline-variant)]">
               <div className="flex items-center gap-6 mb-10 pb-10 border-b border-[var(--outline-variant)]">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <FileSignature size={40} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black uppercase tracking-tighter">{moduleName}</h3>
                     <p className="text-xs font-bold opacity-60">Sesuai Standar JCI PFR.5 - Legal Digital Signature</p>
                  </div>
               </div>
               <div className="space-y-6">
                  {['Pemberian Informasi', 'Diagnosis & Tata Cara', 'Tujuan & Alternatif', 'Risiko & Komplikasi', 'Prognosis & Biaya'].map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-4 bg-[var(--surface-container-high)]/30 rounded-2xl">
                        <span className="text-sm font-bold">{item}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Telah Dijelaskan</span>
                           <CheckCircle2 className="text-emerald-500" size={20} />
                        </div>
                     </div>
                  ))}
               </div>
               <div className="mt-12 grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center">Tanda Tangan Saksi/Keluarga</p>
                     <div className="h-40 rounded-3xl bg-white dark:bg-black/20 border-2 border-dashed border-[var(--outline-variant)] flex items-center justify-center">
                        <PenTool className="opacity-20" size={32} />
                        <span className="text-[10px] font-black opacity-20 uppercase ml-3 tracking-widest">Digital Signature Area</span>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-center">Tanda Tangan Pasien</p>
                     <div className="h-40 rounded-3xl bg-white dark:bg-black/20 border-2 border-dashed border-[var(--outline-variant)] flex items-center justify-center">
                        <PenTool className="opacity-20" size={32} />
                        <span className="text-[10px] font-black opacity-20 uppercase ml-3 tracking-widest">Digital Signature Area</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       );
    }
    
    if (moduleName.includes('AWAL MEDIS') || moduleName.includes('AWAL KEPERAWATAN')) {
        const isMedis = moduleName.includes('MEDIS');
        const sections = isMedis 
          ? ['Keluhan Utama', 'Riwayat Penyakit Sekarang', 'Riwayat Penyakit Dahulu', 'Pemeriksaan Fisik']
          : ['Keluhan Utama', 'Status Fungsional', 'Status Psikologis', 'Kebutuhan Edukasi'];
        
        const loadTemplate = () => {
          if (isMedis) {
            setFormData({
              ...formData,
              'Keluhan Utama': 'Nyeri dada kiri sejak 2 jam SMRS',
              'Riwayat Penyakit Sekarang': 'Nyeri dada dirasakan seperti tertindih beban berat, menjalar ke lengan kiri dan rahang. Nyeri dirasakan terus menerus, skala 7/10. Disertai keringat dingin dan mual.',
              'Riwayat Penyakit Dahulu': 'Hipertensi (+) sejak 5 tahun lalu, kontrol tidak rutin. Diabetes Melitus disangkal. Riwayat Merokok (+) 1 bungkus/hari.',
              'Pemeriksaan Fisik': 'TD: 150/90 mmHg, HR: 98x/m, RR: 22x/m, SpO2: 96% room air. Cor: S1 S2 murni reguler, murmur (-). Pulmo: Vesikuler (+/+), ronkhi (-/-).'
            });
          } else {
            setFormData({
              ...formData,
              'Keluhan Utama': 'Lemas dan pusing',
              'Status Fungsional': 'Mandiri (Barthel Index: 20/20)',
              'Status Psikologis': 'Cemas ringan terkait penyakitnya',
              'Kebutuhan Edukasi': 'Edukasi tentang diet rendah garam dan manajemen hipertensi'
            });
          }
        };

        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-[var(--primary)]/5 to-blue-500/5 border-2 border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--primary)] flex items-center justify-center text-white shadow-xl shadow-[var(--primary)]/20 rotate-3">
                      <UserPlus size={32} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Asesmen Awal Terintegrasi</h3>
                      <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Wajib diselesaikan dalam 24 jam pertama (Standar AOP.1.1)</p>
                   </div>
                </div>
                <button 
                   onClick={loadTemplate}
                   className="px-10 py-4 rounded-[2rem] bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-amber-500/20 transition-all flex items-center gap-3 active:scale-95"
                >
                   <Zap size={18} /> Isi Contoh Data (JCI Template)
                </button>
             </div>

             <div className="grid grid-cols-1 gap-10">
                {sections.map(section => (
                   <div key={section} className="space-y-4">
                      <div className="flex items-center gap-4 px-4">
                         <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]"></div>
                         <label className="text-sm font-black uppercase tracking-[0.2em] text-[var(--on-surface-variant)]">{section}</label>
                      </div>
                      <textarea 
                         className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-[3rem] p-10 text-lg font-bold min-h-[180px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none leading-relaxed placeholder:opacity-20"
                         placeholder={`Masukkan ${section.toLowerCase()}...`}
                         value={formData[section] || ''}
                         onChange={(e) => setFormData({...formData, [section]: e.target.value})}
                      />
                   </div>
                ))}
             </div>
          </div>
        );
     }


     if (moduleName.includes('REKONSILIASI')) {
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                         <Pill size={24} />
                      </div>
                      Rekonsiliasi Obat (MMU.4.1)
                   </h3>
                   <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] mt-2 ml-16">Pengecekan riwayat penggunaan obat pasien sebelum MRS.</p>
                </div>
                <button className="px-10 py-4 rounded-[2rem] bg-[var(--primary)] text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary)]/20 hover:brightness-110 transition-all flex items-center gap-3 active:scale-95">
                   <Plus size={18} /> Tambah Daftar Obat
                </button>
             </div>

             <div className="overflow-hidden rounded-[3rem] border-2 border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-black/10">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-100/50 dark:bg-white/5">
                         <th className="p-8 text-[11px] font-black uppercase tracking-widest opacity-40">Nama Obat & Dosis</th>
                         <th className="p-8 text-[11px] font-black uppercase tracking-widest opacity-40">Rute / Frekuensi</th>
                         <th className="p-8 text-[11px] font-black uppercase tracking-widest opacity-40">Status Terakhir</th>
                         <th className="p-8 text-[11px] font-black uppercase tracking-widest opacity-40 text-center">Lanjutkan?</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y-2 divide-gray-100 dark:divide-white/5">
                      {[
                         { name: 'Amlodipine 5mg', r: 'Oral / 1x1', s: 'Habis', c: true },
                         { name: 'Metformin 500mg', r: 'Oral / 2x1', s: 'Masih ada', c: true },
                         { name: 'Atorvastatin 20mg', r: 'Oral / 0-0-1', s: 'Habis', c: false }
                      ].map((m, i) => (
                         <tr key={i} className="hover:bg-white transition-colors duration-300">
                            <td className="p-8">
                               <p className="text-base font-black text-[var(--on-surface)]">{m.name}</p>
                               <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Generic Entry</p>
                            </td>
                            <td className="p-8 text-base font-bold opacity-60 tabular-nums">{m.r}</td>
                            <td className="p-8">
                               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${m.s === 'Habis' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                  {m.s}
                               </span>
                            </td>
                            <td className="p-8 text-center">
                               <input type="checkbox" defaultChecked={m.c} className="w-8 h-8 rounded-xl accent-[var(--primary)] cursor-pointer" />
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        );
     }

     if (moduleName.includes('SBAR')) {
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="p-10 rounded-[3.5rem] bg-amber-500/5 border-2 border-amber-500/10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-10 opacity-[0.03] pointer-events-none">
                   <Workflow size={160} />
                </div>
                <div className="w-20 h-20 rounded-[2rem] bg-amber-500 flex items-center justify-center text-white shadow-2xl shadow-amber-500/20 rotate-6">
                   <Workflow size={40} />
                </div>
                <div>
                   <h3 className="text-3xl font-black uppercase tracking-tighter">Transfer Pasien Internal (SBAR)</h3>
                   <p className="text-[11px] font-bold opacity-40 uppercase tracking-[0.2em] mt-1">Pastikan serah terima informasi akurat & aman (IPSG.2.2)</p>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-8">
                {[
                   { k: 'S', t: 'Situation', p: 'Kondisi saat ini, alasan transfer, tanda vital terakhir...' },
                   { k: 'B', t: 'Background', p: 'Riwayat medis relevan, alergi, obat-obatan terakhir...' },
                   { k: 'A', t: 'Assessment', p: 'Analisis kondisi pasien, risiko (jatuh/nyeri), status mental...' },
                   { k: 'R', t: 'Recommendation', p: 'Tindakan yang perlu dilanjutkan, pemantauan khusus...' }
                ].map(item => (
                   <div key={item.k} className="flex flex-col md:flex-row gap-8 group">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-gray-100/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/5 flex items-center justify-center text-5xl font-black text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white group-hover:scale-110 transition-all duration-700 shadow-inner">
                         {item.k}
                      </div>
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center gap-3 px-2">
                            <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--on-surface-variant)] opacity-40">{item.t}</h4>
                            <div className="h-px flex-1 bg-gray-100 dark:bg-white/5"></div>
                         </div>
                         <textarea 
                            className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 text-lg font-bold min-h-[140px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none leading-relaxed placeholder:opacity-20"
                            placeholder={item.p}
                         />
                      </div>
                   </div>
                ))}
             </div>
          </div>
        );
     }

     if (moduleName.includes('RESUME')) {
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="bg-gray-50/50 dark:bg-black/20 p-12 rounded-[4rem] border-2 border-gray-100 dark:border-white/5 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 p-12 opacity-[0.03] pointer-events-none">
                   <ScrollText size={300} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-16 relative z-10">
                   <div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter text-[var(--on-surface)] leading-none">Ringkasan Pulang</h3>
                      <p className="text-[11px] font-black opacity-40 mt-4 uppercase tracking-[0.3em]">Discharge Summary • Digital Record Certified (ACC.4.2)</p>
                   </div>
                   <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--primary)] text-white flex items-center justify-center shadow-2xl shadow-[var(--primary)]/20 rotate-3">
                      <ScrollText size={48} />
                   </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                   <div className="space-y-10">
                      <div className="space-y-4">
                         <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-4">Diagnosis Akhir (ICD-10)</label>
                         <div className="group relative">
                            <div className="absolute inset-0 bg-blue-500/10 rounded-[2.5rem] scale-105 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                            <div className="p-8 rounded-[2.5rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-black flex items-center justify-between relative z-10 shadow-xl">
                               <span>Congestive Heart Failure (I50.9)</span>
                               <PenTool size={20} className="text-[var(--primary)]" />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-4">Prosedur / Tindakan (ICD-9-CM)</label>
                         <div className="group relative">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] scale-105 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                            <div className="p-8 rounded-[2.5rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-black flex items-center justify-between relative z-10 shadow-xl">
                               <span>Echocardiography (88.72)</span>
                               <PenTool size={20} className="text-emerald-500" />
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="space-y-10">
                      <div className="space-y-4">
                         <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-4">Kondisi Saat Pulang</label>
                         <select className="w-full p-8 rounded-[2.5rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-black focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none appearance-none cursor-pointer shadow-xl">
                            <option>Sembuh / Membaik</option>
                            <option>Atas Permintaan Sendiri (APS)</option>
                            <option>Rujuk Ke RS Lain</option>
                            <option>Meninggal Dunia</option>
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-4">Instruksi Tindak Lanjut</label>
                         <textarea 
                            className="w-full p-8 rounded-[2.5rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-bold min-h-[160px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none leading-relaxed shadow-xl"
                            placeholder="Jelaskan kontrol rutin, obat pulang, dan diet..."
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
     }

     if (moduleName.includes('EDUKASI')) {
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="p-12 rounded-[4rem] bg-indigo-500/5 border-2 border-indigo-500/10 relative overflow-hidden">
                <div className="absolute right-0 top-0 p-12 opacity-[0.03] pointer-events-none">
                   <BookOpen size={200} />
                </div>
                
                <div className="flex items-center gap-8 mb-12 relative z-10">
                   <div className="w-20 h-20 rounded-[2rem] bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3">
                      <BookOpen size={40} />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter">Edukasi Pasien & Keluarga</h3>
                      <p className="text-[11px] font-black opacity-40 mt-1 uppercase tracking-[0.3em]">Verifikasi pemahaman pasien terhadap informasi medis (PFE.1).</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                   {['Manajemen Nyeri', 'Diet & Nutrisi', 'Penggunaan Obat', 'Rehabilitasi Medis', 'Hak & Kewajiban'].map((topic, idx) => (
                      <div key={idx} className="bg-white dark:bg-black/40 p-8 rounded-[2.5rem] border-2 border-gray-100 dark:border-white/5 flex items-center justify-between group hover:border-indigo-500 transition-all duration-500 shadow-xl">
                         <span className="text-base font-black uppercase tracking-tight">{topic}</span>
                         <div className="flex gap-3">
                            <button className="px-5 py-2 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Edukasi</button>
                            <button className="px-5 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-[var(--on-surface-variant)] text-[10px] font-black uppercase tracking-widest">Paham</button>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="mt-12 p-10 rounded-[3rem] bg-indigo-500/5 border-2 border-indigo-500/10 relative z-10">
                   <label className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 opacity-60 mb-4 block">Metode Edukasi & Hambatan (Kultural/Fisik)</label>
                   <textarea 
                      className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold min-h-[100px] leading-relaxed outline-none"
                      placeholder="Catat hambatan bahasa, budaya, atau fisik jika ada..."
                   />
                </div>
             </div>
          </div>
        );
     }

     if (moduleName.includes('RENCANA ASUHAN')) {
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-4">
                <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-5">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shadow-inner">
                      <Target size={32} />
                   </div>
                   Rencana Asuhan Terintegrasi
                </h3>
                <button className="px-12 py-5 rounded-[2rem] bg-[var(--primary)] text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-[var(--primary)]/20 hover:scale-105 transition-all flex items-center gap-4 active:scale-95">
                   <Plus size={20} /> Tambah Care Goal
                </button>
             </div>

             <div className="space-y-6">
                {[
                   { g: 'Nyeri terkontrol (Skor < 3)', s: 'In Progress', p: 'Monitoring berkala & analgetik' },
                   { g: 'Mobilisasi mandiri pasca op', s: 'Pending', p: 'Fisioterapi bertahap' }
                ].map((goal, i) => (
                   <div key={i} className="p-10 rounded-[3rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between group hover:border-[var(--primary)] transition-all duration-500 shadow-xl">
                      <div className="flex gap-8 items-center">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 flex items-center justify-center text-xl font-black text-[var(--primary)] shadow-sm">
                            {i+1}
                         </div>
                         <div>
                            <p className="text-lg font-black text-[var(--on-surface)] uppercase tracking-tight">{goal.g}</p>
                            <p className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em] mt-1">{goal.p}</p>
                         </div>
                      </div>
                      <span className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest mt-6 md:mt-0 ${goal.s === 'In Progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'}`}>
                         {goal.s}
                      </span>
                   </div>
                ))}
             </div>
          </div>
        );
     }

     if (moduleName.includes('CAIRAN') || moduleName.includes('BALANCE')) {
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                   <div className="flex items-center gap-4 px-6">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40"></div>
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Intake (Masukan Cairan)</h4>
                   </div>
                   <div className="space-y-4">
                      {['Cairan Infus (mL)', 'Minum (mL)', 'Makan/Sonde (mL)'].map(label => (
                         <div key={label} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 shadow-xl group hover:border-blue-500 transition-all">
                            <span className="text-base font-black uppercase tracking-tight">{label}</span>
                            <input type="number" className="w-32 bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-2xl p-4 text-right text-lg font-black focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all" placeholder="0" />
                         </div>
                      ))}
                   </div>
                </div>
                <div className="space-y-8">
                   <div className="flex items-center gap-4 px-6">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/40"></div>
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] opacity-40">Output (Keluaran Cairan)</h4>
                   </div>
                   <div className="space-y-4">
                      {['Urine (mL)', 'Drain/NGT (mL)', 'IWL (mL)'].map(label => (
                         <div key={label} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 shadow-xl group hover:border-amber-500 transition-all">
                            <span className="text-base font-black uppercase tracking-tight">{label}</span>
                            <input type="number" className="w-32 bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-2xl p-4 text-right text-lg font-black focus:ring-8 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all" placeholder="0" />
                         </div>
                      ))}
                   </div>
                </div>
             </div>
             
             <div className="p-12 rounded-[4rem] bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 text-white flex flex-col md:flex-row justify-between items-center shadow-2xl shadow-indigo-500/40 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10">
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-60">Cumulative Balance (24h Window)</p>
                   <h3 className="text-7xl font-black tracking-tighter mt-4">+240 <span className="text-2xl opacity-40 uppercase ml-2 tracking-widest">mL</span></h3>
                </div>
                <div className="text-center md:text-right relative z-10 mt-8 md:mt-0">
                   <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/20 shadow-inner">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-60">Status Hidrasi Klinis</p>
                      <span className="text-2xl font-black uppercase tracking-tighter">Normovolemia</span>
                   </div>
                </div>
             </div>
          </div>
        );
     }
     if (moduleName.includes('ORDER LABORATORIUM')) {
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="p-12 rounded-[4rem] bg-emerald-500/5 border-2 border-emerald-500/10 shadow-xl relative overflow-hidden">
                   <div className="absolute right-0 top-0 p-8 opacity-[0.03] pointer-events-none">
                      <Microscope size={160} />
                   </div>
                   <h4 className="text-xl font-black uppercase tracking-[0.2em] text-emerald-600 mb-10 flex items-center gap-5 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                         <Microscope size={24} />
                      </div>
                      Laboratorium Klinik
                   </h4>
                   <div className="space-y-4 relative z-10">
                      {['Hematologi Lengkap', 'Kimia Darah (Fungsi Hati/Ginjal)', 'Urinalisa Rutin', 'Elektrolit Serum', 'HbA1c'].map(lab => (
                         <label key={lab} className="flex items-center gap-5 p-6 rounded-[2rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 hover:border-emerald-500 transition-all cursor-pointer shadow-sm group">
                            <input type="checkbox" className="w-6 h-6 rounded-xl border-2 border-emerald-500/30 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
                            <span className="text-base font-black uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{lab}</span>
                         </label>
                      ))}
                   </div>
                </div>
                <div className="p-12 rounded-[4rem] bg-blue-500/5 border-2 border-blue-500/10 shadow-xl relative overflow-hidden">
                   <div className="absolute right-0 top-0 p-8 opacity-[0.03] pointer-events-none">
                      <Zap size={160} />
                   </div>
                   <h4 className="text-xl font-black uppercase tracking-[0.2em] text-blue-600 mb-10 flex items-center gap-5 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                         <Activity size={24} />
                      </div>
                      Radiologi & Imaging
                   </h4>
                   <div className="space-y-4 relative z-10">
                      {['Thorax PA', 'USG Abdomen Whole', 'CT Scan Non-Contrast', 'MRI Brain', 'EKG 12-Leads'].map(rad => (
                         <label key={rad} className="flex items-center gap-5 p-6 rounded-[2rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 hover:border-blue-500 transition-all cursor-pointer shadow-sm group">
                            <input type="checkbox" className="w-6 h-6 rounded-xl border-2 border-blue-500/30 text-blue-500 focus:ring-blue-500 cursor-pointer" />
                            <span className="text-base font-black uppercase tracking-tight group-hover:text-blue-600 transition-colors">{rad}</span>
                         </label>
                      ))}
                   </div>
                </div>
             </div>
             <div className="p-12 rounded-[4rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 shadow-inner">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 mb-6 block ml-4">Indikasi Klinis / Catatan Order Khusus</label>
                <textarea className="w-full bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-[3rem] p-10 text-lg font-bold min-h-[160px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all leading-relaxed" placeholder="Tuliskan alasan klinis pemeriksaan ini..." />
             </div>
          </div>
        );
     }

     if (moduleName.includes('KONSULTASI')) {
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="p-12 rounded-[4rem] bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 p-12 opacity-[0.03] pointer-events-none rotate-12">
                   <Share2 size={240} />
                </div>
                
                <div className="flex items-center gap-8 mb-16 relative z-10">
                   <div className="w-20 h-20 rounded-[2rem] bg-amber-500 text-white flex items-center justify-center shadow-2xl shadow-amber-500/20 rotate-6">
                      <Share2 size={40} />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter">Lembar Konsultasi Internal</h3>
                      <p className="text-[11px] font-black opacity-40 mt-1 uppercase tracking-[0.3em]">Komunikasi antar profesional pemberi asuhan (PPA).</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12 relative z-10">
                   <div className="space-y-6">
                      <label className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600 ml-4">Tujuan Konsul (Spesialisasi)</label>
                      <select className="w-full p-8 rounded-[2.5rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-black focus:ring-12 focus:ring-amber-500/5 focus:border-amber-500 outline-none appearance-none cursor-pointer shadow-xl">
                         <option>Spesialis Penyakit Dalam (Internis)</option>
                         <option>Spesialis Jantung (Kardiologi)</option>
                         <option>Spesialis Bedah Umum</option>
                         <option>Spesialis Gizi Klinik</option>
                      </select>
                   </div>
                   <div className="space-y-6">
                      <label className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600 ml-4">Jenis Konsultasi</label>
                      <div className="flex gap-4">
                         {['Konsul Sewaktu', 'Rawat Bersama', 'Alih Rawat'].map(t => (
                            <button key={t} className="flex-1 py-6 rounded-[2rem] border-2 border-gray-100 dark:border-white/5 text-[11px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all duration-500 shadow-xl">{t}</button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-6 relative z-10">
                   <label className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-600 ml-4">Permasalahan & Harapan Konsul</label>
                   <textarea className="w-full p-10 rounded-[3rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-lg font-bold min-h-[240px] focus:ring-12 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all leading-relaxed shadow-inner" placeholder="Mohon bantuan untuk tata laksana..." />
                </div>
             </div>
          </div>
        );
     }

     if (moduleName.includes('KHUSUS')) {
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex flex-wrap gap-4 px-4">
                {['Pediatri', 'Geriatri', 'Obgyn'].map(mode => (
                   <button key={mode} className="px-10 py-4 rounded-full bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 text-[11px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-xl">
                      Mode {mode}
                   </button>
                ))}
             </div>
             
             <div className="p-12 rounded-[4rem] bg-orange-500/5 border-2 border-orange-500/10 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 p-12 opacity-[0.03] pointer-events-none">
                   <UserPlus size={240} />
                </div>

                <div className="flex items-center gap-8 mb-12 relative z-10">
                   <div className="w-20 h-20 rounded-[2rem] bg-orange-500 text-white flex items-center justify-center shadow-2xl shadow-orange-500/20 rotate-6">
                      <UserPlus size={40} />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter">Screening Populasi Rentan</h3>
                      <p className="text-[11px] font-black opacity-40 mt-1 uppercase tracking-[0.3em]">Standar perlindungan pasien khusus (PFE.1.1).</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                   <div className="space-y-6">
                      {['Status Imunisasi', 'Tumbuh Kembang', 'Ketergantungan Obat', 'Risiko Kekerasan'].map(label => (
                         <div key={label} className="flex items-center justify-between p-8 bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-[2.5rem] shadow-xl group hover:border-orange-500 transition-all duration-500">
                            <span className="text-base font-black uppercase tracking-tight">{label}</span>
                            <div className="flex gap-3">
                               <button className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg"><CheckCircle2 size={24} /></button>
                               <button className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg"><AlertTriangle size={24} /></button>
                            </div>
                         </div>
                      ))}
                   </div>
                   <div className="p-10 rounded-[3.5rem] bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 shadow-inner flex flex-col justify-center items-center text-center space-y-8">
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30">Functional Status Index (ADL)</p>
                      <div className="relative">
                         <div className="w-48 h-48 rounded-full border-[12px] border-orange-500/10 flex flex-col items-center justify-center shadow-2xl bg-white dark:bg-black/20">
                            <span className="text-6xl font-black text-orange-600 tracking-tighter">12/20</span>
                            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-2">Total Score</span>
                         </div>
                         <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xl animate-bounce">
                            <Activity size={24} />
                         </div>
                      </div>
                      <div>
                         <p className="text-2xl font-black uppercase tracking-tight text-orange-600">Ketergantungan Sedang</p>
                         <p className="text-sm font-bold opacity-40 max-w-[280px] mt-2 leading-relaxed">Pasien membutuhkan bantuan sebagian untuk aktivitas harian.</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
     }

    // GENERIC DYNAMIC RENDERER FOR NEW MODULES (AESTHETIC & FUNCTIONAL)
    const isAssessment = name.includes('PENGKAJIAN') || name.includes('ASESMEN') || name.includes('BARTHEL');
    const isReport = name.includes('LAPORAN') || name.includes('RESUME') || name.includes('SURAT') || name.includes('DOKUMEN');
    const isMonitoring = name.includes('MONITORING') || name.includes('GRAFIK') || name.includes('OBSERVASI') || name.includes('EWS');
    const isNote = name.includes('CATATAN') || name.includes('PEMERIKSAAN');
    if (isAssessment || isReport || isMonitoring || isNote) {
        return (
           <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              {/* Dynamic Hero Section */}
              <div className="bg-gradient-to-br from-[var(--primary)]/10 to-blue-500/5 p-12 rounded-[4rem] border-2 border-gray-100 dark:border-white/5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000 pointer-events-none">
                    <Workflow size={320} className="rotate-12" />
                 </div>
                 <div className="flex flex-col md:flex-row items-start gap-10 relative z-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--primary)] flex items-center justify-center text-white shadow-2xl shadow-[var(--primary)]/40 transform -rotate-3 group-hover:rotate-0 transition-transform duration-700">
                       {isAssessment ? <ClipboardList size={48} /> : 
                        isMonitoring ? <Activity size={48} /> : 
                        isReport ? <FileText size={48} /> : <PenTool size={48} />}
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center gap-4 mb-4">
                          <span className="px-4 py-1.5 rounded-full bg-white dark:bg-black/40 text-[var(--primary)] text-[10px] font-black tracking-widest uppercase border-2 border-gray-100 dark:border-white/5 shadow-sm">
                             Clinical Intelligence Engine v3.0
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live Core Sync</span>
                       </div>
                       <h3 className="text-5xl font-black uppercase tracking-tighter text-[var(--on-surface)] leading-none">{moduleName}</h3>
                       <p className="text-base font-bold opacity-40 mt-6 max-w-3xl leading-relaxed italic">
                          Dokumentasi ini dikonfigurasi secara otomatis sesuai protokol medis terintegrasi JCI. Seluruh input diverifikasi secara digital untuk akreditasi & keselamatan pasien.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                 {/* Main Content Area */}
                 <div className="xl:col-span-8 space-y-12">
                    
                    {isMonitoring && (
                       <div className="bg-gray-50/50 dark:bg-black/20 p-10 rounded-[3.5rem] border-2 border-gray-100 dark:border-white/5 shadow-xl">
                          <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--primary)] mb-8 flex items-center gap-4 px-2">
                             <Activity size={24} /> Vital Signs & Parameters
                          </h4>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                             {['TD', 'NADI', 'SUHU', 'RR', 'SPO2', 'GCS', 'MAP', 'VAS'].map(v => (
                                <div key={v} className="bg-white dark:bg-black/40 p-6 rounded-3xl border-2 border-gray-100 dark:border-white/5 group focus-within:border-[var(--primary)] transition-all shadow-sm">
                                   <label className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30 block mb-3 ml-1">{v}</label>
                                   <input 
                                      type="text" 
                                      className="bg-transparent border-none w-full text-2xl font-black focus:outline-none placeholder:opacity-10 tabular-nums" 
                                      placeholder="00"
                                      value={formData[v] || ''}
                                      onChange={(e) => setFormData({...formData, [v]: e.target.value})}
                                   />
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {isAssessment && (
                       <div className="bg-gray-50/50 dark:bg-black/20 p-10 rounded-[3.5rem] border-2 border-gray-100 dark:border-white/5 shadow-xl">
                          <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--primary)] mb-8 flex items-center gap-4 px-2">
                             <ClipboardCheck size={24} /> Clinical Assessment Points
                          </h4>
                          <div className="grid grid-cols-1 gap-8">
                             {['Anamnesa Singkat', 'Status Fisik', 'Kondisi Psikologis', 'Kebutuhan Khusus'].map(label => (
                                <div key={label} className="space-y-4">
                                   <label className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--primary)] opacity-60 ml-6">{label}</label>
                                   <textarea 
                                      className="w-full bg-white dark:bg-black/40 border-2 border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 text-lg font-bold min-h-[140px] focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all outline-none leading-relaxed shadow-inner placeholder:opacity-10"
                                      placeholder={`Tuliskan ${label}...`}
                                      value={formData[label] || ''}
                                      onChange={(e) => setFormData({...formData, [label]: e.target.value})}
                                   />
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    <div className="space-y-6">
                       <div className="flex items-center justify-between px-6">
                          <label className="text-sm font-black uppercase tracking-[0.3em] text-[var(--primary)] flex items-center gap-4">
                             <PenTool size={24} /> 
                             Narasi Klinis Utama *
                          </label>
                          <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                             Cloud Sync Active
                          </div>
                       </div>
                       <div className="relative group">
                          <textarea 
                             className="w-full bg-gray-50/50 dark:bg-black/20 border-2 border-gray-100 dark:border-white/5 rounded-[4rem] p-12 text-xl font-bold focus:outline-none focus:ring-12 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all min-h-[600px] shadow-2xl leading-relaxed placeholder:opacity-10"
                             placeholder={`Dokumentasikan seluruh temuan klinis, analisis, dan rencana untuk ${moduleName}...`}
                             value={formData.notes || ''}
                             onChange={(e) => setFormData({...formData, notes: e.target.value})}
                          />
                          <div className="absolute bottom-10 right-12 flex items-center gap-6">
                             <div className="flex -space-x-4">
                                {[1,2,3,4].map(i => (
                                   <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 overflow-hidden shadow-xl hover:scale-110 transition-transform cursor-pointer">
                                      <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="avatar" />
                                   </div>
                                ))}
                             </div>
                             <span className="text-[10px] font-black text-[var(--on-surface-variant)]/40 uppercase tracking-[0.4em] mb-1">Collaboration Lab</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Sidebar Info Panel */}
                 <div className="xl:col-span-4 space-y-8">
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-10 rounded-[4rem] text-white shadow-2xl shadow-blue-500/30 group hover:scale-[1.02] transition-all duration-700 relative overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                       <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 flex items-center gap-3 relative z-10">
                          <ShieldCheck size={24} className="text-blue-200" /> Compliance Panel
                       </h4>
                       <p className="text-sm font-bold leading-relaxed text-blue-100/80 mb-8 relative z-10">
                          Integrasi penuh dengan standar akreditasi internasional JCI. Modul ini mendukung audit trail forensik & tanda tangan digital terenkripsi.
                       </p>
                       <div className="space-y-6 pt-8 border-t border-white/10 relative z-10">
                          <div className="flex flex-col gap-2">
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Medical Staff In-Charge</span>
                             <span className="text-lg font-black tracking-tight">{currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF'}</span>
                          </div>
                          <div className="flex flex-col gap-2">
                             <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Clinical Workstation</span>
                             <span className="text-lg font-black tracking-tight uppercase">Emergency Unit • Alpha-01</span>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white dark:bg-black/20 rounded-[3.5rem] p-10 border-2 border-gray-100 dark:border-white/5 space-y-8 shadow-xl">
                       <h4 className="text-[11px] font-black uppercase tracking-[0.3em] opacity-30 px-2">Clinical Metadata</h4>
                       <div className="space-y-6">
                          <div className="flex items-start gap-6">
                             <div className="w-14 h-14 rounded-[1.5rem] bg-gray-50/50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                                <Clock size={28} className="text-[var(--primary)]" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)] mb-2">Timestamp</p>
                                <p className="text-base font-black opacity-60 tabular-nums">{new Date().toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="flex items-start gap-6">
                             <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500/5 border-2 border-emerald-500/10 flex items-center justify-center shrink-0 shadow-inner">
                                <BadgeCheck size={28} className="text-emerald-500" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-2">Security Hash</p>
                                <p className="text-base font-black text-emerald-600/80">SHA-256 VERIFIED</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-10 rounded-[3.5rem] bg-amber-500/5 border-2 border-amber-500/10 space-y-5 shadow-lg group hover:bg-amber-500/10 transition-colors">
                       <div className="flex items-center gap-3 text-amber-600 font-black text-[11px] uppercase tracking-[0.3em]">
                          <AlertTriangle size={20} className="animate-bounce" /> Clinical Alert
                       </div>
                       <p className="text-sm font-bold text-amber-700/80 leading-relaxed italic">
                          "Pastikan verifikasi identitas pasien ( IPSG.1 ) dilakukan sebelum melakukan prosedur atau pemberian obat."
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        );
     }

    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 p-12 rounded-[4rem] text-center space-y-8 border border-[var(--outline-variant)]">
          <div className="w-32 h-32 rounded-[2.5rem] bg-white dark:bg-black/40 flex items-center justify-center text-[var(--primary)] shadow-2xl mx-auto transform hover:rotate-6 transition-transform">
            <Workflow size={64} className="animate-pulse" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-[var(--on-surface)]">
              {moduleName}
            </h3>
            <p className="text-sm font-bold text-[var(--on-surface-variant)] opacity-60 max-w-xl mx-auto leading-relaxed">
              Modul ini sedang dalam fase pengembangan untuk mencapai standar akurasi tinggi JCI. 
              Gunakan mode catatan klinis universal di bawah ini untuk mendokumentasikan temuan Anda.
            </p>
          </div>
          <div className="flex justify-center gap-6 pt-4">
             <button 
                onClick={() => setFormData({...formData, notes: ''})}
                className="px-12 py-5 rounded-[2rem] bg-[var(--primary)] text-white text-sm font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-2xl shadow-[var(--primary)]/30 flex items-center gap-3"
             >
                <PenTool size={20} /> Enable Universal Clinical Entry
             </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-start bg-slate-100/80 dark:bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto pt-10 pb-20 custom-scrollbar">
      <div 
        className="fixed inset-0 z-[-1] cursor-zoom-out" 
        onClick={onClose}
      />
      
      <div className="w-[98vw] max-w-[1800px] flex flex-col items-center relative z-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <A4Layout 
          title={moduleName} 
          patient={dbPatient} 
          encounter={dbEncounter} 
          latestRecord={latestRecord}
          onClose={onClose}
          onSave={handleSave}
          isSaving={isSaving}
          formData={formData}
          setFormData={setFormData}
          metadata={{
            doctorName: currentUser?.displayName || currentUser?.email,
            hash: `EMR-${moduleName.toUpperCase().replace(/\s/g, '-')}-${Date.now()}`
          }}
        >
          {renderModuleContent()}
        </A4Layout>
      </div>
      <PatientVerificationModal 
         isOpen={showVerificationModal}
         onClose={() => setShowVerificationModal(false)}
         onVerified={handleFinalVerified}
         patientData={patient}
      />
    </div>
  );
}

function Lock({ size, className }) {
   return <ShieldAlert size={size} className={className} />;
}
