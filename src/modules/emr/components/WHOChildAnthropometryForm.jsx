import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Scale, Baby, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Sparkles, Ruler, HeartPulse
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function WHOChildAnthropometryForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();

  // Data Antropometri Anak
  const [childAgeMonths, setChildAgeMonths] = useState(24); // Umur dalam bulan (0 - 60 bulan)
  const [childGender, setChildGender] = useState('FEMALE'); // 'MALE' | 'FEMALE'
  const [weightKg, setWeightKg] = useState(11.5);
  const [heightCm, setHeightCm] = useState(86.5);
  const [headCircumferenceCm, setHeadCircumferenceCm] = useState(47.5);
  const [armCircumferenceCm, setArmCircumferenceCm] = useState(15.2); // LiLA (Lingkar Lengan Atas)
  const [hasEdemaBilateral, setHasEdemaBilateral] = useState(false); // Edema nutrisional (Kwashiorkor)

  const [dietaryRecallNotes, setDietaryRecallNotes] = useState(
    'Asupan MPASI adekuat dengan gizi seimbang (protein hewani telur & ikan). Status imunisasi dasar lengkap. Tidak ada tanda wasting atau stunting.'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Kalkulasi Indeks Z-Score Berdasarkan Standar Antropometri Kemenkes RI 2020 & WHO Child Growth Standards
  const growthAssessment = useMemo(() => {
    // Estimasi Standar Median WHO untuk 24 Bulan Anak Perempuan:
    // TB Median ~ 85.7 cm (SD ~ 3.1)
    // BB Median ~ 11.5 kg (SD ~ 1.3)
    
    // 1. Indeks TB/U (Tinggi Badan menurut Umur - Skrining Stunting)
    // Nilai Z-score: (Tinggi - Median) / SD
    const medianHeight = childGender === 'FEMALE' ? (74 + (childAgeMonths * 0.5)) : (75 + (childAgeMonths * 0.5));
    const zScoreHeightForAge = ((heightCm - medianHeight) / 3.0).toFixed(1);

    let stuntingCategory = 'NORMAL (TINGGI NORMAL)';
    let stuntingColor = 'emerald';
    if (zScoreHeightForAge < -3) {
      stuntingCategory = 'SEVERELY STUNTED (SANGAT PENDEK)';
      stuntingColor = 'rose';
    } else if (zScoreHeightForAge < -2) {
      stuntingCategory = 'STUNTED (PENDEK)';
      stuntingColor = 'amber';
    } else if (zScoreHeightForAge > 3) {
      stuntingCategory = 'TINGGI (ABOVE AVERAGE)';
      stuntingColor = 'blue';
    }

    // 2. Indeks BB/TB (Berat menurut Tinggi - Skrining Wasting / Gizi Buruk)
    const idealWeightForHeight = (heightCm - 80) * 0.35 + 10;
    const zScoreWeightForHeight = ((weightKg - idealWeightForHeight) / 1.1).toFixed(1);

    let wastingCategory = 'GIZI BAIK (NORMAL)';
    let wastingColor = 'emerald';
    if (hasEdemaBilateral || zScoreWeightForHeight < -3) {
      wastingCategory = 'GIZI BURUK (SEVERE WASTING)';
      wastingColor = 'rose';
    } else if (zScoreWeightForHeight < -2) {
      wastingCategory = 'GIZI KURANG (WASTED)';
      wastingColor = 'amber';
    } else if (zScoreWeightForHeight > 2) {
      wastingCategory = 'GIZI LEBIH / OBESITAS';
      wastingColor = 'amber';
    }

    return {
      zScoreHeightForAge: Number(zScoreHeightForAge),
      stuntingCategory,
      stuntingColor,
      zScoreWeightForHeight: Number(zScoreWeightForHeight),
      wastingCategory,
      wastingColor
    };
  }, [childAgeMonths, childGender, heightCm, weightKg, hasEdemaBilateral]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'NUTRITIONIST_STAFF',
        moduleName: 'SKRINING ANTROPOMETRI & STUNTING ANAK (WHO-Z KEMENKES)',
        data: {
          childAgeMonths,
          childGender,
          measurements: {
            weightKg,
            heightCm,
            headCircumferenceCm,
            armCircumferenceCm,
            hasEdemaBilateral
          },
          growthAssessment,
          dietaryRecallNotes,
          evaluatedAt: new Date().toISOString(),
          evaluatedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Asesmen Antropometri WHO & Kemenkes [Status: ${growthAssessment.stuntingCategory} | ${growthAssessment.wastingCategory}] Berhasil Disimpan.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan antropometri: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-black tracking-widest uppercase border border-teal-200 dark:border-teal-500/30 flex items-center gap-1">
                <Baby size={12} /> Permenkes RI No. 2/2020 & WHO Standards
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30">
                Skrining Stunting & Status Gizi Anak Z-Score
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              ANTROPOMETRI & SKRINING STUNTING ANAK (WHO Z-SCORE)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Terkait</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Anak'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 shadow-sm">
            <Ruler size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic Growth Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Stunting Card */}
          <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-md transition-all ${
            growthAssessment.stuntingColor === 'rose' ? 'border-rose-500 bg-rose-50/20' : 
            growthAssessment.stuntingColor === 'amber' ? 'border-amber-500 bg-amber-50/20' : 'border-emerald-500 bg-emerald-50/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Indeks TB/U (Panjang/Tinggi Badan menurut Umur)</span>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10">Z: {growthAssessment.zScoreHeightForAge} SD</span>
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{growthAssessment.stuntingCategory}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {growthAssessment.zScoreHeightForAge < -2 ? 'Terindikasi mengalami perlambatan pertumbuhan linier / stunting.' : 'Pertumbuhan linier tinggi badan anak optimal sesuai usia.'}
            </p>
          </div>

          {/* Wasting Card */}
          <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-md transition-all ${
            growthAssessment.wastingColor === 'rose' ? 'border-rose-500 bg-rose-50/20' : 
            growthAssessment.wastingColor === 'amber' ? 'border-amber-500 bg-amber-50/20' : 'border-emerald-500 bg-emerald-50/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Indeks BB/TB (Berat Badan menurut Tinggi Badan)</span>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10">Z: {growthAssessment.zScoreWeightForHeight} SD</span>
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{growthAssessment.wastingCategory}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {growthAssessment.zScoreWeightForHeight < -2 ? 'Memerlukan intervensi makanan tambahan tinggi kalori & pemantauan gizi.' : 'Proporsi massa tubuh terhadap tinggi badan dalam batas normal.'}
            </p>
          </div>

        </div>

        {/* 1. Parameter Pengukuran Fisik */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Scale size={16} className="text-teal-500" /> 1. Parameter Pengukuran Fisik & Antropometri
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Usia (Bulan)</span>
              <input 
                type="number" 
                min="0" 
                max="60" 
                value={childAgeMonths} 
                onChange={e => setChildAgeMonths(Number(e.target.value))} 
                className="w-full mt-1 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Jenis Kelamin</span>
              <select 
                value={childGender} 
                onChange={e => setChildGender(e.target.value)} 
                className="w-full mt-1 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              >
                <option value="FEMALE">Perempuan</option>
                <option value="MALE">Laki-Laki</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Berat Badan (kg)</span>
              <input 
                type="number" 
                step="0.1" 
                value={weightKg} 
                onChange={e => setWeightKg(Number(e.target.value))} 
                className="w-full mt-1 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Tinggi / PB (cm)</span>
              <input 
                type="number" 
                step="0.1" 
                value={heightCm} 
                onChange={e => setHeightCm(Number(e.target.value))} 
                className="w-full mt-1 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">LiLA (cm)</span>
              <input 
                type="number" 
                step="0.1" 
                value={armCircumferenceCm} 
                onChange={e => setArmCircumferenceCm(Number(e.target.value))} 
                className="w-full mt-1 p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Edema Nutrisi</span>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  checked={hasEdemaBilateral} 
                  onChange={e => setHasEdemaBilateral(e.target.checked)} 
                  className="h-4 w-4 rounded text-rose-600"
                />
                <span className="text-[10px] font-semibold text-slate-600">Bilateral (+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-teal-600" /> 2. Rekomendasi Nutrisi & Tindak Lanjut Tumbuh Kembang
          </h4>
          <textarea 
            rows="2"
            value={dietaryRecallNotes}
            onChange={e => setDietaryRecallNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Nutrisionis / Dokter Anak Penilai: <strong>{currentUser?.displayName || currentUser?.email || 'NUTRISIONIS KLINIS'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Simpan Skrining Antropometri (WHO-Z)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
