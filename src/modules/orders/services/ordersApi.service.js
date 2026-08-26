/**
 * NurseFlow Enterprise HIS 2026 — Universal Orders REST API Gateway
 * Standards: Native PostgreSQL 16 Durability, Idempotency Guard, RFC 7807, X-Correlation-ID
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';
import { orderCatalogEngineService } from './orderCatalogEngine.service.js';

export const ordersApiService = {
  // ─── 1. UNIVERSAL ORDER APIS (POSTGRESQL 16 SSOT) ───
  getOrders: async (filters = {}) => {
    try {
      const res = await apiClient.cpoe.listOrders(filters);
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[OrdersApi] Failed to fetch CPOE orders from PostgreSQL:', err);
      return [];
    }
  },

  getOrderById: async (orderId) => {
    const res = await apiClient.cpoe.getOrderById(orderId);
    if (!res.ok) throw new Error(res.error || 'Gagal mengambil detail order CPOE');
    return res.data;
  },

  createOrder: async (payload) => {
    const res = await apiClient.cpoe.createOrder(payload);
    if (!res.ok) throw new Error(res.error || 'Gagal membuat order CPOE di PostgreSQL');
    return res.data;
  },

  cancelOrder: async (orderId, reason) => {
    const res = await apiClient.cpoe.cancelOrder(orderId, reason);
    if (!res.ok) throw new Error(res.error || 'Gagal membatalkan order CPOE');
    return res.data;
  },

  transitionOrderStatus: async ({ orderId, nextStatus, reason, version }) => {
    if (nextStatus === 'CANCELLED') {
      const res = await apiClient.cpoe.cancelOrder(orderId, reason);
      if (!res.ok) throw new Error(res.error || 'Gagal membatalkan order CPOE');
      return res.data;
    }
    const res = await requestApi(`/api/v1/orders/cpoe/${orderId}/status`, {
      method: 'PATCH',
      body: { status: nextStatus, reason, expectedVersion: version }
    });
    if (!res.ok) throw new Error(res.error || 'Gagal memperbarui status order CPOE');
    return res.data;
  },

  // ─── 2. PHARMACY APIS (CLOSED-LOOP PRESCRIPTIONS) ───
  getMedicationOrders: async (orderId) => {
    try {
      const res = await apiClient.medications.getOrders({ orderId });
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[OrdersApi] Failed to fetch medication orders:', err);
      return [];
    }
  },

  createPrescription: async (payload) => {
    const formattedPayload = {
      patientId: payload.patientId,
      patientName: payload.patientName,
      mrn: payload.mrn,
      episodeId: payload.episodeId,
      encounterId: payload.encounterId,
      orderCategory: 'PHARMACY',
      priority: payload.priority || 'ROUTINE',
      clinicalIndication: payload.clinicalIndication || 'Instruksi E-Resep Farmasi',
      items: (payload.items || []).map(item => ({
        itemType: 'MEDICATION',
        catalogCode: item.code || item.catalogCode || 'MED-01',
        itemName: item.name || item.itemName || 'Obat',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        dosageInstruction: `${item.dosage || ''} ${item.frequency || ''}`.trim() || 'Sesuai resep',
        route: item.route || 'ORAL'
      }))
    };
    return ordersApiService.createOrder(formattedPayload);
  },

  reviewPrescription: async (payload) => {
    const res = await requestApi('/api/v1/medications/prescriptions/review', {
      method: 'POST',
      body: payload
    });
    if (!res.ok) throw new Error(res.error || 'Gagal menyimpan telaah farmasi');
    return res.data;
  },

  dispenseMedication: async (payload) => {
    const res = await apiClient.medications.dispense(payload);
    if (!res.ok) throw new Error(res.error || 'Gagal melakukan dispensing obat');
    return res.data;
  },

  // ─── 3. LABORATORY APIS (LIS INTEGRATION) ───
  getLabOrders: async (orderId) => {
    try {
      const res = await apiClient.laboratory.getOrders({ orderId });
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[OrdersApi] Failed to fetch lab orders:', err);
      return [];
    }
  },

  createLabOrder: async (payload) => {
    const formattedPayload = {
      patientId: payload.patientId,
      patientName: payload.patientName,
      mrn: payload.mrn,
      episodeId: payload.episodeId,
      encounterId: payload.encounterId,
      orderCategory: 'LABORATORY',
      priority: payload.priority || 'ROUTINE',
      clinicalIndication: payload.clinicalIndication || 'Pemeriksaan Diagnostik Laboratorium',
      items: (payload.items || []).map(item => ({
        itemType: 'LABORATORY',
        catalogCode: item.loinc || item.code || item.catalogCode || 'LAB-01',
        itemName: item.name || item.itemName || 'Pemeriksaan Lab',
        quantity: 1,
        unitPrice: item.unitPrice || 0,
        dosageInstruction: item.specimen || 'Serum Darah'
      }))
    };
    return ordersApiService.createOrder(formattedPayload);
  },

  updateSpecimenStatus: async (payload) => {
    const res = await requestApi(`/api/v1/laboratory/specimens/${payload.specimenId}/collect`, {
      method: 'POST',
      body: payload
    });
    if (!res.ok) throw new Error(res.error || 'Gagal memperbarui status spesimen laboratorium');
    return res.data;
  },

  releaseLabResult: async (payload) => {
    const res = await apiClient.laboratory.releaseResult(payload.orderId || payload.specimenId, payload);
    if (!res.ok) throw new Error(res.error || 'Gagal merilis hasil laboratorium');
    return res.data;
  },

  // ─── 4. RADIOLOGY APIS (RIS / PACS INTEGRATION) ───
  getRadOrders: async (orderId) => {
    try {
      const res = await apiClient.radiology.getOrders({ orderId });
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[OrdersApi] Failed to fetch radiology orders:', err);
      return [];
    }
  },

  createRadiologyOrder: async (payload) => {
    const formattedPayload = {
      patientId: payload.patientId,
      patientName: payload.patientName,
      mrn: payload.mrn,
      episodeId: payload.episodeId,
      encounterId: payload.encounterId,
      orderCategory: 'RADIOLOGY',
      priority: payload.priority || 'ROUTINE',
      clinicalIndication: payload.clinicalIndication || 'Pemeriksaan Pencitraan Radiologi & PACS',
      items: (payload.items || []).map(item => ({
        itemType: 'RADIOLOGY',
        catalogCode: item.modality || item.code || item.catalogCode || 'RAD-01',
        itemName: item.name || item.itemName || 'Foto Radiologi',
        quantity: 1,
        unitPrice: item.unitPrice || 0,
        dosageInstruction: item.modality || 'X-RAY'
      }))
    };
    return ordersApiService.createOrder(formattedPayload);
  },

  acquireImages: async (payload) => {
    const res = await requestApi('/api/v1/radiology/studies/acquire', {
      method: 'POST',
      body: payload
    });
    if (!res.ok) throw new Error(res.error || 'Gagal mencatat akuisisi citra radiologi');
    return res.data;
  },

  releaseRadiologyReport: async (payload) => {
    const res = await apiClient.radiology.releaseReport(payload.studyId || payload.orderId, payload);
    if (!res.ok) throw new Error(res.error || 'Gagal merilis expertise laporan radiologi');
    return res.data;
  },

  // ─── 5. CATALOG SEARCH ───
  searchCatalogItems: (category, query) => {
    return orderCatalogEngineService.searchItems(category, query);
  }
};
