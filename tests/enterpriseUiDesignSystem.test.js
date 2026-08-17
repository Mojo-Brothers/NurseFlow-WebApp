import { describe, it, expect } from 'vitest';
import { CLINICAL_COLORS } from '../src/design-system/tokens/colors.js';
import { CLINICAL_TYPOGRAPHY } from '../src/design-system/tokens/typography.js';

describe('Enterprise UI Design System & Component Library (Mandate Activation)', () => {

  // 1. Color Tokens
  it('1. should define Ocean Clinical color tokens adhering to high-contrast clinical standard', () => {
    expect(CLINICAL_COLORS.primary.ocean).toBe('#015C80');
    expect(CLINICAL_COLORS.secondary.teal).toBe('#0D9488');
    expect(CLINICAL_COLORS.accent.cyan).toBe('#06B6D4');
    expect(CLINICAL_COLORS.clinicalIndicators.criticalRed).toBe('#DC2626');
    expect(CLINICAL_COLORS.clinicalIndicators.warningAmber).toBe('#D97706');
    expect(CLINICAL_COLORS.clinicalIndicators.normalGreen).toBe('#059669');
    expect(CLINICAL_COLORS.surface.canvasOffWhite).toBe('#F8FAFC');
  });

  // 2. Typography Tokens
  it('2. should define clinical typography scale and monospace font for medical records', () => {
    expect(CLINICAL_TYPOGRAPHY.fontFamily.sans).toContain('Inter');
    expect(CLINICAL_TYPOGRAPHY.fontFamily.mono).toContain('JetBrains Mono');
    expect(CLINICAL_TYPOGRAPHY.fontSize.xs).toBe('0.75rem');
    expect(CLINICAL_TYPOGRAPHY.fontSize['3xl']).toBe('1.875rem');
  });

  // 3. Clinical Status Indicator Mappings
  it('3. should provide complete indicator palette for zero-click visibility', () => {
    expect(CLINICAL_COLORS.clinicalIndicators.criticalRedBg).toBe('#FEF2F2');
    expect(CLINICAL_COLORS.clinicalIndicators.normalGreenBg).toBe('#ECFDF5');
    expect(CLINICAL_COLORS.clinicalIndicators.infoBlueBg).toBe('#EFF6FF');
  });
});
