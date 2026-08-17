/**
 * NurseFlow Enterprise HIS 2026 — Enterprise Master Data REST API Service (Revision 5)
 * Handles relational CRUD, soft-delete, restore, batch operations,
 * MRN Merger, Bed Availability Matrix, Queue Management, Event Sourcing,
 * Notifications, KPI Analytics, Business Rules, and Data Retention.
 */

import { collection, doc, getDocs, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { enterpriseAuditEngine } from './enterpriseAuditEngine.service.js';
import { mrnMergeEngine } from './mrnMergeEngine.service.js';
import { clinicalEventBusService } from './clinicalEventBus.service.js';
import { queueManagementService } from './queueManagement.service.js';
import { notificationEngineService } from './notificationEngine.service.js';
import { kpiCalculationService } from './kpiCalculation.service.js';
import { businessRuleEngineService } from './businessRuleEngine.service.js';
import { dataRetentionService } from './dataRetention.service.js';
import { universalAuditTrailService } from './universalAuditTrail.service.js';
import { ENTERPRISE_ENTITY_SCHEMAS } from '../data/enterpriseMasterSchemas.js';
import { ENTERPRISE_MASTER_SEED } from '../data/enterpriseMasterSeed.js';

const STORAGE_PREFIX = 'nurseflow_enterprise_master_';

// Helper to get local data
const getLocalData = (entityKey) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${entityKey}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[EnterpriseMasterApi] Failed to parse local cache for ${entityKey}:`, e);
  }
  return ENTERPRISE_MASTER_SEED[entityKey] || [];
};

// Helper to save local data
const saveLocalData = (entityKey, data) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${entityKey}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`[EnterpriseMasterApi] Failed to write local cache for ${entityKey}:`, e);
  }
};

export const enterpriseMasterApiService = {
  /**
   * GET /api/v1/master/:entity
   */
  getRecords: async (entityKey, options = {}) => {
    const config = ENTERPRISE_ENTITY_SCHEMAS[entityKey];
    if (!config) throw new Error(`Invalid Enterprise Entity Key: ${entityKey}`);

    const { includeDeleted = true, status = 'ALL', search = '' } = options;

    try {
      const colRef = collection(db, `master_${entityKey}`);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        saveLocalData(entityKey, items);
        return filterAndSort(items, { includeDeleted, status, search, config });
      }
    } catch (err) {
      // Offline / Local storage fallback
    }

    const localItems = getLocalData(entityKey);
    return filterAndSort(localItems, { includeDeleted, status, search, config });
  },

  // ─── Revision 5 Custom API Endpoints ───

  /**
   * GET /api/v1/master/events
   */
  getEvents: async (filters = {}) => {
    return clinicalEventBusService.getEventHistory(filters);
  },

  /**
   * POST /api/v1/master/events
   */
  publishEvent: async (eventPayload) => {
    return clinicalEventBusService.publishEvent(eventPayload);
  },

  /**
   * GET /api/v1/master/queue
   */
  getQueue: async () => {
    return queueManagementService.getQueueHistory();
  },

  /**
   * POST /api/v1/master/queue/call
   */
  callNextQueue: async (departmentName, counterName) => {
    return queueManagementService.callNextQueue(departmentName, counterName);
  },

  /**
   * POST /api/v1/master/notifications/send
   */
  sendNotification: async (notificationPayload) => {
    if (notificationPayload.channel === 'WHATSAPP_GATEWAY') {
      return notificationEngineService.sendWhatsAppNotification(notificationPayload);
    }
    return notificationEngineService.sendInAppNotification(notificationPayload);
  },

  /**
   * GET /api/v1/master/kpi
   */
  getKpiSnapshots: async () => {
    return kpiCalculationService.getKpiSnapshots();
  },

  /**
   * GET /api/v1/master/business-rules
   */
  getBusinessRules: async () => {
    return businessRuleEngineService.getRules();
  },

  /**
   * GET /api/v1/master/data-retention
   */
  getDataRetentionPolicies: async () => {
    return dataRetentionService.getPolicies();
  },

  /**
   * GET /api/v1/master/admissions
   */
  getAdmissions: async () => {
    return enterpriseMasterApiService.getRecords('admissions', { includeDeleted: false });
  },

  /**
   * GET /api/v1/master/transfers
   */
  getTransfers: async () => {
    return enterpriseMasterApiService.getRecords('transfers', { includeDeleted: false });
  },

  /**
   * GET /api/v1/master/discharges
   */
  getDischarges: async () => {
    return enterpriseMasterApiService.getRecords('discharges', { includeDeleted: false });
  },

  /**
   * GET /api/v1/master/bed-cleaning
   */
  getBedCleaningLogs: async () => {
    return enterpriseMasterApiService.getRecords('bed_cleaning_logs', { includeDeleted: false });
  },

  /**
   * GET /api/v1/master/medication-lasa
   */
  getMedicationLasa: async () => {
    return enterpriseMasterApiService.getRecords('medication_lasa', { includeDeleted: false });
  },

  /**
   * GET /api/v1/master/inventory-conversions
   */
  getInventoryConversions: async () => {
    return enterpriseMasterApiService.getRecords('inventory_unit_conversions', { includeDeleted: false });
  },

  /**
   * GET /api/v1/master/facility/beds/available-matrix
   */
  getAvailableBedsMatrix: async (filters = {}) => {
    const beds = getLocalData('beds').filter(b => !b.is_deleted);
    let result = beds;

    if (filters.wardId) {
      result = result.filter(b => b.ward_id === filters.wardId);
    }
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(b => b.bed_status === filters.status);
    }
    if (filters.hasOxygen !== undefined) {
      result = result.filter(b => b.has_oxygen === filters.hasOxygen);
    }
    if (filters.hasVentilator !== undefined) {
      result = result.filter(b => b.has_ventilator === filters.hasVentilator);
    }

    return {
      total: beds.length,
      available: beds.filter(b => b.bed_status === 'AVAILABLE').length,
      occupied: beds.filter(b => b.bed_status === 'OCCUPIED').length,
      cleaning: beds.filter(b => b.bed_status === 'CLEANING' || b.bed_status === 'BED_DISINFECTING').length,
      maintenance: beds.filter(b => b.bed_status === 'BED_MAINTENANCE_LOCK').length,
      data: result
    };
  },

  /**
   * POST /api/v1/master/patient/merge
   */
  mergePatientRecords: async ({ sourceMrn, targetMrn, reason, userEmail = 'admin@nurseflow.id' }) => {
    const patients = getLocalData('patients');
    const mergeResult = await mrnMergeEngine.executeMerge({
      sourceMrn,
      targetMrn,
      reason,
      actorEmail: userEmail,
      allPatients: patients
    });

    const updatedList = patients.map(p => {
      if (p.id === mergeResult.targetPatient.id) return mergeResult.targetPatient;
      if (p.id === mergeResult.sourcePatient.id) return mergeResult.sourcePatient;
      return p;
    });

    saveLocalData('patients', updatedList);

    await universalAuditTrailService.logEvent({
      eventType: 'MRN_MERGE',
      entityType: 'PATIENT',
      entityId: targetMrn,
      beforeState: { sourceMrn },
      afterState: { mergedTarget: targetMrn },
      actor: userEmail,
      reason
    });

    return mergeResult;
  },

  /**
   * POST /api/v1/master/:entity
   */
  createRecord: async (entityKey, payload, userEmail = 'admin@nurseflow.id') => {
    const config = ENTERPRISE_ENTITY_SCHEMAS[entityKey];
    if (!config) throw new Error(`Invalid Enterprise Entity Key: ${entityKey}`);

    const now = new Date().toISOString();
    const newId = payload.id || `${entityKey.toUpperCase().slice(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5)}`;

    const newRecord = {
      ...payload,
      id: newId,
      status: payload.status || 'ACTIVE',
      is_deleted: false,
      created_at: now,
      created_by: userEmail,
      updated_at: now,
      updated_by: userEmail
    };

    const currentList = getLocalData(entityKey);
    const updatedList = [newRecord, ...currentList];
    saveLocalData(entityKey, updatedList);

    try {
      await setDoc(doc(db, `master_${entityKey}`, newId), {
        ...newRecord,
        server_timestamp: serverTimestamp()
      });
    } catch (e) {
      // offline mode
    }

    await universalAuditTrailService.logEvent({
      eventType: 'CREATE',
      entityType: entityKey.toUpperCase(),
      entityId: newId,
      beforeState: null,
      afterState: newRecord,
      actor: userEmail,
      reason: `Penambahan data baru: ${newRecord[config.nameField] || newId}`
    });

    return { status: 201, message: 'Record created successfully', data: newRecord };
  },

  /**
   * PUT /api/v1/master/:entity/:id
   */
  updateRecord: async (entityKey, id, payload, userEmail = 'admin@nurseflow.id') => {
    const config = ENTERPRISE_ENTITY_SCHEMAS[entityKey];
    if (!config) throw new Error(`Invalid Enterprise Entity Key: ${entityKey}`);

    const now = new Date().toISOString();
    const currentList = getLocalData(entityKey);
    const index = currentList.findIndex(i => i.id === id);

    if (index === -1) throw new Error(`Record ${id} not found in ${config.title}`);

    const beforeSnapshot = { ...currentList[index] };
    const updatedRecord = {
      ...beforeSnapshot,
      ...payload,
      id,
      updated_at: now,
      updated_by: userEmail
    };

    currentList[index] = updatedRecord;
    saveLocalData(entityKey, currentList);

    try {
      await setDoc(doc(db, `master_${entityKey}`, id), {
        ...updatedRecord,
        server_timestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      // offline mode
    }

    await universalAuditTrailService.logEvent({
      eventType: 'UPDATE',
      entityType: entityKey.toUpperCase(),
      entityId: id,
      beforeState: beforeSnapshot,
      afterState: updatedRecord,
      actor: userEmail,
      reason: `Pembaruan data master: ${updatedRecord[config.nameField] || id}`
    });

    return { status: 200, message: 'Record updated successfully', data: updatedRecord };
  },

  /**
   * DELETE /api/v1/master/:entity/:id (Soft-Delete Only)
   */
  softDeleteRecord: async (entityKey, id, userEmail = 'admin@nurseflow.id') => {
    const config = ENTERPRISE_ENTITY_SCHEMAS[entityKey];
    if (!config) throw new Error(`Invalid Enterprise Entity Key: ${entityKey}`);

    const now = new Date().toISOString();
    const currentList = getLocalData(entityKey);
    const index = currentList.findIndex(i => i.id === id);

    if (index === -1) throw new Error(`Record ${id} not found.`);

    const beforeSnapshot = { ...currentList[index] };
    const deletedRecord = {
      ...beforeSnapshot,
      is_deleted: true,
      deleted_at: now,
      deleted_by: userEmail,
      updated_at: now,
      updated_by: userEmail
    };

    currentList[index] = deletedRecord;
    saveLocalData(entityKey, currentList);

    try {
      await updateDoc(doc(db, `master_${entityKey}`, id), {
        is_deleted: true,
        deleted_at: now,
        deleted_by: userEmail
      });
    } catch (e) {
      // offline mode
    }

    await universalAuditTrailService.logEvent({
      eventType: 'SOFT_DELETE',
      entityType: entityKey.toUpperCase(),
      entityId: id,
      beforeState: beforeSnapshot,
      afterState: deletedRecord,
      actor: userEmail,
      reason: `Hapus lunak (Soft Delete) data: ${deletedRecord[config.nameField] || id}`
    });

    return { status: 200, message: 'Record soft-deleted successfully', data: deletedRecord };
  },

  /**
   * POST /api/v1/master/:entity/:id/restore
   */
  restoreRecord: async (entityKey, id, userEmail = 'admin@nurseflow.id') => {
    const config = ENTERPRISE_ENTITY_SCHEMAS[entityKey];
    if (!config) throw new Error(`Invalid Enterprise Entity Key: ${entityKey}`);

    const now = new Date().toISOString();
    const currentList = getLocalData(entityKey);
    const index = currentList.findIndex(i => i.id === id);

    if (index === -1) throw new Error(`Record ${id} not found.`);

    const beforeSnapshot = { ...currentList[index] };
    const restoredRecord = {
      ...beforeSnapshot,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: now,
      updated_by: userEmail
    };

    currentList[index] = restoredRecord;
    saveLocalData(entityKey, currentList);

    try {
      await updateDoc(doc(db, `master_${entityKey}`, id), {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        updated_at: now
      });
    } catch (e) {
      // offline mode
    }

    await universalAuditTrailService.logEvent({
      eventType: 'RESTORE',
      entityType: entityKey.toUpperCase(),
      entityId: id,
      beforeState: beforeSnapshot,
      afterState: restoredRecord,
      actor: userEmail,
      reason: `Pemulihan (Restore) data: ${restoredRecord[config.nameField] || id}`
    });

    return { status: 200, message: 'Record restored successfully', data: restoredRecord };
  }
};

function filterAndSort(items, { includeDeleted, status, search, config }) {
  let res = items;

  if (!includeDeleted) {
    res = res.filter(i => !i.is_deleted);
  } else if (status === 'TRASH') {
    res = res.filter(i => i.is_deleted);
  }

  if (status && status !== 'ALL' && status !== 'TRASH') {
    res = res.filter(i => i.status === status);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    res = res.filter(item => {
      return Object.values(item).some(val => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }

  return res;
}
