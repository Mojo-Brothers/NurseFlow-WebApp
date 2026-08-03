import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Zap, CheckSquare, Square, Flame, Droplets, HeartPulse
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function SepsisSOFACriteriaForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const vitals = encounter?.vitals || { bp: '125/82', hr: 92, rr: 20, temp: 37.8, spo2: 99 };

  // qSOFA 3 Parameters (Quick SOFA)
  const [highRespiratoryRate, setHighRespiratoryRate] = useState(false); // RR >= 22
  const [alteredMentalStatus, setAlteredMentalStatus] = useState(false); // GCS < 15
  const [lowBloodPressure, setLowBloodPressure] = useState(false);       // SBP <= 100 mmHg

  // Sepsis Source of Infection
  const [suspectedInfection, setSuspectedInfection] = useState(true);
  const [infectionSource, setInfectionSource] = useState('Abdomen (Appendisitis / Peritonitis)');

  // Sepsis 1-Hour Bundle Checklist
  const [bundleChecks, setBundleChecks] = useState({
    measureLactate: true,
    bloodCulturesBeforeAbx: true,
    broadSpectrumAbx: true,
    rapidFluidsIfHypotensive: false,
    vasopressorsIfRefractory: false
  });

  const [notes, setNotes] = useState('Pasien febris pasca peritonitis appendisitis, skrining sepsis dilakukan untuk mencegah komplikasi syok septik.');
  const [isSaving, setIsSaving] = useState(false);

  // Compute qSOFA Score
  const qsofaScore = useMemo(() => {
    let score = 0;
    if (highRespiratoryRate) score += 1;
    if (alteredMentalStatus) score += 1;
    if (lowBloodPressure) score += 1;
    return score;
  }, [highRespiratoryRate, alteredMentalStatus, lowBloodPressure]);

  const isHighRiskSepsis = qsofaScore >= 2 && suspectedInfection;

  const toggleBundle = (key) => {
    setBundleChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'CLINICAL_STAFF',
        moduleName: 'SKRINING SEPSIS & qSOFA (COP.3)',
        data: {
          qsofaScore,
          isHighRiskSepsis,
          suspectedInfection,
          infectionSource,
          parameters: {
            highRespiratoryRate,
            alteredMentalStatus,
            lowBloodPressure
          },
          bundleChecks,
          notes,
          screenedAt: new Date().toISOString(),
          signedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Skrining Sepsis [qSOFA Skor: ${qsofaScore}/3 - ${isHighRiskSepsis ? 'HIGH RISK SEPSIS (PROTOKOL AKTIF)' : 'LOW RISK'}] Berhasil Disimpan.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan skrining sepsis: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-black tracking-widest uppercase border border-rose-200 dark:border-rose-500/30 flex items-center gap-1">
                <AlertCircle size={12} /> Standard JCI COP.3
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black tracking-widest uppercase border border-amber-200 dark:border-amber-500/30">
                Sepsis-3 & qSOFA Protocol
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              SKRINING SEPSIS & PROTOKOL KEGAWATAN qSOFA
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Terpilih</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien Rekam Medis'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm">
            <Flame size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic Alert Banner */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${isHighRiskSepsis ? 'border-red-500 bg-red-50/20' : 'border-emerald-500'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${isHighRiskSepsis ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>
                {qsofaScore}/3
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Skor Quick SOFA (qSOFA)</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {isHighRiskSepsis ? '⚠️ SEPSIS ALERT (HIGH RISK OF IN-HOSPITAL MORTALITY)' : 'RISIKO RENDAH (NON-SEPSIS TRIGGER)'}
                </h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {isHighRiskSepsis 
                    ? 'Skor qSOFA ≥ 2 dengan kecurigaan infeksi. Segera aktifkan Sepsis 1-Hour Care Bundle!' 
                    : 'Skor qSOFA < 2. Lanjutkan monitoring rutin dan tata laksana sumber infeksi terfokus.'}
                </p>
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border text-center ${isHighRiskSepsis ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'}`}>
              STATUS: {isHighRiskSepsis ? 'CRITICAL SEPSIS TRIGGER' : 'STABLE / LOW RISK'}
            </div>
          </div>
        </div>

        {/* 3 qSOFA Indicators */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-rose-500" /> 1. Kriteria Triase Cepat qSOFA (1 Poin Masing-Masing)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { 
                state: highRespiratoryRate, 
                setter: setHighRespiratoryRate, 
                title: 'Laju Napas (RR) ≥ 22 x/menit', 
                desc: 'Takipnea menunjukkan kompensasi asidosis metabolik atau distres respirasi.' 
              },
              { 
                state: alteredMentalStatus, 
                setter: setAlteredMentalStatus, 
                title: 'Perubahan Status Mental (GCS < 15)', 
                desc: 'Penurunan kesadaran, disorientasi, letargi, atau agitasi akut.' 
              },
              { 
                state: lowBloodPressure, 
                setter: setLowBloodPressure, 
                title: 'Tekanan Darah Sistolik ≤ 100 mmHg', 
                desc: 'Hipotensi sistemik akibat vasodilatasi dan kebocoran kapiler mikrovaskular.' 
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                onClick={() => item.setter(!item.state)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${item.state ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{item.title}</span>
                  <div className="text-rose-600">
                    {item.state ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                <div className="mt-3 text-[10px] font-black uppercase text-rose-600">
                  {item.state ? '+1 Poin Aktif' : '0 Poin'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sepsis 1-Hour Care Bundle Checklist */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" /> 2. Sepsis 1-Hour Care Bundle (Intervensi Emas 1 Jam Pertama)
          </h4>

          <div className="space-y-2.5">
            {[
              { key: 'measureLactate', label: '1. Periksa Kadar Laktat Darah Serum (Ulangi jika > 2 mmol/L)' },
              { key: 'bloodCulturesBeforeAbx', label: '2. Ambil Kultur Darah sebelum pemberian antibiotik empiris' },
              { key: 'broadSpectrumAbx', label: '3. Berikan Antibiotik Spektrum Luas secara IV segera dalam 1 jam' },
              { key: 'rapidFluidsIfHypotensive', label: '4. Resusitasi Cairan Kristaloid 30 ml/kg BB cepat jika TD Sistolik < 90 atau Laktat ≥ 4' },
              { key: 'vasopressorsIfRefractory', label: '5. Berikan Vasopresor (Norepinephrine) jika hipotensi persisten pasca cairan target MAP ≥ 65 mmHg' }
            ].map(b => (
              <div 
                key={b.key}
                onClick={() => toggleBundle(b.key)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
              >
                <div className="mt-0.5 text-amber-600">
                  {bundleChecks[b.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Notes & Signature Footer */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-rose-600" /> 3. Catatan Klinis DPJP & Instruksi Khusus
          </h4>
          <textarea 
            rows="3"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Catatan respon hemodinamik, evaluasi diuresis urine, dan target laktat..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Divalidasi oleh: <strong>{currentUser?.displayName || currentUser?.email || 'CLINICAL STAFF'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Skrining Sepsis (COP.3)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
