import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { getStaffCredentials } from '../services/sqe.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';

const StaffCredentials = () => {
  const { currentUser } = useAuth();
  const [creds, setCreds] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCreds = async () => {
      try {
        const data = await getStaffCredentials(currentUser.email);
        setCreds(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreds();
  }, [currentUser]);

  if (isLoading) return <div className="p-12 text-center opacity-20">Verifying Identity & Credentials...</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'VALID': return 'success';
      case 'WARNING': return 'warning';
      case 'EXPIRED': return 'error';
      default: return 'outline';
    }
  };

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-12">
        <p className="subtitle m-0">SQE - Staff Qualifications</p>
        <h2 className="title">Professional Credentials</h2>
      </header>

      <div className="flex-column gap-8">
        {/* Primary License */}
        <ClinicalCard className="p-8 border-l-8 border-primary bg-surface-container-lowest">
           <div className="flex-row justify-between items-start">
              <div>
                 <span className="text-[10px] font-black uppercase opacity-40">Primary Clinical License</span>
                 <h3 className="text-2xl font-black mt-2">{creds.license.type}</h3>
                 <p className="text-sm font-bold opacity-60 mt-1">{creds.license.number}</p>
              </div>
              <div className={`chip chip-${getStatusColor(creds.license.status)} font-black text-xs uppercase`}>
                 {creds.license.status}
              </div>
           </div>
           <div className="mt-6 flex-row items-center gap-2">
              <span className="material-symbols-outlined text-sm opacity-40">event</span>
              <span className="text-xs font-bold">Expires on {creds.license.expiry}</span>
           </div>
        </ClinicalCard>

        <div className="grid grid-cols-2 gap-8">
           {/* Mandatory Training */}
           <div className="flex-column gap-4">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Mandatory Competencies</h4>
              {creds.competencies.map(comp => (
                 <div key={comp.id} className="p-5 bg-white rounded-2xl border border-outline-variant flex-row justify-between items-center">
                    <div>
                       <p className="text-sm font-black">{comp.label}</p>
                       <p className="text-[10px] font-bold opacity-40 uppercase">Valid until {comp.expiry}</p>
                    </div>
                    <span className={`w-3 h-3 rounded-full bg-${getStatusColor(comp.status)}`} />
                 </div>
              ))}
           </div>

           {/* Clinical Privileges */}
           <div className="flex-column gap-4">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Active Privileges</h4>
              <div className="flex flex-wrap gap-2">
                 {creds.privileges.map(priv => (
                    <span key={priv} className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-xl border border-primary/20">
                       {priv.replace('_', ' ')}
                    </span>
                 ))}
              </div>
              <div className="mt-4 p-4 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
                 <p className="text-[10px] font-medium opacity-60 italic leading-relaxed">
                    "Only staff with active privileges are authorized to perform and sign-off on the procedures listed above as per SQE.8 Standard."
                 </p>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
};

export default StaffCredentials;
