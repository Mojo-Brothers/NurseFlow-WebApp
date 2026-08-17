import { describe, it, expect, beforeEach } from 'vitest';
import { allergyEngineService } from '../src/modules/emr/services/allergyEngine.service.js';

describe('AllergyEngineService — Cross-Reactivity & Safeguards', () => {
  beforeEach(() => {
    allergyEngineService.recordAllergy({
      patientId: 'P-1001',
      allergyType: 'DRUG',
      allergen: 'Amoxicillin / Penicillin Group',
      reaction: 'Anaphylaxis / Urtikaria',
      severity: 'SEVERE',
      verificationStatus: 'CONFIRMED',
      recordedBy: 'dr. Test Specialist'
    });
  });
  it('should detect cross-sensitivity between Penicillin allergy and Cephalosporin prescription', () => {
    const conflict = allergyEngineService.checkDrugAllergyConflict('P-1001', 'Cefadroxil 500mg');
    expect(conflict.hasConflict).toBe(true);
    expect(conflict.message).toContain('PERINGATAN ALERGI SILANG JCI');
  });

  it('should detect direct allergy conflict for penicillin', () => {
    const conflict = allergyEngineService.checkDrugAllergyConflict('P-1001', 'Amoxicillin 500mg');
    expect(conflict.hasConflict).toBe(true);
  });

  it('should pass without conflict for non-related drug e.g. Paracetamol', () => {
    const conflict = allergyEngineService.checkDrugAllergyConflict('P-1001', 'Paracetamol 500mg');
    expect(conflict.hasConflict).toBe(false);
  });
});
