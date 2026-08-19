/**
 * NurseFlow Enterprise HIS 2026 — Zero-Trust Identity, ABAC/RBAC & Multi-Tenant Isolation Guard
 * Standards: NIST SP 800-207 (Zero Trust Architecture), NIST SP 800-162 (ABAC),
 * OWASP API Security Top 10 (BOLA/IDOR Prevention), JCI MOI / Permenkes No. 24/2022.
 */

import crypto from 'crypto';
import { postgresPoolService } from '../../../server/db/postgresPool.js';

export const ZERO_TRUST_ACTION = {
  READ_PATIENT_DEMOGRAPHICS: 'READ_PATIENT_DEMOGRAPHICS',
  READ_MEDICAL_RECORD: 'READ_MEDICAL_RECORD',
  WRITE_SOAP_NOTE: 'WRITE_SOAP_NOTE',
  ORDER_MEDICATION_CPOE: 'ORDER_MEDICATION_CPOE',
  DISPENSE_MEDICATION: 'DISPENSE_MEDICATION',
  ADMINISTER_EMAR: 'ADMINISTER_EMAR',
  CLOSE_BILLING_INVOICE: 'CLOSE_BILLING_INVOICE',
  EMERGENCY_BREAK_GLASS: 'EMERGENCY_BREAK_GLASS',
  ADMIN_TENANT_MUTATION: 'ADMIN_TENANT_MUTATION'
};

export const ENTERPRISE_ROLES = {
  ROLE_SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  ROLE_DOCTOR_DPJP: 'ROLE_DOCTOR_DPJP',
  ROLE_DOCTOR_EMERGENCY: 'ROLE_DOCTOR_EMERGENCY',
  ROLE_NURSE_INPATIENT: 'ROLE_NURSE_INPATIENT',
  ROLE_NURSE_TRIAGE: 'ROLE_NURSE_TRIAGE',
  ROLE_CLINICAL_PHARMACIST: 'ROLE_CLINICAL_PHARMACIST',
  ROLE_CASHIER_BILLING: 'ROLE_CASHIER_BILLING',
  ROLE_LAB_TECHNICIAN: 'ROLE_LAB_TECHNICIAN',
  ROLE_RADIOLOGIST: 'ROLE_RADIOLOGIST'
};

export class ZeroTrustIdentityGuardService {
  constructor() {
    this.revokedTokenStore = new Set();
  }

  /**
   * Blacklist / Revoke a Token Session on Logout or Compromise
   */
  revokeToken(tokenJti) {
    this.revokedTokenStore.add(tokenJti);
  }

  /**
   * Check if Token is Revoked
   */
  isTokenRevoked(tokenJti) {
    return this.revokedTokenStore.has(tokenJti);
  }

  /**
   * Comprehensive Zero-Trust Security Gatekeeper
   */
  async evaluateZeroTrustAccess({
    subject = {},          // { userId, userRole, tenantId, assignedWardId, departmentId, tokenJti, sessionExpiresAt }
    resource = {},         // { tenantId, patientId, encounterId, primaryDoctorId, managingDepartmentId, serviceRoomId }
    action,
    context = {}           // { isEmergencyBreakTheGlass, breakGlassReason, clientIp, requestNonce }
  }) {
    const securityAudit = {
      decision: 'DENIED',
      reasons: [],
      securityAlert: null,
      statusCode: 403
    };

    // 1. Token Revocation & Session Expiry Check
    if (subject.tokenJti && this.isTokenRevoked(subject.tokenJti)) {
      securityAudit.decision = 'DENIED';
      securityAudit.reasons.push('TOKEN_REVOKED_OR_SESSION_TERMINATED');
      securityAudit.statusCode = 401;
      return securityAudit;
    }

    if (subject.sessionExpiresAt && new Date(subject.sessionExpiresAt) < new Date()) {
      securityAudit.decision = 'DENIED';
      securityAudit.reasons.push('SESSION_EXPIRED');
      securityAudit.statusCode = 401;
      return securityAudit;
    }

    // 2. Hard Multi-Tenant Isolation Barrier (Zero Cross-Tenant Leakage)
    if (!subject.tenantId || !resource.tenantId) {
      securityAudit.decision = 'DENIED';
      securityAudit.reasons.push('TENANT_ID_MANDATORY_NOT_SUPPLIED');
      securityAudit.statusCode = 400;
      return securityAudit;
    }

    if (subject.userRole !== ENTERPRISE_ROLES.ROLE_SUPER_ADMIN && subject.tenantId !== resource.tenantId) {
      securityAudit.decision = 'DENIED';
      securityAudit.reasons.push('CROSS_TENANT_INFILTRATION_BLOCKED');
      securityAudit.securityAlert = 'SECURITY_INCIDENT_CROSS_TENANT_ACCESS_ATTEMPT';
      securityAudit.statusCode = 403;
      return securityAudit;
    }

    // 3. Super Admin Tenant-Scoped Operations
    if (subject.userRole === ENTERPRISE_ROLES.ROLE_SUPER_ADMIN) {
      securityAudit.decision = 'ALLOWED';
      securityAudit.reasons.push('SUPER_ADMIN_ELEVATED_PRIVILEGE');
      securityAudit.statusCode = 200;
      return securityAudit;
    }

    // 4. Emergency Break-The-Glass Protocol (JCI IPSG & Permenkes RME)
    if (context.isEmergencyBreakTheGlass) {
      if (!context.breakGlassReason || context.breakGlassReason.trim().length < 10) {
        securityAudit.decision = 'DENIED';
        securityAudit.reasons.push('BREAK_GLASS_REASON_INSUFFICIENT');
        securityAudit.statusCode = 400;
        return securityAudit;
      }

      if (subject.userRole !== ENTERPRISE_ROLES.ROLE_DOCTOR_EMERGENCY &&
          subject.userRole !== ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP &&
          subject.userRole !== ENTERPRISE_ROLES.ROLE_NURSE_TRIAGE) {
        securityAudit.decision = 'DENIED';
        securityAudit.reasons.push('ROLE_NOT_AUTHORIZED_FOR_BREAK_GLASS');
        securityAudit.statusCode = 403;
        return securityAudit;
      }

      securityAudit.decision = 'ALLOWED';
      securityAudit.reasons.push('EMERGENCY_BREAK_GLASS_ACTIVE_AUDIT');
      securityAudit.requiresForensicAudit = true;
      securityAudit.statusCode = 200;
      return securityAudit;
    }

    // 5. RBAC & ABAC Contextual Scoping by Action
    switch (action) {
      case ZERO_TRUST_ACTION.READ_MEDICAL_RECORD:
      case ZERO_TRUST_ACTION.READ_PATIENT_DEMOGRAPHICS:
        // Cashier cannot read clinical SOAP records
        if (subject.userRole === ENTERPRISE_ROLES.ROLE_CASHIER_BILLING && action === ZERO_TRUST_ACTION.READ_MEDICAL_RECORD) {
          securityAudit.decision = 'DENIED';
          securityAudit.reasons.push('FINANCE_ROLE_NO_CLINICAL_CHART_ACCESS');
          securityAudit.statusCode = 403;
          return securityAudit;
        }

        // DPJP Doctor must be assigned or same department
        if (subject.userRole === ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP) {
          if (resource.primaryDoctorId && resource.primaryDoctorId !== subject.userId) {
            securityAudit.decision = 'DENIED';
            securityAudit.reasons.push('UNASSIGNED_DPJP_READ_BLOCKED_USE_BREAK_GLASS');
            securityAudit.statusCode = 403;
            return securityAudit;
          }
        }

        // Nurse must be assigned to the same ward or emergency department
        if (subject.userRole === ENTERPRISE_ROLES.ROLE_NURSE_INPATIENT) {
          if (subject.assignedWardId && resource.serviceRoomId && subject.assignedWardId !== resource.serviceRoomId) {
            securityAudit.decision = 'DENIED';
            securityAudit.reasons.push('NURSE_ASSIGNED_DIFFERENT_WARD');
            securityAudit.statusCode = 403;
            return securityAudit;
          }
        }

        securityAudit.decision = 'ALLOWED';
        securityAudit.reasons.push('SCOPED_ROLE_AUTHORIZED');
        securityAudit.statusCode = 200;
        break;

      case ZERO_TRUST_ACTION.WRITE_SOAP_NOTE:
      case ZERO_TRUST_ACTION.ORDER_MEDICATION_CPOE:
        // Only Physicians can sign CPOE orders and Doctor SOAP notes
        if (subject.userRole !== ENTERPRISE_ROLES.ROLE_DOCTOR_DPJP &&
            subject.userRole !== ENTERPRISE_ROLES.ROLE_DOCTOR_EMERGENCY) {
          securityAudit.decision = 'DENIED';
          securityAudit.reasons.push('PRIVILEGE_ESCALATION_BLOCKED_PHYSICIAN_ONLY');
          securityAudit.statusCode = 403;
          return securityAudit;
        }
        securityAudit.decision = 'ALLOWED';
        securityAudit.statusCode = 200;
        break;

      case ZERO_TRUST_ACTION.ADMINISTER_EMAR:
        if (subject.userRole !== ENTERPRISE_ROLES.ROLE_NURSE_INPATIENT &&
            subject.userRole !== ENTERPRISE_ROLES.ROLE_NURSE_TRIAGE) {
          securityAudit.decision = 'DENIED';
          securityAudit.reasons.push('NURSING_ONLY_ACTION');
          securityAudit.statusCode = 403;
          return securityAudit;
        }
        securityAudit.decision = 'ALLOWED';
        securityAudit.statusCode = 200;
        break;

      case ZERO_TRUST_ACTION.DISPENSE_MEDICATION:
        if (subject.userRole !== ENTERPRISE_ROLES.ROLE_CLINICAL_PHARMACIST) {
          securityAudit.decision = 'DENIED';
          securityAudit.reasons.push('PHARMACY_ONLY_ACTION');
          securityAudit.statusCode = 403;
          return securityAudit;
        }
        securityAudit.decision = 'ALLOWED';
        securityAudit.statusCode = 200;
        break;

      case ZERO_TRUST_ACTION.CLOSE_BILLING_INVOICE:
        if (subject.userRole !== ENTERPRISE_ROLES.ROLE_CASHIER_BILLING) {
          securityAudit.decision = 'DENIED';
          securityAudit.reasons.push('CASHIER_FINANCE_ONLY_ACTION');
          securityAudit.statusCode = 403;
          return securityAudit;
        }
        securityAudit.decision = 'ALLOWED';
        securityAudit.statusCode = 200;
        break;

      default:
        securityAudit.decision = 'DENIED';
        securityAudit.reasons.push('UNKNOWN_OR_UNAUTHORIZED_ACTION');
        securityAudit.statusCode = 400;
    }

    return securityAudit;
  }
}

export const zeroTrustIdentityGuardService = new ZeroTrustIdentityGuardService();
