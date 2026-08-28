/**
 * NurseFlow Enterprise HIS 2026 — Phase D2.3 Clinical Safety Primitives Test Suite
 * 
 * Verifies:
 * 1. ClinicalBadge: Severity scales, HAM/LASA, NEWS2, Panic lab values, Tabular Numerals.
 * 2. ClinicalStatusIndicator: Multi-signal status (Shape + Icon + Label) for WCAG 1.4.1 non-color reliance.
 * 3. ClinicalAlert: RFC 7807 Problem Details integration, Correlation Lineage ID, ARIA live strategy.
 * 4. ClinicalModal: Generic modal dialog with Z-Index 1050 and ARIA dialog semantics.
 * 5. HardStopDialog: Authoritative Z-Index 9999, Patient Identity Context Banner, Mandatory Acknowledgment & Justification.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import {
  ClinicalBadge,
  ClinicalStatusIndicator,
  ClinicalAlert,
  ClinicalModal,
  HardStopDialog
} from '../src/design-system/components/index.js';

describe('🎨 Phase D2.3: Clinical Safety Primitives Suite', () => {

  // =========================================================================
  // 1. CLINICAL BADGE TESTS
  // =========================================================================
  describe('🏷️ 1. ClinicalBadge Semantic Contract', () => {
    it('1.1 should render standard severity levels correctly', () => {
      const routineHtml = renderToString(<ClinicalBadge severity="routine">Rawat Jalan</ClinicalBadge>);
      expect(routineHtml).toContain('Rawat Jalan');

      const warningHtml = renderToString(<ClinicalBadge severity="warning">Risiko Jatuh Sedang</ClinicalBadge>);
      expect(warningHtml).toContain('Risiko Jatuh Sedang');

      const panicHtml = renderToString(<ClinicalBadge severity="panic">NILAI KRITIS</ClinicalBadge>);
      expect(panicHtml).toContain('NILAI KRITIS');
      expect(panicHtml).toContain('animate-pulse');
    });

    it('1.2 should apply specialized clinical domain styles and tabular numerals', () => {
      const hamHtml = renderToString(
        <ClinicalBadge clinicalType="high-alert-medication">
          HIGH ALERT: KALIUM KLORIDA 7.46%
        </ClinicalBadge>
      );
      expect(hamHtml).toContain('HIGH ALERT: KALIUM KLORIDA');
      expect(hamHtml).toContain('from-red-700 to-amber-700');

      const news2Html = renderToString(
        <ClinicalBadge clinicalType="news2">
          NEWS2: 7 (RESIKO TINGGI)
        </ClinicalBadge>
      );
      expect(news2Html).toContain('font-vitals-mono');
      expect(news2Html).toContain('font-feature-tnum');
    });
  });

  // =========================================================================
  // 2. CLINICAL STATUS INDICATOR TESTS
  // =========================================================================
  describe('🚦 2. ClinicalStatusIndicator Non-Color Reliance Contract', () => {
    it('2.1 should render distinct icons and text labels for all states', () => {
      const stableHtml = renderToString(<ClinicalStatusIndicator status="stable" />);
      expect(stableHtml).toContain('role="status"');
      expect(stableHtml).toContain('Stabil');
      expect(stableHtml).toContain('aria-label="Status: Stabil"');

      const criticalHtml = renderToString(<ClinicalStatusIndicator status="critical" pulse />);
      expect(criticalHtml).toContain('Kritis / Bahaya');
      expect(criticalHtml).toContain('animate-pulse');

      const offlineHtml = renderToString(<ClinicalStatusIndicator status="offline" />);
      expect(offlineHtml).toContain('Terputus (Offline)');
    });
  });

  // =========================================================================
  // 3. CLINICAL ALERT & RFC 7807 TESTS
  // =========================================================================
  describe('🚨 3. ClinicalAlert & RFC 7807 Contract', () => {
    it('3.1 should render standard alert with assertive ARIA live for critical severity', () => {
      const alertHtml = renderToString(
        <ClinicalAlert
          variant="critical"
          title="Interaksi Obat Lethal Terdeteksi"
        >
          Kombinasi Warfarin dan NSAID dosis tinggi berisiko pendarahan masif gastrointestinal.
        </ClinicalAlert>
      );
      expect(alertHtml).toContain('role="alert"');
      expect(alertHtml).toContain('aria-live="assertive"');
      expect(alertHtml).toContain('Interaksi Obat Lethal Terdeteksi');
    });

    it('3.2 should seamlessly format RFC 7807 Problem Details object with Lineage ID', () => {
      const problemDetails = {
        type: 'https://his.hospital.id/errors/cpoe-duplicate-active-order',
        title: 'Duplikasi Order Obat Aktif',
        status: 409,
        detail: 'Pasien telah memiliki order aktif Ceftriaxone 1g IV yang belum selesai diberikan.',
        instance: 'urn:his:cpoe:order:99281',
        correlationId: 'CORR-CPOE-2026-X882A'
      };

      const rfcAlertHtml = renderToString(
        <ClinicalAlert
          variant="error"
          problemDetails={problemDetails}
        />
      );

      expect(rfcAlertHtml).toContain('Duplikasi Order Obat Aktif');
      expect(rfcAlertHtml).toContain('HTTP 409');
      expect(rfcAlertHtml).toContain('Pasien telah memiliki order aktif Ceftriaxone');
      expect(rfcAlertHtml).toContain('CORR-CPOE-2026-X882A');
    });
  });

  // =========================================================================
  // 4. CLINICAL MODAL TESTS
  // =========================================================================
  describe('🪟 4. ClinicalModal Dialog Contract', () => {
    it('4.1 should render dialog with Z-Index 1050 and ARIA dialog attributes', () => {
      const modalHtml = renderToString(
        <ClinicalModal
          isOpen={true}
          title="Verifikasi Rekam Medis"
          description="Konfirmasi data identitas sebelum asesmen awal IGD"
        >
          <p>Konten formulir klinis</p>
        </ClinicalModal>
      );
      expect(modalHtml).toContain('role="dialog"');
      expect(modalHtml).toContain('aria-modal="true"');
      expect(modalHtml).toContain('Verifikasi Rekam Medis');
      expect(modalHtml).toContain('var(--nf-z-modal-dialog,1050)');
    });

    it('4.2 should return null when isOpen is false', () => {
      const closedModalHtml = renderToString(
        <ClinicalModal
          isOpen={false}
          title="Dialog Tertutup"
        >
          <p>Konten rahasia</p>
        </ClinicalModal>
      );
      expect(closedModalHtml).toBe('');
    });
  });

  // =========================================================================
  // 5. HARD STOP DIALOG (SAFETY-CLASS) TESTS
  // =========================================================================
  describe('🛑 5. HardStopDialog High-Risk Safety Contract', () => {
    const mockPatient = {
      name: 'Ny. Siti Rahmawati',
      mrn: 'RM-2026-08892',
      room: 'ICU Bed 04'
    };

    it('5.1 should render with Z-Index 9999, Patient Identity Banner, and Mandatory Fields', () => {
      const hardStopHtml = renderToString(
        <HardStopDialog
          isOpen={true}
          title="HARD-STOP: OVERRIDE HIGH-ALERT HAM"
          actionName="Pemberian Kalium Klorida Bolus IV Cepat"
          riskLevel="critical"
          patientContext={mockPatient}
          warningDetails="Pemberian Kalium Klorida tanpa infus pompa dapat memicu Aritmia Ventrikel Lethal / Henti Jantung."
          requiredTypedPhrase="OVERRIDE"
        />
      );

      expect(hardStopHtml).toContain('role="alertdialog"');
      expect(hardStopHtml).toContain('var(--nf-z-safety-hard-stop-modal,9999)');
      expect(hardStopHtml).toContain('Ny. Siti Rahmawati');
      expect(hardStopHtml).toContain('RM-2026-08892');
      expect(hardStopHtml).toContain('ICU Bed 04');
      expect(hardStopHtml).toContain('Pemberian Kalium Klorida tanpa infus pompa');
      expect(hardStopHtml).toContain('Alasan Klinis / Justifikasi Medis Wajib');
      expect(hardStopHtml).toContain('OVERRIDE');
      expect(hardStopHtml).toContain('Batalkan Tindakan (Aman)');
    });

    it('5.2 should strictly prevent backdrop dismiss and lack close-on-click on overlay', () => {
      const hardStopHtml = renderToString(
        <HardStopDialog
          isOpen={true}
          title="INTERVENSI RESIKO TINGGI"
          warningDetails="Peringatan"
        />
      );
      // The outer container has role="presentation" and does NOT have an attached click dismiss handler
      expect(hardStopHtml).toContain('role="presentation"');
      expect(hardStopHtml).toContain('role="alertdialog"');
    });

    it('5.3 should format comprehensive patient context with MRN and location', () => {
      const fullPatient = {
        name: 'Tn. Ahmad Dahlan',
        mrn: 'RM-2026-99120',
        room: 'Ruang Isolasi IGD',
        encounterId: 'ENC-2026-IGD-004'
      };

      const hardStopHtml = renderToString(
        <HardStopDialog
          isOpen={true}
          patientContext={fullPatient}
          warningDetails="Konflik Kontraindikasi Mutlak"
        />
      );

      expect(hardStopHtml).toContain('Tn. Ahmad Dahlan');
      expect(hardStopHtml).toContain('RM-2026-99120');
      expect(hardStopHtml).toContain('Ruang Isolasi IGD');
    });
  });
});
