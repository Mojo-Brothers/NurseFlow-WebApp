/**
 * ProtectedRoute — Role-Aware (Step 3)
 * Melindungi route dari:
 * 1. User tidak login → redirect ke /login
 * 2. User login tapi role tidak diizinkan → redirect ke /dashboard
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { ROLE_PERMISSIONS } from '../core/constants.js';

/**
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - Role yang boleh masuk. Kosong = semua role boleh.
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { currentUser, role, isLoading } = useAuth();

  // Masih menunggu Firebase resolve auth state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: 'var(--surface)',
        flexDirection: 'column', gap: '1rem'
      }}>
        <span className="material-symbols-outlined text-primary anim-spin" style={{ fontSize: '2rem' }}>
          progress_activity
        </span>
        <p style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-body)' }}>
          Memuat sesi...
        </p>
      </div>
    );
  }

  // Belum login → ke halaman login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Role check — jika allowedRoles ditentukan dan user tidak termasuk
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
