import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceAdapter, DB_ENGINE_TYPES } from '../src/core/services/persistenceAdapter.service.js';
import { experimentalCohortSeeder, EXPERIMENTAL_COHORT_MANIFEST } from '../src/core/services/experimentalCohortSeeder.service.js';

describe('Sprint 3K: Experimental Cohort Seeder & Deterministic Fixture Suite', () => {
  beforeEach(() => {
    persistenceAdapter.setEngine(DB_ENGINE_TYPES.IN_MEMORY);
  });

  it('1. should contain exactly 10 distinct, fully documented clinical scenarios in manifest', () => {
    expect(EXPERIMENTAL_COHORT_MANIFEST).toHaveLength(10);
    const scenarioIds = EXPERIMENTAL_COHORT_MANIFEST.map(s => s.scenarioId);
    expect(new Set(scenarioIds).size).toBe(10);

    // Verify all 10 scenario IDs match S-01 to S-10
    const expectedIds = ['S-01', 'S-02', 'S-03', 'S-04', 'S-05', 'S-06', 'S-07', 'S-08', 'S-09', 'S-10'];
    expect(scenarioIds).toEqual(expectedIds);
  });

  it('2. should deterministically seed all 10 scenarios into persistence layer without data corruption', async () => {
    const seedResult = await experimentalCohortSeeder.seedCohort();

    expect(seedResult.totalScenarios).toBe(10);
    expect(seedResult.patientsSeeded).toBe(10);
    expect(seedResult.encountersSeeded).toBe(10);
    expect(seedResult.contractsRegistered).toBe(10);
    expect(seedResult.scenarioList).toHaveLength(10);
  });

  it('3. should pass 100% atomic integrity checks on all seeded records', async () => {
    await experimentalCohortSeeder.seedCohort();
    const validationReport = await experimentalCohortSeeder.validateSeededCohort();

    expect(validationReport.passed).toBe(true);
    expect(validationReport.errors).toHaveLength(0);
    expect(validationReport.scenariosVerified).toBe(10);
    expect(validationReport.integrityPercentage).toBe(100);
    expect(validationReport.passedAtomicChecks).toBe(validationReport.totalAtomicChecks);
  });

  it('4. should verify S-05 STEMI & Code Blue scenario contract details', async () => {
    await experimentalCohortSeeder.seedCohort();
    const stemiPatient = await persistenceAdapter.findById('patients', 'PAT-COHORT-S05');
    const stemiEncounter = await persistenceAdapter.findById('encounters', 'ENC-COHORT-S05');
    const stemiContract = await persistenceAdapter.findById('experimental_contracts', 'CONTRACT-S-05');

    expect(stemiPatient.name).toBe('Tn. Farhan');
    expect(stemiPatient.mrn).toBe('MRN-2026-009005');
    expect(stemiEncounter.triageLevel).toBe('ESI-1');
    expect(stemiEncounter.status).toBe('RESUSCITATION');
    expect(stemiContract.expectedContract.codeBlueTriggered).toBe(true);
    expect(stemiContract.expectedContract.cprTimelineLogged).toBe(true);
    expect(stemiContract.expectedContract.cpoeCitoEpinephrineOrdered).toBe(true);
    expect(stemiContract.expectedContract.icuStepUpTransferExecuted).toBe(true);
  });

  it('5. should verify S-06 Stroke Interruption scenario contract details', async () => {
    await experimentalCohortSeeder.seedCohort();
    const strokeEncounter = await persistenceAdapter.findById('encounters', 'ENC-COHORT-S06');
    const strokeContract = await persistenceAdapter.findById('experimental_contracts', 'CONTRACT-S-06');

    expect(strokeEncounter.vitals.gcs).toBe('E4M5V2');
    expect(strokeContract.expectedContract.pacsCtScanOrdered).toBe(true);
    expect(strokeContract.expectedContract.doorToNeedleTimerActive).toBe(true);
    expect(strokeContract.expectedContract.interruptionDraftPersistence3Min).toBe(true);
  });

  it('6. should verify S-07 Penicillin Allergy CDSS Critical Safeguard contract details', async () => {
    await experimentalCohortSeeder.seedCohort();
    const allergyPatient = await persistenceAdapter.findById('patients', 'PAT-COHORT-S07');
    const allergyContract = await persistenceAdapter.findById('experimental_contracts', 'CONTRACT-S-07');

    expect(allergyPatient.allergies).toHaveLength(1);
    expect(allergyPatient.allergies[0].substance).toContain('Penicillin');
    expect(allergyContract.expectedContract.cdssCriticalPrescriptionBlocked).toBe(true);
    expect(allergyContract.expectedContract.overrideHardStopEnforced).toBe(true);
  });

  it('7. should guarantee zero duplicate MRNs and zero patient ID collision across cohort', () => {
    const mrns = EXPERIMENTAL_COHORT_MANIFEST.map(s => s.patient.mrn);
    const n器ks = EXPERIMENTAL_COHORT_MANIFEST.map(s => s.patient.nik);
    const patientIds = EXPERIMENTAL_COHORT_MANIFEST.map(s => s.patient.id);

    expect(new Set(mrns).size).toBe(10);
    expect(new Set(n器ks).size).toBe(10);
    expect(new Set(patientIds).size).toBe(10);
  });
});
