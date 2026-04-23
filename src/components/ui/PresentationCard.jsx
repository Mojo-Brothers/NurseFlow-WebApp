import React from 'react';

/**
 * PresentationCard — "WOW Factor" Landing Zone
 * HARDENED API: Enforces standard premium glassmorphism.
 * Allowed props: children, height, gridColumn, padding, justifyContent.
 */
const PresentationCard = ({ 
  children, 
  height, 
  gridColumn, 
  padding = '1.5rem', 
  justifyContent = 'flex-start',
  style = {},
  ...props 
}) => {
  // 🛡️ SECURITY: Standardize the Premium Shell
  const sanitizedStyle = {
    ...style,
    gridColumn,
    height,
    padding,
    justifyContent,
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-presentation)', // Premium Shell Radius
    boxShadow: 'var(--shadow-presentation)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  };

  return (
    <div className="card-presentation-locked" style={sanitizedStyle} {...props}>
      {children}
    </div>
  );
};

export default PresentationCard;
