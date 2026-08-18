/**
 * NurseFlow Enterprise HIS 2026 — Medication Terminology Repository
 * SNOMED CT, RxNorm, ATC, UNII, NDC, KFA Kemenkes & GTIN Barcode Multi-Bridge
 */

import { MedicationTerminology } from '../modules/pharmacy/entities/MedicationEntities.js';

class TerminologyRepository {
  constructor() {
    this.terminologies = new Map();
    this.initCanonicalTerminologies();
  }

  initCanonicalTerminologies() {
    const defaultTerms = [
      new MedicationTerminology({ id: 'TERM-001', medicationId: 'MED-001', terminologySystem: 'SNOMED_CT', terminologyCode: '372729009', terminologyDisplay: 'Meropenem (substance)' }),
      new MedicationTerminology({ id: 'TERM-002', medicationId: 'MED-001', terminologySystem: 'RXNORM', terminologyCode: '11124', terminologyDisplay: 'meropenem 1000 MG Injection' }),
      new MedicationTerminology({ id: 'TERM-003', medicationId: 'MED-001', terminologySystem: 'KFA_KEMENKES', terminologyCode: '93001003', terminologyDisplay: 'Meropenem Serbuk Injeksi 1000 mg (Generik)' }),
      new MedicationTerminology({ id: 'TERM-004', medicationId: 'MED-001', terminologySystem: 'GTIN_BARCODE', terminologyCode: '08991234567891', terminologyDisplay: 'GTIN-14 Meropenem 1g RS' }),
      new MedicationTerminology({ id: 'TERM-005', medicationId: 'MED-002', terminologySystem: 'SNOMED_CT', terminologyCode: '372740003', terminologyDisplay: 'Ceftriaxone (substance)' }),
      new MedicationTerminology({ id: 'TERM-006', medicationId: 'MED-002', terminologySystem: 'KFA_KEMENKES', terminologyCode: '93002014', terminologyDisplay: 'Ceftriaxone Serbuk Injeksi 1000 mg' }),
      new MedicationTerminology({ id: 'TERM-007', medicationId: 'MED-003', terminologySystem: 'SNOMED_CT', terminologyCode: '372862008', terminologyDisplay: 'Warfarin (substance)' }),
      new MedicationTerminology({ id: 'TERM-008', medicationId: 'MED-003', terminologySystem: 'RXNORM', terminologyCode: '11289', terminologyDisplay: 'warfarin sodium 2 MG Oral Tablet' }),
      new MedicationTerminology({ id: 'TERM-009', medicationId: 'MED-004', terminologySystem: 'SNOMED_CT', terminologyCode: '387458008', terminologyDisplay: 'Aspirin (substance)' }),
      new MedicationTerminology({ id: 'TERM-010', medicationId: 'MED-005', terminologySystem: 'SNOMED_CT', terminologyCode: '387517004', terminologyDisplay: 'Paracetamol (substance)' }),
      new MedicationTerminology({ id: 'TERM-011', medicationId: 'MED-005', terminologySystem: 'RXNORM', terminologyCode: '7052', terminologyDisplay: 'acetaminophen 500 MG Oral Tablet' }),
      new MedicationTerminology({ id: 'TERM-012', medicationId: 'MED-007', terminologySystem: 'SNOMED_CT', terminologyCode: '372740003', terminologyDisplay: 'Vancomycin (substance)' }),
      new MedicationTerminology({ id: 'TERM-013', medicationId: 'MED-008', terminologySystem: 'SNOMED_CT', terminologyCode: '387192004', terminologyDisplay: 'Insulin aspart (substance)' })
    ];

    defaultTerms.forEach(t => this.terminologies.set(t.id, t));
  }

  async search({ query = '', system = '' } = {}) {
    let list = Array.from(this.terminologies.values());

    if (system) {
      list = list.filter(t => t.terminologySystem === system.toUpperCase());
    }

    if (query) {
      const q = query.toLowerCase();
      // Handle prefix queries like SNOMED:372729009 or RXNORM:11124 or KFA:93001003
      if (q.startsWith('snomed:')) {
        const code = q.replace('snomed:', '').trim();
        list = list.filter(t => t.terminologySystem === 'SNOMED_CT' && t.terminologyCode.includes(code));
      } else if (q.startsWith('rxnorm:')) {
        const code = q.replace('rxnorm:', '').trim();
        list = list.filter(t => t.terminologySystem === 'RXNORM' && t.terminologyCode.includes(code));
      } else if (q.startsWith('kfa:')) {
        const code = q.replace('kfa:', '').trim();
        list = list.filter(t => t.terminologySystem === 'KFA_KEMENKES' && t.terminologyCode.includes(code));
      } else {
        list = list.filter(t =>
          t.terminologyCode.toLowerCase().includes(q) ||
          t.terminologyDisplay.toLowerCase().includes(q)
        );
      }
    }

    return list;
  }

  async findByMedicationId(medicationId) {
    return Array.from(this.terminologies.values()).filter(t => t.medicationId === medicationId);
  }

  async addTerminology(data) {
    const id = data.id || `TERM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const term = new MedicationTerminology({ ...data, id, createdAt: Date.now() });
    this.terminologies.set(id, term);
    return term;
  }
}

export const terminologyRepository = new TerminologyRepository();
