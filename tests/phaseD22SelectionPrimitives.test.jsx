/**
 * NurseFlow Enterprise HIS 2026 — Phase D2.2 Selection Primitives Test Suite
 * 
 * Verifies:
 * 1. ClinicalSelect: Dual-mode rendering (Native + Searchable Combobox), label binding, validation messages.
 * 2. ClinicalCheckbox: Checked/Unchecked states, Indeterminate tree checklist support, 44px touch target.
 * 3. ClinicalRadio / ClinicalRadioGroup: Standard and Segmented Card modes, radiogroup accessibility.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  ClinicalSelect,
  ClinicalCheckbox,
  ClinicalRadio,
  ClinicalRadioGroup
} from '../src/design-system/components/index.js';

describe('🎨 Phase D2.2: Selection & Data Entry Primitives Suite', () => {

  // =========================================================================
  // 1. CLINICAL SELECT TESTS
  // =========================================================================
  describe('📋 1. ClinicalSelect Dual-Mode Contract', () => {
    const mockOptions = [
      { value: 'VIP', label: 'Ruang Rawat VIP' },
      { value: 'ICU', label: 'Intensive Care Unit (ICU)' },
      { value: 'IGD', label: 'Instalasi Gawat Darurat (IGD)' }
    ];

    it('1.1 Native Mode: should render native select element with options and label', () => {
      const selectHtml = renderToString(
        <ClinicalSelect
          id="ward-select"
          label="Lokasi Ruang Rawat"
          required
          options={mockOptions}
          defaultValue="ICU"
        />
      );
      expect(selectHtml).toContain('<select');
      expect(selectHtml).toContain('id="ward-select"');
      expect(selectHtml).toContain('for="ward-select"');
      expect(selectHtml).toContain('Lokasi Ruang Rawat');
      expect(selectHtml).toContain('aria-required="true"');
      expect(selectHtml).toContain('Intensive Care Unit (ICU)');
    });

    it('1.2 Searchable Mode: should render combobox button and listbox structure', () => {
      const comboboxHtml = renderToString(
        <ClinicalSelect
          id="icd-lookup"
          label="Diagnosis Primer (ICD-10)"
          isSearchable
          options={[
            { value: 'I10', label: 'I10 — Essential (primary) hypertension', description: 'Kardiovaskular' },
            { value: 'E11', label: 'E11 — Type 2 diabetes mellitus', description: 'Endokrin' }
          ]}
          value="I10"
        />
      );
      expect(comboboxHtml).toContain('role="combobox"');
      expect(comboboxHtml).toContain('I10 — Essential (primary) hypertension');
      expect(comboboxHtml).toContain('id="icd-lookup"');
    });

    it('1.3 should render validation error message and apply error styling', () => {
      const errorHtml = renderToString(
        <ClinicalSelect
          id="doctor-select"
          label="DPJP Utama"
          status="error"
          validationMessage="Wajib memilih dokter penanggung jawab pelayanan"
          options={mockOptions}
        />
      );
      expect(errorHtml).toContain('aria-invalid="true"');
      expect(errorHtml).toContain('role="alert"');
      expect(errorHtml).toContain('Wajib memilih dokter penanggung jawab pelayanan');
      expect(errorHtml).toContain('var(--nf-clinical-panic');
    });
  });

  // =========================================================================
  // 2. CLINICAL CHECKBOX TESTS
  // =========================================================================
  describe('☑️ 2. ClinicalCheckbox State & Touch Target Contract', () => {
    it('2.1 should render label, description, and associate htmlFor', () => {
      const checkboxHtml = renderToString(
        <ClinicalCheckbox
          id="informed-consent"
          label="Informed Consent Tindakan Bedah"
          description="Pasien/keluarga telah menerima edukasi risiko pembedahan dan anestesi"
          required
          defaultChecked
        />
      );
      expect(checkboxHtml).toContain('for="informed-consent"');
      expect(checkboxHtml).toContain('Informed Consent Tindakan Bedah');
      expect(checkboxHtml).toContain('Pasien/keluarga telah menerima edukasi');
      expect(checkboxHtml).toContain('checked=""');
      expect(checkboxHtml).toContain('min-h-[44px]');
    });

    it('2.2 Indeterminate Mode: should set aria-checked to mixed', () => {
      const indeterminateHtml = renderToString(
        <ClinicalCheckbox
          id="cpoe-bundle"
          label="Paket Order Sepsis Bundle"
          indeterminate={true}
          checked={false}
        />
      );
      expect(indeterminateHtml).toContain('aria-checked="mixed"');
    });

    it('2.3 Disabled State: should set disabled attribute and disabled styling', () => {
      const disabledHtml = renderToString(
        <ClinicalCheckbox
          id="who-checklist"
          label="Sign-Out Operasi (Terkunci oleh DPJP Anestesi)"
          disabled
        />
      );
      expect(disabledHtml).toContain('disabled=""');
      expect(disabledHtml).toContain('cursor-not-allowed');
    });
  });

  // =========================================================================
  // 3. CLINICAL RADIO & RADIOGROUP TESTS
  // =========================================================================
  describe('🔘 3. ClinicalRadio & ClinicalRadioGroup Contract', () => {
    const esiOptions = [
      { value: 'ESI_1', label: 'ESI 1 — Resusitasi', description: 'Mengancam nyawa segera', badge: 'KRITIS' },
      { value: 'ESI_2', label: 'ESI 2 — Emergensi', description: 'Risiko tinggi / Nyeri hebat', badge: 'EMERGENCY' },
      { value: 'ESI_3', label: 'ESI 3 — Urgensi', description: 'Butuh multi sumber daya', badge: 'URGENT' }
    ];

    it('3.1 should render standard radiogroup with options and aria labels', () => {
      const radioGroupHtml = renderToString(
        <ClinicalRadioGroup
          name="patient-gender"
          label="Jenis Kelamin Pasien"
          required
          options={[
            { value: 'L', label: 'Laki-Laki' },
            { value: 'P', label: 'Perempuan' }
          ]}
          value="L"
        />
      );
      expect(radioGroupHtml).toContain('role="radiogroup"');
      expect(radioGroupHtml).toContain('Jenis Kelamin Pasien');
      expect(radioGroupHtml).toContain('Laki-Laki');
      expect(radioGroupHtml).toContain('Perempuan');
    });

    it('3.2 Segmented Card Mode: should render interactive clinical cards with badge and description', () => {
      const cardRadioHtml = renderToString(
        <ClinicalRadioGroup
          name="triage-esi"
          label="Kategori Triase IGD"
          variant="card"
          options={esiOptions}
          value="ESI_1"
        />
      );
      expect(cardRadioHtml).toContain('ESI 1 — Resusitasi');
      expect(cardRadioHtml).toContain('Mengancam nyawa segera');
      expect(cardRadioHtml).toContain('KRITIS');
      expect(cardRadioHtml).toContain('min-h-[44px]');
    });
  });
});
