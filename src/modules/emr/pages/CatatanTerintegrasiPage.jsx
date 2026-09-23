import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, Plus, Filter, Search, Printer, CheckCircle2, 
  Stethoscope, Activity, Pill, Apple, ShieldCheck, ArrowLeft,
  Calendar, Clock, User, FileText, ChevronDown, CheckSquare, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import toast from 'react-hot-toast';

export default function CatatanTerintegrasiPage() {
  const navigate = useNavigate();
  const { patients, selectedPatientId } = usePatientStore();
  const { activeEncounters } = useEncounterStore();

  const [encounterFilter, setEncounterFilter] = useState('ALL'); // 'ALL' | 'OUTPATIENT' | 'INPATIENT'
  const [ppaFilter, setPpaFilter] = useState('ALL'); // 'ALL' | 'DOKTER' | 'PERAWAT' | 'FARMASI' | 'GIZI'
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId || p.mrn === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Simulated Master CPPT Records
  const [cpptNotes, setCpptNotes] = useState([
    {
      id: 'CPPT-001',
      encounterType: 'INPATIENT',
      encounterLabel: 'Rawat Inap (Melati 201)',
      date: '2026-09-10',
      time: '08:30',
      author: 'dr. Alexander, Sp.PD',
      role: 'DOKTER',
      roleLabel: 'DPJP Utama',
      subjective: 'Pasien merasa demam sudah turun, mual berkurang. Masih terasa lemas ringan saat duduk tegak.',
      objective: 'TD: 118/76 mmHg, HR: 80 bpm, RR: 18x/m, SpO2: 98%, Suhu: 36.7°C. Abdomen supel, nyeri tekan epigastrium berkurang minimal, turgor baik.',
      assessment: 'Dengue Hemorrhagic Fever (DHF) Grade I fase pemulihan (konvalesen).',
      plan: 'Lanjut infus Asering 1500 ml/24 jam. Diet lunak tinggi kalori tinggi protein. Cek darah rutin ulang (Hb, Ht, Trombosit) sore pkl 16.00.',
      instruction: 'Bila trombosit >100.000 dan bebas demam 48 jam, rencana pulang besok.',
      verifiedByDpjp: true,
      verifiedAt: '2026-09-10 09:00 WIB'
    },
    {
      id: 'CPPT-002',
      encounterType: 'INPATIENT',
      encounterLabel: 'Rawat Inap (Melati 201)',
      date: '2026-09-10',
      time: '07:00',
      author: 'Ns. Ratih, S.Kep',
      role: 'PERAWAT',
      roleLabel: 'PPJA Shift Pagi',
      subjective: 'Pasien menyatakan tidur nyenyak semalam, BAK lancar kuning jernih.',
      objective: 'TTV Pagi: TD 120/75, Nadi 78, Suhu 36.6, RR 18. Intake cairan 24 jam: 2.200 ml, Output: 2.000 ml. Balans: +200 ml.',
      assessment: 'Risiko hipovolemia teratasi sebagian, toleransi aktivitas meningkat.',
      plan: 'Pertahankan hidrasi adekuat, pantau tanda-tanda perdarahan spontan (ptekie, epistaksis nihil), dampingi mobilisasi bertahap.',
      instruction: 'Laporkan bila timbul mual muntah atau tanda perdarahan.',
      verifiedByDpjp: true,
      verifiedAt: '2026-09-10 09:00 WIB'
    },
    {
      id: 'CPPT-003',
      encounterType: 'INPATIENT',
      encounterLabel: 'Rawat Inap (Melati 201)',
      date: '2026-09-09',
      time: '14:30',
      author: 'Apt. Dian Permata, S.Farm',
      role: 'FARMASI',
      roleLabel: 'Farmasi Klinis',
      subjective: 'Pasien menanyakan aturan minum parasetamol bila demam sudah tidak ada.',
      objective: 'Telaah resep: Parasetamol 500mg tab prn, Sucralfate susp 3x1 C, Curcuma tab 3x1. Tidak ditemukan interaksi obat mayor.',
      assessment: 'Penggunaan analgesik/antipiretik tepat indikasi. Kepatuhan pasien baik.',
      plan: 'Edukasi penghentian parasetamol jika suhu sudah normal stabil <37.2°C selama 24 jam.',
      instruction: 'Monitoring kepatuhan minum obat gastroprotektor.',
      verifiedByDpjp: true,
      verifiedAt: '2026-09-09 17:00 WIB'
    },
    {
      id: 'CPPT-004',
      encounterType: 'OUTPATIENT',
      encounterLabel: 'Poli Penyakit Dalam',
      date: '2026-09-07',
      time: '09:15',
      author: 'dr. Alexander, Sp.PD',
      role: 'DOKTER',
      roleLabel: 'Dokter Poliklinik',
      subjective: 'Demam tinggi mendadak hari ke-3, nyeri sendi dan belakang bola mata. Nafsu makan turun.',
      objective: 'TD 110/70, Nadi 88, Suhu 38.5°C, Uji Tourniquet (+), Trombosit 84.000/uL, Ht 42%.',
      assessment: 'DHF Grade II dengan tanda bahaya (trombositopenia + dehidrasi sedang).',
      plan: 'Konsul admisi rawat inap segera. Pasang IV line di UGD/Poli transit.',
      instruction: 'Transfer ke Bangsal Melati.',
      verifiedByDpjp: true,
      verifiedAt: '2026-09-07 09:45 WIB'
    }
  ]);

  // Form input CPPT baru
  const [newSoap, setNewSoap] = useState({
    encounterType: 'INPATIENT',
    author: 'dr. Budi Santoso, Sp.B',
    role: 'DOKTER',
    roleLabel: 'Dokter Spesialis',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    instruction: ''
  });

  const filteredNotes = useMemo(() => {
    return cpptNotes.filter(n => {
      if (encounterFilter !== 'ALL' && n.encounterType !== encounterFilter) return false;
      if (ppaFilter !== 'ALL' && n.role !== ppaFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (n.subjective || '').toLowerCase().includes(q) ||
          (n.objective || '').toLowerCase().includes(q) ||
          (n.assessment || '').toLowerCase().includes(q) ||
          (n.plan || '').toLowerCase().includes(q) ||
          (n.author || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [cpptNotes, encounterFilter, ppaFilter, searchQuery]);

  const handleSaveNewSoap = (e) => {
    e.preventDefault();
    if (!newSoap.subjective || !newSoap.assessment || !newSoap.plan) {
      toast.error('Subjective, Assessment, dan Plan wajib diisi!');
      return;
    }

    const now = new Date();
    const createdNote = {
      id: `CPPT-${Date.now()}`,
      encounterLabel: newSoap.encounterType === 'INPATIENT' ? 'Rawat Inap' : 'Rawat Jalan',
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      ...newSoap,
      verifiedByDpjp: true,
      verifiedAt: `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)} WIB`
    };

    setCpptNotes(prev => [createdNote, ...prev]);
    setIsAddModalOpen(false);
    toast.success('Catatan CPPT berhasil ditambahkan ke rekam medis terintegrasi!');

    setNewSoap({
      encounterType: 'INPATIENT',
      author: 'dr. Budi Santoso, Sp.B',
      role: 'DOKTER',
      roleLabel: 'Dokter Spesialis',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      instruction: ''
    });
  };

  const handleVerifyAll = () => {
    setCpptNotes(prev => prev.map(n => ({
      ...n,
      verifiedByDpjp: true,
      verifiedAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)} WIB`
    })));
    toast.success('Seluruh catatan perkembangan pasien telah diverifikasi oleh DPJP Utama!');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/emr')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Kembali ke EMR Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/30">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Catatan Terintegrasi (CPPT)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                SNARS Ed.2 • COP.2.1
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catatan Perkembangan Pasien Terintegrasi Antar PPA (Dokter, Perawat, Farmasi, Gizi)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleVerifyAll}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Verifikasi seluruh catatan CPPT yang belum terverifikasi"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verifikasi DPJP</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar CPPT</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis CPPT Baru</span>
          </button>
        </div>
      </div>

      {/* Patient Header */}
      {activePatient && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800/80 dark:to-slate-900 border border-emerald-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              {activePatient.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white">{activePatient.name}</span>
                <span className="font-mono text-slate-500 font-bold">({activePatient.mrn || activePatient.id})</span>
              </div>
              <span className="text-[11px] text-slate-500">Berkas Rekam Medis Terintegrasi Elektronik</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-black uppercase">
            STATUS CPPT: TERVERIFIKASI
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Toggle RJ / RI */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setEncounterFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              encounterFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Semua Pelayanan
          </button>
          <button
            type="button"
            onClick={() => setEncounterFilter('INPATIENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              encounterFilter === 'INPATIENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Rawat Inap (RI)
          </button>
          <button
            type="button"
            onClick={() => setEncounterFilter('OUTPATIENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              encounterFilter === 'OUTPATIENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Rawat Jalan (RJ)
          </button>
        </div>

        {/* Filter PPA & Search */}
        <div className="flex items-center gap-2">
          <select
            value={ppaFilter}
            onChange={(e) => setPpaFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Semua Profesi PPA</option>
            <option value="DOKTER">🩺 Dokter (DPJP)</option>
            <option value="PERAWAT">👩‍⚕️ Perawat (PPJA)</option>
            <option value="FARMASI">💊 Farmasi Klinis</option>
            <option value="GIZI">🥗 Dietisien / Gizi</option>
          </select>

          <div className="relative min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari CPPT, SOAP, nama PPA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* CPPT Timeline Dossier */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
            <ClipboardList className="w-12 h-12 text-slate-400" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Belum ada catatan CPPT pada kriteria ini</p>
            <p className="text-xs text-slate-400">Gunakan tombol "Tulis CPPT Baru" untuk mendokumentasikan asuhan pasien.</p>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black ${
                    note.role === 'DOKTER' ? 'bg-indigo-600' :
                    note.role === 'PERAWAT' ? 'bg-teal-600' :
                    note.role === 'FARMASI' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}>
                    {note.role === 'DOKTER' ? <Stethoscope className="w-4 h-4" /> :
                     note.role === 'PERAWAT' ? <Activity className="w-4 h-4" /> :
                     note.role === 'FARMASI' ? <Pill className="w-4 h-4" /> : <Apple className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-xs">{note.author}</span>
                      <span className="text-[10px] font-bold text-slate-400">({note.roleLabel})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {note.date} • {note.time} WIB • {note.encounterLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                    {note.encounterType}
                  </span>
                  {note.verifiedByDpjp && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> DPJP VERIFIED
                    </span>
                  )}
                </div>
              </div>

              {/* SOAP Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-black text-[10px] tracking-wider uppercase text-blue-600 dark:text-blue-400 block">
                    [S] Subjective (Keluhan / Anamnesis)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{note.subjective}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-black text-[10px] tracking-wider uppercase text-teal-600 dark:text-teal-400 block">
                    [O] Objective (Pemeriksaan Fisik & TTV)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{note.objective}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-black text-[10px] tracking-wider uppercase text-amber-600 dark:text-amber-400 block">
                    [A] Assessment (Diagnosis & Masalah Klinis)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-bold">{note.assessment}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="font-black text-[10px] tracking-wider uppercase text-emerald-600 dark:text-emerald-400 block">
                    [P] Plan (Rencana Asuhan, Terapi, Obat)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">{note.plan}</p>
                </div>
              </div>

              {/* Instruksi PPA & Footer */}
              {note.instruction && (
                <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[10px] uppercase text-indigo-700 dark:text-indigo-300">
                      Instruksi PPA Termasuk Pasca Bedah:
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{note.instruction}</span>
                  </div>
                  {note.verifiedAt && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                      Diverifikasi: {note.verifiedAt}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Tulis CPPT Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Dokumentasi Catatan CPPT Baru</h3>
                <p className="text-[11px] text-slate-400">Catatan perkembangan pasien terintegrasi multi-profesi</p>
              </div>
            </div>

            <form onSubmit={handleSaveNewSoap} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Jenis Pelayanan</label>
                  <select
                    value={newSoap.encounterType}
                    onChange={(e) => setNewSoap(p => ({ ...p, encounterType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="INPATIENT">Rawat Inap (RI)</option>
                    <option value="OUTPATIENT">Rawat Jalan (RJ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Profesi PPA</label>
                  <select
                    value={newSoap.role}
                    onChange={(e) => setNewSoap(p => ({ 
                      ...p, 
                      role: e.target.value,
                      roleLabel: e.target.value === 'DOKTER' ? 'DPJP Spesialis' :
                                 e.target.value === 'PERAWAT' ? 'PPJA Keperawatan' :
                                 e.target.value === 'FARMASI' ? 'Farmasi Klinis' : 'Dietisien'
                    }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="DOKTER">Dokter (DPJP)</option>
                    <option value="PERAWAT">Perawat (PPJA)</option>
                    <option value="FARMASI">Farmasi Klinis</option>
                    <option value="GIZI">Gizi / Dietisien</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  [S] Subjective (Keluhan Pasien) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Keluhan utama, riwayat, respons subjektif..."
                  value={newSoap.subjective}
                  onChange={(e) => setNewSoap(p => ({ ...p, subjective: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">[O] Objective (Tanda Vital & Pemeriksaan Fisik)</label>
                <textarea
                  rows={2}
                  placeholder="TTV (TD, HR, RR, Suhu, SpO2), hasil lab/rontgen..."
                  value={newSoap.objective}
                  onChange={(e) => setNewSoap(p => ({ ...p, objective: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  [A] Assessment (Diagnosis Kerja / Analisis Klinis) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Diagnosis kerja, evaluasi respons terapi..."
                  value={newSoap.assessment}
                  onChange={(e) => setNewSoap(p => ({ ...p, assessment: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  [P] Plan (Rencana Asuhan & Terapi Medis) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Rencana terapi, obat, edukasi, pemeriksaan lanjutan..."
                  value={newSoap.plan}
                  onChange={(e) => setNewSoap(p => ({ ...p, plan: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Instruksi PPA Termasuk Pasca Tindakan</label>
                <input
                  type="text"
                  placeholder="Instruksi khusus kepada perawat / tim asuhan..."
                  value={newSoap.instruction}
                  onChange={(e) => setNewSoap(p => ({ ...p, instruction: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md shadow-emerald-600/30"
                >
                  Simpan & Tandatangani CPPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
