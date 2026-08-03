import React, { useState } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { LogOut, ArrowRight, Info, CheckCircle2, AlertTriangle, ScrollText, Network } from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function TransferInternalForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';

  const [form, setForm] = useState({
    tujuan: isDewi ? 'Kamar Operasi (OK Sentral)' : '',
    situation: isDewi ? 'Ny. Dewi Sartika (38 th), GCS 15, Post-Konsul Poli Bedah dengan Appendisitis Akut, dijadwalkan Cito Laparoscopic Appendectomy.' : '',
    background: isDewi ? 'Nyeri perut kanan bawah sejak 6 jam lalu. Alergi Amoxicillin (Severe - Angioedema). Telah terpasang IVFD RL 20 tpm pada tangan kiri.' : '',
    assessment: isDewi ? 'TTV Terakhir: TD 125/82 mmHg, N 92x/m, S 37.8°C, RR 20x/m. Skala Nyeri 6/10. Puasa sejak pukul 08.00 WIB. Hasil Lab Leukosit 15.400 & USG Appendisitis Akut terlampir di EMR.' : '',
    recommendation: isDewi ? 'Lanjutkan puasa pre-op, siapkan laparoscopic tower di OK Sentral, lakukan skin test antibiotik profilaksis non-penicillin di ruang persiapan OK.' : ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.tujuan || !form.situation || !form.recommendation) return;
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'PAT-DEMO',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
        moduleName: 'TRANSFER INTERNAL (SBAR)',
        data: form
      });
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal memproses Transfer Internal: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-orange-50 hover:text-orange-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-[9px] font-black tracking-widest uppercase border border-orange-200 dark:border-orange-500/30">
                Standard ACC.3
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30">
                SBAR Method
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">TRANSFER INTERNAL PASIEN</h3>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-100 dark:border-orange-500/20">
           <LogOut size={20} />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] flex-1 relative overflow-y-auto custom-scrollbar shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/50 dark:border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none transform -rotate-12">
          <Network size={400} />
        </div>
        
        <div className="relative z-10 p-8 lg:p-12">
          <div className="max-w-4xl mx-auto space-y-8">
             
             {/* Minimalist Header Guide */}
             <div className="flex items-start gap-4 pb-6 border-b border-slate-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                   <Info size={20} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">Metode Komunikasi SBAR</h4>
                   <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
                      Standar JCI mewajibkan proses serah terima (handover) pasien antar unit menggunakan metode <span className="font-bold text-slate-700 dark:text-slate-300">Situation, Background, Assessment, Recommendation</span> guna menghindari kesalahan informasi medis.
                   </p>
                </div>
             </div>

             <section className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Unit Tujuan Transfer *</label>
                   <select 
                      value={form.tujuan} 
                      onChange={e => setField('tujuan', e.target.value)} 
                      className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 cursor-pointer transition-all"
                   >
                      <option value="">-- Pilih Unit / Bangsal --</option>
                      <option>Rawat Inap (IGD ke Bangsal)</option>
                      <option>ICU / PICU / NICU</option>
                      <option>Kamar Operasi (OK)</option>
                      <option>Ruang Pemulihan (RR)</option>
                      <option>Radiologi / Penunjang</option>
                   </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Situation (Situasi) *</label>
                      <textarea 
                         rows="4"
                         value={form.situation} 
                         onChange={e => setField('situation', e.target.value)} 
                         placeholder="Kondisi pasien saat ini, masalah utama, diagnosis..."
                         className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Background (Latar Belakang)</label>
                      <textarea 
                         rows="4"
                         value={form.background} 
                         onChange={e => setField('background', e.target.value)} 
                         placeholder="Riwayat penyakit, alergi, tindakan yang sudah dilakukan..."
                         className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Assessment (Pengkajian)</label>
                      <textarea 
                         rows="4"
                         value={form.assessment} 
                         onChange={e => setField('assessment', e.target.value)} 
                         placeholder="Tanda vital terakhir, hasil lab penting, tingkat kesadaran..."
                         className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Recommendation (Rekomendasi) *</label>
                      <textarea 
                         rows="4"
                         value={form.recommendation} 
                         onChange={e => setField('recommendation', e.target.value)} 
                         placeholder="Tindakan selanjutnya yang harus dilakukan unit penerima..."
                         className="w-full bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-none transition-all placeholder:text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                      />
                   </div>
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
          disabled={isSaving || !form.tujuan || !form.situation || !form.recommendation}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:active:scale-100 group"
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ScrollText size={16} className="group-hover:scale-110 transition-transform" />}
          Otentikasi SBAR
        </button>
      </div>
    </div>
  );
}
