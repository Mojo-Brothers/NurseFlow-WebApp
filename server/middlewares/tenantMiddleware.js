/**
 * NurseFlow Enterprise HIS 2026 — Multi-Tenant SaaS Isolation Middleware
 * Isolates data context across Multi-Hospital & Multi-Branch Networks.
 */

export const tenantMiddleware = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || process.env.DEFAULT_TENANT_ID || 'TENANT-HOSPITAL-01';
  const branchId = req.headers['x-branch-id'] || 'BRANCH-MAIN-CAMPUS';

  req.tenant = {
    tenantId,
    branchId,
    resolvedAt: new Date().toISOString()
  };

  res.setHeader('X-Tenant-ID', tenantId);
  res.setHeader('X-Branch-ID', branchId);

  next();
};
