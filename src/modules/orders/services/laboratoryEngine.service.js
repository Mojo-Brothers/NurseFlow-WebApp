/**
 * NurseFlow Enterprise HIS 2026 — Laboratory Information System (LIS) Engine (PostgreSQL 16 Authoritative)
 * Standards: LOINC, Permenkes 24/2022, JCI GLD (Laboratory Standards), RFC 7807
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';

export const laboratoryEngineService = {
  getLabOrders: async (orderId) => {
    try {
      if (orderId) {
        const res = await apiClient.laboratory.getSpecimens(orderId);
        if (res.ok && res.data) {
          return Array.isArray(res.data) ? res.data : (res.data.data || []);
        }
      }
      const res = await apiClient.laboratory.getOrders();
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[LaboratoryEngine] Failed to fetch lab orders from PostgreSQL:', err);
      return [];
    }
  },

  createLabOrder: async (payload) => {
    const res = await apiClient.cpoe.createOrder({
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
        catalogCode: item.loinc || item.code || 'LAB-01',
        itemName: item.name || 'Pemeriksaan Lab',
        quantity: 1,
        unitPrice: item.unitPrice || 0,
        dosageInstruction: item.specimen || 'Serum Darah'
      }))
    });
    if (!res.ok) throw new Error(res.error || 'Gagal membuat order lab di PostgreSQL');
    return res.data;
  },

  updateSpecimenStatus: async ({ specimenId, status, collectedBy, receivedBy }) => {
    const endpoint = status === 'COLLECTED'
      ? `/api/v1/laboratory/specimens/${specimenId}/collect`
      : `/api/v1/laboratory/specimens/${specimenId}/accession`;
    
    const res = await requestApi(endpoint, {
      method: 'POST',
      body: { collectedBy, receivedBy }
    });
    if (!res.ok) throw new Error(res.error || 'Gagal memperbarui status spesimen lab');
    return res.data;
  },

  releaseLabResult: async ({ orderId, resultId, testName, resultValue, isCriticalPanic, validatedBy }) => {
    const payload = {
      testName,
      resultValue,
      isCriticalPanic: Boolean(isCriticalPanic),
      validatedBy: validatedBy || 'Petugas Laboratorium'
    };

    const res = await apiClient.laboratory.releaseResult(resultId || orderId, payload);
    if (!res.ok) throw new Error(res.error || 'Gagal merilis hasil tes laboratorium di PostgreSQL');
    return res.data;
  }
};
