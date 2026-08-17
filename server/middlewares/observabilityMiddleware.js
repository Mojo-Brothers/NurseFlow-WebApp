/**
 * NurseFlow Enterprise HIS 2026 — Observability & Request Tracing Middleware
 * Tracks latency, correlation ID, metrics increment, and structured JSON access logs.
 */

import { metricsService } from '../services/metrics.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

export const observabilityMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `REQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Capture response finish
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    // 1. Record Prometheus Metric
    metricsService.recordHttpRequest(method, route, statusCode, durationMs);

    // 2. Emit Structured JSON Log
    structuredLoggerService.info(`HTTP ${method} ${route} -> ${statusCode} (${durationMs}ms)`, {
      service: 'http-gateway',
      userId: req.user?.id || 'ANONYMOUS',
      requestId,
      route,
      latency: durationMs,
      metadata: {
        statusCode,
        ip: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent']
      }
    });
  });

  next();
};
