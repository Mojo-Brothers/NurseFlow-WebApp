import React, { useState } from 'react';
import ClinicalCard from '../../../components/ui/ClinicalCard';

/**
 * InsuranceDashboard — The high-performance revenue lifecycle hub.
 */
export default function InsuranceDashboard() {
  const [activeTab, setActiveTab] = useState('DRAFT');

  const stats = [
    { label: 'Draft Claims', value: '12', color: 'bg-primary' },
    { label: 'Awaiting Verification', value: '45', color: 'bg-secondary' },
    { label: 'Approved Today', value: 'RP 240M', color: 'bg-success' },
    { label: 'Rejections', value: '3', color: 'bg-error' },
  ];

  const claims = [
    { id: 'CL-9821', patient: 'Budi Santoso', diagnosis: 'K35.8 (Appendicitis)', amount: 'RP 12.500.000', status: 'DRAFT', risk: 'LOW' },
    { id: 'CL-9819', patient: 'Siti Aminah', diagnosis: 'E11.9 (Diabetes)', amount: 'RP 4.200.000', status: 'DRAFT', risk: 'HIGH' },
  ];

  return (
    <div className="p-8 flex-column gap-10 animate-fade-in max-w-[1600px] mx-auto w-full h-full overflow-y-auto">
       <header className="flex-row justify-between items-end">
          <div>
             <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Revenue Intelligence</h1>
             <p className="text-on-surface-variant font-medium opacity-60">Insurance Claim Lifecycle & Casemix Optimization</p>
          </div>
          <div className="flex-row gap-3">
             <button className="btn-ghost text-[10px] font-black uppercase px-6 py-3 border border-outline-variant">Batch Submit BPJS</button>
             <button className="btn-primary text-[10px] font-black uppercase px-8 py-3 shadow-lg">New Claim Entry</button>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
             <ClinicalCard key={i} padding="1.5rem" className="bg-white border-none shadow-sm flex-column">
                <span className="text-[10px] font-black uppercase opacity-40 mb-1">{stat.label}</span>
                <span className="text-3xl font-black tabular-nums">{stat.value}</span>
                <div className={`h-1 w-12 mt-4 rounded-full ${stat.color}`} />
             </ClinicalCard>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
          {/* 📋 CLAIM WORKLIST */}
          <div className="lg:col-span-9 flex-column gap-6">
             <div className="flex-row gap-6 border-b border-outline-variant">
                {['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'].map(tab => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all
                       ${activeTab === tab ? 'border-b-4 border-primary text-primary' : 'opacity-40 hover:opacity-100'}`}>
                      {tab}
                   </button>
                ))}
             </div>

             <div className="bg-white rounded-[2.5rem] border border-outline-variant overflow-hidden shadow-sm flex-1">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-surface-container text-[10px] font-black uppercase opacity-60">
                         <th className="p-6">Claim Entity</th>
                         <th className="p-6">Diagnosis (ICD-10)</th>
                         <th className="p-6">Est. Reimbursement</th>
                         <th className="p-6">Audit Risk</th>
                         <th className="p-6">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="text-xs font-medium">
                      {claims.map((claim, i) => (
                         <tr key={i} className="border-t border-outline-variant hover:bg-surface-container-low transition-all">
                            <td className="p-6">
                               <p className="font-black text-sm">{claim.patient}</p>
                               <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">{claim.id}</p>
                            </td>
                            <td className="p-6 font-bold text-on-surface-variant italic">"{claim.diagnosis}"</td>
                            <td className="p-6 font-black tabular-nums text-primary">{claim.amount}</td>
                            <td className="p-6">
                               <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
                                 ${claim.risk === 'LOW' ? 'bg-success/10 text-success' : 'bg-error text-white animate-pulse'}`}>
                                  {claim.risk} RISK
                               </span>
                            </td>
                            <td className="p-6">
                               <button className="text-primary font-black uppercase text-[10px] hover:underline">Process Claim</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* 🧩 AUDIT INSIGHTS */}
          <div className="lg:col-span-3 flex-column gap-6">
             <ClinicalCard padding="2rem" className="bg-primary/5 border-none">
                <h3 className="text-sm font-black uppercase mb-6 flex-row items-center gap-2">
                   <span className="material-symbols-outlined text-primary">analytics</span>
                   Rejection Insights
                </h3>
                <div className="space-y-4">
                   <div>
                      <div className="flex-row justify-between mb-1">
                         <span className="text-[10px] font-bold uppercase opacity-60">Missing ICD-10</span>
                         <span className="text-[10px] font-black">62%</span>
                      </div>
                      <div className="h-1 bg-outline-variant rounded-full overflow-hidden">
                         <div className="h-full bg-error w-[62%]" />
                      </div>
                   </div>
                   <div>
                      <div className="flex-row justify-between mb-1">
                         <span className="text-[10px] font-bold uppercase opacity-60">No Signature</span>
                         <span className="text-[10px] font-black">24%</span>
                      </div>
                      <div className="h-1 bg-outline-variant rounded-full overflow-hidden">
                         <div className="h-full bg-secondary w-[24%]" />
                      </div>
                   </div>
                </div>
                <p className="mt-8 text-[10px] opacity-60 leading-relaxed italic border-t border-primary/10 pt-4">
                   "Automated claim scrubbing is currently reducing potential losses by RP 840M per month."
                </p>
             </ClinicalCard>
          </div>
       </div>
    </div>
  );
}
