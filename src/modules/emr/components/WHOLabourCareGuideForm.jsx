import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Heart, Baby, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Sparkles, Clock, Calendar, CheckSquare, Square, ChevronRight, Gauge
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function WHOLabourCareGuideForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  
  // Data Persalinan & Fase Aktif
  const [cervicalDilationCm, setCervicalDilationCm] = useState(6); // 4 - 10 cm
  const [fetalHeartRate, setFetalHeartRate] = useState(138); // dpm
  const [fetalHeartRateCategory, setFetalHeartRateCategory] = useState('NORMAL'); // 'NORMAL' | 'DECELERATION' | 'BRADYCARDIA' | 'TACHYCARDIA'
  const [amnioticFluid, setAmnioticFluid] = useState('JERNIIH'); // 'UTUH' | 'JERNIH' | 'MEKONIUM' | 'DARAH' | 'KERING'
  const [moldingOfHead, setMoldingOfHead] = useState('0'); // '0' | '1' | '2' | '3' (Moulage / Penyusupan Tulang Kepala)
  
  // Kontraksi Uterus (His per 10 menit)
  const [contractionsPer10Min, setContractionsPer10Min] = useState(4);
  const [contractionDurationSec, setContractionDurationSec] = useState(45); // <20s, 20-40s, >40s
  const [oxytocinUsed, setOxytocinUsed] = useState(false);
  const [oxytocinDoseDrips, setOxytocinDoseDrips] = useState(8); // tpm

  // Kondisi Ibu
  const [maternalBpSystolic, setMaternalBpSystolic] = useState(120);
  const [maternalBpDiastolic, setMaternalBpDiastolic] = useState(80);
  const [maternalPulse, setMaternalPulse] = useState(82);
  const [maternalTemp, setMaternalTemp] = useState(36.8);
  const [urinaryProtein, setUrinaryProtein] = useState('NEGATIF'); // 'NEGATIF' | 'POSITIF_1' | 'POSITIF_2' | 'POSITIF_3'
  const [urinaryVolumeMl, setUrinaryVolumeMl] = useState(250);

  // Waspada / Alert Line Evaluation (WHO Labour Care Guide Standard)
  const [notes, setNotes] = useState('Kemajuan persalinan fase aktif berjalan normal. DJJ terpantau baik reguler 138x/m, his 4x/10 menit durasi 45 detik, ketuban jernih.');
  const [isSaving, setIsSaving] = useState(false);

  // Status Evaluasi Partograf
  const alertEvaluation = useMemo(() => {
    const isFhrAbnormal = fetalHeartRate < 110 || fetalHeartRate > 160 || fetalHeartRateCategory !== 'NORMAL';
    const isMeconium = amnioticFluid === 'MEKONIUM';
    const isMoldingSevere = moldingOfHead === '3';
    const isPreEclampsia = maternalBpSystolic >= 140 || maternalBpDiastolic >= 90 || urinaryProtein !== 'NEGATIF';

    if (isFhrAbnormal || isMeconium || isMoldingSevere) {
      return {
        level: 'CRITICAL',
        title: 'PERINGATAN GAWAT JANIN / DISTOSIA (WHO ALERT)',
        desc: 'Terdapat indikasi asfiksia/distosia persalinan. Segera konsultasikan ke Sp.OG untuk tindakan darurat / SC.',
        color: 'rose'
      };
    }

    if (isPreEclampsia) {
      return {
        level: 'WARNING',
        title: 'PERINGATAN PREEKLAMSIA MATERNAL',
        desc: 'Tekanan darah atau proteinuria meningkat. Pasang jalur IV, siapkan MgSO4 sesuai protokol PONEK.',
        color: 'amber'
      };
    }

    return {
      level: 'NORMAL',
      title: 'KEMAJUAN PERSALINAN NORMAL (WHO ON-TRACK)',
      desc: 'Parameter ibu dan janin dalam rentang fisiologis normal. Lanjutkan observasi berkala.',
      color: 'emerald'
    };
  }, [fetalHeartRate, fetalHeartRateCategory, amnioticFluid, moldingOfHead, maternalBpSystolic, maternalBpDiastolic, urinaryProtein]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'BIDAN_JAGA_VK',
        moduleName: 'PARTOGRAF DIGITAL & LABOUR CARE GUIDE (WHO-KEMENKES)',
        data: {
          cervicalDilationCm,
          fetalHeartRate,
          fetalHeartRateCategory,
          amnioticFluid,
          moldingOfHead,
          contractionsPer10Min,
          contractionDurationSec,
          oxytocinUsed,
          oxytocinDoseDrips,
          maternalVitals: {
            bp: `${maternalBpSystolic}/${maternalBpDiastolic}`,
            pulse: maternalPulse,
            temp: maternalTemp,
            urinaryProtein,
            urinaryVolumeMl
          },
          alertEvaluation,
          notes,
          observedAt: new Date().toISOString(),
          authorizedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert('Data Partograf Digital & WHO Labour Care Guide Berhasil Disimpan.');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan partograf: ' + err.message);
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
                <Baby size={12} /> Standard WHO 2026 & Kemenkes RI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 text-[10px] font-black tracking-widest uppercase border border-pink-200 dark:border-pink-500/30">
                PONEK & Labour Care Guide (Partograf Digital)
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              PARTOGRAF DIGITAL & WHO LABOUR CARE GUIDE
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Ibu Bersalin</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm">
            <Baby size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic Status Card */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${
          alertEvaluation.level === 'CRITICAL' ? 'border-rose-500 bg-rose-50/20' : 
          alertEvaluation.level === 'WARNING' ? 'border-amber-500 bg-amber-50/20' : 'border-emerald-500 bg-emerald-50/20'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                alertEvaluation.level === 'CRITICAL' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' : 
                alertEvaluation.level === 'WARNING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              }`}>
                {alertEvaluation.level === 'NORMAL' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">WHO Labour Care Decision Support</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{alertEvaluation.title}</h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{alertEvaluation.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pembukaan</span>
                <span className="text-lg font-black text-rose-600">{cervicalDilationCm} cm</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">DJJ Janin</span>
                <span className={`text-lg font-black ${fetalHeartRate < 110 || fetalHeartRate > 160 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {fetalHeartRate} <span className="text-[10px]">dpm</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Kemajuan Persalinan & Kondisi Janin */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Baby size={16} className="text-rose-500" /> 1. Parameter Kemajuan Serviks & Kesejahteraan Janin (Fetal Well-Being)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Pembukaan Serviks */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Pembukaan Serviks (cm)</span>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="range" 
                  min="4" 
                  max="10" 
                  value={cervicalDilationCm}
                  onChange={e => setCervicalDilationCm(Number(e.target.value))}
                  className="w-full accent-rose-600"
                />
                <span className="text-sm font-black text-rose-600 w-8 text-right">{cervicalDilationCm}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Fase Aktif: 4 - 10 cm</span>
            </div>

            {/* Denyut Jantung Janin */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Denyut Jantung Janin (DJJ)</span>
              <input 
                type="number"
                value={fetalHeartRate}
                onChange={e => setFetalHeartRate(Number(e.target.value))}
                className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-800 dark:text-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Rentang Normal: 110 - 160 dpm</span>
            </div>

            {/* Selaput & Cairan Ketuban */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Cairan Ketuban (Amniotic)</span>
              <select 
                value={amnioticFluid} 
                onChange={e => setAmnioticFluid(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="UTUH">U - Utuh (Intact)</option>
                <option value="JERNIH">J - Jernih (Clear)</option>
                <option value="MEKONIUM">M - Mekonium (Keruh/Hijau)</option>
                <option value="DARAH">D - Bercampur Darah</option>
                <option value="KERING">K - Kering (Absent)</option>
              </select>
            </div>

            {/* Moulage / Penyusupan Kepala */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Penyusupan Tulang (Moulage)</span>
              <select 
                value={moldingOfHead} 
                onChange={e => setMoldingOfHead(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="0">0 - Tulang terpisah / sutura mudah</option>
                <option value="1">1 - Tulang bersentuhan</option>
                <option value="2">2 - Tulang saling tumpang tindih ringan</option>
                <option value="3">3 - Tumpang tindih berat (Distosia)</option>
              </select>
            </div>

          </div>
        </div>

        {/* 2. His / Kontraksi Uterus & Oksitosin */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-pink-500" /> 2. Kontraksi Uterus (His) & Stimulasi Oksitosin
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Frekuensi Kontraksi per 10 Menit</span>
              <input 
                type="number"
                min="1"
                max="6"
                value={contractionsPer10Min}
                onChange={e => setContractionsPer10Min(Number(e.target.value))}
                className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-800 dark:text-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Target Adekuat: 3 - 5 kali / 10 menit</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Durasi Kontraksi (Detik)</span>
              <input 
                type="number"
                value={contractionDurationSec}
                onChange={e => setContractionDurationSec(Number(e.target.value))}
                className="w-full mt-1 p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-800 dark:text-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Adekuat: &gt; 40 detik</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Drip Oksitosin (Jika Ada)</span>
                <input 
                  type="checkbox" 
                  checked={oxytocinUsed}
                  onChange={e => setOxytocinUsed(e.target.checked)}
                  className="h-4 w-4 rounded text-pink-600"
                />
              </div>
              {oxytocinUsed && (
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="number"
                    value={oxytocinDoseDrips}
                    onChange={e => setOxytocinDoseDrips(Number(e.target.value))}
                    className="w-20 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                  />
                  <span className="text-xs font-semibold text-slate-500">tetes / menit</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Tanda Vital Ibu & Skrining Preeklamsia */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Gauge size={16} className="text-indigo-500" /> 3. Kondisi Vital Ibu & Urine (Maternal Monitoring)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">TD Sistolik / Diastolik</span>
              <div className="flex items-center gap-1 mt-1">
                <input 
                  type="number" 
                  value={maternalBpSystolic} 
                  onChange={e => setMaternalBpSystolic(Number(e.target.value))} 
                  className="w-14 p-1 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-400">/</span>
                <input 
                  type="number" 
                  value={maternalBpDiastolic} 
                  onChange={e => setMaternalBpDiastolic(Number(e.target.value))} 
                  className="w-14 p-1 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-center"
                />
                <span className="text-[10px] text-slate-400">mmHg</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Nadi Ibu (bpm)</span>
              <input 
                type="number" 
                value={maternalPulse} 
                onChange={e => setMaternalPulse(Number(e.target.value))} 
                className="w-full mt-1 p-1 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Suhu Tubuh (°C)</span>
              <input 
                type="number" 
                step="0.1"
                value={maternalTemp} 
                onChange={e => setMaternalTemp(Number(e.target.value))} 
                className="w-full mt-1 p-1 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Protein Urine</span>
              <select 
                value={urinaryProtein} 
                onChange={e => setUrinaryProtein(e.target.value)}
                className="w-full mt-1 p-1 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              >
                <option value="NEGATIF">Negatif (-)</option>
                <option value="POSITIF_1">+1 (30 mg/dL)</option>
                <option value="POSITIF_2">+2 (100 mg/dL)</option>
                <option value="POSITIF_3">+3 (300 mg/dL)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-rose-600" /> 4. Evaluasi & Instruksi Klinis Bidan / Sp.OG
          </h4>
          <textarea 
            rows="2"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Petugas Penanggung Jawab VK: <strong>{currentUser?.displayName || currentUser?.email || 'BIDAN VK JAGA'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Simpan Partograf & Labour Care Guide'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
