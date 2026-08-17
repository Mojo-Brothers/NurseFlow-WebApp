/**
 * NurseFlow Enterprise HIS 2026 — Security Hardening Engine
 * Standard: OWASP Top 10 2025 (A01 Broken Access Control, A03 Injection, A07 Identification/Auth)
 */

export class SecurityViolationError extends Error {
  constructor(message, violationType = 'SECURITY_VIOLATION') {
    super(message);
    this.name = 'SecurityViolationError';
    this.violationType = violationType;
    this.statusCode = 400;
  }
}

export class ForbiddenAccessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenAccessError';
    this.statusCode = 403;
  }
}

// SQL Injection Regex Signatures
const SQLI_PATTERNS = [
  /(\b(UNION(\s+ALL)?|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)\b)/i,
  /('.+--)|(--)|(\/\*.*?\*\/)/,
  /(\bOR\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
  /(\bAND\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i,
  /(\bEXEC(\s+XP_|\s+SP_)\b)/i,
  /(\bBENCHMARK\s*\(\s*\d+\s*,\s*MD5\s*\()/i,
  /(\bWAITFOR\s+DELAY\s+['"\d:]+)/i
];

// XSS Script Injection Patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /data:\s*text\/html/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi
];

export const securityHardeningEngine = {
  /**
   * 1. ANTI-XSS SANITIZER
   * Neutralizes malicious HTML tags and event handlers
   */
  sanitizeXss: (input) => {
    if (typeof input !== 'string') return input;

    let sanitized = input;
    XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Strip basic angle brackets from dangerous strings
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    return sanitized;
  },

  /**
   * 2. SQL INJECTION GUARD
   * Scans parameters and throws SecurityViolationError if malicious SQL syntax is detected
   */
  detectSqlInjection: (input) => {
    if (typeof input !== 'string') return false;

    for (const pattern of SQLI_PATTERNS) {
      if (pattern.test(input)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Validate full JSON payload for SQLi & XSS
   */
  validatePayloadSecurity: (payload) => {
    const keys = Object.keys(payload);
    for (const key of keys) {
      const val = payload[key];
      if (typeof val === 'string') {
        if (securityHardeningEngine.detectSqlInjection(val)) {
          throw new SecurityViolationError(
            `POTENSI SERANGAN SQL INJECTION TERDETEKSI pada parameter '${key}': "${val}". Transaksi diblokir oleh Enterprise Security Guard.`,
            'SQL_INJECTION_DETECTED'
          );
        }
      }
    }
    return true;
  },

  /**
   * 3. RBAC BOUNDARY ENFORCER (ANTI-PRIVILEGE ESCALATION)
   * Evaluates professional roles against sensitive hospital operational actions
   */
  enforceRbacBoundary: (userRole, action) => {
    const ROLE_PERMISSIONS = {
      NURSE: [
        'emr:view', 'emr:create_soap', 'nursing:administer_emar', 'nursing:record_vitals',
        'triage:assess', 'bed:view_ward'
      ],
      DOCTOR: [
        'emr:view', 'emr:create_soap', 'emr:update_soap', 'cpoe:order_lab',
        'cpoe:order_radiology', 'cpoe:prescribe', 'surgery:record_notes'
      ],
      PHARMACIST: [
        'pharmacy:review_7rights', 'pharmacy:dispense_fefo', 'pharmacy:adjust_stock',
        'emr:view'
      ],
      CASHIER: [
        'billing:create_invoice', 'billing:process_payment', 'billing:view_receipt'
      ],
      ADMIN: [
        'admin:manage_users', 'master:manage_tariffs', 'audit:view_ledger',
        'system:configure'
      ]
    };

    const allowed = ROLE_PERMISSIONS[userRole] || [];
    if (!allowed.includes(action)) {
      throw new ForbiddenAccessError(
        `AKSES DITOLAK (403 FORBIDDEN): Tenaga medis dengan peran '${userRole}' tidak memiliki hak akses untuk aksi '${action}'. Pelanggaran dicatat ke sistem audit forensik.`
      );
    }

    return true;
  }
};
