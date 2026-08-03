import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  HeartPulse, ArrowRight, ShieldCheck, Activity, AlertTriangle, 
  CheckCircle2, Info, Stethoscope, FileSignature, Sparkles, 
  Flame, Clock, ChevronRight, Zap, CheckSquare, Square
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function ICUAdmissionCriteriaForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';
  const vitals = encounter?.vitals || {
    bp: '125/82',
    hr: 92,
    rr: 20,
    temp: 37.8,
    spo2: 99
  };

  // State Checklist Kriteria
  const [p1Checks, setP1Checks] = useState({
    ventilation: false,
    inotropic: false,
    crrt: false,
    invasiveHemo: false,
    postArrest: false
  });

  const [p2Checks, setP2Checks] = useState({
    postMajorSurgery: isDewi ? true : false,
    cardiacMonitoring: false,
    gcsDecline: false,
    newsTrigger: false
  });

  const [p3Checks, setP3Checks] = useState({
    metastaticCancer: false,
    endStageOrgan: false,
    treatmentLimitation: false
  });

  const [p4Checks, setP4Checks] = useState({
    fullDNR: false,
    brainDeath: false,
    physiologicallyStable: !isDewi
  });

  const [gcsScore, setGcsScore] = useState(15);
  const [overridePriority, setOverridePriority] = useState('');
  const [doctorNotes, setDoctorNotes] = useState(
    isDewi 
      ? 'Pasien Ny. Dewi Sartika, pasca Laparoscopic Cito Bedah, memerlukan observasi hemodinamik ketat 24 jam post-anestesi dan evaluasi nyeri akut.'
      : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic CDSS Calculation Engine (Standar SCCM & JCI ACC.3)
  const computedPriority = useMemo(() => {
    if (overridePriority) return overridePriority;

    const hasP1 = Object.values(p1Checks).some(Boolean) || gcsScore <= 8;
    const hasP2 = Object.values(p2Checks).some(Boolean);
    const hasP3 = Object.values(p3Checks).some(Boolean);
    const hasP4 = p4Checks.fullDNR || p4Checks.brainDeath;

    if (hasP4) {
      return 'P4_TERMINAL';
    }

    if (p4Checks.physiologicallyStable && !hasP1 && !hasP2) {
      return 'P4_STABLE';
    }

    if ((hasP1 || hasP2) && hasP3) {
      return 'P3';
    }

    if (hasP1) {
      return 'P1';
    }

    if (hasP2) {
      return 'P2';
    }

    return 'P4_STABLE';
  }, [p1Checks, p2Checks, p3Checks, p4Checks, gcsScore, overridePriority]);

  const priorityMeta = {
    P1: {
      title: 'PRIORITAS 1 (CITO ICU - BANTUAN HIDUP INTENSIF)',
      badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
      borderClass: 'border-red-500',
      description: 'Pasien sakit kritis tidak stabil yang membutuhkan ventilasi mekanik invasif, titrasi inotropik/vasoaktif kontinu, atau pemantauan hemodinamik invasif segera.',
      actionGuide: 'Alokasi Bed ICU Langsung (Jalur Cito). Lakukan serah terima langsung ke Dokter Intensivis / DPJP Anestesi.'
    },
    P2: {
      title: 'PRIORITAS 2 (MONITORING INTENSIF KETAT)',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      borderClass: 'border-amber-500',
      description: 'Pasien yang memerlukan pemantauan ketat berkelanjutan dan berisiko tinggi mengalami deteriorasi akut sewaktu-waktu (cth: Pasca Bedah Mayor Kompleks, Sindrom Koroner Akut).',
      actionGuide: 'Alokasi Bed ICU / HCU Prioritas Tinggi. Monitoring berkala parameter TTV dan tanda bahaya.'
    },
    P3: {
      title: 'PRIORITAS 3 (INTERVENSI TERBATAS / KOMORBID BERAT)',
      badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      borderClass: 'border-indigo-500',
      description: 'Pasien sakit kritis namun memiliki penyakit dasar lanjut/terminal dengan kemungkinan sembuh rendah. Terapi intensif diberikan terbatas tanpa intubasi ulang/CPR agresif.',
      actionGuide: 'Alokasi Bed ICU dengan Rencana Batasan Tindakan Medis (Treatment Limitation Plan) yang disetujui keluarga.'
    },
    P4_STABLE: {
      title: 'PRIORITAS 4 (KONDISI STABIL - TIDAK MEMENUHI KRITERIA ICU)',
      badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
      borderClass: 'border-slate-400',
      description: 'Parameter hemodinamik dan respirasi stabil. Tidak memerlukan alat bantu invasif intensif.',
      actionGuide: 'Direkomendasikan perawatan di High Care Unit (HCU) atau Bangsal Rawat Inap Biasa.'
    },
    P4_TERMINAL: {
      title: 'PRIORITAS 4 (PALIATIF / END OF LIFE / FULL DNR)',
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      borderClass: 'border-purple-500',
      description: 'Pasien dengan status DNR Penuh atau Mati Batang Otak di mana terapi agresif ICU tidak memberikan manfaat klinis (futile care).',
      actionGuide: 'Alihkan ke Ruang Perawatan Paliatif (Palliative & Comfort Care) sesuai persetujuan keluarga.'
    }
  }[computedPriority] || {
    title: 'EVALUASI KLINIS',
    badgeClass: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
    description: 'Silakan isi parameter checklist di bawah.',
    actionGuide: ''
  };

  const toggleCheck = (setter, key) => {
    setter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
        moduleName: 'KRITERIA & TRANSFER ICU (ACC.3)',
        data: {
          computedPriority,
          priorityTitle: priorityMeta.title,
          gcsScore,
          p1Checks,
          p2Checks,
          p3Checks,
          p4Checks,
          doctorNotes,
          vitalsSnapshot: vitals,
          signedAt: new Date().toISOString(),
          signedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Asesmen Kriteria Masuk ICU [${priorityMeta.title}] Berhasil Disimpan & Diverifikasi DPJP.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan formulir kriteria ICU: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col p-6 bg-slate-50 dark:bg-slate-950">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-[10px] font-black tracking-widest uppercase border border-red-200 dark:border-red-500/30 flex items-center gap-1">
                <HeartPulse size={12} /> Standard JCI ACC.3 & COP.3
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                CDSS ICU Rules Engine
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              KRITERIA MASUK & TRANSFER RUANG INTENSIF (ICU/ICCU/PICU)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Terpilih</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien Rekam Medis'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 shadow-sm">
            <HeartPulse size={24} />
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic CDSS Priority Result Card */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${priorityMeta.borderClass}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-primary">
                <Sparkles size={20} className="text-amber-500 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Hasil Evaluasi Logika Sistem (CDSS)</span>
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">{priorityMeta.title}</h4>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase border ${priorityMeta.badgeClass}`}>
              STATUS: {computedPriority}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-medium text-slate-600 dark:text-slate-300">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Rasional Klinis:</span>
              <p>{priorityMeta.description}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Rekomendasi Alur Tindakan:</span>
              <p className="text-primary font-bold">{priorityMeta.actionGuide}</p>
            </div>
          </div>
        </div>

        {/* Realtime Fisiologis & Vitals Snapshot */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" /> 1. Parameter Fisiologis & Tanda Vital Terkini
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Tekanan Darah</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">{vitals.bp || '120/80'} <span className="text-[10px] font-normal text-slate-400">mmHg</span></span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Denyut Jantung</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">{vitals.hr || '80'} <span className="text-[10px] font-normal text-slate-400">bpm</span></span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Laju Napas (RR)</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">{vitals.rr || '20'} <span className="text-[10px] font-normal text-slate-400">x/m</span></span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Suhu Tubuh</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">{vitals.temp || '37.0'} <span className="text-[10px] font-normal text-slate-400">°C</span></span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Saturasi O2</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">{vitals.spo2 || '99'} <span className="text-[10px] font-normal text-slate-400">%</span></span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Skor GCS</span>
              <input 
                type="number" 
                min="3" 
                max="15" 
                value={gcsScore} 
                onChange={e => setGcsScore(Number(e.target.value))}
                className="w-16 text-center text-base font-black text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-500" 
              />
            </div>
          </div>
        </div>

        {/* Checklist Kriteria Prioritas (Interaktif 4 Kategori) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Prioritas 1 Box */}
          <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-red-200/50 dark:border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                <Flame size={16} /> Indikator Prioritas 1 (Kritis / Life Support)
              </h5>
              <span className="text-[10px] font-bold text-red-500">Cito ICU</span>
            </div>
            <div className="space-y-3">
              {[
                { key: 'ventilation', label: 'Membutuhkan Ventilasi Mekanik Invasif / Intubasi ETT' },
                { key: 'inotropic', label: 'Titrasi Obat Inotropik / Vasoaktif Kontinu (Syok Kardiogenik/Septik)' },
                { key: 'crrt', label: 'Terapi Pengganti Ginjal Akut (CRRT / Dialisis Cito)' },
                { key: 'invasiveHemo', label: 'Monitoring Hemodinamik Invasif (Arterial Line / CVP)' },
                { key: 'postArrest', label: 'Pasca Henti Jantung (Post-ROSC) Tidak Stabil' }
              ].map(item => (
                <div 
                  key={item.key}
                  onClick={() => toggleCheck(setP1Checks, item.key)}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-red-50/50 dark:hover:bg-red-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
                >
                  <div className="mt-0.5 text-red-500">
                    {p1Checks[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prioritas 2 Box */}
          <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-amber-200/50 dark:border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle size={16} /> Indikator Prioritas 2 (Monitoring Intensif)
              </h5>
              <span className="text-[10px] font-bold text-amber-500">High Risk</span>
            </div>
            <div className="space-y-3">
              {[
                { key: 'postMajorSurgery', label: 'Pasca Bedah Mayor Kompleks / Bedah Saraf / Laparotomi Cito' },
                { key: 'cardiacMonitoring', label: 'Sindrom Koroner Akut (ACS) / Aritmia Maligna Terkontrol' },
                { key: 'gcsDecline', label: 'Penurunan Kesadaran Progresif / Risiko Sumbatan Jalan Napas' },
                { key: 'newsTrigger', label: 'Skor Early Warning System (NEWS) ≥ 7 (Red Trigger)' }
              ].map(item => (
                <div 
                  key={item.key}
                  onClick={() => toggleCheck(setP2Checks, item.key)}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
                >
                  <div className="mt-0.5 text-amber-500">
                    {p2Checks[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prioritas 3 Box */}
          <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-indigo-200/50 dark:border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Info size={16} /> Indikator Prioritas 3 (Komorbiditas Berat)
              </h5>
              <span className="text-[10px] font-bold text-indigo-500">Limited Care</span>
            </div>
            <div className="space-y-3">
              {[
                { key: 'metastaticCancer', label: 'Keganasan Stadium Lanjut / Kanker Metastasis Luas' },
                { key: 'endStageOrgan', label: 'Penyakit Organ Tahap Akhir (Gagal Ginjal Stage 5 / Sirosis Child-Pugh C)' },
                { key: 'treatmentLimitation', label: 'Terdapat Kesepakatan Batasan Tindakan Medis (No Re-intubation)' }
              ].map(item => (
                <div 
                  key={item.key}
                  onClick={() => toggleCheck(setP3Checks, item.key)}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
                >
                  <div className="mt-0.5 text-indigo-500">
                    {p3Checks[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prioritas 4 Box */}
          <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-slate-700/20">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheck size={16} /> Indikator Prioritas 4 (Paliatif / HCU / Non-ICU)
              </h5>
              <span className="text-[10px] font-bold text-slate-500">Exclusion</span>
            </div>
            <div className="space-y-3">
              {[
                { key: 'fullDNR', label: 'Status Hukum: Do Not Resuscitate (DNR) Penuh' },
                { key: 'brainDeath', label: 'Kondisi Mati Batang Otak / Irreversible End of Life' },
                { key: 'physiologicallyStable', label: 'Fisiologis Stabil (Dapat ditangani di Ruang HCU / Bangsal Biasa)' }
              ].map(item => (
                <div 
                  key={item.key}
                  onClick={() => toggleCheck(setP4Checks, item.key)}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
                >
                  <div className="mt-0.5 text-slate-500">
                    {p4Checks[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 select-none leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Doctor Clinical Notes & Digital Sign */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-primary" /> 3. Catatan Pertimbangan DPJP & Instruksi Transfer
          </h4>
          <textarea 
            rows="3"
            value={doctorNotes}
            onChange={e => setDoctorNotes(e.target.value)}
            placeholder="Tuliskan justifikasi klinis, target hemodinamik, atau instruksi khusus untuk tim intensif..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Dokumen ini akan ditandatangani digital oleh <strong>{currentUser?.displayName || currentUser?.email || 'DPJP'}</strong></span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                Batal
              </button>
              <button 
                type="button" 
                disabled={isSaving}
                onClick={handleSave}
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Verifikasi DPJP & Ajukan Bed ICU'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
