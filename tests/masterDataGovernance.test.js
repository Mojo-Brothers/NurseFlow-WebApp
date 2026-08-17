import { describe, it, expect } from 'vitest';
import { masterDataGovernanceService } from '../server/services/masterDataGovernance.service.js';

describe('Master Data Governance & Clinical Knowledge Catalog', () => {
  it('should query Master ICD-10 catalogs with code and name search', () => {
    const results = masterDataGovernanceService.searchIcd10('hypertension');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('I10');
  });

  it('should query Master ICD-9-CM procedure catalogs', () => {
    const results = masterDataGovernanceService.searchIcd9cm('appendectomy');
    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('47.09');
  });

  it('should retrieve Formularium with LASA and High-Alert markers', () => {
    const formularium = masterDataGovernanceService.getFormularium();
    expect(formularium.length).toBeGreaterThan(0);
    const insulin = formularium.find(f => f.code === 'MED-INS-GLA');
    expect(insulin.highAlert).toBe(true);
  });
});
