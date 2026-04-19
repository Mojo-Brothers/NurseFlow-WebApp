import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getPatients } from '../services/patientService';
import { calculateNEWS2, getTriageColor } from '../utils/clinicalCalculators';
import KeypadInput from '../components/KeypadInput';
import { useAuth } from '../contexts/AuthContext';

export default function Triage() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Vitals State
  const [vitals, setVitals] = useState({
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    spo2: '',
    temperature: ''
  });

  // Hold-to-Submit State
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    async function load() {
      const data = await getPatients();
      setPatients(data);
      if (data.length > 0) setSelectedPatientId(data[0].id);
    }
    load();
  }, []);

  const news2Score = calculateNEWS2(vitals);
  const triageColor = getTriageColor(news2Score);

  const updateVital = (key, value) => {
    setVitals(prev => ({ ...prev, [key]: value }));
  };

  const startHoldSubmit = () => {
    if (!selectedPatientId) return alert("Select a patient first!");
    
    setHoldProgress(0);
    const step = 100 / 20; // 2 seconds total, 100ms intervals = 20 steps
    let currentProgress = 0;

    intervalRef.current = setInterval(() => {
      currentProgress += step;
      setHoldProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(intervalRef.current);
        executeSubmit();
      }
    }, 100);
  };

  const cancelHoldSubmit = () => {
    clearInterval(intervalRef.current);
    setHoldProgress(0);
  };

  const executeSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'triage_logs'), {
        patientId: selectedPatientId,
        vitals: {
          heartRate: Number(vitals.heartRate),
          systolicBP: Number(vitals.systolicBP),
          diastolicBP: Number(vitals.diastolicBP),
          spo2: Number(vitals.spo2),
          temperature: Number(vitals.temperature),
        },
        news2_score: news2Score,
        triage_level: triageColor,
        assessed_by: currentUser.email,
        timestamp: serverTimestamp()
      });
      alert('Triage successfully recorded!');
      // Reset form
      setVitals({ heartRate:'', systolicBP:'', diastolicBP:'', spo2:'', temperature:'' });
      setHoldProgress(0);
    } catch (error) {
      console.error(error);
      alert('Failed to submit triage data.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex-row items-center justify-between mb-8">
        <div>
          <h2 className="title text-primary">Emergency Triage</h2>
          <p className="text-on-surface-variant text-sm mt-1">Rapid Vital Signs Assessment (JCI Mode)</p>
        </div>
        
        {/* Patient Selector */}
        <select 
          className="form-input w-64" 
          value={selectedPatientId} 
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          {patients.length === 0 ? <option value="">No Patients Available</option> : null}
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.mrn} - {p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-row gap-8">
        {/* Vital Signs Grid */}
        <div className="flex-1">
          <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <KeypadInput 
              label="HEART RATE" unit="bpm" 
              value={vitals.heartRate} onChange={(v) => updateVital('heartRate', v)}
              criticalLow={50} criticalHigh={120} 
            />
            <KeypadInput 
              label="SYSTOLIC BP" unit="mmHg" 
              value={vitals.systolicBP} onChange={(v) => updateVital('systolicBP', v)}
              criticalLow={90} criticalHigh={180} 
            />
            <KeypadInput 
              label="DIASTOLIC BP" unit="mmHg" 
              value={vitals.diastolicBP} onChange={(v) => updateVital('diastolicBP', v)}
              criticalLow={50} criticalHigh={110} 
            />
            <KeypadInput 
              label="SpO2" unit="%" 
              value={vitals.spo2} onChange={(v) => updateVital('spo2', v)}
              criticalLow={91} criticalHigh={100} 
            />
            <div style={{gridColumn: 'span 2'}}>
              <KeypadInput 
                label="TEMPERATURE" unit="°C" 
                value={vitals.temperature} onChange={(v) => updateVital('temperature', v)}
                criticalLow={35} criticalHigh={39} 
              />
            </div>
          </div>
        </div>

        {/* Clinical Summary & Submit Pane */}
        <div className="w-80 flex-column gap-4">
          <div className="card text-center flex-column justify-center items-center py-10">
            <span className="metric-label mb-2">NEWS2 SCORE</span>
            <div className={`text-6xl font-extrabold text-${triageColor}`}>
              {news2Score}
            </div>
            <p className="mt-4 text-on-surface-variant text-sm font-bold uppercase">
              {triageColor === 'red' ? 'High Risk / Emergency' : 
               triageColor === 'orange' ? 'Medium Risk / Urgent' : 
               triageColor === 'yellow' ? 'Low Risk / Ward' : 'Routine Assessment'}
            </p>
          </div>

          <div 
            className={`card flex-column items-center justify-center p-0 relative overflow-hidden`}
            style={{ 
              height: '100px', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              userSelect: 'none'
            }}
            onMouseDown={startHoldSubmit}
            onMouseUp={cancelHoldSubmit}
            onMouseLeave={cancelHoldSubmit}
            onTouchStart={startHoldSubmit}
            onTouchEnd={cancelHoldSubmit}
          >
            {/* Progress Bar Background */}
            <div 
              style={{
                position: 'absolute', top: 0, left: 0, bottom: 0,
                width: `${holdProgress}%`,
                backgroundColor: 'var(--primary)',
                opacity: 0.2,
                transition: 'width 0.1s linear'
              }}
            />
            <span className="font-bold text-primary text-xl z-10">
              {isSubmitting ? 'LOGGING...' : 'HOLD TO LOG VITALS'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
