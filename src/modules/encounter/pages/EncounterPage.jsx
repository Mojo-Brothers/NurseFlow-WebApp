import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEncounterStore } from '../encounter.store.js';
import { useTranslation } from 'react-i18next';
import { usePatientStore } from '../../patient/patient.store.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { ENCOUNTER_TYPES } from '../../../core/constants.js';
import { formatPatientName } from '../../../utils/displayUtils.js';

const ENCOUNTER_TYPE_LABELS = {
  EMERGENCY:  '🚨 IGD / Emergency',
  OUTPATIENT: '🏥 Rawat Jalan',
  INPATIENT:  '🛏️ Rawat Inap',
  PLANNED:    '📅 Terencana',
};

const STATUS_CHIP = {
  ACTIVE:      { label: 'encounter.status.active',       color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  DISCHARGED:  { label: 'encounter.status.discharged',  color: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
  TRANSFERRED: { label: 'encounter.status.transferred', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};

export default function EncounterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { activeEncounters, isLoading, error, fetchActiveEncounters, openEncounter, discharge, setLiveContext } = useEncounterStore();
  const { patients, fetchPatients } = usePatientStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const getPatientName = (patientId) => formatPatientName(patientId, patients);

  const formatTime = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleString('id-ID', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredEncounters = activeEncounters
    .filter(enc => 
      patients.some(p => p.id === enc.patient_id) && // FILTER OUT ORPHAN ENCOUNTERS
      (getPatientName(enc.patient_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enc.chief_complaint || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enc.ward || '').toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const timeA = a.admitted_at?.toDate ? a.admitted_at.toDate().getTime() : (a.created_at?.toDate ? a.created_at.toDate().getTime() : 0);
      const timeB = b.admitted_at?.toDate ? b.admitted_at.toDate().getTime() : (b.created_at?.toDate ? b.created_at.toDate().getTime() : 0);
      return timeB - timeA;
    });

  return (
    <div className="p-4 lg:p-8 w-full max-w-full">
      <div className="flex-row items-center justify-between mb-8 gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-black tracking-tighter text-on-surface leading-tight">{t('encounter.title')}</h2>
          <p className="text-on-surface-variant text-sm mt-1 font-bold opacity-70">
            {t('encounter.subtitle', { count: activeEncounters.length })}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container/20 text-error rounded-xl border border-error/30 font-bold text-sm shadow-inner flex items-center gap-3">
          <span className="material-symbols-outlined">warning</span> {error}
        </div>
      )}

      {/* ─── Premium Glass Command Bar ─── */}
      <div className="relative mb-8 z-20">
        <div className="glass-panel rounded-2xl p-3 flex-row items-center justify-between gap-4 shadow-premium-soft">
          <div className="flex-1 flex-row items-center gap-3 px-3">
            <span className="material-symbols-outlined text-primary/70 text-[24px]">search</span>
            <input 
              type="text" 
              placeholder="Cari Kunjungan (Nama Pasien, Keluhan, Ruangan)..."
              className="w-full bg-transparent border-none text-on-surface focus:ring-0 font-medium placeholder-on-surface-variant/50 h-10 px-2"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="h-10 w-[1px] bg-outline-variant/50 hidden md:block"></div>
          
          <div className="flex-row items-center gap-3">
            <button 
              className="btn-primary"
              onClick={() => setIsModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              <span className="font-bold text-sm hidden sm:inline">{t('encounter.btn_new')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── UNIFIED PREMIUM CARD GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10 relative z-10">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <span className="font-bold text-on-surface-variant/60 animate-pulse">Menyiapkan Data Kunjungan...</span>
          </div>
        ) : filteredEncounters.length === 0 ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4 opacity-40">
            <div className="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-2 shadow-inner">
              <span className="material-symbols-outlined text-[64px] text-on-surface-variant">person_search</span>
            </div>
            <h3 className="text-2xl font-headline font-black tracking-tight">Tidak Ada Data Kunjungan Aktif</h3>
            <p className="text-sm max-w-[300px] mx-auto text-center">{t('encounter.empty_list_hint', { defaultValue: 'No active encounters.' })}</p>
          </div>
        ) : (
          filteredEncounters.map(enc => {
            const chip = STATUS_CHIP[enc.status] || STATUS_CHIP.ACTIVE;
            const isEmergency = enc.encounter_type === 'EMERGENCY' || enc.encounter_type === 'IGD';
            return (
              <div 
                key={enc.id} 
                className="clinical-card group flex flex-col relative overflow-hidden cursor-pointer hover:border-primary transition-all"
                onClick={() => {
                  setLiveContext(enc.patient_id, enc.id);
                  navigate('/emr-rj');
                }}
              >
                {/* Status Edge Indicator */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${isEmergency ? 'bg-error shadow-glow-error' : 'bg-primary'}`}></div>
                
                <div className="flex-row justify-between items-start mb-4 pl-3">
                  <div>
                    <h3 className="font-headline font-black text-lg text-on-surface leading-tight group-hover:text-primary transition-colors">{getPatientName(enc.patient_id)}</h3>
                    <div className="flex-row items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono font-bold bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">{enc.encounter_type || 'EMERGENCY'}</span>
                      <span className="text-[10px] font-bold text-on-surface-variant/50 uppercase">{formatTime(enc.admitted_at)}</span>
                    </div>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-wider ${chip.color}`}>
                    {t(chip.label)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 pl-3">
                  <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/50">Lokasi / Ruang</span>
                    <span className="text-xs font-bold truncate text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-primary">bed</span> {enc.ward || '—'}
                    </span>
                  </div>
                  <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/50">DPJP</span>
                    <span className="text-xs font-bold truncate text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-primary">stethoscope</span> {enc.admitting_doctor?.split('@')[0] || '—'}
                    </span>
                  </div>
                </div>

                <div className="mb-4 pl-3">
                  <span className="text-[10px] font-medium text-on-surface-variant/60 line-clamp-2 leading-relaxed bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20 italic">
                    <strong className="font-bold text-on-surface-variant not-italic block mb-0.5">Keluhan Utama:</strong> 
                    {enc.chief_complaint || '—'}
                  </span>
                </div>

                <div className="mt-auto pt-3 border-t border-outline-variant/30 pl-3 flex-row justify-between items-center">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/60">
                    <span className="material-symbols-outlined text-[14px]">medical_services</span> {enc.nurse_in_charge?.split('@')[0] || '—'}
                  </div>
                  {enc.status === 'ACTIVE' && (
                    <button 
                      className="text-[10px] font-black uppercase tracking-widest text-error hover:bg-error-container hover:text-on-error-container px-3 py-1.5 rounded-lg transition-colors border border-error/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDischarge(enc.id);
                      }}
                    >
                      {t('encounter.status.discharged')}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Premium Glass Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 relative shadow-2xl animate-scale-in">
            <div className="flex-row items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                  <span className="material-symbols-outlined">post_add</span>
                </div>
                <div>
                  <h3 className="font-headline font-black text-xl leading-tight">{t('encounter.modal.title')}</h3>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">JCI Admisi Pasien</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-surface-container hover:bg-outline-variant flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleOpen} className="flex flex-col gap-5">
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {t('encounter.modal.patient_label')} *
                </label>
                <select required className="form-input shadow-inner" value={form.patientId}
                  onChange={e => setForm({ ...form, patientId: e.target.value })}>
                  <option value="">{t('encounter.modal.patient_placeholder')}</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.mrn} — {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {t('encounter.modal.type_label')} *
                </label>
                <select required className="form-input shadow-inner" value={form.encounterType}
                  onChange={e => setForm({ ...form, encounterType: e.target.value })}>
                  {Object.keys(ENCOUNTER_TYPES).map(k => (
                    <option key={k} value={ENCOUNTER_TYPES[k]}>
                      {t(`encounter.types.${(ENCOUNTER_TYPES[k] || 'EMERGENCY').toLowerCase()}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {t('encounter.modal.complaint_label')} *
                </label>
                <textarea required rows={3} className="form-input shadow-inner rounded-2xl" style={{ resize: 'vertical' }}
                  placeholder={t('encounter.modal.complaint_placeholder')}
                  value={form.chiefComplaint}
                  onChange={e => setForm({ ...form, chiefComplaint: e.target.value })} />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {t('encounter.modal.ward_label')}
                  </label>
                  <select className="form-input shadow-inner" value={form.ward}
                    onChange={e => setForm({ ...form, ward: e.target.value })}>
                    {['IGD', 'ICU', 'NICU', 'Poli Umum', 'Poli Jantung', 'Bedah', 'Kebidanan'].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> {t('encounter.modal.doctor_label')}
                  </label>
                  <input className="form-input shadow-inner" value={form.admittingDoctor}
                    onChange={e => setForm({ ...form, admittingDoctor: e.target.value })}
                    placeholder="Email dokter..." />
                </div>
              </div>

              <div className="flex-row justify-end gap-3 mt-6 pt-5 border-t border-outline-variant/30">
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>
                  {t('encounter.modal.btn_cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  ) : null}
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
