import React from 'react';
import { 
  ShieldCheck, Printer, Download, Share2, 
  MapPin, Phone, Globe, Mail, 
  User, Calendar, Fingerprint, Activity,
  Maximize2, MoreHorizontal, ShieldAlert
} from 'lucide-react';

export default function A4Layout({ 
  children, 
  title = "DOKUMEN REKAM MEDIS",
  patient = {},
  hospitalName = "NURSEFLOW MEDICAL CENTER",
  hospitalAddress = "Kawasan Industri MM2100, Cikarang Barat, Bekasi 17530",
  hospitalContact = "+62 21 8998 0000 • info@nurseflow.com • www.nurseflow.com",
  metadata = {}
}) {
  return (
    <div className="min-h-full w-full flex flex-col items-center bg-gray-100/50 dark:bg-black/40 py-12 px-4 relative overflow-x-hidden">
      
      {/* ─── MODERN ACTION BAR (Floating) ─── */}
      <div className="fixed top-12 right-12 z-[100] flex flex-col gap-3 animate-in fade-in slide-in-from-right-10 duration-1000">
         {[
            { icon: <Printer size={20} />, label: 'Print', color: 'bg-white dark:bg-gray-900 text-blue-600 hover:bg-blue-600' },
            { icon: <Download size={20} />, label: 'PDF', color: 'bg-white dark:bg-gray-900 text-emerald-600 hover:bg-emerald-600' },
            { icon: <Share2 size={20} />, label: 'Share', color: 'bg-white dark:bg-gray-900 text-indigo-500 hover:bg-indigo-500' }
         ].map((action, i) => (
            <button 
               key={i}
               className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:text-white active:scale-90 group ${action.color}`}
               title={action.label}
            >
               {React.cloneElement(action.icon, { className: 'group-hover:scale-110 transition-transform' })}
            </button>
         ))}
      </div>

      {/* ─── THE A4 PAPER (PHYSICAL FIDELITY) ─── */}
      <div className="w-[210mm] min-h-[297mm] bg-white dark:bg-[#1a1c1e] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_80px_150px_-30px_rgba(0,0,0,0.8)] flex flex-col relative transition-all duration-700 animate-in fade-in zoom-in-95 overflow-hidden border border-gray-100 dark:border-white/5 flex-shrink-0">
        
        {/* Top Decorative Indicator */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--primary)] via-blue-500 to-[var(--primary)] opacity-80"></div>

        {/* ─── PREMIUM HOSPITAL BRANDING ─── */}
        <header className="p-16 flex justify-between items-start relative z-10 border-b border-gray-100 dark:border-white/5 bg-gray-50/20 dark:bg-black/5">
          <div className="flex items-start gap-10">
            <div className="relative">
               <div className="w-24 h-24 rounded-[2.5rem] bg-[var(--primary)] flex items-center justify-center text-white shadow-2xl shadow-[var(--primary)]/40 rotate-3 transition-transform duration-700">
                  <Activity size={48} />
               </div>
               <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-gray-900 flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck size={14} />
               </div>
            </div>
            <div>
               <h1 className="text-3xl font-black text-[var(--on-surface)] tracking-tighter uppercase leading-none mb-4">{hospitalName}</h1>
               <div className="space-y-1.5 opacity-40">
                  <p className="text-[10px] font-bold flex items-center gap-3 uppercase tracking-widest">
                    <MapPin size={12} className="text-[var(--primary)]" /> {hospitalAddress}
                  </p>
                  <p className="text-[10px] font-bold flex items-center gap-3 uppercase tracking-widest">
                    <Phone size={12} className="text-[var(--primary)]" /> {hospitalContact}
                  </p>
               </div>
            </div>
          </div>
          
          <div className="text-right">
             <div className="inline-flex flex-col items-end">
                <div className="px-4 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] font-black uppercase tracking-widest mb-3">
                   JCI Accredited Facility
                </div>
                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.5em]">EMR ID: NF-2026-X</p>
             </div>
          </div>
        </header>

        {/* ─── DYNAMIC PATIENT CONTEXT (COMPACT GLASS) ─── */}
        <div className="bg-[var(--primary)] text-white p-10 grid grid-cols-2 gap-y-8 gap-x-12">
           {[
              { label: 'Patient Name', value: patient?.name || 'N/A' },
              { label: 'Medical Record (MRN)', value: patient?.mrn || 'N/A' },
              { label: 'DOB / Age', value: patient?.dob || patient?.demographics?.dob || 'N/A' },
              { label: 'Gender', value: patient?.gender === 'M' || patient?.demographics?.gender === 'M' ? 'MALE' : 'FEMALE' }
           ].map((item, i) => (
              <div key={i} className="space-y-1">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">{item.label}</p>
                 <p className="text-xl font-black truncate tracking-tight leading-none">{item.value}</p>
              </div>
           ))}
        </div>

        {/* ─── PRIMARY CONTENT AREA ─── */}
        <main className="flex-1 px-16 py-16 relative">
          <div className="flex items-center gap-6 mb-16">
             <div className="w-2 h-10 bg-[var(--primary)] rounded-full shadow-lg shadow-[var(--primary)]/40"></div>
             <div>
                <h2 className="text-4xl font-black text-[var(--on-surface)] tracking-tighter uppercase leading-none">{title}</h2>
                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.4em] mt-3 ml-1">Official Medical Documentation Protocol</p>
             </div>
          </div>
          
          <div className="relative z-10">
             {children}
          </div>
        </main>

        {/* ─── MODERN FOOTER & SIGNATURES ─── */}
        <footer className="mt-auto p-16 border-t border-gray-100 dark:border-white/5 bg-gray-50/20 dark:bg-black/5">
           <div className="grid grid-cols-2 gap-20 mb-16">
              <div className="space-y-8 text-center">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Medical In-Charge Signature</p>
                 <div className="h-28 flex items-center justify-center opacity-10 grayscale">
                    <ShieldCheck size={72} />
                 </div>
                 <div>
                    <p className="text-lg font-black text-[var(--on-surface)] uppercase tracking-tight">{metadata?.doctorName || '........................................'}</p>
                    <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-1">SIP: {metadata?.doctorSip || 'PPA-000-X'}</p>
                 </div>
              </div>

              <div className="space-y-8 text-center">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Patient / Family Signature</p>
                 <div className="h-28 flex items-center justify-center opacity-10">
                    <Fingerprint size={72} />
                 </div>
                 <div>
                    <p className="text-lg font-black opacity-20 uppercase tracking-tight">........................................</p>
                    <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest mt-1">Full Name & ID Verified</p>
                 </div>
              </div>
           </div>

           <div className="pt-10 border-t border-gray-200/50 dark:border-white/10 flex justify-between items-end">
              <div className="space-y-3">
                 <div className="flex gap-4 items-center">
                    <div className="px-3 py-1 rounded bg-black text-white text-[8px] font-black tracking-widest uppercase">SHA-256 Verified</div>
                    <span className="text-[8px] font-mono opacity-20 uppercase truncate max-w-[200px]">{metadata?.hash || 'F4E3D2C1B0A9Z8Y7X6W5V4U3T2S1R0Q'}</span>
                 </div>
                 <p className="text-[9px] font-black opacity-20 uppercase tracking-[0.4em]">NurseFlow Intelligence HIS • E-MR Core v2.7.0</p>
              </div>
              <div className="text-right">
                 <span className="text-[9px] font-bold opacity-20 block mb-1">Generated: {new Date().toLocaleString()}</span>
                 <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">Confidential Record</span>
              </div>
           </div>
        </footer>

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none overflow-hidden">
           <h1 className="text-[20rem] font-black -rotate-12 tracking-tighter">NURSEFLOW</h1>
        </div>
      </div>

      {/* Helper Text (Non-printing) */}
      <p className="mt-12 text-[9px] font-black text-[var(--on-surface-variant)] opacity-30 uppercase tracking-[0.8em]">End of Official Document</p>
    </div>
  );
}
