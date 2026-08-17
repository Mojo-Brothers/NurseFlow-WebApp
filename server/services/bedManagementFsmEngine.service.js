/**
 * NurseFlow Enterprise HIS 2026 — Bed Management & Barber-Johnson Live FSM Engine
 * Standards: Permenkes No. 24/2022 (RME), Petunjuk Teknis SIRS Kemenkes, JCI Facilities & Patient Safety (IPSG)
 * Core Architecture: 10-State Bed FSM, Occupancy Lifecycle, Transfer, Housekeeping Queue, Barber-Johnson & Predictive LOS
 */

export const BED_STATES = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
  TRANSFER_PENDING: 'TRANSFER_PENDING',
  DIRTY: 'DIRTY',
  CLEANING: 'CLEANING',
  BLOCKED: 'BLOCKED',
  MAINTENANCE: 'MAINTENANCE',
  ISOLATION: 'ISOLATION',
  DECOMMISSIONED: 'DECOMMISSIONED'
};

// Valid State Transitions Map (Anti-Error State Machine)
const VALID_TRANSITIONS = {
  [BED_STATES.AVAILABLE]: [BED_STATES.RESERVED, BED_STATES.OCCUPIED, BED_STATES.BLOCKED, BED_STATES.MAINTENANCE, BED_STATES.ISOLATION],
  [BED_STATES.RESERVED]: [BED_STATES.OCCUPIED, BED_STATES.AVAILABLE, BED_STATES.BLOCKED],
  [BED_STATES.OCCUPIED]: [BED_STATES.TRANSFER_PENDING, BED_STATES.DIRTY, BED_STATES.AVAILABLE],
  [BED_STATES.TRANSFER_PENDING]: [BED_STATES.DIRTY, BED_STATES.OCCUPIED],
  [BED_STATES.DIRTY]: [BED_STATES.CLEANING, BED_STATES.BLOCKED, BED_STATES.MAINTENANCE],
  [BED_STATES.CLEANING]: [BED_STATES.AVAILABLE, BED_STATES.DIRTY, BED_STATES.MAINTENANCE],
  [BED_STATES.BLOCKED]: [BED_STATES.AVAILABLE, BED_STATES.MAINTENANCE],
  [BED_STATES.MAINTENANCE]: [BED_STATES.DIRTY, BED_STATES.AVAILABLE],
  [BED_STATES.ISOLATION]: [BED_STATES.OCCUPIED, BED_STATES.DIRTY, BED_STATES.AVAILABLE],
  [BED_STATES.DECOMMISSIONED]: [BED_STATES.MAINTENANCE]
};

// In-Memory Persistent Store for Bed Operations
const BED_OPERATIONAL_STORE = {
  beds: [
    {
      id: 'BED-101-A',
      bed_code: 'BED-101-A',
      ward_code: 'WRD-CHRY',
      ward_name: 'Bangsal Chrysant (Kelas 1)',
      room_number: '101',
      room_type: 'KELAS_1',
      state: BED_STATES.OCCUPIED,
      has_ventilator: false,
      has_central_oxygen: true,
      current_occupancy: {
        occupancy_id: 'OCC-20260817-001',
        patient_id: 'P-101',
        patient_name: 'Ny. Siti Aminah',
        mrn: '00-49-00-84',
        gender: 'FEMALE',
        age: 38,
        admitted_at: '2026-08-14T08:30:00Z',
        primary_icd10: 'I10',
        diagnosis_name: 'Hipertensi Primer Urgensi',
        estimated_los_days: 4,
        dpjp_name: 'dr. Siti Wijaya, Sp.PD-KGEH'
      }
    },
    {
      id: 'BED-101-B',
      bed_code: 'BED-101-B',
      ward_code: 'WRD-CHRY',
      ward_name: 'Bangsal Chrysant (Kelas 1)',
      room_number: '101',
      room_type: 'KELAS_1',
      state: BED_STATES.DIRTY,
      has_ventilator: false,
      has_central_oxygen: true,
      current_occupancy: null,
      dirty_since: '2026-08-17T09:15:00Z'
    },
    {
      id: 'BED-ICU-01',
      bed_code: 'BED-ICU-01',
      ward_code: 'WRD-ICU',
      ward_name: 'Intensive Care Unit (ICU)',
      room_number: 'ICU-01',
      room_type: 'ICU',
      state: BED_STATES.OCCUPIED,
      has_ventilator: true,
      has_central_oxygen: true,
      current_occupancy: {
        occupancy_id: 'OCC-20260817-002',
        patient_id: 'P-102',
        patient_name: 'Tn. Hendra Gunawan',
        mrn: '00-49-00-85',
        gender: 'MALE',
        age: 56,
        admitted_at: '2026-08-16T14:00:00Z',
        primary_icd10: 'I21.9',
        diagnosis_name: 'Acute Myocardial Infarction (STEMI)',
        estimated_los_days: 5,
        dpjp_name: 'dr. Budi Santoso, Sp.EM'
      }
    },
    {
      id: 'BED-ICU-02',
      bed_code: 'BED-ICU-02',
      ward_code: 'WRD-ICU',
      ward_name: 'Intensive Care Unit (ICU)',
      room_number: 'ICU-02',
      room_type: 'ICU',
      state: BED_STATES.AVAILABLE,
      has_ventilator: true,
      has_central_oxygen: true,
      current_occupancy: null
    },
    {
      id: 'BED-ORCH-201',
      bed_code: 'BED-ORCH-201',
      ward_code: 'WRD-ORCH',
      ward_name: 'Bangsal Orchid (VIP)',
      room_number: '201-VIP',
      room_type: 'VIP',
      state: BED_STATES.RESERVED,
      has_ventilator: false,
      has_central_oxygen: true,
      current_occupancy: null,
      reservation: {
        reservation_id: 'RES-001',
        patient_name: 'Ny. Ratna Sari',
        reserved_by: 'IGD Desk',
        expected_arrival: '2026-08-17T12:00:00Z'
      }
    },
    {
      id: 'BED-ISO-301',
      bed_code: 'BED-ISO-301',
      ward_code: 'WRD-ISO',
      ward_name: 'Bangsal Isolasi Tekanan Negatif',
      room_number: 'ISO-01',
      room_type: 'ISOLASI',
      state: BED_STATES.AVAILABLE,
      has_ventilator: false,
      has_central_oxygen: true,
      current_occupancy: null
    }
  ],
  transfers: [],
  reservations: [],
  cleaningLogs: [
    {
      id: 'CLN-001',
      bed_code: 'BED-101-B',
      ward_name: 'Bangsal Chrysant (Kelas 1)',
      status: 'PENDING_CLEANING',
      reported_at: '2026-08-17T09:15:00Z',
      housekeeper_name: null
    }
  ],
  statusHistory: []
};

export const bedManagementFsmEngine = {
  /**
   * 1. GET ALL BEDS WITH LIVE OPERATIONAL STATE
   */
  getAllBeds: ({ wardCode = 'ALL', state = 'ALL' } = {}) => {
    let result = [...BED_OPERATIONAL_STORE.beds];

    if (wardCode !== 'ALL') {
      result = result.filter(b => b.ward_code === wardCode);
    }
    if (state !== 'ALL') {
      result = result.filter(b => b.state === state);
    }

    return result;
  },

  /**
   * 2. FINITE STATE MACHINE: TRANSITION BED STATE
   */
  transitionBedState: (bedCode, targetState, { performedBy = 'Nurse In Charge', reason = '' } = {}) => {
    const bed = BED_OPERATIONAL_STORE.beds.find(b => b.bed_code === bedCode || b.id === bedCode);
    if (!bed) {
      throw new Error(`Tempat tidur ${bedCode} tidak ditemukan.`);
    }

    const currentState = bed.state;
    const allowed = VALID_TRANSITIONS[currentState] || [];

    if (!allowed.includes(targetState)) {
      throw new Error(
        `TRANSISI FSM ILEGAL: Tempat tidur ${bedCode} tidak dapat beralih dari ${currentState} ke ${targetState}. Transisi yang diizinkan: [${allowed.join(', ')}].`
      );
    }

    // Apply State
    bed.state = targetState;
    bed.updated_at = new Date().toISOString();

    // Side-effects on specific states
    if (targetState === BED_STATES.DIRTY) {
      bed.dirty_since = new Date().toISOString();
      bed.current_occupancy = null;
      BED_OPERATIONAL_STORE.cleaningLogs.unshift({
        id: `CLN-${Date.now()}`,
        bed_code: bed.bed_code,
        ward_name: bed.ward_name,
        status: 'PENDING_CLEANING',
        reported_at: new Date().toISOString(),
        housekeeper_name: null
      });
    } else if (targetState === BED_STATES.CLEANING) {
      const cleanLog = BED_OPERATIONAL_STORE.cleaningLogs.find(c => c.bed_code === bed.bed_code && c.status === 'PENDING_CLEANING');
      if (cleanLog) {
        cleanLog.status = 'IN_PROGRESS';
        cleanLog.housekeeper_name = performedBy;
        cleanLog.started_at = new Date().toISOString();
      }
    } else if (targetState === BED_STATES.AVAILABLE) {
      bed.current_occupancy = null;
      bed.reservation = null;
      bed.dirty_since = null;
    }

    // Record Status History Audit
    const historyEntry = {
      id: `HST-${Date.now()}`,
      bed_code: bed.bed_code,
      from_state: currentState,
      to_state: targetState,
      performed_by: performedBy,
      reason,
      timestamp: new Date().toISOString()
    };
    BED_OPERATIONAL_STORE.statusHistory.unshift(historyEntry);

    return {
      success: true,
      bedCode: bed.bed_code,
      fromState: currentState,
      toState: targetState,
      updatedBed: bed
    };
  },

  /**
   * 3. ADMIT PATIENT INTO BED (AVAILABLE / RESERVED -> OCCUPIED)
   */
  admitPatientToBed: (bedCode, patientData, { performedBy = 'Admisi Rawat Inap' } = {}) => {
    const bed = BED_OPERATIONAL_STORE.beds.find(b => b.bed_code === bedCode || b.id === bedCode);
    if (!bed) throw new Error(`Bed ${bedCode} tidak ditemukan.`);

    if (bed.state !== BED_STATES.AVAILABLE && bed.state !== BED_STATES.RESERVED) {
      throw new Error(`Bed ${bedCode} sedang dalam status ${bed.state}. Hanya bed AVAILABLE atau RESERVED yang dapat menerima pasien.`);
    }

    const occupancyRecord = {
      occupancy_id: `OCC-${Date.now()}`,
      patient_id: patientData.patient_id || `P-${Date.now()}`,
      patient_name: patientData.patient_name,
      mrn: patientData.mrn,
      gender: patientData.gender || 'UNKNOWN',
      age: patientData.age || 40,
      admitted_at: new Date().toISOString(),
      primary_icd10: patientData.primary_icd10 || 'Z00.0',
      diagnosis_name: patientData.diagnosis_name || 'Observasi Klinis',
      estimated_los_days: patientData.estimated_los_days || 3,
      dpjp_name: patientData.dpjp_name || 'dr. Jaga Bangsal'
    };

    bed.state = BED_STATES.OCCUPIED;
    bed.current_occupancy = occupancyRecord;
    bed.reservation = null;

    return { success: true, bed, occupancyRecord };
  },

  /**
   * 4. DISCHARGE PATIENT FROM BED (OCCUPIED -> DIRTY)
   */
  dischargePatientFromBed: (bedCode, { performedBy = 'Perawat Primer', dischargeSummary = '' } = {}) => {
    return bedManagementFsmEngine.transitionBedState(bedCode, BED_STATES.DIRTY, {
      performedBy,
      reason: `Pasien Selesai Rawat Inap (Discharged). ${dischargeSummary}`
    });
  },

  /**
   * 5. TRANSFER PATIENT (SOURCE BED -> TARGET BED)
   */
  transferPatient: (sourceBedCode, targetBedCode, { performedBy = 'Perawat Penanggung Jawab', reason = 'Eskalasi Perawatan' } = {}) => {
    const sourceBed = BED_OPERATIONAL_STORE.beds.find(b => b.bed_code === sourceBedCode);
    const targetBed = BED_OPERATIONAL_STORE.beds.find(b => b.bed_code === targetBedCode);

    if (!sourceBed || !sourceBed.current_occupancy) {
      throw new Error(`Bed asal ${sourceBedCode} tidak memiliki pasien aktif untuk dipindahkan.`);
    }
    if (!targetBed || targetBed.state !== BED_STATES.AVAILABLE) {
      throw new Error(`Bed tujuan ${targetBedCode} tidak tersedia (status: ${targetBed?.state || 'NOT_FOUND'}).`);
    }

    const patient = { ...sourceBed.current_occupancy };

    // 1. Move to Target
    targetBed.state = BED_STATES.OCCUPIED;
    targetBed.current_occupancy = patient;

    // 2. Mark Source as Dirty
    sourceBed.state = BED_STATES.DIRTY;
    sourceBed.current_occupancy = null;
    sourceBed.dirty_since = new Date().toISOString();

    const transferLog = {
      id: `TRF-${Date.now()}`,
      source_bed: sourceBedCode,
      target_bed: targetBedCode,
      patient_name: patient.patient_name,
      mrn: patient.mrn,
      performed_by: performedBy,
      reason,
      timestamp: new Date().toISOString()
    };
    BED_OPERATIONAL_STORE.transfers.unshift(transferLog);

    return { success: true, transferLog, targetBed };
  },

  /**
   * 6. BARBER-JOHNSON EFFICIENCY CALCULATOR & METRICS
   */
  calculateBarberJohnsonIndicators: ({
    totalBeds = 120,
    periodDays = 30,
    patientDays = 2700,
    totalDischarges = 450
  } = {}) => {
    const availableBedDays = totalBeds * periodDays;

    // BOR (Bed Occupancy Rate %) — Standar Kemenkes: 60 - 85%
    const bor = ((patientDays / availableBedDays) * 100);

    // ALOS (Average Length of Stay Hari) — Standar Kemenkes: 3 - 6 Hari
    const alos = (patientDays / totalDischarges);

    // TOI (Turnover Interval Hari) — Standar Kemenkes: 1 - 3 Hari
    const toi = ((availableBedDays - patientDays) / totalDischarges);

    // BTO (Bed Turnover Kali) — Standar: 40 - 50 Kali/tahun (skala periode)
    const bto = (totalDischarges / totalBeds);

    return {
      bor: parseFloat(bor.toFixed(2)),
      alos: parseFloat(alos.toFixed(2)),
      toi: parseFloat(toi.toFixed(2)),
      bto: parseFloat(bto.toFixed(2)),
      benchmarks: {
        isBorOptimal: bor >= 60 && bor <= 85,
        isAlosOptimal: alos >= 3 && alos <= 6,
        isToiOptimal: toi >= 1 && toi <= 3
      },
      // Graph Coordinates for Barber-Johnson Plot (x = TOI, y = BOR)
      graphPlot: {
        x_toi: parseFloat(toi.toFixed(2)),
        y_bor: parseFloat(bor.toFixed(2)),
        isInEfficiencyPolygon: (bor >= 60 && bor <= 85) && (toi >= 1 && toi <= 3)
      }
    };
  },

  /**
   * 7. AI-ASSISTED PREDICTIVE BED AVAILABILITY & LOS ENGINE
   */
  predictBedAvailability: () => {
    const beds = BED_OPERATIONAL_STORE.beds;
    const now = new Date();

    const occupiedBeds = beds.filter(b => b.state === BED_STATES.OCCUPIED && b.current_occupancy);

    const dischargeForecast = occupiedBeds.map(b => {
      const occ = b.current_occupancy;
      const admitDate = new Date(occ.admitted_at);
      const estimatedDischargeDate = new Date(admitDate.getTime() + occ.estimated_los_days * 24 * 60 * 60 * 1000);
      const hoursUntilDischarge = Math.max(0, Math.round((estimatedDischargeDate.getTime() - now.getTime()) / (1000 * 60 * 60)));

      return {
        bedCode: b.bed_code,
        wardName: b.ward_name,
        patientName: occ.patient_name,
        diagnosis: occ.diagnosis_name,
        admittedAt: occ.admitted_at,
        estimatedDischargeDate: estimatedDischargeDate.toISOString(),
        hoursUntilDischarge,
        readinessScore: hoursUntilDischarge <= 24 ? 92 : (hoursUntilDischarge <= 48 ? 75 : 40)
      };
    });

    const readyIn24Hours = dischargeForecast.filter(d => d.hoursUntilDischarge <= 24).length;
    const readyIn48Hours = dischargeForecast.filter(d => d.hoursUntilDischarge <= 48).length;
    const currentAvailable = beds.filter(b => b.state === BED_STATES.AVAILABLE).length;

    return {
      currentAvailable,
      projectedAvailable24h: currentAvailable + readyIn24Hours,
      projectedAvailable48h: currentAvailable + readyIn48Hours,
      dischargeForecast
    };
  },

  /**
   * 8. GET HOUSEKEEPING CLEANING QUEUE
   */
  getHousekeepingQueue: () => {
    return BED_OPERATIONAL_STORE.cleaningLogs;
  },

  /**
   * 9. COMPLETE CLEANING RELEASE (CLEANING -> AVAILABLE)
   */
  completeBedCleaning: (bedCode, housekeeperName = 'Petugas Kebersihan') => {
    const cleanLog = BED_OPERATIONAL_STORE.cleaningLogs.find(c => c.bed_code === bedCode && c.status !== 'COMPLETED');
    if (cleanLog) {
      cleanLog.status = 'COMPLETED';
      cleanLog.completed_at = new Date().toISOString();
      cleanLog.housekeeper_name = housekeeperName;
    }

    return bedManagementFsmEngine.transitionBedState(bedCode, BED_STATES.AVAILABLE, {
      performedBy: housekeeperName,
      reason: 'Pembersihan & Disinfeksi Tempat Tidur Selesai (Siap Pakai)'
    });
  }
};
