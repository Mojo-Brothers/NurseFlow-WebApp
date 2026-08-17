/**
 * NurseFlow Enterprise HIS 2026 — Typography Tokens
 * Standard: High Readability & Medical Coding Scanning
 */

export const CLINICAL_TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Menlo, Monaco, Consolas, monospace'
  },
  fontSize: {
    xs: '0.75rem',    // 12px - Data table cells, labels
    sm: '0.875rem',   // 14px - Body text, inputs
    base: '1rem',      // 16px - Card titles, section headers
    lg: '1.125rem',   // 18px - Modal titles, prominent values
    xl: '1.25rem',    // 20px - Workspace main headers
    '2xl': '1.5rem',  // 24px - Key statistics & KPI values
    '3xl': '1.875rem' // 30px - 42-inch large displays
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900
  }
};
