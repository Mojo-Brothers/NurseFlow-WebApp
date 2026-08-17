/**
 * NurseFlow Enterprise HIS 2026 — KPI Calculation & Snapshot Engine
 * Computes official hospital clinical efficiency indicators and stores period snapshots.
 */

const KPI_STORAGE_KEY = 'nurseflow_kpi_snapshots';

const getStoredKpiSnapshots = () => {
  try {
    const raw = localStorage.getItem(KPI_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[KpiCalculation] Failed to read KPI store:', e);
  }
  return [
    { id: 'KPI-2026-08-15', snapshot_date: '2026-08-15', bor: 76.5, alos: 4.2, toi: 1.8, bto: 4.5, emergency_waiting_time: 14.5 },
    { id: 'KPI-2026-08-16', snapshot_date: '2026-08-16', bor: 78.0, alos: 4.1, toi: 1.6, bto: 4.7, emergency_waiting_time: 12.0 },
    { id: 'KPI-2026-08-17', snapshot_date: '2026-08-17', bor: 74.2, alos: 4.4, toi: 1.9, bto: 4.4, emergency_waiting_time: 15.2 }
  ];
};

const saveStoredKpiSnapshots = (snapshots) => {
  try {
    localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(snapshots));
  } catch (e) {
    console.warn('[KpiCalculation] Failed to persist KPI store:', e);
  }
};

export const kpiCalculationService = {
  /**
   * Calculate all real-time hospital indicators
   */
  computeRealtimeMetrics: ({
    totalBeds = 50,
    occupiedBeds = 38,
    totalCareDays = 1140,
    totalDischarges = 260,
    periodDays = 30,
    emergencyWaitTimesMinutes = [10, 15, 12, 20, 8, 14]
  }) => {
    // 1. BOR (%) = (Occupied Bed Days / (Total Beds * Period Days)) * 100%
    const bor = totalBeds > 0 ? Math.round(((occupiedBeds * periodDays) / (totalBeds * periodDays)) * 1000) / 10 : 0;

    // 2. ALOS (Hari) = Total Care Days / Total Discharges
    const alos = totalDischarges > 0 ? Math.round((totalCareDays / totalDischarges) * 10) / 10 : 0;

    // 3. TOI (Hari) = ((Total Beds * Period Days) - Total Care Days) / Total Discharges
    const toi = totalDischarges > 0 ? Math.round((((totalBeds * periodDays) - totalCareDays) / totalDischarges) * 10) / 10 : 0;

    // 4. BTO (Kali) = Total Discharges / Total Beds
    const bto = totalBeds > 0 ? Math.round((totalDischarges / totalBeds) * 10) / 10 : 0;

    // 5. Avg Emergency Waiting Time (Menit)
    const avgWait = emergencyWaitTimesMinutes.length > 0 
      ? Math.round(emergencyWaitTimesMinutes.reduce((a, b) => a + b, 0) / emergencyWaitTimesMinutes.length * 10) / 10 
      : 0;

    return {
      bor,
      alos,
      toi,
      bto,
      emergency_waiting_time: avgWait,
      total_beds: totalBeds,
      occupied_beds: occupiedBeds,
      bed_utilization_rate: bor
    };
  },

  /**
   * Generate & Persist Daily KPI Snapshot
   */
  generateDailySnapshot: async (customMetrics = null) => {
    const today = new Date().toISOString().split('T')[0];
    const metrics = customMetrics || kpiCalculationService.computeRealtimeMetrics({});

    const snapshot = {
      id: `KPI-${today}`,
      snapshot_date: today,
      bor: metrics.bor,
      alos: metrics.alos,
      toi: metrics.toi,
      bto: metrics.bto,
      emergency_waiting_time: metrics.emergency_waiting_time,
      created_at: new Date().toISOString()
    };

    const currentList = getStoredKpiSnapshots();
    const updatedList = [snapshot, ...currentList.filter(s => s.snapshot_date !== today)];
    saveStoredKpiSnapshots(updatedList);

    return snapshot;
  },

  /**
   * Get all stored KPI snapshots
   */
  getKpiSnapshots: () => {
    return getStoredKpiSnapshots();
  }
};
