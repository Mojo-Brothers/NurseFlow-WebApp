/**
 * NurseFlow Enterprise HIS 2026 — Radiology Workflow Engine & Status Machine
 * 9-State Finite State Machine (FSM) managing the full patient imaging journey
 */

import { eventBusService, DOMAIN_EVENTS } from '../realtime/eventBus.service.js';
import { radiologyAuditService } from './radiologyAudit.service.js';

export const RAD_ORDER_STATUS = {
  ORDERED: 'ORDERED',
  SCHEDULED: 'SCHEDULED',
  PATIENT_ARRIVED: 'PATIENT_ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  IMAGE_ACQUIRED: 'IMAGE_ACQUIRED',
  REPORT_PENDING: 'REPORT_PENDING',
  REPORT_FINALIZED: 'REPORT_FINALIZED',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED'
};

const VALID_TRANSITIONS = {
  [RAD_ORDER_STATUS.ORDERED]: [RAD_ORDER_STATUS.SCHEDULED, RAD_ORDER_STATUS.PATIENT_ARRIVED],
  [RAD_ORDER_STATUS.SCHEDULED]: [RAD_ORDER_STATUS.PATIENT_ARRIVED],
  [RAD_ORDER_STATUS.PATIENT_ARRIVED]: [RAD_ORDER_STATUS.IN_PROGRESS],
  [RAD_ORDER_STATUS.IN_PROGRESS]: [RAD_ORDER_STATUS.IMAGE_ACQUIRED],
  [RAD_ORDER_STATUS.IMAGE_ACQUIRED]: [RAD_ORDER_STATUS.REPORT_PENDING, RAD_ORDER_STATUS.REPORT_FINALIZED],
  [RAD_ORDER_STATUS.REPORT_PENDING]: [RAD_ORDER_STATUS.REPORT_FINALIZED],
  [RAD_ORDER_STATUS.REPORT_FINALIZED]: [RAD_ORDER_STATUS.COMPLETED],
  [RAD_ORDER_STATUS.COMPLETED]: [RAD_ORDER_STATUS.ARCHIVED],
  [RAD_ORDER_STATUS.ARCHIVED]: []
};

class RadiologyWorkflowEngineService {
  constructor() {
    this.orders = new Map();
  }

  initDemoOrders() {
    // Pristine Clean Day-1 State
  }

  /**
   * 1. Create New Order (from CPOE)
   */
  createOrder(payload, actor = { id: 'SYS', name: 'Dr. System', role: 'DOCTOR' }) {
    const orderId = payload.id || `ORD-RAD-${Date.now()}`;
    const orderNumber = payload.orderNumber || `RO-${Date.now().toString().slice(-6)}`;
    const accessionNumber = payload.accessionNumber || `ACC-${Date.now().toString().slice(-8)}`;

    const newOrder = {
      id: orderId,
      orderNumber,
      accessionNumber,
      patientId: payload.patientId,
      patientMrn: payload.patientMrn,
      patientName: payload.patientName,
      encounterId: payload.encounterId,
      modality: payload.modality || 'CR',
      examinationCode: payload.examinationCode || 'RAD-GEN-01',
      examinationName: payload.examinationName || 'Pemeriksaan Radiologi Standar',
      priority: payload.priority || 'ROUTINE',
      orderingPhysicianId: payload.orderingPhysicianId || actor.id,
      orderingPhysicianName: payload.orderingPhysicianName || actor.name,
      clinicalIndication: payload.clinicalIndication || 'Indikasi klinis',
      status: RAD_ORDER_STATUS.ORDERED,
      scheduledAt: payload.scheduledAt || null,
      patientArrivedAt: null,
      procedureStartedAt: null,
      imageAcquiredAt: null,
      reportFinalizedAt: null,
      completedAt: null,
      billingStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.set(orderId, newOrder);

    // Audit Log
    radiologyAuditService.recordEvent({
      patientMrn: newOrder.patientMrn,
      eventType: 'ORDER_CREATED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: { orderNumber, modality: newOrder.modality, examination: newOrder.examinationName }
    });

    // Publish Event Bus
    eventBusService.publish(DOMAIN_EVENTS.RADIOLOGY_ORDER_CREATED, {
      orderId,
      orderNumber,
      accessionNumber,
      patientMrn: newOrder.patientMrn,
      modality: newOrder.modality
    });

    return newOrder;
  }

  /**
   * 2. Transition Order Status (FSM Validator)
   */
  transitionStatus(orderId, nextStatus, actor = { id: 'SYS', name: 'Radiology Staff', role: 'TECHNOLOGIST' }, extraData = {}) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order radiologi ${orderId} tidak ditemukan.`);
    }

    const currentStatus = order.status;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
      throw new Error(`Transisi status tidak valid: dari ${currentStatus} ke ${nextStatus}.`);
    }

    const now = new Date().toISOString();
    order.status = nextStatus;
    order.updatedAt = now;

    if (nextStatus === RAD_ORDER_STATUS.SCHEDULED) {
      order.scheduledAt = extraData.scheduledAt || now;
    } else if (nextStatus === RAD_ORDER_STATUS.PATIENT_ARRIVED) {
      order.patientArrivedAt = now;
    } else if (nextStatus === RAD_ORDER_STATUS.IN_PROGRESS) {
      order.procedureStartedAt = now;
    } else if (nextStatus === RAD_ORDER_STATUS.IMAGE_ACQUIRED) {
      order.imageAcquiredAt = now;
    } else if (nextStatus === RAD_ORDER_STATUS.REPORT_FINALIZED) {
      order.reportFinalizedAt = now;
    } else if (nextStatus === RAD_ORDER_STATUS.COMPLETED) {
      order.completedAt = now;
      order.billingStatus = 'BILLED';
    }

    // Audit
    radiologyAuditService.recordEvent({
      patientMrn: order.patientMrn,
      eventType: `STATUS_${nextStatus}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: { fromStatus: currentStatus, toStatus: nextStatus, ...extraData }
    });

    return order;
  }

  /**
   * 3. DICOM Modality Worklist (MWL) Query
   * Returns active scheduled/arrived procedure steps ready for modality acquisition
   */
  getModalityWorklist({ modality = null, date = null } = {}) {
    const activeStatuses = [
      RAD_ORDER_STATUS.ORDERED,
      RAD_ORDER_STATUS.SCHEDULED,
      RAD_ORDER_STATUS.PATIENT_ARRIVED,
      RAD_ORDER_STATUS.IN_PROGRESS
    ];

    let list = Array.from(this.orders.values()).filter(o => activeStatuses.includes(o.status));

    if (modality) {
      list = list.filter(o => o.modality === modality);
    }

    // Return standard DICOM MWL JSON Structure
    return list.map(o => ({
      patientName: o.patientName,
      patientId: o.patientMrn,
      accessionNumber: o.accessionNumber,
      orderNumber: o.orderNumber,
      modality: o.modality,
      scheduledProcedureStepDescription: o.examinationName,
      scheduledProcedureStepStartDate: o.scheduledAt ? o.scheduledAt.split('T')[0] : new Date().toISOString().split('T')[0],
      scheduledStationAeTitle: `${o.modality}_ROOM_01`,
      requestingPhysician: o.orderingPhysicianName,
      priority: o.priority,
      status: o.status
    }));
  }

  getOrderById(orderId) {
    return this.orders.get(orderId);
  }

  getAllOrders() {
    return Array.from(this.orders.values());
  }
}

export const radiologyWorkflowEngineService = new RadiologyWorkflowEngineService();
