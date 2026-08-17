import React, { useState, useEffect } from 'react';
import { useClinicalCoreStore } from '../clinicalCore.store.js';
import { EPISODE_TYPES, EPISODE_STATUSES } from '../services/episodeOfCareEngine.service.js';
import { ENCOUNTER_CLASSES, ENCOUNTER_STATES } from '../services/encounterEngine.service.js';

export default function ClinicalCoreWorkspace() {
  const {
    episodes,
    selectedEpisode,
    setSelectedEpisode,
    encounters,
    appointments,
    workflows,
    billingLedger,
    eventStore,
    fetchCoreData,
    createEpisode,
    updateEpisodeStatus,
    createEncounter,
    transitionEncounter,
    bookAppointment,
    cancelAppointment,
    recordServiceCharge,
    advanceWorkflow
  } = useClinicalCoreStore();

  const [activeTab, setActiveTab] = useState('EPISODES'); // 'EPISODES' | 'ENCOUNTERS' | 'WORKFLOWS' | 'APPOINTMENTS' | 'LEDGER' | 'EVENTS'
  const [selectedEncounterId, setSelectedEncounterId] = useState('');

  // Form states
  const [newEpisodeType, setNewEpisodeType] = useState('OUTPATIENT');
  const [newComplaint, setNewComplaint] = useState('');
  
  // Encounter transition state
  const [targetEncounterState, setTargetEncounterState] = useState('IN_PROGRESS');

  // Service charge simulation state
  const [simCategory, setSimCategory] = useState('LABORATORY');
  const [simCode, setSimCode] = useState('LAB-DL');
  const [simName, setSimName] = useState('Hematologi Lengkap 5-Diff Otomatis');
  const [simPrice, setSimPrice] = useState(110000);

  // Appointment booking state
  const [aptDate, setAptDate] = useState('2026-08-18');
  const [aptTime, setAptTime] = useState('09:20 - 09:40');

  useEffect(() => {
    fetchCoreData();
  }, [fetchCoreData]);

  const handleCreateNewEpisode = async () => {
    if (!newComplaint.trim()) {
      alert('Keluhan utama wajib diisi.');
      return;
    }
    await createEpisode({
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza, S.Pd',
      mrn: 'MRN-2026-001001',
      episodeType: newEpisodeType,
      attendingPhysicianId: 'DOC-1001',
      attendingPhysicianName: 'dr. Siti Wijaya, Sp.PD-KGEH',
      chiefComplaint: newComplaint
    });
    setNewComplaint('');
    alert('Episode of Care baru berhasil diterbitkan!');
  };

  const handleTransitionEncounter = async (encId) => {
    try {
      await transitionEncounter(encId, targetEncounterState, 'Transisi klinis DPJP');
      alert(`Status encounter berhasil diperbarui ke ${targetEncounterState}!`);
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleSimulateServiceCharge = async () => {
    if (!selectedEpisode) {
      alert('Pilih Episode of Care terlebih dahulu.');
      return;
    }
    await recordServiceCharge({
      episodeId: selectedEpisode.id,
      encounterId: encounters[0]?.id || 'ENC-GEN-01',
      patientId: selectedEpisode.patient_id,
      serviceCategory: simCategory,
      serviceCode: simCode,
      serviceName: simName,
      unitPrice: simPrice,
      quantity: 1
    });
    alert(`Event "SERVICE_CHARGED" berhasil ditembakkan untuk ${simName}! Total ledger diperbarui.`);
  };

  const handleBookNewAppointment = async () => {
    try {
      await bookAppointment({
        patientId: 'P-1001',
        patientName: 'Ny. Siti Nurhaliza, S.Pd',
        mrn: 'MRN-2026-001001',
        doctorId: 'DOC-1001',
        doctorName: 'dr. Siti Wijaya, Sp.PD-KGEH',
        clinicId: 'CLI-1001',
        clinicName: 'Poliklinik Penyakit Dalam',
        appointmentDate: aptDate,
        slotTime: aptTime
      });
      alert('Janji temu berhasil dibooking dan diverifikasi bebas bentrok!');
    } catch (err) {
      alert(`Gagal Booking: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Header Core Clinical Ribbon ─── */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 font-mono text-[11px] font-bold border border-teal-500/30">
              SPRINT 1 &bull; CORE CLINICAL BACKBONE
            </span>
            <span className="text-slate-400 text-xs font-mono">JCI 7th Edition & HL7 FHIR R4</span>
          </div>
          <h2 className="text-xl font-headline font-black tracking-tight text-white">
            Pusat Kendali Agregat Klinis & Event Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Akar sistem terpadu: <span className="text-teal-300 font-bold">Patient &rarr; EpisodeOfCare &rarr; Encounter &rarr; Workflow &rarr; Event-Driven Billing</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Episode</span>
            <span className="text-xs font-mono font-black text-teal-400">{selectedEpisode?.episode_number || 'NONE'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Ledger Projection</span>
            <span className="text-xs font-mono font-black text-amber-400">Rp {Number(billingLedger?.total_gross_amount || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('EPISODES')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'EPISODES' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">timeline</span>
          <span>1. EpisodeOfCare Engine ({episodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ENCOUNTERS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ENCOUNTERS' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">alt_route</span>
          <span>2. Encounter State Machine ({encounters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('WORKFLOWS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'WORKFLOWS' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">schema</span>
          <span>3. Clinical Workflow Engine ({workflows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('APPOINTMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'APPOINTMENTS' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span>4. Appointment & Doctor Slots ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'LEDGER' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          <span>5. Event Ledger (SERVICE_CHARGED)</span>
        </button>

        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'EVENTS' ? 'bg-teal-600 text-white shadow-md' : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">stream</span>
          <span>Event Store Stream ({eventStore.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: Episode of Care Manager ─── */}
      {activeTab === 'EPISODES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
              <h4 className="text-xs font-bold text-on-surface uppercase">Terbitkan Episode Perawatan Baru</h4>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Tipe Episode</label>
                <select
                  value={newEpisodeType}
                  onChange={(e) => setNewEpisodeType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface"
                >
                  {Object.values(EPISODE_TYPES).map(t => (
                    <option key={t.code} value={t.code}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Keluhan Utama / Indikasi Masuk</label>
                <textarea
                  value={newComplaint}
                  onChange={(e) => setNewComplaint(e.target.value)}
                  placeholder="Contoh: Nyeri dada menjalar ke lengan kiri, sesak nafas akut..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs text-on-surface"
                />
              </div>
              <button
                onClick={handleCreateNewEpisode}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold shadow-md hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
              >
                Buat Episode of Care
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-on-surface uppercase">Daftar Episode of Care Aktif</h4>
              {episodes.map(ep => (
                <div
                  key={ep.id}
                  onClick={() => setSelectedEpisode(ep)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedEpisode?.id === ep.id
                      ? 'bg-surface-container-highest border-teal-500 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-surface-container-high border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-black text-teal-600">{ep.episode_number}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">{ep.status}</span>
                  </div>
                  <h4 className="text-sm font-black text-on-surface">{ep.patient_name}</h4>
                  <p className="text-xs text-on-surface-variant font-bold mt-0.5">{ep.episode_type} &bull; DPJP: {ep.attending_physician_name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            {selectedEpisode ? (
              <div className="p-6 rounded-3xl bg-surface-container-high border border-outline-variant/30 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
                  <div>
                    <span className="font-mono text-xs font-black text-teal-600 bg-teal-500/10 px-2.5 py-0.5 rounded-md">
                      {selectedEpisode.episode_number}
                    </span>
                    <h3 className="text-lg font-headline font-black text-on-surface mt-1">{selectedEpisode.patient_name}</h3>
                    <p className="text-xs text-on-surface-variant">{selectedEpisode.chief_complaint}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateEpisodeStatus(selectedEpisode.id, 'CLOSED', 'Pasien sembuh & dipulangkan')}
                      className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                    >
                      Tutup Episode (Close)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Tanggal Masuk</span>
                    <p className="text-xs font-bold text-on-surface mt-0.5">{new Date(selectedEpisode.admission_date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Total Encounters</span>
                    <p className="text-xs font-bold text-teal-600 mt-0.5">{selectedEpisode.encounters_count || selectedEpisode.encounter_ids?.length || 0} Kunjungan Terikat</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Status Siklus</span>
                    <p className="text-xs font-bold text-emerald-600 mt-0.5">{selectedEpisode.status}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3">
                  <h4 className="text-xs font-bold text-on-surface uppercase">Pohon Relasi Encounters dalam Episode Ini</h4>
                  <div className="space-y-2">
                    {encounters.map(enc => (
                      <div key={enc.id} className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-primary mr-2">{enc.encounter_number}</span>
                          <span className="font-bold text-on-surface">{enc.encounter_class_label}</span>
                          <p className="text-[11px] text-on-surface-variant">Lokasi: {enc.location_name} &bull; DPJP: {enc.practitioner_name}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600">{enc.encounter_status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-surface-container border text-on-surface-variant">
                Pilih Episode of Care di sebelah kiri.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Encounter State Machine Visualizer ─── */}
      {activeTab === 'ENCOUNTERS' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-4">
            <h4 className="text-sm font-headline font-black text-on-surface uppercase">Encounter Finite State Machine Controller</h4>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedEncounterId || encounters[0]?.id || ''}
                onChange={(e) => setSelectedEncounterId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface flex-1"
              >
                {encounters.map(enc => (
                  <option key={enc.id} value={enc.id}>{enc.encounter_number} &bull; {enc.patient_name} ({enc.encounter_status})</option>
                ))}
              </select>

              <span className="text-on-surface-variant">&rarr;</span>

              <select
                value={targetEncounterState}
                onChange={(e) => setTargetEncounterState(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-surface-container border border-outline-variant/40 text-xs font-bold text-on-surface"
              >
                {Object.values(ENCOUNTER_STATES).map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>

              <button
                onClick={() => handleTransitionEncounter(selectedEncounterId || encounters[0]?.id)}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                Eksekusi Transisi Status
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {encounters.map(enc => (
              <div key={enc.id} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{enc.encounter_number}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600">{enc.encounter_status}</span>
                </div>
                <h4 className="text-sm font-black text-on-surface">{enc.patient_name}</h4>
                <p className="text-xs text-on-surface-variant font-bold">{enc.encounter_class_label}</p>
                <p className="text-[11px] text-on-surface-variant">Dokter: {enc.practitioner_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Clinical Workflow Engine ─── */}
      {activeTab === 'WORKFLOWS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workflows.map(wf => (
              <div key={wf.id} className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-600">{wf.template_code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
                    Step {wf.current_step_index + 1}/{wf.total_steps}
                  </span>
                </div>
                <h4 className="text-sm font-black text-on-surface">{wf.template_name}</h4>
                <p className="text-xs text-on-surface-variant font-bold">Pasien: {wf.patient_name}</p>

                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 text-xs">
                  <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Tahap Saat Ini:</span>
                  <span className="font-mono font-black text-primary">{wf.current_step}</span>
                </div>

                <button
                  onClick={() => advanceWorkflow(wf.id, 'Pemeriksaan selesai, lanjut ke tahap berikutnya.')}
                  className="w-full py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
                >
                  Lanjut Tahap Berikutnya &rarr;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Appointment & Doctor Schedule Engine ─── */}
      {activeTab === 'APPOINTMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase">Reservasi Jadwal Dokter (Slot Management)</h4>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Tanggal Kunjungan</label>
              <input type="date" value={aptDate} onChange={(e) => setAptDate(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Slot Waktu Tersedia</label>
              <select value={aptTime} onChange={(e) => setAptTime(e.target.value)} className="w-full px-3.5 py-2 rounded-xl bg-surface-container border text-xs text-on-surface">
                <option value="08:00 - 08:20">08:00 - 08:20 (Tersedia)</option>
                <option value="08:20 - 08:40">08:20 - 08:40 (Tersedia)</option>
                <option value="09:00 - 09:20">09:00 - 09:20 (Booked)</option>
                <option value="09:20 - 09:40">09:20 - 09:40 (Tersedia)</option>
              </select>
            </div>
            <button onClick={handleBookNewAppointment} className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold shadow-md cursor-pointer">
              Konfirmasi Reservasi
            </button>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-xs font-bold text-on-surface uppercase">Jadwal Perjanjian Pasien Terdaftar</h4>
            {appointments.map(apt => (
              <div key={apt.id} className="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono text-xs font-bold text-primary">{apt.booking_code}</span>
                  <h4 className="text-sm font-black text-on-surface mt-0.5">{apt.patient_name}</h4>
                  <p className="text-xs text-on-surface-variant">{apt.clinic_name} &bull; {apt.appointment_date} ({apt.slot_time})</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">{apt.status}</span>
                  <button onClick={() => cancelAppointment(apt.id, 'Batal oleh pasien')} className="text-rose-600 font-bold text-xs hover:underline cursor-pointer">Batal</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 5: Event Ledger (SERVICE_CHARGED) ─── */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-4">
            <h4 className="text-sm font-headline font-black text-on-surface uppercase">Simulator Event "SERVICE_CHARGED" (Event-Driven Billing)</h4>
            <p className="text-xs text-on-surface-variant">
              Modul Farmasi, Lab, Radiologi, dan Ruangan tidak memodifikasi tabel billing secara langsung, melainkan mempublikasikan event <span className="font-mono text-teal-600 font-bold">SERVICE_CHARGED</span> ke ledger agregator.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Kategori Layanan</label>
                <select value={simCategory} onChange={(e) => setSimCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface">
                  <option value="LABORATORY">Laboratorium</option>
                  <option value="RADIOLOGY">Radiologi</option>
                  <option value="MEDICATION">Farmasi Obat</option>
                  <option value="ROOM">Akomodasi Ruangan</option>
                  <option value="PROCEDURE">Tindakan Medis</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Nama Layanan</label>
                <input type="text" value={simName} onChange={(e) => setSimName(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Tarif (Rp)</label>
                <input type="number" value={simPrice} onChange={(e) => setSimPrice(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-surface-container border text-xs text-on-surface" />
              </div>
              <button onClick={handleSimulateServiceCharge} className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-extrabold shadow-md cursor-pointer">
                Tembakkan SERVICE_CHARGED
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h4 className="text-xs font-bold text-on-surface uppercase">Ledger Projections untuk Episode: {selectedEpisode?.episode_number}</h4>
              <span className="text-base font-headline font-black text-amber-600 font-mono">
                Total Akumulasi: Rp {Number(billingLedger?.total_gross_amount || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="space-y-2">
              {(billingLedger?.charges || []).map(chg => (
                <div key={chg.charge_id} className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-teal-600 mr-2">[{chg.service_category}]</span>
                    <span className="font-bold text-on-surface">{chg.service_name}</span>
                    <p className="text-[10px] text-on-surface-variant font-mono">{new Date(chg.charged_at).toLocaleString('id-ID')}</p>
                  </div>
                  <span className="font-mono font-bold text-amber-600">Rp {Number(chg.total_amount || 0).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: Event Store Stream ─── */}
      {activeTab === 'EVENTS' && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-on-surface uppercase">Universal Domain Event Store (Event Sourcing Stream)</h4>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
            {eventStore.map(evt => (
              <div key={evt.event_id} className="p-3 rounded-xl bg-surface-container-high border border-outline-variant/20 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-teal-600">{evt.event_name} (v{evt.version})</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">{new Date(evt.timestamp).toLocaleString('id-ID')}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Agregat: <strong className="text-primary">{evt.aggregate_type}</strong> ({evt.aggregate_id}) &bull; Aktor: {evt.actor}
                </p>
                <div className="p-2 rounded-lg bg-surface-container font-mono text-[10px] text-on-surface-variant overflow-x-auto">
                  {JSON.stringify(evt.payload)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
