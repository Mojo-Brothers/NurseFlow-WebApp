import React from 'react';
import { useTranslation } from 'react-i18next';
import ClinicalCard from '../../../components/ui/ClinicalCard';

/**
 * VirtualWaitingRoom — A comforting digital lobby for patients.
 */
export default function VirtualWaitingRoom({ doctorName, appointmentTime }) {
  const { t } = useTranslation();

  return (
    <div className="h-full bg-surface-container flex items-center justify-center p-8 animate-fade-in">
       <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="flex-column gap-8">
             <div>
                <h1 className="text-5xl font-black tracking-tighter text-primary leading-none mb-4">
                   Your Doctor <br/> is Readying.
                </h1>
                <p className="text-lg font-medium text-on-surface-variant opacity-60">
                   {t('telemedicine.waiting_msg', { defaultValue: 'Please stay in the room. Dr. {{name}} will join your secure consultation shortly.', name: doctorName })}
                </p>
             </div>

             <div className="flex-row gap-4">
                <div className="flex-column gap-1 bg-white p-6 rounded-[2rem] shadow-sm flex-1">
                   <span className="text-[10px] font-black uppercase opacity-40">Queue Status</span>
                   <span className="text-2xl font-black text-secondary">#02</span>
                </div>
                <div className="flex-column gap-1 bg-white p-6 rounded-[2rem] shadow-sm flex-1">
                   <span className="text-[10px] font-black uppercase opacity-40">Est. Waiting</span>
                   <span className="text-2xl font-black text-secondary">~5 Min</span>
                </div>
             </div>

             <div className="p-8 bg-primary/10 rounded-[3rem] border border-primary/20 flex-row gap-6 items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                   <span className="material-symbols-outlined text-primary text-3xl">emergency_home</span>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Safety Instruction</p>
                   <p className="text-xs font-bold leading-tight">If you feel a medical emergency, please call 119 immediately instead of waiting for tele-consult.</p>
                </div>
             </div>
          </div>

          <ClinicalCard padding="0" className="aspect-[4/5] bg-white shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
             {/* Educational Video Placeholder */}
             <div className="absolute inset-0 flex items-center justify-center bg-surface-container-highest">
                <span className="material-symbols-outlined text-primary/20 text-9xl">play_circle</span>
             </div>
             
             <div className="absolute bottom-10 left-10 right-10 z-20">
                <p className="text-[10px] font-black uppercase text-white/60 mb-2">Patient Education Feed</p>
                <h3 className="text-2xl font-black text-white leading-tight">Understanding Your Post-Surgical Care at Home.</h3>
             </div>
          </ClinicalCard>
       </div>
    </div>
  );
}
