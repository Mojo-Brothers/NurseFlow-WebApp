import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Activity, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Sparkles, Stethoscope, FileSignature, Gauge, HeartPulse, Zap
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function AldreteScoreForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';

  const [motorActivity, setMotorActivity] = useState(2); // 0, 1, 2
  const [respiration, setRespiration] = useState(2); // 0, 1, 2
  const [circulation, setCirculation] = useState(2); // 0, 1, 2
  const [consciousness, setConsciousness] = useState(2); // 0, 1, 2
  const [o2Saturation, setO2Saturation] = useState(2); // 0, 1, 2

  const [anesthesiaType, setAnesthesiaType] = useState('GENERAL'); // 'GENERAL' or 'SPINAL'
  const [bromageScore, setBromageScore] = useState(0); // 0 (None), 1 (Partial 33%), 2 (Almost Complete 66%), 3 (Complete 100%)

  const [doctorNotes, setDoctorNotes] = useState(
    isDewi 
      ? 'Pasien sadar penuh, hemodinamik stabil pasca Laparoscopic Appendectomy. Ekstubasi mulus di meja operasi. Nyeri pasca bedah terkontrol (VAS 3/10).' 
      : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Total Aldrete Score Computation
  const totalAldrete = useMemo(() => {
    return motorActivity + respiration + circulation + consciousness + o2Saturation;
  }, [motorActivity, respiration, circulation, consciousness, o2Saturation]);

  const isEligibleForDischarge = totalAldrete >= 9 && (anesthesiaType !== 'SPINAL' || bromageScore <= 1);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'ANESTHESIOLOGIST',
        moduleName: 'SKOR ALDRETE & PEMULIHAN PACU (ASC.7.4)',
        data: {
          totalAldrete,
          isEligibleForDischarge,
          parameters: {
            motorActivity,
            respiration,
            circulation,
            consciousness,
            o2Saturation
          },
          anesthesiaType,
          bromageScore: anesthesiaType === 'SPINAL' ? bromageScore : null,
          doctorNotes,
          signedAt: new Date().toISOString(),
          signedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Asesmen Aldrete Score [Skor: ${totalAldrete}/10 - ${isEligibleForDischarge ? 'LAYAK PINDAH' : 'OBSERVASI PACU'}] Berhasil Disimpan.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan skor Aldrete: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                <Gauge size={12} /> Standard JCI ASC.7.4
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                Modified Aldrete Scoring
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              SKOR PEMULIHAN PASCA ANESTESI (ALDRETE & BROMAGE)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Terpilih</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien Rekam Medis'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
            <Gauge size={24} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic Score Result Card */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${isEligibleForDischarge ? 'border-emerald-500' : 'border-amber-500'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${isEligibleForDischarge ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                {totalAldrete}/10
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Hasil Evaluasi Kesiapan Pindah PACU</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {isEligibleForDischarge ? 'LAYAK PINDAH KE BANGSAL (APPROVED)' : 'BELUM LAYAK PINDAH (OBSERVASI PACU)'}
                </h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {isEligibleForDischarge 
                    ? 'Pasien telah mencapai skor minimal ≥ 9 dan fungsi vital stabil untuk ditransfer ke ruang rawat inap.' 
                    : 'Skor < 9 atau blok motorik belum pulih. Lanjutkan monitoring intensif di Ruang Pemulihan (PACU).'}
                </p>
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border text-center ${isEligibleForDischarge ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
              STATUS: {isEligibleForDischarge ? 'DISCHARGE APPROVED' : 'HOLD IN PACU'}
            </div>
          </div>
        </div>

        {/* Aldrete 5 Parameters Selection */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" /> 1. Parameter Modified Aldrete Score (0 - 2 Poin Tiap Kategori)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Aktivitas Motorik */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">A. Aktivitas Motorik</span>
              <div className="space-y-1.5">
                {[
                  { score: 2, label: 'Mampu menggerakkan 4 ekstremitas atas perintah' },
                  { score: 1, label: 'Mampu menggerakkan 2 ekstremitas atas perintah' },
                  { score: 0, label: 'Tidak mampu menggerakkan ekstremitas / paralisis' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setMotorActivity(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${motorActivity === opt.score ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/10 text-[11px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Respirasi */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">B. Pernapasan / Respirasi</span>
              <div className="space-y-1.5">
                {[
                  { score: 2, label: 'Mampu bernapas dalam & batuk spontan' },
                  { score: 1, label: 'Dispnea, napas dangkal, atau terbatas' },
                  { score: 0, label: 'Apnea / memerlukan ventilasi buatan' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setRespiration(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${respiration === opt.score ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/10 text-[11px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Sirkulasi / Tekanan Darah */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">C. Sirkulasi / Tekanan Darah</span>
              <div className="space-y-1.5">
                {[
                  { score: 2, label: 'TD ± 20% dari nilai pre-anestesi' },
                  { score: 1, label: 'TD ± 20% - 49% dari nilai pre-anestesi' },
                  { score: 0, label: 'TD ± 50% dari nilai pre-anestesi' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setCirculation(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${circulation === opt.score ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/10 text-[11px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Kesadaran */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">D. Kesadaran</span>
              <div className="space-y-1.5">
                {[
                  { score: 2, label: 'Sadar penuh, orientasi waktu & tempat baik' },
                  { score: 1, label: 'Terbangun jika dipanggil / rangsang suara' },
                  { score: 0, label: 'Tidak ada respon / belum sadar' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setConsciousness(opt.score)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${consciousness === opt.score ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/10 text-[11px] font-black">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Saturasi O2 / Warna Kulit */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2 md:col-span-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">E. Saturasi O2 / Warna Kulit</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { score: 2, label: 'SpO2 > 92% pada udara ruangan (Room Air)' },
                  { score: 1, label: 'Memerlukan suplementasi O2 nasal untuk SpO2 > 90%' },
                  { score: 0, label: 'SpO2 < 90% walaupun dengan suplementasi O2' }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setO2Saturation(opt.score)}
                    className={`text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${o2Saturation === opt.score ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-white/5'}`}
                  >
                    <span>{opt.label}</span>
                    <span className="px-2 py-0.5 rounded-md bg-black/10 text-[11px] font-black ml-2">{opt.score} Poin</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Optional Bromage Scale for Spinal Anesthesia */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Zap size={16} className="text-blue-500" /> 2. Jenis Anestesi & Bromage Scale (Spinal/Epidural)
            </h4>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setAnesthesiaType('GENERAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${anesthesiaType === 'GENERAL' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600'}`}
              >
                General Anesthesia (GA)
              </button>
              <button 
                type="button"
                onClick={() => setAnesthesiaType('SPINAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${anesthesiaType === 'SPINAL' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600'}`}
              >
                Spinal / Regional Anesthesia (RA)
              </button>
            </div>
          </div>

          {anesthesiaType === 'SPINAL' && (
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 space-y-2">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">Skor Bromage (Blok Motorik Ekstremitas Bawah):</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {[
                  { score: 0, label: 'Skor 0: Bebas bergerak (Tungkai & lutut fleksi penuh)', pass: true },
                  { score: 1, label: 'Skor 1: Mampu fleksi lutut & gerak pergelangan kaki', pass: true },
                  { score: 2, label: 'Skor 2: Hanya mampu gerak pergelangan kaki', pass: false },
                  { score: 3, label: 'Skor 3: Blok komplit / paralisis total tungkai', pass: false }
                ].map(opt => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setBromageScore(opt.score)}
                    className={`text-left p-3 rounded-xl text-xs transition-all border ${bromageScore === opt.score ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] opacity-80 mt-1 font-bold">{opt.pass ? '✓ Syarat Pindah Bangsal' : '✕ Belum Boleh Pindah'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Doctor Notes & Action Footer */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-emerald-500" /> 3. Instruksi Pasca Anestesi & Pengesahan DPJP
          </h4>
          <textarea 
            rows="3"
            value={doctorNotes}
            onChange={e => setDoctorNotes(e.target.value)}
            placeholder="Instruksi posisi tirah baring, diet pasca anestesi, pemantauan TTV berkala di bangsal..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Divalidasi oleh Dokter Spesialis Anestesiologi: <strong>{currentUser?.displayName || currentUser?.email || 'DPJP ANESTESI'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Skor & Perintah Transfer'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
