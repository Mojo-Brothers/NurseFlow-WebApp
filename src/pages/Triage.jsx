import React, { useEffect, useRef } from 'react';
// ✅ Tidak ada import dari 'firebase/firestore' — separation of concerns terjaga
import { useTriageStore } from '../modules/triage/triage.store.js';
import { usePatientStore } from '../modules/patient/patient.store.js';
import { calculateNEWS2, getTriageColor } from '../utils/clinicalCalculators.js';
import KeypadInput from '../components/KeypadInput.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Triage() {
  const { currentUser } = useAuth();
  const intervalRef = useRef(null);

  // ─── Patient State (dari Zustand) ──────────────────────────
  const { patients, isLoading: patientsLoading, fetchPatients, selectPatient } = usePatientStore();

  // ─── Triage State (dari Zustand) ───────────────────────────
  const {
    vitals,
    selectedPatientId,
    holdProgress,
    isSubmitting,
    submitSuccess,
    error,
    setVital,
    setHoldProgress,
    executeSubmit,
  } = useTriageStore();

  const news2Score  = calculateNEWS2(vitals);
  const triageColor = getTriageColor(news2Score);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      selectPatient(patients[0].id);
    }
  }, [patients, selectedPatientId, selectPatient]);

  const startHoldSubmit = () => {
    if (!selectedPatientId) return alert('Pilih pasien terlebih dahulu!');
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
          <p className="text-on-surface-variant text-sm mt-1">Rapid Vital Signs Assessment (JCI Mode)</p>
        </div>
        <select
          className="form-input w-64"
          value={selectedPatientId || ''}
          onChange={(e) => selectPatient(e.target.value)}
        >
          {patientsLoading && <option value="">Memuat pasien...</option>}
          {!patientsLoading && patients.length === 0 && <option value="">Tidak ada pasien</option>}
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.mrn} - {p.name}</option>
          ))}
        </select>
      </div>

      {submitSuccess && (
        <div className="card mb-4 p-4 flex-row items-center gap-2"
          style={{ backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}>
          <span className="material-symbols-outlined">check_circle</span>
          Triage berhasil disimpan & audit log JCI tercatat otomatis!
        </div>
      )}

      {error && (
        <div className="card mb-4 p-4" style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="flex-row gap-8">
        <div className="flex-1">
          <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <KeypadInput label="HEART RATE" unit="bpm"
              value={vitals.heartRate} onChange={(v) => setVital('heartRate', v)}
              criticalLow={50} criticalHigh={120} />
            <KeypadInput label="SYSTOLIC BP" unit="mmHg"
              value={vitals.systolicBP} onChange={(v) => setVital('systolicBP', v)}
              criticalLow={90} criticalHigh={180} />
            <KeypadInput label="DIASTOLIC BP" unit="mmHg"
              value={vitals.diastolicBP} onChange={(v) => setVital('diastolicBP', v)}
              criticalLow={50} criticalHigh={110} />
            <KeypadInput label="SpO2" unit="%"
              value={vitals.spo2} onChange={(v) => setVital('spo2', v)}
              criticalLow={91} criticalHigh={100} />
            <div style={{ gridColumn: 'span 2' }}>
              <KeypadInput label="TEMPERATURE" unit="°C"
                value={vitals.temperature} onChange={(v) => setVital('temperature', v)}
                criticalLow={35} criticalHigh={39} />
            </div>
          </div>
        </div>

        <div className="w-80 flex-column gap-4">
          <div className="card text-center flex-column justify-center items-center py-10">
            <span className="metric-label mb-2">NEWS2 SCORE</span>
            <div className={`text-6xl font-extrabold text-${triageColor}`}>{news2Score}</div>
            <p className="mt-4 text-on-surface-variant text-sm font-bold uppercase">
              {triageColor === 'red'    ? 'High Risk / Emergency' :
               triageColor === 'orange' ? 'Medium Risk / Urgent'  :
               triageColor === 'yellow' ? 'Low Risk / Ward'       : 'Routine Assessment'}
            </p>
          </div>

          <div
            className="card flex-column items-center justify-center p-0 relative overflow-hidden"
            style={{ height: '100px', cursor: isSubmitting ? 'not-allowed' : 'pointer', userSelect: 'none' }}
            onMouseDown={startHoldSubmit}
            onMouseUp={cancelHoldSubmit}
            onMouseLeave={cancelHoldSubmit}
            onTouchStart={startHoldSubmit}
            onTouchEnd={cancelHoldSubmit}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${holdProgress}%`,
              backgroundColor: 'var(--primary)',
              opacity: 0.2,
              transition: 'width 0.1s linear'
            }} />
            <span className="font-bold text-primary text-xl z-10">
              {isSubmitting ? 'MENCATAT...' : 'HOLD TO LOG VITALS'}
            </span>
            <span className="text-xs text-on-surface-variant z-10 mt-1">
              Tahan 2 detik (JCI Double-Confirm Protocol)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
