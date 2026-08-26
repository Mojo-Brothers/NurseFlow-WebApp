/**
 * NurseFlow Enterprise HIS 2026 — Pharmacy E-Prescription & Dispensing Engine (PostgreSQL 16 Authoritative)
 * Standards: JCI MMU & WHO Medication Safety, Closed-Loop eMAR, RFC 7807
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';

export const pharmacyEngineService = {
  getMedicationOrders: async (orderId) => {
    try {
      const res = await apiClient.medications.getOrders({ orderId });
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[PharmacyEngine] Failed to fetch medication orders from PostgreSQL:', err);
      return [];
    }
  },

  createPrescriptionOrder: async (payload) => {
    const formattedPayload = {
      patientId: payload.patientId,
      patientName: payload.patientName,
      mrn: payload.mrn,
      episodeId: payload.episodeId,
      encounterId: payload.encounterId,
      orderCategory: 'PHARMACY',
      priority: payload.isCito ? 'CITO' : (payload.priority || 'ROUTINE'),
      clinicalIndication: payload.clinicalIndication || 'Instruksi Terapi Farmasi E-Resep',
      items: (payload.items || []).map(item => ({
        itemType: 'MEDICATION',
        catalogCode: item.medicationCode || item.code || 'MED-01',
        itemName: item.medicationName || item.name || 'Obat',
        quantity: Number(item.quantity) || 1,
        unitPrice: item.unitPrice || 0,
        dosageInstruction: `${item.dosage || ''} ${item.frequency || ''}`.trim() || 'Sesuai resep',
        route: item.route || 'ORAL'
      }))
    };

    const res = await apiClient.cpoe.createOrder(formattedPayload);
    if (!res.ok) throw new Error(res.error || 'Gagal menerbitkan E-Resep di PostgreSQL');
    return res.data;
  },

  dispenseMedication: async ({ orderId, prescriptionId, batchNumber, quantity, pharmacistName, notes }) => {
    const payload = {
      orderId: orderId || prescriptionId,
      batchNumber: batchNumber || 'BATCH-AUTO',
      quantity: Number(quantity) || 1,
      pharmacistName: pharmacistName || 'Apoteker',
      notes: notes || 'Dispensing obat farmasi'
    };

    const res = await apiClient.medications.dispense(payload);
    if (!res.ok) throw new Error(res.error || 'Gagal memproses dispensing obat di PostgreSQL');
    return res.data;
  }
};
