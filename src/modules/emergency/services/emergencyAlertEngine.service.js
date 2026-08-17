/**
 * NurseFlow Enterprise HIS 2026 — Emergency Alert & Code Blue Siren Engine
 * Sprint 3: Audio Siren, Hospital Broadcast, and Critical Alarm Notification
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

export const emergencyAlertEngineService = {
  /**
   * Trigger Code Blue / Critical Resuscitation Siren & Hospital Alert
   */
  triggerEmergencyAlert: async ({
    alertType = 'CODE_BLUE', // 'CODE_BLUE' | 'CODE_RED_FIRE' | 'CODE_BLACK_THREAT' | 'TRAUMA_ALERT'
    locationName = 'Ruang Resusitasi IGD',
    patientName = 'Pasien Darurat',
    triggeredBy = 'Ns. Tim Resusitasi',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const alertId = `ALT-${Date.now()}`;
    const now = new Date().toISOString();

    const alertRecord = {
      id: alertId,
      alert_type: alertType,
      location_name: locationName,
      patient_name: patientName,
      triggered_by: triggeredBy,
      timestamp: now,
      status: 'ACTIVE'
    };

    // Voice announcement broadcast
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const sentence = `PERHATIAN! ${alertType.replace('_', ' ')}! ${locationName}! SELURUH TIM MEDIS SIAGA!`;
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.2;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('[EmergencyAlertEngine] Speech synthesis error:', e);
      }
    }

    await outboxPublisherService.stageEvent({
      aggregateType: 'EMERGENCY_ALERT',
      aggregateId: alertId,
      eventName: 'EMERGENCY_ALERT_TRIGGERED',
      payload: alertRecord,
      actor: actorEmail
    });

    return alertRecord;
  }
};
