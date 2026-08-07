import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { 
  getPatientRecords, 
  saveSoapNote, 
  triggerBillingItem, 
  triggerPharmacyOrder,
  triggerLabOrder,
  triggerRadOrder
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

const PMH_CHIPS = ['Hipertensi', 'Diabetes Mellitus', 'Asma', 'Penyakit Jantung', 'Alergi Obat', 'Riwayat Operasi'];

const ICD_10_CODES = [
  { code: 'A09', description: 'Gastroenteritis and colitis of infectious origin' },
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
  { code: 'E11', description: 'Type 2 diabetes mellitus' },
  { code: 'K29.7', description: 'Gastritis, unspecified' },
];

const LAB_ORDERS = [
  { id: 'l1', test_name: 'Darah Lengkap (CBC)' },
  { id: 'l2', test_name: 'Gula Darah Sewaktu (GDS)' },
  { id: 'l3', test_name: 'Fungsi Ginjal (Ureum/Creatinin)' },
  { id: 'l4', test_name: 'Elektrolit (Na, K, Cl)' },
];

const RAD_ORDERS = [
  { id: 'r1', test_name: 'X-Ray Thorax (PA)' },
  { id: 'r2', test_name: 'USG Abdomen' },
  { id: 'r3', test_name: 'CT Scan Kepala Non-Kontras' },
];

export default function EMRPage() {
  const { t } = useTranslation();
  const { currentUser, isDoctor, activeFacilityId } = useAuth();
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
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [selectedRads, setSelectedRads] = useState([]);
  const [selectedIcd, setSelectedIcd] = useState(null);
  
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
  const isDirty = () => (subjective !== subjectiveRef.current || assessment !== assessmentRef.current) && (subjective.trim() !== '' || assessment.trim() !== '');

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty() && currentLocation.pathname !== nextLocation.pathname
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
      setTimeout(() => setLockContext(null), 0);
      return;
    }

    const unsub = onSnapshot(doc(db, COLLECTIONS.ENCOUNTERS, selectedEncounterId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (['DISCHARGED', 'CANCELLED'].includes(data.status)) {
          setLockContext({
             user: data.updated_by || 'System',
             time: data.updated_at?.toDate().toLocaleString() || t('emr_v2.workspace.recent_lock')
          });
        } else {
          setLockContext(null);
        }
      }
    });

    return () => unsub();
  }, [selectedEncounterId, t]);

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
       return setSafetyError(t('emr_v2.alerts.sign_blocked') + ": " + t('emr_v2.alerts.soap_mandatory'));
    }

    const conflicts = selectedMeds.filter(med => checkAllergyConflict(med.medication_name, activePatient?.allergies));
    if (status === 'SIGNED' && conflicts.length > 0) {
       return setSafetyError(t('emr_v2.alerts.sign_blocked') + ": " + t('emr_v2.alerts.allergy_conflict_msg', { meds: conflicts.map(c => c.medication_name).join(', ') }));
    }

    if (status === 'SIGNED') {
       const privilege = await verifyClinicalPrivilege(currentUser.email, 'GENERAL_PRACTICE');
       if (!privilege.authorized) {
          return setSafetyError(t('emr_v2.alerts.sign_blocked') + ": " + t('emr_v2.alerts.privilege_denied', { reason: privilege.reason }));
       }

       const forbiddenTerms = [
         ...validateClinicalTerms(subjective),
         ...validateClinicalTerms(objective),
         ...validateClinicalTerms(assessment)
       ];

       if (forbiddenTerms.length > 0) {
          const terms = [...new Set(forbiddenTerms.map(t => t.term))];
          return setSafetyError(t('emr_v2.alerts.sign_blocked') + ": " + t('emr_v2.alerts.forbidden_terms_msg', { 
            terms: terms.join(', '), 
            replacement: forbiddenTerms[0].replacement 
          }));
       }
    }

    if (!selectedEncounterId) {
       return setSafetyError(t('emr_v2.alerts.sign_blocked') + ": " + t('emr_v2.alerts.no_encounter'));
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
          icd10: selectedIcd ? [selectedIcd] : [],
          plan_medications: selectedMeds,
          plan_labs: selectedLabs,
          plan_rads: selectedRads,
          plan_instructions: planInstructions
        }
      });
      
      if (status === 'SIGNED') {
        setReceipt(result);
        setSubjective(''); setObjective(''); setAssessment(''); 
        setPlanInstructions(''); setSelectedMeds([]);
        setSelectedLabs([]); setSelectedRads([]); setSelectedIcd(null);
        subjectiveRef.current = ''; assessmentRef.current = ''; 
        setShowConfirm(false);
        logAction('emr_sign_off_success');
      } else {
        setSafetyError(t('emr_v2.workspace.save_success'));
        setTimeout(() => setSafetyError(null), 2000);
      }
      
      const hx = await getPatientRecords(selectedPatientId);
      setPatientRecords(hx);
    } catch (err) {
      setSafetyError(t('emr_v2.workspace.save_failed') + err.message);
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
      } else if (module === 'pharmacy') {
        const res = await triggerPharmacyOrder({ medications: selectedMeds, patientId: selectedPatientId, encounterId: selectedEncounterId, doctorEmail: currentUser.email });
        setReceipt(prev => ({ ...prev, pharmacy: res }));
      } else if (module === 'lab') {
        const res = await triggerLabOrder({ labs: selectedLabs, patientId: selectedPatientId, encounterId: selectedEncounterId, doctorEmail: currentUser.email });
        setReceipt(prev => ({ ...prev, lab: res }));
      } else if (module === 'rad') {
        const res = await triggerRadOrder({ rads: selectedRads, patientId: selectedPatientId, encounterId: selectedEncounterId, doctorEmail: currentUser.email });
        setReceipt(prev => ({ ...prev, rad: res }));
      }
    } catch (e) {
      alert(`${t('common.errors.generic')}: ${e.message}`);
    } finally {
      setRetrying(prev => ({ ...prev, [module]: false }));
    }
  };

  const handleDischarge = async () => {
    if (!window.confirm(t('emr_v2.discharge.confirm_msg'))) return;
    setIsSaving(true);
    try {
       await dischargeEncounter(selectedEncounterId, currentUser.email);
       setSafetyError(t('emr_v2.discharge.success'));
    } catch (e) {
       setSafetyError(`${t('emr_v2.discharge.failed')}${e.message}`);
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

  const toggleLab = (lab) => {
    const exists = selectedLabs.find(l => l.id === lab.id);
    if (exists) setSelectedLabs(selectedLabs.filter(l => l.id !== lab.id));
    else setSelectedLabs([...selectedLabs, lab]);
  };

  const toggleRad = (rad) => {
    const exists = selectedRads.find(r => r.id === rad.id);
    if (exists) setSelectedRads(selectedRads.filter(r => r.id !== rad.id));
    else setSelectedRads([...selectedRads, rad]);
  };

  return (
    <div className="p-4 lg:p-8 h-full flex-col lg:flex-row gap-6 lg:gap-8 overflow-y-auto lg:overflow-hidden relative">
      {showHandover && (
        <HandoverModal 
          patient={activePatient} 
          encounter={activeEncounters?.find(e => e.id === selectedEncounterId)} 
          onClose={(success) => {
            setShowHandover(false);
            if (success) setSafetyError(t('emr_v2.workspace.save_success'));
          }} 
        />
      )}

      {receipt && (
        <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-md z-[100] flex-row items-center justify-center p-8">
           <ClinicalCard maxWidth="600px" padding="2.5rem" className="shadow-2xl border-t-8 border-success animate-scale-in">
              <div className="text-center mb-8">
                 <span className="material-symbols-outlined text-success text-7xl mb-4">verified</span>
                 <h2 className="text-3xl font-black text-on-surface">{t('emr_v2.receipt.title')}</h2>
                 <p className="text-on-surface-variant font-medium mt-2">{t('emr_v2.receipt.subtitle')}</p>
              </div>

              <div className="space-y-4 mb-8">
                 <div className="flex-row items-center justify-between p-4 bg-surface-container rounded-xl">
                    <div className="flex-row items-center gap-3">
                       <span className="material-symbols-outlined text-primary">description</span>
                       <span className="text-sm font-bold uppercase tracking-wider">{t('emr_v2.receipt.medical_record')}</span>
                    </div>
                    <span className="text-xs font-black text-success">{t('emr_v2.receipt.record_locked')} (ID: {receipt.soapId.slice(-6)})</span>
                 </div>

                 <div className="flex-row items-center justify-between p-4 bg-surface-container rounded-xl">
                    <div className="flex-row items-center gap-3">
                       <span className="material-symbols-outlined text-secondary">receipt_long</span>
                       <span className="text-sm font-bold uppercase tracking-wider">{t('emr_v2.receipt.billing')}</span>
                    </div>
                    {receipt.billing.ok ? (
                       <span className="text-xs font-black text-success">{t('emr_v2.receipt.success')}</span>
                    ) : (
                       <button onClick={() => retryModule('billing')} disabled={retrying.billing} className="btn-primary py-1 px-3 text-[8px] font-black uppercase bg-error">
                         {retrying.billing ? 'Retrying...' : t('emr_v2.receipt.retry_billing')}
                       </button>
                    )}
                 </div>

                 <div className="flex-row items-center justify-between p-4 bg-surface-container rounded-xl">
                    <div className="flex-row items-center gap-3">
                       <span className="material-symbols-outlined text-error">pill</span>
                       <span className="text-sm font-bold uppercase tracking-wider">{t('emr_v2.receipt.pharmacy')}</span>
                    </div>
                    {receipt.pharmacy.ok ? (
                       <span className="text-xs font-black text-success">{receipt.pharmacy.count}{t('emr_v2.workspace.items_sent')}</span>
                    ) : (
                       <button onClick={() => retryModule('pharmacy')} disabled={retrying.pharmacy} className="btn-primary py-1 px-3 text-[8px] font-black uppercase bg-error">
                         {retrying.pharmacy ? 'Retrying...' : t('emr_v2.receipt.retry_pharmacy')}
                       </button>
                    )}
                 </div>
              </div>

              <div className="flex-column gap-3">
                 <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 text-base font-black uppercase tracking-widest">
                   {t('emr_v2.receipt.handover_complete')}
                 </button>
                 <button 
                   onClick={() => navigate(`/reporting/${selectedEncounterId}`)}
                   className="btn-ghost w-full py-2 text-[10px] font-black uppercase border border-primary/20"
                 >
                   {t('emr_v2.receipt.view_summary')}
                 </button>
              </div>
           </ClinicalCard>
        </div>
      )}

      {blocker.state === "blocked" && (
        <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-sm z-[200] flex-row items-center justify-center">
           <ClinicalCard maxWidth="450px" padding="2rem" className="shadow-2xl border-t-4 border-error">
              <h3 className="text-xl font-black mb-2 flex-row gap-2 items-center">
                <span className="material-symbols-outlined text-error">warning</span>
                {t('emr_v2.unsaved.title')}
              </h3>
              <p className="text-sm text-on-surface-variant mb-6 font-medium">{t('emr_v2.unsaved.subtitle')}</p>
              <div className="flex-row gap-4">
                 <button onClick={() => blocker.proceed()} className="btn-ghost flex-1 text-error font-black uppercase text-xs">{t('emr_v2.unsaved.discard')}</button>
                 <button onClick={() => blocker.reset()} className="btn-primary flex-1 py-3 font-black uppercase text-xs">{t('emr_v2.unsaved.stay')}</button>
              </div>
           </ClinicalCard>
        </div>
      )}

      {lockContext && (
        <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-md z-[250] flex-row items-center justify-center p-8 text-center text-on-surface">
           <ClinicalCard maxWidth="520px" padding="3rem" className="border-t-8 border-error shadow-2xl animate-pulse">
              <span className="material-symbols-outlined text-error text-8xl mb-6">lock_reset</span>
              <h2 className="text-3xl font-black mb-2">{t('emr_v2.lock.title')}</h2>
              <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-8 flex-column gap-1">
                 <p className="text-xs font-bold uppercase opacity-60">{t('emr_v2.lock.locked_by')}</p>
                 <p className="text-sm font-black">{lockContext.user}</p>
                 <p className="text-[10px] font-bold opacity-40 mt-1">TIME: {lockContext.time}</p>
              </div>
              <p className="text-on-surface-variant font-medium mb-8">{t('emr_v2.lock.subtitle')}</p>
              <div className="flex-column gap-3 w-full">
                 <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-4 font-black uppercase">{t('emr_v2.lock.return_worklist')}</button>
                 <button 
                   onClick={() => navigate(`/reporting/${selectedEncounterId}`)}
                   className="btn-ghost w-full py-2 text-[10px] font-black uppercase border border-error/20 text-error"
                 >
                   {t('emr_v2.lock.open_print')}
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
            <span className="text-xs font-bold text-on-surface-variant">{t('patient_form.mrn')}: {activePatient?.mrn}</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-tighter opacity-60 mb-4">
            {activePatient?.demographics?.gender === 'M' ? t('patient_form.gender_m') : t('patient_form.gender_f')} • {calculateAge(activePatient?.demographics?.dob)} {t('triage.yrs')}
          </p>
          <button 
            onClick={() => setShowHandover(true)}
            disabled={!selectedPatientId}
            className="w-full btn-ghost py-2 text-[10px] font-black uppercase border border-primary/20 hover:bg-primary/5 flex-row items-center justify-center gap-2"
          >
             <span className="material-symbols-outlined text-sm">sync_alt</span>
             {t('emr_v2.handover')}
          </button>
        </ClinicalCard>

        <select className="form-input w-full" value={selectedPatientId || ''} onChange={(e) => selectPatient(e.target.value)}>
          <option value="">{t('emr_v2.switch_context')}</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}
        </select>

        <div className="flex-1 overflow-y-auto pr-2 flex-column gap-4">
            <div className="flex-row gap-4 px-2 mb-2">
               <button 
                 onClick={() => setActiveSidebarTab('TIMELINE')}
                 className={`text-[10px] font-extrabold uppercase tracking-widest pb-2 border-b-2 transition-all cursor-pointer 
                   ${activeSidebarTab === 'TIMELINE' ? 'border-[#007399] text-[#007399] dark:text-cyan-400' : 'border-transparent text-on-surface-variant opacity-40'}`}
               >
                 {t('emr_v2.history')}
               </button>
               <button 
                 onClick={() => setActiveSidebarTab('DIAGNOSTICS')}
                 className={`text-[10px] font-extrabold uppercase tracking-widest pb-2 border-b-2 transition-all cursor-pointer 
                   ${activeSidebarTab === 'DIAGNOSTICS' ? 'border-[#007399] text-[#007399] dark:text-cyan-400' : 'border-transparent text-on-surface-variant opacity-40'}`}
               >
                 {t('emr_v2.diagnostics')}
               </button>
               <button 
                 onClick={() => setActiveSidebarTab('SURGERY')}
                 className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                   ${activeSidebarTab === 'SURGERY' ? 'border-error text-error' : 'border-transparent text-on-surface-variant opacity-40'}`}
               >
                 {t('emr_v2.surgery')}
               </button>
               <button 
                 onClick={() => setActiveSidebarTab('EDUCATION')}
                 className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                   ${activeSidebarTab === 'EDUCATION' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant opacity-40'}`}
               >
                 {t('emr_v2.education')}
               </button>
               <button 
                 onClick={() => setActiveSidebarTab('CONSENT')}
                 className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                   ${activeSidebarTab === 'CONSENT' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant opacity-40'}`}
               >
                 {t('emr_v2.consent')}
               </button>
            </div>

           {activeSidebarTab === 'TIMELINE' ? (
             <>
               {patientRecords.length === 0 ? (
                 <p className="text-xs italic opacity-40 text-center py-10">{t('emr_v2.workspace.no_prior_records')}</p>
               ) : patientRecords.map(rec => (
                 <ClinicalCard key={rec.id} padding="1rem" className="relative hover:border-primary transition-all">
                    <div className="flex-row justify-between mb-4 pb-2 border-b border-outline-variant border-dashed">
                       <span className="text-[10px] font-black text-primary uppercase">{rec.status === 'SIGNED' ? t('emr_v2.workspace.signed') : t('emr_v2.workspace.draft')}</span>
                       <span className="text-[10px] opacity-40 font-bold tabular-nums">{rec.created_at?.toDate().toDateString()}</span>
                    </div>
                    <div className="space-y-4 mb-4">
                       <div>
                          <p className="text-[9px] font-black uppercase opacity-60 mb-1">{t('emr_v2.sections.subjective')}</p>
                          <p className="text-xs leading-relaxed">{rec.subjective}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase opacity-60 mb-1">{t('emr_v2.sections.assessment')}</p>
                          <p className="text-xs leading-relaxed font-bold">{rec.assessment}</p>
                       </div>
                    </div>
                    {rec.status === 'SIGNED' && (
                      <div className="pt-2 border-t border-outline-variant flex-row justify-between items-center opacity-60">
                         <span className="text-[8px] font-black uppercase">Trace ID: {rec.id.slice(0,8)}</span>
                         <span className="text-[8px] font-bold italic">{t('emr_v2.workspace.doctor_prefix')}{rec.doctor?.split('@')[0]}</span>
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
                 <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">{t('emr_v2.workspace.title')}</span>
                 <span className="text-sm font-bold">{t('emr_v2.workspace.subtitle')}</span>
              </div>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[8px] font-black uppercase tracking-widest border border-primary/20">
                 {t('emr_v2.workspace.site')}: {activeFacilityId}
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
              <button disabled={isSaving} onClick={() => handleAction('DRAFT')} className="btn-ghost px-4 py-2 text-xs font-black uppercase">{t('emr_v2.actions.save_draft')}</button>
              {isDoctor ? (
                <button disabled={isSaving} onClick={() => setShowConfirm(true)} className="btn-primary px-6 py-3 text-xs font-black uppercase tracking-widest shadow-lg">{t('emr_v2.actions.sign_off')}</button>
              ) : (
                <div className="flex-row items-center px-4 bg-surface-container-high rounded-xl text-[8px] font-black uppercase opacity-40">{t('emr_v2.roles.doctor_only')}</div>
              )}
           </div>
        </div>

         {criticalLabResult && (
            <div className="p-6 bg-error text-white rounded-2xl flex-row justify-between items-center shadow-xl animate-bounce-short mb-6 border-4 border-white/20">
               <div className="flex-row items-center gap-6">
                  <span className="material-symbols-outlined text-4xl">emergency</span>
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{t('emr_v2.alerts.critical_lab')}</h3>
                     <p className="text-xs font-bold opacity-80">
                        {criticalLabResult.test_name}: <span className="text-xl font-black">{criticalLabResult.result_value}</span> {criticalLabResult.unit}
                     </p>
                  </div>
               </div>
               <button className="bg-surface-container-highest text-error px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                  {t('emr_v2.alerts.ack_details')}
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
              <div className="flex-column gap-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                 <label className="text-[10px] font-black uppercase text-primary">{t('emr_v2.soap.subjective')}</label>
                 <div className="flex flex-row flex-wrap gap-2 mb-2">
                    {PMH_CHIPS.map(chip => (
                       <button
                         key={chip}
                         onClick={() => setSubjective(prev => prev.includes(chip) ? prev.replace(new RegExp(`(?:, )?${chip}`), '') : prev ? `${prev}, ${chip}` : chip)}
                         className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-all ${subjective.includes(chip) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary/50'}`}
                       >
                          + {chip}
                       </button>
                    ))}
                 </div>
                 <textarea className="form-input min-h-[100px] text-sm leading-relaxed" placeholder="Keluhan Utama & Riwayat Penyakit Sekarang..." value={subjective} onChange={e => setSubjective(e.target.value)} />
              </div>
              <div className="flex-column gap-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                 <div className="flex-row justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-secondary">{t('emr_v2.soap.objective')}</label>
                    <span className="text-[8px] font-black uppercase opacity-60 bg-surface-container px-2 py-1 rounded">Vitals Auto-Synced</span>
                 </div>
                 <textarea className="form-input min-h-[80px] text-sm leading-relaxed" placeholder="Hasil Pemeriksaan Fisik (Kepala, Thorax, Abdomen, Ekstremitas)..." value={objective} onChange={e => setObjective(e.target.value)} />
              </div>
              <div className="flex-column gap-2 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant relative">
                  <div className="flex-row justify-between items-center">
                     <label className="text-[10px] font-black uppercase text-error">{t('emr_v2.soap.assessment')}</label>
                     {assessment.length > 0 && (
                        <div className={`flex-row items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest
                           ${validateClaimReadiness({}, { assessment, status: 'SIGNED' }).ready ? 'bg-success/10 text-success' : 'bg-error-container text-error animate-pulse'}`}>
                           <span className="material-symbols-outlined text-[10px]">shield_with_heart</span>
                           {validateClaimReadiness({}, { assessment, status: 'SIGNED' }).ready ? t('emr_v2.soap.claim_ready') : t('emr_v2.soap.claim_risk')}
                        </div>
                     )}
                  </div>
                  
                  <div className="flex flex-row flex-wrap gap-2 mb-2">
                     {ICD_10_CODES.map(icd => (
                        <button
                          key={icd.code}
                          onClick={() => {
                             setSelectedIcd(icd.code);
                             if (!assessment.includes(icd.description)) {
                                setAssessment(prev => prev ? `${prev}\n${icd.description}` : icd.description);
                             }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black flex-row items-center gap-2 border transition-all ${selectedIcd === icd.code ? 'bg-error text-white border-error shadow-sm' : 'bg-surface border-outline-variant text-on-surface hover:border-error/50'}`}
                        >
                           <span className="opacity-60">{icd.code}</span>
                           <span className="truncate max-w-[120px]">{icd.description}</span>
                        </button>
                     ))}
                  </div>

                  <textarea className="form-input min-h-[100px] text-sm leading-relaxed font-bold" placeholder="Diagnosis Klinis / ICD-10..." value={assessment} onChange={e => setAssessment(e.target.value)} />
               </div>
           </div>

            <div className="flex-1 flex-column gap-6 overflow-y-auto w-full xl:max-w-[420px]">
               {/* ─── ORDER ENTRY: PHARMACY ─── */}
               <div className="flex-column gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                 <div className="flex-row items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">prescriptions</span>
                    <label className="text-[10px] font-black uppercase text-primary">{t('emr_v2.soap.pharmacy')}</label>
                 </div>
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
                            className={`flex-row items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                              ${hasConflict ? 'border-error bg-error-container text-on-error-container' : 
                                isOutOfStock ? 'bg-surface-container opacity-50 grayscale border-transparent' :
                                isSelected ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface border-outline-variant hover:border-primary/30'}`}
                          >
                             <span className="material-symbols-outlined text-sm">
                               {hasConflict ? 'warning' : isOutOfStock ? 'inventory_2' : med.route === 'IV' ? 'colorize' : 'pill'}
                             </span>
                             <div className="flex-1 min-w-0">
                                <div className="flex-row justify-between items-center">
                                   <div className="text-[10px] font-black truncate">{med.medication_name}</div>
                                   {!hasConflict && (
                                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOutOfStock ? 'bg-error animate-pulse' : 'bg-success'}`} />
                                   )}
                                </div>
                                <div className="text-[8px] font-bold opacity-70 uppercase tracking-wider mt-0.5">
                                  {hasConflict ? `⚠️ ${t('emr_v2.alerts.allergy_conflict')}` : isOutOfStock ? t('emr_v2.pharmacy.out_of_stock') : `${med.dosage} • ${med.route}`}
                                </div>
                             </div>
                             {isSelected && <span className="material-symbols-outlined text-sm">verified</span>}
                          </button>
                       );
                    })}
                 </div>
               </div>

               {/* ─── ORDER ENTRY: DIAGNOSTICS ─── */}
               <div className="flex-column gap-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                  <div className="flex-row items-center gap-2">
                     <span className="material-symbols-outlined text-secondary text-sm">biotech</span>
                     <label className="text-[10px] font-black uppercase text-secondary">Instruksi Medis (CPOE)</label>
                  </div>
                  
                  <div className="flex-column gap-2">
                     <span className="text-[8px] font-black uppercase opacity-50">Laboratorium</span>
                     <div className="flex flex-row flex-wrap gap-2">
                        {LAB_ORDERS.map(lab => (
                           <button
                             key={lab.id}
                             onClick={() => toggleLab(lab)}
                             className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all flex-row items-center gap-2
                                ${selectedLabs.find(l => l.id === lab.id) ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-surface border-outline-variant text-on-surface hover:border-secondary/50'}`}
                           >
                              <span className="material-symbols-outlined text-[10px]">science</span>
                              {lab.test_name}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="flex-column gap-2 mt-2">
                     <span className="text-[8px] font-black uppercase opacity-50">Radiologi</span>
                     <div className="flex flex-row flex-wrap gap-2">
                        {RAD_ORDERS.map(rad => (
                           <button
                             key={rad.id}
                             onClick={() => toggleRad(rad)}
                             className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all flex-row items-center gap-2
                                ${selectedRads.find(r => r.id === rad.id) ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-surface border-outline-variant text-on-surface hover:border-secondary/50'}`}
                           >
                              <span className="material-symbols-outlined text-[10px]">radiology</span>
                              {rad.test_name}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>


              <div className="flex-column gap-2">
                 <label className="text-[10px] font-black uppercase text-on-surface-variant">{t('emr_v2.soap.plan')}</label>
                 <textarea className="form-input h-[120px] text-xs font-medium" placeholder={t('emr_v2.placeholders.instructions')} value={planInstructions} onChange={e => setPlanInstructions(e.target.value)} />
              </div>

              <ClinicalCard padding="1.5rem" className="bg-surface-container border-t-4 border-error/20">
                 <header className="flex-row justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase opacity-60">{t('emr_v2.discharge.title')}</span>
                    <span className="material-symbols-outlined text-sm opacity-20 text-error">logout</span>
                 </header>
                 <p className="text-[10px] opacity-60 mb-4 leading-tight">{t('emr_v2.discharge.subtitle')}</p>
                 <button 
                   onClick={handleDischarge}
                   disabled={!selectedEncounterId || isSaving || !isDoctor}
                   className={`w-full btn-ghost py-3 text-[10px] font-black uppercase border border-error/20 flex-row items-center justify-center gap-2 
                     ${!isDoctor ? 'opacity-20 cursor-not-allowed' : 'hover:bg-error/5 text-error'}`}
                 >
                    <span className="material-symbols-outlined text-sm">door_open</span>
                    {isDoctor ? t('emr_v2.discharge.execute') : t('emr_v2.discharge.restricted')}
                 </button>
              </ClinicalCard>
           </div>
        </div>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-surface-lowest-transparent backdrop-blur-sm z-[150] flex-row items-center justify-center p-8">
           <ClinicalCard maxWidth="500px" padding="2.5rem" className="shadow-2xl border-t-8 border-primary animate-scale-in">
              <div className="text-center mb-8">
                 <span className="material-symbols-outlined text-primary text-7xl mb-4">gavel</span>
                 <h3 className="text-2xl font-black">{t('emr_v2.confirm.title')}</h3>
                 <p className="text-sm text-on-surface-variant font-medium mt-2 italic px-4">"{t('emr_v2.confirm.certify')}"</p>
              </div>
              <div className="bg-surface-container p-4 rounded-xl mb-8 border border-outline-variant min-w-0">
                  <div className="flex-row justify-between mb-2 min-w-0">
                     <span className="text-[10px] font-black uppercase opacity-60 shrink-0 mr-4">{t('emr_v2.confirm.entity')}</span>
                     <span className="text-xs font-black truncate">{currentUser.email.split('@')[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-row justify-between min-w-0">
                     <span className="text-[10px] font-black uppercase opacity-60 shrink-0 mr-4">{t('emr_v2.confirm.legal_force')}</span>
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-surface px-2 rounded shrink-0">{t('emr_v2.workspace.append_final')}</span>
                  </div>
               </div>
              <div className="flex-column gap-3">
                 <button disabled={isSaving} onClick={() => handleAction('SIGNED')} className="btn-primary w-full py-4 text-xs font-black uppercase tracking-widest shadow-lg">{t('emr_v2.confirm.execute')}</button>
                 <button onClick={() => setShowConfirm(true)} className="btn-ghost w-full font-bold opacity-60">{t('emr_v2.confirm.review')}</button>
              </div>
           </ClinicalCard>
        </div>
      )}
    </div>
  );
}
