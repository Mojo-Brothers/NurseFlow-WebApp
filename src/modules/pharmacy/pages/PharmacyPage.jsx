import React, { useEffect, useState, useCallback } from 'react';
import { usePharmacyStore } from '../pharmacy.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useAuth } from '../../../contexts/useAuth.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { useClinicalMetrics } from '../../../core/hooks/useClinicalMetrics';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { deductByName } from '../services/inventory.service.js';

const ROUTE_CONFIG = {
  PO:  { label: 'Oral', icon: 'pill', bg: 'var(--surface-container-high)', text: 'var(--on-surface)' },
  IV:  { label: 'Intravena', icon: 'colorize', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
  SC:  { label: 'Subkutan', icon: 'syringe', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
  IM:  { label: 'Intramuskular', icon: 'syringe', bg: '#fee2e2', text: '#b91c1c', highAlert: true },
};

export default function PharmacyPage() {
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

  const handleFinalDispense = async () => {
    const patient = getPatient(verifyingMed.patient_id);
    // 🛡️ IPSG Goal 1: Verify MRN matches
    if (ipsgInput.trim().toUpperCase() !== patient.mrn.toUpperCase()) {
      setIpsgError(true);
      return;
    }

    try { 
      logAction('pharmacy_dispense_complete');
      
      // 📦 ATOMIC STOCK DEDUCTION
      await deductByName(verifyingMed.medication_name, 1);
      
      await dispense(verifyingMed.id, currentUser.email); 
      setVerifyingMed(null);
      fetchQueue();
    } catch (e) { 
      alert('Inventory/Dispensing Failure: ' + e.message); 
    }
  };

  return (
    <div className="p-8 h-full flex-column gap-6 overflow-hidden relative">
      {/* 🚀 Header Metrics */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
         <ClinicalCard padding="1.5rem">
            <span className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">Pending Queue</span>
            <div className="text-3xl font-black text-primary">{pendingQueue.length}</div>
         </ClinicalCard>
         <ClinicalCard padding="1.5rem">
            <span className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">High Alert (Parenteral)</span>
            <div className="text-3xl font-black text-error">
               {pendingQueue.filter(m => ['IV','SC','IM'].includes(m.route)).length}
            </div>
         </ClinicalCard>
         <ClinicalCard padding="1.5rem">
            <span className="text-[10px] font-black uppercase text-on-surface-variant opacity-60">Impacted Patients</span>
            <div className="text-3xl font-black">{new Set(pendingQueue.map(m => m.patient_id)).size}</div>
         </ClinicalCard>
         <ClinicalCard padding="1.5rem" className="bg-secondary-container">
            <span className="text-[10px] font-black uppercase text-on-secondary-container opacity-60">Current Session</span>
            <div className="text-sm font-bold text-on-secondary-container">APOTEKER: {currentUser?.email?.split('@')[0].toUpperCase()}</div>
         </ClinicalCard>
      </div>

      {/* 📋 Dispensing Bento Queue */}
      <div className="flex-1 overflow-y-auto pr-2 pb-20">
         <div className="flex-row items-center justify-between mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Active Dispensing Queue</h3>
            <button onClick={fetchQueue} className="btn-ghost text-[10px] font-bold">REFRESH QUEUE</button>
         </div>

         <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {pendingQueue.length === 0 ? (
               <div className="col-span-full py-20 text-center flex-column items-center gap-4">
                  <span className="material-symbols-outlined text-6xl text-success opacity-20">inventory_2</span>
                  <p className="font-bold text-on-surface-variant">Zero Pending Orders. The bridge is clear.</p>
               </div>
            ) : pendingQueue.map(med => {
               const p = getPatient(med.patient_id);
               const routeInfo = ROUTE_CONFIG[med.route] || { label: med.route, icon: 'medication' };
               return (
                  <ClinicalCard key={med.id} padding="1.5rem" className="hover-lift transition-all">
                     {routeInfo.highAlert && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-error text-white text-[10px] font-black uppercase rounded-bl-lg">
                           HIGH ALERT
                        </div>
                     )}
                     
                     <div className="flex-column gap-4">
                        <div className="flex-column gap-1">
                           <span className="text-[10px] font-black text-primary uppercase">Patient Identity</span>
                           <div className="text-base font-black truncate">{p ? p.name : 'Unknown'}</div>
                           <div className="text-[10px] font-bold text-on-surface-variant">MRN: {p ? p.mrn : '---'} • DOB: {p ? p.demographics?.dob : '---'}</div>
                        </div>

                        <div className="p-3 rounded-xl border border-outline-variant flex-row items-center gap-4" style={{ backgroundColor: routeInfo.bg }}>
                           <span className="material-symbols-outlined" style={{ color: routeInfo.text }}>{routeInfo.icon}</span>
                           <div className="flex-1">
                              <div className="text-sm font-black" style={{ color: routeInfo.text }}>{med.medication_name}</div>
                              <div className="text-[10px] font-bold opacity-70">
                                 {med.dosage || 'Standard Dosage'} • {routeInfo.label}
                              </div>
                           </div>
                        </div>

                        <div className="flex-row justify-between items-center mt-2">
                           <div className="flex-column">
                              <span className="text-[10px] font-black opacity-40 uppercase">Prescribed By</span>
                              <span className="text-[10px] font-bold uppercase">{med.prescribed_by?.split('@')[0]}</span>
                           </div>
                           <button 
                              onClick={() => startDispense(med)}
                              className="btn-primary py-2 px-4 text-xs font-black uppercase tracking-wider"
                           >
                              ✓ Start Dispensing
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
                  <h2 className="text-2xl font-black text-on-surface">IPSG Verification</h2>
                  <p className="text-sm text-on-surface-variant mt-2 font-medium">Goal 1: Confirm patient identity before dispensing medication.</p>
               </div>

               <div className="bg-surface-container-low p-4 rounded-xl mb-6 flex-column gap-3">
                  <div className="flex-row justify-between border-b pb-2 mb-2">
                     <span className="text-[10px] font-black uppercase opacity-50">Patient Name</span>
                     <span className="text-xs font-black">{getPatient(verifyingMed.patient_id)?.name}</span>
                  </div>
                  <div className="flex-row justify-between">
                     <span className="text-[10px] font-black uppercase opacity-50">Order</span>
                     <span className="text-xs font-black text-secondary">{verifyingMed.medication_name}</span>
                  </div>
               </div>

               <div className="flex-column gap-2 mb-6">
                  <label className="text-xs font-bold text-on-surface-variant">Type Patient MRN to Confirm:</label>
                  <input 
                     type="text" 
                     className={`form-input w-full text-center text-xl font-black tabular-nums ${ipsgError ? 'border-error' : ''}`}
                     placeholder="Enter MRN..."
                     value={ipsgInput}
                     onChange={(e) => { setIpsgInput(e.target.value); setIpsgError(false); }}
                     autoFocus
                  />
                  {ipsgError && <p className="text-[10px] text-error font-bold italic">Identity Mismatch! Verify the patient identity bracelet.</p>}
               </div>

               <div className="flex-column gap-3">
                  <button onClick={handleFinalDispense} className="btn-primary w-full py-4 font-black uppercase tracking-widest text-lg" style={{ backgroundColor: 'var(--secondary)' }}>
                     ✓ CONFIRM & DISPENSE
                  </button>
                  <button onClick={() => setVerifyingMed(null)} className="btn-ghost w-full font-bold opacity-60">Cancel Verification</button>
               </div>
            </ClinicalCard>
         </div>
      )}
    </div>
  );
}
