/**
 * NurseFlow Enterprise HIS 2026 — Universal Clinical Order Engine (PostgreSQL 16 Authoritative)
 * Standards: JCI 7th Edition, Permenkes 24/2022, SATUSEHAT ServiceRequest, ACID Transactions
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';

export const universalOrderEngineService = {
  getOrders: async (filters = {}) => {
    try {
      const res = await apiClient.cpoe.listOrders(filters);
      if (res.ok && res.data) {
        return Array.isArray(res.data) ? res.data : (res.data.data || []);
      }
      return [];
    } catch (err) {
      console.error('[UniversalOrderEngine] Failed to fetch CPOE orders from PostgreSQL:', err);
      return [];
    }
  },

  createOrder: async (payload) => {
    const res = await apiClient.cpoe.createOrder(payload);
    if (!res.ok) throw new Error(res.error || 'Gagal menerbitkan order CPOE di PostgreSQL');
    return res.data;
  },

  getOrderById: async (orderId) => {
    const res = await apiClient.cpoe.getOrderById(orderId);
    if (!res.ok) throw new Error(res.error || 'Gagal mengambil detail order CPOE');
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
  }
};
