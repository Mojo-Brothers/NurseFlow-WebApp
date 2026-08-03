import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Home, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Sparkles, CheckSquare, Square, Calendar, Pill, HeartPulse
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function DischargeReadinessForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';

  const [clinicalReadiness, setClinicalReadiness] = useState({
    afebrile24h: true,          // Bebas demam > 24 jam tanpa antipiretik
    vitalSignsStable: true,     // TTV stabil dalam batas normal
    oralNutritionTolerated: true,// Toleransi makanan & asupan cairan oral baik
    woundCleanDressingIntact: true, // Luka operasi bersih, tidak ada rembesan/tanda infeksi
    painControlledOral: true,   // Nyeri terkontrol dengan analgetik oral (VAS ≤ 3)
    independentMobilization: true // Mampu mobilisasi mandiri / sesuai baseline
  });

  const [administrativeReadiness, setAdministrativeReadiness] = useState({
    dischargeSummaryCompleted: true, // Resume Medis Rawat Inap (Lengkap & Ditandatangani)
    homeMedicationReconciled: true,  // Rekonsiliasi & Penyerahan Obat Pulang
    patientFamilyEducated: true,     // Edukasi tanda bahaya & perawatan di rumah
    followUpAppointmentScheduled: true // Jadwal kontrol rawat jalan ditetapkan
  });

  const [controlDate, setControlDate] = useState('2026-08-10');
  const [controlPoly, setControlPoly] = useState('Poliklinik Bedah Umum');
  const [homeMedsSummary, setHomeMedsSummary] = useState('Cefixime 200mg 2x1 tab, Asam Mefenamat 500mg 3x1 tab prn nyeri, Edukasi ganti kassa steril hari ke-3.');
  const [isSaving, setIsSaving] = useState(false);

  const isAllReady = useMemo(() => {
    const clin = Object.values(clinicalReadiness).every(Boolean);
    const adm = Object.values(administrativeReadiness).every(Boolean);
    return clin && adm;
  }, [clinicalReadiness, administrativeReadiness]);

  const toggleCheck = (setter, key) => {
    setter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'DPJP_SURGEON',
        moduleName: 'KRITERIA KESIAPAN PULANG PASIEN (ACC.4)',
        data: {
          clinicalReadiness,
          administrativeReadiness,
          isAllReady,
          controlDate,
          controlPoly,
          homeMedsSummary,
          dischargedAt: new Date().toISOString(),
          approvedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Verifikasi Kesiapan Pasien Pulang [Status: ${isAllReady ? 'DISCHARGE APPROVED' : 'HOLD'}] Berhasil Disimpan.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan kesiapan pulang: ' + err.message);
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
                <Home size={12} /> Standard JCI ACC.4
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-black tracking-widest uppercase border border-teal-200 dark:border-teal-500/30">
                Discharge Planning & Readiness Checklist
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              KRITERIA KESIAPAN PASIEN PULANG (DISCHARGE READINESS)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Pulang</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
            <Home size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Dynamic Status Card */}
        <div className={`p-6 rounded-[2rem] border-2 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg transition-all ${isAllReady ? 'border-emerald-500' : 'border-amber-500'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isAllReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                {isAllReady ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} />}
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Hasil Evaluasi Kesiapan Pemulangan</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {isAllReady ? 'PASIEN SIAP PULANG KE RUMAH (DISCHARGE APPROVED)' : 'BELUM SIAP PULANG (PENDING CRITERIA)'}
                </h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {isAllReady 
                    ? 'Semua parameter klinis, edukasi, resume medis, dan obat pulang telah terverifikasi lengkap.' 
                    : 'Masih ada checklist klinis atau administratif yang belum terpenuhi.'}
                </p>
              </div>
            </div>

            <div className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase border text-center ${isAllReady ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}`}>
              STATUS: {isAllReady ? 'READY TO DISCHARGE' : 'HOLD DISCHARGE'}
            </div>
          </div>
        </div>

        {/* 1. Kriteria Klinis Pemulangan */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <HeartPulse size={16} className="text-emerald-500" /> 1. Parameter Kriteria Klinis Pemulangan (JCI ACC.4)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: 'afebrile24h', label: 'Bebas demam selama > 24 jam berturut-turut tanpa antipiretik' },
              { key: 'vitalSignsStable', label: 'Tanda-tanda vital stabil dalam rentang aman normal pasien' },
              { key: 'oralNutritionTolerated', label: 'Toleransi asupan nutrisi & cairan per oral adekuat tanpa mual/muntah' },
              { key: 'woundCleanDressingIntact', label: 'Luka operasi/tindakan bersih, balutan kering, tidak ada tanda infeksi lokal' },
              { key: 'painControlledOral', label: 'Nyeri terkontrol baik dengan analgesik oral (Skor VAS ≤ 3/10)' },
              { key: 'independentMobilization', label: 'Mampu mobilisasi mandiri atau bantuan keluarga sesuai kondisi baseline' }
            ].map(item => (
              <div 
                key={item.key}
                onClick={() => toggleCheck(setClinicalReadiness, item.key)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
              >
                <div className="mt-0.5 text-emerald-600">
                  {clinicalReadiness[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Checklist Edukasi & Administratif JCI */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Pill size={16} className="text-teal-500" /> 2. Edukasi Pasien, Obat Pulang & Rencana Kontrol
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { key: 'dischargeSummaryCompleted', label: 'Resume Medis Rawat Inap (Discharge Summary) selesai & disahkan DPJP' },
              { key: 'homeMedicationReconciled', label: 'Rekonsiliasi obat pulang & penyerahan resep oleh Farmasi Klinis' },
              { key: 'patientFamilyEducated', label: 'Edukasi tanda bahaya (Red Flags) dan perawatan mandiri di rumah' },
              { key: 'followUpAppointmentScheduled', label: 'Surat kontrol poliklinik rawat jalan telah dibuat & diserahkan' }
            ].map(item => (
              <div 
                key={item.key}
                onClick={() => toggleCheck(setAdministrativeReadiness, item.key)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
              >
                <div className="mt-0.5 text-teal-600">
                  {administrativeReadiness[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tanggal Kontrol Ulang</span>
              <input 
                type="date" 
                value={controlDate} 
                onChange={e => setControlDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Poli Tujuan Kontrol</span>
              <input 
                type="text" 
                value={controlPoly} 
                onChange={e => setControlPoly(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200" 
              />
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-emerald-600" /> 3. Ringkasan Obat Pulang & Pengesahan DPJP
          </h4>
          <textarea 
            rows="2"
            value={homeMedsSummary}
            onChange={e => setHomeMedsSummary(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>DPJP yang mengesahkan pemulangan: <strong>{currentUser?.displayName || currentUser?.email || 'DPJP UTAMA'}</strong></span>
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
                {isSaving ? 'Menyimpan...' : 'Sahkan Kesiapan Pulang Pasien'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
