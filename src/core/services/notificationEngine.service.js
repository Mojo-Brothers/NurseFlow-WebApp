/**
 * NurseFlow Enterprise HIS — Notification Engine Service
 * Authoritative Centralized Notification & Clinical Escalation Gateway
 * Transmits: Critical Lab Panic Alerts, High-Alert Medication Warnings, Appointment Reminders, System Alerts.
 */

export const NOTIFICATION_TYPE = {
  CRITICAL_LAB_ALERT: 'CRITICAL_LAB_ALERT',
  MEDICATION_ALERT: 'MEDICATION_ALERT',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  SYSTEM_ALERT: 'SYSTEM_ALERT'
};

class NotificationEngine {
  constructor() {
    this.notifications = [];
  }

  sendNotification({ type, recipientRole, recipientId, title, message, patientId = null, encounterId = null, priority = 'NORMAL' }) {
    const notification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      recipientRole,
      recipientId,
      title,
      message,
      patientId,
      encounterId,
      priority,
      status: 'UNREAD',
      timestamp: new Date().toISOString()
    };

    this.notifications.push(notification);
    return notification;
  }

  getNotificationsForRole(role) {
    return this.notifications.filter(n => n.recipientRole === role || n.recipientRole === 'ALL');
  }

  markAsRead(notificationId) {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.status = 'READ';
    }
    return notif;
  }
}

export const notificationEngine = new NotificationEngine();
export default notificationEngine;
