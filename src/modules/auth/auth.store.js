/**
 * Auth Store — Zustand (Step 3)
 * Menyimpan state session user + role secara global.
 */
import { create } from 'zustand';
import { loginWithGoogle, logoutUser, getUserRole } from './auth.service.js';

export const useAuthStore = create((set, get) => ({
  // ─── State ───────────────────────────────
  currentUser:  null,
  role:         null,       // 'DOCTOR' | 'NURSE' | 'ADMIN' | 'PHARMACIST'
  isLoading:    true,       // true selama onAuthStateChanged belum resolved
  isLoggingIn:  false,
  error:        null,

  // ─── Computed ────────────────────────────
  get isAdmin()      { return get().role === 'ADMIN'; },
  get isDoctor()     { return get().role === 'DOCTOR'; },
  get isNurse()      { return get().role === 'NURSE'; },
  get isPharmacist() { return get().role === 'PHARMACIST'; },
  get isAuthenticated() { return !!get().currentUser; },

  // ─── Actions ─────────────────────────────
  setUser: (user, role) => set({ currentUser: user, role, isLoading: false }),
  setLoading: (val) => set({ isLoading: val }),

  login: async () => {
    set({ isLoggingIn: true, error: null });
    try {
      const { user, role } = await loginWithGoogle();
      set({ currentUser: user, role, isLoggingIn: false });
      return { user, role };
    } catch (err) {
      set({ error: err.message, isLoggingIn: false });
      throw err;
    }
  },

  logout: async () => {
    const { currentUser } = get();
    await logoutUser(currentUser?.email || 'unknown');
    set({ currentUser: null, role: null });
  },

  refreshRole: async () => {
    const { currentUser } = get();
    if (!currentUser) return;
    const role = await getUserRole(currentUser);
    set({ role });
  },

  clearError: () => set({ error: null }),
}));
