import React, { useState } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  Activity, FileSignature, Sparkles, Clock, CheckSquare, Square, Eye
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function RestraintAssessmentForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();

  const [restraintType, setRestraintType] = useState('PHYSICAL_LIMB'); // 'PHYSICAL_LIMB' | 'BED_RAILS_4' | 'VEST' | 'CHEMICAL'
  const [justification, setJustification] = useState({
    pullingTubes: true,        // Menarik selang NGT/ETT/Infus
    violenceSelfHarm: false,    // Mencederai diri sendiri
    aggressionStaff: false,     // Menyerang petugas/orang lain
    fallFromBedAgitated: true   // Gelisah ekstrem risiko jatuh dari kasur
  });

  const [alternativesTried, setAlternativesTried] = useState({
    verbalDeescalation: true,
    familyPresence: true,
    environmentalAdjustment: true,
    medicationReview: false
  });

  const [monitoringInterval, setMonitoringInterval] = useState('EVERY_15_MIN'); // 'EVERY_15_MIN' | 'EVERY_30_MIN' | 'EVERY_1_HOUR'
  const [pulseCapillaryRefillNormal, setPulseCapillaryRefillNormal] = useState(true);
  const [skinIntegrityIntact, setSkinIntegrityIntact] = useState(true);
  const [doctorOrderDurationHours, setDoctorOrderDurationHours] = useState(4); // Maksimal 4 jam untuk re-evaluasi

  const [doctorNotes, setDoctorNotes] = useState('Pengikatan fisik pergelangan tangan (wrist restraint) dipasang sementara karena pasien post-delirium berusaha mencabut infus. Re-evaluasi tiap 2 jam.');
  const [isSaving, setIsSaving] = useState(false);

  const toggleCheck = (setter, key) => {
    setter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'PHYSICIAN_ON_DUTY',
        moduleName: 'ASESMEN RESTRAINT & PEMBATASAN FISIK (COP.3.3)',
        data: {
          restraintType,
          justification,
          alternativesTried,
          monitoringInterval,
          pulseCapillaryRefillNormal,
          skinIntegrityIntact,
          doctorOrderDurationHours,
          doctorNotes,
          orderedAt: new Date().toISOString(),
          authorizedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert('Instruksi & Asesmen Penggunaan Restraint (JCI COP.3.3) Berhasil Disahkan DPJP.');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan formulir restraint: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-[10px] font-black tracking-widest uppercase border border-slate-300 dark:border-white/20 flex items-center gap-1">
                <Lock size={12} /> Standard JCI COP.3.3
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-[10px] font-black tracking-widest uppercase border border-red-200 dark:border-red-500/30">
                Patient Safety & Restraint Protocol
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              ASESMEN & MONITORING RESTRAINT (PEMBATASAN FISIK)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Terpilih</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-sm">
            <Lock size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* JCI Guidance Card */}
        <div className="p-6 rounded-[2rem] border bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-sm border-slate-200/60 dark:border-white/5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Prinsip Keselamatan Restraint (JCI COP.3.3)</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Restraint hanya boleh digunakan sebagai **pilihan terakhir (*last resort*)** setelah intervensi non-fisik gagal, bertujuan melindungi keselamatan pasien/staf dari bahaya langsung. Wajib dievaluasi ulang oleh dokter maksimal setiap **4 jam pada dewasa** atau **2 jam pada anak-anak**.
            </p>
          </div>
        </div>

        {/* 1. Jenis Restraint & Indikasi Klinis */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-6">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Lock size={16} className="text-slate-600" /> 1. Jenis Pembatasan & Justifikasi Indikasi Klinis
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'PHYSICAL_LIMB', label: 'Tangan/Kaki (Limb Restraint)', desc: 'Pengikat pergelangan lembut' },
              { id: 'BED_RAILS_4', label: 'Pengaman Kasur 4 Sisi', desc: 'Side rails terkunci penuh' },
              { id: 'VEST', label: 'Rompi / Vest Restraint', desc: 'Menahan tubuh di kursi' },
              { id: 'CHEMICAL', label: 'Restraint Kimiawi / Sedasi', desc: 'Medikasi sedatif terkontrol' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRestraintType(r.id)}
                className={`p-3.5 rounded-xl border text-left transition-all ${restraintType === r.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 shadow-md font-bold' : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}
              >
                <div className="text-xs">{r.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* Indikasi Bahaya */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Indikasi Klinis / Perilaku Bahaya:</span>
              {[
                { key: 'pullingTubes', label: 'Mencabut selang invasif vital (ETT, NGT, Kateter, Infus IV)' },
                { key: 'violenceSelfHarm', label: 'Mencederai diri sendiri atau memukul tempat tidur' },
                { key: 'aggressionStaff', label: 'Perilaku agresif / menyerang petugas kesehatan' },
                { key: 'fallFromBedAgitated', label: 'Gelisah hebat berisiko tinggi melompat/jatuh dari kasur' }
              ].map(ind => (
                <div 
                  key={ind.key}
                  onClick={() => toggleCheck(setJustification, ind.key)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer border border-slate-100 dark:border-white/5"
                >
                  <div className="text-slate-700 dark:text-slate-300">
                    {justification[ind.key] ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{ind.label}</span>
                </div>
              ))}
            </div>

            {/* Alternatif yang Sudah Dicoba */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Alternatif Non-Restraint yang Telah Dicoba:</span>
              {[
                { key: 'verbalDeescalation', label: 'Komunikasi verbal terapeutik & penenangan' },
                { key: 'familyPresence', label: 'Pendampingan keluarga di samping kasur' },
                { key: 'environmentalAdjustment', label: 'Pengaturan pencahayaan & suasana tenang' },
                { key: 'medicationReview', label: 'Penyesuaian medikasi penenang / anti-nyeri' }
              ].map(alt => (
                <div 
                  key={alt.key}
                  onClick={() => toggleCheck(setAlternativesTried, alt.key)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer border border-slate-100 dark:border-white/5"
                >
                  <div className="text-emerald-600">
                    {alternativesTried[alt.key] ? <CheckSquare size={16} /> : <Square size={16} />}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{alt.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* 2. Protokol Pemantauan Sirkulasi & Pelepasan Berkala */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Eye size={16} className="text-blue-500" /> 2. Protokol Pemantauan & Keselamatan Sirkulasi
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Frekuensi Observasi Perawat</span>
              <select 
                value={monitoringInterval} 
                onChange={e => setMonitoringInterval(e.target.value)}
                className="w-full mt-1 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="EVERY_15_MIN">Tiap 15 Menit (Gelisah Berat)</option>
                <option value="EVERY_30_MIN">Tiap 30 Menit (Sedang)</option>
                <option value="EVERY_1_HOUR">Tiap 1 Jam (Ringan/Tidur)</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Sirkulasi & Nadi Perifer</span>
                <span className="text-xs font-bold text-emerald-600">CRT &lt; 2s / Hangat</span>
              </div>
              <input 
                type="checkbox" 
                checked={pulseCapillaryRefillNormal} 
                onChange={e => setPulseCapillaryRefillNormal(e.target.checked)}
                className="h-5 w-5 rounded text-emerald-600"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Integritas Kulit & Pelepasan 2 Jam</span>
                <span className="text-xs font-bold text-blue-600">Kulit Utuh / Dilatih ROM</span>
              </div>
              <input 
                type="checkbox" 
                checked={skinIntegrityIntact} 
                onChange={e => setSkinIntegrityIntact(e.target.checked)}
                className="h-5 w-5 rounded text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-slate-700" /> 3. Instruksi Medis Dokter DPJP
          </h4>
          <textarea 
            rows="2"
            value={doctorNotes}
            onChange={e => setDoctorNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Instruksi Dokter Penanggung Jawab: <strong>{currentUser?.displayName || currentUser?.email || 'DOKTER JAGA'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Order Restraint (COP.3.3)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
