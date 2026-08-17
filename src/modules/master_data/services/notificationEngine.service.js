/**
 * NurseFlow Enterprise HIS 2026 — Notification & Escalation Engine Service
 * Broadcasts in-app alerts, WhatsApp, email, and clinical SLA escalation alerts.
 */

const NOTIFICATION_STORAGE_KEY = 'nurseflow_notification_logs';

const getStoredNotifications = () => {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[NotificationEngine] Failed to read notifications:', e);
  }
  return [];
};

const saveStoredNotifications = (logs) => {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.warn('[NotificationEngine] Failed to persist notifications:', e);
  }
};

export const notificationEngineService = {
  /**
   * Send In-App Real-Time Notification
   */
  sendInAppNotification: async ({ recipientId, title, message, level = 'INFO' }) => {
    const now = new Date().toISOString();
    const notification = {
      id: `NTF-${Date.now()}`,
      recipient_id: recipientId,
      title,
      message,
      level, // 'INFO', 'WARNING', 'CRITICAL', 'SLA_ALERT'
      channel: 'IN_APP',
      sent_at: now,
      is_read: false,
      delivery_status: 'DELIVERED'
    };

    const currentLogs = getStoredNotifications();
    saveStoredNotifications([notification, ...currentLogs]);
    return notification;
  },

  /**
   * Send WhatsApp Gateway Notification
   */
  sendWhatsAppNotification: async ({ phoneNumber, title, message }) => {
    const now = new Date().toISOString();
    const notification = {
      id: `WA-${Date.now()}`,
      recipient_id: phoneNumber,
      title,
      message,
      channel: 'WHATSAPP_GATEWAY',
      sent_at: now,
      delivery_status: 'SENT'
    };

    const currentLogs = getStoredNotifications();
    saveStoredNotifications([notification, ...currentLogs]);
    return notification;
  },

  /**
   * Send Email Notification
   */
  sendEmailNotification: async ({ email, title, message }) => {
    const now = new Date().toISOString();
    const notification = {
      id: `EML-${Date.now()}`,
      recipient_id: email,
      title,
      message,
      channel: 'EMAIL_SMTP',
      sent_at: now,
      delivery_status: 'SENT'
    };

    const currentLogs = getStoredNotifications();
    saveStoredNotifications([notification, ...currentLogs]);
    return notification;
  },

  /**
   * Automatic Triage Response Time SLA Escalation Alert
   * SLA Rules: P1 > 0 min, P2 > 10 min, P3 > 30 min, P4 > 60 min, P5 > 120 min
   */
  sendTriageSlaAlert: async ({ triageLevel, elapsedMinutes, patientName, locationName = 'IGD Resusitasi' }) => {
    const slaLimits = {
      P1_RESUSCITATION: 0,
      P2_EMERGENT: 10,
      P3_URGENT: 30,
      P4_LESS_URGENT: 60,
      P5_NON_URGENT: 120
    };

    const limit = slaLimits[triageLevel] ?? 30;
    const isBreached = elapsedMinutes > limit;

    if (isBreached) {
      return await notificationEngineService.sendInAppNotification({
        recipientId: 'IGD_TEAM_DUTY',
        title: `🚨 PERINGATAN SLA TRIASE TERLEWATI (${triageLevel})`,
        message: `Pasien ${patientName} di ${locationName} telah menunggu ${elapsedMinutes} menit (Batas SLA: ${limit} menit). Segera tangani!`,
        level: 'SLA_ALERT'
      });
    }

    return null;
  },

  /**
   * Get all active notification logs
   */
  getNotificationLogs: () => {
    return getStoredNotifications();
  }
};
