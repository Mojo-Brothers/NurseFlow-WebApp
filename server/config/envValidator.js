/**
 * NurseFlow Enterprise HIS 2026 — Environment Configuration Validator
 * Enforces Zero-Secret-Fallback & Strict Production Security Guard
 */

const PLACEHOLDER_PATTERNS = [
  'your_local_postgres_password_here',
  'your_local_redis_password_here',
  'your_jwt_hmac_sha256_secret_key_here',
  'your_satusehat_client_secret_here',
  'your_bpjs_secret_key_here',
  'password123',
  'default-secret',
  'secret',
  'change_me'
];

export const validateEnvironment = (env = process.env) => {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  const errors = [];
  const warnings = [];

  // In test mode, allow synthetic environment for isolated unit testing
  if (isTest) {
    return { isValid: true, errors: [], warnings: [] };
  }

  // 1. Mandatory Variables for Server Operation
  const requiredVars = ['PORT'];
  if (isProduction) {
    requiredVars.push('JWT_SECRET', 'DATABASE_URL', 'POSTGRES_PASSWORD');
  }

  for (const varName of requiredVars) {
    const value = env[varName];
    if (!value || value.trim() === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // 2. Placeholder Secret Detection in Production
  if (isProduction && env.JWT_SECRET) {
    const jwtVal = env.JWT_SECRET.toLowerCase();
    if (PLACEHOLDER_PATTERNS.some(pattern => jwtVal.includes(pattern))) {
      errors.push('Insecure JWT_SECRET detected: Production environment must not use placeholder or default keys.');
    }
    if (env.JWT_SECRET.length < 32) {
      errors.push('Weak JWT_SECRET detected: Secret key must be at least 32 characters (256 bits).');
    }
  }

  return {
    isValid: errors.length === 0,
    nodeEnv,
    errors,
    warnings
  };
};

export const enforceEnvironmentGuard = (env = process.env) => {
  const result = validateEnvironment(env);
  if (!result.isValid) {
    console.error('\n🚨 [CRITICAL CONFIGURATION ERROR] Environment validation failed:');
    result.errors.forEach(err => console.error(`  ❌ ${err}`));
    console.error('\nPlease verify your environment configuration (.env.local or production secrets).\n');
    throw new Error(`Environment validation failed with ${result.errors.length} error(s).`);
  }
  return result;
};
