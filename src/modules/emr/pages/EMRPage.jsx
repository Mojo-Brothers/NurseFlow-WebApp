import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import { dischargeEncounter } from '../../encounter/services/encounter.service.js';
import { useNavigate, useBlocker } from 'react-router-dom';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { validateClaimReadiness } from '../../billing/services/claimEngine.service.js';
import { COLLECTIONS } from '../../../core/constants.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { checkAllergyConflict } from '../../../utils/clinicalEngine.js';
import HandoverModal from '../../handover/components/HandoverModal';
import DiagnosticViewer from '../../diagnostics/components/DiagnosticViewer';
import ClinicalAlertBanner from '../../../components/ui/ClinicalAlertBanner';
import { getLatestVitals, evaluateSepsisRisk, analyzeVitalTrend } from '../../../core/services/cds.service.js';
import SurgicalChecklist from '../components/SurgicalChecklist';
import PatientEducationForm from '../components/PatientEducationForm';
import DigitalInformedConsent from '../components/DigitalInformedConsent';
import { verifyClinicalPrivilege } from '../../sqe/services/sqe.service.js';
import { validateClinicalTerms } from '../../enterprise/services/moi.service.js';

const COMMON_MDS = [
  { id: 'm1', medication_name: 'Paracetamol', dosage: '500mg', route: 'PO' },
  { id: 'm2', medication_name: 'Amoxicillin', dosage: '500mg', route: 'PO' },
  { id: 'm3', medication_name: 'Ceftriaxone', dosage: '1g', route: 'IV' }, // High Alert
  { id: 'm4', medication_name: 'Normal Saline', dosage: '500ml', route: 'IV' }, 
];

export default function EMRPage() {
  const { t } = useTranslation();
  const { currentUser, role, isDoctor, activeFacilityId } = useAuth();
  const navigate = useNavigate();
  const { patients, fetchPatients, selectPatient, selectedPatientId } = usePatientStore();
  const { selectedEncounterId, fetchPatientActiveEncounter, activeEncounters } = useEncounterStore();
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
  
  const [lockContext, setLockContext] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [retrying, setRetrying] = useState({ billing: false, pharmacy: false });
  const [showHandover, setShowHandover] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('TIMELINE'); // 'TIMELINE' | 'DIAGNOSTICS'
  const [cdsAlerts, setCdsAlerts] = useState({ risk: null, trends: null });
  const [criticalLabResult, setCriticalLabResult] = useState(null);

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
      fetchPatientActiveEncounter(selectedPatientId).then(async (active) => {
         subjectiveRef.current = ''; assessmentRef.current = '';
         if (active) {
            const vitals = await getLatestVitals(active.id);
            if (vitals.length > 0) {
               const risk = evaluateSepsisRisk(vitals[0].vitals);
               const trends = vitals.length > 1 ? analyzeVitalTrend(vitals[0].vitals, vitals[1].vitals) : null;
               setCdsAlerts({ risk, trends });
            }
         }
      });
    }
  }, [selectedPatientId, fetchPatientActiveEncounter]);

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

  useEffect(() => {
    if (!selectedEncounterId) return;
    
    // 🧪 LIS: Monitor for Unacknowledged Critical Results
    const q = query(
      collection(db, COLLECTIONS.DIAGNOSTICS),
      where('encounter_id', '==', selectedEncounterId),
      where('status', '==', 'CRITICAL'),
      where('acknowledged', '==', false)
    );

    const unsub = onSnapshot(q, (snap) => {
       if (!snap.empty) {
          setCriticalLabResult(snap.docs[0].data());
       } else {
          setCriticalLabResult(null);
       }
    });

    return () => unsub();
  }, [selectedEncounterId]);

  const activePatient = patients.find(p => p.id === selectedPatientId);

  const handleAction = async (status) => {
    if (status === 'SIGNED' && (!subjective || !assessment)) {
       return setSafetyError("SIGN-OFF BLOCKED: Subjective & Assessment mandatory for clinical signature.");
    }

    const conflicts = selectedMeds.filter(med => checkAllergyConflict(med.medication_name, activePatient?.allergies));
    if (status === 'SIGNED' && conflicts.length > 0) {
       return setSafetyError(`SIGN-OFF BLOCKED: Allergy conflict detected for ${conflicts.map(c => c.medication_name).join(', ')}. Please correct the prescription.`);
    }

    if (status === 'SIGNED') {
       const privilege = await verifyClinicalPrivilege(currentUser.email, 'GENERAL_PRACTICE');
       if (!privilege.authorized) {
          return setSafetyError(`SIGN-OFF BLOCKED: ${privilege.reason}. Please verify your credentials.`);
       }

       const forbiddenTerms = [
         ...validateClinicalTerms(subjective),
         ...validateClinicalTerms(objective),
         ...validateClinicalTerms(assessment)
       ];

       if (forbiddenTerms.length > 0) {
          const terms = [...new Set(forbiddenTerms.map(t => t.term))];
          return setSafetyError(`SIGN-OFF BLOCKED: Forbidden abbreviations detected (${terms.join(', ')}). Use standard terms (e.g. ${forbiddenTerms[0].replacement}) per JCI MOI.2.`);
       }
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

  const handleDischarge = async () => {
    if (!window.confirm("FINAL DISCHARGE: Are you sure? This will medically close the encounter, release the bed, and finalize billing.")) return;
    setIsSaving(true);
    try {
       await dischargeEncounter(selectedEncounterId, currentUser.email);
       setSafetyError("Patient Discharged Successfully. Bed Released.");
    } catch (e) {
       setSafetyError(`DISCHARGE FAILED: ${e.message}`);
    } finally {
       setIsSaving(false);
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
    <div className="p-4 lg:p-8 h-full flex-col lg:flex-row gap-6 lg:gap-8 overflow-y-auto lg:overflow-hidden relative">
      {showHandover && (
        <HandoverModal 
          patient={activePatient} 
          encounter={activeEncounters?.find(e => e.id === selectedEncounterId)} 
          onClose={(success) => {
            setShowHandover(false);
            if (success) setSafetyError("Handover Secured Successfully.");
          }} 
        />
      )}

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

                 <div className="flex-row items-center justify-between p-4 bg-surface-container rounded-xl">
                    <div className="flex-row items-center gap-3">
                       <span className="material-symbols-outlined text-secondary">receipt_long</span>
                       <span className="text-sm font-bold uppercase tracking-wider">Billing Station</span>
                    </div>
                    {receipt.billing.ok ? (
                       <span className="text-xs font-black text-success">SUCCESS</span>
                    ) : (
                       <button onClick={() => retryModule('billing')} disabled={retrying.billing} className="btn-primary py-1 px-3 text-[8px] font-black uppercase bg-error">
                         {retrying.billing ? 'Retrying...' : '⚠ RETRY BILLING'}
                       </button>
                    )}
                 </div>

                 <div className="flex-row items-center justify-between p-4 bg-surface-container rounded-xl">
                    <div className="flex-row items-center gap-3">
                       <span className="material-symbols-outlined text-error">pill</span>
                       <span className="text-sm font-bold uppercase tracking-wider">Pharmacy Station</span>
                    </div>
                    {receipt.pharmacy.ok ? (
                       <span className="text-xs font-black text-success">{receipt.pharmacy.count} ITEMS SENT</span>
                    ) : (
                       <button onClick={() => retryModule('pharmacy')} disabled={retrying.pharmacy} className="btn-primary py-1 px-3 text-[8px] font-black uppercase bg-error">
                         {retrying.pharmacy ? 'Retrying...' : '⚠ RETRY PHARMACY'}
                       </button>
                    )}
                 </div>
              </div>

              <div className="flex-column gap-3">
                 <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 text-base font-black uppercase tracking-widest">
                   Professional Handover Complete
                 </button>
                 <button 
                   onClick={() => navigate(`/reporting/${selectedEncounterId}`)}
                   className="btn-ghost w-full py-2 text-[10px] font-black uppercase border border-primary/20"
                 >
                   View Medical Summary
                 </button>
              </div>
           </ClinicalCard>
        </div>
      )}

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
              <div className="flex-column gap-3 w-full">
                 <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 font-black uppercase">Return to Worklist</button>
                 <button 
                   onClick={() => navigate(`/reporting/${selectedEncounterId}`)}
                   className="btn-ghost w-full py-2 text-[10px] font-black uppercase border border-error/20 text-error"
                 >
                   Open Print-Ready Medical Summary
                 </button>
              </div>
           </ClinicalCard>
        </div>
      )}

      {/* LEFT: History & Timeline */}
      <div className="w-full lg:w-[450px] shrink-0 flex-column gap-6">
        <ClinicalCard padding="1.5rem" className="bg-surface-container-low border-l-4 border-primary relative">
          <div className="flex-row items-baseline gap-3 mb-2">
            <h2 className="text-2xl font-black text-primary">{activePatient?.name || t('emr.select_patient', { defaultValue: 'Select Patient' })}</h2>
            <span className="text-xs font-bold text-on-surface-variant">MRN: {activePatient?.mrn}</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-tighter opacity-60 mb-4">
            {activePatient?.demographics?.gender === 'M' ? t('patient.male', { defaultValue: 'Male' }) : t('patient.female', { defaultValue: 'Female' })} • {calculateAge(activePatient?.demographics?.dob)} {t('triage.yrs')}
          </p>
          <button 
            onClick={() => setShowHandover(true)}
            disabled={!selectedPatientId}
            className="w-full btn-ghost py-2 text-[10px] font-black uppercase border border-primary/20 hover:bg-primary/5 flex-row items-center justify-center gap-2"
          >
             <span className="material-symbols-outlined text-sm">sync_alt</span>
             {t('emr.handover')}
          </button>
        </ClinicalCard>

        <select className="form-input w-full" value={selectedPatientId || ''} onChange={(e) => selectPatient(e.target.value)}>
          <option value="">-- Switch Context --</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}
        </select>

        <div className="flex-1 overflow-y-auto pr-2 flex-column gap-4">
           <div className="flex-row gap-4 px-2 mb-2">
              <button 
                onClick={() => setActiveSidebarTab('TIMELINE')}
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                  ${activeSidebarTab === 'TIMELINE' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant opacity-40'}`}
              >
                {t('emr.history')}
              </button>
              <button 
                onClick={() => setActiveSidebarTab('DIAGNOSTICS')}
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                  ${activeSidebarTab === 'DIAGNOSTICS' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant opacity-40'}`}
              >
                {t('emr.diagnostics')}
              </button>
              <button 
                onClick={() => setActiveSidebarTab('SURGERY')}
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                  ${activeSidebarTab === 'SURGERY' ? 'border-error text-error' : 'border-transparent text-on-surface-variant opacity-40'}`}
              >
                Surgery
              </button>
              <button 
                onClick={() => setActiveSidebarTab('EDUCATION')}
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                  ${activeSidebarTab === 'EDUCATION' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant opacity-40'}`}
              >
                Education
              </button>
              <button 
                onClick={() => setActiveSidebarTab('CONSENT')}
                className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                  ${activeSidebarTab === 'CONSENT' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant opacity-40'}`}
              >
                Consent
              </button>
           </div>

           {activeSidebarTab === 'TIMELINE' ? (
             <>
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
                    {rec.status === 'SIGNED' && (
                      <div className="pt-2 border-t border-outline-variant flex-row justify-between items-center opacity-60">
                         <span className="text-[8px] font-black uppercase">Trace ID: {rec.id.slice(0,8)}</span>
                         <span className="text-[8px] font-bold italic">Doc: {rec.doctor?.split('@')[0]}</span>
                      </div>
                    )}
                 </ClinicalCard>
               ))}
             </>
             ) : activeSidebarTab === 'DIAGNOSTICS' ? (
              <DiagnosticViewer encounterId={selectedEncounterId} />
             ) : activeSidebarTab === 'SURGERY' ? (
               <SurgicalChecklist 
                 encounterId={selectedEncounterId} 
                 patientId={selectedPatientId}
                 userEmail={currentUser.email}
               />
             ) : activeSidebarTab === 'EDUCATION' ? (
               <PatientEducationForm
                 encounterId={selectedEncounterId}
                 patientId={selectedPatientId}
                 userEmail={currentUser.email}
               />
             ) : (
               <DigitalInformedConsent
                 patientId={selectedPatientId}
                 doctorEmail={currentUser.email}
                 onComplete={() => setActiveSidebarTab('TIMELINE')}
               />
             )}
        </div>
      </div>

      {/* RIGHT: SOAP Workspace */}
      <div className="flex-1 flex-column gap-6">
        <div className="flex-row justify-between items-center bg-surface-container px-6 py-4 rounded-2xl border border-outline-variant shadow-sm">
           <div className="flex-row gap-4 items-center">
              <div className="flex-column">
                 <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Active Workspace</span>
                 <span className="text-sm font-bold">New Professional Entry</span>
              </div>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[8px] font-black uppercase tracking-widest border border-primary/20">
                 Site: {activeFacilityId}
              </div>
           </div>
           <div className="flex-row gap-3">
              {isDoctor && selectedEncounterId && (
                <button 
                  onClick={() => navigate('/telemedicine')} 
                  className="btn-ghost px-4 py-2 text-xs font-black uppercase text-primary border border-primary/20 hover:bg-primary/5 flex-row items-center gap-2"
                >
                   <span className="material-symbols-outlined text-sm">videocam</span>
                   {t('telemedicine.start', { defaultValue: 'Start Tele-Consult' })}
                </button>
              )}
              <button disabled={isSaving} onClick={() => handleAction('DRAFT')} className="btn-ghost px-4 py-2 text-xs font-black uppercase">Save Draft</button>
              {isDoctor ? (
                <button disabled={isSaving} onClick={() => setShowConfirm(true)} className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg">✓ Sign-off</button>
              ) : (
                <div className="flex-row items-center px-4 bg-surface-container-high rounded-xl text-[8px] font-black uppercase opacity-40">Doctor Only</div>
              )}
           </div>
        </div>

        {criticalLabResult && (
           <div className="p-6 bg-error text-white rounded-2xl flex-row justify-between items-center shadow-xl animate-bounce-short mb-6 border-4 border-white/20">
              <div className="flex-row items-center gap-6">
                 <span className="material-symbols-outlined text-4xl">emergency</span>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">CRITICAL LAB VALUE DETECTED</h3>
                    <p className="text-xs font-bold opacity-80">
                       {criticalLabResult.test_name}: <span className="text-xl font-black">{criticalLabResult.result_value}</span> {criticalLabResult.unit}
                    </p>
                 </div>
              </div>
              <button className="bg-white text-error px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                 Acknowledge & View Details
              </button>
           </div>
        )}

        <ClinicalAlertBanner riskProfile={cdsAlerts.risk} trendAlerts={cdsAlerts.trends} />

        {safetyError && (
          <div className="p-4 bg-error-container text-on-error-container text-[10px] font-black uppercase tracking-widest rounded-xl border-l-4 border-error shadow-sm">
            ⚠️ {safetyError}
          </div>
        )}

        <div className="flex-col xl:flex-row flex-1 overflow-y-auto lg:overflow-hidden gap-6 xl:gap-8 flex">
           <div className="flex-1 flex-column gap-6 overflow-y-auto pr-0 xl:pr-4 scrollbar-hidden">
              <div className="flex-column gap-2">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">{t('emr.subjective')}</label>
                 <textarea className="form-input min-h-[140px] text-sm leading-relaxed" value={subjective} onChange={e => setSubjective(e.target.value)} />
              </div>
              <div className="flex-column gap-2">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">{t('emr.objective')}</label>
                 <textarea className="form-input min-h-[100px] text-sm leading-relaxed" value={objective} onChange={e => setObjective(e.target.value)} />
              </div>
              <div className="flex-column gap-2 relative">
                  <div className="flex-row justify-between items-center">
                     <label className="text-[10px] font-black uppercase text-on-surface-variant">{t('emr.assessment')}</label>
                     {assessment.length > 0 && (
                        <div className={`flex-row items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest
                           ${validateClaimReadiness({}, { assessment, status: 'SIGNED' }).ready ? 'bg-success/10 text-success' : 'bg-error-container text-error animate-pulse'}`}>
                           <span className="material-symbols-outlined text-[10px]">shield_with_heart</span>
                           {validateClaimReadiness({}, { assessment, status: 'SIGNED' }).ready ? 'Claim Ready' : 'Claim Risk: Low Data'}
                        </div>
                     )}
                  </div>
                  <textarea className="form-input min-h-[120px] text-sm leading-relaxed font-bold" value={assessment} onChange={e => setAssessment(e.target.value)} />
               </div>
           </div>

           <div className="flex-1 flex-column gap-6 overflow-y-auto w-full xl:max-w-[400px]">
              <div className="flex-column gap-4">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">{t('emr.pharmacy_plan')}</label>
                 <div className="grid grid-cols-1 gap-2">
                    {COMMON_MDS.map(med => {
                       const isSelected = selectedMeds.find(m => m.id === med.id);
                       const hasConflict = checkAllergyConflict(med.medication_name, activePatient?.allergies);
                       const isOutOfStock = med.id === 'm3'; // Simulated: Ceftriaxone is low in demo
                       return (
                          <button 
                            key={med.id} 
                            disabled={hasConflict || isOutOfStock}
                            onClick={() => toggleMed(med)} 
                            className={`flex-row items-center gap-3 p-4 rounded-xl border-2 transition-all 
                              ${hasConflict ? 'border-error bg-error-container text-on-error-container animate-pulse' : 
                                isOutOfStock ? 'bg-surface-container opacity-50 grayscale' :
                                isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-outline-variant'}`}
                          >
                             <span className="material-symbols-outlined text-sm">
                               {hasConflict ? 'warning' : isOutOfStock ? 'inventory_2' : med.route === 'IV' ? 'colorize' : 'pill'}
                             </span>
                             <div className="flex-1">
                                <div className="flex-row justify-between items-center">
                                   <div className="text-[10px] font-black">{med.medication_name}</div>
                                   {!hasConflict && (
                                      <div className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-error animate-pulse' : 'bg-success'}`} />
                                   )}
                                </div>
                                <div className="text-[8px] font-bold opacity-60 uppercase">
                                  {hasConflict ? '⚠️ ALLERGY CONFLICT' : isOutOfStock ? 'OUT OF STOCK' : `${med.dosage} • ${med.route}`}
                                </div>
                             </div>
                             {isSelected && <span className="material-symbols-outlined text-sm">verified</span>}
                          </button>
                       );
                    })}
                 </div>
              </div>
              <div className="flex-column gap-2">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">{t('emr.instructions')}</label>
                 <textarea className="form-input h-[120px] text-xs font-medium" placeholder="Referral/Follow-up..." value={planInstructions} onChange={e => setPlanInstructions(e.target.value)} />
              </div>

              <ClinicalCard padding="1.5rem" className="bg-surface-container border-t-4 border-error/20">
                 <header className="flex-row justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase opacity-60">{t('emr.discharge')}</span>
                    <span className="material-symbols-outlined text-sm opacity-20 text-error">logout</span>
                 </header>
                 <p className="text-[10px] opacity-60 mb-4 leading-tight">Closing the clinical journey will release the patient's bed and lock the medical record from further edits.</p>
                 <button 
                   onClick={handleDischarge}
                   disabled={!selectedEncounterId || isSaving || !isDoctor}
                   className={`w-full btn-ghost py-3 text-[10px] font-black uppercase border border-error/20 flex-row items-center justify-center gap-2 
                     ${!isDoctor ? 'opacity-20 cursor-not-allowed' : 'hover:bg-error/5 text-error'}`}
                 >
                    <span className="material-symbols-outlined text-sm">door_open</span>
                    {isDoctor ? 'Execute Final Discharge' : 'Discharge Restricted (Doctor Only)'}
                 </button>
              </ClinicalCard>
           </div>
        </div>
      </div>

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
