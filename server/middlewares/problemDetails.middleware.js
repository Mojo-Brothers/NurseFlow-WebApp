/**
 * NurseFlow Enterprise HIS 2026 — RFC 7807 Problem Details Global Error Middleware
 * Standards: IETF RFC 7807 (Problem Details for HTTP APIs), HL7 FHIR OperationOutcome, JCI IPSG
 */

import { PROBLEM_TYPES, ProblemDetailsException } from '../contracts/problemDetails.contract.js';

export const problemDetailsMiddleware = (err, req, res, next) => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
  const instance = req.originalUrl || req.path || '/api';

  // 1. Explicit ProblemDetailsException
  if (err instanceof ProblemDetailsException) {
    const status = err.status || 500;
    res.setHeader('Content-Type', 'application/problem+json');
    res.setHeader('X-Correlation-ID', correlationId);
    return res.status(status).json({
      type: err.type || PROBLEM_TYPES.INTERNAL_SERVER_ERROR,
      title: err.title || 'Error',
      status,
      detail: err.detail || err.message,
      instance,
      correlationId,
      code: err.code || undefined,
      errors: err.errors?.length > 0 ? err.errors : undefined
    });
  }

  // 2. SyntaxError (Malformed JSON in request body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.setHeader('Content-Type', 'application/problem+json');
    res.setHeader('X-Correlation-ID', correlationId);
    return res.status(400).json({
      type: PROBLEM_TYPES.VALIDATION_ERROR,
      title: 'Malformed JSON Payload',
      status: 400,
      detail: 'Request body contains malformed JSON syntax.',
      instance,
      correlationId,
      code: 'MALFORMED_JSON'
    });
  }

  // 3. Domain Specific Errors (CpoeDomainError, etc.)
  const status = err.statusCode || err.status || 500;
  let type = PROBLEM_TYPES.INTERNAL_SERVER_ERROR;
  let title = 'Internal Server Error';

  if (status === 400) {
    type = PROBLEM_TYPES.VALIDATION_ERROR;
    title = 'Validation or Domain Constraint Failed';
  } else if (status === 401) {
    type = PROBLEM_TYPES.AUTHENTICATION_ERROR;
    title = 'Authentication Required';
  } else if (status === 403) {
    type = PROBLEM_TYPES.AUTHORIZATION_ERROR;
    title = 'Access Forbidden';
  } else if (status === 404) {
    type = PROBLEM_TYPES.NOT_FOUND;
    title = 'Resource Not Found';
  } else if (status === 409) {
    type = PROBLEM_TYPES.CONFLICT;
    title = 'State Conflict';
  } else if (status === 422) {
    type = PROBLEM_TYPES.UNPROCESSABLE_ENTITY;
    title = 'Unprocessable Entity';
  } else if (status === 503) {
    type = PROBLEM_TYPES.SERVICE_UNAVAILABLE;
    title = 'Service Unavailable';
  }

  res.setHeader('Content-Type', 'application/problem+json');
  res.setHeader('X-Correlation-ID', correlationId);

  return res.status(status).json({
    type,
    title,
    status,
    detail: err.message || 'An unexpected error occurred during request processing.',
    instance,
    correlationId,
    code: err.code || undefined,
    errors: Array.isArray(err.details) && err.details.length > 0 ? err.details : undefined
  });
};
