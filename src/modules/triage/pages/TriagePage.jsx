import React, { useEffect, useRef, useState } from 'react';
import { useTriageStore } from '../triage.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateNEWS2, getTriageColor, calculateAge } from '../../../utils/clinicalCalculators.js';
import { determineEscalation, calculateVelocity } from '../../../core/domain/clinicalEngine.js';
import HistorySparkline from '../../../components/HistorySparkline.jsx';
import KeypadInput from '../../../components/KeypadInput.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';

export default function TriagePage() {
  const { currentUser } = useAuth();
  const intervalRef = useRef(null);

  const { patients, isLoading: patientsLoading, fetchPatients } = usePatientStore();
  const { 
    selectedEncounterId, 
    fetchPatientActiveEncounter,
    selectEncounter 
  } = useEncounterStore();

  const {
    vitals,
    selectedPatientId,
    holdProgress,
    isSubmitting,
    submitSuccess,
    serverConflict,
    error,
    setVital,
    setHoldProgress,
    executeSubmit,
    selectPatient,
  } = useTriageStore();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  
  const bmi = (weight && height) 
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1) 
    : '--';

  const [lastLog, setLastLog] = useState(null);

  // V5 Clinical Intelligence (Adaptive & Granular)
  const patient = patients.find(p => p.id === selectedPatientId);
  const baseline = patient?.baseline_profile;
  const news2Score  = calculateNEWS2(vitals, baseline);
  const triageColor = getTriageColor(news2Score);

  // V5 Velocity Trend Calculation (Real-time Preview)
  const hrVelocity = lastLog 
    ? calculateVelocity(vitals.heartRate, lastLog.vitals.heartRate, lastLog.timestamp?.toDate()?.toISOString()) 
    : 0;
  
  const escalation = determineEscalation(news2Score, { hrVelocity });

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handlePatientChange = async (patientId) => {
    selectPatient(patientId);
    if (patientId) {
      const active = await fetchPatientActiveEncounter(patientId);
      if (active) selectEncounter(active.id);
      
      // Fetch last log for trend visualization
      // In production, this would be a real service call
      setLastLog(null); 
    }
  };

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      handlePatientChange(patients[0].id);
    }
  }, [patients]);

  const startHoldSubmit = () => {
    if (!selectedPatientId || !selectedEncounterId) {
      return alert('Pilih pasien dan pastikan ada Encounter Aktif!');
    }
    setHoldProgress(0);
    const step = 100 / 20;
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += step;
      setHoldProgress(current);
      if (current >= 100) {
        clearInterval(intervalRef.current);
        executeSubmit(currentUser.email);
      }
    }, 100);
  };

  const cancelHoldSubmit = () => {
    clearInterval(intervalRef.current);
    setHoldProgress(0);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex-row items-center justify-between mb-8">
        <div>
          <h2 className="title text-primary">Emergency Triage</h2>
          <div className="flex-row items-center gap-2 mt-1">
             <span className={`chip-${triageColor} font-bold px-2 py-0.5 rounded text-[10px] uppercase`}>
               {escalation.level} {escalation.level !== 'NONE' && `• ${escalation.source}`}
             </span>
             <p className="text-on-surface-variant text-sm">
                Rapid Vital Signs — {selectedEncounterId ? `ID: ${selectedEncounterId}` : '⚠️ NO ENCOUNTER'}
             </p>
          </div>
        </div>
        <select
          className="form-input w-64"
          value={selectedPatientId || ''}
          onChange={(e) => handlePatientChange(e.target.value)}
        >
          {patientsLoading ? <option>Loading...</option> : patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — MRN: {p.mrn} — {p.demographics?.dob || 'No DOB'}
            </option>
          ))}
        </select>
      </div>

      {submitSuccess && <div className="card mb-4 p-4 bg-secondary-container text-on-secondary-container flex-row items-center justify-between">
        <span>✓ Triage V5 Record Saved (Traceability Locked)</span>
        <button onClick={resetForm} className="btn-secondary py-1 text-xs">New Triage</button>
      </div>}

      {serverConflict && (
        <div className="card mb-4 p-4 bg-error-container text-on-error-container border-l-4 border-error animate-pulse">
           <span className="font-bold">{serverConflict.message}</span>
        </div>
      )}

      {patient && (
        <div className={`card mb-6 p-4 flex-row gap-6 bg-surface-container-low border-l-4 ${news2Score >= 7 ? 'animate-pulse-red' : ''}`} 
             style={{ borderLeftColor: news2Score >= 7 ? 'var(--error)' : 'var(--primary)' }}>
          <div className="flex-column gap-1 border-r pr-6 border-outline-variant">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Patient Verification</span>
            <div className="flex-row items-baseline gap-2">
              <span className="text-xl font-extrabold text-primary">{patient.name}</span>
              <span className="text-sm font-bold text-on-surface-variant">({patient.demographics?.gender === 'M' ? 'L' : 'P'})</span>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">DOB: {patient.demographics?.dob} • NIK: {patient.nik}</p>
          </div>
          
          <div className="flex-1 flex-row gap-8 items-center">
            <div className="flex-column gap-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Adaptive Baseline</span>
              <div className="flex-row gap-3">
                <span className="text-sm font-bold">HR: {patient.baseline_profile?.value || '70'} <small className="font-normal opacity-70">bpm</small></span>
                <span className={`chip text-[8px] ${patient.baseline_profile?.chronic_flag ? 'bg-warning' : 'bg-success'}`}>
                  {patient.baseline_profile?.chronic_flag ? 'CHRONIC' : 'NORMAL'}
                </span>
                <span className="text-[10px] opacity-50">Src: {patient.baseline_profile?.source}</span>
              </div>
            </div>

            <div className="flex-row gap-2">
              {patient.allergies?.length > 0 && <span className="ipsg-flag flag-allergy">⚠️ Allergy: {patient.allergies.join(', ')}</span>}
              {patient.safety_flags?.fall_risk && <span className="ipsg-flag flag-fall">⚠️ Fall Risk</span>}
            </div>
          </div>

          <div className="flex-column items-end justify-center">
             <span className="text-[10px] font-bold text-on-surface-variant uppercase">Age</span>
             <span className="text-xl font-black">{calculateAge(patient.demographics?.dob)} <small className="text-xs">YRS</small></span>
          </div>
        </div>
      )}

      <div className="flex-row gap-8">
        <div className="flex-1">
          <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="relative">
               <KeypadInput label="HEART RATE" unit="bpm" value={vitals.heartRate} onChange={(v) => setVital('heartRate', v)} criticalLow={50} criticalHigh={120} />
               <div className="absolute right-2 bottom-2">
                 <HistorySparkline data={[68, 72, 85, 92, 88, 95]} width={60} height={20} color="var(--primary)" />
               </div>
               {Math.abs(hrVelocity) > 0.5 && (
                 <span className={`absolute right-12 top-10 text-[10px] font-bold ${hrVelocity > 0 ? 'text-error' : 'text-success'}`}>
                   {hrVelocity > 0 ? '▲' : '▼'} {Math.abs(hrVelocity).toFixed(1)}/min
                 </span>
               )}
            </div>
            <div className="relative">
              <KeypadInput label="SYSTOLIC BP" unit="mmHg" value={vitals.systolicBP} onChange={(v) => setVital('systolicBP', v)} criticalLow={90} criticalHigh={180} />
              <div className="absolute right-2 bottom-2">
                 <HistorySparkline data={[110, 115, 122, 118, 125, 130]} width={60} height={20} color="var(--secondary)" />
               </div>
            </div>
            <KeypadInput label="SpO2" unit="%" value={vitals.spo2} onChange={(v) => setVital('spo2', v)} criticalLow={92} />
            <KeypadInput label="TEMPERATURE" unit="°C" value={vitals.temperature} onChange={(v) => setVital('temperature', v)} criticalHigh={38.5} />
            
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant flex-column gap-3">
              <div className="flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 block">Weight (kg)</label>
                  <input type="number" className="form-input w-full" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.0" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase mb-1 block">Height (cm)</label>
                  <input type="number" className="form-input w-full" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="flex-row justify-between items-center px-2 py-1 bg-primary-container text-on-primary-container rounded-lg">
                <span className="text-[10px] font-black uppercase">Body Mass Index</span>
                <span className="text-xl font-black">{bmi} <small className="text-[10px] font-normal opacity-70">kg/m²</small></span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 flex-column gap-4">
          <div className="card text-center py-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10 font-black text-4xl uppercase pointer-events-none">v5</div>
            <span className="metric-label">NEWS2 SCORE</span>
            <div className={`text-6xl font-extrabold text-${triageColor}`}>{news2Score}</div>
            <div className={`mt-4 px-4 py-1 rounded-full inline-block text-xs font-black uppercase bg-${triageColor} text-white`}>
              {escalation.level}
            </div>
            {escalation.level !== 'NONE' && (
              <p className="text-[10px] font-bold uppercase mt-1 opacity-60">Source: {escalation.source}</p>
            )}
            <p className="mt-2 text-[10px] text-on-surface-variant italic">Ref: NEWS2 Protocol 2026</p>
          </div>

          <div className="card flex-column items-center justify-center p-0 relative overflow-hidden" style={{ height: '100px', cursor: 'pointer' }} onMouseDown={startHoldSubmit} onMouseUp={cancelHoldSubmit}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${holdProgress}%`, backgroundColor: 'var(--primary)', opacity: 0.2 }} />
            <span className="font-bold text-primary text-xl">HOLD TO LOG</span>
          </div>
        </div>
      </div>
    </div>
  );
}
