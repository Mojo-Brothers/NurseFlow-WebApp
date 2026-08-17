import { describe, it, expect } from 'vitest';
import { empiEngineService } from '../server/services/empiEngine.service.js';

describe('Enterprise Master Patient Index (EMPI) — Duplicate Detection & Matching', () => {
  const existingDatabase = [
    {
      id: 'P-001',
      mrn: 'MRN-2026-001',
      nik: '3171099908890001',
      fullName: 'Muhammad Hendra Gunawan',
      birthDate: '1989-08-17',
      gender: 'MALE'
    },
    {
      id: 'P-002',
      mrn: 'MRN-2026-002',
      nik: '3171099908890002',
      fullName: 'Siti Aminah',
      birthDate: '1995-03-21',
      gender: 'FEMALE'
    }
  ];

  it('should detect exact duplicate by NIK (100% certainty)', () => {
    const duplicates = empiEngineService.detectDuplicates(
      { nik: '3171099908890001', fullName: 'M. Hendra', birthDate: '1989-08-17', gender: 'MALE' },
      existingDatabase
    );

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchType).toBe('EXACT_NIK');
    expect(duplicates[0].matchScore).toBe(100);
  });

  it('should detect probabilistic fuzzy duplicate (Muhammad Hendra vs Muh. Hendra Gunawan)', () => {
    const duplicates = empiEngineService.detectDuplicates(
      { nik: '3171000000000000', fullName: 'Muh. Hendra Gunawan', birthDate: '1989-08-17', gender: 'MALE' },
      existingDatabase
    );

    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].matchType).toBe('PROBABILISTIC_FUZZY');
    expect(duplicates[0].matchScore).toBeGreaterThanOrEqual(75);
  });

  it('should execute patient merge operation and generate audit log', () => {
    const mergeResult = empiEngineService.mergePatients({
      primaryPatient: existingDatabase[0],
      secondaryPatient: { id: 'P-003', mrn: 'MRN-2026-003', fullName: 'M. Hendra' },
      mergedBy: 'Petugas Rekam Medis (RMO)'
    });

    expect(mergeResult.success).toBe(true);
    expect(mergeResult.masterMrn).toBe('MRN-2026-001');
    expect(mergeResult.retiredMrn).toBe('MRN-2026-003');
  });
});
