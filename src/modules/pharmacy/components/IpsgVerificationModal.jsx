import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { checkAllergyConflict } from '../../../../utils/clinicalEngine.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';

const ROUTE_CONFIG = {
  PO:  { labelKey: 'pharmacy_v2.routes.oral', defaultLabel: 'Oral', icon: 'pill', bg: 'var(--surface-container-high)', text: 'var(--on-surface)' },
  IV:  { labelKey: 'pharmacy_v2.routes.iv', defaultLabel: 'Intravena', icon: 'colorize', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
  SC:  { labelKey: 'pharmacy_v2.routes.sc', defaultLabel: 'Subkutan', icon: 'syringe', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
  IM:  { labelKey: 'pharmacy_v2.routes.im', defaultLabel: 'Intramuskular', icon: 'syringe', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
};

export default function IpsgVerificationModal({ med, patient, currentUser, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const [ipsgInput, setIpsgInput] = useState('');
  const [ipsgError, setIpsgError] = useState(false);
  const [witness, setWitness] = useState('');

  const routeInfo = ROUTE_CONFIG[med.route] || { labelKey: '', defaultLabel: med.route, icon: 'medication', highAlert: false };
  const isHighAlert = med.isHighAlert || routeInfo.highAlert;
  const allergyConflict = checkAllergyConflict(med.medication_name, patient?.allergies);

  const handleSubmit = () => {
    if (ipsgInput.trim().toUpperCase() !== patient.mrn.toUpperCase()) {
      setIpsgError(true);
      return;
    }
    
    if (isHighAlert && (!witness || witness.toLowerCase() === currentUser.email.toLowerCase())) {
       alert(t('pharmacy_v2.ipsg.witness_mandatory', { defaultValue: 'A secondary witness (different user) is mandatory for High-Alert medications.' }));
       return;
    }
    
    if (allergyConflict) {
       if (!window.confirm(t('pharmacy_v2.alerts.allergy_override', { defaultValue: 'WARNING: Allergy conflict detected. Are you sure you want to proceed and override this safety alert?' }))) {
          return;
       }
    }

    onConfirm(witness);
  };

  return (
    <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
       <ClinicalCard maxWidth="550px" padding="0" className="shadow-2xl border-t-8 border-secondary animate-scale-in flex flex-col my-auto">
          
          <header className="p-6 bg-surface-container flex flex-col items-center justify-center text-center border-b border-outline-variant">
             <span className="material-symbols-outlined text-secondary text-5xl mb-3">how_to_reg</span>
             <h2 className="text-2xl font-black text-on-surface uppercase tracking-tight">{t('pharmacy_v2.ipsg.title', { defaultValue: 'IPSG Protocol 3' })}</h2>
             <p className="text-sm text-on-surface-variant font-bold mt-1 uppercase tracking-widest">{t('pharmacy_v2.ipsg.subtitle', { defaultValue: 'Dispense Verification' })}</p>
          </header>

          <div className="p-6 flex flex-col gap-6">
             {/* Cross-Check Data */}
             <div className="bg-surface p-5 rounded-2xl border-2 border-dashed border-outline-variant flex flex-col gap-4">
                <div className="flex flex-row justify-between items-center pb-3 border-b border-outline-variant border-dashed">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">{t('pharmacy_v2.ipsg.patient_name', { defaultValue: 'Patient' })}</span>
                      <span className="text-sm font-black truncate">{patient?.name}</span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">DOB</span>
                      <span className="text-sm font-black truncate">{patient?.demographics?.dob}</span>
                   </div>
                </div>
                <div className="flex flex-row justify-between items-center">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase opacity-50 tracking-widest">{t('pharmacy_v2.ipsg.order', { defaultValue: 'Prescription' })}</span>
                      <span className="text-xl font-black text-secondary tracking-tighter truncate">{med.medication_name}</span>
                   </div>
                   <div className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isHighAlert ? 'bg-error text-white animate-pulse' : 'bg-surface-container text-on-surface'}`}>
                      {isHighAlert ? t('admin_hub.safety.high_alert', { defaultValue: 'HIGH ALERT' }) : t('pharmacy_v2.routes.standard', { defaultValue: 'STANDARD' })}
                   </div>
                </div>
             </div>

             {/* Safety Checks */}
             {allergyConflict && (
                <div className="bg-error-container text-on-error-container p-4 rounded-xl flex flex-row gap-4 items-center shadow-inner border border-error/50">
                   <span className="material-symbols-outlined text-3xl">warning</span>
                   <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-widest">Allergy Conflict</span>
                      <span className="text-xs font-bold mt-0.5">Patient has a known allergy to this medication or its class.</span>
                   </div>
                </div>
             )}

             {/* Verification Form */}
             <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{t('pharmacy_v2.ipsg.mrn_label', { defaultValue: 'Verify Patient MRN' })}</label>
                   <input 
                      type="text" 
                      className={`form-input w-full text-center text-2xl font-black tabular-nums tracking-widest py-4 ${ipsgError ? 'border-error bg-error-container/20 text-error focus:border-error' : ''}`}
                      placeholder={t('pharmacy_v2.ipsg.placeholder', { defaultValue: 'Scan or Type MRN' })}
                      value={ipsgInput}
                      onChange={(e) => { setIpsgInput(e.target.value); setIpsgError(false); }}
                      autoFocus
                   />
                   {ipsgError && <p className="text-[10px] text-error font-bold uppercase text-center mt-1">{t('pharmacy_v2.ipsg.mismatch', { defaultValue: 'MRN Mismatch' })}</p>}
                </div>

                {isHighAlert && (
                   <div className="p-4 bg-surface-container-high rounded-xl border border-error/30 flex flex-col gap-3 mt-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                         <span className="material-symbols-outlined text-8xl text-error">security</span>
                      </div>
                      <div className="flex flex-row items-center gap-2 relative z-10">
                         <span className="material-symbols-outlined text-error text-sm">security</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-error">{t('pharmacy_v2.ipsg.high_alert_protocol', { defaultValue: 'Double Check Protocol Required' })}</span>
                      </div>
                      <p className="text-[10px] font-bold text-on-surface-variant relative z-10 leading-relaxed">{t('pharmacy_v2.ipsg.double_check_msg', { defaultValue: 'High-Alert medications require a secondary witness signature.' })}</p>
                      <input 
                         type="email" 
                         className="form-input w-full text-xs font-bold relative z-10" 
                         placeholder={t('pharmacy_v2.ipsg.witness_placeholder', { defaultValue: "Witness's Email or PIN" })} 
                         value={witness}
                         onChange={(e) => setWitness(e.target.value)}
                      />
                   </div>
                )}
             </div>
          </div>

          <footer className="p-6 bg-surface-container border-t border-outline-variant flex flex-col gap-3">
             <button 
                onClick={handleSubmit} 
                className="bg-secondary text-on-secondary w-full py-4 text-xs font-black uppercase tracking-widest shadow-xl hover:bg-secondary-container hover:text-on-secondary-container transition-all flex flex-row items-center justify-center gap-2 rounded-xl"
             >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {t('pharmacy_v2.ipsg.confirm_btn', { defaultValue: 'Dispense & Deduct Stock' })}
             </button>
             <button onClick={onCancel} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface hover:text-on-surface transition-all rounded-xl border border-transparent hover:border-outline-variant">
                {t('pharmacy_v2.ipsg.cancel_btn', { defaultValue: 'Cancel' })}
             </button>
          </footer>
       </ClinicalCard>
    </div>
  );
}
