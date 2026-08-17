/**
 * NurseFlow Enterprise HIS 2026 — Multidisciplinary Care Plan Engine
 * Sprint 4: SATUSEHAT CarePlan & Integrated Clinical Pathway
 * Standar Kepatuhan: JCI 7th Edition (Integrated Care Planning), KARS 2024.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const CARE_PLANS_KEY = 'nurseflow_clinical_care_plans';

const getStoredCarePlans = () => {
  try {
    const raw = localStorage.getItem(CARE_PLANS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[CarePlanEngine] Failed to load care plans:', e);
  }
  return [];
};

const saveStoredCarePlans = (list) => {
  try {
    localStorage.setItem(CARE_PLANS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[CarePlanEngine] Failed to save care plans:', e);
  }
};

export const carePlanEngineService = {
  createCarePlan: async ({
    episodeId,
    patientId,
    title,
    clinicalGoals = [],
    interventions = [],
    targetDate,
    createdBy = 'dr. Siti Wijaya, Sp.PD-KGEH',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const carePlan = {
      id: `CP-${Date.now()}`,
      episode_id: episodeId,
      patient_id: patientId,
      title,
      clinical_goals: clinicalGoals,
      interventions,
      target_date: targetDate,
      status: 'ACTIVE',
      created_by: createdBy,
      created_at: now
    };

    const currentList = getStoredCarePlans();
    saveStoredCarePlans([carePlan, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'CARE_PLAN',
      aggregateId: carePlan.id,
      eventName: 'CARE_PLAN_CREATED',
      payload: carePlan,
      actor: actorEmail
    });

    return carePlan;
  },

  getCarePlans: (patientId = null, episodeId = null) => {
    let list = getStoredCarePlans();
    if (patientId) {
      list = list.filter(c => c.patient_id === patientId);
    }
    if (episodeId) {
      list = list.filter(c => c.episode_id === episodeId);
    }
    return list;
  }
};
