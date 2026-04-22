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
    <div className="h-full flex-row overflow-hidden bg-black/5">
       {/* LEFT: Video Consultation Console */}
       <div className="w-[600px] flex-column p-8 gap-6 border-r border-outline-variant bg-surface-container-highest">
          <div className="flex-row justify-between items-center mb-4">
             <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase">{t('telemedicine.session', { defaultValue: 'Virtual Session' })}</h1>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Digital Health Secure Link</p>
             </div>
             <span className="chip chip-outline border-primary text-primary font-black animate-pulse text-[10px]">LIVE</span>
          </div>

          <div className="flex-1 bg-black rounded-[3rem] relative overflow-hidden shadow-2xl group">
             {/* Simulated Video Feed */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                   <span className="material-symbols-outlined text-white/10 text-9xl">person</span>
                   {!callActive && <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-4">Waiting for patient to join...</p>}
                </div>
             </div>

             {/* Doctor's Self-View (Small corner) */}
             <div className="absolute top-6 right-6 w-32 h-44 bg-surface-container rounded-2xl border border-white/20 shadow-lg overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-white/20">doctor</span>
             </div>

             {/* Call Controls Overlay */}
             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex-row gap-4 bg-white/10 backdrop-blur-xl p-4 rounded-full border border-white/20">
                <button className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-all">
                   <span className="material-symbols-outlined">mic</span>
                </button>
                <button 
                   onClick={() => setCallActive(!callActive)}
                   className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${callActive ? 'bg-error text-white' : 'bg-success text-white'}`}>
                   <span className="material-symbols-outlined">{callActive ? 'call_end' : 'call'}</span>
                </button>
                <button className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-all">
                   <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-all">
                   <span className="material-symbols-outlined">present_to_all</span>
                </button>
             </div>
          </div>

          <ClinicalCard padding="1.5rem" className="bg-white/40 border-none shadow-sm">
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
       <div className="flex-1 bg-white overflow-hidden flex-column">
          <div className="p-4 bg-primary text-white flex-row justify-between items-center px-8">
             <span className="text-[10px] font-black uppercase tracking-widest">Parallel Medical Documentation</span>
             <span className="material-symbols-outlined text-sm">history_edu</span>
          </div>
          <div className="flex-1 overflow-y-auto">
             <EMRPage hideSidebar={true} />
          </div>
       </div>
    </div>
  );
}
