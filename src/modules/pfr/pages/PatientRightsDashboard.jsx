import React, { useState, useEffect } from 'react';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { getActiveComplaints } from '../services/pfr.service.js';

/**
 * PatientRightsDashboard — Patient and Family Rights (PFR).
 * Central monitor for ethical compliance, privacy, and grievances.
 */
export default function PatientRightsDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getActiveComplaints();
        setComplaints(data);
      } catch (err) {
        console.error('[PFRDashboard] Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-12 animate-fade-in">
      <header className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">
          Ethical Compliance
        </span>
        <h1 className="text-5xl font-black tracking-tight">Patient <span className="text-primary">Rights</span> Monitor</h1>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Privacy & Bioethics Status */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <ClinicalCard padding="2rem" className="border-l-4 border-error">
             <div className="flex-row justify-between items-start mb-6">
                <div>
                   <h3 className="text-lg font-black tracking-tight text-error">DNR Alerts</h3>
                   <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Bioethics Directive</p>
                </div>
                <span className="material-symbols-outlined text-error text-3xl animate-pulse">heart_broken</span>
             </div>
             <div className="space-y-3">
                {[
                  { name: 'Patient X-99', room: 'ICU-02', directive: 'No Intubation' },
                  { name: 'Patient R-44', room: 'WARD-A', directive: 'Full DNR' }
                ].map(p => (
                   <div key={p.name} className="p-3 bg-error/5 border border-error/20 rounded-xl flex-row justify-between items-center">
                      <span className="text-xs font-black">{p.name}</span>
                      <span className="text-[10px] font-black uppercase text-error">{p.directive}</span>
                   </div>
                ))}
             </div>
             <button className="mt-6 w-full py-3 bg-surface-container-highest text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-error hover:text-white transition-all">Review DNR Protocol</button>
          </ClinicalCard>

          <PresentationCard padding="2rem">
             <h3 className="text-sm font-black uppercase tracking-widest mb-6">Privacy Statistics</h3>
             <div className="space-y-6">
                <div className="flex-row justify-between items-end">
                   <span className="text-xs font-bold opacity-60">Confidential Requests</span>
                   <span className="text-2xl font-black">14</span>
                </div>
                <div className="flex-row justify-between items-end">
                   <span className="text-xs font-bold opacity-60">Religious Preferences</span>
                   <span className="text-2xl font-black text-primary">08</span>
                </div>
                <div className="flex-row justify-between items-end">
                   <span className="text-xs font-bold opacity-60">End-of-Life Planning</span>
                   <span className="text-2xl font-black">03</span>
                </div>
             </div>
          </PresentationCard>
        </div>

        {/* Complaints Management */}
        <div className="col-span-12 lg:col-span-8">
          <PresentationCard padding="2rem">
             <div className="flex-row justify-between items-center mb-10">
                <h2 className="text-xl font-black uppercase tracking-[0.2em]">Patient Grievances (PFR.4)</h2>
                <div className="flex-row gap-2">
                   <span className="chip bg-primary text-white font-black">{complaints.length} ACTIVE</span>
                   <span className="chip bg-success/20 text-success font-black">94% RESOLVED</span>
                </div>
             </div>

             <div className="space-y-4">
                {loading ? (
                   <p className="p-12 text-center opacity-30 italic">Syncing grievances...</p>
                ) : complaints.length === 0 ? (
                   <div className="p-12 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant">
                      <span className="material-symbols-outlined text-4xl opacity-20 mb-4">sentiment_satisfied</span>
                      <p className="text-xs font-black opacity-30 uppercase tracking-widest">No Active Complaints</p>
                   </div>
                ) : (
                   complaints.map(complaint => (
                      <div key={complaint.id} className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant flex-row justify-between items-center group hover:border-primary transition-all">
                         <div className="flex-row gap-6 items-center">
                            <div className={`w-3 h-3 rounded-full ${complaint.priority === 'HIGH' ? 'bg-error' : 'bg-warning'}`} />
                            <div className="flex-column">
                               <span className="text-sm font-black">{complaint.subject}</span>
                               <span className="text-[10px] opacity-50 font-bold uppercase tracking-tighter">
                                  {complaint.category} • {complaint.createdAt?.toDate ? new Date(complaint.createdAt.toDate()).toLocaleDateString() : 'Pending'}
                               </span>
                            </div>
                         </div>
                         <div className="flex-row items-center gap-6">
                            <div className="text-right">
                               <p className="text-[10px] font-black text-primary uppercase mb-1">Assigned to Patient Relations</p>
                               <p className="text-[9px] font-bold opacity-30">RESPONSE TIME: 4h 12m</p>
                            </div>
                            <button className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                               <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                         </div>
                      </div>
                   ))
                )}
             </div>

             <div className="mt-12 pt-8 border-t border-outline-variant flex-row justify-between items-center">
                <p className="text-[10px] font-bold opacity-40 max-w-md uppercase tracking-tight">
                   JCI PFR.4 requires a standardized process to receive, evaluate, and resolve patient complaints within institutionally-defined timeframes.
                </p>
                <button className="px-6 py-3 border border-primary text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all">
                   Manage Resolution Workflow
                </button>
             </div>
          </PresentationCard>
        </div>
      </div>
    </div>
  );
}
