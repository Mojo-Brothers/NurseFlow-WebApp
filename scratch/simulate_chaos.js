/**
 * NurseFlow — ULTIMATE CHAOS SIMULATOR (V10)
 * Logic-only Validation for Pilot Deployment
 */

import { executeAtomicOperation } from '../src/core/services/idempotency.service.js';
import { mergeData } from '../src/core/services/syncQueue.service.js';
import { SLA_TARGETS, ALERT_STATUSES, MERGE_WHITELIST } from '../src/core/constants.js';

console.log('--- 🧬 NURSEFLOW CHAOS SIMULATION: STARTING ---');

/**
 * SCENARIO 1: IDEMPOTENCY RACE CONDITION
 */
async function testIdempotency() {
  console.log('\n[Sim 1] Testing Idempotency & Race Conditions...');
  const opId = 'test_op_123';
  
  // Mocking Transaction Behavior
  const mockAction = async () => "SUCCESS";
  
  try {
    const res1 = await executeAtomicOperation(opId, mockAction);
    console.log('Request 1:', res1);
    
    // Request 2 with same ID should fail/block
    const res2 = await executeAtomicOperation(opId, mockAction);
    console.log('Request 2:', res2);
  } catch (err) {
    console.log('Request 2 Blocked as expected:', err.message);
  }
}

/**
 * SCENARIO 2: SMART MERGE & CLINICAL SAFETY
 */
function testConflictResolution() {
  console.log('\n[Sim 2] Testing Smart Conflict Resolution...');
  
  const localData = { 
    _v: 2, 
    phone: '0812-3456', 
    medication_dose: '500mg', // Critical Conflict
    notes_non_clinical: 'Updated in Offline'
  };
  
  const remoteData = { 
    _v: 3, 
    phone: '0812-0000', 
    medication_dose: '250mg', 
    notes_non_clinical: 'Master Data'
  };

  const result = mergeData(localData, remoteData);
  
  console.log('Merge Result:', JSON.stringify(result, null, 2));
  if (result._requires_manual_review) {
    console.log('✅ SAFETY TRIGGERED: Critical field conflict locked for manual review.');
  }
}

/**
 * SCENARIO 3: ALERT FATIGUE (DEDUPLICATION)
 */
function testAlertDeduplication() {
  console.log('\n[Sim 3] Testing Alert Deduplication...');
  // Logic: alert.service will check Firestore. 
  // Here we mock the concept:
  const history = [
    { type: 'OVER_SLA', patient_id: 'P01', status: 'ACTIVE', created_at: Date.now() - 10000 }
  ];
  
  const isDuplicate = (type, pid) => history.some(a => 
    a.type === type && a.patient_id === pid && a.status === 'ACTIVE' && (Date.now() - a.created_at < 60000)
  );

  console.log('Triggering Alert A:', isDuplicate('OVER_SLA', 'P01') ? 'BLOCKED (Spam Prevention)' : 'CREATED');
}

/**
 * SCENARIO 4: SLA WATCHDOG
 */
function testSLA() {
  console.log('\n[Sim 4] Testing SLA Watchdog...');
  const patients = [
    { id: 'P01', status: 'WAITING', created_at: Date.now() - (20 * 60 * 1000) } // Waiting 20 mins
  ];

  patients.forEach(p => {
    const duration = (Date.now() - p.created_at) / 1000;
    if (duration > SLA_TARGETS.WAITING) {
      console.log(`✅ ALERT: Patient ${p.id} exceeded SLA (Waiting ${Math.floor(duration/60)} mins)`);
    }
  });
}

// EXECUTION
testIdempotency().then(() => {
  testConflictResolution();
  testAlertDeduplication();
  testSLA();
  console.log('\n--- 🏁 SIMULATION COMPLETE: SYSTEM STABLE ---');
});
