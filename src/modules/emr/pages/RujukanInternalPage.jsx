import React, { useState, useMemo } from 'react';
import { 
  GitFork, Inbox, Send, Plus, Search, Filter, Clock, CheckCircle2, 
  AlertTriangle, Stethoscope, UserCheck, MessageSquare, ArrowLeft,
  Calendar, FileText, ChevronRight, X, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { emrSupportingDocsService } from '../services/emrSupportingDocs.service.js';
import { usePatientStore } from '../../patient/patient.store.js';
import toast from 'react-hot-toast';

export default function RujukanInternalPage() {
  const navigate = useNavigate();
  const { patients, selectedPatientId } = usePatientStore();

  const [activeTab, setActiveTab] = useState('INBOX'); // 'INBOX' | 'OUTBOX' | 'COMPLETED'
  const [referrals, setReferrals] = useState(() => emrSupportingDocsService.getInternalReferrals());
  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [isNewReferralModalOpen, setIsNewReferralModalOpen] = useState(false);
  const [respondingReferral, setRespondingReferral] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');

  const activePatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId || p.mrn === selectedPatientId) || patients[0] || null;
  }, [patients, selectedPatientId]);

  // Form State Buat Rujukan Baru
  const [newRefForm, setNewRefForm] = useState({
    originDepartment: 'Poli Bedah Umum',
    referringDoctor: 'dr. Budi Santoso, Sp.B',
    targetDepartment: 'Poli Paru',
    consultantDoctor: 'dr. Faisal Bahar, Sp.P(K)',
    consultationType: 'ROUTINE', // CITO | ROUTINE | CO_MANAGEMENT | TRANSFER_OF_CARE
    clinicalDiagnosis: 'Apendisitis Akut Post-Op, Suspek Efusi Pleura',
    clinicalSummary: 'Pasien post-laparotomi mengeluh sesak napas ringan dan batuk grok-grok.',
    consultationQuestion: 'Mohon evaluasi paru dan advis tatalaksana terapi respirasi.'
  });

  const departmentsList = [
    'Poli Penyakit Dalam',
    'Poli Bedah Umum',
    'Poli Paru',
    'Poli Jantung & Pembuluh Darah',
    'Poli Anak',
    'Poli Kebidanan & Kandungan',
    'Poli Saraf',
    'Poli Mata',
    'Instalasi Gizi & Dietetika',
    'Rehabilitasi Medis',
    'Instalasi Anestesi & Terapi Intensif'
  ];

  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      // Tab matching
      if (activeTab === 'INBOX' && r.status === 'COMPLETED') return false;
      if (activeTab === 'COMPLETED' && r.status !== 'COMPLETED') return false;

      // Urgency filter
      if (urgencyFilter !== 'ALL' && r.consultationType !== urgencyFilter) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (r.referralNo || '').toLowerCase().includes(q) ||
          (r.patientName || '').toLowerCase().includes(q) ||
          (r.mrn || '').toLowerCase().includes(q) ||
          (r.clinicalDiagnosis || '').toLowerCase().includes(q) ||
          (r.originDepartment || '').toLowerCase().includes(q) ||
          (r.targetDepartment || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [referrals, activeTab, urgencyFilter, searchQuery]);

  const handleCreateReferral = (e) => {
    e.preventDefault();
    if (!newRefForm.clinicalDiagnosis || !newRefForm.consultationQuestion) {
      toast.error('Diagnosis klinis dan pertanyaan konsultasi wajib diisi!');
      return;
    }

    const created = emrSupportingDocsService.createInternalReferral({
      ...newRefForm,
      patientId: activePatient?.id || 'P001',
      patientName: activePatient?.name || 'Pasien Rujukan',
      mrn: activePatient?.mrn || 'MRN-2026-0811'
    });

    setReferrals(prev => [created, ...prev]);
    setIsNewReferralModalOpen(false);
    toast.success(`Rujukan internal ${created.referralNo} berhasil dikirim ke ${newRefForm.targetDepartment}!`);
  };

  const handleSendResponse = () => {
    if (!responseNotes.trim()) {
      toast.error('Mohon ketikkan catatan jawaban / advis konsultasi!');
      return;
    }

    const updated = emrSupportingDocsService.respondInternalReferral(respondingReferral.id, {
      responseNotes,
      responderName: 'dr. Spesialis Konsulen, Sp.P',
      newStatus: 'COMPLETED'
    });

    setReferrals(prev => prev.map(r => r.id === updated.id ? updated : r));
    setRespondingReferral(null);
    setResponseNotes('');
    toast.success('Jawaban konsultasi berhasil dikirim dan tersimpan di EMR!');
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
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Rujukan & Konsultasi Internal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-[10px] font-black uppercase">
                JCI COP.2.1
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Koordinasi Pelayanan Antar-SMF / Spesialis / Poliklinik Rumah Sakit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsNewReferralModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Konsultasi Baru</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('INBOX')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'INBOX'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Permintaan Masuk</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
              {referrals.filter(r => r.status !== 'COMPLETED').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('OUTBOX')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'OUTBOX'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Rujukan Keluar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'COMPLETED'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Selesai / Terjawab</span>
          </button>
        </div>

        {/* Urgency & Search */}
        <div className="flex items-center gap-2">
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Semua Urgensi</option>
            <option value="CITO">🚨 CITO / Emergency</option>
            <option value="ROUTINE">Rutin (24 Jam)</option>
            <option value="CO_MANAGEMENT">Rawat Bersama</option>
            <option value="TRANSFER_OF_CARE">Alih Rawat</option>
          </select>

          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no ruj, pasien, poli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Referral Cards List */}
      <div className="space-y-3">
        {filteredReferrals.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
            <GitFork className="w-12 h-12 text-slate-400" />
            <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada data rujukan internal pada kategori ini</p>
            <p className="text-xs text-slate-400">Gunakan tombol "Buat Konsultasi Baru" untuk mengirim rujukan ke spesialis lain.</p>
          </div>
        ) : (
          filteredReferrals.map((ref) => {
            const isCito = ref.consultationType === 'CITO';
            const isWaiting = ref.status === 'WAITING_RESPONSE';
            
            return (
              <div
                key={ref.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all shadow-xs hover:shadow-md ${
                  isCito 
                    ? 'border-rose-400/50 bg-rose-50/20 dark:bg-rose-950/10' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {ref.referralNo}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {ref.patientName} <span className="font-mono text-slate-400">({ref.mrn})</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCito ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] tracking-wider animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> CITO / EMERGENCY
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                        {ref.consultationType}
                      </span>
                    )}

                    <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                      ref.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {ref.status === 'COMPLETED' ? 'TERJAWAB' : 'MENUNGGU JAWABAN'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Pengirim (Dari)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{ref.originDepartment}</p>
                    <span className="text-[11px] text-slate-500">{ref.referringDoctor}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Tujuan Konsul (Ke)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{ref.targetDepartment}</p>
                    <span className="text-[11px] text-slate-500">{ref.consultantDoctor || 'Spesialis Konsulen Jaga'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">Diagnosis Kerja</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{ref.clinicalDiagnosis}</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-800 dark:text-slate-200">Ikhtisar Klinis:</strong> {ref.clinicalSummary}
                  </p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    <strong className="text-indigo-600 dark:text-indigo-400">Pertanyaan Konsul:</strong> {ref.consultationQuestion}
                  </p>

                  {ref.responseNotes && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                        <span>Jawaban & Rekomendasi Konsulen ({ref.respondedBy}):</span>
                        <span className="font-mono text-[10px] text-slate-400">{ref.respondedAt?.slice(0, 10)}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 text-xs">{ref.responseNotes}</p>
                    </div>
                  )}
                </div>

                {isWaiting && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRespondingReferral(ref)}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Jawab / Beri Rekomendasi Konsultasi</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Buat Konsultasi Baru */}
      {isNewReferralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsNewReferralModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Lembar Permintaan Konsultasi Interdisiplin</h3>
                <p className="text-[11px] text-slate-400">JCI COP.2.1 • Kirim rujukan antar poliklinik / SMF</p>
              </div>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">SMF / Poli Pengirim</label>
                  <select
                    value={newRefForm.originDepartment}
                    onChange={(e) => setNewRefForm(p => ({ ...p, originDepartment: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    {departmentsList.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Dokter Pemohon</label>
                  <input
                    type="text"
                    value={newRefForm.referringDoctor}
                    onChange={(e) => setNewRefForm(p => ({ ...p, referringDoctor: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    SMF / Poli Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRefForm.targetDepartment}
                    onChange={(e) => setNewRefForm(p => ({ ...p, targetDepartment: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    {departmentsList.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Sifat Konsultasi</label>
                  <select
                    value={newRefForm.consultationType}
                    onChange={(e) => setNewRefForm(p => ({ ...p, consultationType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    <option value="ROUTINE">Rutin (Respon dalam 24 Jam)</option>
                    <option value="CITO">CITO / Emergency (&lt; 2 Jam)</option>
                    <option value="CO_MANAGEMENT">Rawat Bersama (Co-Management)</option>
                    <option value="TRANSFER_OF_CARE">Alih Rawat Total</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Diagnosis Klinis Saat Ini <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Apendisitis Akut Perforasi, HT Grade II"
                  value={newRefForm.clinicalDiagnosis}
                  onChange={(e) => setNewRefForm(p => ({ ...p, clinicalDiagnosis: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Ikhtisar Riwayat Penyakit & Terapi</label>
                <textarea
                  rows={2}
                  placeholder="Rangkuman perjalanan penyakit, hasil lab/radiologi penting..."
                  value={newRefForm.clinicalSummary}
                  onChange={(e) => setNewRefForm(p => ({ ...p, clinicalSummary: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Pertanyaan / Harapan Konsultasi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Pertanyaan spesifik kepada dokter konsulen..."
                  value={newRefForm.consultationQuestion}
                  onChange={(e) => setNewRefForm(p => ({ ...p, consultationQuestion: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewReferralModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-600/30"
                >
                  Kirim Permintaan Konsultasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Beri Jawaban Konsultasi */}
      {respondingReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              type="button"
              onClick={() => setRespondingReferral(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              Jawaban Konsultasi Spesialis
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Rujukan #{respondingReferral.referralNo} dari {respondingReferral.originDepartment}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs mb-3 space-y-1">
              <p><strong>Pasien:</strong> {respondingReferral.patientName}</p>
              <p><strong>Pertanyaan:</strong> {respondingReferral.consultationQuestion}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Catatan Jawaban & Saran Tata Laksana <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Ketikkan temuan pemeriksaan dan rekomendasi terapi..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRespondingReferral(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendResponse}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md shadow-indigo-600/30"
                >
                  Kirim Jawaban ke DPJP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
