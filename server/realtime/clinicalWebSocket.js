/**
 * NurseFlow Enterprise HIS 2026 — Real-Time Clinical WebSocket & Pub/Sub Dispatch Engine
 * Replaces client polling with high-performance real-time push events.
 */

class ClinicalWebSocketBroker {
  constructor() {
    this.subscribers = new Map(); // Channel -> Set of Callback Listeners
  }

  /**
   * Subscribe to a Clinical Channel
   * Channels: 'IGD_TRIAGE', 'NURSE_STATION', 'PHARMACY_QUEUE', 'LAB_ALERTS', 'BILLING_COUNTER'
   */
  subscribe(channel, listenerId, callback) {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Map());
    }
    this.subscribers.get(channel).set(listenerId, callback);
    return () => this.unsubscribe(channel, listenerId);
  }

  /**
   * Unsubscribe from Channel
   */
  unsubscribe(channel, listenerId) {
    if (this.subscribers.has(channel)) {
      this.subscribers.get(channel).delete(listenerId);
    }
  }

  /**
   * Publish Real-Time Clinical Event
   */
  publish(channel, eventName, payload) {
    const channelListeners = this.subscribers.get(channel);
    const message = {
      channel,
      eventName,
      payload,
      timestamp: new Date().toISOString()
    };

    if (channelListeners) {
      channelListeners.forEach(callback => {
        try {
          callback(message);
        } catch (e) {
          console.warn(`[ClinicalWebSocket] Listener error on channel ${channel}:`, e);
        }
      });
    }

    return message;
  }
}

export const clinicalWebSocketBroker = new ClinicalWebSocketBroker();
