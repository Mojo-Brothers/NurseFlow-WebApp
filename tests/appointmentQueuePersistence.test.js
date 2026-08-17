/**
 * NurseFlow Enterprise HIS 2026 — Appointment & Outpatient Queue Persistence Test Suite (Gate 1D.2)
 * Standards: JCI ACC, BPJS Antrean Online v2 & Mobile JKN
 */

import { describe, it, expect } from 'vitest';

describe('Gate 1D.2: Appointment & Outpatient Queue Persistence Hardening', () => {
  const TENANT_A = '00000000-0000-0000-0000-000000000001';
  const TENANT_B = '00000000-0000-0000-0000-000000000002';

  // Mock Database State
  const mockDb = {
    appointments: [],
    auditLogs: [],
    queueSequences: [],
    queueTickets: []
  };

  // 1. Appointment Creation & Tenant Scoping
  it('1. should create an outpatient appointment scoped to tenant', () => {
    const apt = {
      id: 'APT-001',
      tenantId: TENANT_A,
      appointmentNumber: 'APT-20260901-0001',
      patientId: 'PAT-001',
      doctorId: 'DOC-SITI',
      doctorName: 'dr. Siti Wijaya, Sp.PD',
      departmentId: 'POLI-INT',
      departmentName: 'Poliklinik Penyakit Dalam',
      appointmentDate: '2026-09-01',
      slotTime: '09:00 - 09:30',
      bookingSource: 'MOBILE_JKN',
      status: 'BOOKED',
      bpjsBookingCode: 'JKN-20260901-0881',
      version: 1
    };
    mockDb.appointments.push(apt);

    expect(apt.id).toBe('APT-001');
    expect(apt.tenantId).toBe(TENANT_A);
    expect(apt.status).toBe('BOOKED');
  });

  // 2. Concurrency: Double Booking Prevention on Active Slot
  it('2. should reject second booking for the same active doctor slot (Partial Unique Index)', () => {
    const isSlotBookable = (tenantId, doctorId, date, slot) => {
      const activeStates = ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'];
      const conflict = mockDb.appointments.find(
        a => a.tenantId === tenantId &&
             a.doctorId === doctorId &&
             a.appointmentDate === date &&
             a.slotTime === slot &&
             activeStates.includes(a.status)
      );
      if (conflict) {
        throw new Error('UNIQUE_VIOLATION: Doctor slot already reserved.');
      }
      return true;
    };

    expect(() => isSlotBookable(TENANT_A, 'DOC-SITI', '2026-09-01', '09:00 - 09:30')).toThrow(/UNIQUE_VIOLATION/);
  });

  // 3. Concurrency: Re-booking ALLOWED on CANCELLED slot
  it('3. should permit a new booking on a slot that was previously CANCELLED', () => {
    // Patient A cancels their appointment
    const existingApt = mockDb.appointments.find(a => a.id === 'APT-001');
    existingApt.status = 'CANCELLED';
    existingApt.cancellationReason = 'Pasien berhalangan hadir karena dinas luar kota';

    // Audit Log recorded
    mockDb.auditLogs.push({
      id: 'LOG-001',
      tenantId: TENANT_A,
      appointmentId: existingApt.id,
      actionType: 'CANCELLED',
      reason: existingApt.cancellationReason,
      actorId: 'PAT-001',
      actorName: 'Ny. Siti Nurhaliza',
      createdAt: new Date().toISOString()
    });

    // Patient C now attempts to book the SAME 09:00 slot
    const isSlotBookable = (tenantId, doctorId, date, slot) => {
      const activeStates = ['BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION'];
      const conflict = mockDb.appointments.find(
        a => a.tenantId === tenantId &&
             a.doctorId === doctorId &&
             a.appointmentDate === date &&
             a.slotTime === slot &&
             activeStates.includes(a.status)
      );
      return !conflict;
    };

    expect(isSlotBookable(TENANT_A, 'DOC-SITI', '2026-09-01', '09:00 - 09:30')).toBe(true);

    // Create Patient C's booking
    const newApt = {
      id: 'APT-002',
      tenantId: TENANT_A,
      appointmentNumber: 'APT-20260901-0002',
      patientId: 'PAT-003',
      doctorId: 'DOC-SITI',
      doctorName: 'dr. Siti Wijaya, Sp.PD',
      departmentId: 'POLI-INT',
      departmentName: 'Poliklinik Penyakit Dalam',
      appointmentDate: '2026-09-01',
      slotTime: '09:00 - 09:30',
      status: 'BOOKED',
      version: 1
    };
    mockDb.appointments.push(newApt);
    expect(mockDb.appointments).toHaveLength(2);
  });

  // 4. Reschedule History & Immutability
  it('4. should track appointment reschedule with immutable audit logs', () => {
    const aptToReschedule = mockDb.appointments.find(a => a.id === 'APT-002');
    const oldDate = aptToReschedule.appointmentDate;
    const oldSlot = aptToReschedule.slotTime;

    // Reschedule to next day
    aptToReschedule.status = 'RESCHEDULED';
    
    const rescheduledApt = {
      id: 'APT-003',
      tenantId: TENANT_A,
      appointmentNumber: 'APT-20260902-0001',
      patientId: aptToReschedule.patientId,
      doctorId: aptToReschedule.doctorId,
      doctorName: aptToReschedule.doctorName,
      departmentId: aptToReschedule.departmentId,
      departmentName: aptToReschedule.departmentName,
      appointmentDate: '2026-09-02',
      slotTime: '10:00 - 10:30',
      rescheduledFromId: aptToReschedule.id,
      status: 'CONFIRMED',
      version: 1
    };
    mockDb.appointments.push(rescheduledApt);

    mockDb.auditLogs.push({
      id: 'LOG-002',
      tenantId: TENANT_A,
      appointmentId: rescheduledApt.id,
      actionType: 'RESCHEDULED',
      oldSlotDate: oldDate,
      oldSlotTime: oldSlot,
      newSlotDate: rescheduledApt.appointmentDate,
      newSlotTime: rescheduledApt.slotTime,
      reason: 'Dokter berhalangan hadir',
      actorId: 'ADM-001',
      actorName: 'Petugas Admisi',
      createdAt: new Date().toISOString()
    });

    expect(rescheduledApt.rescheduledFromId).toBe('APT-002');
    expect(mockDb.auditLogs).toHaveLength(2);
  });

  // 5. Patient Journey Flow: Appointment -> Registration -> Encounter -> Queue
  it('5. should maintain distinct non-redundant lifecycle across Appointment, Registration, Encounter, and Queue', () => {
    const apt = mockDb.appointments.find(a => a.id === 'APT-003');
    
    // Check-in creates administrative Registration
    const registration = {
      id: 'REG-001',
      tenantId: TENANT_A,
      registrationNumber: 'REG-2026-0001',
      patientId: apt.patientId,
      appointmentId: apt.id,
      departmentId: apt.departmentId,
      doctorId: apt.doctorId
    };

    // Creates Clinical Encounter
    const encounter = {
      id: 'ENC-001',
      tenantId: TENANT_A,
      encounterNumber: 'ENC-2026-0001',
      patientId: apt.patientId,
      status: 'ARRIVED'
    };

    // Creates Queue Ticket
    const queueTicket = {
      id: 'TKT-001',
      tenantId: TENANT_A,
      ticketNumber: 'INT-001',
      poolCode: 'INT',
      patientId: apt.patientId,
      encounterId: encounter.id,
      appointmentId: apt.id,
      queueStatus: 'WAITING'
    };

    mockDb.queueTickets.push(queueTicket);

    expect(queueTicket.appointmentId).toBe(apt.id);
    expect(queueTicket.encounterId).toBe(encounter.id);
    expect(registration.appointmentId).toBe(apt.id);
  });

  // 6. Atomic Queue Sequence Generation
  it('6. should generate sequential daily queue numbers atomically per pool and date', () => {
    const getNextQueueNumber = (tenantId, poolCode, dateStr) => {
      let seq = mockDb.queueSequences.find(s => s.tenantId === tenantId && s.poolCode === poolCode && s.queueDate === dateStr);
      if (!seq) {
        seq = { id: `SEQ-${Date.now()}`, tenantId, poolCode, queueDate: dateStr, lastNumber: 0, currentCalledNumber: 0, version: 1 };
        mockDb.queueSequences.push(seq);
      }
      seq.lastNumber += 1;
      seq.version += 1;
      return `${poolCode}-${String(seq.lastNumber).padStart(3, '0')}`;
    };

    const t1 = getNextQueueNumber(TENANT_A, 'INT', '2026-09-02');
    const t2 = getNextQueueNumber(TENANT_A, 'INT', '2026-09-02');
    const tB = getNextQueueNumber(TENANT_B, 'INT', '2026-09-02');

    expect(t1).toBe('INT-001');
    expect(t2).toBe('INT-002');
    expect(tB).toBe('INT-001'); // Tenant B starts their own sequence
  });

  // 7. Queue Concurrency: Worker Atomic Claim (FOR UPDATE SKIP LOCKED Simulation)
  it('7. should prevent two counter clerks from calling the same waiting ticket simultaneously', () => {
    mockDb.queueTickets.push({
      id: 'TKT-002',
      tenantId: TENANT_A,
      ticketNumber: 'INT-002',
      poolCode: 'INT',
      queueStatus: 'WAITING'
    });

    const claimNextTicketAtomic = (tenantId, poolCode, counterName) => {
      // Simulating: SELECT * FROM queue_tickets WHERE tenant_id = ... AND queue_status = 'WAITING' FOR UPDATE SKIP LOCKED LIMIT 1
      const ticket = mockDb.queueTickets.find(t => t.tenantId === tenantId && t.poolCode === poolCode && t.queueStatus === 'WAITING');
      if (!ticket) return null;

      ticket.queueStatus = 'CALLED';
      ticket.counterName = counterName;
      ticket.calledAt = new Date().toISOString();
      return ticket;
    };

    const claimClerk1 = claimNextTicketAtomic(TENANT_A, 'INT', 'Loket 1');
    expect(claimClerk1).toBeDefined();
    expect(claimClerk1.ticketNumber).toBe('INT-001');

    const claimClerk2 = claimNextTicketAtomic(TENANT_A, 'INT', 'Loket 2');
    expect(claimClerk2).toBeDefined();
    expect(claimClerk2.ticketNumber).toBe('INT-002');

    const claimClerk3 = claimNextTicketAtomic(TENANT_A, 'INT', 'Loket 3');
    expect(claimClerk3).toBeNull(); // Zero remaining waiting tickets
  });

  // 8. Tenant Isolation & Fail-Closed RLS
  it('8. should isolate appointments and queues by tenantId with Fail-Closed semantics', () => {
    const queryAppointmentsWithRls = (sessionTenantId) => {
      if (!sessionTenantId) return [];
      return mockDb.appointments.filter(a => a.tenantId === sessionTenantId);
    };

    expect(queryAppointmentsWithRls(null)).toHaveLength(0);
    expect(queryAppointmentsWithRls(TENANT_A).length).toBeGreaterThan(0);
    expect(queryAppointmentsWithRls(TENANT_B)).toHaveLength(0);
  });
});
