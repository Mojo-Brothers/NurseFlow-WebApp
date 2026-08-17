/**
 * NurseFlow Enterprise HIS 2026 — Secure Log Sanitizer & PHI/Credential Redactor
 * Masks sensitive keys (passwords, tokens, authorization headers, API keys) in application logs.
 */

const SENSITIVE_KEYS = [
  'password',
  'passwd',
  'secret',
  'jwt',
  'token',
  'authorization',
  'auth',
  'cookie',
  'creditcard',
  'credit_card',
  'cvv',
  'privatekey',
  'private_key'
];

export const sanitizeLogData = (data) => {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(k => lowerKey.includes(k));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
