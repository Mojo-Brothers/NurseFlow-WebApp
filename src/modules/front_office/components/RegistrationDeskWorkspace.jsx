import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useFrontOfficeStore } from '../store/frontOffice.store.js';
import MultiQueueDisplayBoard from './MultiQueueDisplayBoard.jsx';
import BpjsBridgingControlModal from './BpjsBridgingControlModal.jsx';
import PatientWristbandPrintPreview from './PatientWristbandPrintPreview.jsx';

export default function RegistrationDeskWorkspace() {
  const {
    registrations,
    selectedRegistration,
    fetchFrontOfficeData,
    registerNewPatient,
    registerExistingPatient,
    issuedSeps,
    taskLogs,
    outboxLogs
  } = useFrontOfficeStore();

  const [activeTab, setActiveTab] = useState('REGISTRATION'); // 'REGISTRATION' | 'QUEUE_BOARD' | 'BPJS_LOGS' | 'OUTBOX'
  const [regMode, setRegMode] = useState('NEW'); // 'NEW' | 'EXISTING'

  // New Patient Form state
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [gender, setGender] = useState('FEMALE');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [phone, setPhone] = useState('081299887766');
  const [guarantorId, setGuarantorId] = useState('GRN-BPJS');
  const [guarantorName, setGuarantorName] = useState('BPJS Kesehatan');
  const [regType, setRegType] = useState('RAWAT_JALAN');
  const [departmentId, setDepartmentId] = useState('CLI-1001');
  const [departmentName, setDepartmentName] = useState('Poliklinik Penyakit Dalam');
  const [doctorId, setDoctorId] = useState('DOC-1001');
  const [doctorName, setDoctorName] = useState('dr. Siti Wijaya, Sp.PD-KGEH');
  const [isPriority, setIsPriority] = useState(false);
  const [generalConsentSigned, setGeneralConsentSigned] = useState(true);
  const [financialConsentSigned, setFinancialConsentSigned] = useState(true);

  // Modals state
  const [activeBpjsModalReg, setActiveBpjsModalReg] = useState(null);
  const [activeWristbandPatient, setActiveWristbandPatient] = useState(null);

  useEffect(() => {
    fetchFrontOfficeData();
  }, [fetchFrontOfficeData]);

  const handleRegisterNew = async (e) => {
    e.preventDefault();
    if (!fullName || !nik) {
      toast.error('Nama lengkap dan NIK wajib diisi.');
      return;
    }
    if (!generalConsentSigned) {
      toast.error('General Consent wajib ditandatangani sebelum Episode of Care dapat diterbitkan.');
      return;
    }

    try {
      const res = await registerNewPatient({
        fullName,
        nik,
        gender,
        birthDate,
        birthPlace: 'Jakarta',
        phoneNumber: phone,
        address: 'Jl. Merdeka No. 45, Jakarta Pusat',
        guarantorId,
        guarantorName,
        insuranceCardNumber: guarantorId === 'GRN-BPJS' ? '0001234567891' : '',
        departmentId,
        departmentName,
        doctorId,
        doctorName,
        registrationType: regType,
        isPriority,
        consentSigner: fullName,
        signerRelationship: 'SELF'
      });

      toast.success(`✅ Registrasi Berhasil!\nMRN: ${res.registration.mrn} • Tiket: ${res.registration.ticket_number}\nEpisode: ${res.episode.episode_number}`, { duration: 5000 });
      setFullName('');
      setNik('');
      setActiveWristbandPatient(res.registration);
    } catch (err) {
      toast.error(`Gagal Registrasi: ${err.message}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* ─── Top Banner ─── */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-mono text-[11px] font-bold border border-teal-500/30">
              SPRINT 2 &bull; FRONT OFFICE & ACCESS ENGINE
            </span>
            <span className="text-slate-400 text-xs font-mono">Transactional Outbox & JCI IPSG 1</span>
          </div>
          <h2 className="text-xl font-headline font-black tracking-tight text-white">
            Pusat Pendaftaran, Antrean & Bridging BPJS Faskes
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Otomasi registrasi terpadu: <span className="text-teal-300 font-bold">Pasien Baru &rarr; General Consent &rarr; Episode &rarr; Encounter &rarr; Tiket Antrean &rarr; SEP BPJS</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Registrasi</span>
            <span className="text-xs font-mono font-black text-teal-400">{registrations.length} Pasien</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Outbox Events</span>
            <span className="text-xs font-mono font-black text-purple-400">{outboxLogs.length} Events</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('REGISTRATION')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'REGISTRATION' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
          <span>1. Meja Pendaftaran ({registrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('QUEUE_BOARD')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'QUEUE_BOARD' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">campaign</span>
          <span>2. Papan Antrean & Voice Synthesizer</span>
        </button>

        <button
          onClick={() => setActiveTab('BPJS_LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'BPJS_LOGS' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>3. BPJS V-Claim & Antrean Mobile JKN ({issuedSeps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OUTBOX')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'OUTBOX' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">move_to_inbox</span>
          <span>4. Transactional Outbox Logs ({outboxLogs.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: Registration Desk ─── */}
      {activeTab === 'REGISTRATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="text-sm font-headline font-black text-on-surface uppercase">Formulir Pendaftaran Pasien</h3>
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRegMode('NEW')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${regMode === 'NEW' ? 'bg-teal-600 text-white' : 'text-on-surface-variant'}`}
                >
                  Pasien Baru
                </button>
                <button
                  type="button"
                  onClick={() => setRegMode('EXISTING')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${regMode === 'EXISTING' ? 'bg-teal-600 text-white' : 'text-on-surface-variant'}`}
                >
                  Pasien Lama
                </button>
              </div>
            </div>

            <form onSubmit={handleRegisterNew} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Nama Lengkap Pasien *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Nama Lengkap Pasien Sesuai KTP"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">NIK (16 Digit) *</label>
                  <input
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="Contoh: 16 Digit NIK Pasien"
                    maxLength={16}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-mono text-on-surface"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
                  >
                    <option value="FEMALE">Perempuan</option>
                    <option value="MALE">Laki-Laki</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-mono text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Penjamin / Asuransi</label>
                  <select
                    value={guarantorId}
                    onChange={(e) => {
                      setGuarantorId(e.target.value);
                      setGuarantorName(e.target.value === 'GRN-BPJS' ? 'BPJS Kesehatan' : 'Umum / Pribadi');
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
                  >
                    <option value="GRN-BPJS">BPJS Kesehatan (JKN)</option>
                    <option value="GRN-PRIBADI">Umum / Pribadi (Cash)</option>
                    <option value="GRN-ASURANSI">Asuransi Swasta / Mandiri Inhealth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Jenis Pelayanan</label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs font-bold text-on-surface"
                  >
                    <option value="RAWAT_JALAN">Rawat Jalan (Poliklinik)</option>
                    <option value="IGD">Gawat Darurat (IGD)</option>
                    <option value="RAWAT_INAP">Rawat Inap Langsung</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase block">Persetujuan Pasien (JCI HPK):</span>
                <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalConsentSigned}
                    onChange={(e) => setGeneralConsentSigned(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>General Consent (Persetujuan Umum Perawatan & Tata Tertib)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={financialConsentSigned}
                    onChange={(e) => setFinancialConsentSigned(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Financial Consent (Persetujuan Tanggung Jawab Finansial)</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="priorityCheck"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                  className="rounded text-teal-600 cursor-pointer"
                />
                <label htmlFor="priorityCheck" className="text-xs font-bold text-on-surface cursor-pointer">
                  Pasien Prioritas Khusus (Geriatri &gt;60 th, Disabilitas, Balita)
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-teal-600 text-white text-xs font-extrabold shadow-lg hover:scale-[1.01] active:scale-99 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span>Daftarkan Pasien & Terbitkan Tiket Antrean</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h4 className="text-xs font-bold text-on-surface uppercase">Riwayat Registrasi Pasien Hari Ini</h4>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
              {registrations.map(reg => (
                <div key={reg.id} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-md">
                        {reg.ticket_number || 'A-001'}
                      </span>
                      <h4 className="text-sm font-black text-on-surface mt-1">{reg.patient_name}</h4>
                      <p className="text-xs text-on-surface-variant font-mono">MRN: {reg.mrn} &bull; NIK: {reg.nik}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
                      {reg.registration_type}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-on-surface-variant block font-bold">Penjamin:</span>
                      <strong className="text-primary">{reg.guarantor_name}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      {reg.guarantor_id === 'GRN-BPJS' && (
                        <button
                          onClick={() => setActiveBpjsModalReg(reg)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          <span>{reg.sep_number ? 'Lihat SEP' : 'Buat SEP'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setActiveWristbandPatient(reg)}
                        className="px-2.5 py-1 rounded-lg bg-surface-container-highest border text-on-surface font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">print</span>
                        <span>Gelang JCI</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Multi-Queue Display Board ─── */}
      {activeTab === 'QUEUE_BOARD' && <MultiQueueDisplayBoard />}

      {/* ─── TAB 3: BPJS Task & SEP Logs ─── */}
      {activeTab === 'BPJS_LOGS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase">Daftar SEP BPJS V-Claim yang Telah Diterbitkan</h4>
            <div className="space-y-2">
              {issuedSeps.map(sep => (
                <div key={sep.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-teal-600">{sep.sep_number}</span>
                    <span className="text-[10px] font-bold text-emerald-600">{sep.status}</span>
                  </div>
                  <p className="font-bold text-on-surface">{sep.patient_name} (Kartu: {sep.bpjs_card_number})</p>
                  <p className="text-[11px] text-on-surface-variant">Poli: {sep.destination_poli_name} &bull; DPJP: {sep.dpjp_name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase">Log Sinkronisasi Task ID BPJS Antrean Mobile JKN</h4>
            <div className="space-y-2">
              {taskLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-primary">Task {log.task_id}: {log.task_name}</span>
                    <span className="font-mono text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">SYNCED 200 OK</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-mono">{log.task_time_iso}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Transactional Outbox Logs ─── */}
      {activeTab === 'OUTBOX' && (
        <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <div>
              <h4 className="text-xs font-bold text-on-surface uppercase">Transactional Outbox Event Stream (Dual-Write Protection)</h4>
              <p className="text-[11px] text-on-surface-variant">Event distaged secara atomik bersama mutasi database dan dipublikasikan via background worker.</p>
            </div>
            <span className="font-mono text-xs font-bold text-teal-600">{outboxLogs.length} Total Events Staged</span>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
            {outboxLogs.map(evt => (
              <div key={evt.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-teal-600">{evt.event_name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${evt.published ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                    {evt.published ? 'PUBLISHED' : 'PENDING'}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant font-mono">
                  ID: {evt.id} &bull; Agregat: {evt.aggregate_type} ({evt.aggregate_id}) &bull; Retries: {evt.retry_count}
                </p>
                <div className="p-2 rounded-lg bg-surface-container-highest font-mono text-[10px] text-on-surface-variant overflow-x-auto">
                  {JSON.stringify(evt.payload)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {activeBpjsModalReg && (
        <BpjsBridgingControlModal
          registration={activeBpjsModalReg}
          onClose={() => setActiveBpjsModalReg(null)}
        />
      )}

      {activeWristbandPatient && (
        <PatientWristbandPrintPreview
          patient={activeWristbandPatient}
          onClose={() => setActiveWristbandPatient(null)}
        />
      )}

    </div>
  );
}
