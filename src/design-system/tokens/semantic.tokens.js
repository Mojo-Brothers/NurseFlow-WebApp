/**
 * NurseFlow Enterprise HIS 2026 — Semantic Design Tokens
 * Maps base primitives to meaningful UI intents for Light and Dark themes.
 * Standards: WCAG 2.1 AAA Contrast Target, Role-Based Color Anchoring.
 */

import { BASE_TOKENS } from './base.tokens.js';

export const SEMANTIC_TOKENS = Object.freeze({
  light: Object.freeze({
    // ─── Surfaces & Backgrounds ───
    canvas: {
      default: BASE_TOKENS.slate[50],      // Main page background
      subtle: BASE_TOKENS.slate[100],      // Secondary container
      elevated: BASE_TOKENS.pure.white,    // Cards, Modals, Popovers
      overlay: 'rgba(15, 23, 42, 0.65)'    // Modal backdrop
    },
    surface: {
      default: BASE_TOKENS.pure.white,
      muted: BASE_TOKENS.slate[100],
      inset: BASE_TOKENS.slate[200],
      highlight: BASE_TOKENS.ocean[50],
      hud: BASE_TOKENS.ocean[900]          // High-contrast patient context ribbon
    },

    // ─── Typography & Foregrounds ───
    text: {
      primary: BASE_TOKENS.slate[900],     // High contrast text
      secondary: BASE_TOKENS.slate[700],   // Secondary labels
      muted: BASE_TOKENS.slate[500],       // Placeholder & disabled
      inverse: BASE_TOKENS.pure.white,     // Text on dark surfaces
      link: BASE_TOKENS.ocean[700],
      linkHover: BASE_TOKENS.ocean[800]
    },

    // ─── Borders & Outlines ───
    border: {
      subtle: BASE_TOKENS.slate[200],
      default: BASE_TOKENS.slate[300],
      strong: BASE_TOKENS.slate[400],
      focus: BASE_TOKENS.ocean[600],
      inverse: BASE_TOKENS.slate[700]
    },

    // ─── Interactive States ───
    interactive: {
      primary: {
        default: BASE_TOKENS.ocean[700],
        hover: BASE_TOKENS.ocean[800],
        active: BASE_TOKENS.ocean[900],
        text: BASE_TOKENS.pure.white,
        focusRing: BASE_TOKENS.ocean[500]
      },
      secondary: {
        default: BASE_TOKENS.slate[100],
        hover: BASE_TOKENS.slate[200],
        active: BASE_TOKENS.slate[300],
        text: BASE_TOKENS.slate[800],
        focusRing: BASE_TOKENS.slate[400]
      },
      danger: {
        default: BASE_TOKENS.red[600],
        hover: BASE_TOKENS.red[700],
        active: BASE_TOKENS.red[800],
        text: BASE_TOKENS.pure.white,
        focusRing: BASE_TOKENS.red[400]
      },
      disabled: {
        background: BASE_TOKENS.slate[100],
        text: BASE_TOKENS.slate[400],
        border: BASE_TOKENS.slate[200]
      }
    }
  }),

  dark: Object.freeze({
    // ─── Surfaces & Backgrounds ───
    canvas: {
      default: BASE_TOKENS.slate[950],     // Deep dark canvas
      subtle: BASE_TOKENS.slate[900],      // Secondary dark container
      elevated: BASE_TOKENS.slate[900],    // Dark elevated cards
      overlay: 'rgba(2, 6, 23, 0.85)'      // Dark modal backdrop
    },
    surface: {
      default: BASE_TOKENS.slate[900],
      muted: BASE_TOKENS.slate[800],
      inset: BASE_TOKENS.slate[950],
      highlight: BASE_TOKENS.ocean[950],
      hud: BASE_TOKENS.slate[900]
    },

    // ─── Typography & Foregrounds ───
    text: {
      primary: BASE_TOKENS.slate[50],
      secondary: BASE_TOKENS.slate[300],
      muted: BASE_TOKENS.slate[500],
      inverse: BASE_TOKENS.slate[950],
      link: BASE_TOKENS.ocean[400],
      linkHover: BASE_TOKENS.ocean[300]
    },

    // ─── Borders & Outlines ───
    border: {
      subtle: BASE_TOKENS.slate[800],
      default: BASE_TOKENS.slate[700],
      strong: BASE_TOKENS.slate[600],
      focus: BASE_TOKENS.ocean[400],
      inverse: BASE_TOKENS.slate[200]
    },

    // ─── Interactive States ───
    interactive: {
      primary: {
        default: BASE_TOKENS.ocean[500],
        hover: BASE_TOKENS.ocean[400],
        active: BASE_TOKENS.ocean[600],
        text: BASE_TOKENS.slate[950],
        focusRing: BASE_TOKENS.ocean[400]
      },
      secondary: {
        default: BASE_TOKENS.slate[800],
        hover: BASE_TOKENS.slate[700],
        active: BASE_TOKENS.slate[600],
        text: BASE_TOKENS.slate[100],
        focusRing: BASE_TOKENS.slate[500]
      },
      danger: {
        default: BASE_TOKENS.red[500],
        hover: BASE_TOKENS.red[400],
        active: BASE_TOKENS.red[600],
        text: BASE_TOKENS.pure.white,
        focusRing: BASE_TOKENS.red[400]
      },
      disabled: {
        background: BASE_TOKENS.slate[900],
        text: BASE_TOKENS.slate[600],
        border: BASE_TOKENS.slate[800]
      }
    }
  })
});

export default SEMANTIC_TOKENS;
