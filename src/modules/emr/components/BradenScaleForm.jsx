import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  ShieldAlert, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Sparkles, BedDouble, RotateCcw, Clock
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function BradenScaleForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();

  // 6 Parameter Braden Scale
  const [sensoryPerception, setSensoryPerception] = useState(4); // 1: Completely Limited, 2: Very Limited, 3: Slightly Limited, 4: No Impairment
  const [moisture, setMoisture] = useState(4);                  // 1: Constantly Moist, 2: Very Moist, 3: Occasionally Moist, 4: Rarely Moist
  const [activity, setActivity] = useState(3);                  // 1: Bedfast, 2: Chairfast, 3: Walks Occasionally, 4: Walks Frequently
  const [mobility, setMobility] = useState(3);                  // 1: Completely Immobile, 2: Very Limited, 3: Slightly Limited, 4: No Limitation
  const [nutrition, setNutrition] = useState(3);                // 1: Very Poor, 2: Probably Inadequate, 3: Adequate, 4: Excellent
  const [frictionShear, setFrictionShear] = useState(3);        // 1: Problem, 2: Potential Problem, 3: No Apparent Problem

  const [turningSchedule, setTurningSchedule] = useState('EVERY_2_HOURS'); // 'EVERY_2_HOURS' | 'EVERY_4_HOURS' | 'ROUTINE'
  const [specialMattress, setSpecialMattress] = useState(false);
  const [notes, setNotes] = useState('Pencegahan luka tekan dekubitus dengan edukasi mobilisasi bertahap dan reposisi posisi tidur miring kanan/kiri.');
  const [isSaving, setIsSaving] = useState(false);

  // Total Braden Score Calculation
  const totalBraden = useMemo(() => {
    return sensoryPerception + moisture + activity + mobility + nutrition + frictionShear;
  }, [sensoryPerception, moisture, activity, mobility, nutrition, frictionShear]);

  const riskAssessment = useMemo(() => {
    if (totalBraden <= 9) return { level: 'VERY_HIGH', label: 'RISIKO SANGAT TINGGI (VERY HIGH RISK)', class: 'bg-red-500 text-white', border: 'border-red-500', action: 'Wajib Kasur Anti-Dekubitus (Ripple Mattress), reposisi miring kanan/kiri tiap 2 jam ketat, pelindung tumit/siku.' };
    if (totalBraden <= 12) return { level: 'HIGH', label: 'RISIKO TINGGI (HIGH RISK)', class: 'bg-orange-500 text-white', border: 'border-orange-500', action: 'Gunakan kasur busa khusus, reposisi tiap 2 jam, jaga kelembapan kulit dengan barrier cream.' };
    if (totalBraden <= 14) return { level: 'MODERATE', label: 'RISIKO SEDANG (MODERATE RISK)', class: 'bg-amber-500 text-white', border: 'border-amber-500', action: 'Jadwal reposisi berkala, tingkatkan mobilisasi aktif, optimalkan asupan protein.' };
    if (totalBraden <= 18) return { level: 'MILD', label: 'RISIKO RINGAN (MILD RISK)', class: 'bg-blue-500 text-white', border: 'border-blue-500', action: 'Edukasi mobilisasi mandiri dan pemantauan kulit saat mandi.' };
    return { level: 'NO_RISK', label: 'TIDAK BERISIKO (NO RISK)', class: 'bg-emerald-500 text-white', border: 'border-emerald-500', action: 'Asuhan keperawatan standar ruangan.' };
  }, [totalBraden]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'PRIMARY_NURSE',
        moduleName: 'SKALA BRADEN (RISIKO DEKUBITUS)',
        data: {
          totalBraden,
          riskAssessment,
          scores: {
            sensoryPerception,
            moisture,
            activity,
            mobility,
            nutrition,
            frictionShear
          },
          interventions: {
            turningSchedule,
            specialMattress
          },
          notes,
          assessedAt: new Date().toISOString(),
          nurseSignature: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Asesmen Skala Braden [Skor: ${totalBraden}/23 - ${riskAssessment.label}] Berhasil Disimpan.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan skala Braden: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-orange-50 hover:text-orange-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-black tracking-widest uppercase border border-orange-200 dark:border-orange-500/30 flex items-center gap-1">
                <BedDouble size={12} /> Standard JCI COP.3
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                Braden Scale Pressure Ulcer
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              SKALA BRADEN (ASESMEN RISIKO DEKUBITUS)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Rawat</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien Rawat'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20 shadow-sm">
            <BedDouble size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic Braden Result Card */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${riskAssessment.border}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${riskAssessment.class}`}>
                {totalBraden}/23
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Total Skor Braden Dekubitus</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{riskAssessment.label}</h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{riskAssessment.action}</p>
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border text-center ${riskAssessment.class}`}>
              TINGKAT: {riskAssessment.level}
            </div>
          </div>
        </div>

        {/* 6 Braden Parameters */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-orange-500" /> 1. Parameter Penilaian 6 Sub-Skala Braden
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Persepsi Sensori */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">A. Persepsi Sensori (Merespon Tekanan)</span>
              <div className="space-y-1.5">
                {[
                  { score: 1, label: '1. Terbatas Sepenuhnya (Tidak merespon nyeri)' },
                  { score: 2, label: '2. Sangat Terbatas (Hanya respon rintihan/gelisah)' },
                  { score: 3, label: '3. Sedikit Terbatas (Respon verbal tapi rasa terganggu)' },
                  { score: 4, label: '4. Tidak Ada Gangguan (Respon utuh terhadap perintah)' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setSensoryPerception(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${sensoryPerception === opt.score ? 'bg-orange-500 text-white font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded bg-black/10 text-[10px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Kelembapan Kulit */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">B. Kelembapan Kulit (Moisture)</span>
              <div className="space-y-1.5">
                {[
                  { score: 1, label: '1. Selalu Lembap (Keringat / Inkontinensia konstan)' },
                  { score: 2, label: '2. Sangat Lembap (Linen diganti minimal 1x per shift)' },
                  { score: 3, label: '3. Kadang Lembap (Linen diganti ekstra 1x per hari)' },
                  { score: 4, label: '4. Jarang Lembap (Kulit biasanya kering & bersih)' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setMoisture(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${moisture === opt.score ? 'bg-orange-500 text-white font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded bg-black/10 text-[10px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Aktivitas Fisik */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">C. Aktivitas Fisik</span>
              <div className="space-y-1.5">
                {[
                  { score: 1, label: '1. Tirah Baring Total (Bedfast)' },
                  { score: 2, label: '2. Duduk di Kursi Roda / Tidak mampu jalan (Chairfast)' },
                  { score: 3, label: '3. Kadang Berjalan (Jarak pendek dengan bantuan)' },
                  { score: 4, label: '4. Sering Berjalan (Mandiri di luar kamar)' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setActivity(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${activity === opt.score ? 'bg-orange-500 text-white font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded bg-black/10 text-[10px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Mobilitas / Mengubah Posisi */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">D. Mobilitas (Kemampuan Mengubah Posisi)</span>
              <div className="space-y-1.5">
                {[
                  { score: 1, label: '1. Imobilisasi Total (Tidak mampu bergerak sama sekali)' },
                  { score: 2, label: '2. Sangat Terbatas (Hanya geser posisi ringan tanpa bantuan)' },
                  { score: 3, label: '3. Sedikit Terbatas (Sering ubah posisi tubuh sendiri)' },
                  { score: 4, label: '4. Tanpa Batasan (Bebas mengatur posisi tubuh di kasur)' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setMobility(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${mobility === opt.score ? 'bg-orange-500 text-white font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded bg-black/10 text-[10px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Pola Nutrisi */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">E. Pola Nutrisi</span>
              <div className="space-y-1.5">
                {[
                  { score: 1, label: '1. Sangat Buruk (Jarang habiskan 1/3 porsi makan)' },
                  { score: 2, label: '2. Kemungkinan Kurang (Habiskan 1/2 porsi atau NGT)' },
                  { score: 3, label: '3. Adekuat (Habiskan lebih dari 1/2 porsi makan)' },
                  { score: 4, label: '4. Sangat Baik (Habiskan seluruh porsi makanan)' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setNutrition(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${nutrition === opt.score ? 'bg-orange-500 text-white font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded bg-black/10 text-[10px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Gesekan & Pergeseran */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">F. Gesekan & Pergeseran (Friction & Shear)</span>
              <div className="space-y-1.5">
                {[
                  { score: 1, label: '1. Bermasalah (Butuh bantuan penuh saat dipindahkan)' },
                  { score: 2, label: '2. Potensi Masalah (Bergerak lemah, geser di linen)' },
                  { score: 3, label: '3. Tidak Ada Masalah (Mengangkat tubuh saat bergerak)' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setFrictionShear(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between border ${frictionShear === opt.score ? 'bg-orange-500 text-white font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded bg-black/10 text-[10px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Repositioning Schedule & Mattres Order */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <RotateCcw size={16} className="text-orange-500" /> 2. Rencana Intervensi Pencegahan Dekubitus
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Jadwal Alih Baring (Reposisi Posisi Tidur):</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'EVERY_2_HOURS', label: 'Tiap 2 Jam (Wajib High Risk)' },
                  { id: 'EVERY_4_HOURS', label: 'Tiap 4 Jam (Moderate Risk)' },
                  { id: 'ROUTINE', label: 'Rutin Per Shift' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTurningSchedule(item.id)}
                    className={`p-3 rounded-xl text-xs border text-left transition-all ${turningSchedule === item.id ? 'bg-orange-500 text-white font-bold' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-500/10 border border-orange-200/60 dark:border-orange-500/20 cursor-pointer w-full text-xs font-bold text-orange-900 dark:text-orange-200">
                <input 
                  type="checkbox" 
                  checked={specialMattress} 
                  onChange={e => setSpecialMattress(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 h-5 w-5"
                />
                <span>Wajib Pasang Kasur Anti-Dekubitus (Alternating Pressure Ripple Mattress)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-orange-600" /> Catatan Edukasi & Pengesahan Perawat
          </h4>
          <textarea 
            rows="2"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Pengkaji Risiko Luka Tekan: <strong>{currentUser?.displayName || currentUser?.email || 'PERAWAT PRIMER'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Skala Braden (COP.3)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
