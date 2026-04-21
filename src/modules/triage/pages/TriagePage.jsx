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

  useEffect(() => {
    fetchPatients();
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
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex-row items-center justify-between mb-8">
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
        <ClinicalCard className="mb-6 p-6 flex-row gap-8 items-center" 
             style={{ borderLeft: `6px solid var(--status-${news2Score >= 7 ? 'critical' : 'safe'})` }}>
          <div className="flex-column gap-1 border-r pr-8 border-outline-variant">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">{t('triage.patient_verification')}</span>
            <div className="flex-row items-baseline gap-2">
              <span className="text-xl font-extrabold text-primary">{patient.name}</span>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">DOB: {patient.demographics?.dob} • MRN: {patient.mrn}</p>
          </div>
          <div className="flex-1 flex-row gap-8 items-center">
            <div className="flex-column gap-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">{t('triage.adaptive_baseline')}</span>
              <div className="flex-row gap-3">
                <span className="text-sm font-bold">HR: {patient.baseline_profile?.value || '70'} bpm</span>
              </div>
            </div>
            <div className="flex-row gap-2">
              {patient.allergies?.length > 0 && <span className="ipsg-flag flag-allergy">⚠️ Allergy: {patient.allergies.join(', ')}</span>}
            </div>
          </div>
        </ClinicalCard>
      )}

      <div className="flex-row gap-8">
        <div className="flex-1">
            <ClinicalCard style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <KeypadInput label={t('triage.vitals.hr')} unit="bpm" value={vitals.heartRate} onChange={(v) => setVital('heartRate', v)} criticalLow={50} criticalHigh={120} />
              <KeypadInput label={t('triage.vitals.bp')} unit="mmHg" value={vitals.systolicBP} onChange={(v) => setVital('systolicBP', v)} criticalLow={90} criticalHigh={180} />
              <KeypadInput label={t('triage.vitals.spo2')} unit="%" value={vitals.spo2} onChange={(v) => setVital('spo2', v)} criticalLow={92} />
              <KeypadInput label={t('triage.vitals.temp')} unit="°C" value={vitals.temperature} onChange={(v) => setVital('temperature', v)} criticalHigh={38.5} />
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant flex-column gap-3">
                <div className="flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 block">Weight (kg)</label>
                    <input type="number" className="form-input w-full" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 block">Height (cm)</label>
                    <input type="number" className="form-input w-full" value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>
                </div>
                <div className="flex-row justify-between items-center px-4 py-3 bg-white rounded-lg border border-primary">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">BMI</span>
                  <span className="text-2xl font-black tabular-nums">{bmi}</span>
                </div>
              </div>
            </ClinicalCard>
        </div>

        <div className="w-80 flex-column gap-4">
          <ClinicalCard className="text-center py-10 relative overflow-hidden">
            <span className="metric-label">NEWS2 SCORE</span>
            <div className={`text-6xl font-extrabold text-${triageColor} tabular-nums`}>{news2Score}</div>
            <div className={`mt-4 px-4 py-1 rounded-full inline-block text-xs font-black uppercase bg-${triageColor} text-white`}>
              {escalation.level}
            </div>
          </ClinicalCard>

          <button 
            className="btn-primary flex-column items-center justify-center p-0 relative overflow-hidden" 
            style={{ height: '100px' }} 
            onClick={() => {
               if (!selectedPatientId || !selectedEncounterId) return alert(t('triage.no_encounter'));
               logAction('triage_log_execute');
               executeSubmit(currentUser.email);
            }}
            disabled={!selectedPatientId || !selectedEncounterId}
          >
            <span className="material-symbols-outlined text-4xl mb-1">save_as</span>
            <span className="font-black text-xs uppercase tracking-widest">LOG CLINICAL VITALS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
