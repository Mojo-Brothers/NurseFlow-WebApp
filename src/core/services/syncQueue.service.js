/**
 * NurseFlow — Priority Sync Queue Service (V5 Enterprise Resilient)
 * ✅ Persistence: IndexedDB (Transactional & Scalable)
 * ✅ Priority: CRITICAL -> HIGH -> NORMAL
 * ✅ Reliability: 3 Retries + Exponential Backoff + DLQ
 */

import { SYNC_PRIORITIES, QUEUE_STATUS, SCHEMA_VERSION } from '../constants.js';
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
 * Add item to sync queue
 * @param {Object} payload - The transaction data
 * @param {number} priority - SYNC_PRIORITIES
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
    request.onsuccess = () => {
      console.log(`[SyncQueue] Action Enqueued: Priority ${priority}`);
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Process the queue based on priorities
 * @param {Function} processor - Logic to execute for each entry (e.g., Firestore submit)
 */
export const processQueue = async (processor) => {
  const db = await initDB();
  const entries = await getAllPending(db);
  
  // Sort by Priority (Ascending number: 1=Critical, 2=High, 3=Normal)
  const sorted = entries.sort((a, b) => a.priority - b.priority);
  
  for (const entry of sorted) {
    if (entry.next_retry > Date.now()) continue;

    const startTime = Date.now();
    try {
      await processor(entry.payload);
      await removeEntry(db, entry.id);
      monitorSync(true, Date.now() - startTime);
      console.log(`[SyncQueue] Success: Entry ${entry.id} synced.`);
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
    console.warn(`[SyncQueue] DLQ: Entry ${entry.id} moved to Dead Letter Queue after 3 failures.`);
  } else {
    // Exponential Backoff: 5s, 30s, 2m
    const backoff = Math.pow( entry.retry_count, 2) * 5000;
    entry.next_retry = Date.now() + backoff;
    console.log(`[SyncQueue] Retry Scheduled: Entry ${entry.id} in ${backoff/1000}s`);
  }
  
  store.put(entry);
};

// Automatic Sync Listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    trackMetric('NETWORK_RESTORED', { timestamp: Date.now() });
    // This is handled by App.jsx listener which calls processQueue(executeQueuedAction)
  });
}
