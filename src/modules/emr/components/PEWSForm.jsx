import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Smile, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Sparkles, HeartPulse, User, Flame
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function PEWSForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();

  // 3 Kategori Skor PEWS (Behavior, Cardiovascular, Respiratory)
  const [behaviorScore, setBehaviorScore] = useState(0);     // 0: Playing/Appropriate, 1: Sleeping/Irritable, 2: Inconsolable, 3: Lethargic/Floppy
  const [cardioScore, setCardioScore] = useState(0);       // 0: Pink/CRT 1-2s, 1: Pale/CRT 3s, 2: Grey/CRT 4s/Tachy +20, 3: Grey/Mottled/CRT >=5s/Tachy +30
  const [respiratoryScore, setRespiratoryScore] = useState(0);  // 0: Normal, 1: RR >10 above norm/Retraction, 2: RR >20 above norm/Recession, 3: RR >30 above norm/Grunting
  const [nebulizerExtra, setNebulizerExtra] = useState(false);  // +2 Poin if nebulizer given
  const [persistentEmisis, setPersistentEmesis] = useState(false); // +2 Poin if vomiting post-op

  const [notes, setNotes] = useState('Skrining PEWS berkala pada pasien anak untuk deteksi dini kegawatan respirasi dan syok sirkulasi.');
  const [isSaving, setIsSaving] = useState(false);

  // Total PEWS Score
  const totalPEWS = useMemo(() => {
    let score = behaviorScore + cardioScore + respiratoryScore;
    if (nebulizerExtra) score += 2;
    if (persistentEmisis) score += 2;
    return score;
  }, [behaviorScore, cardioScore, respiratoryScore, nebulizerExtra, persistentEmisis]);

  const pewsSeverity = useMemo(() => {
    if (totalPEWS >= 7) return { level: 'HIGH', label: 'RISIKO TINGGI / EMERGENCY (RED TRIGGER)', class: 'bg-red-500 text-white', border: 'border-red-500', action: 'Aktivasi Tim Resusitasi Pediatri / Code Blue & Konsul Cito DPJP Anak.' };
    if (totalPEWS >= 5) return { level: 'MEDIUM', label: 'RISIKO SEDANG (AMBER TRIGGER)', class: 'bg-amber-500 text-white', border: 'border-amber-500', action: 'Tingkatkan observasi per 1 jam, laporkan ke Dokter Jaga Ruangan.' };
    if (totalPEWS >= 3) return { level: 'LOW', label: 'RISIKO RENDAH (YELLOW TRIGGER)', class: 'bg-blue-500 text-white', border: 'border-blue-500', action: 'Observasi rutin per 4 jam, periksa ulang jika ada keluhan.' };
    return { level: 'NORMAL', label: 'NORMAL / STABIL (GREEN)', class: 'bg-emerald-500 text-white', border: 'border-emerald-500', action: 'Observasi standar per shift ruangan rawat inap.' };
  }, [totalPEWS]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'PEDIATRIC_NURSE',
        moduleName: 'PEDIATRIC EARLY WARNING SCORE (PEWS)',
        data: {
          totalPEWS,
          pewsSeverity,
          parameters: {
            behaviorScore,
            cardioScore,
            respiratoryScore,
            nebulizerExtra,
            persistentEmisis
          },
          notes,
          scoredAt: new Date().toISOString(),
          nurseSignature: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Skor PEWS [Total: ${totalPEWS} - ${pewsSeverity.label}] Berhasil Disimpan.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan skor PEWS: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-sky-50 hover:text-sky-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-black tracking-widest uppercase border border-sky-200 dark:border-sky-500/30 flex items-center gap-1">
                <Smile size={12} /> Standard JCI COP.3.1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                Pediatric Early Warning Score
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              PEDIATRIC EARLY WARNING SYSTEM (PEWS)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Anak</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien Anak'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 shadow-sm">
            <Smile size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic PEWS Result Card */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${pewsSeverity.border}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${pewsSeverity.class}`}>
                {totalPEWS}
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Total Skor PEWS Anak</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{pewsSeverity.label}</h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{pewsSeverity.action}</p>
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border text-center ${pewsSeverity.class}`}>
              LEVEL: {pewsSeverity.level}
            </div>
          </div>
        </div>

        {/* 3 Core Categories */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-6">
          
          {/* Behavior / Perilaku */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">1. Perilaku / Tingkat Kesadaran (Behavior)</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {[
                { score: 0, label: 'Bermain / Sesuai Umur / Tenang' },
                { score: 1, label: 'Tidur terus / Mudah teriritasi / Rewel' },
                { score: 2, label: 'Sulit ditenangkan / Menangis terus' },
                { score: 3, label: 'Letargi / Bingung / Respon minimal' }
              ].map(opt => (
                <button
                  key={opt.score}
                  type="button"
                  onClick={() => setBehaviorScore(opt.score)}
                  className={`text-left p-3 rounded-xl text-xs transition-all border ${behaviorScore === opt.score ? 'bg-sky-500 text-white border-sky-600 shadow-sm font-bold' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] opacity-80 mt-1 font-black">+{opt.score} Poin</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cardiovascular */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">2. Status Kardiovaskular (Cardiovascular)</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {[
                { score: 0, label: 'Kemerahan (Pink) / CRT 1-2 detik' },
                { score: 1, label: 'Pucat / CRT 3 detik' },
                { score: 2, label: 'Abu-abu / CRT 4 detik / Takikardi +20 bpm' },
                { score: 3, label: 'Mottled / CRT ≥5 detik / Takikardi +30 bpm' }
              ].map(opt => (
                <button
                  key={opt.score}
                  type="button"
                  onClick={() => setCardioScore(opt.score)}
                  className={`text-left p-3 rounded-xl text-xs transition-all border ${cardioScore === opt.score ? 'bg-sky-500 text-white border-sky-600 shadow-sm font-bold' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] opacity-80 mt-1 font-black">+{opt.score} Poin</div>
                </button>
              ))}
            </div>
          </div>

          {/* Respiratory */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">3. Status Respirasi (Respiratory)</span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {[
                { score: 0, label: 'Laju Napas Normal, tidak ada retraksi' },
                { score: 1, label: 'RR >10 di atas normal / Retraksi ringan' },
                { score: 2, label: 'RR >20 di atas normal / Retraksi sedang / O2' },
                { score: 3, label: 'RR >30 di atas normal / Grunting / Sianosis' }
              ].map(opt => (
                <button
                  key={opt.score}
                  type="button"
                  onClick={() => setRespiratoryScore(opt.score)}
                  className={`text-left p-3 rounded-xl text-xs transition-all border ${respiratoryScore === opt.score ? 'bg-sky-500 text-white border-sky-600 shadow-sm font-bold' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] opacity-80 mt-1 font-black">+{opt.score} Poin</div>
                </button>
              ))}
            </div>
          </div>

          {/* Extra Triggers */}
          <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/20 space-y-2">
            <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block">Poin Tambahan Khusus:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={nebulizerExtra} 
                  onChange={e => setNebulizerExtra(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Penggunaan Nebulisasi / Terapi Inhalasi Kontinu (+2 Poin)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={persistentEmisis} 
                  onChange={e => setPersistentEmesis(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Muntah Persisten Pasca Operasi / Dehidrasi (+2 Poin)</span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-sky-600" /> Catatan Evaluasi Perawat Pediatri
          </h4>
          <textarea 
            rows="2"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Dicatat oleh: <strong>{currentUser?.displayName || currentUser?.email || 'PERAWAT ANAK'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Skor PEWS (COP.3.1)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
