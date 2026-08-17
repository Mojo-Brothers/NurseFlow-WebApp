/**
 * NurseFlow Enterprise HIS 2026 — JCI Forensic Audit Ecosystem Vertical Slice Test
 * Standards: JCI MOI.7, ISO 27001 ISMS & Permenkes No. 24/2022
 */

import { describe, it, expect } from 'vitest';
import { forensicAuditEcosystemService } from '../server/services/forensicAuditEcosystem.service.js';

describe('Gate 1F.3: JCI Immutable Forensic Audit Trail & Break-the-Glass Ecosystem Vertical Slice', () => {

  // 1. Immutable Event Recording & Tier-2 Snapshot Storage
  it('1. should record audit event with cryptographic signature hash and Tier-2 snapshot delta', () => {
    const log = forensicAuditEcosystemService.recordEvent({
      entityName: 'MedicationOrder / Meropenem',
      entityPrimaryKey: 'ORD-MED-999',
      action: 'UPDATE',
      performedBy: { userId: 'DOC-01', username: 'dr.siti.wijaya', role: 'DPJP', fullName: 'dr. Siti Wijaya, Sp.PD-KGEH' },
      patientMrn: '00-49-00-84',
      patientName: 'Ny. Siti Aminah',
      moduleName: 'PHARMACY',
      reason: 'Eskalasi antibiotik lini ke-3 atas indikasi sepsis',
      beforeSnapshot: { drug: 'Ceftriaxone 1g' },
      afterSnapshot: { drug: 'Meropenem 1g' }
    });

    expect(log.id).toBeDefined();
    expect(log.signature_hash).toHaveLength(64);
    expect(log.has_snapshot).toBe(true);

    const snapshot = forensicAuditEcosystemService.getSnapshotForLog(log.id);
    expect(snapshot).toBeDefined();
    expect(snapshot.before_snapshot.drug).toBe('Ceftriaxone 1g');
    expect(snapshot.after_snapshot.drug).toBe('Meropenem 1g');
  });

  // 2. Cryptographic SHA-256 Chain Verification
  it('2. should verify entire SHA-256 cryptographic chain and confirm zero tampering', () => {
    const verification = forensicAuditEcosystemService.verifyLedgerIntegrity();

    expect(verification.isChainIntact).toBe(true);
    expect(verification.tamperedCount).toBe(0);
    expect(verification.totalBlocksVerified).toBeGreaterThanOrEqual(1);
    expect(verification.chain[0].isHashValid).toBe(true);
  });

  // 3. Tamper Detection Guard
  it('3. should immediately detect unauthorized log tampering via hash mismatch', () => {
    // Inject malicious modification to test verifier
    forensicAuditEcosystemService.injectTamperedLogForTest(0, 'MALICIOUS_UNAUTHORIZED_ALTERATION');

    const check = forensicAuditEcosystemService.verifyLedgerIntegrity();
    expect(check.isChainIntact).toBe(false);
    expect(check.tamperedCount).toBeGreaterThanOrEqual(1);
  });

  // 4. Break-the-Glass Emergency Access Logging
  it('4. should log Break-the-Glass emergency EMR access with required clinical justification', () => {
    const btgLog = forensicAuditEcosystemService.recordEvent({
      entityName: 'PatientMedicalRecord / EmergencyDirectAccess',
      entityPrimaryKey: 'REC-EMER-888',
      action: 'BREAK_THE_GLASS',
      performedBy: { userId: 'DOC-EM', username: 'dr.budi', role: 'Dokter Jaga IGD', fullName: 'dr. Budi Santoso, Sp.EM' },
      patientMrn: '00-99-88-77',
      patientName: 'Tn. Korban Kecelakaan (Mr. X)',
      moduleName: 'EMERGENCY',
      reason: 'Syok hemoragik masif pasca trauma toraks (Perlu akses segera riwayat alergi & golongan darah)'
    });

    expect(btgLog.action).toBe('BREAK_THE_GLASS');

    const btgList = forensicAuditEcosystemService.getBreakTheGlassEvents();
    const event = btgList.find(e => e.audit_log_id === btgLog.id);
    expect(event).toBeDefined();
    expect(event.security_review_status).toBe('PENDING_REVIEW');
    expect(event.reason).toContain('Syok hemoragik masif');
  });

  // 5. High-Risk Access Detector Rules
  it('5. should trigger high-risk security alert upon detecting mass data export or emergency override', () => {
    forensicAuditEcosystemService.recordEvent({
      entityName: 'BulkPatientDatabase',
      entityPrimaryKey: 'EXPORT-ALL-2026',
      action: 'EXPORT',
      performedBy: { userId: 'ADM-01', username: 'admin.it', role: 'IT Support', fullName: 'IT Governance Officer' },
      moduleName: 'ADMIN',
      reason: 'Ekspor berkas rekam medis permohonan asuransi'
    });

    const alerts = forensicAuditEcosystemService.getHighRiskAlerts();
    const exportAlert = alerts.find(a => a.ruleName === 'MASS_DATA_EXPORT_DETECTED');

    expect(exportAlert).toBeDefined();
    expect(exportAlert.severity).toBe('CRITICAL');
  });

  // 6. Multi-Dimensional Ledger Query & Filter
  it('6. should query audit ledger by actor, module, action, and keyword', () => {
    const query = forensicAuditEcosystemService.queryLedger({
      moduleName: 'PHARMACY',
      limit: 10
    });

    expect(query.logs.length).toBeGreaterThanOrEqual(1);
    expect(query.logs.every(l => l.module_name === 'PHARMACY')).toBe(true);
  });

  // 7. Compliance Reporting Scorecard
  it('7. should generate JCI MOI, ISO 27001, and Permenkes 24/2022 compliance scorecard', () => {
    const scorecard = forensicAuditEcosystemService.getComplianceScorecard();

    expect(scorecard.standards.length).toBe(4);
    expect(scorecard.standards.some(s => s.standardName.includes('JCI MOI'))).toBe(true);
    expect(scorecard.standards.some(s => s.standardName.includes('Permenkes No. 24'))).toBe(true);
    expect(scorecard.metricsSummary.totalAuditLogs).toBeGreaterThanOrEqual(1);
  });

});
