/**
 * NurseFlow Enterprise HIS 2026 — Clinical-First Enterprise Design Tokens
 * Standards: WCAG 2.1 AAA Compliant, High-Contrast Clinical Color Hierarchy,
 * Zero-Ambiguity Severity Scales, Multi-Tenant Status Accents.
 */

export const CLINICAL_COLORS = Object.freeze({
  primary: {
    ocean: '#015C80',       // Primary Brand & Global Patient HUD
    oceanDark: '#014460',   // Deep Container
    oceanLight: '#02759F',  // Accent Highlight
    oceanSurface: '#E6F2F7',// Light Tint
    oceanGlow: 'rgba(1, 92, 128, 0.35)'
  },
  secondary: {
    teal: '#0D9488',        // Pharmacy & Clinical Verification
    tealDark: '#0F766E',
    tealLight: '#14B8A6',
    tealGlow: 'rgba(13, 148, 136, 0.3)'
  },
  accent: {
    cyan: '#06B6D4',        // Navigation & Diagnostic Interactive Tabs
    cyanDark: '#0891B2',
    cyanLight: '#22D3EE',
    indigo: '#4F46E5',      // Doctor CPOE & Clinical Prescriptions
    purple: '#7C3AED'       // Specialized Surgery & Procedures
  },
  clinicalIndicators: {
    criticalRed: '#DC2626',   // Panic Value, Code Blue, ESI 1, Severe Allergy, NEWS2 >= 7
    criticalRedBg: '#FEF2F2',
    criticalRedDarkBg: '#450A0A',
    criticalRedBorder: '#EF4444',
    
    warningAmber: '#D97706',  // High-Alert Meds, LASA, NEWS2 4-6, Moderate Allergy
    warningAmberBg: '#FFFBEB',
    warningAmberDarkBg: '#451A03',
    warningAmberBorder: '#F59E0B',

    normalGreen: '#059669',   // Normal Result, Verified, In-Range, NEWS2 0-3
    normalGreenBg: '#ECFDF5',
    normalGreenDarkBg: '#022C22',
    normalGreenBorder: '#10B981',

    infoBlue: '#2563EB',      // Routine Order, Info, Scheduled
    infoBlueBg: '#EFF6FF',
    infoBlueDarkBg: '#172554',
    infoBlueBorder: '#3B82F6',

    neutralCompleted: '#64748B', // Completed / Discharged
    neutralBorder: '#94A3B8'
  },
  news2Scale: {
    low: { bg: '#ECFDF5', text: '#065F46', border: '#10B981', label: 'NEWS2 0-3 (Rendah / Rutin)' },
    medium: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B', label: 'NEWS2 4-6 (Sedang / Evaluasi Dokter Segera)' },
    high: { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444', label: 'NEWS2 >= 7 (KRITIS / Panggil Tim Medis Reaksi Cepat)' }
  },
  surface: {
    white: '#FFFFFF',
    canvasOffWhite: '#F8FAFC',
    slateBorder: '#E2E8F0',
    slateDarkSurface: '#0F172A',
    slateDarkSurfaceElevated: '#1E293B',
    slateDarkBorder: '#334155',
    hudBackground: '#013D57' // High-contrast clinical context ribbon
  }
});
