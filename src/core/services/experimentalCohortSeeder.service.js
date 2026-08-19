/**
 * NurseFlow Enterprise HIS 2026 — Experimental Cohort Seeder Service
 * Sprint 3K: Deterministic 10-Patient Cohort & Expected Outcome Contracts
 * 
 * Provides isolated, reproducible, and verifiable clinical fixtures
 * for Controlled Pilot Deployment without contaminating live operational records.
 */

import { persistenceAdapter } from './persistenceAdapter.service.js';

export const EXPERIMENTAL_COHORT_MANIFEST = [
  {
    scenarioId: 'S-01',
    scenarioName: 'Pasien Baru Umum (Non-BPJS)',
    acuityLevel: 'LOW',
    patient: {
      id: 'PAT-COHORT-S01',
      mrn: 'MRN-2026-009001',
      nik: '3201015502940001',
      name: 'Ny. Amanda',
      gender: 'FEMALE',
      birthDate: '1994-02-15',
      paymentMethod: 'CASH',
      phone: '081234567001',
      address: 'Jl. Melati No. 12, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S01',
      patientId: 'PAT-COHORT-S01',
      type: 'OUTPATIENT',
      status: 'PLANNED',
      unit: 'ADM-01',
      registeredAt: '2026-08-19T02:00:00.000Z'
    },
    expectedContract: {
      patientIdentityVerified: true,
      generalConsentSigned: true,
      barcodeWristbandIssued: true,
      encounterRegistered: true,
      zeroDuplicateMrn: true
    }
  },
  {
    scenarioId: 'S-02',
    scenarioName: 'Pasien Lama Berulang (Fast-Track RM)',
    acuityLevel: 'LOW',
    patient: {
      id: 'PAT-COHORT-S02',
      mrn: 'MRN-2026-001024',
      nik: '3201011208680002',
      name: 'Tn. Bambang',
      gender: 'MALE',
      birthDate: '1968-08-12',
      paymentMethod: 'BPJS',
      bpjsCardNo: '0001234567890',
      phone: '081234567002',
      address: 'Jl. Cempaka No. 45, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S02',
      patientId: 'PAT-COHORT-S02',
      type: 'OUTPATIENT',
      status: 'CHECKED_IN',
      unit: 'POLI-DALAM',
      registeredAt: '2026-08-19T02:10:00.000Z'
    },
    expectedContract: {
      empiSearchInstant: true,
      bpjsSepConfirmed: true,
      queueCheckinFastTrack: true,
      zeroReRegistrationOverhead: true
    }
  },
  {
    scenarioId: 'S-03',
    scenarioName: 'Demam Berdarah Dengue (DHF Grade II)',
    acuityLevel: 'MEDIUM',
    patient: {
      id: 'PAT-COHORT-S03',
      mrn: 'MRN-2026-009003',
      nik: '3201012304170003',
      name: 'An. Dimas',
      gender: 'MALE',
      birthDate: '2017-04-23',
      paymentMethod: 'BPJS',
      phone: '081234567003',
      address: 'Jl. Kenanga No. 8, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S03',
      patientId: 'PAT-COHORT-S03',
      type: 'INPATIENT',
      status: 'TRIAGED',
      triageLevel: 'ESI-3',
      unit: 'IGD-TRIAGE',
      registeredAt: '2026-08-19T02:20:00.000Z',
      vitals: { hr: 110, rr: 24, temp: 39.1, bp: '100/60', spo2: 98 }
    },
    expectedContract: {
      esiTriageLevel3: true,
      pediatricSoapAssessed: true,
      cdssDhfCarePlanApplied: true,
      inpatientBedAssigned: true
    }
  },
  {
    scenarioId: 'S-04',
    scenarioName: 'Pneumonia Komunitas & Inhalasi',
    acuityLevel: 'MEDIUM',
    patient: {
      id: 'PAT-COHORT-S04',
      mrn: 'MRN-2026-009004',
      nik: '3201016709820004',
      name: 'Ny. Erna',
      gender: 'FEMALE',
      birthDate: '1982-09-27',
      paymentMethod: 'BPJS',
      phone: '081234567004',
      address: 'Jl. Mawar No. 19, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S04',
      patientId: 'PAT-COHORT-S04',
      type: 'INPATIENT',
      status: 'TRIAGED',
      triageLevel: 'ESI-3',
      unit: 'BANGSAL-PARU',
      registeredAt: '2026-08-19T02:30:00.000Z',
      vitals: { hr: 96, rr: 28, temp: 38.6, bp: '120/80', spo2: 91 }
    },
    expectedContract: {
      cpoeMultiItemOrdered: true,
      pharmacyMmu4Reviewed: true,
      bedsideEmarAdministered: true,
      respiratoryOrderTracked: true
    }
  },
  {
    scenarioId: 'S-05',
    scenarioName: 'STEMI Anteroseptal & Code Blue Sudden Arrest Drill',
    acuityLevel: 'HIGH_RESUSCITATION',
    patient: {
      id: 'PAT-COHORT-S05',
      mrn: 'MRN-2026-009005',
      nik: '3201011503740005',
      name: 'Tn. Farhan',
      gender: 'MALE',
      birthDate: '1974-03-15',
      paymentMethod: 'BPJS',
      phone: '081234567005',
      address: 'Jl. Anggrek No. 3, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S05',
      patientId: 'PAT-COHORT-S05',
      type: 'EMERGENCY',
      status: 'RESUSCITATION',
      triageLevel: 'ESI-1',
      unit: 'IGD-RESUSITASI',
      registeredAt: '2026-08-19T02:00:00.000Z',
      vitals: { hr: 135, rr: 32, temp: 36.8, bp: '75/40', spo2: 88 }
    },
    expectedContract: {
      esi1TriageImmediate: true,
      codeBlueTriggered: true,
      cprTimelineLogged: true,
      defibrillationRecorded: true,
      cpoeCitoEpinephrineOrdered: true,
      bedsideEmarScanned: true,
      icuStepUpTransferExecuted: true,
      auditTrailImmutable: true
    }
  },
  {
    scenarioId: 'S-06',
    scenarioName: 'Stroke Iskemik Akut & Interruption Stress Test',
    acuityLevel: 'HIGH_CITO',
    patient: {
      id: 'PAT-COHORT-S06',
      mrn: 'MRN-2026-009006',
      nik: '3201015011660006',
      name: 'Ny. Gina',
      gender: 'FEMALE',
      birthDate: '1966-11-10',
      paymentMethod: 'BPJS',
      phone: '081234567006',
      address: 'Jl. Dahlia No. 77, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S06',
      patientId: 'PAT-COHORT-S06',
      type: 'EMERGENCY',
      status: 'TRIAGED',
      triageLevel: 'ESI-2',
      unit: 'IGD-CITO',
      registeredAt: '2026-08-19T02:40:00.000Z',
      vitals: { hr: 98, rr: 20, temp: 37.0, bp: '185/105', spo2: 97, gcs: 'E4M5V2' }
    },
    expectedContract: {
      gcsNihssScored: true,
      pacsCtScanOrdered: true,
      doorToNeedleTimerActive: true,
      interruptionDraftPersistence3Min: true,
      zeroContextLeakage: true
    }
  },
  {
    scenarioId: 'S-07',
    scenarioName: 'Alergi Berat Penisilin (CDSS Critical Safeguard Block)',
    acuityLevel: 'HIGH_CRITICAL_SAFETY',
    patient: {
      id: 'PAT-COHORT-S07',
      mrn: 'MRN-2026-009007',
      nik: '3201011805810007',
      name: 'Tn. Gunawan',
      gender: 'MALE',
      birthDate: '1981-05-18',
      paymentMethod: 'ASURANSI_SWASTA',
      phone: '081234567007',
      address: 'Jl. Teratai No. 22, Jakarta',
      allergies: [
        {
          id: 'ALG-001',
          substance: 'Penicillin / Amoxicillin',
          reaction: 'Anaphylactic Shock & Angioedema',
          severity: 'FATAL',
          recordedAt: '2025-01-10T08:00:00.000Z'
        }
      ]
    },
    encounter: {
      id: 'ENC-COHORT-S07',
      patientId: 'PAT-COHORT-S07',
      type: 'OUTPATIENT',
      status: 'IN_CONSULTATION',
      unit: 'POLI-UROLOGI',
      registeredAt: '2026-08-19T03:00:00.000Z'
    },
    expectedContract: {
      allergyBannerActive: true,
      cdssCriticalPrescriptionBlocked: true,
      overrideHardStopEnforced: true,
      safeAlternativeAccepted: true
    }
  },
  {
    scenarioId: 'S-08',
    scenarioName: 'Appendicitis Akut Perforasi & Operasi CITO IBS (WHO Checklist)',
    acuityLevel: 'VERY_HIGH_SURGICAL',
    patient: {
      id: 'PAT-COHORT-S08',
      mrn: 'MRN-2026-009008',
      nik: '3201010508030008',
      name: 'Sdr. Eko',
      gender: 'MALE',
      birthDate: '2003-08-05',
      paymentMethod: 'BPJS',
      phone: '081234567008',
      address: 'Jl. Flamboyan No. 9, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S08',
      patientId: 'PAT-COHORT-S08',
      type: 'EMERGENCY',
      status: 'SURGICAL_PREP',
      triageLevel: 'ESI-2',
      unit: 'IBS-OK-02',
      registeredAt: '2026-08-19T03:15:00.000Z',
      vitals: { hr: 118, rr: 22, temp: 39.0, bp: '110/70', spo2: 98 }
    },
    expectedContract: {
      surgicalCitoConsulted: true,
      operatingTheatreBooked: true,
      whoChecklistSignInVerified: true,
      whoChecklistTimeOutVerified: true,
      whoChecklistSignOutVerified: true,
      postOpRecoveryTransferred: true
    }
  },
  {
    scenarioId: 'S-09',
    scenarioName: 'Sepsis Berat, Syok & Shift Handover Continuity Drill',
    acuityLevel: 'VERY_HIGH_ICU',
    patient: {
      id: 'PAT-COHORT-S09',
      mrn: 'MRN-2026-009009',
      nik: '3201014101550009',
      name: 'Ny. Hartini',
      gender: 'FEMALE',
      birthDate: '1955-01-01',
      paymentMethod: 'BPJS',
      phone: '081234567009',
      address: 'Jl. Bougenville No. 60, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S09',
      patientId: 'PAT-COHORT-S09',
      type: 'INPATIENT',
      status: 'ICU_ADMITTED',
      triageLevel: 'ESI-1',
      unit: 'ICU-BED-04',
      registeredAt: '2026-08-19T02:00:00.000Z',
      vitals: { hr: 128, rr: 30, temp: 39.5, bp: '80/50', spo2: 89, lactate: 4.2 }
    },
    expectedContract: {
      qsofaCalculated: true,
      fluidResuscitationRecorded: true,
      icuAdtBedAllocated: true,
      sbarHandoverImmutablyStored: true,
      morningShiftContinuityVerified: true
    }
  },
  {
    scenarioId: 'S-10',
    scenarioName: 'Discharge Summary Pasien Pulang & Billing Settlement',
    acuityLevel: 'MEDIUM_DISCHARGE',
    patient: {
      id: 'PAT-COHORT-S10',
      mrn: 'MRN-2026-009010',
      nik: '3201012010860010',
      name: 'Tn. Indra',
      gender: 'MALE',
      birthDate: '1986-10-20',
      paymentMethod: 'ASURANSI_SWASTA',
      phone: '081234567010',
      address: 'Jl. Alamanda No. 14, Jakarta',
      allergies: []
    },
    encounter: {
      id: 'ENC-COHORT-S10',
      patientId: 'PAT-COHORT-S10',
      type: 'INPATIENT',
      status: 'DISCHARGE_READY',
      unit: 'BANGSAL-INTERNA-BED-02',
      registeredAt: '2026-08-14T08:00:00.000Z'
    },
    expectedContract: {
      dischargeSummarySignedByDpjp: true,
      encounterStateLockedClosed: true,
      billingInvoiceSettled: true,
      bedReleasedToHousekeeping: true
    }
  }
];

export class ExperimentalCohortSeederService {
  constructor() {
    this.manifest = EXPERIMENTAL_COHORT_MANIFEST;
  }

  /**
   * Seed all 10 experimental patient scenarios deterministically
   */
  async seedCohort() {
    const results = {
      seededAt: new Date().toISOString(),
      totalScenarios: this.manifest.length,
      patientsSeeded: 0,
      encountersSeeded: 0,
      contractsRegistered: 0,
      scenarioList: []
    };

    for (const item of this.manifest) {
      // 1. Seed Master Patient
      await persistenceAdapter.save('patients', item.patient.id, item.patient);
      results.patientsSeeded++;

      // 2. Seed Initial Encounter
      await persistenceAdapter.save('encounters', item.encounter.id, item.encounter);
      results.encountersSeeded++;

      // 3. Seed Expected Contract in Audit Memory
      await persistenceAdapter.save('experimental_contracts', `CONTRACT-${item.scenarioId}`, {
        id: `CONTRACT-${item.scenarioId}`,
        scenarioId: item.scenarioId,
        scenarioName: item.scenarioName,
        acuityLevel: item.acuityLevel,
        expectedContract: item.expectedContract,
        createdAt: new Date().toISOString()
      });
      results.contractsRegistered++;

      results.scenarioList.push({
        scenarioId: item.scenarioId,
        patientName: item.patient.name,
        mrn: item.patient.mrn,
        acuityLevel: item.acuityLevel,
        status: 'READY'
      });
    }

    return results;
  }

  /**
   * Validate integrity of the seeded cohort
   */
  async validateSeededCohort() {
    const report = {
      validatedAt: new Date().toISOString(),
      passed: true,
      totalAtomicChecks: 0,
      passedAtomicChecks: 0,
      scenariosVerified: 0,
      errors: []
    };

    for (const item of this.manifest) {
      // Check 1: Patient exists in persistence
      const p = await persistenceAdapter.findById('patients', item.patient.id);
      report.totalAtomicChecks++;
      if (!p || p.mrn !== item.patient.mrn || p.nik !== item.patient.nik) {
        report.passed = false;
        report.errors.push(`Patient identity mismatch for ${item.scenarioId}`);
      } else {
        report.passedAtomicChecks++;
      }

      // Check 2: Encounter exists in persistence
      const enc = await persistenceAdapter.findById('encounters', item.encounter.id);
      report.totalAtomicChecks++;
      if (!enc || enc.patientId !== item.patient.id) {
        report.passed = false;
        report.errors.push(`Encounter linkage mismatch for ${item.scenarioId}`);
      } else {
        report.passedAtomicChecks++;
      }

      // Check 3: Contract exists
      const contract = await persistenceAdapter.findById('experimental_contracts', `CONTRACT-${item.scenarioId}`);
      report.totalAtomicChecks++;
      if (!contract || !contract.expectedContract) {
        report.passed = false;
        report.errors.push(`Expected Contract missing for ${item.scenarioId}`);
      } else {
        report.passedAtomicChecks++;
      }

      // Check 4: Allergy context integrity
      if (item.patient.allergies && item.patient.allergies.length > 0) {
        report.totalAtomicChecks++;
        if (p.allergies.length !== item.patient.allergies.length) {
          report.passed = false;
          report.errors.push(`Allergy list length mismatch for ${item.scenarioId}`);
        } else {
          report.passedAtomicChecks++;
        }
      }

      report.scenariosVerified++;
    }

    report.integrityPercentage = (report.passedAtomicChecks / report.totalAtomicChecks) * 100;
    return report;
  }
}

export const experimentalCohortSeeder = new ExperimentalCohortSeederService();
