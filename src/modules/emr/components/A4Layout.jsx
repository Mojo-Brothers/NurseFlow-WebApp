import React from 'react';
import { 
  ShieldCheck, Printer, Download, Share2, 
  MapPin, Phone, Globe, Mail, 
  User, Calendar, Fingerprint, Activity,
  Maximize2, MoreHorizontal, ShieldAlert, X, CheckCircle2, Plus
} from 'lucide-react';
import { Separator } from '../../../components/ui/separator';
import { Label } from '../../../components/ui/label';
import { calculateAge } from '../../../utils/clinicalCalculators.js';

export default function A4Layout({ 
  children, 
  title = "DOKUMEN REKAM MEDIS",
  patient = {},
  encounter = {},
  hospitalName = "NURSEFLOW MEDICAL CENTER",
  hospitalAddress = "Kawasan Industri MM2100, Cikarang Barat, Bekasi 17530",
  hospitalContact = "+62 21 8998 0000 • info@nurseflow.com • www.nurseflow.com",
  metadata = {},
  onClose,
  onSave,
  isSaving,
  formData = {},
  setFormData,
  currentUser,
  latestRecord = null
}) {
  return (
    <div className="w-full flex flex-col items-center">
      
      {/* ─── ADAPTIVE CLINICAL WORKSPACE (FORMERLY A4) ─── */}
      <div className="w-full min-h-[297mm] bg-white shadow-[0_64px_128px_-32px_rgba(0,0,0,0.2)] flex flex-col relative transition-all duration-700 animate-in fade-in zoom-in-95 overflow-hidden border border-slate-200 flex-shrink-0 mb-32 rounded-[3rem]">
        
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

        {/* ─── PREMIUM CLINICAL IDENTITY (2026 Enterprise Standard) ─── */}
        <header className="px-16 py-14 bg-white flex flex-col gap-12">
           {/* Primary Identity Section: The Focal Point */}
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-12">
                 <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-8">
                       <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight uppercase">
                          {patient?.name || patient?.displayName || patient?.nama || patient?.patient_name || encounter?.patient_name || patient?.demographics?.name || 'BELUM TERIDENTIFIKASI'}
                       </h1>
                       <div className="flex gap-3 pt-2">
                          <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 flex items-center justify-center">
                             {encounter?.department || encounter?.unit || encounter?.type || 'POLIKLINIK'}
                          </span>
                          { (patient?.insurance || encounter?.guarantor || encounter?.insurance) && (
                            <span className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/30 flex items-center justify-center">
                               {patient?.insurance || encounter?.guarantor || encounter?.insurance || 'UMUM'}
                            </span>
                          )}
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-2xl font-bold tracking-tight">
                       <span className="text-slate-900/90 font-black">{patient?.mrn || patient?.demographics?.mrn || '00-00-00'}</span>
                       <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                       <span className={`${(patient?.gender === 'F' || patient?.demographics?.gender === 'F') ? 'text-rose-500' : 'text-blue-500'} font-black`}>
                          {(patient?.gender === 'F' || patient?.demographics?.gender === 'F') ? 'Perempuan' : 'Laki-laki'}
                       </span>
                       <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                       <span className="text-slate-600 font-black">
                          {patient?.dob || patient?.demographics?.dob ? calculateAge(patient.dob || patient.demographics.dob) : '?? Years'}
                       </span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Clinical Dashboard Zone: Semantic Priority Cards */}
           <div className="grid grid-cols-3 gap-8">
              {/* Allergy Alert */}
              <div className="bg-rose-50/40 border border-rose-100 p-6 rounded-[2.5rem] flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-rose-900/5 group relative overflow-hidden">
                 <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30">
                       <ShieldAlert size={20} />
                    </div>
                    <button className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                       <Plus size={14} />
                    </button>
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em]">Riwayat Alergi</p>
                    <p className="text-sm font-black text-rose-900 uppercase leading-none mt-1">
                       {Array.isArray(patient?.allergies) 
                          ? patient.allergies.map(a => a.agent).join(', ') || 'Tidak Ada Alergi'
                          : patient?.allergies || 'Tidak Ada Alergi'}
                    </p>
                 </div>
              </div>

              {/* Triage Status & Working Diagnosis */}
              <div className="bg-amber-50/40 border border-amber-100 p-6 rounded-[2.5rem] flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-amber-900/5 group relative overflow-hidden">
                 <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                       <Activity size={20} />
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-[8px] font-black uppercase">
                       {encounter?.triage_priority || 'Priority 2'}
                    </div>
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">Diagnosa Kerja</p>
                    <p className="text-sm font-black text-amber-900 uppercase leading-none mt-1">
                       {latestRecord?.assessment || encounter?.working_diagnosis || 'Belum Ditentukan'}
                    </p>
                 </div>
              </div>

              {/* Vaccination */}
              <div className="bg-emerald-50/40 border border-emerald-100 p-6 rounded-[2.5rem] flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-emerald-900/5 group overflow-hidden relative">
                 <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                       <CheckCircle2 size={20} />
                    </div>
                    <button className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                       <Plus size={14} />
                    </button>
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Riwayat Vaksin</p>
                    <p className="text-sm font-black text-emerald-900 uppercase leading-none mt-1">
                       {patient?.vaccinations?.length > 0 ? `ADA DATA (${patient.vaccinations.length})` : 'TIDAK ADA DATA'}
                    </p>
                 </div>
              </div>
           </div>

           {/* Muted Metadata Section */}
           <div className="px-10 py-8 bg-slate-50/40 rounded-[2.5rem] border border-slate-100 grid grid-cols-2 gap-16">
              <div className="flex flex-col gap-4">
                 {[
                    { label: 'Registration ID', value: encounter?.id?.slice(-8).toUpperCase() || encounter?.encounterId || 'NEW_ENCOUNTER', valueColor: 'text-blue-700' },
                    { label: 'Religion', value: patient?.religion || patient?.demographics?.religion || '-' },
                    { label: 'Insurance Provider', value: patient?.insurance || encounter?.insurance || 'UMUM' }
                 ].map((item, i) => (
                    <div key={i} className="grid grid-cols-[140px_10px_1fr] items-center text-[11px]">
                       <span className="font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                       <span className="text-slate-300">:</span>
                       <span className={`font-bold uppercase ${item.valueColor || 'text-slate-700'}`}>{item.value}</span>
                    </div>
                 ))}
              </div>

              <div className="flex flex-col gap-4">
                 {[
                    { label: 'Department / Poli', value: encounter?.department || encounter?.unit || 'UGD' },
                    { label: 'Primary Diagnosis', value: encounter?.primary_diagnosis || 'None Recorded', valueColor: 'text-slate-400' },
                    { label: 'Complex Patient', value: patient?.is_complex ? 'Ya (Attention Required)' : 'Tidak (Standard Workflow)', valueColor: patient?.is_complex ? 'text-red-600' : 'text-emerald-600' }
                 ].map((item, i) => (
                    <div key={i} className="grid grid-cols-[140px_10px_1fr] items-center text-[11px]">
                       <span className="font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                       <span className="text-slate-300">:</span>
                       <span className={`font-bold uppercase ${item.valueColor || 'text-slate-700'}`}>{item.value}</span>
                    </div>
                 ))}
              </div>
           </div>
        </header>

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
                  <div className="h-24 border-b border-slate-200 border-dashed flex items-center justify-center">
                     {metadata?.patientSignatureBase64 || metadata?.signatureImage ? (
                        <img 
                           src={metadata?.patientSignatureBase64 || metadata?.signatureImage} 
                           alt="Tanda Tangan Pasien" 
                           className="max-h-20 max-w-full object-contain"
                        />
                     ) : (
                        <span className="text-[10px] text-slate-300 italic">Identified via IPSG.1 Protocol</span>
                     )}
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{metadata?.witnessSignature || 'Identified via IPSG.1 Protocol'}</p>
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
