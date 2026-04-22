import { SYNC_PRIORITIES, QUEUE_STATUS, SCHEMA_VERSION, MERGE_WHITELIST } from '../constants.js';
import { monitorSync, trackMetric } from './monitoring.service.js';

const DB_NAME = 'nurseflow_sync_db';
const STORE_NAME = 'sync_queue';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

/**
 * V10: Smart Conflict Resolver (Field-level Merge)
 * Memutuskan apakah data lokal bisa menimpa data remote atau butuh manual review.
 */
export const mergeData = (local, remote) => {
  if (!remote) return local;
  
  // Jika versi lokal lebih rendah or sama, jangan timpa field kritikal
  const localVer  = local._v || 0;
  const remoteVer = remote._v || 0;

  if (localVer < remoteVer) {
    console.warn('[SyncQueue] Remote version is higher. Merging non-critical fields only.');
    
    const merged = { ...remote };
    MERGE_WHITELIST.forEach(field => {
      if (local[field] !== undefined) {
        merged[field] = local[field];
      }
    });
    
    // Tandai jika ada perbedaan di field KRITIKAL yang tidak di-whitelist
    const hasConflict = Object.keys(local).some(key => 
      !MERGE_WHITELIST.includes(key) && local[key] !== remote[key]
    );

    if (hasConflict) {
      merged._requires_manual_review = true;
      merged._conflict_metadata = {
        last_local_ver: localVer,
        last_remote_ver: remoteVer,
        conflict_at: Date.now()
      };
    }

    return merged;
  }

  // Jika lokal lebih baru, timpa dengan menaikkan versi
  return {
    ...local,
    _v: Math.max(localVer, remoteVer) + 1,
    _last_sync: Date.now()
  };
};

/**
 * Add item to sync queue
 */
export const enqueueAction = async (payload, priority = SYNC_PRIORITIES.NORMAL) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const entry = {
      payload,
      priority,
      status:      QUEUE_STATUS.PENDING,
      retry_count: 0,
      last_error:  null,
      next_retry:     Date.now(),
      created_at:     Date.now(),
      schema_version: SCHEMA_VERSION,
    };
    
    const request = store.add(entry);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const processQueue = async (processor) => {
  const db = await initDB();
  const entries = await getAllPending(db);
  const sorted = entries.sort((a, b) => a.priority - b.priority);
  
  for (const entry of sorted) {
    if (entry.next_retry > Date.now()) continue;
    const startTime = Date.now();
    try {
      await processor(entry.payload);
      await removeEntry(db, entry.id);
      monitorSync(true, Date.now() - startTime);
    } catch (err) {
      monitorSync(false, Date.now() - startTime, err);
      await handleFailure(db, entry, err.message);
    }
  }
};

const getAllPending = (db) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.filter(e => e.status === QUEUE_STATUS.PENDING));
    };
    request.onerror = () => reject(request.error);
  });
};

const removeEntry = (db, id) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const handleFailure = async (db, entry, errorMessage) => {
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  entry.retry_count += 1;
  entry.last_error = errorMessage;
  
  if (entry.retry_count >= 3) {
    entry.status = QUEUE_STATUS.DLQ;
  } else {
    const backoff = Math.pow( entry.retry_count, 2) * 5000;
    entry.next_retry = Date.now() + backoff;
  }
  store.put(entry);
};

/**
 * Get count of pending actions for UI indicator
 */
export const getPendingCount = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const pending = request.result.filter(e => e.status === QUEUE_STATUS.PENDING);
      resolve(pending.length);
    };
    request.onerror = () => reject(0);
  });
};

export const isOnline = () => {
   return typeof window !== 'undefined' ? window.navigator.onLine : true;
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    trackMetric('NETWORK_RESTORED', { timestamp: Date.now() });
  });
}
