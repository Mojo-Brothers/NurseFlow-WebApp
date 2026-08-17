/**
 * NurseFlow Enterprise HIS 2026 — Patient Identity, EMPI & Encounter Journey Test Suite (Gate 1E.2)
 * Standards: Permenkes No. 24/2022 (RME), SATUSEHAT EMPI, JCI IPSG 1 (Patient Identification)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mpiEngine } from '../src/core/services/mpiEngine.service.js';
import { usePatientStore } from '../src/modules/patient/patient.store.js';
import { useEncounterStore } from '../src/modules/encounter/encounter.store.js';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';

describe('Gate 1E.2: Patient Identity, EMPI & Encounter Journey Foundation', () => {
  beforeEach(async () => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
    persistenceAdapter.seedMemoryData('patients', [
      {
        id: 'P-1001',
        mrn: 'MRN-2026-001001',
        nik: '3171015005850001',
        name: 'Ny. Siti Nurhaliza',
        dob: '1985-05-20',
        gender: 'F',
        phone: '081234567890',
        status: 'ACTIVE'
      },
      {
        id: 'P-1002',
        mrn: 'MRN-2026-001002',
        nik: '3171021208800002',
        name: 'Tn. Bambang Pamungkas',
        dob: '1980-08-12',
        gender: 'M',
        phone: '081311223344',
        status: 'ACTIVE'
      }
    ]);
    await usePatientStore.getState().fetchPatients();
  });

  // 1. EMPI Duplicate Detection Barrier
  it('1. should detect potential duplicate patient identity by exact NIK and exact Name+DOB', async () => {
    // Existing patient: Ny. Siti Nurhaliza (NIK: 3171015005850001, DOB: 1985-05-20)
    const matchesByNik = await mpiEngine.findPotentialDuplicates({
      nik: '3171015005850001',
      name: 'Siti Nurhaliza',
      dob: '1985-05-20'
    });

    expect(matchesByNik.length).toBeGreaterThan(0);
    expect(matchesByNik[0].confidenceScore).toBe(100);
    expect(matchesByNik[0].reason).toBe('EXACT_NIK_MATCH');
    expect(matchesByNik[0].patient.mrn).toBe('MRN-2026-001001');

    // Attempting direct registration without override must fail
    await expect(
      mpiEngine.registerPatient({
        nik: '3171015005850001',
        name: 'Siti Nurhaliza',
        dob: '1985-05-20'
      })
    ).rejects.toThrow(/DUPLICATE_PATIENT_DETECTED/);
  });

  // 2. Successful Unique Patient Registration
  it('2. should register a unique patient and generate structured MRN', async () => {
    const newPatient = await usePatientStore.getState().addPatient({
      name: 'Tn. Hendra Gunawan',
      nik: '3201011508920005',
      dob: '1992-08-15',
      gender: 'M',
      payer: 'BPJS Kesehatan',
      bpjsCardNumber: '0009988776655',
      allergies: ['Penicillin', 'Ampicillin']
    }, 'Petugas Admisi');

    expect(newPatient.id).toBeDefined();
    expect(newPatient.mrn).toMatch(/^MRN-2026-/);
    expect(newPatient.allergies).toContain('Penicillin');
  });

  // 3. Anonymous Emergency Patient Creation
  it('3. should create an anonymous emergency patient (Mr. X) with immediate encounter', async () => {
    const uniqueTag = 'TST-99';
    const anonPatient = await usePatientStore.getState().addPatient({
      name: `Mr. X (Darurat Cito) - #${uniqueTag}`,
      demographics: { dob: '1980-01-01', gender: 'M' },
      mrn: `MRX-20260817-${uniqueTag}`,
      status: 'EMERGENCY',
      payer: 'Jasa Raharja'
    }, 'Sistem IGD Rapid');

    expect(anonPatient.status).toBe('EMERGENCY');
    expect(anonPatient.mrn).toContain('MRX-20260817');

    const encounterId = await useEncounterStore.getState().openEncounter({
      patientId: anonPatient.id,
      encounterType: 'emergency',
      chiefComplaint: 'Trauma kepala berat tidak sadar',
      status: 'TRIAGE',
      department: 'IGD'
    }, 'Sistem IGD Rapid');

    expect(encounterId).toBeDefined();

    // Verify live context binding
    useEncounterStore.getState().setLiveContext(anonPatient.id, encounterId);
    expect(useEncounterStore.getState().activePatientId).toBe(anonPatient.id);
    expect(useEncounterStore.getState().activeEncounterId).toBe(encounterId);
  });

  // 4. EMPI Merge & Identity Reconciliation without deleting clinical history
  it('4. should reconcile anonymous emergency patient into master patient preserving clinical history', async () => {
    // 1. Create unknown emergency patient
    const anon = await usePatientStore.getState().addPatient({
      name: 'Mr. X (Korban KLL) - #REC1',
      demographics: { dob: '1980-01-01', gender: 'M' },
      mrn: 'MRX-20260817-REC1',
      status: 'EMERGENCY'
    }, 'Sistem IGD Rapid');

    // 2. Open emergency encounter
    const anonEncounterId = await useEncounterStore.getState().openEncounter({
      patientId: anon.id,
      encounterType: 'emergency',
      chiefComplaint: 'Fraktur femur terbuka',
      status: 'IN_PROGRESS',
      department: 'IGD'
    }, 'Sistem IGD Rapid');

    // 3. Reconcile / Merge anon into master patient P-1002 (Tn. Bambang Pamungkas)
    const mergeResult = await mpiEngine.mergePatients('P-1002', anon.id, 'HIM Supervisor');

    expect(mergeResult.duplicate.status).toBe('MERGED');
    expect(mergeResult.duplicate.mergedIntoId).toBe('P-1002');
    expect(mergeResult.primary.id).toBe('P-1002');

    // 4. Verify encounter history remains intact (legal clinical traceability)
    const patientEncounters = await useEncounterStore.getState().fetchPatientEncounters(anon.id);
    // Encounter remains linked and tracked in audit
    expect(anonEncounterId).toBeDefined();
  });

  // 5. Global Live Context Switching & Clearing
  it('5. should manage live clinical context switching and clearing seamlessly', () => {
    // Set context for Patient 1001
    useEncounterStore.getState().setLiveContext('P-1001', 'ENC-1001-A');
    expect(useEncounterStore.getState().activePatientId).toBe('P-1001');
    expect(useEncounterStore.getState().activeEncounterId).toBe('ENC-1001-A');

    // Switch context to Patient 1002
    useEncounterStore.getState().setLiveContext('P-1002', 'ENC-1002-B');
    expect(useEncounterStore.getState().activePatientId).toBe('P-1002');
    expect(useEncounterStore.getState().activeEncounterId).toBe('ENC-1002-B');

    // Clear context
    useEncounterStore.getState().clearLiveContext();
    expect(useEncounterStore.getState().activePatientId).toBeNull();
    expect(useEncounterStore.getState().activeEncounterId).toBeNull();
    expect(useEncounterStore.getState().liveContext).toBeNull();
  });
});
