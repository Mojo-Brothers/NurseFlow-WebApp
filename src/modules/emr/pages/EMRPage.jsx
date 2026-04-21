import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { 
  getPatientRecords, 
  saveSoapNote, 
  triggerBillingItem, 
  triggerPharmacyOrder 
} from '../services/emr.service.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { useClinicalMetrics } from '../../../core/hooks/useClinicalMetrics';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { useNavigate, useBlocker } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { COLLECTIONS } from '../../../core/constants.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';

const COMMON_MDS = [
  { id: 'm1', medication_name: 'Paracetamol', dosage: '500mg', route: 'PO' },
  { id: 'm2', medication_name: 'Amoxicillin', dosage: '500mg', route: 'PO' },
  { id: 'm3', medication_name: 'Ceftriaxone', dosage: '1g', route: 'IV' }, // High Alert
  { id: 'm4', medication_name: 'Normal Saline', dosage: '500ml', route: 'IV' }, 
];

export default function EMRPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { selectedEncounterId, fetchPatientActiveEncounter } = useEncounterStore();
  const { logAction } = useClinicalMetrics('EMR_CORE');

  const [patientRecords, setPatientRecords] = useState([]);
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [planInstructions, setPlanInstructions] = useState('');
  const [selectedMeds, setSelectedMeds] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [safetyError, setSafetyError] = useState(null);
  
  // 🛡️ HUMAN EXPLANATION LAYER: Lockdown Context
  const [lockContext, setLockContext] = useState(null); // { user, time }
  
  // 🛡️ PRODUCTION SAFETY: Rich Execution Receipt
  const [receipt, setReceipt] = useState(null);
  const [retrying, setRetrying] = useState({ billing: false, pharmacy: false });

  // 🛡️ SMART UNSAVED GUARD: Delta detection
  const subjectiveRef = useRef('');
  const assessmentRef = useRef('');
  const isDirty = (subjective !== subjectiveRef.current || assessment !== assessmentRef.current) && (subjective.trim() !== '' || assessment.trim() !== '');

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    if (selectedPatientId) {
      getPatientRecords(selectedPatientId).then(setPatientRecords).catch(console.error);
      fetchPatientActiveEncounter(selectedPatientId).then(active => {
         subjectiveRef.current = ''; assessmentRef.current = ''; // Reset on patient change
      });
    }
  }, [selectedPatientId, fetchPatientActiveEncounter]);

  // 🛡️ EXPLANATORY LOCKDOWN: Monitor status + context
  useEffect(() => {
    if (!selectedEncounterId) {
      setLockContext(null);
      return;
    }

    const unsub = onSnapshot(doc(db, COLLECTIONS.ENCOUNTERS, selectedEncounterId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (['DISCHARGED', 'CANCELLED'].includes(data.status)) {
          setLockContext({
             user: data.updated_by || 'System',
             time: data.updated_at?.toDate().toLocaleString() || 'Recent'
          });
        } else {
          setLockContext(null);
        }
      }
    });

    return () => unsub();
  }, [selectedEncounterId]);

  const activePatient = patients.find(p => p.id === selectedPatientId);

  const handleAction = async (status) => {
    if (status === 'SIGNED' && (!subjective || !assessment)) {
       return setSafetyError("SIGN-OFF BLOCKED: Subjective & Assessment mandatory for clinical signature.");
    }

    if (!selectedEncounterId) {
       return setSafetyError("SIGN-OFF BLOCKED: No active clinical encounter found.");
    }

    setIsSaving(true);
    setSafetyError(null);
    try {
      const result = await saveSoapNote({
        patientId: selectedPatientId,
        encounterId: selectedEncounterId, 
        doctorEmail: currentUser.email,
        status: status,
        soapData: {
          subjective,
          objective,
          assessment,
          plan_medications: selectedMeds,
          plan_instructions: planInstructions
        }
      });
      
      if (status === 'SIGNED') {
        setReceipt(result);
        setSubjective(''); setObjective(''); setAssessment(''); 
        setPlanInstructions(''); setSelectedMeds([]);
        subjectiveRef.current = ''; assessmentRef.current = ''; 
        setShowConfirm(false);
        logAction('emr_sign_off_success');
      } else {
        setSafetyError("Draft Saved Successfully.");
        setTimeout(() => setSafetyError(null), 2000);
      }
      
      const hx = await getPatientRecords(selectedPatientId);
      setPatientRecords(hx);
    } catch (err) {
      setSafetyError("TRANSACTION FAILED: " + err.message);
      logAction('emr_sign_off_error');
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 TARGETED RETRY SYSTEM
  const retryModule = async (module) => {
    setRetrying(prev => ({ ...prev, [module]: true }));
    try {
      if (module === 'billing') {
        const res = await triggerBillingItem({ encounterId: selectedEncounterId, patientId: selectedPatientId, doctorEmail: currentUser.email });
        setReceipt(prev => ({ ...prev, billing: res }));
      } else {
        const res = await triggerPharmacyOrder({ medications: selectedMeds, patientId: selectedPatientId, encounterId: selectedEncounterId, doctorEmail: currentUser.email });
        setReceipt(prev => ({ ...prev, pharmacy: res }));
      }
    } catch (e) {
      alert(`Retry Failed: ${e.message}`);
    } finally {
      setRetrying(prev => ({ ...prev, [module]: false }));
    }
  };

  const toggleMed = (med) => {
    const exists = selectedMeds.find(m => m.id === med.id);
    if (exists) {
      setSelectedMeds(selectedMeds.filter(m => m.id !== med.id));
    } else {
      setSelectedMeds([...selectedMeds, med]);
    }
  };

  return (
    <div className="p-8 h-full flex-row gap-8 overflow-hidden relative">
      {/* 🛡️ RICH SUCCESS RECEIPT OVERLAY */}
      {receipt && (
        <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-md z-[100] flex items-center justify-center p-8">
           <ClinicalCard maxWidth="600px" padding="2.5rem" className="shadow-2xl border-t-8 border-success animate-scale-in">
              <div className="text-center mb-8">
                 <span className="material-symbols-outlined text-success text-7xl mb-4">verified</span>
                 <h2 className="text-3xl font-black text-on-surface">Clinical Transaction Summary</h2>
                 <p className="text-on-surface-variant font-medium mt-2">EMR record is secured. Operational status follows:</p>
              </div>

              <div className="space-y-4 mb-8">
                 <div className="flex-row items-center justify-between p-4 bg-surface-container rounded-xl">
                    <div className="flex-row items-center gap-3">
                       <span className="material-symbols-outlined text-primary">description</span>
                       <span className="text-sm font-bold uppercase tracking-wider">Medical Record</span>
                    </div>
                    <span className="text-xs font-black text-success">LOCKED (ID: {receipt.soapId.slice(-6)})</span>
                 </div>

                 {/* 🚀 TARGETED BILLING RECEIPT */}
                 <div className="flex-row items-center justify-between p-4 bg-surface-container rounded-xl">
                    <div className="flex-row items-center gap-3">
                       <span className="material-symbols-outlined text-secondary">receipt_long</span>
                       <span className="text-sm font-bold uppercase tracking-wider">Billing Station</span>
                    </div>
                    {receipt.billing.ok ? (
                       <span className="text-xs font-black text-success">SUCCESS</span>
                    ) : (
                       <button 
                         onClick={() => retryModule('billing')} 
                         disabled={retrying.billing}
                         className="btn-primary py-1 px-3 text-[8px] font-black uppercase bg-error"
                       >
                         {retrying.billing ? 'Retrying...' : '⚠ RETRY BILLING'}
                       </button>
                    )}
                 </div>

                 {/* 🚀 TARGETED PHARMACY RECEIPT */}
                 <div className="flex-row items-center justify-between p-4 bg-surface-container rounded-xl">
                    <div className="flex-row items-center gap-3">
                       <span className="material-symbols-outlined text-error">pill</span>
                       <span className="text-sm font-bold uppercase tracking-wider">Pharmacy Station</span>
                    </div>
                    {receipt.pharmacy.ok ? (
                       <span className="text-xs font-black text-success">{receipt.pharmacy.count} ITEMS SENT</span>
                    ) : (
                       <button 
                         onClick={() => retryModule('pharmacy')} 
                         disabled={retrying.pharmacy}
                         className="btn-primary py-1 px-3 text-[8px] font-black uppercase bg-error"
                       >
                         {retrying.pharmacy ? 'Retrying...' : '⚠ RETRY PHARMACY'}
                       </button>
                    )}
                 </div>
              </div>

              <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 text-base font-black uppercase tracking-widest">
                Professional Handover Complete
              </button>
           </ClinicalCard>
        </div>
      )}

      {/* 🛡️ DATA LOSS PREVENTION MODAL */}
      {blocker.state === "blocked" && (
        <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-sm z-[200] flex items-center justify-center">
           <ClinicalCard maxWidth="450px" padding="2rem" className="shadow-2xl border-t-4 border-error">
              <h3 className="text-xl font-black mb-2 flex-row gap-2 items-center">
                <span className="material-symbols-outlined text-error">warning</span>
                Unsaved Clinical Discovery
              </h3>
              <p className="text-sm text-on-surface-variant mb-6 font-medium">You have made changes to the patient SOAP note. Discarding will permanently lose this clinical session data.</p>
              <div className="flex-row gap-4">
                 <button onClick={() => blocker.proceed()} className="btn-ghost flex-1 text-error font-black uppercase text-xs">Discard & Exit</button>
                 <button onClick={() => blocker.reset()} className="btn-primary flex-1 py-3 font-black uppercase text-xs">Stay & Finish</button>
              </div>
           </ClinicalCard>
        </div>
      )}

      {/* 🛡️ HUMAN EXPLANATION LOCKDOWN */}
      {lockContext && (
        <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-md z-[250] flex items-center justify-center p-8 text-center text-on-surface">
           <ClinicalCard maxWidth="520px" padding="3rem" className="border-t-8 border-error shadow-2xl animate-pulse">
              <span className="material-symbols-outlined text-error text-8xl mb-6">lock_reset</span>
              <h2 className="text-3xl font-black mb-2">Record Access Restricted</h2>
              <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 flex-column gap-1">
                 <p className="text-xs font-bold uppercase opacity-60">Locked By</p>
                 <p className="text-sm font-black">{lockContext.user}</p>
                 <p className="text-[10px] font-bold opacity-40 mt-1">TIME: {lockContext.time}</p>
              </div>
              <p className="text-on-surface-variant font-medium mb-8">This session was discharged or finalized. Contact your clinical supervisor if this is an error.</p>
              <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 font-black uppercase">Return to Worklist</button>
           </ClinicalCard>
        </div>
      )}

      {/* LEFT: History & Timeline */}
      <div className="w-[450px] flex-column gap-6">
        <ClinicalCard padding="1.5rem" className="bg-surface-container-low border-l-4 border-primary pointer-events-none">
          <div className="flex-row items-baseline gap-3 mb-2">
            <h2 className="text-2xl font-black text-primary">{activePatient?.name || 'Select Patient'}</h2>
            <span className="text-xs font-bold text-on-surface-variant">MRN: {activePatient?.mrn}</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-tighter opacity-60">
            {activePatient?.demographics?.gender === 'M' ? 'Male' : 'Female'} • {calculateAge(activePatient?.demographics?.dob)} Years Old
          </p>
        </ClinicalCard>

        <select className="form-input w-full" value={selectedPatientId || ''} onChange={(e) => selectPatient(e.target.value)}>
          <option value="">-- Switch Context --</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}
        </select>

        <div className="flex-1 overflow-y-auto pr-2 flex-column gap-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-2">Clinical Timeline (Append-Only)</h3>
           {patientRecords.length === 0 ? (
             <p className="text-xs italic opacity-40 text-center py-10">No prior records found.</p>
           ) : patientRecords.map(rec => (
             <ClinicalCard key={rec.id} padding="1rem" className="relative hover:border-primary transition-all">
                <div className="flex-row justify-between mb-4 pb-2 border-b border-outline-variant border-dashed">
                   <span className="text-[10px] font-black text-primary uppercase">{rec.status === 'SIGNED' ? '✅ Signed' : '📝 Draft'}</span>
                   <span className="text-[10px] opacity-40 font-bold tabular-nums">{rec.created_at?.toDate().toDateString()}</span>
                </div>
                <div className="space-y-4 mb-4">
                   <div>
                      <p className="text-[9px] font-black uppercase opacity-60 mb-1">Subjective</p>
                      <p className="text-xs leading-relaxed">{rec.subjective}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase opacity-60 mb-1">Assessment</p>
                      <p className="text-xs leading-relaxed font-bold">{rec.assessment}</p>
                   </div>
                </div>
                {/* 🛡️ AUDIT TRACE VISIBILITY */}
                {rec.status === 'SIGNED' && (
                  <div className="pt-2 border-t border-outline-variant flex-row justify-between items-center opacity-60">
                     <span className="text-[8px] font-black uppercase">Trace ID: {rec.id.slice(0,8)}</span>
                     <span className="text-[8px] font-bold italic">Doc: {rec.doctor?.split('@')[0]}</span>
                  </div>
                )}
             </ClinicalCard>
           ))}
        </div>
      </div>

      {/* RIGHT: SOAP Workspace */}
      <div className="flex-1 flex-column gap-6">
        <div className="flex-row justify-between items-center bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant shadow-sm">
           <div className="flex-column">
              <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Active Workspace</span>
              <span className="text-sm font-bold">New Professional Entry</span>
           </div>
           <div className="flex-row gap-3">
              <button disabled={isSaving} onClick={() => handleAction('DRAFT')} className="btn-ghost px-4 py-2 text-xs font-black uppercase">Save Draft</button>
              <button disabled={isSaving} onClick={() => setShowConfirm(true)} className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg">✓ Sign-off</button>
           </div>
        </div>

        {safetyError && (
          <div className="p-4 bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-widest rounded-xl border-l-4 border-error shadow-sm">
            ⚠️ {safetyError}
          </div>
        )}

        <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
           <div className="flex-column gap-6 overflow-y-auto pr-4 scrollbar-hidden">
              <div className="flex-column gap-2">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">Subjective Findings</label>
                 <textarea className="form-input min-h-[140px] text-sm leading-relaxed" value={subjective} onChange={e => setSubjective(e.target.value)} />
              </div>
              <div className="flex-column gap-2">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">Objective Exam</label>
                 <textarea className="form-input min-h-[100px] text-sm leading-relaxed" value={objective} onChange={e => setObjective(e.target.value)} />
              </div>
              <div className="flex-column gap-2">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">Clinical Assessment</label>
                 <textarea className="form-input min-h-[120px] text-sm leading-relaxed font-bold" value={assessment} onChange={e => setAssessment(e.target.value)} />
              </div>
           </div>

           <div className="flex-column gap-6 overflow-y-auto">
              <div className="flex-column gap-4">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">Pharmacy Plan</label>
                 <div className="grid grid-cols-1 gap-2">
                    {COMMON_MDS.map(med => {
                       const isSelected = selectedMeds.find(m => m.id === med.id);
                       return (
                          <button key={med.id} onClick={() => toggleMed(med)} className={`flex-row items-center gap-3 p-4 rounded-xl border-2 transition-all ${isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-outline-variant'}`}>
                             <span className="material-symbols-outlined text-sm">{med.route === 'IV' ? 'colorize' : 'pill'}</span>
                             <div className="flex-1">
                                <div className="text-[10px] font-black">{med.medication_name}</div>
                                <div className="text-[8px] font-bold opacity-60 uppercase">{med.dosage} • {med.route}</div>
                             </div>
                             {isSelected && <span className="material-symbols-outlined text-sm">verified</span>}
                          </button>
                       );
                    })}
                 </div>
              </div>
              <div className="flex-column gap-2">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">Instructions</label>
                 <textarea className="form-input h-[120px] text-xs font-medium" placeholder="Referral/Follow-up..." value={planInstructions} onChange={e => setPlanInstructions(e.target.value)} />
              </div>
           </div>
        </div>
      </div>

      {/* 🛡️ PROFESSIONAL CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-sm z-[150] flex items-center justify-center p-8">
           <ClinicalCard maxWidth="500px" padding="2.5rem" className="shadow-2xl border-t-8 border-primary animate-scale-in">
              <div className="text-center mb-8">
                 <span className="material-symbols-outlined text-primary text-7xl mb-4">gavel</span>
                 <h3 className="text-2xl font-black">Clinical Signature Lock</h3>
                 <p className="text-sm text-on-surface-variant font-medium mt-2 italic px-4">"I certify that the clinical documentation above is accurate and complete."</p>
              </div>
              <div className="bg-surface-container p-4 rounded-xl mb-8 border border-outline-variant">
                 <div className="flex-row justify-between mb-2">
                    <span className="text-[10px] font-black uppercase opacity-60">Signature Entity</span>
                    <span className="text-xs font-black">{currentUser.email.split('@')[0].toUpperCase()}</span>
                 </div>
                 <div className="flex-row justify-between">
                    <span className="text-[10px] font-black uppercase opacity-60">Legal Force</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-white px-2 rounded">APPEND-ONLY FINAL</span>
                 </div>
              </div>
              <div className="flex-column gap-3">
                 <button disabled={isSaving} onClick={() => handleAction('SIGNED')} className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest shadow-lg">✓ Execute Final Sign-off</button>
                 <button onClick={() => setShowConfirm(false)} className="btn-ghost w-full font-bold opacity-60">Review Changes</button>
              </div>
           </ClinicalCard>
        </div>
      )}
    </div>
  );
}
