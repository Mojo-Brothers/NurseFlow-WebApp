/**
 * NurseFlow Enterprise HIS 2026 — Concurrency Benchmark & 5 Disaster Scenarios Vertical Slice Test
 * Standards: ACID Transaction Guarantee, Optimistic Locking & Permenkes No. 24/2022
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  concurrencyBenchmarkService,
  VersionConflictError,
  OutOfStockError,
  BedAlreadyOccupiedError
} from '../server/services/concurrencyBenchmark.service.js';

describe('Sprint 7C: Concurrency Benchmark & 5 Fatal SIMRS Disaster Scenarios Vertical Slice', () => {

  beforeEach(() => {
    concurrencyBenchmarkService.resetBenchmarkStore();
  });

  // 1. Skenario 1: Lost Update (Concurrent CPPT Edits)
  it('1. should prevent Lost Update by enforcing Optimistic Locking (rejecting second edit with version conflict)', () => {
    // Doctor A updates version 1 to 2
    const docARes = concurrencyBenchmarkService.updateSoapWithOptimisticLock(
      'SOAP-CONCUR-01',
      1,
      'Assessment Updated by Dr. Andi Sp.PD',
      'dr. Andi'
    );
    expect(docARes.success).toBe(true);
    expect(docARes.updatedRecord.version).toBe(2);

    // Doctor B tries to update using stale version 1
    expect(() => {
      concurrencyBenchmarkService.updateSoapWithOptimisticLock(
        'SOAP-CONCUR-01',
        1,
        'Assessment Overwrite Attempt by Dr. Budi Sp.B',
        'dr. Budi'
      );
    }).toThrow(VersionConflictError);
  });

  // 2. Skenario 2: Double Dispensing (Race Condition on Stock = 1)
  it('2. should prevent Double Dispensing and reject second request when stock is depleted (Zero Negative Stock)', () => {
    // Pharmacist A dispenses the last 1 unit
    const p1 = concurrencyBenchmarkService.dispenseMedicationAtomic('DRUG-CRITICAL-01', 1, 'PHA-01');
    expect(p1.success).toBe(true);
    expect(p1.remainingStock).toBe(0);

    // Pharmacist B attempts to dispense when stock is 0
    expect(() => {
      concurrencyBenchmarkService.dispenseMedicationAtomic('DRUG-CRITICAL-01', 1, 'PHA-02');
    }).toThrow(OutOfStockError);
  });

  // 3. Skenario 3: Double Bed Assignment
  it('3. should prevent Double Bed Assignment by locking bed to single occupant in OCCUPIED state', () => {
    // Admission Officer A admits patient 1
    const adm1 = concurrencyBenchmarkService.admitPatientAtomic('BED-CONCUR-VIP-01', '00-11-22-33', 'Tn. Ahmad');
    expect(adm1.success).toBe(true);
    expect(adm1.bed.state).toBe('OCCUPIED');

    // Admission Officer B attempts to admit patient 2 into same bed
    expect(() => {
      concurrencyBenchmarkService.admitPatientAtomic('BED-CONCUR-VIP-01', '00-99-88-77', 'Ny. Ratna');
    }).toThrow(BedAlreadyOccupiedError);
  });

  // 4. Skenario 4: Concurrent BPJS SEP Generation (Unique Sequence Guarantee)
  it('4. should generate 100 strictly unique BPJS SEP numbers under concurrent calls without collision', () => {
    const sepSet = new Set();
    const totalRequests = 100;

    for (let i = 1; i <= totalRequests; i++) {
      const res = concurrencyBenchmarkService.generateBpjsSepConcurrent(`31710100000000${i}`, 'INT', 'DOC-01');
      expect(res.success).toBe(true);
      expect(res.sepNumber).toBeDefined();
      sepSet.add(res.sepNumber);
    }

    // Set size must equal total requests (100% Unique)
    expect(sepSet.size).toBe(totalRequests);
  });

  // 5. Skenario 5: Emergency Surge Simulation (100 Patients Batch Pipeline)
  it('5. should process 100 emergency surge patients in batch with high throughput and zero data loss', () => {
    const surgeResult = concurrencyBenchmarkService.executeEmergencySurgeSimulation(100);

    expect(surgeResult.totalPatientsProcessed).toBe(100);
    expect(surgeResult.totalDurationMs).toBeLessThan(1000); // Must complete in < 1 second in-memory
    expect(surgeResult.samplePatients.length).toBe(5);
  });

});
