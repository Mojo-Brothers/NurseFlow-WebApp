import { describe, it, expect } from 'vitest';
import { operatingTheatreService, SURGERY_STATUS } from '../server/services/operatingTheatre.service.js';

describe('Central Operating Theatre (COT) & WHO Surgical Checklist', () => {
  let surgeryId = '';

  it('should schedule surgical case in operating theatre', () => {
    const surgery = operatingTheatreService.scheduleSurgery({
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001',
      patientName: 'Ny. Siti Nurhaliza',
      procedureName: 'Laparoscopic Appendectomy',
      operatingRoomId: 'OK-01',
      leadSurgeonName: 'dr. Andi Sp.B',
      anesthesiologistName: 'dr. Budi Sp.An',
      scheduledDateTime: '2026-09-01T08:00:00Z'
    });

    surgeryId = surgery.surgeryId;
    expect(surgery.status).toBe(SURGERY_STATUS.SCHEDULED);
  });

  it('should verify WHO Surgical Safety Checklist Time Out before skin incision', () => {
    const result = operatingTheatreService.performTimeOut(surgeryId, {
      allTeamMembersIntroduced: true,
      patientIdentityAndSiteConfirmed: true,
      antibioticProphylaxisGiven: true,
      anticipatedCriticalEventsReviewed: true,
      verifiedByNurse: 'Ns. Ratna Sari, S.Kep'
    });

    expect(result.success).toBe(true);
  });

  it('should calculate Aldrete Post-Anesthesia Recovery Score for discharge to ward', () => {
    const aldrete = operatingTheatreService.calculateAldreteScore(surgeryId, {
      activity: 2,
      respiration: 2,
      circulation: 2,
      consciousness: 2,
      o2Saturation: 2
    });

    expect(aldrete.totalScore).toBe(10);
    expect(aldrete.isReadyForDischarge).toBe(true);
  });
});
