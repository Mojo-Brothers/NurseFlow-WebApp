/**
 * NurseFlow Enterprise HIS 2026 — Motion & Animation Design Tokens
 * Standards: Calibrated Clinical Transitions, Zero Visual Disorientation, Reduced-Motion Compliance.
 */

export const MOTION_TOKENS = Object.freeze({
  // ─── Durations (ms) ───
  duration: Object.freeze({
    instant: '0ms',
    fast: '100ms',     // Button press, micro-interactions
    standard: '150ms', // Dropdown, tooltip, tab switch
    moderate: '250ms', // Drawer slide, modal entrance
    deliberate: '400ms'// Large view transition, expand/collapse
  }),

  // ─── Easing Curves ───
  easing: Object.freeze({
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    clinicalSnap: 'cubic-bezier(0.16, 1, 0.3, 1)', // Responsive clinical tactile feedback
    emergencyPulse: 'cubic-bezier(0.4, 0, 0.6, 1)'
  }),

  // ─── Keyframe Animations ───
  animation: Object.freeze({
    pulseEmergency: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    fadeInFast: 'fadeIn 100ms cubic-bezier(0.16, 1, 0.3, 1)',
    slideInRight: 'slideInRight 200ms cubic-bezier(0.16, 1, 0.3, 1)'
  })
});

export default MOTION_TOKENS;
