import { create } from 'zustand';
import { enterpriseMasterApiService } from './services/enterpriseMasterApi.service.js';
import { enterpriseAuditEngine } from './services/enterpriseAuditEngine.service.js';
import { masterDataExportService } from './services/masterDataExport.service.js';
import { ENTERPRISE_DOMAINS, ENTERPRISE_ENTITY_SCHEMAS } from './data/enterpriseMasterSchemas.js';

export const useEnterpriseMasterStore = create((set, get) => ({
  activeDomain: 'PATIENT', // Default to Patient 360
  activeEntity: 'patients',

  // Dynamic Cache for all entities
  entitiesData: {},
  auditLogs: [],
  isLoading: false,
  error: null,

  // Global Filter & Search
  searchQuery: '',
  statusFilter: 'ALL', // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'TRASH'
  
  // Selection for Batch Operations
  selectedIds: [],

  // Sorting & Pagination
  sortConfig: { field: 'created_at', direction: 'desc' },
  pagination: { page: 1, pageSize: 15 },

  // Specialized View Modes & Facility Hierarchy Filter
  facilityFilter: {
    buildingId: '',
    floorId: '',
    wardId: '',
    classId: ''
  },

  // UI Overlays
  isFormModalOpen: false,
  isImportModalOpen: false,
  isDetailDrawerOpen: false,
  isRbacModalOpen: false,
  selectedItemForEdit: null,
  selectedItemForDetail: null,

  // Navigation Setters
  setActiveDomain: (domainId) => {
    const domain = ENTERPRISE_DOMAINS.find(d => d.id === domainId);
    const firstEntity = domain?.entities[0] || 'patients';
    set({
      activeDomain: domainId,
      activeEntity: firstEntity,
      selectedIds: [],
      searchQuery: '',
      pagination: { page: 1, pageSize: 15 }
    });
    get().fetchCurrentEntityData();
  },

  setActiveEntity: (entityKey) => {
    const schema = ENTERPRISE_ENTITY_SCHEMAS[entityKey];
    set({
      activeEntity: entityKey,
      activeDomain: schema ? schema.domain : get().activeDomain,
      selectedIds: [],
      searchQuery: '',
      pagination: { page: 1, pageSize: 15 }
    });
    get().fetchCurrentEntityData();
  },

  setSearchQuery: (query) => set({ searchQuery: query, pagination: { ...get().pagination, page: 1 } }),
  setStatusFilter: (status) => set({ statusFilter: status, selectedIds: [], pagination: { ...get().pagination, page: 1 } }),
  
  setFacilityFilter: (filter) => set(state => ({
    facilityFilter: { ...state.facilityFilter, ...filter },
    pagination: { ...state.pagination, page: 1 }
  })),

  setSortConfig: (field) => {
    const current = get().sortConfig;
    let direction = 'asc';
    if (current.field === field && current.direction === 'asc') direction = 'desc';
    set({ sortConfig: { field, direction } });
  },

  setPage: (page) => set(state => ({ pagination: { ...state.pagination, page } })),
  setPageSize: (pageSize) => set(state => ({ pagination: { page: 1, pageSize } })),

  // Selection
  toggleSelectId: (id) => set(state => {
    const exists = state.selectedIds.includes(id);
    return {
      selectedIds: exists ? state.selectedIds.filter(i => i !== id) : [...state.selectedIds, id]
    };
  }),

  selectAllVisible: (ids) => set(state => {
    const all = ids.every(id => state.selectedIds.includes(id));
    return { selectedIds: all ? [] : [...new Set([...state.selectedIds, ...ids])] };
  }),

  clearSelection: () => set({ selectedIds: [] }),

  // Modal / Drawer Handlers
  openCreateModal: () => set({ isFormModalOpen: true, selectedItemForEdit: null }),
  openEditModal: (item) => set({ isFormModalOpen: true, selectedItemForEdit: item }),
  closeFormModal: () => set({ isFormModalOpen: false, selectedItemForEdit: null }),
  
  openDetailDrawer: (item) => set({ isDetailDrawerOpen: true, selectedItemForDetail: item }),
  closeDetailDrawer: () => set({ isDetailDrawerOpen: false, selectedItemForDetail: null }),

  openImportModal: () => set({ isImportModalOpen: true }),
  closeImportModal: () => set({ isImportModalOpen: false }),

  openRbacModal: () => set({ isRbacModalOpen: true }),
  closeRbacModal: () => set({ isRbacModalOpen: false }),

  // Data Fetchers
  fetchCurrentEntityData: async () => {
    const { activeEntity } = get();
    set({ isLoading: true, error: null });

    try {
      const records = await enterpriseMasterApiService.getRecords(activeEntity, { includeDeleted: true });
      const localLogs = enterpriseAuditEngine.getLocalAuditLogs();
      set(state => ({
        entitiesData: {
          ...state.entitiesData,
          [activeEntity]: records
        },
        auditLogs: localLogs,
        isLoading: false
      }));
    } catch (err) {
      console.error('[EnterpriseMasterStore] Fetch failed:', err);
      set({ error: err.message, isLoading: false });
    }
  },

  fetchAllEnterpriseData: async () => {
    set({ isLoading: true, error: null });
    try {
      const entityKeys = Object.keys(ENTERPRISE_ENTITY_SCHEMAS);
      const results = await Promise.all(
        entityKeys.map(k => enterpriseMasterApiService.getRecords(k, { includeDeleted: true }))
      );

      const mapped = {};
      entityKeys.forEach((k, idx) => {
        mapped[k] = results[idx];
      });

      const logs = enterpriseAuditEngine.getLocalAuditLogs();
      set({ entitiesData: mapped, auditLogs: logs, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  saveRecord: async (payload, userEmail) => {
    const { activeEntity, selectedItemForEdit } = get();
    set({ isLoading: true });

    try {
      if (selectedItemForEdit && selectedItemForEdit.id) {
        await enterpriseMasterApiService.updateRecord(activeEntity, selectedItemForEdit.id, payload, userEmail);
      } else {
        await enterpriseMasterApiService.createRecord(activeEntity, payload, userEmail);
      }
      await get().fetchCurrentEntityData();
      get().closeFormModal();
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  softDeleteRecord: async (id, userEmail) => {
    const { activeEntity } = get();
    try {
      await enterpriseMasterApiService.softDeleteRecord(activeEntity, id, userEmail);
      await get().fetchCurrentEntityData();
      get().clearSelection();
      return true;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  restoreRecord: async (id, userEmail) => {
    const { activeEntity } = get();
    try {
      await enterpriseMasterApiService.restoreRecord(activeEntity, id, userEmail);
      await get().fetchCurrentEntityData();
      get().clearSelection();
      return true;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  batchSoftDelete: async (userEmail) => {
    const { activeEntity, selectedIds } = get();
    if (selectedIds.length === 0) return;
    set({ isLoading: true });

    try {
      for (const id of selectedIds) {
        await enterpriseMasterApiService.softDeleteRecord(activeEntity, id, userEmail);
      }
      await get().fetchCurrentEntityData();
      get().clearSelection();
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  batchRestore: async (userEmail) => {
    const { activeEntity, selectedIds } = get();
    if (selectedIds.length === 0) return;
    set({ isLoading: true });

    try {
      for (const id of selectedIds) {
        await enterpriseMasterApiService.restoreRecord(activeEntity, id, userEmail);
      }
      await get().fetchCurrentEntityData();
      get().clearSelection();
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  exportData: (type = 'EXCEL') => {
    const { activeEntity, entitiesData, statusFilter } = get();
    const config = ENTERPRISE_ENTITY_SCHEMAS[activeEntity] || {};
    let data = entitiesData[activeEntity] || [];

    if (statusFilter === 'TRASH') {
      data = data.filter(d => d.is_deleted);
    } else {
      data = data.filter(d => !d.is_deleted);
      if (statusFilter !== 'ALL') {
        data = data.filter(d => d.status === statusFilter);
      }
    }

    if (type === 'EXCEL') {
      masterDataExportService.exportToExcel(data, config.columns || [], `NurseFlow_${activeEntity}`);
    } else if (type === 'PDF') {
      masterDataExportService.exportToPdfReport(data, config.columns || [], `Laporan ${config.title || activeEntity}`, 'NurseFlow Enterprise HIS 2026');
    }
  },

  resetEntireEnterpriseData: async () => {
    set({ isLoading: true });
    try {
      await enterpriseMasterApiService.seedEnterpriseData();
      await get().fetchAllEnterpriseData();
      set({ isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  }
}));

// Backward compatibility alias
export const useMasterDataStore = useEnterpriseMasterStore;
