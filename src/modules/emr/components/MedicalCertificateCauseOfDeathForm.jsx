import React, { useState } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  FileText, ArrowRight, ShieldCheck, AlertTriangle, FileSignature, 
  Sparkles, Clock, Calendar, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function MedicalCertificateCauseOfDeathForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();

  // Data Demografis & Kematian
  const [deceasedName, setDeceasedName] = useState(patient?.name || 'Tn. Ahmad Fauzi');
  const [deceasedNik, setDeceasedNik] = useState(patient?.nik || '3201234567890001');
  const [deceasedMrn, setDeceasedMrn] = useState(patient?.mrn || '009944');
  const [timeOfDeath, setTimeOfDeath] = useState('2026-08-04T00:10');
  const [placeOfDeath, setPlaceOfDeath] = useState('ICU Bed 03 - RS Pusat');

  // Bagian I: Rantai Sebab Kematian Medis (WHO International Format)
  // (a) Sebab Langsung (Immediate Cause)
  const [causeA, setCauseA] = useState('Syok Septik Refrakter (Refractory Septic Shock)');
  const [intervalA, setIntervalA] = useState('6 Jam');
  const [icdA, setIcdA] = useState('R57.2');

  // (b) Sebab Antara (Antecedent Cause due to)
  const [causeB, setCauseB] = useState('Pneumonia Berat Komunitas (Severe CAP)');
  const [intervalB, setIntervalB] = useState('3 Hari');
  const [icdB, setIcdB] = useState('J18.9');

  // (c) Sebab Dasar / Underlying Cause of Death
  const [causeC, setCauseC] = useState('Diabetes Mellitus Tipe 2 Tidak Terkontrol');
  const [intervalC, setIntervalC] = useState('5 Tahun');
  const [icdC, setIcdC] = useState('E11.9');

  // Bagian II: Kondisi Komorbiditas Lain yang Berkontribusi
  const [contributingConditions, setContributingConditions] = useState('Gagal Ginjal Kronik Stadium 4 (CKD Stage IV)');
  const [icdPart2, setIcdPart2] = useState('N18.4');

  // Informasi Tambahan Standar Kemenkes RI
  const [maternalDeathRelated, setMaternalDeathRelated] = useState('TIDAK'); // 'TIDAK' | 'HAMIL' | 'PERSALINAN' | 'NIFAS_42_HARI'
  const [mannerOfDeath, setMannerOfDeath] = useState('PENYAKIT_ALAMI'); // 'PENYAKIT_ALAMI' | 'KECELAKAAN' | 'BUNUH_DIRI' | 'TINDAK_KEKERASAN' | 'BELUM_JELAS'
  const [autopsyPerformed, setAutopsyPerformed] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'DPJP_EXAMINER',
        moduleName: 'SERTIFIKAT MEDIS PENYEBAB KEMATIAN (SMPK KEMENKES-WHO)',
        data: {
          deceasedInfo: {
            name: deceasedName,
            nik: deceasedNik,
            mrn: deceasedMrn,
            timeOfDeath,
            placeOfDeath
          },
          causeOfDeathPart1: {
            causeA: { description: causeA, interval: intervalA, icd: icdA },
            causeB: { description: causeB, interval: intervalB, icd: icdB },
            causeC: { description: causeC, interval: intervalC, icd: icdC }
          },
          causeOfDeathPart2: {
            description: contributingConditions,
            icd: icdPart2
          },
          kemenkesFields: {
            maternalDeathRelated,
            mannerOfDeath,
            autopsyPerformed
          },
          issuedAt: new Date().toISOString(),
          certifiedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert('Sertifikat Medis Penyebab Kematian (SMPK Kemenkes & WHO ICD) Berhasil Diterbitkan & Terarsip Legal.');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menerbitkan sertifikat kematian: ' + err.message);
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
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-100 text-[10px] font-black tracking-widest uppercase border border-slate-700 flex items-center gap-1">
                <FileText size={12} /> Standard WHO ICD-10/11 & Kemenkes RI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-[10px] font-black tracking-widest uppercase border border-slate-300 dark:border-white/20">
                Sertifikat Medis Penyebab Kematian (SMPK)
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              SERTIFIKAT MEDIS PENYEBAB KEMATIAN (SMPK / CAUSE OF DEATH)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Terkait</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{deceasedName} ({deceasedMrn})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Info Banner */}
        <div className="p-5 rounded-[2rem] border bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-sm border-slate-200/60 dark:border-white/5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Format Baku Medis Internasional WHO</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Formulir ini memisahkan **Sebab Langsung (a)**, **Sebab Antara (b)**, dan **Sebab Dasar Kematian / Underlying Cause (c)** sesuai aturan *WHO Mortality Coding Rules*. Jangan menuliskan cara kematian seperti &quot;Henti Jantung&quot; atau &quot;Gagal Napas&quot; sebagai sebab dasar.
            </p>
          </div>
        </div>

        {/* 1. Data Jenazah & Waktu Kematian */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Calendar size={16} className="text-slate-700" /> 1. Data Demografis & Waktu Meninggal Dunia
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Lengkap Jenazah</span>
              <input 
                type="text" 
                value={deceasedName} 
                onChange={e => setDeceasedName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIK (KTP)</span>
              <input 
                type="text" 
                value={deceasedNik} 
                onChange={e => setDeceasedNik(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Waktu Kematian</span>
              <input 
                type="datetime-local" 
                value={timeOfDeath} 
                onChange={e => setTimeOfDeath(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tempat Kematian</span>
              <input 
                type="text" 
                value={placeOfDeath} 
                onChange={e => setPlaceOfDeath(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200" 
              />
            </div>
          </div>
        </div>

        {/* 2. Bagian I: Rantai Sebab Kematian (WHO Part I) */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileText size={16} className="text-rose-600" /> 2. Bagian I: Rangkaian Penyakit Penyebab Kematian (WHO ICD Format)
          </h4>

          <div className="space-y-3">
            {/* Penyebab Langsung (a) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6">
                <span className="text-[10px] font-bold text-rose-600 uppercase block">a. Penyebab Langsung (Immediate Cause)</span>
                <input 
                  type="text" 
                  value={causeA} 
                  onChange={e => setCauseA(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Perkiraan Onset - Kematian</span>
                <input 
                  type="text" 
                  value={intervalA} 
                  onChange={e => setIntervalA(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Kode ICD-10 / 11</span>
                <input 
                  type="text" 
                  value={icdA} 
                  onChange={e => setIcdA(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
            </div>

            {/* Penyebab Antara (b) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase block">b. Akibat dari / Konsekuensi dari (Due to)</span>
                <input 
                  type="text" 
                  value={causeB} 
                  onChange={e => setCauseB(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Perkiraan Onset - Kematian</span>
                <input 
                  type="text" 
                  value={intervalB} 
                  onChange={e => setIntervalB(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Kode ICD-10 / 11</span>
                <input 
                  type="text" 
                  value={icdB} 
                  onChange={e => setIcdB(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
            </div>

            {/* Sebab Dasar (c) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6">
                <span className="text-[10px] font-bold text-indigo-600 uppercase block">c. Penyebab Dasar / Pokok (Underlying Cause of Death)</span>
                <input 
                  type="text" 
                  value={causeC} 
                  onChange={e => setCauseC(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Perkiraan Onset - Kematian</span>
                <input 
                  type="text" 
                  value={intervalC} 
                  onChange={e => setIntervalC(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
              <div className="md:col-span-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Kode ICD-10 / 11</span>
                <input 
                  type="text" 
                  value={icdC} 
                  onChange={e => setIcdC(e.target.value)}
                  className="w-full mt-1 p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bagian II & Kategori Kemenkes */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <ShieldCheck size={16} className="text-slate-700" /> 3. Kondisi Komorbiditas & Klasifikasi Kematian (Kemenkes)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bagian II: Kondisi Signifikan Lain yang Berkontribusi</span>
              <input 
                type="text" 
                value={contributingConditions} 
                onChange={e => setContributingConditions(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jenis Kematian (Manner of Death)</span>
              <select 
                value={mannerOfDeath} 
                onChange={e => setMannerOfDeath(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              >
                <option value="PENYAKIT_ALAMI">Penyakit Alami / Natural Disease</option>
                <option value="KECELAKAAN">Kecelakaan / Accident</option>
                <option value="BUNUH_DIRI">Bunuh Diri / Suicide</option>
                <option value="TINDAK_KEKERASAN">Tindak Kekerasan / Homicide</option>
                <option value="BELUM_JELAS">Belum Dapat Ditentukan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Dokter yang Memeriksa & Mengesahkan: <strong>{currentUser?.displayName || currentUser?.email || 'DOKTER DPJP'}</strong></span>
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
              className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-md flex items-center gap-2 transition-all"
            >
              <FileSignature size={16} />
              {isSaving ? 'Menyimpan...' : 'Terbitkan Sertifikat Kematian SMPK'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
