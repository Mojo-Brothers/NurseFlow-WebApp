import React, { useState, useEffect } from 'react';
import { useEncounterStore } from '../encounter.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { ENCOUNTER_TYPES } from '../../../core/constants.js';

const ENCOUNTER_TYPE_LABELS = {
  EMERGENCY:  '🚨 IGD / Emergency',
  OUTPATIENT: '🏥 Rawat Jalan',
  INPATIENT:  '🛏️ Rawat Inap',
  PLANNED:    '📅 Terencana',
};

const STATUS_CHIP = {
  ACTIVE:      { label: 'Aktif',       color: '#88fb99', text: '#006e2c' },
  DISCHARGED:  { label: 'Dipulangkan', color: '#dee3eb', text: '#424753' },
  TRANSFERRED: { label: 'Transfer',    color: '#ffd8b2', text: '#8b4500' },
};

export default function EncounterPage() {
  const { currentUser } = useAuth();
  const { activeEncounters, isLoading, error, fetchActiveEncounters, openEncounter, discharge } = useEncounterStore();
  const { patients, fetchPatients } = usePatientStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    patientId:       '',
    encounterType:   ENCOUNTER_TYPES.EMERGENCY,
    chiefComplaint:  '',
    admittingDoctor: currentUser?.email || '',
    nurseInCharge:   currentUser?.email || '',
    ward:            'IGD',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchActiveEncounters();
    fetchPatients();
  }, [fetchActiveEncounters, fetchPatients]);

  const handleOpen = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await openEncounter(form, currentUser.email);
      setIsModalOpen(false);
      setForm({ ...form, patientId: '', chiefComplaint: '' });
    } catch (err) {
      alert('Gagal membuka encounter: ' + err.message);
    }
    setIsSaving(false);
  };

  const handleDischarge = async (encounterId) => {
    if (!window.confirm('Konfirmasi: Discharge pasien ini?')) return;
    try {
      await discharge(encounterId, currentUser.email);
    } catch (err) {
      alert('Gagal discharge: ' + err.message);
    }
  };

  const getPatientName = (patientId) => {
    const p = patients.find(p => p.id === patientId);
    return p ? `${p.mrn} — ${p.name}` : patientId;
  };

  const formatTime = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex-row items-center justify-between mb-8">
        <div>
          <h2 className="title">Encounter Management</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Episode Kunjungan Pasien · {activeEncounters.length} Aktif Saat Ini
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined icon-small mr-2" style={{ verticalAlign: 'bottom' }}>add_circle</span>
          Buka Encounter Baru
        </button>
      </div>

      {error && (
        <div className="card mb-4 p-4" style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="card padding-0 overflow-hidden">
        <div className="px-6 py-4 flex-row items-center gap-2"
          style={{ backgroundColor: 'var(--surface-container-low)' }}>
          <span className="material-symbols-outlined text-primary">local_hospital</span>
          <h3 className="font-bold text-base">Encounter Aktif</h3>
          <div className="chip chip-primary ml-auto">{activeEncounters.length} Pasien</div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-container)' }}>
              {['Pasien', 'Tipe', 'Keluhan Utama', 'Dokter', 'Perawat', 'Ward', 'Masuk', 'Status', 'Aksi'].map(h => (
                <th key={h} className="py-3 px-5 font-bold text-xs uppercase text-on-surface-variant">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="9" className="py-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined anim-spin">progress_activity</span>
              </td></tr>
            ) : activeEncounters.length === 0 ? (
              <tr><td colSpan="9" className="py-10 text-center text-on-surface-variant">
                Tidak ada encounter aktif. Mulai dengan membuka encounter baru.
              </td></tr>
            ) : activeEncounters.map(enc => {
              const chip = STATUS_CHIP[enc.status] || STATUS_CHIP.ACTIVE;
              return (
                <tr key={enc.id} className="border-b hover-bg-surface" style={{ borderColor: 'var(--outline-variant)' }}>
                  <td className="py-4 px-5 font-bold text-primary text-sm">{getPatientName(enc.patient_id)}</td>
                  <td className="py-4 px-5 text-sm">{ENCOUNTER_TYPE_LABELS[enc.encounter_type] || enc.encounter_type}</td>
                  <td className="py-4 px-5 text-sm text-on-surface-variant" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {enc.chief_complaint || '—'}
                  </td>
                  <td className="py-4 px-5 text-sm text-on-surface-variant">{enc.admitting_doctor?.split('@')[0] || '—'}</td>
                  <td className="py-4 px-5 text-sm text-on-surface-variant">{enc.nurse_in_charge?.split('@')[0] || '—'}</td>
                  <td className="py-4 px-5 text-sm font-bold">{enc.ward || '—'}</td>
                  <td className="py-4 px-5 text-xs text-on-surface-variant">{formatTime(enc.admitted_at)}</td>
                  <td className="py-4 px-5">
                    <span className="chip" style={{ backgroundColor: chip.color, color: chip.text }}>
                      {chip.label}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {enc.status === 'ACTIVE' && (
                      <button className="btn-outline-small text-error"
                        style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                        onClick={() => handleDischarge(enc.id)}>
                        Discharge
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ width: '520px', maxWidth: '95vw' }}>
            <div className="flex-row items-center justify-between mb-6">
              <h3 className="font-bold text-xl">Buka Encounter Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '4px' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleOpen} className="flex-column gap-4">
              <div>
                <label className="metric-label mb-2 block">PILIH PASIEN *</label>
                <select required className="form-input" value={form.patientId}
                  onChange={e => setForm({ ...form, patientId: e.target.value })}>
                  <option value="">-- Pilih Pasien --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.mrn} — {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="metric-label mb-2 block">TIPE KUNJUNGAN *</label>
                <select required className="form-input" value={form.encounterType}
                  onChange={e => setForm({ ...form, encounterType: e.target.value })}>
                  {Object.entries(ENCOUNTER_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="metric-label mb-2 block">KELUHAN UTAMA *</label>
                <textarea required rows={2} className="form-input" style={{ resize: 'vertical' }}
                  placeholder="Deskripsi keluhan utama pasien..."
                  value={form.chiefComplaint}
                  onChange={e => setForm({ ...form, chiefComplaint: e.target.value })} />
              </div>

              <div className="flex-row gap-4">
                <div className="flex-1">
                  <label className="metric-label mb-2 block">WARD</label>
                  <select className="form-input" value={form.ward}
                    onChange={e => setForm({ ...form, ward: e.target.value })}>
                    {['IGD', 'ICU', 'NICU', 'Poli Umum', 'Poli Jantung', 'Bedah', 'Kebidanan'].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="metric-label mb-2 block">DOKTER PENANGGUNG</label>
                  <input className="form-input" value={form.admittingDoctor}
                    onChange={e => setForm({ ...form, admittingDoctor: e.target.value })}
                    placeholder="email dokter" />
                </div>
              </div>

              <div className="flex-row justify-between mt-4 pt-4" style={{ borderTop: '1px solid var(--outline-variant)' }}>
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : 'Buka Encounter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
