import React, { useState, useEffect } from 'react';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { getGroupPerformance } from '../services/enterprise.service.js';

/**
 * EnterpriseHub — The corporate command center for hospital networks.
 */
export default function EnterpriseHub() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroupPerformance().then(data => {
      setFacilities(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse uppercase font-black opacity-20 text-4xl">Syncing Group Data...</div>;

  const totalGroupRevenue = 'RP 7.3M';
  const avgGroupBOR = 73.6;

  return (
    <div className="p-8 flex-column gap-10 animate-fade-in max-w-[1600px] mx-auto w-full h-full overflow-y-auto">
       <header className="flex-row justify-between items-end border-b-4 border-on-surface pb-6">
          <div>
             <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">Group Intelligence</h1>
             <p className="text-on-surface-variant font-medium opacity-60">Enterprise Network Oversight • Multi-Facility Analytics</p>
          </div>
          <div className="text-right">
             <span className="text-xs font-black uppercase opacity-40">System Status</span>
             <div className="flex-row items-center gap-2 mt-1">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-black text-success uppercase">All Sites Operational</span>
             </div>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ClinicalCard padding="2.5rem" className="bg-primary text-white border-none shadow-2xl relative overflow-hidden">
             <span className="material-symbols-outlined absolute -right-8 -bottom-8 text-white/10 text-[12rem]">hub</span>
             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Group Revenue</span>
             <h2 className="text-6xl font-black tabular-nums mt-2">{totalGroupRevenue}</h2>
             <div className="mt-8 flex-row gap-6">
                <div className="flex-column">
                   <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Active Sites</span>
                   <span className="text-2xl font-black">3 / 3</span>
                </div>
                <div className="flex-column border-l border-white/20 pl-6">
                   <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Growth</span>
                   <span className="text-2xl font-black">+14.2%</span>
                </div>
             </div>
          </ClinicalCard>

          <ClinicalCard padding="2.5rem" className="bg-surface border-none shadow-sm flex-column justify-center text-center">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Network Capacity (Avg BOR)</span>
             <div className="text-7xl font-black text-primary tabular-nums tracking-tighter mb-4">{avgGroupBOR}%</div>
             <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${avgGroupBOR}%` }} />
             </div>
          </ClinicalCard>
       </div>

       <div className="flex-column gap-6">
          <h3 className="text-xl font-black uppercase tracking-tighter border-l-8 border-primary pl-4">Facility Performance Comparison</h3>
          
          <div className="grid grid-cols-1 gap-4">
             {facilities.map((site, i) => (
                <div key={i} className="bg-surface p-8 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-lg transition-all flex-row justify-between items-center group">
                   <div className="flex-row items-center gap-6">
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center 
                         ${site.status === 'CRITICAL_LOAD' ? 'bg-error text-white' : 'bg-surface-container text-on-surface'}`}>
                         <span className="material-symbols-outlined text-3xl">domain</span>
                      </div>
                      <div className="flex-column">
                         <h4 className="text-xl font-black uppercase tracking-tighter">{site.name}</h4>
                         <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Site ID: {site.id}</p>
                      </div>
                   </div>

                   <div className="flex-row gap-12 text-center">
                      <div className="flex-column">
                         <span className="text-[9px] font-black uppercase opacity-40">Occupancy</span>
                         <span className={`text-xl font-black tabular-nums ${site.bor > 90 ? 'text-error' : 'text-primary'}`}>{site.bor}%</span>
                      </div>
                      <div className="flex-column border-l border-outline-variant pl-12">
                         <span className="text-[9px] font-black uppercase opacity-40">Est. Revenue</span>
                         <span className="text-xl font-black tabular-nums text-on-surface">{site.revenue}</span>
                      </div>
                      <div className="flex-column border-l border-outline-variant pl-12 min-w-[140px]">
                         <span className="text-[9px] font-black uppercase opacity-40">Ops Status</span>
                         <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1
                            ${site.status === 'STABLE' ? 'bg-success/10 text-success' : 'bg-error text-white animate-pulse'}`}>
                            {site.status.replace('_', ' ')}
                         </span>
                      </div>
                   </div>

                   <button className="material-symbols-outlined opacity-20 group-hover:opacity-100 transition-all text-4xl">arrow_forward_ios</button>
                </div>
             ))}
          </div>
       </div>

       <footer className="mt-8 p-10 bg-surface-container rounded-[4rem] text-center">
          <p className="text-xs font-black uppercase opacity-20 tracking-[1em]">NurseFlow Enterprise Engine v1.0</p>
       </footer>
    </div>
  );
}
