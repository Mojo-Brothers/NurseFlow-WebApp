/**
 * NurseFlow Enterprise HIS 2026 — Appointment & Outpatient Queue Engine
 * Standar: JCI Access to Care and Continuity of Care (ACC) & BPJS Antrean Online v2
 */

export const APPOINTMENT_STATUS = {
  BOOKED: 'BOOKED',
  CHECKED_IN: 'CHECKED_IN',
  CALLED: 'CALLED',
  IN_CONSULTATION: 'IN_CONSULTATION',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

class AppointmentQueueService {
  constructor() {
    this.appointments = new Map();
    this.queueSequence = new Map(); // ClinicCode_Date -> Current Number
  }

  /**
   * 1. Book Patient Appointment
   */
  bookAppointment({
    patientId,
    patientMrn,
    patientName,
    doctorId,
    doctorName,
    clinicCode = 'INT',
    clinicName = 'Poliklinik Penyakit Dalam',
    appointmentDate,
    slotTime = '09:00 - 09:30',
    guarantorType = 'BPJS'
  }) {
    const appointmentId = `APT-${Date.now()}`;
    const record = {
      appointmentId,
      patientId,
      patientMrn,
      patientName,
      doctorId,
      doctorName,
      clinicCode,
      clinicName,
      appointmentDate,
      slotTime,
      guarantorType,
      status: APPOINTMENT_STATUS.BOOKED,
      bookedAt: new Date().toISOString()
    };

    this.appointments.set(appointmentId, record);
    return record;
  }

  /**
   * 2. Patient Check-In & Queue Ticket Generation
   */
  checkInPatient(appointmentId) {
    const apt = this.appointments.get(appointmentId);
    if (!apt) throw new Error(`Appointment ${appointmentId} tidak ditemukan.`);

    const key = `${apt.clinicCode}_${apt.appointmentDate}`;
    const currentSeq = (this.queueSequence.get(key) || 0) + 1;
    this.queueSequence.set(key, currentSeq);

    const ticketNumber = `${apt.clinicCode}-${String(currentSeq).padStart(3, '0')}`;

    apt.status = APPOINTMENT_STATUS.CHECKED_IN;
    apt.checkedInAt = new Date().toISOString();
    apt.ticketNumber = ticketNumber;

    return {
      success: true,
      appointmentId,
      ticketNumber,
      estimatedCallTime: apt.slotTime,
      message: `Pasien ${apt.patientName} berhasil Check-In. Nomor Antrean: ${ticketNumber}`
    };
  }

  getAppointment(appointmentId) {
    return this.appointments.get(appointmentId);
  }
}

export const appointmentQueueService = new AppointmentQueueService();
