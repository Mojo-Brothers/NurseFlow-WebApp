/**
 * NurseFlow Enterprise HIS 2026 — RFC 7807 Problem Details Contract (FROZEN v1.0)
 * Standards: IETF RFC 7807 (Problem Details for HTTP APIs), HL7 FHIR OperationOutcome, JCI IPSG
 */

export const PROBLEM_DETAILS_BASE_URI = 'https://nurseflow.local/problems';

export const PROBLEM_TYPES = Object.freeze({
  VALIDATION_ERROR: `${PROBLEM_DETAILS_BASE_URI}/validation-error`,
  AUTHENTICATION_ERROR: `${PROBLEM_DETAILS_BASE_URI}/unauthenticated`,
  AUTHORIZATION_ERROR: `${PROBLEM_DETAILS_BASE_URI}/forbidden`,
  NOT_FOUND: `${PROBLEM_DETAILS_BASE_URI}/not-found`,
  CONFLICT: `${PROBLEM_DETAILS_BASE_URI}/conflict`,
  IDEMPOTENCY_CONFLICT: `${PROBLEM_DETAILS_BASE_URI}/idempotency-key-reuse-with-different-payload`,
  UNPROCESSABLE_ENTITY: `${PROBLEM_DETAILS_BASE_URI}/unprocessable-entity`,
  RESOURCE_LOCKED: `${PROBLEM_DETAILS_BASE_URI}/resource-locked`,
  SERVICE_UNAVAILABLE: `${PROBLEM_DETAILS_BASE_URI}/service-unavailable`,
  INTERNAL_SERVER_ERROR: `${PROBLEM_DETAILS_BASE_URI}/internal-server-error`
});

/**
 * Standard RFC 7807 Problem Details Structure
 */
export class ProblemDetailsException extends Error {
  constructor({
    type = PROBLEM_TYPES.INTERNAL_SERVER_ERROR,
    title = 'An unexpected error occurred',
    status = 500,
    detail = 'The server encountered an error processing your request.',
    instance = null,
    correlationId = null,
    code = null,
    errors = []
  }) {
    super(detail);
    this.name = 'ProblemDetailsException';
    this.type = type;
    this.title = title;
    this.status = status;
    this.detail = detail;
    this.instance = instance;
    this.correlationId = correlationId;
    this.code = code;
    this.errors = errors;
  }

  toJSON() {
    const payload = {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail
    };
    if (this.instance) payload.instance = this.instance;
    if (this.correlationId) payload.correlationId = this.correlationId;
    if (this.code) payload.code = this.code;
    if (this.errors && this.errors.length > 0) payload.errors = this.errors;
    return payload;
  }
}

export class ValidationError extends ProblemDetailsException {
  constructor({
    detail = 'One or more fields are invalid.',
    errors = [],
    code = 'VALIDATION_FAILED',
    instance = null,
    correlationId = null
  }) {
    super({
      type: PROBLEM_TYPES.VALIDATION_ERROR,
      title: 'Validation failed',
      status: 422,
      detail,
      instance,
      correlationId,
      code,
      errors
    });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ProblemDetailsException {
  constructor({
    detail = 'The requested resource was not found.',
    code = 'NOT_FOUND',
    instance = null,
    correlationId = null
  }) {
    super({
      type: PROBLEM_TYPES.NOT_FOUND,
      title: 'Resource Not Found',
      status: 404,
      detail,
      instance,
      correlationId,
      code
    });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ProblemDetailsException {
  constructor({
    detail = 'The request could not be completed due to a conflict with the current state of the resource.',
    code = 'CONFLICT',
    instance = null,
    correlationId = null
  }) {
    super({
      type: PROBLEM_TYPES.CONFLICT,
      title: 'Conflict',
      status: 409,
      detail,
      instance,
      correlationId,
      code
    });
    this.name = 'ConflictError';
  }
}

export class IdempotencyConflictError extends ProblemDetailsException {
  constructor({
    idempotencyKey = '',
    detail = null,
    instance = null,
    correlationId = null
  }) {
    super({
      type: PROBLEM_TYPES.IDEMPOTENCY_CONFLICT,
      title: 'Idempotency Key Reuse Conflict',
      status: 409,
      detail: detail || `Idempotency key [${idempotencyKey}] telah digunakan sebelumnya dengan payload data yang berbeda.`,
      instance,
      correlationId,
      code: 'IDEMPOTENCY_KEY_REUSE_WITH_DIFFERENT_PAYLOAD'
    });
    this.name = 'IdempotencyConflictError';
  }
}

export class UnauthorizedError extends ProblemDetailsException {
  constructor({
    detail = 'Authentication is required to access this resource.',
    code = 'AUTH_REQUIRED',
    instance = null,
    correlationId = null
  }) {
    super({
      type: PROBLEM_TYPES.AUTHENTICATION_ERROR,
      title: 'Authentication Required',
      status: 401,
      detail,
      instance,
      correlationId,
      code
    });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ProblemDetailsException {
  constructor({
    detail = 'You do not have permission to perform this action.',
    code = 'PERMISSION_DENIED',
    instance = null,
    correlationId = null
  }) {
    super({
      type: PROBLEM_TYPES.AUTHORIZATION_ERROR,
      title: 'Forbidden',
      status: 403,
      detail,
      instance,
      correlationId,
      code
    });
    this.name = 'ForbiddenError';
  }
}
