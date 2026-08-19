/**
 * NurseFlow Enterprise HIS 2026 — Doctor Fast-Flow Workspace Reference Implementation
 * Standards: 3-Column Zero-Click Clinical Consultation Grid, Permenkes 24/2022 CPPT,
 * Integrated Real-Time CDSS Guard, 1-Click CPOE Quick Order Tray, Crash-Proof Local Drafts.
 */

import React, { useState, useEffect } from 'react';
import { soapEngineService } from '../../emr/services/soapEngine.service.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import ClinicalDecisionSupportCard from './ClinicalDecisionSupportCard.jsx';
import UniversalOrderModal from './UniversalOrderModal.jsx';
import toast from 'react-hot-toast';

export default function DoctorSoapWorkspace({ patient, encounter, onSaved }) {
  const { setLiveContext } = useEncounterStore();

  // SOAP Form Fields
  const [subjective, setSubjective] = useState('Pasien mengeluh demam tinggi sejak 3 hari lalu disertai menggigil, mual, dan badan lemas.');
  const [objectiveVitals, setObjectiveVitals] = useState({
    hr: 104,
    sbp: 100,
    dbp: 70,
    rr: 22,
    spo2: 96,
    temp: 38.6,
    gcs: 15
  });
  const [physicalExam, setPhysicalExam] = useState('Kepala: Konjungtiva anemis (-), Sklera ikterik (-)\nThoraks: Cor S1-S2 reguler murmur (-), Pulmo vesikuler (+/+)\nAbdomen: Supel, bising usus normal, nyeri tekan epigastrium (+)\nEkstremitas: Akral hangat, CRT < 2 detik');
  
  // Assessment
  const [primaryIcd10, setPrimaryIcd10] = useState('A90');
  const [primaryIcd10Name, setPrimaryIcd10Name] = useState('Dengue fever [classical dengue]');
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState('R50.9 - Fever, unspecified');

  // Plan & Disposition
  const [plan, setPlan] = useState('1. Infus Ringer Lactate 2000 ml / 24 jam\n2. Cek Darah Lengkap per 12 jam serial\n3. Paracetamol 500 mg tab 3x1 p.r.n demam\n4. Edukasi istirahat tirah baring & minum air 2.5L/hari');
  const [disposition, setDisposition] = useState('INPATIENT_ADMISSION');

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [lastDraftSaveTime, setLastDraftSaveTime] = useState(null);

  // Quick CPOE Tray Pending Items
  const [quickOrders, setQuickOrders] = useState([]);

  // Auto-Save Draft Key
  const DRAFT_KEY = patient ? `nurseflow_soap_draft_${patient.id || patient.mrn}` : null;

  useEffect(() => {
    if (!DRAFT_KEY) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        setHasSavedDraft(true);
      }
    } catch (e) {
      console.warn('Failed to check SOAP draft:', e);
    }
  }, [DRAFT_KEY]);

  // Persist draft on every change
  useEffect(() => {
    if (!DRAFT_KEY) return;
    try {
      const draftPayload = {
        subjective,
        objectiveVitals,
        physicalExam,
        primaryIcd10,
        primaryIcd10Name,
        secondaryDiagnoses,
        plan,
        disposition,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload));
      setLastDraftSaveTime(new Date().toLocaleTimeString('id-ID'));
    } catch (e) {
      console.warn('Failed to auto-save SOAP draft:', e);
    }
  }, [DRAFT_KEY, subjective, objectiveVitals, physicalExam, primaryIcd10, primaryIcd10Name, secondaryDiagnoses, plan, disposition]);

  const handleRestoreDraft = () => {
    if (!DRAFT_KEY) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.subjective) setSubjective(parsed.subjective);
        if (parsed.objectiveVitals) setObjectiveVitals(parsed.objectiveVitals);
        if (parsed.physicalExam) setPhysicalExam(parsed.physicalExam);
        if (parsed.primaryIcd10) setPrimaryIcd10(parsed.primaryIcd10);
        if (parsed.primaryIcd10Name) setPrimaryIcd10Name(parsed.primaryIcd10Name);
        if (parsed.secondaryDiagnoses) setSecondaryDiagnoses(parsed.secondaryDiagnoses);
        if (parsed.plan) setPlan(parsed.plan);
        if (parsed.disposition) setDisposition(parsed.disposition);
        toast.success('Draf SOAP berhasil dipulihkan dari sesi lokal!');
        setHasSavedDraft(false);
      }
    } catch (e) {
      toast.error('Gagal memulihkan draf SOAP.');
    }
  };

  const handleDiscardDraft = () => {
    if (DRAFT_KEY) {
      localStorage.removeItem(DRAFT_KEY);
    }
    setHasSavedDraft(false);
    toast('Draf SOAP dibersihkan.', { icon: '🗑️' });
  };

  // Quick Template Chips
  const applyTemplate = (type) => {
    if (type === 'DENGUE') {
      setSubjective('Pasien mengeluh demam mendadak tinggi 3 hari, menggigil, nyeri retro-orbital, mual muntah 2x, nafsu makan menurun.');
      setPrimaryIcd10('A90');
      setPrimaryIcd10Name('Dengue fever [classical dengue]');
      setPlan('1. Rawat inap bangsal\n2. IVFD Ringer Lactate 2000 cc/24 jam\n3. Paracetamol 500mg tab 3x1 prn\n4. Monitoring serial trombosit/hematokrit per 12 jam');
      toast.success('Template Febris Dengue diterapkan!');
    } else if (type === 'CHEST_PAIN') {
      setSubjective('Pasien mengeluh nyeri dada substernal rasa tertindih benda berat menjalar ke lengan kiri dan leher, durasi > 20 menit, keringat dingin (+).');
      setPrimaryIcd10('I21.9');
      setPrimaryIcd10Name('Acute myocardial infarction, unspecified (STEMI)');
      setPlan('1. Oksigen nasal kanul 3 lpm\n2. Loading Aspilet 160mg + Clopidogrel 300mg oral\n3. ISDN 5mg sublingual\n4. EKG 12-lead serial CITO & Konsul Sp.JP CITO');
      toast.success('Template Sindrom Koroner Akut diterapkan!');
    } else if (type === 'DYSPNEA') {
      setSubjective('Pasien mengeluh sesak napas berat, batuk berdahak kuning kental, mengi (+), riwayat asma bronkial.');
      setPrimaryIcd10('J45.9');
      setPrimaryIcd10Name('Asthma, unspecified (Acute Exacerbation)');
      setPlan('1. Nebulisasi Combivent 1 resp + Pulmicort 1 resp per 8 jam\n2. Methylprednisolone 62.5mg IV\n3. Oksigen kanul 3 lpm target SpO2 > 95%\n4. Cek AGD & Foto Thorax PA');
      toast.success('Template Asma / Sesak diterapkan!');
    }
  };

  // 1-Click Quick Order Addition
  const handleAddQuickOrder = (category, item) => {
    const newOrder = { id: `ORD-${Date.now()}`, category, item, timestamp: new Date().toLocaleTimeString('id-ID') };
    setQuickOrders(prev => [...prev, newOrder]);
    setPlan(prev => `${prev}\n- [Order ${category}]: ${item}`);
    toast.success(`⚡ Order 1-Click ditambahkan: ${item}`, { icon: '📦' });
  };

  const handleSaveSoap = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const record = await soapEngineService.recordSoapNote({
        episodeId: encounter?.episodeId || 'EOC-2026-001',
        encounterId: encounter?.id || 'ENC-2026-001',
        patientId: patient?.id || 'PAT-001',
        patientName: patient?.name || 'Budi Santoso',
        mrn: patient?.mrn || '0019283',
        subjective,
        objective: `TTV: TD ${objectiveVitals.sbp}/${objectiveVitals.dbp} mmHg, HR ${objectiveVitals.hr} bpm, RR ${objectiveVitals.rr} x/m, Temp ${objectiveVitals.temp}°C, SpO2 ${objectiveVitals.spo2}%, GCS ${objectiveVitals.gcs}.\n\nPemeriksaan Fisik:\n${physicalExam}`,
        assessment: `${primaryIcd10} - ${primaryIcd10Name}. ${secondaryDiagnoses}`,
        plan,
        primaryIcd10,
        primaryIcd10Name,
        secondaryIcd10: [{ code: 'R50.9', name: 'Fever, unspecified' }],
        physicianId: 'DOC-1001',
        physicianName: 'dr. Surya Johnson, Sp.PD-KGEH'
      });

      toast.success('✅ CPPT / SOAP berhasil disimpan & ditandatangani secara digital (BSrE PKI)!');
      if (DRAFT_KEY) {
        localStorage.removeItem(DRAFT_KEY);
      }
      setHasSavedDraft(false);
      if (onSaved) onSaved(record);
    } catch (err) {
      toast.error(`Gagal menyimpan CPPT: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyCdss = (orders) => {
    toast.success(`💡 ${orders.length} order protokol CDSS otomatis ditambahkan ke rencana terapi!`);
    setPlan(prev => `${prev}\n\n[CDSS Protokol Terapan]:\n- ${orders.join('\n- ')}`);
  };

  // Safe Fallback Patient
  const p = patient || {
    id: 'PAT-DEMO',
    name: 'Bpk. Budi Santoso',
    mrn: '0019283',
    gender: 'male',
    age: '45 Th',
    room: 'Bed 07 (IGD)',
    payer: 'BPJS Kesehatan',
    allergies: ['Penisilin', 'Amoxicillin']
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
      
      {/* Auto-Save Draft Alert */}
      {hasSavedDraft && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg">restore_page</span>
            <span className="font-bold">Ditemukan draf SOAP lokal belum tersimpan dari sesi sebelumnya.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-xs"
            >
              Pulihkan Draf
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2 py-1 rounded-lg text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-500/20 cursor-pointer"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* ─── 3-COLUMN ZERO-CLICK CLINICAL CONSULTATION GRID ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* ========================================================================= */}
        {/* COLUMN 1: PATIENT IDENTITY, VITALS HUD & ACTIVE CONDITIONS (3 Cols)       */}
        {/* ========================================================================= */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          
          {/* Patient Card */}
          <div className="clinical-card bg-white dark:bg-slate-900 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Identitas Pasien</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-[10px]">
                {p.payer || 'BPJS AKTIF'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#015C80] text-white flex items-center justify-center font-black text-base shadow-sm">
                {p.gender === 'female' || p.gender === 'F' ? '👩' : '👨'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">{p.name}</span>
                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">No. RM: {p.mrn}</span>
                <span className="text-[11px] text-slate-500">{p.age || '45 Th'} • {p.room || 'Bed 07 (IGD)'}</span>
              </div>
            </div>

            {/* High-Alert Allergies */}
            {p.allergies && p.allergies.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500 flex items-center gap-2 text-rose-900 dark:text-rose-100 text-xs font-black shadow-xs">
                <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-lg">warning</span>
                <div>
                  <span className="text-[10px] uppercase tracking-wider block text-rose-600 dark:text-rose-400">Alergi Pasien:</span>
                  <span>{p.allergies.join(', ').toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Vital Signs HUD Card */}
          <div className="clinical-card bg-white dark:bg-slate-900 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Tanda Vital Terakhir</span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-100 border border-amber-500 font-mono font-black text-[10px]">
                NEWS2: 6 (SEDANG)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Tekanan Darah</span>
                <span className="font-black text-slate-900 dark:text-white text-sm">{objectiveVitals.sbp}/{objectiveVitals.dbp}</span>
                <span className="text-[10px] text-slate-500 block">mmHg</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Denyut Nadi</span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-sm">{objectiveVitals.hr}</span>
                <span className="text-[10px] text-slate-500 block">x/menit (Takikardia)</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Suhu Tubuh</span>
                <span className="font-black text-amber-600 dark:text-amber-400 text-sm">{objectiveVitals.temp}°C</span>
                <span className="text-[10px] text-slate-500 block">Febris</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">SpO2 / Saturasi</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{objectiveVitals.spo2}%</span>
                <span className="text-[10px] text-slate-500 block">Udara Ruangan</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: STRUCTURED SOAP WORKSPACE (6 Cols)                              */}
        {/* ========================================================================= */}
        <div className="xl:col-span-6 flex flex-col gap-4">
          
          {/* Quick Anamnesis Template Chips */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Template Cepat:</span>
            <button
              type="button"
              onClick={() => applyTemplate('DENGUE')}
              className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold hover:bg-sky-200 cursor-pointer border border-sky-300 dark:border-sky-800 text-xs"
            >
              🌡️ Febris Dengue (DHF)
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('CHEST_PAIN')}
              className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold hover:bg-rose-200 cursor-pointer border border-rose-300 dark:border-rose-800 text-xs"
            >
              💔 Nyeri Dada (SKA/STEMI)
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('DYSPNEA')}
              className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-200 cursor-pointer border border-amber-300 dark:border-amber-800 text-xs"
            >
              🫁 Sesak Napas / Asma
            </button>
          </div>

          {/* Main SOAP Form */}
          <form onSubmit={handleSaveSoap} className="clinical-card bg-white dark:bg-slate-900 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#015C80] text-xl">edit_document</span>
                <span className="font-black text-sm text-slate-900 dark:text-white">CPPT / Rekam Medis Elektronik Terintegrasi</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {lastDraftSaveTime ? `Draf Otomatis: ${lastDraftSaveTime}` : 'Siap Ditandatangani'}
              </span>
            </div>

            {/* S - Subjective */}
            <div>
              <label className="text-[11px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider block mb-1">
                S — Subjective (Anamnesis & Keluhan Utama)
              </label>
              <textarea
                rows={3}
                value={subjective}
                onChange={e => setSubjective(e.target.value)}
                className="form-input text-xs font-medium resize-y"
                placeholder="Tuliskan keluhan utama, riwayat penyakit sekarang, riwayat pengobatan..."
                required
              />
            </div>

            {/* O - Objective */}
            <div>
              <label className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                O — Objective (Pemeriksaan Fisik Sistematis)
              </label>
              <textarea
                rows={3}
                value={physicalExam}
                onChange={e => setPhysicalExam(e.target.value)}
                className="form-input text-xs font-medium resize-y"
                placeholder="Pemeriksaan kepala, leher, thoraks, abdomen, ekstremitas..."
              />
            </div>

            {/* A - Assessment */}
            <div>
              <label className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                A — Assessment (Diagnosis Primer & ICD-10)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={primaryIcd10}
                  onChange={e => {
                    setPrimaryIcd10(e.target.value);
                    if (e.target.value === 'A90') setPrimaryIcd10Name('Dengue fever [classical dengue]');
                    else if (e.target.value === 'A41.9') setPrimaryIcd10Name('Sepsis, unspecified organism');
                    else if (e.target.value === 'I21.9') setPrimaryIcd10Name('Acute myocardial infarction, unspecified (STEMI)');
                    else if (e.target.value === 'J45.9') setPrimaryIcd10Name('Asthma, unspecified (Acute Exacerbation)');
                  }}
                  className="form-input text-xs font-bold"
                >
                  <option value="A90">A90 - Dengue fever</option>
                  <option value="A41.9">A41.9 - Sepsis, unspecified</option>
                  <option value="I21.9">I21.9 - Acute MI (STEMI)</option>
                  <option value="J45.9">J45.9 - Asthma Exacerbation</option>
                </select>

                <input
                  type="text"
                  value={secondaryDiagnoses}
                  onChange={e => setSecondaryDiagnoses(e.target.value)}
                  placeholder="Diagnosis Sekunder / Komorbid..."
                  className="form-input text-xs font-bold"
                />
              </div>
            </div>

            {/* P - Plan */}
            <div>
              <label className="text-[11px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider block mb-1">
                P — Plan (Instruksi Medis Terintegrasi CPOE)
              </label>
              <textarea
                rows={4}
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="form-input text-xs font-mono resize-y"
                placeholder="Rencana terapi cairan, medikasi, instruksi keperawatan..."
                required
              />
            </div>

            {/* Disposition & Submit */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-black text-slate-900 dark:text-white block">Disposisi Pasien:</span>
                <select
                  value={disposition}
                  onChange={e => setDisposition(e.target.value)}
                  className="mt-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  <option value="INPATIENT_ADMISSION">🏥 Admisi Rawat Inap (Bangsal Melati)</option>
                  <option value="OUTPATIENT_DISCHARGE">🏠 Rawat Jalan (Boleh Pulang)</option>
                  <option value="ICU_TRANSFER">🚨 Transfer ICU (Kritis)</option>
                  <option value="SURGERY_CITO">🔪 Operasi Cito (IBS)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary text-xs py-2.5 px-5 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">verified</span>
                <span>{isSaving ? 'Menyimpan...' : 'Tandatangani CPPT (BSrE PKI)'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: REAL-TIME CDSS GUARD & 1-CLICK CPOE QUICK ORDER TRAY (3 Cols)   */}
        {/* ========================================================================= */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          
          {/* CDSS Safety Guard Card */}
          <ClinicalDecisionSupportCard
            diagnosis={primaryIcd10Name}
            vitals={objectiveVitals}
            onApplyProtocol={handleApplyCdss}
          />

          {/* 1-Click CPOE Quick Order Tray */}
          <div className="clinical-card bg-white dark:bg-slate-900 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">1-Click CPOE Order Tray</span>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">Instan</span>
            </div>

            {/* Quick Lab Section */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500">Laboratorium CITO:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('LAB', 'Darah Lengkap (CBC + Diff)')}
                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 hover:bg-sky-100 text-sky-900 dark:text-sky-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  🧪 Darah Lengkap
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('LAB', 'Elektrolit Serum (Na/K/Cl)')}
                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 hover:bg-sky-100 text-sky-900 dark:text-sky-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  🧪 Elektrolit
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('LAB', 'Fungsi Ginjal (Ureum/Creatinine)')}
                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 hover:bg-sky-100 text-sky-900 dark:text-sky-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  🧪 Ureum/Kreatinin
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('LAB', 'Fungsi Hati (SGOT/SGPT)')}
                  className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 hover:bg-sky-100 text-sky-900 dark:text-sky-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  🧪 SGOT / SGPT
                </button>
              </div>
            </div>

            {/* Quick Radiology Section */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-black uppercase text-slate-500">Radiologi / Imaging:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('RAD', 'Foto Thorax AP/PA')}
                  className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-900 dark:text-indigo-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  🩻 Foto Thorax PA
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('RAD', 'USG Abdomen FAST')}
                  className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 hover:bg-indigo-100 text-indigo-900 dark:text-indigo-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  📡 USG Abdomen
                </button>
              </div>
            </div>

            {/* Quick Medications Section */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-black uppercase text-slate-500">Farmasi / Obat Formularium:</span>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('MED', 'Paracetamol 500mg tab 3x1 p.r.n (Demam)')}
                  className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 hover:bg-teal-100 text-teal-900 dark:text-teal-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  💊 Paracetamol 500mg (Oral)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('MED', 'Infus Ringer Lactate 500ml / 8 jam')}
                  className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 hover:bg-teal-100 text-teal-900 dark:text-teal-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  💧 Infus Ringer Lactate (IV)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuickOrder('MED', 'Ceftriaxone 1g vial IV / 12 jam (Skin Test Negatif)')}
                  className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 hover:bg-teal-100 text-teal-900 dark:text-teal-200 text-[10px] font-bold text-left cursor-pointer transition-colors"
                >
                  💉 Ceftriaxone 1g IV
                </button>
              </div>
            </div>

            {/* Full Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="w-full mt-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>Buka Katalog Order Lengkap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Universal Order Modal */}
      <UniversalOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        patient={p}
        encounter={encounter}
        onOrderPlaced={(newOrder) => {
          setPlan(prev => `${prev}\n- [Order ${newOrder.order_category}]: ${newOrder.order_number} (${newOrder.clinical_indication})`);
        }}
      />
    </div>
  );
}
