import { describe, it, expect } from 'vitest';
import { staffSchedulingService } from '../server/services/staffScheduling.service.js';

describe('Staff Scheduling & Duty Roster Engine', () => {
  it('should assign a doctor shift and prevent schedule conflict on same date', () => {
    const assignment = staffSchedulingService.assignShift({
      staffId: 'DOC-001',
      staffName: 'dr. Siti Wijaya, Sp.PD',
      role: 'ROLE_DOCTOR_DPJP',
      departmentId: 'DEPT-IRJ',
      date: '2026-09-01',
      shiftCode: 'PAGI'
    });

    expect(assignment.shift.code).toBe('PAGI');

    // Attempt double assignment on same date
    expect(() => {
      staffSchedulingService.assignShift({
        staffId: 'DOC-001',
        staffName: 'dr. Siti Wijaya, Sp.PD',
        role: 'ROLE_DOCTOR_DPJP',
        departmentId: 'DEPT-IRJ',
        date: '2026-09-01',
        shiftCode: 'SIANG'
      });
    }).toThrow(/Konflik Jadwal/);
  });
});
