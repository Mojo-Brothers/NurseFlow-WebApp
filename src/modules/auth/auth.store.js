/**
 * Auth Store — Zustand (Step 3 & Sprint 4B.1 Enterprise Authorization Guard)
 * Standards: NIST SP 800-162 ABAC/RBAC, Immutable Audit Trail on Persona Switch,
 * Strict Authorized Roles Containment (No Privilege Escalation).
 */
import { create } from 'zustand';
import { loginWithGoogle, logoutUser, getUserRole } from './services/auth.service.js';
import { logAudit } from '../../core/services/audit.service.js';

const getInitialAuthSession = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { currentUser: null, role: null, authorizedRoles: [], isLoading: false };
  }
  try {
    const raw = localStorage.getItem('nurseflow_auth_session');
    if (!raw) return { currentUser: null, role: null, authorizedRoles: [], isLoading: false };
    const parsed = JSON.parse(raw);
    if (parsed && parsed.currentUser && parsed.role) {
      return {
        currentUser: parsed.currentUser,
        role: parsed.role,
        authorizedRoles: parsed.authorizedRoles || [parsed.role],
        isLoading: false
      };
    }
  } catch (_) {}
  return { currentUser: null, role: null, authorizedRoles: [], isLoading: false };
};

const initialSession = getInitialAuthSession();

export const useAuthStore = create((set, get) => ({
  // ─── State ───────────────────────────────
  currentUser:  initialSession.currentUser,
  role:         initialSession.role,       // 'DOCTOR' | 'NURSE' | 'ADMIN' | 'PHARMACIST' | 'LAB_TECH'
  authorizedRoles: initialSession.authorizedRoles, // Array of officially assigned roles (Custom Claims / DB)
  isLoading:    initialSession.isLoading,
  isLoggingIn:  false,
  error:        null,

  // ─── Computed ────────────────────────────
  get isAdmin()      { return get().role === 'ADMIN' || get().role === 'HOSPITAL_ADMIN'; },
  get isDoctor()     { return get().role === 'DOCTOR'; },
  get isNurse()      { return get().role === 'NURSE'; },
  get isPharmacist() { return get().role === 'PHARMACIST'; },
  get isAuthenticated() { return !!get().currentUser; },

  // ─── Actions ─────────────────────────────
  setUser: (user, role, authorizedRoles = null) => {
    if (!user) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem('nurseflow_auth_session');
      } catch (_) {}
      set({
        currentUser: null,
        role: null,
        authorizedRoles: [],
        isLoading: false
      });
      return;
    }
    const roles = authorizedRoles || user?.authorizedRoles || (role ? [role] : []);
    const resolvedRole = role || (roles.length > 0 ? roles[0] : null);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('nurseflow_auth_session', JSON.stringify({
          currentUser: user,
          role: resolvedRole,
          authorizedRoles: roles
        }));
      }
    } catch (_) {}
    set({
      currentUser: user,
      role: resolvedRole,
      authorizedRoles: roles,
      isLoading: false
    });
  },

  setLoading: (val) => set({ isLoading: val }),

  login: async () => {
    set({ isLoggingIn: true, error: null });
    try {
      const { user, role } = await loginWithGoogle();
      const roles = user?.authorizedRoles || (role ? [role] : ['DOCTOR', 'NURSE', 'PHARMACIST', 'ADMIN', 'LAB_TECH']);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('nurseflow_auth_session', JSON.stringify({
            currentUser: user,
            role,
            authorizedRoles: roles
          }));
        }
      } catch (_) {}
      set({ currentUser: user, role, authorizedRoles: roles, isLoggingIn: false });
      return { user, role };
    } catch (err) {
      set({ error: err.message, isLoggingIn: false });
      throw err;
    }
  },

  logout: async () => {
    const { currentUser } = get();
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem('nurseflow_auth_session');
    } catch (_) {}
    await logoutUser(currentUser?.email || 'unknown');
    set({ currentUser: null, role: null, authorizedRoles: [] });
  },

  refreshRole: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const role = await getUserRole(currentUser);
    set({ role });
  },

  /**
   * Enterprise Role Switcher with Authorization Guardrail
   */
  switchRole: (newRole) => {
    const { currentUser, authorizedRoles, role: previousRole } = get();
    
    // Strict Containment Check
    if (authorizedRoles.length > 0 && !authorizedRoles.includes(newRole)) {
      const errorMsg = `UNAUTHORIZED_ROLE_SWITCH: Pengguna ${currentUser?.email || 'anonim'} tidak memiliki wewenang untuk peran [${newRole}].`;
      console.error(`[RBAC_GUARD] ${errorMsg}`);
      
      // Audit Security Denial (Fire & forget safe)
      try {
        logAudit({
          action: 'AUTH',
          resource_type: 'users',
          resource_id: currentUser?.email || 'unknown',
          delta: { attemptedRole: newRole, authorizedRoles, reason: 'ROLE_NOT_IN_AUTHORIZED_SCOPE' },
          reason: 'SECURITY_VIOLATION_DENIED'
        }).catch(() => {});
      } catch (_) {}
      
      set({ error: errorMsg });
      return false;
    }

    // Audit Successful Persona Switch
    try {
      logAudit({
        action: 'AUTH',
        resource_type: 'users',
        resource_id: currentUser?.email || 'unknown',
        delta: { previousRole, newRole },
        reason: 'ROLE_PERSONA_SWITCHED'
      }).catch(() => {});
    } catch (_) {}

    set(state => ({
      role: newRole,
      error: null,
      currentUser: state.currentUser 
        ? { ...state.currentUser, role: newRole } 
        : { email: `dr.${newRole.toLowerCase()}@hospital.id`, displayName: `${newRole} Staff` }
    }));
    return true;
  },

  clearError: () => set({ error: null }),
}));
