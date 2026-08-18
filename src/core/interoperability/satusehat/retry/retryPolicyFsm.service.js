/**
 * NURSEFLOW ENTERPRISE HIS — SATUSEHAT RETRY POLICY & FSM
 * Deterministic HTTP error classification and exponential backoff calculator.
 */

export const OUTBOX_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  FAILED: 'FAILED',
  RETRY: 'RETRY',
  DEAD_LETTER: 'DEAD_LETTER'
});

export const ERROR_CLASSIFICATION = Object.freeze({
  AUTH_REFRESH: 'AUTH_REFRESH',         // 401: Refresh Token & Retry
  RATE_LIMITED: 'RATE_LIMITED',         // 429: Exponential Backoff with Jitter
  TRANSIENT_SERVER_ERROR: 'TRANSIENT_SERVER_ERROR', // 500, 502, 503, 504: Retryable
  SCHEMA_VALIDATION_ERROR: 'SCHEMA_VALIDATION_ERROR', // 400: Non-retryable Dead-Letter
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',           // 404: Non-retryable
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT'    // Timeout: Retryable
});

export class RetryPolicyFsm {
  constructor(config = {}) {
    this.maxRetries = config.maxRetries || 5;
    this.baseDelayMs = config.baseDelayMs || 1000;
    this.maxDelayMs = config.maxDelayMs || 30000;
  }

  /**
   * Classify HTTP Status code into actionable error strategy
   */
  classifyError(httpStatus, errorMessage = '') {
    if (httpStatus === 401) {
      return {
        classification: ERROR_CLASSIFICATION.AUTH_REFRESH,
        isRetryable: true,
        shouldRefreshToken: true
      };
    }

    if (httpStatus === 429) {
      return {
        classification: ERROR_CLASSIFICATION.RATE_LIMITED,
        isRetryable: true,
        shouldRefreshToken: false
      };
    }

    if (httpStatus >= 500 && httpStatus <= 504) {
      return {
        classification: ERROR_CLASSIFICATION.TRANSIENT_SERVER_ERROR,
        isRetryable: true,
        shouldRefreshToken: false
      };
    }

    if (httpStatus === 400 || (errorMessage && errorMessage.toLowerCase().includes('validation'))) {
      return {
        classification: ERROR_CLASSIFICATION.SCHEMA_VALIDATION_ERROR,
        isRetryable: false,
        shouldRefreshToken: false
      };
    }

    if (httpStatus === 404) {
      return {
        classification: ERROR_CLASSIFICATION.RESOURCE_NOT_FOUND,
        isRetryable: false,
        shouldRefreshToken: false
      };
    }

    // Default to transient network timeout
    return {
      classification: ERROR_CLASSIFICATION.NETWORK_TIMEOUT,
      isRetryable: true,
      shouldRefreshToken: false
    };
  }

  /**
   * Calculate next exponential backoff delay with jitter
   */
  calculateNextDelayMs(retryCount) {
    const exponential = Math.min(this.maxDelayMs, this.baseDelayMs * Math.pow(2, retryCount));
    const jitter = Math.floor(Math.random() * (this.baseDelayMs * 0.5));
    return exponential + jitter;
  }

  /**
   * Evaluate next Outbox state after failure
   */
  evaluateFailureTransition(item, httpStatus, errorMessage) {
    const errorMeta = this.classifyError(httpStatus, errorMessage);
    const newRetryCount = (item.retryCount || 0) + 1;

    if (!errorMeta.isRetryable || newRetryCount >= this.maxRetries) {
      return {
        nextStatus: OUTBOX_STATUS.DEAD_LETTER,
        retryCount: newRetryCount,
        nextRetryAt: null,
        errorClassification: errorMeta.classification,
        isDeadLetter: true
      };
    }

    const delayMs = this.calculateNextDelayMs(newRetryCount);
    return {
      nextStatus: OUTBOX_STATUS.RETRY,
      retryCount: newRetryCount,
      nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
      errorClassification: errorMeta.classification,
      isDeadLetter: false,
      delayMs
    };
  }
}

export const retryPolicyFsm = new RetryPolicyFsm();
export default retryPolicyFsm;
