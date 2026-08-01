import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTriageStore } from '../triage.store.js';
import { usePatientStore } from '../../patient/patient.store.js';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { useAuthStore } from '../../auth/auth.store.js';
import { toast } from 'react-hot-toast';
import { 
  Bolt, 
  FileText, 
  Activity, 
  Stethoscope, 
  Bell, 
  User, 
  ChevronRight, 
  AlertCircle,
  Clock,
  Save,
  Send
} from 'lucide-react';

// Operational Components
import RapidIntake from '../components/RapidIntake.jsx';
import DetailedAssessment from '../components/DetailedAssessment.jsx';
import MonitorCommand from '../components/MonitorCommand.jsx';
import PoliTriage from '../components/PoliTriage.jsx';

// Styles
import '../styles/Triage.css';

export default function TriagePage() {
  const { t } = useTranslation();
  const { 
    operationalMode,
    setOperationalMode,
    vitals,
    esiLevel,
    executeSubmit,
    isSubmitting
  } = useTriageStore();
  const { user } = useAuthStore();
  
  const { patients } = usePatientStore();
  const { liveContext, fetchActiveEncounters } = useEncounterStore();
  
  useEffect(() => {
    fetchActiveEncounters();
  }, [fetchActiveEncounters]);

  const patientId = liveContext?.patientId;
  const encounterId = liveContext?.encounterId;
  
  const selectedPatient = patients.find(p => p.id === patientId) || null;

  const MODES = [
    { id: 'RAPID', label: t('triage_v2.modes.rapid'), icon: <Bolt className="w-4 h-4" /> },
    { id: 'DETAIL', label: t('triage_v2.modes.detail'), icon: <FileText className="w-4 h-4" /> },
    { id: 'MONITOR', label: t('triage_v2.modes.monitor'), icon: <Activity className="w-4 h-4" /> },
    { id: 'POLI', label: t('triage_v2.modes.poli'), icon: <Stethoscope className="w-4 h-4" /> },
  ];

  const renderMode = () => {
    switch (operationalMode) {
      case 'RAPID': return <RapidIntake />;
      case 'DETAIL': return <DetailedAssessment />;
      case 'MONITOR': return <MonitorCommand />;
      case 'POLI': return <PoliTriage />;
      default: return <RapidIntake />;
    }
  };

  const handleProcess = async () => {
    if (!patientId || !encounterId) {
      toast.error(t('triage_v2.errors.no_patient_selected'));
      return;
    }

    // Sync context to triage store before execution
    useTriageStore.getState().selectPatient(patientId);
    useTriageStore.getState().selectEncounter(encounterId);
    
    try {
      await executeSubmit(user?.email || 'unknown@nurseflow.id');
      toast.success(t('triage_v2.notifications.submit_success'));
    } catch (err) {
      toast.error(err.message || t('triage_v2.notifications.submit_failed'));
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary/30 transition-colors duration-300">
      {/* ─── Global Top Navigation / Mode Switcher ─── */}
      <header className="sticky top-0 z-50 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant px-8 py-4">
        <div className="max-w-none flex flex-row flex-wrap justify-between items-center gap-4">
          <div className="flex flex-row items-center gap-8 min-w-0">
            <div className="flex flex-col">
                <h1 className="text-xl font-black text-primary tracking-tighter leading-none">{t('nav.clinical').toUpperCase()}</h1>
                <span className="text-[10px] font-bold text-on-surface-variant tracking-[0.3em] uppercase">{t('triage_v2.triase')} OS v2.0</span>
            </div>
            
            <nav className="flex flex-row bg-surface-container-low p-1 rounded-2xl border border-outline-variant min-w-0 shadow-inner">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setOperationalMode(mode.id)}
                  className={`flex flex-row items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    operationalMode === mode.id 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
                  }`}
                >
                  {mode.icon}
                  {mode.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex flex-row gap-4 items-center">
            <button className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center hover:text-primary border border-outline-variant transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-outline-variant"></div>
            <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-on-surface">{user?.displayName || t('triage_v2.labels.medical_staff')}</span>
                    <span className="text-[10px] font-medium text-on-surface-variant">{user?.role ? t(`roles.${user.role.toLowerCase()}`) : t('roles.nurse')}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black border border-primary-container/20 shadow-lg shadow-primary/20">
                    {user?.displayName?.charAt(0) || <User className="w-5 h-5" />}
                </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-none w-full flex flex-col gap-8">
        {/* ─── Layer 1: Context (Patient & Chief Complaint) ─── */}
        {selectedPatient ? (
          <section className="bg-surface-container-low p-6 rounded-[2.5rem] flex flex-row flex-wrap justify-between items-start gap-6 animate-in fade-in slide-in-from-top-4 border border-outline-variant shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <User className="w-32 h-32 text-primary" />
            </div>
            
            <div className="flex flex-row items-center gap-6 min-w-0 flex-1 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary-container/20 shadow-inner shrink-0">
                <User className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-on-surface tracking-tight truncate">{selectedPatient.name}</h2>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/20">{t('triage_v2.labels.active_session')}</span>
                </div>
                <div className="flex flex-row flex-wrap gap-x-6 gap-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{t('patient_form.mrn')}</span>
                    <span className="text-xs font-bold text-on-surface">{selectedPatient.mrn || selectedPatient.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{t('patient_form.dob')}</span>
                    <span className="text-xs font-bold text-on-surface">{selectedPatient.dob}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{t('patient_form.gender')}</span>
                    <span className="text-xs font-bold text-on-surface uppercase">{selectedPatient.gender}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-row gap-3 relative z-10">
              <div className={`px-6 py-3 rounded-2xl border-2 flex flex-col items-center min-w-[100px] transition-all ${
                esiLevel 
                ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10' 
                : 'border-outline-variant bg-surface-container text-on-surface-variant'
              }`}>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">{t('triage_v2.labels.esi_score')}</span>
                <span className="text-2xl font-black">{esiLevel || '--'}</span>
              </div>
            </div>
          </section>
        ) : operationalMode !== 'MONITOR' ? (
            <section className="bg-surface-container-low p-16 rounded-[3rem] border border-outline-variant border-dashed flex flex-col items-center justify-center text-center gap-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <User className="w-12 h-12" />
                </div>
                <div className="flex flex-col gap-2">
                    <h3 className="text-2xl font-black text-on-surface tracking-tight">{t('triage_v2.errors.no_patient_selected')}</h3>
                    <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
                      {t('triage_v2.errors.no_patient_selected_desc')}
                    </p>
                </div>
                <button 
                  onClick={() => setOperationalMode('MONITOR')}
                  className="btn-primary h-14 px-10 rounded-2xl flex flex-row items-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Activity className="w-5 h-5" />
                  PILIH PASIEN DARI MONITOR
                </button>
            </section>
        ) : null}

        {/* ─── Layer 2: Core Operational View ─── */}
        <div className="flex-1 min-h-0">
          {renderMode()}
        </div>
      </main>

      {/* ─── Layer 3: Action Bar (Admisi) ─── */}
      <footer className="sticky bottom-0 bg-surface-container/80 backdrop-blur-xl border-t border-outline-variant p-6 z-50">
        <div className="max-w-none flex flex-row flex-wrap justify-between items-center gap-6">
          <div className="flex flex-row flex-wrap items-center gap-12 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{t('triage_v2.labels.current_status')}</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    {t('triage_v2.labels.system_ready')}
                </span>
              </div>
            </div>
            
            <div className="h-10 w-px bg-outline-variant"></div>
            
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{t('triage_v2.labels.vitals_logged')}</span>
              <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-on-surface">
                    {Object.values(vitals).filter(Boolean).length} / 8 <span className="text-on-surface-variant font-medium">{t('triage_v2.labels.parameters')}</span>
                  </span>
              </div>
            </div>

            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{t('triage_v2.labels.queue_sync')}</span>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-on-surface-variant" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{t('triage_v2.labels.live_feed')}</span>
                </div>
            </div>
          </div>
          
          <div className="flex flex-row gap-4">
            <button className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent hover:border-outline-variant transition-all">
              <Save className="w-4 h-4" />
              {t('triage_v2.actions.save_draft')}
            </button>
            <button 
              onClick={handleProcess}
              disabled={isSubmitting}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-on-primary font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all border border-primary-container/30 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] hover:bg-primary-container'
              }`}
            >
              {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
              ) : <Send className="w-4 h-4" />}
              {isSubmitting ? t('common.processing') : t('triage_v2.actions.process')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
