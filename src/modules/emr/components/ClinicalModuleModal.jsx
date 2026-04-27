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
         <div className="space-y-8">
            <div className="p-6 rounded-[2rem] bg-[var(--primary)]/5 border border-[var(--primary)]/10 flex items-center justify-between mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white">
                     <UserPlus size={24} />
                  </div>
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tighter">Asesmen Awal Terintegrasi</h3>
                     <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Wajib diselesaikan dalam 24 jam pertama (Standar AOP.1.1)</p>
                  </div>
               </div>
               <button 
                  onClick={loadTemplate}
                  className="px-6 py-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2"
               >
                  <Zap size={16} /> Isi Contoh Data (JCI Template)
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {sections.map(section => (
                  <div key={section} className="space-y-3">
                     <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--primary)]/40"></div>
                        {section}
                     </label>
                     <textarea 
                        className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-3xl p-6 text-sm font-bold min-h-[120px] focus:ring-4 focus:ring-[var(--primary)]/5 transition-all"
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
         <div className="space-y-8">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                  <Pill className="text-blue-500" /> Rekonsiliasi Obat (MMU.4.1)
               </h3>
               <button className="px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Plus size={16} /> Tambah Obat
               </button>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-[var(--outline-variant)] bg-[var(--surface-container-low)]">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-[var(--surface-container-high)]/50">
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest opacity-40">Nama Obat & Dosis</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest opacity-40">Rute / Frekuensi</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest opacity-40">Status Terakhir</th>
                        <th className="p-5 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Lanjutkan?</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--outline-variant)]">
                     {[
                        { name: 'Amlodipine 5mg', r: 'Oral / 1x1', s: 'Habis', c: true },
                        { name: 'Metformin 500mg', r: 'Oral / 2x1', s: 'Masih ada', c: true },
                        { name: 'Atorvastatin 20mg', r: 'Oral / 0-0-1', s: 'Habis', c: false }
                     ].map((m, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                           <td className="p-5 text-sm font-black">{m.name}</td>
                           <td className="p-5 text-sm font-bold opacity-60">{m.r}</td>
                           <td className="p-5">
                              <span className="px-3 py-1 rounded-full bg-[var(--surface-container-high)] text-[10px] font-black uppercase">{m.s}</span>
                           </td>
                           <td className="p-5 text-center">
                              <input type="checkbox" defaultChecked={m.c} className="w-5 h-5 accent-emerald-500" />
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
         <div className="space-y-8">
            <div className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
               <Workflow className="text-amber-500" size={32} />
               <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">Transfer Pasien Internal (SBAR)</h3>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Pastikan serah terima informasi akurat (IPSG.2.2)</p>
               </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
               {[
                  { k: 'S', t: 'Situation', p: 'Kondisi saat ini, alasan transfer, tanda vital terakhir...' },
                  { k: 'B', t: 'Background', p: 'Riwayat medis relevan, alergi, obat-obatan terakhir...' },
                  { k: 'A', t: 'Assessment', p: 'Analisis kondisi pasien, risiko (jatuh/nyeri), status mental...' },
                  { k: 'R', t: 'Recommendation', p: 'Tindakan yang perlu dilanjutkan, pemantauan khusus...' }
               ].map(item => (
                  <div key={item.k} className="flex gap-6 group">
                     <div className="w-16 h-16 rounded-2xl bg-[var(--surface-container-high)] flex items-center justify-center text-2xl font-black text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-500 shadow-sm">
                        {item.k}
                     </div>
                     <div className="flex-1 space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest opacity-40">{item.t}</p>
                        <textarea 
                           className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-bold min-h-[80px]"
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
         <div className="space-y-8">
            <div className="bg-[var(--surface-container-low)] p-10 rounded-[3rem] border border-[var(--outline-variant)] space-y-10">
               <div className="flex justify-between items-start">
                  <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter">Ringkasan Pulang (Discharge Summary)</h3>
                     <p className="text-xs font-bold opacity-60 mt-1 uppercase tracking-widest">Wajib diberikan kepada pasien saat keluar (ACC.4.2)</p>
                  </div>
                  <ScrollText className="text-[var(--primary)] opacity-20" size={64} />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Diagnosis Akhir (ICD-10)</label>
                        <div className="p-4 rounded-2xl bg-white dark:bg-black/20 border border-[var(--outline-variant)] text-sm font-black flex items-center justify-between">
                           <span>Congestive Heart Failure (I50.9)</span>
                           <PenTool size={16} className="opacity-30" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Prosedur / Tindakan (ICD-9-CM)</label>
                        <div className="p-4 rounded-2xl bg-white dark:bg-black/20 border border-[var(--outline-variant)] text-sm font-black flex items-center justify-between">
                           <span>Echocardiography (88.72)</span>
                           <PenTool size={16} className="opacity-30" />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Kondisi Saat Pulang</label>
                        <select className="w-full p-4 rounded-2xl bg-white dark:bg-black/20 border border-[var(--outline-variant)] text-sm font-black focus:outline-none">
                           <option>Sembuh / Membaik</option>
                           <option>Atas Permintaan Sendiri (APS)</option>
                           <option>Rujuk Ke RS Lain</option>
                           <option>Meninggal Dunia</option>
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Instruksi Tindak Lanjut</label>
                        <textarea 
                           className="w-full p-4 rounded-2xl bg-white dark:bg-black/20 border border-[var(--outline-variant)] text-sm font-bold min-h-[100px]"
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
         <div className="space-y-8">
            <div className="p-8 rounded-[3rem] bg-indigo-500/10 border border-indigo-500/20">
               <div className="flex items-center gap-6 mb-8">
                  <BookOpen className="text-indigo-500" size={40} />
                  <div>
                     <h3 className="text-xl font-black uppercase tracking-tighter">Edukasi Pasien & Keluarga</h3>
                     <p className="text-xs font-bold opacity-60">Verifikasi pemahaman pasien terhadap informasi medis (PFE.1).</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['Manajemen Nyeri', 'Diet & Nutrisi', 'Penggunaan Obat', 'Rehabilitasi Medis', 'Hak & Kewajiban'].map((topic, idx) => (
                     <div key={idx} className="bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-[var(--outline-variant)] flex items-center justify-between">
                        <span className="text-sm font-bold">{topic}</span>
                        <div className="flex gap-2">
                           <button className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-black uppercase">Edukasi</button>
                           <button className="px-3 py-1 rounded-lg bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] text-[10px] font-black uppercase">Paham</button>
                        </div>
                     </div>
                  ))}
               </div>
               <div className="mt-8 p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block">Metode Edukasi & Hambatan</label>
                  <textarea 
                     className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold min-h-[60px]"
                     placeholder="Catat hambatan bahasa, budaya, atau fisik jika ada..."
                  />
               </div>
            </div>
         </div>
       );
    }

    if (moduleName.includes('RENCANA ASUHAN')) {
       return (
         <div className="space-y-8">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                  <Target size={24} className="text-[var(--primary)]" /> Rencana Asuhan Terintegrasi
               </h3>
               <button className="px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Plus size={16} /> Tambah Goal
               </button>
            </div>
            <div className="space-y-4">
               {[
                  { g: 'Nyeri terkontrol (Skor < 3)', s: 'In Progress', p: 'Monitoring berkala & analgetik' },
                  { g: 'Mobilisasi mandiri pasca op', s: 'Pending', p: 'Fisioterapi bertahap' }
               ].map((goal, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-[var(--surface-container-low)] border border-[var(--outline-variant)] flex items-center justify-between group hover:border-[var(--primary)] transition-all">
                     <div className="flex gap-5 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-black">
                           {i+1}
                        </div>
                        <div>
                           <p className="text-sm font-black">{goal.g}</p>
                           <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{goal.p}</p>
                        </div>
                     </div>
                     <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${goal.s === 'In Progress' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
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
         <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Intake (Masukan)</h4>
                  <div className="space-y-4">
                     {['Cairan Infus (mL)', 'Minum (mL)', 'Makan/Sonde (mL)'].map(label => (
                        <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
                           <span className="text-sm font-bold">{label}</span>
                           <input type="number" className="w-24 bg-white dark:bg-black/20 border border-[var(--outline-variant)] rounded-xl p-2 text-right text-sm font-black" placeholder="0" />
                        </div>
                     ))}
                  </div>
               </div>
               <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest opacity-40">Output (Keluaran)</h4>
                  <div className="space-y-4">
                     {['Urine (mL)', 'Drain/NGT (mL)', 'IWL (mL)'].map(label => (
                        <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
                           <span className="text-sm font-bold">{label}</span>
                           <input type="number" className="w-24 bg-white dark:bg-black/20 border border-[var(--outline-variant)] rounded-xl p-2 text-right text-sm font-black" placeholder="0" />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
            <div className="p-10 rounded-[3rem] bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex justify-between items-center shadow-xl">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Cumulative Balance (24h)</p>
                  <h3 className="text-5xl font-black">+240 <span className="text-xl opacity-60 uppercase">mL</span></h3>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2">Status Hidrasi</p>
                  <span className="px-6 py-2 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase">Normovolemia</span>
               </div>
            </div>
         </div>
       );
    }
    if (moduleName.includes('ORDER LABORATORIUM')) {
       return (
         <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="p-8 rounded-[3rem] bg-emerald-500/10 border border-emerald-500/20">
                  <h4 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
                     <Microscope size={20} /> Laboratorium Klinik
                  </h4>
                  <div className="space-y-3">
                     {['Hematologi Lengkap', 'Kimia Darah (Fungsi Hati/Ginjal)', 'Urinalisa Rutin', 'Elektrolit Serum', 'HbA1c'].map(lab => (
                        <label key={lab} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors cursor-pointer border border-transparent hover:border-emerald-500/30">
                           <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-emerald-500/30 text-emerald-500 focus:ring-emerald-500" />
                           <span className="text-sm font-bold">{lab}</span>
                        </label>
                     ))}
                  </div>
               </div>
               <div className="p-8 rounded-[3rem] bg-blue-500/10 border border-blue-500/20">
                  <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-6 flex items-center gap-2">
                     <Scissors size={20} /> Radiologi & Imaging
                  </h4>
                  <div className="space-y-3">
                     {['Thorax PA', 'USG Abdomen Whole', 'CT Scan Non-Contrast', 'MRI Brain', 'EKG 12-Leads'].map(rad => (
                        <label key={rad} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/50 transition-colors cursor-pointer border border-transparent hover:border-blue-500/30">
                           <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-blue-500/30 text-blue-500 focus:ring-blue-500" />
                           <span className="text-sm font-bold">{rad}</span>
                        </label>
                     ))}
                  </div>
               </div>
            </div>
            <div className="p-6 rounded-2xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
               <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block">Indikasi Klinis / Catatan Order</label>
               <textarea className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold" placeholder="Tuliskan indikasi pemeriksaan..." />
            </div>
         </div>
       );
    }

    if (moduleName.includes('KONSULTASI')) {
       return (
         <div className="space-y-8">
            <div className="p-10 rounded-[3rem] bg-[var(--surface-container-low)] border border-[var(--outline-variant)]">
               <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                     <Share2 size={32} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black uppercase tracking-tighter">Lembar Konsultasi Internal</h3>
                     <p className="text-xs font-bold opacity-60">Komunikasi antar profesional pemberi asuhan (PPA).</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Tujuan Konsul (Spesialisasi)</label>
                     <select className="w-full p-4 rounded-2xl bg-white dark:bg-black/20 border border-[var(--outline-variant)] text-sm font-black">
                        <option>Spesialis Penyakit Dalam (Internis)</option>
                        <option>Spesialis Jantung (Kardiologi)</option>
                        <option>Spesialis Bedah Umum</option>
                        <option>Spesialis Gizi Klinik</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Jenis Konsultasi</label>
                     <div className="flex gap-2">
                        {['Konsul Sewaktu', 'Rawat Bersama', 'Alih Rawat'].map(t => (
                           <button key={t} className="flex-1 py-4 rounded-2xl border border-[var(--outline-variant)] text-[10px] font-black uppercase hover:bg-[var(--primary)] hover:text-white transition-all">{t}</button>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Permasalahan & Harapan Konsul</label>
                  <textarea className="w-full p-6 rounded-3xl bg-white dark:bg-black/20 border border-[var(--outline-variant)] text-sm font-bold min-h-[150px]" placeholder="Mohon bantuan untuk tata laksana..." />
               </div>
            </div>
         </div>
       );
    }

    if (moduleName.includes('KHUSUS')) {
       return (
         <div className="space-y-8">
            <div className="flex gap-4 mb-4">
               {['Pediatri', 'Geriatri', 'Obgyn'].map(mode => (
                  <button key={mode} className="px-8 py-3 rounded-full border border-[var(--outline-variant)] text-xs font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-white transition-all">
                     Mode {mode}
                  </button>
               ))}
            </div>
            <div className="p-8 rounded-[3rem] bg-orange-500/10 border border-orange-500/20">
               <h3 className="text-lg font-black uppercase mb-6 flex items-center gap-3"><UserPlus className="text-orange-500" /> Screening Populasi Rentan</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     {['Status Imunisasi', 'Tumbuh Kembang', 'Ketergantungan Obat', 'Risiko Kekerasan'].map(label => (
                        <div key={label} className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-2xl">
                           <span className="text-sm font-bold">{label}</span>
                           <div className="flex gap-2">
                              <button className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={16} /></button>
                              <button className="w-10 h-10 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center"><AlertTriangle size={16} /></button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-6 rounded-3xl bg-white/40 dark:bg-black/40 border border-white/20">
                     <p className="text-[10px] font-black uppercase opacity-40 mb-4">Functional Status (ADL/Barthel)</p>
                     <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full border-8 border-orange-500/20 flex items-center justify-center text-2xl font-black text-orange-600">
                           12/20
                        </div>
                        <div>
                           <p className="text-sm font-black uppercase">Ketergantungan Sedang</p>
                           <p className="text-[10px] font-bold opacity-60">Pasien membutuhkan bantuan sebagian.</p>
                        </div>
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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
             {/* Dynamic Hero Section */}
             <div className="bg-gradient-to-br from-[var(--primary)]/10 to-blue-500/5 p-8 rounded-[3rem] border border-[var(--primary)]/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-1000">
                   <Workflow size={240} className="rotate-12" />
                </div>
                <div className="flex items-start gap-8 relative z-10">
                   <div className="w-20 h-20 rounded-3xl bg-[var(--primary)] flex items-center justify-center text-white shadow-2xl shadow-[var(--primary)]/40 transform -rotate-2">
                      {isAssessment ? <ClipboardList size={40} /> : 
                       isMonitoring ? <Activity size={40} /> : 
                       isReport ? <FileText size={40} /> : <PenTool size={40} />}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                         <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-black/20 text-[var(--primary)] text-[9px] font-black tracking-widest uppercase border border-[var(--primary)]/10">
                            Clinical Module Engine v2.0
                         </span>
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Ready</span>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tighter text-[var(--on-surface)] leading-none">{moduleName}</h3>
                      <p className="text-xs font-bold opacity-60 mt-3 max-w-2xl leading-relaxed italic">
                         "Modul ini dikonfigurasi secara otomatis untuk memenuhi standar dokumentasi medis terintegrasi JCI. Pastikan seluruh temuan klinis dicatat dengan akurasi tinggi."
                      </p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="md:col-span-8 space-y-8">
                   
                   {isMonitoring && (
                      <div className="bg-[var(--surface-container-low)] p-8 rounded-[2.5rem] border border-[var(--outline-variant)]">
                         <h4 className="text-xs font-black uppercase tracking-widest text-[var(--primary)] mb-6 flex items-center gap-2">
                            <Activity size={16} /> Vital Signs & Parameters
                         </h4>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['TD', 'NADI', 'SUHU', 'RR', 'SPO2', 'GCS', 'MAP', 'VAS'].map(v => (
                               <div key={v} className="bg-white/40 dark:bg-black/10 p-5 rounded-2xl border border-[var(--outline-variant)] group focus-within:border-[var(--primary)] transition-all">
                                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-2">{v}</label>
                                  <input 
                                     type="text" 
                                     className="bg-transparent border-none w-full text-xl font-black focus:outline-none placeholder:opacity-20" 
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
                      <div className="bg-[var(--surface-container-low)] p-8 rounded-[2.5rem] border border-[var(--outline-variant)]">
                         <h4 className="text-xs font-black uppercase tracking-widest text-[var(--primary)] mb-6 flex items-center gap-2">
                            <ClipboardCheck size={16} /> Clinical Assessment Points
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['Anamnesa Singkat', 'Status Fisik', 'Kondisi Psikologis', 'Kebutuhan Khusus'].map(label => (
                               <div key={label} className="space-y-3">
                                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">{label}</label>
                                  <textarea 
                                     className="w-full bg-white/40 dark:bg-black/10 border border-[var(--outline-variant)] rounded-2xl p-4 text-sm font-bold min-h-[120px] focus:ring-4 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all resize-none shadow-inner"
                                     placeholder={`Tuliskan ${label}...`}
                                     value={formData[label] || ''}
                                     onChange={(e) => setFormData({...formData, [label]: e.target.value})}
                                  />
                               </div>
                            ))}
                         </div>
                      </div>
                   )}

                   <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                         <label className="text-xs font-black uppercase tracking-widest text-[var(--on-surface-variant)] flex items-center gap-2">
                            <PenTool size={16} className="text-[var(--primary)]" /> 
                            Narasi Klinis & Catatan {isReport ? 'Laporan' : 'Tambahan'} *
                         </label>
                         <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                            <Zap size={12} className="animate-pulse" /> Real-time Sync Active
                         </div>
                      </div>
                      <div className="relative group">
                         <textarea 
                            className="w-full bg-[var(--surface-container-low)] border border-[var(--outline-variant)] rounded-[3rem] p-10 text-lg font-bold focus:outline-none focus:ring-8 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] transition-all min-h-[500px] shadow-2xl shadow-inner placeholder:opacity-20 leading-relaxed"
                            placeholder={`Tuliskan dokumentasi lengkap untuk ${moduleName} sesuai regulasi RS & protokol JCI...`}
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                         />
                         <div className="absolute bottom-8 right-10 flex items-center gap-4">
                            <div className="flex -space-x-3">
                               {[1,2,3,4].map(i => (
                                  <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 overflow-hidden shadow-lg">
                                     <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="avatar" />
                                  </div>
                               ))}
                            </div>
                            <span className="text-[10px] font-black text-[var(--on-surface-variant)]/40 uppercase tracking-widest">Collaborating...</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Sidebar Info Panel */}
                <div className="md:col-span-4 space-y-6">
                   <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-500/20 group hover:scale-[1.02] transition-all duration-500">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                         <ShieldCheck size={18} /> Quality & Audit
                      </h4>
                      <p className="text-xs font-medium leading-relaxed opacity-80 mb-6">
                         Dokumentasi ini memenuhi kriteria akreditasi JCI dan KARS. Pastikan waktu (timestamp) sesuai dengan kejadian sebenarnya.
                      </p>
                      <div className="space-y-4 pt-6 border-t border-white/10">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase opacity-40">Dokter/Perawat Pelaksana</span>
                            <span className="text-sm font-black">{currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF'}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase opacity-40">Clinical Unit</span>
                            <span className="text-sm font-black">STATION_04 / OPS</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-[var(--surface-container-high)] rounded-[2.5rem] p-8 border border-[var(--outline-variant)] space-y-6 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Audit Trail Metadata</h4>
                      <div className="space-y-4">
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0">
                               <Clock size={20} className="text-[var(--primary)]" />
                            </div>
                            <div>
                               <p className="text-[11px] font-black uppercase tracking-widest mb-1">Time Created</p>
                               <p className="text-sm font-bold opacity-60">{new Date().toLocaleString()}</p>
                            </div>
                         </div>
                         <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center shrink-0">
                               <BadgeCheck size={20} className="text-emerald-500" />
                            </div>
                            <div>
                               <p className="text-[11px] font-black uppercase tracking-widest mb-1">Verification</p>
                               <p className="text-sm font-bold text-emerald-600">JCI CERTIFIED</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="p-8 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 space-y-3">
                      <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                         <AlertTriangle size={14} /> Attention Required
                      </div>
                      <p className="text-[11px] font-bold text-amber-700/80 leading-relaxed italic">
                         "Pastikan double-check untuk semua dosis obat dan tindakan invasif sebelum finalisasi modul ini."
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4 lg:p-10">
      <div 
        className="absolute inset-0 cursor-zoom-out" 
        onClick={onClose}
      />
      
      <div className="w-full max-w-[1600px] h-full max-h-[900px] bg-[var(--surface-container-lowest)] rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[var(--primary)] via-blue-400 to-[var(--primary)] opacity-50"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="px-12 py-8 flex items-center justify-between border-b border-[var(--outline-variant)] bg-white/50 dark:bg-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[var(--primary)] to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-[var(--primary)]/30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <FileText size={32} />
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                   <span className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black tracking-widest uppercase border border-[var(--primary)]/20">
                      JCI COMMAND CENTER
                   </span>
                   <div className="h-1 w-1 rounded-full bg-[var(--outline-variant)]"></div>
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Enterprise E-MR v2.6</span>
                </div>
                <h2 className="text-3xl font-black text-[var(--on-surface)] tracking-tight uppercase">{moduleName}</h2>
             </div>
          </div>

          <div className="flex items-center gap-8">
             <div className="flex flex-col items-end">
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Patient Focus</p>
                <div className="flex items-center gap-3">
                   <p className="text-lg font-black text-[var(--on-surface)]">{patient?.name || encounter?.patient_name || 'PASIEN'}</p>
                   <div className="px-2 py-1 rounded-lg bg-[var(--surface-container-high)] text-[var(--on-surface-variant)] text-[10px] font-bold">
                      MRN {patient?.mrn || encounter?.mrn || 'N/A'}
                   </div>
                </div>
             </div>
             <button 
                onClick={onClose}
                className="w-14 h-14 rounded-full bg-[var(--surface-container-high)] hover:bg-red-500 hover:text-white flex items-center justify-center transition-all duration-500 shadow-sm group"
             >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
             </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-12 lg:px-20 custom-scrollbar">
           {renderModuleContent()}
        </div>

        {/* Modal Footer */}
        <div className="px-12 py-10 border-t border-[var(--outline-variant)] bg-[var(--surface-container-low)]/30 backdrop-blur-xl flex items-center justify-between">
           <div className="flex items-center gap-6">
              <label className="flex items-center gap-4 cursor-pointer group">
                 <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer hidden" 
                      checked={formData.verification}
                      onChange={(e) => setFormData({...formData, verification: e.target.checked})}
                    />
                    <div className="w-8 h-8 rounded-xl border-2 border-[var(--outline-variant)] peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all duration-300 flex items-center justify-center">
                       <CheckCircle2 size={18} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-sm font-black text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors">Verifikasi Data JCI</span>
                    <span className="text-[10px] font-bold text-[var(--on-surface-variant)] opacity-60">Saya menyatakan data ini akurat & sesuai standar keselamatan pasien.</span>
                 </div>
              </label>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-widest text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)] transition-all"
              >
                 Batal
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`
                  relative overflow-hidden px-12 py-5 rounded-3xl text-sm font-black uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95 flex items-center gap-3
                  ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-br from-[var(--primary)] to-blue-700 hover:brightness-110 shadow-[var(--primary)]/40 hover:shadow-[var(--primary)]/60'}
                `}
              >
                 {isSaving ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     Menyimpan...
                   </>
                 ) : (
                   <>
                     <ShieldAlert size={20} /> Simpan & Finalisasi E-MR
                   </>
                 )}
              </button>
           </div>
        </div>
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
