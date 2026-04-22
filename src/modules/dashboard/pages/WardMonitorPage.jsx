import React, { useEffect, useState, useMemo } from 'react';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { getTriageColor } from '../../../utils/clinicalCalculators.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { useNavigate } from 'react-router-dom';
import HandoverModal from '../../handover/components/HandoverModal';
import { getIsolationType } from '../../core/services/pci.service.js';

export default function WardMonitorPage() {
  const navigate = useNavigate();
  const { activeEncounters, fetchActiveEncounters, isLoading: encountersLoading } = useEncounterStore();
  const { patients, fetchPatients, isLoading: patientsLoading } = usePatientStore();
  
  const [filter, setFilter] = useState('ALL'); // ALL, CRITICAL, STABLE
  const [handoverContext, setHandoverContext] = useState(null); // { patient, encounter }

  useEffect(() => {
    fetchActiveEncounters();
    fetchPatients();
  }, [fetchActiveEncounters, fetchPatients]);

  // Combine data and sort by risk
  const surveillanceData = useMemo(() => {
    return activeEncounters.map(enc => {
      const patient = patients.find(p => p.id === enc.patient_id);
      return {
        ...enc,
        patientName: patient?.name || 'Unknown Patient',
        mrn: patient?.mrn || 'N/A',
        news2: enc.last_news2 || 0,
        riskLevel: enc.escalation_level || 'NONE',
        isolationType: getIsolationType(enc.chief_complaint || enc.assessment), 
        triageColor: getTriageColor(enc.last_news2 || 0),
        lastObs: enc.updated_at?.toDate() 
      };
    }).sort((a, b) => (b.news2 || 0) - (a.news2 || 0));
  }, [activeEncounters, patients]);

  const filteredData = surveillanceData.filter(item => {
    if (filter === 'CRITICAL') return item.news2 >= 7;
    if (filter === 'STABLE') return item.news2 < 3;
    return true;
  });

  const criticalCount = surveillanceData.filter(p => p.news2 >= 7).length;

  if (encountersLoading || patientsLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex-column items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-black uppercase tracking-widest opacity-40">Initializing Ward Surveillance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full relative">
      {/* 🛡️ CLINICAL CONTINUITY: SBAR MODAL */}
      {handoverContext && (
        <HandoverModal 
          patient={handoverContext.patient} 
          encounter={handoverContext.encounter} 
          onClose={() => setHandoverContext(null)} 
        />
      )}

      <header className="flex-row items-center justify-between mb-8">
        <div>
          <h2 className="title text-primary">Ward Intelligence Monitor</h2>
          <p className="text-on-surface-variant text-sm mt-1">Real-time surveillance grid for centralized clinical oversight.</p>
        </div>
        <div className="flex-row gap-3">
           <div className={`px-4 py-2 rounded-xl flex-row items-center gap-3 border ${criticalCount > 0 ? 'bg-error-container border-error text-on-error-container animate-pulse' : 'bg-surface-container border-outline-variant'}`}>
              <span className="material-symbols-outlined text-sm">{criticalCount > 0 ? 'emergency' : 'check_circle'}</span>
              <span className="text-xs font-black uppercase tracking-widest">{criticalCount} Critical Risks Detected</span>
           </div>
        </div>
      </header>

      <div className="flex-row gap-4 mb-8">
         {['ALL', 'CRITICAL', 'STABLE'].map(f => (
           <button 
             key={f}
             onClick={() => setFilter(f)}
             className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-lg' : 'bg-surface-container text-on-surface-variant hover:bg-outline-variant'}`}
           >
             {f} PATIENTS
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredData.map(item => (
          <ClinicalCard 
            key={item.id} 
            padding="1.5rem" 
            className={`cursor-pointer hover:border-primary transition-all relative overflow-hidden group ${item.news2 >= 7 ? 'border-l-8 border-l-error bg-error-container/10' : ''}`}
            onClick={() => {
              navigate('/emr'); // Navigate to EMR for action
            }}
          >
            <div className="flex-row justify-between items-start mb-4">
              <div className="flex-column">
                <span className="text-lg font-black text-on-surface group-hover:text-primary transition-colors">{item.patientName}</span>
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">MRN: {item.mrn} • Room {item.ward || 'Triage'}</span>
                {item.isolationType && (
                  <div className={`mt-2 flex-row items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border border-error animate-pulse bg-error/5 text-error`}>
                    <span className="material-symbols-outlined text-[10px]">biosecurity</span>
                    {item.isolationType} ISOLATION
                  </div>
                )}
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black bg-${item.triageColor} text-white shadow-lg`}>
                {item.news2}
              </div>
            </div>

            <div className="flex-column gap-3">
               <div className="flex-row justify-between items-center text-[10px] font-bold opacity-60">
                  <span>CLINICAL RISK</span>
                  <span className={`px-2 py-0.5 rounded text-white bg-${item.triageColor} uppercase`}>{item.riskLevel}</span>
               </div>
               <div className="flex-row justify-between items-center text-[10px] font-bold opacity-60">
                  <span>LAST OBSERVATION</span>
                  <span className="tabular-nums">{item.lastObs ? item.lastObs.toLocaleTimeString() : 'N/A'}</span>
               </div>
               
               <div className="mt-4 pt-4 border-t border-outline-variant border-dashed flex-row justify-between items-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setHandoverContext({ 
                        patient: patients.find(p => p.id === item.patient_id), 
                        encounter: item 
                      });
                    }}
                    className="btn-ghost py-1 px-3 text-[8px] font-black uppercase border border-primary/20 hover:bg-primary/5 flex-row items-center gap-1"
                  >
                     <span className="material-symbols-outlined text-[12px]">sync_alt</span>
                     Handover
                  </button>
                  <span className="material-symbols-outlined text-sm opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">arrow_forward_ios</span>
               </div>
            </div>

            {item.news2 >= 7 && (
              <div className="absolute top-0 right-0 p-1 bg-error text-white">
                <span className="material-symbols-outlined text-[12px] animate-spin">emergency</span>
              </div>
            )}
          </ClinicalCard>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-outline-variant rounded-3xl opacity-40">
             <span className="material-symbols-outlined text-6xl mb-4">person_search</span>
             <p className="text-sm font-black uppercase tracking-widest">No Patients Found in this Category</p>
          </div>
        )}
      </div>
    </div>
  );
}
