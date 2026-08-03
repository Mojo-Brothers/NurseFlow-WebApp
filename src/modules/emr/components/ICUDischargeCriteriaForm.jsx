import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  LogOut, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, HeartPulse, Building2, CheckSquare, Square, Info
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function ICUDischargeCriteriaForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';

  const [criteria, setCriteria] = useState({
    hemodynamicStable: true,       // Stabil tanpa inotropik > 24 jam
    extubatedStable: true,          // Ekstubasi sukses, napas spontan SpO2 > 95%
    gcsStable: true,                // GCS stabil ≥ 13 / baseline
    electrolytesControlled: true,   // AGD & Elektrolit normal
    noContinuousDialysis: true,     // Tidak butuh CRRT terus menerus
    monitoringDecreased: true,      // Kebutuhan monitoring invasif berkurang
    painControlled: true            // Nyeri terkontrol obat oral/intermiten
  });

  const [targetDestination, setTargetDestination] = useState('WARD'); // 'HCU' | 'WARD' | 'REHAB' | 'HOME'
  const [doctorNotes, setDoctorNotes] = useState(
    'Kondisi hemodinamik stabil 24 jam pasca observasi intensif. Pasien toleransi makanan cair. Siap alih rawat ke Bangsal Rawat Inap Bedah.'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Perhitungan Kelulusan Kriteria Discharge ICU
  const allCriteriaMet = useMemo(() => {
    return Object.values(criteria).every(Boolean);
  }, [criteria]);

  const toggleCheck = (key) => {
    setCriteria(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'INTENSIVIST',
        moduleName: 'KRITERIA PASIEN KELUAR ICU (ACC.3)',
        data: {
          criteria,
          allCriteriaMet,
          targetDestination,
          doctorNotes,
          dischargedAt: new Date().toISOString(),
          intensivistApproval: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Asesmen Pasien Keluar ICU [${allCriteriaMet ? 'APPROVED PINDAH KE ' + targetDestination : 'HOLD DI ICU'}] Berhasil Disimpan.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan formulir kriteria keluar ICU: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black tracking-widest uppercase border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1">
                <LogOut size={12} /> Standard JCI ACC.3
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30">
                ICU Step-Down & Discharge Protocol
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              KRITERIA PASIEN KELUAR / STEP-DOWN RUANG INTENSIF (ICU)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien ICU</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien ICU'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
            <LogOut size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic Status Card */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${allCriteriaMet ? 'border-emerald-500' : 'border-amber-500'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${allCriteriaMet ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                {allCriteriaMet ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Hasil Evaluasi Kelayakan Step-Down</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {allCriteriaMet ? 'MEMENUHI SEMUA KRITERIA KELUAR ICU (STEP-DOWN READY)' : 'BELUM MEMENUHI SEMUA KRITERIA (LANJUTKAN ICU)'}
                </h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {allCriteriaMet 
                    ? 'Pasien telah stabil secara fisiologis dan siap dialihkan ke unit perawatan bertingkat lebih rendah.' 
                    : 'Masih terdapat parameter ketidakstabilan fisiologis. Pasien harus tetap diobservasi di ICU.'}
                </p>
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border text-center ${allCriteriaMet ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
              STATUS: {allCriteriaMet ? 'DISCHARGE APPROVED' : 'HOLD IN ICU'}
            </div>
          </div>
        </div>

        {/* 7 Objective Criteria Checklist */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" /> 1. Parameter Objektif Kriteria Keluar (Standar Kemenkes & JCI ACC.3)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'hemodynamicStable', label: 'Hemodinamik stabil tanpa bantuan obat inotropik / vasopresor selama minimal 24 jam' },
              { key: 'extubatedStable', label: 'Ekstubasi ventilator sukses, jalan napas paten, dan laju pernapasan stabil (SpO2 > 95%)' },
              { key: 'gcsStable', label: 'Tingkat kesadaran stabil (GCS ≥ 13 atau kembali ke nilai baseline pasien)' },
              { key: 'electrolytesControlled', label: 'Analisa Gas Darah (AGD) dan kadar elektrolit serum dalam batas aman/terkontrol' },
              { key: 'noContinuousDialysis', label: 'Bebas dari terapi pengganti ginjal kontinu (CRRT) / hemodialisis intermiten stabil' },
              { key: 'monitoringDecreased', label: 'Kebutuhan pemantauan hemodinamik invasif (A-line/CVP) sudah tidak diperlukan' },
              { key: 'painControlled', label: 'Kontrol nyeri adekuat menggunakan medikasi oral atau injeksi intermiten bangsal' }
            ].map(item => (
              <div 
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
              >
                <div className="mt-0.5 text-indigo-600">
                  {criteria[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Destination Unit Selection */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Building2 size={16} className="text-indigo-500" /> 2. Unit Tujuan Alih Rawat (Step-Down Destination)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'HCU', title: 'High Care Unit (HCU)', subtitle: 'Transisi Step-Down Menengah' },
              { id: 'WARD', title: 'Bangsal Rawat Inap', subtitle: 'Perawatan Reguler Pasien' },
              { id: 'REHAB', title: 'Ruang Rehabilitasi', subtitle: 'Fisioterapi / Restoratif' },
              { id: 'HOME', title: 'Pemulangan ke Rumah', subtitle: 'Discharge Langsung' }
            ].map(dest => (
              <button
                key={dest.id}
                type="button"
                onClick={() => setTargetDestination(dest.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${targetDestination === dest.id ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/20' : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
              >
                <div className="text-xs font-black">{dest.title}</div>
                <div className={`text-[10px] mt-1 ${targetDestination === dest.id ? 'text-indigo-100' : 'text-slate-400'}`}>{dest.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Notes & Intensivist Digital Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-indigo-600" /> 3. Catatan Ringkasan Pasca ICU & Instruksi Perawatan Bangsal
          </h4>
          <textarea 
            rows="3"
            value={doctorNotes}
            onChange={e => setDoctorNotes(e.target.value)}
            placeholder="Instruksi cairan, antibiotik lanjutan, target saturasi, dan batas peringatan EWS bangsal..."
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Divalidasi oleh Dokter Spesialis Intensivis / Anestesi: <strong>{currentUser?.displayName || currentUser?.email || 'DPJP INTENSIVIS'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Step-Down & Perintah Transfer'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
