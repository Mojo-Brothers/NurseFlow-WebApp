import React, { useState } from 'react';
import { EDUCATION_TOPICS, saveEducationSession } from '../services/pfe.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';

const PatientEducationForm = ({ encounterId, patientId, userEmail }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [understanding, setUnderstanding] = useState('GOOD');
  const [isSaving, setIsSaving] = useState(false);

  const handleLog = async () => {
    if (!selectedTopic) return;
    setIsSaving(true);
    try {
      await saveEducationSession({
        encounterId,
        patientId,
        userEmail,
        topicId: selectedTopic,
        understandingLevel: understanding
      });
      alert('Education session successfully documented in EMR.');
      setSelectedTopic('');
    } catch (err) {
      alert('Logging failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ClinicalCard className="p-6 bg-surface-container-lowest border-l-8 border-secondary">
      <header className="mb-6">
        <h3 className="text-lg font-black uppercase tracking-tight">Patient Education Delivery</h3>
        <p className="text-[10px] font-bold opacity-40">JCI PFE Standard: Patient understanding must be verified.</p>
      </header>

      <div className="flex-column gap-6">
        <div className="flex-column gap-2">
          <label className="text-[10px] font-black uppercase opacity-60">Select Education Topic</label>
          <select 
            className="form-input text-xs font-bold"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            <option value="">-- Choose Topic --</option>
            {EDUCATION_TOPICS.map(t => (
              <option key={t.id} value={t.id}>{t.category}: {t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-column gap-2">
          <label className="text-[10px] font-black uppercase opacity-60">Assessment of Understanding</label>
          <div className="flex-row gap-2">
            {['EXCELLENT', 'GOOD', 'REINFORCE'].map(level => (
              <button
                key={level}
                onClick={() => setUnderstanding(level)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all
                  ${understanding === level ? 'bg-secondary text-white' : 'bg-surface-container border border-outline-variant opacity-60'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleLog}
          disabled={!selectedTopic || isSaving}
          className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest mt-4 shadow-xl"
          style={{ backgroundColor: 'var(--secondary)' }}
        >
          {isSaving ? 'Synchronizing Audit...' : 'Finalize & Log Education'}
        </button>
      </div>
    </ClinicalCard>
  );
};

export default PatientEducationForm;
