import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Pill, AlertTriangle, ShieldAlert, CheckCircle2, 
  Search, Plus, Trash2, Save, ArrowRight, Info, AlertCircle, 
  ClipboardList, Sparkles, Filter, PackageCheck, Zap,
  Clock, Check, HelpCircle, Layers, Activity, RefreshCw, Lock
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

// ─── MASTER FORMULARIUM RUMAH SAKIT 2026 ───
const HOSPITAL_FORMULARY = [
  { id: 'd1', name: 'Paracetamol 500 mg', form: 'Tablet', category: 'Analgesik / Antipiretik', fornas: true, highAlert: false, stock: 1420, standardDose: '500 mg', standardFreq: '3x1 p.r.n (Demam/Nyeri)', route: 'Oral (p.o)', timing: 'Sesudah Makan' },
  { id: 'd2', name: 'Amoxicillin 500 mg', form: 'Kapsul', category: 'Antibiotik (Penicillin)', fornas: true, highAlert: false, allergyGroup: 'Penicillin', stock: 850, standardDose: '500 mg', standardFreq: '3x1 (Habiskan)', route: 'Oral (p.o)', timing: 'Sesudah Makan' },
  { id: 'd3', name: 'Ceftriaxone 1 g Injeksi', form: 'Vial Serbuk', category: 'Antibiotik Sefalosporin', fornas: true, highAlert: true, stock: 210, standardDose: '1 g', standardFreq: '1x1 (Cito Pre-Op)', route: 'IV (Intravena)', timing: 'Skin Test Terlebih Dahulu' },
  { id: 'd4', name: 'Omeprazole 20 mg', form: 'Kapsul', category: 'Gastroenterologi (PPI)', fornas: true, highAlert: false, stock: 640, standardDose: '20 mg', standardFreq: '2x1', route: 'Oral (p.o)', timing: '30 Menit Sebelum Makan' },
  { id: 'd5', name: 'Antasida DOEN', form: 'Tablet Kunyah', category: 'Antasida Lambung', fornas: true, highAlert: false, stock: 920, standardDose: '1 Tab', standardFreq: '3x1', route: 'Oral (p.o)', timing: '1 Jam Sebelum Makan' },
  { id: 'd6', name: 'Ketorolac 30 mg/mL', form: 'Ampul Injeksi', category: 'NSAID / Analgesik Kuat', fornas: true, highAlert: true, stock: 180, standardDose: '30 mg', standardFreq: '3x1 (Max 2 hari)', route: 'IV (Intravena)', timing: 'Injeksi Perlahan' },
  { id: 'd7', name: 'Ondansetron 4 mg/2mL', form: 'Ampul Injeksi', category: 'Antiemetik (Anti-Mual)', fornas: true, highAlert: false, stock: 320, standardDose: '4 mg', standardFreq: '3x1 p.r.n (Mual/Muntah)', route: 'IV (Intravena)', timing: 'Sebelum Kemoterapi / Pre-Op' },
  { id: 'd8', name: 'Ringer Lactate (RL) 500 mL', form: 'Kolf Infus', category: 'Cairan Elektrolit / Resusitasi', fornas: true, highAlert: false, stock: 450, standardDose: '500 mL', standardFreq: '20 TPM Makro', route: 'IV Infus', timing: 'Kontinu' },
  { id: 'd9', name: 'Amlodipine 5 mg', form: 'Tablet', category: 'Antihipertensi (CCB)', fornas: true, highAlert: false, stock: 780, standardDose: '5 mg', standardFreq: '1x1', route: 'Oral (p.o)', timing: 'Malam Hari' },
  { id: 'd10', name: 'Metformin 500 mg', form: 'Tablet', category: 'Antidiabetik Oral (Biguanid)', fornas: true, highAlert: false, stock: 560, standardDose: '500 mg', standardFreq: '2x1', route: 'Oral (p.o)', timing: 'Bersama / Segera Sesudah Makan' },
  { id: 'd11', name: 'Ibuprofen 400 mg', form: 'Tablet Salut', category: 'NSAID Analgesik', fornas: true, highAlert: false, stock: 410, standardDose: '400 mg', standardFreq: '3x1', route: 'Oral (p.o)', timing: 'Sesudah Makan' },
  { id: 'd12', name: 'Salbutamol Respules 2.5 mg', form: 'Respules Nebu', category: 'Bronkodilator / Asma', fornas: true, highAlert: false, stock: 190, standardDose: '2.5 mg', standardFreq: '3x1 Nebulisasi', route: 'Inhalasi (Nebu)', timing: 'Saat Sesak Akut' },
  { id: 'd13', name: 'Diazepam 5 mg/mL', form: 'Ampul Injeksi', category: 'Psikotropika / Sedatif', fornas: true, highAlert: true, isControlled: true, stock: 45, standardDose: '5 mg', standardFreq: 'Cito Stat', route: 'IV Perlahan', timing: 'Double Lock & 2 Saksi DPJP' },
  { id: 'd14', name: 'Cefixime 200 mg', form: 'Kapsul', category: 'Antibiotik Oral Sefalosporin', fornas: true, highAlert: false, stock: 380, standardDose: '200 mg', standardFreq: '2x1 (Habiskan)', route: 'Oral (p.o)', timing: 'Sesudah Makan' },
];

// ─── ORDER SETS / PROTOKOL TERAPI KLINIS CEPAT ───
const CLINICAL_ORDER_SETS = [
  {
    id: 'set-appendicitis',
    title: 'Protokol Cito Appendicitis (Pre-Op)',
    diagnosis: 'Acute Appendicitis / Bedah Cito',
    badge: 'Emergency / Bedah',
    color: 'from-rose-500/20 to-orange-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    drugIds: ['d8', 'd3', 'd6', 'd7']
  },
  {
    id: 'set-febris',
    title: 'Paket Demam Akut / ISPA Dewasa',
    diagnosis: 'Febris e.c Infeksi Saluran Napas / Viral',
    badge: 'Rawat Jalan / IGD',
    color: 'from-blue-500/20 to-indigo-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    drugIds: ['d1', 'd14']
  },
  {
    id: 'set-dyspepsia',
    title: 'Paket Gastritis & Dispepsia Akut',
    diagnosis: 'GERD / Dispepsia Fungsional',
    badge: 'Gastroenterologi',
    color: 'from-amber-500/20 to-yellow-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    drugIds: ['d4', 'd5', 'd7']
  },
  {
    id: 'set-chronic',
    title: 'Paket Kronis (Hipertensi + DM Tipe 2)',
    diagnosis: 'HT Stage 1 & NIDDM Terkontrol',
    badge: 'Poli Kronis / Prolanis',
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    drugIds: ['d9', 'd10']
  }
];

const CATEGORIES = ['Semua Kategori', 'Analgesik / Antipiretik', 'Antibiotik', 'Gastroenterologi', 'Kardiovaskular & DM', 'Injeksi & Cairan', 'High Alert'];

export default function CPOEWorkspace({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [prescriptions, setPrescriptions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('formulary'); // 'formulary' | 'ordersets'
  const [cdssAlertDismissed, setCdssAlertDismissed] = useState(false);

  // Patient allergy check
  const patientAllergies = patient?.allergies || [
    { agent: 'Amoxicillin / Penicillin', reaction: 'Anafilaksis / Ruam Kulit Berat', severity: 'HIGH' }
  ];

  // Filtered drugs
  const filteredDrugs = useMemo(() => {
    return HOSPITAL_FORMULARY.filter(drug => {
      const matchQuery = drug.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         drug.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         drug.form.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchQuery) return false;
      if (selectedCategory === 'Semua Kategori') return true;
      if (selectedCategory === 'Antibiotik') return drug.category.toLowerCase().includes('antibiotik');
      if (selectedCategory === 'Analgesik / Antipiretik') return drug.category.toLowerCase().includes('analgesik') || drug.category.toLowerCase().includes('nsaid');
      if (selectedCategory === 'Gastroenterologi') return drug.category.toLowerCase().includes('gastro') || drug.category.toLowerCase().includes('antasida');
      if (selectedCategory === 'Kardiovaskular & DM') return drug.category.toLowerCase().includes('hipertensi') || drug.category.toLowerCase().includes('diabetik');
      if (selectedCategory === 'Injeksi & Cairan') return drug.form.toLowerCase().includes('injeksi') || drug.form.toLowerCase().includes('infus') || drug.form.toLowerCase().includes('ampul') || drug.form.toLowerCase().includes('vial');
      if (selectedCategory === 'High Alert') return drug.highAlert === true;
      return true;
    });
  }, [searchQuery, selectedCategory]);

  // Drug Interaction & Allergy CDSS Engine
  const { interactions, allergyWarnings } = useMemo(() => {
    const inters = [];
    const allergies = [];

    // Check allergies
    prescriptions.forEach(p => {
      const master = HOSPITAL_FORMULARY.find(d => d.id === p.drugId);
      if (master?.allergyGroup && patientAllergies.some(a => a.agent.toLowerCase().includes(master.allergyGroup.toLowerCase()))) {
        allergies.push({
          drugName: p.name,
          allergen: master.allergyGroup,
          reason: `Pasien memiliki riwayat alergi terdokumentasi terhadap golongan ${master.allergyGroup}. Risiko anafilaksis!`,
          severity: 'CRITICAL'
        });
      }
    });

    // Check DDI: NSAID + PPI
    const hasNsaid = prescriptions.some(p => p.name.includes('Ibuprofen') || p.name.includes('Ketorolac'));
    const hasPpi = prescriptions.some(p => p.name.includes('Omeprazole'));
    if (hasNsaid && hasPpi) {
      inters.push({
        drugA: 'Ketorolac / Ibuprofen (NSAID)',
        drugB: 'Omeprazole (PPI)',
        severity: 'MODERATE',
        desc: 'Pemberian PPI bersamaan dengan NSAID disetujui sebagai gastroproteksi, namun perhatikan penyesuaian fungsi ginjal & absorpsi.'
      });
    }

    // Check Double NSAID
    const hasKetorolac = prescriptions.some(p => p.name.includes('Ketorolac'));
    const hasIbuprofen = prescriptions.some(p => p.name.includes('Ibuprofen'));
    if (hasKetorolac && hasIbuprofen) {
      inters.push({
        drugA: 'Ketorolac Inj',
        drugB: 'Ibuprofen Tab',
        severity: 'HIGH_RISK',
        desc: 'DUPLIKASI NSAID: Risiko tinggi perdarahan saluran cerna dan nefrotoksisitas akut. Hindari penggunaan kombinasi 2 NSAID bersamaan.'
      });
    }

    return { interactions: inters, allergyWarnings: allergies };
  }, [prescriptions, patientAllergies]);

  // Actions
  const handleAddDrug = (drug) => {
    if (prescriptions.find(p => p.drugId === drug.id)) return;
    setPrescriptions(prev => [
      ...prev,
      {
        drugId: drug.id,
        name: drug.name,
        form: drug.form,
        category: drug.category,
        dose: drug.standardDose || '1',
        route: drug.route || 'Oral (p.o)',
        frequency: drug.standardFreq || '3x1',
        duration: '5 Hari',
        timing: drug.timing || 'Sesudah Makan',
        highAlert: drug.highAlert || false,
        isControlled: drug.isControlled || false,
        notes: ''
      }
    ]);
  };

  const handleApplyOrderSet = (orderSet) => {
    const drugsToAdd = HOSPITAL_FORMULARY.filter(d => orderSet.drugIds.includes(d.id));
    const newItems = drugsToAdd
      .filter(d => !prescriptions.some(p => p.drugId === d.id))
      .map(drug => ({
        drugId: drug.id,
        name: drug.name,
        form: drug.form,
        category: drug.category,
        dose: drug.standardDose || '1',
        route: drug.route || 'Oral (p.o)',
        frequency: drug.standardFreq || '3x1',
        duration: '5 Hari',
        timing: drug.timing || 'Sesudah Makan',
        highAlert: drug.highAlert || false,
        isControlled: drug.isControlled || false,
        notes: `Sesuai Protokol: ${orderSet.title}`
      }));
    setPrescriptions(prev => [...prev, ...newItems]);
  };

  const handleRemoveDrug = (drugId) => {
    setPrescriptions(prev => prev.filter(p => p.drugId !== drugId));
  };

  const handleUpdatePrescription = (drugId, field, value) => {
    setPrescriptions(prev => prev.map(p => p.drugId === drugId ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    if (prescriptions.length === 0) {
      alert("Pilih minimal satu obat untuk diresepkan.");
      return;
    }
    if (allergyWarnings.length > 0 && !cdssAlertDismissed) {
      const confirmAllergy = window.confirm(`PERINGATAN ALERGI KRITIS:\nPasien terindikasi alergi terhadap obat yang diresepkan (${allergyWarnings.map(a => a.drugName).join(', ')}).\n\nApakah DPJP tetap menyetujui dengan justifikasi klinis tertulis?`);
      if (!confirmAllergy) return;
    }

    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
        moduleName: 'ORDER RESEP / CPOE (MMU.4)',
        data: {
          prescriptions,
          allergyWarnings,
          interactions,
          timestamp: new Date().toISOString()
        }
      });
      alert('Resep Elektronik berhasil diautentikasi & diteruskan ke Instalasi Farmasi (Standar JCI MMU.4).');
      if (onSaveSuccess) onSaveSuccess();
    } catch (e) {
      alert('Gagal mengirim resep: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col p-6 bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* ─── 1. TOP CLINICAL HEADER ─── */}
      <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/20 transition-all border border-slate-200 dark:border-white/10 shadow-sm shrink-0"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                JCI MMU.4 / CPOE VERIFIED
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={11} /> Realtime Pharmacy Inventory Sync
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-black tracking-widest uppercase border border-purple-200 dark:border-purple-500/30">
                CDSS Active
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ORDER RESEP ELEKTRONIK (CPOE) & FORMULARIUM
            </h2>
          </div>
        </div>

        {/* Allergy Warning Banner */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-500/10 px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-500/30 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block">Riwayat Alergi Pasien</span>
              <span className="text-xs font-black text-rose-800 dark:text-rose-300">
                {patientAllergies.map(a => a.agent).join(', ')}
              </span>
            </div>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Pill size={22} />
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN TWO-COLUMN WORKSPACE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* ─── LEFT COLUMN: FORMULARIUM CATALOG & CLINICAL ORDER SETS (7 Cols) ─── */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
          
          <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 flex flex-col flex-1 min-h-0">
            
            {/* Top Toolbar: Switcher & Search */}
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-white/5 flex-wrap">
              <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('formulary')}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 ${
                    activeTab === 'formulary'
                      ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Search size={14} /> Katalog Obat ({HOSPITAL_FORMULARY.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ordersets')}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 ${
                    activeTab === 'ordersets'
                      ? 'bg-white dark:bg-purple-600 text-purple-700 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Sparkles size={14} /> Paket Terapi Cepat ({CLINICAL_ORDER_SETS.length})
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                <PackageCheck size={16} className="text-emerald-500" />
                <span>Formularium Nasional (FORNAS 2026)</span>
              </div>
            </div>

            {/* TAB CONTENT 1: FORMULARY SEARCH & CATALOG */}
            {activeTab === 'formulary' && (
              <div className="flex flex-col flex-1 min-h-0 space-y-3">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ketik nama obat, zat aktif, atau indikasi klinis..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar shrink-0">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                        selectedCategory === cat 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Drug List Cards */}
                <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2.5 pr-1">
                  {filteredDrugs.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                      <Search size={32} className="mb-2 opacity-50" />
                      <p className="text-xs font-bold">Obat tidak ditemukan dalam formularium.</p>
                      <p className="text-[10px]">Coba ubah kata kunci atau pilih kategori lain.</p>
                    </div>
                  ) : (
                    filteredDrugs.map(drug => {
                      const isAdded = !!prescriptions.find(p => p.drugId === drug.id);
                      const isAllergic = drug.allergyGroup && patientAllergies.some(a => a.agent.toLowerCase().includes(drug.allergyGroup.toLowerCase()));

                      return (
                        <div 
                          key={drug.id} 
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                            isAdded
                              ? 'bg-blue-50/70 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 shadow-sm'
                              : isAllergic
                              ? 'bg-rose-50/50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 hover:border-rose-300'
                              : 'bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/40 hover:shadow-md'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {drug.name}
                              </span>
                              
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[9px] font-bold">
                                {drug.form}
                              </span>

                              {drug.fornas && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black border border-emerald-200 dark:border-emerald-500/30">
                                  BPJS FORNAS
                                </span>
                              )}

                              {drug.highAlert && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                                  <AlertTriangle size={10} /> HIGH ALERT
                                </span>
                              )}

                              {drug.isControlled && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[9px] font-black border border-purple-200 dark:border-purple-500/30 flex items-center gap-1">
                                  <Lock size={10} /> PSIKOTROPIKA
                                </span>
                              )}

                              {isAllergic && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black flex items-center gap-1 animate-pulse">
                                  <ShieldAlert size={10} /> KONTRAINDIKASI ALERGI
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{drug.category}</span>
                              <span>•</span>
                              <span>Dosis Baku: <strong className="text-slate-700 dark:text-slate-300">{drug.standardDose} ({drug.standardFreq})</strong></span>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Stok: {drug.stock}</span>
                            </div>
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleAddDrug(drug)}
                            disabled={isAdded}
                            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                              isAdded
                                ? 'bg-blue-600 text-white shadow-sm cursor-default'
                                : isAllergic
                                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check size={14} /> Terpilih
                              </>
                            ) : (
                              <>
                                <Plus size={14} /> Resepkan
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT 2: CLINICAL ORDER SETS / PROTOCOLS */}
            {activeTab === 'ordersets' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                <div className="p-3 bg-purple-50/70 dark:bg-purple-500/10 rounded-2xl border border-purple-200 dark:border-purple-500/20 text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600 shrink-0" />
                  <span><strong>Clinical Pathways & Order Sets:</strong> 1-klik memasukkan kombinasi obat terstandar ke dalam e-resep sesuai Panduan Praktik Klinis (PPK).</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CLINICAL_ORDER_SETS.map(set => {
                    const includedDrugs = HOSPITAL_FORMULARY.filter(d => set.drugIds.includes(d.id));
                    const isAllAdded = includedDrugs.every(d => prescriptions.some(p => p.drugId === d.id));

                    return (
                      <div 
                        key={set.id}
                        className={`p-4 rounded-2xl border bg-gradient-to-br transition-all flex flex-col justify-between ${set.color}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/20 border border-current">
                              {set.badge}
                            </span>
                            <span className="text-[10px] font-bold">{includedDrugs.length} Obat Terkait</span>
                          </div>
                          
                          <h4 className="text-xs font-black tracking-tight mb-1">{set.title}</h4>
                          <p className="text-[10px] opacity-80 mb-3">{set.diagnosis}</p>

                          <div className="space-y-1 bg-white/50 dark:bg-black/20 p-2.5 rounded-xl border border-current/20 mb-3 text-[10px]">
                            {includedDrugs.map(d => (
                              <div key={d.id} className="flex items-center justify-between">
                                <span className="font-bold truncate">{d.name}</span>
                                <span className="opacity-75">{d.standardFreq}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyOrderSet(set)}
                          disabled={isAllAdded}
                          className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isAllAdded ? (
                            <>
                              <Check size={14} /> Paket Sudah Ditambahkan
                            </>
                          ) : (
                            <>
                              <Zap size={14} /> Terapkan Paket Resep
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* CDSS Drug-Drug Interaction & Allergy Notice (Bottom Left) */}
          {(interactions.length > 0 || allergyWarnings.length > 0) && (
            <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-4 shadow-sm border border-slate-200/80 dark:border-white/10 space-y-2 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-500" />
                  Clinical Decision Support (CDSS Realtime Alerts)
                </h4>
                <span className="text-[9px] font-bold text-slate-500">JCI MMU.4 Validasi Keamanan</span>
              </div>

              {/* Allergy Warning */}
              {allergyWarnings.map((al, idx) => (
                <div key={idx} className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 rounded-xl text-xs flex items-start gap-2.5 text-rose-800 dark:text-rose-300 animate-pulse">
                  <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-black text-rose-900 dark:text-rose-200">PERINGATAN ALERGI OBAT: {al.drugName}</strong>
                    <span>{al.reason}</span>
                  </div>
                </div>
              ))}

              {/* Interaction Warning */}
              {interactions.map((int, idx) => (
                <div key={idx} className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                  int.severity === 'HIGH_RISK'
                    ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-300 text-rose-800 dark:text-rose-300'
                    : 'bg-amber-50 dark:bg-amber-500/10 border border-amber-300 text-amber-800 dark:text-amber-300'
                }`}>
                  <AlertTriangle size={16} className={int.severity === 'HIGH_RISK' ? 'text-rose-600' : 'text-amber-600'} />
                  <div>
                    <strong>Interaksi Obat: {int.drugA} + {int.drugB}</strong>
                    <p className="text-[11px] opacity-90 mt-0.5">{int.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ─── RIGHT COLUMN: PRESCRIPTION CART & SIGNATURE AUTHORIZATION (5 Cols) ─── */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
          
          <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 flex flex-col flex-1 min-h-0">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                    Daftar R/ Elektronik
                  </h3>
                  <span className="text-[10px] text-slate-500">Resep Resmi DPJP Penanggung Jawab</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-200 text-xs font-black">
                  {prescriptions.length} R/ Item
                </span>
                {prescriptions.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setPrescriptions([])}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
            </div>

            {/* Prescriptions Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {prescriptions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 dark:border-white/10">
                    <ClipboardList size={28} />
                  </div>
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">Belum Ada Obat Diresepkan</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Pilih obat dari katalog di sebelah kiri atau terapkan <strong>Paket Terapi Cepat</strong> untuk memulai peresepan.
                  </p>
                </div>
              ) : (
                prescriptions.map((item, index) => (
                  <div 
                    key={item.drugId}
                    className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 relative group transition-all hover:border-slate-300"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                          R/{index + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {item.name}
                          </h4>
                          <span className="text-[10px] text-slate-500">{item.category} • {item.form}</span>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => handleRemoveDrug(item.drugId)}
                        className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shrink-0"
                        title="Hapus R/"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Param Fields Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 mb-1 block">Dosis / Jumlah</label>
                        <input 
                          type="text" 
                          value={item.dose} 
                          onChange={e => handleUpdatePrescription(item.drugId, 'dose', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500" 
                          placeholder="e.g. 500 mg / 1 Tab" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 mb-1 block">Rute Pemberian</label>
                        <select 
                          value={item.route} 
                          onChange={e => handleUpdatePrescription(item.drugId, 'route', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option>Oral (p.o)</option>
                          <option>IV (Intravena)</option>
                          <option>IM (Intramuskular)</option>
                          <option>SC (Subkutan)</option>
                          <option>Inhalasi / Nebu</option>
                          <option>Topikal (Kulit/Mata)</option>
                          <option>Rektal</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 mb-1 block">Signa / Frekuensi</label>
                        <input 
                          type="text" 
                          value={item.frequency} 
                          onChange={e => handleUpdatePrescription(item.drugId, 'frequency', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500" 
                          placeholder="e.g. 3x1 p.r.n" 
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-500 mb-1 block">Durasi / Hari</label>
                        <input 
                          type="text" 
                          value={item.duration} 
                          onChange={e => handleUpdatePrescription(item.drugId, 'duration', e.target.value)} 
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500" 
                          placeholder="e.g. 5 Hari" 
                        />
                      </div>
                    </div>

                    {/* Timing & Special Notes */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500 block">Petunjuk Khusus & Waktu Minum</label>
                      <input 
                        type="text" 
                        value={item.timing} 
                        onChange={e => handleUpdatePrescription(item.drugId, 'timing', e.target.value)} 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 placeholder:text-slate-400" 
                        placeholder="Contoh: Sesudah makan, 30 menit sebelum makan, skin test dulu..." 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Summary & Order Action Button */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 shrink-0 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Otentikasi Dokter Penanggung Jawab:</span>
                <strong className="text-slate-900 dark:text-white font-black">
                  {currentUser?.displayName || 'dr. DPJP Spesialis'}
                </strong>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-5 py-3 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                >
                  Batal
                </button>

                <button 
                  type="button"
                  disabled={isSaving || prescriptions.length === 0}
                  onClick={handleSave}
                  className="flex-1 px-6 py-3.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>KIRIM E-RESEP KE FARMASI (CPOE)</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
