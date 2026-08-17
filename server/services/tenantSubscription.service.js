/**
 * NurseFlow Enterprise HIS 2026 — Multi-Tenant SaaS Subscription & Licensing Engine
 * Tiers: STARTER_CLINIC, PROFESSIONAL_HOSPITAL, ENTERPRISE_NETWORK
 */

export const SUBSCRIPTION_PLANS = {
  STARTER_CLINIC: {
    planId: 'STARTER_CLINIC',
    name: 'NurseFlow Starter (Klinik Pratama & Rawat Jalan)',
    maxBeds: 0,
    maxUsers: 15,
    features: ['FRONT_OFFICE', 'OUTPATIENT_EMR', 'BILLING', 'BPJS_VCLAIM']
  },
  PROFESSIONAL_HOSPITAL: {
    planId: 'PROFESSIONAL_HOSPITAL',
    name: 'NurseFlow Professional (Rumah Sakit Tipe C/D)',
    maxBeds: 150,
    maxUsers: 100,
    features: ['FRONT_OFFICE', 'OUTPATIENT_EMR', 'INPATIENT_ADT', 'EMAR', 'LIS', 'RIS_PACS', 'BILLING', 'SATUSEHAT', 'BPJS_VCLAIM']
  },
  ENTERPRISE_NETWORK: {
    planId: 'ENTERPRISE_NETWORK',
    name: 'NurseFlow Enterprise (Jaringan Rumah Sakit Multi-Cabang)',
    maxBeds: 9999,
    maxUsers: 9999,
    features: ['ALL_MODULES', 'MULTI_BRANCH', 'COT_SURGERY', 'ICU_CRITICAL_CARE', 'BLOOD_BANK', 'EMPI_CENTRAL', 'WHITE_LABEL', 'API_ACCESS']
  }
};

class TenantSubscriptionService {
  constructor() {
    this.tenants = new Map();
  }

  /**
   * Onboard New Hospital Tenant
   */
  onboardTenant({
    tenantId = `TENANT-${Date.now()}`,
    organizationName,
    planId = 'PROFESSIONAL_HOSPITAL',
    billingContactEmail,
    trialDays = 30
  }) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) throw new Error(`Plan ${planId} tidak valid.`);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + trialDays);

    const tenant = {
      tenantId,
      organizationName,
      plan,
      status: 'ACTIVE_TRIAL',
      onboardedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      activeUsersCount: 1,
      activeBedsCount: 0
    };

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  /**
   * Check if Tenant is Authorized for a Specific HIS Feature
   */
  isFeatureAllowed(tenantId, featureKey) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'EXPIRED') {
      return false;
    }

    if (tenant.plan.features.includes('ALL_MODULES')) return true;
    return tenant.plan.features.includes(featureKey);
  }

  getTenant(tenantId) {
    return this.tenants.get(tenantId);
  }
}

export const tenantSubscriptionService = new TenantSubscriptionService();
