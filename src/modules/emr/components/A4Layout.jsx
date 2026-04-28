import React from 'react';
import { 
  ShieldCheck, Printer, Download, Share2, 
  MapPin, Phone, Globe, Mail, 
  User, Calendar, Fingerprint, Activity,
  Maximize2, MoreHorizontal, ShieldAlert, X, CheckCircle2
} from 'lucide-react';

export default function A4Layout({ 
  children, 
  title = "DOKUMEN REKAM MEDIS",
  patient = {},
  hospitalName = "NURSEFLOW MEDICAL CENTER",
  hospitalAddress = "Kawasan Industri MM2100, Cikarang Barat, Bekasi 17530",
  hospitalContact = "+62 21 8998 0000 • info@nurseflow.com • www.nurseflow.com",
  metadata = {},
  onClose,
  onSave,
  isSaving,
  formData = {},
  setFormData,
  currentUser
}) {
  return (
    <div className="w-full flex flex-col items-center">
      
      {/* ─── THE A4 PAPER (PHYSICAL FIDELITY) ─── */}
      <div className="w-[210mm] min-h-[297mm] bg-white shadow-[0_64px_128px_-32px_rgba(0,0,0,0.2)] flex flex-col relative transition-all duration-700 animate-in fade-in zoom-in-95 overflow-hidden border border-slate-200 flex-shrink-0 mb-32">
        
        {/* Top Interactive Bar: Command Center Integrated (8pt Grid: 16px py, 40px px) */}
        <div className="px-10 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-white/10 no-print">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                 <ShieldAlert size={18} />
              </div>
              <div className="flex flex-col">
                 <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">JCI Command Center</p>
                 <p className="text-[11px] font-black uppercase tracking-tight leading-none">{title}</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex gap-2">
                 {[
                    { icon: <Printer size={16} />, label: 'Print' },
                    { icon: <Download size={16} />, label: 'PDF' }
                 ].map((act, i) => (
                    <button key={i} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95">
                       {act.icon}
                    </button>
                 ))}
              </div>
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all active:scale-95"
              >
                 <X size={18} />
              </button>
           </div>
        </div>

        {/* Top Decorative Indicator: Enterprise Medical Blue */}
        <div className="h-1.5 w-full bg-[#1e40af]"></div>

        {/* ─── PREMIUM HOSPITAL BRANDING (8pt Grid: 48px py, 64px px) ─── */}
        <header className="px-16 py-12 flex justify-between items-start relative z-10 border-b border-slate-100 bg-white">
          <div className="flex items-start gap-8">
            <div className="w-20 h-20 rounded-2xl bg-[#1e40af] flex items-center justify-center text-white shadow-xl shadow-blue-900/20 transform -rotate-3">
               <Activity size={40} />
            </div>
            <div className="pt-2">
               <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-3">{hospitalName}</h1>
               <div className="space-y-1.5 opacity-60">
                  <p className="text-[10px] font-bold flex items-center gap-3 uppercase tracking-widest text-slate-500">
                    <MapPin size={12} className="text-[#1e40af]" /> {hospitalAddress}
                  </p>
                  <p className="text-[10px] font-bold flex items-center gap-3 uppercase tracking-widest text-slate-500">
                    <Mail size={12} className="text-[#1e40af]" /> {hospitalContact}
                  </p>
               </div>
            </div>
          </div>
          
          <div className="text-right pt-2">
             <div className="inline-flex flex-col items-end">
                <div className="px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-3">
                   JCI Accredited Facility • Phase II
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">DOC REF: HIS-ER-2026-X</p>
             </div>
          </div>
        </header>

        {/* ─── DYNAMIC PATIENT CONTEXT (8pt Grid: 32px py, 64px px, 32px gap) ─── */}
        <div className="bg-[#1e40af] text-white px-16 py-8 grid grid-cols-4 gap-8 border-y border-blue-900/10">
           {[
              { label: 'Patient Name', value: patient?.name || 'N/A' },
              { label: 'MRN (Medical Record)', value: patient?.mrn || 'N/A' },
              { label: 'Date of Birth', value: patient?.dob || patient?.demographics?.dob || 'N/A' },
              { label: 'Gender', value: patient?.gender === 'M' || patient?.demographics?.gender === 'M' ? 'MALE' : 'FEMALE' }
           ].map((item, i) => (
              <div key={i} className="space-y-1 border-l border-white/20 pl-6 first:border-0 first:pl-0">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200/50">{item.label}</p>
                 <p className="text-base font-black truncate tracking-tight uppercase leading-none">{item.value}</p>
              </div>
           ))}
        </div>

        {/* ─── PRIMARY CONTENT AREA (8pt Grid: 48px py, 64px px) ─── */}
        <main className="flex-1 px-16 py-12 relative bg-white">
          <div className="flex items-center gap-5 mb-12 pb-6 border-b border-slate-100">
             <div className="w-2 h-8 bg-[#1e40af] rounded-full"></div>
             <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{title}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Official Clinical Assessment Record • Phase 27.2</p>
             </div>
          </div>
          
          <div className="relative z-10 text-slate-900">
             {children}
          </div>
        </main>

        {/* ─── INTEGRATED INTERACTIVE ACTION BAR (8pt Grid: 32px padding) ─── */}
        <div className="mx-16 mb-12 p-8 bg-slate-50 border border-slate-200 rounded-3xl no-print flex items-center justify-between shadow-inner">
           <div className="flex items-center gap-8">
              <label className="flex items-center gap-4 cursor-pointer group">
                 <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer hidden" 
                      checked={formData.verification}
                      onChange={(e) => setFormData({...formData, verification: e.target.checked})}
                    />
                    <div className="w-6 h-6 rounded-lg border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all duration-300 flex items-center justify-center">
                       <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Verifikasi JCI Compliance</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{currentUser?.email || 'MEDICAL STAFF'}</p>
                 </div>
              </label>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-200 transition-all"
              >
                 Batal
              </button>
              <button 
                onClick={onSave}
                disabled={isSaving}
                className="px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-900/30 disabled:bg-slate-400 transition-all flex items-center gap-3 active:scale-95"
              >
                 {isSaving ? <Activity size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                 {isSaving ? 'Finalizing...' : 'Finalisasi E-MR'}
              </button>
           </div>
        </div>

        {/* ─── MODERN FOOTER & SIGNATURES (8pt Grid: 48px py, 64px px) ─── */}
        <footer className="mt-auto px-16 py-12 border-t border-slate-100 bg-slate-50/40">
           <div className="grid grid-cols-2 gap-32 mb-12">
              <div className="flex flex-col gap-8">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">PPA In-Charge (Clinical Provider)</p>
                 <div className="h-24 flex items-end border-b border-slate-200 border-dashed pb-3">
                    <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">{metadata?.doctorName || '........................................'}</p>
                 </div>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Digitally Signed & Time-Stamped</p>
              </div>

              <div className="flex flex-col gap-8">
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Patient / Family Acknowledgement</p>
                 <div className="h-24 border-b border-slate-200 border-dashed"></div>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Identified via IPSG.1 Protocol</p>
              </div>
           </div>

           <div className="pt-10 border-t border-slate-200 flex justify-between items-end">
              <div className="flex flex-col gap-3">
                 <div className="flex gap-3 items-center">
                    <div className="px-2 py-1 rounded-md bg-slate-900 text-white text-[7px] font-black tracking-widest uppercase">SHA-256 SECURE</div>
                    <span className="text-[7px] font-mono text-slate-400 uppercase truncate max-w-[200px]">{metadata?.hash || 'F4E3D2C1B0A9Z8Y7X6W5V4U3T2S1R0Q'}</span>
                 </div>
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">NurseFlow Enterprise Intelligence HIS • v2.7.4-Final</p>
              </div>
              <div className="text-right">
                 <span className="text-[8px] font-bold text-slate-400 block mb-2">DOC_TIMESTAMP: {new Date().toLocaleString()}</span>
                 <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Confidential Medical Record</span>
              </div>
           </div>
        </footer>

        {/* Watermark: Extremely subtle */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.015] pointer-events-none select-none overflow-hidden">
           <h1 className="text-[14rem] font-black -rotate-12 tracking-tighter text-slate-900 uppercase">Confidential</h1>
        </div>
      </div>

      {/* Helper Text (Non-printing) */}
      <p className="text-[10px] font-black text-slate-400 opacity-20 uppercase tracking-[1em] no-print">End of Official Document</p>
    </div>
  );
}
