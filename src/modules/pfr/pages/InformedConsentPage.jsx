import React, { useState } from 'react';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { submitInformedConsent } from '../services/pfr.service.js';
import { useAuth } from '../../../contexts/useAuth.js';

/**
 * InformedConsentPage — Patient and Family Rights (PFR).
 * Standardized digital consent for surgical and high-risk procedures.
 */
export default function InformedConsentPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    patientId: 'P-99231', // Mock for now
    patientName: 'Budi Santoso',
    procedure: 'Laparoscopic Appendectomy',
    doctorName: currentUser?.displayName || 'Dr. Antigravity',
    witnessName: '',
    riskAcknowledged: false,
    benefitUnderstood: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.riskAcknowledged || !formData.benefitUnderstood) {
       alert('Semua pernyataan pemahaman harus dicentang.');
       return;
    }

    setLoading(true);
    try {
      await submitInformedConsent({
        ...formData,
        doctorEmail: currentUser?.email,
        consentDate: new Date().toISOString()
      });
      setSuccess(true);
    } catch (err) {
      console.error('[Consent] Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[60vh]">
         <div className="text-center animate-scale-in">
            <span className="material-symbols-outlined text-8xl text-success mb-6">verified_user</span>
            <h2 className="text-3xl font-black mb-2">Consent Documented</h2>
            <p className="opacity-50">Document has been digitally signed and archived in patient record.</p>
            <button 
              onClick={() => setSuccess(false)}
              className="mt-8 px-8 py-3 bg-primary text-white font-black rounded-xl uppercase tracking-widest text-xs"
            >
              New Consent
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="p-12 max-w-4xl mx-auto">
      <header className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">
          Patient & Family Rights (PFR)
        </span>
        <h1 className="text-5xl font-black tracking-tight">Informed <span className="text-primary">Consent</span></h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <PresentationCard padding="3rem">
          <div className="grid grid-cols-2 gap-12 mb-12">
             <div className="flex-column gap-2">
                <label className="text-[10px] font-black uppercase opacity-40">Patient</label>
                <p className="text-xl font-black">{formData.patientName}</p>
                <p className="text-[10px] font-bold opacity-30">ID: {formData.patientId}</p>
             </div>
             <div className="flex-column gap-2 text-right">
                <label className="text-[10px] font-black uppercase opacity-40">Physician in Charge</label>
                <p className="text-xl font-black">{formData.doctorName}</p>
             </div>
          </div>

          <div className="mb-12">
             <label className="text-[10px] font-black uppercase opacity-40 mb-2 block">Proposed Procedure</label>
             <input 
               type="text" 
               value={formData.procedure}
               onChange={e => setFormData({...formData, procedure: e.target.value})}
               className="w-full bg-surface-container-low border-b-2 border-outline-variant p-4 text-2xl font-black focus:border-primary outline-none transition-all"
             />
          </div>

          <div className="space-y-6 bg-surface-container-highest/30 p-8 rounded-3xl border border-outline-variant mb-12">
             <h3 className="text-xs font-black uppercase tracking-widest mb-4">Patient Declarations</h3>
             <label className="flex-row gap-4 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.riskAcknowledged}
                  onChange={e => setFormData({...formData, riskAcknowledged: e.target.checked})}
                  className="w-6 h-6 rounded-md accent-primary"
                />
                <span className="text-sm font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                  Saya telah dijelaskan mengenai risiko tindakan, termasuk komplikasi yang mungkin timbul.
                </span>
             </label>
             <label className="flex-row gap-4 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.benefitUnderstood}
                  onChange={e => setFormData({...formData, benefitUnderstood: e.target.checked})}
                  className="w-6 h-6 rounded-md accent-primary"
                />
                <span className="text-sm font-medium opacity-70 group-hover:opacity-100 transition-opacity">
                  Saya memahami manfaat tindakan dan alternatif pengobatan yang tersedia.
                </span>
             </label>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="flex-column gap-4">
                <label className="text-[10px] font-black uppercase opacity-40">Witness Name (Relative/Staff)</label>
                <input 
                  type="text" 
                  placeholder="Enter Full Name"
                  value={formData.witnessName}
                  onChange={e => setFormData({...formData, witnessName: e.target.value})}
                  className="bg-transparent border-b border-outline p-2 font-bold focus:border-primary outline-none"
                  required
                />
             </div>
             <div className="flex-column items-end justify-end">
                <div className="w-full h-24 bg-surface-container-low rounded-xl border border-dashed border-outline-variant flex items-center justify-center text-[10px] font-black opacity-30 uppercase">
                   Digital Signature Placeholder
                </div>
             </div>
          </div>
        </PresentationCard>

        <div className="flex justify-end gap-4">
           <button type="button" className="px-8 py-4 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">Cancel</button>
           <button 
             disabled={loading}
             className="px-12 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
           >
             {loading ? 'Archiving...' : 'Sign & Complete Consent'}
           </button>
        </div>
      </form>

      <div className="mt-12 p-8 border-t border-outline-variant flex-row gap-6 items-center opacity-30 grayscale">
         <span className="material-symbols-outlined text-4xl">gavel</span>
         <p className="text-[10px] font-bold leading-relaxed">
            Legal Notice: This document is a legally binding medical record per JCI PFR.5 standard. 
            Unauthorized alteration is subject to criminal prosecution under Health Law Article 267.
         </p>
      </div>
    </div>
  );
}
