/**
 * NurseFlow Enterprise HIS 2026 — Structured JSON Logger (Winston Compatible)
 * Standard: JCI MOI / ISO 27001 Log Management & PII Data Protection
 */

const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
  CRITICAL: 50
};

// In-Memory Log Store for testing & live audit inspection
const RECENT_STRUCTURED_LOGS = [];

export const structuredLoggerService = {
  /**
   * Core structured JSON logging method
   */
  log: (level, message, {
    service = 'clinical-core',
    userId = null,
    patientId = null,
    requestId = null,
    route = null,
    latency = null,
    metadata = {}
  } = {}) => {
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level: level.toLowerCase(),
      service,
      userId,
      patientId,
      requestId: requestId || `REQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      route,
      latency,
      message,
      metadata
    };

    RECENT_STRUCTURED_LOGS.unshift(logEntry);
    if (RECENT_STRUCTURED_LOGS.length > 500) {
      RECENT_STRUCTURED_LOGS.pop();
    }

    return logEntry;
  },

  info: (msg, ctx) => structuredLoggerService.log('INFO', msg, ctx),
  warn: (msg, ctx) => structuredLoggerService.log('WARN', msg, ctx),
  error: (msg, ctx) => structuredLoggerService.log('ERROR', msg, ctx),
  critical: (msg, ctx) => structuredLoggerService.log('CRITICAL', msg, ctx),

  getRecentLogs: () => RECENT_STRUCTURED_LOGS
};
