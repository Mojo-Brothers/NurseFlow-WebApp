import React, { useState } from 'react';
import { saveSurgicalChecklist } from '../services/surgery.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';

const SurgicalChecklist = ({ encounterId, patientId, userEmail, onComplete }) => {
  const [phase, setPhase] = useState('SIGN_IN'); // SIGN_IN | TIME_OUT | SIGN_OUT
  const [data, setData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const PHASES = {
    SIGN_IN: {
      label: 'Sign-In (Before Anesthesia)',
      items: [
        { id: 'id_confirmed', text: 'Patient identity, site, procedure, and consent confirmed?' },
        { id: 'site_marked', text: 'Site marked?' },
        { id: 'anesthesia_safety', text: 'Anesthesia safety check completed?' },
        { id: 'pulse_ox', text: 'Pulse oximeter on patient and functioning?' }
      ]
    },
    TIME_OUT: {
      label: 'Time-Out (Before Skin Incision)',
      items: [
        { id: 'team_intro', text: 'Confirm all team members introduced themselves by name and role?' },
        { id: 'verbal_confirm', text: 'Surgeon, anesthesia professional, and nurse verbally confirm: Patient, Site, Procedure?' },
        { id: 'abx_prophylaxis', text: 'Antibiotic prophylaxis given within last 60 minutes?' },
        { id: 'imaging_displayed', text: 'Essential imaging displayed?' }
      ]
    },
    SIGN_OUT: {
      label: 'Sign-Out (Before Patient Leaves OR)',
      items: [
        { id: 'procedure_recorded', text: 'Nurse verbally confirms name of the procedure recorded?' },
        { id: 'count_correct', text: 'Instrument, sponge and needle counts correct?' },
        { id: 'specimen_labeled', text: 'Specimen labeled (including patient name)?' },
        { id: 'equipment_issues', text: 'Any equipment problems to be addressed?' }
      ]
    }
  };

  const handleToggle = (id) => {
    setData(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async () => {
    const missing = PHASES[phase].items.filter(item => !data[item.id]);
    if (missing.length > 0) {
      alert(`JCI REQUIREMENT: Please complete all items for ${phase} before proceeding.`);
      return;
    }

    setIsSaving(true);
    try {
      await saveSurgicalChecklist({
        encounterId,
        patientId,
        userEmail,
        phase,
        checklistData: data
      });
      alert(`${phase} Verified & Logged.`);
      if (onComplete) onComplete(phase);
      
      // Move to next phase if possible
      if (phase === 'SIGN_IN') setPhase('TIME_OUT');
      else if (phase === 'TIME_OUT') setPhase('SIGN_OUT');
      else setPhase('DONE');
      
      setData({}); // Reset for next phase
    } catch (err) {
      alert("Verification Failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (phase === 'DONE') {
    return (
      <div className="p-8 text-center bg-success/10 rounded-2xl border-2 border-success/20">
        <span className="material-symbols-outlined text-success text-6xl mb-4">verified</span>
        <h3 className="text-xl font-black text-success uppercase">Surgical Safety Cycle Complete</h3>
        <p className="text-xs font-bold opacity-60 mt-2">All JCI/WHO protocols have been verified and audited.</p>
      </div>
    );
  }

  return (
    <ClinicalCard className="p-6 bg-surface-container-low border-t-8 border-primary">
      <header className="flex-row justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight">{PHASES[phase].label}</h3>
          <p className="text-[10px] font-bold opacity-40">Standard WHO/JCI Surgical Safety Checklist</p>
        </div>
        <div className="chip chip-outline text-[10px] font-black">{phase}</div>
      </header>

      <div className="space-y-4 mb-8">
        {PHASES[phase].items.map(item => (
          <div 
            key={item.id} 
            onClick={() => handleToggle(item.id)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex-row items-center gap-4
              ${data[item.id] ? 'bg-primary/5 border-primary' : 'bg-surface border-outline-variant opacity-60'}`}
          >
            <span className={`material-symbols-outlined text-xl ${data[item.id] ? 'text-primary' : 'opacity-20'}`}>
              {data[item.id] ? 'check_box' : 'check_box_outline_blank'}
            </span>
            <p className="text-sm font-medium flex-1">{item.text}</p>
          </div>
        ))}
      </div>

      <button 
        disabled={isSaving}
        onClick={handleSubmit}
        className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest shadow-lg"
      >
        {isSaving ? 'Logging to Audit Trail...' : `Verify ${phase.replace('_', ' ')} & Proceed`}
      </button>
    </ClinicalCard>
  );
};

export default SurgicalChecklist;
