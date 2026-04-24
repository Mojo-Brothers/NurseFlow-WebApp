import React, { useState } from 'react';
import { reportIncident } from '../services/gld.service.js';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import { useAuth } from '../../../contexts/useAuth.js';
import { useNavigate } from 'react-router-dom';

/**
 * IncidentReportingPage — Institutional Risk Management (GLD).
 * Standardized reporting for medical errors, falls, and near-misses.
 */
export default function IncidentReportingPage() {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'MEDICATION_ERROR',
    severity: 'NORMAL',
    location: 'WARD_A',
    description: '',
    patientId: '',
    reporterRole: role,
    isNearMiss: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reportIncident(formData, currentUser.email);
      setSubmitted(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      alert('Failed to submit report. Please try again or contact IT.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-column items-center justify-center p-24 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-success-container text-success flex items-center justify-center mb-8 shadow-2xl">
           <span className="material-symbols-outlined text-5xl">check_circle</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">Report Submitted</h1>
        <p className="opacity-50 font-bold uppercase tracking-widest max-w-md">
          Your report has been securely logged for investigation. Thank you for contributing to patient safety.
        </p>
      </div>
    );
  }

  return (
    <div className="p-12 max-w-4xl mx-auto animate-fade-in">
      <header className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-error mb-2">
          Safety & Risk Management
        </span>
        <h1 className="text-5xl font-black tracking-tight">Report an <span className="text-error">Incident</span></h1>
      </header>

      <form onSubmit={handleSubmit}>
        <PresentationCard padding="3rem">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="flex-column gap-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-40">Incident Type</label>
              <select 
                className="p-4 rounded-2xl bg-surface-container border border-outline-variant font-bold text-sm outline-none focus:ring-2 ring-primary"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                required
              >
                <option value="MEDICATION_ERROR">Medication Error</option>
                <option value="PATIENT_FALL">Patient Fall</option>
                <option value="EQUIPMENT_FAILURE">Equipment Failure</option>
                <option value="PROCEDURAL_ERROR">Procedural Error</option>
                <option value="OTHER">Other Institutional Risk</option>
              </select>
            </div>

            <div className="flex-column gap-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-40">Severity Level</label>
              <select 
                className="p-4 rounded-2xl bg-surface-container border border-outline-variant font-bold text-sm outline-none focus:ring-2 ring-primary"
                value={formData.severity}
                onChange={e => setFormData({...formData, severity: e.target.value})}
                required
              >
                <option value="LOW">Low (No harm)</option>
                <option value="NORMAL">Normal (Minor harm)</option>
                <option value="HIGH">High (Major harm / Sentinel)</option>
              </select>
            </div>

            <div className="flex-column gap-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-40">Location</label>
              <input 
                type="text"
                placeholder="e.g. Ward A, ICU, Lobby"
                className="p-4 rounded-2xl bg-surface-container border border-outline-variant font-bold text-sm outline-none focus:ring-2 ring-primary"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>

            <div className="flex-column gap-2">
              <label className="text-xs font-black uppercase tracking-widest opacity-40">Patient MRN (Optional)</label>
              <input 
                type="text"
                placeholder="MRN-XXXXX"
                className="p-4 rounded-2xl bg-surface-container border border-outline-variant font-bold text-sm outline-none focus:ring-2 ring-primary"
                value={formData.patientId}
                onChange={e => setFormData({...formData, patientId: e.target.value})}
              />
            </div>
          </div>

          <div className="flex-column gap-2 mb-8">
            <label className="text-xs font-black uppercase tracking-widest opacity-40">Detailed Description</label>
            <textarea 
              rows="6"
              className="p-4 rounded-2xl bg-surface-container border border-outline-variant font-bold text-sm outline-none focus:ring-2 ring-primary resize-none"
              placeholder="Describe exactly what happened, when, and who was involved..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <div className="flex-row items-center gap-4 mb-12 p-4 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant">
             <input 
                type="checkbox" 
                id="isNearMiss" 
                className="w-6 h-6 rounded-md accent-primary"
                checked={formData.isNearMiss}
                onChange={e => setFormData({...formData, isNearMiss: e.target.checked})}
             />
             <label htmlFor="isNearMiss" className="flex-column">
                <span className="text-sm font-black tracking-tight uppercase">This was a "Near Miss"</span>
                <span className="text-[10px] opacity-40 font-bold uppercase">The error was detected before it reached the patient.</span>
             </label>
          </div>

          <div className="flex-row justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs opacity-50 hover:opacity-100 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-12 py-4 rounded-full bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Confirm & Log Incident'}
            </button>
          </div>
        </PresentationCard>
      </form>
    </div>
  );
}
