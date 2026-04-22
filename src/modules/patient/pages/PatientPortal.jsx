import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PresentationCard from '../../../components/ui/PresentationCard';
import { selfCheckIn, getEstimatedWaitTime } from '../services/queue.service.js';
import { getAssignedMaterials } from '../../emr/services/pfe.service.js';

/**
 * PatientPortal — Empowering patients with mobile-first healthcare control.
 */
export default function PatientPortal() {
  const navigate = useNavigate();
  const [activeTicket, setActiveTicket] = useState({
    id: 'Q-991',
    code: 'OPD-042',
    position: 4,
    status: 'WAITING',
    checkIn: 'PENDING'
  });

  const [checkingIn, setCheckingIn] = useState(false);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    // Simulate API call
    setTimeout(() => {
      setActiveTicket(prev => ({ ...prev, checkIn: 'ARRIVED' }));
      setCheckingIn(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface-container flex flex-col p-6 animate-fade-in md:max-w-[480px] md:mx-auto">
       <header className="flex flex-row justify-between items-center mb-10">
          <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Patient Workspace</span>
             <h1 className="text-2xl font-black tracking-tighter">My Journey</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
             <span className="material-symbols-outlined">person</span>
          </div>
       </header>

       {/* 🎫 ACTIVE TICKET */}
       <PresentationCard padding="2rem" className="bg-white border-none shadow-xl rounded-[3rem] mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100%] -mr-8 -mt-8" />
          
          <div className="flex flex-col items-center text-center mb-8">
             <span className="text-[10px] font-black uppercase opacity-40 mb-2">Current Position</span>
             <span className="text-7xl font-black tracking-tighter text-primary tabular-nums">#{activeTicket.position}</span>
             <p className="text-xs font-bold opacity-60 mt-2 italic">"{activeTicket.position - 1} people ahead of you"</p>
          </div>

          <div className="flex flex-row justify-between items-center bg-surface-container p-6 rounded-3xl mb-8">
             <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase opacity-40">Your Ticket</span>
                <span className="text-2xl font-black">{activeTicket.code}</span>
             </div>
             <div className="flex flex-col text-right">
                <span className="text-[9px] font-black uppercase opacity-40">Est. Wait</span>
                <span className="text-xl font-black text-secondary">{getEstimatedWaitTime(activeTicket.position)}m</span>
             </div>
          </div>

          {activeTicket.checkIn === 'PENDING' ? (
            <button 
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="w-full py-5 bg-primary text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
            >
               <span className="material-symbols-outlined">{checkingIn ? 'sync' : 'location_on'}</span>
               {checkingIn ? 'Verifying Arrival...' : 'Confirm Arrival (Check-In)'}
            </button>
          ) : (
            <div className="flex flex-row items-center justify-center gap-3 py-5 bg-success/10 text-success rounded-3xl border border-success/20">
               <span className="material-symbols-outlined">verified</span>
               <span className="text-xs font-black uppercase tracking-widest">Arrival Confirmed</span>
            </div>
          )}
       </PresentationCard>

       {/* 🏥 FACILITY INFO */}
       <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Next Steps</h3>
          
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-outline-variant flex flex-row items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined">description</span>
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black">Pre-Visit Screening</span>
                <span className="text-[10px] font-medium opacity-60">Complete forms to save time</span>
             </div>
             <span className="material-symbols-outlined ml-auto opacity-20">chevron_right</span>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-outline-variant flex flex-row items-center gap-4 cursor-pointer hover:bg-primary/5 transition-all" onClick={() => navigate('/wayfinding?to=lab')}>
             <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">explore</span>
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-black">Find My Way to Lab</span>
                <span className="text-[10px] font-medium opacity-60">Navigate to your pending blood test</span>
             </div>
             <span className="material-symbols-outlined ml-auto opacity-20">chevron_right</span>
          </div>

          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2 mt-8">My Learning Center</h3>
          {getAssignedMaterials('MOCK_PID').map((item, idx) => (
            <div key={idx} className="bg-surface-container-highest p-5 rounded-3xl flex flex-row items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined">{item.type === 'VIDEO' ? 'play_circle' : 'article'}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-xs font-black">{item.title}</span>
                  <span className="text-[10px] font-medium opacity-60">Educational Resource</span>
               </div>
               <span className="material-symbols-outlined ml-auto text-secondary">open_in_new</span>
            </div>
          ))}
       </div>

       <footer className="mt-8 text-center text-[9px] font-medium opacity-40 leading-relaxed">
          "NurseFlow Patient Experience™ — Real-time Health Journey Management"
       </footer>
    </div>
  );
}
