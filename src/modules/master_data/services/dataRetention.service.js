/**
 * NurseFlow Enterprise HIS 2026 — Data Retention & Archiving Service
 * Implements data life-cycle policies according to Indonesian Permenkes No. 24/2022 and UU PDP.
 */

export const DEFAULT_RETENTION_POLICIES = [
  {
    id: 'POL-EMR',
    entity_name: 'medical_records',
    title: 'Berkas Rekam Medis Pasien',
    active_period_years: 10,
    archive_period_years: 25,
    description: 'Sesuai Permenkes 24/2022, rekam medis aktif disimpan 10 tahun dan arsip ringkasan 25 tahun.'
  },
  {
    id: 'POL-AUD',
    entity_name: 'audit_logs',
    title: 'Jejak Audit Trail & Log Keamanan',
    active_period_years: 5,
    archive_period_years: 10,
    description: 'Log audit disimpan 5 tahun di database operasional dan diarsipkan 10 tahun untuk kebutuhan akreditasi JCI.'
  }
];

const ARCHIVE_STORAGE_KEY = 'nurseflow_archived_records';

const getStoredArchives = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[DataRetention] Failed to read archive store:', e);
  }
  return [];
};

const saveStoredArchives = (archives) => {
  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archives));
  } catch (e) {
    console.warn('[DataRetention] Failed to persist archive store:', e);
  }
};

export const dataRetentionService = {
  /**
   * Archive inactive records based on retention policy
   */
  archiveInactiveRecords: async ({ entityName = 'medical_records', olderThanYears = 10 }) => {
    const now = new Date();
    const cutoffDate = new Date(now.setFullYear(now.getFullYear() - olderThanYears)).toISOString();

    const archiveBatch = {
      id: `ARC-${Date.now()}`,
      entity_name: entityName,
      cutoff_date: cutoffDate,
      archived_at: new Date().toISOString(),
      record_count: 14, // simulated batch
      storage_location: 'GCS_COLDLINE_ARCHIVE_JKT',
      status: 'ARCHIVED'
    };

    const currentArchives = getStoredArchives();
    saveStoredArchives([archiveBatch, ...currentArchives]);

    return archiveBatch;
  },

  /**
   * Restore an archived batch
   */
  restoreArchivedRecords: async (archiveBatchId) => {
    const currentArchives = getStoredArchives();
    const updated = currentArchives.map(a => {
      if (a.id === archiveBatchId) {
        return { ...a, status: 'RESTORED', restored_at: new Date().toISOString() };
      }
      return a;
    });
    saveStoredArchives(updated);
    return { success: true, message: `Batch ${archiveBatchId} berhasil dipulihkan ke database operasional.` };
  },

  /**
   * Get all retention policies
   */
  getPolicies: () => {
    return DEFAULT_RETENTION_POLICIES;
  },

  /**
   * Get all archive batches
   */
  getArchives: () => {
    return getStoredArchives();
  }
};
