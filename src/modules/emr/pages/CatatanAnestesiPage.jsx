import React, { useState, useMemo } from 'react';
import { 
  Scissors, Stethoscope, HeartPulse, Activity, CheckCircle2, 
  Clock, ShieldAlert, ArrowLeft, Save, Printer, User, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../patient/patient.store.js';
import toast from 'react-hot-toast';

export default function CatatanAnestesiPage() {
  const navigate = useNavigate();
  const { patients, selectedPatientId } = usePatientStore();
  const [activeStage, setActiveStage] = useState('PRE_ANESTHESIA'); // 'PRE_ANESTHESIA' | 'INTRA_OP' | 'PACU_RECOVERY'

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId || p.mrn === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Pra-Anestesi Form State
  const [preAnesthesia, setPreAnesthesia] = useState({
    asaClass: 'ASA_II', // ASA_I | ASA_II | ASA_III | ASA_IV | ASA_V | ASA_VI | ASA_E
    mallampatiScore: 'CLASS_2',
    fastingSolidHours: 8,
    fastingLiquidHours: 2,
    allergyNotes: 'Tidak ada riwayat alergi obat bius',
    airwayAssessment: 'Gigi goyang nihil, buka mulut >3 jari, jarak tiromental >6 cm. Leher mobile.',
    plannedTechnique: 'GENERAL_ANESTHESIA', // GA | REGIONAL_SPINAL | REGIONAL_EPIDURAL | SEDATION
    anesthesiologistName: 'dr. Hendra Wicaksono, Sp.An-KIC',
    premedication: 'Ondansetron 4mg IV, Midazolam 2mg IV'
  });

  // Intra-Operasi Form State
  const [intraOp, setIntraOp] = useState({
    inductionAgent: 'Propofol 140 mg + Fentanyl 100 mcg',
    muscleRelaxant: 'Rocuronium 50 mg IV',
    maintenanceGas: 'Sevoflurane 2.0 vol% + O2/Air 50:50',
    airwayType: 'ETT No. 7.5 Cuffed Oral, Kedalaman 21 cm',
    ivFluids: 'Asering 1000 ml',
    ebl: '150 ml (Perdarahan minimal)',
    urineOutput: '250 ml (Jernih)',
    intraOpNotes: 'Hemodinamik stabil selama pembedahan. Tidak ada aritmia atau desaturasi.'
  });

  // PACU Aldrete Recovery Form State
  const [aldrete, setAldrete] = useState({
    activity: 2,     // 2: Bergerak 4 ekstremitas, 1: 2 ekstremitas, 0: Diam
    respiration: 2,  // 2: Bernapas dalam/batuk, 1: Dangkal/sesak, 0: Apnea
    circulation: 2,  // 2: TD +/- 20% awal, 1: +/- 20-50%, 0: +/- >50%
    consciousness: 2,// 2: Sadar penuh, 1: Bangun jika dipanggil, 0: Tidak respon
    oxygenation: 2,  // 2: SpO2 >92% room air, 1: Perlu O2 suplemen, 0: SpO2 <90%
    bromageScore: 0, // 0: Gerak penuh, 1: Tekuk lutut, 2: Gerak jari, 3: Lumpuh
    pacuDischargeDecision: 'TRANSFER_TO_WARD' // TRANSFER_TO_WARD | ICU_STEP_UP | STAY_PACU
  });

  const aldreteTotalScore = aldrete.activity + aldrete.respiration + aldrete.circulation + aldrete.consciousness + aldrete.oxygenation;

  const handleSaveDraft = () => {
    toast.success('Draf Catatan Anestesi tersimpan.');
  };

  const handleSignOff = () => {
    if (aldreteTotalScore < 8 && aldrete.pacuDischargeDecision === 'TRANSFER_TO_WARD') {
      toast.error('Skor Aldrete minimal 8 untuk dapat dipindahkan ke bangsal!');
      return;
    }
    toast.success('Berkas Rekam Anestesi Perioperatif berhasil ditandatangani oleh dr. Sp.An!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/emr-ri')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Kembali ke EMR Rawat Inap"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/30">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Catatan Anestesi & Sedasi Perioperatif
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-black uppercase">
                JCI ASC.3 & ASC.7.4
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dokumentasi Pra-Anestesi (ASA), Monitoring Intra-Bedah, dan Pemulihan PACU (Aldrete Score)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Berkas Anestesi</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draf</span>
          </button>
          <button
            type="button"
            onClick={handleSignOff}
            className="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Sign-off Dokter Anestesi</span>
          </button>
        </div>
      </div>

      {/* Patient Header Ribbon */}
      {activePatient && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-900 border border-purple-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
              {activePatient.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white">{activePatient.name}</span>
                <span className="font-mono text-slate-500 font-bold">({activePatient.mrn || activePatient.id})</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Tindakan Operasi: <strong className="text-slate-800 dark:text-slate-200">Laparotomi Eksplorasi Cito</strong> • Dokter Anestesi: <strong className="text-purple-600">{preAnesthesia.anesthesiologistName}</strong>
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-mono text-[10px] font-black uppercase">
            STATUS: PERIOPERATIVE PHASE
          </span>
        </div>
      )}

      {/* 3 Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveStage('PRE_ANESTHESIA')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeStage === 'PRE_ANESTHESIA'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>1. Asesmen Pra-Anestesi (ASA)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStage('INTRA_OP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeStage === 'INTRA_OP'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Monitoring Intra-Operasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStage('PACU_RECOVERY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeStage === 'PACU_RECOVERY'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>3. Pemulihan PACU & Skor Aldrete</span>
        </button>
      </div>

      {/* Stage 1: Pre-Anesthesia Assessment */}
      {activeStage === 'PRE_ANESTHESIA' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Evaluasi & Status Fisik Pra-Anestesi (JCI ASC.3)
            </h3>
            <p className="text-xs text-slate-400">Pengkajian risiko, jalan napas, dan persiapan pra-bedah</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Klasifikasi Status Fisik ASA (ASA Physical Status)
              </label>
              <select
                value={preAnesthesia.asaClass}
                onChange={(e) => setPreAnesthesia(p => ({ ...p, asaClass: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="ASA_I">ASA I: Pasien Sehat Normal</option>
                <option value="ASA_II">ASA II: Pasien dengan Penyakit Sistemik Ringan</option>
                <option value="ASA_III">ASA III: Penyakit Sistemik Berat yang Membatasi Aktivitas</option>
                <option value="ASA_IV">ASA IV: Penyakit Sistemik Berat Mengancam Jiwa</option>
                <option value="ASA_V">ASA V: Moribund Tidak Diharapkan Bertahan &gt;24 Jam</option>
                <option value="ASA_E">ASA E: Emergency Operation</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Evaluasi Jalan Napas (Skor Mallampati)
              </label>
              <select
                value={preAnesthesia.mallampatiScore}
                onChange={(e) => setPreAnesthesia(p => ({ ...p, mallampatiScore: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="CLASS_1">Mallampati Kelas 1 (Pilar tonsil, uvula, palatum mole terlihat penuh)</option>
                <option value="CLASS_2">Mallampati Kelas 2 (Uvula dan palatum mole terlihat)</option>
                <option value="CLASS_3">Mallampati Kelas 3 (Hanya palatum mole dan dasar uvula)</option>
                <option value="CLASS_4">Mallampati Kelas 4 (Hanya palatum durum terlihat - intubasi sulit)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Rencana Teknik Anestesi</label>
              <select
                value={preAnesthesia.plannedTechnique}
                onChange={(e) => setPreAnesthesia(p => ({ ...p, plannedTechnique: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="GENERAL_ANESTHESIA">General Anesthesia (GA / Intubasi / LMA)</option>
                <option value="REGIONAL_SPINAL">Regional Anesthesia: Spinal Subarachnoid Block (SAB)</option>
                <option value="REGIONAL_EPIDURAL">Regional Anesthesia: Epidural Block</option>
                <option value="SEDATION">Sedasi Moderat / Prosedural (MAC)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Puasa Makanan Padat</label>
                <input
                  type="number"
                  value={preAnesthesia.fastingSolidHours}
                  onChange={(e) => setPreAnesthesia(p => ({ ...p, fastingSolidHours: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Puasa Air Jernih</label>
                <input
                  type="number"
                  value={preAnesthesia.fastingLiquidHours}
                  onChange={(e) => setPreAnesthesia(p => ({ ...p, fastingLiquidHours: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Pemeriksaan Fisik Jalan Napas & Gigi</label>
              <input
                type="text"
                value={preAnesthesia.airwayAssessment}
                onChange={(e) => setPreAnesthesia(p => ({ ...p, airwayAssessment: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Rencana Premedikasi Pra-Induksi</label>
              <input
                type="text"
                value={preAnesthesia.premedication}
                onChange={(e) => setPreAnesthesia(p => ({ ...p, premedication: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stage 2: Intra-Operative Monitoring */}
      {activeStage === 'INTRA_OP' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Lembar Monitoring Anestesi Intra-Operasi (JCI ASC.7.4)
            </h3>
            <p className="text-xs text-slate-400">Pencatatan agen anestesi, hemodinamik, dan balans cairan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Agen Induksi & Dosis</label>
              <input
                type="text"
                value={intraOp.inductionAgent}
                onChange={(e) => setIntraOp(p => ({ ...p, inductionAgent: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Pelumpuh Otot (Muscle Relaxant)</label>
              <input
                type="text"
                value={intraOp.muscleRelaxant}
                onChange={(e) => setIntraOp(p => ({ ...p, muscleRelaxant: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Rumatan Gas Inhalasi & Oksigen</label>
              <input
                type="text"
                value={intraOp.maintenanceGas}
                onChange={(e) => setIntraOp(p => ({ ...p, maintenanceGas: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Manajemen Airway</label>
              <input
                type="text"
                value={intraOp.airwayType}
                onChange={(e) => setIntraOp(p => ({ ...p, airwayType: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Perkiraan Darah Hilang (EBL)</label>
              <input
                type="text"
                value={intraOp.ebl}
                onChange={(e) => setIntraOp(p => ({ ...p, ebl: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Urine Output & Cairan Infus</label>
              <input
                type="text"
                value={`${intraOp.ivFluids} | Urin: ${intraOp.urineOutput}`}
                onChange={(e) => setIntraOp(p => ({ ...p, ivFluids: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Catatan Khusus Selama Anestesi</label>
              <textarea
                rows={2}
                value={intraOp.intraOpNotes}
                onChange={(e) => setIntraOp(p => ({ ...p, intraOpNotes: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: PACU Aldrete Recovery */}
      {activeStage === 'PACU_RECOVERY' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Skor Pemulihan Pasca-Anestesi (Aldrete Score di Ruang PACU)
              </h3>
              <p className="text-xs text-slate-400">Kriteria transfer aman pasien dari ruang pulih sadar ke bangsal rawat inap</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Total Skor:</span>
              <span className={`px-3 py-1 rounded-xl font-mono font-black text-sm ${
                aldreteTotalScore >= 8 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {aldreteTotalScore} / 10
              </span>
              <span className={`text-xs font-bold ${aldreteTotalScore >= 8 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {aldreteTotalScore >= 8 ? '(Layak Pindah Bangsal)' : '(Belum Memenuhi Kriteria)'}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Aktivitas Motorik */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">1. Aktivitas Motorik</span>
                <p className="text-[11px] text-slate-400">Kemampuan menggerakkan anggota gerak secara terarah</p>
              </div>
              <select
                value={aldrete.activity}
                onChange={(e) => setAldrete(p => ({ ...p, activity: Number(e.target.value) }))}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value={2}>2 - Mampu menggerakkan 4 ekstremitas</option>
                <option value={1}>1 - Mampu menggerakkan 2 ekstremitas</option>
                <option value={0}>0 - Tidak dapat menggerakkan ekstremitas</option>
              </select>
            </div>

            {/* 2. Respirasi */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">2. Pernapasan / Respirasi</span>
                <p className="text-[11px] text-slate-400">Adekuasi ventilasi spontan dan refleks batuk</p>
              </div>
              <select
                value={aldrete.respiration}
                onChange={(e) => setAldrete(p => ({ ...p, respiration: Number(e.target.value) }))}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value={2}>2 - Bernapas dalam & mampu batuk spontan</option>
                <option value={1}>1 - Napas dangkal atau dispnea</option>
                <option value={0}>0 - Apnea / Dibantu ventilasi mekanik</option>
              </select>
            </div>

            {/* 3. Sirkulasi */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">3. Sirkulasi (Tekanan Darah)</span>
                <p className="text-[11px] text-slate-400">Deviasi terhadap baseline pra-operasi</p>
              </div>
              <select
                value={aldrete.circulation}
                onChange={(e) => setAldrete(p => ({ ...p, circulation: Number(e.target.value) }))}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value={2}>2 - TD dalam rentang +/- 20% nilai awal</option>
                <option value={1}>1 - TD bergeser +/- 20% - 50% nilai awal</option>
                <option value={0}>0 - TD bergeser &gt; 50% nilai awal</option>
              </select>
            </div>

            {/* 4. Kesadaran */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">4. Tingkat Kesadaran</span>
                <p className="text-[11px] text-slate-400">Respon terhadap perintah dan orientasi</p>
              </div>
              <select
                value={aldrete.consciousness}
                onChange={(e) => setAldrete(p => ({ ...p, consciousness: Number(e.target.value) }))}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value={2}>2 - Sadar penuh (Orientasi waktu & tempat baik)</option>
                <option value={1}>1 - Bangun jika dipanggil / rangsang suara</option>
                <option value={0}>0 - Tidak ada respon / tertidur dalam</option>
              </select>
            </div>

            {/* 5. Saturasi Oksigen */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">5. Oksigenasi (SpO2)</span>
                <p className="text-[11px] text-slate-400">Saturasi oksigen nadi</p>
              </div>
              <select
                value={aldrete.oxygenation}
                onChange={(e) => setAldrete(p => ({ ...p, oxygenation: Number(e.target.value) }))}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value={2}>2 - SpO2 &gt;92% pada udara ruangan (Room Air)</option>
                <option value={1}>1 - Perlu O2 tambahan (Nasal canul) untuk SpO2 &gt;90%</option>
                <option value={0}>0 - SpO2 &lt;90% dengan suplementasi O2</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
