/**
 * NurseFlow Enterprise HIS 2026 — Distributed Correlation ID Middleware
 * Standards: W3C Trace Context, OpenTelemetry, JCI Traceability & Audit Logging
 */

import crypto from 'crypto';

export const correlationIdMiddleware = (req, res, next) => {
  const incomingCorrelationId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  const correlationId = incomingCorrelationId && incomingCorrelationId.trim().length > 0
    ? incomingCorrelationId.trim()
    : `CORR-${crypto.randomUUID()}`;

  req.correlationId = correlationId;
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  next();
};
