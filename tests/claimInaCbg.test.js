import { describe, it, expect } from 'vitest';
import { claimInaCbgService } from '../server/services/claimInaCbg.service.js';

describe('Insurance Claim & INA-CBG Grouping Engine', () => {
  it('should generate INA-CBG grouping and calculate reimbursement variance', () => {
    const claim = claimInaCbgService.generateInaCbgGrouping({
      episodeId: 'EOC-001',
      patientId: 'P-1001',
      patientName: 'Bpk. Hendra',
      sepNumber: '0115R0010826V000001',
      primaryDiagnosisIcd10: 'I10',
      totalHospitalCost: 150000
    });

    expect(claim.cbgsCode).toBe('I-4-10-I');
    expect(claim.cbgsTariff).toBe(185000);
    expect(claim.costVariance).toBe(35000);
    expect(claim.isProfitable).toBe(true);
  });
});
