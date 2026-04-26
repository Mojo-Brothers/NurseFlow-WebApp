import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/useAuth.js';
import { getPatientPersonalData } from '../services/portal.service.js';
import ClinicalCard from '../../../components/ui/ClinicalCard';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../../billing/components/PaymentModal.jsx';
import VirtualWaitingRoom from '../../telemedicine/components/VirtualWaitingRoom';

/**
 * PatientPortalPage — The digital front-door for patients.
 * Now enhanced with Telemedicine and Remote Health Monitoring.
 */
export default function PatientPortalPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [inLobby, setInLobby] = useState(false);
  const [homeVitals, setHomeVitals] = useState({ temp: '', bp: '', spo2: '' });

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const result = await getPatientPersonalData(currentUser.email);
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [currentUser.email]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex-row items-center justify-center">
         <div className="text-center">
            <span className="material-symbols-outlined text-primary text-6xl anim-spin mb-4">clinical_notes</span>
            <p className="text-lg font-bold opacity-40 uppercase tracking-widest">Securing your health data...</p>
         </div>
      </div>
    );
  }

  if (inLobby) return <VirtualWaitingRoom doctorName="Andi Wijaya, Sp.PD" appointmentTime="Today, 14:00" />;

  const { profile, latestEncounter, activeMeds, billingSummary, diagnostics } = data;

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      {/* 📱 PORTAL HEADER */}
      <header className="bg-surface px-8 py-6 shadow-sm flex-row justify-between items-center sticky top-0 z-50">
         <div className="flex-row items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex-row items-center justify-center text-white font-black">NF</div>
            <h1 className="text-xl font-black tracking-tight">NurseFlow <span className="text-primary">Patient</span></h1>
         </div>
         <button onClick={logout} className="btn-ghost flex-row items-center gap-2 text-xs font-bold opacity-40 hover:text-error transition-all">
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
         </button>
      </header>

      <main className="max-w-6xl mx-auto p-8 animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8">
            {/* 👋 WELCOME HERO */}
            <section className="mb-12">
               <h2 className="text-4xl font-black mb-2">Hello, {profile?.name?.split(' ')[0]}!</h2>
               <p className="opacity-60 font-medium text-lg">Your health journey is in safe hands. Here is your current status.</p>
               
               <div className="flex-row gap-4 mt-8">
                  <button 
                    onClick={() => setInLobby(true)}
                    className="flex-1 btn-primary py-6 rounded-[2rem] text-lg font-black uppercase tracking-widest flex-row items-center justify-center gap-4 shadow-2xl"
                  >
                     <span className="material-symbols-outlined text-3xl">videocam</span>
                     Join Consultation
                  </button>
                  <button className="flex-1 btn-ghost py-6 rounded-[2rem] text-lg font-black uppercase tracking-widest border-2 border-primary/20">
                     Message Doctor
                  </button>
               </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* 💊 MEDICATION TRACKER */}
               <ClinicalCard padding="2rem" className="bg-surface border-t-8 border-primary shadow-xl">
                  <div className="flex-row justify-between items-center mb-6">
                     <h3 className="text-lg font-black uppercase tracking-tight">Active Medications</h3>
                     <span className="material-symbols-outlined text-primary">pill</span>
                  </div>
                  <div className="space-y-4">
                     {activeMeds.length > 0 ? activeMeds.map((med, i) => (
                        <div key={i} className="p-4 bg-surface-container-low rounded-2xl flex-row items-center gap-4 border border-outline-variant">
                           <div className="w-10 h-10 bg-surface shadow-sm rounded-xl flex-row items-center justify-center text-primary">
                              <span className="material-symbols-outlined text-xl">medication</span>
                           </div>
                           <div>
                              <p className="text-sm font-black">{med.medication_name}</p>
                              <p className="text-[10px] font-bold opacity-40 uppercase">{med.dosage} • {med.route}</p>
                           </div>
                        </div>
                     )) : (
                        <p className="text-sm italic text-slate-400">No active prescriptions found.</p>
                     )}
                  </div>
               </ClinicalCard>

               {/* 🏥 VISIT STATUS */}
               <ClinicalCard padding="2rem" className="bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Current Stay Status</span>
                  <h3 className="text-2xl font-black mb-6 flex-row items-center gap-2">
                     <span className="material-symbols-outlined text-success">check_circle</span>
                     {latestEncounter?.status === 'DISCHARGED' ? 'Visit Finalized' : 'Inpatient Care'}
                  </h3>
                  <div className="space-y-4">
                     <div className="flex-row justify-between text-xs border-b border-white/10 pb-2">
                        <span className="opacity-50 font-bold uppercase">Location</span>
                        <span className="font-black">Ward A • Bed {latestEncounter?.bed_id?.slice(-3) || '---'}</span>
                     </div>
                     <div className="flex-row justify-between text-xs border-b border-white/10 pb-2">
                        <span className="opacity-50 font-bold uppercase">Patient MRN</span>
                        <span className="font-black tabular-nums">{profile?.mrn}</span>
                     </div>
                  </div>
                  {latestEncounter?.status === 'DISCHARGED' && (
                     <button 
                        onClick={() => navigate(`/reporting/${latestEncounter.id}`)}
                        className="mt-8 w-full py-4 bg-surface text-on-surface font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg flex-row items-center justify-center gap-2"
                     >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Get Discharge Summary
                     </button>
                  )}
               </ClinicalCard>
            </div>

            {/* 🧪 TEST RESULTS SECTION */}
            <section className="mt-12">
               <div className="flex-row justify-between items-center mb-6">
                  <h3 className="text-xl font-black tracking-tight">My Test Results</h3>
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest bg-surface-container-high px-3 py-1 rounded-full">Validated by Clinical Team</span>
               </div>
               
               {diagnostics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {diagnostics.map((res, i) => (
                        <ClinicalCard key={i} padding="1.5rem" className="bg-surface border-2 border-outline-variant shadow-sm hover:border-primary transition-all">
                           <div className="flex-row items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex-row items-center justify-center 
                                 ${res.type === 'LAB' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                                 <span className="material-symbols-outlined">{res.type === 'LAB' ? 'biotech' : 'image'}</span>
                              </div>
                              <div className="flex-1">
                                 <p className="text-sm font-black">{res.test_name}</p>
                                 <p className="text-[10px] font-bold opacity-40 uppercase">{res.type === 'LAB' ? 'Laboratory Report' : 'Radiology Image'}</p>
                              </div>
                           </div>
                        </ClinicalCard>
                     ))}
                  </div>
               ) : (
                  <div className="p-12 text-center bg-surface-container/50 rounded-3xl border-2 border-dashed border-outline-variant">
                     <p className="text-sm font-medium opacity-40">No diagnostic reports available yet for this visit.</p>
                  </div>
               )}
            </section>
         </div>

         {/* 🌡️ REMOTE HEALTH LOG (SIDEBAR) */}
         <div className="lg:col-span-4 flex-column gap-8">
            <ClinicalCard padding="2rem" className="bg-surface border-l-8 border-secondary shadow-lg">
               <div className="flex-row justify-between items-center mb-4">
                  <p className="text-xl font-black uppercase">
                     {billingSummary?.status === 'PAID' ? 'Account Balanced' : 'Awaiting Settlement'}
                  </p>
                  <span className="material-symbols-outlined text-secondary text-3xl">account_balance_wallet</span>
               </div>
               {billingSummary?.status !== 'PAID' && latestEncounter && (
                  <button 
                    onClick={() => setShowPayment(true)}
                    className="mt-4 w-full py-4 bg-secondary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md hover:scale-[1.02] transition-all"
                  >
                     Settle My Bill Now
                  </button>
               )}
            </ClinicalCard>

            <ClinicalCard padding="2rem" className="bg-surface-container-high border-none shadow-xl">
              <div className="flex-row justify-between items-center mb-6">
                 <h3 className="text-xl font-black uppercase tracking-tight">Home Health Log</h3>
                 <span className="material-symbols-outlined text-primary">home_health</span>
              </div>
              
              <div className="flex-column gap-4">
                 <div className="flex-column gap-1">
                    <label className="text-[10px] font-black uppercase opacity-40">Temperature (°C)</label>
                    <input 
                      type="number" 
                      className="form-input text-xl font-black" 
                      placeholder="36.5" 
                      value={homeVitals.temp}
                      onChange={e => setHomeVitals({...homeVitals, temp: e.target.value})}
                    />
                 </div>
                 <div className="flex-column gap-1">
                    <label className="text-[10px] font-black uppercase opacity-40">Systolic BP (mmHg)</label>
                    <input 
                      type="number" 
                      className="form-input text-xl font-black" 
                      placeholder="120"
                      value={homeVitals.bp}
                      onChange={e => setHomeVitals({...homeVitals, bp: e.target.value})}
                    />
                 </div>
                 <button className="w-full btn-primary py-4 font-black uppercase mt-4">
                    Submit Remote Vitals
                 </button>
              </div>

              <div className="mt-8 pt-8 border-t border-outline-variant">
                 <p className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest">Recent Home Logs</p>
                 <div className="space-y-3">
                    <div className="flex-row justify-between items-center text-sm">
                       <span className="font-bold">Yesterday, 18:00</span>
                       <span className="font-black tabular-nums">37.1°C • 118 mmHg</span>
                    </div>
                 </div>
              </div>
            </ClinicalCard>
         </div>
      </main>

      {showPayment && (
        <PaymentModal 
          encounterId={latestEncounter.id} 
          onClose={() => setShowPayment(false)} 
          onSettled={() => {
            setShowPayment(false);
            window.location.reload(); // Refresh data
          }}
        />
      )}
    </div>
  );
}
