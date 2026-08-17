import { create } from 'zustand';
import { ordersApiService } from '../services/ordersApi.service.js';

export const useOrdersStore = create((set, get) => ({
  orders: [],
  medicationOrders: [],
  labOrders: [],
  radOrders: [],
  selectedOrder: null,
  loading: false,
  error: null,

  fetchOrdersData: async () => {
    set({ loading: true, error: null });
    try {
      const [orders, medicationOrders, labOrders, radOrders] = await Promise.all([
        ordersApiService.getOrders(),
        ordersApiService.getMedicationOrders(),
        ordersApiService.getLabOrders(),
        ordersApiService.getRadOrders()
      ]);

      set({
        orders,
        selectedOrder: orders[0] || null,
        medicationOrders,
        labOrders,
        radOrders,
        loading: false
      });
    } catch (err) {
      console.error('[OrdersStore] Error loading orders:', err);
      set({ error: err.message, loading: false });
    }
  },

  createPrescription: async (payload) => {
    const res = await ordersApiService.createPrescription(payload);
    await get().fetchOrdersData();
    return res;
  },

  reviewPrescription: async (payload) => {
    const res = await ordersApiService.reviewPrescription(payload);
    await get().fetchOrdersData();
    return res;
  },

  dispenseMedication: async (payload) => {
    const res = await ordersApiService.dispenseMedication(payload);
    await get().fetchOrdersData();
    return res;
  },

  createLabOrder: async (payload) => {
    const res = await ordersApiService.createLabOrder(payload);
    await get().fetchOrdersData();
    return res;
  },

  updateSpecimenStatus: async (payload) => {
    const res = await ordersApiService.updateSpecimenStatus(payload);
    await get().fetchOrdersData();
    return res;
  },

  releaseLabResult: async (payload) => {
    const res = await ordersApiService.releaseLabResult(payload);
    await get().fetchOrdersData();
    return res;
  },

  createRadiologyOrder: async (payload) => {
    const res = await ordersApiService.createRadiologyOrder(payload);
    await get().fetchOrdersData();
    return res;
  },

  acquireImages: async (payload) => {
    const res = await ordersApiService.acquireImages(payload);
    await get().fetchOrdersData();
    return res;
  },

  releaseRadiologyReport: async (payload) => {
    const res = await ordersApiService.releaseRadiologyReport(payload);
    await get().fetchOrdersData();
    return res;
  },

  transitionOrderStatus: async (payload) => {
    const res = await ordersApiService.transitionOrderStatus(payload);
    await get().fetchOrdersData();
    return res;
  }
}));
