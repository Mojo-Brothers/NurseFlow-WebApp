import React from 'react';
import { useTranslation } from 'react-i18next';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import DiagnosticViewer from '../../diagnostics/components/DiagnosticViewer';
import SurgicalChecklist from '../components/SurgicalChecklist';
import PatientEducationForm from '../components/PatientEducationForm';
import DigitalInformedConsent from '../components/DigitalInformedConsent';

export default function EmrSidebar({
  activePatient,
  patients,
  selectedPatientId,
  selectPatient,
  patientRecords,
  activeSidebarTab,
  setActiveSidebarTab,
  selectedEncounterId,
  setShowHandover,
  currentUser
}) {
  const { t } = useTranslation();

  return (
    <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-6">
      <ClinicalCard padding="1.5rem" className="bg-surface-container-low border-l-4 border-primary relative">
        <div className="flex flex-row items-baseline gap-3 mb-2">
          <h2 className="text-2xl font-black text-primary">{activePatient?.name || t('emr.select_patient', { defaultValue: 'Select Patient' })}</h2>
          <span className="text-xs font-bold text-on-surface-variant">{t('patient_form.mrn')}: {activePatient?.mrn}</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-tighter opacity-60 mb-4">
          {activePatient?.demographics?.gender === 'M' ? t('patient_form.gender_m') : t('patient_form.gender_f')} • {calculateAge(activePatient?.demographics?.dob)} {t('triage.yrs')}
        </p>
        <button 
          onClick={() => setShowHandover(true)}
          disabled={!selectedPatientId}
          className="w-full bg-transparent py-2 text-[10px] font-black uppercase border border-primary/20 hover:bg-primary/5 flex flex-row items-center justify-center gap-2"
        >
           <span className="material-symbols-outlined text-sm">sync_alt</span>
           {t('emr_v2.handover', { defaultValue: 'Handover' })}
        </button>
      </ClinicalCard>

      <select className="w-full bg-surface border-2 border-outline p-3 font-body font-bold text-sm text-on-surface focus:border-primary focus:outline-none" 
        value={selectedPatientId || ''} 
        onChange={(e) => selectPatient(e.target.value)}
      >
        <option value="">{t('emr_v2.switch_context', { defaultValue: '-- Switch Patient --' })}</option>
        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.mrn})</option>)}
      </select>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
          <div className="flex flex-row flex-wrap gap-4 px-2 mb-2">
             <button 
               onClick={() => setActiveSidebarTab('TIMELINE')}
               className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                 ${activeSidebarTab === 'TIMELINE' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant opacity-40'}`}
             >
               {t('emr_v2.history', { defaultValue: 'History' })}
             </button>
             <button 
               onClick={() => setActiveSidebarTab('DIAGNOSTICS')}
               className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                 ${activeSidebarTab === 'DIAGNOSTICS' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant opacity-40'}`}
             >
               {t('emr_v2.diagnostics', { defaultValue: 'Diagnostics' })}
             </button>
             <button 
               onClick={() => setActiveSidebarTab('SURGERY')}
               className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                 ${activeSidebarTab === 'SURGERY' ? 'border-error text-error' : 'border-transparent text-on-surface-variant opacity-40'}`}
             >
               {t('emr_v2.surgery', { defaultValue: 'Surgery' })}
             </button>
             <button 
               onClick={() => setActiveSidebarTab('EDUCATION')}
               className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                 ${activeSidebarTab === 'EDUCATION' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant opacity-40'}`}
             >
               {t('emr_v2.education', { defaultValue: 'Education' })}
             </button>
             <button 
               onClick={() => setActiveSidebarTab('CONSENT')}
               className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-2 transition-all 
                 ${activeSidebarTab === 'CONSENT' ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant opacity-40'}`}
             >
               {t('emr_v2.consent', { defaultValue: 'Consent' })}
             </button>
          </div>

         {activeSidebarTab === 'TIMELINE' ? (
           <>
             {patientRecords.length === 0 ? (
               <p className="text-xs italic opacity-40 text-center py-10">{t('emr_v2.workspace.no_prior_records', { defaultValue: 'No prior records found.' })}</p>
             ) : patientRecords.map(rec => (
               <ClinicalCard key={rec.id} padding="1rem" className="relative hover:border-primary transition-all">
                  <div className="flex flex-row justify-between mb-4 pb-2 border-b border-outline-variant border-dashed">
                     <span className="text-[10px] font-black text-primary uppercase">{rec.status === 'SIGNED' ? t('emr_v2.workspace.signed', { defaultValue: 'SIGNED' }) : t('emr_v2.workspace.draft', { defaultValue: 'DRAFT' })}</span>
                     <span className="text-[10px] opacity-40 font-bold tabular-nums">{rec.created_at?.toDate().toDateString()}</span>
                  </div>
                  <div className="space-y-4 mb-4">
                     <div>
                        <p className="text-[9px] font-black uppercase opacity-60 mb-1">{t('emr_v2.sections.subjective', { defaultValue: 'Subjective' })}</p>
                        <p className="text-xs leading-relaxed">{rec.subjective}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase opacity-60 mb-1">{t('emr_v2.sections.assessment', { defaultValue: 'Assessment' })}</p>
                        <p className="text-xs leading-relaxed font-bold">{rec.assessment}</p>
                     </div>
                  </div>
                  {rec.status === 'SIGNED' && (
                    <div className="pt-2 border-t border-outline-variant flex flex-row justify-between items-center opacity-60">
                       <span className="text-[8px] font-black uppercase">Trace ID: {rec.id.slice(0,8)}</span>
                       <span className="text-[8px] font-bold italic">{t('emr_v2.workspace.doctor_prefix', { defaultValue: 'Dr. ' })}{rec.doctor?.split('@')[0]}</span>
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
  );
}
