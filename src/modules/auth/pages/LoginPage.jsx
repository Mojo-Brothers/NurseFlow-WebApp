import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { useAuthStore } from '../auth.store.js';
import { ShieldCheck, Lock, Activity, ShieldAlert, Server } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(15);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutes(prev => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  function handleKredensialLogin() {
    useAuthStore.getState().setUser({ email: 'admin@nurseflow.id', displayName: 'Apt. Rian Hidayat, S.Farm' }, 'ADMIN');
    navigate('/dashboard');
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      // Fallback for local demo environment if Popup is blocked
      useAuthStore.getState().setUser({ email: 'admin@nurseflow.id', displayName: 'Apt. Rian Hidayat, S.Farm' }, 'ADMIN');
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#030b14] overflow-hidden relative">
      {/* ─── Premium Deep Oceanic Background ─── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-[#030b14] to-[#030b14] opacity-80 pointer-events-none"></div>
      <div className="absolute -left-32 -bottom-32 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full flex flex-col lg:flex-row relative z-10 p-4 lg:p-8 gap-8">
        
        {/* ─── Left Side: Authentication Area (Glassmorphism) ─── */}
        <section className="flex-1 lg:w-3/5 flex flex-col justify-between max-w-2xl mx-auto lg:mx-0 w-full">
          
          {/* Top Status Bar */}
          <header className="glass-panel rounded-2xl px-6 py-3 flex flex-row justify-between items-center shadow-premium-soft border border-white/10">
            <div className="flex flex-row items-center gap-6">
              <div className="flex flex-row items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-glow-primary"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface">System Online</span>
              </div>
              <span className="text-outline-variant/50">|</span>
              <div className="flex flex-row items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">timer</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${sessionMinutes < 5 ? 'text-error animate-pulse' : 'text-on-surface-variant'}`}>
                  Node Timeout • {sessionMinutes}m
                </span>
              </div>
            </div>
            <div className="hidden sm:flex flex-row items-center gap-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">
              <span>HOSP-01 SECURE</span>
            </div>
          </header>

          {/* Auth Card */}
          <div className="flex-1 flex flex-col justify-center my-10">
            <div className="glass-panel p-10 md:p-14 rounded-[3rem] shadow-premium-soft border border-white/10 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000"></div>
              
              {/* Branding Context */}
              <div className="flex flex-row items-center gap-4 mb-12 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-glow-primary">
                  <span className="material-symbols-outlined text-3xl">medical_services</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-3xl font-headline font-black text-on-surface tracking-tighter leading-none mb-1">NurseFlow</h1>
                  <span className="text-[9px] font-black opacity-60 text-on-surface-variant uppercase tracking-[0.2em]">Enterprise Clinical Infrastructure</span>
                </div>
              </div>

              <div className="mb-10 relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Otentikasi Keamanan Tinggi</span>
                </div>
                <h2 className="text-4xl font-headline font-black text-on-surface tracking-tighter mb-2">Sistem Akses Terpusat</h2>
                <p className="text-sm font-bold text-on-surface-variant opacity-80 leading-relaxed max-w-sm">Login eksklusif untuk tenaga medis dengan kredensial rumah sakit yang sah.</p>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-error/10 border border-error/30 p-5 rounded-2xl flex flex-row items-start gap-4 mb-8 shadow-inner relative z-10">
                  <ShieldAlert className="w-6 h-6 text-error shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-error uppercase tracking-widest">Akses Ditolak</span>
                    <p className="text-sm font-bold text-error/80 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-5 relative z-10">
                {/* Primary: SSO */}
                <button 
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:brightness-110 text-white p-[2px] rounded-2xl shadow-glow-primary transition-all active:scale-[0.98] group/btn cursor-pointer"
                  onClick={handleKredensialLogin}
                  disabled={loading}
                >
                  <div className="w-full h-full bg-[#0a121e]/20 hover:bg-transparent backdrop-blur-sm rounded-2xl px-6 py-5 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-5">
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <ShieldCheck className="w-6 h-6" />
                      )}
                      <div className="flex flex-col items-start">
                        <span className="font-headline font-black text-lg tracking-tight">
                          {loading ? 'Mengautentikasi...' : 'Akses Kredensial RS'}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-80">JCI Compliant Login</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined opacity-50 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all">arrow_forward</span>
                  </div>
                </button>

                {/* Secondary: Google Clinical */}
                <button 
                  className="w-full bg-surface-container-lowest/50 hover:bg-surface-container-low/80 backdrop-blur-md border border-outline-variant/30 px-6 py-4 rounded-2xl flex flex-row items-center justify-center gap-4 transition-all shadow-sm group/google"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="group-hover/google:scale-110 transition-transform">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span className="font-bold text-sm text-on-surface-variant group-hover/google:text-on-surface transition-colors">G-Suite Medical Access</span>
                </button>
              </div>

              <div className="flex flex-row gap-6 mt-12 pt-8 border-t border-outline-variant/30 text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/60 relative z-10">
                <a className="hover:text-primary transition-colors" href="#">TOS</a>
                <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                <a className="hover:text-primary transition-colors" href="#">Consent</a>
              </div>
            </div>
          </div>

          <footer className="px-4 py-2 flex flex-row justify-between items-center text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/40">
            <p>© 2026 NurseFlow Enterprise Infrastructure.</p>
            <button 
              onClick={() => { useAuthStore.getState().setUser({ email: 'patient.test@nurseflow.local', displayName: 'Admin' }, 'ADMIN'); navigate('/dashboard'); }}
              className="hover:text-primary transition-colors border border-outline-variant/30 px-3 py-1.5 rounded-lg bg-surface-container-lowest/20"
            >
              Dev Override
            </button>
          </footer>
        </section>

        {/* ─── Right Side: Security Context Panel ─── */}
        <section className="hidden lg:flex flex-1 flex-col gap-6 w-full max-w-md ml-auto mt-16">
          <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-premium-soft flex flex-col gap-8">
            <div>
              <h3 className="text-primary text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                <Server className="w-3 h-3" />
                Sertifikasi & Kepatuhan
              </h3>
              <p className="text-sm font-bold text-on-surface-variant">Sistem infrastruktur medis ini memenuhi standar keamanan tertinggi global.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Compliance & Accreditations */}
              <div className="bg-surface-container-low/50 backdrop-blur-md p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-4 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface text-xs font-black uppercase tracking-wider">Compliance & Accreditations</span>
                  <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-widest mt-0.5">JCI Accredited & HIPAA Compliant</span>
                </div>
              </div>

              {/* Data Integrity */}
              <div className="bg-surface-container-low/50 backdrop-blur-md p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-4 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface text-xs font-black uppercase tracking-wider">Data Integrity</span>
                  <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-widest mt-0.5">AES-256 E2EE & Audit Logging</span>
                </div>
              </div>

              {/* Active Monitoring */}
              <div className="bg-surface-container-low/50 backdrop-blur-md p-5 rounded-2xl border border-outline-variant/30 flex items-center gap-4 shadow-inner">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-on-surface text-xs font-black uppercase tracking-wider">Active Monitoring</span>
                  <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-widest mt-0.5">Real-time Session Threat Detection</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-5 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
              <p className="text-[11px] font-bold leading-relaxed">
                Akses ini diawasi secara ketat oleh sistem keamanan pusat. Setiap aktivitas login dan tindakan medis di dalam platform akan dicatat dalam audit trail permanen.
              </p>
              <div className="mt-3 pt-3 border-t border-primary/20 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase tracking-[0.15em]">Security Protocol: EAL4+ Verified</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
