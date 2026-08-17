/**
 * NurseFlow Enterprise HIS 2026 — Base Repository (Adapter Pattern)
 * Provides abstract abstraction for Local/Memory/PostgreSQL/Firebase storage.
 */

export class BaseRepository {
  constructor(storageKey, defaultSeed = []) {
    this.storageKey = storageKey;
    this.defaultSeed = defaultSeed;
  }

  loadAll() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn(`[BaseRepository] Failed to load ${this.storageKey}:`, e);
    }
    return this.defaultSeed;
  }

  saveAll(records) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(records));
      }
    } catch (e) {
      console.warn(`[BaseRepository] Failed to save ${this.storageKey}:`, e);
    }
  }

  async findById(id) {
    const list = this.loadAll();
    return list.find(r => r.id === id) || null;
  }

  async create(data) {
    const list = this.loadAll();
    const newRecord = {
      ...data,
      id: data.id || `REC-${Date.now()}`,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.saveAll([newRecord, ...list]);
    return newRecord;
  }

  async update(id, updates) {
    const list = this.loadAll();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    this.saveAll(list);
    return updated;
  }

  async delete(id) {
    const list = this.loadAll();
    const filtered = list.filter(r => r.id !== id);
    this.saveAll(filtered);
    return true;
  }
}
