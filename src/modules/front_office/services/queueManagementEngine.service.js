/**
 * NurseFlow Enterprise HIS 2026 — Multi-Queue Management Engine
 * Sprint 2: Real-Time Multi-Department Calling, Priority Queuing, and Voice Synthesizer
 * Standar Kepatuhan: Permenkes No. 24/2022 & BPJS Antrean Faskes.
 */

import { outboxPublisherService } from './outboxPublisher.service.js';

export const QUEUE_POOLS = {
  LOKET_ADM: { code: 'LOKET_ADM', name: 'Loket Pendaftaran & Admisi', prefix: 'A', currentNumber: 1 },
  POLI_PD: { code: 'POLI_PD', name: 'Poli Penyakit Dalam', prefix: 'B', currentNumber: 1 },
  POLI_ANAK: { code: 'POLI_ANAK', name: 'Poli Kesehatan Anak', prefix: 'C', currentNumber: 1 },
  IGD_TRIAGE: { code: 'IGD_TRIAGE', name: 'Triase Gawat Darurat', prefix: 'E', currentNumber: 1 },
  FARMASI: { code: 'FARMASI', name: 'Loket Penyerahan Obat Farmasi', prefix: 'F', currentNumber: 1 },
  LAB: { code: 'LAB', name: 'Sampling Laboratorium', prefix: 'L', currentNumber: 1 },
  RAD: { code: 'RAD', name: 'Pemeriksaan Radiologi', prefix: 'R', currentNumber: 1 }
};

const QUEUE_TICKETS_KEY = 'nurseflow_front_office_queue_tickets';
const QUEUE_POOLS_KEY = 'nurseflow_front_office_queue_pools';

const getStoredPools = () => {
  try {
    const raw = localStorage.getItem(QUEUE_POOLS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[QueueEngine] Failed to load pools:', e);
  }
  return QUEUE_POOLS;
};

const saveStoredPools = (pools) => {
  try {
    localStorage.setItem(QUEUE_POOLS_KEY, JSON.stringify(pools));
  } catch (e) {
    console.warn('[QueueEngine] Failed to save pools:', e);
  }
};

const getStoredTickets = () => {
  try {
    const raw = localStorage.getItem(QUEUE_TICKETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[QueueEngine] Failed to load tickets:', e);
  }
  return [
    {
      id: 'TKT-2026-001',
      ticket_number: 'A-001',
      pool_code: 'LOKET_ADM',
      pool_name: 'Loket Pendaftaran & Admisi',
      patient_id: 'P-1001',
      patient_name: 'Ny. Siti Nurhaliza, S.Pd',
      encounter_id: 'ENC-2026-001',
      counter_name: 'Loket 1',
      is_priority: false,
      priority_reason: 'NONE',
      queue_status: 'SERVING',
      created_at: '2026-08-17T08:15:00Z',
      called_at: '2026-08-17T08:18:00Z',
      completed_at: null,
      branch_id: 'BRN-JKT-PST'
    }
  ];
};

const saveStoredTickets = (tickets) => {
  try {
    localStorage.setItem(QUEUE_TICKETS_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.warn('[QueueEngine] Failed to save tickets:', e);
  }
};

export const queueManagementEngineService = {
  /**
   * Generate sequential queue ticket for specific pool
   */
  generateTicket: async ({
    poolCode = 'LOKET_ADM',
    patientId,
    patientName,
    encounterId = null,
    isPriority = false,
    priorityReason = 'NONE', // 'GERIATRIC', 'DISABILITY', 'PEDIATRIC', 'EMERGENCY', 'NONE'
    branchId = 'BRN-JKT-PST'
  }) => {
    const pools = getStoredPools();
    const pool = pools[poolCode] || pools.LOKET_ADM;

    const nextSeq = (pool.currentNumber || 1);
    pool.currentNumber = nextSeq + 1;
    pools[poolCode] = pool;
    saveStoredPools(pools);

    const formattedNum = String(nextSeq).padStart(3, '0');
    const prefix = isPriority ? `P-${pool.prefix}` : pool.prefix;
    const ticketNumber = `${prefix}-${formattedNum}`;
    const now = new Date().toISOString();

    const newTicket = {
      id: `TKT-${Date.now()}`,
      ticket_number: ticketNumber,
      pool_code: pool.code,
      pool_name: pool.name,
      patient_id: patientId,
      patient_name: patientName,
      encounter_id: encounterId,
      counter_name: null,
      is_priority: isPriority,
      priority_reason: priorityReason,
      queue_status: 'WAITING',
      created_at: now,
      called_at: null,
      completed_at: null,
      branch_id: branchId
    };

    const currentTickets = getStoredTickets();
    saveStoredTickets([newTicket, ...currentTickets]);

    // Outbox event staging
    await outboxPublisherService.stageEvent({
      aggregateType: 'QUEUE',
      aggregateId: newTicket.id,
      eventName: 'QUEUE_TICKET_CREATED',
      payload: newTicket,
      branchId
    });

    return newTicket;
  },

  /**
   * Call queue ticket with voice synthesizer
   */
  callTicket: async ({ ticketId, counterName = 'Loket 1', actorEmail = 'admin@nurseflow.id' }) => {
    const tickets = getStoredTickets();
    const index = tickets.findIndex(t => t.id === ticketId);

    if (index === -1) {
      throw new Error(`Tiket antrean ${ticketId} tidak ditemukan.`);
    }

    const ticket = tickets[index];
    const now = new Date().toISOString();

    ticket.queue_status = 'CALLED';
    ticket.counter_name = counterName;
    ticket.called_at = now;

    tickets[index] = ticket;
    saveStoredTickets(tickets);

    // Audio Voice Synthesizer (Indonesian Text-to-Speech)
    queueManagementEngineService.speakCallingSentence({
      ticketNumber: ticket.ticket_number,
      counterName
    });

    await outboxPublisherService.stageEvent({
      aggregateType: 'QUEUE',
      aggregateId: ticket.id,
      eventName: 'QUEUE_CALLED',
      payload: { ticketNumber: ticket.ticket_number, counterName, patientName: ticket.patient_name },
      actor: actorEmail
    });

    return ticket;
  },

  /**
   * Speak Announcement via Web Speech API
   */
  speakCallingSentence: ({ ticketNumber, counterName }) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const sentence = `Nomor Antrean... ${ticketNumber.replace('-', ' ')}... Silakan menuju ke ${counterName}`;
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[QueueEngine] Voice synthesizer audio fallback:', err);
      }
    }
  },

  /**
   * Transition Ticket Status: SERVING, COMPLETED, ARCHIVED, SKIPPED
   */
  updateTicketStatus: async (ticketId, nextStatus) => {
    const tickets = getStoredTickets();
    const index = tickets.findIndex(t => t.id === ticketId);
    if (index === -1) return null;

    const ticket = tickets[index];
    ticket.queue_status = nextStatus;
    if (nextStatus === 'COMPLETED') {
      ticket.completed_at = new Date().toISOString();
    }

    tickets[index] = ticket;
    saveStoredTickets(tickets);
    return ticket;
  },

  /**
   * Get Active Queue List
   */
  getTickets: (poolCode = 'ALL') => {
    let list = getStoredTickets();
    if (poolCode !== 'ALL') {
      list = list.filter(t => t.pool_code === poolCode);
    }
    return list;
  },

  /**
   * Get All Pools Summary
   */
  getPools: () => {
    return Object.values(getStoredPools());
  }
};
