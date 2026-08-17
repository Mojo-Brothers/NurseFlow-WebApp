/**
 * NurseFlow Enterprise HIS 2026 — WHO & JCI Critical Finding Escalation Service
 * Automatic time-based multi-tier escalation protocol for urgent life-threatening diagnostic results
 */

import { eventBusService, DOMAIN_EVENTS } from '../realtime/eventBus.service.js';

export const ESCALATION_LEVELS = {
  LEVEL_0_INITIATED: { level: 0, timeMin: 0, recipient: 'RADIOLOGIST_DISPATCHED', desc: 'Hasil Kritis Dirilis' },
  LEVEL_1_DPJP: { level: 1, timeMin: 15, recipient: 'DPJP_ATTENDING', desc: 'Eskalasi Level 1: Push Alert & Panggilan DPJP' },
  LEVEL_2_HEAD_NURSE: { level: 2, timeMin: 30, recipient: 'WARD_HEAD_NURSE', desc: 'Eskalasi Level 2: Alarm Kepala Ruangan / PIC Bed' },
  LEVEL_3_DIRECTOR: { level: 3, timeMin: 60, recipient: 'MEDICAL_DIRECTOR_ONCALL', desc: 'Eskalasi Level 3: Insiden Keselamatan Pasien Direksi' }
};

class CriticalResultEscalationService {
  constructor() {
    this.escalationLedger = new Map();
  }

  /**
   * Register new critical result alert for automated time-based escalation
   */
  registerCriticalResult({ alertId, patientMrn, patientName, findingName, threat, detectedAt = new Date().toISOString() }) {
    const record = {
      alertId,
      patientMrn,
      patientName,
      findingName,
      threat,
      detectedAt,
      currentEscalationLevel: 0,
      escalationHistory: [
        {
          level: 0,
          timestamp: detectedAt,
          action: 'Pemberitahuan Temuan Kritis Dirilis Radiolog',
          recipient: 'DPJP / Dokter Jaga Cito'
        }
      ],
      isAcknowledged: false,
      acknowledgedAt: null
    };

    this.escalationLedger.set(alertId, record);
    return record;
  }

  /**
   * Evaluates escalation rules based on elapsed minutes
   */
  evaluateEscalation(alertId, simulatedElapsedMinutes = null) {
    const record = this.escalationLedger.get(alertId);
    if (!record || record.isAcknowledged) return record;

    let elapsedMinutes = 0;
    if (simulatedElapsedMinutes !== null) {
      elapsedMinutes = simulatedElapsedMinutes;
    } else {
      const now = Date.now();
      const detected = new Date(record.detectedAt).getTime();
      elapsedMinutes = Math.floor((now - detected) / (60 * 1000));
    }

    if (elapsedMinutes >= 60 && record.currentEscalationLevel < 3) {
      record.currentEscalationLevel = 3;
      record.escalationHistory.push({
        level: 3,
        timestamp: new Date().toISOString(),
        action: ESCALATION_LEVELS.LEVEL_3_DIRECTOR.desc,
        recipient: 'Direktur Pelayanan Medis & Administrator On-Call'
      });
      eventBusService.publish(DOMAIN_EVENTS.PANIC_VALUE_TRIGGERED, {
        alertId,
        level: 3,
        patientMrn: record.patientMrn,
        finding: record.findingName,
        recipient: 'MEDICAL_DIRECTOR'
      });
    } else if (elapsedMinutes >= 30 && record.currentEscalationLevel < 2) {
      record.currentEscalationLevel = 2;
      record.escalationHistory.push({
        level: 2,
        timestamp: new Date().toISOString(),
        action: ESCALATION_LEVELS.LEVEL_2_HEAD_NURSE.desc,
        recipient: 'Kepala Ruangan & Clinical Care Coordinator'
      });
    } else if (elapsedMinutes >= 15 && record.currentEscalationLevel < 1) {
      record.currentEscalationLevel = 1;
      record.escalationHistory.push({
        level: 1,
        timestamp: new Date().toISOString(),
        action: ESCALATION_LEVELS.LEVEL_1_DPJP.desc,
        recipient: 'Panggilan Otomatis Ulang ke DPJP'
      });
    }

    return record;
  }

  acknowledgeAlert(alertId, acknowledgedBy, statement) {
    const record = this.escalationLedger.get(alertId);
    if (!record) {
      throw new Error(`Alert ${alertId} tidak ditemukan.`);
    }

    record.isAcknowledged = true;
    record.acknowledgedAt = new Date().toISOString();
    record.acknowledgedBy = acknowledgedBy;
    record.acknowledgementStatement = statement;

    return record;
  }

  getEscalationStatus(alertId) {
    return this.escalationLedger.get(alertId);
  }
}

export const criticalResultEscalationService = new CriticalResultEscalationService();
