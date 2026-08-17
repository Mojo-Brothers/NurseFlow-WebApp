/**
 * NurseFlow Enterprise HIS 2026 — Queue Management Service
 * Multi-counter ticket generation, patient calling, status tracking, and queue analytics.
 */

import { clinicalEventBusService } from './clinicalEventBus.service.js';

const QUEUE_STORAGE_KEY = 'nurseflow_queue_tickets';

const getStoredQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[QueueManagement] Failed to read queue store:', e);
  }
  return [];
};

const saveStoredQueue = (tickets) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.warn('[QueueManagement] Failed to persist queue store:', e);
  }
};

export const queueManagementService = {
  /**
   * Generate next sequential queue number
   */
  generateQueueNumber: (prefix = 'A') => {
    const queue = getStoredQueue();
    const count = queue.filter(q => q.queue_number?.startsWith(prefix)).length + 1;
    return `${prefix}-${String(count).padStart(3, '0')}`;
  },

  /**
   * Create new queue ticket
   */
  createQueueTicket: async ({ patientId, patientName, departmentId = 'ORG-DEP-MED', departmentName = 'Poliklinik', prefix = 'A' }) => {
    const now = new Date().toISOString();
    const queueNumber = queueManagementService.generateQueueNumber(prefix);

    const ticket = {
      id: `QTK-${Date.now()}`,
      queue_number: queueNumber,
      patient_id: patientId,
      patient_name: patientName,
      department_id: departmentId,
      department_name: departmentName,
      queue_status: 'WAITING', // 'WAITING', 'CALLED', 'SERVING', 'SKIPPED', 'COMPLETED'
      created_at: now,
      called_at: null,
      completed_at: null
    };

    const currentList = getStoredQueue();
    saveStoredQueue([...currentList, ticket]);

    await clinicalEventBusService.publishEvent({
      eventType: 'QUEUE_TICKET_CREATED',
      aggregateType: 'QUEUE',
      aggregateId: ticket.id,
      payload: ticket
    });

    return ticket;
  },

  /**
   * Call next queue ticket
   */
  callNextQueue: async (departmentName = 'Poliklinik Penyakit Dalam', counterName = 'Loket 1') => {
    const currentList = getStoredQueue();
    const nextTicketIndex = currentList.findIndex(q => q.queue_status === 'WAITING');

    if (nextTicketIndex === -1) {
      return { success: false, message: 'Tidak ada antrean yang sedang menunggu.' };
    }

    const now = new Date().toISOString();
    const calledTicket = {
      ...currentList[nextTicketIndex],
      queue_status: 'CALLED',
      called_at: now,
      counter_name: counterName
    };

    currentList[nextTicketIndex] = calledTicket;
    saveStoredQueue(currentList);

    await clinicalEventBusService.publishEvent({
      eventType: 'QUEUE_TICKET_CALLED',
      aggregateType: 'QUEUE',
      aggregateId: calledTicket.id,
      payload: calledTicket
    });

    return {
      success: true,
      ticket: calledTicket,
      message: `Memanggil antrean ${calledTicket.queue_number} (${calledTicket.patient_name}) ke ${counterName}`
    };
  },

  /**
   * Complete queue ticket
   */
  completeQueue: (ticketId) => {
    const currentList = getStoredQueue();
    const updated = currentList.map(t => {
      if (t.id === ticketId) {
        return { ...t, queue_status: 'COMPLETED', completed_at: new Date().toISOString() };
      }
      return t;
    });
    saveStoredQueue(updated);
    return { success: true };
  },

  /**
   * Get active waiting queue
   */
  getActiveQueue: () => {
    return getStoredQueue().filter(q => q.queue_status === 'WAITING' || q.queue_status === 'CALLED');
  },

  /**
   * Get all queue history
   */
  getQueueHistory: () => {
    return getStoredQueue();
  }
};
