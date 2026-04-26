import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import EMRPage from '../../emr/pages/EMRPage'; // Reusing EMR component in a pane

/**
 * TeleconsultationPage — The virtual clinical workspace for remote care.
 * Features a split-pane layout for video call and rekam medis.
 */
export default function TeleconsultationPage() {
  const { t } = useTranslation();
  const [callActive, setCallActive] = useState(false);

  return (
    <div className="h-full flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-background">
       {/* LEFT: Video Consultation Console */}
       <div className="w-full lg:w-[600px] shrink-0 flex-column p-4 lg:p-8 gap-6 border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-highest min-h-[500px]">
          <div className="flex-row justify-between items-center mb-4 min-w-0">
             <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tighter uppercase truncate">{t('telemedicine.session', { defaultValue: 'Virtual Session' })}</h1>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest truncate">Digital Health Secure Link</p>
             </div>
             <span className="chip chip-outline border-primary text-primary font-black animate-pulse text-[10px] shrink-0 ml-2">LIVE</span>
          </div>

          <div className="flex-1 bg-black rounded-[3rem] relative overflow-hidden shadow-2xl group">
             {/* Simulated Video Feed */}
             <div className="absolute inset-0 flex-row items-center justify-center">
                <div className="text-center">
                   <span className="material-symbols-outlined text-white/10 text-9xl">person</span>
                   {!callActive && <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-4">Waiting for patient to join...</p>}
                </div>
             </div>

             {/* Doctor's Self-View (Small corner) */}
             <div className="absolute top-6 right-6 w-32 h-44 bg-surface-container rounded-2xl border border-white/20 shadow-lg overflow-hidden flex-row items-center justify-center">
                <span className="material-symbols-outlined text-white/20">doctor</span>
             </div>

             {/* Call Controls Overlay */}
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex-row gap-4 bg-surface/10 backdrop-blur-xl p-4 rounded-full border border-white/10 shrink-0">
                <button className="w-12 h-12 rounded-full bg-on-surface/20 text-on-surface flex-row items-center justify-center hover:bg-on-surface/40 transition-all shrink-0">
                   <span className="material-symbols-outlined">mic</span>
                </button>
                <button 
                   onClick={() => setCallActive(!callActive)}
                   className={`w-12 h-12 rounded-full flex-row items-center justify-center transition-all shrink-0 ${callActive ? 'bg-error text-white' : 'bg-success text-white'}`}>
                   <span className="material-symbols-outlined">{callActive ? 'call_end' : 'call'}</span>
                </button>
                <button className="w-12 h-12 rounded-full bg-on-surface/20 text-on-surface flex-row items-center justify-center hover:bg-on-surface/40 transition-all shrink-0">
                   <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="w-12 h-12 rounded-full bg-on-surface/20 text-on-surface flex-row items-center justify-center hover:bg-on-surface/40 transition-all shrink-0">
                   <span className="material-symbols-outlined">present_to_all</span>
                </button>
             </div>
          </div>

          <ClinicalCard padding="1.5rem" className="bg-surface/40 border-none shadow-sm">
             <h3 className="text-[10px] font-black uppercase opacity-60 mb-4">{t('telemedicine.home_vitals', { defaultValue: 'Remote Vitals Stream' })}</h3>
             <div className="flex-row gap-6">
                <div className="flex-column items-center">
                   <span className="text-2xl font-black tabular-nums">98%</span>
                   <span className="text-[8px] font-bold opacity-40 uppercase">SpO2</span>
                </div>
                <div className="flex-column items-center">
                   <span className="text-2xl font-black tabular-nums">72</span>
                   <span className="text-[8px] font-bold opacity-40 uppercase">Pulse</span>
                </div>
                <div className="flex-column items-center">
                   <span className="text-2xl font-black tabular-nums text-error">38.2°C</span>
                   <span className="text-[8px] font-bold opacity-40 uppercase">Temp</span>
                </div>
             </div>
          </ClinicalCard>
       </div>

       {/* RIGHT: EMR / SOAP Integration */}
       <div className="flex-1 bg-surface flex-column min-h-[800px] lg:min-h-0 lg:overflow-hidden">
          <div className="p-4 bg-primary text-white flex-row justify-between items-center px-4 lg:px-8 min-w-0">
             <span className="text-[10px] font-black uppercase tracking-widest truncate">Parallel Medical Documentation</span>
             <span className="material-symbols-outlined text-sm shrink-0 ml-4">history_edu</span>
          </div>
          <div className="flex-1 overflow-y-auto">
             <EMRPage hideSidebar={true} />
          </div>
       </div>
    </div>
  );
}
