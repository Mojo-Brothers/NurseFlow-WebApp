/**
 * NurseFlow Enterprise HIS 2026 — Canonical Token-to-CSS Mapping Dictionary
 * Single Source of Truth (SSOT) Anti-Drift Contract
 * 
 * Provides an immutable, bijective dictionary between JS Tokens and CSS Custom Properties.
 */

import { BASE_TOKENS } from './base.tokens.js';
import { SEMANTIC_TOKENS } from './semantic.tokens.js';
import { CLINICAL_SEVERITY } from './clinical.tokens.js';
import { TYPOGRAPHY_TOKENS } from './typography.tokens.js';
import { SPACING_TOKENS } from './spacing.tokens.js';
import { ELEVATION_TOKENS } from './elevation.tokens.js';
import { MOTION_TOKENS } from './motion.tokens.js';

export function getCanonicalCssVariables() {
  const root = {};
  const dark = {};

  // 1. Base Tokens
  for (const [family, shades] of Object.entries(BASE_TOKENS)) {
    if (family === 'pure') {
      root['--nf-base-pure-white'] = shades.white;
      root['--nf-base-pure-black'] = shades.black;
    } else {
      for (const [shade, val] of Object.entries(shades)) {
        root[`--nf-base-${family}-${shade}`] = val;
      }
    }
  }

  // 2. Semantic Tokens (Light)
  root['--nf-surface-canvas'] = SEMANTIC_TOKENS.light.canvas.default;
  root['--nf-surface-canvas-subtle'] = SEMANTIC_TOKENS.light.canvas.subtle;
  root['--nf-surface-canvas-elevated'] = SEMANTIC_TOKENS.light.canvas.elevated;
  root['--nf-surface-canvas-overlay'] = SEMANTIC_TOKENS.light.canvas.overlay;

  root['--nf-surface-default'] = SEMANTIC_TOKENS.light.surface.default;
  root['--nf-surface-muted'] = SEMANTIC_TOKENS.light.surface.muted;
  root['--nf-surface-inset'] = SEMANTIC_TOKENS.light.surface.inset;
  root['--nf-surface-highlight'] = SEMANTIC_TOKENS.light.surface.highlight;
  root['--nf-surface-hud'] = SEMANTIC_TOKENS.light.surface.hud;
  root['--nf-surface-card'] = SEMANTIC_TOKENS.light.surface.default;

  root['--nf-text-primary'] = SEMANTIC_TOKENS.light.text.primary;
  root['--nf-text-secondary'] = SEMANTIC_TOKENS.light.text.secondary;
  root['--nf-text-muted'] = SEMANTIC_TOKENS.light.text.muted;
  root['--nf-text-inverse'] = SEMANTIC_TOKENS.light.text.inverse;
  root['--nf-text-link'] = SEMANTIC_TOKENS.light.text.link;
  root['--nf-text-link-hover'] = SEMANTIC_TOKENS.light.text.linkHover;

  root['--nf-border-subtle'] = SEMANTIC_TOKENS.light.border.subtle;
  root['--nf-border-default'] = SEMANTIC_TOKENS.light.border.default;
  root['--nf-border-strong'] = SEMANTIC_TOKENS.light.border.strong;
  root['--nf-border-focus'] = SEMANTIC_TOKENS.light.border.focus;

  root['--nf-brand-ocean'] = BASE_TOKENS.ocean[700];
  root['--nf-brand-ocean-dark'] = BASE_TOKENS.ocean[900];
  root['--nf-brand-ocean-light'] = BASE_TOKENS.ocean[600];
  root['--nf-brand-teal'] = BASE_TOKENS.teal[600];

  // 3. Semantic Tokens (Dark)
  dark['--nf-surface-canvas'] = SEMANTIC_TOKENS.dark.canvas.default;
  dark['--nf-surface-canvas-subtle'] = SEMANTIC_TOKENS.dark.canvas.subtle;
  dark['--nf-surface-canvas-elevated'] = SEMANTIC_TOKENS.dark.canvas.elevated;
  dark['--nf-surface-canvas-overlay'] = SEMANTIC_TOKENS.dark.canvas.overlay;

  dark['--nf-surface-default'] = SEMANTIC_TOKENS.dark.surface.default;
  dark['--nf-surface-muted'] = SEMANTIC_TOKENS.dark.surface.muted;
  dark['--nf-surface-inset'] = SEMANTIC_TOKENS.dark.surface.inset;
  dark['--nf-surface-highlight'] = SEMANTIC_TOKENS.dark.surface.highlight;
  dark['--nf-surface-hud'] = SEMANTIC_TOKENS.dark.surface.hud;
  dark['--nf-surface-card'] = SEMANTIC_TOKENS.dark.surface.default;

  dark['--nf-text-primary'] = SEMANTIC_TOKENS.dark.text.primary;
  dark['--nf-text-secondary'] = SEMANTIC_TOKENS.dark.text.secondary;
  dark['--nf-text-muted'] = SEMANTIC_TOKENS.dark.text.muted;
  dark['--nf-text-inverse'] = SEMANTIC_TOKENS.dark.text.inverse;
  dark['--nf-text-link'] = SEMANTIC_TOKENS.dark.text.link;
  dark['--nf-text-link-hover'] = SEMANTIC_TOKENS.dark.text.linkHover;

  dark['--nf-border-subtle'] = SEMANTIC_TOKENS.dark.border.subtle;
  dark['--nf-border-default'] = SEMANTIC_TOKENS.dark.border.default;
  dark['--nf-border-strong'] = SEMANTIC_TOKENS.dark.border.strong;
  dark['--nf-border-focus'] = SEMANTIC_TOKENS.dark.border.focus;

  // 4. Clinical Severity Tokens
  root['--nf-clinical-panic'] = CLINICAL_SEVERITY.panic.criticalPanic.color;
  root['--nf-clinical-panic-bg'] = CLINICAL_SEVERITY.panic.criticalPanic.bgLight;
  root['--nf-clinical-warning'] = CLINICAL_SEVERITY.panic.abnormalHigh.color;
  root['--nf-clinical-warning-bg'] = CLINICAL_SEVERITY.panic.abnormalHigh.bgLight;
  root['--nf-clinical-normal'] = CLINICAL_SEVERITY.panic.normalInRange.color;
  root['--nf-clinical-normal-bg'] = CLINICAL_SEVERITY.panic.normalInRange.bgLight;
  root['--nf-clinical-info'] = CLINICAL_SEVERITY.panic.abnormalLow.color;
  root['--nf-clinical-info-bg'] = CLINICAL_SEVERITY.panic.abnormalLow.bgLight;

  dark['--nf-clinical-panic-bg'] = CLINICAL_SEVERITY.panic.criticalPanic.bgDark;
  dark['--nf-clinical-warning-bg'] = CLINICAL_SEVERITY.panic.abnormalHigh.bgDark;
  dark['--nf-clinical-normal-bg'] = CLINICAL_SEVERITY.panic.normalInRange.bgDark;
  dark['--nf-clinical-info-bg'] = CLINICAL_SEVERITY.panic.abnormalLow.bgDark;

  // 5. Typography Tokens
  root['--nf-font-sans'] = TYPOGRAPHY_TOKENS.fontFamily.sans;
  root['--nf-font-headline'] = TYPOGRAPHY_TOKENS.fontFamily.headline;
  root['--nf-font-mono'] = TYPOGRAPHY_TOKENS.fontFamily.mono;
  root['--nf-font-vitals-mono'] = TYPOGRAPHY_TOKENS.fontFamily.mono;
  root['--nf-font-feature-tnum'] = TYPOGRAPHY_TOKENS.features.tabularNumerals;

  for (const [sz, val] of Object.entries(TYPOGRAPHY_TOKENS.fontSize)) {
    root[`--nf-font-size-${sz}`] = val;
  }
  for (const [wt, val] of Object.entries(TYPOGRAPHY_TOKENS.fontWeight)) {
    root[`--nf-font-weight-${wt}`] = String(val);
  }

  // 6. Spacing & Dimensions Tokens
  for (const [sp, val] of Object.entries(SPACING_TOKENS.scale)) {
    const cleanSp = String(sp).replace('.', '_');
    root[`--nf-spacing-${cleanSp}`] = val;
  }
  for (const [comp, val] of Object.entries(SPACING_TOKENS.componentHeight)) {
    root[`--nf-height-${comp}`] = val;
  }
  for (const [rad, val] of Object.entries(SPACING_TOKENS.radius)) {
    root[`--nf-radius-${rad}`] = val;
  }

  // 7. Elevation & Stacking Hierarchy Tokens
  for (const [shd, val] of Object.entries(ELEVATION_TOKENS.shadow)) {
    root[`--nf-shadow-${shd}`] = val;
  }
  root['--nf-z-base'] = String(ELEVATION_TOKENS.zIndex.base);
  root['--nf-z-table-header'] = String(ELEVATION_TOKENS.zIndex.tableHeaderSticky);
  root['--nf-z-sticky-hud'] = String(ELEVATION_TOKENS.zIndex.patientRibbonHud);
  root['--nf-z-top-navbar'] = String(ELEVATION_TOKENS.zIndex.topNavbar);
  root['--nf-z-dropdown'] = String(ELEVATION_TOKENS.zIndex.dropdownPopover);
  root['--nf-z-drawer'] = String(ELEVATION_TOKENS.zIndex.drawerSidebar);
  root['--nf-z-modal-backdrop'] = String(ELEVATION_TOKENS.zIndex.modalBackdrop);
  root['--nf-z-modal'] = String(ELEVATION_TOKENS.zIndex.modalDialog);
  root['--nf-z-toast'] = String(ELEVATION_TOKENS.zIndex.toastNotification);
  root['--nf-z-safety-hard-stop'] = String(ELEVATION_TOKENS.zIndex.safetyHardStopModal);

  // 8. Motion Tokens
  for (const [dur, val] of Object.entries(MOTION_TOKENS.duration)) {
    root[`--nf-duration-${dur}`] = val;
  }
  for (const [ea, val] of Object.entries(MOTION_TOKENS.easing)) {
    root[`--nf-easing-${ea}`] = val;
  }

  return { root, dark };
}

export default getCanonicalCssVariables;
