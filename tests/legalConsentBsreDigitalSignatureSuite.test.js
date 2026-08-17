/**
 * NurseFlow Enterprise HIS 2026 — Legal Consent & BSrE Digital Signature Test Suite
 * Standards: UU ITE No. 1/2024, Permenkes No. 24/2022 & BSrE BSSN Digital Certification
 */

import { describe, it, expect } from 'vitest';
import {
  legalConsentBsreService,
  ConsentTamperError
} from '../server/services/legalConsentBsre.service.js';

describe('Sprint 12: Legal Consent & BSrE Digital Signature Suite', () => {

  // 1. Create Informed Consent Document
  it('1. should create structured surgical informed consent document with canonical content hash', () => {
    const consent = legalConsentBsreService.createInformedConsent({
      patientMrn: 'MRN-2026-0817-001',
      patientName: 'Tn. Hendra Wijaya',
      procedureName: 'Apendiktomi Laparoskopi CITO',
      doctorName: 'dr. Surya Sp.B',
      doctorSip: 'SIP.440/123/DISKES/2024',
      witnessName: 'Ny. Maria (Istri Pasien)',
      risksDisclosed: ['Perdarahan', 'Infeksi luka operasi', 'Konversi laparotomi terbuka']
    });

    expect(consent.consentId).toBeDefined();
    expect(consent.status).toBe('DRAFT');
    expect(consent.contentHash).toBeDefined();
    expect(consent.isSigned).toBe(false);
  });

  // 2. Sign with BSrE Digital Certificate
  it('2. should sign informed consent with BSrE BSSN cryptographic certificate', () => {
    const consent = legalConsentBsreService.createInformedConsent({
      patientMrn: 'MRN-2026-0817-002',
      patientName: 'Ny. Linda',
      procedureName: 'Sectio Caesarea CITO',
      doctorName: 'dr. Anita Sp.OG',
      doctorSip: 'SIP.440/456/DISKES/2024',
      witnessName: 'Tn. Budi (Suami)'
    });

    const signResult = legalConsentBsreService.signWithBsreCertificate(consent.consentId, {
      signerType: 'DOCTOR',
      signerName: 'dr. Anita Sp.OG',
      signerNik: '3171015502800099',
      deviceIp: '192.168.1.150'
    });

    expect(signResult.success).toBe(true);
    expect(signResult.status).toBe('LEGAL_BOUND_SIGNED');
    expect(signResult.bsreCertificate.issuer).toContain('Balai Sertifikasi Elektronik');
    expect(signResult.bsreCertificate.tamperProofSeal).toBeDefined();
  });

  // 3. Verify Tamper-Proof Seal & Hash Chain
  it('3. should verify authentic signature and detect any illegal byte alteration after signing', () => {
    const consent = legalConsentBsreService.createInformedConsent({
      patientMrn: 'MRN-2026-0817-003',
      patientName: 'Tn. Rudi',
      procedureName: 'Trepanasi Evakuasi EDH CITO',
      doctorName: 'dr. Farhan Sp.BS',
      doctorSip: 'SIP.440/789/DISKES/2024'
    });

    legalConsentBsreService.signWithBsreCertificate(consent.consentId, {
      signerName: 'dr. Farhan Sp.BS',
      signerNik: '3171015502800077'
    });

    const verification = legalConsentBsreService.verifyConsentIntegrity(consent.consentId);

    expect(verification.isValid).toBe(true);
    expect(verification.status).toBe('VERIFIED_TAMPER_FREE');
    expect(verification.tamperProofSeal).toBeDefined();
  });

  // 4. Detect Intentional Document Tampering
  it('4. should detect unauthorized modification of signed consent document and throw ConsentTamperError', () => {
    const consent = legalConsentBsreService.createInformedConsent({
      patientMrn: 'MRN-2026-0817-004',
      patientName: 'Tn. Joko',
      procedureName: 'Kolesistektomi Laparoskopi',
      doctorName: 'dr. Surya Sp.B',
      doctorSip: 'SIP.440/123/DISKES/2024'
    });

    legalConsentBsreService.signWithBsreCertificate(consent.consentId, {
      signerName: 'dr. Surya Sp.B',
      signerNik: '3171015502800066'
    });

    // Malicious actor tampers with original payload
    consent.originalPayload.procedureName = 'Amputasi Kaki Dextra'; // Tampering

    expect(() => {
      legalConsentBsreService.verifyConsentIntegrity(consent.consentId);
    }).toThrow(ConsentTamperError);
  });

});
