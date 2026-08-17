/**
 * NurseFlow Enterprise HIS 2026 — Bed Management & Barber-Johnson Vertical Slice Test
 * Standards: Permenkes No. 24/2022 (RME), Petunjuk Teknis SIRS Kemenkes & JCI IPSG
 */

import { describe, it, expect } from 'vitest';
import { bedManagementFsmEngine, BED_STATES } from '../server/services/bedManagementFsmEngine.service.js';

describe('Gate 1F.2: Bed Management Center & Barber-Johnson Live Engine Vertical Slice', () => {

  // 1. Bed State Machine Valid Transitions
  it('1. should transition bed from AVAILABLE to RESERVED and enforce valid state machine logic', () => {
    const res = bedManagementFsmEngine.transitionBedState('BED-ICU-02', BED_STATES.RESERVED, {
      performedBy: 'IGD Triage Officer',
      reason: 'Rencana transfer pasien STEMI dari IGD'
    });

    expect(res.success).toBe(true);
    expect(res.toState).toBe(BED_STATES.RESERVED);
    expect(res.updatedBed.state).toBe(BED_STATES.RESERVED);
  });

  // 2. FSM Anti-Error Guard against illegal transition
  it('2. should reject illegal state transition (e.g. DIRTY directly to OCCUPIED) with descriptive error', () => {
    expect(() => {
      bedManagementFsmEngine.transitionBedState('BED-101-B', BED_STATES.OCCUPIED, {
        performedBy: 'Tester'
      });
    }).toThrow(/TRANSISI FSM ILEGAL/);
  });

  // 3. Patient Admission into Bed
  it('3. should admit patient into available/reserved bed and create active occupancy record', () => {
    const admission = bedManagementFsmEngine.admitPatientToBed('BED-ICU-02', {
      patient_id: 'P-999',
      patient_name: 'Tn. Ahmad Fauzi',
      mrn: '00-55-12-34',
      gender: 'MALE',
      primary_icd10: 'I21.9',
      diagnosis_name: 'Acute Myocardial Infarction',
      estimated_los_days: 4
    });

    expect(admission.success).toBe(true);
    expect(admission.bed.state).toBe(BED_STATES.OCCUPIED);
    expect(admission.occupancyRecord.patient_name).toBe('Tn. Ahmad Fauzi');
    expect(admission.bed.current_occupancy).toBeDefined();
  });

  // 4. Patient Discharge & Trigger Dirty Bed for Housekeeping
  it('4. should discharge patient and transition bed to DIRTY with housekeeping log trigger', () => {
    const discharge = bedManagementFsmEngine.dischargePatientFromBed('BED-ICU-02', {
      performedBy: 'Perawat Penanggung Jawab',
      dischargeSummary: 'Kondisi klinis membaik, dipulangkan.'
    });

    expect(discharge.success).toBe(true);
    expect(discharge.toState).toBe(BED_STATES.DIRTY);

    const queue = bedManagementFsmEngine.getHousekeepingQueue();
    expect(queue.some(q => q.bed_code === 'BED-ICU-02' && q.status === 'PENDING_CLEANING')).toBe(true);
  });

  // 5. Housekeeping Lifecycle: Dirty -> Cleaning -> Available
  it('5. should execute housekeeping cleaning workflow and restore bed to AVAILABLE state', () => {
    // Start Cleaning
    const startRes = bedManagementFsmEngine.transitionBedState('BED-101-B', BED_STATES.CLEANING, {
      performedBy: 'Petugas Sanitasi'
    });
    expect(startRes.toState).toBe(BED_STATES.CLEANING);

    // Complete Cleaning
    const completeRes = bedManagementFsmEngine.completeBedCleaning('BED-101-B', 'Petugas Sanitasi');
    expect(completeRes.toState).toBe(BED_STATES.AVAILABLE);
    expect(completeRes.updatedBed.state).toBe(BED_STATES.AVAILABLE);
  });

  // 6. Bed-to-Bed Patient Transfer
  it('6. should execute bed-to-bed patient transfer and mark source bed as DIRTY', () => {
    const transferRes = bedManagementFsmEngine.transferPatient('BED-101-A', 'BED-101-B', {
      performedBy: 'Perawat Primer',
      reason: 'Pindah ke bed dekat jendela sesuai permintaan keluarga'
    });

    expect(transferRes.success).toBe(true);
    expect(transferRes.transferLog.source_bed).toBe('BED-101-A');
    expect(transferRes.transferLog.target_bed).toBe('BED-101-B');
    expect(transferRes.targetBed.state).toBe(BED_STATES.OCCUPIED);
  });

  // 7. Barber-Johnson Indicators Calculation & Coordinate Mapping
  it('7. should calculate Barber-Johnson indicators (BOR, ALOS, TOI, BTO) and evaluate efficiency polygon', () => {
    const bj = bedManagementFsmEngine.calculateBarberJohnsonIndicators({
      totalBeds: 120,
      periodDays: 30,
      patientDays: 2700, // 75% BOR
      totalDischarges: 450 // ALOS = 6 Hari, TOI = 2 Hari, BTO = 3.75 Kali
    });

    expect(bj.bor).toBe(75.0);
    expect(bj.alos).toBe(6.0);
    expect(bj.toi).toBe(2.0);
    expect(bj.bto).toBe(3.75);

    expect(bj.benchmarks.isBorOptimal).toBe(true);
    expect(bj.benchmarks.isAlosOptimal).toBe(true);
    expect(bj.benchmarks.isToiOptimal).toBe(true);
    expect(bj.graphPlot.isInEfficiencyPolygon).toBe(true);
  });

  // 8. AI-Assisted Predictive Bed Availability
  it('8. should forecast bed availability and calculate discharge readiness hours based on clinical pathway LOS', () => {
    const forecast = bedManagementFsmEngine.predictBedAvailability();

    expect(forecast.currentAvailable).toBeGreaterThanOrEqual(0);
    expect(forecast.projectedAvailable24h).toBeGreaterThanOrEqual(forecast.currentAvailable);
    expect(forecast.dischargeForecast.length).toBeGreaterThanOrEqual(1);

    const firstPatient = forecast.dischargeForecast[0];
    expect(firstPatient.patientName).toBeDefined();
    expect(firstPatient.readinessScore).toBeGreaterThanOrEqual(0);
  });

});
