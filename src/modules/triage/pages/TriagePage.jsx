import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      
      // Auto-transition to Encounters after 1 second to let toast show
      setTimeout(() => navigate('/encounters'), 1000);
    } catch (err) {
      toast.error(err.message || t('triage_v2.notifications.submit_failed'));
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col selection:bg-primary/30 transition-colors duration-300">
      {/* ─── Premium Glass Navigation ─── */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-8 py-4 shadow-premium-soft">
        <div className="max-w-none flex flex-row flex-wrap justify-between items-center gap-4">
          <div className="flex flex-row items-center gap-8 min-w-0">
            <div className="flex flex-col">
                <h1 className="text-xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 tracking-tighter leading-none">{t('nav.clinical').toUpperCase()}</h1>
                <span className="text-[10px] font-bold text-on-surface-variant tracking-[0.3em] uppercase">{t('triage_v2.triase')} OS v2.0</span>
            </div>
            
            <nav className="flex flex-row bg-surface-container/50 backdrop-blur-md p-1.5 rounded-2xl border border-outline-variant/30 min-w-0 shadow-inner">
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setOperationalMode(mode.id)}
                  className={`flex flex-row items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    operationalMode === mode.id 
                    ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-glow-primary scale-[1.02]' 
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
            <button className="w-10 h-10 rounded-xl bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:text-primary hover:shadow-premium-soft border border-outline-variant/50 transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-outline-variant/50"></div>
            <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-on-surface">{user?.displayName || t('triage_v2.labels.medical_staff')}</span>
                    <span className="text-[10px] font-black text-primary uppercase">{user?.role ? t(`roles.${user.role.toLowerCase()}`) : t('roles.nurse')}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-primary font-black border border-primary/20 shadow-sm">
                    {user?.displayName?.charAt(0) || <User className="w-5 h-5" />}
                </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-none w-full flex flex-col gap-8 relative z-0">
        {/* ─── Layer 1: Context (Patient & Chief Complaint) ─── */}
        {selectedPatient ? (
          <section className="glass-panel p-6 rounded-3xl flex flex-row flex-wrap justify-between items-start gap-6 animate-slide-up-fade relative overflow-hidden">
            <div className="absolute -top-10 -right-10 p-8 opacity-5 transform rotate-12">
                <User className="w-48 h-48 text-primary" />
            </div>
            
            <div className="flex flex-row items-center gap-6 min-w-0 flex-1 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-inner shrink-0">
                <User className="w-10 h-10" />
              </div>
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight truncate">{selectedPatient.name}</h2>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase border border-emerald-500/30 shadow-glow-primary">{t('triage_v2.labels.active_session')}</span>
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
              <div className={`px-8 py-4 rounded-3xl border flex flex-col items-center min-w-[120px] transition-all shadow-premium-soft ${
                esiLevel 
                ? 'border-error/40 bg-error/10 text-error shadow-glow-error' 
                : 'border-white/10 bg-surface-container-lowest/40 text-on-surface-variant'
              }`}>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">{t('triage_v2.labels.esi_score')}</span>
                <span className="text-4xl font-headline font-black">{esiLevel || '--'}</span>
              </div>
            </div>
          </section>
        ) : operationalMode !== 'MONITOR' ? (
            <section className="glass-panel p-20 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center text-center gap-8 animate-in zoom-in-95 duration-500 shadow-premium-soft relative overflow-hidden flex-1">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="w-32 h-32 rounded-[2.5rem] bg-surface-container-lowest/50 backdrop-blur-md flex items-center justify-center text-primary border border-primary/20 shadow-inner relative z-10">
                    <User className="w-16 h-16" />
                </div>
                <div className="flex flex-col gap-3 relative z-10">
                    <h3 className="text-4xl font-headline font-black text-on-surface tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-on-surface to-on-surface-variant">{t('triage_v2.errors.no_patient_selected')}</h3>
                    <p className="text-sm font-medium text-on-surface-variant max-w-md mx-auto leading-relaxed">
                      Pilih pasien dari daftar antrean aktif atau buat rekam medis darurat baru untuk memulai proses Triase JCI.
                    </p>
                </div>
                <button 
                  onClick={() => setOperationalMode('MONITOR')}
                  className="mt-4 h-16 px-12 rounded-3xl bg-gradient-to-r from-primary to-blue-500 text-white flex flex-row items-center gap-4 text-sm font-black uppercase tracking-widest shadow-glow-primary hover:scale-105 active:scale-95 transition-all border border-primary-container/30 relative z-10"
                >
                  <Activity className="w-6 h-6" />
                  BUKA DAFTAR MONITOR
                </button>
            </section>
        ) : null}

        {/* ─── Layer 2: Core Operational View ─── */}
        {(selectedPatient || operationalMode === 'MONITOR') && (
          <div className="flex-1 min-h-0 animate-in fade-in duration-500">
            {renderMode()}
          </div>
        )}
      </main>

      {/* ─── Layer 3: Action Bar (Admisi) ─── */}
      {selectedPatient && (
        <footer className="sticky bottom-0 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-white/10 p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="max-w-none flex flex-row flex-wrap justify-between items-center gap-6">
            <div className="flex flex-row flex-wrap items-center gap-12 min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{t('triage_v2.labels.current_status')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-glow-primary"></div>
                  <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                      {t('triage_v2.labels.system_ready')}
                  </span>
                </div>
              </div>
              
              <div className="h-10 w-px bg-white/10"></div>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{t('triage_v2.labels.vitals_logged')}</span>
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span className="text-sm font-headline font-black text-on-surface">
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
                className={`flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-glow-primary transition-all border border-primary-container/30 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : <Send className="w-5 h-5" />}
                {isSubmitting ? t('common.processing') : t('triage_v2.actions.process')}
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
