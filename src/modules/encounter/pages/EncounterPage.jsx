import React, { useState, useEffect } from 'react';
import { useEncounterStore } from '../encounter.store.js';
import { useTranslation } from 'react-i18next';
import { usePatientStore } from '../../patient/patient.store.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { ENCOUNTER_TYPES } from '../../../core/constants.js';

const ENCOUNTER_TYPE_LABELS = {
  EMERGENCY:  '🚨 IGD / Emergency',
  OUTPATIENT: '🏥 Rawat Jalan',
  INPATIENT:  '🛏️ Rawat Inap',
  PLANNED:    '📅 Terencana',
};

const STATUS_CHIP = {
  ACTIVE:      { label: 'encounter.status.active',       color: '#88fb99', text: '#006e2c' },
  DISCHARGED:  { label: 'encounter.status.discharged',  color: '#dee3eb', text: '#424753' },
  TRANSFERRED: { label: 'encounter.status.transferred', color: '#ffd8b2', text: '#8b4500' },
};

export default function EncounterPage() {
  const { t } = useTranslation();
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
      alert(t('encounter.modal.error_open') + ': ' + err.message);
    }
    setIsSaving(false);
  };

  const handleDischarge = async (encounterId) => {
    if (!window.confirm(t('encounter.modal.confirm_discharge'))) return;
    try {
      await discharge(encounterId, currentUser.email);
    } catch (err) {
      alert(t('encounter.modal.error_discharge') + ': ' + err.message);
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
    <div className="p-8 w-full">
      <div className="flex-row items-center justify-between mb-8">
        <div>
          <h2 className="title">{t('encounter.title')}</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {t('encounter.subtitle', { count: activeEncounters.length })}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined icon-small mr-2" style={{ verticalAlign: 'bottom' }}>add_circle</span>
          {t('encounter.btn_new')}
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
          <h3 className="font-bold text-base">{t('encounter.active_list')}</h3>
          <div className="chip chip-primary ml-auto">{activeEncounters.length} {t('nav.patients')}</div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-container)' }}>
              {['patient', 'type', 'complaint', 'doctor', 'nurse', 'ward', 'admitted', 'status', 'action'].map(key => (
                <th key={key} className="py-3 px-5 font-bold text-xs uppercase text-on-surface-variant">{t(`encounter.table.${key}`)}</th>
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
                {t('encounter.empty_list_hint', { defaultValue: 'No active encounters.' })}
              </td></tr>
            ) : activeEncounters.map(enc => {
              const chip = STATUS_CHIP[enc.status] || STATUS_CHIP.ACTIVE;
              return (
                <tr key={enc.id} className="border-b hover-bg-surface" style={{ borderColor: 'var(--outline-variant)' }}>
                  <td className="py-4 px-5 font-bold text-primary text-sm">{getPatientName(enc.patient_id)}</td>
                  <td className="py-4 px-5 text-sm">{t(`encounter.types.${enc.encounter_type.toLowerCase()}`)}</td>
                  <td className="py-4 px-5 text-sm text-on-surface-variant" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={enc.chief_complaint}>
                    {enc.chief_complaint || '—'}
                  </td>
                  <td className="py-4 px-5 text-sm text-on-surface-variant">{enc.admitting_doctor?.split('@')[0] || '—'}</td>
                  <td className="py-4 px-5 text-sm text-on-surface-variant">{enc.nurse_in_charge?.split('@')[0] || '—'}</td>
                  <td className="py-4 px-5 text-sm font-bold">{enc.ward || '—'}</td>
                  <td className="py-4 px-5 text-xs text-on-surface-variant">{formatTime(enc.admitted_at)}</td>
                  <td className="py-4 px-5">
                    <span className="chip" style={{ backgroundColor: chip.color, color: chip.text }}>
                      {t(chip.label)}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {enc.status === 'ACTIVE' && (
                      <button className="btn-outline-small text-error"
                        style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                        onClick={() => handleDischarge(enc.id)}>
                        {t('encounter.status.discharged')}
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
              <h3 className="font-bold text-xl">{t('encounter.modal.title')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '4px' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleOpen} className="flex-column gap-5 mt-4">
              <div>
                <label className="text-sm font-bold text-on-surface mb-2 block">{t('encounter.modal.patient_label')}</label>
                <select required className="form-input" value={form.patientId}
                  onChange={e => setForm({ ...form, patientId: e.target.value })}>
                  <option value="">{t('encounter.modal.patient_placeholder')}</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.mrn} — {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-on-surface mb-2 block">{t('encounter.modal.type_label')}</label>
                <select required className="form-input" value={form.encounterType}
                  onChange={e => setForm({ ...form, encounterType: e.target.value })}>
                  {Object.keys(ENCOUNTER_TYPES).map(k => (
                    <option key={k} value={ENCOUNTER_TYPES[k]}>
                      {t(`encounter.types.${ENCOUNTER_TYPES[k].toLowerCase()}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-on-surface mb-2 block">{t('encounter.modal.complaint_label')}</label>
                <textarea required rows={2} className="form-input" style={{ resize: 'vertical' }}
                  placeholder={t('encounter.modal.complaint_placeholder')}
                  value={form.chiefComplaint}
                  onChange={e => setForm({ ...form, chiefComplaint: e.target.value })} />
              </div>

              <div className="flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-bold text-on-surface mb-2 block">{t('encounter.modal.ward_label')}</label>
                  <select className="form-input" value={form.ward}
                    onChange={e => setForm({ ...form, ward: e.target.value })}>
                    {['IGD', 'ICU', 'NICU', 'Poli Umum', 'Poli Jantung', 'Bedah', 'Kebidanan'].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-bold text-on-surface mb-2 block">{t('encounter.modal.doctor_label')}</label>
                  <input className="form-input" value={form.admittingDoctor}
                    onChange={e => setForm({ ...form, admittingDoctor: e.target.value })}
                    placeholder="email dokter" />
                </div>
              </div>

              <div className="flex-row justify-end gap-3 mt-6 pt-5" style={{ borderTop: '1px solid var(--outline-variant)' }}>
                <button type="button" className="btn-outline-small" style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }} onClick={() => setIsModalOpen(false)}>
                  {t('encounter.modal.btn_cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? t('encounter.modal.saving') : t('encounter.modal.btn_submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
