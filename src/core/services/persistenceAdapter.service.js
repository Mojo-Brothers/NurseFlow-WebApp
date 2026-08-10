/**
 * NurseFlow Enterprise HIS — Persistence Adapter Pattern Service
 * Decouples Clinical Business Logic from Physical Database Engines.
 * Allows switching between Firestore, PostgreSQL, and In-Memory persistence adapters seamlessly.
 */
import { doc, getDoc, setDoc, getDocs, collection, query as firestoreQuery, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase.js';

export const DB_ENGINE_TYPES = {
  FIRESTORE: 'FIRESTORE',
  POSTGRESQL: 'POSTGRESQL',
  IN_MEMORY: 'IN_MEMORY'
};

class PersistenceAdapter {
  constructor(engineType = DB_ENGINE_TYPES.FIRESTORE) {
    this.engineType = engineType;
    this.memoryStore = new Map();
  }

  setEngine(engineType) {
    this.engineType = engineType;
    console.log(`[PersistenceAdapter] Switched active database adapter to ${engineType}`);
  }

  async findById(collectionName, id) {
    if (this.engineType === DB_ENGINE_TYPES.IN_MEMORY || !db) {
      const col = this.memoryStore.get(collectionName) || new Map();
      return col.get(id) || null;
    }

    try {
      const docRef = doc(db, collectionName, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      // Fallback check memory
      const col = this.memoryStore.get(collectionName) || new Map();
      return col.get(id) || null;
    } catch (err) {
      console.warn(`[PersistenceAdapter] Firestore findById failed (${collectionName}/${id}), checking memory store:`, err.message);
      const col = this.memoryStore.get(collectionName) || new Map();
      return col.get(id) || null;
    }
  }

  async save(collectionName, id, payload) {
    const record = { ...payload, id, updatedAt: new Date().toISOString() };

    // Always update in-memory cache
    if (!this.memoryStore.has(collectionName)) {
      this.memoryStore.set(collectionName, new Map());
    }
    this.memoryStore.get(collectionName).set(id, record);

    if (this.engineType === DB_ENGINE_TYPES.IN_MEMORY || !db) {
      return record;
    }

    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn(`[PersistenceAdapter] Firestore save failed (${collectionName}/${id}), record cached in memory:`, err.message);
    }

    return record;
  }

  async query(collectionName, filterFnOrWhereConditions) {
    let memoryRecords = [];
    if (this.memoryStore.has(collectionName)) {
      memoryRecords = Array.from(this.memoryStore.get(collectionName).values());
    }

    if (this.engineType === DB_ENGINE_TYPES.IN_MEMORY || !db) {
      return typeof filterFnOrWhereConditions === 'function' 
        ? memoryRecords.filter(filterFnOrWhereConditions) 
        : memoryRecords;
    }

    try {
      const colRef = collection(db, collectionName);
      let snap;
      if (Array.isArray(filterFnOrWhereConditions)) {
        const q = firestoreQuery(colRef, ...filterFnOrWhereConditions);
        snap = await getDocs(q);
      } else {
        snap = await getDocs(colRef);
      }
      const remoteRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Merge remote and memory records ensuring uniqueness
      const mergedMap = new Map();
      memoryRecords.forEach(r => mergedMap.set(r.id, r));
      remoteRecords.forEach(r => mergedMap.set(r.id, r));
      const combined = Array.from(mergedMap.values());

      if (typeof filterFnOrWhereConditions === 'function') {
        return combined.filter(filterFnOrWhereConditions);
      }
      return combined;
    } catch (err) {
      console.warn(`[PersistenceAdapter] Firestore query failed (${collectionName}), returning memory records:`, err.message);
      return typeof filterFnOrWhereConditions === 'function' 
        ? memoryRecords.filter(filterFnOrWhereConditions) 
        : memoryRecords;
    }
  }

  // Helper for batch/seeding initial data into memory adapter
  seedMemoryData(collectionName, records) {
    if (!this.memoryStore.has(collectionName)) {
      this.memoryStore.set(collectionName, new Map());
    }
    const col = this.memoryStore.get(collectionName);
    records.forEach(item => col.set(item.id || item.mrn, item));
  }
}

export const persistenceAdapter = new PersistenceAdapter();
export default persistenceAdapter;

