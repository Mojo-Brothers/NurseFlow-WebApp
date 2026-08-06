import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, Stethoscope, Pill, Microscope, Scissors, FileText, 
  CheckCircle2, AlertTriangle, User, Calendar, Building2, CreditCard, 
  Printer, Tag, FilePlus, ExternalLink, Plus, Trash2, ChevronLeft, 
  ChevronRight, ArrowRight, ShieldCheck, HeartPulse, LogOut, Clock, 
  Zap, Scale, Search, X, Check, FileSignature, Sparkles, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import PatientDetailDrawerModal from './PatientDetailDrawerModal.jsx';
import DischargeModalClassic from '../../appointment_review/components/DischargeModalClassic.jsx';
import BmiModalSlider from '../../appointment_review/components/BmiModalSlider.jsx';
import { DEMO_PATIENTS } from '../../../core/demoData.js';

export default function PatientCarePanel({ patient, encounter, onDischargeSuccess }) {
  // ─── 1. Care Navigation State ───
  const [careScope, setCareScope] = useState('rawat_jalan'); // rawat_jalan | rawat_inap | pelayanan
  const [activeDeptTab, setActiveDeptTab] = useState('perawatan'); // perawatan | farmasi | lab | radiologi | ugd

  // ─── 2. Discharge & Queue State ───
  const [dischargeQueueCount, setDischargeQueueCount] = useState(4);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [isDischargeListModalOpen, setIsDischargeListModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBbTbModalOpen, setIsBbTbModalOpen] = useState(false);
  const [isProcessingDischarge, setIsProcessingDischarge] = useState(false);
  const [dischargeStatus, setDischargeStatus] = useState(encounter?.status || 'PROSES');

  // ─── 3. Clinical Observation State (BB/TB/BMI) ───
  const [clinicalObs, setClinicalObs] = useState({
    catatanMasuk: 'Pasien masuk dengan keluhan fisik umum untuk evaluasi klinis.',
    keadaanFisiologi: 'Compos Mentis (GCS 15), TD: 120/80 mmHg, Nadi: 80x/mnt, RR: 20x/mnt, SpO2: 98%',
    bb: 68,
    tb: 170
  });

  // ─── 4. Modals (Tindakan, Rujukan, BPJS Surat Kontrol) ───
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isSuratKontrolModalOpen, setIsSuratKontrolModalOpen] = useState(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);

  // ─── 5. Actions & Billing Ledger State ───
  const [actionsList, setActionsList] = useState([
    {
      id: 'act-101',
      tanggal: '2026-08-05 08:30',
      departemen: 'perawatan',
      namaPelayanan: 'Konsultasi & Pemeriksaan DPJP Spesialis Penyakit Dalam',
      sewaAlat: 0,
      dokter: 'dr. Siti Wijaya, Sp.PD',
      qty: 1,
      jumlahHarga: 250000,
      statusTagih: 'BILLED'
    },
    {
      id: 'act-102',
      tanggal: '2026-08-05 08:45',
      departemen: 'perawatan',
      namaPelayanan: 'Pemeriksaan EKG 12 Lead & Interprestasi Hasil',
      sewaAlat: 50000,
      dokter: 'dr. Siti Wijaya, Sp.PD',
      qty: 1,
      jumlahHarga: 150000,
      statusTagih: 'BILLED'
    }
  ]);

  // ─── 6. Form & Pagination States ───
  const [newActionForm, setNewActionForm] = useState({
    namaPelayanan: '',
    departemen: 'perawatan',
    dokter: 'dr. Siti Wijaya, Sp.PD',
    qty: 1,
    sewaAlat: 0,
    jumlahHarga: 100000
  });

  const [referralForm, setReferralForm] = useState({
    tipe: 'INTERNAL',
    tujuanDept: 'POLI_JANTUNG',
    dokterTujuan: 'dr. Ahmad Hidayat, Sp.JP',
    alasan: 'Evaluasi nyeri dada pasca EKG Abnormal'
  });

  const [suratKontrolForm, setSuratKontrolForm] = useState({
    noSuratKontrol: 'SK-BPJS-20260805-0089',
    tglRencanaKontrol: '2026-08-12',
    spesialis: 'Penyakit Dalam (Sp.PD)',
    dokter: 'dr. Siti Wijaya, Sp.PD'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // ─── 7. Computed Values (useMemo) ───
  const bmiData = useMemo(() => {
    const heightInM = clinicalObs.tb / 100;
    if (!heightInM || heightInM <= 0) return { val: '0.0', status: 'N/A', color: 'text-slate-400' };
    const bmiVal = (clinicalObs.bb / (heightInM * heightInM)).toFixed(1);
    let status = 'Normal';
    let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

    if (bmiVal < 18.5) {
      status = 'Kurus (Underweight)';
      color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    } else if (bmiVal >= 23 && bmiVal < 25) {
      status = 'Kelebihan BB (Overweight)';
      color = 'text-amber-600 bg-amber-600/10 border-amber-600/20';
    } else if (bmiVal >= 25) {
      status = 'Obesitas (Obese)';
      color = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    }

    return { val: bmiVal, status, color };
  }, [clinicalObs.bb, clinicalObs.tb]);

  const departmentTotal = useMemo(() => {
    return actionsList
      .filter(a => a.departemen === activeDeptTab)
      .reduce((sum, item) => sum + (item.jumlahHarga * item.qty) + item.sewaAlat, 0);
  }, [actionsList, activeDeptTab]);

  const grandTotal = useMemo(() => {
    return actionsList.reduce((sum, item) => sum + (item.jumlahHarga * item.qty) + item.sewaAlat, 0);
  }, [actionsList]);

  const departmentActions = useMemo(() => {
    return actionsList.filter(a => a.departemen === activeDeptTab);
  }, [actionsList, activeDeptTab]);

  const totalPages = Math.ceil(departmentActions.length / pageSize) || 1;
  const paginatedActions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return departmentActions.slice(start, start + pageSize);
  }, [departmentActions, currentPage, pageSize]);

  // ─── 8. Effects (useEffect) ───
  useEffect(() => {
    if (patient) {
      const mrnNum = parseInt(patient.mrn || '1001', 10);
      const pWeight = patient.baseline_profile?.value || (45 + ((mrnNum * 3) % 45));
      const pHeight = 150 + ((mrnNum * 2) % 35);
      const vitals = encounter?.vitals;

      const physioText = vitals 
        ? `Compos Mentis, TD: ${vitals.bp} mmHg, Nadi: ${vitals.hr}x/mnt, RR: ${vitals.rr}x/mnt, SpO2: ${vitals.spo2}%${vitals.pain_scale ? `, Nyeri: ${vitals.pain_scale}` : ''}`
        : `Compos Mentis (GCS 15), TD: 120/80 mmHg, Nadi: 80x/mnt, RR: 20x/mnt, SpO2: 98%`;

      const complaintText = encounter?.chief_complaint || 'Pasien masuk untuk konsultasi & evaluasi medis terpadu.';

      setClinicalObs({
        catatanMasuk: complaintText,
        keadaanFisiologi: physioText,
        bb: pWeight,
        tb: pHeight
      });

      setDischargeStatus(encounter?.status || 'PROSES');

      const docName = encounter?.doctor_name || 'dr. Siti Wijaya, Sp.PD';
      const deptName = encounter?.department || 'Poli Penyakit Dalam';

      setActionsList([
        {
          id: `act-${patient.mrn || '001001'}-101`,
          tanggal: '2026-08-06 08:30',
          departemen: 'perawatan',
          namaPelayanan: `Konsultasi & Pemeriksaan DPJP (${deptName.split(' ')[0]} ${deptName.split(' ')[1] || ''})`,
          sewaAlat: 0,
          dokter: docName,
          qty: 1,
          jumlahHarga: 250000,
          statusTagih: 'BILLED'
        },
        {
          id: `act-${patient.mrn || '001001'}-102`,
          tanggal: '2026-08-06 08:45',
          departemen: 'perawatan',
          namaPelayanan: 'Pemeriksaan Observasi Tanda-Tanda Vital & Fisiologi Pasien',
          sewaAlat: 25000,
          dokter: docName,
          qty: 1,
          jumlahHarga: 120000,
          statusTagih: 'BILLED'
        }
      ]);
    }
  }, [patient, encounter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeDeptTab]);

  // ─── 7. Keyboard Hotkeys Listener (F6 for +Layanan, F8 for Referral) ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F6') {
        e.preventDefault();
        setIsAddActionModalOpen(true);
        toast('Shortcut F6: Form Tambah Layanan Terbuka', { icon: '⚡' });
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsReferralModalOpen(true);
        toast('Shortcut F8: Form Buat Rujukan Terbuka', { icon: '⚡' });
      } else if (e.key === 'Escape') {
        setIsAddActionModalOpen(false);
        setIsReferralModalOpen(false);
        setIsBbTbModalOpen(false);
        setIsSuratKontrolModalOpen(false);
        setIsAllergyModalOpen(false);
        setIsDischargeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Handlers ───
  const handleAddAction = (e) => {
    e.preventDefault();
    if (!newActionForm.namaPelayanan) {
      toast.error('Nama tindakan/pelayanan wajib diisi!');
      return;
    }
    const newEntry = {
      id: `act-${Date.now()}`,
      tanggal: new Date().toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      departemen: newActionForm.departemen,
      namaPelayanan: newActionForm.namaPelayanan,
      sewaAlat: Number(newActionForm.sewaAlat) || 0,
      dokter: newActionForm.dokter,
      qty: Number(newActionForm.qty) || 1,
      jumlahHarga: Number(newActionForm.jumlahHarga) || 0,
      statusTagih: 'UNBILLED'
    };

    setActionsList(prev => [newEntry, ...prev]);
    setIsAddActionModalOpen(false);
    setNewActionForm({
      namaPelayanan: '',
      departemen: activeDeptTab,
      dokter: 'dr. Siti Wijaya, Sp.PD',
      qty: 1,
      sewaAlat: 0,
      jumlahHarga: 100000
    });
    toast.success('Tindakan medis berhasil ditambahkan ke riwayat billing!');
  };

  const handleDeleteAction = (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tindakan ini dari riwayat billing?')) return;
    setActionsList(prev => prev.filter(a => a.id !== id));
    toast.success('Tindakan telah dihapus dari billing.');
  };

  const handleProcessDischarge = () => {
    // Check if there are unbilled items
    const unbilledCount = actionsList.filter(a => a.statusTagih === 'UNBILLED').length;
    if (unbilledCount > 0) {
      toast.error(`Perhatian: Terdapat ${unbilledCount} tindakan berstatus UNBILLED! Kunci tagihan terlebih dahulu sebelum kepulangan.`);
    }
    setIsDischargeModalOpen(true);
  };

  const confirmDischarge = () => {
    setIsProcessingDischarge(true);
    setTimeout(() => {
      setIsProcessingDischarge(false);
      setIsDischargeModalOpen(false);
      setDischargeStatus('PROSES_PULANG');
      setDischargeQueueCount(prev => prev + 1);
      toast.success('Pasien berhasil diset ke status "PROSES PULANG". Antrean kasir telah diperbarui!');
      if (onDischargeSuccess) onDischargeSuccess();
    }, 1200);
  };

  const patientName = patient?.name || DEMO_PATIENTS[0]?.name || 'Ny. Siti Nurhaliza, S.Pd';
  const patientMrn = patient?.mrn || '001001';
  const patientNik = patient?.nik || '3273010001234567';
  const patientDob = patient?.demographics?.dob || '2001-02-15';
  const patientGender = patient?.demographics?.gender || 'F';
  const insuranceType = (patient?.insurance?.type || patient?.insurance?.name || 'BPJS KESEHATAN').toUpperCase();
  const insuranceNo = patient?.insurance?.no || `000192${patientMrn}`;
  const regNo = encounter?.id ? encounter.id.toUpperCase() : `REG-2026-${patientMrn}-001`;
  const departmentName = encounter?.department || (careScope === 'rawat_inap' ? 'Ruang Perawatan Chrysant (Kamar 302)' : 'Poli Penyakit Dalam (Lantai 2)');
  const doctorName = encounter?.doctor_name || 'dr. Siti Wijaya, Sp.PD';
  const tglKedatangan = encounter?.admitted_at?.toDate 
    ? encounter.admitted_at.toDate().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) 
    : '06 Agu 2026, 08.15 WIB';

  return (
    <div className="w-full max-w-full space-y-6 pb-12 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* ─── HEADER: Navigasi Modul Perawatan & Pemantauan Kepulangan ─── */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-outline-variant/40 shadow-premium-soft">
        
        {/* Navigasi Modul Perawatan (Rawat Jalan / Rawat Inap / Pelayanan) */}
        <div className="flex items-center bg-surface-container-high p-1 rounded-xl border border-outline-variant/30">
          {[
            { id: 'rawat_jalan', label: 'Rawat Jalan', icon: <Stethoscope size={15} /> },
            { id: 'rawat_inap', label: 'Rawat Inap', icon: <Building2 size={15} /> },
            { id: 'pelayanan', label: 'Pelayanan UGD/Khusus', icon: <Activity size={15} /> }
          ].map(scope => (
            <button
              key={scope.id}
              onClick={() => setCareScope(scope.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition-all ${
                careScope === scope.id 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/40'
              }`}
            >
              {scope.icon}
              <span>{scope.label}</span>
            </button>
          ))}
        </div>

        {/* Pemantauan Status Kepulangan + Counter Badge */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDischargeListModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20 text-xs font-bold transition-all cursor-pointer"
          >
            <Clock size={15} className="animate-spin-slow" />
            <span>Antrean Pulang:</span>
            <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">{dischargeQueueCount} Pasien</span>
          </button>

          <button
            onClick={() => setIsDischargeListModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer active:scale-95"
          >
            <LogOut size={16} />
            <span>Pasien Proses Pulang</span>
          </button>
        </div>
      </div>

      {/* ─── PANEL ADMINISTRASI & IDENTITAS PASIEN (2 COLUMNS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: Informasi Registrasi & Asuransi */}
        <div className="glass-panel p-5 rounded-2xl border border-outline-variant/30 space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2.5 text-primary font-black text-sm uppercase tracking-wider">
              <CreditCard size={18} />
              <span>Informasi Registrasi & Asuransi</span>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
              Status: {dischargeStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20">
              <span className="text-[10px] font-black uppercase opacity-50 block mb-0.5">No. Registrasi</span>
              <span className="font-mono font-bold text-on-surface text-sm">{regNo}</span>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20">
              <span className="text-[10px] font-black uppercase opacity-50 block mb-0.5">Tgl. Kedatangan</span>
              <span className="font-bold text-on-surface">{tglKedatangan}</span>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20">
              <span className="text-[10px] font-black uppercase opacity-50 block mb-0.5">Jenis Pasien / Penjamin</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <ShieldCheck size={14} /> {insuranceType}
              </span>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20">
              <span className="text-[10px] font-black uppercase opacity-50 block mb-0.5">Group Tarif / Perusahaan</span>
              <span className="font-bold text-on-surface">{patient?.insurance?.name || 'Kelas III • BPJS PBI'}</span>
            </div>
          </div>

          {/* Penanggung Jaminan + Surat Kontrol */}
          <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                <FileSignature size={18} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-wider block">No. Kartu BPJS / Penjamin</span>
                <span className="font-mono font-black text-sm">{insuranceNo}</span>
              </div>
            </div>

            <button
              onClick={() => setIsSuratKontrolModalOpen(true)}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>Surat Kontrol</span>
            </button>
          </div>
        </div>

        {/* CARD 2: Identitas & Lokasi Medis Pasien */}
        <div className="glass-panel p-5 rounded-2xl border border-outline-variant/30 space-y-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2.5 text-primary font-black text-sm uppercase tracking-wider">
              <User size={18} />
              <span>Identitas & Lokasi Medis</span>
            </div>
            <button 
              onClick={() => setIsDetailModalOpen(true)}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Detail Info</span>
              <ExternalLink size={12} />
            </button>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg shadow-inner">
              {patientGender === 'F' ? 'P' : 'L'}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-on-surface">{patientName}</h3>
                <span className="px-2 py-0.5 bg-surface-container rounded font-mono font-bold text-[10px] text-on-surface-variant">
                  MRN: {patientMrn}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant/80 font-medium">
                NIK: <span className="font-mono">{patientNik}</span> • Tgl Lahir: {patientDob} ({calculateAge(patientDob)} Thn)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20">
              <span className="text-[10px] font-black uppercase opacity-50 block mb-0.5">Penplacement Poliklinik / Ruang</span>
              <span className="font-bold text-on-surface flex items-center gap-1">
                <Building2 size={13} className="text-primary" /> {departmentName}
              </span>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/20">
              <span className="text-[10px] font-black uppercase opacity-50 block mb-0.5">Dokter DPJP Utama</span>
              <span className="font-bold text-on-surface flex items-center gap-1">
                <Stethoscope size={13} className="text-primary" /> {doctorName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PENCATATAN KLINIS DASAR (BB/TB, Catatan Masuk, Keadaan Fisiologi) ─── */}
      <div className="glass-panel p-5 rounded-2xl border border-outline-variant/30 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5 text-primary font-black text-sm uppercase tracking-wider">
            <Activity size={18} />
            <span>Pencatatan Klinis Dasar & Observasi Fisiologi</span>
          </div>
          <button 
            onClick={() => setIsBbTbModalOpen(true)}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Scale size={14} />
            <span>Edit BB/TB</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 space-y-1">
            <span className="text-[10px] font-black uppercase text-on-surface-variant/60 tracking-wider">Catatan Masuk (Admission Note)</span>
            <p className="text-xs text-on-surface font-medium leading-relaxed italic">{clinicalObs.catatanMasuk}</p>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 space-y-1">
            <span className="text-[10px] font-black uppercase text-on-surface-variant/60 tracking-wider">Keadaan Fisiologi (Vital Signs)</span>
            <p className="text-xs text-on-surface font-bold leading-relaxed">{clinicalObs.keadaanFisiologi}</p>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-on-surface-variant/60 tracking-wider">Berat & Tinggi Badan</span>
              <p className="text-sm font-black text-on-surface">{clinicalObs.bb} kg / {clinicalObs.tb} cm</p>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-center ${bmiData.color}`}>
              <span className="text-[9px] font-black uppercase tracking-wider block opacity-70">IMT / BMI</span>
              <span className="text-sm font-black">{bmiData.val} ({bmiData.status.split(' ')[0]})</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BARIS AKSI PENUNJANG MEDIS & ADMIN (SHORTCUTS BAR) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30">
        <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70 pl-2">Pintasan Penunjang:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setIsReferralModalOpen(true)}
            className="px-3 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FilePlus size={14} className="text-primary" />
            <span>Daftar Rujukan</span>
          </button>

          <button 
            onClick={() => toast.success('Mencetak Gelang Identitas & Label Spesimen Pasien', { icon: '🖨️' })}
            className="px-3 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Printer size={14} className="text-primary" />
            <span>Cetak Label</span>
          </button>

          <button 
            onClick={() => setIsAllergyModalOpen(true)}
            className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-500/20"
          >
            <AlertTriangle size={14} />
            <span>Lihat Alergi</span>
          </button>

          <button 
            onClick={() => toast.success('Membuka Formulir Paket Dispensing Obat Ruangan', { icon: '💊' })}
            className="px-3 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Pill size={14} className="text-primary" />
            <span>+ Paket Dispenser</span>
          </button>

          <button 
            onClick={() => window.open('https://kemkes.go.id', '_blank')}
            className="px-3 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ExternalLink size={14} className="text-primary" />
            <span>Link Edukasi</span>
          </button>
        </div>
      </div>

      {/* ─── PANEL PELAYANAN TERPADU & INPUT TINDAKAN (INTEGRATED DEPT TABS) ─── */}
      <div className="glass-panel p-5 rounded-2xl border border-outline-variant/30 space-y-5 shadow-premium-soft">
        
        {/* Department Tabs Bar + Action Shortcuts (F6 / F8) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-3">
          
          {/* Department Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'perawatan', label: 'Ruang Perawatan', icon: <Stethoscope size={16} /> },
              { id: 'farmasi', label: 'Farmasi Utama', icon: <Pill size={16} /> },
              { id: 'lab', label: 'Laboratorium', icon: <Microscope size={16} /> },
              { id: 'radiologi', label: 'Radiologi', icon: <Activity size={16} /> },
              { id: 'ugd', label: 'UGD & Darurat', icon: <HeartPulse size={16} /> }
            ].map(dept => (
              <button
                key={dept.id}
                onClick={() => setActiveDeptTab(dept.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeDeptTab === dept.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {dept.icon}
                <span>{dept.label}</span>
              </button>
            ))}
          </div>

          {/* Action Action Buttons (F6 & F8 Hotkeys) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddActionModalOpen(true)}
              className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all flex items-center gap-1.5 shadow-sm"
              title="Shortcut Keyboard: F6"
            >
              <Zap size={14} className="text-amber-300 fill-amber-300" />
              <span>+ Layanan (F6)</span>
            </button>

            <button
              onClick={() => {
                setNewActionForm(prev => ({ ...prev, departemen: 'lab' }));
                setIsAddActionModalOpen(true);
              }}
              className="px-3 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">+ Layanan Dept Lain</span>
            </button>

            <button
              onClick={() => setIsReferralModalOpen(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Shortcut Keyboard: F8"
            >
              <FilePlus size={14} />
              <span>Buat Rujukan (F8)</span>
            </button>
          </div>
        </div>

        {/* ─── RINCIAN RIWAYAT TINDAKAN & TABLE LISTING ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
              Rincian Tindakan Medical Departemen {activeDeptTab.toUpperCase()} ({departmentActions.length} Item)
            </h4>
            <span className="text-xs font-bold text-primary">
              Subtotal Departemen: <strong className="text-sm font-black text-on-surface">Rp {departmentTotal.toLocaleString('id-ID')}</strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-outline-variant/30">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Tanggal & Waktu</th>
                  <th className="py-3 px-4">Nama Pelayanan / Tindakan</th>
                  <th className="py-3 px-4">Dokter / Pelaksana</th>
                  <th className="py-3 px-4">Sewa Alat</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Jumlah Harga</th>
                  <th className="py-3 px-4">Status Tagih</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 font-medium">
                {paginatedActions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-on-surface-variant opacity-50 italic font-bold">
                      Belum ada tindakan tercatat pada departemen ini. Tekan F6 untuk menginput tindakan baru.
                    </td>
                  </tr>
                ) : (
                  paginatedActions.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-surface-container-low/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-on-surface-variant/70">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold opacity-80">{item.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-on-surface">{item.namaPelayanan}</td>
                      <td className="py-3 px-4 font-semibold text-primary">{item.dokter}</td>
                      <td className="py-3 px-4 font-mono">
                        {item.sewaAlat > 0 ? `Rp ${item.sewaAlat.toLocaleString('id-ID')}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold">{item.qty}</td>
                      <td className="py-3 px-4 font-mono font-bold text-on-surface">
                        Rp {((item.jumlahHarga * item.qty) + item.sewaAlat).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          item.statusTagih === 'BILLED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {item.statusTagih}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAction(item.id)}
                          className="w-7 h-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center text-on-surface-variant transition-colors"
                          title="Hapus Tindakan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
            <span className="text-[11px] font-bold text-on-surface-variant/70">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1 bg-surface-container hover:bg-surface-container-high disabled:opacity-30 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1 bg-surface-container hover:bg-surface-container-high disabled:opacity-30 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── KALKULASI BIAYA OTOMATIS (GRAND TOTAL LEDGER) ─── */}
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-md">
              <CreditCard size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-primary tracking-widest block">Akumulasi Biaya Perawatan Pasien</span>
              <span className="text-xs text-on-surface-variant font-semibold">Termasuk sewa alat & seluruh tindakan departemen terpadu</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] font-black uppercase opacity-60 block">Total Departemen ({activeDeptTab.toUpperCase()})</span>
              <span className="text-base font-black text-on-surface">Rp {departmentTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-8 w-[1px] bg-outline-variant/40"></div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-primary tracking-wider block">Grand Total Perawatan</span>
              <span className="text-2xl font-black text-primary">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: EDIT BB/TB (Replaced with BmiModalSlider Ide Baru 2 at bottom) ─── */}

      {/* ─── MODAL 2: TAMBAH TINDAKAN / LAYANAN (SHORTCUT F6) ─── */}
      {isAddActionModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAddActionModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
              <div className="flex items-center gap-2 text-primary font-black">
                <Zap size={20} className="text-amber-400 fill-amber-400" />
                <span>Input Layanan Medis Baru (Shortcut F6)</span>
              </div>
              <button onClick={() => setIsAddActionModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddAction} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block mb-1">Nama Layanan / Tindakan:</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Injeksi Ceftriaxone 1gr, Nebulizer, EKG..."
                  value={newActionForm.namaPelayanan}
                  onChange={e => setNewActionForm(prev => ({ ...prev, namaPelayanan: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Departemen Tujuan:</label>
                  <select
                    value={newActionForm.departemen}
                    onChange={e => setNewActionForm(prev => ({ ...prev, departemen: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                  >
                    <option value="perawatan">Ruang Perawatan</option>
                    <option value="farmasi">Farmasi Utama</option>
                    <option value="lab">Laboratorium</option>
                    <option value="radiologi">Radiologi</option>
                    <option value="ugd">UGD & Darurat</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Dokter / Pelaksana:</label>
                  <input
                    type="text"
                    value={newActionForm.dokter}
                    onChange={e => setNewActionForm(prev => ({ ...prev, dokter: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1">Kuantitas (Qty):</label>
                  <input
                    type="number"
                    min="1"
                    value={newActionForm.qty}
                    onChange={e => setNewActionForm(prev => ({ ...prev, qty: Number(e.target.value) }))}
                    className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1">Tarif Layanan (Rp):</label>
                  <input
                    type="number"
                    value={newActionForm.jumlahHarga}
                    onChange={e => setNewActionForm(prev => ({ ...prev, jumlahHarga: Number(e.target.value) }))}
                    className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1">Sewa Alat (Rp):</label>
                  <input
                    type="number"
                    value={newActionForm.sewaAlat}
                    onChange={e => setNewActionForm(prev => ({ ...prev, sewaAlat: Number(e.target.value) }))}
                    className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddActionModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-container rounded-xl font-bold hover:bg-surface-container-high"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all shadow-md"
                >
                  + Tambahkan Layanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: BUAT RUJUKAN (SHORTCUT F8) ─── */}
      {isReferralModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsReferralModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 relative shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black">
                <FilePlus size={20} />
                <span>Buat Rujukan Medis Baru (Shortcut F8)</span>
              </div>
              <button onClick={() => setIsReferralModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block mb-1">Tipe Rujukan:</label>
                <select
                  value={referralForm.tipe}
                  onChange={e => setReferralForm(prev => ({ ...prev, tipe: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                >
                  <option value="INTERNAL">Rujukan Konsultasi Internal (Spesialis Lain)</option>
                  <option value="EKSTERNAL">Rujukan Ekstermal (RS Tipe A / Faskes Lanjutan)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Departemen / Poli Tujuan:</label>
                <input
                  type="text"
                  value={referralForm.tujuanDept}
                  onChange={e => setReferralForm(prev => ({ ...prev, tujuanDept: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Alasan / Catatan Rujukan:</label>
                <textarea
                  rows={3}
                  value={referralForm.alasan}
                  onChange={e => setReferralForm(prev => ({ ...prev, alasan: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                />
              </div>

              <button
                onClick={() => {
                  setIsReferralModalOpen(false);
                  toast.success('Surat Rujukan Medis berhasil diterbitkan & terkirim ke modul tujuan!');
                }}
                className="w-full py-3 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 transition-all shadow-md"
              >
                Terbitkan Rujukan (F8)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: BPJS SURAT KONTROL ─── */}
      {isSuratKontrolModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSuratKontrolModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
              <div className="flex items-center gap-2 text-primary font-black">
                <FileSignature size={20} />
                <span>Penerbitan Surat Kontrol BPJS VClaim</span>
              </div>
              <button onClick={() => setIsSuratKontrolModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block mb-1">Nomor Surat Kontrol (Auto-Generated):</label>
                <input
                  type="text"
                  readOnly
                  value={suratKontrolForm.noSuratKontrol}
                  className="w-full bg-surface-container border border-outline-variant p-2.5 rounded-xl font-mono text-primary font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Tanggal Rencana Kontrol:</label>
                <input
                  type="date"
                  value={suratKontrolForm.tglRencanaKontrol}
                  onChange={e => setSuratKontrolForm(prev => ({ ...prev, tglRencanaKontrol: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Dokter DPJP Kontrol:</label>
                <input
                  type="text"
                  value={suratKontrolForm.dokter}
                  onChange={e => setSuratKontrolForm(prev => ({ ...prev, dokter: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant p-2.5 rounded-xl font-bold"
                />
              </div>

              <button
                onClick={() => {
                  setIsSuratKontrolModalOpen(false);
                  toast.success(`Surat Kontrol BPJS ${suratKontrolForm.noSuratKontrol} berhasil diterbitkan via BPJS VClaim!`);
                }}
                className="w-full py-3 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all shadow-md"
              >
                Terbitkan Surat Kontrol BPJS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: ALERGI PASIEN ─── */}
      {isAllergyModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsAllergyModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
              <div className="flex items-center gap-2 text-rose-500 font-black">
                <AlertTriangle size={20} />
                <span>Riwayat Alergi Pasien (IPSG Safety Alert)</span>
              </div>
              <button onClick={() => setIsAllergyModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-rose-600 block">Alergi Obat (Drug Allergy):</span>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Amoxicillin / Penicillin Group (Reaksi: Angioedema / Syok)</p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-600 block">Alergi Makanan (Food Allergy):</span>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Seafood / Udang & Kepiting (Reaksi: Urtikaria Gatal)</p>
              </div>

              <div className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl">
                <span className="text-[10px] font-black uppercase opacity-60 block">Instruksi Keselamatan (Gelang Merah):</span>
                <p className="text-xs font-medium text-on-surface">Pastikan gelang penanda alergi (merah) terpasang pada pergelangan tangan pasien.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: DISCHARGE CONFIRMATION ─── */}
      {isDischargeModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsDischargeModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 relative shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black">
                <LogOut size={20} />
                <span>Konfirmasi Pasien Proses Pulang</span>
              </div>
              <button onClick={() => setIsDischargeModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <p className="text-on-surface leading-relaxed">
                Apakah Anda yakin ingin memproses kepulangan pasien <strong className="text-primary">{patientName}</strong>? Status kunjungan akan diubah menjadi <strong>PROSES PULANG</strong> dan nomor antrean kasir akan diterbitkan.
              </p>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1">
                <span className="text-[10px] font-black uppercase opacity-60 block">Ringkasan Tagihan Perawatan:</span>
                <div className="flex justify-between text-sm font-black">
                  <span>Grand Total Billing:</span>
                  <span className="text-primary">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="flex-1 py-2.5 bg-surface-container rounded-xl font-bold hover:bg-surface-container-high"
                >
                  Batal
                </button>
                <button
                  disabled={isProcessingDischarge}
                  onClick={confirmDischarge}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {isProcessingDischarge ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Ya, Set Proses Pulang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Detail Drawer Modal (Design Variant 3) */}
      <PatientDetailDrawerModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        patient={patient}
      />

      {/* Discharge Patient Modal (Design Variant 1 - Classic HIS Grid) */}
      <DischargeModalClassic 
        isOpen={isDischargeListModalOpen}
        onClose={() => setIsDischargeListModalOpen(false)}
      />

      {/* BMI Edit BB/TB Modal (New Concept 2 - Quick Stepper & Visit Trend) */}
      <BmiModalSlider 
        isOpen={isBbTbModalOpen}
        onClose={() => setIsBbTbModalOpen(false)}
        initialBb={clinicalObs.bb}
        initialTb={clinicalObs.tb}
        onSave={(newBb, newTb) => {
          setClinicalObs(prev => ({ ...prev, bb: newBb, tb: newTb }));
          toast.success(`Berhasil memperbarui BB (${newBb} kg) & TB (${newTb} cm)`);
        }}
      />
    </div>
  );
}
