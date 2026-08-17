/**
 * NurseFlow Enterprise HIS 2026 — Bed Management & Efficiency Analytics Service
 * Computes official Hospital Inpatient Indicators: BOR, ALOS, TOI, BTO
 * and tracks the complete bed sanitization/turnover lifecycle.
 */

import { enterpriseAuditEngine } from './enterpriseAuditEngine.service.js';

export const bedManagementService = {
  /**
   * BOR (Bed Occupancy Rate) = (Total Hari Perawatan / (Jumlah Tempat Tidur * Jumlah Hari)) * 100%
   * Standar Depkes / KARS: 60 - 85%
   */
  calculateBOR: (occupiedBedDays, totalBeds, periodDays = 30) => {
    if (!totalBeds || totalBeds <= 0 || !periodDays || periodDays <= 0) return 0;
    const rate = (occupiedBedDays / (totalBeds * periodDays)) * 100;
    return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
  },

  /**
   * ALOS (Average Length of Stay) = Total Hari Rawat / Jumlah Pasien Keluar (Hidup + Mati)
   * Standar Depkes / KARS: 3 - 6 Hari
   */
  calculateLOS: (totalCareDays, totalDischarges) => {
    if (!totalDischarges || totalDischarges <= 0) return 0;
    const los = totalCareDays / totalDischarges;
    return Math.round(los * 10) / 10;
  },

  /**
   * TOI (Turn Over Interval) = ((Jumlah Bed * Hari) - Total Hari Rawat) / Jumlah Pasien Keluar
   * Standar Depkes: 1 - 3 Hari
   */
  calculateTOI: (totalBeds, periodDays, totalCareDays, totalDischarges) => {
    if (!totalDischarges || totalDischarges <= 0) return 0;
    const toi = ((totalBeds * periodDays) - totalCareDays) / totalDischarges;
    return Math.max(0, Math.round(toi * 10) / 10);
  },

  /**
   * BTO (Bed Turn Over) = Jumlah Pasien Keluar / Jumlah Tempat Tidur
   * Standar Depkes: 40 - 50 Kali / Tahun (atau 4 - 5 Kali / Bulan)
   */
  calculateBTO: (totalDischarges, totalBeds) => {
    if (!totalBeds || totalBeds <= 0) return 0;
    const bto = totalDischarges / totalBeds;
    return Math.round(bto * 10) / 10;
  },

  /**
   * Bed Cleaning Lifecycle State Machine:
   * DIRTY → CLEANING → SANITIZED → AVAILABLE
   */
  startBedCleaning: async (bedId, sanitizedBy, actorEmail = 'sanitation@nurseflow.id') => {
    const now = new Date().toISOString();
    const cleaningLog = {
      id: `CLN-${Date.now()}`,
      bed_id: bedId,
      cleaning_started_at: now,
      cleaning_completed_at: null,
      cleaning_duration_minutes: null,
      sanitized_by: sanitizedBy,
      inspection_passed: false,
      status: 'CLEANING_IN_PROGRESS'
    };

    await enterpriseAuditEngine.logEvent({
      domain: 'FACILITY',
      entity: 'bed_cleaning_logs',
      entityId: cleaningLog.id,
      action: 'CLEANING_STARTED',
      oldValue: { bed_status: 'BED_DISINFECTING' },
      newValue: { bed_status: 'CLEANING', log: cleaningLog },
      userEmail: actorEmail,
      reason: `Mulai proses pembersihan & sterilisasi tempat tidur ${bedId}`
    });

    return cleaningLog;
  },

  completeBedCleaning: async (cleaningLogId, bedId, durationMinutes = 25, actorEmail = 'sanitation@nurseflow.id') => {
    const now = new Date().toISOString();
    const updatePayload = {
      cleaning_completed_at: now,
      cleaning_duration_minutes: durationMinutes,
      inspection_passed: true,
      status: 'SANITIZED_AVAILABLE'
    };

    await enterpriseAuditEngine.logEvent({
      domain: 'FACILITY',
      entity: 'bed_cleaning_logs',
      entityId: cleaningLogId,
      action: 'CLEANING_COMPLETED',
      oldValue: { bed_status: 'CLEANING' },
      newValue: { bed_status: 'AVAILABLE', duration_minutes: durationMinutes },
      userEmail: actorEmail,
      reason: `Penyelesaian sterilisasi: Bed ${bedId} siap dihuni (AVAILABLE)`
    });

    return updatePayload;
  }
};
