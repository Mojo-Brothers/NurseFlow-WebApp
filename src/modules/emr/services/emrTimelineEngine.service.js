/**
 * NurseFlow Enterprise HIS 2026 — Longitudinal EMR Timeline Engine
 * Sprint 4: Unified Clinical Patient Journey Timeline across all Episodes of Care
 * Standar Kepatuhan: JCI 7th Edition (Longitudinal Medical Record) & SATUSEHAT FHIR R4.
 */

import { soapEngineService } from './soapEngine.service.js';
import { cpptEngineService } from './cpptEngine.service.js';
import { observationEngineService } from './observationEngine.service.js';
import { diagnosisEngineService } from './diagnosisEngine.service.js';
import { allergyEngineService } from './allergyEngine.service.js';

export const emrTimelineEngineService = {
  /**
   * Generate Full Longitudinal Patient Care Timeline
   */
  generatePatientTimeline: (patientId = null) => {
    if (!patientId) return [];
    const soapList = soapEngineService.getSoapNotes(patientId);
    const cpptList = cpptEngineService.getCpptNotes();
    const obsList = observationEngineService.getObservations(patientId);
    const dxList = diagnosisEngineService.getDiagnoses(patientId);
    const allergyList = allergyEngineService.getPatientAllergies(patientId);

    const timelineItems = [];

    // Map SOAP notes
    soapList.forEach(s => {
      timelineItems.push({
        id: s.id,
        category: 'SOAP',
        title: `Pemeriksaan DPJP: ${s.primary_icd10_name}`,
        subtitle: `Oleh: ${s.physician_name}`,
        timestamp: s.created_at,
        details: s.assessment,
        badgeColor: 'bg-teal-600 text-white'
      });
    });

    // Map CPPT notes
    cpptList.forEach(c => {
      timelineItems.push({
        id: c.id,
        category: 'CPPT',
        title: `Catatan ${c.professional_type}`,
        subtitle: `Oleh: ${c.author_name} (Verifikasi DPJP: ${c.dpjp_verified ? 'Ya' : 'Menunggu'})`,
        timestamp: c.created_at,
        details: c.soap_notes || c.sbar_assessment || c.instruction_notes,
        badgeColor: 'bg-blue-600 text-white'
      });
    });

    // Map Observations
    obsList.forEach(o => {
      timelineItems.push({
        id: o.id,
        category: 'OBSERVATION',
        title: `Observasi: ${o.loinc_display} (${o.observation_value} ${o.unit})`,
        subtitle: `Oleh: ${o.observer_name}`,
        timestamp: o.observed_at,
        details: `LOINC: ${o.loinc_code} &bull; Status: ${o.interpretation}`,
        badgeColor: 'bg-emerald-600 text-white'
      });
    });

    // Map Diagnoses
    dxList.forEach(d => {
      timelineItems.push({
        id: d.id,
        category: 'DIAGNOSIS',
        title: `Diagnosis ${d.diagnosis_type}: ${d.icd10_code} - ${d.diagnosis_name}`,
        subtitle: `Oleh: ${d.diagnosed_by}`,
        timestamp: d.created_at,
        details: `SNOMED: ${d.snomed_ct_code || '-'}`,
        badgeColor: 'bg-purple-600 text-white'
      });
    });

    // Sort Chronologically descending
    timelineItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      patient_id: patientId,
      total_clinical_events: timelineItems.length,
      allergies_count: allergyList.length,
      allergies: allergyList,
      timeline: timelineItems
    };
  }
};
