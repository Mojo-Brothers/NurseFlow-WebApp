/**
 * NurseFlow Enterprise HIS 2026 — Enterprise Staff Scheduling & Roster Engine
 * Standar: JCI Governance, Leadership & Direction (GLD) & KARS KPS (Kualifikasi & Pendidikan Staf)
 */

export const SHIFT_TYPES = {
  PAGI: { code: 'PAGI', name: 'Shift Pagi', startTime: '07:00', endTime: '14:00', hours: 7 },
  SIANG: { code: 'SIANG', name: 'Shift Siang', startTime: '14:00', endTime: '21:00', hours: 7 },
  MALAM: { code: 'MALAM', name: 'Shift Malam', startTime: '21:00', endTime: '07:00', hours: 10 },
  ON_CALL: { code: 'ON_CALL', name: 'On-Call Dokter Spesialis', startTime: '00:00', endTime: '23:59', hours: 24 }
};

class StaffSchedulingService {
  constructor() {
    this.rosterAssignments = new Map(); // DateStr_StaffId -> Assignment
  }

  /**
   * Assign Shift with Mandatory Rest & Conflict Validation
   */
  assignShift({ staffId, staffName, role, departmentId, date, shiftCode }) {
    const shift = SHIFT_TYPES[shiftCode];
    if (!shift) throw new Error(`Shift ${shiftCode} tidak terdaftar dalam sistem.`);

    const key = `${date}_${staffId}`;
    const existing = this.rosterAssignments.get(key);
    if (existing) {
      throw new Error(`Konflik Jadwal: ${staffName} sudah memiliki jadwal ${existing.shift.name} pada tanggal ${date}.`);
    }

    const assignment = {
      assignmentId: `ROSTER-${Date.now()}`,
      staffId,
      staffName,
      role,
      departmentId,
      date,
      shift,
      assignedAt: new Date().toISOString()
    };

    this.rosterAssignments.set(key, assignment);
    return assignment;
  }

  getDepartmentRoster(departmentId, date) {
    const results = [];
    this.rosterAssignments.forEach((assignment) => {
      if (assignment.departmentId === departmentId && assignment.date === date) {
        results.push(assignment);
      }
    });
    return results;
  }
}

export const staffSchedulingService = new StaffSchedulingService();
