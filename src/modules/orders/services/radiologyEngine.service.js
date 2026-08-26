/**
 * NurseFlow Enterprise HIS 2026 — Radiology Information System (RIS/PACS) Engine (PostgreSQL 16 Authoritative)
 * Standards: DICOM 3.0, Permenkes 24/2022, SATUSEHAT DiagnosticReport, RFC 7807
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';

export const radiologyEngineService = {
  getRadOrders: async (orderId) => {
    try {
      if (orderId) {
        const res = await apiClient.radiology.getStudies(orderId);
        if (res.ok && res.data) {
          return Array.isArray(res.data) ? res.data : (res.data.data || []);
        }
      }
      const res = await apiClient.radiology.getOrders();
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[RadiologyEngine] Failed to fetch radiology orders from PostgreSQL:', err);
      return [];
    }
  },

  createRadiologyOrder: async (payload) => {
    const res = await apiClient.cpoe.createOrder({
      patientId: payload.patientId,
      patientName: payload.patientName,
      mrn: payload.mrn,
      episodeId: payload.episodeId,
      encounterId: payload.encounterId,
      orderCategory: 'RADIOLOGY',
      priority: payload.priority || 'ROUTINE',
      clinicalIndication: payload.clinicalIndication || 'Pemeriksaan Radiologi & DICOM Studies',
      items: (payload.items || []).map(item => ({
        itemType: 'RADIOLOGY',
        catalogCode: item.modality || item.code || 'RAD-01',
        itemName: item.name || 'Foto Radiologi',
        quantity: 1,
        unitPrice: item.unitPrice || 0,
        dosageInstruction: item.modality || 'X-RAY'
      }))
    });
    if (!res.ok) throw new Error(res.error || 'Gagal membuat order radiologi di PostgreSQL');
    return res.data;
  },

  acquireImages: async ({ studyId, modality, imageCount, sopInstanceUid }) => {
    const res = await requestApi('/api/v1/radiology/studies/acquire', {
      method: 'POST',
      body: { studyId, modality, imageCount, sopInstanceUid }
    });
    if (!res.ok) throw new Error(res.error || 'Gagal mencatat akuisisi citra radiologi');
    return res.data;
  },

  releaseRadiologyReport: async ({ studyId, orderId, radiologistReport, radiologistName, findingsSummary, criticalFinding }) => {
    const payload = {
      radiologistReport,
      radiologistName: radiologistName || 'dr. Sp.Rad',
      findingsSummary: findingsSummary || radiologistReport,
      isCriticalFinding: Boolean(criticalFinding)
    };

    const res = await apiClient.radiology.releaseReport(studyId || orderId, payload);
    if (!res.ok) throw new Error(res.error || 'Gagal merilis expertise laporan radiologi di PostgreSQL');
    return res.data;
  }
};
