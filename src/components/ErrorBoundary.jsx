/**
 * ErrorBoundary — Step 9
 * Menangkap error runtime di komponen React anak.
 * Menampilkan fallback UI yang bersih daripada crash putih.
 */
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Dalam production: kirim ke error tracking (Sentry, Firebase Crashlytics)
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '60vh', gap: '1.5rem',
          padding: '2rem', textAlign: 'center'
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            backgroundColor: 'var(--error-container)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--error)' }}>
              error_med
            </span>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: '800', fontSize: '1.25rem', color: 'var(--on-surface)', margin: '0 0 0.5rem' }}>
              Terjadi Kesalahan Sistem
            </h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem', maxWidth: '400px' }}>
              Modul ini mengalami error tidak terduga. Silakan refresh halaman atau hubungi administrator.
            </p>
            <code style={{
              display: 'block', marginTop: '1rem', padding: '0.75rem',
              backgroundColor: 'var(--surface-container)', borderRadius: 'var(--radius-md)',
              fontSize: '0.75rem', color: 'var(--error)', fontFamily: 'monospace',
              maxWidth: '500px', overflow: 'auto', textAlign: 'left'
            }}>
              {this.state.error?.message || 'Unknown error'}
            </code>
          </div>
          <button
            className="btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}>
            Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
