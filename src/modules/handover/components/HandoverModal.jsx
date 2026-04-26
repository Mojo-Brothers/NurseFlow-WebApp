import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { saveHandover } from '../services/handover.service.js';
import { getPatientRecords } from '../../emr/services/emr.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';

export default function HandoverModal({ patient, encounter, onClose }) {
  const { currentUser } = useAuth();
  
  const [situation, setSituation] = useState('');
  const [background, setBackground] = useState('');
  const [assessment, setAssessment] = useState('');
  const [recommendation, setRecommendation] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // 🛡️ INTELLIGENCE: Auto-populate Background from EMR
  useEffect(() => {
    if (patient?.id) {
       getPatientRecords(patient.id).then(records => {
          if (records.length > 0) {
             const latest = records[0];
             setBackground(`Primary Diagnosis/Assessment: ${latest.assessment || 'N/A'}\nSubjective: ${latest.subjective || 'N/A'}`);
          }
       });
    }
    
    // Initial Situation from NEWS2
    if (encounter) {
       setSituation(`Patient is currently ${encounter.status}. Latest NEWS2 Score: ${encounter.last_news2 || 'N/A'}.`);
    }
  }, [patient, encounter]);

  const handleSubmit = async () => {
    if (!situation || !recommendation) {
       return setError("SBAR REQUIREMENT: Situation & Recommendation are mandatory for shift safety.");
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveHandover({
        patient_id: patient.id,
        encounter_id: encounter.id,
        sender_email: currentUser.email,
        situation,
        background,
        assessment,
        recommendation
      });
      onClose(true); // Signal success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-surface-lowest-transparent backdrop-blur-md z-[300] flex items-center justify-center p-8">
       <ClinicalCard maxWidth="700px" padding="2.5rem" className="shadow-2xl border-t-8 border-primary animate-scale-in flex-column gap-6">
          <header className="flex-row justify-between items-center mb-2 min-w-0">
             <div className="min-w-0">
                <h3 className="text-2xl font-black text-primary truncate">Shift Handover (SBAR)</h3>
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1 truncate">Safe Clinical Transition Context</p>
             </div>
             <button onClick={() => onClose(false)} className="btn-icon-sm opacity-40 hover:opacity-100 shrink-0"><span className="material-symbols-outlined">close</span></button>
          </header>

          <div className="bg-surface-container p-4 rounded-xl flex-row justify-between items-center min-w-0">
             <div className="flex-column min-w-0">
                <span className="text-[10px] font-black uppercase opacity-60">Patient</span>
                <span className="text-sm font-bold truncate">{patient?.name} ({patient?.mrn})</span>
             </div>
             <div className="flex-column text-right shrink-0">
                <span className="text-[10px] font-black uppercase opacity-60">Sender</span>
                <span className="text-xs font-black">{currentUser?.email.split('@')[0].toUpperCase()}</span>
             </div>
          </div>

          {error && <div className="p-3 bg-error-container text-on-error-container text-[10px] font-black uppercase rounded-lg border-l-4 border-error">{error}</div>}

          <div className="grid grid-cols-2 gap-6 flex-1 overflow-y-auto pr-2 scrollbar-hidden">
             <div className="flex-column gap-2">
                <label className="text-[10px] font-black uppercase text-primary">Situation</label>
                <textarea 
                  className="form-input min-h-[100px] text-xs" 
                  placeholder="Current status, active issues..." 
                  value={situation} 
                  onChange={e => setSituation(e.target.value)} 
                />
             </div>
             <div className="flex-column gap-2">
                <label className="text-[10px] font-black uppercase text-primary">Background</label>
                <textarea 
                  className="form-input min-h-[100px] text-xs bg-surface-container-low" 
                  placeholder="Medical history, allergies, medications..." 
                  value={background} 
                  onChange={e => setBackground(e.target.value)} 
                />
             </div>
             <div className="flex-column gap-2">
                <label className="text-[10px] font-black uppercase text-primary">Assessment</label>
                <textarea 
                  className="form-input min-h-[100px] text-xs" 
                  placeholder="Vital trends, physical exam findings..." 
                  value={assessment} 
                  onChange={e => setAssessment(e.target.value)} 
                />
             </div>
             <div className="flex-column gap-2">
                <label className="text-[10px] font-black uppercase text-primary">Recommendation</label>
                <textarea 
                  className="form-input min-h-[100px] text-xs border-2 border-primary/20" 
                  placeholder="Plan for next shift, pending labs, escalation plan..." 
                  value={recommendation} 
                  onChange={e => setRecommendation(e.target.value)} 
                />
             </div>
          </div>

          <div className="flex-row gap-4 pt-4 border-t border-outline-variant min-w-0">
             <button onClick={() => onClose(false)} className="btn-ghost flex-1 py-4 font-black uppercase text-xs shrink-0">Cancel</button>
             <button 
               disabled={isSaving} 
               onClick={handleSubmit} 
               className="btn-primary flex-[2] py-4 font-black uppercase text-xs shadow-lg flex-row items-center justify-center gap-2 min-w-0"
             >
                {isSaving ? 'Securing...' : <><span className="material-symbols-outlined text-sm shrink-0">verified_user</span> <span className="truncate">Execute Handover</span></>}
             </button>
          </div>
       </ClinicalCard>
    </div>
  );
}
