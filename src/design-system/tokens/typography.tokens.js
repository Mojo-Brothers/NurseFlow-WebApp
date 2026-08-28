/**
 * NurseFlow Enterprise HIS 2026 — Typography Design Tokens
 * Standards: High-Scanning Readability, Tabular Numerals ("tnum" 1) for Vitals & Medical Doses.
 */

export const TYPOGRAPHY_TOKENS = Object.freeze({
  // ─── Font Families ───
  fontFamily: Object.freeze({
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headline: 'Outfit, Inter, system-ui, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace'
  }),

  // ─── Font Size Scale (rem / px) ───
  fontSize: Object.freeze({
    '2xs': '0.6875rem', // 11px - Micro indicators, badge tags
    xs: '0.75rem',       // 12px - Data table cells, form labels
    sm: '0.875rem',      // 14px - Body text, inputs, button text
    base: '1rem',        // 16px - Standard reading text, card titles
    lg: '1.125rem',      // 18px - Section headers, modal titles
    xl: '1.25rem',       // 20px - Workspace main headers
    '2xl': '1.5rem',     // 24px - Vital signs HUD values, KPI numbers
    '3xl': '1.875rem',   // 30px - Large display emergency indicators
    '4xl': '2.25rem'     // 36px - Bedside ICU monitor readouts
  }),

  // ─── Font Weights ───
  fontWeight: Object.freeze({
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  }),

  // ─── Line Heights ───
  lineHeight: Object.freeze({
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.65,
    loose: 2
  }),

  // ─── Letter Spacings ───
  letterSpacing: Object.freeze({
    tighter: '-0.03em',
    tight: '-0.015em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }),

  // ─── Specialized Clinical Font Features ───
  features: Object.freeze({
    tabularNumerals: '"tnum" 1',                 // Fixed-width digits for tabular vital trends & doses
    slashedZero: '"zero" 1',                     // Clear distinction between 0 and O in medical codes
    clinicalVitalsMono: '"tnum" 1, "zero" 1, "cv05" 1' // Optimum clinical vitals rendering
  })
});

export default TYPOGRAPHY_TOKENS;
