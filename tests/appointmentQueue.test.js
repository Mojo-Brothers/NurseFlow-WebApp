import { describe, it, expect } from 'vitest';
import { appointmentQueueService, APPOINTMENT_STATUS } from '../server/services/appointmentQueue.service.js';

describe('Appointment & Outpatient Queue Engine', () => {
  let appointmentId = '';

  it('should book an appointment for outpatient consultation', () => {
    const apt = appointmentQueueService.bookAppointment({
      patientId: 'P-1001',
      patientMrn: 'MRN-2026-001001',
      patientName: 'Ny. Siti Nurhaliza',
      doctorId: 'DOC-001',
      doctorName: 'dr. Siti Wijaya, Sp.PD',
      clinicCode: 'INT',
      appointmentDate: '2026-09-01'
    });

    appointmentId = apt.appointmentId;
    expect(apt.status).toBe(APPOINTMENT_STATUS.BOOKED);
  });

  it('should check in patient and issue queue ticket number (e.g. INT-001)', () => {
    const checkin = appointmentQueueService.checkInPatient(appointmentId);
    expect(checkin.success).toBe(true);
    expect(checkin.ticketNumber).toBe('INT-001');
    expect(appointmentQueueService.getAppointment(appointmentId).status).toBe(APPOINTMENT_STATUS.CHECKED_IN);
  });
});
