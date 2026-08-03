import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Heart, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Sparkles, HeartPulse, User, Flame, Droplets
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function MEOWSForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const vitals = encounter?.vitals || { bp: '125/82', hr: 92, rr: 20, temp: 37.8, spo2: 99 };

  // Maternal Trigger Parameters
  const [systolicBP, setSystolicBP] = useState(125);
  const [diastolicBP, setDiastolicBP] = useState(82);
  const [heartRate, setHeartRate] = useState(92);
  const [respiratoryRate, setRespiratoryRate] = useState(20);
  const [temperature, setTemperature] = useState(37.8);
  const [spo2, setSpo2] = useState(99);
  const [neuroResponse, setNeuroResponse] = useState('ALERT'); // 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE'
  
  // Specific Obstetric Triggers
  const [lochiaVolume, setLochiaVolume] = useState('NORMAL'); // 'NORMAL' | 'HEAVY' | 'OFFENSIVE'
  const [proteinuria, setProteinuria] = useState('NEGATIVE'); // 'NEGATIVE' | 'PLUS_1' | 'PLUS_2' | 'PLUS_3'
  const [fetalHeartRate, setFetalHeartRate] = useState(140);   // dpm

  const [notes, setNotes] = useState('Pemantauan tanda vital maternal terintegrasi MEOWS untuk deteksi dini preeklamsia dan perdarahan obstetrik.');
  const [isSaving, setIsSaving] = useState(false);

  // MEOWS Trigger Evaluation (Red / Yellow Triggers)
  const triggerAssessment = useMemo(() => {
    let redCount = 0;
    let yellowCount = 0;

    // Tekanan Darah Sistolik
    if (systolicBP >= 160 || systolicBP < 90) redCount++;
    else if ((systolicBP >= 140 && systolicBP < 160) || (systolicBP >= 90 && systolicBP < 100)) yellowCount++;

    // Tekanan Darah Diastolik
    if (diastolicBP >= 100) redCount++;
    else if (diastolicBP >= 90 && diastolicBP < 100) yellowCount++;

    // Heart Rate
    if (heartRate >= 120 || heartRate < 50) redCount++;
    else if ((heartRate >= 100 && heartRate < 120) || (heartRate >= 50 && heartRate < 60)) yellowCount++;

    // Respiratory Rate
    if (respiratoryRate >= 30 || respiratoryRate < 10) redCount++;
    else if ((respiratoryRate >= 21 && respiratoryRate < 30) || (respiratoryRate >= 10 && respiratoryRate < 12)) yellowCount++;

    // Temperature
    if (temperature >= 38.5 || temperature < 35.0) redCount++;
    else if (temperature >= 37.5 && temperature < 38.5) yellowCount++;

    // SpO2
    if (spo2 < 92) redCount++;
    else if (spo2 >= 92 && spo2 < 95) yellowCount++;

    // Neuro
    if (neuroResponse !== 'ALERT') redCount++;

    // Obstetric
    if (lochiaVolume === 'HEAVY' || lochiaVolume === 'OFFENSIVE') redCount++;
    if (proteinuria === 'PLUS_2' || proteinuria === 'PLUS_3') redCount++;
    else if (proteinuria === 'PLUS_1') yellowCount++;

    if (redCount >= 1) {
      return { level: 'RED', label: '1+ RED TRIGGER (EMERGENCY OBSTETRIC ALERT)', class: 'bg-red-500 text-white', border: 'border-red-500', action: 'Lapor Cito Dokter Obgyn (Sp.OG) dalam 15 menit, evaluasi preeklamsia/perdarahan/sepsis maternal.' };
    }
    if (yellowCount >= 2) {
      return { level: 'YELLOW_HIGH', label: '2+ YELLOW TRIGGERS (URGENT MATERNAL REVIEW)', class: 'bg-amber-500 text-white', border: 'border-amber-500', action: 'Tingkatkan frekuensi TTV per 30 menit, lapor dokter jaga bangsal kebidanan.' };
    }
    if (yellowCount === 1) {
      return { level: 'YELLOW_LOW', label: '1 YELLOW TRIGGER (OBSERVASI KHUSUS)', class: 'bg-blue-500 text-white', border: 'border-blue-500', action: 'Ulangi pemeriksaan TTV dalam 1 jam.' };
    }
    return { level: 'GREEN', label: 'NORMAL / STABIL (GREEN)', class: 'bg-emerald-500 text-white', border: 'border-emerald-500', action: 'Lanjutkan asuhan kebidanan rutin per shift.' };
  }, [systolicBP, diastolicBP, heartRate, respiratoryRate, temperature, spo2, neuroResponse, lochiaVolume, proteinuria]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'MIDWIFE_CLINICIAN',
        moduleName: 'MODIFIED EARLY OBSTETRIC WARNING SYSTEM (MEOWS)',
        data: {
          triggerAssessment,
          vitals: {
            systolicBP,
            diastolicBP,
            heartRate,
            respiratoryRate,
            temperature,
            spo2,
            neuroResponse
          },
          obstetricParams: {
            lochiaVolume,
            proteinuria,
            fetalHeartRate
          },
          notes,
          recordedAt: new Date().toISOString(),
          midwifeSignature: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Skor MEOWS [Status: ${triggerAssessment.label}] Berhasil Disimpan.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan formulir MEOWS: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-pink-50 hover:text-pink-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 text-[10px] font-black tracking-widest uppercase border border-pink-200 dark:border-pink-500/30 flex items-center gap-1">
                <Heart size={12} /> Standard JCI COP.3.1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-black tracking-widest uppercase border border-purple-200 dark:border-purple-500/30">
                Modified Obstetric Early Warning System
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              MODIFIED EARLY OBSTETRIC WARNING SYSTEM (MEOWS)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Maternal</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien Maternal'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/20 shadow-sm">
            <Heart size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic MEOWS Result Card */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${triggerAssessment.border}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${triggerAssessment.class}`}>
                <HeartPulse size={28} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Hasil Evaluasi MEOWS Maternal</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{triggerAssessment.label}</h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{triggerAssessment.action}</p>
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border text-center ${triggerAssessment.class}`}>
              STATUS: {triggerAssessment.level}
            </div>
          </div>
        </div>

        {/* Input TTV & Maternal Fisiologis */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-pink-500" /> 1. Parameter Tanda Vital Fisiologi Ibu Hamil/Nifas
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">TD Sistolik (mmHg)</span>
              <input 
                type="number" 
                value={systolicBP} 
                onChange={e => setSystolicBP(Number(e.target.value))}
                className="w-full text-base font-black text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-300 focus:outline-none focus:border-pink-500 mt-1" 
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">TD Diastolik (mmHg)</span>
              <input 
                type="number" 
                value={diastolicBP} 
                onChange={e => setDiastolicBP(Number(e.target.value))}
                className="w-full text-base font-black text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-300 focus:outline-none focus:border-pink-500 mt-1" 
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Denyut Nadi (bpm)</span>
              <input 
                type="number" 
                value={heartRate} 
                onChange={e => setHeartRate(Number(e.target.value))}
                className="w-full text-base font-black text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-300 focus:outline-none focus:border-pink-500 mt-1" 
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Laju Napas (x/m)</span>
              <input 
                type="number" 
                value={respiratoryRate} 
                onChange={e => setRespiratoryRate(Number(e.target.value))}
                className="w-full text-base font-black text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-300 focus:outline-none focus:border-pink-500 mt-1" 
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Suhu (°C)</span>
              <input 
                type="number" 
                step="0.1"
                value={temperature} 
                onChange={e => setTemperature(Number(e.target.value))}
                className="w-full text-base font-black text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-300 focus:outline-none focus:border-pink-500 mt-1" 
              />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Saturasi O2 (%)</span>
              <input 
                type="number" 
                value={spo2} 
                onChange={e => setSpo2(Number(e.target.value))}
                className="w-full text-base font-black text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-300 focus:outline-none focus:border-pink-500 mt-1" 
              />
            </div>
          </div>
        </div>

        {/* Specific Obstetric Checks */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Droplets size={16} className="text-pink-500" /> 2. Parameter Klinis Kebidanan Khusus
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Lokhea */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Pendarahan / Lokhea:</span>
              <div className="space-y-1.5">
                {[
                  { id: 'NORMAL', label: 'Normal / Sesuai Fase' },
                  { id: 'HEAVY', label: 'Banyak / Perdarahan Aktif (Red)' },
                  { id: 'OFFENSIVE', label: 'Berbau Busuk (Infeksi/Red)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLochiaVolume(opt.id)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all border ${lochiaVolume === opt.id ? 'bg-pink-600 text-white font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Proteinuria */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Protein Urine (Skrining Preeklamsia):</span>
              <div className="space-y-1.5">
                {[
                  { id: 'NEGATIVE', label: 'Negatif / Normal' },
                  { id: 'PLUS_1', label: 'Protein Urine +1 (Yellow)' },
                  { id: 'PLUS_2', label: 'Protein Urine +2 atau +3 (Red)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setProteinuria(opt.id)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all border ${proteinuria === opt.id ? 'bg-pink-600 text-white font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Denyut Jantung Janin */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Denyut Jantung Janin (DJJ):</span>
              <div className="p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                <span className="text-2xl font-black text-pink-600">{fetalHeartRate} <span className="text-xs text-slate-400 font-normal">dpm</span></span>
                <input 
                  type="range" 
                  min="80" 
                  max="200" 
                  value={fetalHeartRate} 
                  onChange={e => setFetalHeartRate(Number(e.target.value))}
                  className="w-full mt-2 accent-pink-600" 
                />
                <span className="text-[10px] font-bold text-slate-400 block mt-1">Normal: 120 - 160 dpm</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-pink-600" /> Catatan Klinis Bidan / DPJP Obgyn
          </h4>
          <textarea 
            rows="2"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-pink-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Dicatat oleh Bidan / Dokter Obgyn: <strong>{currentUser?.displayName || currentUser?.email || 'BIDAN KLINISI'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Skor MEOWS (COP.3.1)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
