import React, { useState } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Stethoscope, FileText, ArrowRight, Save, ShieldAlert,
  Activity, User, Thermometer, CheckCircle2, RefreshCw, AlertCircle
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function InitialAssessment({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const isDewi = patient?.id === 'demo-patient-dewi' || patient?.mrn === '009944';

  const [form, setForm] = useState({
    riwayatSekarang: isDewi 
      ? 'Nyeri hebat perut kanan bawah mendadak sejak 6 jam lalu. Awalnya nyeri tumpul di sekitar ulu hati lalu berpindah ke perut kanan bawah. Mual (+), muntah 1x, nafsu makan menurun. Demam dirasakan sejak 4 jam lalu.' 
      : (encounter?.chief_complaint || ''),
    riwayatDahulu: isDewi ? 'Tidak ada riwayat operasi sebelumnya. Tidak ada riwayat DM / Hipertensi.' : '',
    riwayatKeluarga: isDewi ? 'Tidak ada riwayat penyakit bedah herediter dalam keluarga.' : '',
    alergi: patient?.allergies?.length > 0 ? patient.allergies.map(a => `${a.agent} (${a.reaction || 'Reaksi'})`).join(', ') : 'Tidak Ada',
    keadaanUmum: isDewi ? 'Tampak Menahan Nyeri (Sakit Sedang)' : 'Baik',
    kesadaran: 'Compos Mentis (GCS 15)',
    kepalaLeher: 'Dalam Batas Normal',
    thorax: 'Cor: S1-S2 reguler murni. Pulmo: Vesikuler +/+, Ronkhi -/-, Wheezing -/-',
    abdomen: isDewi 
      ? 'Nyeri tekan titik McBurney (+), Nyeri lepas (+), Rovsing Sign (+), Psoas Sign (+), Defans muskular ringan di regio RLQ. Bising usus menurun.' 
      : 'Dalam Batas Normal',
    ekstremitas: 'Akral hangat, CRT < 2 detik, tidak ada edema',
    diagnosisKerja: isDewi ? 'Acute Appendicitis (ICD-10: K35.8)' : '',
    rencanaTindakan: isDewi 
      ? '1. Pasang IVFD RL 20 tpm pada tangan kiri\n2. Puasakan pasien pre-op\n3. Order Ceftriaxone 1g IV (Skin test dulu), Ketorolac 30mg IV, Ondansetron 4mg IV\n4. Siapkan Informed Consent untuk Cito Laparoscopic Appendectomy pukul 14.00 WIB' 
      : ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'MEDICAL_STAFF',
        moduleName: 'PENGKAJIAN AWAL MEDIS (RJ)',
        data: form
      });
      alert('Pengkajian Awal berhasil disimpan ke Rekam Medis (AOP.1.1).');
      if (onSaveSuccess) onSaveSuccess();
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col p-6 bg-slate-50 dark:bg-slate-950">
      
      {/* ─── HEADER ─── */}
      <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] p-5 shadow-sm border border-slate-200/80 dark:border-white/10 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/20 transition-all border border-slate-200 dark:border-white/10 shadow-sm"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black tracking-widest uppercase border border-blue-200 dark:border-blue-500/30">
                Standard AOP.1.1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tracking-widest uppercase border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={11} /> Audit Ready
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              PENGKAJIAN AWAL MEDIS RAWAT JALAN / IGD
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Stethoscope size={22} />
          </div>
        </div>
      </div>

      {/* ─── BODY WORKSPACE ─── */}
      <div className="bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl rounded-[2rem] flex-1 overflow-y-auto custom-scrollbar shadow-sm border border-slate-200/80 dark:border-white/10 p-6 lg:p-8 space-y-8">
        
        {/* SECTION 1: ANAMNESIS */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <User size={16} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              1. Anamnesis (Riwayat Penyakit & Keluhan Utama)
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Riwayat Penyakit Sekarang (RPS) <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows="4"
                value={form.riwayatSekarang} 
                onChange={e => setForm({...form, riwayatSekarang: e.target.value})} 
                className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Riwayat Penyakit Dahulu (RPD)
              </label>
              <textarea 
                rows="4"
                value={form.riwayatDahulu} 
                onChange={e => setForm({...form, riwayatDahulu: e.target.value})} 
                className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Riwayat Penyakit Keluarga & Sosial
              </label>
              <input 
                type="text" 
                value={form.riwayatKeluarga} 
                onChange={e => setForm({...form, riwayatKeluarga: e.target.value})} 
                className="w-full p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <ShieldAlert size={14} /> Riwayat Alergi Obat & Makanan
              </label>
              <input 
                type="text" 
                value={form.alergi} 
                onChange={e => setForm({...form, alergi: e.target.value})} 
                className="w-full p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-300 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PEMERIKSAAN FISIK */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              2. Pemeriksaan Fisik Generalis & Status Lokalis
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Keadaan Umum</label>
              <select 
                value={form.keadaanUmum} 
                onChange={e => setForm({...form, keadaanUmum: e.target.value})} 
                className="w-full p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option>Baik</option>
                <option>Sedang</option>
                <option>Tampak Menahan Nyeri (Sakit Sedang)</option>
                <option>Tampak Sakit Berat</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Tingkat Kesadaran (GCS)</label>
              <select 
                value={form.kesadaran} 
                onChange={e => setForm({...form, kesadaran: e.target.value})} 
                className="w-full p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option>Compos Mentis (GCS 15)</option>
                <option>Apatis (GCS 13-14)</option>
                <option>Somnolen (GCS 10-12)</option>
                <option>Sopor (GCS 7-9)</option>
                <option>Koma (GCS 3-6)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Kepala & Leher</label>
              <input 
                type="text" 
                value={form.kepalaLeher} 
                onChange={e => setForm({...form, kepalaLeher: e.target.value})} 
                className="w-full p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Thorax / Jantung-Paru</label>
              <input 
                type="text" 
                value={form.thorax} 
                onChange={e => setForm({...form, thorax: e.target.value})} 
                className="w-full p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Abdomen / Perut</label>
              <input 
                type="text" 
                value={form.abdomen} 
                onChange={e => setForm({...form, abdomen: e.target.value})} 
                className="w-full p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Ekstremitas</label>
              <input 
                type="text" 
                value={form.ekstremitas} 
                onChange={e => setForm({...form, ekstremitas: e.target.value})} 
                className="w-full p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: DIAGNOSIS & PLAN */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <FileText size={16} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              3. Diagnosis Klinis (ICD-10) & Rencana Tata Laksana
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Diagnosis Kerja & Banding (ICD-10) <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows="2"
                value={form.diagnosisKerja} 
                onChange={e => setForm({...form, diagnosisKerja: e.target.value})} 
                className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Rencana Tindakan Medis, Terapi Farmakologi & Edukasi <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows="4"
                value={form.rencanaTindakan} 
                onChange={e => setForm({...form, rencanaTindakan: e.target.value})} 
                className="w-full p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
              />
            </div>
          </div>
        </div>

      </div>

      {/* ─── FOOTER BAR ─── */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/90 dark:bg-[var(--surface-container-low)]/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm shrink-0">
        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">JCI AOP.1.1 Terpenuhi</span>
            <span className="text-[11px] text-slate-400">Pengkajian awal tersimpan permanen pada rekam medis elektronik.</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            Batal
          </button>
          
          <button 
            type="button"
            disabled={isSaving || !form.diagnosisKerja || !form.rencanaTindakan}
            onClick={handleSave}
            className="px-8 py-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>SIMPAN PENGKAJIAN AWAL</span>
          </button>
        </div>
      </div>

    </div>
  );
}
