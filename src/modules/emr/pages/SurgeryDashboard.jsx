import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { getActiveSchedule, calculateAldreteScore } from '../services/surgery.service.js';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import '../styles/Surgery.css';

const SurgeryDashboard = () => {
  const { t } = useTranslation();
  const { isOnline } = { isOnline: true }; // Placeholder for hook
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const data = await getActiveSchedule();
        setSchedule(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return 'error';
      case 'IN_PREP': return 'warning';
      case 'POST_OP': return 'secondary';
      default: return 'success';
    }
  };

  return (
    <main className="surgery-dashboard">
      <section className="editorial-header">
        <div className="flex-row justify-between items-baseline min-w-0">
          <div className="min-w-0">
            <div className="flex-row items-center gap-2 min-w-0">
              <p className="subtitle m-0 truncate">ASC - Anesthesia & Surgical Care</p>
              <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-success' : 'bg-error'}`}></span>
            </div>
            <h2 className="title truncate">Surgery Command Center</h2>
          </div>
          <div className="date-chip shrink-0 ml-4">
            <span className="material-symbols-outlined icon-small text-primary">theater_comedy</span>
            <span>JCI Certified Pipeline</span>
          </div>
        </div>
      </section>

      <div className="bento-grid mt-8">
        {/* OR Status Overview */}
        <div className="grid grid-cols-12 gap-6">
          <PresentationCard style={{ gridColumn: 'span 4', height: '12rem' }}>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Active Procedures</span>
            <h3 className="text-6xl font-black text-primary mt-4">
              {schedule.filter(s => s.status === 'IN_PROGRESS').length}
            </h3>
            <p className="text-[10px] font-bold uppercase mt-auto">Real-time Intra-op Feed</p>
          </PresentationCard>

          <PresentationCard style={{ gridColumn: 'span 4', height: '12rem' }}>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Waiting for PACU</span>
            <h3 className="text-6xl font-black text-secondary mt-4">
              {schedule.filter(s => s.status === 'POST_OP').length}
            </h3>
            <p className="text-[10px] font-bold uppercase mt-auto">Post-Anesthesia Recovery</p>
          </PresentationCard>

          <ClinicalCard style={{ gridColumn: 'span 4', height: '12rem', borderLeft: '6px solid var(--primary)' }}>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Utilization Rate</span>
            <h3 className="text-5xl font-black text-on-surface mt-4">84<small className="text-xl">%</small></h3>
            <div className="w-full bg-surface-container h-1 mt-auto rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: '84%' }} />
            </div>
          </ClinicalCard>
        </div>

        {/* Live Worklist */}
        <div className="mt-8">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">Operating Room Live Feed</h3>
          <div className="flex-column gap-4">
            {isLoading ? (
              <p>Loading surgical pipeline...</p>
            ) : schedule.length === 0 ? (
              <div className="p-12 text-center bg-surface-container rounded-3xl opacity-40">
                <span className="material-symbols-outlined text-6xl mb-4">bed</span>
                <p className="font-black uppercase tracking-widest">No Active Procedures</p>
              </div>
            ) : schedule.map(item => (
               <ClinicalCard key={item.id} className="p-6 flex-row items-center gap-8 hover:shadow-lg transition-all min-w-0">
                <div className={`w-16 h-16 rounded-2xl bg-${getStatusColor(item.status)}/10 flex items-center justify-center text-${getStatusColor(item.status)} shrink-0`}>
                  <span className="material-symbols-outlined text-3xl">precision_manufacturing</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex-row items-center gap-3 min-w-0">
                    <h4 className="text-lg font-black truncate">{item.patient_name}</h4>
                    <span className={`chip chip-${getStatusColor(item.status)} text-[8px] font-black uppercase shrink-0`}>{item.status}</span>
                  </div>
                  <p className="text-xs font-bold opacity-60 uppercase mt-1 truncate">{item.procedure_name} • OR {item.room_number}</p>
                </div>
                <div className="text-right min-w-0">
                  <p className="text-[10px] font-black uppercase opacity-40 truncate">Surgeon</p>
                  <p className="text-sm font-black truncate">Dr. {item.surgeon_name}</p>
                </div>
                <div className="w-px h-12 bg-outline-variant" />
                <div className="flex-column items-end min-w-[120px] shrink-0">
                   <p className="text-[10px] font-black uppercase opacity-40">Safety Check</p>
                   <div className="flex-row gap-1 mt-1 shrink-0">
                      <span className={`material-symbols-outlined text-sm ${item.sign_in ? 'text-success' : 'opacity-20'}`}>check_circle</span>
                      <span className={`material-symbols-outlined text-sm ${item.time_out ? 'text-success' : 'opacity-20'}`}>check_circle</span>
                      <span className={`material-symbols-outlined text-sm ${item.sign_out ? 'text-success' : 'opacity-20'}`}>check_circle</span>
                   </div>
                </div>
                <button className="btn-primary py-3 px-6 text-[10px] font-black uppercase tracking-widest shrink-0">
                  View Track
                </button>
              </ClinicalCard>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SurgeryDashboard;
