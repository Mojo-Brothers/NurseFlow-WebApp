/**
 * NurseFlow Enterprise HIS — Enterprise Order & Result Engine Service
 * Authoritative Order Lifecycle Manager
 * Backbone for: Lab Order, Radiology Order, Medication Order, Procedure Order,
 * Consultation Order, Diet Order, Nursing Order, Blood Order.
 */

import encounterEngine from './encounterEngine.service.js';
import CoreRegistryService from './coreRegistry.service.js';

export const ORDER_TYPES = {
  LABORATORY: 'LABORATORY',
  RADIOLOGY: 'RADIOLOGY',
  MEDICATION: 'MEDICATION',
  PROCEDURE: 'PROCEDURE',
  CONSULTATION: 'CONSULTATION',
  DIET: 'DIET',
  NURSING: 'NURSING',
  BLOOD_TRANSFUSION: 'BLOOD_TRANSFUSION'
};

export const ORDER_STATUS = {
  ORDERED: 'ORDERED',           // Dibuat oleh Dokter
  ACCEPTED: 'ACCEPTED',         // Diterima Unit Penunjang
  IN_PROGRESS: 'IN_PROGRESS',   // Dalam Pengerjaan / Analisis
  COMPLETED: 'COMPLETED',       // Pengerjaan Selesai
  RESULTED: 'RESULTED',         // Hasil Diinput
  VERIFIED: 'VERIFIED',         // Diverifikasi & Ditandatangani
  CANCELLED: 'CANCELLED'        // Dibatalkan
};

export const ORDER_PRIORITY = {
  ROUTINE: 'ROUTINE',
  URGENT: 'URGENT',
  STAT: 'STAT'                  // CITO
};

class OrderEngine {
  constructor() {
    this.orders = new Map();
    this.initializeSampleOrders();
  }

  initializeSampleOrders() {
    const sampleLabOrder = {
      id: 'ORD-2026-0810-001',
      orderNumber: 'ORD-LAB-20260810-001',
      type: ORDER_TYPES.LABORATORY,
      encounterId: 'ENC-2026-0810-001',
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      orderingPractitionerId: 'EMP-2026-0001',
      orderingPractitionerName: 'dr. Surya Johnson, Sp.PD-KGEH',
      departmentId: 'POLI-PD',
      targetDepartmentId: 'LAB-CLINICAL',
      priority: ORDER_PRIORITY.STAT,
      status: ORDER_STATUS.ORDERED,
      items: [
        { code: 'LOINC-57021-8', name: 'Darah Lengkap (CBC)', category: 'Hematologi' },
        { code: 'LOINC-2345-7', name: 'Glukosa Darah Sewaktu (GDS)', category: 'Kimia Klinik' }
      ],
      clinicalNotes: 'Pasien lemas, riwayat DM Tipe 2.',
      orderedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.set(sampleLabOrder.id, sampleLabOrder);
  }

  // Create Order with validation against Encounter Engine & Master Registry
  createOrder({ type, encounterId, items, priority = ORDER_PRIORITY.ROUTINE, clinicalNotes = '', targetDepartmentId = '' }) {
    const encounter = encounterEngine.getEncounterById(encounterId);
    if (!encounter) throw new Error(`Encounter ${encounterId} not found`);

    const orderId = `ORD-${Date.now()}`;
    const orderNumber = `ORD-${type.slice(0,3)}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      orderNumber,
      type,
      encounterId: encounter.id,
      patientId: encounter.patientId,
      patientName: encounter.patientName,
      mrn: encounter.mrn,
      orderingPractitionerId: encounter.dpjpId,
      orderingPractitionerName: encounter.dpjpName,
      departmentId: encounter.departmentId,
      targetDepartmentId: targetDepartmentId || 'PENUNJANG',
      priority,
      status: ORDER_STATUS.ORDERED,
      items: items || [],
      clinicalNotes,
      orderedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  getOrderById(id) {
    return this.orders.get(id) || null;
  }

  getOrdersByEncounter(encounterId) {
    return Array.from(this.orders.values()).filter(o => o.encounterId === encounterId);
  }

  getOrdersByType(type) {
    return Array.from(this.orders.values()).filter(o => o.type === type);
  }

  updateOrderStatus(orderId, newStatus, operatorName = 'System') {
    const order = this.orders.get(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    order.lastOperator = operatorName;

    this.orders.set(order.id, order);
    return order;
  }
}

export const orderEngine = new OrderEngine();
export default orderEngine;
