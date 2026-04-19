/**
 * Auth Domain — Service Layer (Step 3)
 * Abstraksi Firebase Auth + Custom Claims roll fetch.
 * Cloud Function 'syncUserRole' dipanggil setiap login untuk memastikan
 * role selalu up-to-date dari Firestore.
 */
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  getIdTokenResult,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../core/firebase.js';
import { AUDIT_ACTIONS } from '../../core/constants.js';
import { createAuditLog } from '../../core/audit/auditService.js';

const functions = getFunctions();
const syncUserRoleFn = httpsCallable(functions, 'syncUserRole');

/**
 * Login via Google OAuth + sync role dari Firestore ke Custom Claims.
 * @returns {Promise<{ user: Object, role: string, isNew: boolean }>}
 */
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // Opsional: batasi ke domain rumah sakit
  // provider.setCustomParameters({ hd: 'hospital.local' });

  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  // Panggil Cloud Function untuk refresh custom claims
  let role = 'NURSE';
  let isNew = false;
  try {
    const result = await syncUserRoleFn();
    role  = result.data.role;
    isNew = result.data.isNew;

    // Force refresh ID token agar custom claims langsung aktif
    await user.getIdToken(true);
  } catch (err) {
    // Cloud Function belum di-deploy? Fallback graceful
    console.warn('[authService] syncUserRole not available, using default role:', err.message);
  }

  // Audit log login
  await createAuditLog({
    userEmail:    user.email,
    action:       AUDIT_ACTIONS.LOGIN,
    resourceType: 'auth',
    resourceId:   user.uid,
    delta:        { role, isNew },
  });

  return { user, role, isNew };
};

/**
 * Logout + audit log.
 * @param {string} userEmail
 */
export const logoutUser = async (userEmail) => {
  await createAuditLog({
    userEmail,
    action:       AUDIT_ACTIONS.LOGOUT,
    resourceType: 'auth',
    resourceId:   userEmail,
    delta:        {},
  });
  return signOut(auth);
};

/**
 * Ambil role dari custom claims ID Token (tanpa Firestore read).
 * @param {Object} firebaseUser - Firebase User object
 * @returns {Promise<string>} - role string
 */
export const getUserRole = async (firebaseUser) => {
  if (!firebaseUser) return null;
  try {
    const tokenResult = await getIdTokenResult(firebaseUser);
    return tokenResult.claims.role || 'NURSE';
  } catch {
    return 'NURSE';
  }
};
