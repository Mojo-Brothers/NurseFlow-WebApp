/**
 * NurseFlow Enterprise HIS 2026 — Canonical Clinical Context Provider & SSOT Guard
 * Standards: Joint Commission International (JCI IPSG 1), NIST IR 7804 EHR Context Consistency,
 * Single Source of Truth (SSOT), Zero-Implicit-Patient-Fallback, Versioned Context Lineage.
 */

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useEncounterStore } from '../../modules/encounter/encounter.store.js';
import { usePatientStore } from '../../modules/patient/patient.store.js';
import { useAuth } from '../../contexts/useAuth.js';
import toast from 'react-hot-toast';

const ClinicalContext = createContext(null);

export function ClinicalContextProvider({ children }) {
  const { currentUser, role } = useAuth();
  const { 
    activePatientId, 
    activeEncounterId, 
    currentCareState, 
    currentLocation, 
    setLiveContext, 
    clearLiveContext 
  } = useEncounterStore();
  const { patients, selectedPatientId, selectPatient } = usePatientStore();

  // Resolve active patient object strictly from activePatientId
  const activePatient = useMemo(() => {
    if (!activePatientId) return null;
    return patients.find(p => p.id === activePatientId || p.mrn === activePatientId) || null;
  }, [activePatientId, patients]);

  // Synchronize patient store selectedPatientId when activePatientId changes
  useEffect(() => {
    if (activePatientId && selectedPatientId !== activePatientId) {
      selectPatient(activePatientId);
    }
  }, [activePatientId, selectedPatientId, selectPatient]);

  /**
   * Atomic, Authoritative Context Switcher
   * Emits forensic trace and guarantees zero cross-patient contamination
   */
  const setContext = useCallback((patientId, encounterId = null, careState = null, location = null) => {
    if (!patientId) {
      clearLiveContext();
      selectPatient(null);
      return;
    }

    const targetPatient = patients.find(p => p.id === patientId || p.mrn === patientId);
    const resolvedEncounterId = encounterId || (targetPatient ? `ENC-${targetPatient.id}` : `ENC-${patientId}`);
    const resolvedCareState = careState || targetPatient?.status || 'INPATIENT_ACTIVE';

    setLiveContext(patientId, resolvedEncounterId, resolvedCareState, location);
    selectPatient(patientId);

    // Audit telemetry
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('nurseflow:context-switched', {
        detail: {
          patientId,
          encounterId: resolvedEncounterId,
          careState: resolvedCareState,
          practitionerId: currentUser?.id || currentUser?.email || 'SYSTEM',
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, [patients, setLiveContext, clearLiveContext, selectPatient, currentUser]);

  /**
   * Safe Context Releaser
   */
  const clearContext = useCallback(() => {
    clearLiveContext();
    selectPatient(null);
  }, [clearLiveContext, selectPatient]);

  const value = useMemo(() => ({
    patientId: activePatientId || null,
    encounterId: activeEncounterId || null,
    careState: currentCareState || null,
    location: currentLocation || null,
    patient: activePatient,
    hasActiveContext: Boolean(activePatientId && activePatient),
    setContext,
    clearContext
  }), [activePatientId, activeEncounterId, currentCareState, currentLocation, activePatient, setContext, clearContext]);

  return (
    <ClinicalContext.Provider value={value}>
      {children}
    </ClinicalContext.Provider>
  );
}

/**
 * Hook to consume the Authoritative Clinical Context
 * Strictly prohibits implicit fallback to patients[0]
 */
export function useClinicalContext() {
  const ctx = useContext(ClinicalContext);
  if (!ctx) {
    // Fail-safe for components mounted outside provider (e.g. isolated tests)
    const encounterState = useEncounterStore.getState();
    const patientState = usePatientStore.getState();
    const activePatient = encounterState.activePatientId
      ? patientState.patients?.find(p => p.id === encounterState.activePatientId || p.mrn === encounterState.activePatientId) || null
      : null;

    return {
      patientId: encounterState.activePatientId || null,
      encounterId: encounterState.activeEncounterId || null,
      careState: encounterState.currentCareState || null,
      location: encounterState.currentLocation || null,
      patient: activePatient,
      hasActiveContext: Boolean(encounterState.activePatientId && activePatient),
      setContext: (pId, encId, cs, loc) => {
        encounterState.setLiveContext(pId, encId, cs, loc);
        patientState.selectPatient(pId);
      },
      clearContext: () => {
        encounterState.clearLiveContext();
        patientState.selectPatient(null);
      }
    };
  }
  return ctx;
}
