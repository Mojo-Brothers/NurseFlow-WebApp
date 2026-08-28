/**
 * NurseFlow Enterprise HIS 2026 — Spacing & Layout Design Tokens
 * Standards: Dense Clinical Information Density (4px/8px Base Grid), High-Density Workstations.
 */

export const SPACING_TOKENS = Object.freeze({
  // ─── Dense Clinical Space Scale (px / rem) ───
  scale: Object.freeze({
    0: '0px',
    px: '1px',
    0.5: '0.125rem',  // 2px  - Micro separators, badge insets
    1: '0.25rem',     // 4px  - Dense table padding, tight tags
    1.5: '0.375rem',  // 6px  - Compact input vertical padding
    2: '0.5rem',      // 8px  - Standard dense gap, card item margin
    2.5: '0.625rem',  // 10px - Form field gap
    3: '0.75rem',     // 12px - Table cell padding, toolbar spacing
    4: '1rem',        // 16px - Standard component padding, card padding
    5: '1.25rem',     // 20px - Section separation
    6: '1.5rem',      // 24px - Container padding
    8: '2rem',        // 32px - Major section layout gap
    10: '2.5rem',     // 40px - Workspace header spacing
    12: '3rem',       // 48px - Page margins
    16: '4rem'        // 64px - Display break
  }),

  // ─── Component Specific Clinical Dimensions ───
  componentHeight: Object.freeze({
    inputDense: '2rem',       // 32px - High-density medical data entry
    inputStandard: '2.375rem',// 38px - Standard form inputs
    buttonDense: '2rem',      // 32px - Dense grid action buttons
    buttonStandard: '2.5rem', // 40px - Primary modal actions
    patientRibbonHeight: '3.75rem', // 60px - Sticky Patient Header HUD
    topNavbarHeight: '3.5rem' // 56px - Global navigation bar
  }),

  // ─── Radius Tokens ───
  radius: Object.freeze({
    none: '0px',
    xs: '0.125rem', // 2px  - Clinical tags
    sm: '0.25rem',  // 4px  - Input boxes, table highlights
    md: '0.375rem', // 6px  - Standard cards, dropdowns
    lg: '0.5rem',   // 8px  - Modals, prominent panels
    xl: '0.75rem',  // 12px - Floating HUD containers
    full: '9999px'  // Pill badges, circular avatars
  })
});

export default SPACING_TOKENS;
