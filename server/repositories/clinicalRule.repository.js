/**
 * NurseFlow Enterprise HIS 2026 — Versioned Clinical Rule Repository
 * Evaluates dynamic conditions without JSON parsing overhead
 */

import { ClinicalRule, ClinicalRuleCondition } from '../modules/cdss/entities/ClinicalRuleEntities.js';

class ClinicalRuleRepository {
  constructor() {
    this.rules = new Map();
    this.conditions = new Map(); // ruleId -> Array<ClinicalRuleCondition>
    this.initCanonicalRules();
  }

  initCanonicalRules() {
    // 1. DDI Warfarin + Aspirin
    const r1 = new ClinicalRule({
      id: 'RULE-DDI-001',
      ruleCode: 'DDI_WARFARIN_ASPIRIN',
      ruleVersion: 1,
      ruleType: 'DRUG_DRUG_INTERACTION',
      severity: 'CRITICAL_WARNING',
      alertTitle: 'INTERAKSI OBAT RISIKO TINGGI: WARFARIN + ASPIRIN',
      alertMessage: 'Kombinasi Warfarin dan Aspirin meningkatkan risiko perdarahan mayor saluran cerna hingga 4.5x lipat via sinergisme antihemostasis.',
      clinicalRecommendation: 'Pertimbangkan alternatif non-NSAID atau evaluasi indikasi ACS dengan pemantauan INR ketat dan gastroprotektor (PPI).',
      primaryEntityCode: 'B01AA03',
      secondaryEntityCode: 'B01AC06',
      effectiveFrom: 1723900000000,
      isActive: true
    });

    const c1A = new ClinicalRuleCondition({ id: 'COND-DDI-001A', ruleId: 'RULE-DDI-001', fieldName: 'primary_atc', operator: '=', comparisonValue: 'B01AA03' });
    const c1B = new ClinicalRuleCondition({ id: 'COND-DDI-001B', ruleId: 'RULE-DDI-001', fieldName: 'secondary_atc', operator: '=', comparisonValue: 'B01AC06' });

    this.rules.set(r1.id, r1);
    this.conditions.set(r1.id, [c1A, c1B]);

    // 2. Duplicate Therapy Paracetamol
    const r2 = new ClinicalRule({
      id: 'RULE-DUPL-001',
      ruleCode: 'DUPL_PARACETAMOL_ORAL_IV',
      ruleVersion: 1,
      ruleType: 'DUPLICATE_THERAPY',
      severity: 'FATAL_HARD_STOP',
      alertTitle: 'DUPLIKASI TERAPI MEMATIKAN: PARACETAMOL ORAL + IV',
      alertMessage: 'Pasien sedang menerima Paracetamol rute lain. Pemberian ganda memicu overdosis kumulatif >4g/hari dan gagal hati akut.',
      clinicalRecommendation: 'Batalkan peresepan Paracetamol rute kedua atau hentikan sediaan yang sedang aktif sebelum memulai rute baru.',
      primaryEntityCode: 'N02BE01',
      secondaryEntityCode: 'N02BE01',
      effectiveFrom: 1723900000000,
      isActive: true
    });

    const c2A = new ClinicalRuleCondition({ id: 'COND-DUPL-001A', ruleId: 'RULE-DUPL-001', fieldName: 'primary_atc', operator: '=', comparisonValue: 'N02BE01' });
    const c2B = new ClinicalRuleCondition({ id: 'COND-DUPL-001B', ruleId: 'RULE-DUPL-001', fieldName: 'active_medication_atc', operator: '=', comparisonValue: 'N02BE01' });

    this.rules.set(r2.id, r2);
    this.conditions.set(r2.id, [c2A, c2B]);

    // 3. Renal Dose Meropenem eGFR < 30
    const r3 = new ClinicalRule({
      id: 'RULE-RENAL-001',
      ruleCode: 'RENAL_MEROPENEM_EGFR30',
      ruleVersion: 1,
      ruleType: 'RENAL_ADJUSTMENT',
      severity: 'CRITICAL_WARNING',
      alertTitle: 'PENYESUAIAN DOSIS GINJAL DIPERLUKAN: MEROPENEM',
      alertMessage: 'Fungsi ginjal pasien eGFR < 30 ml/min. Akumulasi Meropenem memicu neurotoksisitas dan kejang.',
      clinicalRecommendation: 'Turunkan dosis Meropenem menjadi 500 mg setiap 12 jam IV (atau 500 mg q24h jika eGFR < 10 ml/min).',
      primaryEntityCode: 'J01DH02',
      effectiveFrom: 1723900000000,
      isActive: true
    });

    const c3A = new ClinicalRuleCondition({ id: 'COND-RENAL-001A', ruleId: 'RULE-RENAL-001', fieldName: 'primary_atc', operator: '=', comparisonValue: 'J01DH02' });
    const c3B = new ClinicalRuleCondition({ id: 'COND-RENAL-001B', ruleId: 'RULE-RENAL-001', fieldName: 'latest_egfr', operator: '<', comparisonValue: '30' });

    this.rules.set(r3.id, r3);
    this.conditions.set(r3.id, [c3A, c3B]);

    // 4. Pediatric Overdose Paracetamol > 15 mg/kg
    const r4 = new ClinicalRule({
      id: 'RULE-PED-001',
      ruleCode: 'PED_PARACETAMOL_MAX15',
      ruleVersion: 1,
      ruleType: 'PEDIATRIC_DOSE',
      severity: 'FATAL_HARD_STOP',
      alertTitle: 'OVERDOSIS PEDIATRIK DITOLAK: PARACETAMOL >15 MG/KG',
      alertMessage: 'Dosis yang diinput melebihi batas aman maksimal 15 mg/kgBB per kali pemberian untuk pasien anak.',
      clinicalRecommendation: 'Hitung ulang dosis: Berat Badan (kg) × 10–15 mg. Batas maksimal harian adalah 60 mg/kg/hari.',
      primaryEntityCode: 'N02BE01',
      effectiveFrom: 1723900000000,
      isActive: true
    });

    const c4A = new ClinicalRuleCondition({ id: 'COND-PED-001A', ruleId: 'RULE-PED-001', fieldName: 'primary_atc', operator: '=', comparisonValue: 'N02BE01' });
    const c4B = new ClinicalRuleCondition({ id: 'COND-PED-001B', ruleId: 'RULE-PED-001', fieldName: 'patient_age_years', operator: '<', comparisonValue: '12' });
    const c4C = new ClinicalRuleCondition({ id: 'COND-PED-001C', ruleId: 'RULE-PED-001', fieldName: 'dose_mg_per_kg', operator: '>', comparisonValue: '15.0' });

    this.rules.set(r4.id, r4);
    this.conditions.set(r4.id, [c4A, c4B, c4C]);
  }

  async findActiveRulesByType(ruleType, timestamp = Date.now()) {
    return Array.from(this.rules.values()).filter(r =>
      r.ruleType === ruleType &&
      r.isActive &&
      r.effectiveFrom <= timestamp &&
      (r.effectiveUntil === null || r.effectiveUntil >= timestamp)
    );
  }

  async findRuleByCodeAndVersion(ruleCode, version = 1) {
    return Array.from(this.rules.values()).find(r => r.ruleCode === ruleCode && r.ruleVersion === version) || null;
  }

  async getConditionsForRule(ruleId) {
    return this.conditions.get(ruleId) || [];
  }

  async createRule(ruleData, conditions = []) {
    const id = ruleData.id || `RULE-${Date.now()}`;
    const newRule = new ClinicalRule({ ...ruleData, id });
    this.rules.set(id, newRule);

    const conditionObjects = conditions.map(c => new ClinicalRuleCondition({
      ...c,
      id: c.id || `COND-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ruleId: id
    }));

    this.conditions.set(id, conditionObjects);
    return { rule: newRule, conditions: conditionObjects };
  }
}

export const clinicalRuleRepository = new ClinicalRuleRepository();
