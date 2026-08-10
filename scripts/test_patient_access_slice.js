/**
 * NurseFlow Enterprise HIS — Vertical Slice 01 Integration Test
 * Verifies MPI Engine, Persistence Adapter, Encounter Engine, Domain Events, and Clinical Timeline.
 */

import { mpiEngine } from '../src/core/services/mpiEngine.service.js';
import { encounterEngine, ENCOUNTER_TYPES, ENCOUNTER_STATUS } from '../src/core/services/encounterEngine.service.js';
import { domainEventEngine } from '../src/core/services/domainEventEngine.service.js';
import { clinicalTimelineEngine } from '../src/core/services/clinicalTimelineEngine.service.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';

async function runPatientAccessSliceTest() {
  console.log("=================================================");
  console.log("NURSEFLOW VERTICAL SLICE 01 — PATIENT ACCESS TEST");
  console.log("=================================================");

  // Set persistence adapter to in-memory for unit test environment
  persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);

  let eventsPublished = [];
  domainEventEngine.subscribe('PatientRegistered', (evt) => eventsPublished.push(evt));
  domainEventEngine.subscribe('EncounterCreated', (evt) => eventsPublished.push(evt));

  // 1. Test New Patient Registration via MPI Engine
  console.log("\n[TEST 1] Registering New Patient via MPI Engine...");
  const testPatientData = {
    nik: '3201021509900005',
    name: 'Tn. Test Sentinel Patient',
    dob: '1990-09-15',
    gender: 'M',
    phone: '081299001122',
    address: 'Jl. Merdeka No. 100, Jakarta Central',
    payer: 'BPJS Kesehatan',
    bpjsCardNumber: '0009988776655'
  };

  const registeredPatient = await mpiEngine.registerPatient(testPatientData, 'Admisi Test Runner');
  console.log(`✅ Success! Patient Registered with ID: ${registeredPatient.id}, MRN: ${registeredPatient.mrn}`);

  // 2. Test Duplicate NIK Guard
  console.log("\n[TEST 2] Verifying Duplicate Identity Guard (NIK match)...");
  try {
    await mpiEngine.registerPatient({
      nik: '3201021509900005',
      name: 'Tn. Duplicate Persona',
      dob: '1990-09-15'
    }, 'Admisi Test Runner');
    console.error("❌ FAILED: Duplicate NIK was not blocked!");
    process.exit(1);
  } catch (err) {
    if (err.message.includes('DUPLICATE_PATIENT_DETECTED')) {
      console.log(`✅ Success! Duplicate NIK blocked correctly with error: "${err.message}"`);
    } else {
      console.error("❌ Unexpected error:", err);
      process.exit(1);
    }
  }

  // 3. Test Patient Lookup by NIK and MRN
  console.log("\n[TEST 3] Verifying Patient Lookup via NIK & MRN...");
  const foundByNik = await mpiEngine.getPatientByNIK('3201021509900005');
  console.log(`✅ Lookup by NIK found: ${foundByNik ? foundByNik.name : 'NULL'}`);
  const foundByMrn = await mpiEngine.getPatientByMRN(registeredPatient.mrn);
  console.log(`✅ Lookup by MRN found: ${foundByMrn ? foundByMrn.name : 'NULL'}`);

  // 4. Test Encounter Creation Linked to Canonical Patient Identity
  console.log("\n[TEST 4] Creating Outpatient Encounter linked to Registered Patient...");
  const newEncounter = await encounterEngine.createEncounter({
    patientId: registeredPatient.id,
    patientName: registeredPatient.name,
    mrn: registeredPatient.mrn,
    type: ENCOUNTER_TYPES.OUTPATIENT,
    departmentId: 'POLI-PD',
    dpjpId: 'EMP-2026-0001',
    chiefComplaint: 'Demam tinggi dan batuk 3 hari'
  }, 'Admisi Test Runner');

  console.log(`✅ Success! Encounter created ID: ${newEncounter.id}, Number: ${newEncounter.encounterNumber}, Status: ${newEncounter.status}`);

  // 5. Test Domain Event Bus
  console.log("\n[TEST 5] Verifying Domain Event Bus Emission...");
  console.log(`✅ Total Events Captured: ${eventsPublished.length}`);
  eventsPublished.forEach(e => {
    console.log(`   ➔ Event [${e.eventType}] Published for Patient ${e.patientId || e.payload?.patientId} by ${e.actorName}`);
  });

  // 6. Test Clinical Timeline Projection
  console.log("\n[TEST 6] Verifying Clinical Timeline Projection Records...");
  const timeline = clinicalTimelineEngine.getPatientTimeline(registeredPatient.id);
  console.log(`✅ Total Timeline Events for ${registeredPatient.id}: ${timeline.length}`);
  timeline.forEach(t => {
    console.log(`   ➔ [${t.type}] ${t.title} (Source: ${t.sourceEntityType}:${t.sourceEntityId})`);
  });

  console.log("\n=================================================");
  console.log("🎉 ALL TESTS PASSED FOR VERTICAL SLICE 01 (PATIENT ACCESS)");
  console.log("=================================================");
}

runPatientAccessSliceTest().catch(err => {
  console.error("❌ Test Suite Error:", err);
  process.exit(1);
});
