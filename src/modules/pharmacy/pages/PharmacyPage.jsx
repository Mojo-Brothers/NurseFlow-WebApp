import React, { useEffect, useState, useCallback } from 'react';
import { usePharmacyStore } from '../pharmacy.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { useClinicalMetrics } from '../../../core/hooks/useClinicalMetrics';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { deductByName } from '../services/inventory.service.js';
import { useTranslation } from 'react-i18next';

const ROUTE_CONFIG = {
  PO:  { labelKey: 'pharmacy_v2.routes.oral', defaultLabel: 'Oral', icon: 'pill', bg: 'var(--surface-container-high)', text: 'var(--on-surface)' },
  IV:  { labelKey: 'pharmacy_v2.routes.iv', defaultLabel: 'Intravena', icon: 'colorize', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
  SC:  { labelKey: 'pharmacy_v2.routes.sc', defaultLabel: 'Subkutan', icon: 'syringe', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
  IM:  { labelKey: 'pharmacy_v2.routes.im', defaultLabel: 'Intramuskular', icon: 'syringe', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
};

export default function PharmacyPage() {
  const { t } = useTranslation();
  const { currentUser, isPharmacist, isAdmin } = useAuth();
  const { pendingQueue, isLoading, fetchQueue, dispense, cancel } = usePharmacyStore();
  const { patients, fetchPatients } = usePatientStore();
  const { logAction } = useClinicalMetrics('PHARMACY_QUEUE');

  const [verifyingMed, setVerifyingMed] = useState(null);
  const [ipsgInput, setIpsgInput] = useState('');
  const [ipsgError, setIpsgError] = useState(false);

  useEffect(() => {
    fetchQueue();
    fetchPatients();
  }, [fetchQueue, fetchPatients]);

  const getPatient = (pid) => patients.find(p => p.id === pid);

  const startDispense = (med) => {
    logAction('pharmacy_dispense_init');
    setVerifyingMed(med);
    setIpsgInput('');
    setIpsgError(false);
  };

  const handleFinalDispense = async (witness = null) => {
    const patient = getPatient(verifyingMed.patient_id);
    if (ipsgInput.trim().toUpperCase() !== patient.mrn.toUpperCase()) {
      setIpsgError(true);
      return;
    }

    try { 
      logAction('pharmacy_dispense_complete');
      await deductByName(verifyingMed.medication_name, 1);
      await dispense(verifyingMed.id, currentUser.email, witness); 
      setVerifyingMed(null);
      fetchQueue();
    } catch (e) { 
      alert(t('pharmacy_v2.alerts.inventory_failure') + ': ' + e.message); 
    }
  };

  return (
    <div className="p-8 h-full flex-column gap-6 overflow-hidden relative">
      {/* 🚀 Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
         <ClinicalCard padding="1.5rem">
            <span className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">{t('pharmacy_v2.metrics.pending_queue')}</span>
            <div className="text-3xl font-black text-primary">{pendingQueue.length}</div>
         </ClinicalCard>
         <ClinicalCard padding="1.5rem">
            <span className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">{t('pharmacy_v2.metrics.high_alert')}</span>
            <div className="text-3xl font-black text-error">
               {pendingQueue.filter(m => ['IV','SC','IM'].includes(m.route)).length}
            </div>
         </ClinicalCard>
         <ClinicalCard padding="1.5rem">
            <span className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">{t('pharmacy_v2.metrics.impacted_patients')}</span>
            <div className="text-3xl font-black">{new Set(pendingQueue.map(m => m.patient_id)).size}</div>
         </ClinicalCard>
         <ClinicalCard padding="1.5rem" className="bg-secondary-container">
            <span className="text-[10px] font-black uppercase text-on-secondary-container opacity-60">{t('pharmacy_v2.metrics.current_session')}</span>
            <div className="text-sm font-bold text-on-secondary-container">{t('pharmacy_v2.metrics.pharmacist')}: {currentUser?.email?.split('@')[0].toUpperCase()}</div>
         </ClinicalCard>
      </div>

      {/* 📋 Dispensing Bento Queue */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20">
         <div className="flex-row items-center justify-between mb-4 min-w-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{t('pharmacy_v2.queue_title')}</h3>
            <button onClick={fetchQueue} className="btn-ghost text-[10px] font-bold">{t('pharmacy_v2.refresh_queue')}</button>
         </div>

         <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {pendingQueue.length === 0 ? (
               <div className="col-span-full py-20 text-center flex-column items-center gap-4">
                  <span className="material-symbols-outlined text-6xl text-success opacity-20">inventory_2</span>
                  <p className="font-bold text-on-surface-variant">{t('pharmacy_v2.zero_pending')}</p>
               </div>
            ) : pendingQueue.map(med => {
                const p = getPatient(med.patient_id);
                const routeInfo = ROUTE_CONFIG[med.route] || { labelKey: '', defaultLabel: med.route, icon: 'medication' };
                const lasaConflict = med.lasaWarning;
                const highAlert = med.isHighAlert || routeInfo.highAlert;

                return (
                   <ClinicalCard key={med.id} padding="1.5rem" className="hover-lift transition-all">
                      {highAlert && (
                         <div className="absolute top-0 right-0 px-3 py-1 bg-error text-white text-[10px] font-black uppercase rounded-bl-lg animate-pulse">
                            {t('admin_hub.safety.high_alert')}
                         </div>
                      )}
                      
                      <div className="flex-column gap-4 min-w-0">
                         <div className="flex-row gap-2 shrink-0 min-w-0">
                            <div className="flex-column gap-1 min-w-0">
                               <span className="text-[10px] font-black text-primary uppercase">{t('pharmacy_v2.patient_id_label')}</span>
                               <div className="text-base font-black truncate">{p ? p.name : t('pharmacy_v2.labels.unknown')}</div>
                               <div className="text-[10px] font-bold text-on-surface-variant">{t('patient_form.mrn')}: {p ? p.mrn : '---'} • {t('patient_form.dob')}: {p ? p.demographics?.dob : '---'}</div>
                            </div>
                         </div>

                          <div className="p-3 rounded-xl border-2 flex-row items-center gap-4 min-w-0" style={{ backgroundColor: routeInfo.bg, borderColor: lasaConflict ? 'var(--error)' : 'transparent' }}>
                             <span className="material-symbols-outlined shrink-0" style={{ color: routeInfo.text }}>{routeInfo.icon}</span>
                             <div className="flex-1 min-w-0">
                                <div className="text-sm font-black truncate" style={{ color: routeInfo.text }}>{med.medication_name}</div>
                                <div className="text-[10px] font-bold opacity-70 truncate">
                                   {med.dosage || t('pharmacy_v2.dosage_standard', { defaultValue: 'Standard Dosage' })} • {routeInfo.labelKey ? t(routeInfo.labelKey) : routeInfo.defaultLabel}
                                </div>
                                {lasaConflict && (
                                  <div className="mt-1 flex-row items-center gap-1 text-error text-[8px] font-black uppercase animate-bounce-short min-w-0">
                                     <span className="material-symbols-outlined text-[10px] shrink-0">warning</span>
                                      <span className="truncate">LASA: {t('pharmacy_v2.lasa_warning', { defaultValue: 'Confused with' })} {lasaConflict}?</span>
                                  </div>
                                )}
                             </div>
                          </div>

                          <div className="flex-row justify-between items-center mt-2 gap-4 min-w-0">
                             <div className="flex-column min-w-0">
                                <span className="text-[10px] font-black opacity-40 uppercase">{t('pharmacy_v2.prescribed_by')}</span>
                                <span className="text-[10px] font-bold uppercase truncate">{med.prescribed_by?.split('@')[0]}</span>
                             </div>
                             <button 
                                onClick={() => startDispense(med)}
                                className="btn-primary py-2 px-4 text-xs font-black uppercase tracking-wider shrink-0"
                             >
                                {t('pharmacy_v2.dispensing_btn')}
                             </button>
                          </div>
                      </div>
                   </ClinicalCard>
                );
            })}
         </div>
      </div>

      {/* 🛡️ IPSG DOUBLE-CHECK MODAL */}
      {verifyingMed && (
         <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-sm z-50 flex items-center justify-center p-8">
            <ClinicalCard maxWidth="500px" padding="2rem" className="shadow-2xl border-t-8 border-secondary animate-scale-in">
               <div className="text-center mb-6">
                  <span className="material-symbols-outlined text-secondary text-6xl mb-4">how_to_reg</span>
                  <h2 className="text-2xl font-black text-on-surface">{t('pharmacy_v2.ipsg.title')}</h2>
                  <p className="text-sm text-on-surface-variant mt-2 font-medium">{t('pharmacy_v2.ipsg.subtitle')}</p>
               </div>

                <div className="bg-surface-container-low p-4 rounded-xl mb-6 flex-column gap-3 min-w-0">
                   <div className="flex-row justify-between border-b pb-2 mb-2 min-w-0">
                      <span className="text-[10px] font-black uppercase opacity-50 shrink-0">{t('pharmacy_v2.ipsg.patient_name')}</span>
                      <span className="text-xs font-black truncate">{getPatient(verifyingMed.patient_id)?.name}</span>
                   </div>
                   <div className="flex-row justify-between min-w-0">
                      <span className="text-[10px] font-black uppercase opacity-50 shrink-0">{t('pharmacy_v2.ipsg.order')}</span>
                      <span className="text-xs font-black text-secondary truncate">{verifyingMed.medication_name}</span>
                   </div>
                </div>

               <div className="flex-column gap-2 mb-6">
                  <label className="text-xs font-bold text-on-surface-variant">{t('pharmacy_v2.ipsg.mrn_label')}</label>
                  <input 
                     type="text" 
                     className={`form-input w-full text-center text-xl font-black tabular-nums ${ipsgError ? 'border-error' : ''}`}
                     placeholder={t('pharmacy_v2.ipsg.placeholder')}
                     value={ipsgInput}
                     onChange={(e) => { setIpsgInput(e.target.value); setIpsgError(false); }}
                     autoFocus
                  />
                  {ipsgError && <p className="text-[10px] text-error font-bold italic">{t('pharmacy_v2.ipsg.mismatch')}</p>}
               </div>

                {/* derived highAlert status from route or data */}
                {(verifyingMed.isHighAlert || (ROUTE_CONFIG[verifyingMed.route]?.highAlert)) && (
                   <div className="p-4 bg-error-container text-on-error-container rounded-xl mb-6 border border-error animate-pulse min-w-0">
                      <div className="flex-row items-center gap-2 mb-2 min-w-0">
                         <span className="material-symbols-outlined text-sm shrink-0">security</span>
                         <span className="text-[10px] font-black uppercase truncate">{t('pharmacy_v2.ipsg.high_alert_protocol')}</span>
                      </div>
                     <p className="text-[10px] font-bold mb-3">{t('pharmacy_v2.ipsg.double_check_msg')}</p>
                     <input 
                        type="email" 
                        className="form-input w-full text-xs" 
                        placeholder={t('pharmacy_v2.ipsg.witness_placeholder')} 
                        required 
                        id="witness_email"
                     />
                  </div>
                )}

                <div className="flex-column gap-3 min-w-0">
                   <button 
                      onClick={() => {
                         const witness = document.getElementById('witness_email')?.value;
                         const isHighAlert = verifyingMed.isHighAlert || ROUTE_CONFIG[verifyingMed.route]?.highAlert;
                         if (isHighAlert && (!witness || witness === currentUser.email)) {
                            alert(t('pharmacy_v2.ipsg.witness_mandatory'));
                            return;
                         }
                         handleFinalDispense(witness);
                      }} 
                      className="btn-primary w-full py-4 font-black uppercase tracking-widest text-lg flex-row items-center justify-center gap-2" 
                      style={{ backgroundColor: 'var(--secondary)' }}
                   >
                      <span className="material-symbols-outlined shrink-0">check_circle</span>
                      <span className="truncate">{t('pharmacy_v2.ipsg.confirm_btn')}</span>
                   </button>
                   <button onClick={() => setVerifyingMed(null)} className="btn-ghost w-full font-bold opacity-60 flex-row items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">close</span>
                      {t('pharmacy_v2.ipsg.cancel_btn')}
                   </button>
                </div>
            </ClinicalCard>
         </div>
      )}
    </div>
  );
}
