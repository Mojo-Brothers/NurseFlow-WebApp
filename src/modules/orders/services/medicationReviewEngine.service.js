/**
 * NurseFlow Enterprise HIS 2026 — Pharmacist Medication Review Engine
 * Sprint 5: Clinical Screening (Telaah Administratif, Farmasetik & Klinis 7 Benar)
 * Standar Kepatuhan: Permenkes No. 72/2016 (Standar Pelayanan Kefarmasian di RS) & JCI MMU.
 */

import { outboxPublisherService } from '../../front_office/services/outboxPublisher.service.js';

const REVIEWS_STORAGE_KEY = 'nurseflow_medication_reviews';

const getStoredReviews = () => {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[MedicationReviewEngine] Failed to load reviews:', e);
  }
  return [];
};

const saveStoredReviews = (list) => {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[MedicationReviewEngine] Failed to save reviews:', e);
  }
};

export const medicationReviewEngineService = {
  /**
   * Conduct Clinical Pharmacist Review for E-Prescription
   */
  performReview: async ({
    orderId,
    medicationOrderId,
    pharmacistName = 'apt. Dimas Anggara, S.Farm',
    administrativeCheck = true,
    pharmaceuticalCheck = true,
    clinicalCheck = true,
    reviewVerdict = 'APPROVED', // 'APPROVED' | 'FLAGGED_OVERRIDDEN' | 'REJECTED'
    clinicalNotes = 'Telaah resep selesai. Dosis, rute, frekuensi, dan indikasi tepat.',
    actorEmail = 'pharmacist@nurseflow.id'
  }) => {
    const now = new Date().toISOString();
    const reviewRecord = {
      id: `REV-${Date.now()}`,
      order_id: orderId,
      medication_order_id: medicationOrderId,
      pharmacist_name: pharmacistName,
      checks: {
        administrative: administrativeCheck,
        pharmaceutical: pharmaceuticalCheck,
        clinical: clinicalCheck
      },
      verdict: reviewVerdict,
      clinical_notes: clinicalNotes,
      reviewed_at: now
    };

    const currentList = getStoredReviews();
    saveStoredReviews([reviewRecord, ...currentList]);

    await outboxPublisherService.stageEvent({
      aggregateType: 'PHARMACY_REVIEW',
      aggregateId: reviewRecord.id,
      eventName: 'MEDICATION_VERIFIED',
      payload: reviewRecord,
      actor: actorEmail
    });

    return reviewRecord;
  },

  getReviews: (orderId = null) => {
    let list = getStoredReviews();
    if (orderId) {
      list = list.filter(r => r.order_id === orderId);
    }
    return list;
  }
};
