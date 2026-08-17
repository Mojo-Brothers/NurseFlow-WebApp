import { describe, it, expect } from 'vitest';
import { tenantSubscriptionService } from '../server/services/tenantSubscription.service.js';

describe('Multi-Tenant SaaS Subscription & Licensing Engine', () => {
  const tenantId = 'TENANT-HOSPITAL-ALPHA';

  it('should onboard a new hospital tenant with Professional Plan', () => {
    const tenant = tenantSubscriptionService.onboardTenant({
      tenantId,
      organizationName: 'RS Medika Utama',
      planId: 'PROFESSIONAL_HOSPITAL',
      billingContactEmail: 'admin@medikautama.co.id'
    });

    expect(tenant.status).toBe('ACTIVE_TRIAL');
    expect(tenant.plan.maxBeds).toBe(150);
  });

  it('should allow Professional features (e.g. INPATIENT_ADT, LIS) and gate Enterprise features', () => {
    expect(tenantSubscriptionService.isFeatureAllowed(tenantId, 'INPATIENT_ADT')).toBe(true);
    expect(tenantSubscriptionService.isFeatureAllowed(tenantId, 'LIS')).toBe(true);
    expect(tenantSubscriptionService.isFeatureAllowed(tenantId, 'WHITE_LABEL')).toBe(false);
  });
});
