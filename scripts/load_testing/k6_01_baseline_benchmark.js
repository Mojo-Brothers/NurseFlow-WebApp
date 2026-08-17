/**
 * NurseFlow Enterprise HIS 2026 — Sprint 7A: Baseline Latency Benchmark
 * Standard: JCI Infrastructure & Permenkes No. 24/2022
 * Goal: Measure single-user baseline response times across 6 core endpoints with zero load.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 60,
  thresholds: {
    'http_req_duration{endpoint:auth_login}': ['p(95)<100'],
    'http_req_duration{endpoint:emr_cppt}': ['p(95)<150'],
    'http_req_duration{endpoint:orders_cpoe}': ['p(95)<150'],
    'http_req_duration{endpoint:nursing_emar}': ['p(95)<100'],
    'http_req_duration{endpoint:billing_invoicing}': ['p(95)<200'],
    'http_req_duration{endpoint:command_center}': ['p(95)<100'],
    'http_req_failed': ['rate<0.001'], // Zero error allowed
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // 1. Baseline Auth Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: 'dr.surya.johnson',
    password: 'Password123!',
  }), { headers, tags: { endpoint: 'auth_login' } });

  check(loginRes, {
    'Login baseline status is 200': (r) => r.status === 200,
    'Login latency < 100ms': (r) => r.timings.duration < 100,
  });

  const token = loginRes.json('accessToken') || 'MOCK_TOKEN';
  const authHeaders = { ...headers, Authorization: `Bearer ${token}` };

  // 2. Baseline EMR CPPT SOAP Ingestion
  const cpptRes = http.post(`${BASE_URL}/api/emr/soap`, JSON.stringify({
    patient_mrn: '00-49-00-84',
    subjective: 'Pasien mengeluh nyeri dada berkurang',
    objective: 'TD: 130/80 mmHg, Nadi: 82x/m',
    assessment: 'Acute Myocardial Infarction Post-PCI Day 2',
    plan: 'Lanjutkan terapi DAPT & Statin',
  }), { headers: authHeaders, tags: { endpoint: 'emr_cppt' } });

  check(cpptRes, {
    'CPPT baseline status is 200/201': (r) => r.status === 200 || r.status === 201,
    'CPPT latency < 150ms': (r) => r.timings.duration < 150,
  });

  // 3. Baseline CPOE Order Dispatch
  const cpoeRes = http.post(`${BASE_URL}/api/orders/universal`, JSON.stringify({
    order_type: 'LABORATORY',
    patient_mrn: '00-49-00-84',
    tests: ['LOINC-48425-3 (Troponin T)'],
    priority: 'CITO',
  }), { headers: authHeaders, tags: { endpoint: 'orders_cpoe' } });

  check(cpoeRes, {
    'CPOE baseline latency < 150ms': (r) => r.timings.duration < 150,
  });

  // 4. Baseline Nursing eMAR Administration
  const emarRes = http.post(`${BASE_URL}/api/nursing/emar/administer`, JSON.stringify({
    patient_mrn: '00-49-00-84',
    medication_order_id: 'ORD-MED-101',
    five_rights_verified: true,
  }), { headers: authHeaders, tags: { endpoint: 'nursing_emar' } });

  check(emarRes, {
    'eMAR baseline latency < 100ms': (r) => r.timings.duration < 100,
  });

  // 5. Baseline Casemix Billing Grouping
  const billingRes = http.post(`${BASE_URL}/api/billing/casemix/group`, JSON.stringify({
    encounter_id: 'ENC-2026-001',
    primary_icd10: 'I21.0',
    procedures: ['36.06'],
  }), { headers: authHeaders, tags: { endpoint: 'billing_invoicing' } });

  check(billingRes, {
    'Billing baseline latency < 200ms': (r) => r.timings.duration < 200,
  });

  // 6. Baseline Central Command Center
  const cmdRes = http.get(`${BASE_URL}/api/executive/command-center`, {
    headers: authHeaders,
    tags: { endpoint: 'command_center' },
  });

  check(cmdRes, {
    'Command center baseline latency < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}
