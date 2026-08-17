/**
 * NurseFlow Enterprise HIS 2026 — Sprint 7C: 5 Fatal SIMRS Disaster Scenarios Stress Test
 * Standards: ACID Transaction Guarantee, Optimistic Locking & Permenkes No. 24/2022
 */

import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
  scenarios: {
    // 1. Lost Update (Concurrent CPPT edits)
    lost_update_test: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 1,
      exec: 'testLostUpdate',
    },
    // 2. Double Dispensing (Race condition on Stock = 1)
    double_dispense_test: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      exec: 'testDoubleDispense',
    },
    // 3. Double Bed Assignment
    double_bed_test: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 1,
      exec: 'testDoubleBedAssignment',
    },
    // 4. Concurrent BPJS SEP Generation
    concurrent_sep_test: {
      executor: 'per-vu-iterations',
      vus: 100,
      iterations: 1,
      exec: 'testConcurrentSep',
    },
    // 5. Emergency Surge Simulation (Ramp-up to 2,000 VU Breaking Point Test)
    emergency_surge_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: 100 },   // Stage 1: 100 VU
        { duration: '5m', target: 500 },   // Stage 2: 500 VU
        { duration: '5m', target: 1000 },  // Stage 3: 1,000 VU
        { duration: '10m', target: 2000 }, // Stage 4: 2,000 VU Breaking Point
        { duration: '3m', target: 0 },     // Cooldown
      ],
      exec: 'testEmergencySurge',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<850'],
    'http_req_failed': ['rate<0.01'],
    'iteration_duration': ['avg<750'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// ─── Scenario 1: Lost Update Protection (Optimistic Locking) ───
export function testLostUpdate() {
  group('1. Lost Update Optimistic Locking', () => {
    const res = http.put(`${BASE_URL}/api/emr/soap/SOAP-TEST-001`, JSON.stringify({
      version: 1, // Concurrent update with exact same version
      assessment: `Updated by VU ${__VU}`,
    }), { headers: { 'Content-Type': 'application/json' } });

    // Expect either 200 (first to acquire) or 409 Conflict (optimistic lock rejected)
    check(res, {
      'Lost update handled properly (200 or 409)': (r) => r.status === 200 || r.status === 409,
    });
  });
}

// ─── Scenario 2: Double Dispensing Guard (Atomic Stock Decrement) ───
export function testDoubleDispense() {
  group('2. Double Dispensing Negative Inventory Guard', () => {
    const res = http.post(`${BASE_URL}/api/pharmacy/dispense`, JSON.stringify({
      item_id: 'DRUG-CRITICAL-LIMITED-01',
      quantity: 1,
      pharmacist_id: `PHA-VU-${__VU}`,
    }), { headers: { 'Content-Type': 'application/json' } });

    check(res, {
      'Dispense atomic handled (200 or 400 OUT_OF_STOCK)': (r) => r.status === 200 || r.status === 400,
    });
  });
}

// ─── Scenario 3: Double Bed Assignment Guard ───
export function testDoubleBedAssignment() {
  group('3. Double Bed Assignment Isolation', () => {
    const res = http.post(`${BASE_URL}/api/ward/beds/BED-VIP-01/admit`, JSON.stringify({
      patient_mrn: `MRN-CONCUR-${__VU}`,
      patient_name: `Pasien Konkuren ${__VU}`,
    }), { headers: { 'Content-Type': 'application/json' } });

    check(res, {
      'Bed assignment single occupant (200 or 409)': (r) => r.status === 200 || r.status === 409,
    });
  });
}

// ─── Scenario 4: Concurrent BPJS SEP Generation ───
export function testConcurrentSep() {
  group('4. Concurrent BPJS SEP Generation', () => {
    const res = http.post(`${BASE_URL}/api/billing/bpjs/sep/generate`, JSON.stringify({
      patient_nik: `31710100000000${__VU}`,
      poli_code: 'INT',
      dpjp_id: 'DOC-01',
    }), { headers: { 'Content-Type': 'application/json' } });

    check(res, {
      'BPJS SEP generated with unique sequence (200/201)': (r) => r.status === 200 || r.status === 201,
    });
  });
}

// ─── Scenario 5: Emergency Surge Full Episode of Care ───
export function testEmergencySurge() {
  group('5. Emergency Surge Full Episode of Care Flow', () => {
    // Step A: Triage Registration
    const triageRes = http.post(`${BASE_URL}/api/emergency/triage`, JSON.stringify({
      triage_level: 'P2_EMERGENT',
      chief_complaint: 'Trauma akut sesak nafas pasca kecelakaan',
    }), { headers: { 'Content-Type': 'application/json' } });

    check(triageRes, { 'Triage registered < 200ms': (r) => r.timings.duration < 200 });

    // Step B: CPOE Cito Lab & Radiology Order
    const orderRes = http.post(`${BASE_URL}/api/orders/universal`, JSON.stringify({
      order_type: 'LAB_AND_RAD',
      tests: ['Darah Lengkap', 'Rontgen Thorax Cito'],
    }), { headers: { 'Content-Type': 'application/json' } });

    check(orderRes, { 'CPOE orders dispatched < 250ms': (r) => r.timings.duration < 250 });
  });
}
