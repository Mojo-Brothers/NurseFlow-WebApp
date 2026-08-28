/**
 * NurseFlow Enterprise HIS 2026 — Phase D2.1 Clinical Interaction Primitives Test Suite
 * 
 * Verifies:
 * 1. Functional Contract: Variant rendering, loading state, double-submit blocking.
 * 2. Accessibility Contract: Touch target >= 44x44px, ARIA associations, focus visibility.
 * 3. Clinical Safety Semantics: High-Alert styling, tabular numerals for vitals, validation states.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  ClinicalButton,
  ClinicalIconButton,
  ClinicalInput
} from '../src/design-system/components/index.js';

describe('🎨 Phase D2.1: Clinical Interaction Primitives Suite', () => {

  // =========================================================================
  // 1. CLINICAL BUTTON TESTS
  // =========================================================================
  describe('🔘 1. ClinicalButton Behavioral & Safety Contract', () => {
    it('1.1 should render all variants to HTML string without errors', () => {
      const primaryHtml = renderToString(<ClinicalButton variant="primary">Simpan CPPT</ClinicalButton>);
      expect(primaryHtml).toContain('Simpan CPPT');
      expect(primaryHtml).toContain('var(--nf-brand-ocean');

      const destHtml = renderToString(<ClinicalButton variant="destructive">Batalkan Order CPOE</ClinicalButton>);
      expect(destHtml).toContain('Batalkan Order CPOE');
      expect(destHtml).toContain('var(--nf-clinical-panic');

      const highAlertHtml = renderToString(<ClinicalButton variant="highAlert">Verifikasi High-Alert HAM</ClinicalButton>);
      expect(highAlertHtml).toContain('Verifikasi High-Alert HAM');
      expect(highAlertHtml).toContain('from-red-700 to-amber-700');
    });

    it('1.2 should prevent double submit when loading state is active', () => {
      const loadingHtml = renderToString(
        <ClinicalButton loading loadingText="Menandatangani...">
          Tanda Tangani E-Resep
        </ClinicalButton>
      );
      expect(loadingHtml).toContain('aria-busy="true"');
      expect(loadingHtml).toContain('disabled=""');
      expect(loadingHtml).toContain('Menandatangani...');
      expect(loadingHtml).toContain('animate-spin');
    });

    it('1.3 should set aria-disabled and disabled when disabled prop is passed', () => {
      const disabledHtml = renderToString(
        <ClinicalButton disabled>Submit Triase</ClinicalButton>
      );
      expect(disabledHtml).toContain('aria-disabled="true"');
      expect(disabledHtml).toContain('disabled=""');
    });

    it('1.4 should execute onClick handler safely in simulated event', () => {
      let clicked = false;
      const btnElement = ClinicalButton.render({
        children: 'Beri Obat',
        onClick: () => { clicked = true; }
      }, null);
      // Invoke simulated click
      btnElement.props.onClick({ preventDefault: () => {}, stopPropagation: () => {} });
      expect(clicked).toBe(true);
    });

    it('1.5 should block onClick handler when loading', () => {
      let clicked = false;
      const btnElement = ClinicalButton.render({
        loading: true,
        children: 'Beri Obat',
        onClick: () => { clicked = true; }
      }, null);
      let prevented = false;
      btnElement.props.onClick({ preventDefault: () => { prevented = true; }, stopPropagation: () => {} });
      expect(clicked).toBe(false);
      expect(prevented).toBe(true);
    });
  });

  // =========================================================================
  // 2. CLINICAL ICON BUTTON TESTS
  // =========================================================================
  describe('🎯 2. ClinicalIconButton Accessibility & Touch Target Contract', () => {
    it('2.1 should render accessible name via ariaLabel', () => {
      const iconBtnHtml = renderToString(
        <ClinicalIconButton
          icon={<span>🔍</span>}
          ariaLabel="Cari Pasien Rekam Medis"
        />
      );
      expect(iconBtnHtml).toContain('aria-label="Cari Pasien Rekam Medis"');
    });

    it('2.2 should have minimum 44x44px touch target class', () => {
      const iconBtnHtml = renderToString(
        <ClinicalIconButton
          icon={<span>⚙️</span>}
          ariaLabel="Pengaturan Modul"
        />
      );
      expect(iconBtnHtml).toContain('min-w-[44px]');
      expect(iconBtnHtml).toContain('min-h-[44px]');
    });

    it('2.3 should block click handler and set disabled attribute when disabled or loading', () => {
      const disabledHtml = renderToString(
        <ClinicalIconButton
          icon={<span>🖨️</span>}
          ariaLabel="Cetak Gelang Pasien"
          disabled
        />
      );
      expect(disabledHtml).toContain('aria-disabled="true"');
      expect(disabledHtml).toContain('disabled=""');

      const loadingHtml = renderToString(
        <ClinicalIconButton
          icon={<span>🖨️</span>}
          ariaLabel="Cetak Gelang Pasien"
          loading
        />
      );
      expect(loadingHtml).toContain('aria-busy="true"');
      expect(loadingHtml).toContain('disabled=""');
      expect(loadingHtml).toContain('animate-spin');
    });
  });

  // =========================================================================
  // 3. CLINICAL INPUT TESTS
  // =========================================================================
  describe('📝 3. ClinicalInput Medical Form & Vitals Contract', () => {
    it('3.1 should render label and associate htmlFor with input id', () => {
      const inputHtml = renderToString(
        <ClinicalInput
          id="systolic-bp"
          label="Tekanan Darah Sistolik"
          required
          placeholder="120"
        />
      );
      expect(inputHtml).toContain('for="systolic-bp"');
      expect(inputHtml).toContain('id="systolic-bp"');
      expect(inputHtml).toContain('aria-required="true"');
      expect(inputHtml).toContain('Tekanan Darah Sistolik');
    });

    it('3.2 should render medical unit suffix adornment', () => {
      const inputHtml = renderToString(
        <ClinicalInput
          id="hb-input"
          label="Hemoglobin Darah"
          defaultValue="13.5"
          suffixAdornment="g/dL"
        />
      );
      expect(inputHtml).toContain('g/dL');
    });

    it('3.3 should apply tabular numerals class when isVitalsMono is enabled', () => {
      const inputHtml = renderToString(
        <ClinicalInput
          id="hr-input"
          label="Laju Nadi (Heart Rate)"
          defaultValue="78"
          suffixAdornment="bpm"
          isVitalsMono
        />
      );
      expect(inputHtml).toContain('font-vitals-mono');
      expect(inputHtml).toContain('font-feature-tnum');
    });

    it('3.4 should show validation error message and set aria-invalid', () => {
      const inputHtml = renderToString(
        <ClinicalInput
          id="morphine-dose"
          label="Dosis Obat Morfin"
          status="error"
          validationMessage="Dosis melebihi batas aman maksimal (Maks: 10 mg)"
        />
      );
      expect(inputHtml).toContain('aria-invalid="true"');
      expect(inputHtml).toContain('role="alert"');
      expect(inputHtml).toContain('Dosis melebihi batas aman maksimal');
      expect(inputHtml).toContain('var(--nf-clinical-panic');
    });
  });
});
