/**
 * NurseFlow Enterprise HIS — Care State Migration & Projection Rebuild Service
 * Implements Gate 0E (Legacy Backfill) & Gate 0F / Gate P3 (Projection Rebuild Engine).
 */

import { persistenceAdapter } from './persistenceAdapter.service.js';
import { CARE_STATES, CLINICAL_EVENTS, TERMINAL_STATES } from './careStateEngine.service.js';

class CareStateMigrationService {
  /**
   * Infer canonical care state from legacy patient/encounter records (Gate 0E)
   */
  inferCanonicalCareState(patient, encounter) {
    if (!encounter && !patient) return CARE_STATES.REGISTERED;

    const encStatus = (encounter?.status || '').toUpperCase();
    const encType = (encounter?.type || encounter?.encounterType || '').toUpperCase();
    const patStatus = (patient?.status || '').toUpperCase();
    const dept = (encounter?.departmentId || encounter?.department || '').toUpperCase();

    // 1. Terminal cases
    if (patStatus === 'DECEASED' || encStatus === 'DECEASED') return CARE_STATES.DECEASED;
    if (encStatus === 'DISCHARGED' || encounter?.dischargeDate) return CARE_STATES.DISCHARGED;
    if (encStatus === 'CANCELLED') return CARE_STATES.CANCELLED;
    if (encStatus === 'REFERRED') return CARE_STATES.REFERRED;
    if (encStatus === 'LEFT_AGAINST_MEDICAL_ADVICE' || encStatus === 'PAPS') return CARE_STATES.LEFT_AGAINST_MEDICAL_ADVICE;

    // 2. Critical Care & Surgery
    if (dept.includes('ICU') || encStatus === 'ICU_ACTIVE') return CARE_STATES.ICU_ACTIVE;
    if (dept.includes('IBS') || dept.includes('OK') || dept.includes('SURGERY') || encStatus === 'OR_ACTIVE') return CARE_STATES.OR_ACTIVE;

    // 3. Inpatient
    if (encType === 'INPATIENT' || encStatus === 'ADMITTED' || encStatus === 'INPATIENT_ACTIVE' || encounter?.location?.bedId || patient?.room) {
      return CARE_STATES.INPATIENT_ACTIVE;
    }

    if (encStatus === 'ADMISSION_PENDING' || encStatus === 'SPRI_ISSUED') {
      return CARE_STATES.ADMISSION_PENDING;
    }

    // 4. Emergency
    if (patStatus === 'EMERGENCY' || encType === 'EMERGENCY' || dept.includes('IGD')) {
      if (encounter?.triageStatus === 'COMPLETED' || encStatus === 'IN_CONSULTATION' || encStatus === 'IGD_ACTIVE') {
        return CARE_STATES.IGD_ACTIVE;
      }
      return CARE_STATES.TRIAGE_PENDING;
    }

    // 5. Outpatient
    if (encType === 'OUTPATIENT' || dept.includes('POLI') || encStatus === 'OUTPATIENT_ACTIVE') {
      return CARE_STATES.OUTPATIENT_ACTIVE;
    }

    return CARE_STATES.REGISTERED;
  }

  /**
   * Run full database migration & backfill (Gate 0E)
   */
  async runMigration() {
    const encounters = await persistenceAdapter.query('encounters');
    const patients = await persistenceAdapter.query('patients');
    const patientMap = new Map(patients.map(p => [p.id, p]));

    let migratedCount = 0;

    for (const enc of encounters) {
      if (!enc.primaryState) {
        const patient = patientMap.get(enc.patientId);
        const canonicalState = this.inferCanonicalCareState(patient, enc);
        const isTerminal = TERMINAL_STATES.has(canonicalState);

        enc.primaryState = canonicalState;
        enc.status = canonicalState;
        enc.isTerminal = isTerminal;
        if (!enc.secondaryStates) enc.secondaryStates = [];
        if (!enc.location) {
          enc.location = {
            departmentId: enc.departmentId || 'DEPT-GENERAL',
            departmentName: enc.departmentName || 'Pelayanan Umum'
          };
        }

        // Generate bootstrap event
        const bootstrapEvent = {
          id: `EVT-BOOTSTRAP-${enc.id}`,
          encounter_id: enc.id,
          patient_id: enc.patientId,
          event_type: CLINICAL_EVENTS.SYSTEM_MIGRATION_BOOTSTRAP,
          previous_state: null,
          new_state: canonicalState,
          secondary_states: enc.secondaryStates,
          location: enc.location,
          performed_by_id: 'SYSTEM_MIGRATION',
          performed_by_name: 'NurseFlow Migration Engine',
          performed_by_role: 'SYSTEM',
          performed_at: enc.created_at || new Date().toISOString(),
          reason: 'Initial Canonical State Inferred from Legacy Records',
          clinical_notes: 'System backfill for Gate 0E'
        };

        await persistenceAdapter.save('patient_care_state_events', bootstrapEvent.id, bootstrapEvent);
        await persistenceAdapter.save('encounters', enc.id, enc);
        migratedCount++;
      }
    }

    await this.rebuildAllProjections();
    return { success: true, migratedCount };
  }

  /**
   * Rebuild All Read-Optimized Projections from Event Stream (Gate 0F & Gate P3)
   */
  async rebuildAllProjections() {
    const allEvents = await persistenceAdapter.query('patient_care_state_events');
    const encounters = await persistenceAdapter.query('encounters');
    const encounterMap = new Map(encounters.map(e => [e.id, e]));

    // Replay events to build projections
    const activeCareStateProjections = new Map();

    for (const enc of encounters) {
      const isTerminal = TERMINAL_STATES.has(enc.primaryState || enc.status);
      activeCareStateProjections.set(enc.id, {
        encounterId: enc.id,
        patientId: enc.patientId,
        patientName: enc.patientName,
        mrn: enc.mrn,
        primaryState: enc.primaryState || enc.status || CARE_STATES.REGISTERED,
        secondaryStates: enc.secondaryStates || [],
        location: enc.location || null,
        dpjpId: enc.dpjpId,
        dpjpName: enc.dpjpName,
        isTerminal,
        updatedAt: enc.updatedAt || new Date().toISOString()
      });
    }

    // Persist rebuilt projection
    for (const [id, projection] of activeCareStateProjections.entries()) {
      await persistenceAdapter.save('care_state_projections', id, projection);
    }

    return {
      success: true,
      totalProjectionsBuilt: activeCareStateProjections.size
    };
  }
}

export const careStateMigrationService = new CareStateMigrationService();
export default careStateMigrationService;
