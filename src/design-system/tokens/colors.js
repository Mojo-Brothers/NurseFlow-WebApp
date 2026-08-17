/**
 * NurseFlow Enterprise HIS 2026 — Ocean Clinical Design Tokens
 * Standard: WCAG 2.1 AA Compliant, High-Contrast Clinical Color Palette
 */

export const CLINICAL_COLORS = {
  primary: {
    ocean: '#015C80',       // Primary Brand & Global Patient Ribbon
    oceanDark: '#014460',   // Deep Container
    oceanLight: '#02759F',  // Accent Highlight
    oceanSurface: '#E6F2F7' // Light Tint
  },
  secondary: {
    teal: '#0D9488',        // Pharmacy & Verification
    tealDark: '#0F766E',
    tealLight: '#14B8A6'
  },
  accent: {
    cyan: '#06B6D4',        // Navigation & Interactive Tabs
    cyanDark: '#0891B2',
    cyanLight: '#22D3EE'
  },
  clinicalIndicators: {
    criticalRed: '#DC2626',   // Panic Value, Code Blue, ESI 1, Severe Allergy
    criticalRedBg: '#FEF2F2',
    warningAmber: '#D97706',  // Near Expiry, Reorder Threshold, Moderate Caution
    warningAmberBg: '#FFFBEB',
    normalGreen: '#059669',   // Normal Result, Verified, Compatible, Aldrete >= 8
    normalGreenBg: '#ECFDF5',
    infoBlue: '#2563EB',      // Routine Order, Info, Scheduled
    infoBlueBg: '#EFF6FF',
    neutralCompleted: '#64748B' // Completed / Discharged
  },
  surface: {
    white: '#FFFFFF',
    canvasOffWhite: '#F8FAFC',
    slateBorder: '#E2E8F0',
    slateDarkSurface: '#0F172A',
    slateDarkBorder: '#1E293B'
  }
};
