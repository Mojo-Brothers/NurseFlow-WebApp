import React, { useState } from 'react';
import { useEnterpriseMasterStore } from '../../masterData.store.js';
import { enterpriseMasterApiService } from '../../services/enterpriseMasterApi.service.js';
import { queueManagementService } from '../../services/queueManagement.service.js';
import { clinicalEventBusService } from '../../services/clinicalEventBus.service.js';

export default function PatientMasterWorkspace() {
  const { entitiesData, openCreateModal, openEditModal, openDetailDrawer, setActiveEntity, fetchAllEnterpriseData } = useEnterpriseMasterStore();

  const patients = entitiesData['patients'] || [];
  const episodes = entitiesData['episodes_of_care'] || [];
  const encounters = entitiesData['encounters'] || [];
  const admissions = entitiesData['admissions'] || [];
  const transfers = entitiesData['transfers'] || [];
  const discharges = entitiesData['discharges'] || [];
  const queueTickets = entitiesData['queue_tickets'] || [];

  const [selectedPatient, setSelectedPatient] = useState(patients[0] || null);
  const [patientTab, setPatientTab] = useState('PROFILE'); // 'PROFILE' | 'EPISODES' | 'ENCOUNTERS' | 'ADT' | 'QUEUE' | 'EVENTS'
  const [searchQuery, setSearchQuery] = useState('');
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [sourceMrn, setSourceMrn] = useState('');
  const [targetMrn, setTargetMrn] = useState('');
  const [mergeReason, setMergeReason] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);

  // Queue Ticket Generator State
  const [selectedPoli, setSelectedPoli] = useState('Poliklinik Penyakit Dalam');
  const [createdTicket, setCreatedTicket] = useState(null);

  // Filter patients
  const filteredPatients = patients.filter(p => !p.is_deleted).filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.mrn?.toLowerCase().includes(q) ||
      p.nik?.includes(q) ||
      p.bpjs_number?.includes(q) ||
      p.satusehat_ihs_number?.includes(q)
    );
  });

  const patientEpisodes = episodes.filter(e => e.patient_id === selectedPatient?.id);
  const patientEncounters = encounters.filter(e => e.patient_id === selectedPatient?.id);
  const patientAdmissions = admissions.filter(a => a.patient_id === selectedPatient?.id);
  const patientTransfers = transfers.filter(t => t.patient_id === selectedPatient?.id);
  const patientEvents = clinicalEventBusService.getEventHistory();

  const handleGenerateTicket = async () => {
    if (!selectedPatient) return;
    const ticket = await queueManagementService.createQueueTicket({
      patientId: selectedPatient.id,
      patientName: selectedPatient.full_name,
      departmentName: selectedPoli,
      prefix: 'A'
    });
    setCreatedTicket(ticket);
    await fetchAllEnterpriseData();
  };

  const handleExecuteMerge = async () => {
    if (!sourceMrn || !targetMrn) {
      alert('MRN Asal dan MRN Tujuan wajib diisi.');
      return;
    }
    if (sourceMrn.trim().toUpperCase() === targetMrn.trim().toUpperCase()) {
      alert('MRN Asal dan Tujuan tidak boleh sama.');
      return;
    }

    setMergeLoading(true);
    try {
      const res = await enterpriseMasterApiService.mergePatientRecords({
        sourceMrn,
        targetMrn,
        reason: mergeReason || 'Penggabungan rekam medis duplikat terstandar JCI'
      });

      alert(res.summary);
      setIsMergeModalOpen(false);
      setSourceMrn('');
      setTargetMrn('');
      setMergeReason('');
      await fetchAllEnterpriseData();
    } catch (err) {
      alert(`Gagal mengeksekusi merge: ${err.message}`);
    } finally {
      setMergeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Top Control Ribbon ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pasien (Nama, MRN, NIK 16 digit, BPJS, IHS)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-medium text-on-surface focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMergeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-on-surface hover:text-amber-600 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">merge</span>
            <span>Merge MRN Ganda (JCI)</span>
          </button>

          <button
            onClick={() => {
              setActiveEntity('patients');
              openCreateModal();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Registrasi Master Pasien</span>
          </button>
        </div>
      </div>

      {/* ─── 2-Column Split View (Patient List + 360 Detail View) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Patient List */}
        <div className="lg:col-span-5 space-y-3 max-h-[75vh] overflow-y-auto no-scrollbar pr-1">
          {filteredPatients.map(patient => {
            const isSelected = selectedPatient?.id === patient.id;
            const hasIhs = Boolean(patient.satusehat_ihs_number);

            return (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-surface-container-highest border-rose-500/40 shadow-md ring-2 ring-rose-500/20'
                    : 'bg-surface-container-high border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-highest/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-black text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                    {patient.mrn}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {hasIhs ? (
                      <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-teal-500/15 text-teal-600 border border-teal-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                        <span>IHS SYNCED</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-slate-500/15 text-slate-500">
                        NO IHS
                      </span>
                    )}

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                      {patient.status || 'AKTIF'}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-headline font-black text-on-surface mb-1">
                  {patient.full_name}
                </h4>

                <div className="grid grid-cols-2 gap-1 text-[11px] text-on-surface-variant font-mono mb-2">
                  <div>NIK: {patient.nik || '-'}</div>
                  <div>BPJS: {patient.bpjs_number || '-'}</div>
                </div>

                {patient.allergies_summary && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    <span>Alergi: {patient.allergies_summary}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Patient 360 Detail View */}
        <div className="lg:col-span-7">
          {selectedPatient ? (
            <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-6">
              
              {/* Header Info */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-headline font-black text-xl">
                    {selectedPatient.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-black text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">
                        {selectedPatient.mrn}
                      </span>
                      {selectedPatient.satusehat_ihs_number && (
                        <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-md">
                          IHS: {selectedPatient.satusehat_ihs_number}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-headline font-black text-on-surface">
                      {selectedPatient.full_name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveEntity('patients');
                      openEditModal(selectedPatient);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface hover:text-primary transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDetailDrawer(selectedPatient)}
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs cursor-pointer"
                  >
                    JSON FHIR
                  </button>
                </div>
              </div>

              {/* Sub-Tabs: Profile, Episodes, Encounters, ADT, Queue, Events */}
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setPatientTab('PROFILE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    patientTab === 'PROFILE' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Profil
                </button>
                <button
                  onClick={() => setPatientTab('QUEUE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    patientTab === 'QUEUE' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Tiket Antrean
                </button>
                <button
                  onClick={() => setPatientTab('EVENTS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    patientTab === 'EVENTS' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Clinical Events ({patientEvents.length})
                </button>
                <button
                  onClick={() => setPatientTab('EPISODES')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    patientTab === 'EPISODES' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Episodes ({patientEpisodes.length})
                </button>
                <button
                  onClick={() => setPatientTab('ENCOUNTERS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    patientTab === 'ENCOUNTERS' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  Encounters ({patientEncounters.length})
                </button>
                <button
                  onClick={() => setPatientTab('ADT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    patientTab === 'ADT' ? 'bg-rose-600 text-white shadow-xs' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  ADT ({patientAdmissions.length + patientTransfers.length})
                </button>
              </div>

              {/* ─── TAB 1: Profile ─── */}
              {patientTab === 'PROFILE' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Nomor NIK KTP</span>
                      <p className="text-xs font-mono font-bold text-on-surface mt-0.5">{selectedPatient.nik || '-'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Nomor Kartu BPJS</span>
                      <p className="text-xs font-mono font-bold text-on-surface mt-0.5">{selectedPatient.bpjs_number || '-'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Tanggal Lahir / Umur</span>
                      <p className="text-xs font-bold text-on-surface mt-0.5">{selectedPatient.birth_date} (41 Thn)</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Jenis Kelamin</span>
                      <p className="text-xs font-bold text-on-surface mt-0.5">{selectedPatient.gender_label || 'Perempuan'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Kota Domisili</span>
                      <p className="text-xs font-bold text-on-surface mt-0.5">{selectedPatient.city_label || 'Jakarta Selatan'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Status Rekam Medis</span>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">{selectedPatient.status || 'ACTIVE'}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-600">
                        <span className="material-symbols-outlined text-[20px]">notification_important</span>
                        <h4 className="text-xs font-headline font-black uppercase tracking-wider">
                          Peringatan Alergi Pasien (JCI Patient Safety)
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
                        {selectedPatient.allergies?.length || 0} Teridentifikasi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(selectedPatient.allergies || []).map((alg, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-surface-container border border-rose-500/20 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-on-surface">{alg.agent}</p>
                            <p className="text-[10px] text-on-surface-variant">{alg.reaction}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            alg.severity === 'SEVERE' ? 'bg-rose-500 text-white' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}>
                            {alg.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: Queue Ticket Generator ─── */}
              {patientTab === 'QUEUE' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3">
                    <h4 className="text-xs font-bold text-on-surface uppercase">Ambil Nomor Antrean Pelayanan</h4>
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedPoli}
                        onChange={(e) => setSelectedPoli(e.target.value)}
                        className="px-3.5 py-2 rounded-xl bg-surface-container-high border border-outline-variant/40 text-xs font-bold text-on-surface flex-1"
                      >
                        <option value="Poliklinik Penyakit Dalam">Poliklinik Penyakit Dalam</option>
                        <option value="Poliklinik Bedah Umum">Poliklinik Bedah Umum</option>
                        <option value="Poliklinik Anak">Poliklinik Anak</option>
                        <option value="Loket Admisi Rawat Inap">Loket Admisi Rawat Inap</option>
                      </select>
                      <button
                        onClick={handleGenerateTicket}
                        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-extrabold shadow-md cursor-pointer"
                      >
                        Cetak Tiket
                      </button>
                    </div>

                    {createdTicket && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Nomor Antrean Anda</p>
                        <p className="text-3xl font-headline font-black text-emerald-600 font-mono">{createdTicket.queue_number}</p>
                        <p className="text-xs text-on-surface-variant">{createdTicket.department_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 3: Clinical Events Sourcing Timeline ─── */}
              {patientTab === 'EVENTS' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-on-surface uppercase">Jejak Event Sourcing Imutabel</h4>
                  {patientEvents.map(evt => (
                    <div key={evt.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-primary font-bold">{evt.event_type}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono">{new Date(evt.created_at).toLocaleTimeString('id-ID')}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">Agregat: {evt.aggregate_type} ({evt.aggregate_id}) &bull; Aktor: {evt.created_by}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── TAB 4: Episodes ─── */}
              {patientTab === 'EPISODES' && (
                <div className="space-y-3">
                  {patientEpisodes.map(ep => (
                    <div key={ep.id} className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary">{ep.episode_number}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">{ep.status}</span>
                      </div>
                      <h4 className="text-sm font-black text-on-surface">Episode: {ep.episode_type}</h4>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── TAB 5: Encounters ─── */}
              {patientTab === 'ENCOUNTERS' && (
                <div className="space-y-3">
                  {patientEncounters.map(enc => (
                    <div key={enc.id} className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary">{enc.encounter_number}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600">{enc.encounter_status}</span>
                      </div>
                      <h4 className="text-sm font-black text-on-surface">{enc.encounter_type_label}</h4>
                    </div>
                  ))}
                </div>
              )}

              {/* ─── TAB 6: ADT ─── */}
              {patientTab === 'ADT' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-on-surface uppercase">Mutasi & Admisi Pasien</h4>
                  {patientAdmissions.map(adm => (
                    <div key={adm.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs">
                      <strong className="text-emerald-600">[ADMISI]</strong> {adm.admission_number} &bull; Bed: {adm.assigned_bed_id}
                    </div>
                  ))}
                  {patientTransfers.map(trf => (
                    <div key={trf.id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs">
                      <strong className="text-blue-600">[TRANSFER]</strong> Dari {trf.from_bed_id} &rarr; Ke {trf.to_bed_id}
                    </div>
                  ))}
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-surface-container border border-outline-variant/30 text-on-surface-variant">
              Pilih pasien di kolom sebelah kiri untuk melihat profil Patient 360.
            </div>
          )}
        </div>

      </div>

      {/* ─── MRN Merge Modal ─── */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-surface-container-high border border-outline-variant/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-600">
                <span className="material-symbols-outlined text-[24px]">merge</span>
                <h3 className="text-base font-headline font-black text-on-surface">Penggabungan Rekam Medis (MRN Merge)</h3>
              </div>
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Sesuai standar JCI dan KARS, rekonsiliasi ini akan mengalihkan seluruh episode kunjungan, riwayat alergi, dan catatan medis dari MRN Duplikat ke Master Identity utama.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">MRN Asal (Duplikat):</label>
                <input
                  type="text"
                  value={sourceMrn}
                  onChange={(e) => setSourceMrn(e.target.value)}
                  placeholder="Contoh: MRN-2026-001002"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">MRN Target (Utama):</label>
                <input
                  type="text"
                  value={targetMrn}
                  onChange={(e) => setTargetMrn(e.target.value)}
                  placeholder="Contoh: MRN-2026-001001"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-mono text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Alasan Penggabungan Medis:</label>
                <textarea
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  placeholder="Masukkan justifikasi penggabungan data..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs text-on-surface"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsMergeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteMerge}
                disabled={mergeLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {mergeLoading ? (
                  <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
                <span>Eksekusi Penggabungan Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
