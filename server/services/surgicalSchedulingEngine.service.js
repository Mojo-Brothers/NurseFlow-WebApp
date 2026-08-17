/**
 * NurseFlow Enterprise HIS 2026 — Surgical Scheduling Engine & Conflict Detector
 * Enforces room allocation, surgeon availability, and turnover duration guard rails
 */

import { eventBusService, DOMAIN_EVENTS } from '../realtime/eventBus.service.js';

class SurgicalSchedulingEngineService {
  constructor() {
    this.schedules = new Map();
    this.initDemoSchedules();
  }

  initDemoSchedules() {
    const s1 = {
      id: 'SCHED-2026-001',
      operatingRoomId: 'THEATRE-OK-01',
      roomName: 'OK-01 (Bedah Umum)',
      surgicalCaseId: 'CASE-SURG-001',
      surgeryDate: '2026-08-17',
      startTime: '2026-08-17T08:00:00.000Z',
      endTime: '2026-08-17T10:30:00.000Z',
      estimatedDurationMinutes: 120,
      turnoverTimeMinutes: 30,
      surgeonId: 'DOC-BEDAH-01',
      surgeonName: 'dr. Budi Santoso, Sp.B',
      anesthesiologistId: 'DOC-ANEST-01',
      anesthesiologistName: 'dr. Ratna Anindita, Sp.An-TI',
      bookingStatus: 'CONFIRMED'
    };

    this.schedules.set(s1.id, s1);
  }

  /**
   * Detects scheduling conflicts across Room, Surgeon, and Anesthesiologist
   */
  checkConflicts({ operatingRoomId, surgeonId, anesthesiologistId, startTime, endTime, excludeScheduleId = null }) {
    const reqStart = new Date(startTime).getTime();
    const reqEnd = new Date(endTime).getTime();

    if (reqStart >= reqEnd) {
      return { hasConflict: true, reason: 'Waktu mulai harus lebih awal dari waktu selesai.' };
    }

    const allSchedules = Array.from(this.schedules.values()).filter(s => s.bookingStatus !== 'CANCELLED' && s.id !== excludeScheduleId);

    for (const sched of allSchedules) {
      const existingStart = new Date(sched.startTime).getTime();
      // Add turnover time buffer (30 min) for room sterilization
      const existingEndWithTurnover = new Date(sched.endTime).getTime() + (sched.turnoverTimeMinutes * 60 * 1000);

      // Check time overlap: (StartA < EndB) and (EndA > StartB)
      const isOverlap = (reqStart < existingEndWithTurnover) && (reqEnd > existingStart);

      if (isOverlap) {
        if (sched.operatingRoomId === operatingRoomId) {
          return {
            hasConflict: true,
            conflictType: 'ROOM_BUSY',
            reason: `Konflik Kamar Bedah: ${sched.roomName} sedang digunakan untuk kasus lain (${sched.startTime.split('T')[1].slice(0,5)} - ${sched.endTime.split('T')[1].slice(0,5)}) termasuk buffer sterilisasi ${sched.turnoverTimeMinutes} menit.`,
            conflictingSchedule: sched
          };
        }

        if (sched.surgeonId === surgeonId) {
          return {
            hasConflict: true,
            conflictType: 'SURGEON_BUSY',
            reason: `Konflik Dokter Operator: ${sched.surgeonName} sedang memimpin operasi lain di ${sched.roomName}.`,
            conflictingSchedule: sched
          };
        }

        if (sched.anesthesiologistId === anesthesiologistId) {
          return {
            hasConflict: true,
            conflictType: 'ANESTHESIOLOGIST_BUSY',
            reason: `Konflik Dokter Anestesi: ${sched.anesthesiologistName} sedang bertugas di ${sched.roomName}.`,
            conflictingSchedule: sched
          };
        }
      }
    }

    return { hasConflict: false };
  }

  /**
   * Schedules a surgical case with strict conflict verification
   */
  scheduleSurgery(payload) {
    // Check conflict
    const conflict = this.checkConflicts({
      operatingRoomId: payload.operatingRoomId,
      surgeonId: payload.surgeonId,
      anesthesiologistId: payload.anesthesiologistId,
      startTime: payload.startTime,
      endTime: payload.endTime
    });

    const isEmergency = payload.urgency === 'STAT_EMERGENCY' || payload.urgency === 'EMERGENCY_CITO';

    if (conflict.hasConflict) {
      if (isEmergency && payload.allowEmergencyOverride && conflict.conflictingSchedule) {
        // Preempt Elective case
        const electiveSched = conflict.conflictingSchedule;
        electiveSched.bookingStatus = 'RESCHEDULED_DUE_TO_EMERGENCY';
        electiveSched.preemptedByCaseId = payload.surgicalCaseId;

        eventBusService.publish(DOMAIN_EVENTS.PANIC_VALUE_TRIGGERED, {
          type: 'SURGERY_EMERGENCY_PREEMPTION',
          rescheduledScheduleId: electiveSched.id,
          emergencyCaseId: payload.surgicalCaseId,
          room: electiveSched.roomName
        });
      } else {
        throw new Error(`[SchedulingConflictException] ${conflict.reason}`);
      }
    }

    const scheduleId = payload.id || `SCHED-${Date.now()}`;
    const newSchedule = {
      id: scheduleId,
      operatingRoomId: payload.operatingRoomId,
      roomName: payload.roomName || 'Kamar Operasi',
      surgicalCaseId: payload.surgicalCaseId,
      surgeryDate: payload.surgeryDate || payload.startTime.split('T')[0],
      startTime: payload.startTime,
      endTime: payload.endTime,
      urgency: payload.urgency || 'ELECTIVE',
      estimatedDurationMinutes: payload.estimatedDurationMinutes || 90,
      turnoverTimeMinutes: payload.turnoverTimeMinutes || 30,
      surgeonId: payload.surgeonId,
      surgeonName: payload.surgeonName,
      anesthesiologistId: payload.anesthesiologistId,
      anesthesiologistName: payload.anesthesiologistName,
      bookingStatus: isEmergency && conflict.hasConflict ? 'CONFIRMED_EMERGENCY_OVERRIDE' : 'CONFIRMED',
      createdAt: new Date().toISOString()
    };

    this.schedules.set(scheduleId, newSchedule);

    eventBusService.publish(DOMAIN_EVENTS.ORDER_CREATED, {
      scheduleId,
      room: newSchedule.roomName,
      surgeon: newSchedule.surgeonName,
      startTime: newSchedule.startTime,
      isEmergencyOverride: newSchedule.bookingStatus === 'CONFIRMED_EMERGENCY_OVERRIDE'
    });

    return newSchedule;
  }

  getSchedulesByDate(surgeryDate) {
    return Array.from(this.schedules.values()).filter(s => s.surgeryDate === surgeryDate);
  }

  getAllSchedules() {
    return Array.from(this.schedules.values());
  }
}

export const surgicalSchedulingEngineService = new SurgicalSchedulingEngineService();
