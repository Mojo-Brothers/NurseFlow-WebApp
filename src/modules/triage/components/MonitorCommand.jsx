import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTriageStore } from '../triage.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  Layout, 
  Search, 
  Filter, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp,
  FileDown,
  Zap
} from 'lucide-react';

export default function MonitorCommand() {
  const { t } = useTranslation();
  const { activeQueue, fetchActiveQueue, isLoading, setOperationalMode } = useTriageStore();
  const { patients, fetchPatients } = usePatientStore();
  const { setLiveContext } = useEncounterStore();

  useEffect(() => {
    // JCI Requirement: Ensure Master Patient Index is synchronized
    const syncMonitor = async () => {
      if (patients.length === 0) await fetchPatients();
      fetchActiveQueue(patients);
    };
    
    syncMonitor();
    
    // Auto-refresh every 30s for Enterprise Monitoring
    const interval = setInterval(() => fetchActiveQueue(patients), 30000);
    return () => clearInterval(interval);
  }, [fetchActiveQueue, fetchPatients, patients]);

  const getEsiColor = (level) => {
    switch (level) {
      case 1: return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 2: return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      case 3: return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 4: return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 5: return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-surface-container border-outline-variant text-on-surface-variant';
    }
  };

  const metrics = [
    { 
      label: t('triage_v2.monitor.avg_wait'), 
      val: '12m', 
      icon: <Clock className="w-5 h-5" />, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: t('triage_v2.monitor.active_admissions'), 
      val: activeQueue.length.toString(), 
      icon: <Users className="w-5 h-5" />, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    { 
      label: t('triage_v2.monitor.critical_cases'), 
      val: activeQueue.filter(p => p.esi <= 2 && p.esi > 0).length.toString(), 
      icon: <AlertTriangle className="w-5 h-5" />, 
      color: 'text-red-400',
      bg: 'bg-red-400/10'
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── Facility Overview Metrics ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant flex flex-row items-center gap-6 shadow-xl hover:border-outline transition-all group">
            <div className={`w-14 h-14 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center border border-current/10 shadow-inner group-hover:scale-110 transition-transform`}>
              {m.icon}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{m.label}</span>
              <span className="text-3xl font-black text-on-surface tracking-tight">{m.val}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── The Emergency Board ─── */}
      <section className="bg-surface-container-low rounded-[2.5rem] border border-outline-variant shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-outline-variant flex flex-row justify-between items-center bg-surface-container-highest/10">
          <div className="flex flex-row items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"></div>
            <div className="flex flex-col">
                <h3 className="text-lg font-black text-on-surface tracking-tight uppercase">{t('triage_v2.monitor.emergency_board')}</h3>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('triage_v2.monitor.surveillance_active')}</span>
            </div>
          </div>
          <div className="flex flex-row gap-3">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder={t('common.search')} 
                    className="bg-surface-container border border-outline-variant rounded-xl py-2.5 pl-11 pr-4 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-64"
                />
            </div>
            <button className="px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-on-surface transition-all">
                <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant border-b border-outline-variant">{t('triage_v2.monitor.table.patient_mrn')}</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant border-b border-outline-variant">{t('triage_v2.monitor.table.esi')}</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant border-b border-outline-variant">{t('triage_v2.monitor.table.status')}</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant border-b border-outline-variant text-right">{t('triage_v2.monitor.table.wait_time')}</th>
                <th className="px-8 py-5 border-b border-outline-variant w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {activeQueue.map((p) => (
                <tr 
                  key={p.id} 
                  onClick={() => {
                    setLiveContext(p.patientId, p.id);
                    setOperationalMode('RAPID');
                  }}
                  className="hover:bg-blue-600/5 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center font-black text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-all shadow-inner">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{p.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">RM</span>
                            <span className="text-[10px] font-bold text-on-surface-variant/60">{p.id.substring(0, 12)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex ${getEsiColor(p.esi)}`}>
                      {p.esi > 0 ? `${t('triage_v2.monitor.table.esi')} ${p.esi}` : t('triage_v2.monitor.pending')}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-row items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${p.status === 'DONE' || p.status === 'IN_TREATMENT' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{p.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                        <span className={`font-mono text-sm font-black ${p.waitTime > 15 ? 'text-red-500' : 'text-on-surface'}`}>
                            {p.waitTime}{t('common.units.minute_short')}
                        </span>
                        <span className="text-[9px] font-bold text-on-surface-variant/60 uppercase">{t('triage_v2.labels.wait_time_elapsed')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                      <ChevronRight className="w-5 h-5 text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </td>
                </tr>
              ))}
              {activeQueue.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" className="p-20 text-center animate-in fade-in zoom-in-95">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                        <Layout className="w-16 h-16" />
                        <p className="text-sm font-bold uppercase tracking-widest max-w-[200px]">
                            {t('triage_v2.monitor.empty_queue')}
                        </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Facility Logic Triggers ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button className="group relative overflow-hidden bg-surface-container-low border border-outline-variant p-1 rounded-[2rem] hover:border-red-500/50 transition-all shadow-xl">
            <div className="relative z-10 flex items-center justify-between p-6">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-1">{t('triage_v2.labels.emergency_protocol')}</span>
                        <span className="text-sm font-black text-on-surface uppercase tracking-tight">{t('triage_v2.monitor.surge_protocol')}</span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-red-500 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        <button className="group relative overflow-hidden bg-surface-container-low border border-outline-variant p-1 rounded-[2rem] hover:border-primary/50 transition-all shadow-xl">
            <div className="relative z-10 flex items-center justify-between p-6">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                        <FileDown className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-1">{t('triage_v2.monitor.audit_reporting')}</span>
                        <span className="text-sm font-black text-on-surface uppercase tracking-tight">{t('triage_v2.monitor.export_report')}</span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-all">
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </div>
  );
}
