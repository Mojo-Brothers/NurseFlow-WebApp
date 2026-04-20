import React from 'react';

/**
 * JCI Compliance: VersionDisplay
 * Provides a persistent indicator of the current build version and environment.
 * Critical for clinical auditing and troubleshooting.
 */
const VersionDisplay = () => {
  // Vite inlines these during build (see ci.yml)
  const version = import.meta.env.VITE_APP_VERSION || 'DEV_LOCAL';
  const environment = import.meta.env.VITE_APP_ENV || 'development';
  const sha = import.meta.env.VITE_GIT_SHA || 'dirty';

  return (
    <div style={{
      padding: '0.4rem 0.75rem',
      fontSize: '0.55rem',
      letterSpacing: '0.02em',
      color: 'var(--on-surface-variant)',
      opacity: 0.5,
      fontFamily: 'monospace',
      borderTop: '1px solid var(--outline-variant)',
      backgroundColor: 'var(--surface-container-low)',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>v{version}</span>
        <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{environment}</span>
      </div>
      <div style={{ fontSize: '0.5rem', opacity: 0.8 }}>
        SHA: {sha.substring(0, 7)}
      </div>
    </div>
  );
};

export default VersionDisplay;
