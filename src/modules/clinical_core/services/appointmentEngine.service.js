/**
 * NurseFlow Enterprise HIS 2026 — Appointment & Doctor Schedule Engine
 * Core Clinical Backbone: Manages doctor time-slots, patient quotas,
 * booking conflict prevention, and seamless encounter synchronization.
 * Standar Kepatuhan: JCI 7th Edition (Access to Care) & HL7 FHIR R4 (Appointment & Schedule).
 */

import { universalEventContractService } from './universalEventContract.service.js';

export const APPOINTMENT_STATUSES = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

const APPOINTMENT_STORAGE_KEY = 'nurseflow_appointments';

const getStoredAppointments = () => {
  try {
    const raw = localStorage.getItem(APPOINTMENT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[AppointmentEngine] Failed to load local appointments:', e);
  }
  return [];
};

const saveStoredAppointments = (appointments) => {
  try {
    localStorage.setItem(APPOINTMENT_STORAGE_KEY, JSON.stringify(appointments));
  } catch (e) {
    console.warn('[AppointmentEngine] Failed to save local appointments:', e);
  }
};

export const appointmentEngineService = {
  /**
   * Generate available time slots based on doctor schedule
   */
  generateDoctorSlots: ({ doctorId, date, startTime = '08:00', endTime = '12:00', slotDurationMinutes = 20, maxQuota = 15 }) => {
    const existing = getStoredAppointments().filter(a => a.doctor_id === doctorId && a.appointment_date === date && a.status !== 'CANCELLED');
    const slots = [];

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const finishMinutes = endHour * 60 + endMin;
    let slotIndex = 1;

    while (currentMinutes + slotDurationMinutes <= finishMinutes && slots.length < maxQuota) {
      const h1 = String(Math.floor(currentMinutes / 60)).padStart(2, '0');
      const m1 = String(currentMinutes % 60).padStart(2, '0');
      const nextMin = currentMinutes + slotDurationMinutes;
      const h2 = String(Math.floor(nextMin / 60)).padStart(2, '0');
      const m2 = String(nextMin % 60).padStart(2, '0');

      const timeRange = `${h1}:${m1} - ${h2}:${m2}`;
      const bookedAppointment = existing.find(a => a.slot_time === timeRange);

      slots.push({
        slotNumber: slotIndex++,
        timeRange,
        isAvailable: !bookedAppointment,
        bookedBy: bookedAppointment ? bookedAppointment.patient_name : null,
        appointmentId: bookedAppointment ? bookedAppointment.id : null
      });

      currentMinutes += slotDurationMinutes;
    }

    return {
      date,
      doctorId,
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.isAvailable).length,
      slots
    };
  },

  /**
   * Book Appointment with Conflict Detection
   */
  bookAppointment: async ({
    patientId,
    patientName,
    mrn,
    doctorId,
    doctorName,
    clinicId,
    clinicName,
    appointmentDate,
    slotTime,
    channel = 'ONLINE_PORTAL',
    actorEmail = 'admin@nurseflow.id'
  }) => {
    const list = getStoredAppointments();

    // 1. Conflict Detection: Doctor Double Booking
    const isConflict = list.some(a =>
      a.doctor_id === doctorId &&
      a.appointment_date === appointmentDate &&
      a.slot_time === slotTime &&
      ['BOOKED', 'CONFIRMED', 'CHECKED_IN'].includes(a.status)
    );

    if (isConflict) {
      throw new Error(`Bentrok Jadwal: Slot waktu ${slotTime} pada tanggal ${appointmentDate} untuk ${doctorName} sudah terisi.`);
    }

    // 2. Conflict Detection: Patient Overlapping
    const patientBusy = list.some(a =>
      a.patient_id === patientId &&
      a.appointment_date === appointmentDate &&
      a.slot_time === slotTime &&
      ['BOOKED', 'CONFIRMED'].includes(a.status)
    );

    if (patientBusy) {
      throw new Error(`Pasien ${patientName} sudah memiliki janji temu lain pada slot waktu yang sama.`);
    }

    const now = new Date().toISOString();
    const bookingCode = `APT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newAppointment = {
      id: `APT-${Date.now()}`,
      booking_code: bookingCode,
      patient_id: patientId,
      patient_name: patientName,
      mrn,
      doctor_id: doctorId,
      doctor_name: doctorName,
      clinic_id: clinicId,
      clinic_name: clinicName,
      appointment_date: appointmentDate,
      slot_time: slotTime,
      channel,
      status: 'CONFIRMED',
      created_at: now,
      created_by: actorEmail,
      is_deleted: false
    };

    saveStoredAppointments([newAppointment, ...list]);

    await universalEventContractService.publishDomainEvent({
      eventName: 'APPOINTMENT_CREATED',
      aggregateType: 'APPOINTMENT',
      aggregateId: newAppointment.id,
      payload: newAppointment,
      actor: actorEmail
    });

    return newAppointment;
  },

  /**
   * Cancel Appointment
   */
  cancelAppointment: async (appointmentId, reason = 'Permintaan Pasien', actorEmail = 'admin@nurseflow.id') => {
    const list = getStoredAppointments();
    const index = list.findIndex(a => a.id === appointmentId);

    if (index === -1) {
      throw new Error(`Appointment ${appointmentId} tidak ditemukan.`);
    }

    const appt = list[index];
    appt.status = 'CANCELLED';
    appt.cancellation_reason = reason;
    appt.cancelled_at = new Date().toISOString();

    list[index] = appt;
    saveStoredAppointments(list);

    await universalEventContractService.publishDomainEvent({
      eventName: 'APPOINTMENT_CANCELLED',
      aggregateType: 'APPOINTMENT',
      aggregateId: appointmentId,
      payload: { appointmentId, reason },
      actor: actorEmail
    });

    return appt;
  },

  /**
   * Get Appointments
   */
  getAppointments: (filters = {}) => {
    let list = getStoredAppointments().filter(a => !a.is_deleted);

    if (filters.doctorId) {
      list = list.filter(a => a.doctor_id === filters.doctorId);
    }
    if (filters.date) {
      list = list.filter(a => a.appointment_date === filters.date);
    }
    if (filters.patientId) {
      list = list.filter(a => a.patient_id === filters.patientId);
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(a => a.status === filters.status);
    }

    return list;
  }
};
