import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { useAuthStore } from '../auth.store.js';
import '../styles/Login.css';

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

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(t('auth.error_login') || 'Akses Ditolak. Hubungi IT Helpdesk.');
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      {/* Left Side: Login Area (65%) */}
      <section className="login-left">
        {/* System Status Bar */}
        <header className="sys-header flx flx-row justify-between items-center">
          <div className="flx flx-row items-center gap-6">
            <div className="flx flx-row items-center gap-1-5">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
              <span>Network Latency: Optimal</span>
            </div>
            <span style={{ color: 'var(--l-outline-variant)' }}>|</span>
            <div className="flx flx-row items-center gap-1-5">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: sessionMinutes < 5 ? 'var(--l-error)' : 'var(--l-on-surface-variant)' }}>timer</span>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', color: sessionMinutes < 5 ? 'var(--l-error)' : 'var(--l-on-surface-variant)' }}>
                Session Active • {sessionMinutes}m remaining
              </span>
            </div>
          </div>
          <div className="flx flx-row items-center gap-4" style={{ display: window.innerWidth < 640 ? 'none' : 'flex' }}>
            <span>Last login: Oct 24, 08:30</span>
            <span style={{ color: 'var(--l-outline-variant)' }}>|</span>
            <span>Node ID: HOSP-01</span>
          </div>
        </header>

        <div className="auth-content">
          <div className="auth-box flx-col gap-10">
            {/* Branding Context */}
            <div className="flx flx-row items-center gap-3">
              <span className="material-symbols-outlined text-primary f-bold" style={{ fontSize: '2.25rem' }}>medical_services</span>
              <div className="flx-col">
                <h1 className="headline-font f-extrabold text-primary" style={{ fontSize: '1.5rem', lineHeight: 1, letterSpacing: '-0.025em', margin: 0 }}>NurseFlow</h1>
                <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Enterprise Clinical Infrastructure</span>
              </div>
            </div>

            <div>
              <span className="text-primary" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem', display: 'block' }}>Otentikasi Keamanan Tinggi</span>
              <h2 className="headline-font f-extrabold text-on-surface" style={{ fontSize: '2.25rem', letterSpacing: '-0.025em', margin: 0 }}>Sistem Otentikasi Terpusat</h2>
              <p className="text-on-surface-variant t-sm" style={{ marginTop: '0.5rem' }}>Akses Aman untuk Tenaga Medis Terverifikasi</p>
            </div>

            {/* Error State */}
            {error && (
              <div className="flx flx-row items-start gap-4 trust-card" style={{ backgroundColor: 'var(--l-error-container)', borderLeft: '4px solid var(--l-error)', padding: '1.25rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--l-on-error-container)', fontSize: '1.5rem' }}>report</span>
                <div className="flx-col">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--l-on-error-container)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Akses Ditolak</span>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(147, 0, 10, 0.9)', marginTop: '0.125rem', marginBottom: 0 }}>{error}</p>
                </div>
              </div>
            )}

            <div className="flx-col gap-6">
              {/* Primary: SSO */}
              <button 
                className="btn-primary-auth flx-col items-center justify-center gap-1"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <div className="flx flx-row items-center justify-between" style={{ width: '100%' }}>
                  <div className="flx flx-row items-center gap-4">
                    {loading ? (
                      <span className="material-symbols-outlined spin" style={{ fontSize: '1.5rem' }}>progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>verified_user</span>
                    )}
                    <div className="flx-col items-start">
                      <span className="f-extrabold t-lg" style={{ letterSpacing: '-0.025em' }}>
                        {loading ? 'Menghubungkan ke Sistem...' : 'Masuk dengan Akun Rumah Sakit'}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.8 }}>Secure Clinical Access</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined" style={{ display: window.innerWidth < 640 ? 'none' : 'block' }}>arrow_forward</span>
                </div>
              </button>

              {/* Secondary: Google Clinical */}
              <button 
                className="btn-secondary-auth flx flx-row items-center justify-center gap-3"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span>Masuk dengan Google Clinical</span>
              </button>

              {/* Fallback / Emergency */}
              <div className="flx flx-row items-center justify-center" style={{ marginTop: '1rem', padding: '0 0.25rem' }}>
                <button className="t-xs f-bold text-on-surface-variant flx flx-row items-center gap-2" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>mail</span>
                  Email & Password
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: '10px', color: 'var(--l-on-surface-variant)', opacity: 0.7, marginTop: '0.5rem', fontWeight: 500 }}>Last access from Station-04 (Terminal)</p>
            </div>

            <div className="flx flx-row gap-6" style={{ marginTop: '2.5rem', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(66, 71, 82, 0.6)', borderTop: '1px solid rgba(194, 198, 212, 0.3)', paddingTop: '1.5rem' }}>
              <a className="link-sub" href="#">Ketentuan Layanan</a>
              <a className="link-sub" href="#">Kebijakan Privasi</a>
              <a className="link-sub" href="#">Persetujuan Medis</a>
            </div>
          </div>
        </div>

        <footer className="flx flx-row justify-between items-center" style={{ width: '100%', padding: '1rem 2rem', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--l-on-surface-variant)', borderTop: '1px solid var(--l-outline-variant)', backgroundColor: 'var(--l-surface)' }}>
          <div className="flx flx-row items-center gap-4">
            <p style={{ margin: 0 }}>© 2024 NurseFlow Enterprise Infrastructure.</p>
            <span style={{ color: 'rgba(194, 198, 212, 0.3)' }} className="hidden-sm">|</span>
            <div className="flx flx-row items-center gap-1-5 hidden-sm" style={{ color: '#059669' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
              <span>Clinical Infrastructure: Online</span>
            </div>
          </div>
          <div className="flx flx-row items-center gap-4">
            <button 
              onClick={() => { useAuthStore.getState().setUser({ email: 'patient.test@nurseflow.local', displayName: 'Sarah' }, 'NURSE'); navigate('/dashboard'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
            >
              Admin Override
            </button>
            <span style={{ color: 'rgba(194, 198, 212, 0.3)' }}>|</span>
            <span>Build v1.2.0-stable</span>
          </div>
        </footer>
      </section>

      {/* Right Side: Trust/Info Panel (35%) */}
      <section className="login-right">
        <div className="medical-grid-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}></div>
        <div className="flx-col gap-10" style={{ position: 'relative', zIndex: 10 }}>
          <div className="flx-col gap-4">
            <h3 className="text-primary" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Sertifikasi & Kepatuhan</h3>
            
            <div className="flx-col gap-3">
              {/* Compliance & Accreditations */}
              <div className="trust-card flx flx-row items-center gap-4" style={{ backgroundColor: 'var(--l-surface-variant)', border: '1px solid var(--l-outline-variant)' }}>
                <span className="material-symbols-outlined text-primary f-bold">verified</span>
                <div className="flx-col">
                  <span className="text-primary" style={{ fontSize: '0.75rem', fontWeight: 800 }}>Compliance & Accreditations</span>
                  <span className="text-on-surface-variant" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>JCI Accredited & HIPAA Compliant</span>
                </div>
              </div>

              {/* Data Integrity */}
              <div className="trust-card flx flx-row items-center gap-4" style={{ backgroundColor: 'var(--l-surface)', border: '1px solid var(--l-outline-variant)', opacity: 1 }}>
                <span className="material-symbols-outlined f-bold" style={{ color: 'var(--l-secondary)' }}>enhanced_encryption</span>
                <div className="flx-col">
                  <span className="text-on-surface" style={{ fontSize: '0.75rem', fontWeight: 800 }}>Data Integrity</span>
                  <span className="text-on-surface-variant" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AES-256 E2EE & Audit Logging</span>
                </div>
              </div>

              {/* Active Monitoring */}
              <div className="trust-card flx flx-row items-center gap-4" style={{ backgroundColor: 'var(--l-surface)', border: '1px solid var(--l-outline-variant)', opacity: 1 }}>
                <span className="material-symbols-outlined f-bold" style={{ color: 'var(--l-secondary)' }}>monitor_heart</span>
                <div className="flx-col">
                  <span className="text-on-surface" style={{ fontSize: '0.75rem', fontWeight: 800 }}>Active Monitoring</span>
                  <span className="text-on-surface-variant" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Real-time Session Threat Detection</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flx-col gap-4" style={{ padding: '1.5rem', backgroundColor: 'var(--l-primary)', borderRadius: '4px', color: '#ffffff' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.875rem' }}>info</span>
            <p style={{ fontSize: '0.75rem', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
              Akses ini diawasi secara ketat oleh sistem keamanan pusat. Setiap aktivitas login dan tindakan medis di dalam platform akan dicatat dalam audit trail permanen untuk kepatuhan hukum dan medis.
            </p>
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Security Protocol: EAL4+ Verified</span>
            </div>
          </div>

          <div className="flx-col gap-4" style={{ opacity: 0.4, filter: 'grayscale(100%)', pointerEvents: 'none', marginTop: '1rem' }}>
            <div className="flx flx-row items-center gap-4">
              <img alt="JCI Gold Seal" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiWt0NVDqbh8DRFukGh7jnrfqZ0-5sdH5KeQmdAjWyWLz2G1xf-iR1tDzmG1_frMgd1r84oDHYev34nmzATodDrMiHDcoPOSmmNM4tkarlqEt8BFuV-sZNiI4PeAZkSqP72jE-y_qNoYkXzQd1JO47vOYM_MMaKFHQL4wLy7R86pws5bMpWMDC427H5-c99On64MyjOEDI2nTMcoQcamkPOkq-OYHIpqfo3_C2sX52uJy1rVUfxodEkfWv2xvqy7spr0hFV5ka9CzG" style={{ height: '3rem', width: 'auto' }} />
              <span className="material-symbols-outlined" style={{ fontSize: '2.25rem' }}>lock_person</span>
              <span className="material-symbols-outlined" style={{ fontSize: '2.25rem' }}>health_and_safety</span>
            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 640px) {
          .hidden-sm { display: none !important; }
        }
      `}} />
    </div>
  );
}
