import React, { useState } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { BookOpen, ShieldAlert, Info, ArrowRight, UserCheck, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

const EDUCATION_TOPICS = [
  { id: 'MED_SAFETY', label: 'Penggunaan Obat yang Aman', category: 'Medikasi' },
  { id: 'WOUND_CARE', label: 'Perawatan Luka & Kebersihan', category: 'Pasca-Tindakan' },
  { id: 'DIETARY', label: 'Pantangan Makanan / Diet', category: 'Nutrisi' },
  { id: 'PAIN_MGMT', label: 'Manajemen Nyeri', category: 'Pemulihan' },
  { id: 'FALL_PREV', label: 'Pencegahan Jatuh di Rumah', category: 'Keselamatan' },
  { id: 'FOLLOW_UP', label: 'Jadwal Kontrol & Kegawatdaruratan', category: 'Umum' }
];

export default function PatientEducationForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';

  const [form, setForm] = useState({
    topik: isDewi ? 'Pasca-Tindakan - Perawatan Luka & Kebersihan' : '',
    metode: 'Lisan & Demonstrasi',
    penerima: isDewi ? 'Pasien & Suami' : 'Pasien',
    pemahaman: 'Paham & Dapat Mengulang',
    catatan: isDewi ? 'Pasien dan suami telah memahami pentingnya puasa 6 jam sebelum operasi cito appendectomy serta tahapan mobilisasi bertahap pasca laparoskopi.' : ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.topik || !form.pemahaman) return;
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'PAT-DEMO',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
        moduleName: 'EDUKASI PASIEN',
        data: form
      });
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan edukasi: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col p-6 bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[9px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                Standard PFE.1
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30">
                Audit Ready
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">EDUKASI PASIEN & KELUARGA</h3>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-500/20">
           <BookOpen size={20} />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] flex-1 relative overflow-y-auto custom-scrollbar shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform -rotate-12">
          <BookOpen size={400} />
        </div>
        
        <div className="relative z-10 p-8 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-8">
             
             {/* Minimalist Header Guide */}
             <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                   <Info size={20} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">Audit Trail Active (Standard PFE.1)</h4>
                   <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
                      Dokumen edukasi ini akan ditandatangani secara digital atas nama <span className="font-bold text-slate-700 dark:text-slate-300">{currentUser?.displayName || currentUser?.email}</span>. Wajib melakukan verifikasi pemahaman pasien.
                   </p>
                </div>
             </div>

             <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Topik Edukasi *</label>
                      <select 
                         value={form.topik} 
                         onChange={e => setField('topik', e.target.value)} 
                         className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
                      >
                         <option value="">-- Pilih Topik Utama --</option>
                         {EDUCATION_TOPICS.map(t => (
                           <option key={t.id} value={t.label}>{t.category} - {t.label}</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Metode Edukasi</label>
                      <select 
                         value={form.metode} 
                         onChange={e => setField('metode', e.target.value)} 
                         className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer transition-all"
                      >
                         <option>Lisan & Demonstrasi</option>
                         <option>Brosur / Leaflet Tertulis</option>
                         <option>Video / Multimedia</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Penerima Edukasi</label>
                      <div className="flex bg-slate-50/70 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                         {['Pasien', 'Keluarga / Pendamping', 'Keduanya'].map(opt => (
                            <button
                               key={opt}
                               onClick={() => setField('penerima', opt)}
                               className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${form.penerima === opt ? 'bg-white text-blue-600 shadow-sm border border-slate-200 dark:border-white/10 dark:bg-blue-600 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                            >
                               {opt}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Evaluasi Pemahaman *</label>
                      <div className="flex bg-slate-50/70 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                         {['Paham & Dapat Mengulang', 'Perlu Re-Edukasi'].map(opt => (
                            <button
                               key={opt}
                               onClick={() => setField('pemahaman', opt)}
                               className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${form.pemahaman === opt ? (opt === 'Paham & Dapat Mengulang' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm') : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                            >
                               {opt === 'Paham & Dapat Mengulang' ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>}
                               {opt}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="space-y-2 pt-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Catatan Tambahan (Opsional)</label>
                   <textarea 
                      rows="4"
                      value={form.catatan} 
                      onChange={e => setField('catatan', e.target.value)} 
                      placeholder="Detail respon pasien, hambatan edukasi (misal: bahasa, pendengaran)..."
                      className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                   />
                </div>
             </section>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-row justify-end items-center gap-4 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm shrink-0">
        <button 
          onClick={onClose}
          disabled={isSaving}
          className="bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
        >
          Batal
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving || !form.topik || !form.pemahaman}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:active:scale-100 group"
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />}
          Finalisasi Edukasi
        </button>
      </div>
    </div>
  );
}
