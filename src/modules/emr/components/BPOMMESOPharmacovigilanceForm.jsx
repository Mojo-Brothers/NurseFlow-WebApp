import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { 
  Pill, ArrowRight, ShieldCheck, AlertTriangle, FileSignature, 
  Sparkles, CheckCircle2, ShieldAlert, AlertOctagon, HelpCircle
} from 'lucide-react';
import { saveClinicalRecord } from '../services/emr.service.js';

export default function BPOMMESOPharmacovigilanceForm({ patient, encounter, onClose, onSaveSuccess }) {
  const { currentUser } = useAuth();

  // Data Obat yang Dicurigai (Suspected Drug)
  const [suspectedDrugName, setSuspectedDrugName] = useState('Injeksi Ceftriaxone 1g');
  const [suspectedDrugBatch, setSuspectedDrugBatch] = useState('BCH-2026-0881');
  const [suspectedDrugManufacturer, setSuspectedDrugManufacturer] = useState('PT Kimia Farma Tbk');
  const [drugDoseRoute, setDrugDoseRoute] = useState('1g IV q12h');
  const [drugIndication, setDrugIndication] = useState('Profilaksis Pra-Bedah Laparotomi');

  // Reaksi Efek Samping (Adverse Event)
  const [reactionDescription, setReactionDescription] = useState('Eritema difus mendadak, urtikaria menyeluruh, dispnea ringan, dan penurunan tekanan darah (anafilaktoid).');
  const [reactionOnsetDate, setReactionOnsetDate] = useState('2026-08-04T00:05');
  const [reactionSeriousness, setReactionSeriousness] = useState('LIFE_THREATENING'); // 'LIFE_THREATENING' | 'HOSPITALIZATION' | 'DISABILITY' | 'CONGENITAL' | 'OTHER_CLINICAL'
  const [reactionOutcome, setReactionOutcome] = useState('RECOVERED'); // 'RECOVERED' | 'RECOVERING' | 'NOT_RECOVERED' | 'FATAL' | 'UNKNOWN'

  // Algoritma Naranjo Kausalitas Efek Samping Obat (WHO Standard)
  const [naranjoAnswers, setNaranjoAnswers] = useState({
    q1_previousConclusion: 1, // Apakah ada laporan konklusif sebelumnya? (+1)
    q2_afterAdmin: 2,         // Apakah reaksi muncul setelah pemberian obat? (+2)
    q3_improvedOnStop: 1,     // Apakah membaik saat obat dihentikan (dechallenge)? (+1)
    q4_reappearOnRechallenge: 0, // Apakah muncul kembali saat obat diberikan ulang (rechallenge)? (0)
    q5_alternativeCauses: -1, // Apakah ada penyebab alternatif lain selain obat? (-1 jika ada, +2 jika tidak ada)
    q6_placeboResponse: 0,    // Apakah reaksi muncul dengan plasebo? (0)
    q7_toxicConcentration: 0, // Apakah terdeteksi kadar toksik dalam darah? (0)
    q8_doseReactionRelation: 0, // Apakah reaksi lebih berat saat dosis dinaikkan? (0)
    q9_similarReactionBefore: 0, // Apakah pasien pernah mengalami reaksi serupa thd obat sejenis? (0)
    q10_objectiveConfirmation: 1 // Apakah reaksi dikonfirmasi oleh bukti objektif (lab/vital)? (+1)
  });

  const [pharmacistActionTaken, setPharmacistActionTaken] = useState(
    'Obat segera dihentikan (dechallenge), injeksi Dexamethasone 5mg IV & Diphenhydramine 50mg IV diberikan. Gejala mereda dalam 30 menit. Label Rekam Medis diperbarui: ALERGI SEFALOSPORIN.'
  );
  const [isSaving, setIsSaving] = useState(false);

  // Kalkulasi Skor Kausalitas Naranjo
  const naranjoScore = useMemo(() => {
    return Object.values(naranjoAnswers).reduce((acc, val) => acc + val, 0);
  }, [naranjoAnswers]);

  const naranjoCategory = useMemo(() => {
    if (naranjoScore >= 9) return { label: 'DEFINITE (SANGAT PASTI)', color: 'rose', desc: 'Reaksi hampir pasti diinduksi oleh obat yang dicurigai.' };
    if (naranjoScore >= 5) return { label: 'PROBABLE (KEMUNGKINAN BESAR)', color: 'amber', desc: 'Sangat mungkin disebabkan oleh obat, hubungan temporal kuat.' };
    if (naranjoScore >= 1) return { label: 'POSSIBLE (MUNGKIN)', color: 'blue', desc: 'Mungkin disebabkan obat, namun ada kemungkinan etiologi lain.' };
    return { label: 'DOUBTFUL (RAGU-RAGU)', color: 'slate', desc: 'Hubungan sebab-akibat dengan obat tidak jelas.' };
  }, [naranjoScore]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveClinicalRecord({
        patientId: patient?.id || 'demo-patient-dewi',
        encounterId: encounter?.id || 'ENC-DEMO-MOCK',
        author: currentUser?.displayName || currentUser?.email || 'FARMASIS_KLINIS',
        moduleName: 'PELAPORAN EFEK SAMPING OBAT (MESO BPOM & WHO-UMC)',
        data: {
          suspectedDrug: {
            name: suspectedDrugName,
            batch: suspectedDrugBatch,
            manufacturer: suspectedDrugManufacturer,
            doseRoute: drugDoseRoute,
            indication: drugIndication
          },
          adverseEvent: {
            description: reactionDescription,
            onsetDate: reactionOnsetDate,
            seriousness: reactionSeriousness,
            outcome: reactionOutcome
          },
          naranjoAssessment: {
            score: naranjoScore,
            category: naranjoCategory.label,
            details: naranjoAnswers
          },
          actionTaken: pharmacistActionTaken,
          reportedAt: new Date().toISOString(),
          reportedBy: currentUser?.displayName || currentUser?.email
        }
      });
      alert(`Laporan MESO BPOM & WHO Pharmacovigilance [Skor Naranjo: ${naranjoScore} - ${naranjoCategory.label}] Berhasil Disimpan & Diteruskan ke Farmasi Rumah Sakit.`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      alert('Gagal menyimpan formulir MESO: ' + err.message);
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
            className="w-10 h-10 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 transition-all border border-slate-200 dark:border-white/10"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black tracking-widest uppercase border border-amber-200 dark:border-amber-500/30 flex items-center gap-1">
                <Pill size={12} /> Standard BPOM RI & WHO-UMC
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 text-[10px] font-black tracking-widest uppercase border border-yellow-300 dark:border-yellow-500/30">
                Formulir Kuning MESO (Pharmacovigilance)
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              PELAPORAN EFEK SAMPING OBAT (MESO / ADR REPORTING)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold uppercase text-slate-500">Pasien Terkait</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{patient?.name || 'Pasien'} ({patient?.mrn || '000000'})</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm">
            <AlertOctagon size={24} />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Naranjo Live Result Banner */}
        <div className="p-6 rounded-[2rem] border-2 border-amber-500 bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <span className="text-2xl font-black">{naranjoScore}</span>
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Kausalitas Naranjo Probability Scale (WHO)</span>
              <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{naranjoCategory.label}</h4>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{naranjoCategory.desc}</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black tracking-wider uppercase text-center">
            STATUS: MESO FLAGGED
          </div>
        </div>

        {/* 1. Data Obat yang Dicurigai */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Pill size={16} className="text-amber-500" /> 1. Data Obat yang Dicurigai (Suspected Medication)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nama Dagang & Bentuk Sediaan</span>
              <input 
                type="text" 
                value={suspectedDrugName} 
                onChange={e => setSuspectedDrugName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nomor Batch / Lot Produksi</span>
              <input 
                type="text" 
                value={suspectedDrugBatch} 
                onChange={e => setSuspectedDrugBatch(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pabrik Farmasi / Industri</span>
              <input 
                type="text" 
                value={suspectedDrugManufacturer} 
                onChange={e => setSuspectedDrugManufacturer(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dosis & Rute Pemberian</span>
              <input 
                type="text" 
                value={drugDoseRoute} 
                onChange={e => setDrugDoseRoute(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold" 
              />
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Indikasi Penggunaan Obat</span>
              <input 
                type="text" 
                value={drugIndication} 
                onChange={e => setDrugIndication(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold" 
              />
            </div>
          </div>
        </div>

        {/* 2. Deskripsi Reaksi & Tingkat Keseriusan */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" /> 2. Manifestasi Klinis Reaksi & Keseriusan (BPOM Standard)
          </h4>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Deskripsi Manifestasi Efek Samping</span>
            <textarea 
              rows="2"
              value={reactionDescription}
              onChange={e => setReactionDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Waktu Onset Reaksi</span>
              <input 
                type="datetime-local" 
                value={reactionOnsetDate} 
                onChange={e => setReactionOnsetDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Keseriusan Efek Samping</span>
              <select 
                value={reactionSeriousness} 
                onChange={e => setReactionSeriousness(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              >
                <option value="LIFE_THREATENING">Mengancam Jiwa (Life-Threatening)</option>
                <option value="HOSPITALIZATION">Memerlukan Rawat Inap / Perpanjangan</option>
                <option value="DISABILITY">Menyebabkan Kecacatan Permanen</option>
                <option value="OTHER_CLINICAL">Signifikan Klinis Lainnya</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hasil Akhir (Outcome)</span>
              <select 
                value={reactionOutcome} 
                onChange={e => setReactionOutcome(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold"
              >
                <option value="RECOVERED">Sembuh Sempurna (Recovered)</option>
                <option value="RECOVERING">Dalam Proses Pemulihan</option>
                <option value="NOT_RECOVERED">Belum Sembuh / Ada Gejala Sisa</option>
                <option value="FATAL">Meninggal Dunia (Fatal)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer & Signature */}
        <div className="bg-white/80 dark:bg-[var(--surface-container-low)]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-slate-200/50 dark:border-white/5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <FileSignature size={16} className="text-amber-600" /> 3. Tindakan Farmasi Klinis & Pelaporan BPOM
          </h4>
          <textarea 
            rows="2"
            value={pharmacistActionTaken}
            onChange={e => setPharmacistActionTaken(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Apoteker / Tenaga Medis Pelapor: <strong>{currentUser?.displayName || currentUser?.email || 'FARMASIS KLINIS'}</strong></span>
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
                className="px-8 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 shadow-md flex items-center gap-2 transition-all"
              >
                <FileSignature size={16} />
                {isSaving ? 'Menyimpan...' : 'Simpan Laporan MESO (BPOM-WHO)'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
