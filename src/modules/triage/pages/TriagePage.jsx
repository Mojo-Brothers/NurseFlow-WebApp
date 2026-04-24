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
    esiLevel, setEsiLevel, 
    fallRisk, setFallRisk, 
    nutritionalRisk, setNutritionalRisk,
    vitals, setVital: storeSetVital,
    selectedPatientId, submitSuccess, serverConflict, error: triageError,
    executeSubmit, selectPatient, selectBed, selectedBedId, resetForm,
  } = useTriageStore();

  const setVital = (field, value) => {
    logAction(`vital_input_${field}`);
    storeSetVital(field, value);
  };

  const patient = patients.find(p => p.id === selectedPatientId);
  const baseline = patient?.baseline_profile;
  const news2Score  = calculateNEWS2(vitals, baseline);
  const triageColor = getTriageColor(news2Score);

  const [availableBeds, setAvailableBeds] = useState([]);
  const [activeField, setActiveField] = useState('heartRate');

  const VITAL_CONFIG = {
    heartRate:   { label: 'Heart Rate', unit: 'bpm', icon: 'favorite', presets: [60, 80, 100, 120] },
    systolicBP:  { label: 'Systolic BP', unit: 'mmHg', icon: 'speed', presets: [100, 120, 140, 160] },
    respRate:    { label: 'Resp Rate', unit: 'bpm', icon: 'air', presets: [16, 20, 24, 28] },
    spo2:        { label: 'SpO2', unit: '%', icon: 'blood_type', presets: [95, 98, 100] },
    temperature: { label: 'Temp', unit: '°C', icon: 'thermostat', presets: [36.5, 37.5, 38.5] }
  };

  useEffect(() => {
    fetchPatients();
    const fetchBeds = async () => {
      const all = await getAllBeds();
      setAvailableBeds(all.filter(b => !b.is_occupied));
    };
    fetchBeds();
  }, [fetchPatients]);

  const handlePatientChange = useCallback(async (patientId) => {
    selectPatient(patientId);
    if (patientId) {
      const active = await fetchPatientActiveEncounter(patientId);
      if (active) selectEncounter(active.id);
    }
  }, [selectPatient, fetchPatientActiveEncounter, selectEncounter]);

  useEffect(() => {
    if (liveContext?.patientId) {
      handlePatientChange(liveContext.patientId);
      return;
    }
    if (patients.length > 0 && !selectedPatientId) {
      handlePatientChange(patients[0].id);
    }
  }, [patients, selectedPatientId, handlePatientChange, liveContext]);

  return (
    <div className="triage-container p-4 lg:p-8">
      {/* ─── JCI Clinical Header ─── */}
      <header className="triage-header glass-card px-6 rounded-3xl mb-8 flex-row justify-between items-center">
         <div className="flex-row items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
               <span className="material-symbols-outlined text-3xl text-primary font-black">clinical_notes</span>
            </div>
            <div>
               <h2 className="text-2xl font-black tracking-tighter text-on-surface">Clinical Triage</h2>
               <div className="flex-row items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-on-surface-variant/60 tracking-widest">Digital Health Record V2026</span>
                  <span className="w-1 h-1 rounded-full bg-primary/30"></span>
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">JCI-AOP-Standard</span>
               </div>
            </div>
         </div>

         {patient && (
            <div className="hidden lg:flex flex-row items-center gap-8 border-l pl-8 border-outline-variant">
               <div className="flex-column">
                  <span className="text-[9px] font-black uppercase opacity-40">Identifikasi Pasien (IPSG 1)</span>
                  <span className="text-lg font-black text-primary">{patient.name}</span>
               </div>
               <div className="flex-column">
                  <span className="text-[9px] font-black uppercase opacity-40">MRN / DOB</span>
                  <span className="text-sm font-bold tabular-nums">{patient.mrn} • {patient.dob} ({calculateAge(patient.dob)} th)</span>
               </div>
            </div>
         )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* LEFT: Assessment Workspace */}
         <div className="lg:col-span-8 flex-column gap-8">
            
            {/* 1. Priority Selection (ESI Scale) */}
            <section>
               <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">Triage Priority Selection (ESI Scale)</h3>
               <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map(level => (
                     <button 
                       key={level}
                       onClick={() => setEsiLevel(level)}
                       className={`esi-badge esi-${level} flex-column items-center py-4 transition-all hover:scale-105 active:scale-95 ${esiLevel === level ? 'ring-4 ring-offset-4 ring-on-surface' : 'opacity-40 grayscale-[0.5]'}`}
                     >
                        <span className="text-xl font-black">ESI {level}</span>
                        <span className="text-[8px] font-bold opacity-80">
                           {level === 1 ? 'Resuscitation' : level === 2 ? 'Emergent' : level === 3 ? 'Urgent' : level === 4 ? 'Less Urgent' : 'Non-Urgent'}
                        </span>
                     </button>
                  ))}
               </div>
            </section>

            {/* 2. Vital Signs Entry */}
            <section className="glass-card p-6 rounded-[2.5rem]">
               <h3 className="text-xs font-black uppercase tracking-widest mb-6 opacity-60">Physiological Assessment</h3>
               <div className="vital-grid mb-8">
                  {Object.entries(VITAL_CONFIG).map(([key, cfg]) => (
                     <button 
                        key={key}
                        onClick={() => setActiveField(key)}
                        className={`vital-button ${activeField === key ? 'active' : ''}`}
                     >
                        <div className="glow"></div>
                        <span className="material-symbols-outlined text-primary mb-2">{cfg.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest block opacity-40">{cfg.label}</span>
                        <span className="text-2xl font-black tabular-nums leading-none my-1">{vitals[key] || '--'}</span>
                        <span className="text-[9px] font-bold opacity-40">{cfg.unit}</span>
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
            </section>

            {/* 3. Pain Assessment & Risk Screening (JCI Mandatory) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <section className="glass-card p-6 rounded-3xl">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">Pain Assessment (Wong-Baker)</h3>
                  <div className="pain-scale">
                     {[0, 2, 4, 6, 8, 10].map(val => (
                        <div 
                           key={val}
                           onClick={() => setVital('painScale', val)}
                           className={`pain-node ${vitals.painScale === val ? 'selected' : ''}`}
                           style={{ backgroundColor: `hsl(${120 - val * 12}, 70%, 50%)`, color: 'white' }}
                        >
                           {val}
                        </div>
                     ))}
                  </div>
                  <p className="text-[10px] font-bold text-center mt-3 opacity-40 uppercase tracking-widest">Skala Nyeri 0-10</p>
               </section>

               <section className="glass-card p-6 rounded-3xl">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">Safety Risk Screening (IPSG 6)</h3>
                  <div className="flex-column gap-3">
                     <button 
                        onClick={() => setFallRisk(!fallRisk)}
                        className={`flex-row items-center justify-between p-4 rounded-2xl border-2 transition-all ${fallRisk ? 'border-error bg-error/5 text-error font-black' : 'border-outline-variant opacity-60'}`}
                     >
                        <div className="flex-row items-center gap-3">
                           <span className="material-symbols-outlined">falling</span>
                           <span className="text-xs">High Fall Risk</span>
                        </div>
                        {fallRisk && <span className="material-symbols-outlined text-sm">warning</span>}
                     </button>

                     <button 
                        onClick={() => setNutritionalRisk(!nutritionalRisk)}
                        className={`flex-row items-center justify-between p-4 rounded-2xl border-2 transition-all ${nutritionalRisk ? 'border-warning bg-warning/5 text-warning font-black' : 'border-outline-variant opacity-60'}`}
                     >
                        <div className="flex-row items-center gap-3">
                           <span className="material-symbols-outlined">restaurant</span>
                           <span className="text-xs">Nutritional Screening (MST &gt; 2)</span>
                        </div>
                        {nutritionalRisk && <span className="material-symbols-outlined text-sm">priority_high</span>}
                     </button>
                  </div>
               </section>
            </div>
         </div>

         {/* RIGHT: Status & Submission */}
         <div className="lg:col-span-4 flex-column gap-8">
            {/* Status Card */}
            <div className={`glass-card p-8 rounded-[3rem] border-l-8 transition-all flex-column items-center text-center`}
                 style={{ borderLeftColor: `var(--status-${triageColor})` }}>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Calculated Severity</span>
               <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-${triageColor}/10 border-4 border-${triageColor}`}>
                  <span className="text-4xl font-black">{news2Score}</span>
               </div>
               <h4 className="text-xl font-black uppercase tracking-tighter mb-1">NEWS2 SCORE</h4>
               <p className="text-xs font-bold opacity-60 leading-tight">National Early Warning Score<br/>Protocol V2 (UK standard)</p>
            </div>

            {/* Bed Allocation */}
            <section className="glass-card p-6 rounded-3xl">
               <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">Clinical Bed Allocation</h3>
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
            </section>

            {/* Action Bar */}
            <button 
               className="w-full h-24 btn-primary rounded-[2rem] flex-row items-center justify-center gap-4 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
               onClick={() => {
                  if (!selectedPatientId || !selectedEncounterId) return alert("Pilih pasien terlebih dahulu!");
                  if (esiLevel === null) return alert("Pilih level ESI terlebih dahulu!");
                  executeSubmit(currentUser.email);
               }}
               disabled={!selectedPatientId || !selectedEncounterId}
            >
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
               </div>
               <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Submit Assessment</p>
                  <p className="text-lg font-black uppercase tracking-tighter leading-none">Log Triage & Admit</p>
               </div>
            </button>
         </div>
      </div>
    </div>
  );
}
