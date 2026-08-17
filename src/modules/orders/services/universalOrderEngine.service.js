/**
 * NurseFlow Enterprise HIS 2026 — Universal Clinical Order Engine
 * Sprint 5: Master Order Finite State Machine (FSM), Traceability & Audit Trail
 * Standar Kepatuhan: JCI 7th Edition, Permenkes 24/2022, SATUSEHAT ServiceRequest.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

export const ALLOWED_ORDER_TRANSITIONS = {
  DRAFT: ['ORDERED', 'CANCELLED'],
  ORDERED: ['VERIFIED', 'CANCELLED'],
  VERIFIED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

const ORDERS_STORAGE_KEY = 'nurseflow_clinical_orders';

let memoryOrders = null;

const getStoredOrders = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[UniversalOrderEngine] Failed to load orders:', e);
  }
  if (memoryOrders) return memoryOrders;
  return [];
};

const saveStoredOrders = (list) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('[UniversalOrderEngine] Failed to save orders:', e);
  }
  memoryOrders = list;
};

export const universalOrderEngineService = {
  /**
   * Create New Universal Clinical Order
   */
  createOrder: async ({
    patientId,
    patientName,
    mrn,
    episodeId,
    encounterId,
    orderedBy = 'dr. Siti Wijaya, Sp.PD-KGEH',
    orderCategory = 'PHARMACY', // 'PHARMACY' | 'LABORATORY' | 'RADIOLOGY' | 'PROCEDURE' | 'DIET'
    priority = 'ROUTINE',       // 'ROUTINE' | 'URGENT' | 'CITO'
    clinicalIndication,
    items = [],
    itemsCount = 1,
    estimatedAmount = 0,
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const orderNumber = `ORD-2026-${new Date().toISOString().slice(5, 10).replace('-', '')}-${randomSeq}`;
    const now = new Date().toISOString();

    const calculatedCount = items.length > 0 ? items.length : itemsCount;
    const calculatedAmount = items.length > 0
      ? items.reduce((sum, it) => sum + (it.totalPrice || it.price || 0), 0)
      : estimatedAmount;

    const newOrder = {
      id: `ORD-${Date.now()}`,
      order_number: orderNumber,
      patient_id: patientId,
      patient_name: patientName,
      mrn,
      episode_id: episodeId,
      encounter_id: encounterId,
      ordered_by: orderedBy,
      order_category: orderCategory,
      priority,
      clinical_indication: clinicalIndication,
      status: 'ORDERED',
      is_cito: priority === 'CITO',
      order_items_count: calculatedCount,
      total_estimated_amount: calculatedAmount,
      items,
      history: [
        { status: 'DRAFT', timestamp: now, actor: orderedBy },
        { status: 'ORDERED', timestamp: now, actor: orderedBy }
      ],
      created_at: now,
      updated_at: now
    };

    const currentList = getStoredOrders();
    saveStoredOrders([newOrder, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'CLINICAL_ORDER',
      aggregateId: newOrder.id,
      eventName: 'ORDER_CREATED',
      payload: newOrder,
      actor: actorEmail
    });

    return newOrder;
  },

  /**
   * Transition Order Status with Strict FSM Guards
   */
  transitionOrderStatus: async ({ orderId, nextStatus, actorName = 'Petugas Layanan', note = '', actorEmail = 'admin@nurseflow.id' }) => {
    const list = getStoredOrders();
    const index = list.findIndex(o => o.id === orderId);

    if (index === -1) {
      throw new Error(`Order ${orderId} tidak ditemukan.`);
    }

    const order = list[index];
    const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] || [];

    if (!allowed.includes(nextStatus)) {
      throw new Error(`Transisi status order ilegal dari ${order.status} ke ${nextStatus}. Transisi yang diizinkan: ${allowed.join(', ') || 'None'}`);
    }

    const now = new Date().toISOString();
    order.status = nextStatus;
    order.updated_at = now;
    order.history.push({
      status: nextStatus,
      timestamp: now,
      actor: actorName,
      note
    });

    list[index] = order;
    saveStoredOrders(list);

    let eventName = 'ORDER_STATUS_CHANGED';
    if (nextStatus === 'VERIFIED') eventName = 'ORDER_VERIFIED';
    if (nextStatus === 'COMPLETED') eventName = 'ORDER_COMPLETED';

    await outboxPublisherService.stageEvent({
      aggregateType: 'CLINICAL_ORDER',
      aggregateId: order.id,
      eventName,
      payload: order,
      actor: actorEmail
    });

    return order;
  },

  /**
   * Get Orders by Filters
   */
  getOrders: (filters = {}) => {
    let list = getStoredOrders();
    if (filters.category && filters.category !== 'ALL') {
      list = list.filter(o => o.order_category === filters.category);
    }
    if (filters.patientId) {
      list = list.filter(o => o.patient_id === filters.patientId);
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(o => o.status === filters.status);
    }
    return list;
  }
};
