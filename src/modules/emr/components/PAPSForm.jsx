import React, { useState } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  AlertOctagon, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, 
  FileSignature, CheckSquare, Square, UserCheck, ShieldAlert, Sparkles
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function PAPSForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();

  const [signerName, setSignerName] = useState(patient?.name || 'Pasien / Wali');
  const [signerRelation, setSignerRelation] = useState('PASIEN_SENDIRI'); // 'PASIEN_SENDIRI' | 'SUAMI_ISTRI' | 'ORANG_TUA' | 'ANAK'
  const [refusalReason, setRefusalReason] = useState('Masalah Biaya / Keuangan');

  const [risksExplained, setRisksExplained] = useState({
    worseningCondition: true,    // Risiko perburukan klinis mendadak
    permanentDisability: true,   // Risiko kecacatan permanen
    deathRisk: true,             // Risiko kematian / fatal
    releasedHospitalLiability: true // Membebaskan rumah sakit dari tuntutan hukum
  });

  const [doctorExplanationNotes, setDoctorExplanationNotes] = useState(
    'Dokter telah menjelaskan risiko penghentian pengobatan rawat inap sebelum tuntas (risiko sepsis dan komplikasi akut). Pasien/Keluarga tetap bersikeras untuk pulang atas kehendak sendiri.'
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleCheck = (key) => {
    setRisksExplained(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'MEDICAL_LEGAL_STAFF',
        moduleName: 'SURAT PERNYATAAN PAPS (AGAINST MEDICAL ADVICE)',
        data: {
          signerName,
          signerRelation,
          refusalReason,
          risksExplained,
          doctorExplanationNotes,
          signedAt: new Date().toISOString(),
          witnessedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert('Surat Pernyataan Pulang Atas Permintaan Sendiri (PAPS / AMA) Berhasil Disimpan & Memiliki Kekuatan Hukum Rekam Medis (JCI PFR.5.4).');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan formulir PAPS: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-black tracking-widest uppercase border border-rose-200 dark:border-rose-500/30 flex items-center gap-1">
                <AlertOctagon size={12} /> Standard JCI PFR.5.4
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-[10px] font-black tracking-widest uppercase border border-red-200 dark:border-red-500/30">
                Against Medical Advice (AMA)
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              SURAT PERNYATAAN PULANG ATAS PERMINTAAN SENDIRI (PAPS)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Terkait</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 shadow-sm">
            <AlertOctagon size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Warning Legal Banner */}
        <div className="p-6 rounded-[2rem] border-2 border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 backdrop-blur-xl shadow-lg flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-rose-900 dark:text-rose-200 uppercase tracking-wide">Pemberitahuan Aspek Legalitas & Hak Pasien (JCI PFR.5.4)</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              Formulir ini merupakan bukti legal penolakan tindakan/rawat inap medis yang sah. Pasien/Keluarga menyatakan telah mendapat penjelasan lengkap mengenai konsekuensi klinis berbahaya dan bersedia menanggung seluruh risiko medis di luar tanggung jawab rumah sakit.
            </p>
          </div>
        </div>

        {/* 1. Identitas Yang Menyatakan */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <UserCheck size={16} className="text-rose-600" /> 1. Identitas Pembuat Pernyataan / Penanggung Jawab
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Lengkap Penandatangan</span>
              <input 
                type="text" 
                value={signerName} 
                onChange={e => setSignerName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hubungan dengan Pasien</span>
              <select 
                value={signerRelation} 
                onChange={e => setSignerRelation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="PASIEN_SENDIRI">Pasien Sendiri</option>
                <option value="SUAMI_ISTRI">Suami / Istri</option>
                <option value="ORANG_TUA">Orang Tua Kandung</option>
                <option value="ANAK">Anak Kandung</option>
                <option value="WALI_HUKUM">Wali Hukum yang Sah</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Alasan Penolakan Rawat Inap</span>
              <input 
                type="text" 
                value={refusalReason} 
                onChange={e => setRefusalReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200" 
              />
            </div>
          </div>
        </div>

        {/* 2. Checklist Pemahaman Risiko Medis */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-600" /> 2. Pernyataan Pemahaman Risiko Klinis & Pelepasan Tanggung Jawab
          </h4>

          <div className="space-y-2.5">
            {[
              { key: 'worseningCondition', label: 'Saya memahami sepenuhnya bahwa pulang sebelum waktu yang dianjurkan berisiko menimbulkan perburukan kondisi kesehatan secara mendadak.' },
              { key: 'permanentDisability', label: 'Saya memahami risiko terjadinya kecacatan fisik, kegagalan fungsi organ, atau komplikasi kronis yang sulit dipulihkan.' },
              { key: 'deathRisk', label: 'Saya memahami risiko paling fatal termasuk henti napas, henti jantung, dan kematian di luar fasilitas rumah sakit.' },
              { key: 'releasedHospitalLiability', label: 'Saya menyatakan dengan sadar melepaskan Rumah Sakit, Dokter DPJP, dan seluruh Tenaga Medis dari segala tuntutan hukum perdata maupun pidana di kemudian hari.' }
            ].map(item => (
              <div 
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-rose-50/50 dark:hover:bg-rose-500/10 cursor-pointer transition-all border border-slate-100 dark:border-white/5"
              >
                <div className="mt-0.5 text-rose-600">
                  {risksExplained[item.key] ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-rose-600" /> 3. Penjelasan DPJP & Tanda Tangan Digital Saksi Rumah Sakit
          </h4>
          <textarea 
            rows="2"
            value={doctorExplanationNotes}
            onChange={e => setDoctorExplanationNotes(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Saksi Tenaga Medis: <strong>{currentUser?.displayName || currentUser?.email || 'PETUGAS SAKSI'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Sahkan Surat PAPS (JCI PFR.5.4)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
