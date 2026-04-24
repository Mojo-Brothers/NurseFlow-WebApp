import { create } from 'zustand';
import { 
  getMasterCategories, 
  seedMasterData,
  addItemToCategory,
  updateItemInCategory,
  deleteItemFromCategory
} from './services/masterData.service.js';

export const useMasterDataStore = create((set, get) => ({
  categories: [],
  serviceCatalog: [],
  medicationSafety: null,
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await getMasterCategories();
      set({ categories, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  // Multi-domain fetch for comprehensive Admin Hub
  fetchMasterData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Lazy import to avoid circular dependency or missing methods
      const { getServiceCatalog, getMedicationSafety } = await import('./services/masterData.service.js');
      const [cats, services, safety] = await Promise.all([
        getMasterCategories(),
        getServiceCatalog(),
        getMedicationSafety()
      ]);
      set({ 
        categories: cats, 
        serviceCatalog: services, 
        medicationSafety: safety,
        isLoading: false 
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  performSeed: async () => {
    console.log('[Store] performSeed triggered');
    set({ isLoading: true, error: null });
    try {
      await seedMasterData();
      await get().fetchMasterData();
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  addItem: async (categoryId, item, userEmail) => {
    try {
      await addItemToCategory(categoryId, item, userEmail);
      set(state => ({
        categories: state.categories.map(c => 
          c.id === categoryId ? { ...c, items: [...c.items, item] } : c
        )
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  updateItem: async (categoryId, oldItem, newItem, userEmail) => {
    try {
      await updateItemInCategory(categoryId, oldItem, newItem, userEmail);
      set(state => ({
        categories: state.categories.map(c => 
          c.id === categoryId ? {
            ...c,
            items: c.items.map(i => i === oldItem ? newItem : i)
          } : c
        )
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteItem: async (categoryId, itemToRemove, userEmail) => {
    try {
      await deleteItemFromCategory(categoryId, itemToRemove, userEmail);
      set(state => ({
        categories: state.categories.map(c => 
          c.id === categoryId ? {
            ...c,
            items: c.items.filter(i => i !== itemToRemove)
          } : c
        )
      }));
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  }
}));
