/**
 * NurseFlow Enterprise HIS — Master Data REST API & Persistence Service
 * Supports /api/v1/master/:entity CRUD contracts, Firestore sync with offline LocalStorage fallback,
 * soft-delete semantics, and JCI-grade immutable audit trail diff logging.
 */

import { 
  collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';
import { MASTER_DATA_ENTITIES } from '../data/masterDataSchemas.js';
import { INITIAL_MASTER_DATA } from '../data/masterDataSeed.js';

const STORAGE_PREFIX = 'nurseflow_master_v2_';

// Helper to get local cache
const getLocalData = (entityKey) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${entityKey}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[MasterDataApi] Failed to parse local cache for ${entityKey}:`, e);
  }
  return INITIAL_MASTER_DATA[entityKey] || [];
};

// Helper to save local cache
const saveLocalData = (entityKey, data) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${entityKey}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`[MasterDataApi] Failed to write local cache for ${entityKey}:`, e);
  }
};

export const masterDataApiService = {
  /**
   * GET /api/v1/master/:entity
   * Fetch all records with optional query parameters (includeDeleted, search, status)
   */
  getRecords: async (entityKey, options = {}) => {
    const entityConfig = MASTER_DATA_ENTITIES[entityKey];
    if (!entityConfig) throw new Error(`Invalid Master Data Entity: ${entityKey}`);

    const { includeDeleted = false, status = 'ALL', search = '' } = options;

    try {
      // 1. Try fetching from Firestore
      const colRef = collection(db, entityConfig.table);
      const snapshot = await getDocs(colRef);

      if (!snapshot.empty) {
        let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        saveLocalData(entityKey, items);
        
        return filterAndSortRecords(items, { includeDeleted, status, search, entityConfig });
      }
    } catch (err) {
      console.warn(`[MasterDataApi] Firestore read failed, falling back to local persistence:`, err);
    }

    // 2. Fallback to LocalStorage / Initial Seed
    const localItems = getLocalData(entityKey);
    return filterAndSortRecords(localItems, { includeDeleted, status, search, entityConfig });
  },

  /**
   * POST /api/v1/master/:entity
   * Create a new record with audit logging
   */
  createRecord: async (entityKey, payload, userEmail = 'admin@nurseflow.id') => {
    const entityConfig = MASTER_DATA_ENTITIES[entityKey];
    if (!entityConfig) throw new Error(`Invalid Master Data Entity: ${entityKey}`);

    const now = new Date().toISOString();
    const newId = payload.id || `${entityConfig.codePrefix}${Date.now().toString(36).toUpperCase()}`;
    
    const record = {
      ...payload,
      id: newId,
      status: payload.status || 'ACTIVE',
      is_deleted: false,
      created_at: now,
      created_by: userEmail,
      updated_at: now,
      updated_by: userEmail
    };

    // Update Local Storage
    const localItems = getLocalData(entityKey);
    const updatedItems = [record, ...localItems];
    saveLocalData(entityKey, updatedItems);

    // Try Firestore Sync
    try {
      await setDoc(doc(db, entityConfig.table, newId), {
        ...record,
        server_timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn(`[MasterDataApi] Firestore write failed for ${entityKey}:`, e);
    }

    // Audit Trail Logging
    await createAuditLog({
      userEmail,
      action: 'CREATE',
      resourceType: entityConfig.table,
      resourceId: newId,
      delta: { before: null, after: record },
      reason: `Penambahan master data baru: ${record[entityConfig.nameField] || newId}`,
      source: 'WEB_APP_MASTER_DATA'
    });

    return { status: 201, message: 'Record created successfully', data: record };
  },

  /**
   * PUT /api/v1/master/:entity/:id
   * Update an existing record with delta diff calculation
   */
  updateRecord: async (entityKey, id, payload, userEmail = 'admin@nurseflow.id') => {
    const entityConfig = MASTER_DATA_ENTITIES[entityKey];
    if (!entityConfig) throw new Error(`Invalid Master Data Entity: ${entityKey}`);

    const now = new Date().toISOString();
    const localItems = getLocalData(entityKey);
    const existingIndex = localItems.findIndex(i => i.id === id);

    if (existingIndex === -1) {
      throw new Error(`Record with ID ${id} not found in ${entityConfig.title}`);
    }

    const beforeSnapshot = { ...localItems[existingIndex] };
    const updatedRecord = {
      ...beforeSnapshot,
      ...payload,
      id, // Preserve ID
      updated_at: now,
      updated_by: userEmail
    };

    localItems[existingIndex] = updatedRecord;
    saveLocalData(entityKey, localItems);

    // Try Firestore Sync
    try {
      await setDoc(doc(db, entityConfig.table, id), {
        ...updatedRecord,
        server_timestamp: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn(`[MasterDataApi] Firestore update failed for ${entityKey}:`, e);
    }

    // Audit Trail Logging with delta diff
    await createAuditLog({
      userEmail,
      action: 'UPDATE',
      resourceType: entityConfig.table,
      resourceId: id,
      delta: { before: beforeSnapshot, after: updatedRecord },
      reason: `Pembaruan data master: ${updatedRecord[entityConfig.nameField] || id}`,
      source: 'WEB_APP_MASTER_DATA'
    });

    return { status: 200, message: 'Record updated successfully', data: updatedRecord };
  },

  /**
   * DELETE /api/v1/master/:entity/:id
   * Soft-delete only: marks is_deleted = true, retains data for compliance
   */
  softDeleteRecord: async (entityKey, id, userEmail = 'admin@nurseflow.id') => {
    const entityConfig = MASTER_DATA_ENTITIES[entityKey];
    if (!entityConfig) throw new Error(`Invalid Master Data Entity: ${entityKey}`);

    const now = new Date().toISOString();
    const localItems = getLocalData(entityKey);
    const existingIndex = localItems.findIndex(i => i.id === id);

    if (existingIndex === -1) throw new Error(`Record ${id} not found.`);

    const beforeSnapshot = { ...localItems[existingIndex] };
    const deletedRecord = {
      ...beforeSnapshot,
      is_deleted: true,
      deleted_at: now,
      deleted_by: userEmail,
      updated_at: now,
      updated_by: userEmail
    };

    localItems[existingIndex] = deletedRecord;
    saveLocalData(entityKey, localItems);

    try {
      await updateDoc(doc(db, entityConfig.table, id), {
        is_deleted: true,
        deleted_at: now,
        deleted_by: userEmail
      });
    } catch (e) {
      console.warn(`[MasterDataApi] Firestore soft delete failed:`, e);
    }

    await createAuditLog({
      userEmail,
      action: 'SOFT_DELETE',
      resourceType: entityConfig.table,
      resourceId: id,
      delta: { before: beforeSnapshot, after: deletedRecord },
      reason: `Hapus lunak (Soft Delete) master data: ${deletedRecord[entityConfig.nameField] || id}`,
      source: 'WEB_APP_MASTER_DATA'
    });

    return { status: 200, message: 'Record soft deleted successfully', data: deletedRecord };
  },

  /**
   * POST /api/v1/master/:entity/:id/restore
   * Restore a soft-deleted record back to active pool
   */
  restoreRecord: async (entityKey, id, userEmail = 'admin@nurseflow.id') => {
    const entityConfig = MASTER_DATA_ENTITIES[entityKey];
    if (!entityConfig) throw new Error(`Invalid Master Data Entity: ${entityKey}`);

    const now = new Date().toISOString();
    const localItems = getLocalData(entityKey);
    const existingIndex = localItems.findIndex(i => i.id === id);

    if (existingIndex === -1) throw new Error(`Record ${id} not found.`);

    const beforeSnapshot = { ...localItems[existingIndex] };
    const restoredRecord = {
      ...beforeSnapshot,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: now,
      updated_by: userEmail
    };

    localItems[existingIndex] = restoredRecord;
    saveLocalData(entityKey, localItems);

    try {
      await updateDoc(doc(db, entityConfig.table, id), {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        updated_at: now
      });
    } catch (e) {
      console.warn(`[MasterDataApi] Firestore restore failed:`, e);
    }

    await createAuditLog({
      userEmail,
      action: 'RESTORE',
      resourceType: entityConfig.table,
      resourceId: id,
      delta: { before: beforeSnapshot, after: restoredRecord },
      reason: `Pemulihan (Restore) master data: ${restoredRecord[entityConfig.nameField] || id}`,
      source: 'WEB_APP_MASTER_DATA'
    });

    return { status: 200, message: 'Record restored successfully', data: restoredRecord };
  },

  /**
   * POST /api/v1/master/:entity/batch
   * Batch insert or update with verification
   */
  batchUpsertRecords: async (entityKey, records, userEmail = 'admin@nurseflow.id') => {
    const entityConfig = MASTER_DATA_ENTITIES[entityKey];
    if (!entityConfig) throw new Error(`Invalid Master Data Entity: ${entityKey}`);

    const now = new Date().toISOString();
    const currentLocal = getLocalData(entityKey);
    const map = new Map(currentLocal.map(item => [item.id, item]));

    records.forEach(r => {
      const id = r.id || `${entityConfig.codePrefix}${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5)}`;
      const existing = map.get(id);
      map.set(id, {
        ...(existing || {}),
        ...r,
        id,
        is_deleted: false,
        created_at: existing?.created_at || now,
        created_by: existing?.created_by || userEmail,
        updated_at: now,
        updated_by: userEmail
      });
    });

    const updatedList = Array.from(map.values());
    saveLocalData(entityKey, updatedList);

    await createAuditLog({
      userEmail,
      action: 'BATCH_IMPORT',
      resourceType: entityConfig.table,
      resourceId: `BATCH-${records.length}-ITEMS`,
      delta: { count: records.length },
      reason: `Batch impor ${records.length} data master ke ${entityConfig.title}`,
      source: 'WEB_APP_MASTER_DATA'
    });

    return { status: 200, count: records.length, message: `Batch ${records.length} records processed successfully.` };
  },

  /**
   * Reset / Seed Default Data
   */
  seedDefaultData: async (entityKey = null) => {
    if (entityKey) {
      const defaultRecords = INITIAL_MASTER_DATA[entityKey] || [];
      saveLocalData(entityKey, defaultRecords);
      return defaultRecords;
    } else {
      Object.keys(MASTER_DATA_ENTITIES).forEach(key => {
        const defaultRecords = INITIAL_MASTER_DATA[key] || [];
        saveLocalData(key, defaultRecords);
      });
      return true;
    }
  }
};

// Filter & Sort Helper
function filterAndSortRecords(items, { includeDeleted, status, search, entityConfig }) {
  let result = items;

  // Filter soft-deleted
  if (!includeDeleted) {
    result = result.filter(i => !i.is_deleted);
  } else {
    // If trash mode (only deleted items)
    if (status === 'TRASH') {
      result = result.filter(i => i.is_deleted);
    }
  }

  // Filter Status
  if (status && status !== 'ALL' && status !== 'TRASH') {
    result = result.filter(i => i.status === status);
  }

  // Search Filter (fuzzy multi-column search)
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(item => {
      return Object.values(item).some(val => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }

  return result;
}
