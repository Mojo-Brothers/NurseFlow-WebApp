import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import ClinicalCard from '../../../components/ui/ClinicalCard.jsx';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { activeEncounters, fetchActiveEncounters, isLoading } = useEncounterStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    fetchActiveEncounters();
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, [fetchActiveEncounters]);

  // Derived Intelligence
  const metrics = {
    occupancy: 87,
    avg_news_score: activeEncounters.length > 0 
      ? Math.round(activeEncounters.reduce((acc, curr) => acc + (curr.last_news2 || 0), 0) / activeEncounters.length)
      : 0,
    staff_on_duty: 12,
    waiting_triage: 4
  };

  const wardStatus = metrics.avg_news_score >= 7 ? 'critical' : (metrics.avg_news_score >= 5 ? 'warning' : 'safe');

  return (
    <div className="dashboard-container p-8 animate-fade-in" style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      
      {/* --- HEADER: Clinical Greeting --- */}
      <section className="flex justify-between items-end mb-8">
        <div>
           <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-1 opacity-60">
             {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
           </p>
           <h1 className="text-4xl font-black tracking-tighter text-on-surface m-0">Selamat Pagi, Ns. Sarah</h1>
        </div>
        <div className="flex items-center px-4 py-2 rounded-full bg-white border border-outline-variant shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-success mr-3 animate-pulse"></div>
          <span className="text-[11px] font-black uppercase tracking-widest text-on-surface">UNIT IGD • STATION 1</span>
        </div>
      </section>

      {/* --- CRITICAL ALERT BANNER --- */}
      {metrics.avg_news_score >= 7 && (
        <div className="flex items-center justify-between p-4 mb-8 bg-status-critical-container border-l-4 border-status-critical rounded-r-xl animate-bounce-subtle">
           <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-status-critical text-3xl">error</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-status-critical m-0">Critical Alert</p>
                <p className="text-sm font-bold text-on-surface m-0">Pasien MRN 00-23-11 memerlukan asesmen segera (NEWS2 Score: 7)</p>
              </div>
           </div>
           <button className="text-[10px] font-black uppercase tracking-widest text-status-critical hover:underline">DISMISS</button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        
        {/* --- LEFT COLUMN: Clinical Intelligence (8 cols) --- */}
        <div className="col-span-8 flex flex-col gap-8">
          
          {/* --- TOP METRICS ROW --- */}
          <div className="grid grid-cols-4 gap-4">
            <PresentationCard style={{ height: '10rem', padding: '1.25rem', justifyContent: 'space-between' }}>
               <div className="flex justify-between">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Pasien Aktif</span>
                 <span className="material-symbols-outlined text-primary opacity-40">groups</span>
               </div>
               <div>
                 <h3 className="text-4xl font-black m-0 mb-1">248 <small className="text-xs text-success tracking-tight">+12%</small></h3>
                 <p className="text-[9px] font-bold opacity-40 uppercase">Tersebar di 4 Wing Bangsal</p>
               </div>
            </PresentationCard>

            <PresentationCard style={{ height: '10rem', padding: '1.25rem', justifyContent: 'space-between', backgroundColor: 'var(--status-critical)', color: 'white' }}>
               <div className="flex justify-between">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Triage Kritis (Level 1)</span>
                 <span className="material-symbols-outlined opacity-80">priority_high</span>
               </div>
               <div>
                 <h3 className="text-4xl font-black m-0 mb-1">3</h3>
                 <p className="text-[9px] font-bold opacity-80 uppercase">Resuscitation Room Full Occupancy</p>
               </div>
            </PresentationCard>

            <PresentationCard style={{ height: '10rem', padding: '1.25rem', justifyContent: 'space-between' }}>
               <div className="flex justify-between">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Bed Occupancy Rate (BOR)</span>
                 <span className="material-symbols-outlined text-primary opacity-40">bed</span>
               </div>
               <div>
                 <h3 className="text-4xl font-black m-0 mb-1">87%</h3>
                 <div className="w-full h-1.5 bg-surface-container rounded-full mt-2">
                    <div className="h-full bg-success rounded-full" style={{ width: '87%' }}></div>
                 </div>
               </div>
            </PresentationCard>

            <PresentationCard style={{ height: '10rem', padding: '1.25rem', justifyContent: 'space-between' }}>
               <div className="flex justify-between">
                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Pasien Menunggu IGD</span>
                 <span className="material-symbols-outlined text-primary opacity-40">hourglass_empty</span>
               </div>
               <div>
                 <h3 className="text-4xl font-black m-0 mb-1">12 <small className="text-[9px] bg-surface-container-high px-1.5 py-0.5 rounded uppercase ml-2">Avg: 42m</small></h3>
                 <p className="text-[9px] font-bold opacity-40 uppercase">4 Pasien memerlukan transfer ward</p>
               </div>
            </PresentationCard>
          </div>

          {/* --- RECENT ACTIVITY TABLE --- */}
          <ClinicalCard style={{ padding: '1.5rem', minHeight: '400px' }}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest m-0 opacity-80">Recent Triage Activity</h3>
              <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1">VIEW ALL TRIAGE <span className="material-symbols-outlined text-sm">arrow_right_alt</span></button>
            </div>

            <table className="modern-table">
              <thead>
                <tr>
                  <th>MRN</th>
                  <th>Patient Name</th>
                  <th>NEWS2</th>
                  <th>Wait Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { mrn: '00-24-88', name: 'Budi Santoso', age: '42 Thn', gender: 'Laki-laki', news: '7 (Red)', wait: '08:12m', status: 'critical' },
                  { mrn: '00-24-92', name: 'Siti Aminah', age: '28 Thn', gender: 'Perempuan', news: '4 (Yellow)', wait: '14:45m', status: 'warning' },
                  { mrn: '00-25-01', name: 'Agus Prayogo', age: '55 Thn', gender: 'Laki-laki', news: '1 (Green)', wait: '02:30m', status: 'safe' },
                  { mrn: '00-25-04', name: 'Lina Marlina', age: '63 Thn', gender: 'Perempuan', news: '2 (Green)', wait: '05:15m', status: 'safe' }
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="font-bold text-primary">{row.mrn}</td>
                    <td>
                      <div className="font-bold text-on-surface">{row.name}</div>
                      <div className="text-[10px] opacity-60">{row.age} • {row.gender}</div>
                    </td>
                    <td>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black w-fit bg-status-${row.status}-container text-status-${row.status}`}>
                        <div className={`w-2 h-2 rounded-full bg-status-${row.status}`}></div>
                        {row.news}
                      </div>
                    </td>
                    <td className="font-medium tabular-nums">{row.wait}</td>
                    <td><span className="material-symbols-outlined opacity-40 cursor-pointer hover:opacity-100">more_vert</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ClinicalCard>
        </div>

        {/* --- RIGHT COLUMN: Operational Sidebar (4 cols) --- */}
        <div className="col-span-4 flex flex-col gap-8">
          
          <ClinicalCard style={{ padding: '1.5rem', background: 'var(--surface-container-low)' }}>
             <h3 className="text-[10px] font-black uppercase tracking-widest m-0 mb-6 opacity-40">Clinical Resource Status</h3>
             <div className="flex flex-col gap-4">
                {[
                  { icon: 'ventilator', label: 'Ventilators', status: '4/12 Avail', color: 'primary' },
                  { icon: 'bloodtype', label: 'Blood Stock O+', status: 'Stable', color: 'success' },
                  { icon: 'medical_services', label: 'On-call Doctor', status: 'Dr. Arya (OT)', color: 'error' }
                ].map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-outline-variant shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl bg-${res.color}-container text-${res.color}`}>
                        <span className="material-symbols-outlined text-lg">{res.icon}</span>
                      </div>
                      <span className="text-xs font-black opacity-80">{res.label}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-tight text-${res.color}`}>{res.status}</span>
                  </div>
                ))}
             </div>
          </ClinicalCard>

          <ClinicalCard style={{ padding: '2.5rem', background: 'var(--primary)', color: 'white', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', right: '-1rem', top: '-1rem', opacity: 0.1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '7rem' }}>assignment</span>
             </div>
             <h3 className="text-2xl font-black m-0 mb-2 tracking-tight">Digital Handover</h3>
             <p className="text-xs font-medium opacity-80 mb-8 leading-relaxed">Ensure patient safety by completing your digital shift handover report before 14:00.</p>
             <button className="w-full py-4 bg-white text-primary font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform">
               Start Report <span className="material-symbols-outlined text-sm ml-2">send</span>
             </button>
          </ClinicalCard>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl group cursor-pointer">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
             <img 
               src="https://images.unsplash.com/photo-1584982251114-f44abc670608?auto=format&fit=crop&q=80&w=800" 
               alt="Ward Map" 
               className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700"
             />
             <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
               <div className="p-2 bg-white rounded-xl text-primary shadow-lg">
                 <span className="material-symbols-outlined text-lg">map</span>
               </div>
               <span className="text-white font-black uppercase text-[11px] tracking-widest">Live Ward Map</span>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
