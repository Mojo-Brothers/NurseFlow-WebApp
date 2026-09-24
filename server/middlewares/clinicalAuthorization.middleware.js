/**
 * NurseFlow Enterprise HIS 2026 — Master Clinical Authorization Middleware (RFC 7807 Standard)
 * Consumes the central authorizationDecisionService to evaluate actions before controller execution.
 */

import { authorizationDecisionService } from '../services/authorizationDecision.service.js';
import { PROBLEM_TYPES } from '../contracts/problemDetails.contract.js';
import { AUTHORIZATION_DECISIONS } from '../contracts/authorizationDecision.contract.js';

export const requireClinicalAuthorization = ({
  action,
  procedureCode = 'N/A',
  targetUnitId = 'GENERAL',
  requiredCredentialType = 'SIP',
  resourceResolver = null
}) => {
  return async (req, res, next) => {
    const correlationId = req.correlationId || req.headers?.['x-correlation-id'] || `CORR-${Date.now()}`;
    const context = req.authContext;

    if (!context) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }
      return res.status(401).json({
        success: false,
        statusCode: 401,
        error: 'UNAUTHORIZED',
        type: PROBLEM_TYPES.AUTHENTICATION_ERROR,
        title: 'Authentication Required',
        status: 401,
        detail: 'Konteks otorisasi tidak ditemukan. Harap login terlebih dahulu.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: 'AUTH_REQUIRED'
      });
    }

    let resource = null;
    let resourceType = null;
    let resourceId = null;

    if (typeof resourceResolver === 'function') {
      try {
        const resolved = await resourceResolver(req);
        if (resolved) {
          resource = resolved.resource || null;
          resourceType = resolved.resourceType || null;
          resourceId = resolved.resourceId || null;
        }
      } catch (err) {
        if (typeof res.setHeader === 'function') {
          res.setHeader('Content-Type', 'application/problem+json');
          res.setHeader('X-Correlation-ID', correlationId);
        }
        return res.status(400).json({
          success: false,
          statusCode: 400,
          error: 'RESOURCE_RESOLUTION_FAILED',
          type: PROBLEM_TYPES.VALIDATION_ERROR,
          title: 'Resource Resolution Failed',
          status: 400,
          detail: err.message,
          instance: req.originalUrl || req.path,
          correlationId,
          code: 'RESOURCE_RESOLUTION_FAILED'
        });
      }
    }

    const authResult = await authorizationDecisionService.evaluateAuthorization({
      context,
      action,
      resource,
      resourceType,
      resourceId,
      procedureCode,
      targetUnitId,
      requiredCredentialType,
      correlationId,
      allowBreakTheGlass: req.headers?.['x-break-the-glass'] === 'true',
      breakTheGlassReason: req.headers?.['x-break-the-glass-reason'] || req.body?.breakTheGlassReason || null
    });

    if (!authResult.isAuthorized) {
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/problem+json');
        res.setHeader('X-Correlation-ID', correlationId);
      }

      // Distinguish status codes based on decision
      const statusCode = (authResult.decision === AUTHORIZATION_DECISIONS.DENIED_AUTHENTICATION_REQUIRED) ? 401 : 403;

      return res.status(statusCode).json({
        success: false,
        statusCode,
        error: authResult.decision,
        type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
        title: 'Clinical Authorization Denied',
        status: statusCode,
        detail: authResult.reason || 'Akses ditolak oleh kebijakan otorisasi klinis.',
        instance: req.originalUrl || req.path,
        correlationId,
        code: authResult.decision,
        metadata: authResult.metadata
      });
    }

    return next();
  };
};
