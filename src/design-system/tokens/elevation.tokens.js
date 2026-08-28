/**
 * NurseFlow Enterprise HIS 2026 — Elevation & Z-Index Design Tokens
 * Standards: Layer Physics, Zero Stacking-Context Collisions, Safety Modal Dominance.
 */

export const ELEVATION_TOKENS = Object.freeze({
  // ─── Shadow Physics (Light Mode) ───
  shadow: Object.freeze({
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    clinicalHudGlow: '0 4px 20px rgba(1, 92, 128, 0.25)',
    panicGlow: '0 0 15px rgba(220, 38, 38, 0.5)'
  }),

  // ─── Authoritative Stacking Context Hierarchy (Z-Index) ───
  // Strictly ordered to guarantee safety hard-stop modals always capture focus.
  zIndex: Object.freeze({
    hide: -1,
    base: 0,
    tableHeaderSticky: 10,
    patientRibbonHud: 50,
    topNavbar: 60,
    dropdownPopover: 100,
    drawerSidebar: 500,
    modalBackdrop: 1000,
    modalDialog: 1050,
    toastNotification: 2000,
    safetyHardStopModal: 9999 // Absolute highest clinical priority
  })
});

export default ELEVATION_TOKENS;
