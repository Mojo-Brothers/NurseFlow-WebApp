import React, { useState } from 'react';
import { signDigitalConsent } from '../services/pfr.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';

const DigitalInformedConsent = ({ patientId, doctorEmail, onComplete }) => {
  const [procedure, setProcedure] = useState('');
  const [witnessEmail, setWitnessEmail] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
    if (!procedure || !witnessEmail) return;
    setIsSigning(true);
    try {
      await signDigitalConsent({
        procedureName: procedure,
        patientId,
        doctorEmail,
        witnessEmail
      });
      alert('Digital Informed Consent Secured. Record is now legally binding.');
      if (onComplete) onComplete();
    } catch (err) {
      alert('Consent Failed: ' + err.message);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <ClinicalCard className="p-8 bg-surface-container border-t-8 border-secondary shadow-2xl">
      <header className="mb-8">
        <h3 className="text-2xl font-black uppercase tracking-tighter">Digital Informed Consent</h3>
        <p className="text-[10px] font-bold opacity-40">Standard PFR.5: Consent must be witnessed and documented.</p>
      </header>

      <div className="flex-column gap-6">
        <div className="flex-column gap-2">
          <label className="text-[10px] font-black uppercase opacity-60">Procedure / Intervention Name</label>
          <input 
            className="form-input text-sm font-bold" 
            placeholder="e.g. Laparoscopic Appendectomy"
            value={procedure}
            onChange={e => setProcedure(e.target.value)}
          />
        </div>

        <div className="p-4 bg-white rounded-2xl border-2 border-outline-variant flex-column gap-4">
           <p className="text-[10px] font-black uppercase opacity-40 text-center border-b pb-2">Electronic Signature Verification</p>
           
           <div className="flex-row gap-6">
              <div className="flex-1 text-center">
                 <p className="text-[10px] font-bold opacity-60 mb-1">Doctor (Self)</p>
                 <div className="p-3 bg-surface-container rounded-lg text-xs font-black">{doctorEmail}</div>
              </div>
              <div className="flex-1 text-center">
                 <p className="text-[10px] font-bold opacity-60 mb-1">Witness (Staff ID/Email)</p>
                 <input 
                   className="form-input text-xs text-center border-error/40" 
                   placeholder="Enter Witness Email"
                   value={witnessEmail}
                   onChange={e => setWitnessEmail(e.target.value)}
                 />
              </div>
           </div>
        </div>

        <button 
          onClick={handleSign}
          disabled={!procedure || !witnessEmail || isSigning}
          className="btn-primary w-full py-5 text-sm font-black uppercase tracking-widest mt-4 bg-secondary shadow-lg active:scale-95 transition-all"
        >
          {isSigning ? 'Securing Legal Audit...' : 'Execute Dual Signature'}
        </button>
        
        <p className="text-[9px] font-medium opacity-40 text-center italic">
           "This digital signature is legally equivalent to a handwritten signature. 
           Audit trail includes IP address, timestamp, and witness identity."
        </p>
      </div>
    </ClinicalCard>
  );
};

export default DigitalInformedConsent;
