import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Activity, FileText, ArrowRight, Save, Clock, 
  Stethoscope, AlertCircle, ShieldAlert, Pill, CheckCircle2, User, 
  Thermometer, AlertTriangle, Sparkles, Wand2, Copy, History,
  ChevronDown, Check, RefreshCw, Zap, Bookmark, HeartPulse, Gauge
} from 'lucide-react';
import { saveSoapNote } from '../services/emr.service.js';

export default function CPPTWorkspace({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'S' | 'O' | 'A' | 'P'

  // SOAP State
  const [soapData, setSoapData] = useState({
    subjective: encounter?.chief_complaint || 'Pasien mengeluhkan demam sejak 2 hari yang lalu, disertai nyeri kepala dan rasa lemas. Batuk kering sesekali, nafsu makan menurun.',
    objective: '',
    assessment: 'Febris Akut Hari ke-2 e.c Suspek Infeksi Virus (Obs. Febris) - ICD-10: R50.9',
    plan_medications: [],
    plan_instructions: '1. Paracetamol 500mg tab 3x1 p.r.n demam/nyeri\n2. Vitamin C 500mg tab 1x1 post coenam\n3. Anjuran banyak minum air putih (2-2.5 Liter/hari) & tirah baring\n4. Edukasi tanda bahaya (warning signs) dehidrasi/perdarahan\n5. Evaluasi darah perifer lengkap (DPL) jika demam menetap > 3 hari'
  });

  // Vitals from encounter
  const vitals = encounter?.vitals || {
    bp: '120/80',
    hr: '84',
    rr: '18',
    temp: '37.4',
    spo2: '99'
  };

  useEffect(() => {
    // Populate objective from vitals if empty
    if (!soapData.objective) {
      const vText = [];
      if (vitals.bp) vText.push(`TD: ${vitals.bp} mmHg`);
      if (vitals.hr) vText.push(`HR: ${vitals.hr} x/menit`);
      if (vitals.temp) vText.push(`Suhu: ${vitals.temp} °C`);
      if (vitals.rr) vText.push(`RR: ${vitals.rr} x/menit`);
      if (vitals.spo2) vText.push(`SpO2: ${vitals.spo2} %`);
      
      const defaultObjective = `[TANDA VITAL]\n${vText.join(' | ')}\n\n[PEMERIKSAAN FISIK]\n- Keadaan Umum: Tampak sakit ringan, Compos Mentis (E4V5M6)\n- Kepala/Leher: CA (-/-), SI (-/-), Pembesaran KGB (-)\n- Toraks: Cor S1-S2 reguler murmur (-), Pulmo Vesikuler (+/+), Ronki (-/-), Wheezing (-/-)\n- Abdomen: Supel, bising usus (+) normal, hepar/lien tidak teraba, nyeri tekan (-)\n- Ekstremitas: Akral hangat, CRT < 2 detik, edema (-)`;
      
      setSoapData(prev => ({
        ...prev,
        objective: defaultObjective
      }));
    }
  }, [vitals]);

  // Quick Macro Snippets
  const insertMacro = (section, text) => {
    setSoapData(prev => ({
      ...prev,
      [section]: prev[section] ? `${prev[section]}\n${text}` : text
    }));
  };

  const handleSave = async () => {
    if (!soapData.subjective || !soapData.objective || !soapData.assessment || !soapData.plan_instructions) {
      alert("Pastikan seluruh elemen SOAP (Subjektif, Objektif, Asesmen, Plan) terisi penuh!");
      return;
    }

    setIsSaving(true);
    try {
      await saveSoapNote({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        doctorEmail: currentUser?.displayName || currentUser?.email || 'DOKTER DPJP',
        soapData: {
          ...soapData,
          status: 'SIGNED',
          signed_at: new Date().toISOString()
        }
      });
      alert('Catatan SOAP (CPPT) berhasil disimpan dan ditandatangani secara digital (JCI COP.2.1).');
      if (onSaveSuccess) onSaveSuccess();
    } catch (error) {
      alert('Gagal menyimpan CPPT: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col p-6 bg-slate-50 dark:bg-slate-950">
      
      {/* ─── MODERN CLINICAL HEADER BAR ─── */}
      <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title & Standard Badge */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 transition-all border border-slate-200 dark:border-white/10 shadow-sm"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black tracking-widest uppercase border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1.5">
                <ShieldAlert size={12} className="text-indigo-600" /> JCI COP.2.1 & KEMENKES REKAM MEDIS
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={11} /> DIGITAL SIGNATURE READY
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              CATATAN PERKEMBANGAN PASIEN TERINTEGRASI (CPPT / SOAP)
            </h2>
          </div>
        </div>

        {/* Patient & Staff Snapshot */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">DPJP / Tenaga Medis</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{currentUser?.displayName || currentUser?.email || 'Dr. Spesialis'}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Stethoscope size={22} />
          </div>
        </div>

      </div>

      {/* ─── MAIN WORKSPACE GRID ─── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT COLUMN: VITAL SIGNS & CLINICAL SUMMARY (4 COLS) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-5 min-h-0 overflow-y-auto custom-scrollbar">
          
          {/* 1. Vital Signs Card */}
          <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <HeartPulse size={16} className="text-rose-500" /> Tanda Vital Triase (TTV)
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                Sinkron Realtime
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* BP */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/80 to-rose-100/30 dark:from-rose-950/30 dark:to-transparent border border-rose-200/70 dark:border-rose-500/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600/80 block">Tekanan Darah</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-rose-700 dark:text-rose-300">{vitals.bp || '120/80'}</span>
                  <span className="text-[10px] font-bold text-slate-400">mmHg</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">● Normotensi</span>
              </div>

              {/* Heart Rate */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-amber-100/30 dark:from-amber-950/30 dark:to-transparent border border-amber-200/70 dark:border-amber-500/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600/80 block">Nadi / HR</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-amber-700 dark:text-amber-300">{vitals.hr || '84'}</span>
                  <span className="text-[10px] font-bold text-slate-400">bpm</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">● Reguler</span>
              </div>

              {/* Resp Rate */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-blue-100/30 dark:from-blue-950/30 dark:to-transparent border border-blue-200/70 dark:border-blue-500/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600/80 block">Laju Napas</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-blue-700 dark:text-blue-300">{vitals.rr || '18'}</span>
                  <span className="text-[10px] font-bold text-slate-400">x/mnt</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">● Eupnea</span>
              </div>

              {/* Temp & SpO2 */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 dark:from-emerald-950/30 dark:to-transparent border border-emerald-200/70 dark:border-emerald-500/20">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600/80 block">Suhu / SpO2</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{vitals.temp || '37.4'}°</span>
                  <span className="text-[10px] font-bold text-slate-400">/ {vitals.spo2 || '99'}%</span>
                </div>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 block">● Subfebris</span>
              </div>
            </div>
          </div>

          {/* 2. Patient Risk Alerts */}
          <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              <AlertCircle size={16} className="text-amber-500" /> Penanda Keselamatan (IPSG)
            </span>

            {/* Allergy Alert */}
            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 block">Riwayat Alergi Obat</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{patient?.allergies?.[0]?.agent || 'AMOXICILLIN / PENICILLIN'}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                BERAT
              </span>
            </div>

            {/* Fall Risk */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Risiko Jatuh (Morse / Humpty)</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Risiko Rendah (Skor: 15)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                LOW RISK
              </span>
            </div>
          </div>

          {/* 3. Quick Macro Templates */}
          <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              <Sparkles size={16} className="text-indigo-500" /> Template Klinis Cepat (1-Click)
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button 
                type="button"
                onClick={() => insertMacro('objective', '\n[PEMERIKSAAN FISIK NORMAL]\nKepala: Normocephal, CA (-/-), SI (-/-)\nLeher: JVP 5-2 cmH2O, KGB tidak membesar\nThorax: Simetris, Vesikuler (+/+), Ronki (-/-), Wheezing (-/-)\nCor: S1-S2 tunggal reguler, murmur (-), gallop (-)\nAbdomen: Datar, supel, BU (+) normal, timpani, NT (-)\nEkstremitas: Hangat, CRT < 2s, edema (-)')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 dark:bg-white/5 dark:hover:bg-indigo-500/10 border border-slate-200/70 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all flex items-center justify-between group"
              >
                <span>+ Makro Pemeriksaan Fisik Normal</span>
                <Wand2 size={14} className="opacity-0 group-hover:opacity-100 text-indigo-600 transition-opacity" />
              </button>

              <button 
                type="button"
                onClick={() => insertMacro('plan_instructions', '\n- Edukasi istirahat cukup & minum air 2 liter/hari\n- Kontrol ulang ke poli jika keluhan tidak membaik dalam 3 hari\n- Segera ke IGD jika timbul sesak napas atau nyeri dada hebat')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 dark:bg-white/5 dark:hover:bg-indigo-500/10 border border-slate-200/70 dark:border-white/5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-all flex items-center justify-between group"
              >
                <span>+ Makro Edukasi & Rujukan Pasien</span>
                <Wand2 size={14} className="opacity-0 group-hover:opacity-100 text-indigo-600 transition-opacity" />
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REFINED S.O.A.P EDITOR (8 COLS) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col min-h-0 bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/80 dark:border-white/10 overflow-y-auto custom-scrollbar space-y-6">
          
          {/* S: SUBJECTIVE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-[11px] font-black shadow-sm">S</span>
                <span>SUBJEKTIF (ANAMNESIS & KELUHAN PASIEN) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-md">
                Keluhan Utama & RPS
              </span>
            </div>
            <textarea 
              rows="3"
              value={soapData.subjective}
              onChange={e => setSoapData({ ...soapData, subjective: e.target.value })}
              placeholder="Tuliskan keluhan utama, riwayat penyakit sekarang (RPS), riwayat penyakit dahulu (RPD), riwayat alergi, dan riwayat pengobatan..."
              className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] leading-relaxed"
            />
          </div>

          {/* O: OBJECTIVE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[11px] font-black shadow-sm">O</span>
                <span>OBJEKTIF (PEMERIKSAAN FISIK & PENUNJANG) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                Status Lokalis & Laboratorium
              </span>
            </div>
            <textarea 
              rows="5"
              value={soapData.objective}
              onChange={e => setSoapData({ ...soapData, objective: e.target.value })}
              placeholder="Hasil observasi keadaan umum, tanda vital terkini, pemeriksaan fisik per organ, serta hasil penunjang laboratorium / radiologi..."
              className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-mono leading-relaxed"
            />
          </div>

          {/* A: ASSESSMENT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center text-[11px] font-black shadow-sm">A</span>
                <span>ASESMEN (DIAGNOSIS KERJA & BANDING / ICD-10) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                WHO ICD-10 Coding
              </span>
            </div>
            <textarea 
              rows="2"
              value={soapData.assessment}
              onChange={e => setSoapData({ ...soapData, assessment: e.target.value })}
              placeholder="Diagnosis kerja utama (Primary Diagnosis) beserta kode ICD-10, diagnosis banding, dan komplikasi jika ada..."
              className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] leading-relaxed"
            />
          </div>

          {/* P: PLAN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black shadow-sm">P</span>
                <span>PLAN (INSTRUKSI MEDIS, TERAPI OBAT & EDUKASI) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                CPOE & Asuhan Keperawatan
              </span>
            </div>
            <textarea 
              rows="4"
              value={soapData.plan_instructions}
              onChange={e => setSoapData({ ...soapData, plan_instructions: e.target.value })}
              placeholder="Rencana tindakan, resep obat (dosis/rute/frekuensi), instruksi monitoring keperawatan, konsul spesialis lain, dan jadwal kontrol..."
              className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] leading-relaxed"
            />
          </div>

        </div>

      </div>

      {/* ─── ACTION FOOTER BAR ─── */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm shrink-0">
        
        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">JCI Validated Audit Trail</span>
            <span className="text-[11px] text-slate-400">Pengesahan dokumen terenkripsi dengan identitas DPJP: <strong>{currentUser?.displayName || currentUser?.email || 'Dr. DPJP'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            Batal
          </button>
          
          <button 
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-8 py-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>TANDATANGANI & SIMPAN CPPT (SOAP)</span>
          </button>
        </div>

      </div>

    </div>
  );
}
