import React, { useState } from 'react';
import { reportIncident } from '../services/gld.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';

const IncidentReport = ({ reporterEmail, onComplete }) => {
  const [type, setType] = useState('NEAR_MISS');
  const [severity, setSeverity] = useState('LOW');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!description) return;
    setIsSaving(true);
    try {
      await reportIncident({
        type,
        severity,
        description,
        reporterEmail
      });
      alert('Incident successfully reported to Risk Management. Thank you for prioritizing Patient Safety.');
      if (onComplete) onComplete();
      setDescription('');
    } catch (err) {
      alert('Report failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ClinicalCard className="p-6 bg-error-container/5 border-2 border-error/20">
      <header className="flex-row items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-error">report_problem</span>
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-error">Clinical Incident Report</h3>
          <p className="text-[10px] font-bold opacity-60">JCI GLD Standard: Non-punitive reporting system.</p>
        </div>
      </header>

      <div className="flex-column gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex-column gap-2">
            <label className="text-[10px] font-black uppercase opacity-60">Incident Type</label>
            <select className="form-input text-xs" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="SENTINEL">SENTINEL EVENT (Death/Injury)</option>
              <option value="ADVERSE">ADVERSE EVENT</option>
              <option value="NEAR_MISS">NEAR MISS</option>
            </select>
          </div>
          <div className="flex-column gap-2">
            <label className="text-[10px] font-black uppercase opacity-60">Initial Severity</label>
            <select className="form-input text-xs" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="CRITICAL">CRITICAL</option>
              <option value="MODERATE">MODERATE</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>

        <div className="flex-column gap-2">
          <label className="text-[10px] font-black uppercase opacity-60">Description of Event</label>
          <textarea 
            className="form-input text-xs min-h-[120px] p-4" 
            placeholder="Describe what happened, when, and where. Be objective."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!description || isSaving}
          className="btn-primary bg-error text-white w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl"
        >
          {isSaving ? 'Encrypting & Transmitting...' : 'Submit Confidential Report'}
        </button>
      </div>
    </ClinicalCard>
  );
};

export default IncidentReport;
