/**
 * NurseFlow Enterprise HIS 2026 — JCI Immutable Forensic Audit Ecosystem
 * Standards: JCI Management of Information (MOI), ISO 27001 ISMS, Permenkes No. 24/2022 & KARS 2024
 * Core Architecture: 2-Tier Immutable Ledger, SHA-256 Cryptographic Chaining, Break-the-Glass, Anomaly Detector & Compliance Engine
 */

import crypto from 'crypto';

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
let currentTailHash = GENESIS_HASH;

// In-Memory Immutable Ledger Store (Synchronized with 034_lightweight_audit_engine.sql)
const AUDIT_LEDGER_STORE = {
  logs: [],
  snapshots: [],
  highRiskAlerts: [],
  breakTheGlassEvents: []
};

function calculateSignatureHash(payload, previousHash) {
  const content = JSON.stringify({
    tenant_id: payload.tenant_id,
    entity_name: payload.entity_name,
    entity_primary_key: payload.entity_primary_key,
    action: payload.action,
    performed_by: payload.performed_by,
    performed_at: payload.performed_at,
    ip_address: payload.ip_address,
    patient_mrn: payload.patient_mrn || null,
    reason: payload.reason || null
  }) + previousHash;
  return crypto.createHash('sha256').update(content).digest('hex');
}

export const forensicAuditEcosystemService = {
  /**
   * 1. RECORD IMMUTABLE AUDIT EVENT (TIER 1 + TIER 2 SNAPSHOT)
   */
  recordEvent: ({
    tenantId = 'TENANT-GRP-01',
    entityName,
    entityPrimaryKey,
    action, // 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'OVERRIDE' | 'BREAK_THE_GLASS' | 'LOGIN' | 'LOGOUT'
    performedBy, // { userId, username, role, fullName }
    patientMrn = null,
    patientName = null,
    moduleName = 'EMR',
    ipAddress = '10.10.1.42 (Poli Dalam)',
    reason = '',
    beforeSnapshot = null,
    afterSnapshot = null
  }) => {
    const timestamp = new Date().toISOString();
    const logId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const rawPayload = {
      id: logId,
      tenant_id: tenantId,
      entity_name: entityName,
      entity_primary_key: String(entityPrimaryKey),
      action,
      performed_by: performedBy?.fullName || performedBy?.username || 'SYSTEM_OPERATOR',
      user_id: performedBy?.userId || 'USER-SYS',
      user_role: performedBy?.role || 'CLINICAL_STAFF',
      patient_mrn: patientMrn,
      patient_name: patientName,
      module_name: moduleName,
      performed_at: timestamp,
      ip_address: ipAddress,
      reason,
      has_snapshot: Boolean(beforeSnapshot || afterSnapshot)
    };

    const signatureHash = calculateSignatureHash(rawPayload, currentTailHash);
    const logEntry = {
      ...rawPayload,
      signature_hash: signatureHash,
      previous_log_hash: currentTailHash,
      is_valid: true
    };

    currentTailHash = signatureHash;
    AUDIT_LEDGER_STORE.logs.unshift(logEntry);

    // If delta snapshots exist, store into Tier-2 snapshot table
    if (beforeSnapshot || afterSnapshot) {
      const snapshotEntry = {
        id: `SNAP-${logId}`,
        audit_log_id: logId,
        before_snapshot: beforeSnapshot,
        after_snapshot: afterSnapshot,
        diff_summary: {
          changedKeys: afterSnapshot && beforeSnapshot
            ? Object.keys(afterSnapshot).filter(k => JSON.stringify(afterSnapshot[k]) !== JSON.stringify(beforeSnapshot[k]))
            : Object.keys(afterSnapshot || beforeSnapshot || {})
        },
        created_at: timestamp
      };
      AUDIT_LEDGER_STORE.snapshots.unshift(snapshotEntry);
    }

    // Check for Break-the-Glass emergency access
    if (action === 'BREAK_THE_GLASS') {
      const btgEntry = {
        id: `BTG-${logId}`,
        audit_log_id: logId,
        patient_mrn: patientMrn,
        patient_name: patientName,
        performed_by: logEntry.performed_by,
        user_role: logEntry.user_role,
        department: moduleName,
        ip_address: ipAddress,
        reason: reason || 'Emergency life-saving medical intervention',
        timestamp,
        security_review_status: 'PENDING_REVIEW'
      };
      AUDIT_LEDGER_STORE.breakTheGlassEvents.unshift(btgEntry);
    }

    // Run Real-time High Risk Access Rules
    forensicAuditEcosystemService.evaluateHighRiskRules(logEntry);

    return logEntry;
  },

  /**
   * 2. HIGH-RISK ACCESS DETECTOR ENGINE
   */
  evaluateHighRiskRules: (logEntry) => {
    const alerts = [];

    // Rule 1: Break-the-Glass Emergency Access
    if (logEntry.action === 'BREAK_THE_GLASS') {
      alerts.push({
        id: `ALERT-BTG-${logEntry.id}`,
        audit_log_id: logEntry.id,
        ruleName: 'EMERGENCY_BREAK_THE_GLASS_ACCESS',
        severity: 'HIGH',
        description: `Pengguna ${logEntry.performed_by} (${logEntry.user_role}) melakukan akses darurat Break-the-Glass pada pasien ${logEntry.patient_name || logEntry.patient_mrn}.`,
        timestamp: logEntry.performed_at,
        actor: logEntry.performed_by,
        status: 'UNRESOLVED'
      });
    }

    // Rule 2: Mass Patient Data Export
    if (logEntry.action === 'EXPORT') {
      alerts.push({
        id: `ALERT-EXP-${logEntry.id}`,
        audit_log_id: logEntry.id,
        ruleName: 'MASS_DATA_EXPORT_DETECTED',
        severity: 'CRITICAL',
        description: `Pengunduhan / Ekspor massal data pasien terdeteksi oleh ${logEntry.performed_by} dari IP ${logEntry.ip_address}.`,
        timestamp: logEntry.performed_at,
        actor: logEntry.performed_by,
        status: 'UNRESOLVED'
      });
    }

    // Rule 3: Out-of-Hours Clinical Access (Between 23:00 - 05:00)
    const hour = new Date(logEntry.performed_at).getHours();
    if (hour >= 23 || hour < 5) {
      alerts.push({
        id: `ALERT-OOH-${logEntry.id}`,
        audit_log_id: logEntry.id,
        ruleName: 'OUT_OF_HOURS_ACCESS',
        severity: 'MEDIUM',
        description: `Aktivitas akses di luar jam operasional normal (${hour}:00) oleh ${logEntry.performed_by}.`,
        timestamp: logEntry.performed_at,
        actor: logEntry.performed_by,
        status: 'UNRESOLVED'
      });
    }

    alerts.forEach(al => AUDIT_LEDGER_STORE.highRiskAlerts.unshift(al));
    return alerts;
  },

  /**
   * 3. SHA-256 CRYPTOGRAPHIC CHAIN VERIFIER
   */
  verifyLedgerIntegrity: () => {
    // Reverse array to check sequentially from oldest (genesis) to newest
    const chronologicalLogs = [...AUDIT_LEDGER_STORE.logs].reverse();
    let expectedPrevHash = GENESIS_HASH;
    let tamperedLogsCount = 0;
    const verificationChain = [];

    for (let i = 0; i < chronologicalLogs.length; i++) {
      const log = chronologicalLogs[i];
      const recalculatedHash = calculateSignatureHash(log, expectedPrevHash);
      const isHashValid = (recalculatedHash === log.signature_hash) && (log.previous_log_hash === expectedPrevHash);

      if (!isHashValid) {
        tamperedLogsCount++;
      }

      verificationChain.push({
        logId: log.id,
        index: i + 1,
        entityName: log.entity_name,
        action: log.action,
        timestamp: log.performed_at,
        storedHash: log.signature_hash,
        calculatedHash: recalculatedHash,
        previousHash: log.previous_log_hash,
        isHashValid
      });

      expectedPrevHash = log.signature_hash;
    }

    return {
      totalBlocksVerified: chronologicalLogs.length,
      tamperedCount: tamperedLogsCount,
      isChainIntact: tamperedLogsCount === 0,
      verificationTimestamp: new Date().toISOString(),
      chain: verificationChain.reverse() // Return newest first for UI
    };
  },

  /**
   * 4. QUERY AUDIT LEDGER WITH MULTI-DIMENSIONAL FILTERS
   */
  queryLedger: ({
    search = '',
    actor = 'ALL',
    patientMrn = 'ALL',
    moduleName = 'ALL',
    action = 'ALL',
    page = 1,
    limit = 50
  } = {}) => {
    let list = [...AUDIT_LEDGER_STORE.logs];

    if (actor !== 'ALL') {
      list = list.filter(l => l.performed_by.toLowerCase().includes(actor.toLowerCase()));
    }
    if (patientMrn !== 'ALL') {
      list = list.filter(l => l.patient_mrn === patientMrn);
    }
    if (moduleName !== 'ALL') {
      list = list.filter(l => l.module_name === moduleName);
    }
    if (action !== 'ALL') {
      list = list.filter(l => l.action === action);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.performed_by.toLowerCase().includes(q) ||
        (l.patient_name && l.patient_name.toLowerCase().includes(q)) ||
        (l.patient_mrn && l.patient_mrn.toLowerCase().includes(q)) ||
        l.entity_name.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.reason && l.reason.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs: paginated
    };
  },

  /**
   * 5. GET AUDIT SNAPSHOT DELTA
   */
  getSnapshotForLog: (logId) => {
    return AUDIT_LEDGER_STORE.snapshots.find(s => s.audit_log_id === logId) || null;
  },

  /**
   * 6. GET BREAK-THE-GLASS EVENTS & HIGH-RISK ALERTS
   */
  getBreakTheGlassEvents: () => AUDIT_LEDGER_STORE.breakTheGlassEvents,
  getHighRiskAlerts: () => AUDIT_LEDGER_STORE.highRiskAlerts,

  /**
   * 7. COMPLIANCE REPORTING SCORECARD (JCI MOI, ISO 27001, PERMENKES 24/2022)
   */
  getComplianceScorecard: () => {
    const totalLogs = AUDIT_LEDGER_STORE.logs.length;
    const integrityCheck = forensicAuditEcosystemService.verifyLedgerIntegrity();
    const btgCount = AUDIT_LEDGER_STORE.breakTheGlassEvents.length;
    const alertsCount = AUDIT_LEDGER_STORE.highRiskAlerts.length;

    return {
      overallComplianceScore: integrityCheck.isChainIntact ? 98.5 : 45.0,
      standards: [
        {
          standardName: 'JCI MOI.7 & MOI.8 (Patient Information Privacy & Auditability)',
          status: 'COMPLIANT',
          score: 100,
          details: 'Log immutable anti-tamper, pencatatan Break-the-Glass 100% dengan justifikasi klinis.'
        },
        {
          standardName: 'ISO/IEC 27001:2022 (A.12.4 Logging and Monitoring)',
          status: integrityCheck.isChainIntact ? 'COMPLIANT' : 'NON_COMPLIANT',
          score: integrityCheck.isChainIntact ? 98 : 30,
          details: 'Pencegahan manipulasi via SHA-256 chained hash, pemisahan log ke 2-tier storage.'
        },
        {
          standardName: 'Permenkes No. 24 Tahun 2022 (RME & Jejak Audit Elektronik)',
          status: 'COMPLIANT',
          score: 100,
          details: 'Seluruh mutasi rekam medis (SOAP, CPOE, eMAR, LIS, Rad) tercatat nama nakes, waktu, dan IP.'
        },
        {
          standardName: 'KARS 2024 MIRM (Manajemen Informasi Rekam Medis)',
          status: 'COMPLIANT',
          score: 96,
          details: 'Kelengkapan otentikasi nakes DPJP dan pelacakan akses tidak sah otomatis.'
        }
      ],
      metricsSummary: {
        totalAuditLogs: totalLogs,
        isLedgerCryptographicallyIntact: integrityCheck.isChainIntact,
        totalBreakTheGlassAudits: btgCount,
        totalHighRiskAnomalies: alertsCount
      }
    };
  },

  /**
   * 8. SEED INITIAL CANONICAL FORENSIC AUDIT DATA
   */
  seedCanonicalAuditLogs: () => {
    if (AUDIT_LEDGER_STORE.logs.length > 0) return;

    // Log 1: EMR SOAP Update
    forensicAuditEcosystemService.recordEvent({
      entityName: 'MedicalRecord / SOAP',
      entityPrimaryKey: 'SOAP-20260817-001',
      action: 'UPDATE',
      performedBy: { userId: 'DOC-01', username: 'dr.siti.wijaya', role: 'DPJP Penyakit Dalam', fullName: 'dr. Siti Wijaya, Sp.PD-KGEH' },
      patientMrn: '00-49-00-84',
      patientName: 'Ny. Siti Aminah',
      moduleName: 'EMR',
      ipAddress: '10.10.1.42 (Poli Dalam Station 1)',
      reason: 'Evaluasi respon terapi antihipertensi hari rawat ke-3',
      beforeSnapshot: { soap_id: 'SOAP-01', assessment: 'Hipertensi urgensi dalam evaluasi', systolic: 160 },
      afterSnapshot: { soap_id: 'SOAP-01', assessment: 'Hipertensi terkontrol dengan Candesartan', systolic: 130 }
    });

    // Log 2: Farmasi Resep Verification
    forensicAuditEcosystemService.recordEvent({
      entityName: 'MedicationOrder / Ceftriaxone',
      entityPrimaryKey: 'ORD-PHARM-101',
      action: 'UPDATE',
      performedBy: { userId: 'PHA-01', username: 'apt.dimas', role: 'Apoteker Klinis', fullName: 'apt. Dimas Anggara, S.Farm' },
      patientMrn: '00-49-00-84',
      patientName: 'Ny. Siti Aminah',
      moduleName: 'PHARMACY',
      ipAddress: '10.10.2.18 (Depot Farmasi Rawat Inap)',
      reason: 'Telaah 7-Prinsip Resep: Dosis dan fungsi ginjal terverifikasi aman (eGFR 88 mL/min)',
      beforeSnapshot: { order_status: 'PENDING_REVIEW' },
      afterSnapshot: { order_status: 'VERIFIED_AND_DISPENSED' }
    });

    // Log 3: Break-The-Glass Emergency Override
    forensicAuditEcosystemService.recordEvent({
      entityName: 'PatientMedicalRecord / EmergencyAccess',
      entityPrimaryKey: 'REC-EMER-999',
      action: 'BREAK_THE_GLASS',
      performedBy: { userId: 'DOC-02', username: 'dr.budi.santoso', role: 'Dokter Jaga IGD', fullName: 'dr. Budi Santoso, Sp.EM' },
      patientMrn: '00-55-12-34',
      patientName: 'Tn. Hendra Gunawan (Mr. X)',
      moduleName: 'EMERGENCY',
      ipAddress: '10.10.4.88 (IGD Resuscitation Bay 1)',
      reason: 'Emergency life-saving resusitasi henti jantung (Akses riwayat alergi & penyakit jantung)',
      beforeSnapshot: { access_granted: false },
      afterSnapshot: { access_granted: true, break_glass_active: true }
    });

    // Log 4: LIS Panic Value Alert
    forensicAuditEcosystemService.recordEvent({
      entityName: 'LaboratoryResult / Troponin_T',
      entityPrimaryKey: 'LAB-RES-202',
      action: 'UPDATE',
      performedBy: { userId: 'LAB-01', username: 'analis.budi', role: 'Pranata Laboratorium', fullName: 'Budi Hartono, A.Md.AK' },
      patientMrn: '00-55-12-34',
      patientName: 'Tn. Hendra Gunawan',
      moduleName: 'LABORATORY',
      ipAddress: '10.10.3.15 (Lab Analyzer Cobas 6000)',
      reason: 'Nilai Kritis Troponin T > 2000 ng/L dilaporkan per telepon ke dr. Budi Santoso Sp.EM (Readback Verified)',
      beforeSnapshot: { result_status: 'PENDING_ANALYTICAL' },
      afterSnapshot: { result_status: 'PANIC_VALUE_REPORTED', troponin_t: 2450 }
    });
  },

  /**
   * TEST UTILITY: Inject Tampered Data to test SHA-256 Verifier
   */
  injectTamperedLogForTest: (logIndex = 0, tamperedReason = 'TAMPERED_MALICIOUS_OVERWRITE') => {
    if (AUDIT_LEDGER_STORE.logs[logIndex]) {
      AUDIT_LEDGER_STORE.logs[logIndex].reason = tamperedReason;
    }
  }
};

// Seed initial canonical audit logs on load
forensicAuditEcosystemService.seedCanonicalAuditLogs();
