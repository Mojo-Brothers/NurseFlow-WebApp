import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTriageStore } from '../triage.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useTranslation } from 'react-i18next';
import { useClinicalMetrics } from '../../../core/hooks/useClinicalMetrics';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateNEWS2, getTriageColor, calculateAge } from '../../../utils/clinicalCalculators.js';
import { determineEscalation, calculateVelocity } from '../../../core/domain/clinicalEngine.js';
import HistorySparkline from '../../../components/HistorySparkline.jsx';
import KeypadInput from '../../../components/KeypadInput.jsx';
import { useAuth } from '../../../contexts/useAuth.js';
import { logAudit } from '../../../core/services/audit.service.js';
import { AUDIT_ACTIONS, COLLECTIONS } from '../../../core/constants.js';
import { getAllBeds } from '../../ward/services/bed.service.js';
import VitalTouchGrid from '../components/VitalTouchGrid.jsx';

export default function TriagePage() {
  const { t } = useTranslation();
  const { metrics, logAction } = useClinicalMetrics('TRIAGE_CONTROL');
  const { currentUser } = useAuth();

  const { patients, isLoading: patientsLoading, fetchPatients } = usePatientStore();
  const { 
    selectedEncounterId, 
    fetchPatientActiveEncounter,
    selectEncounter,
    liveContext 
  } = useEncounterStore();

  const {
    vitals,
    selectedPatientId,
    submitSuccess,
    serverConflict,
    error: triageError,
    setVital: storeSetVital,
    executeSubmit,
    selectPatient,
    selectBed,
    selectedBedId,
    resetForm,
  } = useTriageStore();

  const setVital = (field, value) => {
    logAction(`vital_input_${field}`);
    storeSetVital(field, value);
  };

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  const bmi = (weight && height) 
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1) 
    : '--';

  const [lastLog, setLastLog] = useState(null);

  const patient = patients.find(p => p.id === selectedPatientId);
  const baseline = patient?.baseline_profile;
  const news2Score  = calculateNEWS2(vitals, baseline);
  const triageColor = getTriageColor(news2Score);

  const hrVelocity = lastLog 
    ? calculateVelocity(vitals.heartRate, lastLog.vitals.heartRate, lastLog.timestamp?.toDate()?.toISOString()) 
    : 0;
  
  const escalation = determineEscalation(news2Score, { hrVelocity });
  
  const [availableBeds, setAvailableBeds] = useState([]);
  const [bedsLoading, setBedsLoading] = useState(false);
  const [activeField, setActiveField] = useState('heartRate'); // 'heartRate' | 'systolicBP' | 'spo2' | 'temperature'

  const VITAL_CONFIG = {
    heartRate:   { label: 'Heart Rate', unit: 'bpm', presets: [60, 75, 90, 110] },
    systolicBP:  { label: 'Systolic BP', unit: 'mmHg', presets: [100, 120, 140, 160] },
    spo2:        { label: 'SpO2 Saturation', unit: '%', presets: [95, 98, 100] },
    temperature: { label: 'Body Temp', unit: '°C', presets: [36.5, 37.5, 38.5] }
  };

  useEffect(() => {
    fetchPatients();
    
    const fetchBeds = async () => {
      setBedsLoading(true);
      const all = await getAllBeds();
      setAvailableBeds(all.filter(b => !b.is_occupied));
      setBedsLoading(false);
    };
    fetchBeds();
  }, [fetchPatients]);

  const handlePatientChange = useCallback(async (patientId) => {
    logAction('patient_select');
    selectPatient(patientId);
    if (patientId) {
      const active = await fetchPatientActiveEncounter(patientId);
      if (active) selectEncounter(active.id);
      setLastLog(null); 
    }
  }, [selectPatient, fetchPatientActiveEncounter, selectEncounter, logAction]);

  useEffect(() => {
    if (liveContext?.patientId) {
      handlePatientChange(liveContext.patientId);
      logAudit({
        action: AUDIT_ACTIONS.VIEW,
        resource_type: COLLECTIONS.TRIAGE_LOGS,
        resource_id: liveContext.encounterId,
        reason: 'START_TRIAGE_ASSESSMENT',
        delta: { patientId: liveContext.patientId }
      });
      return;
    }

    if (patients.length > 0 && !selectedPatientId) {
      const timer = setTimeout(() => {
        handlePatientChange(patients[0].id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [patients, selectedPatientId, handlePatientChange, liveContext]);

  return (
    <div className="p-4 lg:p-8 w-full">
      <div className="flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 md:gap-0">
        <div>
          <h2 className="title text-primary">{t('triage.title')}</h2>
          <div className="flex-row items-center gap-2 mt-1">
             <span className={`chip-${triageColor} font-bold px-2 py-0.5 rounded text-[10px] uppercase`}>
               {escalation.level} {escalation.level !== 'NONE' && `• ${escalation.source}`}
             </span>
             <p className="text-on-surface-variant text-sm">
                {t('triage.rapid_vitals')} — {selectedEncounterId ? `ID: ${selectedEncounterId}` : t('triage.no_encounter')}
             </p>
          </div>
        </div>
        {liveContext ? (
          <div className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg flex-row items-center gap-3 border border-primary animate-pulse">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="text-xs font-bold uppercase tracking-widest">Active Clinical Journey Locked</span>
          </div>
        ) : (
          <select
            className="form-input w-64"
            value={selectedPatientId || ''}
            onChange={(e) => handlePatientChange(e.target.value)}
          >
            {patientsLoading ? <option>Loading...</option> : patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — MRN: {p.mrn}
              </option>
            ))}
          </select>
        )}
      </div>

      {submitSuccess && <div className="card mb-4 p-4 bg-secondary-container text-on-secondary-container flex-row items-center justify-between">
        <span>{t('triage.success_saved')}</span>
        <button onClick={resetForm} className="btn-secondary py-1 text-xs">{t('triage.btn_new')}</button>
      </div>}

      {(triageError || serverConflict) && (
        <div className="card mb-4 p-4 bg-error-container text-on-error-container border-l-4 border-error">
           <span className="font-bold">⚠️ {triageError || serverConflict.message}</span>
        </div>
      )}

      {patient && (
        <ClinicalCard className="mb-6 p-6 flex-row gap-8 items-center sticky top-0 z-[100] shadow-xl" 
             style={{ borderLeft: `6px solid var(--status-${news2Score >= 7 ? 'critical' : 'safe'})` }}>
          <div className="flex-column gap-1 border-r pr-8 border-outline-variant">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Patient Verification</span>
            <div className="flex-row items-center gap-3">
              <span className="text-xl font-extrabold text-primary">{patient.name}</span>
              {patient.arrival_verified && (
                <div className="flex-row items-center gap-1 px-2 py-0.5 bg-success text-white rounded text-[8px] font-black uppercase tracking-widest shadow-sm">
                   <span className="material-symbols-outlined text-[10px]">verified</span>
                   Verified Arrival
                </div>
              )}
              <span className={`chip-${triageColor} font-black px-3 py-1 rounded-full text-[10px] uppercase`}>NEWS2: {news2Score}</span>
            </div>
          </div>
          <div className="flex-1 hidden md:flex flex-row gap-8 items-center">
            <div className="flex-column gap-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Adaptive Baseline</span>
              <span className="text-sm font-bold">HR: {patient.baseline_profile?.value || '70'} bpm</span>
            </div>
            {patient.allergies?.length > 0 && <span className="ipsg-flag flag-allergy">⚠️ Allergy: {patient.allergies.join(', ')}</span>}
          </div>
        </ClinicalCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Rapid Entry Workspace */}
        <div className="lg:col-span-8 flex-column gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {Object.entries(VITAL_CONFIG).map(([key, cfg]) => (
                  <button 
                    key={key}
                    onClick={() => setActiveField(key)}
                    className={`p-4 rounded-3xl border-4 transition-all flex-column items-center gap-1
                      ${activeField === key ? 'border-primary bg-primary/5 shadow-inner' : 'border-outline-variant bg-white opacity-60'}`}
                  >
                     <span className="text-[9px] font-black uppercase tracking-widest">{cfg.label}</span>
                     <span className="text-2xl font-black tabular-nums">{vitals[key] || '--'}</span>
                     <span className="text-[8px] font-bold opacity-40">{cfg.unit}</span>
                  </button>
               ))}
            </div>

            <VitalTouchGrid 
               label={VITAL_CONFIG[activeField].label}
               unit={VITAL_CONFIG[activeField].unit}
               value={vitals[activeField]}
               presets={VITAL_CONFIG[activeField].presets}
               onChange={(val) => setVital(activeField, val)}
            />
        </div>

        {/* RIGHT: Context & Actions */}
        <div className="lg:col-span-4 flex-column gap-6">
          <ClinicalCard className="p-6">
             <div className="flex-row justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Resource Allocation</span>
                <span className="material-symbols-outlined text-sm opacity-40">bed</span>
             </div>
             <div className="grid grid-cols-3 gap-2">
                {availableBeds.map(bed => (
                  <button 
                    key={bed.id}
                    onClick={() => selectBed(bed.id)}
                    className={`py-3 rounded-2xl border-2 text-[10px] font-black transition-all ${selectedBedId === bed.id ? 'bg-primary border-primary text-white shadow-lg' : 'border-outline-variant opacity-60'}`}
                  >
                    {bed.bed_name}
                  </button>
                ))}
             </div>
          </ClinicalCard>

          {/* 🏁 THUMB-ZONE ACTION */}
          <button 
            className="w-full h-24 btn-primary rounded-3xl flex-row items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
            onClick={() => {
               if (!selectedPatientId || !selectedEncounterId) return alert(t('triage.no_encounter'));
               executeSubmit(currentUser.email);
            }}
            disabled={!selectedPatientId || !selectedEncounterId}
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
               <span className="material-symbols-outlined text-2xl">rocket_launch</span>
            </div>
            <div className="text-left">
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Complete Assessment</p>
               <p className="text-lg font-black uppercase tracking-tighter leading-none">Log Clinical Vitals</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
