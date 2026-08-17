import { describe, it, expect } from 'vitest';
import { bloodBankService } from '../server/services/bloodBank.service.js';

describe('Blood Bank (BDRS) & Hemovigilance Safety Matrix', () => {
  it('should validate ABO/Rh compatibility correctly', () => {
    expect(bloodBankService.isAboCompatible('A+', 'A+')).toBe(true);
    expect(bloodBankService.isAboCompatible('A+', 'O-')).toBe(true);
    expect(bloodBankService.isAboCompatible('A+', 'B+')).toBe(false);
  });

  it('should reject blood issue if crossmatch is incompatible', () => {
    expect(() => {
      bloodBankService.processBloodRequest({
        patientId: 'P-1001',
        patientName: 'Ny. Siti',
        patientBloodGroup: 'A+',
        donorBloodGroup: 'B+',
        crossMatchResult: 'INCOMPATIBLE'
      });
    }).toThrow(/INKOMPATIBEL/);
  });
});
