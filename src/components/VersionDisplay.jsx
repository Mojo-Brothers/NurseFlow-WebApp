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
      padding: '0.625rem 1rem',
      fontSize: '0.5rem',
      letterSpacing: '0.05em',
      color: 'var(--on-surface-variant)',
      opacity: 'var(--version-opacity)',
      fontFamily: 'monospace',
      textTransform: 'uppercase',
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
