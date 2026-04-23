import React from 'react';

/**
 * ClinicalCard — "Dead Serious" Operational Zone
 * ABSOLUTE IMMUNITY: Disallows external style/class overrides.
 * SUPPORTED EQUILIBRIUM: Downgrades errors to warnings in /lab or via override.
 */
const ClinicalCard = ({ 
  children, 
  padding = '1.5rem', 
  height, 
  maxWidth,
  borderLeft,
  onClick,
  onMouseDown,
  onMouseUp,
  forceOverride = false, // Emergency only
  ...props 
}) => {
  // 🛡️ ARCHITECTURAL IMMUNITY: Check for illegal style injection
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  const isOverride = forceOverride && (typeof window !== 'undefined' && localStorage.DEBUG_OVERRIDE === 'true');
  const isLab = typeof window !== 'undefined' && window.location.pathname.startsWith('/lab');

  if (isDev && !isOverride) {
    const breaches = [];
    if (props.style?.backdropFilter || props.style?.WebkitBackdropFilter) breaches.push('backdropFilter');
    if (props.style?.boxShadow && props.style.boxShadow !== 'none') breaches.push('boxShadow');
    if (props.className?.includes('card-presentation') || props.className?.includes('glass')) breaches.push('presentation-class');
    
    if (breaches.length > 0) {
      const remediation = `
💡 HOW TO FIX: 
- If this is an ambient/vibrant area, use <PresentationCard /> instead.
- If this is a clinical module, remove "${breaches.join(', ')}". 
- Clinical surfaces must be flat, high-contrast, and solid.`;

      const errorMsg = `[DESIGN LAW VIOLATION] <ClinicalCard /> cannot accept aesthetic props: ${breaches.join(', ')}.${remediation}`;
      
      if (!isLab) throw new Error(errorMsg);
      else console.warn(errorMsg);
    }
  }

  if (isOverride) {
    console.warn('%c[EMERGENCY OVERRIDE] <ClinicalCard /> is running in bypass mode. This must be fixed before production.', 'background: #ba1a1a; color: white; padding: 4px; font-weight: bold;');
  }

  // 🛡️ LOCK: Enforce the 'Dead Serious' specification
  const sanitizedStyle = {
    ...(!isOverride ? {} : props.style),
    padding,
    height,
    maxWidth,
    borderLeft,
    backgroundColor: 'var(--surface-clinical)', 
    backdropFilter: 'none !important',
    WebkitBackdropFilter: 'none !important',
    transition: 'none !important',
    borderRadius: 'var(--radius-clinical)',
    boxShadow: 'none !important',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid var(--border-clinical)'
  };

  return (
    <div 
      className="card-clinical-locked-immune" 
      style={sanitizedStyle}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {children}
    </div>
  );
};

export default ClinicalCard;
