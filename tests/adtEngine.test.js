import { describe, it, expect } from 'vitest';
import { adtEngineService, ADT_EVENT_TYPES } from '../server/services/adtEngine.service.js';

describe('ADT Engine & Ward Bed Management (HL7 A01, A02, A03)', () => {
  const encounterId = 'ENC-RANAP-001';
  const patientId = 'P-2001';
  const patientName = 'Ny. Kartini Santoso';

  it('should admit a patient to an AVAILABLE bed (HL7 A01)', () => {
    const result = adtEngineService.admitPatient({
      encounterId,
      patientId,
      patientName,
      targetBedId: 'BED-MELATI-301',
      admittingDoctorName: 'dr. Siti Wijaya, Sp.PD',
      wardName: 'Ruang Melati'
    });

    expect(result.success).toBe(true);
    expect(result.event).toBe(ADT_EVENT_TYPES.ADMIT);
    expect(adtEngineService.getBedStatus('BED-MELATI-301').status).toBe('OCCUPIED');
  });

  it('should prevent admitting another patient to an OCCUPIED bed', () => {
    expect(() => {
      adtEngineService.admitPatient({
        encounterId: 'ENC-RANAP-002',
        patientId: 'P-2002',
        patientName: 'Bpk. Joko',
        targetBedId: 'BED-MELATI-301',
        admittingDoctorName: 'dr. Budi Santoso, Sp.EM'
      });
    }).toThrow(/tidak dapat digunakan/);
  });

  it('should transfer patient from one bed to another (HL7 A02) and free up previous bed for cleaning', () => {
    const result = adtEngineService.transferPatient({
      encounterId,
      fromBedId: 'BED-MELATI-301',
      toBedId: 'BED-ICU-001',
      targetWardName: 'Ruang ICU',
      transferReason: 'Perburukan saturasi oksigen & butuh ventilator',
      transferredBy: 'dr. Siti Wijaya, Sp.PD'
    });

    expect(result.success).toBe(true);
    expect(result.event).toBe(ADT_EVENT_TYPES.TRANSFER);
    expect(adtEngineService.getBedStatus('BED-MELATI-301').status).toBe('CLEANING');
    expect(adtEngineService.getBedStatus('BED-ICU-001').status).toBe('OCCUPIED');
  });

  it('should discharge patient (HL7 A03) and release bed to CLEANING status', () => {
    const result = adtEngineService.dischargePatient({
      encounterId,
      dischargeType: 'PULANG_SEMBUH',
      dischargeDoctorName: 'dr. Siti Wijaya, Sp.PD'
    });

    expect(result.success).toBe(true);
    expect(result.event).toBe(ADT_EVENT_TYPES.DISCHARGE);
    expect(adtEngineService.getBedStatus('BED-ICU-001').status).toBe('CLEANING');
  });
});
