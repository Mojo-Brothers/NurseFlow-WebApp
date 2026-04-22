/**
 * AuthContext — Upgraded (Step 3)
 * Menjembatani Firebase onAuthStateChanged dengan Zustand auth store.
 * Role diambil dari Custom Claims setiap kali state berubah.
 */
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../core/firebase.js';
import { useAuthStore } from '../modules/auth/auth.store.js';
import { getUserRole } from '../modules/auth/services/auth.service.js';

import { AuthContext } from './AuthContextInstance.js';


export function AuthProvider({ children }) {
  const { currentUser, role, isLoading, isLoggingIn, error, setUser, login, logout, clearError } = useAuthStore();
  const [activeFacilityId, setActiveFacilityId] = React.useState(localStorage.getItem('active_facility_id') || 'FAC-CENTRAL');

  const switchFacility = (id) => {
    setActiveFacilityId(id);
    localStorage.setItem('active_facility_id', id);
  };

  // Sinkronisasi Firebase Auth state → Zustand store
  useEffect(() => {
    const authTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('[AuthContext] Auth initialization timed out. Failsafe activated.');
        // We can force loading false here if store doesn't respond
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        // 🧪 DEV GUARD: Don't overwrite mock session with null if we have a .local user
        const isMock = currentUser?.email?.endsWith('.local');
        if (isMock && !user) return; 

        if (user) {
          const userRole = await getUserRole(user);
          setUser(user, userRole);
        } else {
          setUser(null, null);
        }
      } catch (err) {
        console.error('[AuthContext] Critical boot error:', err);
      } finally {
        clearTimeout(authTimeout);
      }
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, [setUser, isLoading]);

  const value = {
    currentUser,
    role,
    isLoading,
    isLoggingIn,
    error,
    loginWithGoogle: login,
    logout,
    clearError,
    activeFacilityId,
    switchFacility,
    // Helper role checks — dipakai di komponen
    isAdmin:      role === 'ADMIN',
    isDoctor:     role === 'DOCTOR',
    isNurse:      role === 'NURSE',
    isPharmacist: role === 'PHARMACIST',
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
