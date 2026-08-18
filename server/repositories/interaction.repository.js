/**
 * NurseFlow Enterprise HIS 2026 — Medication Interactions (DDI Matrix) Repository
 * Standards: JCI IPSG 3, FDA / Lexicomp Drug Interaction Matrix
 */

import { MedicationInteraction } from '../modules/pharmacy/entities/MedicationEntities.js';

class InteractionRepository {
  constructor() {
    this.interactions = new Map();
    this.initCanonicalInteractions();
  }

  initCanonicalInteractions() {
    const defaultInteractions = [
      new MedicationInteraction({
        id: 'DDI-001',
        drugAId: 'MED-003', // Warfarin
        drugBId: 'MED-004', // Aspirin
        severity: 'CRITICAL_HIGH',
        clinicalMechanism: 'Sinergisme antikoagulasi dan inhibisi agregasi trombosit via jalur COX-1.',
        clinicalEffect: 'Peningkatan risiko perdarahan mayor gastrointestinal hingga 4.5x lipat.',
        managementRecommendation: 'Hindari kombinasi kecuali pada indikasi khusus ACS dengan pemantauan INR ketat.',
        evidenceSource: 'FDA / Lexicomp Drug Interaction Matrix 2026'
      }),
      new MedicationInteraction({
        id: 'DDI-002',
        drugAId: 'MED-005', // Paracetamol Oral
        drugBId: 'MED-006', // Paracetamol IV
        severity: 'FATAL_HARD_STOP',
        clinicalMechanism: 'Duplikasi zat aktif Paracetamol (Acetaminophen) simultan oral dan intravena.',
        clinicalEffect: 'Risiko overdosis kumulatif >4g/hari dan hepatotoksisitas berat.',
        managementRecommendation: 'Hentikan salah satu rute pemberian; pilih oral atau intravena.',
        evidenceSource: 'American Liver Foundation & JCI Safety Alert'
      }),
      new MedicationInteraction({
        id: 'DDI-003',
        drugAId: 'MED-007', // Vancomycin
        drugBId: 'MED-002', // Ceftriaxone
        severity: 'MODERATE',
        clinicalMechanism: 'Inkompatibilitas fisikokimia presipitasi endapan kristal bila diberikan dalam satu jalur infus.',
        clinicalEffect: 'Risiko oklusi kateter IV dan emboli partikel mikro.',
        managementRecommendation: 'Bilas jalur IV dengan Saline 0.9% sebelum dan sesudah pemberian obat.',
        evidenceSource: 'Handbook on Injectable Drugs'
      })
    ];

    defaultInteractions.forEach(d => this.interactions.set(d.id, d));
  }

  async findInteractionPair(drugAId, drugBId) {
    const list = Array.from(this.interactions.values());
    return list.find(d =>
      d.isActive &&
      ((d.drugAId === drugAId && d.drugBId === drugBId) ||
       (d.drugAId === drugBId && d.drugBId === drugAId))
    ) || null;
  }

  async findInteractionsForDrug(drugId) {
    return Array.from(this.interactions.values()).filter(d =>
      d.isActive && (d.drugAId === drugId || d.drugBId === drugId)
    );
  }

  async getAllInteractions() {
    return Array.from(this.interactions.values()).filter(d => d.isActive);
  }

  async create(data) {
    const id = data.id || `DDI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const ddi = new MedicationInteraction({ ...data, id, createdAt: Date.now(), updatedAt: Date.now() });
    this.interactions.set(id, ddi);
    return ddi;
  }
}

export const interactionRepository = new InteractionRepository();
