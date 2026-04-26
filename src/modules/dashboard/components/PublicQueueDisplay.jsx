import React, { useState, useEffect } from 'react';
import ClinicalCard from '../../../components/ui/ClinicalCard';

/**
 * PublicQueueDisplay — High-visibility lobby monitor for hospital flow.
 */
export default function PublicQueueDisplay() {
  const departments = [
    { name: 'General Outpatient (OPD)', current: 'OPD-038', waiting: 12 },
    { name: 'Pharmacy (Ambulatory)', current: 'PHAR-012', waiting: 5 },
    { name: 'Laboratory & Imaging', current: 'LAB-084', waiting: 2 },
    { name: 'Payment & Insurance', current: 'PAY-022', waiting: 8 },
  ];

  return (
    <div className="min-h-screen bg-on-surface text-surface p-12 flex-column gap-12 overflow-hidden">
       <header className="flex-row justify-between items-center border-b border-white/10 pb-8">
          <div className="flex-column gap-1">
             <h1 className="text-4xl font-black tracking-tighter uppercase text-primary">NurseFlow Queue Intelligence</h1>
             <p className="text-xs font-bold tracking-widest opacity-40 uppercase">Real-time Patient Flow Monitoring</p>
          </div>
          <div className="text-right">
             <span className="text-6xl font-black tabular-nums">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             <p className="text-[10px] font-bold opacity-40 uppercase">Safe Hospital Environment</p>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10 flex-1">
          {departments.map((dept, i) => (
             <ClinicalCard key={i} padding="3rem" className="bg-on-surface/5 border border-on-surface/10 rounded-[4rem] flex-row justify-between items-center group hover:bg-on-surface/10 transition-all">
                <div className="flex-column gap-4">
                   <h2 className="text-2xl font-black opacity-60 uppercase leading-none">{dept.name}</h2>
                   <div className="flex-row items-baseline gap-4">
                      <span className="text-9xl font-black tracking-tighter text-white tabular-nums group-hover:scale-105 transition-all duration-500">
                         {dept.current.split('-')[1]}
                      </span>
                      <span className="text-2xl font-black text-primary uppercase">{dept.current.split('-')[0]}</span>
                   </div>
                </div>
                
                <div className="bg-primary/20 p-8 rounded-[3rem] text-center min-w-[180px]">
                   <span className="text-[10px] font-black uppercase opacity-60 mb-2 block">Waiting</span>
                   <span className="text-4xl font-black text-primary tabular-nums">{dept.waiting}</span>
                </div>
             </ClinicalCard>
          ))}
       </div>

       <footer className="bg-primary p-6 rounded-[2rem] flex-row justify-between items-center">
          <div className="flex-row items-center gap-4">
             <span className="material-symbols-outlined text-on-primary animate-pulse">campaign</span>
             <p className="text-on-primary font-black uppercase tracking-widest text-sm">Now Serving: OPD-038 to Counter 4</p>
          </div>
          <div className="text-on-primary/60 text-[10px] font-black uppercase tracking-widest">
             Scan QR at lobby for mobile queue access
          </div>
       </footer>
    </div>
  );
}
