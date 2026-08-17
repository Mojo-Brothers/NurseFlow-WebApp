/**
 * NurseFlow Enterprise HIS 2026 — Medical Device & Implant Recall Engine
 * Standard: FDA / Kemenkes Medical Device Vigilance & Traceability
 */

import { surgicalRevenueCycleService } from './surgicalRevenueCycle.service.js';
import { eventBusService, DOMAIN_EVENTS } from '../realtime/eventBus.service.js';

class ImplantRecallEngineService {
  constructor() {
    this.recalls = new Map();
  }

  /**
   * 1. Initiate Medical Device / Implant Recall
   */
  initiateRecall({ manufacturer, deviceModel, lotNumberRecalled, recallReason, riskLevel = 'CLASS_I_HIGH_RISK', initiatedBy = 'Komite Keselamatan Pasien RS' }) {
    // Find all affected implants and patients
    const allImplants = Array.from(surgicalRevenueCycleService.implants.values());
    const affectedImplants = allImplants.filter(imp => imp.lotNumber === lotNumberRecalled || imp.manufacturer === manufacturer && imp.lotNumber.includes(lotNumberRecalled));

    const affectedPatients = affectedImplants.map(imp => ({
      patientMrn: imp.patientMrn,
      encounterId: imp.encounterId,
      surgicalCaseId: imp.surgicalCaseId,
      implantName: imp.implantName,
      serialNumber: imp.serialNumber,
      implantedBy: imp.implantedBySurgeon,
      notificationStatus: 'PENDING_CONTACT'
    }));

    const recallId = `RECALL-${Date.now()}`;
    const recallRecord = {
      id: recallId,
      manufacturer,
      deviceModel,
      lotNumberRecalled,
      recallReason,
      riskLevel,
      affectedPatientsCount: affectedPatients.length,
      affectedPatients,
      status: 'ACTIVE_INVESTIGATION',
      initiatedBy,
      initiatedAt: new Date().toISOString()
    };

    this.recalls.set(recallId, recallRecord);

    // Publish high priority alert
    eventBusService.publish(DOMAIN_EVENTS.PANIC_VALUE_TRIGGERED, {
      type: 'MEDICAL_DEVICE_RECALL_ALERT',
      recallId,
      manufacturer,
      lot: lotNumberRecalled,
      patientsCount: affectedPatients.length
    });

    return recallRecord;
  }

  /**
   * 2. Notify affected patients & schedule clinical follow-up
   */
  notifyAllAffectedPatients(recallId) {
    const recall = this.recalls.get(recallId);
    if (!recall) {
      throw new Error(`Recall record ${recallId} tidak ditemukan.`);
    }

    recall.affectedPatients.forEach(p => {
      p.notificationStatus = 'NOTIFIED_SCHEDULED_REVISION';
      p.notifiedAt = new Date().toISOString();
    });

    recall.status = 'ALL_PATIENTS_NOTIFIED';
    recall.updatedAt = new Date().toISOString();

    return recall;
  }

  /**
   * 3. Close Recall Investigation
   */
  closeRecall(recallId, closingNotes, closedBy = 'Ketua Komite Mutu & Keselamatan Pasien') {
    const recall = this.recalls.get(recallId);
    if (!recall) {
      throw new Error(`Recall record ${recallId} tidak ditemukan.`);
    }

    recall.status = 'CLOSED';
    recall.closingNotes = closingNotes;
    recall.closedBy = closedBy;
    recall.closedAt = new Date().toISOString();

    return recall;
  }

  getRecallById(recallId) {
    return this.recalls.get(recallId);
  }

  getAllRecalls() {
    return Array.from(this.recalls.values());
  }
}

export const implantRecallEngineService = new ImplantRecallEngineService();
