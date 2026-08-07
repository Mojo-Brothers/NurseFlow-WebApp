import React, { useState, useEffect } from 'react';
import { getStaffCredentials, getUpcomingExpirations } from '../services/sqe.service.js';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import { useAuth } from '../../../contexts/useAuth.js';
import { ROLES } from '../../../core/constants.js';
import OceanicTealLoadingSpinner from '../../../components/ui/OceanicTealLoadingSpinner.jsx';

/**
 * CredentialsDashboard — Staff Qualifications & Education (SQE).
 * Personal and institutional license tracking.
 */
export default function CredentialsDashboard() {
  const { currentUser, role } = useAuth();
  const [myCredentials, setMyCredentials] = useState(null);
  const [expirations, setExpirations] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = role === ROLES.ADMIN;

  useEffect(() => {
    async function fetchData() {
      try {
        const [creds, exps] = await Promise.all([
          getStaffCredentials(currentUser.email),
          isAdmin ? getUpcomingExpirations(90) : Promise.resolve([])
        ]);
        setMyCredentials(creds);
        setExpirations(exps);
      } catch (err) {
        console.error('[CredentialsDashboard] Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUser.email, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-950/20">
        <OceanicTealLoadingSpinner variant="v1" label="Verifikasi Kredensial Medis & Masa Berlaku STR/SIP JCI SQE..." />
      </div>
    );
  }

  const getStatusChip = (expiryDate) => {
    if (!expiryDate) return <span className="chip bg-error-container text-error">Missing</span>;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="chip bg-error text-white font-black">Expired</span>;
    if (diffDays < 30) return <span className="chip bg-warning text-on-warning font-black">Expiring Soon</span>;
    return <span className="chip bg-success-container text-success font-black">Valid</span>;
  };

  return (
    <div className="p-12 animate-fade-in">
      <header className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2">
          Staff Qualifications & Education
        </span>
        <h1 className="text-5xl font-black tracking-tight">Professional <span className="text-primary">Credentials</span></h1>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Personal Status Card */}
        <div className="col-span-12 lg:col-span-4">
          <PresentationCard padding="2rem" height="100%">
            <div className="flex-column items-center text-center mb-8">
               <div className="w-24 h-24 rounded-full bg-surface-container-highest border-4 border-white shadow-2xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-primary">badge</span>
               </div>
               <h2 className="text-2xl font-black">{currentUser?.displayName}</h2>
               <span className="text-xs font-black uppercase tracking-widest opacity-40">{role}</span>
            </div>

            <div className="space-y-4">
               <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex-row justify-between items-center">
                  <div className="flex-column">
                     <span className="text-[10px] font-black uppercase opacity-40">STR (Registration)</span>
                     <span className="text-sm font-bold">{myCredentials?.str?.number || 'Not Registered'}</span>
                  </div>
                  {getStatusChip(myCredentials?.str?.expiryDate)}
               </div>
               <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant flex-row justify-between items-center">
                  <div className="flex-column">
                     <span className="text-[10px] font-black uppercase opacity-40">SIP (License)</span>
                     <span className="text-sm font-bold">{myCredentials?.sip?.number || 'Not Registered'}</span>
                  </div>
                  {getStatusChip(myCredentials?.sip?.expiryDate)}
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-outline-variant">
               <h3 className="text-xs font-black uppercase tracking-widest opacity-40 mb-4">Clinical Privileges</h3>
               <div className="flex flex-wrap gap-2">
                  {myCredentials?.privileges?.length > 0 ? myCredentials.privileges.map(priv => (
                    <span key={priv} className="px-3 py-1 rounded-full bg-primary-container text-primary text-[10px] font-black uppercase tracking-widest">
                      {priv}
                    </span>
                  )) : (
                    <span className="text-xs italic opacity-40">No privileges assigned.</span>
                  )}
               </div>
            </div>
          </PresentationCard>
        </div>

        {/* Admin Overview / Institutional Monitoring */}
        <div className="col-span-12 lg:col-span-8">
          {isAdmin ? (
            <div className="flex-column gap-8">
               <PresentationCard padding="2rem">
                  <div className="flex-row justify-between items-center mb-8">
                     <div>
                        <h2 className="text-xl font-black uppercase tracking-widest text-on-surface">Institutional License Tracker</h2>
                        <p className="text-[10px] font-bold text-on-surface-variant opacity-60">SQE 9: Monitoring Professional Qualifications</p>
                     </div>
                     <div className="flex-row items-center gap-4">
                        <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">90 Days Window</span>
                        <span className="chip bg-error text-white font-black">{expirations.length} ALERTS</span>
                     </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-outline-variant/30">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-surface-container-low text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                              <th className="py-4 px-6 border-b border-outline-variant/30">Medical Professional</th>
                              <th className="py-4 px-6 border-b border-outline-variant/30">License Detail</th>
                              <th className="py-4 px-6 border-b border-outline-variant/30">Clinical Privileges</th>
                              <th className="py-4 px-6 text-right border-b border-outline-variant/30">Status</th>
                           </tr>
                        </thead>
                        <tbody>
                           {expirations.length > 0 ? expirations.map(exp => (
                             <tr key={exp.id} className="border-b border-outline-variant/10 hover:bg-primary/5 transition-all group">
                                <td className="py-4 px-6">
                                   <div className="flex-column">
                                      <p className="text-sm font-black text-on-surface group-hover:text-primary transition-colors m-0">{exp.name || exp.id}</p>
                                      <p className="text-[10px] opacity-60 font-bold uppercase tracking-tighter">{exp.profession || 'Clinical Staff'}</p>
                                   </div>
                                </td>
                                <td className="py-4 px-6">
                                   <div className="flex-column">
                                      <p className="text-[10px] font-black text-on-surface-variant mb-1">STR: {exp.str?.number || 'N/A'}</p>
                                      <p className="text-[10px] font-mono opacity-50">EXP: {exp.str?.expiryDate ? new Date(exp.str.expiryDate).toLocaleDateString() : '-'}</p>
                                   </div>
                                </td>
                                <td className="py-4 px-6">
                                   <div className="flex-row gap-1 flex-wrap max-w-[200px]">
                                      {exp.privileges?.slice(0, 2).map(p => (
                                         <span key={p} className="px-2 py-0.5 rounded bg-surface-container-highest text-[8px] font-black uppercase text-on-surface-variant">{p.replace(/_/g, ' ')}</span>
                                      ))}
                                      {exp.privileges?.length > 2 && <span className="text-[8px] font-black opacity-40">+{exp.privileges.length - 2}</span>}
                                   </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                   {getStatusChip(exp.str?.expiryDate)}
                                </td>
                             </tr>
                           )) : (
                             <tr>
                                <td colSpan="4" className="py-12 text-center opacity-30 italic">
                                   No upcoming expirations in the next 90 days.
                                </td>
                             </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </PresentationCard>

              <div className="grid grid-cols-2 gap-8">
                 <ClinicalCard padding="2rem">
                    <span className="material-symbols-outlined text-3xl text-primary mb-4">school</span>
                    <h3 className="text-lg font-black tracking-tight">Competency Matrix</h3>
                    <p className="text-xs opacity-50 mb-6">Manage specific technical skills and certifications for specialized departments.</p>
                    <button className="px-6 py-3 rounded-full bg-surface-container-highest text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Manage Matrix</button>
                 </ClinicalCard>
                 <ClinicalCard padding="2rem">
                    <span className="material-symbols-outlined text-3xl text-warning mb-4">verified</span>
                    <h3 className="text-lg font-black tracking-tight">Privilege Review</h3>
                    <p className="text-xs opacity-50 mb-6">Annual review of clinical privileges based on performance and training logs.</p>
                    <button className="px-6 py-3 rounded-full bg-surface-container-highest text-[10px] font-black uppercase tracking-widest hover:bg-warning hover:text-on-warning transition-all">Start Review</button>
                 </ClinicalCard>
              </div>
            </div>
          ) : (
            <PresentationCard padding="3rem" className="flex-column items-center justify-center text-center opacity-40">
               <span className="material-symbols-outlined text-6xl mb-6">lock_person</span>
               <h2 className="text-2xl font-black uppercase tracking-widest">Institutional Management</h2>
               <p className="max-w-md mt-4 font-bold">This section is restricted to clinical leadership and HR departments for SQE compliance monitoring.</p>
            </PresentationCard>
          )}
        </div>
      </div>
    </div>
  );
}
