import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/useAuth.js';
import { useAuthStore } from '../auth.store.js';
import '../styles/Login.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(t('auth.error_login') || 'Authentication failed. Please use your corporate account.');
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <div className="login-container">
      {/* BRAND PANEL (LEFT) */}
      <div className="brand-panel">
        <div className="brand-card">
          <h1 className="logo">NurseFlow</h1>
          <div className="underline"></div>
          <p className="tagline">
            Clinical Intelligence.<br />
            Precision Care.
          </p>
          
          <div className="hospital-badge">
             <span className="material-symbols-outlined">apartment</span>
             RSUD Central Hospital
          </div>

          <div className="feature-icons">
            <div className="feature-item">
              <div className="feature-icon-box">
                <span className="material-symbols-outlined">vital_signs</span>
              </div>
              <span>Real-time Vitals</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-box">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <span>Data Integrity</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon-box">
                <span className="material-symbols-outlined">clinical_notes</span>
              </div>
              <span>Smart Diagnostics</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOGIN PANEL (RIGHT) */}
      <div className="login-panel">
        <div className="login-form-area">
          <h1>Selamat Datang</h1>
          <p className="instruction">
            Masuk dengan akun korporat rumah sakit Anda untuk mengakses sistem klinis.
          </p>

          {error && <div className="login-error">{error}</div>}

          <button 
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <div className="google-icon-circle">
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            {loading ? 'Authenticating...' : 'Sign in with Google Account'}
          </button>

          <div className="security-badge">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Secured by Firebase Authentication
          </div>

          <div className="compliance-section">
             <div className="jci-logo-placeholder">JCI</div>
             <p className="compliance-text">
               JCI Accredited Hospital System • HIPAA Compliant
             </p>
          </div>

          {/* 🧪 DEV ONLY: BYPASSES */}
          <div className="mt-12 flex-row gap-4 opacity-20 hover:opacity-100 transition-opacity">
             <button 
                onClick={() => { useAuthStore.getState().setUser({ email: 'patient.test@nurseflow.local', displayName: 'Sarah' }, 'NURSE'); navigate('/dashboard'); }}
                className="text-[9px] font-bold uppercase tracking-widest"
              >
                Dev: Login as Nurse
             </button>
          </div>
        </div>

        <div className="footer-links">
           <span>© 2024 NurseFlow. Clinical Intelligence. Precision Care.</span>
           <div className="flex-row gap-6">
              <span>Privacy Policy</span>
              <span>Support</span>
           </div>
        </div>
      </div>
    </div>
  );
}
