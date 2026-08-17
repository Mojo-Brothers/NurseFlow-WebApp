/**
 * NurseFlow Enterprise HIS 2026 — Universal Orders REST API Gateway
 * Sprint 5: Universal Order FSM, Pharmacy E-Prescription, LIS & RIS/PACS
 */

import { universalOrderEngineService } from './universalOrderEngine.service.js';
import { pharmacyEngineService } from './pharmacyEngine.service.js';
import { medicationReviewEngineService } from './medicationReviewEngine.service.js';
import { laboratoryEngineService } from './laboratoryEngine.service.js';
import { radiologyEngineService } from './radiologyEngine.service.js';
import { orderCatalogEngineService } from './orderCatalogEngine.service.js';

export const ordersApiService = {
  // ─── 1. UNIVERSAL ORDER APIS ───
  getOrders: async (filters = {}) => {
    return universalOrderEngineService.getOrders(filters);
  },

  createOrder: async (payload) => {
    return universalOrderEngineService.createOrder(payload);
  },

  transitionOrderStatus: async (payload) => {
    return universalOrderEngineService.transitionOrderStatus(payload);
  },

  // ─── 2. PHARMACY APIS ───
  getMedicationOrders: async (orderId) => {
    return pharmacyEngineService.getMedicationOrders(orderId);
  },

  createPrescription: async (payload) => {
    return pharmacyEngineService.createPrescriptionOrder(payload);
  },

  reviewPrescription: async (payload) => {
    return medicationReviewEngineService.performReview(payload);
  },

  dispenseMedication: async (payload) => {
    return pharmacyEngineService.dispenseMedication(payload);
  },

  // ─── 3. LABORATORY APIS (LIS) ───
  getLabOrders: async (orderId) => {
    return laboratoryEngineService.getLabOrders(orderId);
  },

  createLabOrder: async (payload) => {
    return laboratoryEngineService.createLabOrder(payload);
  },

  updateSpecimenStatus: async (payload) => {
    return laboratoryEngineService.updateSpecimenStatus(payload);
  },

  releaseLabResult: async (payload) => {
    return laboratoryEngineService.releaseLabResult(payload);
  },

  // ─── 4. RADIOLOGY APIS (RIS/PACS) ───
  getRadOrders: async (orderId) => {
    return radiologyEngineService.getRadOrders(orderId);
  },

  createRadiologyOrder: async (payload) => {
    return radiologyEngineService.createRadiologyOrder(payload);
  },

  acquireImages: async (payload) => {
    return radiologyEngineService.acquireImages(payload);
  },

  releaseRadiologyReport: async (payload) => {
    return radiologyEngineService.releaseRadiologyReport(payload);
  },

  // ─── 5. CATALOG APIS ───
  searchCatalogItems: (category, query) => {
    return orderCatalogEngineService.searchItems(category, query);
  }
};
