import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { saveSoapNote, getPatientRecords } from '../services/emr.service.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import '../styles/EMR.css';

const COMMON_MDS = [
  "Paracetamol 500mg (PO)",
  "Amoxicillin 500mg (PO)",
  "Ibuprofen 400mg (PO)",
  "Omeprazole 20mg (PO)",
  "Ceftriaxone 1g (IV)",
  "Saline Normal 0.9% 500ml (IVD)"
];

export default function EMRPage() {
  const { currentUser } = useAuth();
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();

  const [patientRecords, setPatientRecords] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [planInstructions, setPlanInstructions] = useState('');
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [medInput, setMedInput] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      getPatientRecords(selectedPatientId).then(setPatientRecords).catch(console.error);
    }
  }, [selectedPatientId]);

  const activePatient = patients.find(p => p.id === selectedPatientId);

  const addMedication = (med) => {
    const medToAdd = med || medInput;
    if (medToAdd && !selectedMeds.includes(medToAdd)) {
      setSelectedMeds([...selectedMeds, medToAdd]);
    }
    setMedInput('');
  };

  const removeMedication = (med) => {
    setSelectedMeds(selectedMeds.filter(m => m !== med));
  };

  const handleSubmit = async () => {
    if (!subjective || !assessment) return alert("Subjective & Assessment tidak boleh kosong.");
    
    setIsSaving(true);
    try {
      await saveSoapNote(
        selectedPatientId,
        currentUser.email,
        {
          subjective,
          objective,
          assessment,
          plan_medications: selectedMeds,
          plan_instructions: planInstructions
        }
      );
      
      setSubjective(''); setObjective(''); setAssessment(''); 
      setPlanInstructions(''); setSelectedMeds([]);
      
      alert("EMR Logged & Audited Successfully!");
      
      const hx = await getPatientRecords(selectedPatientId);
      setPatientRecords(hx);
      
    } catch (err) {
      console.error("[EMR] Submit failure:", err);
      alert("Failed to submit EMR.");
    }
    setIsSaving(false);
  };

  return (
    <div className="flex-row h-full">
      <div className="emr-sidebar flex-column p-6 border-r">
        <h2 className="title mb-4">Patient Profile</h2>
        
        <select 
          className="form-input mb-8" 
          value={selectedPatientId || ''} 
          onChange={(e) => selectPatient(e.target.value)}
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.mrn} — {p.name} ({calculateAge(p.demographics?.dob)} thn)</option>
          ))}
        </select>

        {activePatient && (
          <div className="card mb-6 bg-surface-container-low border-0 shadow-none">
            <h3 className="font-bold text-lg">{activePatient.name}</h3>
            <p className="text-sm text-on-surface-variant flex-row justify-between mt-2">
              <span>MRN: <strong className="text-on-surface">{activePatient.mrn}</strong></span>
              <span>Umur: <strong className="text-on-surface">{calculateAge(activePatient.demographics?.dob)} thn</strong></span>
            </p>
          </div>
        )}

        <h3 className="metric-label mb-4">CLINICAL HISTORY (APPEND ONLY)</h3>
        <div className="flex-column gap-4 overflow-y-auto" style={{ flex: 1 }}>
          {patientRecords.length === 0 ? (
            <div className="text-sm text-on-surface-variant italic">No previous clinical notes.</div>
          ) : (
            patientRecords.map(record => (
              <div key={record.id} className="card padding-4 border-l-primary">
                <div className="flex-row justify-between items-center border-b pb-2 mb-2">
                  <span className="text-xs font-bold text-primary">{new Date(record.created_at?.toDate()).toLocaleDateString()}</span>
                  <span className="text-xs text-on-surface-variant">{record.doctor}</span>
                </div>
                <div className="text-sm flex-column gap-1">
                  <p><strong>S:</strong> {record.subjective}</p>
                  <p><strong>A:</strong> {record.assessment}</p>
                  {record.plan_medications?.length > 0 && (
                    <p className="mt-2 text-xs">
                      <strong>Rx:</strong> {record.plan_medications.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="emr-workspace flex-1 p-8 bg-surface-container-lowest overflow-y-auto">
        <div className="flex-row justify-between items-center mb-6">
          <h1 className="title text-2xl">SOAP Clinical Note</h1>
          <span className="chip chip-warning">Drafting as: {currentUser?.email}</span>
        </div>

        <div className="flex-column gap-6 max-w-4xl">
          <div className="form-group">
            <label className="emr-label">1. SUBJECTIVE (S) <span className="text-error">*</span></label>
            <p className="text-xs text-on-surface-variant mb-2">Chief complaint & history of present illness.</p>
            <textarea 
              className="emr-textarea" rows="3" 
              value={subjective} onChange={e => setSubjective(e.target.value)}
              placeholder="e.g. Patient complains of severe migraine for 3 days..."
            />
          </div>

          <div className="form-group">
            <label className="emr-label">2. OBJECTIVE (O)</label>
            <p className="text-xs text-on-surface-variant mb-2">Physical exam findings & recent lab results.</p>
            <textarea 
              className="emr-textarea" rows="4" 
              value={objective} onChange={e => setObjective(e.target.value)}
              placeholder="e.g. Temp 38.2C. HR 110bpm. Abdomen soft, tender at RLQ."
            />
          </div>

          <div className="form-group">
            <label className="emr-label">3. ASSESSMENT (A) <span className="text-error">*</span></label>
            <p className="text-xs text-on-surface-variant mb-2">Medical diagnoses.</p>
            <textarea 
              className="emr-textarea" rows="2" 
              value={assessment} onChange={e => setAssessment(e.target.value)}
              placeholder="e.g. Acute Appendicitis"
            />
          </div>

          <div className="form-group card bg-surface-container-low border-0 mt-4 outline-primary">
            <label className="emr-label text-primary">4. PLAN & ORDERS (P)</label>
            <p className="text-xs text-on-surface-variant mb-4">Treatment plan and prescriptions.</p>
            
            <div className="flex-column gap-4">
              <div>
                <label className="text-xs font-bold mb-2 block">Quick RX Select:</label>
                <div className="flex-row flex-wrap gap-2 mb-3">
                  {COMMON_MDS.map(m => (
                    <button key={m} onClick={() => addMedication(m)} className="btn-outline-small bg-background">
                      + {m}
                    </button>
                  ))}
                </div>
                
                <div className="flex-row gap-2">
                  <input 
                    type="text" className="form-input flex-1" 
                    placeholder="Search or type custom medication..."
                    value={medInput} onChange={e => setMedInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addMedication() }}
                  />
                  <button onClick={() => addMedication()} className="btn-primary px-4 border-radius-sm">Add</button>
                </div>

                {selectedMeds.length > 0 && (
                  <div className="mt-4 p-4 border rounded-md bg-background">
                    <h4 className="text-xs font-bold mb-2">Active Orders (Rx):</h4>
                    <ul className="flex-column gap-2">
                      {selectedMeds.map(m => (
                        <li key={m} className="flex-row justify-between text-sm py-1 border-b">
                          <span>{m}</span>
                          <button onClick={() => removeMedication(m)} className="text-error font-bold text-xs hover-underline">Remove</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="text-xs font-bold mb-2 block">Clinical Instructions / Referrals:</label>
                <textarea 
                  className="emr-textarea" rows="3" 
                  value={planInstructions} onChange={e => setPlanInstructions(e.target.value)}
                  placeholder="e.g. Admit to Ward. Order CBC, LFTs. NPO."
                />
              </div>
            </div>
          </div>

          <div className="flex-row justify-end mt-8 border-t pt-6 pb-20">
            <button 
              className="btn-primary px-8 py-3 text-lg" 
              onClick={handleSubmit} 
              disabled={isSaving}
            >
              <span className="material-symbols-outlined mr-2 inline-block align-middle">lock</span> 
              {isSaving ? 'Signing off...' : 'Sign & Complete Record'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
