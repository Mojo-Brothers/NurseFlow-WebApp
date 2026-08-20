/**
 * NurseFlow Enterprise HIS 2026 — Zero-Trust Route Guard (Gate 0A Hardened)
 * Standards: NIST SP 800-162 / Zero-Trust Architecture (ZTA) / JCI MOI
 * Enforces:
 * 1. Anonymous / Unauthenticated requests STRICTLY redirect to /login
 * 2. Unauthorized role requests STRICTLY redirect to /dashboard (or /login)
 * 3. ZERO demo fallback, ZERO default ADMIN escalation, ZERO anonymous bypass
 */
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth.js';

/**
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - Role yang diizinkan masuk. Kosong = semua authenticated user boleh.
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { currentUser, role, isLoading } = useAuth();

  // 1. Session resolution state
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
          Memuat sesi otorisasi...
        </p>
      </div>
    );
  }

  // 2. Strict Unauthenticated Barrier: Anonymous users MUST be redirected to /login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. Strict Role Barrier: If allowedRoles is specified, role must explicitly match
  if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
