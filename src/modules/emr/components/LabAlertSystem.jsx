import React, { useState } from 'react';
import { Microscope, AlertCircle, PhoneCall, CheckCircle2, User, Clock, Bell, Share2, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';

export default function LabAlertSystem({ formData, setFormData }) {
  const [labResults, setLabResults] = useState([
    { id: 1, test: 'Hemoglobin (Hb)', result: '6.8', unit: 'g/dL', range: '13.0 - 17.0', isCritical: true, status: 'PENDING_REPORT' },
    { id: 2, test: 'Leukosit (WBC)', result: '11.500', unit: '/uL', range: '5.000 - 10.000', isCritical: false, status: 'NORMAL' },
    { id: 3, test: 'Kalium (K+)', result: '6.2', unit: 'mEq/L', range: '3.5 - 5.0', isCritical: true, status: 'PENDING_REPORT' },
    { id: 4, test: 'Trombosit', result: '145.000', unit: '/uL', range: '150.000 - 450.000', isCritical: false, status: 'NORMAL' }
  ]);

  const [reports, setReports] = useState(formData.lab_reports || {});
  const [reportingTo, setReportingTo] = useState({});

  const handleReport = (labId) => {
    const doctorName = reportingTo[labId];
    if (!doctorName) return;

    const newReports = {
      ...reports,
      [labId]: {
        timestamp: new Date().toISOString(),
        reported_to: doctorName,
        reported_by: 'Nurse Sarah',
        method: 'Telepon (Read-Back Done)',
        status: 'REPORTED'
      }
    };
    setReports(newReports);
    setFormData({ ...formData, lab_reports: newReports });
    
    // Update local state for visual feedback
    setLabResults(labResults.map(l => l.id === labId ? { ...l, status: 'REPORTED' } : l));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-10">
      {/* ─── JCI CRITICAL ALERT BANNER ─── */}
      <Card className="bg-red-50/50 border-2 border-red-100 rounded-[3.5rem] p-4 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
         <CardContent className="p-8 flex items-center gap-10 relative z-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/30 animate-pulse">
               <AlertCircle size={44} />
            </div>
            <div className="space-y-3">
               <h3 className="text-xl font-black text-red-600 uppercase tracking-tighter">Critical Value Protocol (AOP.5.3)</h3>
               <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-2xl italic">
                  Critical values MUST be reported to the DPJP within &lt; 30 minutes. Document the recipient's name and read-back verification according to IPSG.2 standards.
               </p>
            </div>
         </CardContent>
      </Card>

      {/* ─── LABORATORY INTELLIGENCE ─── */}
      <div className="grid grid-cols-1 gap-6">
        {labResults.map((lab) => {
          const isCritical = lab.isCritical;
          const isReported = !!reports[lab.id];
          
          return (
            <Card 
              key={lab.id} 
              className={`
                relative overflow-hidden rounded-[3.5rem] border-2 transition-all duration-500 shadow-sm
                ${isCritical 
                  ? (isReported ? 'bg-emerald-50/30 border-emerald-500' : 'bg-red-50/30 border-red-500 shadow-xl shadow-red-500/10') 
                  : 'bg-white border-slate-100 hover:border-slate-300'}
              `}
            >
              <CardContent className="p-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                  <div className="flex items-center gap-8">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner transition-all duration-500 ${isCritical ? (isReported ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-bounce') : 'bg-blue-50 text-blue-600'}`}>
                      <Microscope size={36} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{lab.test}</h4>
                      <div className="flex items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="bg-slate-100 px-4 py-1.5 rounded-full">Range: {lab.range}</span>
                        {isCritical && !isReported && (
                          <span className="flex items-center gap-2 text-red-600 bg-red-100 px-4 py-1.5 rounded-full animate-pulse">
                             <ShieldAlert size={14} /> Critical Action Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center lg:items-end min-w-[180px]">
                     <div className="flex items-baseline gap-3">
                        <span className={`text-6xl font-black tracking-tighter ${isCritical ? 'text-red-600' : 'text-slate-900'}`}>
                          {lab.result}
                        </span>
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{lab.unit}</span>
                     </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                    {isCritical && !isReported && (
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Input 
                          placeholder="Recipient (DPJP Name)"
                          className="h-14 border-red-200 bg-white min-w-[240px]"
                          value={reportingTo[lab.id] || ''}
                          onChange={(e) => setReportingTo({ ...reportingTo, [lab.id]: e.target.value })}
                        />
                        <Button 
                          onClick={() => handleReport(lab.id)}
                          disabled={!reportingTo[lab.id]}
                          className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/20"
                        >
                          <PhoneCall size={18} className="mr-3" /> Report
                        </Button>
                      </div>
                    )}
                    {isReported && (
                      <div className="flex items-center gap-4 text-emerald-600 bg-emerald-100 px-8 py-3 rounded-2xl border border-emerald-200 text-xs font-black uppercase tracking-widest">
                        <CheckCircle2 size={20} /> Verified & Reported
                      </div>
                    )}
                    {!isCritical && (
                       <span className="px-8 py-3 rounded-2xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                          Stable Result
                       </span>
                    )}
                  </div>
                </div>

                {isReported && (
                  <div className="mt-10 pt-8 border-t border-emerald-500/10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                         <User size={18} />
                      </div>
                      <div>
                         <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reported To</Label>
                         <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{reports[lab.id].reported_to}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 lg:justify-end">
                      <div className="text-right">
                         <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</Label>
                         <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{new Date(reports[lab.id].timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                         <Clock size={18} />
                      </div>
                    </div>
                    <div className="col-span-full flex items-center gap-3 text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <Share2 size={16} />
                      Method: {reports[lab.id].method}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── AUDIT TRAIL LOGS ─── */}
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[2.5rem]">
         <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
               <Bell size={24} className="text-blue-600" />
               <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Critical Results Audit Log</h4>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                  <span className="w-12 opacity-40">14:20</span>
                  <span>Nilai Kritis Hb (6.8) Terdeteksi oleh Sistem.</span>
               </div>
               <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                  <span className="w-12 opacity-40">14:22</span>
                  <span>Notifikasi Push Terkirim ke Perawat Sarah.</span>
               </div>
               {Object.values(reports).map((r, i) => (
                 <div key={i} className="flex items-center gap-4 text-[10px] font-black text-emerald-600">
                    <span className="w-12 opacity-40">{new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="flex items-center gap-2">
                       <CheckCircle2 size={12} /> Laporan Nilai Kritis diterima oleh {r.reported_to}. (IPSG.2 Verified)
                    </span>
                 </div>
               ))}
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
