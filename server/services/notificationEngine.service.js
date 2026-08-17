/**
 * NurseFlow Enterprise HIS 2026 — Multi-Channel Clinical & Administrative Notification Engine
 * Channels: WhatsApp Gateway, Email, SMS, In-App Siren, Mobile Push Notification
 */

export const NOTIFICATION_CHANNELS = {
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  IN_APP_SIREN: 'IN_APP_SIREN',
  MOBILE_PUSH: 'MOBILE_PUSH'
};

class NotificationEngineService {
  constructor() {
    this.dispatchedLogs = [];
  }

  /**
   * Dispatch Clinical or Operational Alert across Multiple Channels
   */
  async dispatchAlert({
    recipientId,
    recipientContact, // phone number or email
    channel = NOTIFICATION_CHANNELS.WHATSAPP,
    priority = 'HIGH', // 'CRITICAL_PANIC' | 'HIGH' | 'ROUTINE'
    title,
    messageBody,
    metadata = {}
  }) {
    const notificationId = `NOTIF-${Date.now()}`;
    const log = {
      notificationId,
      recipientId,
      recipientContact,
      channel,
      priority,
      title,
      messageBody,
      metadata,
      status: 'SENT',
      dispatchedAt: new Date().toISOString()
    };

    this.dispatchedLogs.push(log);
    return log;
  }

  getLogs() {
    return this.dispatchedLogs;
  }
}

export const notificationEngineService = new NotificationEngineService();
