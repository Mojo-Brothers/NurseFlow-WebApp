/**
 * AuthContext — Upgraded (Step 3)
 * Menjembatani Firebase onAuthStateChanged dengan Zustand auth store.
 * Role diambil dari Custom Claims setiap kali state berubah.
 */
import React, { createContext, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../core/firebase.js';
import { useAuthStore } from '../modules/auth/auth.store.js';
import { getUserRole } from '../modules/auth/auth.service.js';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const { currentUser, role, isLoading, isLoggingIn, error, setUser, setLoading, login, logout, clearError } = useAuthStore();

  // Sinkronisasi Firebase Auth state → Zustand store
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ambil role dari Custom Claims (tidak perlu Firestore read)
        const userRole = await getUserRole(user);
        setUser(user, userRole);
      } else {
        setUser(null, null);
      }
    });
    return unsubscribe;
  }, [setUser]);

  const value = {
    currentUser,
    role,
    isLoading,
    isLoggingIn,
    error,
    loginWithGoogle: login,
    logout,
    clearError,
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
