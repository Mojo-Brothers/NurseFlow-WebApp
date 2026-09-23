/**
 * NurseFlow Enterprise HIS 2026 — Database-Backed Authentication Service
 * Connects directly to PostgreSQL 16 `auth_users`, `auth_roles`, `master_staff`
 * Standards: OWASP ASVS 4.0, Zero-Trust Architecture, JCI Information Governance
 */

import { postgresPoolService } from '../db/postgresPool.js';
import { passwordSecurity } from '../utils/passwordSecurity.js';

export const authService = {
  /**
   * Authenticates user against PostgreSQL 16 auth_users and master_staff.
   */
  authenticateUser: async (username, password) => {
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return {
        success: false,
        statusCode: 400,
        error: 'INVALID_INPUT',
        message: 'Username dan kata sandi wajib diisi.'
      };
    }

    // 1. Fetch user from PostgreSQL
    const userQuery = `
      SELECT 
        u.id, 
        u.tenant_id, 
        u.staff_id, 
        u.username, 
        u.password_hash, 
        u.is_active, 
        u.status, 
        u.failed_login_attempts
      FROM auth_users u
      WHERE LOWER(u.username) = LOWER($1) AND u.is_deleted = FALSE
      LIMIT 1;
    `;
    const userRes = await postgresPoolService.query(userQuery, [username.trim()]);

    // Anti-Enumeration Timing Mitigation:
    // Execute full scrypt verification against a pre-generated constant dummy hash
    // to normalize latency between existing and non-existent accounts.
    if (userRes.rows.length === 0) {
      passwordSecurity.verifyDummyPassword(password);
      return {
        success: false,
        statusCode: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'Kombinasi nama pengguna atau kata sandi tidak valid.'
      };
    }

    const user = userRes.rows[0];

    // 2. Account Status Guard
    if (!user.is_active || user.status !== 'ACTIVE') {
      return {
        success: false,
        statusCode: 403,
        error: 'ACCOUNT_INACTIVE',
        message: 'Akun Anda dinonaktifkan. Hubungi administrator IT rumah sakit.'
      };
    }

    // 3. Brute-Force Rate Limiting / Lockout Guard
    // When account is already locked, any password (even correct) remains rejected
    if ((user.failed_login_attempts || 0) >= 5) {
      return {
        success: false,
        statusCode: 423,
        error: 'ACCOUNT_LOCKED',
        message: 'Akun Anda terkunci sementara karena 5x percobaan gagal. Hubungi IT Helpdesk.'
      };
    }

    // 4. Constant-Time Password Verification
    const isPasswordValid = passwordSecurity.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      // Atomic increment in PostgreSQL to avoid lost updates during concurrency
      const updateRes = await postgresPoolService.query(
        `UPDATE auth_users 
         SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW() 
         WHERE id = $1 
         RETURNING failed_login_attempts`,
        [user.id]
      );
      const newAttempts = updateRes.rows[0]?.failed_login_attempts || 0;

      if (newAttempts >= 5) {
        return {
          success: false,
          statusCode: 423,
          error: 'ACCOUNT_LOCKED',
          message: 'Akun Anda terkunci sementara karena 5x percobaan gagal. Hubungi IT Helpdesk.'
        };
      }

      return {
        success: false,
        statusCode: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'Kombinasi nama pengguna atau kata sandi tidak valid.'
      };
    }

    // 5. Fetch Canonical Roles
    const rolesQuery = `
      SELECT ar.role_code, ar.role_name
      FROM auth_user_roles aur
      JOIN auth_roles ar ON aur.role_id = ar.id
      WHERE aur.user_id = $1
      ORDER BY ar.role_code ASC;
    `;
    const rolesRes = await postgresPoolService.query(rolesQuery, [user.id]);
    const rolesList = rolesRes.rows.map(r => r.role_code);
    const primaryRole = rolesList[0] || 'ROLE_NURSE';

    // 6. Fetch Associated Master Staff Profile
    let staffData = {
      fullName: user.username,
      employeeNumber: null,
      email: null,
      phone: null,
      nik: null
    };

    if (user.staff_id) {
      const staffQuery = `
        SELECT employee_number, full_name, email, phone, nik
        FROM master_staff
        WHERE id = $1
        LIMIT 1;
      `;
      const staffRes = await postgresPoolService.query(staffQuery, [user.staff_id]);
      if (staffRes.rows.length > 0) {
        const s = staffRes.rows[0];
        staffData = {
          fullName: s.full_name,
          employeeNumber: s.employee_number,
          email: s.email,
          phone: s.phone,
          nik: s.nik
        };
      }
    }

    // 7. Reset Failed Attempts and Record Successful Login ONLY when account is allowed
    await postgresPoolService.query(
      'UPDATE auth_users SET failed_login_attempts = 0, last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    return {
      success: true,
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        staffId: user.staff_id,
        username: user.username,
        role: primaryRole,
        roles: rolesList,
        ...staffData
      }
    };
  },

  /**
   * Retrieves user profile details by userId
   */
  getUserProfile: async (userId) => {
    const userQuery = `
      SELECT 
        u.id, 
        u.tenant_id, 
        u.staff_id, 
        u.username, 
        u.is_active, 
        u.status,
        u.last_login_at,
        ms.full_name,
        ms.employee_number,
        ms.email,
        ms.phone,
        ms.nik
      FROM auth_users u
      LEFT JOIN master_staff ms ON u.staff_id = ms.id
      WHERE u.id = $1 AND u.is_deleted = FALSE
      LIMIT 1;
    `;
    const userRes = await postgresPoolService.query(userQuery, [userId]);
    if (userRes.rows.length === 0) return null;

    const u = userRes.rows[0];

    const rolesQuery = `
      SELECT ar.role_code, ar.role_name
      FROM auth_user_roles aur
      JOIN auth_roles ar ON aur.role_id = ar.id
      WHERE aur.user_id = $1
      ORDER BY ar.role_code ASC;
    `;
    const rolesRes = await postgresPoolService.query(rolesQuery, [userId]);
    const rolesList = rolesRes.rows.map(r => r.role_code);

    return {
      id: u.id,
      tenantId: u.tenant_id,
      staffId: u.staff_id,
      username: u.username,
      fullName: u.full_name || u.username,
      employeeNumber: u.employee_number,
      email: u.email,
      phone: u.phone,
      nik: u.nik,
      role: rolesList[0] || 'ROLE_NURSE',
      roles: rolesList,
      lastLoginAt: u.last_login_at
    };
  }
};
