import { create } from 'zustand';
import { enterpriseAuthService } from '../security/enterpriseAuth.service.js';

export const useSessionStore = create((set, get) => ({
  session: enterpriseAuthService.getCurrentSession(),
  isAuthenticated: true,

  refreshSession: () => {
    const current = enterpriseAuthService.getCurrentSession();
    set({ session: current, isAuthenticated: !!current });
  },

  switchRole: (newRole) => {
    const updated = enterpriseAuthService.switchRole(newRole);
    set({ session: updated });
  },

  logout: () => {
    enterpriseAuthService.logout();
    set({ session: null, isAuthenticated: false });
  }
}));
