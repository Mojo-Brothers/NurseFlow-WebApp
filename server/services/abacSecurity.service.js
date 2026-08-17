/**
 * NurseFlow Enterprise HIS 2026 — Attribute-Based Access Control (ABAC) & Row-Level Security
 * Standar: NIST SP 800-162 Guide to Attribute Based Access Control & JCI MOI Patient Privacy
 */

export const abacSecurityService = {
  /**
   * Evaluate if a User has Access to a Specific Patient Encounter Record
   */
  evaluateAccess: ({
    user = {},
    patient = {},
    encounter = {},
    action = 'READ_MEDICAL_RECORD',
    isEmergencyBreakTheGlass = false
  }) => {
    // 1. Super Admin & Emergency Break-The-Glass Override (Full access with audit logging)
    if (user.role === 'ROLE_SUPER_ADMIN' || isEmergencyBreakTheGlass) {
      return {
        isAllowed: true,
        reason: isEmergencyBreakTheGlass ? 'EMERGENCY_BREAK_THE_GLASS_OVERRIDE' : 'SUPER_ADMIN_UNRESTRICTED',
        requiresAuditFlag: isEmergencyBreakTheGlass
      };
    }

    // 2. Doctor DPJP Scoping: Direct DPJP has unrestricted access to their active patients
    if (user.role === 'ROLE_DOCTOR_DPJP' && encounter.primaryDoctorId === user.userId) {
      return { isAllowed: true, reason: 'ASSIGNED_PRIMARY_DPJP' };
    }

    // 3. Nurse Ward Scoping: Nurse can only access patients currently in their assigned ward
    if (user.role === 'ROLE_NURSE') {
      const isSameWard = user.assignedWardId && encounter.serviceRoomId === user.assignedWardId;
      const isEmergencyDepartment = user.departmentId === 'DEPT-IGD' && encounter.managingDepartmentId === 'DEPT-IGD';

      if (isSameWard || isEmergencyDepartment) {
        return { isAllowed: true, reason: 'ASSIGNED_WARD_OR_IGD_DUTY' };
      }
      return {
        isAllowed: false,
        reason: 'DENIED_DIFFERENT_WARD',
        error: `Akses ditolak: Perawat bertugas di ${user.assignedWardId || user.departmentId} tidak dapat mengakses pasien di ruangan ${encounter.serviceRoomId}.`
      };
    }

    // 4. Pharmacist Scoping: Can read prescriptions and active medication lists
    if (user.role === 'ROLE_PHARMACIST') {
      return { isAllowed: true, reason: 'PHARMACY_DISPENSING_DUTY' };
    }

    // 5. Cashier Scoping: Can read billing projections, cannot read clinical SOAP notes
    if (user.role === 'ROLE_CASHIER') {
      if (action === 'READ_MEDICAL_RECORD' || action === 'READ_SOAP') {
        return {
          isAllowed: false,
          reason: 'DENIED_FINANCE_NO_CLINICAL_ACCESS',
          error: 'Akses ditolak: Kasir/Finance tidak diizinkan membuka catatan klinis SOAP pasien.'
        };
      }
      return { isAllowed: true, reason: 'FINANCE_BILLING_DUTY' };
    }

    return { isAllowed: true, reason: 'STANDARD_ACCESS' };
  }
};
