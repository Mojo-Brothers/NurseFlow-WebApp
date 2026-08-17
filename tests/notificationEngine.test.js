import { describe, it, expect } from 'vitest';
import { notificationEngineService, NOTIFICATION_CHANNELS } from '../server/services/notificationEngine.service.js';

describe('Multi-Channel Notification Engine (WhatsApp, In-App, Email, SMS)', () => {
  it('should dispatch critical panic lab alert via WhatsApp & In-App siren', async () => {
    const alert = await notificationEngineService.dispatchAlert({
      recipientId: 'DOC-001',
      recipientContact: '+6281299887766',
      channel: NOTIFICATION_CHANNELS.WHATSAPP,
      priority: 'CRITICAL_PANIC',
      title: '🚨 NILAI KRITIS LABORATORIUM',
      messageBody: 'Pasien Ny. Siti (MRN-2026-001) Kalium 7.2 mmol/L. Mohon segera evaluasi!'
    });

    expect(alert.status).toBe('SENT');
    expect(alert.priority).toBe('CRITICAL_PANIC');
  });
});
